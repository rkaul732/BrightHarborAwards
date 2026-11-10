import { redirect } from "next/navigation";
import { createPageSupabase } from "../lib/server-auth";
import RecognitionGate from "./recognition-gate";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createPageSupabase();
  if (!supabase || !(await supabase.auth.getClaims()).data?.claims) redirect("/login");
  return <RecognitionGate protectedRoute />;
}
