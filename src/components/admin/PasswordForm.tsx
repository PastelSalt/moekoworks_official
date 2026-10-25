"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { Check, Circle, X } from "lucide-react";
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

function RuleIcon({ state }: { state: string }) {
  const Icon = state === "ok" ? Check : state === "bad" ? X : Circle;
  return <Icon className="admin-rules__icon" size={16} strokeWidth={state === "idle" ? 2 : 3} aria-hidden />;
}

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
    <form action={action} noValidate>
      <Stack spacing={2}>
        {state?.error && <Alert severity="error">{state.error}</Alert>}
        {state?.done && <Alert severity="success">Password changed! You&apos;re signed in with the new password.</Alert>}
        <TextField
          name="currentPassword"
          label={forced ? "Current (temporary) password" : "Current password"}
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
        <TextField
          name="newPassword"
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          slotProps={{ htmlInput: { maxLength: 128 } }}
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <TextField
          name="confirmPassword"
          label="Repeat new password"
          type="password"
          autoComplete="new-password"
          required
          slotProps={{ htmlInput: { maxLength: 128 } }}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <div>
          <p className="admin-label">Your new password must</p>
          <ul className="admin-rules" aria-live="polite">
            {RULES.map((r) => (
              <li key={r.id} data-state={stateOf(r.id)}>
                <RuleIcon state={stateOf(r.id)} />
                <span>{r.text}</span>
                <span className="visually-hidden">{stateOf(r.id) === "ok" ? " (done)" : stateOf(r.id) === "bad" ? " (not yet)" : ""}</span>
              </li>
            ))}
          </ul>
        </div>
        <Button type="submit" variant="contained" size="large" disabled={pending}>
          {pending ? "Saving…" : "Change password"}
        </Button>
      </Stack>
    </form>
  );
}
