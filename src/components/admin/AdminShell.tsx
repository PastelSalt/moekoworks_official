"use client";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import {
  Activity,
  Award,
  BarChart3,
  FolderKanban,
  LayoutDashboard,
  Mail,
  Menu,
  Shapes,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/server/auth/actions";

const WIDTH = 248;
type Item = { href: string; label: string; icon: LucideIcon; ready: boolean };
const NAV: Item[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, ready: true },
  { href: "/admin/projects", label: "Project History", icon: FolderKanban, ready: true },
  { href: "/admin/certifications", label: "Certifications", icon: Award, ready: true },
  { href: "/admin/statistics", label: "Statistics", icon: BarChart3, ready: true },
  { href: "/admin/messages", label: "Messages", icon: Mail, ready: true },
  { href: "/admin/tech", label: "Tech catalog", icon: Shapes, ready: true },
  { href: "/admin/activity", label: "Activity", icon: Activity, ready: true },
  { href: "/admin/account", label: "Account", icon: UserRound, ready: true },
];

export function AdminShell({ children, unread = 0 }: { children: React.ReactNode; unread?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "background.paper" }}>
      <Box sx={{ p: 2.5, pb: 1 }}>
        <Link href="/admin" aria-label="Dashboard">
          <img src="/brand/moekoworks-logo.svg" alt="Moeko Works" width={180} height={39} />
        </Link>
        <p className="admin-label" style={{ marginTop: 6 }}>Admin</p>
      </Box>
      <List sx={{ px: 1.5, flex: 1 }}>
        {NAV.map(({ href, label, icon: Icon, ready }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <ListItemButton
              key={href}
              component={ready ? Link : "div"}
              href={ready ? href : undefined}
              selected={active}
              disabled={!ready}
              onClick={() => setOpen(false)}
              sx={{
                borderRadius: 999,
                mb: 0.5,
                "&.Mui-selected": { bgcolor: "primary.main", "&:hover": { bgcolor: "primary.light" } },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Icon size={18} aria-hidden />
              </ListItemIcon>
              <ListItemText primary={label} slotProps={{ primary: { sx: { fontWeight: active ? 700 : 400 } } }} />
              {!ready && <Chip label="soon" size="small" variant="outlined" />}
              {label === "Messages" && unread > 0 && <Chip label={unread} size="small" color="primary" />}
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ p: 2, display: "grid", gap: 1 }}>
        <Button component={Link} href="/" target="_blank" variant="outlined" color="secondary">
          View site
        </Button>
        <form action={logoutAction}>
          <Button type="submit" fullWidth color="inherit">
            Sign out
          </Button>
        </form>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{ display: { md: "none" }, bgcolor: "background.paper", color: "text.primary", borderBottom: 1, borderColor: "divider" }}
      >
        <Toolbar>
          <IconButton edge="start" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu />
          </IconButton>
          <Typography sx={{ ml: 1, fontWeight: 700 }}>
            Moeko Works admin
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        open={open}
        onClose={() => setOpen(false)}
        sx={{ display: { md: "none" }, "& .MuiDrawer-paper": { width: WIDTH } }}
      >
        {nav}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{ display: { xs: "none", md: "block" }, width: WIDTH, flexShrink: 0, "& .MuiDrawer-paper": { width: WIDTH, borderRight: 1, borderColor: "divider" } }}
      >
        {nav}
      </Drawer>
      <Box component="main" className="admin-main" sx={{ flex: 1, mt: { xs: 8, md: 0 } }}>
        {children}
      </Box>
    </Box>
  );
}
