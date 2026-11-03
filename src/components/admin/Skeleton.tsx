/** Placeholders at the final sizes (Kotoha), so nothing jumps when the data arrives. */
export function Skeleton({ variant = "list" }: { variant?: "dashboard" | "statistics" | "list" }) {
  return (
    <div className="skel" role="status" aria-live="polite">
      <span className="visually-hidden">Loading…</span>
      <span className="skeleton skeleton--label" aria-hidden="true" />
      <span className="skeleton skeleton--title" aria-hidden="true" />
      {variant === "dashboard" ? (
        <>
          <span className="skeleton skeleton--welcome" aria-hidden="true" />
          <div className="tiles">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="skeleton skeleton--tile" aria-hidden="true" />
            ))}
          </div>
        </>
      ) : null}
      {variant !== "list" ? (
        <>
          <div className="kpis">
            {[0, 1, 2].map((i) => (
              <span key={i} className="skeleton skeleton--kpi" aria-hidden="true" />
            ))}
          </div>
          <span className="skeleton skeleton--chart" aria-hidden="true" />
        </>
      ) : (
        <div className="items">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="skeleton skeleton--row" aria-hidden="true" />
          ))}
        </div>
      )}
    </div>
  );
}
