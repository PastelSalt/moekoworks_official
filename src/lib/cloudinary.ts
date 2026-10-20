// Cloudinary delivery URLs (no secrets). Video URLs mirror the eager transformations of the
// `moekoworks_videos_signed` preset so they hit pre-generated derivatives instead of on-the-fly processing.
const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "dijqsw0k8";
const BASE = `https://res.cloudinary.com/${CLOUD}`;

export type ImageOptions = { w?: number; h?: number; crop?: "fill" | "limit" | "fit"; gravity?: "auto" };

export function cldImage(publicId: string, { w, h, crop = "limit", gravity }: ImageOptions = {}) {
  const t = ["f_auto", "q_auto", `c_${crop}`];
  if (gravity) t.push(`g_${gravity}`);
  if (w) t.push(`w_${w}`);
  if (h) t.push(`h_${h}`);
  return `${BASE}/image/upload/${t.join(",")}/${publicId}`;
}

export function cldSrcSet(publicId: string, widths: number[], opts: Omit<ImageOptions, "w"> = {}) {
  return widths.map((w) => `${cldImage(publicId, { ...opts, w, h: opts.h ? Math.round((opts.h * w) / widths[widths.length - 1]) : undefined })} ${w}w`).join(", ");
}

// Same transformations as the `moekoworks_videos_signed` preset's eager list (format = file extension), so
// pages hit the pre-generated derivatives instead of on-the-fly video processing.
export const VIDEO_EAGER = "c_limit,q_auto,vc_h264,w_1280/mp4|c_limit,q_auto,vc_vp9,w_1280/webm|c_limit,du_8,q_auto,vc_h264,w_854/mp4|c_limit,q_auto,so_auto,w_1280/jpg";
export const HOVER_EAGER = "c_limit,q_auto,vc_h264,w_854/mp4";

export const cldVideo = {
  mp4: (publicId: string) => `${BASE}/video/upload/c_limit,q_auto,vc_h264,w_1280/${publicId}.mp4`,
  webm: (publicId: string) => `${BASE}/video/upload/c_limit,q_auto,vc_vp9,w_1280/${publicId}.webm`,
  /** First 8 s of the preview at ~480p (used when a project has no dedicated hover clip). */
  hover: (publicId: string) => `${BASE}/video/upload/c_limit,du_8,q_auto,vc_h264,w_854/${publicId}.mp4`,
  /** A dedicated hover clip (media role "hover"), already short. */
  hoverClip: (publicId: string) => `${BASE}/video/upload/c_limit,q_auto,vc_h264,w_854/${publicId}.mp4`,
  poster: (publicId: string) => `${BASE}/video/upload/c_limit,q_auto,so_auto,w_1280/${publicId}.jpg`,
};

/** Hover-preview URL for a project: its dedicated clip, else the first 8 s of the preview. */
export function hoverUrl(p: { hover: { publicId: string } | null; preview: { publicId: string } | null }) {
  if (p.hover) return cldVideo.hoverClip(p.hover.publicId);
  return p.preview ? cldVideo.hover(p.preview.publicId) : undefined;
}
