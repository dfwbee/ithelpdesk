"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { useTickets } from "./TicketsProvider";
import { useAssets } from "./AssetsProvider";
import TicketTable from "./TicketTable";
import Icon from "./Icons";
import { SignalArt, CountUp, greeting, firstName } from "./Visuals";
import { isOverdue } from "../lib/helpers";

export default function AdminDashboard() {
  const { profile, user } = useAuth();
  const { tickets, ready, loadError, refresh } = useTickets();
  const { assets } = useAssets();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const total = tickets.length;
  const open = tickets.filter((t) => t.status === "Open").length;
  const inProgress = tickets.filter((t) => t.status === "In Progress").length;
  const resolved = tickets.filter((t) => t.status === "Resolved").length;
  const overdue = tickets.filter((t) => isOverdue(t)).length;

  const recent = [...tickets]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  const stats = [
    {
      label: "Total tickets",
      value: total,
      icon: "tickets",
      tone: "total",
      note: overdue === 0 ? "None overdue" : overdue + " overdue",
      alert: overdue > 0,
    },
    {
      label: "Open",
      value: open,
      icon: "inbox",
      tone: "open",
      note: "Waiting to be picked up",
    },
    {
      label: "In progress",
      value: inProgress,
      icon: "clock",
      tone: "progress",
      note: "Being worked on",
    },
    {
      label: "Resolved",
      value: resolved,
      icon: "check",
      tone: "resolved",
      note: "Closed out",
    },
  ];

  return (
    <div>
      <section className="hero">
        <div className="hero-copy">
          <h1 className="hero-title">
            {greeting()}, {firstName((profile && profile.fullName) || (user && user.email))}.
          </h1>
          <p className="hero-sub">
            {!ready ? (
              "Loading the latest tickets..."
            ) : (
              <>
                <strong>{open + inProgress}</strong>{" "}
                {open + inProgress === 1 ? "ticket is" : "tickets are"} waiting
                for IT.{" "}
                {overdue > 0 ? (
                  <>
                    <strong>{overdue}</strong> {overdue === 1 ? "is" : "are"}{" "}
                    past the time limit.
                  </>
                ) : (
                  "Nothing is overdue."
                )}
              </>
            )}
          </p>
          <div className="hero-actions">
            <Link href="/tickets?new=1" className="btn btn-primary">
              <Icon name="plus" size={16} />
              New ticket
            </Link>
            <Link href="/tickets" className="btn btn-ghost-dark">
              <Icon name="tickets" size={16} />
              Open the queue
            </Link>
            <button
              className="btn btn-ghost-dark"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <Icon name="refresh" size={16} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
        <SignalArt />
      </section>

      {loadError && <div className="alert alert-error">{loadError}</div>}

      {!ready ? (
        <p className="empty-state">Loading tickets...</p>
      ) : (
        <>
          <div className="stats-grid">
            {stats.map((s) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-top">
                  <div className="stat-label">{s.label}</div>
                  <span className={"stat-icon tone-" + s.tone}>
                    <Icon name={s.icon} size={18} />
                  </span>
                </div>
                <div className="stat-value">
                  <CountUp value={s.value} />
                </div>
                <div
                  className={
                    s.alert ? "stat-note stat-note-alert" : "stat-note"
                  }
                >
                  {s.note}
                </div>
              </div>
            ))}
          </div>

          <Link href="/assets" className="equipment-strip">
            <span className="stat-icon tone-open">
              <Icon name="laptop" size={18} />
            </span>
            <span className="equipment-strip-text">
              <strong>Equipment</strong>
              {assets.length === 0
                ? "No equipment added yet."
                : assets.length +
                  " items, " +
                  assets.filter((a) => a.status === "Assigned").length +
                  " assigned, " +
                  assets.filter((a) => a.status === "In repair").length +
                  " in repair."}
            </span>
            <span className="link-action">Open equipment</span>
          </Link>

          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Recent tickets</h2>
              <Link href="/tickets" className="link-action">
                View all
              </Link>
            </div>
            <TicketTable tickets={recent} />
          </div>
        </>
      )}
    </div>
  );
}