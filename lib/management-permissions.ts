/** Role-based page access for the management portal. */

export const MANAGEMENT_ROLES = ["admin", "manager", "staff"] as const;
export type ManagementRole = (typeof MANAGEMENT_ROLES)[number];

export const MANAGEMENT_PAGES = {
  rooms: "/management/rooms",
  orders: "/management/orders",
  reports: "/management/reports",
  inventory: "/management/inventory",
  users: "/management/users",
  settings: "/management/settings",
} as const;

export type ManagementPageKey = keyof typeof MANAGEMENT_PAGES;

export const ALL_MANAGEMENT_PAGE_KEYS = Object.keys(
  MANAGEMENT_PAGES,
) as ManagementPageKey[];

const ROLE_ACCESS: Record<ManagementRole, readonly ManagementPageKey[]> = {
  admin: ["rooms", "orders", "reports", "inventory", "users", "settings"],
  manager: ["rooms", "orders", "reports", "inventory"],
  staff: ["rooms", "orders"],
};

export function isManagementRole(value: string): value is ManagementRole {
  return (MANAGEMENT_ROLES as readonly string[]).includes(value);
}

export function isManagementPageKey(value: string): value is ManagementPageKey {
  return (ALL_MANAGEMENT_PAGE_KEYS as readonly string[]).includes(value);
}

export function normalizeManagementRole(value: string | null | undefined): ManagementRole {
  if (value && isManagementRole(value)) return value;
  return "staff";
}

export function managementPagesForRole(role: ManagementRole): ManagementPageKey[] {
  return [...ROLE_ACCESS[role]];
}

export function parseStoredAllowedPages(raw: string | null | undefined): ManagementPageKey[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const pages = parsed.filter((k): k is ManagementPageKey => isManagementPageKey(String(k)));
    return pages.length > 0 ? pages : null;
  } catch {
    return null;
  }
}

export function serializeAllowedPages(pages: ManagementPageKey[]): string {
  const unique = [...new Set(pages)].filter(isManagementPageKey).sort();
  return JSON.stringify(unique);
}

export function effectivePagesForUser(
  role: ManagementRole,
  stored: ManagementPageKey[] | null,
): ManagementPageKey[] {
  if (stored && stored.length > 0) return stored;
  return managementPagesForRole(role);
}

export function managementHrefsForPages(pages: ManagementPageKey[]): string[] {
  return pages.map((k) => MANAGEMENT_PAGES[k]);
}

export function managementHrefsForRole(role: ManagementRole): string[] {
  return managementHrefsForPages(managementPagesForRole(role));
}

export function canAccessManagementPath(role: ManagementRole, pathname: string): boolean {
  return canAccessManagementPathWithPages(managementPagesForRole(role), pathname);
}

export function canAccessManagementPathWithPages(
  pages: ManagementPageKey[],
  pathname: string,
): boolean {
  const allowed = managementHrefsForPages(pages);
  return allowed.some((href) => pathname === href || pathname.startsWith(`${href}/`));
}

export function defaultManagementLandingPath(role: ManagementRole): string {
  return defaultManagementLandingPathForPages(managementPagesForRole(role));
}

export function defaultManagementLandingPathForPages(pages: ManagementPageKey[]): string {
  return MANAGEMENT_PAGES[pages[0] ?? "rooms"];
}

export function canManageUsers(pages: ManagementPageKey[]): boolean {
  return pages.includes("users");
}

export function managementPageKeyFromPath(pathname: string): ManagementPageKey | null {
  for (const [key, href] of Object.entries(MANAGEMENT_PAGES) as [ManagementPageKey, string][]) {
    if (pathname === href || pathname.startsWith(`${href}/`)) return key;
  }
  return null;
}

export function managementPageLabelKey(page: ManagementPageKey): string {
  switch (page) {
    case "rooms":
      return "mgmtNavRooms";
    case "orders":
      return "mgmtNavOrders";
    case "reports":
      return "mgmtNavReports";
    case "inventory":
      return "mgmtNavInventory";
    case "users":
      return "mgmtNavUsers";
    case "settings":
      return "mgmtNavSettings";
  }
}
