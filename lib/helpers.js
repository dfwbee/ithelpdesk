// Shared lists used by the form, the filters and the detail page
export const STATUSES = ["Open", "In Progress", "Resolved"];
export const PRIORITIES = ["Low", "Medium", "High"];
export const CATEGORIES = ["Hardware", "Software", "Network", "Access", "Other"];

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
  department: "All",
  assigned: "All",
  overdueOnly: false,
};

// Keeps only the tickets that match every active filter
export function filterTickets(tickets, filters, userId) {
  const query = filters.search.trim().toLowerCase();

  return tickets.filter((t) => {
    if (filters.status !== "All" && t.status !== filters.status) return false;
    if (filters.priority !== "All" && t.priority !== filters.priority)
      return false;
    if (filters.category !== "All" && t.category !== filters.category)
      return false;
    if (filters.department !== "All" && departmentName(t.department) !== filters.department)
      return false;
    if (filters.assigned === "Mine" && t.assignedTo !== userId) return false;
    if (filters.assigned === "Unassigned" && t.assignedTo) return false;
    if (filters.overdueOnly && !isOverdue(t)) return false;

    if (query) {
      const searchable = [
        t.id,
        t.title,
        t.description,
        t.requester,
        t.category,
        t.department,
        t.assignedName,
      ]
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

// ---------- Phase 8: teamwork features ----------

// Tickets from before Phase 8 have no department; they are grouped as "Unspecified"
export const NO_DEPARTMENT = "Unspecified";
export function departmentName(value) {
  return value ? value : NO_DEPARTMENT;
}

// "5 min ago", "3h ago", "2d ago", or a date for anything older than a week
export function timeAgo(isoString) {
  const minutes = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return minutes + " min ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h ago";
  const days = Math.floor(hours / 24);
  if (days < 8) return days + "d ago";
  return formatDate(isoString);
}

// "Tobi Tech (Technician)" or just "Tobi Tech"
export function staffLabel(name, title) {
  return title ? name + " (" + title + ")" : name;
}

// Rules for ticket attachments (the database enforces the same limits)
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
];

export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}