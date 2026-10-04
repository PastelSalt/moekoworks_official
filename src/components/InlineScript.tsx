// Runs synchronously during HTML parsing (before first paint). Pattern from the Next.js guide
// "Preventing flash before hydration": text/plain on the client keeps React from warning.
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
