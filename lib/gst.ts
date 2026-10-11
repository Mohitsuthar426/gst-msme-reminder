export type FilingFrequency = "monthly" | "quarterly";

export function addMonths(date: Date, months: number) {
  const d = new Date(date);
  const targetMonth = d.getMonth() + months;
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(targetMonth);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

/**
 * V1 reminder rule:
 * - Monthly: due on the 20th of the following month.
 * - Quarterly: due on the 22nd of the month following the quarter.
 *
 * This is intentionally a reminder rule, not a filing/tax engine. GST due dates
 * can differ by return type, notification and jurisdiction. The README calls
 * this out clearly so the MVP is not mistaken for government filing advice.
 */
export function nextDueDateFromReference(reference: Date, frequency: FilingFrequency) {
  const monthsAhead = frequency === "monthly" ? 1 : 3;
  const nextPeriod = addMonths(reference, monthsAhead);
  const dueDay = frequency === "monthly" ? 20 : 22;
  return new Date(nextPeriod.getFullYear(), nextPeriod.getMonth(), dueDay);
}

export function nextDueDateFromToday(frequency: FilingFrequency, today = new Date()) {
  const month = today.getMonth();
  const year = today.getFullYear();

  if (frequency === "monthly") {
    const thisMonthDue = new Date(year, month, 20);
    return today < thisMonthDue ? thisMonthDue : new Date(year, month + 1, 20);
  }

  // For the simple quarterly reminder, use the next 22nd of Jan/Apr/Jul/Oct.
  const quarterMonths = [0, 3, 6, 9];
  for (const m of quarterMonths) {
    const candidate = new Date(year, m, 22);
    if (candidate > today) return candidate;
  }
  return new Date(year + 1, 0, 22);
}

export function daysUntil(date: Date, today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.ceil((end.getTime() - start.getTime()) / 86400000);
}

export function badgeForDays(days: number) {
  if (days > 10) return { label: "On track", className: "badge green" };
  if (days >= 3) return { label: "Due soon", className: "badge yellow" };
  return { label: days < 0 ? "Overdue" : "Due now", className: "badge red" };
}

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dateString}T00:00:00`));
}
