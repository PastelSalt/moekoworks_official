"use client";

import Autocomplete from "@mui/material/Autocomplete";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { ExternalLink, Pencil, Plus, Shapes } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveTech } from "@/server/admin/catalog";
import { AdminDialog } from "./AdminDialog";
import { AdminItem } from "./AdminItem";
import { AdminPageHead } from "./AdminPageHead";
import { StateBox } from "./StateBox";
import { useToast } from "./Toast";

export type TechRow = { id: number; slug: string; name: string; category: string; iconKey: string | null; color: string | null; url: string | null; projects: number; logo?: { path: string; hex: string } | null };
const CATS = ["language", "framework", "library", "runtime", "database", "cloud", "service", "tool", "design", "platform", "other"];
type Draft = { id?: number; slug: string; name: string; category: string; iconKey: string | null; color: string; url: string };
const blank = (): Draft => ({ slug: "", name: "", category: "library", iconKey: null, color: "", url: "" });
const nice = (c: string) => c[0].toUpperCase() + c.slice(1);

/** The tech catalog the project editor and About toolbox use. Logos come from Simple Icons by key. */
export function TechManager({ rows, iconKeys }: { rows: TechRow[]; iconKeys: string[] }) {
  const router = useRouter();
  const toast = useToast();
  const [d, setD] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [cat, setCat] = useState("all");
  const [pending, start] = useTransition();
  const save = () =>
    d &&
    start(async () => {
      setError("");
      const r = await saveTech({ id: d.id, slug: d.slug, name: d.name, category: d.category as "library", iconKey: d.iconKey, color: d.color || null, url: d.url || null });
      if (!r.ok) return setError(r.error);
      toast(d.id ? "Saved!" : "Technology added ✿");
      setD(null);
      router.refresh();
    });
  const cats = CATS.filter((c) => rows.some((r) => r.category === c));
  const visible = rows.filter((r) => cat === "all" || r.category === cat);

  return (
    <>
      <AdminPageHead
        href="/admin/tech"
        hint="Every technology a project can list. Logos come from Simple Icons; without one, the colour dot is used."
        actions={
          <button type="button" className="abtn abtn--primary" onClick={() => (setError(""), setD(blank()))}>
            <Plus aria-hidden /> Add technology
          </button>
        }
      />
      <div className="atoolbar">
        <div className="segmented" role="radiogroup" aria-label="Category">
          {["all", ...cats].map((c) => (
            <label key={c} className="segmented__item">
              <input type="radio" name="tech-cat" checked={cat === c} onChange={() => setCat(c)} />
              <span>{c === "all" ? "All" : nice(c)}</span>
              <span className="segmented__count">{c === "all" ? rows.length : rows.filter((r) => r.category === c).length}</span>
            </label>
          ))}
        </div>
      </div>
      {visible.length ? (
        <div className="items items--grid">
          {visible.map((t) => (
            <AdminItem
              key={t.id}
              iconNode={
                t.logo ? (
                  <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden="true" style={{ color: t.logo.hex }}>
                    <path d={t.logo.path} fill="currentColor" />
                  </svg>
                ) : t.color ? (
                  <span className="tech-dot" style={{ background: t.color }} />
                ) : (
                  <Shapes />
                )
              }
              title={t.name}
              meta={
                <>
                  <span className="apill apill--section">{nice(t.category)}</span>
                  <span>{t.projects ? `used in ${t.projects} published project${t.projects === 1 ? "" : "s"}` : "not used yet"}</span>
                </>
              }
              text={t.url ? <span className="item__link">{t.url.replace(/^https:\/\//, "")}</span> : undefined}
              actions={
                <>
                  {t.url ? (
                    <a className="icon-btn" href={t.url} target="_blank" rel="noopener" aria-label={`${t.name} website (new tab)`}>
                      <ExternalLink aria-hidden />
                    </a>
                  ) : null}
                  <button type="button" className="abtn abtn--ghost abtn--sm" onClick={() => (setError(""), setD({ id: t.id, slug: t.slug, name: t.name, category: t.category, iconKey: t.iconKey, color: t.color ?? "", url: t.url ?? "" }))}>
                    <Pencil aria-hidden /> Edit
                  </button>
                </>
              }
            />
          ))}
        </div>
      ) : (
        <StateBox icon={Shapes}>No technologies yet.</StateBox>
      )}

      <AdminDialog
        open={d !== null}
        onClose={() => !pending && setD(null)}
        title={d?.id ? `Edit ${d.name || "technology"}` : "Add a technology"}
        actions={
          <>
            <button type="button" className="abtn abtn--ghost" disabled={pending} onClick={() => setD(null)}>
              Cancel
            </button>
            <button type="button" className="abtn abtn--primary" disabled={pending} onClick={save}>
              {pending ? "Saving…" : d?.id ? "Save" : "Add technology"}
            </button>
          </>
        }
      >
        {d ? (
          <div className="aform">
            {error ? <p className="form-error">{error}</p> : null}
            <TextField label="Name" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value, slug: d.id ? d.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })} required />
            <TextField label="Slug" value={d.slug} onChange={(e) => setD({ ...d, slug: e.target.value })} required />
            <TextField select label="Category" value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })}>
              {CATS.map((c) => (
                <MenuItem key={c} value={c}>
                  {nice(c)}
                </MenuItem>
              ))}
            </TextField>
            <Autocomplete options={iconKeys} value={d.iconKey} onChange={(_, v) => setD({ ...d, iconKey: v })} renderInput={(p) => <TextField {...p} label="Logo (Simple Icons key)" />} />
            <TextField label="Colour when there is no logo (optional)" value={d.color} onChange={(e) => setD({ ...d, color: e.target.value })} placeholder="#5D5869" />
            <TextField label="Website (https://, optional)" value={d.url} onChange={(e) => setD({ ...d, url: e.target.value })} />
          </div>
        ) : null}
      </AdminDialog>
    </>
  );
}
