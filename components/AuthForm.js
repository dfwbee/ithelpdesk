"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { LogoMark } from "./Icons";

// One form used for both pages: <AuthForm mode="login" /> or mode="signup"
export default function AuthForm({ mode }) {
  const { signIn, signUp } = useAuth();
  const isSignup = mode === "signup";

  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setFormError("");
  }

  function validate() {
    const found = {};
    if (isSignup && form.fullName.trim().length < 2) {
      found.fullName = "Enter your full name.";
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      found.email = "Enter a valid email address.";
    }
    if (form.password.length < 6) {
      found.password = "Use a password of at least 6 characters.";
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
    setNotice("");

    if (isSignup) {
      const result = await signUp(form.fullName, form.email, form.password);
      if (result.error) {
        setFormError(result.error);
      } else if (result.needsConfirmation) {
        setNotice(
          "Account created. Check your email and confirm your address, then sign in."
        );
      }
      // When no confirmation is needed, the app signs you in and redirects.
    } else {
      const result = await signIn(form.email, form.password);
      if (result.error) setFormError(result.error);
    }

    setSubmitting(false);
  }

  return (
    <div className="auth-card">
      <div className="brand auth-brand">
        <LogoMark />
        <span className="brand-name">Smart IT Helpdesk</span>
      </div>
    

      <h1 className="auth-title">
        {isSignup ? "Create your account" : "Sign in"}
      </h1>
      <p className="auth-sub">
        {isSignup
          ? "Sign up to log and follow your IT support requests."
          : "Sign in to log tickets or manage them."}
      </p>

      {formError && <div className="alert alert-error">{formError}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <form onSubmit={handleSubmit} noValidate>
        {isSignup && (
          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="e.g. Adaeze Okafor"
              value={form.fullName}
              onChange={handleChange}
            />
            {errors.fullName && (
              <span className="field-error">{errors.fullName}</span>
            )}
          </div>
        )}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={handleChange}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder="At least 6 characters"
            value={form.password}
            onChange={handleChange}
          />
          {errors.password && (
            <span className="field-error">{errors.password}</span>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary auth-submit"
          disabled={submitting}
        >
          {submitting
            ? "Please wait..."
            : isSignup
            ? "Create account"
            : "Sign in"}
        </button>
      </form>

      <p className="auth-switch">
        {isSignup ? (
          <>
            Already have an account? <Link href="/login">Sign in</Link>
          </>
        ) : (
          <>
            New here? <Link href="/signup">Create an account</Link>
          </>
        )}
      </p>

    
    </div>
  );
}