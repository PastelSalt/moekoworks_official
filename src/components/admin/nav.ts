import { Activity, Award, BarChart3, FolderKanban, LayoutDashboard, Mail, Shapes, UserRound, type LucideIcon } from "lucide-react";

// One list for the sidebar and the page heads, so the "No.xx" numbers always follow the sidebar order.
export type NavItem = { href: string; label: string; no: string; icon: LucideIcon };
export type NavGroup = { label: string | null; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  { label: null, items: [{ href: "/admin", label: "Dashboard", no: "No.00", icon: LayoutDashboard }] },
  {
    label: "Content",
    items: [
      { href: "/admin/projects", label: "Project History", no: "No.01", icon: FolderKanban },
      { href: "/admin/certifications", label: "Certifications", no: "No.02", icon: Award },
      { href: "/admin/tech", label: "Tech catalog", no: "No.03", icon: Shapes },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/admin/statistics", label: "Statistics", no: "No.04", icon: BarChart3 },
      { href: "/admin/activity", label: "Activity", no: "No.05", icon: Activity },
    ],
  },
  { label: "Inbox", items: [{ href: "/admin/messages", label: "Messages", no: "No.06", icon: Mail }] },
  { label: "You", items: [{ href: "/admin/account", label: "Account", no: "No.07", icon: UserRound }] },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
export const navItem = (href: string) => NAV_ITEMS.find((i) => i.href === href)!;
