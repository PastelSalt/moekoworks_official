"use client";

import { Archive, ArchiveRestore, ExternalLink, Eye, EyeOff, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { flowerBurst } from "@/lib/confetti";
import { setProjectStatus } from "@/server/admin/projects";
import { ConfirmButton } from "./ConfirmButton";
import { useToast } from "./Toast";

type Status = "draft" | "published" | "archived";

/** Edit · Publish/Unpublish · Archive/Restore right on the row (Kotoha). The server's publish checks still apply. */
export function ProjectRowActions({ id, title, slug, status }: { id: number; title: string; slug: string; status: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const change = (next: Status, done: string) =>
    new Promise<boolean>((resolve) =>
      start(async () => {
        const r = await setProjectStatus(id, next);
        if (!r.ok) {
          toast(r.error, "error");
          return resolve(false);
        }
        toast(done);
        if (next === "published") flowerBurst();
        router.refresh();
        resolve(true);
      }),
    );

  return (
    <>
      <Link className="abtn abtn--ghost abtn--sm" href={`/admin/projects/${id}`}>
        <Pencil aria-hidden /> Edit
      </Link>
      {status === "archived" ? (
        <button type="button" className="abtn abtn--ghost abtn--sm" disabled={pending} onClick={() => change("draft", "Restored as a draft ✿")}>
          <ArchiveRestore aria-hidden /> Restore
        </button>
      ) : (
        <>
          {status === "published" ? (
            <>
              <a className="abtn abtn--ghost abtn--sm" href={`/history/${slug}`} target="_blank" rel="noopener" aria-label={`View ${title} on the site (new tab)`}>
                <ExternalLink aria-hidden /> View
              </a>
              <ConfirmButton title="Unpublish this project?" message={`“${title}” will be hidden from the site and kept as a draft.`} confirmLabel="Unpublish" disabled={pending} run={() => change("draft", "Moved back to drafts")}>
                <EyeOff aria-hidden /> Unpublish
              </ConfirmButton>
            </>
          ) : (
            <button type="button" className="abtn abtn--ghost abtn--sm" disabled={pending} onClick={() => change("published", "Published! ✿")}>
              <Eye aria-hidden /> Publish
            </button>
          )}
          <ConfirmButton
            className="abtn abtn--danger-ghost abtn--sm"
            title="Move to the archive?"
            message={`“${title}” will leave the site and the list. You can restore it from the Archive at any time.`}
            confirmLabel="Move to archive"
            danger
            disabled={pending}
            run={() => change("archived", "Moved to the archive")}
          >
            <Archive aria-hidden /> Archive
          </ConfirmButton>
        </>
      )}
    </>
  );
}
