"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

const TicketsContext = createContext(null);

const NETWORK_ERROR =
  "Could not reach Supabase. Check your internet connection and try again.";

// Turns a database row into the shape the rest of the app uses
function fromRow(row) {
  return {
    id: "TKT-" + row.ticket_number,
    number: row.ticket_number,
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority,
    status: row.status,
    requester: row.requester_name,
    createdAt: row.created_at,
    resolutionNote: row.resolution_note || "",
    resolvedAt: row.resolved_at,
    createdBy: row.created_by,
    assetId: row.asset_id || null,
  };
}

// Asks Supabase for tickets. The database decides what you are allowed to see:
// admins get every ticket, regular users get only their own.
async function fetchTickets() {
  try {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return { tickets: [], error: error.message };
    return { tickets: data.map(fromRow), error: "" };
  } catch (err) {
    return { tickets: [], error: NETWORK_ERROR };
  }
}

export function TicketsProvider({ children }) {
  const { user } = useAuth();
  const userId = user ? user.id : null;

  // Remember which person these tickets were loaded for
  const [store, setStore] = useState({ userId: null, tickets: [], error: "" });

  // Load the tickets whenever a different person signs in
  useEffect(() => {
    if (!supabase || !userId) return;
    let active = true;
    fetchTickets().then((result) => {
      if (active) {
        setStore({ userId, tickets: result.tickets, error: result.error });
      }
    });
    return () => {
      active = false;
    };
  }, [userId]);

  // Tickets only count as "ready" once they belong to the current person
  const ready = Boolean(userId) && store.userId === userId;
  const tickets = ready ? store.tickets : [];
  const loadError = ready ? store.error : "";

  // Loads the latest tickets again (used by the Refresh buttons)
  async function refresh() {
    const result = await fetchTickets();
    setStore({ userId, tickets: result.tickets, error: result.error });
    return result.error;
  }

  // Creates a ticket. Returns { ticket } or { error }.
  async function addTicket(data) {
    try {
      const { data: row, error } = await supabase
        .from("tickets")
        .insert({
          title: data.title.trim(),
          description: data.description.trim(),
          category: data.category,
          priority: data.priority,
          requester_name: data.requester.trim(),
          asset_id: data.assetId || null,
        })
        .select()
        .single();
      if (error) return { error: error.message };
      const ticket = fromRow(row);
      setStore((current) => ({
        ...current,
        userId,
        tickets: [ticket, ...current.tickets],
      }));
      return { ticket, error: null };
    } catch (err) {
      return { error: NETWORK_ERROR };
    }
  }

  // Changes one ticket (admins only).
  // Example: updateTicket("TKT-1001", { status: "Resolved" })
  async function updateTicket(id, changes) {
    const existing = tickets.find((t) => t.id === id);
    if (!existing) return { error: "Ticket not found." };

    const dbChanges = {};
    if ("status" in changes) {
      dbChanges.status = changes.status;
      // Remember when it was resolved (used for analytics later)
      dbChanges.resolved_at =
        changes.status === "Resolved" ? new Date().toISOString() : null;
    }
    if ("assetId" in changes) {
      dbChanges.asset_id = changes.assetId || null;
    }
    if ("resolutionNote" in changes) {
      dbChanges.resolution_note = changes.resolutionNote;
    }

    try {
      const { data: row, error } = await supabase
        .from("tickets")
        .update(dbChanges)
        .eq("ticket_number", existing.number)
        .select()
        .maybeSingle();
      if (error) return { error: error.message };
      // The database blocks changes from non-admins without raising an error.
      // It just updates nothing, so we check for that here.
      if (!row) {
        return { error: "That change was not saved. Only admins can edit tickets." };
      }
      const updated = fromRow(row);
      setStore((current) => ({
        ...current,
        tickets: current.tickets.map((t) => (t.id === id ? updated : t)),
      }));
      return { error: null };
    } catch (err) {
      return { error: NETWORK_ERROR };
    }
  }

  const value = {
    tickets,
    ready,
    loadError,
    refresh,
    addTicket,
    updateTicket,
  };

  return (
    <TicketsContext.Provider value={value}>{children}</TicketsContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketsContext);
  if (!context) {
    throw new Error("useTickets must be used inside TicketsProvider");
  }
  return context;
}