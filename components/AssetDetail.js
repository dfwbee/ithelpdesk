"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { useAssets } from "./AssetsProvider";
import { useTickets } from "./TicketsProvider";
import AdminOnly from "./AdminOnly";
import TicketTable from "./TicketTable";
import AssetQr from "./AssetQr";
import Icon from "./Icons";
import {
  DEPARTMENTS,
  MAINTENANCE_KINDS,
  assetStatusClass,
  warrantyInfo,
  formatDate,
  formatDateTime,
} from "../lib/helpers";

// Today as "2026-10-14", the format a date box understands
function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
}

// "Since 14 Oct 2026 (30 days)"
function heldFor(assignment) {
  const end = assignment.returnedAt
    ? new Date(assignment.returnedAt)
    : new Date();
  const days = Math.max(
    0,
    Math.floor((end - new Date(assignment.assignedAt)) / (1000 * 60 * 60 * 24))
  );
  return days === 1 ? "1 day" : days + " days";
}

/* ---------- Give the item to someone ---------- */
function AssignForm({ asset, onDone }) {
  const { accounts, assignAsset } = useAssets();
  const [form, setForm] = useState({
    accountId: "",
    holderName: "",
    username: "",
    department: DEPARTMENTS[0],
    conditionNote: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  }

  // Choosing an account fills in the name and username to save typing
  function handleAccount(event) {
    const accountId = event.target.value;
    const account = accounts.find((a) => a.id === accountId);
    setForm((current) => ({
      ...current,
      accountId,
      holderName: account ? account.name || account.email : current.holderName,
      username:
        account && account.email ? account.email.split("@")[0] : current.username,
    }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.holderName.trim().length < 2) {
      setError("Enter the name of the person receiving it.");
      return;
    }
    setBusy(true);
    const result = await assignAsset(asset.id, form);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDone(asset.tag + " assigned to " + form.holderName.trim() + ".");
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-grid">
        <div className="field field-full">
          <label htmlFor="assign-account">Link to an account (optional)</label>
          <select
            id="assign-account"
            value={form.accountId}
            onChange={handleAccount}
          >
            <option value="">Not linked</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name ? a.name + " (" + a.email + ")" : a.email}
              </option>
            ))}
          </select>
          <span className="hint">
            A linked person sees this item on their page and can log tickets
            about it.
          </span>
        </div>

        <div className="field">
          <label htmlFor="assign-name">Name</label>
          <input
            id="assign-name"
            name="holderName"
            type="text"
            placeholder="e.g. Adaeze Okafor"
            value={form.holderName}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label htmlFor="assign-username">Username</label>
          <input
            id="assign-username"
            name="username"
            type="text"
            placeholder="e.g. a.okafor"
            value={form.username}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label htmlFor="assign-dept">Department</label>
          <select
            id="assign-dept"
            name="department"
            value={form.department}
            onChange={handleChange}
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="assign-note">Condition when handed over</label>
          <input
            id="assign-note"
            name="conditionNote"
            type="text"
            placeholder="e.g. New, with charger and bag"
            value={form.conditionNote}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          <Icon name="swap" size={16} />
          {busy ? "Assigning..." : "Assign equipment"}
        </button>
      </div>
    </form>
  );
}

