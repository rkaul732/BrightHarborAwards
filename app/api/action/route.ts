import { authenticatedUser, serverSupabase } from "../../../lib/supabase";
import { pointsFor } from "../../../lib/points";

export const dynamic = "force-dynamic";
const roles = ["employee", "supervisor", "director", "admin"];
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const fail = (error: string, status = 400) => Response.json({ error }, { status });
type Person = { id: string; email: string; name: string; program: string; role: string };
const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);

async function notifyRecipient(recipient: Person, author: Person, message: string, points: number) {
  const key = process.env.RESEND_API_KEY, from = process.env.RESEND_FROM;
  if (!key || !from) return;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [recipient.email], subject: `${author.name} gave you a Bright Harbor shout-out!`, html: `<div style="font-family:Arial,sans-serif;max-width:520px;color:#1c2f43"><h1 style="color:#346990">You've been recognized!</h1><p><strong>${escapeHtml(author.name)}</strong> shared a shout-out for you:</p><blockquote style="background:#eef5fb;padding:18px;border-left:4px solid #4ba0d8">${escapeHtml(message).replace(/\n/g, "<br>")}</blockquote><p>${points ? `You earned <strong>${points} recognition point${points === 1 ? "" : "s"}</strong>.` : "Your work is appreciated."}</p><p>Bright Harbor Healthcare Recognition</p></div>` }),
  });
  if (!response.ok) throw new Error(`Resend returned ${response.status}`);
}

export async function POST(request: Request) {
  try {
    const user = await authenticatedUser(request);
    if (!user?.email) return fail("Sign in required", 401);
    const db = serverSupabase();
    const body = await request.json() as Record<string, unknown>;
    const email = user.email.trim().toLowerCase();
    const { data: me, error: memberError } = await db.from("staff").select("id,email,name,program,role").eq("email", email).maybeSingle();
    if (memberError) throw memberError;
    if (body.action === "setup") {
      if (me) return fail("Profile already exists", 409);
      if (email !== process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase()) return fail("Ask your administrator to add your email to the directory", 403);
      const { count, error: countError } = await db.from("staff").select("id", { count: "exact", head: true });
      if (countError) throw countError;
      if (count !== 0) return fail("Administrator profile already exists", 409);
      const name = clean(body.name, 80), program = clean(body.program, 80);
      if (!name || !program) return fail("Name and program are required");
      const { error } = await db.from("staff").insert({ email, name, program, role: "admin" });
      if (error) throw error;
    } else {
      if (!me) return fail("Your email is not in the staff directory", 403);
      if (body.action === "addStaff") {
        if (me.role !== "admin") return fail("Admin access required", 403);
        const name = clean(body.name, 80), staffEmail = clean(body.email, 160).toLowerCase(), program = clean(body.program, 80), role = clean(body.role, 20);
        if (!name || !program || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staffEmail) || !roles.includes(role)) return fail("Enter a valid name, email, program, and role");
        const { error } = await db.from("staff").insert({ name, email: staffEmail, program, role });
        if (error) throw error;
      } else if (body.action === "shoutout") {
        const recipientId = clean(body.recipientId, 100), message = clean(body.message, 1200);
        if (!recipientId || !message) return fail("Select a colleague and write a message");
        if (recipientId === me.id) return fail("Choose someone other than yourself");
        const { data: recipient, error: recipientError } = await db.from("staff").select("id,email,name,program,role").eq("id", recipientId).maybeSingle();
        if (recipientError) throw recipientError;
        if (!recipient) return fail("Recipient not found", 404);
        const points = pointsFor(me, recipient);
        const { error } = await db.from("shoutouts").insert({ author_id: me.id, recipient_id: recipient.id, message, points });
        if (error) throw error;
        try { await notifyRecipient(recipient, me, message, points); } catch (notifyError) { console.error("Recognition email failed", notifyError); }
      } else if (body.action === "comment") {
        const shoutoutId = clean(body.shoutoutId, 100), message = clean(body.message, 500);
        if (!message) return fail("Write a comment");
        const { data: post } = await db.from("shoutouts").select("id").eq("id", shoutoutId).maybeSingle();
        if (!post) return fail("Shout-out not found", 404);
        const { error } = await db.from("comments").insert({ shoutout_id: shoutoutId, author_id: me.id, message });
        if (error) throw error;
      } else if (body.action === "like") {
        const kind = body.kind === "comment" ? "comment" : "shoutout";
        const targetId = clean(body.targetId, 100);
        const table = kind === "comment" ? "comments" : "shoutouts";
        const column = kind === "comment" ? "comment_id" : "shoutout_id";
        const { data: target } = await db.from(table).select("id").eq("id", targetId).maybeSingle();
        if (!target) return fail("Item not found", 404);
        const { data: previous } = await db.from("likes").select("id").eq("author_id", me.id).eq(column, targetId).maybeSingle();
        const result = previous ? await db.from("likes").delete().eq("id", previous.id) : await db.from("likes").insert({ author_id: me.id, [column]: targetId });
        if (result.error) throw result.error;
      } else return fail("Unknown action");
    }
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save";
    if (message.includes("duplicate key")) return fail("That email is already in the directory", 409);
    return fail(message, 500);
  }
}
