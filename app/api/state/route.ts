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
    // The feed is intentionally limited to recent posts. Read the award history in
    // pages so dashboard totals and the leaderboard include every recognition.
    const totals = new Map<string, { points: number; incoming: number; outgoing: number }>();
    let offset = 0;
    const pageSize = 1000;
    while (true) {
      const { data: awards, error } = await db.from("shoutouts")
        .select("author_id,recipient_id,points")
        .order("id")
        .range(offset, offset + pageSize - 1);
      if (error) throw error;
      for (const award of awards || []) {
        const recipient = totals.get(award.recipient_id) || { points: 0, incoming: 0, outgoing: 0 };
        recipient.points += award.points;
        recipient.incoming += 1;
        totals.set(award.recipient_id, recipient);
        const author = totals.get(award.author_id) || { points: 0, incoming: 0, outgoing: 0 };
        author.outgoing += 1;
        totals.set(award.author_id, author);
      }
      if (!awards || awards.length < pageSize) break;
      offset += pageSize;
    }
    const leaderboard = (staff.data || [])
      .map(({ id, name, program }) => ({ id, name, program, points: totals.get(id)?.points || 0 }))
      .filter((person) => person.points > 0)
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
      .slice(0, 3);
    const [products, recentOrders, adminOrders] = await Promise.all([
      db.from("store_products").select("id,name,description,price_cents,image_url,source_url,options,option_price_adjustments,personalization_fields").eq("active", true).order("sort_order").order("name"),
      db.from("store_orders").select("id,product_id,product_name,selected_options,price_cents,points_spent,status,created_at")
        .eq("staff_id", me.id).order("created_at", { ascending: false }).limit(100),
      me.role === "admin" ? db.from("store_orders")
        .select("id,staff_id,product_name,selected_options,price_cents,points_spent,status,created_at")
        .order("created_at", { ascending: false }).limit(200) : Promise.resolve({ data: [], error: null }),
    ]);
    for (const result of [products, recentOrders, adminOrders]) if (result.error) throw result.error;
    let spentPoints = 0;
    let orderOffset = 0;
    while (true) {
      const { data: orders, error } = await db.from("store_orders")
        .select("points_spent").eq("staff_id", me.id).neq("status", "cancelled")
        .order("id").range(orderOffset, orderOffset + pageSize - 1);
      if (error) throw error;
      spentPoints += (orders || []).reduce((sum, order) => sum + order.points_spent, 0);
      if (!orders || orders.length < pageSize) break;
      orderOffset += pageSize;
    }
    return Response.json({
      setup: false, me, leaderboard,
      myStats: totals.get(me.id) || { points: 0, incoming: 0, outgoing: 0 },
      store: {
        products: products.data || [],
        orders: recentOrders.data || [],
        adminOrders: adminOrders.data || [],
        spentPoints,
        spendablePoints: Math.max(0, (totals.get(me.id)?.points || 0) - spentPoints),
      },
      staff: staff.data,
      shoutouts: shoutouts.data?.map((row) => ({ id: row.id, authorId: row.author_id, recipientId: row.recipient_id, message: row.message, points: row.points, createdAt: row.created_at })),
      comments: comments.data?.map((row) => ({ id: row.id, shoutoutId: row.shoutout_id, authorId: row.author_id, message: row.message, createdAt: row.created_at })),
      likes: likes.data?.map((row) => ({ id: row.id, authorId: row.author_id, shoutoutId: row.shoutout_id, commentId: row.comment_id })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load recognition" }, { status: 500 });
  }
}
