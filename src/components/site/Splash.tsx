// Splash loader (plan §7.5): server-rendered overlay so the logo assembles on the very first paint, before any
// JavaScript. Shown once per browser session; skipped for crawlers and when JS never runs (CSS hard cap at 6 s).
import { SplashController } from "./SplashController";

export function Splash() {
  return (
    <div className="splash" data-splash-root aria-hidden="true">
      <div className="splash__bg">
        <span className="splash__wash splash__wash--pink" />
        <span className="splash__wash splash__wash--blue" />
      </div>
      <div className="splash__inner">
        <div className="splash__logo" data-splash-logo>
          <img className="splash__anim" src="/brand/moesoft-splash.svg" alt="" width={520} height={163} fetchPriority="high" />
          <img className="splash__static" src="/brand/moesoft-logo.svg" alt="" width={520} height={163} loading="lazy" />
        </div>
        <div className="splash__meta">
          <span>Loading ✿</span>
          <span className="splash__pct">
            <span data-splash-pct>0</span> %
          </span>
        </div>
        <div className="splash__bar">
          <span data-splash-bar />
        </div>
      </div>
      <SplashController />
    </div>
  );
}
