"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import Icon from "./Icons";
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_BYTES,
  formatFileSize,
  timeAgo,
} from "../lib/helpers";

const BUCKET = "ticket-files";
const NETWORK_ERROR =
  "Could not reach Supabase. Check your internet connection and try again.";

function fromRow(row) {
  return {
    id: row.id,
    name: row.file_name,
    path: row.file_path,
    size: row.file_size,
    type: row.mime_type,
    uploader: row.uploader_name,
    createdAt: row.created_at,
  };
}

// Keeps letters, numbers, dots, dashes and underscores so the stored name is safe
function safeName(name) {
  return name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(-80) || "file";
}

function randomPart() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().slice(0, 8);
  }
  return String(Date.now());
}

// The "Attachments" panel on a ticket: screenshots, PDFs and text files
export default function TicketAttachments({ ticket }) {
  const { isAdmin } = useAuth();
  const [state, setState] = useState({ uuid: null, files: [], error: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase
      .from("ticket_attachments")
      .select("*")
      .eq("ticket_id", ticket.uuid)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        setState({
          uuid: ticket.uuid,
          files: error ? [] : data.map(fromRow),
          error: error ? error.message : "",
        });
      })
      .catch(() => {
        if (active) setState({ uuid: ticket.uuid, files: [], error: NETWORK_ERROR });
      });
    return () => {
      active = false;
    };
  }, [ticket.uuid]);

  const loaded = state.uuid === ticket.uuid;

  async function handlePick(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setMessage({
        type: "error",
        text: "That file type is not allowed. Use an image (PNG, JPG, GIF, WebP), a PDF or a text file.",
      });
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setMessage({
        type: "error",
        text: "That file is " + formatFileSize(file.size) + ". The limit is 5 MB.",
      });
      return;
    }

    setBusy(true);
    setMessage(null);
    const path = ticket.uuid + "/" + randomPart() + "-" + safeName(file.name);
    try {
      const upload = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type });
      if (upload.error) {
        setMessage({ type: "error", text: upload.error.message });
        setBusy(false);
        return;
      }
      const { data, error } = await supabase
        .from("ticket_attachments")
        .insert({
          ticket_id: ticket.uuid,
          file_name: file.name.slice(0, 200),
          file_path: path,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();
      if (error) {
        // The record was refused, so do not leave an orphan file behind
        await supabase.storage.from(BUCKET).remove([path]);
        setMessage({ type: "error", text: error.message });
      } else {
        setState((current) => ({
          ...current,
          files: [fromRow(data), ...current.files],
        }));
        setMessage({ type: "success", text: file.name + " attached." });
      }
    } catch (err) {
      setMessage({ type: "error", text: NETWORK_ERROR });
    }
    setBusy(false);
  }

  // Files are private. We ask Supabase for a link that works for one minute.
  async function handleOpen(file) {
    setMessage(null);
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(file.path, 60);
      if (error || !data) {
        setMessage({ type: "error", text: error ? error.message : "Could not open the file." });
        return;
      }
      window.open(data.signedUrl, "_blank", "noopener");
    } catch (err) {
      setMessage({ type: "error", text: NETWORK_ERROR });
    }
  }

  async function handleDelete(file) {
    setBusy(true);
    setMessage(null);
    try {
      const removed = await supabase.storage.from(BUCKET).remove([file.path]);
      if (removed.error) {
        setMessage({ type: "error", text: removed.error.message });
        setBusy(false);
        return;
      }
      const { error } = await supabase
        .from("ticket_attachments")
        .delete()
        .eq("id", file.id);
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setState((current) => ({
          ...current,
          files: current.files.filter((f) => f.id !== file.id),
        }));
        setMessage({ type: "success", text: file.name + " removed." });
      }
    } catch (err) {
      setMessage({ type: "error", text: NETWORK_ERROR });
    }
    setBusy(false);
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          Attachments
          {loaded && state.files.length > 0 && (
            <span className="count-pill">{state.files.length}</span>
          )}
        </h2>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => inputRef.current && inputRef.current.click()}
          disabled={busy}
        >
          <Icon name="paperclip" size={16} />
          {busy ? "Working..." : "Attach a file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          aria-label="Choose a file to attach"
          accept={ALLOWED_FILE_TYPES.join(",")}
          onChange={handlePick}
          tabIndex={-1}
        />
      </div>

      {message && (
        <div
          className={
            "alert " + (message.type === "error" ? "alert-error" : "alert-success")
          }
        >
          {message.text}
        </div>
      )}
      {state.error && <div className="alert alert-error">{state.error}</div>}

      {!loaded ? (
        <p className="empty-state">Loading attachments...</p>
      ) : state.files.length === 0 ? (
        <p className="hint">
          No files yet. A screenshot of the error often saves a lot of time. Images,
          PDFs and text files up to 5 MB.
        </p>
      ) : (
        <ul className="file-list">
          {state.files.map((f) => (
            <li key={f.id} className="file-row">
              <span className="file-icon" aria-hidden="true">
                <Icon name="paperclip" size={16} />
              </span>
              <span className="file-text">
                <button
                  type="button"
                  className="link-button file-name"
                  onClick={() => handleOpen(f)}
                >
                  {f.name}
                </button>
                <span className="file-meta">
                  {formatFileSize(f.size)} · {f.uploader} · {timeAgo(f.createdAt)}
                </span>
              </span>
              {isAdmin && (
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={"Remove " + f.name}
                  onClick={() => handleDelete(f)}
                  disabled={busy}
                >
                  <Icon name="trash" size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}