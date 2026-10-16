"use client";

import { useState } from "react";
import { useTickets } from "./TicketsProvider";
import { CATEGORIES, PRIORITIES, DEPARTMENTS } from "../lib/helpers";

// requesterName pre-fills the Requester box. lockRequester stops it being edited
// (used for regular users, who always report issues as themselves).
export default function TicketForm({
  onCreated,
  onCancel,
  requesterName = "",
  lockRequester = false,
  equipment = [],
  defaultAssetId = "",
}) {
  const { addTicket } = useTickets();

  const emptyForm = {
    title: "",
    description: "",
    category: "Software",
    priority: "Medium",
    requester: requesterName,
    department: "",
    assetId: defaultAssetId,
  };

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setFormError("");
  }

  function validate() {
    const found = {};
    if (form.title.trim().length < 5) {
      found.title = "Enter a title of at least 5 characters.";
    }
    if (form.description.trim().length < 10) {
      found.description = "Describe the problem in at least 10 characters.";
    }
    if (!form.department) {
      found.department = "Choose the department this is for.";
    }
    if (form.requester.trim().length < 2) {
      found.requester = "Enter the name of the person reporting the issue.";
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
    setFormError("");
    const result = await addTicket(form);
    setSubmitting(false);

    if (result.error) {
      setFormError(result.error);
      return;
    }

    setForm(emptyForm);
    setErrors({});
    if (onCreated) onCreated(result.ticket);
  }

  return (
    <form className="ticket-form" onSubmit={handleSubmit} noValidate>
      {formError && <div className="alert alert-error">{formError}</div>}

      <div className="form-grid">
        <div className="field field-full">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="e.g. Laptop will not connect to Wi-Fi"
            value={form.title}
            onChange={handleChange}
          />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </div>

        <div className="field field-full">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="What happened, and when did it start?"
            value={form.description}
            onChange={handleChange}
          />
          {errors.description && (
            <span className="field-error">{errors.description}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={form.priority}
            onChange={handleChange}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="field field-full">
          <label htmlFor="department">Department</label>
          <select
            id="department"
            name="department"
            value={form.department}
            onChange={handleChange}
          >
            <option value="">Choose a department</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {errors.department && (
            <span className="field-error">{errors.department}</span>
          )}
        </div>

        {equipment.length > 0 && (
          <div className="field field-full">
            <label htmlFor="assetId">Equipment this is about (optional)</label>
            <select
              id="assetId"
              name="assetId"
              value={form.assetId}
              onChange={handleChange}
            >
              <option value="">Not about a specific item</option>
              {equipment.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field field-full">
          <label htmlFor="requester">Requester</label>
          <input
            id="requester"
            name="requester"
            type="text"
            placeholder="e.g. Adaeze Okafor"
            value={form.requester}
            onChange={handleChange}
            readOnly={lockRequester}
          />
          {errors.requester && (
            <span className="field-error">{errors.requester}</span>
          )}
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Submitting..." : "Create ticket"}
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