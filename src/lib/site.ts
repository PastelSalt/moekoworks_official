// Public site configuration (plan §4). Only what's necessary: no handle, no photo, no city.
export const site = {
  name: "Moeko Works",
  owner: "Kyle Zoleta",
  tagline: "A portfolio by Kyle Zoleta",
  intro: "Creative websites, and the systems behind them.",
  since: 2026,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://moekoworks.vercel.app",
  email: "zoletakyle.1111@gmail.com",
  replyNote: "I usually reply within a day or two (Philippine time, GMT+8).",
  socials: [
    { id: "github", label: "GitHub", handle: "PastelSalt", href: "https://github.com/PastelSalt" },
    { id: "email", label: "E-mail", handle: "zoletakyle.1111@gmail.com", href: "mailto:zoletakyle.1111@gmail.com" },
    { id: "facebook", label: "Facebook", handle: "Kyle Zoleta", href: "https://web.facebook.com/moemorimoeko/" },
  ],
  nav: [
    { href: "/about", label: "About", caption: "Profile" },
    { href: "/contact", label: "Contact", caption: "Message" },
    { href: "/history", label: "History", caption: "Projects" },
  ],
} as const;

export type SocialId = (typeof site.socials)[number]["id"];
