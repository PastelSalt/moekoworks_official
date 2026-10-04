// Cloudinary delivery URLs (no secrets). Video URLs mirror the eager transformations of the
// `moesoft_videos_signed` preset so they hit pre-generated derivatives instead of on-the-fly processing.
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

export const cldVideo = {
  mp4: (publicId: string) => `${BASE}/video/upload/f_mp4,vc_h264,q_auto,w_1280,c_limit/${publicId}.mp4`,
  webm: (publicId: string) => `${BASE}/video/upload/f_webm,vc_vp9,q_auto,w_1280,c_limit/${publicId}.webm`,
  hover: (publicId: string) => `${BASE}/video/upload/f_mp4,vc_h264,q_auto,w_854,c_limit,du_8/${publicId}.mp4`,
  poster: (publicId: string) => `${BASE}/video/upload/f_jpg,so_auto,q_auto,w_1280,c_limit/${publicId}.jpg`,
};
