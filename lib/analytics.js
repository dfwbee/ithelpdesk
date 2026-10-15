import { SLA_HOURS } from "./helpers";

// Every function here is plain maths on the list of tickets,
// so the numbers on the Analytics page are easy to check and explain.

// Counts tickets for each value in a list.
// Example: countBy(tickets, "status", ["Open", "In Progress", "Resolved"])
// gives [{ label: "Open", value: 5 }, { label: "In Progress", value: 3 }, ...]
export function countBy(tickets, key, order) {
  return order.map((label) => ({
    label,
    value: tickets.filter((t) => t[key] === label).length,
  }));
}

// Hours between a ticket being created and resolved (null if not resolved)
export function resolutionHours(ticket) {
  if (ticket.status !== "Resolved" || !ticket.resolvedAt) return null;
  const hours =
    (new Date(ticket.resolvedAt) - new Date(ticket.createdAt)) / (1000 * 60 * 60);
  return hours >= 0 ? hours : null;
}

// Average hours to resolve, across resolved tickets (null if there are none)
export function averageResolutionHours(tickets) {
  const hours = tickets.map(resolutionHours).filter((h) => h !== null);
  if (hours.length === 0) return null;
  return hours.reduce((sum, h) => sum + h, 0) / hours.length;
}

// Percentage of tickets that are resolved (null if there are no tickets)
export function resolutionRatePercent(tickets) {
  if (tickets.length === 0) return null;
  const resolved = tickets.filter((t) => t.status === "Resolved").length;
  return Math.round((resolved / tickets.length) * 100);
}

// Percentage of resolved tickets that were fixed inside their time limit
export function slaMetPercent(tickets) {
  const resolved = tickets.filter((t) => resolutionHours(t) !== null);
  if (resolved.length === 0) return null;
  const met = resolved.filter(
    (t) => resolutionHours(t) <= SLA_HOURS[t.priority]
  ).length;
  return Math.round((met / resolved.length) * 100);
}

// "2h", "30h" or "3.5d" for a number of hours ("—" when there is no value)
export function formatDuration(hours) {
  if (hours === null || hours === undefined) return "—";
  if (hours < 1) return "<1h";
  if (hours < 48) return Math.round(hours) + "h";
  return (hours / 24).toFixed(1) + "d";
}

// "12 Oct" style key in the viewer's own time zone, used to group by day
function dayKey(date) {
  return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
}

// How many tickets were created on each of the last few days (oldest first)
export function createdPerDay(tickets, days = 7, now = new Date()) {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const key = dayKey(day);
    result.push({
      label: day.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
      value: tickets.filter((t) => dayKey(new Date(t.createdAt)) === key).length,
    });
  }
  return result;
}

// The oldest tickets that are still not resolved
export function needsAttention(tickets, limit = 5) {
  return tickets
    .filter((t) => t.status !== "Resolved")
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .slice(0, limit);
}