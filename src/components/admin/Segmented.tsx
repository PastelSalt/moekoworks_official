import Link from "next/link";

export type SegItem = { href: string; label: string; count?: number; active: boolean };

/** Kotoha's segmented pill (status filters, folders, ranges) as links, so the choice stays in the URL. */
export function SegmentedLinks({ items, label }: { items: SegItem[]; label: string }) {
  return (
    <nav className="segmented" aria-label={label}>
      {items.map((i) => (
        <Link key={i.href} href={i.href} className="segmented__item" aria-current={i.active ? "page" : undefined} scroll={false}>
          {i.label}
          {i.count !== undefined ? <span className="segmented__count">{i.count}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
