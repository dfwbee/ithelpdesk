"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import Icon from "./Icons";
import { formatDateTime, timeAgo } from "../lib/helpers";

const NETWORK_ERROR =
  "Could not reach Supabase. Check your internet connection and try again.";

function initialsOf(name) {
  const words = (name || "?").split(/[\s@._-]+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function fromComment(row) {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorRole: row.author_role,
    body: row.body,
    internal: row.internal,
    createdAt: row.created_at,
  };
}

function fromEvent(row) {
  return {
    id: row.id,
    kind: row.kind,
    actorName: row.actor_name,
    detail: row.detail,
    createdAt: row.created_at,
  };
}

// Loads the conversation and the activity log of one ticket
async function fetchThread(ticketUuid) {
  try {
    const [comments, events] = await Promise.all([
      supabase
        .from("ticket_comments")
        .select("*")
        .eq("ticket_id", ticketUuid)
        .order("created_at", { ascending: true }),
      supabase
        .from("ticket_events")
        .select("*")
        .eq("ticket_id", ticketUuid)
        .order("created_at", { ascending: true }),
    ]);
    const failed = comments.error || events.error;
    if (failed) {
      return { comments: [], events: [], error: failed.message };
    }
    return {
      comments: comments.data.map(fromComment),
      events: events.data.map(fromEvent),
      error: "",
    };
  } catch (err) {
    return { comments: [], events: [], error: NETWORK_ERROR };
  }
}

// The two panels below a ticket: the conversation, and the activity log.
// "changeKey" changes whenever the ticket changes (status, assignee...), which
// makes the activity log reload so the new line shows up straight away.
export default function TicketThread({ ticket }) {
  const { isAdmin, user } = useAuth();
  const [thread, setThread] = useState({
    uuid: null,
    comments: [],
    events: [],
    error: "",
  });
  const [text, setText] = useState("");
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const changeKey = [
    ticket.status,
    ticket.assignedTo,
    ticket.priority,
    ticket.assetId,
    ticket.resolutionNote,
  ].join("|");

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    fetchThread(ticket.uuid).then((result) => {
      if (active) setThread({ uuid: ticket.uuid, ...result });
    });
    return () => {
      active = false;
    };
  }, [ticket.uuid, changeKey]);

  const loaded = thread.uuid === ticket.uuid;

  async function handleSend(event) {
    event.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setSendError("");
    try {
      const { data, error } = await supabase
        .from("ticket_comments")
        .insert({
          ticket_id: ticket.uuid,
          body,
          internal: isAdmin && internal,
        })
        .select()
        .single();
      if (error) {
        setSendError(error.message);
      } else {
        const comment = fromComment(data);
        setThread((current) => ({
          ...current,
          comments: [...current.comments, comment],
        }));
        setText("");
        setInternal(false);
      }
    } catch (err) {
      setSendError(NETWORK_ERROR);
    }
    setSending(false);
  }

  function onKeyDown(event) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      handleSend(event);
    }
  }

  return (
    <>
      <div className="panel">
        <h2 className="panel-title">
          Conversation
          {loaded && thread.comments.length > 0 && (
            <span className="count-pill">{thread.comments.length}</span>
          )}
        </h2>

        {thread.error && <div className="alert alert-error">{thread.error}</div>}

        {!loaded ? (
          <p className="empty-state">Loading conversation...</p>
        ) : thread.comments.length === 0 ? (
          <p className="hint">
            No messages yet.{" "}
            {isAdmin
              ? "Reply to the requester or leave an internal note for the team."
              : "Add more detail or ask the IT team a question below."}
          </p>
        ) : (
          <ul className="comment-list">
            {thread.comments.map((c) => {
              const mine = user && c.authorId === user.id;
              return (
                <li
                  key={c.id}
                  className={
                    "comment" +
                    (c.internal ? " is-internal" : "") +
                    (c.authorRole === "admin" ? " is-staff" : "")
                  }
                >
                  <span className="comment-avatar" aria-hidden="true">
                    {initialsOf(c.authorName)}
                  </span>
                  <div className="comment-main">
                    <div className="comment-head">
                      <strong>{mine ? "You" : c.authorName}</strong>
                      {c.authorRole === "admin" && (
                        <span className="role-chip">IT</span>
                      )}
                      {c.internal && (
                        <span className="role-chip chip-internal">
                          Internal note
                        </span>
                      )}
                      <span className="comment-time" title={formatDateTime(c.createdAt)}>
                        {timeAgo(c.createdAt)}
                      </span>
                    </div>
                    <p className="comment-body">{c.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <form className="comment-form" onSubmit={handleSend}>
          {sendError && <div className="alert alert-error">{sendError}</div>}
          <label className="sr-only" htmlFor="comment-text">
            Write a message
          </label>
          <textarea
            id="comment-text"
            rows={3}
            maxLength={2000}
            placeholder={
              internal
                ? "Internal note: only IT staff will see this."
                : isAdmin
                  ? "Reply to the requester..."
                  : "Write a message to the IT team..."
            }
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={onKeyDown}
          />
          <div className="comment-actions">
            {isAdmin ? (
              <label className="check" htmlFor="comment-internal">
                <input
                  id="comment-internal"
                  type="checkbox"
                  checked={internal}
                  onChange={(event) => setInternal(event.target.checked)}
                />
                Internal note (hidden from the requester)
              </label>
            ) : (
              <span className="hint-inline">Ctrl + Enter to send</span>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending || text.trim().length === 0}
            >
              <Icon name="send" size={16} />
              {sending ? "Sending..." : internal ? "Add note" : "Send"}
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <h2 className="panel-title">Activity</h2>
        {!loaded ? (
          <p className="empty-state">Loading activity...</p>
        ) : thread.events.length === 0 ? (
          <p className="hint">No activity recorded yet.</p>
        ) : (
          <ol className="timeline activity-timeline">
            {[...thread.events].reverse().map((e) => (
              <li key={e.id} className={"event-" + e.kind}>
                <div className="timeline-head">
                  <strong>{e.detail}</strong>
                </div>
                <p className="event-meta">
                  {e.actorName} · <span title={formatDateTime(e.createdAt)}>{timeAgo(e.createdAt)}</span>
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}