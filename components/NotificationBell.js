"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useNotifications } from "./NotificationsProvider";
import { useTickets } from "./TicketsProvider";
import Icon from "./Icons";
import { timeAgo } from "../lib/helpers";

// The bell at the top right of every page, with a dropdown of recent notifications
export default function NotificationBell() {
  const { items, unread, markRead, markAllRead, clearAll, refresh } =
    useNotifications();
  const { tickets } = useTickets();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Close when you click elsewhere or press Escape
  useEffect(() => {
    if (!open) return;
    function onClick(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    if (!open) refresh();
    setOpen(!open);
  }

  // Where a notification leads: the ticket it is about
  function hrefFor(notification) {
    const ticket = tickets.find((t) => t.uuid === notification.ticketId);
    return ticket ? "/tickets/" + ticket.id : "/";
  }

  return (
    <div className="bell-wrap" ref={wrapRef}>
      <button
        type="button"
        className={"bell-btn" + (unread > 0 ? " has-unread" : "")}
        aria-label={
          unread > 0 ? "Notifications, " + unread + " unread" : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="true"
        onClick={toggle}
      >
        <Icon name="bell" size={20} />
        {unread > 0 && (
          <span className="bell-badge" aria-hidden="true">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="bell-menu" role="region" aria-label="Notifications">
          <div className="bell-menu-head">
            <strong>Notifications</strong>
            <div className="bell-menu-actions">
              <button
                type="button"
                className="link-button"
                onClick={markAllRead}
                disabled={unread === 0}
              >
                Mark all read
              </button>
              <button
                type="button"
                className="link-button"
                onClick={clearAll}
                disabled={items.length === 0}
              >
                Clear
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="bell-empty">You are all caught up.</p>
          ) : (
            <ul className="bell-list">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={hrefFor(n)}
                    className={"bell-item" + (n.read ? "" : " is-unread")}
                    onClick={() => {
                      markRead(n.id);
                      setOpen(false);
                    }}
                  >
                    <span className="bell-dot" aria-hidden="true" />
                    <span className="bell-text">
                      <span className="bell-message">{n.message}</span>
                      <span className="bell-time">{timeAgo(n.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}