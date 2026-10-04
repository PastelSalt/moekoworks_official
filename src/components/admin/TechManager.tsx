"use client";

import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveTech } from "@/server/admin/catalog";

export type TechRow = { id: number; slug: string; name: string; category: string; iconKey: string | null; color: string | null; url: string | null; projects: number };
const CATS = ["language", "framework", "library", "runtime", "database", "cloud", "service", "tool", "design", "platform", "other"];
type Draft = { id?: number; slug: string; name: string; category: string; iconKey: string | null; color: string; url: string };
const blank = (): Draft => ({ slug: "", name: "", category: "library", iconKey: null, color: "", url: "" });

/** The tech catalog the project editor and About toolbox use. Logos come from Simple Icons by key. */
export function TechManager({ rows, iconKeys }: { rows: TechRow[]; iconKeys: string[] }) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(blank());
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const save = () =>
    start(async () => {
      setError("");
      const r = await saveTech({ id: d.id, slug: d.slug, name: d.name, category: d.category as "library", iconKey: d.iconKey, color: d.color || null, url: d.url || null });
      if (!r.ok) return setError(r.error);
      setD(blank());
      router.refresh();
    });
  return (
    <>
      <Paper elevation={0} className="ed-section" sx={{ boxShadow: "var(--shadow-paper)" }}>
        <p className="admin-label">{d.id ? `Edit ${d.name}` : "Add a technology"}</p>
        {error ? (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        ) : null}
        <div className="ed-row">
          <TextField size="small" label="Name" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value, slug: d.id ? d.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })} />
          <TextField size="small" label="Slug" value={d.slug} onChange={(e) => setD({ ...d, slug: e.target.value })} />
          <TextField select size="small" label="Category" value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })} sx={{ minWidth: 150 }}>
            {CATS.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
          <Autocomplete size="small" options={iconKeys} value={d.iconKey} onChange={(_, v) => setD({ ...d, iconKey: v })} renderInput={(p) => <TextField {...p} label="Logo (Simple Icons)" />} sx={{ minWidth: 200 }} />
          <TextField size="small" label="Colour (no logo)" value={d.color} onChange={(e) => setD({ ...d, color: e.target.value })} placeholder="#5D5869" />
          <TextField size="small" label="Website (https://)" value={d.url} onChange={(e) => setD({ ...d, url: e.target.value })} sx={{ flex: 1 }} />
          <Button variant="contained" disabled={pending} onClick={save}>
            {d.id ? "Save" : "Add"}
          </Button>
          {d.id ? (
            <Button color="inherit" onClick={() => setD(blank())}>
              Cancel
            </Button>
          ) : null}
        </div>
      </Paper>
      <Paper elevation={0} sx={{ boxShadow: "var(--shadow-paper)", overflow: "hidden" }}>
        <table className="stable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Logo</th>
              <th>Projects</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>
                  <strong>{t.name}</strong> <span className="ed-hint">{t.slug}</span>
                </td>
                <td>{t.category}</td>
                <td>{t.iconKey ?? (t.color ? <span style={{ color: t.color }}>● {t.color}</span> : "—")}</td>
                <td>{t.projects}</td>
                <td>
                  <Button size="small" onClick={() => setD({ id: t.id, slug: t.slug, name: t.name, category: t.category, iconKey: t.iconKey, color: t.color ?? "", url: t.url ?? "" })}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Paper>
    </>
  );
}
