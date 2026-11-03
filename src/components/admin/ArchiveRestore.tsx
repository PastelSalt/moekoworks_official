"use client";

import { ArchiveRestore } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { saveCertification } from "@/server/admin/catalog";
import { setProjectStatus } from "@/server/admin/projects";
import { useToast } from "./Toast";

export type Restorable =
  | { kind: "project"; id: number }
  | { kind: "certification"; id: number; title: string; obtainedOn: string; mediaId: number };

/** Restore from the Archive: projects come back as drafts, certifications as hidden (both stay off the site until you say so). */
export function ArchiveRestoreButton({ item }: { item: Restorable }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const restore = () =>
    start(async () => {
      const r =
        item.kind === "project"
          ? await setProjectStatus(item.id, "draft")
          : await saveCertification({ id: item.id, title: item.title, obtainedOn: item.obtainedOn, mediaId: item.mediaId, status: "draft" });
      if (!r.ok) return toast(r.error, "error");
      toast(item.kind === "project" ? "Restored! It's back in Project History as a draft." : "Restored! It's back in Certifications, hidden.");
      router.refresh();
    });
  return (
    <button type="button" className="abtn abtn--ghost abtn--sm" disabled={pending} onClick={restore}>
      <ArchiveRestore aria-hidden /> Restore
    </button>
  );
}
