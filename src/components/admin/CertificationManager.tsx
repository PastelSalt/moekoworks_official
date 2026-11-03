"use client";

import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { Archive, ArchiveRestore, Award, Eye, EyeOff, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cldImage } from "@/lib/cloudinary";
import { saveCertification } from "@/server/admin/catalog";
import { addMedia } from "@/server/admin/projects";
import { AdminDialog } from "./AdminDialog";
import { AdminItem } from "./AdminItem";
import { AdminPageHead } from "./AdminPageHead";
import { ConfirmButton } from "./ConfirmButton";
import { StateBox } from "./StateBox";
import { useToast } from "./Toast";
import { Uploader } from "./Uploader";

export type CertRow = { id: number; title: string; obtainedOn: string; status: string; mediaId: number; publicId: string; altText: string | null };
type Draft = { id?: number; title: string; obtainedOn: string; status: string; mediaId?: number; publicId?: string; altText: string };
type Status = "published" | "draft" | "archived";

const blank = (): Draft => ({ title: "", obtainedOn: "", status: "published", altText: "" });
// Same rule as the public About page: titles starting with "Grades" are term grade reports.
const isGrades = (t: string) => /^Grades\b/.test(t);
const STATUS_LABEL: Record<string, string> = { published: "Shown", draft: "Hidden", archived: "Archived" };

