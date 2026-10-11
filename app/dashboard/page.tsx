import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { badgeForDays, daysUntil, formatDate, nextDueDateFromReference, nextDueDateFromToday, type FilingFrequency } from "@/lib/gst";
import SignOutButton from "@/components/SignOutButton";
import MarkFiledButton from "@/components/MarkFiledButton";

type Business = {
  id: string;
  name: string;
  gst_number: string;
  phone: string;
  filing_frequency: FilingFrequency;
};

type FilingRecord = {
  id: string;
  filed_date: string;
  period: string;
  status: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id,name,gst_number,phone,filing_frequency")
    .eq("user_id", user.id)
    .single<Business>();

  if (businessError || !business) {
    return <main className="page container"><div className="error">Business profile not found. Please contact the app administrator.</div></main>;
  }

  const { data: records } = await supabase
    .from("filing_records")
    .select("id,filed_date,period,status")
    .eq("business_id", business.id)
    .order("filed_date", { ascending: false })
    .limit(12);

  const filings = (records ?? []) as FilingRecord[];
  const latest = filings[0];
  const dueDate = latest
    ? nextDueDateFromReference(new Date(`${latest.filed_date}T00:00:00`), business.filing_frequency)
    : nextDueDateFromToday(business.filing_frequency);
  const days = daysUntil(dueDate);
  const badge = badgeForDays(days);

  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="brand">GST <span>Reminder</span></div>
          <div className="nav">
            <span>{business.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="page container">
        <div className="header-row">
          <div>
            <div className="kicker">Compliance dashboard</div>
            <h1>{business.name}</h1>
            <p className="muted" style={{ margin: 0 }}>{business.gst_number} · {business.filing_frequency}</p>
          </div>
          <MarkFiledButton businessId={business.id} />
        </div>

        <section className="grid">
          <div className="card hero">
            <div>
              <div className="kicker">Next GST filing due</div>
              <div className="due-date">{formatDate(dueDate.toISOString().slice(0, 10))}</div>
              <div className="countdown">
                {days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? "Due today" : `${days} days remaining`}
              </div>
              <p className="small">
                {latest ? `Based on your latest filing on ${formatDate(latest.filed_date)}.` : "No filing record yet; showing the next reminder from today."}
              </p>
            </div>
            <div>
              <span className={`${badge.className} big-badge`}>{badge.label}</span>
            </div>
          </div>

          <div className="card">
            <div className="kicker">Account</div>
            <div className="stat" style={{ marginTop: 18 }}>
              <div className="small">Filing frequency</div>
              <div className="stat-value">{business.filing_frequency === "monthly" ? "Monthly" : "Quarterly"}</div>
            </div>
            <div className="stat" style={{ marginTop: 20 }}>
              <div className="small">Records logged</div>
              <div className="stat-value">{filings.length}</div>
            </div>
            <div className="footer-note">Reminder only. No GST return is filed through this app.</div>
          </div>
        </section>

        <section className="card records">
          <h2>Past filing records</h2>
          <p className="muted" style={{ marginTop: 4 }}>Use “Mark as Filed” after you complete a filing.</p>

          {filings.length === 0 ? (
            <div className="empty">No filing records yet.</div>
          ) : (
            <div className="record-list">
              {filings.map(record => (
                <div className="record" key={record.id}>
                  <div>
                    <div className="record-title">{record.period}</div>
                    <div className="small">Filed on {formatDate(record.filed_date)}</div>
                  </div>
                  <span className="badge green">Filed</span>
                  <div className="small">{record.status}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="footer-note">
          V1 uses a simplified reminder schedule: monthly reminders use the 20th of the following month;
          quarterly reminders use the 22nd after the quarter. Verify the applicable GST return due date
          before relying on the reminder.
        </p>
      </main>
    </>
  );
}
