"use client";

import Link from "next/link";
import Icon from "./Icons";
import { useAssets } from "./AssetsProvider";
import {
  STATUSES,
  isOverdue,
  formatAge,
  statusClass,
  priorityClass,
} from "../lib/helpers";

// onStatusChange is optional. When given, the status column becomes a dropdown.
// compact hides the Category and Requester columns (used in narrow spaces).
export default function TicketTable({
  tickets,
  onStatusChange,
  emptyMessage,
  compact = false,
}) {
  const { assetById } = useAssets();

  if (tickets.length === 0) {
    return <p className="empty-state">{emptyMessage || "No tickets yet."}</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            {!compact && <th>Category</th>}
            <th>Priority</th>
            <th>Status</th>
            {!compact && <th>Requester</th>}
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id}>
              <td className="ticket-id" data-label="ID">
                <Link href={"/tickets/" + t.id} className="ticket-link">
                  {t.id}
                </Link>
              </td>
              <td className="ticket-title" data-label="Title">
                <Link href={"/tickets/" + t.id} className="ticket-link">
                  {t.title}
                </Link>
                {t.assetId && assetById(t.assetId) && (
                  <span className="asset-chip">
                    {assetById(t.assetId).tag}
                  </span>
                )}
                {isOverdue(t) && (
                  <span className="badge badge-overdue">
                    <Icon name="alert" size={12} />
                    Overdue
                  </span>
                )}
              </td>
              {!compact && <td data-label="Category">{t.category}</td>}
              <td data-label="Priority">
                <span className={priorityClass(t.priority)}>{t.priority}</span>
              </td>
              <td data-label="Status">
                {onStatusChange ? (
                  <select
                    className={"status-select " + statusClass(t.status)}
                    value={t.status}
                    aria-label={"Status for " + t.id}
                    onChange={(event) =>
                      onStatusChange(t.id, event.target.value)
                    }
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={statusClass(t.status)}>{t.status}</span>
                )}
              </td>
              {!compact && <td data-label="Requester">{t.requester}</td>}
              <td data-label="Created">{formatAge(t.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}