/** Certifications (plan §11.6): image + title + date obtained. Kotoha layout: list with row actions, form in a dialog. */
export function CertificationManager({ rows, uploads }: { rows: CertRow[]; uploads: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [kind, setKind] = useState<"both" | "certs" | "grades">("both");
  const [pending, start] = useTransition();

  const save = (d: Draft) =>
    start(async () => {
      setError("");
      const r = await saveCertification({ id: d.id, title: d.title, obtainedOn: d.obtainedOn, mediaId: d.mediaId as number, altText: d.altText, status: d.status as Status });
      if (!r.ok) return setError(r.error);
      toast(d.id ? "Saved!" : "Certification added ✿");
      setDraft(null);
      router.refresh();
    });
  // Status-only change from the list: same action, the row's own values, alt text untouched.
  const setRowStatus = (c: CertRow, next: Status, done: string) =>
    new Promise<boolean>((resolve) =>
      start(async () => {
        const r = await saveCertification({ id: c.id, title: c.title, obtainedOn: c.obtainedOn, mediaId: c.mediaId, status: next });
        if (!r.ok) {
          toast(r.error, "error");
          return resolve(false);
        }
        toast(done);
        router.refresh();
        resolve(true);
      }),
    );
  const edit = (c: CertRow) => {
    setError("");
    setDraft({ id: c.id, title: c.title, obtainedOn: c.obtainedOn, status: c.status, mediaId: c.mediaId, publicId: c.publicId, altText: c.altText ?? "" });
  };

  const visible = rows.filter((c) => (status === "all" ? c.status !== "archived" : c.status === status) && (kind === "both" || (kind === "grades") === isGrades(c.title)));
  const count = (s: "all" | Status) => rows.filter((c) => (s === "all" ? c.status !== "archived" : c.status === s)).length;
  const groups = [
    { title: "Certificates", rows: visible.filter((c) => !isGrades(c.title)) },
    { title: "Grade reports", rows: visible.filter((c) => isGrades(c.title)) },
  ].filter((g) => g.rows.length);

  return (
    <>
      <AdminPageHead
        href="/admin/certifications"
        hint="Shown in the About page's Certifications. Titles starting with “Grades:” are term grade reports."
        actions={
          <button type="button" className="abtn abtn--primary" onClick={() => (setError(""), setDraft(blank()))}>
            <Plus aria-hidden /> Add certification
          </button>
        }
      />
      <div className="atoolbar">
        <div className="segmented" role="radiogroup" aria-label="Status">
          {(["all", "published", "draft", "archived"] as const).map((s) => (
            <label key={s} className="segmented__item">
              <input type="radio" name="cert-status" checked={status === s} onChange={() => setStatus(s)} />
              <span>{s === "all" ? "All" : STATUS_LABEL[s]}</span>
              <span className="segmented__count">{count(s)}</span>
            </label>
          ))}
        </div>
        <div className="segmented" role="radiogroup" aria-label="Kind">
          {(
            [
              ["both", "Both"],
              ["certs", "Certificates"],
              ["grades", "Grade reports"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="segmented__item">
              <input type="radio" name="cert-kind" checked={kind === k} onChange={() => setKind(k)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {groups.length ? (
        groups.map((g) => (
          <section key={g.title} aria-label={g.title}>
            <h3 className="group-title">
              <span>
                {g.title} · {g.rows.length}
              </span>
            </h3>
            <div className="items">
              {g.rows.map((c) => (
                <AdminItem
                  key={c.id}
                  thumb={cldImage(c.publicId, { w: 360 })}
                  thumbShape="card"
                  draft={c.status === "draft"}
                  muted={c.status === "archived"}
                  title={c.title}
                  meta={
                    <>
                      <span className="item__date">{c.obtainedOn.replaceAll("-", ".")}</span>
                      <span className={`apill apill--${c.status}`}>{STATUS_LABEL[c.status] ?? c.status}</span>
                    </>
                  }
                  actions={
                    <>
                      <button type="button" className="abtn abtn--ghost abtn--sm" onClick={() => edit(c)}>
                        <Pencil aria-hidden /> Edit
                      </button>
                      {c.status === "archived" ? (
                        <button type="button" className="abtn abtn--ghost abtn--sm" disabled={pending} onClick={() => setRowStatus(c, "draft", "Restored (hidden) ✿")}>
                          <ArchiveRestore aria-hidden /> Restore
                        </button>
                      ) : (
                        <>
                          {c.status === "published" ? (
                            <button type="button" className="abtn abtn--ghost abtn--sm" disabled={pending} onClick={() => setRowStatus(c, "draft", "Hidden from About")}>
                              <EyeOff aria-hidden /> Hide
                            </button>
                          ) : (
                            <button type="button" className="abtn abtn--ghost abtn--sm" disabled={pending} onClick={() => setRowStatus(c, "published", "Shown on About ✿")}>
                              <Eye aria-hidden /> Show
                            </button>
                          )}
                          <ConfirmButton
                            className="abtn abtn--danger-ghost abtn--sm"
                            title="Move to the archive?"
                            message={`“${c.title}” will leave the About page. You can restore it from the Archive at any time.`}
                            confirmLabel="Move to archive"
                            danger
                            disabled={pending}
                            run={() => setRowStatus(c, "archived", "Moved to the archive")}
                          >
                            <Archive aria-hidden /> Archive
                          </ConfirmButton>
                        </>
                      )}
                    </>
                  }
                />
              ))}
            </div>
          </section>
        ))
      ) : (
        <StateBox icon={Award}>Nothing here yet.</StateBox>
      )}

      <AdminDialog
        open={draft !== null}
        onClose={() => !pending && setDraft(null)}
        title={draft?.id ? "Edit certification" : "Add a certification"}
        wide
        actions={
          <>
            <button type="button" className="abtn abtn--ghost" disabled={pending} onClick={() => setDraft(null)}>
              Cancel
            </button>
            <button type="button" className="abtn abtn--primary" disabled={pending || !draft} onClick={() => draft && save(draft)}>
              {pending ? "Saving…" : draft?.id ? "Save" : "Add certification"}
            </button>
          </>
        }
      >
        {draft ? (
          <div className="certform">
            {error ? <p className="form-error">{error}</p> : null}
            <div className="certform__image" style={draft.publicId ? { backgroundImage: `url(${cldImage(draft.publicId, { w: 480 })})` } : undefined}>
              {!draft.publicId ? <span>Certificate image</span> : null}
            </div>
            <div className="certform__fields">
              {!uploads ? <p className="note-box">Uploads are off until CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are set.</p> : null}
              <Uploader
                kind="image"
                scope="certifications"
                label={draft.publicId ? "Replace image" : "Upload image"}
                disabled={!uploads}
                onUploaded={async (u) => {
                  const row = await addMedia(null, u, "certificate");
                  if (row) setDraft((d) => (d ? { ...d, mediaId: row.id, publicId: row.publicId } : d));
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
            </div>
          </div>
        ) : null}
      </AdminDialog>
    </>
  );
}
