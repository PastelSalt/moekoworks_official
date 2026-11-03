"use client";

import Drawer from "@mui/material/Drawer";
import { ExternalLink, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/server/auth/actions";
import { NAV_GROUPS } from "./nav";
import { Flower } from "./Sticker";
import { ToastProvider } from "./Toast";

const isActive = (href: string, pathname: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

/** Kotoha shell: sticky top bar (brand · user badge · View site · Sign out) + floating sidebar panel; phone = drawer. */
export function AdminShell({ children, unread = 0, username }: { children: React.ReactNode; unread?: number; username: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="sidebar__nav" aria-label="Admin">
      {NAV_GROUPS.map((g) => (
        <div key={g.label ?? "top"} className="sidebar__group">
          {g.label ? (
            <p className="sidebar__label">
              <Flower tone={g.flower} />
              <span>{g.label}</span>
            </p>
          ) : null}
          <ul>
            {g.items.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className="sidebar__link" aria-current={isActive(href, pathname) ? "page" : undefined} onClick={() => setOpen(false)}>
                  <Icon aria-hidden />
                  <span>{label}</span>
                  {href === "/admin/messages" && unread > 0 ? (
                    <span className="sidebar__count" aria-label={`${unread} unread`}>
                      {unread}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <ToastProvider>
      <a className="askip" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <button type="button" className="icon-btn topbar__menu" aria-label="Menu" aria-expanded={open} aria-controls="admin-drawer" onClick={() => setOpen(true)}>
          <Menu aria-hidden />
        </button>
        <Link className="topbar__brand" href="/admin" aria-label="Moeko Works admin, dashboard">
          <img src="/brand/moekoworks-logo.svg" alt="" width={112} height={24} />
          <span>Admin</span>
        </Link>
        <div className="topbar__right">
          <span className="user-badge">
            <span className="user-badge__avatar" aria-hidden="true">
              <Flower tone="pink" />
            </span>
            <span className="user-badge__name">{username}</span>
            <span className="apill apill--owner">Owner</span>
          </span>
          <a className="abtn abtn--ghost abtn--sm" href="/" target="_blank" rel="noopener" aria-label="View site (opens a new tab)">
            <ExternalLink aria-hidden />
            <span>View site</span>
          </a>
          <form action={logoutAction}>
            <button type="submit" className="abtn abtn--ghost abtn--sm" aria-label="Sign out">
              <LogOut aria-hidden />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </header>

      <aside className="sidebar">{nav}</aside>
      <Drawer
        id="admin-drawer"
        variant="temporary"
        open={open}
        onClose={() => setOpen(false)}
        className="sidebar-drawer"
        slotProps={{ paper: { className: "sidebar sidebar--drawer" }, backdrop: { className: "adialog__backdrop" } }}
      >
        {nav}
      </Drawer>

      <main className="view" id="main" tabIndex={-1}>
        {children}
      </main>
    </ToastProvider>
  );
}
