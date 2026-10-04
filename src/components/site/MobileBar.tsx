"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { getLenis } from "@/lib/motion";
import { site } from "@/lib/site";
import { MotionToggle } from "./MotionToggle";
import { NavLinks } from "./NavLinks";
import { SocialIcon } from "./SocialIcon";

/** Mobile < 900 px: white top bar with the logo and a "MENU" button that opens a full-screen sheet (Miku Expo). */
export function MobileBar() {
  const sheet = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const show = () => {
    sheet.current?.showModal();
    getLenis()?.stop();
    setOpen(true);
  };
  const close = () => sheet.current?.close();

  return (
    <>
      <header className="mbar">
        <Link className="mbar__logo" href="/" data-splash-target-mobile>
          <img src="/brand/moesoft-logo.svg" alt="Moesoft home" width={127} height={40} />
        </Link>
        <button type="button" className="mbar__menu" aria-haspopup="dialog" aria-expanded={open} aria-controls="menu-sheet" onClick={show}>
          <span className="burger" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="mbar__menu-label">Menu</span>
        </button>
      </header>

      <dialog
        id="menu-sheet"
        ref={sheet}
        className="sheet"
        aria-label="Menu"
        data-lenis-prevent
        onClose={() => {
          setOpen(false);
          getLenis()?.start();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="sheet__inner">
          <div className="sheet__top">
            <Link className="mbar__logo" href="/" onClick={close}>
              <img src="/brand/moesoft-logo.svg" alt="Moesoft home" width={127} height={40} />
            </Link>
            <button type="button" className="mbar__menu mbar__menu--close" onClick={close} autoFocus>
              <span className="burger burger--x" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="mbar__menu-label">Close</span>
            </button>
          </div>
          <p className="sheet__label" aria-hidden="true">
            Menu ✿ {site.legalName}
          </p>
          <nav aria-label="Main">
            <NavLinks variant="sheet" onNavigate={close} />
          </nav>
          <div className="sheet__foot">
            <ul className="sheet__socials">
              {site.socials.map((s) => (
                <li key={s.id}>
                  <a href={s.href} data-track="outbound_click" data-track-target={s.id} {...(s.id === "email" ? {} : { target: "_blank", rel: "noopener noreferrer me" })}>
                    <SocialIcon id={s.id} size={20} />
                    <span>{s.label}</span>
                  </a>
                </li>
              ))}
            </ul>
            <MotionToggle />
          </div>
        </div>
      </dialog>
    </>
  );
}
