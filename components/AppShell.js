"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import Sidebar from "./Sidebar";
import { Backdrop, AuthAside } from "./Visuals";
import { isSupabaseConfigured } from "../lib/supabase";

const PUBLIC_PATHS = ["/login", "/signup"];

// Elements that get a soft glow following the mouse (see polish.css)
const GLOW_TARGETS = ".stat-card, .chart-panel, .kb-article, .hero";

// Shown until .env.local has been filled in
function SetupNotice() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Connect Supabase</h1>
        <p className="auth-sub">
          The app cannot find your Supabase settings yet.
        </p>
        <ol className="setup-steps">
          <li>
            In your project root (next to <code>package.json</code>), create a
            file named <code>.env.local</code>.
          </li>
          <li>
            Add these two lines with your own values from Supabase, under
            Project Settings, API:
            <pre>
              {"NEXT_PUBLIC_SUPABASE_URL=your-project-url\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"}
            </pre>
          </li>
          <li>
            Stop the server with Ctrl+C and run <code>npm run dev</code> again.
            Changes to this file only load on restart.
          </li>
        </ol>
      </div>
    </div>
  );
}

// Decides what to show: the setup notice, the login pages, or the real app.
export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useAuth();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  // Sends signed-out visitors to /login and signed-in visitors away from it
  useEffect(() => {
    if (!isSupabaseConfigured || status === "loading") return;
    if (status === "signedOut" && !isPublic) router.replace("/login");
    if (status === "signedIn" && isPublic) router.replace("/");
  }, [status, isPublic, router]);

  // Tells the CSS where the mouse is inside a card, so the glow can follow it
  useEffect(() => {
    function follow(event) {
      const card = event.target.closest && event.target.closest(GLOW_TARGETS);
      if (!card) return;
      const box = card.getBoundingClientRect();
      card.style.setProperty("--mx", event.clientX - box.left + "px");
      card.style.setProperty("--my", event.clientY - box.top + "px");
    }
    document.addEventListener("pointermove", follow);
    return () => document.removeEventListener("pointermove", follow);
  }, []);

  if (!isSupabaseConfigured) return <SetupNotice />;

  if (status === "loading") {
    return (
      <div className="auth-page">
        <p className="empty-state">Loading...</p>
      </div>
    );
  }

  if (isPublic) {
    if (status === "signedIn") {
      return (
        <div className="auth-page">
          <p className="empty-state">Signing you in...</p>
        </div>
      );
    }
    return (
      <div className="auth-page auth-split">
        <AuthAside />
        <div className="auth-main">
          <Backdrop />
          {children}
        </div>
      </div>
    );
  }

  // From here on the page is private. Nothing is shown until we know who you are.
  if (status === "signedOut") {
    return (
      <div className="auth-page">
        <p className="empty-state">Redirecting to sign in...</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Backdrop />
      <Sidebar />
      <main className="main">{children}</main>
    </div>
  );
}