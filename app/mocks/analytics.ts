/**
 * Mock data for the headcount analytics page. Hand-tuned (no Math.random,
 * no Date.now) so SSR + client render identical strings.
 *
 * "Today" across the demo is 2026-05-18. The 12-month trend therefore
 * spans Jun 2025 → May 2026. Totals reconcile across slices:
 *
 *   sum(DEPT_BREAKDOWN) = 275
 *   sum(LOCATION_SPLIT) = 275
 *   sum(TENURE_BUCKETS) = 275
 *   sum(LEVEL_DISTRIBUTION) = 275
 *   sum(GENDER_DISTRIBUTION) = 275
 *   sum(ATTRITION_REASONS) = 43   (trailing 12mo)
 *
 * The trend ramps from 245 → 275 (+30 net), with monthly hires
 * exceeding monthly attrition the way a growing org reads.
 */

export interface KpiSummary {
  label: string
  value: string
  delta?: { value: string; positive: boolean; label?: string }
  hint?: string
}

// Headline tiles shown above the trend chart. Values match the more
// detailed slices below so the page is internally consistent.
export const HEADLINE_KPIS: KpiSummary[] = [
  {
    label: 'Total headcount',
    value: '275',
    delta: { value: '+12%', positive: true, label: 'YoY' },
    hint: 'vs 246 in May 2025',
  },
  {
    label: 'Attrition rate YTD',
    value: '4.2%',
    delta: { value: '-0.3pp', positive: true, label: 'YoY' },
    hint: 'Industry avg 5.1%',
  },
  {
    label: 'Avg tenure',
    value: '2.3 yr',
    delta: { value: '+4 mo', positive: true, label: 'YoY' },
    hint: 'Across all active employees',
  },
  {
    label: 'Open requisitions',
    value: '8',
    delta: { value: '+1', positive: true, label: 'MoM' },
    hint: '4 in offer stage',
  },
]

export interface HeadcountPoint {
  month: string
  active: number
  newHires: number
  attrition: number
}

// Jun 2025 → May 2026. Active rolls forward via (prev + newHires -
// attrition) so the line is self-consistent if a reader recomputes it.
export const HEADCOUNT_TREND_12MO: HeadcountPoint[] = [
  { month: 'Jun', active: 245, newHires: 7, attrition: 3 },
  { month: 'Jul', active: 249, newHires: 6, attrition: 2 },
  { month: 'Aug', active: 253, newHires: 7, attrition: 3 },
  { month: 'Sep', active: 257, newHires: 8, attrition: 4 },
  { month: 'Oct', active: 261, newHires: 7, attrition: 3 },
  { month: 'Nov', active: 264, newHires: 6, attrition: 3 },
  { month: 'Dec', active: 266, newHires: 5, attrition: 3 },
  { month: 'Jan', active: 268, newHires: 6, attrition: 4 },
  { month: 'Feb', active: 270, newHires: 5, attrition: 3 },
  { month: 'Mar', active: 272, newHires: 6, attrition: 4 },
  { month: 'Apr', active: 274, newHires: 6, attrition: 4 },
  { month: 'May', active: 275, newHires: 8, attrition: 7 },
]

export interface BreakdownRow {
  name: string
  value: number
  // Token-friendly hex used as a swatch dot. Same palette family as
  // dashboard.ts DEPARTMENT_SPLIT so the two pages read consistently.
  color: string
}

// Eight departments, sums to 275. Sorted desc by value at author-time
// so the bar list looks pre-sorted in the SSR markup as well.
export const DEPT_BREAKDOWN: BreakdownRow[] = [
  { name: 'Engineering', value: 124, color: '#3b82f6' },
  { name: 'Sales', value: 48, color: '#a855f7' },
  { name: 'Operations', value: 34, color: '#34d399' },
  { name: 'Design', value: 22, color: '#facc15' },
  { name: 'Marketing', value: 19, color: '#fb7185' },
  { name: 'Product', value: 12, color: '#22d3ee' },
  { name: 'People', value: 8, color: '#f97316' },
  { name: 'Finance', value: 8, color: '#94a3b8' },
]

