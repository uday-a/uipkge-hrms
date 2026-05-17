/**
 * Mock data for the dashboard. Picked so the shape feels real — not
 * "Lorem KPI 1 / KPI 2". Numbers are hand-tuned so the charts read
 * well: hiring funnel narrows the way real funnels do, dept split has
 * an Eng-dominant skew typical of mid-size tech orgs, the headcount
 * trend has a real-looking ramp + a Q3 dip.
 *
 * All values here are intentionally static — no Date.now(), no
 * Math.random() — so SSR + client render the same strings.
 */

export interface KpiTile {
  label: string
  value: string
  delta?: { value: string; positive: boolean }
  spark?: number[]
  hint?: string
  /** Semantic colour + icon. Drives the sparkline + the icon chip.
   *  Maps to OKLCH tokens defined in @uipkge/tailwind. */
  tone: 'info' | 'success' | 'warning' | 'destructive'
  icon: string
}

export const KPI_TILES: KpiTile[] = [
  {
    label: 'Headcount',
    value: '247',
    delta: { value: '+12', positive: true },
    spark: [218, 222, 224, 228, 231, 235, 234, 238, 240, 243, 245, 247],
    hint: 'vs Apr 2025',
    tone: 'success',
    icon: 'Users',
  },
  {
    label: 'Open requisitions',
    value: '18',
    delta: { value: '+3', positive: true },
    spark: [9, 11, 12, 14, 14, 13, 15, 16, 17, 18, 18, 18],
    hint: '8 in offer stage',
    tone: 'info',
    icon: 'Briefcase',
  },
  {
    label: 'Attrition YTD',
    value: '4.2%',
    delta: { value: '-0.3pp', positive: true },
    spark: [4.8, 4.6, 4.5, 4.5, 4.4, 4.3, 4.3, 4.2, 4.2, 4.2, 4.2, 4.2],
    hint: 'Industry avg 5.1%',
    tone: 'warning',
    icon: 'UserMinus',
  },
  {
    label: 'Pending approvals',
    value: '7',
    delta: { value: '+2', positive: false },
    spark: [3, 4, 4, 5, 5, 5, 6, 5, 6, 6, 6, 7],
    hint: 'Time-off requests',
    tone: 'destructive',
    icon: 'Hourglass',
  },
]

export interface FunnelStage {
  name: string
  value: number
}

export const HIRING_FUNNEL: FunnelStage[] = [
  { name: 'Applied', value: 210 },
  { name: 'Screened', value: 184 },
  { name: 'Interviewed', value: 96 },
  { name: 'Offered', value: 58 },
  { name: 'Hired', value: 32 },
]

export interface DepartmentSplit {
  name: string
  value: number
  color: string
}

// Departments sized so the segmented arc reads cleanly — Eng anchors,
// supporting teams sized by ratio rather than equal slices.
export const DEPARTMENT_SPLIT: DepartmentSplit[] = [
  { name: 'Engineering', value: 124, color: '#3b82f6' },
  { name: 'Sales', value: 48, color: '#a855f7' },
  { name: 'Operations', value: 34, color: '#34d399' },
  { name: 'Design', value: 22, color: '#facc15' },
  { name: 'Marketing', value: 19, color: '#fb7185' },
]

export interface HeadcountPoint {
  month: string
  active: number
  newHires: number
  attrition: number
}

export const HEADCOUNT_TREND: HeadcountPoint[] = [
  { month: 'May', active: 218, newHires: 12, attrition: 4 },
  { month: 'Jun', active: 222, newHires: 8, attrition: 4 },
  { month: 'Jul', active: 224, newHires: 6, attrition: 4 },
  { month: 'Aug', active: 228, newHires: 8, attrition: 4 },
  { month: 'Sep', active: 231, newHires: 7, attrition: 4 },
  { month: 'Oct', active: 235, newHires: 8, attrition: 4 },
  { month: 'Nov', active: 234, newHires: 5, attrition: 6 },
  { month: 'Dec', active: 238, newHires: 9, attrition: 5 },
  { month: 'Jan', active: 240, newHires: 7, attrition: 5 },
  { month: 'Feb', active: 243, newHires: 8, attrition: 5 },
  { month: 'Mar', active: 245, newHires: 7, attrition: 5 },
  { month: 'Apr', active: 247, newHires: 9, attrition: 7 },
]

