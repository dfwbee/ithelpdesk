"use client";

import Icon from "./Icons";
import { STATUSES, PRIORITIES, CATEGORIES } from "../lib/helpers";

export default function TicketFilters({ filters, onChange, onClear }) {
  function update(name, value) {
    onChange({ ...filters, [name]: value });
  }

  return (
    <div className="filters">
      <div className="field filter-search">
        <label htmlFor="search">Search</label>
        <div className="search-box">
          <Icon name="search" size={16} />
          <input
            id="search"
            type="search"
            placeholder="Search by ID, title, requester or description"
            value={filters.search}
            onChange={(event) => update("search", event.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="filter-status">Status</label>
        <select
          id="filter-status"
          value={filters.status}
          onChange={(event) => update("status", event.target.value)}
        >
          <option value="All">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="filter-priority">Priority</label>
        <select
          id="filter-priority"
          value={filters.priority}
          onChange={(event) => update("priority", event.target.value)}
        >
          <option value="All">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="filter-category">Category</label>
        <select
          id="filter-category"
          value={filters.category}
          onChange={(event) => update("category", event.target.value)}
        >
          <option value="All">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="filters-actions">
        <label className="check" htmlFor="filter-overdue">
          <input
            id="filter-overdue"
            type="checkbox"
            checked={filters.overdueOnly}
            onChange={(event) => update("overdueOnly", event.target.checked)}
          />
          Overdue only
        </label>
        <button type="button" className="btn btn-secondary" onClick={onClear}>
          Clear filters
        </button>
      </div>
    </div>
  );
}