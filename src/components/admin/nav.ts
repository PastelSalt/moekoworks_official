import { Activity, Archive, Award, BarChart3, FolderKanban, LayoutDashboard, Mail, Shapes, UserRound, type LucideIcon } from "lucide-react";

// One list for the sidebar and the page heads, so the "No.xx" numbers always follow the sidebar order.
export type NavItem = { href: string; label: string; no: string; icon: LucideIcon };
export type NavGroup = { label: string | null; flower?: "pink" | "purple"; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  { label: null, items: [{ href: "/admin", label: "Dashboard", no: "No.00", icon: LayoutDashboard }] },
  {
    label: "Content",
    flower: "pink",
    items: [
      { href: "/admin/projects", label: "Project History", no: "No.01", icon: FolderKanban },
      { href: "/admin/certifications", label: "Certifications", no: "No.02", icon: Award },
      { href: "/admin/tech", label: "Tech catalog", no: "No.03", icon: Shapes },
    ],
  },
  {
    label: "Insights",
    flower: "purple",
    items: [
      { href: "/admin/statistics", label: "Statistics", no: "No.04", icon: BarChart3 },
      { href: "/admin/activity", label: "Activity", no: "No.05", icon: Activity },
      { href: "/admin/archive", label: "Archive", no: "No.06", icon: Archive },
    ],
  },
  { label: "Inbox", flower: "purple", items: [{ href: "/admin/messages", label: "Messages", no: "No.07", icon: Mail }] },
  { label: "You", flower: "pink", items: [{ href: "/admin/account", label: "My Account", no: "No.08", icon: UserRound }] },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
export const navItem = (href: string) => NAV_ITEMS.find((i) => i.href === href)!;
