import { authenticatedUser, serverSupabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await authenticatedUser(request);
    if (!user?.email) return Response.json({ error: "Sign in required" }, { status: 401 });

    const url = new URL(request.url);
    const query = (url.searchParams.get("q") || "").trim().slice(0, 100);
    const rawOffset = Number(url.searchParams.get("offset") || 0);
    const offset = Number.isSafeInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0;
    if (!query) return Response.json({ shoutouts: [], comments: [], likes: [], hasMore: false });

    const db = serverSupabase();
    const { data: member, error: memberError } = await db.from("staff")
      .select("id").eq("email", user.email.trim().toLowerCase()).maybeSingle();
    if (memberError) throw memberError;
    if (!member) return Response.json({ error: "Your email is not in the staff directory" }, { status: 403 });
    const { data, error } = await db.rpc("search_recognition", {
      search_term: query,
      result_limit: 51,
      result_offset: offset,
    });
    if (error) throw error;
    const rows = (data || []).slice(0, 50);
    const ids = rows.map((row: { id: string }) => row.id);
    if (!ids.length) return Response.json({ shoutouts: [], comments: [], likes: [], hasMore: false });

    const [comments, shoutoutLikes] = await Promise.all([
      db.from("comments").select("id,shoutout_id,author_id,message,created_at").in("shoutout_id", ids).order("created_at"),
      db.from("likes").select("id,author_id,shoutout_id,comment_id").in("shoutout_id", ids),
    ]);
    if (comments.error) throw comments.error;
    if (shoutoutLikes.error) throw shoutoutLikes.error;
    const commentIds = (comments.data || []).map((comment) => comment.id);
    const commentLikes = commentIds.length
      ? await db.from("likes").select("id,author_id,shoutout_id,comment_id").in("comment_id", commentIds)
      : { data: [], error: null };
    if (commentLikes.error) throw commentLikes.error;

    return Response.json({
      shoutouts: rows.map((row: { id: string; author_id: string; recipient_id: string; message: string; points: number; created_at: string }) => ({
        id: row.id, authorId: row.author_id, recipientId: row.recipient_id,
        message: row.message, points: row.points, createdAt: row.created_at,
      })),
      comments: (comments.data || []).map((row) => ({ id: row.id, shoutoutId: row.shoutout_id, authorId: row.author_id, message: row.message, createdAt: row.created_at })),
      likes: [...(shoutoutLikes.data || []), ...(commentLikes.data || [])].map((row) => ({ id: row.id, authorId: row.author_id, shoutoutId: row.shoutout_id, commentId: row.comment_id })),
      hasMore: (data || []).length > 50,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to search recognition" }, { status: 500 });
  }
}
