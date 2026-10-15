"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../components/AuthProvider";
import { useAssets } from "../../components/AssetsProvider";
import { useTickets } from "../../components/TicketsProvider";
import AdminOnly from "../../components/AdminOnly";
import AssetForm from "../../components/AssetForm";
import Icon from "../../components/Icons";
import { CountUp } from "../../components/Visuals";
import {
  ASSET_TYPES,
  ASSET_STATUSES,
  assetStatusClass,
  warrantyInfo,
} from "../../lib/helpers";

const emptyFilters = { search: "", type: "All", status: "All", warranty: false };

function AssetsView() {
  const { assets, ready, loadError, refresh, holderOf } = useAssets();
  const { tickets } = useTickets();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  function update(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  // Warranty needs attention when it has expired or ends within 60 days
  function needsWarrantyAttention(asset) {
    if (asset.status === "Retired") return false;
    const tone = warrantyInfo(asset.warrantyEnd).tone;
    return tone === "soon" || tone === "expired";
  }

  const stats = [
    {
      label: "Total equipment",
      value: assets.length,
      icon: "laptop",
      tone: "total",
      note: assets.filter((a) => a.status === "Retired").length + " retired",
    },
    {
      label: "Assigned",
      value: assets.filter((a) => a.status === "Assigned").length,
      icon: "user",
      tone: "progress",
      note: "In someone's hands",
    },
    {
      label: "In repair",
      value: assets.filter((a) => a.status === "In repair").length,
      icon: "wrench",
      tone: "open",
      note: "Out of action",
    },
    {
      label: "Warranty needs attention",
      value: assets.filter(needsWarrantyAttention).length,
      icon: "calendar",
      tone: "resolved",
      note: "Expired or ending within 60 days",
    },
  ];

  const query = filters.search.trim().toLowerCase();
  const visible = assets.filter((a) => {
    if (filters.type !== "All" && a.type !== filters.type) return false;
    if (filters.status !== "All" && a.status !== filters.status) return false;
    if (filters.warranty && !needsWarrantyAttention(a)) return false;
    if (query) {
      const holder = holderOf(a.id);
      const searchable = [
        a.tag,
        a.model,
        a.serial,
        a.type,
        holder ? holder.holderName : "",
        holder ? holder.username : "",
        holder ? holder.department : "",
      ]
        .join(" ")
        .toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });

  const filtersActive = JSON.stringify(filters) !== JSON.stringify(emptyFilters);

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <h1 className="page-title">Equipment</h1>
          <p className="page-subtitle">
            Every laptop, monitor and device, who has it, how it has been looked
            after, and the tickets logged on it.
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <Icon name="refresh" size={16} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowForm(true);
              setMessage("");
            }}
          >
            <Icon name="plus" size={16} />
            Add equipment
          </button>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {loadError && <div className="alert alert-error">{loadError}</div>}

      {showForm && (
        <div className="panel form-panel">
          <div className="panel-header">
            <h2 className="panel-title">Add equipment</h2>
          </div>
          <AssetForm
            onCreated={(asset) => {
              setShowForm(false);
              setMessage(asset.tag + " added. You can now assign it to someone.");
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {ready && (
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
      )}

      <div className="panel">
        <div className="filters">
          <div className="field filter-search">
            <label htmlFor="asset-search">Search</label>
            <div className="search-box">
              <Icon name="search" size={16} />
              <input
                id="asset-search"
                type="search"
                placeholder="Tag, model, serial number, holder, username or department"
                value={filters.search}
                onChange={(event) => update("search", event.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="asset-filter-type">Type</label>
            <select
              id="asset-filter-type"
              value={filters.type}
              onChange={(event) => update("type", event.target.value)}
            >
              <option value="All">All types</option>
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="asset-filter-status">Status</label>
            <select
              id="asset-filter-status"
              value={filters.status}
              onChange={(event) => update("status", event.target.value)}
            >
              <option value="All">All statuses</option>
              {ASSET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="filters-actions">
            <label className="check" htmlFor="asset-filter-warranty">
              <input
                id="asset-filter-warranty"
                type="checkbox"
                checked={filters.warranty}
                onChange={(event) => update("warranty", event.target.checked)}
              />
              Warranty needs attention
            </label>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setFilters(emptyFilters)}
            >
              Clear filters
            </button>
          </div>
        </div>

        <div className="panel-header">
          <h2 className="panel-title">
            {filtersActive
              ? "Showing " + visible.length + " of " + assets.length + " items"
              : "All equipment (" + assets.length + ")"}
          </h2>
        </div>

        {!ready ? (
          <p className="empty-state">Loading equipment...</p>
        ) : visible.length === 0 ? (
          <p className="empty-state">
            {filtersActive
              ? "No equipment matches your filters."
              : "No equipment yet. Add the first item."}
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Asset tag</th>
                  <th>Equipment</th>
                  <th>Held by</th>
                  <th>Status</th>
                  <th>Warranty</th>
                  <th>Tickets</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((a) => {
                  const holder = holderOf(a.id);
                  const warranty = warrantyInfo(a.warrantyEnd);
                  const onIt = tickets.filter((t) => t.assetId === a.id);
                  const openOnes = onIt.filter((t) => t.status !== "Resolved");
                  return (
                    <tr key={a.id}>
                      <td className="ticket-id" data-label="Asset tag">
                        <Link href={"/assets/" + a.id} className="ticket-link">
                          {a.tag}
                        </Link>
                      </td>
                      <td className="ticket-title" data-label="Equipment">
                        <Link href={"/assets/" + a.id} className="ticket-link">
                          {a.model}
                        </Link>
                        <span className="cell-sub">{a.type}</span>
                      </td>
                      <td data-label="Held by">
                        {holder ? (
                          <>
                            {holder.holderName}
                            <span className="cell-sub">
                              {[holder.department, holder.username]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </>
                        ) : (
                          <span className="muted">Nobody</span>
                        )}
                      </td>
                      <td data-label="Status">
                        <span className={assetStatusClass(a.status)}>
                          {a.status}
                        </span>
                      </td>
                      <td data-label="Warranty">
                        <span className={"badge badge-warranty-" + warranty.tone}>
                          {warranty.label}
                        </span>
                      </td>
                      <td data-label="Tickets">
                        {onIt.length === 0 ? (
                          <span className="muted">None</span>
                        ) : (
                          <>
                            {onIt.length}
                            {openOnes.length > 0 && (
                              <span className="cell-sub">
                                {openOnes.length} open
                              </span>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Only admins manage equipment
export default function AssetsPage() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AssetsView /> : <AdminOnly />;
}