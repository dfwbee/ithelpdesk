"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import Icon, { LogoMark } from "./Icons";

const adminLinks = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/tickets", label: "Tickets", icon: "tickets" },
  { href: "/assets", label: "Equipment", icon: "laptop" },
  { href: "/departments", label: "Departments", icon: "building" },
  { href: "/analytics", label: "Analytics", icon: "analytics" },
  { href: "/knowledge", label: "Knowledge Base", icon: "book" },
];

const userLinks = [
  { href: "/", label: "My tickets", icon: "tickets" },
  { href: "/knowledge", label: "Knowledge Base", icon: "book" },
];

// "Ada Lovelace" becomes "AL", "ada@test.com" becomes "A"
function initialsOf(name) {
  const words = name.split(/[\s@._-]+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, user, isAdmin, signOut } = useAuth();

  // On phones the sidebar is a menu that slides in.
  // We remember which page it was opened on, so moving to another page closes it.
  const [openOn, setOpenOn] = useState(null);
  const menuOpen = openOn === pathname;

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(event) {
      if (event.key === "Escape") setOpenOn(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Admins and regular users see different menus
  const links = isAdmin ? adminLinks : userLinks;

  // Keeps "Tickets" highlighted on /tickets and on /tickets/TKT-1001
  function isActive(href) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  // Position of the current page in the menu; the highlight slides to it
  const activeIndex = links.findIndex((link) => isActive(link.href));

  const displayName =
    (profile && profile.fullName) || (user && user.email) || "Signed in";

  return (
    <>
      <header className="topbar">
        <button
          type="button"
          className="menu-btn"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="app-sidebar"
          onClick={() => setOpenOn(pathname)}
        >
          <Icon name="menu" size={20} />
        </button>
        <div className="brand">
          <LogoMark />
          <span className="brand-name">Smart IT Helpdesk</span>
        </div>
      </header>

      <div
        className={"sidebar-overlay" + (menuOpen ? " is-visible" : "")}
        onClick={() => setOpenOn(null)}
        aria-hidden="true"
      />

      <aside
        id="app-sidebar"
        className={"sidebar" + (menuOpen ? " is-open" : "")}
      >
        <div className="sidebar-head">
          <div className="brand">
            <LogoMark />
            <div className="brand-text">
              <span className="brand-name">Smart IT Helpdesk</span>
              <span className="brand-sub">Educational prototype</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close"
            aria-label="Close menu"
            onClick={() => setOpenOn(null)}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <nav className="nav" aria-label="Main">
          {activeIndex >= 0 && (
            <span
              className="nav-indicator"
              style={{ "--i": activeIndex }}
              aria-hidden="true"
            />
          )}
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(link.href) ? "nav-link active" : "nav-link"}
              aria-current={isActive(link.href) ? "page" : undefined}
              onClick={() => setOpenOn(null)}
            >
              <Icon name={link.icon} />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="avatar" aria-hidden="true">
              {initialsOf(displayName)}
            </div>
            <div className="sidebar-user-text">
              <span className="sidebar-user-name">{displayName}</span>
              <span className="sidebar-user-role">
                {isAdmin
                  ? (profile && profile.jobTitle) || "Administrator"
                  : "User"}
              </span>
            </div>
          </div>
          <button type="button" className="btn-sidebar" onClick={signOut}>
            <Icon name="logout" size={16} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}