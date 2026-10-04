import { Fredoka, Lilita_One } from "next/font/google";

// Fredoka 400/700 for everything (plan §6.3); Lilita One only as the logo-echo display accent.
export const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

export const lilita = Lilita_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-lilita",
  display: "swap",
});