export type ActivityType =
  | 'hire'
  | 'time-off-approved'
  | 'time-off-request'
  | 'review-due'
  | 'offer-sent'
  | 'doc-signed'

export interface ActivityEntry {
  id: string
  type: ActivityType
  /**
   * UTC ISO instant for this event. Iter-27 introduced this field so the
   * dashboard's activity feed renders through `useTimeZone().format()` —
   * the same path the iter-26 header uses. Iter-28 makes this the single
   * source of truth for the row: both the per-row `HH:MM` clock AND the
   * day-grouping header ("Today" / "Yesterday" / "Apr 22, 2026") are now
   * derived from `timeUtc` against the zone-anchored `MOCK_TODAY_UTC` in
   * `dashboard.vue`. Previously each row carried both `timeUtc` AND a
   * frozen `day`/`time` pair, which silently desynced if the canonical
   * TODAY shifted in isolation. One field, one derivation.
   *
   * Authored as UTC offsets of the canonical "PT" demo zone: 09:14 PT in
   * May → PDT (UTC-7) → 16:14Z. Switching `useTimeZone().set('ET', 'America/New_York')`
   * re-renders every row's clock AND day-group label through
   * `Intl.DateTimeFormat` without the mock needing to re-emit strings.
   */
  timeUtc: string
  actor: { name: string; initials: string }
  text: string
  meta?: string
}

