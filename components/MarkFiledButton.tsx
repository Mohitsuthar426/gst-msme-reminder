"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function MarkFiledButton({ businessId }: { businessId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function markFiled() {
    setLoading(true);
    setError("");
    const supabase = createClient();

    const { error: insertError } = await supabase.from("filing_records").insert({
      business_id: businessId,
      filed_date: new Date().toISOString().slice(0, 10),
      period: new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date()),
      status: "filed",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    window.location.reload();
  }

  return (
    <div>
      <button className="btn" onClick={markFiled} disabled={loading}>
        {loading ? "Saving..." : "Mark as Filed"}
      </button>
      {error && <div className="error" style={{ marginTop: 10 }}>{error}</div>}
    </div>
  );
}
