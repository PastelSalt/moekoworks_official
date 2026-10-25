/** CSS-only placeholders at the final card sizes, shown by the admin loading.tsx files. */
export function Skeleton({ variant = "page" }: { variant?: "page" | "statistics" }) {
  return (
    <div className="skel" role="status" aria-live="polite">
      <span className="visually-hidden">Loading…</span>
      <span className="skel__line skel__line--label" />
      <span className="skel__line skel__line--title" />
      {variant === "statistics" ? (
        <>
          <div className="stiles stiles--fixed">
            {[0, 1, 2].map((i) => (
              <span key={i} className="skel__box skel__box--tile" />
            ))}
          </div>
          <div className="stiles">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="skel__box skel__box--tile" />
            ))}
          </div>
          <span className="skel__box skel__box--chart" />
          <div className="sgrid">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="skel__box skel__box--card" />
            ))}
          </div>
        </>
      ) : (
        <>
          <span className="skel__box skel__box--banner" />
          <div className="sgrid">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="skel__box skel__box--card" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
