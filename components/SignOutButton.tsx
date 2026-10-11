"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);
  async function signOut() {
    setLoading(true);
    await createClient().auth.signOut();
    window.location.href = "/login";
  }
  return <button className="btn ghost" onClick={signOut} disabled={loading}>{loading ? "..." : "Sign out"}</button>;
}
