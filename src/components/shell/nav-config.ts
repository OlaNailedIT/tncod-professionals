/**
 * Presentational navigation destinations from locked Phase 1 IA.
 * Not authorization — UI destination lists only.
 */

export type NavItem = {
  href: string;
  label: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const publicNavItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/professionals", label: "Professionals" },
  { href: "/join", label: "Join" },
  { href: "/sign-in", label: "Sign in" },
];

export const memberNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/professionals", label: "Directory" },
  { href: "/profile", label: "Profile" },
  { href: "/businesses", label: "Businesses" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/settings", label: "Settings" },
];

/** Account affordances — Sign out posts to /auth/sign-out (Phase 7). */
export const memberAccountItems: NavItem[] = [
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
  { href: "/auth/sign-out", label: "Sign out" },
];

/** Workspace entry. Shown only after the server access check. Not a role claim. */
export const excoWorkspaceItem: NavItem = { href: "/exco", label: "EXCO" };

export function memberNavigationItems(showExco: boolean): NavItem[] {
  return showExco ? [...memberNavItems, excoWorkspaceItem] : memberNavItems;
}

export function memberAccountMenuItems(showExco: boolean): NavItem[] {
  return showExco ? [excoWorkspaceItem, ...memberAccountItems] : memberAccountItems;
}

export const excoNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/exco", label: "Dashboard" },
      { href: "/exco/analytics", label: "Analytics" },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/exco/professionals", label: "Professionals" },
      { href: "/exco/businesses", label: "Businesses" },
      { href: "/opportunities", label: "Opportunities" },
    ],
  },
  {
    label: "Workflows",
    items: [
      { href: "/exco/verification", label: "Verification" },
      { href: "/exco/spotlight", label: "Spotlight" },
    ],
  },
];

export const excoNavItems: NavItem[] = excoNavGroups.flatMap((g) => g.items);
