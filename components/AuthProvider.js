"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const AuthContext = createContext(null);

const NETWORK_ERROR =
  "Could not reach Supabase. Check your internet connection and your .env.local values.";

export function AuthProvider({ children }) {
  // status is "loading" (checking), "signedOut" or "signedIn"
  const [auth, setAuth] = useState({
    status: isSupabaseConfigured ? "loading" : "signedOut",
    user: null,
    profile: null,
  });

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    // Reads this person's name and role from the profiles table
    async function loadProfile(user) {
      let data = null;
      try {
        const result = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .maybeSingle();
        data = result.data;
      } catch (error) {
        data = null;
      }
      if (!active) return;
      setAuth({
        status: "signedIn",
        user,
        profile: {
          fullName: (data && data.full_name) || "",
          // If the profile cannot be read, treat the person as a regular user
          role: (data && data.role) || "user",
        },
      });
    }

    // Supabase tells us whenever someone signs in, signs out or the page reloads
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        setAuth({ status: "signedOut", user: null, profile: null });
        return;
      }
      // Supabase asks us not to call it again from inside this callback,
      // so we wait one tick before loading the profile.
      setTimeout(() => loadProfile(session.user), 0);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email, password) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      return { error: error ? error.message : null };
    } catch (err) {
      return { error: NETWORK_ERROR };
    }
  }

  async function signUp(fullName, email, password) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (error) return { error: error.message, needsConfirmation: false };
      // No session means Supabase is waiting for the email to be confirmed
      return { error: null, needsConfirmation: !data.session };
    } catch (err) {
      return { error: NETWORK_ERROR, needsConfirmation: false };
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // Nothing to do. The listener above handles the rest.
    }
  }

  const value = {
    status: auth.status,
    user: auth.user,
    profile: auth.profile,
    isAdmin: Boolean(auth.profile && auth.profile.role === "admin"),
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}