// Decorative building blocks of the "Bloom Expo" look (plan §6.1). All aria-hidden: content never depends on them.
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { FLOWER_VIEWBOX, SHAPES } from "./shapes";

type Tone = "pink" | "blue" | "lilac" | "butter" | "white" | "ink";
const TONES: Record<Tone, [string, string]> = {
  pink: ["var(--pink-300)", "var(--butter-300)"],
  blue: ["var(--blue-300)", "var(--white)"],
  lilac: ["var(--lilac-300)", "var(--butter-300)"],
  butter: ["var(--butter-300)", "var(--peach-300)"],
  white: ["var(--white)", "var(--pink-300)"],
  ink: ["var(--ink)", "var(--pink-300)"],
};

/** The logo's five-petal flower as a tiny inline icon. The petals overhang the 24 × 24 path box (x −0.44…24.44,
 *  y −0.81…23.35) and the outline adds half its width, so the viewBox is padded or the edges get clipped flat. */
export function Flower({ tone = "pink", size = 18, outline = false, className, style }: { tone?: Tone; size?: number; outline?: boolean; className?: string; style?: CSSProperties }) {
  const [petals, centre] = TONES[tone];
  return (
    <svg className={className} style={style} width={size} height={size} viewBox={FLOWER_VIEWBOX} aria-hidden="true" focusable="false">
      <path d={SHAPES.flower} fill={petals} stroke={outline ? "var(--outline)" : "none"} strokeWidth={outline ? 1.6 : 0} strokeLinejoin="round" />
      <path d={SHAPES.flowerCentre} fill={centre} stroke={outline ? "var(--outline)" : "none"} strokeWidth={outline ? 1.3 : 0} />
    </svg>
  );
}

export function Spark({ color = "var(--pink-500)", size = 14, className, style }: { color?: string; size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={SHAPES.spark} fill={color} />
    </svg>
  );
}

/** The pastel stage: blush → ice gradient, watercolor corners and the drifting MOESOFT letter pattern. */
export function PatternStage({
  children,
  className = "",
  washes = true,
  as: Tag = "div",
  ...rest
}: { children?: ReactNode; className?: string; washes?: boolean; as?: "div" | "section" | "header" } & Omit<HTMLAttributes<HTMLElement>, "className" | "children">) {
  return (
    <Tag className={`stage ${className}`} {...rest}>
      <div className="stage__bg" aria-hidden="true">
        {washes ? (
          <>
            <span className="stage__wash stage__wash--pink" />
            <span className="stage__wash stage__wash--blue" />
          </>
        ) : null}
        <span className="stage__pattern" />
      </div>
      {children}
    </Tag>
  );
}

/** Huge outlined Lilita One word, cropped by its section (kotoha / Miku Expo). */
export function GiantWord({ children, className = "", tone = "white" }: { children: string; className?: string; tone?: "white" | "pink" | "blue" | "accent" }) {
  return (
    <span className={`giant giant--${tone} ${className}`} aria-hidden="true">
      {children}
    </span>
  );
}

/** HSL-style vertical text: upright stacked capitals in alternating pink and blue lines. */
export function VerticalText({ lines, className = "" }: { lines: string[]; className?: string }) {
  return (
    <div className={`vtext ${className}`} aria-hidden="true">
      {lines.map((line, i) => (
        <span key={i} className={i % 2 ? "vtext__line vtext__line--blue" : "vtext__line"}>
          {line}
        </span>
      ))}
    </div>
  );
}

/** Text circling a white flower, slowly turning. Optional link (the "VISIT ✿" badge). */
export function RotatingBadge({ id, text, href, label, className = "", size = 132, track }: { id: string; text: string; href?: string; label?: string; className?: string; size?: number; track?: { t: string; id?: number; tg?: string } }) {
  const body = (
    <>
      <svg className="badge__ring" viewBox="0 0 200 200" width={size} height={size} aria-hidden="true" focusable="false">
        <defs>
          <path id={id} d="M100 100m-78 0a78 78 0 1 1 156 0a78 78 0 1 1 -156 0" />
        </defs>
        <circle cx="100" cy="100" r="97" className="badge__disc" />
        <text className="badge__text">
          <textPath href={`#${id}`} textLength="486" lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </svg>
      <span className="badge__core" aria-hidden="true">
        <img src="/brand/flower-o.svg" alt="" width={56} height={56} />
      </span>
    </>
  );
  if (href) {
    const external = /^https?:/.test(href);
    return (
      <a
        className={`badge badge--link ${className}`}
        href={href}
        aria-label={label ?? text}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...(track ? { "data-track": track.t, "data-track-id": track.id, "data-track-target": track.tg } : {})}
        style={{ "--badge": `${size}px` } as CSSProperties}
      >
        {body}
      </a>
    );
  }
  return (
    <span className={`badge ${className}`} aria-hidden="true" style={{ "--badge": `${size}px` } as CSSProperties}>
      {body}
    </span>
  );
}

/** Washi tape strip (kotoha scrapbook). */
export function Tape({ tone = "pink", className = "", style }: { tone?: "pink" | "blue" | "lilac" | "butter"; className?: string; style?: CSSProperties }) {
  return <span className={`tape tape--${tone} ${className}`} style={style} aria-hidden="true" />;
}

/** Die-cut text sticker: dark outline + lilac offset shadow (the logo's look). */
export function Sticker({ children, tone = "pink", tilt = -6, className = "", decorative = false }: { children: ReactNode; tone?: Tone; tilt?: number; className?: string; decorative?: boolean }) {
  return (
    <span className={`sticker sticker--${tone} ${className}`} style={{ "--tilt": `${tilt}deg` } as CSSProperties} {...(decorative ? { "aria-hidden": true } : {})}>
      {children}
    </span>
  );
}

/** Splits a title into per-letter spans for the kotoha letter-pop; screen readers get the plain text. */
export function PopText({ text, className = "", load = false }: { text: string; className?: string; load?: boolean }) {
  let i = 0;
  const words = text.split(" ");
  return (
    <span className={`pop ${load ? "pop--load" : ""} ${className}`}>
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true">
        {words.map((word, w) => (
          <span key={w}>
            <span className="pop__w">
              {[...word].map((ch, c) => (
                <span key={c} className="pop__c" style={{ "--i": i++ } as CSSProperties}>
                  {ch}
                </span>
              ))}
            </span>
            {w < words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    </span>
  );
}
