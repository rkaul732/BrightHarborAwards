"use client";

import { useMemo, useState, type FormEvent } from "react";
import { browserSupabase } from "../lib/supabase";

export default function PasswordSetup({ email, onComplete, onSignOut }: { email: string; onComplete: () => void; onSignOut: () => void }) {
  const supabase = useMemo(browserSupabase, []);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    if (password.length < 12 || password !== confirmation) {
      setError(password.length < 12 ? "Use at least 12 characters for your password." : "The passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.updateUser({ password, data: { password_created: true } });
    setLoading(false);
    if (authError) setError(authError.message);
    else { setPassword(""); setConfirmation(""); onComplete(); }
  }

  return <main className="login-page">
    <div className="login-header"><img src="/bhh-logo.png" alt="Bright Harbor Healthcare" className="login-logo" /></div>
    <section className="login-panel"><div className="eyebrow">FINISH SETTING UP YOUR ACCOUNT</div><h1>Create your<br/><em>password.</em></h1><p>Signed in as <strong>{email}</strong>. Choose a password for future sign-ins.</p>
      <form className="login-form" onSubmit={submit}>
        <label htmlFor="setup-password">New password</label><input id="setup-password" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} />
        <label htmlFor="setup-confirm">Confirm password</label><input id="setup-confirm" type="password" autoComplete="new-password" minLength={12} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
        <button disabled={loading} className="button button-primary login-button" type="submit">{loading ? "Saving..." : "Save password"} <span>→</span></button>
        {error && <div className="login-feedback error" role="alert">{error}</div>}
      </form><button type="button" className="login-link" onClick={onSignOut}>Use another account</button></section>
    <div className="login-decoration"><span>✳</span><span>★</span><span>✦</span></div>
  </main>;
}
