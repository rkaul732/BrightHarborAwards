import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getChatGPTUser();
  if (!identity) return Response.json({ error: "Sign in required" }, { status: 401 });
  const email = identity.email.trim().toLowerCase();
  try {
    const db = env.DB;
    if (!db) return Response.json({ error: "Recognition database is unavailable" }, { status: 503 });
    const count = await db.prepare("SELECT COUNT(*) AS n FROM staff").first<{ n: number }>();
    const me = await db.prepare("SELECT id, email, name, program, role FROM staff WHERE email = ?").bind(email).first();
    if (!me) return Response.json({ setup: true, firstUser: !count?.n, identity: { email, name: identity.displayName } });
    const [staff, shoutouts, comments, likes] = await Promise.all([
      db.prepare("SELECT id, email, name, program, role FROM staff ORDER BY name COLLATE NOCASE").all(),
      db.prepare("SELECT id, author_id AS authorId, recipient_id AS recipientId, message, points, created_at AS createdAt FROM shoutouts ORDER BY created_at DESC LIMIT 100").all(),
      db.prepare("SELECT id, shoutout_id AS shoutoutId, author_id AS authorId, message, created_at AS createdAt FROM comments ORDER BY created_at ASC").all(),
      db.prepare("SELECT id, author_id AS authorId, shoutout_id AS shoutoutId, comment_id AS commentId FROM likes").all(),
    ]);
    return Response.json({ setup: false, me, staff: staff.results, shoutouts: shoutouts.results, comments: comments.results, likes: likes.results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load recognition" }, { status: 500 });
  }
}
