"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useActionState, useEffect, useState } from "react";
import { loginAction, type LoginState } from "@/server/auth/actions";

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
    <form action={action} noValidate>
      <Stack spacing={2}>
        {state?.error && <Alert severity="error">{state.error}</Alert>}
        <TextField
          name="username"
          label="Username"
          autoComplete="username"
          required
          autoFocus
          fullWidth
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
          name="password"
          label="Password"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          required
          fullWidth
        />
        <FormControlLabel
          control={<Checkbox checked={show} onChange={(e) => setShow(e.target.checked)} size="small" />}
          label="Show password"
        />
        <Button type="submit" variant="contained" size="large" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
        {pending && slow && <Alert severity="info">Waking up the database. The first request after a quiet period can take a few seconds…</Alert>}
      </Stack>
    </form>
  );
}
