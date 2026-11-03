import type { ReactNode } from "react";

export type StickerTone = "pink" | "blue" | "lilac" | "butter";

/** The public site's sticker (outlined pill, offset shadow, slight tilt) with a flower, like Kotoha's sticker titles. */
export function Sticker({ children, tone = "pink", small = false, as: Tag = "span" }: { children: ReactNode; tone?: StickerTone; small?: boolean; as?: "span" | "h1" | "h2" }) {
  return (
    <Tag className={`asticker asticker--${tone}${small ? " asticker--sm" : ""}`}>
      <Flower tone={tone === "blue" || tone === "lilac" ? "purple" : "pink"} />
      <span>{children}</span>
    </Tag>
  );
}

/** Decorative flower from the public brand assets (Kotoha uses a clover). */
export function Flower({ tone = "pink", className = "aflower" }: { tone?: "pink" | "purple" | "o"; className?: string }) {
  return <img className={className} src={`/brand/flower-${tone}.svg`} alt="" aria-hidden="true" width={20} height={20} />;
}
