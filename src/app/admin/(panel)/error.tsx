"use client";

import { RotateCcw } from "lucide-react";
import { StateBox } from "@/components/admin/StateBox";

/** A failing page inside the panel shows Kotoha's error box (the shell stays usable) instead of the site-wide error page. */
export default function PanelError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <StateBox
      tone="error"
      action={
        <button type="button" className="abtn abtn--ghost abtn--sm" onClick={() => reset()}>
          <RotateCcw aria-hidden /> Try again
        </button>
      }
    >
      Something went wrong while loading this page. If the database was asleep, trying again usually works.
    </StateBox>
  );
}
