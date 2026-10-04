"use client";

import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { useSyncExternalStore } from "react";

// "Don't count my visits" (plan §17.1): a flag in this browser only; the tracker then sends nothing.
const KEY = "ms_nt";
const listeners = new Set<() => void>();
const read = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export function CountMyVisits() {
  const off = useSyncExternalStore(subscribe, read, () => false);
  return (
    <FormControlLabel
      control={
        <Switch
          checked={off}
          onChange={(e) => {
            try {
              if (e.target.checked) localStorage.setItem(KEY, "1");
              else localStorage.removeItem(KEY);
            } catch {
              /* storage blocked */
            }
            listeners.forEach((l) => l());
          }}
        />
      }
      label="Don't count my visits in this browser"
    />
  );
}
