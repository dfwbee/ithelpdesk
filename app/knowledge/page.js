"use client";

import "../insights.css";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../components/AuthProvider";
import { articles } from "../../data/knowledgeBase";

// Category names that appear in the articles, in a fixed order
const categories = ["All", ...new Set(articles.map((a) => a.category))];

function matches(article, query) {
  if (!query) return true;
  const searchable = [
    article.title,
    article.summary,
    article.keywords.join(" "),
    article.steps.join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return searchable.includes(query);
}

export default function KnowledgePage() {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [open, setOpen] = useState({}); // which articles are expanded

  const query = search.trim().toLowerCase();
  const visible = articles.filter(
    (a) => (category === "All" || a.category === category) && matches(a, query)
  );

  function toggle(slug) {
    setOpen((current) => ({ ...current, [slug]: !current[slug] }));
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Knowledge base</h1>
        <p className="page-subtitle">
          Try these quick fixes before logging a ticket.
        </p>
      </div>

      <div className="panel kb-filters">
        <div className="field kb-search">
          <label htmlFor="kb-search">Search</label>
          <input
            id="kb-search"
            type="search"
            placeholder="e.g. printer, vpn, password"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="kb-category">Category</label>
          <select
            id="kb-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "All categories" : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="kb-count">
        {visible.length} {visible.length === 1 ? "article" : "articles"}
      </p>

      {visible.length === 0 && (
        <div className="panel">
          <p className="empty-state">
            No articles match your search. Try a different word, or log a ticket
            instead.
          </p>
        </div>
      )}

      <div className="kb-list">
        {visible.map((article) => {
          const isOpen = Boolean(open[article.slug]);
          const panelId = "kb-steps-" + article.slug;
          return (
            <article className="panel kb-article" key={article.slug}>
              <div className="kb-head">
                <h2 className="kb-title">{article.title}</h2>
                <span className="badge badge-user">{article.category}</span>
              </div>
              <p className="kb-summary">{article.summary}</p>

              <button
                type="button"
                className="btn btn-secondary kb-toggle"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(article.slug)}
              >
                {isOpen ? "Hide steps" : "Show steps"}
              </button>

              {isOpen && (
                <div id={panelId} className="kb-body">
                  <ol className="kb-steps">
                    {article.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  <p className="kb-escalate">{article.escalate}</p>
                  <Link
                    href={isAdmin ? "/tickets" : "/"}
                    className="link-action"
                  >
                    {isAdmin ? "Create a ticket" : "Submit a ticket"}
                  </Link>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}