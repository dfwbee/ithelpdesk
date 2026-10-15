"use client";

import { useState } from "react";
import Link from "next/link";
import { useTickets } from "./TicketsProvider";
import { useAuth } from "./AuthProvider";
import { useAssets } from "./AssetsProvider";
import {
  STATUSES,
  isOverdue,
  formatAge,
  formatDateTime,
  slaLabel,
  assetLabel,
  statusClass,
  priorityClass,
} from "../lib/helpers";

// Shown only once the ticket has been found, so the note box can start
// with the saved note without any extra effects.
function DetailBody({ ticket }) {
  const { updateTicket } = useTickets();
  const { isAdmin } = useAuth();
  const { assets, assetById } = useAssets();
  const asset = ticket.assetId ? assetById(ticket.assetId) : null;
  const [note, setNote] = useState(ticket.resolutionNote || "");
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);

  const overdue = isOverdue(ticket);
  const hasSavedNote = Boolean(ticket.resolutionNote);

  function showResult(result, successText) {
    setFeedback(
      result.error
        ? { type: "error", text: result.error }
        : { type: "success", text: successText }
    );
  }

  async function handleStatusChange(event) {
    const status = event.target.value;
    setBusy(true);
    const result = await updateTicket(ticket.id, { status });
    setBusy(false);
    showResult(result, "Status changed to " + status + ".");
  }

  async function handleAssetChange(event) {
    const assetId = event.target.value;
    setBusy(true);
    const result = await updateTicket(ticket.id, { assetId });
    setBusy(false);
    showResult(result, assetId ? "Equipment linked." : "Equipment unlinked.");
  }

  async function handleSaveNote() {
    const cleaned = note.trim();
    setBusy(true);
    const result = await updateTicket(ticket.id, { resolutionNote: cleaned });
    setBusy(false);
    if (!result.error) setNote(cleaned);
    showResult(result, "Resolution note saved.");
  }

  return (
    <div>
      <Link href={isAdmin ? "/tickets" : "/"} className="back-link">
        {isAdmin ? "Back to tickets" : "Back to my tickets"}
      </Link>

      <div className="page-header detail-header">
        <div className="ticket-id">{ticket.id}</div>
        <h1 className="page-title">{ticket.title}</h1>
        <div className="detail-badges">
          <span className={priorityClass(ticket.priority)}>
            {ticket.priority} priority
          </span>
          <span className={statusClass(ticket.status)}>{ticket.status}</span>
          {overdue && <span className="badge badge-overdue">Overdue</span>}
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
            <h2 className="panel-title">Description</h2>
            <p className="detail-text">{ticket.description}</p>
          </div>

          <div className="panel">
            <h2 className="panel-title">Resolution notes</h2>
            {isAdmin ? (
              <>
                {ticket.status === "Resolved" && !hasSavedNote && (
                  <p className="hint">
                    This ticket is resolved but has no resolution note yet.
                  </p>
                )}
                <div className="field">
                  <label htmlFor="resolution-note">
                    What was done to fix it?
                  </label>
                  <textarea
                    id="resolution-note"
                    rows={5}
                    placeholder="e.g. Replaced the cable and confirmed the user could print."
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveNote}
                    disabled={busy}
                  >
                    Save note
                  </button>
                </div>
              </>
            ) : (
              <p className="detail-text">
                {hasSavedNote
                  ? ticket.resolutionNote
                  : "No resolution note yet. The IT team will add one when your ticket is resolved."}
              </p>
            )}
          </div>
        </div>

        <div className="detail-side">
          {isAdmin && (
            <div className="panel">
              <h2 className="panel-title">Status</h2>
              <div className="field">
                <label htmlFor="detail-status">Change status</label>
                <select
                  id="detail-status"
                  value={ticket.status}
                  onChange={handleStatusChange}
                  disabled={busy}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="panel">
              <h2 className="panel-title">Equipment</h2>
              <div className="field">
                <label htmlFor="detail-asset">Linked equipment</label>
                <select
                  id="detail-asset"
                  value={ticket.assetId || ""}
                  onChange={handleAssetChange}
                  disabled={busy}
                >
                  <option value="">None</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {assetLabel(a)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="panel">
            <h2 className="panel-title">Details</h2>
            <dl className="meta-list">
              <dt>Requester</dt>
              <dd>{ticket.requester}</dd>
              <dt>Category</dt>
              <dd>{ticket.category}</dd>
              <dt>Equipment</dt>
              <dd>
                {asset ? (
                  isAdmin ? (
                    <Link href={"/assets/" + asset.id} className="link-action">
                      {assetLabel(asset)}
                    </Link>
                  ) : (
                    assetLabel(asset)
                  )
                ) : (
                  "None"
                )}
              </dd>
              <dt>Priority</dt>
              <dd>{ticket.priority}</dd>
              <dt>Created</dt>
              <dd>
                {formatDateTime(ticket.createdAt)} ({formatAge(ticket.createdAt)})
              </dd>
              <dt>Time limit</dt>
              <dd className={overdue ? "sla-overdue" : ""}>
                {slaLabel(ticket)}
              </dd>
              {ticket.resolvedAt && (
                <>
                  <dt>Resolved</dt>
                  <dd>{formatDateTime(ticket.resolvedAt)}</dd>
                </>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TicketDetail({ id }) {
  const { tickets, ready } = useTickets();
  const { isAdmin } = useAuth();

  if (!ready) {
    return <p className="empty-state">Loading ticket...</p>;
  }

  const ticket = tickets.find((t) => t.id === id);

  if (!ticket) {
    return (
      <div>
        <Link href={isAdmin ? "/tickets" : "/"} className="back-link">
          {isAdmin ? "Back to tickets" : "Back to my tickets"}
        </Link>
        <div className="panel">
          <h2 className="panel-title">Ticket not found</h2>
          <p className="empty-state">
            There is no ticket with the ID {id} that you can view.
          </p>
        </div>
      </div>
    );
  }

  return <DetailBody key={ticket.id} ticket={ticket} />;
}