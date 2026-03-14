import type { UserRole } from "@/types/database";

export interface NavigationItem {
  href: string;
  label: string;
  badge: string;
  allowedRoles?: UserRole[];
}

export const navigationItems: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", badge: "01" },
  { href: "/devices", label: "Devices", badge: "02" },
  { href: "/vulnerabilities", label: "Vulnerabilities", badge: "03" },
  { href: "/incidents", label: "Incidents", badge: "04" },
  { href: "/compliance", label: "Compliance", badge: "05" },
  { href: "/reports", label: "Reports", badge: "06" },
  { href: "/risk", label: "Risk", badge: "07" },
  { href: "/audit-logs", label: "Audit Logs", badge: "08" },
  { href: "/vendors", label: "Vendors", badge: "09" },
  { href: "/training", label: "Training", badge: "10" },
  { href: "/backups", label: "Backups", badge: "11" },
  { href: "/users", label: "Users", badge: "12", allowedRoles: ["admin"] },
];

export function getNavigationForRole(role?: UserRole | null) {
  return navigationItems.filter(
    (item) => !item.allowedRoles || (role ? item.allowedRoles.includes(role) : false),
  );
}
