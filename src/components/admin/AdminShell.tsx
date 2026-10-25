"use client";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import { ExternalLink, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/server/auth/actions";
import { NAV_GROUPS, NAV_ITEMS } from "./nav";

const WIDTH = 256;
const isActive = (href: string, pathname: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

export function AdminShell({ children, unread = 0 }: { children: React.ReactNode; unread?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = NAV_ITEMS.find((i) => isActive(i.href, pathname));

  const nav = (
    <div className="aside">
      <Link href="/admin" className="aside__brand" aria-label="Dashboard" onClick={() => setOpen(false)}>
        <img src="/brand/moekoworks-logo.svg" alt="Moeko Works" width={176} height={38} />
        <span className="aside__badge">Admin</span>
      </Link>
      <nav className="aside__nav" aria-label="Admin">
        {NAV_GROUPS.map((g) => (
          <div key={g.label ?? "top"} className="aside__group">
            {g.label ? <p className="aside__group-label">{g.label}</p> : null}
            <ul>
              {g.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href, pathname);
                return (
                  <li key={href}>
                    <Link href={href} className="aside__link" aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>
                      <Icon size={18} aria-hidden />
                      <span>{label}</span>
                      {href === "/admin/messages" && unread > 0 ? (
                        <span className="aside__count" aria-label={`${unread} unread`}>
                          {unread}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="aside__foot">
        <Button component={Link} href="/" target="_blank" variant="outlined" color="secondary" endIcon={<ExternalLink size={14} aria-hidden />}>
          View site
        </Button>
        <form action={logoutAction}>
          <Button type="submit" fullWidth color="inherit" startIcon={<LogOut size={16} aria-hidden />}>
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      <AppBar position="fixed" elevation={0} className="admin-appbar" sx={{ display: { md: "none" }, bgcolor: "transparent", color: "text.primary" }}>
        <Toolbar>
          <IconButton edge="start" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu />
          </IconButton>
          <span className="admin-appbar__title">{current?.label ?? "Admin"}</span>
          {unread > 0 && current?.href !== "/admin/messages" ? (
            <Link href="/admin/messages" className="aside__count admin-appbar__count" aria-label={`${unread} unread messages`}>
              {unread}
            </Link>
          ) : null}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        open={open}
        onClose={() => setOpen(false)}
        sx={{ display: { md: "none" }, "& .MuiDrawer-paper": { width: WIDTH, bgcolor: "transparent", boxShadow: "none" } }}
      >
        {nav}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{ display: { xs: "none", md: "block" }, width: WIDTH, flexShrink: 0, "& .MuiDrawer-paper": { width: WIDTH, border: 0, bgcolor: "transparent" } }}
      >
        {nav}
      </Drawer>
      <Box component="main" className="admin-main" sx={{ flex: 1, minWidth: 0, mt: { xs: 8, md: 0 } }}>
        {children}
      </Box>
    </Box>
  );
}
