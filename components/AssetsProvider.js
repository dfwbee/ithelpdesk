"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

const AssetsContext = createContext(null);

const NETWORK_ERROR =
  "Could not reach Supabase. Check your internet connection and try again.";

function fromAsset(row) {
  return {
    id: row.id,
    tag: row.asset_tag,
    type: row.asset_type,
    model: row.make_model,
    serial: row.serial_number || "",
    status: row.status,
    purchaseDate: row.purchase_date,
    warrantyEnd: row.warranty_end,
    notes: row.notes || "",
    createdAt: row.created_at,
  };
}

function fromAssignment(row) {
  return {
    id: row.id,
    assetId: row.asset_id,
    holderName: row.holder_name,
    username: row.holder_username || "",
    department: row.department || "",
    userId: row.holder_user_id,
    assignedAt: row.assigned_at,
    returnedAt: row.returned_at,
    conditionNote: row.condition_note || "",
  };
}

function fromLog(row) {
  return {
    id: row.id,
    assetId: row.asset_id,
    kind: row.kind,
    description: row.description,
    doneOn: row.done_on,
    createdAt: row.created_at,
  };
}

// Turns database error codes into plain English
function friendly(error) {
  if (error.code === "23505") {
    if ((error.message || "").includes("assets_tag_unique")) {
      return "That asset tag is already in use. Choose a different tag.";
    }
    return "This equipment is already assigned. Return it first.";
  }
  return error.message;
}

