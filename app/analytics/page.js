"use client";

import "../insights.css";
import { useState } from "react";
import { useAuth } from "../../components/AuthProvider";
import { useTickets } from "../../components/TicketsProvider";
import { useAssets } from "../../components/AssetsProvider";
import AdminOnly from "../../components/AdminOnly";
import BarChart from "../../components/BarChart";
import TicketTable from "../../components/TicketTable";
import {
  STATUSES,
  PRIORITIES,
  CATEGORIES,
  isOverdue,
} from "../../lib/helpers";
import {
  countBy,
  averageResolutionHours,
  resolutionRatePercent,
  slaMetPercent,
  createdPerDay,
  formatDuration,
  needsAttention,
} from "../../lib/analytics";

function AnalyticsView() {
  const { tickets, ready, loadError, refresh } = useTickets();
  const { assets } = useAssets();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const resolvedCount = tickets.filter((t) => t.status === "Resolved").length;
  const overdueCount = tickets.filter((t) => isOverdue(t)).length;
  const ratePercent = resolutionRatePercent(tickets);
  const slaPercent = slaMetPercent(tickets);
  const avgHours = averageResolutionHours(tickets);

  // Equipment that has had the most tickets (five at most)
  const troubleSpots = assets
    .map((a) => ({
      label: a.tag,
      value: tickets.filter((t) => t.assetId === a.id).length,
    }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const kpis = [
    {
      label: "Resolution rate",
      value: ratePercent === null ? "—" : ratePercent + "%",
      note: resolvedCount + " of " + tickets.length + " tickets resolved",
    },
    {
      label: "Average time to resolve",
      value: formatDuration(avgHours),
      note:
        resolvedCount === 0
          ? "No resolved tickets yet"
          : "Across " + resolvedCount + " resolved tickets",
    },
    {
      label: "Fixed within time limit",
      value: slaPercent === null ? "—" : slaPercent + "%",
      note: "Of resolved tickets, by priority",
    },
    {
      label: "Overdue right now",
      value: overdueCount,
      note: "Not resolved and past the limit",
    },
  ];

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">
            A summary of {tickets.length} tickets logged on the site
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {loadError && <div className="alert alert-error">{loadError}</div>}

      {!ready ? (
        <p className="empty-state">Loading tickets...</p>
      ) : (
        <>
          <div className="stats-grid">
            {kpis.map((k) => (
              <div className="stat-card" key={k.label}>
                <div className="stat-label">{k.label}</div>
                <div className="stat-value">{k.value}</div>
                <div className="stat-note">{k.note}</div>
              </div>
            ))}
          </div>

          <div className="charts-grid">
            <BarChart
              title="Tickets by status"
              data={countBy(tickets, "status", STATUSES)}
            />
            <BarChart
              title="Tickets by priority"
              data={countBy(tickets, "priority", PRIORITIES)}
            />
            <BarChart
              title="Tickets by category"
              data={countBy(tickets, "category", CATEGORIES)}
            />
            <BarChart
              title="Tickets created, last 7 days"
              data={createdPerDay(tickets, 7)}
            />
            {troubleSpots.length > 0 && (
              <BarChart
                title="Equipment with the most tickets"
                subtitle="Items that keep coming back may need replacing"
                data={troubleSpots}
              />
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Oldest unresolved tickets</h2>
            </div>
            <TicketTable
              tickets={needsAttention(tickets, 5)}
              emptyMessage="Nothing waiting. Every ticket is resolved."
            />
          </div>
        </>
      )}
    </div>
  );
}

// Only admins see the analytics
export default function AnalyticsPage() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AnalyticsView /> : <AdminOnly />;
}