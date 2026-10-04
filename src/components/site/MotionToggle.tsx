"use client";

import { useSyncExternalStore } from "react";
import { deviceReduces, motionMode, onMotionChange, setMotionOff } from "@/lib/motion";
import { track } from "@/lib/track";

const subscribe = (cb: () => void) => onMotionChange(cb);

/** "MOTION ON / OFF" pill. When the device asks for less motion, the site follows it and the toggle is disabled. */
export function MotionToggle({ className = "" }: { className?: string }) {
  const mode = useSyncExternalStore(subscribe, motionMode, () => "full" as const);
  const device = useSyncExternalStore(subscribe, deviceReduces, () => false);
  const on = mode === "full";
  return (
    <button
      type="button"
      className={`motion-toggle ${className}`}
      aria-pressed={on}
      disabled={device}
      title={device ? "Your device asks for less motion" : undefined}
      onClick={() => {
        setMotionOff(on);
        track({ t: "motion_toggle", tg: on ? "off" : "on" });
      }}
    >
      <span className="motion-toggle__label">Motion</span>
      <span className="motion-toggle__track" aria-hidden="true">
        <span className="motion-toggle__thumb" />
      </span>
      <span className="motion-toggle__state">{on ? "On" : "Off"}</span>
    </button>
  );
}
