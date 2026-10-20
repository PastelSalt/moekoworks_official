import type { Metadata, Viewport } from "next";
import { InlineScript } from "@/components/InlineScript";
import { site } from "@/lib/site";
import { fredoka, lilita } from "@/theme/fonts";
import ThemeRegistry from "@/theme/ThemeRegistry";
import "@/theme/tokens.css";
import "@/theme/base.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline.toLowerCase()}`, template: `%s · ${site.name}` },
  description: "Creative websites and the systems behind them: projects and certifications by Kyle Zoleta.",
  applicationName: site.name,
  authors: [{ name: site.owner }],
  openGraph: { type: "website", siteName: site.name, locale: "en_US" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#FFB4E3", colorScheme: "light" };

// Decide motion mode and splash before first paint so nothing flickers (kotoha's motion-boot pattern).
// data-splash: "show" (first visit this session) → "done" after the splash; "skip" for repeat visits and crawlers.
// The timer is the splash's hard cap (6.5 s) even if the app bundle never loads.
// Pre-rename keys (ms_*) move to mw_* once, so motion and "don't count my visits" survive the rebrand.
const prepaint = `(function(){var d=document.documentElement;try{['motion','nt'].forEach(function(k){var v=localStorage.getItem('ms_'+k);if(v!==null){localStorage.setItem('mw_'+k,v);localStorage.removeItem('ms_'+k);}});var off=localStorage.getItem('mw_motion')==='off';var r=matchMedia('(prefers-reduced-motion: reduce)').matches;d.dataset.motion=(off||r)?'calm':'full';var bot=/bot|crawl|spider|slurp|lighthouse|preview|externalhit/i.test(navigator.userAgent);d.dataset.splash=(bot||sessionStorage.getItem('mw_splash')==='1')?'skip':'show';}catch(e){d.dataset.motion='full';d.dataset.splash='skip';}d.classList.add('js');setTimeout(function(){if(d.dataset.splash==='show'){d.dataset.splash='done';}},6500);})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fredoka.variable} ${lilita.variable}`} suppressHydrationWarning>
      <head>
        <InlineScript html={prepaint} />
      </head>
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
