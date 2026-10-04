// Small project building blocks (server components): tech chips, status chip, Cloudinary images, device frames.
import type { CSSProperties, ReactNode } from "react";
import { Flower } from "@/components/decor/Decor";
import { cldImage, cldSrcSet } from "@/lib/cloudinary";
import { LIFECYCLE_LABEL } from "@/lib/format";
import { techIcon } from "@/lib/tech-icons";
import type { Media, Tech } from "@/server/queries/public";

export function TechChip({ tech, size = "md", count }: { tech: Pick<Tech, "name" | "iconKey" | "color">; size?: "md" | "lg"; count?: number }) {
  const icon = techIcon(tech.iconKey);
  const color = icon?.hex ?? tech.color ?? "#5D5869";
  return (
    <span className={`tech ${size === "lg" ? "tech--lg" : ""}`} style={{ "--tc": color } as CSSProperties}>
      {icon ? (
        <svg viewBox="0 0 24 24" width={size === "lg" ? 20 : 16} height={size === "lg" ? 20 : 16} aria-hidden="true" focusable="false">
          <path d={icon.path} fill="currentColor" />
        </svg>
      ) : (
        <span className="tech__mono" aria-hidden="true">
          {tech.name.slice(0, 1)}
        </span>
      )}
      {tech.name}
      {count ? <span className="tech__count">×{count}</span> : null}
    </span>
  );
}

/** Compact row of tech logos (cards, history rows). */
export function TechIcons({ tech, max = 6 }: { tech: Pick<Tech, "name" | "iconKey" | "color">[]; max?: number }) {
  const shown = tech.slice(0, max);
  const rest = tech.length - shown.length;
  return (
    <ul className="techicons" aria-label="Built with">
      {shown.map((t) => {
        const icon = techIcon(t.iconKey);
        return (
          <li key={t.name} title={t.name} style={{ "--tc": icon?.hex ?? t.color ?? "#5D5869" } as CSSProperties}>
            {icon ? (
              <svg viewBox="0 0 24 24" width={15} height={15} aria-hidden="true" focusable="false">
                <path d={icon.path} fill="currentColor" />
              </svg>
            ) : (
              <span aria-hidden="true">{t.name.slice(0, 1)}</span>
            )}
            <span className="visually-hidden">{t.name}</span>
          </li>
        );
      })}
      {rest > 0 ? <li className="techicons__more">+{rest}</li> : null}
    </ul>
  );
}

export function StatusChip({ lifecycle, className = "chip--white" }: { lifecycle: string; className?: string }) {
  const s = LIFECYCLE_LABEL[lifecycle] ?? { label: lifecycle, tone: "rest" as const };
  return (
    <span className={`chip ${className}`}>
      <span className={`dot ${s.tone === "live" ? "dot--live" : s.tone === "build" ? "dot--build" : ""}`} aria-hidden="true" />
      {s.label}
    </span>
  );
}

const WIDTHS = [480, 720, 960, 1280, 1600];

/** Responsive Cloudinary image (f_auto, q_auto). Alt text is required on project media (plan §6.10). */
export function CldImg({ media, sizes, className, priority = false, fill = false, maxWidth = 1600 }: { media: Media; sizes: string; className?: string; priority?: boolean; fill?: boolean; maxWidth?: number }) {
  const widths = WIDTHS.filter((w) => w <= Math.max(480, Math.min(maxWidth, media.width ?? maxWidth)));
  return (
    <img
      className={className}
      src={cldImage(media.publicId, { w: widths[widths.length - 1] })}
      srcSet={cldSrcSet(media.publicId, widths)}
      sizes={sizes}
      alt={media.altText ?? ""}
      width={media.width ?? undefined}
      height={media.height ?? undefined}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      style={fill ? undefined : media.dominantColor ? { backgroundColor: media.dominantColor } : undefined}
    />
  );
}

/** Device frames: browser (three tiny flowers as the traffic lights), phone, or none. */
export function DeviceFrame({ kind, url, children, className = "", style }: { kind: "browser" | "phone" | "none"; url?: string; children: ReactNode; className?: string; style?: CSSProperties }) {
  if (kind === "none") return <div className={`frame ${className}`} style={style}>{children}</div>;
  return (
    <div className={`frame frame--${kind} ${className}`} style={style}>
      {kind === "browser" ? (
        <>
          <span className="frame__dots" aria-hidden="true">
            <Flower tone="pink" size={14} outline />
            <Flower tone="butter" size={14} outline />
            <Flower tone="blue" size={14} outline />
          </span>
          {url ? (
            <span className="frame__url" aria-hidden="true">
              {url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </span>
          ) : null}
        </>
      ) : null}
      {children}
    </div>
  );
}

/** Picks the frame for a media item: explicit choice, else by aspect ratio. */
export function frameFor(media: Pick<Media, "frame" | "width" | "height">): "browser" | "phone" | "none" {
  if (media.frame === "browser" || media.frame === "window") return "browser";
  if (media.frame === "phone" || media.frame === "tablet") return "phone";
  if (media.frame === "none") return "none";
  return media.width && media.height && media.height > media.width * 1.2 ? "phone" : "browser";
}
