"use client";

import { CircleAlert, Hourglass } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { loginAction, type LoginState } from "@/server/auth/actions";

/** Kotoha's sign-in form: labels above the fields, show-password, error box, "waking up" hint. */
export function LoginForm() {
  const [slow, setSlow] = useState(false);
  const [state, action, pending] = useActionState<LoginState, FormData>((prev, formData) => {
    setSlow(false);
    return loginAction(prev, formData);
  }, undefined);
  const [show, setShow] = useState(false);
  // Controlled so React's post-action form reset keeps the username (the password still clears).
  const [username, setUsername] = useState("");

  // Neon's free compute sleeps; tell the user instead of looking stuck (kotoha parity).
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => setSlow(true), 2500);
    return () => clearTimeout(t);
  }, [pending]);

  return (
    <form action={action} className="aform" noValidate>
      <div className="afield">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div className="afield">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required />
        <label className="check">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show password
        </label>
      </div>
      {state?.error ? (
        <p className="form-error" role="alert">
          <CircleAlert aria-hidden /> {state.error}
        </p>
      ) : null}
      {pending && slow ? (
        <p className="form-hint form-hint--wait" role="status">
          <Hourglass aria-hidden /> Waking up the database. The first request after a quiet period can take a few seconds…
        </p>
      ) : null}
      <button type="submit" className="abtn abtn--primary abtn--block" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
