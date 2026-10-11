 "use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const signup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [frequency, setFrequency] = useState<"monthly" | "quarterly">("monthly");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const supabase = createClient();

    try {
      if (signup) {
        if (!businessName || !gstNumber || !phone) {
          setError("Please complete all business fields.");
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              business_name: businessName,
              gst_number: gstNumber.toUpperCase().trim(),
              phone,
              filing_frequency: frequency,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (!data.session) {
          setMessage("Account created. Check your email to confirm, then log in.");
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand">GST <span>Reminder</span></div>
        <h1 style={{ marginTop: 22 }}>{signup ? "Create your account" : "Welcome back"}</h1>
        <p className="muted">
          {signup ? "Set up a simple GST filing deadline tracker." : "Sign in to view your filing deadline."}
        </p>

        <form className="form" onSubmit={submit}>
          {signup && <>
            <div className="field">
              <label htmlFor="businessName">Business name</label>
              <input id="businessName" value={businessName} onChange={e => setBusinessName(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="gst">GST number</label>
              <input id="gst" value={gstNumber} onChange={e => setGstNumber(e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z5" minLength={15} maxLength={15} required />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone number</label>
              <input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91..." required />
            </div>
            <div className="field">
              <label htmlFor="frequency">Filing frequency</label>
              <select id="frequency" value={frequency} onChange={e => setFrequency(e.target.value as "monthly" | "quarterly")}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
          </>}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
          </div>

          {error && <div className="error">{error}</div>}
          {message && <div className="success">{message}</div>}
          <button className="btn" disabled={loading}>{loading ? "Please wait..." : signup ? "Create account" : "Sign in"}</button>
        </form>

        <div className="auth-switch">
          {signup ? <>Already have an account? <Link href="/login">Sign in</Link></> : <>New business? <Link href="/signup">Create an account</Link></>}
        </div>
      </section>
    </main>
  );
}
