"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cldImage } from "@/lib/cloudinary";
import { saveCertification } from "@/server/admin/catalog";
import { addMedia } from "@/server/admin/projects";
import { StateBox } from "./StateBox";
import { Uploader } from "./Uploader";

export type CertRow = { id: number; title: string; obtainedOn: string; status: string; mediaId: number; publicId: string; altText: string | null };
type Draft = { id?: number; title: string; obtainedOn: string; status: string; mediaId?: number; publicId?: string; altText: string };

const blank = (): Draft => ({ title: "", obtainedOn: "", status: "published", altText: "" });

/** Certifications: exactly image + title + date obtained (plan §11.6). Archive instead of delete. */
export function CertificationManager({ rows, uploads }: { rows: CertRow[]; uploads: boolean }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(blank());
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const save = (d: Draft) =>
    start(async () => {
      setError("");
      const r = await saveCertification({ id: d.id, title: d.title, obtainedOn: d.obtainedOn, mediaId: d.mediaId as number, altText: d.altText, status: d.status as "published" });
      if (!r.ok) return setError(r.error);
      setDraft(blank());
      router.refresh();
    });

  // Same rule as the public About page: titles starting with "Grades" are term grade reports.
  const isGrades = (t: string) => /^Grades\b/.test(t);
  const groups = [
    { title: "Certificates", rows: rows.filter((c) => !isGrades(c.title)) },
    { title: "Grade reports", rows: rows.filter((c) => isGrades(c.title)) },
  ];

  return (
    <div className="certman">
      <Paper elevation={0} className="ed-section">
        <p className="admin-label">{draft.id ? "Edit certification" : "Add a certification"}</p>
        {error ? (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        ) : null}
        <div className="certman__form">
          <div className="certman__image" style={draft.publicId ? { backgroundImage: `url(${cldImage(draft.publicId, { w: 480 })})` } : undefined}>
            {!draft.publicId ? <span>Certificate image</span> : null}
          </div>
          <div className="certman__fields">
            {!uploads ? <Alert severity="warning">Uploads are off until CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are set.</Alert> : null}
            <Uploader
              kind="image"
              scope="certifications"
              label={draft.publicId ? "Replace image" : "Upload image"}
              disabled={!uploads}
              onUploaded={async (u) => {
                const row = await addMedia(null, u, "certificate");
                if (row) setDraft((d) => ({ ...d, mediaId: row.id, publicId: row.publicId }));
              }}
            />
            <TextField label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required slotProps={{ htmlInput: { maxLength: 120 } }} />
            <TextField type="date" label="Date obtained" value={draft.obtainedOn} onChange={(e) => setDraft({ ...draft, obtainedOn: e.target.value })} required slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Alt text (optional)" value={draft.altText} onChange={(e) => setDraft({ ...draft, altText: e.target.value })} helperText="Defaults to “Certificate: <title>”" />
            <TextField select label="Visibility" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
              <MenuItem value="published">Shown on About</MenuItem>
              <MenuItem value="draft">Hidden (draft)</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </TextField>
            <div className="ed-row">
              <Button variant="contained" disabled={pending} onClick={() => save(draft)}>
                {draft.id ? "Save changes" : "Add certification"}
              </Button>
              {draft.id ? (
                <Button color="inherit" onClick={() => setDraft(blank())}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </Paper>

      {groups.map((g) => (
        <section key={g.title} className="certman__group" aria-label={g.title}>
          <h2 className="sgroup__title">
            {g.title} <span>{g.rows.length}</span>
          </h2>
          {g.rows.length ? (
            <ul className="certman__list">
              {g.rows.map((c) => (
                <li key={c.id}>
                  <Paper elevation={0} className="certman__card" data-editing={draft.id === c.id ? "1" : undefined}>
                    <span className="certman__thumb" style={{ backgroundImage: `url(${cldImage(c.publicId, { w: 360 })})` }} />
                    <div>
                      <strong>{c.title}</strong>
                      <p className="ed-hint">
                        {c.obtainedOn} · <span className={`apill apill--${c.status === "published" ? "shown" : c.status}`}>{c.status === "published" ? "Shown" : c.status === "draft" ? "Hidden" : "Archived"}</span>
                      </p>
                    </div>
                    <Button size="small" onClick={() => (setDraft({ id: c.id, title: c.title, obtainedOn: c.obtainedOn, status: c.status, mediaId: c.mediaId, publicId: c.publicId, altText: c.altText ?? "" }), window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }))}>
                      Edit
                    </Button>
                  </Paper>
                </li>
              ))}
            </ul>
          ) : (
            <StateBox small icon={Award}>None yet.</StateBox>
          )}
        </section>
      ))}
    </div>
  );
}
