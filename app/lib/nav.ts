/**
 * Sidebar navigation tree. Single source of truth — used by Sidebar02
 * for rendering and by AppBreadcrumb for "where am I" lookups. Adding a
 * page means: drop a row here + write the page file. The persona filter
 * happens at render time.
 *
 * Order here is the order the sidebar renders. Section labels split
 * groups. `requires` restricts a row to a persona level (or higher).
 */
import type { Persona } from '~/composables/usePersona'

export interface NavItem {
  label: string
  to?: string
  icon?: string
  requires?: Persona
  children?: NavItem[]
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const NAV: NavSection[] = [
  {
    label: 'Home',
    items: [{ label: 'Dashboard', to: '/dashboard', icon: 'LayoutDashboard' }],
  },
  {
    label: 'People',
    items: [
      { label: 'Directory', to: '/people', icon: 'Users' },
      { label: 'Add employee', to: '/people/new', icon: 'UserPlus', requires: 'admin' },
    ],
  },
  {
    label: 'Time',
    items: [{ label: 'Time-off', to: '/time-off', icon: 'CalendarClock' }],
  },
  {
    label: 'Performance',
    items: [{ label: 'Reviews', to: '/reviews', icon: 'ClipboardCheck' }],
  },
  {
    label: 'Recruiting',
    items: [{ label: 'Pipeline', to: '/recruiting', icon: 'Briefcase', requires: 'manager' }],
  },
  {
    label: 'Communication',
    items: [
      { label: 'Inbox', to: '/inbox', icon: 'Inbox' },
      { label: 'Chat', to: '/chat', icon: 'MessageSquare' },
      { label: 'Assistant', to: '/assistant', icon: 'Sparkles' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Headcount', to: '/analytics/headcount', icon: 'BarChart3', requires: 'manager' },
    ],
  },
  {
    label: 'Settings',
    items: [{ label: 'Workspace', to: '/settings', icon: 'Settings' }],
  },
]

/** Walks NAV + returns the matching item for a given path (or null). */
export function findNavItem(path: string): NavItem | null {
  for (const section of NAV) {
    for (const item of section.items) {
      if (item.to === path) return item
    }
  }
  return null
}

/** Filters NAV to only items the given persona can see. */
export function navForPersona(persona: Persona): NavSection[] {
  const order: Record<Persona, number> = { employee: 0, manager: 1, admin: 2 }
  return NAV.map((section) => ({
    label: section.label,
    items: section.items.filter((item) => {
      if (!item.requires) return true
      return order[persona] >= order[item.requires]
    }),
  })).filter((section) => section.items.length > 0)
}
