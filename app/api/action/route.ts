import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

export const dynamic = "force-dynamic";
const validRoles = ["employee", "supervisor", "director", "admin"];
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const json = (error: string, status = 400) => Response.json({ error }, { status });
type Person = { id: string; email: string; name: string; program: string; role: string };

function pointsFor(author: Person, recipient: Person) {
  if (recipient.role !== "employee") return 0;
  const outside = author.program.toLowerCase() !== recipient.program.toLowerCase();
  if (author.role === "employee") return outside ? 3 : 1;
  if (author.role === "supervisor") return outside ? 3 : 2;
  return outside ? 4 : 3;
}

export async function POST(request: Request) {
  const identity = await getChatGPTUser();
  if (!identity) return json("Sign in required", 401);
  const db = env.DB;
  if (!db) return json("Recognition database is unavailable", 503);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json("Invalid request"); }
  const email = identity.email.trim().toLowerCase();
  const me = await db.prepare("SELECT id, email, name, program, role FROM staff WHERE email = ?").bind(email).first<Person>();
  const action = body.action;
  try {
    if (action === "setup") {
      if (me) return json("Profile already exists", 409);
      const existing = await db.prepare("SELECT COUNT(*) AS n FROM staff").first<{ n: number }>();
      if (existing?.n) return json("Ask your administrator to add your email to the directory", 403);
      const name = clean(body.name, 80), program = clean(body.program, 80);
      if (!name || !program) return json("Name and program are required");
      await db.prepare("INSERT INTO staff (id, email, name, program, role) VALUES (?, ?, ?, ?, 'admin')").bind(crypto.randomUUID(), email, name, program).run();
    } else {
      if (!me) return json("Your email is not in the staff directory", 403);
      if (action === "addStaff") {
        if (me.role !== "admin") return json("Admin access required", 403);
        const name = clean(body.name, 80), staffEmail = clean(body.email, 160).toLowerCase(), program = clean(body.program, 80), role = clean(body.role, 20);
        if (!name || !program || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staffEmail) || !validRoles.includes(role)) return json("Enter a valid name, email, program, and role");
        await db.prepare("INSERT INTO staff (id, email, name, program, role) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), staffEmail, name, program, role).run();
      } else if (action === "shoutout") {
        const recipientId = clean(body.recipientId, 100), message = clean(body.message, 1200);
        if (!recipientId || !message) return json("Select a colleague and write a message");
        if (recipientId === me.id) return json("Choose someone other than yourself");
        const recipient = await db.prepare("SELECT id, email, name, program, role FROM staff WHERE id = ?").bind(recipientId).first<Person>();
        if (!recipient) return json("Recipient not found", 404);
        await db.prepare("INSERT INTO shoutouts (id, author_id, recipient_id, message, points) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), me.id, recipient.id, message, pointsFor(me, recipient)).run();
      } else if (action === "comment") {
        const shoutoutId = clean(body.shoutoutId, 100), message = clean(body.message, 500);
        if (!message) return json("Write a comment");
        const exists = await db.prepare("SELECT id FROM shoutouts WHERE id = ?").bind(shoutoutId).first();
        if (!exists) return json("Shout-out not found", 404);
        await db.prepare("INSERT INTO comments (id, shoutout_id, author_id, message) VALUES (?, ?, ?, ?)").bind(crypto.randomUUID(), shoutoutId, me.id, message).run();
      } else if (action === "like") {
        const kind = body.kind === "comment" ? "comment" : "shoutout";
        const targetId = clean(body.targetId, 100);
        const table = kind === "comment" ? "comments" : "shoutouts";
        const column = kind === "comment" ? "comment_id" : "shoutout_id";
        const exists = await db.prepare(`SELECT id FROM ${table} WHERE id = ?`).bind(targetId).first();
        if (!exists) return json("Item not found", 404);
        const previous = await db.prepare(`SELECT id FROM likes WHERE author_id = ? AND ${column} = ?`).bind(me.id, targetId).first<{ id: string }>();
        if (previous) await db.prepare("DELETE FROM likes WHERE id = ?").bind(previous.id).run();
        else await db.prepare(`INSERT INTO likes (id, author_id, ${column}) VALUES (?, ?, ?)`).bind(crypto.randomUUID(), me.id, targetId).run();
      } else return json("Unknown action");
    }
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save";
    if (message.includes("UNIQUE constraint failed")) return json("That email is already in the directory", 409);
    return json(message, 500);
  }
}
