import type { CSSProperties, ReactNode } from "react";
import { GiantWord, PatternStage, PopText, Spark } from "@/components/decor/Decor";

/**
 * Inner-page head (plan §8.0): a short pattern-stage band with watercolor corners and a giant outlined word,
 * the page title in wide-tracked caps with a long underline drawing in from the left edge, and the page label
 * top-right (Miku Expo).
 */
export function PageHead({ label, title, giant, micro, children }: { label: string; title: string; giant: string; micro?: ReactNode; children?: ReactNode }) {
  return (
    <PatternStage as="header" className="phead stage--short">
      <p className="phead__label arrive arrive--fade" aria-hidden="true">
        <Spark size={12} color="var(--pink-500)" /> {label}
      </p>
      <div className="wrap phead__inner">
        {micro ? <div className="micro micro--row phead__micro arrive">{micro}</div> : null}
        <h1 className="phead__title">
          <PopText text={title} load />
        </h1>
      </div>
      <span className="phead__rule arrive--draw" style={{ "--a": 0.6 } as CSSProperties} aria-hidden="true" />
      {children ? <div className="wrap phead__lead">{children}</div> : null}
      <GiantWord className="phead__giant arrive--giant">{giant}</GiantWord>
    </PatternStage>
  );
}
