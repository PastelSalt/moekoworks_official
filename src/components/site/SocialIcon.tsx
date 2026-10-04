import { Mail } from "lucide-react";
import { siFacebook, siGithub } from "simple-icons";
import type { SocialId } from "@/lib/site";

export function SocialIcon({ id, size = 18 }: { id: SocialId; size?: number }) {
  if (id === "email") return <Mail size={size} strokeWidth={2} aria-hidden="true" />;
  const icon = id === "github" ? siGithub : siFacebook;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={icon.path} fill="currentColor" />
    </svg>
  );
}
