"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { browserSupabase } from "../lib/supabase";
import RecognitionApp from "./recognition-app";
import LoginForm from "./login-form";
import PasswordSetup from "./password-setup";

export default function RecognitionGate({ protectedRoute = false }: { protectedRoute?: boolean }) {
  const supabase = useMemo(browserSupabase, []);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [passwordComplete, setPasswordComplete] = useState(false);
  const [passwordLink, setPasswordLink] = useState<boolean | null>(null);
  const signingOut = useRef(false);
  useEffect(() => {
    setPasswordLink(new URLSearchParams(window.location.search).get("set-password") === "1");
  }, []);
  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); }).catch(() => setReady(true));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, [supabase]);
  useEffect(() => {
    if (!ready || passwordLink === null) return;
    if (session && !protectedRoute) window.location.replace("/");
    if (!session && protectedRoute) window.location.replace("/login");
    if (session && protectedRoute && !passwordLink && session.user.user_metadata?.must_change_password !== true && session.user.user_metadata?.password_created !== true && !signingOut.current) {
      signingOut.current = true;
      supabase?.auth.signOut().finally(() => window.location.replace("/login"));
    }
  }, [ready, session, protectedRoute, passwordLink, supabase]);
  if (!ready || passwordLink === null) return <div className="loading"><div className="brandmark">✦</div><p>Opening Bright Harbor...</p></div>;
  if (session && protectedRoute && (passwordLink || session.user.user_metadata?.must_change_password === true)) return <PasswordSetup email={session.user.email || ""} temporary={session.user.user_metadata?.must_change_password === true} onComplete={() => { window.history.replaceState(null, "", "/"); setPasswordComplete(true); setPasswordLink(false); }} onSignOut={async () => { await supabase?.auth.signOut(); window.location.replace("/login"); }} />;
  if (session && protectedRoute && (passwordComplete || session.user.user_metadata?.password_created === true)) return <RecognitionApp key={session.user.id} identity={{ email: session.user.email || "", name: session.user.user_metadata?.full_name || session.user.email || "" }} accessToken={session.access_token} onSignOut={async () => { await supabase?.auth.signOut(); window.location.replace("/login"); }} />;
  if (session || protectedRoute) return <div className="loading"><div className="brandmark">✦</div><p>Opening Bright Harbor...</p></div>;
  return <main className="login-page">
    <header className="login-header"><img src="/bhh-logo.png" alt="Bright Harbor Healthcare" className="login-logo" /><span>EMPLOYEE RECOGNITION</span></header>
    <div className="login-main"><section className="login-panel"><div className="eyebrow">A CULTURE OF APPRECIATION</div><h1>Recognition<br/><em>that matters.</em></h1><p>Celebrate the colleagues who make Bright Harbor stronger. Share meaningful recognition, see team achievements, and turn your points into rewards.</p>
      <div className="login-feature"><div className="login-feature-line"/><span>01</span><div><strong>Make excellent work visible.</strong><small>A private space for every Bright Harbor team member.</small></div></div>
    </section><section className="login-form-shell" aria-label="Bright Harbor account"><div className="login-form-heading"><span className="eyebrow">BRIGHT HARBOR AWARDS</span><h2>Your recognition space</h2><p>Use your work email to access the team platform.</p></div><LoginForm /><div className="login-note">Secure access for Bright Harbor staff</div></section></div>
    <footer className="login-footer"><span>BRIGHT HARBOR HEALTHCARE</span><span>Recognizing the people behind better care.</span></footer>
  </main>;
}
