"use client";

import { useState } from "react";
import { useAssets } from "./AssetsProvider";
import { ASSET_TYPES } from "../lib/helpers";

// The first letters of the tag for each type of equipment
const PREFIXES = {
  Laptop: "LAP",
  Desktop: "DSK",
  Monitor: "MON",
  Phone: "PHN",
  Printer: "PRN",
  Other: "OTH",
};

// Suggests the next free tag, for example LAP-0008 when LAP-0007 exists
function suggestTag(type, assets) {
  const prefix = PREFIXES[type];
  let highest = 0;
  for (const a of assets) {
    const match = a.tag.match(new RegExp("^" + prefix + "-(\\d+)$"));
    if (match) highest = Math.max(highest, Number(match[1]));
  }
  return prefix + "-" + String(highest + 1).padStart(4, "0");
}

// The "Add equipment" form (admins only)
export default function AssetForm({ onCreated, onCancel }) {
  const { assets, addAsset } = useAssets();

  const [form, setForm] = useState({
    tag: suggestTag("Laptop", assets),
    type: "Laptop",
    model: "",
    serial: "",
    purchaseDate: "",
    warrantyEnd: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: value };
      // Changing the type also changes the suggested tag, unless you typed your own
      if (name === "type" && current.tag === suggestTag(current.type, assets)) {
        next.tag = suggestTag(value, assets);
      }
      return next;
    });
    setErrors((current) => ({ ...current, [name]: "" }));
    setFormError("");
  }

  function validate() {
    const found = {};
    if (form.tag.trim().length < 3) {
      found.tag = "Enter an asset tag of at least 3 characters.";
    }
    if (form.model.trim().length < 2) {
      found.model = "Enter the make and model.";
    }
    if (
      form.purchaseDate &&
      form.warrantyEnd &&
      form.warrantyEnd < form.purchaseDate
    ) {
      found.warrantyEnd = "The warranty cannot end before the purchase date.";
    }
    return found;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setSubmitting(true);
    const result = await addAsset(form);
    setSubmitting(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    if (onCreated) onCreated(result.asset);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && <div className="alert alert-error">{formError}</div>}

      <div className="form-grid">
        <div className="field">
          <label htmlFor="asset-type">Type</label>
          <select
            id="asset-type"
            name="type"
            value={form.type}
            onChange={handleChange}
          >
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="asset-tag">Asset tag</label>
          <input
            id="asset-tag"
            name="tag"
            type="text"
            placeholder="e.g. LAP-0008"
            value={form.tag}
            onChange={handleChange}
          />
          {errors.tag && <span className="field-error">{errors.tag}</span>}
        </div>

        <div className="field">
          <label htmlFor="asset-model">Make and model</label>
          <input
            id="asset-model"
            name="model"
            type="text"
            placeholder="e.g. Dell Latitude 5440"
            value={form.model}
            onChange={handleChange}
          />
          {errors.model && <span className="field-error">{errors.model}</span>}
        </div>

        <div className="field">
          <label htmlFor="asset-serial">Serial number</label>
          <input
            id="asset-serial"
            name="serial"
            type="text"
            placeholder="Printed on the device"
            value={form.serial}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label htmlFor="asset-purchase">Purchase date</label>
          <input
            id="asset-purchase"
            name="purchaseDate"
            type="date"
            value={form.purchaseDate}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label htmlFor="asset-warranty">Warranty ends</label>
          <input
            id="asset-warranty"
            name="warrantyEnd"
            type="date"
            value={form.warrantyEnd}
            onChange={handleChange}
          />
          {errors.warrantyEnd && (
            <span className="field-error">{errors.warrantyEnd}</span>
          )}
        </div>

        <div className="field field-full">
          <label htmlFor="asset-notes">Notes (optional)</label>
          <textarea
            id="asset-notes"
            name="notes"
            rows={2}
            placeholder="e.g. Spare unit for new starters"
            value={form.notes}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : "Add equipment"}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}