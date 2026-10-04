"use server";

import { createHash } from "node:crypto";
import { requireAdmin } from "@/server/auth/session";

// Signed direct uploads (plan §11.3, §16.2): the browser uploads straight to Cloudinary with a short-lived
// signature from here; the API secret never leaves the server.
const CLOUD = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const KEY = process.env.CLOUDINARY_API_KEY ?? "";
const SECRET = process.env.CLOUDINARY_API_SECRET ?? "";
const ROOT = process.env.CLOUDINARY_ROOT_FOLDER ?? "moesoft-official";

function sign(params: Record<string, string | number>) {
  const base = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(base + SECRET).digest("hex");
}

export type SignedUpload = { ok: true; url: string; fields: Record<string, string> } | { ok: false; error: string };

/** kind: image | video · scope: "projects/<slug>" | "certifications" | "site" */
export async function signUpload(kind: "image" | "video", scope: string): Promise<SignedUpload> {
  await requireAdmin();
  if (!CLOUD || !KEY || !SECRET) return { ok: false, error: "Uploads are off: add CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to the environment (Vercel → Settings → Environment Variables)." };
  if (!/^(projects\/[a-z0-9-]{1,60}|certifications|site)$/.test(scope)) return { ok: false, error: "Unknown upload folder." };
  const params = {
    asset_folder: `${ROOT}/${scope}`,
    timestamp: Math.floor(Date.now() / 1000),
    upload_preset: kind === "video" ? (process.env.CLOUDINARY_PRESET_VIDEOS ?? "moesoft_videos_signed") : (process.env.CLOUDINARY_PRESET_IMAGES ?? "moesoft_images_signed"),
  };
  return {
    ok: true,
    url: `https://api.cloudinary.com/v1_1/${CLOUD}/${kind}/upload`,
    fields: { ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), api_key: KEY, signature: sign(params) },
  };
}

/** Removes an asset from Cloudinary (used when a media item is deleted in the admin). Best effort. */
export async function destroyAsset(publicId: string, kind: "image" | "video") {
  await requireAdmin();
  if (!CLOUD || !KEY || !SECRET) return false;
  const params = { invalidate: "true", public_id: publicId, timestamp: Math.floor(Date.now() / 1000) };
  const body = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), api_key: KEY, signature: sign(params) });
  try {
    const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/${kind}/destroy`, { method: "POST", body });
    return r.ok;
  } catch {
    return false;
  }
}
