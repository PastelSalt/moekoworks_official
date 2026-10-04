"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { signUpload } from "@/server/admin/cloudinary";
import type { UploadResult } from "@/server/admin/projects";

// Cloudinary Free plan limits (plan §16.3)
const MAX = { image: 10 * 1024 * 1024, video: 100 * 1024 * 1024 };

type Props = { kind: "image" | "video"; scope: string; label: string; multiple?: boolean; disabled?: boolean; onUploaded: (r: UploadResult) => Promise<void> | void };

/** Signed direct upload: browser → Cloudinary (with progress); the server only signs and records the result. */
export function Uploader({ kind, scope, label, multiple = false, disabled = false, onUploaded }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<{ name: string; pct: number }[]>([]);
  const [error, setError] = useState("");

  const upload = async (file: File) => {
    if (file.size > MAX[kind]) throw new Error(`${file.name} is larger than ${MAX[kind] / 1024 / 1024} MB (Cloudinary Free limit).`);
    const signed = await signUpload(kind, scope);
    if (!signed.ok) throw new Error(signed.error);
    const form = new FormData();
    form.append("file", file);
    for (const [k, v] of Object.entries(signed.fields)) form.append(k, v);
    const result = await new Promise<UploadResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", signed.url);
      xhr.upload.onprogress = (e) => e.lengthComputable && setJobs((j) => j.map((x) => (x.name === file.name ? { ...x, pct: Math.round((e.loaded / e.total) * 100) } : x)));
      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText);
          if (xhr.status >= 300 || json.error) reject(new Error(json.error?.message ?? `Upload failed (${xhr.status})`));
          else resolve(json);
        } catch {
          reject(new Error("Upload failed."));
        }
      };
      xhr.onerror = () => reject(new Error("Network error while uploading."));
      xhr.send(form);
    });
    await onUploaded(result);
  };

  const start = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    const list = Array.from(files);
    setJobs(list.map((f) => ({ name: f.name, pct: 0 })));
    for (const f of list) {
      try {
        await upload(f);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
      setJobs((j) => j.filter((x) => x.name !== f.name));
    }
    if (input.current) input.current.value = "";
  };

  return (
    <div
      className="uploader"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (!disabled) start(e.dataTransfer.files);
      }}
    >
      <input ref={input} type="file" hidden accept={kind === "video" ? "video/mp4,video/webm,video/quicktime" : "image/*"} multiple={multiple} onChange={(e) => start(e.target.files)} />
      <Button variant="outlined" color="primary" startIcon={<Upload size={16} aria-hidden />} disabled={disabled || jobs.length > 0} onClick={() => input.current?.click()}>
        {label}
      </Button>
      <span className="uploader__hint">or drop {multiple ? "files" : "a file"} here · max {MAX[kind] / 1024 / 1024} MB</span>
      {jobs.map((j) => (
        <div key={j.name} className="uploader__job">
          <span>{j.name}</span>
          <LinearProgress variant="determinate" value={j.pct} />
        </div>
      ))}
      {error ? (
        <Alert severity="error" onClose={() => setError("")} sx={{ mt: 1 }}>
          {error}
        </Alert>
      ) : null}
    </div>
  );
}