// Six locations, sums to 275. San Francisco anchors as the largest hub
// (consistent with the EMPLOYEES mock in people.ts).
export const LOCATION_SPLIT: BreakdownRow[] = [
  { name: 'San Francisco', value: 138, color: '#3b82f6' },
  { name: 'New York', value: 56, color: '#a855f7' },
  { name: 'London', value: 32, color: '#34d399' },
  { name: 'Berlin', value: 24, color: '#facc15' },
  { name: 'Sydney', value: 14, color: '#fb7185' },
  { name: 'Remote', value: 11, color: '#94a3b8' },
]

export interface TenureBucket {
  label: string
  value: number
}

// Five buckets, sums to 275. Shape mirrors a healthy growth-stage org:
// long-tail of veterans, fat middle of 1-3yr ICs, modest fresh cohort.
export const TENURE_BUCKETS: TenureBucket[] = [
  { label: '<6mo', value: 38 },
  { label: '6-12mo', value: 52 },
  { label: '1-2yr', value: 78 },
  { label: '2-3yr', value: 61 },
  { label: '3+yr', value: 46 },
]

export interface AttritionReason {
  reason: string
  value: number
  // Token-friendly tone used to colour the bar. Mapped at render time
  // to bg-* classes so the consumer can read the intent at a glance.
  tone: 'destructive' | 'warning' | 'muted' | 'info'
}

// Trailing 12-month departures, sums to 43. "Voluntary" here means
// resignations without a more specific reason logged in the exit
// interview -- those that disclosed a reason are pulled into the
// other buckets.
export const ATTRITION_REASONS: AttritionReason[] = [
  { reason: 'Voluntary', value: 18, tone: 'muted' },
  { reason: 'Better offer', value: 12, tone: 'info' },
  { reason: 'Relocation', value: 6, tone: 'warning' },
  { reason: 'Performance', value: 3, tone: 'destructive' },
  { reason: 'Other', value: 4, tone: 'muted' },
]

// Generic, non-controversial level categories -- match what most HRIS
// systems expose by default. IC = individual contributor.
export const LEVEL_DISTRIBUTION: BreakdownRow[] = [
  { name: 'IC', value: 198, color: '#3b82f6' },
  { name: 'Manager', value: 52, color: '#a855f7' },
  { name: 'Director', value: 18, color: '#34d399' },
  { name: 'VP+', value: 7, color: '#facc15' },
]

// Gender categories use neutral labels; "Undisclosed" captures the
// employees who declined to self-identify, which most modern HRIS
// surfaces explicitly.
export const GENDER_DISTRIBUTION: BreakdownRow[] = [
  { name: 'Women', value: 124, color: '#a855f7' },
  { name: 'Men', value: 138, color: '#3b82f6' },
  { name: 'Non-binary', value: 6, color: '#34d399' },
  { name: 'Undisclosed', value: 7, color: '#94a3b8' },
]

export interface HiringPipeline {
  department: string
  open: number
  filled: number
  // Total reqs allocated for the quarter (open + filled). Used to
  // compute fill-rate progress in the UI.
  planned: number
}

// Top 5 hiring departments + their YTD pipeline. `filled` excludes
// rescinded offers. Engineering anchors the plan; the rest taper.
export const TOP_HIRING_DEPARTMENTS: HiringPipeline[] = [
  { department: 'Engineering', open: 4, filled: 18, planned: 24 },
  { department: 'Sales', open: 2, filled: 7, planned: 10 },
  { department: 'Operations', open: 1, filled: 4, planned: 6 },
  { department: 'Design', open: 1, filled: 3, planned: 5 },
  { department: 'Product', open: 0, filled: 2, planned: 3 },
]
