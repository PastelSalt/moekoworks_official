"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { track } from "@/lib/track";

export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="copy-btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email);
          track({ t: "copy_email" });
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          window.location.href = `mailto:${email}`;
        }
      }}
      aria-label={copied ? "E-mail address copied" : "Copy e-mail address"}
    >
      {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
      <span aria-live="polite">{copied ? "Copied!" : "Copy"}</span>
    </button>
  );
}
