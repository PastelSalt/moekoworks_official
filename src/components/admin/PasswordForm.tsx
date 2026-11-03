"use client";

import { Check, CircleAlert, CircleCheck, X } from "lucide-react";
import { useActionState, useState } from "react";
import { changePasswordAction, type PasswordState } from "@/server/auth/actions";
import type { PasswordRule } from "@/server/auth/password";

type Rule = PasswordRule | "mismatch";
const RULES: { id: Rule; text: string }[] = [
  { id: "min_length", text: "Have at least 12 characters (a few words together works great)" },
  { id: "contains_username", text: "Not contain your username" },
  { id: "same_as_current", text: "Be different from the current password" },
  { id: "guessable", text: "Not be only site words like moeko, flower or password" },
  { id: "leaked", text: "Not appear in known data leaks" },
  { id: "mismatch", text: "Match in both boxes" },
];

// The live rules checklist from kotoha's password form; the last two server-only rules are confirmed on submit.
export function PasswordForm({ username, forced = false }: { username: string; forced?: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, action, pending] = useActionState<PasswordState, FormData>(async (prev, formData) => {
    const result = await changePasswordAction(prev, formData);
    if (result?.done) {
      setCurrent("");
      setNext("");
      setConfirm("");
    }
    return result;
  }, undefined);

  const live: Partial<Record<Rule, boolean>> = next
    ? {
        min_length: next.length >= 12 && next.length <= 128,
        contains_username: !next.toLowerCase().includes(username.toLowerCase()),
        same_as_current: !current || next !== current,
        mismatch: confirm ? next === confirm : undefined,
      }
    : {};
  for (const r of state?.failed ?? []) live[r] = false;
  const stateOf = (r: Rule) => (live[r] === true ? "ok" : live[r] === false ? "bad" : "idle");

  return (
    <form action={action} className="aform" noValidate>
      {state?.error ? (
        <p className="form-error" role="alert">
          <CircleAlert aria-hidden /> {state.error}
        </p>
      ) : null}
      {state?.done ? (
        <p className="form-ok" role="status">
          <CircleCheck aria-hidden /> Password changed! You&apos;re signed in with the new password.
        </p>
      ) : null}
      <div className="afield">
        <label htmlFor="pw-current">{forced ? "Current (temporary) password" : "Current password"}</label>
        <input id="pw-current" name="currentPassword" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div className="afield">
        <label htmlFor="pw-new">New password</label>
        <input id="pw-new" name="newPassword" type="password" autoComplete="new-password" required maxLength={128} value={next} onChange={(e) => setNext(e.target.value)} />
      </div>
      <div className="afield">
        <label htmlFor="pw-confirm">Repeat new password</label>
        <input id="pw-confirm" name="confirmPassword" type="password" autoComplete="new-password" required maxLength={128} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      <div>
        <p className="afield__label">Your new password must</p>
        <ul className="rules" aria-live="polite">
          {RULES.map((r) => {
            const st = stateOf(r.id);
            return (
              <li key={r.id} className={st}>
                <span className="rules__mark" aria-hidden="true">
                  {st === "ok" ? <Check /> : st === "bad" ? <X /> : null}
                </span>
                <span>{r.text}</span>
                <span className="visually-hidden">{st === "ok" ? " (done)" : st === "bad" ? " (not yet)" : ""}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <button type="submit" className="abtn abtn--primary abtn--block" disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
