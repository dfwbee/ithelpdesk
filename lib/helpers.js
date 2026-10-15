// Shared lists used by the form, the filters and the detail page
export const STATUSES = ["Open", "In Progress", "Resolved"];
export const PRIORITIES = ["Low", "Medium", "High"];
export const CATEGORIES = ["Finance", "HR", "Marketing", "Sales", "Front Counter", "Marketing", "Sales", "Advertising", "Field", "Facility", "Other"];

// Hours allowed before a ticket counts as overdue
export const SLA_HOURS = {
  High: 4,
  Medium: 24,
  Low: 72,
};

export function ageInHours(createdAt) {
  return (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
}

export function isOverdue(ticket) {
  if (ticket.status === "Resolved") return false;
  return ageInHours(ticket.createdAt) > SLA_HOURS[ticket.priority];
}

export function formatAge(createdAt) {
  const hours = Math.floor(ageInHours(createdAt));
  if (hours < 1) return "Just now";
  if (hours < 24) return hours + "h ago";
  return Math.floor(hours / 24) + "d ago";
}

export function statusClass(status) {
  return "badge badge-" + status.toLowerCase().replace(" ", "-");
}

export function priorityClass(priority) {
  return "badge badge-" + priority.toLowerCase();
}

// ---------- Phase 3 additions ----------

// When the ticket is due = created time + hours allowed for its priority
export function dueDate(ticket) {
  const created = new Date(ticket.createdAt).getTime();
  return new Date(created + SLA_HOURS[ticket.priority] * 60 * 60 * 1000);
}

function formatHours(hours) {
  if (hours < 1) return "less than 1h";
  if (hours < 48) return Math.floor(hours) + "h";
  return Math.floor(hours / 24) + "d";
}

// Text such as "Due in 3h" or "Overdue by 26h"
export function slaLabel(ticket) {
  if (ticket.status === "Resolved") return "Resolved";
  const hoursLeft = (dueDate(ticket).getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursLeft < 0) return "Overdue by " + formatHours(-hoursLeft);
  return "Due in " + formatHours(hoursLeft);
}

export function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// The "nothing selected" state of the search and filter bar
export const emptyFilters = {
  search: "",
  status: "All",
  priority: "All",
  category: "All",
  overdueOnly: false,
};

// Keeps only the tickets that match every active filter
export function filterTickets(tickets, filters) {
  const query = filters.search.trim().toLowerCase();

  return tickets.filter((t) => {
    if (filters.status !== "All" && t.status !== filters.status) return false;
    if (filters.priority !== "All" && t.priority !== filters.priority)
      return false;
    if (filters.category !== "All" && t.category !== filters.category)
      return false;
    if (filters.overdueOnly && !isOverdue(t)) return false;

    if (query) {
      const searchable = [t.id, t.title, t.description, t.requester, t.category]
        .join(" ")
        .toLowerCase();
      if (!searchable.includes(query)) return false;
    }

    return true;
  });
}

// ---------- Phase 7: equipment tracking ----------
export const ASSET_TYPES = ["Laptop", "Desktop", "Monitor", "Phone", "Printer", "Other"];
export const ASSET_STATUSES = ["In stock", "Assigned", "In repair", "Retired"];
export const MAINTENANCE_KINDS = ["Repair", "Service", "Upgrade", "Inspection"];
export const DEPARTMENTS = [
  "Finance",
  "HR",
  "Operations",
  "Sales",
  "Marketing",
  "IT",
  "Customer Care",
  "Other",
];

// "badge badge-asset-in-repair" and so on
export function assetStatusClass(status) {
  return "badge badge-asset-" + status.toLowerCase().replace(" ", "-");
}

// Dates from the database look like "2026-10-14" (no time). This shows them as "14 Oct 2026".
export function formatDate(value) {
  if (!value) return "Not recorded";
  const date = value.length === 10 ? new Date(value + "T00:00:00") : new Date(value);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Whole days from today until a date (negative when it is in the past)
export function daysUntil(value) {
  const end = new Date(value + "T00:00:00").getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((end - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Warranty status for badges: { label, tone } where tone is none, ok, soon or expired
export function warrantyInfo(warrantyEnd) {
  if (!warrantyEnd) return { label: "Not recorded", tone: "none" };
  const days = daysUntil(warrantyEnd);
  if (days < 0) return { label: "Expired", tone: "expired" };
  if (days <= 60) return { label: "Ends in " + days + "d", tone: "soon" };
  return { label: "Until " + formatDate(warrantyEnd), tone: "ok" };
}

// "LAP-0001 · Dell Latitude 5440"
export function assetLabel(asset) {
  return asset.tag + " · " + asset.model;
}