/* ---------- Add a repair, service, upgrade or inspection ---------- */
function MaintenanceForm({ asset, onDone }) {
  const { addMaintenance } = useAssets();
  const [form, setForm] = useState({
    kind: MAINTENANCE_KINDS[0],
    description: "",
    doneOn: today(),
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.description.trim().length < 5) {
      setError("Describe what was done in at least 5 characters.");
      return;
    }
    setBusy(true);
    const result = await addMaintenance(asset.id, form);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setForm({ kind: MAINTENANCE_KINDS[0], description: "", doneOn: today() });
    onDone(form.kind + " logged for " + asset.tag + ".");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="inline-form">
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-grid">
        <div className="field">
          <label htmlFor="log-kind">Type of work</label>
          <select
            id="log-kind"
            name="kind"
            value={form.kind}
            onChange={handleChange}
          >
            {MAINTENANCE_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="log-date">Date done</label>
          <input
            id="log-date"
            name="doneOn"
            type="date"
            max={today()}
            value={form.doneOn}
            onChange={handleChange}
          />
        </div>
        <div className="field field-full">
          <label htmlFor="log-description">What was done?</label>
          <input
            id="log-description"
            name="description"
            type="text"
            placeholder="e.g. Replaced the battery after rapid drain"
            value={form.description}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          <Icon name="wrench" size={16} />
          {busy ? "Saving..." : "Log maintenance"}
        </button>
      </div>
    </form>
  );
}

/* ---------- The whole page, once the item has been found ---------- */
function DetailBody({ asset }) {
  const { holderOf, historyOf, logsOf, updateAsset, returnAsset } = useAssets();
  const { tickets } = useTickets();
  const [feedback, setFeedback] = useState(null);
  const [returnNote, setReturnNote] = useState("");
  const [busy, setBusy] = useState(false);

  const holder = holderOf(asset.id);
  const history = historyOf(asset.id);
  const logs = logsOf(asset.id);
  const onIt = tickets
    .filter((t) => t.assetId === asset.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const warranty = warrantyInfo(asset.warrantyEnd);

  function say(type, text) {
    setFeedback({ type, text });
  }

  async function handleStatusChange(event) {
    const status = event.target.value;
    setBusy(true);
    const result = await updateAsset(asset.id, { status });
    setBusy(false);
    result.error
      ? say("error", result.error)
      : say("success", "Status changed to " + status + ".");
  }

  async function handleReturn() {
    setBusy(true);
    const result = await returnAsset(asset.id, returnNote);
    setBusy(false);
    if (result.error) {
      say("error", result.error);
      return;
    }
    setReturnNote("");
    say("success", asset.tag + " returned to stock.");
  }

  // A held item can be "Assigned" or "In repair". A free one can be in stock, in repair or retired.
  const statusChoices = holder
    ? ["Assigned", "In repair"]
    : ["In stock", "In repair", "Retired"];

  return (
    <div>
      <Link href="/assets" className="back-link">
        Back to equipment
      </Link>

      <div className="page-header detail-header">
        <div className="ticket-id">{asset.tag}</div>
        <h1 className="page-title">{asset.model}</h1>
        <div className="detail-badges">
          <span className="badge badge-user">{asset.type}</span>
          <span className={assetStatusClass(asset.status)}>{asset.status}</span>
          <span className={"badge badge-warranty-" + warranty.tone}>
            Warranty: {warranty.label}
          </span>
        </div>
      </div>

      {feedback && (
        <div
          className={
            "alert " +
            (feedback.type === "error" ? "alert-error" : "alert-success")
          }
        >
          {feedback.text}
        </div>
      )}

      <div className="detail-grid">
        <div className="detail-main">
          <div className="panel">
            <h2 className="panel-title">Current holder</h2>
            {holder ? (
              <>
                <div className="holder-card">
                  <div className="avatar holder-avatar" aria-hidden="true">
                    {holder.holderName
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="holder-text">
                    <div className="holder-name">{holder.holderName}</div>
                    <div className="holder-meta">
                      {[holder.department, holder.username]
                        .filter(Boolean)
                        .join(" · ") || "No department or username recorded"}
                    </div>
                    <div className="holder-meta">
                      Since {formatDate(holder.assignedAt)} ({heldFor(holder)})
                      {holder.userId && " · Has an account in this app"}
                    </div>
                    {holder.conditionNote && (
                      <div className="holder-meta">
                        Handed over: {holder.conditionNote}
                      </div>
                    )}
                  </div>
                </div>
                <div className="field return-field">
                  <label htmlFor="return-note">
                    Condition when it comes back
                  </label>
                  <input
                    id="return-note"
                    type="text"
                    placeholder="e.g. Good condition, charger missing"
                    value={returnNote}
                    onChange={(event) => setReturnNote(event.target.value)}
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleReturn}
                    disabled={busy}
                  >
                    <Icon name="swap" size={16} />
                    Return to stock
                  </button>
                </div>
              </>
            ) : asset.status === "In stock" ? (
              <>
                <p className="hint">
                  Nobody has this item. Give it to someone below.
                </p>
                <AssignForm
                  key={history.length}
                  asset={asset}
                  onDone={(text) => say("success", text)}
                />
              </>
            ) : (
              <p className="empty-state">
                This item is {asset.status.toLowerCase()}, so it cannot be
                assigned. Change its status to In stock first.
              </p>
            )}
          </div>

          <div className="panel">
            <h2 className="panel-title">
              Tickets logged on this equipment ({onIt.length})
            </h2>
            <TicketTable
              compact
              tickets={onIt}
              emptyMessage="No tickets have been logged on this item."
            />
          </div>

          <div className="panel">
            <h2 className="panel-title">Maintenance history</h2>
            <MaintenanceForm
              asset={asset}
              onDone={(text) => say("success", text)}
            />
            {logs.length === 0 ? (
              <p className="empty-state">No maintenance recorded yet.</p>
            ) : (
              <ol className="timeline">
                {logs.map((log) => (
                  <li key={log.id}>
                    <div className="timeline-head">
                      <span className="badge badge-user">{log.kind}</span>
                      <span className="timeline-date">
                        {formatDate(log.doneOn)}
                      </span>
                    </div>
                    <p>{log.description}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="panel">
            <h2 className="panel-title">Who has had it</h2>
            {history.length === 0 ? (
              <p className="empty-state">This item has never been assigned.</p>
            ) : (
              <ol className="timeline">
                {history.map((h) => (
                  <li key={h.id}>
                    <div className="timeline-head">
                      <strong>{h.holderName}</strong>
                      <span className="timeline-date">
                        {formatDate(h.assignedAt)} to{" "}
                        {h.returnedAt ? formatDate(h.returnedAt) : "now"}
                      </span>
                    </div>
                    <p>
                      {[h.department, h.username].filter(Boolean).join(" · ")}
                      {h.conditionNote ? " · " + h.conditionNote : ""}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="detail-side">
          <AssetQr asset={asset} />
          <div className="panel">
            <h2 className="panel-title">Status</h2>
            <div className="field">
              <label htmlFor="asset-status">Change status</label>
              <select
                id="asset-status"
                value={asset.status}
                onChange={handleStatusChange}
                disabled={busy}
              >
                {statusChoices.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <span className="hint">
                Assigning and returning change the status for you.
              </span>
            </div>
          </div>

          <div className="panel">
            <h2 className="panel-title">Details</h2>
            <dl className="meta-list">
              <dt>Asset tag</dt>
              <dd>{asset.tag}</dd>
              <dt>Type</dt>
              <dd>{asset.type}</dd>
              <dt>Serial number</dt>
              <dd>{asset.serial || "Not recorded"}</dd>
              <dt>Purchased</dt>
              <dd>{formatDate(asset.purchaseDate)}</dd>
              <dt>Warranty ends</dt>
              <dd>{formatDate(asset.warrantyEnd)}</dd>
              <dt>Added</dt>
              <dd>{formatDateTime(asset.createdAt)}</dd>
              {asset.notes && (
                <>
                  <dt>Notes</dt>
                  <dd>{asset.notes}</dd>
                </>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssetDetail({ id }) {
  const { isAdmin } = useAuth();
  const { assets, ready } = useAssets();

  if (!isAdmin) return <AdminOnly />;
  if (!ready) return <p className="empty-state">Loading equipment...</p>;

  const asset = assets.find((a) => a.id === id);
  if (!asset) {
    return (
      <div>
        <Link href="/assets" className="back-link">
          Back to equipment
        </Link>
        <div className="panel">
          <h2 className="panel-title">Equipment not found</h2>
          <p className="empty-state">There is no equipment with that ID.</p>
        </div>
      </div>
    );
  }

  return <DetailBody key={asset.id} asset={asset} />;
}