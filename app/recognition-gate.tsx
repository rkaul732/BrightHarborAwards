"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { browserSupabase } from "../lib/supabase";
import RecognitionApp from "./recognition-app";

export default function RecognitionGate({ protectedRoute = false }: { protectedRoute?: boolean }) {
  const supabase = useMemo(browserSupabase, []);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("error")) setError("That sign-in link is invalid or has expired. Request a new one.");
  }, []);
  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); }).catch(() => setReady(true));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, [supabase]);
  useEffect(() => {
    if (!ready) return;
    if (session && !protectedRoute) window.location.replace("/");
    if (!session && protectedRoute) window.location.replace("/login");
  }, [ready, session, protectedRoute]);
  if (!ready) return <div className="loading"><div className="brandmark">✦</div><p>Opening Bright Harbor...</p></div>;
  if (session && protectedRoute) return <RecognitionApp key={session.user.id} identity={{ email: session.user.email || "", name: session.user.user_metadata?.full_name || session.user.email || "" }} accessToken={session.access_token} onSignOut={async () => { await supabase?.auth.signOut(); window.location.replace("/login"); }} />;
  if (session || protectedRoute) return <div className="loading"><div className="brandmark">✦</div><p>Opening Bright Harbor...</p></div>;
  return <main className="login-page">
    <div className="login-header"><img src="/bhh-logo.png" alt="Bright Harbor Healthcare" className="login-logo" /></div>
    <section className="login-panel"><div className="eyebrow">A LITTLE APPRECIATION GOES A LONG WAY</div><h1>Great work deserves<br/><em>to be seen.</em></h1><p>Celebrate the people who make every day brighter. Share a shout-out, lift up a teammate, and watch appreciation spread.</p>
      {supabase ? <form className="login-form" onSubmit={async (event) => { event.preventDefault(); setError(""); setLoading(true); const { error: authError } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/auth/callback` } }); setLoading(false); if (authError) setError(authError.message); else setSent(true); }}><label htmlFor="login-email">Work email</label><input id="login-email" type="email" required placeholder="you@brightharbor.org" value={email} onChange={(event) => setEmail(event.target.value)}/><button disabled={loading} className="button button-primary login-button" type="submit">{loading ? "Sending..." : "Email me a sign-in link"} <span>→</span></button>{sent && <div className="login-feedback">Check your inbox for a sign-in link.</div>}{error && <div className="login-feedback error">{error}</div>}</form> : <div className="login-feedback error">Supabase has not been configured for this deployment yet.</div>}
      <div className="login-note">A private space for the Bright Harbor team</div></section>
    <div className="login-decoration"><span>✳</span><span>★</span><span>✦</span><div className="recognition-sample"><div className="tiny-avatar">BH</div><div><strong>A teammate recognized a colleague</strong><p>“Your kindness made all the difference today.”</p><small>✦ Recognition points earned</small></div></div></div>
    <footer className="login-footer">BRIGHT HARBOR RECOGNITION <span>Every contribution counts.</span></footer>
  </main>;
}
