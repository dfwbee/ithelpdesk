"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { useTickets } from "../../components/TicketsProvider";
import TicketForm from "../../components/TicketForm";
import TicketTable from "../../components/TicketTable";
import TicketFilters from "../../components/TicketFilters";
import { useAssets } from "../../components/AssetsProvider";
import AdminOnly from "../../components/AdminOnly";
import { emptyFilters, filterTickets, assetLabel } from "../../lib/helpers";

function AdminTickets() {
  const { tickets, ready, loadError, refresh, updateTicket } = useTickets();
  const { user } = useAuth();
  const { assets } = useAssets();
  // The dashboard's "New ticket" button links here with ?new=1 to open the form
  const params = useSearchParams();
  const [showForm, setShowForm] = useState(params.get("new") === "1");
  const [message, setMessage] = useState(null);
  // The dashboard links here with ?assigned=mine or ?assigned=unassigned
  const assignedParam = params.get("assigned");
  const [filters, setFilters] = useState(
    assignedParam === "mine"
      ? { ...emptyFilters, assigned: "Mine" }
      : assignedParam === "unassigned"
        ? { ...emptyFilters, assigned: "Unassigned" }
        : emptyFilters
  );
  const [refreshing, setRefreshing] = useState(false);

  function handleCreated(ticket) {
    setShowForm(false);
    setFilters(emptyFilters);
    setMessage({ type: "success", text: "Ticket " + ticket.id + " created." });
  }

  async function handleRefresh() {
    setRefreshing(true);
    const error = await refresh();
    setRefreshing(false);
    setMessage(
      error
        ? { type: "error", text: error }
        : { type: "success", text: "Tickets refreshed." }
    );
  }

  async function handleStatusChange(id, status) {
    const result = await updateTicket(id, { status });
    setMessage(
      result.error
        ? { type: "error", text: result.error }
        : { type: "success", text: id + " moved to " + status + "." }
    );
  }

  const newestFirst = [...tickets].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  const visible = filterTickets(newestFirst, filters, user ? user.id : null);
  const filtersActive =
    JSON.stringify(filters) !== JSON.stringify(emptyFilters);

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <h1 className="page-title">Tickets</h1>
          <p className="page-subtitle">
            Every ticket logged on the site. Search, filter and update them here.
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
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowForm(true);
              setMessage(null);
            }}
          >
            New ticket
          </button>
        </div>
      </div>

      {message && (
        <div
          className={
            "alert " +
            (message.type === "error" ? "alert-error" : "alert-success")
          }
        >
          {message.text}
        </div>
      )}
      {loadError && <div className="alert alert-error">{loadError}</div>}

      {showForm && (
        <div className="panel form-panel">
          <div className="panel-header">
            <h2 className="panel-title">New ticket</h2>
          </div>
          <TicketForm
            equipment={assets.map((a) => ({ id: a.id, label: assetLabel(a) }))}
            onCreated={handleCreated}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="panel">
        <TicketFilters
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(emptyFilters)}
        />
        <div className="panel-header">
          <h2 className="panel-title">
            {filtersActive
              ? "Showing " + visible.length + " of " + tickets.length + " tickets"
              : "All tickets (" + tickets.length + ")"}
          </h2>
        </div>
        {ready ? (
          <TicketTable
            tickets={visible}
            onStatusChange={handleStatusChange}
            emptyMessage={
              filtersActive ? "No tickets match your filters." : "No tickets yet."
            }
          />
        ) : (
          <p className="empty-state">Loading tickets...</p>
        )}
      </div>
    </div>
  );
}

// Regular users who open /tickets by typing the address see a polite block
export default function TicketsPage() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminTickets /> : <AdminOnly />;
}