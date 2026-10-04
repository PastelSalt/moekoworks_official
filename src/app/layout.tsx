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
const prepaint = `(function(){var d=document.documentElement;try{var off=localStorage.getItem('ms_motion')==='off';var r=matchMedia('(prefers-reduced-motion: reduce)').matches;d.dataset.motion=(off||r)?'calm':'full';d.dataset.splash=sessionStorage.getItem('ms_splash')==='1'?'done':'show';}catch(e){d.dataset.motion='full';d.dataset.splash='done';}d.classList.add('js');})();`;

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
