import type { ReactNode } from "react";
import "@/styles/shell.css";
import "@/styles/components.css";
import "@/styles/projects.css";
import "@/styles/motion.css";
import { FlowerFall } from "@/components/decor/FlowerFall";
import { Footer } from "./Footer";
import { MobileBar } from "./MobileBar";
import { MotionRoot } from "./MotionRoot";
import { PageTop } from "./PageTop";
import { Sidebar } from "./Sidebar";
import { Splash } from "./Splash";
import { Tracker } from "./Tracker";

/** The public frame: splash, falling background flowers, sidebar (desktop) or top bar (mobile), main column, footer, PAGE TOP, motion. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Splash />
      <FlowerFall />
      <div className="site" id="top">
        <Sidebar />
        <div className="site__col">
          <MobileBar />
          <main id="main" className="site__main" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </div>
      </div>
      <PageTop />
      <MotionRoot />
      <Tracker />
    </>
  );
}