export const ACTIVITY: ActivityEntry[] = [
  // Iter-28: row shape collapsed to `timeUtc` only. Day grouping
  // ("Today" / "Yesterday" / dated) is derived in `dashboard.vue` against
  // the zone-anchored `MOCK_TODAY_UTC` so a future mock-date bump (or a
  // settings-driven zone flip) moves the day labels in lockstep with the
  // body's relative-date copy. Canonical TODAY = 2026-05-18,
  // "Yesterday" = 2026-05-17, far date = 2026-04-22.
  { id: 'a1', type: 'hire', timeUtc: '2026-05-18T16:14:00Z', actor: { name: 'Paige Nelson', initials: 'PN' }, text: 'started at Engineering · Senior Backend', meta: 'Welcome' },
  { id: 'a2', type: 'time-off-request', timeUtc: '2026-05-18T17:22:00Z', actor: { name: 'Marcus Rivera', initials: 'MR' }, text: 'requested PTO Apr 28 – May 2', meta: '4 working days' },
  // Iter-23: name the candidate for register parity. Neighbour rows
  // all reference real people (Kyle Newman, Paula Ingram, Paige Nelson); the
  // anonymous "Engineering Manager candidate" string broke the
  // named-actor convention. Lena Brandt (CAND-018) is the real offer-stage
  // candidate on the Engineering Manager req (REQ-2026-002) in the
  // recruiting mock layer — using her name keeps the dashboard's activity
  // feed honest against the rest of the mock surface.
  { id: 'a3', type: 'offer-sent', timeUtc: '2026-05-18T18:47:00Z', actor: { name: 'Diane Cho', initials: 'DC' }, text: 'sent offer to Lena Brandt for Engineering Manager', meta: 'Awaiting reply' },
  { id: 'a4', type: 'time-off-approved', timeUtc: '2026-05-17T22:08:00Z', actor: { name: 'Sarah Connor', initials: 'SC' }, text: 'approved Kyle Newman PTO May 12 – 18' },
  // Iter-22: voice/tone audit. Previous `a5` text "Q2 review cycle
  // opens for self-evaluation" used present-tense + missing article,
  // which broke the surrounding past-tense + definite-article register
  // (started / requested / sent / approved / countersigned). Bumped to
  // past tense ("opened") and kept the rest. `a6` "countersigned offer
  // letter" was article-less vs the corpus around it; promoted to
  // "countersigned the offer letter" for register parity.
  { id: 'a5', type: 'review-due', timeUtc: '2026-05-17T19:00:00Z', actor: { name: 'System', initials: 'sys' }, text: 'opened Q2 review cycle for self-evaluation', meta: 'Due Apr 30' },
  { id: 'a6', type: 'doc-signed', timeUtc: '2026-05-17T16:35:00Z', actor: { name: 'Aaron Morgan', initials: 'AM' }, text: 'countersigned the offer letter' },
  { id: 'a7', type: 'doc-signed', timeUtc: '2026-05-18T19:30:00Z', actor: { name: 'Lena Brandt', initials: 'LB' }, text: 'accepted offer for Engineering Manager', meta: 'Starts Jun 2' },
  { id: 'a8', type: 'time-off-request', timeUtc: '2026-05-18T20:05:00Z', actor: { name: 'Tariq Hassan', initials: 'TH' }, text: 'requested sick day for May 19', meta: '1 day' },
  { id: 'a9', type: 'offer-sent', timeUtc: '2026-05-18T21:12:00Z', actor: { name: 'Camila Souza', initials: 'CS' }, text: 'sent offer to Bella Romano for Marketing Lead', meta: 'Awaiting reply' },
  { id: 'a10', type: 'hire', timeUtc: '2026-05-17T15:24:00Z', actor: { name: 'Chen Liu', initials: 'CL' }, text: 'started at Product · Product Designer', meta: 'Welcome' },
  { id: 'a11', type: 'review-due', timeUtc: '2026-05-17T18:10:00Z', actor: { name: 'System', initials: 'sys' }, text: 'reminded 12 managers about peer-review submissions', meta: '5 days left' },
  { id: 'a12', type: 'doc-signed', timeUtc: '2026-05-17T14:42:00Z', actor: { name: 'Zara Ahmed', initials: 'ZA' }, text: 'signed updated NDA for vendor rollout' },
  { id: 'a13', type: 'time-off-approved', timeUtc: '2026-05-16T22:00:00Z', actor: { name: 'Diane Cho', initials: 'DC' }, text: 'approved Tariq Hassan PTO May 25 – 29' },
  { id: 'a14', type: 'hire', timeUtc: '2026-05-16T17:48:00Z', actor: { name: 'Mira Porter', initials: 'MP' }, text: 'started at Operations · Workplace Coordinator' },
  { id: 'a15', type: 'offer-sent', timeUtc: '2026-05-16T16:20:00Z', actor: { name: 'Simon Keller', initials: 'SK' }, text: 'sent offer to Jordan Hayes for SRE II', meta: 'Awaiting reply' },
  { id: 'a16', type: 'review-due', timeUtc: '2026-05-15T19:30:00Z', actor: { name: 'System', initials: 'sys' }, text: 'closed self-evaluations for Q2 review cycle', meta: '247 of 247' },
  { id: 'a17', type: 'doc-signed', timeUtc: '2026-05-15T16:00:00Z', actor: { name: 'Aaron Morgan', initials: 'AM' }, text: 'countersigned updated employment handbook' },
  { id: 'a18', type: 'hire', timeUtc: '2026-04-22T16:02:00Z', actor: { name: 'Laura Reed', initials: 'LR' }, text: 'started at Design · Senior Product Designer' },
  { id: 'a19', type: 'time-off-approved', timeUtc: '2026-04-22T21:18:00Z', actor: { name: 'Mark Vincent', initials: 'MV' }, text: 'approved Paula Ingram PTO May 5 – 9' },
]

export interface QuickAction {
  label: string
  description: string
  icon: string
  to: string
  requires?: 'admin' | 'manager'
}

export const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Add employee', description: 'Onboard a new hire end-to-end', icon: 'UserPlus', to: '/people/new', requires: 'admin' },
  { label: 'Approve time-off', description: '7 pending requests', icon: 'CalendarCheck', to: '/time-off', requires: 'manager' },
  { label: 'Start a review', description: 'Q2 cycle in progress', icon: 'ClipboardCheck', to: '/reviews' },
  { label: 'Open inbox', description: '3 unread HR messages', icon: 'Inbox', to: '/inbox' },
]
