"use client";

import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Radio from "@mui/material/Radio";
import TextField from "@mui/material/TextField";
import { AlignLeft, Archive, ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff, FileText, Images, Link2, ListChecks, Plus, Save, Shapes, Trash2, Users, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState, useTransition } from "react";
import { cldImage, cldVideo } from "@/lib/cloudinary";
import { strongOf } from "@/lib/color";
import { flowerBurst } from "@/lib/confetti";
import { Markdown } from "@/lib/markdown";
import { OP_ICONS } from "@/lib/op-icons";
import { addMedia, type ProjectInputT, removeMedia, saveProject, setProjectStatus } from "@/server/admin/projects";
import { ConfirmButton } from "./ConfirmButton";
import { useToast } from "./Toast";
import { Uploader } from "./Uploader";

export type EditorMedia = { id: number; kind: string; role: string; frame: string; altText: string | null; caption: string | null; publicId: string; width: number | null; height: number | null };
export type EditorData = { id: number; status: string; publishedAt: string | null; input: ProjectInputT; media: EditorMedia[]; catalog: { id: number; name: string; category: string }[]; uploads: boolean };

const CATEGORIES = [["web", "Web platform"], ["mobile", "Mobile app"], ["desktop", "Desktop app"], ["game", "Game"], ["tool", "Tool"], ["research", "Research"], ["concept", "Concept"], ["other", "Other"]];
const LIFECYCLES = [["live", "Live"], ["beta", "Beta"], ["in_development", "In development"], ["completed", "Completed"], ["delivered", "Delivered"], ["research", "Research"], ["concept", "Concept"], ["archived", "Archived"]];
const PLATFORMS = [["web", "Web"], ["android", "Android"], ["ios", "iOS"], ["windows", "Windows"], ["macos", "macOS"], ["linux", "Linux"]];
const LINK_KINDS = [["live", "Visit website"], ["apk", "Download APK"], ["play_store", "Google Play"], ["app_store", "App Store"], ["ios", "iOS app"], ["exe", "Windows (EXE)"], ["msi", "Windows (MSI)"], ["dmg", "macOS (DMG)"], ["appimage", "Linux (AppImage)"], ["docs", "Documentation"], ["paper", "Paper"], ["demo_video", "Demo video"], ["other", "Other"]];
const FRAMES = [["auto", "Auto"], ["browser", "Browser"], ["phone", "Phone"], ["tablet", "Tablet"], ["window", "Window"], ["none", "No frame"]];
const AUDIENCES = [["visitor", "What you can do (visitors)"], ["admin", "For admins"], ["system", "Behind the scenes"]];

