"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { browserSupabase } from "../lib/supabase";
import { isBrightHarborEmail } from "../lib/email";
import { EMPLOYEE_TYPES, type EmployeeType, validPrograms } from "../lib/programs";
import ProgramPicker from "./program-picker";

type Mode = "signIn" | "create" | "link";

export default function LoginForm() {
  const supabase = useMemo(browserSupabase, []);
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [employeeType, setEmployeeType] = useState<EmployeeType | "">("");
  const [programs, setPrograms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("error")) setError("That confirmation or sign-in link is invalid or has expired. Request a new one.");
  }, []);

  function changeMode(next: Mode) {
    setMode(next);
    setPassword("");
    setConfirmPassword("");
    setSent(false);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setError("");
    setSent(false);
    if (mode === "create" && (password.length < 12 || password !== confirmPassword)) {
      setError(password.length < 12 ? "Use at least 12 characters for your password." : "The passwords do not match.");
      return;
    }
    if (mode === "create" && (!fullName.trim() || !employeeType || !validPrograms(programs))) {
      setError("Enter your full name, select one employee type, and choose at least one program.");
      return;
    }
    setLoading(true);
    try {
      const address = email.trim().toLowerCase();
      if (!isBrightHarborEmail(address)) {
        setError("Use your @brightharbor.org work email address.");
        return;
      }
      if (mode === "signIn") {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email: address, password });
        if (authError) setError(authError.message);
        else {
          if (data.user.user_metadata?.must_change_password === true) {
            window.location.replace("/?set-password=1");
            return;
          }
          if (data.user.user_metadata?.password_created !== true) {
            const { error: updateError } = await supabase.auth.updateUser({ data: { password_created: true } });
            if (updateError) throw updateError;
          }
          window.location.replace("/");
        }
      } else if (mode === "create") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: address,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: {
            password_created: true, full_name: fullName.trim(), employee_type: employeeType, programs,
          } },
        });
        if (authError) setError(authError.message);
        else if (data.session) {
          await supabase.auth.signOut();
          setError("Email confirmation is not enabled. Ask an administrator to check Supabase Auth settings.");
        } else {
          setPassword("");
          setConfirmPassword("");
          setSent(true);
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithOtp({
          email: address,
          options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (authError) setError(authError.message);
        else setSent(true);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to reach the sign-in service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!supabase) return <div className="login-feedback error">Supabase has not been configured for this deployment yet.</div>;
  return <form className="login-form" onSubmit={submit}>
    <div className="login-modes"><button type="button" className={mode === "signIn" ? "active" : ""} onClick={() => changeMode("signIn")}>Sign in</button><button type="button" className={mode === "create" ? "active" : ""} onClick={() => changeMode("create")}>First time? Create account</button></div>
    <label htmlFor="login-email">Work email</label><input id="login-email" type="email" autoComplete="email" required placeholder="you@brightharbor.org" value={email} onChange={(event) => setEmail(event.target.value)} /><div className="email-domain-hint">Only @brightharbor.org email addresses are accepted.</div>
    {mode === "create" && <><label htmlFor="signup-name">Full name</label><input id="signup-name" type="text" autoComplete="name" required maxLength={80} value={fullName} onChange={(event) => setFullName(event.target.value)} />
      <label htmlFor="signup-type">Employee Type</label><select id="signup-type" required value={employeeType} onChange={(event) => setEmployeeType(event.target.value as EmployeeType)}><option value="">Select one employee type</option>{EMPLOYEE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select>
      <ProgramPicker value={programs} onChange={setPrograms} />
      <p className="signup-approval-note">After confirming your email, an administrator will review your selections before your profile appears in the directory.</p>
    </>}
    {mode !== "link" && <><label htmlFor="login-password">{mode === "create" ? "Create password" : "Password"}</label><input id="login-password" type="password" autoComplete={mode === "create" ? "new-password" : "current-password"} minLength={mode === "create" ? 12 : undefined} required value={password} onChange={(event) => setPassword(event.target.value)} /></>}
    {mode === "create" && <><label htmlFor="login-confirm">Confirm password</label><input id="login-confirm" type="password" autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></>}
    <button disabled={loading} className="button button-primary login-button" type="submit">{loading ? "Please wait..." : mode === "create" ? "Create password and email confirmation" : mode === "link" ? "Email me a sign-in link" : "Sign in"} <span>→</span></button>
    {sent && <div className="login-feedback" role="status">{mode === "create" ? "Check your inbox for an account confirmation email. Open the link before signing in." : "If this account exists, check your inbox for a sign-in link."}</div>}
    {error && <div className="login-feedback error" role="alert">{error}</div>}
    <button type="button" className="login-link" onClick={() => changeMode(mode === "link" ? "signIn" : "link")}>{mode === "link" ? "Use a password instead" : "Need a sign-in link?"}</button>
  </form>;
}
