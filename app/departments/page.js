"use client";

import { useState } from "react";
import "../insights.css";
import Link from "next/link";
import { useAuth } from "../../components/AuthProvider";
import { useTickets } from "../../components/TicketsProvider";
import { useAssets } from "../../components/AssetsProvider";
import AdminOnly from "../../components/AdminOnly";
import TicketTable from "../../components/TicketTable";
import BarChart from "../../components/BarChart";
import Icon from "../../components/Icons";
import { CountUp } from "../../components/Visuals";
import {
  DEPARTMENTS,
  NO_DEPARTMENT,
  departmentName,
  isOverdue,
  assetStatusClass,
} from "../../lib/helpers";

// One summary per department: its tickets and the equipment its people hold
function summarise(tickets, assignments, assets) {
  const names = [...DEPARTMENTS];
  tickets.forEach((t) => {
    const name = departmentName(t.department);
    if (!names.includes(name)) names.push(name);
  });
  assignments.forEach((a) => {
    if (a.department && !names.includes(a.department)) names.push(a.department);
  });

  const held = assignments.filter((a) => !a.returnedAt);

  return names
    .map((name) => {
      const its = tickets.filter((t) => departmentName(t.department) === name);
      const kit = held
        .filter((a) => (a.department || "") === name)
        .map((a) => ({ assignment: a, asset: assets.find((x) => x.id === a.assetId) }))
        .filter((x) => x.asset);
      return {
        name,
        tickets: its,
        open: its.filter((t) => t.status !== "Resolved").length,
        overdue: its.filter((t) => isOverdue(t)).length,
        equipment: kit,
      };
    })
    // Hide departments with nothing at all, except the real company ones
    .filter((d) => d.tickets.length > 0 || d.equipment.length > 0 || DEPARTMENTS.includes(d.name));
}

function DepartmentsView() {
  const { tickets, ready } = useTickets();
  const { assets, assignments, ready: assetsReady } = useAssets();
  const [picked, setPicked] = useState(null);

  const summary = summarise(tickets, assignments, assets);
  const busiest = [...summary].sort((a, b) => b.open - a.open)[0];
  // Until you click a card, show the department with the most open tickets
  const selectedName = picked || (busiest ? busiest.name : null);
  const selected = summary.find((d) => d.name === selectedName) || null;

  const withTickets = summary.filter((d) => d.tickets.length > 0).length;
  const mostEquipment = [...summary].sort(
    (a, b) => b.equipment.length - a.equipment.length
  )[0];

  const chartData = summary
    .filter((d) => d.tickets.length > 0)
    .sort((a, b) => b.tickets.length - a.tickets.length)
    .map((d) => ({ label: d.name, value: d.tickets.length }));

  const stats = [
    {
      label: "Departments with tickets",
      value: withTickets,
      icon: "building",
      tone: "total",
      note: "Of " + summary.length + " listed",
    },
    {
      label: "Open tickets",
      value: summary.reduce((sum, d) => sum + d.open, 0),
      icon: "inbox",
      tone: "open",
      note: busiest && busiest.open > 0 ? busiest.name + " has the most" : "Nothing waiting",
    },
    {
      label: "Overdue",
      value: summary.reduce((sum, d) => sum + d.overdue, 0),
      icon: "alert",
      tone: "progress",
      note: "Past their time limit",
    },
    {
      label: "Equipment in use",
      value: summary.reduce((sum, d) => sum + d.equipment.length, 0),
      icon: "laptop",
      tone: "resolved",
      note:
        mostEquipment && mostEquipment.equipment.length > 0
          ? mostEquipment.name + " holds the most"
          : "Nothing assigned",
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Departments</h1>
        <p className="page-subtitle">
          Which teams raise the most tickets, and what equipment each team holds.
          Click a department to see the details.
        </p>
      </div>

      {!ready || !assetsReady ? (
        <p className="empty-state">Loading departments...</p>
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
                <div className="stat-note">{s.note}</div>
              </div>
            ))}
          </div>

          <div className="dept-grid">
            {summary.map((d) => (
              <button
                key={d.name}
                type="button"
                className={
                  "dept-card" + (selected && selected.name === d.name ? " is-selected" : "")
                }
                aria-pressed={selected && selected.name === d.name}
                onClick={() => setPicked(d.name)}
              >
                <span className="dept-name">{d.name}</span>
                <span className="dept-numbers">
                  <span>
                    <strong>{d.tickets.length}</strong> tickets
                  </span>
                  <span>
                    <strong>{d.equipment.length}</strong> devices
                  </span>
                </span>
                <span className="dept-foot">
                  {d.overdue > 0 ? (
                    <span className="badge badge-overdue">{d.overdue} overdue</span>
                  ) : d.open > 0 ? (
                    <span className="badge badge-open">{d.open} open</span>
                  ) : (
                    <span className="dept-clear">All clear</span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {chartData.length > 0 && (
            <BarChart
              title="Tickets by department"
              subtitle="Every ticket raised, including resolved ones"
              data={chartData}
            />
          )}

          {selected && (
            <div className="detail-grid dept-detail">
              <div className="panel">
                <div className="panel-header">
                  <h2 className="panel-title">
                    {selected.name === NO_DEPARTMENT
                      ? "Tickets with no department"
                      : selected.name + " tickets"}
                    <span className="count-pill">{selected.tickets.length}</span>
                  </h2>
                </div>
                <TicketTable
                  tickets={[...selected.tickets].sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                  )}
                  compact
                  emptyMessage="This department has not raised any tickets."
                />
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h2 className="panel-title">
                    Equipment held
                    <span className="count-pill">{selected.equipment.length}</span>
                  </h2>
                </div>
                {selected.equipment.length === 0 ? (
                  <p className="empty-state">No equipment assigned to this department.</p>
                ) : (
                  <ul className="dept-kit">
                    {selected.equipment.map(({ assignment, asset }) => (
                      <li key={assignment.id}>
                        <div>
                          <Link href={"/assets/" + asset.id} className="ticket-link">
                            {asset.tag}
                          </Link>
                          <span className="cell-sub">
                            {asset.model} · {assignment.holderName}
                          </span>
                        </div>
                        <span className={assetStatusClass(asset.status)}>
                          {asset.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function DepartmentsPage() {
  const { isAdmin } = useAuth();
  return isAdmin ? <DepartmentsView /> : <AdminOnly />;
}