function move<T>(list: T[], i: number, d: number) {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

const SECTIONS: [string, string, LucideIcon][] = [
  ["ed-basics", "Basics", FileText],
  ["ed-media", "Media", Images],
  ["ed-links", "Links", Link2],
  ["ed-tech", "Tech", Shapes],
  ["ed-description", "Description", AlignLeft],
  ["ed-operations", "Operations", ListChecks],
  ["ed-credits", "Credits & SEO", Users],
];

function Section({ id, no, title, children, hint }: { id: string; no: string; title: string; children: ReactNode; hint?: string }) {
  const Icon = SECTIONS.find(([sid]) => sid === id)?.[2] ?? FileText;
  return (
    <section id={id} aria-label={title} className="panel ed-section">
      <h2>
        <Icon aria-hidden />
        <span>{title}</span>
        <span className="ed-section__no">{no}</span>
      </h2>
      {hint ? <p className="ed-hint">{hint}</p> : null}
      {children}
    </section>
  );
}

const sel = (options: string[][]) => options.map(([v, l]) => (
  <MenuItem key={v} value={v}>
    {l}
  </MenuItem>
));

/** Project History editor (plan §11.2). Everything saves together; uploads register immediately. */
export function ProjectEditor({ data }: { data: EditorData }) {
  const router = useRouter();
  const toast = useToast();
  const [p, setP] = useState(data.input);
  const [media, setMedia] = useState(data.media);
  const [status, setStatus] = useState(data.status);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [pending, start] = useTransition();
  const set = <K extends keyof ProjectInputT>(k: K, v: ProjectInputT[K]) => setP((x) => ({ ...x, [k]: v }));
  const scope = `projects/${data.input.slug}`;
  const accentOk = p.accentColor && /^#[0-9a-f]{6}$/i.test(p.accentColor);

  const payload = (): ProjectInputT => ({ ...p, media: media.map((m) => ({ id: m.id, role: m.role as "gallery", frame: m.frame as "auto", altText: m.altText, caption: m.caption })) });
  const save = (then?: () => Promise<void>) =>
    start(async () => {
      setError("");
      const r = await saveProject(data.id, payload());
      if (!r.ok) return setError(r.error);
      if (then) await then();
      else toast("Saved!");
      router.refresh();
    });
  const changeStatus = (next: "draft" | "published" | "archived") =>
    save(async () => {
      const r = await setProjectStatus(data.id, next);
      if (!r.ok) return setError(r.error);
      setStatus(next);
      toast(next === "published" ? "Published! ✿" : next === "archived" ? "Moved to the archive" : "Moved back to drafts");
      if (next === "published") flowerBurst();
    });
  const uploaded = (role: string) => async (u: Parameters<typeof addMedia>[1]) => {
    const row = await addMedia(data.id, u, role);
    if (row) setMedia((m) => [...m, { id: row.id, kind: row.kind, role: row.role, frame: row.frame, altText: row.altText, caption: row.caption, publicId: row.publicId, width: row.width, height: row.height }]);
  };
  const editMedia = (id: number, patch: Partial<EditorMedia>) => setMedia((m) => m.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  return (
    <div className="editor">
      <div className="ed-bar">
        <span className={`apill apill--${status}`}>{status === "published" ? "Published" : status === "archived" ? "Archived" : "Draft"}</span>
        <button type="button" className="abtn abtn--primary" disabled={pending} onClick={() => save()}>
          <Save aria-hidden /> {pending ? "Saving…" : "Save"}
        </button>
        {status !== "published" ? (
          <button type="button" className="abtn abtn--primary" disabled={pending} onClick={() => changeStatus("published")}>
            <Eye aria-hidden /> Save & publish
          </button>
        ) : (
          <button type="button" className="abtn abtn--ghost" disabled={pending} onClick={() => changeStatus("draft")}>
            <EyeOff aria-hidden /> Unpublish
          </button>
        )}
        {status !== "archived" ? (
          <ConfirmButton
            className="abtn abtn--danger-ghost"
            title="Move to the archive?"
            message={`“${p.title}” will be saved, then leave the site and the list. You can restore it from the Archive at any time.`}
            confirmLabel="Move to archive"
            danger
            disabled={pending}
            run={() => changeStatus("archived")}
          >
            <Archive aria-hidden /> Archive
          </ConfirmButton>
        ) : null}
        {status === "published" ? (
          <a className="abtn abtn--ghost" href={`/history/${data.input.slug}`} target="_blank" rel="noopener">
            <ExternalLink aria-hidden /> View page
          </a>
        ) : null}
        <nav className="ed-jump" aria-label="Jump to section">
          {SECTIONS.map(([id, label]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
        </nav>
      </div>
      {error ? (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Section id="ed-basics" no="No.01" title="Basics">
        <div className="ed-grid">
          <TextField label="Title" value={p.title} onChange={(e) => set("title", e.target.value)} required slotProps={{ htmlInput: { maxLength: 80 } }} />
          <TextField label="Slug (URL)" value={p.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} helperText={`/history/${p.slug}`} slotProps={{ htmlInput: { maxLength: 60 } }} />
          <TextField className="ed-wide" label="One-sentence description" value={p.tagline} onChange={(e) => set("tagline", e.target.value)} required multiline helperText={`${p.tagline.length}/160 · shown on cards, the ribbon and search results`} slotProps={{ htmlInput: { maxLength: 160 } }} />
          <TextField select label="Type" value={p.category} onChange={(e) => set("category", e.target.value as ProjectInputT["category"])}>
            {sel(CATEGORIES)}
          </TextField>
          <TextField select label="Status of the project" value={p.lifecycle} onChange={(e) => set("lifecycle", e.target.value as ProjectInputT["lifecycle"])}>
            {sel(LIFECYCLES)}
          </TextField>
          <TextField label="Role" value={p.role ?? ""} onChange={(e) => set("role", e.target.value)} placeholder="Solo developer: design, front end, back end" />
          <div className="ed-row">
            <TextField type="date" label="Started" value={p.startedOn ?? ""} onChange={(e) => set("startedOn", e.target.value || null)} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField type="date" label="Finished" value={p.finishedOn ?? ""} onChange={(e) => set("finishedOn", e.target.value || null)} slotProps={{ inputLabel: { shrink: true } }} helperText="empty = ongoing" />
          </div>
          <div className="ed-wide ed-platforms">
            <span className="admin-label">Platforms</span>
            {PLATFORMS.map(([v, l]) => (
              <FormControlLabel
                key={v}
                control={<Checkbox checked={p.platforms?.includes(v as "web") ?? false} onChange={(e) => set("platforms", e.target.checked ? [...(p.platforms ?? []), v as "web"] : (p.platforms ?? []).filter((x) => x !== v))} />}
                label={l}
              />
            ))}
          </div>
          <div className="ed-row ed-wide">
            <TextField label="Accent colour" value={p.accentColor ?? ""} onChange={(e) => set("accentColor", e.target.value || null)} placeholder="#FE9FB9" helperText="the page and cards take on this colour" />
            <input type="color" aria-label="Pick accent colour" value={accentOk ? p.accentColor! : "#ffb4e3"} onChange={(e) => set("accentColor", e.target.value.toUpperCase())} className="ed-color" />
            <TextField label="Second accent (optional)" value={p.accentColor2 ?? ""} onChange={(e) => set("accentColor2", e.target.value || null)} placeholder="#63A23D" />
            {accentOk ? (
              <span className="ed-swatch" style={{ background: p.accentColor!, color: strongOf(p.accentColor!) }} title="Accent and its strong text colour">
                Aa
              </span>
            ) : null}
          </div>
        </div>
      </Section>

      <Section id="ed-media" no="No.02" title="Video & images" hint="The preview video plays on hover in lists, on the Latest card and in the page hero. Images appear in the gallery; the first one (or a 'cover') is the card image. Alt text is required.">
        {!data.uploads ? <Alert severity="warning">Uploads are off until CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are set. You can still edit everything else.</Alert> : null}
        <div className="ed-uploads">
          <Uploader kind="video" scope={scope} label="Upload preview video" disabled={!data.uploads} onUploaded={uploaded("preview")} />
          <Uploader kind="video" scope={scope} label="Upload hover clip (optional)" disabled={!data.uploads} onUploaded={uploaded("hover")} />
          <Uploader kind="image" scope={scope} label="Upload images" multiple disabled={!data.uploads} onUploaded={uploaded("gallery")} />
        </div>
        <ul className="ed-media">
          {media.map((m, i) => (
            <li key={m.id} className="ed-media__item">
              <span className="ed-media__thumb" style={{ backgroundImage: `url(${m.kind === "video" ? cldVideo.poster(m.publicId) : cldImage(m.publicId, { w: 360 })})` }}>
                {m.kind === "video" ? <span className="ed-media__badge">▶ video</span> : null}
              </span>
              <div className="ed-media__fields">
                <div className="ed-row">
                  <TextField select size="small" label="Use as" value={m.role} onChange={(e) => editMedia(m.id, { role: e.target.value })}>
                    {sel(m.kind === "video" ? [["preview", "Preview video"], ["hover", "Hover clip"]] : [["gallery", "Gallery"], ["cover", "Cover (card image)"], ["og", "Share image"]])}
                  </TextField>
                  {m.kind === "image" ? (
                    <TextField select size="small" label="Frame" value={m.frame} onChange={(e) => editMedia(m.id, { frame: e.target.value })}>
                      {sel(FRAMES)}
                    </TextField>
                  ) : null}
                </div>
                <TextField size="small" label={m.kind === "image" ? "Alt text (required)" : "Description"} value={m.altText ?? ""} onChange={(e) => editMedia(m.id, { altText: e.target.value })} error={m.kind === "image" && !m.altText?.trim()} fullWidth />
                {m.kind === "image" ? <TextField size="small" label="Caption (optional)" value={m.caption ?? ""} onChange={(e) => editMedia(m.id, { caption: e.target.value })} fullWidth /> : null}
              </div>
              <div className="ed-media__tools">
                <IconButton size="small" aria-label="Move up" onClick={() => setMedia((x) => move(x, i, -1))}>
                  <ArrowUp size={16} />
                </IconButton>
                <IconButton size="small" aria-label="Move down" onClick={() => setMedia((x) => move(x, i, 1))}>
                  <ArrowDown size={16} />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label="Delete"
                  onClick={() => {
                    if (!window.confirm("Delete this file from the project (and from Cloudinary)?")) return;
                    start(async () => {
                      if (await removeMedia(m.id)) setMedia((x) => x.filter((y) => y.id !== m.id));
                    });
                  }}
                >
                  <Trash2 size={16} />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="ed-links" no="No.03" title="Links" hint="Visit website, APK, EXE, store pages, docs… Never a source-code link.">
        {(p.links ?? []).map((l, i) => (
          <div key={i} className="ed-row ed-line">
            <TextField select size="small" label="Kind" value={l.kind} onChange={(e) => set("links", p.links!.map((x, j) => (j === i ? { ...x, kind: e.target.value as "live" } : x)))} sx={{ minWidth: 170 }}>
              {sel(LINK_KINDS)}
            </TextField>
            <TextField size="small" label="URL (https://)" value={l.url} onChange={(e) => set("links", p.links!.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} sx={{ flex: 2 }} />
            <TextField size="small" label="Label (optional)" value={l.label ?? ""} onChange={(e) => set("links", p.links!.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <TextField size="small" label="Note (optional)" value={l.note ?? ""} onChange={(e) => set("links", p.links!.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} placeholder="v1.2 · 18 MB" />
            <FormControlLabel control={<Radio checked={l.isPrimary} onChange={() => set("links", p.links!.map((x, j) => ({ ...x, isPrimary: j === i })))} />} label="Primary" />
            <IconButton aria-label="Remove link" onClick={() => set("links", p.links!.filter((_, j) => j !== i))}>
              <Trash2 size={16} />
            </IconButton>
          </div>
        ))}
        <Button startIcon={<Plus size={16} />} onClick={() => set("links", [...(p.links ?? []), { kind: "live", url: "https://", label: null, note: null, isPrimary: !(p.links ?? []).length }])}>
          Add link
        </Button>
      </Section>

      <Section id="ed-tech" no="No.04" title="Tech stack">
        <Autocomplete
          multiple
          options={data.catalog}
          groupBy={(o) => o.category}
          getOptionLabel={(o) => o.name}
          value={data.catalog.filter((c) => p.tech?.some((t) => t.technologyId === c.id))}
          onChange={(_, v) => set("tech", v.map((c) => p.tech?.find((t) => t.technologyId === c.id) ?? { technologyId: c.id, usageNote: null }))}
          renderInput={(params) => <TextField {...params} label="Technologies" placeholder="Add from the catalog" />}
        />
        {(p.tech ?? []).map((t, i) => (
          <div key={t.technologyId} className="ed-row ed-line">
            <span className="ed-techname">{data.catalog.find((c) => c.id === t.technologyId)?.name}</span>
            <TextField size="small" label="How it was used (optional)" value={t.usageNote ?? ""} onChange={(e) => set("tech", p.tech!.map((x, j) => (j === i ? { ...x, usageNote: e.target.value } : x)))} sx={{ flex: 1 }} />
            <IconButton size="small" aria-label="Move up" onClick={() => set("tech", move(p.tech!, i, -1))}>
              <ArrowUp size={16} />
            </IconButton>
            <IconButton size="small" aria-label="Move down" onClick={() => set("tech", move(p.tech!, i, 1))}>
              <ArrowDown size={16} />
            </IconButton>
          </div>
        ))}
      </Section>

      <Section id="ed-description" no="No.05" title="Full description" hint="Markdown: **bold**, *italic*, [link](https://…), - lists, ## headings.">
        <Button size="small" startIcon={<Eye size={16} />} onClick={() => setPreview((v) => !v)}>
          {preview ? "Edit" : "Preview"}
        </Button>
        {preview ? <Markdown source={p.descriptionMd ?? ""} className="prose ed-preview" /> : <TextField multiline minRows={8} fullWidth value={p.descriptionMd ?? ""} onChange={(e) => set("descriptionMd", e.target.value)} />}
      </Section>

      <Section id="ed-operations" no="No.06" title="Operations" hint="What visitors can do, what admins can do, and what happens behind the scenes. Shown as numbered cards.">
        {(p.operations ?? []).map((o, i) => (
          <div key={i} className="ed-op">
            <div className="ed-row">
              <TextField select size="small" label="Section" value={o.audience} onChange={(e) => set("operations", p.operations!.map((x, j) => (j === i ? { ...x, audience: e.target.value as "visitor" } : x)))} sx={{ minWidth: 220 }}>
                {sel(AUDIENCES)}
              </TextField>
              <TextField size="small" label="Title" value={o.title} onChange={(e) => set("operations", p.operations!.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} sx={{ flex: 1 }} slotProps={{ htmlInput: { maxLength: 80 } }} />
              <TextField select size="small" label="Icon" value={o.icon ?? ""} onChange={(e) => set("operations", p.operations!.map((x, j) => (j === i ? { ...x, icon: e.target.value || null } : x)))} sx={{ minWidth: 140 }}>
                <MenuItem value="">(none)</MenuItem>
                {Object.keys(OP_ICONS).map((k) => (
                  <MenuItem key={k} value={k}>
                    {k}
                  </MenuItem>
                ))}
              </TextField>
              <TextField select size="small" label="Image" value={o.mediaId ?? ""} onChange={(e) => set("operations", p.operations!.map((x, j) => (j === i ? { ...x, mediaId: e.target.value ? Number(e.target.value) : null } : x)))} sx={{ minWidth: 150 }}>
                <MenuItem value="">(none)</MenuItem>
                {media
                  .filter((m) => m.kind === "image")
                  .map((m, k) => (
                    <MenuItem key={m.id} value={m.id}>
                      {`Image ${k + 1}`}
                    </MenuItem>
                  ))}
              </TextField>
              <IconButton size="small" aria-label="Move up" onClick={() => set("operations", move(p.operations!, i, -1))}>
                <ArrowUp size={16} />
              </IconButton>
              <IconButton size="small" aria-label="Move down" onClick={() => set("operations", move(p.operations!, i, 1))}>
                <ArrowDown size={16} />
              </IconButton>
              <IconButton size="small" aria-label="Remove operation" onClick={() => set("operations", p.operations!.filter((_, j) => j !== i))}>
                <Trash2 size={16} />
              </IconButton>
            </div>
            <TextField size="small" multiline minRows={2} fullWidth label="Description (Markdown)" value={o.bodyMd} onChange={(e) => set("operations", p.operations!.map((x, j) => (j === i ? { ...x, bodyMd: e.target.value } : x)))} />
          </div>
        ))}
        <Button startIcon={<Plus size={16} />} onClick={() => set("operations", [...(p.operations ?? []), { audience: "visitor", title: "", bodyMd: "", icon: null, mediaId: null }])}>
          Add operation
        </Button>
      </Section>

      <Section id="ed-credits" no="No.07" title="Credits, disclaimer & SEO">
        {(p.credits ?? []).map((c, i) => (
          <div key={i} className="ed-row ed-line">
            <TextField size="small" label="Role" value={c.role ?? ""} onChange={(e) => set("credits", p.credits!.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))} />
            <TextField size="small" label="Name" value={c.name} onChange={(e) => set("credits", p.credits!.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
            <TextField size="small" label="Link (optional, https://)" value={c.url ?? ""} onChange={(e) => set("credits", p.credits!.map((x, j) => (j === i ? { ...x, url: e.target.value || undefined } : x)))} sx={{ flex: 1 }} />
            <IconButton aria-label="Remove credit" onClick={() => set("credits", p.credits!.filter((_, j) => j !== i))}>
              <Trash2 size={16} />
            </IconButton>
          </div>
        ))}
        <Button startIcon={<Plus size={16} />} onClick={() => set("credits", [...(p.credits ?? []), { name: "", role: "" }])}>
          Add credit
        </Button>
        <TextField multiline minRows={2} fullWidth label="Disclaimer (Markdown, optional)" value={p.disclaimerMd ?? ""} onChange={(e) => set("disclaimerMd", e.target.value)} sx={{ mt: 2 }} />
        <div className="ed-row ed-row--gap">
          <TextField label="SEO title (optional)" value={p.seoTitle ?? ""} onChange={(e) => set("seoTitle", e.target.value)} sx={{ flex: 1 }} slotProps={{ htmlInput: { maxLength: 70 } }} />
          <TextField label="SEO description (optional)" value={p.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value)} sx={{ flex: 2 }} slotProps={{ htmlInput: { maxLength: 200 } }} />
        </div>
      </Section>

      <div className="ed-bar ed-bar--bottom">
        <button type="button" className="abtn abtn--primary" disabled={pending} onClick={() => save()}>
          <Save aria-hidden /> {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
