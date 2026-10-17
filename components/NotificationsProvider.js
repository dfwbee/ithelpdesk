"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

// Holds the notifications for the signed-in person (the bell).
// The database creates them automatically (new ticket, assignment, reply...),
// and its security rules mean you only ever get your own.
// We check for new ones every 30 seconds and whenever you come back to the tab.

const NotificationsContext = createContext(null);

const CHECK_EVERY_MS = 30000;

function fromRow(row) {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    kind: row.kind,
    message: row.message,
    read: row.read,
    createdAt: row.created_at,
  };
}

async function fetchNotifications() {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) return null;
    return data.map(fromRow);
  } catch (err) {
    return null;
  }
}

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const userId = user ? user.id : null;
  const [store, setStore] = useState({ userId: null, items: [] });

  // Load now, then keep checking while the page is open
  useEffect(() => {
    if (!supabase || !userId) return;
    let active = true;

    function load() {
      fetchNotifications().then((items) => {
        // null means "could not reach the database": keep what we have
        if (active && items) setStore({ userId, items });
      });
    }

    load();
    const timer = setInterval(load, CHECK_EVERY_MS);
    function onVisible() {
      if (document.visibilityState === "visible") load();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId]);

  const ready = Boolean(userId) && store.userId === userId;
  const items = ready ? store.items : [];
  const unread = items.filter((n) => !n.read).length;

  async function refresh() {
    const next = await fetchNotifications();
    if (next) setStore({ userId, items: next });
  }

  // Marks one notification as read
  async function markRead(id) {
    setStore((current) => ({
      ...current,
      items: current.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
    try {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
    } catch (err) {
      // The next check will bring the real state back
    }
  }

  async function markAllRead() {
    setStore((current) => ({
      ...current,
      items: current.items.map((n) => ({ ...n, read: true })),
    }));
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false);
    } catch (err) {
      // The next check will bring the real state back
    }
  }

  async function clearAll() {
    setStore((current) => ({ ...current, items: [] }));
    try {
      await supabase.from("notifications").delete().eq("user_id", userId);
    } catch (err) {
      // The next check will bring the real state back
    }
  }

  const value = { items, unread, ready, refresh, markRead, markAllRead, clearAll };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used inside NotificationsProvider");
  }
  return context;
}