import { authenticatedUser, serverSupabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await authenticatedUser(request);
    if (!user?.email) return Response.json({ error: "Sign in required" }, { status: 401 });
    const db = serverSupabase();
    const email = user.email.trim().toLowerCase();
    const { data: me, error: memberError } = await db.from("staff").select("id,email,name,program,role").eq("email", email).maybeSingle();
    if (memberError) throw memberError;
    if (!me) {
      const { count, error: countError } = await db.from("staff").select("id", { count: "exact", head: true });
      if (countError) throw countError;
      return Response.json({ setup: true, firstUser: count === 0 && email === process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase(), identity: { email, name: user.user_metadata?.full_name || email } });
    }
    const [staff, shoutouts, comments, likes] = await Promise.all([
      db.from("staff").select("id,email,name,program,role").order("name"),
      db.from("shoutouts").select("id,author_id,recipient_id,message,points,created_at").order("created_at", { ascending: false }).limit(100),
      db.from("comments").select("id,shoutout_id,author_id,message,created_at").order("created_at"),
      db.from("likes").select("id,author_id,shoutout_id,comment_id"),
    ]);
    for (const result of [staff, shoutouts, comments, likes]) if (result.error) throw result.error;
    return Response.json({
      setup: false, me,
      staff: staff.data,
      shoutouts: shoutouts.data?.map((row) => ({ id: row.id, authorId: row.author_id, recipientId: row.recipient_id, message: row.message, points: row.points, createdAt: row.created_at })),
      comments: comments.data?.map((row) => ({ id: row.id, shoutoutId: row.shoutout_id, authorId: row.author_id, message: row.message, createdAt: row.created_at })),
      likes: likes.data?.map((row) => ({ id: row.id, authorId: row.author_id, shoutoutId: row.shoutout_id, commentId: row.comment_id })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load recognition" }, { status: 500 });
  }
}
