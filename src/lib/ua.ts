// Tiny user-agent classifier: family-level only (enough for statistics), no dependency.
export function parseUA(ua: string) {
  const browser = /edg(e|a|ios)?\//i.test(ua)
    ? "Edge"
    : /opr\/|opera/i.test(ua)
      ? "Opera"
      : /samsungbrowser/i.test(ua)
        ? "Samsung Internet"
        : /firefox|fxios/i.test(ua)
          ? "Firefox"
          : /crios|chrome|chromium/i.test(ua)
            ? "Chrome"
            : /safari/i.test(ua)
              ? "Safari"
              : "Other";
  const os = /windows/i.test(ua)
    ? "Windows"
    : /iphone|ipad|ipod/i.test(ua)
      ? "iOS"
      : /android/i.test(ua)
        ? "Android"
        : /mac os x|macintosh/i.test(ua)
          ? "macOS"
          : /cros/i.test(ua)
            ? "ChromeOS"
            : /linux/i.test(ua)
              ? "Linux"
              : "Other";
  const deviceType = /ipad|tablet/i.test(ua) ? "tablet" : /mobi|android|iphone/i.test(ua) ? "mobile" : ua ? "desktop" : "unknown";
  return { browser, os, deviceType };
}

/** Crawlers, link previewers, monitors and automation (incl. headless browsers) are never counted. */
export function isBot(ua: string | null | undefined) {
  return !ua || /bot|crawl|spider|slurp|externalhit|preview|headless|lighthouse|pagespeed|python|curl|wget|httpclient|okhttp|monitor|uptime|scan|fetch|axios|node-fetch/i.test(ua);
}