async function fetchAll() {
  try {
    const [assets, assignments, logs] = await Promise.all([
      supabase.from("assets").select("*").order("asset_tag"),
      supabase
        .from("asset_assignments")
        .select("*")
        .order("assigned_at", { ascending: false }),
      supabase
        .from("maintenance_logs")
        .select("*")
        .order("done_on", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);
    const failed = assets.error || assignments.error || logs.error;
    if (failed) return { error: failed.message };
    return {
      assets: assets.data.map(fromAsset),
      assignments: assignments.data.map(fromAssignment),
      logs: logs.data.map(fromLog),
      error: "",
    };
  } catch (err) {
    return { error: NETWORK_ERROR };
  }
}

const empty = { assets: [], assignments: [], logs: [] };

export function AssetsProvider({ children }) {
  const { user, isAdmin } = useAuth();
  const userId = user ? user.id : null;

  const [store, setStore] = useState({ userId: null, ...empty, error: "" });
  // Accounts an admin can link a laptop to (admins only)
  const [accounts, setAccounts] = useState([]);

  // Load the equipment whenever a different person signs in
  useEffect(() => {
    if (!supabase || !userId) return;
    let active = true;
    fetchAll().then((result) => {
      if (!active) return;
      setStore({
        userId,
        assets: result.assets || [],
        assignments: result.assignments || [],
        logs: result.logs || [],
        error: result.error,
      });
    });
    return () => {
      active = false;
    };
  }, [userId]);

  // Admins also load the list of accounts, for the "link to an account" box
  useEffect(() => {
    if (!supabase || !userId || !isAdmin) return;
    let active = true;
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name")
      .then(({ data }) => {
        if (active && data) {
          setAccounts(
            data.map((p) => ({ id: p.id, name: p.full_name, email: p.email }))
          );
        }
      });
    return () => {
      active = false;
    };
  }, [userId, isAdmin]);

  const ready = Boolean(userId) && store.userId === userId;
  const assets = ready ? store.assets : [];
  const assignments = ready ? store.assignments : [];
  const logs = ready ? store.logs : [];
  const loadError = ready ? store.error : "";

  // ---------- Look-ups used by the pages ----------
  const assetById = (id) => assets.find((a) => a.id === id) || null;

  // The person who has the item right now (or null)
  const holderOf = (assetId) =>
    assignments.find((a) => a.assetId === assetId && !a.returnedAt) || null;

  // Everyone who has ever held it, newest first
  const historyOf = (assetId) => assignments.filter((a) => a.assetId === assetId);

  // Maintenance entries for one item, newest first
  const logsOf = (assetId) => logs.filter((l) => l.assetId === assetId);

  async function refresh() {
    const result = await fetchAll();
    setStore({
      userId,
      assets: result.assets || [],
      assignments: result.assignments || [],
      logs: result.logs || [],
      error: result.error,
    });
    return result.error;
  }

  // ---------- Changes (admins only; the database enforces this) ----------

  // Adds a new item. Returns { asset } or { error }.
  async function addAsset(data) {
    try {
      const { data: row, error } = await supabase
        .from("assets")
        .insert({
          asset_tag: data.tag.trim().toUpperCase(),
          asset_type: data.type,
          make_model: data.model.trim(),
          serial_number: data.serial.trim(),
          purchase_date: data.purchaseDate || null,
          warranty_end: data.warrantyEnd || null,
          notes: data.notes.trim(),
        })
        .select()
        .single();
      if (error) return { error: friendly(error) };
      const asset = fromAsset(row);
      setStore((current) => ({
        ...current,
        assets: [...current.assets, asset].sort((a, b) =>
          a.tag.localeCompare(b.tag)
        ),
      }));
      return { asset, error: null };
    } catch (err) {
      return { error: NETWORK_ERROR };
    }
  }

  // Changes status, warranty date or notes. Example: updateAsset(id, { status: "In repair" })
  async function updateAsset(id, changes) {
    const dbChanges = {};
    if ("status" in changes) dbChanges.status = changes.status;
    if ("warrantyEnd" in changes) dbChanges.warranty_end = changes.warrantyEnd || null;
    if ("notes" in changes) dbChanges.notes = changes.notes;
    try {
      const { data: row, error } = await supabase
        .from("assets")
        .update(dbChanges)
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) return { error: friendly(error) };
      if (!row) {
        return { error: "That change was not saved. Only admins can edit equipment." };
      }
      const updated = fromAsset(row);
      setStore((current) => ({
        ...current,
        assets: current.assets.map((a) => (a.id === id ? updated : a)),
      }));
      return { error: null };
    } catch (err) {
      return { error: NETWORK_ERROR };
    }
  }

  // Gives an item to someone. The database then marks it "Assigned" by itself.
  async function assignAsset(assetId, data) {
    try {
      const { error } = await supabase.from("asset_assignments").insert({
        asset_id: assetId,
        holder_name: data.holderName.trim(),
        holder_username: data.username.trim(),
        department: data.department,
        holder_user_id: data.accountId || null,
        condition_note: data.conditionNote.trim(),
      });
      if (error) return { error: friendly(error) };
      const loadError = await refresh();
      return { error: loadError || null };
    } catch (err) {
      return { error: NETWORK_ERROR };
    }
  }

  // Takes an item back. The database then marks it "In stock" by itself.
  async function returnAsset(assetId, conditionNote) {
    try {
      const { data: rows, error } = await supabase
        .from("asset_assignments")
        .update({
          returned_at: new Date().toISOString(),
          condition_note: conditionNote.trim(),
        })
        .eq("asset_id", assetId)
        .is("returned_at", null)
        .select();
      if (error) return { error: friendly(error) };
      if (!rows || rows.length === 0) {
        return { error: "That change was not saved. Only admins can return equipment." };
      }
      const loadError = await refresh();
      return { error: loadError || null };
    } catch (err) {
      return { error: NETWORK_ERROR };
    }
  }

  // Adds a repair, service, upgrade or inspection to an item's history
  async function addMaintenance(assetId, data) {
    try {
      const { data: row, error } = await supabase
        .from("maintenance_logs")
        .insert({
          asset_id: assetId,
          kind: data.kind,
          description: data.description.trim(),
          done_on: data.doneOn,
        })
        .select()
        .single();
      if (error) return { error: friendly(error) };
      const log = fromLog(row);
      setStore((current) => ({ ...current, logs: [log, ...current.logs] }));
      return { error: null };
    } catch (err) {
      return { error: NETWORK_ERROR };
    }
  }

  const value = {
    assets,
    assignments,
    logs,
    accounts,
    ready,
    loadError,
    refresh,
    assetById,
    holderOf,
    historyOf,
    logsOf,
    addAsset,
    updateAsset,
    assignAsset,
    returnAsset,
    addMaintenance,
  };

  return (
    <AssetsContext.Provider value={value}>{children}</AssetsContext.Provider>
  );
}

export function useAssets() {
  const context = useContext(AssetsContext);
  if (!context) {
    throw new Error("useAssets must be used inside AssetsProvider");
  }
  return context;
}