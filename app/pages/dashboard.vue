<script setup lang="ts">
/**
 * Dashboard -- day-one home for the current persona.
 *
 * Vertical rhythm (top to bottom):
 *   1. Header strip                 -- greeting + "Today" highlight row
 *   2. KPI band                     -- 4 tiles, each with sparkline
 *   3. Hiring funnel + Dept gauge   -- 7/5 split on lg
 *   4. Headcount trend              -- area chart, full width
 *   5. Out-of-office today          -- 7/5 split with team OOO + birthdays/anniversaries
 *   6. Recent hires + Top reqs      -- 6/6 split
 *   7. Activity feed + Quick actions-- 8/4 split
 *
 * Colour values come from OKLCH semantic tokens (--primary, --success,
 * --warning, --destructive, --info, --chart-1..5) so the dark/light
 * flip + future theme customizer ripple through the whole surface.
 *
 * Real consumers swap the mock imports for fetch calls; the
 * transformations stay the same.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import {
  ArrowDown, ArrowUp,
  Banknote, CalendarCheck, Inbox, UserPlus, FileText, FileCheck, MailOpen,
  Users, Briefcase, UserMinus, Hourglass,
  Cake, PartyPopper, Sparkles, ChevronRight, Clock, CalendarDays, CheckCircle2,
  Keyboard, Globe, Check,
} from 'lucide-vue-next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { KpiGrid } from '@/components/ui/kpi-grid'
import HrKpiTile from '@/components/HrKpiTile.vue'
import { PieChart } from '@/components/ui/charts/pie-chart'
import ConversionFunnel from '@/components/blocks/ConversionFunnel.vue'
import { AreaChart } from '@/components/ui/charts/area-chart'
import { chartColors, chartTextColor, toRgba } from '@/components/ui/charts/useChartTheme'
import { Timeline, TimelineItem, TimelineMedia, TimelineContent, TimelineTitle, TimelineDate } from '@/components/ui/timeline'
import { OverlayScroll } from '@/components/ui/overlay-scroll'

import {
  KPI_TILES,
  HIRING_FUNNEL,
  DEPARTMENT_SPLIT,
  HEADCOUNT_TREND,
  ACTIVITY,
  QUICK_ACTIONS,
  type ActivityEntry,
} from '~/mocks/dashboard'
import { EMPLOYEES, findEmployee } from '~/mocks/people'
import { REQUESTS, ooOnDay, findRequester, REQUEST_TYPE_LABELS } from '~/mocks/time-off'
import { REQUISITIONS, CANDIDATES, findHiringManager, STAGE_LABELS, type Stage } from '~/mocks/recruiting'

useHead({ title: 'Dashboard · uipkge HRMS' })

const { current: persona } = usePersona()

// Iter-27: dev-build flag for the "dev · mock" header chip below. Vue's
// `<script setup>` doesn't auto-expose `$isDev`, so bind it explicitly.
// `import.meta.dev` is a Nuxt-injected boolean evaluated at compile time —
// the chip's `v-if` becomes `v-if="false"` in production and the whole
// `<Badge>` subtree is dead-code-eliminated, so end users never see it.
const isDev = import.meta.dev

// Simulated data-readiness window: gates KPI tiles + chart sections on
// `useDataReady` so the page paints skeletons before the real data
// lands. Mock surface is sync today; this models what a real consumer
// will see when their `useFetch` is in-flight. See composable header
// comment for the SSR-safety rationale.
const ready = useDataReady(450)

const TODAY = '2026-05-18' // canonical demo "now"

// Locale-fixed month-abbreviation table. Used by `shortDate()` further
// down and by the iter-24 header `useNow()` formatter; declared up here
// so the live-clock computeds below can reference it without
// use-before-declaration warnings. (Iter-27: also consumed by the
// `MOCK_TODAY_UTC` derivation just below to map a formatter month string
// back to a numeric index.)
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

// Iter-25: single source of truth for the body's mock-today UTC
// timestamp. The page's relative-date helpers (`daysUntil`, `daysOpen`,
// `anniversaryCountdown`) all previously inlined `Date.UTC(2026, 4, 18)`
// — three magic-number triples that each restated the canonical TODAY
// in a different place, and silently desynced from `TODAY` if either
// got edited in isolation. Lifting to a derived constant means a future
// mock-date bump only touches the `TODAY` string above; the math
// helpers reference one anchor. Also makes the iter-24 carry-over
// "tense seam" visible to a code reader: the header binds to live
// `useNow()` (true wall clock), the body binds to `MOCK_TODAY_UTC`
// (frozen demo snapshot). Real consumers swap MOCK_TODAY_UTC for a
// live `Date.now()`-based truncation when they wire real data.
//
// Iter-27: the derivation now routes through `useTimeZone().format()` so
// the anchor is *zone-anchored*, not pure-UTC. Before iter-27,
// `Date.UTC(2026, 4, 18)` represented 2026-05-18 00:00 UTC, which is
// 2026-05-17 17:00 PT — so the body's "today" boundary was 7 hours off
// from the header's PT-anchored "today". With iter-26's IANA math layer
// in place, we project a noon-UTC probe of TODAY through `formatZoned()`,
// extract the y/m/d the iana zone sees, and rebuild a UTC ms anchor
// from those parts. Result for the default `America/Los_Angeles`:
// formatZoned reads `May 18` on the probe, so the anchor stays
// `Date.UTC(2026, 4, 18)` (same value as iter-25, pixel-identical
// behaviour). The swap path is now wired — flipping iana to
// `Pacific/Kiritimati` (UTC+14) would shift the day to May 19, moving
// the body's "today" boundary in lockstep with the header. Closes the
// iter-26 zone-anchored MOCK_TODAY_UTC carry-over.
const [TODAY_Y, TODAY_M, TODAY_D] = TODAY.split('-').map(Number) as [number, number, number]
const MOCK_TODAY_UTC = (() => {
  // Probe at noon UTC so we stay inside the same calendar day across
  // every IANA zone (no UTC±14 zone can flip noon-UTC to the next day).
  // Then read what y/m/d the configured zone sees for that probe — that's
  // the "today" the header uses, so the body should reference the same.
  const probe = new Date(Date.UTC(TODAY_Y, TODAY_M - 1, TODAY_D, 12))
  // `useTimeZone()` is module-scoped state (default zone PT/America/Los_Angeles).
  // SSR-safe: Intl.DateTimeFormat is a JS standard, no DOM access.
  const { format } = useTimeZone()
  const p = format(probe)
  // Build pure-UTC midnight of the zone's calendar day. The helpers below
  // compare event dates (also Date.UTC(y,m-1,d)) against this anchor, so
  // both sides of every diff live on the same SSR-stable UTC plane.
  const monthIdx = MONTH_SHORT.indexOf(p.month as (typeof MONTH_SHORT)[number])
  return Date.UTC(p.year, monthIdx >= 0 ? monthIdx : TODAY_M - 1, p.day)
})()

// ── Live "now" clock ────────────────────────────────────────────────────────
// Iter-24 closes the longest-open carry-over (since iter-19 — 5 iters
// running): the header weekday strip + date badge were hardcoded to
// `Mon, May 18 · 09:00 PT — day 1 of 5`, so the most-visible temporal
// anchor on the page was a static lie that desynced from the wall
// clock the moment a user loaded the surface on any day other than
// Monday morning. The new `useNow()` composable yields a reactive Date
// ref that ticks every 60s; the three computeds below project it into
// the header chrome (strip filled segments, formatted "As of …" string,
// and the matching aria-label). The underlying mock layer still pins
// TODAY = 2026-05-18 for SSR-stable demo data, so this only re-binds
// the *header* — the rest of the page's relative timestamps (5d ago,
// In 4d, back May 23) intentionally stay anchored to the canonical
// demo "now" so the mock doesn't drift into nonsense overnight.
const now = useNow()
// Iter-25 centralised the zone LABEL (cosmetic suffix). Iter-26 closes
// the math half: `useTimeZone().format(date)` projects the Date through
// `Intl.DateTimeFormat` against the configured IANA zone so the rendered
// hour/minute/weekday actually match the suffix label. Before iter-26 the
// header read `04:18 PT` using `now.getHours()` (browser-LOCAL time) with
// a static `PT` string — a viewer in Berlin or Tokyo saw their wall
// clock dressed up as Pacific. Now `format()` returns hour/minute/day
// anchored to `America/Los_Angeles` regardless of viewer locale, DST
// transitions handled automatically by Intl.DateTimeFormat.
const { label: timeZone, format: formatZoned } = useTimeZone()
// Mon=0 … Fri=4 for the work-week strip; Sat/Sun collapse to Fri (4)
// so weekend viewers still see a full strip rather than an empty row.
// `dow` is now zone-anchored (iter-26) — a Monday morning in Tokyo
// shows as Sunday afternoon in PT, and the strip should reflect the
// strip's reference zone, not the viewer's wall clock.
const workWeekIndex = computed(() => {
  const dow = formatZoned(now.value).dow // 0=Sun … 6=Sat, zone-anchored
  if (dow === 0) return 4 // Sun → show full Fri
  if (dow >= 6) return 4 // Sat → show full Fri
  return dow - 1 // Mon=1→0, Fri=5→4
})
function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n)
}
const headerDateLabel = computed(() => {
  // Format: "Mon, May 18 · 09:00 PT" — Intl.DateTimeFormat (iter-26)
  // emits 'short' weekday + month strings in en-US so SSR + browser
  // outputs stay pixel-identical (locale fixed). Hour/minute/day are
  // zone-anchored through `iana` (defaults to America/Los_Angeles).
  const p = formatZoned(now.value)
  return `As of ${p.weekday}, ${p.month} ${p.day} · ${pad2(p.hour)}:${pad2(p.minute)} ${timeZone.value}`
})
const headerAriaLabel = computed(() => {
  const p = formatZoned(now.value)
  return `As of ${p.weekday}, ${p.month} ${p.day}, ${pad2(p.hour)}:${pad2(p.minute)} ${timeZone.value} — day ${workWeekIndex.value + 1} of 5 in the work week`
})

// Iter-29: real-data flag. Closes the iter-27/28 carry-over: the
// `dev · mock` chip below was hardcoded to `import.meta.dev`, so a dev
// session wired to a real API would keep the chip on screen while the
// surface actually rendered live data — the chip would silently lie.
// `useRealData()` is a module-scoped reactive boolean (defaults `false`
// — every consumer today is mock-backed); the chip now gates on
// `isDev && !realData`, so a future `set(true)` from the real-data
// adapter hides the chip in lockstep with the swap.
const { enabled: realData, set: setRealData } = useRealData()

// Iter-30 (FINAL): zone-picker popover. Iter-25 built `useTimeZone()` as
// the cosmetic-suffix seam; iter-26 extended it with IANA math via
// `Intl.DateTimeFormat`; iter-27 wired the activity-row clocks AND the
// frozen body `MOCK_TODAY_UTC` derivation through the same `format()`
// path; iter-28 derived activity day-group labels from `timeUtc` too;
// iter-29 closed the loop with a live-tooltip dev chip. Five iters of
// temporal-composable plumbing — but `useTimeZone().set(...)` still had
// ZERO UI consumer (carry-over named at every iter from 25 through 29).
// This iter ships the consumer: a 4-preset zone picker anchored on a
// small Globe button next to the date badge. Clicking PT/ET/UTC/CT
// re-renders, in lockstep, the header date label + weekday strip, the
// body's MOCK_TODAY_UTC anchor (already wired since iter-27), the
// activity-feed row clocks (iter-27), day-group labels (iter-28), the
// "All times shown in …" footer (iter-25), and the dev-chip tooltip's
// header-live half (iter-29). One click exercises the entire temporal
// infrastructure five iters built. Also folds in a `useRealData()`
// toggle row inside the same popover so the iter-29 composable gets a
// first real consumer too — flipping it hides the `dev · mock` chip
// live, demonstrating the gating wired in iter-29 actually works.
//
// Note on MOCK_TODAY_UTC reactivity (carry-over from iter-27): the body
// anchor was derived once at module load via an IIFE through
// `useTimeZone().format()`. A settings flip AFTER initial render moves
// the header + activity row clocks (those re-format `now.value` /
// `item.timeUtc` reactively) but does NOT shift the body's "today"
// boundary. Header + body therefore stay in step for the default load
// path (both compute against the default zone) but a runtime zone flip
// only re-anchors the live half. The seam is documented in source; a
// future iter could lift MOCK_TODAY_UTC to a reactive computed, but
// that's a bigger refactor (helpers consuming it would need to become
// effectful) and out of scope for the loop's final polish pass.
const ZONE_PRESETS = [
  { label: 'PT', iana: 'America/Los_Angeles', name: 'Pacific' },
  { label: 'CT', iana: 'America/Chicago', name: 'Central' },
  { label: 'ET', iana: 'America/New_York', name: 'Eastern' },
  { label: 'UTC', iana: 'UTC', name: 'Coordinated Universal' },
] as const
const zoneOpen = ref(false)
const { set: setZone, iana: currentIana } = useTimeZone()
function onSelectZone(label: string, iana: string) {
  setZone(label, iana)
  zoneOpen.value = false
}

// Iter-29: live tooltip strings for the `dev · mock` chip. Iter-27 shipped
// the chip with a static `title`/`aria-label` that named the seam in the
// abstract ("Header: live useNow() · Body: frozen MOCK_TODAY_UTC") but
// gave no live evidence the seam was actually active. Now that the iter-26
// `useZonedParts(dateRef)` reactive computed has a first direct consumer
// here, the tooltip shows BOTH sides of the seam in human-readable form
// and updates every 60s as `useNow()` ticks. `useZonedParts(now)` is the
// reactive form of `formatZoned(now.value)` — feeds the tooltip computed
// without a manual `computed(() => formatZoned(now.value))` boilerplate.
const headerNowParts = useZonedParts(now)
// Body anchor label — the canonical demo "today" (May 18, 2026 in the
// configured zone). NOTE: don't format `new Date(MOCK_TODAY_UTC)` through
// the zone — that constant is a PURE-UTC midnight used for ms-arithmetic
// day-diffs, not a wall-clock instant; running it through a PT formatter
// would read "May 17 17:00 PT" (UTC-7 in May) and contradict the page's
// own copy. The MOCK_TODAY_UTC IIFE already routes `TODAY` through
// `formatZoned()` to pick the zone-anchored calendar day, so the
// resulting `(TODAY_Y, monthIdx, TODAY_D)` triple IS the right label here.
const bodyAnchorLabel = `${MONTH_SHORT[TODAY_M - 1]} ${TODAY_D}, ${TODAY_Y}`
const devChipTitle = computed(() => {
  const p = headerNowParts.value
  return `Header (live): ${p.weekday}, ${p.month} ${p.day} · ${pad2(p.hour)}:${pad2(p.minute)} ${timeZone.value}\nBody (frozen): ${bodyAnchorLabel}`
})
const devChipAriaLabel = computed(() => {
  const p = headerNowParts.value
  return `Development build — header is live (${p.weekday} ${p.month} ${p.day}, ${pad2(p.hour)}:${pad2(p.minute)} ${timeZone.value}); body renders mock data anchored to ${bodyAnchorLabel}`
})

// ── Activity timeline ───────────────────────────────────────────────────────
// Iter-27: per-row activity timestamps zone-anchored. The mock previously
// shipped each row's `time` as a locale-ambiguous `HH:MM` string (`09:14`,
// `15:08`, `9:42 AM`) and the iter-22 footer line ("All times shown in PT")
// did the framing work. Honest enough for a single-zone feed, but it
// asks every viewer to trust the footer — and a settings flip away from
// PT would touch the footer label while leaving 8 row strings frozen.
//
// Each `ActivityEntry` carries a `timeUtc` UTC ISO. `formatActivityTime()`
// projects that instant through the same `useTimeZone().format()` machinery
// the header (iter-26) uses, so a future `useTimeZone().set('ET',
// 'America/New_York')` re-renders all 8 row clocks AND the footer label in
// one call. Closes the iter-25/26 carry-over.
//
// Iter-28: legacy `time` field on `ActivityEntry` removed (every row now
// ships only `timeUtc`); the previous fallback branch is gone since the
// mock has fully migrated. Type-safe across all 8 rows.
function formatActivityTime(item: ActivityEntry): string {
  const p = formatZoned(new Date(item.timeUtc))
  return `${pad2(p.hour)}:${pad2(p.minute)}`
}

// Iter-28: day-group label derived from `timeUtc` against `MOCK_TODAY_UTC`,
// not shipped as a frozen string in the mock. Previously each row carried
// both `timeUtc` (consumed by the clock) AND a hand-authored `day: string`
// ("Today" / "Yesterday" / "Apr 22, 2026"), which silently desynced if the
// canonical TODAY shifted in isolation — bump `TODAY` to `2026-05-19` and
// the row clocks moved while every `day:` literal stayed frozen. With this
// helper the grouping header tracks the same anchor the body's relative-
// date copy (`daysUntil`, `daysOpen`) already uses. Zone-anchored via
// `formatZoned()` so the boundary moves in lockstep with the header when
// a future settings UI calls `useTimeZone().set(...)`. Closes the iter-27
// "Activity `day` grouping strings frozen in mock" carry-over.
function activityDayLabel(item: ActivityEntry): string {
  const event = new Date(item.timeUtc)
  const p = formatZoned(event)
  const monthIdx = MONTH_SHORT.indexOf(p.month as (typeof MONTH_SHORT)[number])
  const eventUtc = Date.UTC(p.year, monthIdx >= 0 ? monthIdx : 0, p.day)
  const dayDiff = Math.round((MOCK_TODAY_UTC - eventUtc) / 86_400_000)
  if (dayDiff === 0) return 'Today'
  if (dayDiff === 1) return 'Yesterday'
  // Far dates render as "Apr 22, 2026" — same shape iter-27 shipped, but
  // now sourced from `Intl.DateTimeFormat` so a zone flip moves the day.
  return `${p.month} ${p.day}, ${p.year}`
}

const activityByDay = computed(() => {
  const groups: { day: string; items: ActivityEntry[] }[] = []
  for (const item of ACTIVITY) {
    const day = activityDayLabel(item)
    const last = groups[groups.length - 1]
    if (last && last.day === day) last.items.push(item)
    else groups.push({ day, items: [item] })
  }
  return groups
})

const totalHeadcount = computed(() => DEPARTMENT_SPLIT.reduce((a, b) => a + b.value, 0))

// Donut centre count-up. Iter-12 introduced an inline rAF ramp here so
// the centre headline `{{ totalHeadcount }}` matched the donut slices'
// reveal motion. Iter-16 extracted the ramp into `useCountUp` so the
// four KPI tile numbers share the exact same easing + duration envelope
// — the whole top half of the page now ramps in coordinated. The local
// ref is replaced by the composable's display ref; behavior + curve
// preserved (SSR-safe target default, easeOutCubic, 600ms, reduced-
// motion guard all live inside useCountUp).
const displayHeadcount = useCountUp(totalHeadcount.value, ready, { duration: 600 })

// Largest department, for the donut card's microcopy. The previous
// `{totalHeadcount} active across 5 functions.` restated the centre
// headline (which already shows totalHeadcount, big) — wasted line of
// copy. Surfacing the lead function is the actually-useful read at a
// glance ("where does headcount concentrate?") and stays honest when
// the mock changes.
const leadDepartment = computed(() => {
  return DEPARTMENT_SPLIT.reduce(
    (best, d) => (d.value > best.value ? d : best),
    DEPARTMENT_SPLIT[0]!,
  )
})

// Iter-20: social-preview meta. Until now the page only set a `<title>`,
// so sharing a dashboard URL into Slack/iMessage/Teams produced a blank
// unfurl with only the document title. Add a description + the Open
// Graph + Twitter card tags so the link unfurls into a quotable preview
// — title, headline number, and the lead-department narrative. Values
// are derived from the existing computed refs (totalHeadcount +
// leadDepartment) via getter functions so the meta stays honest as the
// data changes and reacts to the SSR pass. `og:type=website` is the
// right SEO-bucket for an app surface (not `article`). No `og:image`
// declared — the asset doesn't exist on disk in this repo and providing
// a dead URL would degrade the unfurl; a future iteration can wire a
// screenshot OG via `nuxt-og-image` once that dep lands. SSR-safe:
// useSeoMeta runs on both server + client.
const ogDescription = computed(
  () =>
    `${totalHeadcount.value} active employees across ${DEPARTMENT_SPLIT.length} functions. ${leadDepartment.value.name} leads with ${leadDepartment.value.value}.`,
)
useSeoMeta({
  description: () => ogDescription.value,
  ogTitle: 'Dashboard · uipkge HRMS',
  ogDescription: () => ogDescription.value,
  ogType: 'website',
  ogSiteName: 'uipkge HRMS',
  twitterCard: 'summary',
  twitterTitle: 'Dashboard · uipkge HRMS',
  twitterDescription: () => ogDescription.value,
})

// ── Persona-aware quick actions ─────────────────────────────────────────────
const visibleActions = computed(() => {
  const order: Record<'employee' | 'manager' | 'admin', number> = {
    employee: 0, manager: 1, admin: 2,
  }
  return QUICK_ACTIONS.filter((a) => !a.requires || order[persona.value] >= order[a.requires])
})

const activityIcon = (type: ActivityEntry['type']) => {
  switch (type) {
    case 'hire': return { icon: UserPlus, status: 'success' as const, tone: 'text-success' }
    case 'time-off-approved': return { icon: CalendarCheck, status: 'success' as const, tone: 'text-success' }
    case 'time-off-request': return { icon: MailOpen, status: 'info' as const, tone: 'text-info' }
    case 'review-due': return { icon: FileText, status: 'warning' as const, tone: 'text-warning' }
    case 'offer-sent': return { icon: Banknote, status: 'info' as const, tone: 'text-info' }
    case 'doc-signed': return { icon: FileCheck, status: 'success' as const, tone: 'text-success' }
    default: return { icon: Inbox, status: 'muted' as const, tone: 'text-muted-foreground' }
  }
}

// Stroke weight per activity status. Long-standing carry-over: the
// activity feed renders every icon at lucide's default 2px stroke,
// regardless of status — so a "review due" warning icon and a routine
// "time-off-approved" success icon read at identical visual weight.
// Pass `stroke-width` through to the lucide SVG so warnings sit a
// notch heavier (2.5), success at the default (2), and info/muted
// quieter (1.6) — eye can rank "needs attention" rows above "FYI"
// rows from the icon density alone. Wrapper-only via the lucide
// stroke-width prop; the `app/components/ui/timeline/**` primitive is
// guardrailed against edits.
const STATUS_STROKE: Record<'success' | 'warning' | 'info' | 'muted', number> = {
  warning: 2.5,
  success: 2,
  info: 1.6,
  muted: 1.6,
}

const iconMap = { UserPlus, CalendarCheck, Banknote, Inbox } as const
const resolveIcon = (name: string) => (iconMap as Record<string, any>)[name] ?? Inbox

const trendData = computed(() =>
  HEADCOUNT_TREND.map((p) => ({ x: p.month, y: p.active })),
)

// Iter-19: shared 12-month label axis for the KPI tile sparklines. The
// four `KPI_TILES` ship a 12-point `spark: number[]` whose cadence
// matches `HEADCOUNT_TREND` (May → Apr trailing year). The tile
// component itself doesn't know the calendar — passing the month names
// as a sibling array gives the iter-15 `sparkSummary` enough context to
// emit "Peak Apr at 247" instead of "Range 218–247". Off-by-one guard:
// the v-bind only forwards labels when `spark.length === labels.length`,
// so any future tile that ships a different cadence (e.g. 8 weeks)
// silently falls back to the numeric range form. Same data anchor as
// the trend card's xAxis, so the page reads as one calendar voice across
// the KPI band + chart trio.
const sparkMonths = computed(() => HEADCOUNT_TREND.map((p) => p.month))

// Print summary for the Headcount-trend chart. Iter-17 hid all
// <canvas> elements on @media print + surfaced the KPI tile spark
// trend strings as visible text, but the Department donut + Headcount
// trend charts still printed as blank cards (no canvas, no fallback
// text). Compute a one-line summary in the same vocabulary as the
// `sparkSummary` strings in HrKpiTile so the print render reads as one
// voice across all data cards. SSR-safe: pure derived computed off the
// static mock series; no DOM, no client-only branch.
const trendPrintSummary = computed(() => {
  const series = HEADCOUNT_TREND
  if (!series.length) return ''
  const first = series[0]!.active
  const last = series[series.length - 1]!.active
  const min = Math.min(...series.map((p) => p.active))
  const max = Math.max(...series.map((p) => p.active))
  const delta = last - first
  const pct = first ? Math.round((delta / first) * 100) : 0
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
  const sign = delta > 0 ? '+' : ''
  return `12-month trend, ${direction} ${sign}${pct}% (${first} → ${last}). Range ${min}–${max}.`
})

// Print summary for the Department donut. The legend `<ul>` survives
// transfer to paper (no canvas inside), but the centre-headline
// totalHeadcount only lives in the absolute-positioned overlay and the
// dept-mix narrative ("Engineering leads with 124 of 247") is already
// in the CardDescription. Expose a single print-friendly line that
// strings the lead + total + count of segments so the printed card
// communicates the dept-mix without needing the donut shape.
const donutPrintSummary = computed(() => {
  const lead = leadDepartment.value
  const total = totalHeadcount.value
  return `${total} active across ${DEPARTMENT_SPLIT.length} functions. ${lead.name} leads with ${lead.value} (${Math.round((lead.value / total) * 100)}%).`
})

const deptPieOption = computed(() => ({
  legend: { show: false },
  series: [
    {
      radius: '92%',
      center: ['50%', '50%'],
      label: {
        show: true,
        position: 'inside',
        formatter: (p: any) => (p.percent >= 4 ? `${p.name}\n${p.value} · ${p.percent.toFixed(0)}%` : ''),
        fontSize: 10,
        fontWeight: 600,
        color: '#fff',
        lineHeight: 13,
        textShadowColor: 'rgba(0,0,0,0.35)',
        textShadowBlur: 2,
      },
      labelLine: { show: false },
      labelLayout: { hideOverlap: true },
      emphasis: { label: { show: true, fontSize: 11 } },
    },
  ],
}))

// Headcount trend quarter callouts. The HEADCOUNT_TREND series spans
// May 2025 → Apr 2026 (TODAY = May 18, 2026). The raw x-axis ships 12
// month abbreviations with no quarter anchoring, so a quick scan can't
// tell whether the "247" right-edge value is mid-quarter or quarter-
// end. Use the ECharts `axisLabel.formatter` to append a tiny `Q2`/
// `Q3`/`Q4`/`Q1` callout to the four calendar-quarter-end months
// (Jun / Sep / Dec / Mar) — the formatter runs against the category
// string per tick, so no extra ECharts component registration is
// required (the `MarkLineComponent` is not in the AreaChart's
// tree-shaken `use()` set and `app/components/ui/charts/**` is
// guardrailed off, so this stays a wrapper-only fix). Carry-over from
// iter-11 closed: the x-axis now communicates fiscal beats without
// adding a second visual layer. Newline-joined string in the formatter
// puts the Q label *below* the month name so the month abbreviation
// still anchors the tick.
const TREND_QUARTER_MARKS: Record<string, string> = {
  Jun: 'Q2',
  Sep: 'Q3',
  Dec: 'Q4',
  Mar: 'Q1',
}
// Iter-16: forced `interval: 0` so every tick renders, paired with a
// single-letter month abbreviation to absorb the doubled label count
// without horizontal overflow. Iter-18 upgrade: the single-letter map
// produced J/J/J ambiguity (Jan/Jun/Jul all → "J") and M/M (Mar/May),
// which an iter-17 carry-over called out. ECharts axisLabel renders
// SVG text proportionally — 2-letter abbreviations measure ~14-18px
// wide vs ~7-10px for single letter, and at `interval: 0` the 12 ticks
// in the trend card's ~330px width have ~27px per tick of horizontal
// budget. 2-letter labels comfortably fit inside that envelope and
// fully disambiguate (Ja/Jn/Jl, Mr/My). Quarter cue (`Q1`/`Q2`/`Q3`/
// `Q4`) still renders below the letter at 9px so the fiscal beat is
// preserved. Closes the iter-17 carry-over.
const MONTH_LETTER: Record<string, string> = {
  Jan: 'Ja', Feb: 'Fe', Mar: 'Mr', Apr: 'Ap', May: 'My', Jun: 'Jn',
  Jul: 'Jl', Aug: 'Au', Sep: 'Se', Oct: 'Oc', Nov: 'No', Dec: 'De',
}
const trendOption = computed(() => ({
  series: [{ areaStyle: { opacity: 0.08 } }],
  xAxis: {
    axisLabel: {
      // Force every tick to render so the Jun + Dec quarter callouts
      // also appear. Single-letter month abbreviations keep horizontal
      // crowding under control at narrow card widths.
      interval: 0,
      // Multi-line label: month letter on line 1, quarter cue on line 2
      // for the 4 quarter-end months only.
      formatter: (value: string) => {
        const letter = MONTH_LETTER[value] ?? value
        const q = TREND_QUARTER_MARKS[value]
        return q ? `${letter}\n{q|${q}}` : letter
      },
      rich: {
        q: {
          color: toRgba(chartTextColor.value, 0.55),
          fontSize: 9,
          fontWeight: 700,
          padding: [1, 0, 0, 0],
        },
      },
    },
  },
}))

const KPI_ICON_MAP = { Users, Briefcase, UserMinus, Hourglass } as const

// Funnel palette: single-hue scale derived from `--chart-1` (the same
// blue slot the KPI sparklines + area chart use, so the dashboard
// reads as one coordinated palette). The funnel shape itself signals
// narrowing — categorical per-stage colour is redundant. `color-mix`
// against `transparent` gives 5 stops without forking the OKLCH tokens.
const FUNNEL_COLORS = computed(() => [
  'color-mix(in oklch, var(--chart-1) 100%, transparent)',
  'color-mix(in oklch, var(--chart-1) 80%, transparent)',
  'color-mix(in oklch, var(--chart-1) 62%, transparent)',
  'color-mix(in oklch, var(--chart-1) 46%, transparent)',
  'color-mix(in oklch, var(--chart-1) 32%, transparent)',
])

// ── "Today" highlights strip ────────────────────────────────────────────────
// Five quick org-wide metrics pulled fresh from the mock layers. Each
// expresses a "right now" stat rather than a 12-month average.
const oooToday = computed(() => ooOnDay(TODAY))

// Birthdays this week. The people mock doesn't carry a `birthday`
// field yet, so the dashboard synthesises a deterministic per-employee
// day-of-week offset (1, 3, 5 days from TODAY) for the demo. Real
// consumers swap this for `daysUntil(emp.birthday)` once the field
// lands. The previous version hardcoded "In 3 days" for every row,
// which competed dishonestly with the dynamic OOO countdown.
const BIRTHDAY_OFFSETS = [1, 3, 5] as const
const birthdaysThisWeek = computed(() => {
  return EMPLOYEES.slice(0, 8)
    .filter((e) => e.tenureMonths > 0)
    .slice(0, 3)
    .map((e, i) => ({ employee: e, daysOut: BIRTHDAY_OFFSETS[i] ?? 7 }))
})

// "Today" / "Tomorrow" / "In Nd" -- same vocabulary family as the OOO
// `Xd left` countdown, so the celebrations card and the OOO card read
// as the same tense system rather than one dynamic and one static.
function birthdayCountdown(days: number): string {
  if (days <= 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days}d`
}

// Project an employee's MM-DD start anniversary onto the current
// demo year (2026) and return a countdown phrase in the same family
// as `birthdayCountdown` + the OOO `Xd left` chip. The previous code
// rendered `shortDate(startDate)` ("May 19") which sat next to
// "Tomorrow"/"In 3d" in the birthdays list — two different tense
// idioms in one card. This unifies the celebrations card on a
// single relative-countdown vocabulary.
function anniversaryCountdown(startIso: string): string {
  const [, mm, dd] = startIso.split('-')
  const m = Number(mm)
  const d = Number(dd)
  if (!m || !d) return ''
  // UTC math, no Date parsing drift between SSR + browser. Anchored to
  // the canonical demo-today (MOCK_TODAY_UTC, iter-25 single source).
  const event = Date.UTC(2026, m - 1, d)
  const days = Math.round((event - MOCK_TODAY_UTC) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  if (days > 0) return `In ${days}d`
  return `${-days}d ago`
}

// Anniversaries: people whose startDate's MM-DD falls in the current
// week. For the demo, surface people who joined this same week in
// prior years.
const anniversariesThisWeek = computed(() => {
  return EMPLOYEES
    .filter((e) => e.startDate.endsWith('-05-19') || e.startDate.endsWith('-05-20') || e.startDate.endsWith('-05-22'))
    .slice(0, 3)
    .map((e) => ({ employee: e, years: Math.floor(e.tenureMonths / 12) }))
})

// Recent hires: anyone with tenure <= 3 months. Sorted newest first.
const recentHires = computed(() => {
  return EMPLOYEES
    .filter((e) => e.tenureMonths >= 0 && e.tenureMonths <= 3 && e.status === 'active')
    .sort((a, b) => (a.startDate > b.startDate ? -1 : 1))
    .slice(0, 5)
})

// Top open requisitions: sorted by candidate count desc.
const topRequisitions = computed(() => {
  return REQUISITIONS
    .filter((r) => r.status === 'open')
    .sort((a, b) => b.totalCandidates - a.totalCandidates)
    .slice(0, 4)
})

// Days a requisition has been open. Stable for the mock "today".
// Anchored to `MOCK_TODAY_UTC` (iter-25) so a future mock-date bump
// only touches the `TODAY` constant at the top of the file.
function daysOpen(opened: string): number {
  const [y, m, d] = opened.split('-').map(Number)
  const then = Date.UTC(y!, m! - 1, d!)
  return Math.max(0, Math.round((MOCK_TODAY_UTC - then) / 86400000))
}

// Human-friendly "May 2" style from an ISO YYYY-MM-DD slice. Avoids
// shipping a raw "05-02" anywhere in the dashboard — engineer-y date
// fragments make the surface feel like a spreadsheet. Locale-fixed to
// keep SSR + browser output identical (no `toLocaleDateString` drift).
// `MONTH_SHORT` is declared earlier in the file (iter-24) so the
// live-clock header formatter can share it.
function shortDate(iso: string): string {
  const [, mm, dd] = iso.split('-')
  const m = Number(mm)
  const d = Number(dd)
  if (!m || !d) return iso
  return `${MONTH_SHORT[m - 1]} ${d}`
}

// Days from TODAY to a future ISO date. Negative when the date is past.
// Used by the OOO row to show a "Xd left" countdown chip instead of
// repeating the leave-type word for every row. Anchored to
// `MOCK_TODAY_UTC` (iter-25 single source).
function daysUntil(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  const then = Date.UTC(y!, m! - 1, d!)
  return Math.round((then - MOCK_TODAY_UTC) / 86400000)
}

// "Started 5d ago" / "Started 1mo ago" -- single anchor for the
// Recent-hires right column. Replaces the two-line `May 19` + `1 mo`
// stack which was redundant (start date + tenure derived from it).
function tenureRelative(startIso: string, tenureMonths: number): string {
  if (tenureMonths >= 1) return `${tenureMonths}mo ago`
  const d = -daysUntil(startIso)
  if (d <= 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 7) return `${d}d ago`
  const w = Math.round(d / 7)
  return `${w}w ago`
}

// Per-leave-type avatar ring tone for the OOO list. Carries the
// leave-type signal on the avatar itself so the right side of the row
// can free up for a return-date countdown instead of a redundant chip.
const LEAVE_RING: Record<string, string> = {
  vacation: 'ring-info/40',
  sick: 'ring-warning/50',
  personal: 'ring-chart-4/50',
  parental: 'ring-success/40',
  bereavement: 'ring-muted-foreground/30',
}

// Companion tonal-tint map for OOO rows. Iter-10 carry-over: rows were
// purely neutral chrome (border + hover) so the leave-type signal lived
// only on the avatar ring — at a glance the OOO list read as one flat
// tonal stripe. Per-row `bg-{tone}/5` wash at 5% opacity is below the
// threshold for text-contrast trouble (verified via WCAG check against
// muted-foreground on both light + dark) but enough that scanning the
// column reveals the leave-type distribution without needing to inspect
// each ring. Same OKLCH tokens as the ring map — language stays
// consistent across the page.
const LEAVE_TINT: Record<string, string> = {
  vacation: 'bg-info/5',
  sick: 'bg-warning/5',
  personal: 'bg-chart-4/5',
  parental: 'bg-success/5',
  bereavement: 'bg-muted/30',
}

// 5-stage candidate counts per requisition, used by the Top-reqs
// stage-heat strip. Pre-bucket once into a Map<reqId, Record<Stage, count>>
// rather than filtering CANDIDATES inside the template.
const STAGE_ORDER: Stage[] = ['applied', 'screened', 'interviewed', 'offer', 'hired']
const stageHeatByReq = computed(() => {
  const m = new Map<string, Record<Stage, number>>()
  for (const c of CANDIDATES) {
    let row = m.get(c.requisitionId)
    if (!row) {
      row = { applied: 0, screened: 0, interviewed: 0, offer: 0, hired: 0 }
      m.set(c.requisitionId, row)
    }
    row[c.stage] += 1
  }
  return m
})

// Pending approvals -- pulled from the time-off layer so the count
// here matches the Time-off page's "Team pending" tile.
const pendingApprovals = computed(() => REQUESTS.filter((r) => r.status === 'pending'))

// Iter-21: `?` keyboard-shortcut popover (closes the longest-running
// carry-over, open since iter-17 — 4 iters running). The page has zero
// discoverable keyboard affordances beyond tab order; pressing `?`
// anywhere on the surface (outside text inputs) now opens a tiny
// reference card listing the demo shortcuts. The trigger button next
// to the date badge gives a visible affordance for mouse users; the
// global keydown wires the keyboard path. Modelled after the Slack /
// GitHub / Linear `?`-help convention.
const shortcutsOpen = ref(false)
function onGlobalKeydown(e: KeyboardEvent) {
  if (e.key !== '?') return
  // Don't hijack `?` when the user is typing in an input / textarea /
  // contenteditable surface. Conservative match: any focused element
  // whose tagName or contentEditable would consume the keystroke.
  const t = e.target as HTMLElement | null
  if (t) {
    const tag = t.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if (t.isContentEditable) return
  }
  e.preventDefault()
  shortcutsOpen.value = !shortcutsOpen.value
}
onMounted(() => {
  if (typeof window === 'undefined') return
  window.addEventListener('keydown', onGlobalKeydown)
})
onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('keydown', onGlobalKeydown)
})

// Demo shortcut catalogue. The popover (above) teaches these chords;
// the bindings themselves now live in `useGlobalShortcuts()` (iter-23
// closes the iter-21/22 carry-over). Order matches the on-screen list
// in the popover so the inventory + the wiring read as one mental
// model: `?` opens this help, `g <letter>` navigates, `/` focuses the
// global command palette.
const KEYBOARD_SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ['?'], label: 'Show this help' },
  { keys: ['g', 'd'], label: 'Go to Dashboard' },
  { keys: ['g', 'p'], label: 'Go to People' },
  { keys: ['g', 't'], label: 'Go to Time off' },
  { keys: ['g', 'r'], label: 'Go to Recruiting' },
  // Iter-24: g-chord set extended to Inbox/Settings/Analytics. The three
  // routes all exist in `app/pages/`, so the popover catalogue stays
  // honest against the composable wiring (teach-and-deliver parity from
  // iter-23 is preserved). Order: navigation first, search last.
  { keys: ['g', 'i'], label: 'Go to Inbox' },
  { keys: ['g', 's'], label: 'Go to Settings' },
  { keys: ['g', 'a'], label: 'Go to Analytics' },
  { keys: ['/'], label: 'Focus search' },
]

// Iter-23: wire the chord/slash shortcuts taught by the iter-21 popover.
// Until iter-23 the help card teaches `g d` / `g p` / `g t` / `g r` /
// `/` but only `?` itself was wired — teach-but-don't-deliver. The new
// composable owns the chord state machine + the ⌘K dispatch path that
// reaches CommandPalette in the topbar via the chord it already
// listens for. Skips when focus is in input/textarea/contenteditable
// or when modifier keys are held so we don't hijack form typing or
// browser shortcuts. Nuxt auto-imports composables from `app/composables/`.
useGlobalShortcuts()

// Iter-21: activity-feed top-edge scroll-shadow. Iter-19 added a
// bottom-edge mask so the truncation reads as "more below" but the
// *top* edge stays sharp — once the user scrolls down, there is no
// visual cue that content lives above. Track scroll position with a
// simple scroll-event listener and toggle a `data-scroll-state`
// attribute so the mask fades both edges when scrolled mid-list, fades
// only the bottom at the start (initial state), and fades only the
// top once the user reaches the bottom. Pure data attribute; the CSS
// selector at the file tail picks it up.
//
// Implementation note: `CardContent` is a Vue SFC, so a template-ref
// on the component yields the component instance, not a DOM node. We
// unwrap to `$el` via a computed before binding the scroll listener.
// `useEventListener` from vueuse handles the auto-cleanup on unmount.
const activityScrollRef = ref<{ $el?: HTMLElement } | null>(null)
const activityScrollState = ref<'top' | 'middle' | 'bottom'>('top')
const updateActivityScrollState = () => {
  const el = activityScrollRef.value?.$el as HTMLElement | undefined
  if (!el) return
  const max = el.scrollHeight - el.clientHeight
  if (max <= 1) {
    activityScrollState.value = 'top'
    return
  }
  const y = el.scrollTop
  // 4px hysteresis on each end so the mask doesn't flicker between
  // states when the user lands exactly at the edge.
  if (y <= 4) activityScrollState.value = 'top'
  else if (y >= max - 4) activityScrollState.value = 'bottom'
  else activityScrollState.value = 'middle'
}
useEventListener(
  () => (activityScrollRef.value?.$el as HTMLElement | undefined) ?? null,
  'scroll',
  updateActivityScrollState,
  { passive: true },
)
onMounted(() => {
  requestAnimationFrame(updateActivityScrollState)
})

// Pin the activity card's height to the right column's natural height
// (Pending approvals + Quick actions stack) so the row reads as one
// balanced band. Extra activity rows scroll inside the card.
const rightColRef = ref<HTMLElement | null>(null)
const activityMaxHeight = ref<number | null>(null)
let _rightColRO: ResizeObserver | null = null
onMounted(() => {
  if (typeof ResizeObserver === 'undefined' || !rightColRef.value) return
  _rightColRO = new ResizeObserver((entries) => {
    const h = entries[0]?.contentRect.height ?? 0
    if (h > 0) activityMaxHeight.value = Math.round(h)
  })
  _rightColRO.observe(rightColRef.value)
})
onBeforeUnmount(() => {
  _rightColRO?.disconnect()
  _rightColRO = null
})
</script>

<template>
  <div class="space-y-3 p-3 md:p-4">
    <!-- 0. Page header -->
    <header class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">
          Good morning, <span :key="persona" class="text-primary hr-persona-flip inline-block">{{ persona === 'admin' ? 'Admin' : persona === 'manager' ? 'Manager' : 'Employee' }}</span>
        </h1>
        <p class="text-muted-foreground text-xs">Here's what's happening across your org today.</p>
      </div>
      <div class="flex items-center gap-2 self-start sm:self-auto">
        <!-- Header date badge. The leading dot used to be a single static
             `bg-success` pip — pleasant but uninformative. Promoted to a
             5-segment weekday progress strip (Mon-Fri); past + current
             days fill in `success`, future days sit at muted/30. TODAY
             is canonical Mon May 18, so the strip shows 1/5 filled —
             same colour token as the dot it replaces, but the badge now
             communicates "where we are in the work week" at a glance.
             Aria-label preserves the human date string for screen readers. -->
        <!-- Iter-20: timezone suffix on the date badge. The page's
             temporal voice was previously ambiguous — "09:00" sat in the
             header with no zone declared, so a distributed team viewing
             the dashboard couldn't tell whether the hour referred to
             their morning or someone else's. The `· PT` suffix anchors
             every relative timestamp on the surface (5d ago / In 4d /
             back May 23 / 9:42 AM in the activity feed) to a single
             reference zone, closing the date-format-audit carry-over.
             aria-label updated in parallel so screen readers also pick
             up the zone. PT is the canonical demo zone for the mock
             surface; real consumers swap to the org's primary TZ from
             settings. -->
        <!-- Iter-27: dev-only "mock" chip. The dashboard renders a tense
             seam (header binds to live `useNow()`, body binds to a frozen
             `MOCK_TODAY_UTC`) that is honest in source comments but
             invisible in the UI. During development that seam is exactly
             when "this number looks off" debugging happens; surfacing a
             tiny `dev · mock` chip next to the live date badge makes the
             frozen-vs-live split a visible affordance. `import.meta.dev`
             is Nuxt's compile-time dev flag — the chip is dead-code-eliminated
             in production builds, so end users never see it. Sits inside
             the `print-hide` flow indirectly via low-key chrome (no
             outline, muted tone, tracking-wide caps) so even if it ever
             made it into a screenshot, it reads as a development scaffold,
             not as product chrome. -->
        <!-- Iter-29: chip now gates on `isDev && !realData` so a dev
             session wired to a real API hides the chip automatically (the
             real-data adapter calls `useRealData().set(true)` once its
             fetch lands). `title` + `aria-label` are now reactive: they
             surface the live header time-parts (via `useZonedParts(now)`)
             alongside the frozen body anchor, so hovering the chip during
             debug shows BOTH sides of the seam in human-readable form
             instead of the abstract phrase the static iter-27 strings
             carried. -->
        <Badge
          v-if="isDev && !realData"
          variant="secondary"
          class="bg-muted/40 text-muted-foreground/80 px-1.5 py-0 text-xs font-semibold uppercase tracking-widest print-hide"
          :aria-label="devChipAriaLabel"
          :title="devChipTitle"
        >
          dev · mock
        </Badge>
        <Badge
          variant="outline"
          class="gap-1.5 px-2 py-0.5 text-xs"
          :aria-label="headerAriaLabel"
        >
          <span class="flex gap-px" aria-hidden="true">
            <span
              v-for="(_, i) in 5"
              :key="i"
              class="h-2 w-0.5 rounded-[1px]"
              :class="i <= workWeekIndex ? 'bg-success' : 'bg-muted-foreground/30'"
            />
          </span>
          {{ headerDateLabel }}
        </Badge>
        <!-- Iter-30 (FINAL): zone-picker popover. Anchors a Globe-icon
             button next to the date badge. Clicking a preset
             (PT/CT/ET/UTC) calls `useTimeZone().set(label, iana)` which
             reactively re-renders, in lockstep, every temporal surface
             built across iters 25-29 — header date label + weekday
             strip, activity-feed row clocks, day-group labels, footer
             timezone suffix, and the dev-chip tooltip's live half. The
             second section toggles `useRealData()` (iter-29 composable)
             so the `dev · mock` chip can be hidden live, demonstrating
             the gating wired in iter-29. Same Popover primitive +
             chrome conventions as the iter-21 shortcuts popover. -->
        <Popover v-model:open="zoneOpen">
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              size="icon"
              class="print-hide size-9 shrink-0"
              aria-label="Switch reference time zone"
            >
              <Globe class="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" class="w-64 p-3 print-hide">
            <p class="text-foreground mb-2 text-xs font-semibold">Reference time zone</p>
            <ul class="space-y-0.5">
              <li v-for="z in ZONE_PRESETS" :key="z.iana">
                <button
                  type="button"
                  class="hover:bg-muted/60 focus-visible:ring-ring flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  :class="z.iana === currentIana ? 'bg-muted/40' : ''"
                  :aria-pressed="z.iana === currentIana"
                  @click="onSelectZone(z.label, z.iana)"
                >
                  <span class="flex items-center gap-2">
                    <span class="text-foreground font-mono font-semibold tabular-nums">{{ z.label }}</span>
                    <span class="text-muted-foreground">{{ z.name }}</span>
                  </span>
                  <Check v-if="z.iana === currentIana" class="text-primary size-3.5" />
                </button>
              </li>
            </ul>
            <div class="mt-2 border-t pt-2">
              <button
                type="button"
                class="hover:bg-muted/60 focus-visible:ring-ring flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                :aria-pressed="realData"
                @click="setRealData(!realData)"
              >
                <span class="flex flex-col gap-0.5">
                  <span class="text-foreground font-semibold">Real data</span>
                  <span class="text-muted-foreground/80 text-xs leading-tight">Hides the dev · mock chip when on.</span>
                </span>
                <span
                  class="relative inline-flex h-3.5 w-6 shrink-0 items-center rounded-full transition-colors"
                  :class="realData ? 'bg-primary' : 'bg-muted-foreground/30'"
                  aria-hidden="true"
                >
                  <span
                    class="bg-background inline-block size-2.5 transform rounded-full transition-transform"
                    :class="realData ? 'translate-x-3' : 'translate-x-0.5'"
                  />
                </span>
              </button>
            </div>
            <p class="text-muted-foreground/70 mt-2 border-t pt-2 text-xs leading-snug">
              Flipping the zone re-renders the header, activity feed, and dev-chip tooltip in lockstep.
            </p>
          </PopoverContent>
        </Popover>
        <!-- Iter-21: keyboard-shortcut popover. Closes the longest-running
             carry-over (open since iter-17 — 4 iters). Page previously
             had zero keyboard discoverability beyond tab order; this
             surfaces the same `?`-to-help convention as Slack / Linear /
             GitHub. The `?` key opens it globally (window keydown handler
             above), the icon button gives mouse users a visible
             affordance, and the popover content lists demo shortcuts with
             <kbd> chrome. `print-hide` so the help button doesn't survive
             to paper. -->
        <Popover v-model:open="shortcutsOpen">
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              size="icon"
              class="print-hide size-9 shrink-0"
              :aria-label="`Keyboard shortcuts (press ? to toggle)`"
            >
              <Keyboard class="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" class="w-64 p-3 print-hide">
            <p class="text-foreground mb-2 text-xs font-semibold">Keyboard shortcuts</p>
            <dl class="space-y-1.5">
              <div
                v-for="s in KEYBOARD_SHORTCUTS"
                :key="s.label"
                class="text-muted-foreground flex items-center justify-between gap-3 text-xs"
              >
                <dt>{{ s.label }}</dt>
                <dd class="flex items-center gap-0.5">
                  <kbd
                    v-for="(k, i) in s.keys"
                    :key="i"
                    class="bg-muted text-foreground border-border inline-flex h-5 min-w-5 items-center justify-center rounded border px-1 font-mono text-xs font-semibold leading-none tabular-nums"
                  >{{ k }}</kbd>
                </dd>
              </div>
            </dl>
            <p class="text-muted-foreground/70 mt-2 border-t pt-2 text-xs leading-snug">
              Press <kbd class="bg-muted text-foreground border-border inline-flex h-4 min-w-4 items-center justify-center rounded border px-1 font-mono text-xs font-semibold">?</kbd> anywhere to toggle this card.
            </p>
          </PopoverContent>
        </Popover>
      </div>
    </header>

    <!-- 1. KPI band -->
    <KpiGrid v-if="ready">
      <HrKpiTile
        v-for="tile in KPI_TILES"
        :key="tile.label"
        :label="tile.label"
        :value="tile.value"
        :delta="tile.delta"
        :spark="tile.spark"
        :spark-labels="tile.spark && tile.spark.length === sparkMonths.length ? sparkMonths : undefined"
        :hint="tile.hint"
        :tone="tile.tone"
        :icon="KPI_ICON_MAP[tile.icon as keyof typeof KPI_ICON_MAP]"
      />
    </KpiGrid>
    <KpiGrid v-else>
      <Skeleton v-for="i in 4" :key="i" variant="rounded" class="h-[112px] w-full" />
    </KpiGrid>

    <!-- 2. Row of 3 same-height charts: Funnel + Donut + Headcount trend.
         Equal `lg:col-span-4` slots; default grid stretch keeps the
         three cards at matching height regardless of their internal
         content. All chart bodies render at the same h=200 so the
         visual rhythm reads as a coordinated row. -->
    <div class="grid gap-3 lg:grid-cols-12" :class="{ 'hr-reveal': ready }" :style="{ animationDelay: '0ms' }">
      <Card class="lg:col-span-4 flex flex-col">
        <CardHeader class="p-4 pb-2">
          <CardTitle class="text-sm">Hiring funnel</CardTitle>
          <CardDescription>5-stage conversion, last 90 days.</CardDescription>
        </CardHeader>
        <CardContent class="flex flex-1 flex-col p-4 pt-0">
          <ConversionFunnel v-if="ready" :data="HIRING_FUNNEL" height="100%" :colors="FUNNEL_COLORS" :show-labels="false" :min-height="42" class="flex-1" />
          <Skeleton v-else variant="rounded" class="h-full min-h-[200px] w-full flex-1" />
        </CardContent>
      </Card>

      <Card class="lg:col-span-4 flex flex-col">
        <CardHeader class="p-4 pb-2">
          <CardTitle class="text-sm">Department split</CardTitle>
          <CardDescription>{{ leadDepartment.name }} leads with {{ leadDepartment.value }} of {{ totalHeadcount }}.</CardDescription>
        </CardHeader>
        <CardContent class="flex flex-1 flex-col p-4 pt-0">
          <ClientOnly>
            <PieChart
              v-if="ready"
              :data="DEPARTMENT_SPLIT"
              height="100%"
              :option="deptPieOption"
              class="h-full"
            />
            <Skeleton v-else variant="circular" class="mx-auto h-full min-h-[200px] w-[200px]" />
            <template #fallback>
              <Skeleton variant="circular" class="mx-auto h-full min-h-[200px] w-[200px]" />
            </template>
          </ClientOnly>
          <p class="text-muted-foreground mt-2 hidden text-xs print:block">{{ donutPrintSummary }}</p>
        </CardContent>
      </Card>

      <Card class="lg:col-span-4 flex flex-col">
        <CardHeader class="p-4 pb-2">
          <CardTitle class="text-sm">Headcount trend</CardTitle>
          <CardDescription>Active employees, last 12 months.</CardDescription>
        </CardHeader>
        <CardContent class="flex flex-1 flex-col p-4 pt-0">
          <ClientOnly>
            <AreaChart
              v-if="ready"
              :data="trendData"
              x-field="x"
              y-field="y"
              height="100%"
              :option="trendOption"
              class="flex-1"
            />
            <Skeleton v-else variant="rounded" class="h-full min-h-[200px] w-full flex-1" />
            <template #fallback>
              <Skeleton variant="rounded" class="h-full min-h-[200px] w-full flex-1" />
            </template>
          </ClientOnly>
          <p class="text-muted-foreground mt-2 hidden text-xs tabular-nums print:block">{{ trendPrintSummary }}</p>
        </CardContent>
      </Card>
    </div>

    <!-- 4. Out-of-office today + Upcoming celebrations -->
    <div class="grid gap-3 lg:grid-cols-12" :class="{ 'hr-reveal': ready }" :style="{ animationDelay: '80ms' }">
      <Card class="lg:col-span-7">
        <CardHeader class="p-4 pb-2">
          <CardTitle class="text-sm">Out of office today</CardTitle>
          <!-- Description swaps to a positive frame when nobody's out
               rather than rendering "0 people away · plan around them"
               (logically nonsensical — there's no one to plan around).
               Pluralisation handles 1 vs N out so a single-person OOO
               doesn't read as "1 people". -->
          <CardDescription v-if="oooToday.length">
            {{ oooToday.length }} {{ oooToday.length === 1 ? 'person' : 'people' }} away · plan around them.
          </CardDescription>
          <CardDescription v-else>
            Full team in today — no coverage gaps.
          </CardDescription>
        </CardHeader>
        <CardContent class="p-4 pt-0">
          <div v-if="!oooToday.length" class="text-muted-foreground py-6 text-center text-sm">
            Everyone's at their desk.
          </div>
          <OverlayScroll v-else class="h-[290px]">
            <ul class="space-y-2 pr-1">
              <li
                v-for="req in oooToday"
                :key="req.id"
                class="hover:bg-muted/40 flex items-center justify-between gap-3 rounded-md border p-2 transition-colors"
                :class="LEAVE_TINT[req.type] ?? ''"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <Avatar class="size-8 shrink-0 ring-2 ring-offset-2 ring-offset-background" :class="LEAVE_RING[req.type] ?? 'ring-muted'">
                    <AvatarFallback class="text-xs font-semibold">
                      {{ findRequester(req)?.initials }}
                    </AvatarFallback>
                  </Avatar>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold truncate">
                      {{ findRequester(req)?.name ?? req.employeeId }}
                    </p>
                    <p class="text-muted-foreground text-xs truncate">
                      {{ findRequester(req)?.title }} · {{ REQUEST_TYPE_LABELS[req.type] }}
                    </p>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-foreground text-xs font-semibold tabular-nums">
                    {{ daysUntil(req.to) <= 0 ? 'Returns today' : `${daysUntil(req.to)}d left` }}
                  </p>
                  <p class="text-muted-foreground text-xs">
                    back {{ shortDate(req.to) }}
                  </p>
                </div>
              </li>
            </ul>
          </OverlayScroll>
        </CardContent>
      </Card>

      <Card class="lg:col-span-5">
        <CardHeader class="p-4 pb-2">
          <CardTitle class="text-sm">This week</CardTitle>
          <CardDescription>Anniversaries + birthdays · don't forget the cake.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3 p-4 pt-0">
          <!-- Anniversaries -->
          <div v-if="anniversariesThisWeek.length">
            <p class="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
              Anniversaries
            </p>
            <ul class="space-y-2">
              <li
                v-for="entry in anniversariesThisWeek"
                :key="entry.employee.id"
                class="flex items-center gap-3"
              >
                <div class="bg-info/15 text-info flex size-7 shrink-0 items-center justify-center rounded-full ring-1 ring-info/20">
                  <PartyPopper class="size-3.5" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold truncate">{{ entry.employee.name }}</p>
                  <p class="text-muted-foreground text-xs">
                    {{ entry.years }} year{{ entry.years === 1 ? '' : 's' }} at uipkge
                  </p>
                </div>
                <span
                  class="text-muted-foreground text-xs tabular-nums"
                  :title="`Joined ${shortDate(entry.employee.startDate)}`"
                >
                  {{ anniversaryCountdown(entry.employee.startDate) }}
                </span>
              </li>
            </ul>
          </div>

          <Separator v-if="anniversariesThisWeek.length && birthdaysThisWeek.length" />

          <!-- Birthdays -->
          <div v-if="birthdaysThisWeek.length">
            <p class="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
              Birthdays
            </p>
            <ul class="space-y-2">
              <li
                v-for="entry in birthdaysThisWeek"
                :key="entry.employee.id"
                class="flex items-center gap-3"
              >
                <div class="bg-warning/15 text-warning flex size-7 shrink-0 items-center justify-center rounded-full ring-1 ring-warning/20">
                  <Cake class="size-3.5" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold truncate">{{ entry.employee.name }}</p>
                  <p class="text-muted-foreground text-xs">{{ entry.employee.department }}</p>
                </div>
                <span class="text-muted-foreground text-xs tabular-nums">
                  {{ birthdayCountdown(entry.daysOut) }}
                </span>
              </li>
            </ul>
          </div>

          <div v-if="!anniversariesThisWeek.length && !birthdaysThisWeek.length" class="text-muted-foreground py-4 text-center text-sm">
            Quiet week — no celebrations.
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 5. Recent hires + Top open requisitions -->
    <div class="grid gap-3 lg:grid-cols-12" :class="{ 'hr-reveal': ready }" :style="{ animationDelay: '160ms' }">
      <Card class="lg:col-span-6">
        <CardHeader class="p-4 pb-2">
          <div class="flex items-center justify-between gap-3">
            <div>
              <CardTitle class="text-sm">Recent hires</CardTitle>
              <CardDescription>{{ recentHires.length }} new joiners in the last 90 days.</CardDescription>
            </div>
            <!-- View-all: was an outline-sm button whose border weight
                 fought the CardTitle for attention. Demoted to a ghost
                 chevron link to match the "See all N pending" pattern
                 used by the approvals card — lighter, idiomatic, and
                 still tappable. -->
            <!-- Iter-22: chevron now nudges right on hover, matching the
                 Top-reqs row chevron's `group-hover:translate-x-0.5`
                 vocabulary. Previously this was the only chevron-bearing
                 affordance on the page that stayed static on hover — the
                 surface had two different micro-motion idioms (one
                 translating, three frozen). The Button-as-NuxtLink slot
                 needs `group` so the inner chevron's group-hover target
                 finds its parent on pointer-over. -->
            <Button variant="ghost" size="sm" class="group text-muted-foreground -mr-2 px-2" as-child>
              <NuxtLink to="/people?filter=recent">
                View all
                <ChevronRight class="ml-0.5 size-3 transition-all group-hover:translate-x-0.5" />
              </NuxtLink>
            </Button>
          </div>
        </CardHeader>
        <CardContent class="p-4 pt-0">
          <!-- Micro-empty-state for a quiet hiring window. The list
               previously rendered as a bare empty <ul> when no joiners
               existed in the last 90 days — left a layout hole + zero
               feedback ("did the data fail to load or are we just not
               hiring?"). Neighbour cards (OOO + Pending approvals) both
               carry positive empty states; this one was the last list
               on the page without one. Copy stays inline with the
               surrounding voice ("Quiet week", "All clear", "at their
               desk") — same warm muted-foreground tone, no glyph chrome
               so it reads as a *quiet* state, not an error. -->
          <div v-if="!recentHires.length" class="text-muted-foreground py-4 text-center text-sm">
            No new joiners in the last 90 days — onboarding inbox is calm.
          </div>
          <ul v-else class="space-y-2">
            <li
              v-for="emp in recentHires"
              :key="emp.id"
              class="hover:border-foreground/20 flex items-center justify-between gap-3 rounded-md border p-2 transition-colors"
            >
              <NuxtLink :to="`/people/${emp.id}`" class="focus-visible:ring-ring focus-visible:ring-offset-background flex min-w-0 flex-1 items-center gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
                <Avatar class="size-8 shrink-0">
                  <AvatarFallback class="text-xs font-semibold">{{ emp.initials }}</AvatarFallback>
                </Avatar>
                <div class="min-w-0">
                  <p class="text-sm font-semibold truncate">{{ emp.name }}</p>
                  <p class="text-muted-foreground text-xs truncate">
                    {{ emp.title }} · {{ emp.department }}
                  </p>
                </div>
              </NuxtLink>
              <!-- Single anchor: relative tenure since start. The
                   previous two-line "May 19 / 1 mo" stack was redundant
                   (the second line was derived from the first) and
                   competed with the name for visual weight. The exact
                   start date is preserved as a title attribute for
                   hover-detail. -->
              <div class="text-right shrink-0">
                <p
                  class="text-muted-foreground text-xs tabular-nums"
                  :title="`Started ${shortDate(emp.startDate)}`"
                >
                  {{ tenureRelative(emp.startDate, emp.tenureMonths) }}
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card class="lg:col-span-6">
        <CardHeader class="p-4 pb-2">
          <CardTitle class="text-sm">Top open requisitions</CardTitle>
          <CardDescription>Highest pipeline activity right now.</CardDescription>
        </CardHeader>
        <CardContent class="p-4 pt-0">
          <!-- Stage-name index that aligns column-for-column with each row's
               5-segment strip below. The legend was previously anchored
               right inside CardHeader, spanning ~270px wide, while each
               row's strip spans the row's flex-1 body (~485px) starting at
               the row's left padding edge — so legend col 1 ("Applied")
               sat where row col 3-4 actually were. Now the legend mirrors
               the row's exact layout (`flex justify-between gap-3` + same
               flex-1 body + chevron-sized spacer) so columns line up
               vertically with the strips. -->
          <div
            aria-hidden="true"
            class="text-muted-foreground hidden items-center justify-between gap-3 px-2 pb-1.5 text-xs sm:flex"
          >
            <div class="min-w-0 flex-1">
              <div class="flex gap-px">
                <span
                  v-for="stage in STAGE_ORDER"
                  :key="`label-${stage}`"
                  class="flex-1 text-center leading-tight tracking-tight"
                >{{ STAGE_LABELS[stage] }}</span>
              </div>
            </div>
            <span class="size-3.5 shrink-0" />
          </div>
          <ul class="space-y-2">
            <li
              v-for="req in topRequisitions"
              :key="req.id"
              class="hover:border-foreground/20 rounded-md border transition-colors focus-within:border-foreground/20"
            >
              <!-- Whole-row click-target. Iter-9 collapsed the right-side
                   tally into the meta line, which also removed the only
                   interactive element from the row — for two iters the
                   card looked clickable (hover-border affordance) but
                   keyboard users couldn't tab to it and a mouse click
                   did nothing. NuxtLink wraps the full body so hover +
                   focus + click all land. `/recruiting` matches the
                   affordance pattern used by the Recent-hires /people
                   links (drill into the page that contains the full
                   list). Focus-ring recipe is the iter-5 one used by
                   the hires + approvals rows; rounded-md so the ring
                   inherits the row corner. -->
              <NuxtLink
                :to="`/recruiting`"
                class="group focus-visible:ring-ring focus-visible:ring-offset-background flex items-center justify-between gap-3 rounded-md p-2 outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                :aria-label="`Open requisition: ${req.title}, ${req.totalCandidates} candidates`"
              >
                <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" class="text-xs font-medium uppercase tracking-wide px-1.5 py-0">{{ req.level }}</Badge>
                  <p class="text-sm font-semibold truncate">{{ req.title }}</p>
                </div>
                <!-- Meta line now ends with the candidate count inline
                     ("· 142 cand") instead of a heavy right-side
                     two-line tally. Removes 4 repetitions of the word
                     "candidates" and lets the eye anchor on the role
                     title, not on a flock of bold numbers. -->
                <div class="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
                  <span>{{ req.department }}</span>
                  <span>·</span>
                  <span>{{ req.location }}</span>
                  <span>·</span>
                  <span class="inline-flex items-center gap-1">
                    <Clock class="size-3" />Open {{ daysOpen(req.opened) }}d
                  </span>
                  <span>·</span>
                  <span class="text-foreground tabular-nums font-semibold">{{ req.totalCandidates }}</span>
                  <span>cand</span>
                </div>
                <!-- Stage-heat strip: 5 segments (applied → hired)
                     sized by candidate count in that requisition's
                     pipeline. Shows pipeline composition at a glance
                     so the row communicates "where is the volume?"
                     not just "how many total". Single-hue chart-1
                     scale matches the funnel above. Bumped h-1 → h-1.5
                     so the strip is actually legible at a glance;
                     paired with the header legend so the segments
                     decode without hover. Empty stages collapse to a
                     faint baseline so the strip stays readable when
                     one stage dominates. -->
                <div class="mt-1.5 flex h-1.5 gap-px overflow-hidden rounded-full" :aria-label="`Pipeline by stage for ${req.title}: ${req.totalCandidates} total candidates`">
                  <span
                    v-for="(stage, i) in STAGE_ORDER"
                    :key="stage"
                    class="block min-w-[6px] flex-1 rounded-sm"
                    :style="{
                      backgroundColor: (stageHeatByReq.get(req.id)?.[stage] ?? 0) > 0
                        ? `color-mix(in oklch, var(--chart-1) ${Math.max(28, 100 - i * 16)}%, transparent)`
                        : 'color-mix(in oklch, var(--muted-foreground) 14%, transparent)',
                    }"
                    :title="`${stage}: ${stageHeatByReq.get(req.id)?.[stage] ?? 0}`"
                  />
                </div>
                </div>
                <ChevronRight class="text-muted-foreground/50 size-3.5 shrink-0 transition-all group-hover:text-muted-foreground group-hover:translate-x-0.5" />
              </NuxtLink>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>

    <!-- Super-section break. The page divides naturally into three
         chapters: org stats (KPI band + chart trio), people stats
         (OOO/celebrations + hires/reqs), and streams/actions (activity
         feed + approvals + quick actions). A subtle gradient hairline
         marks the transition from "people stats" to "streams" without
         the heaviness of a full `<Separator />` (which lives on cards
         and would compete here). Tailwind: 1px height, transparent ends,
         border-coloured centre — fades into the page background at the
         edges so it reads as a chapter cue, not a hard rule. `mt-1
         mb-0` so it nudges into the page rhythm without stealing
         vertical space from neighbour rows. Iter 11/13 carry-over
         closed (page-level chapter cues / gradient hairline). -->
    <div
      class="via-border mx-auto h-px w-full bg-gradient-to-r from-transparent to-transparent"
      :class="{ 'hr-reveal': ready }"
      :style="{ animationDelay: '220ms' }"
      aria-hidden="true"
    />

    <!-- 6. Activity feed + Pending approvals + Quick actions -->
    <div class="grid gap-3 lg:grid-cols-12" :class="{ 'hr-reveal': ready }" :style="{ animationDelay: '240ms' }">
      <Card
        class="lg:col-span-8 flex flex-col"
        :style="activityMaxHeight ? { maxHeight: activityMaxHeight + 'px' } : undefined"
      >
        <CardHeader class="p-4 pb-2">
          <CardTitle class="text-sm">Recent activity</CardTitle>
          <CardDescription>Who's been moving the needle the last two days.</CardDescription>
        </CardHeader>
        <!-- Iter-19/21 originally scrolled CardContent directly with a
             custom mask-image bottom/top shadow. Replaced here with
             the registry `OverlayScroll` (Slack-style hidden-native
             scrollbar + auto-fading custom thumb) so the thumb floats
             over content and does not reserve a gutter inside the
             card — zero horizontal shift when the feed grows past
             max-height. The cap moves from CardContent to OverlayScroll;
             CardContent loses its padding so OverlayScroll hugs the
             card edges, and the inner wrapper carries the page-wide
             CardContent padding the surface elsewhere uses. The
             iter-19 scroll-state listener stays put as scaffolding —
             it now reads no-op (OverlayScroll's viewport, not
             CardContent, owns scrollTop) and the dependent
             `.hr-scroll-shadow` class is dropped from the markup so
             the mask doesn't double up with the overlay thumb. -->
        <CardContent
          ref="activityScrollRef"
          class="flex min-h-0 flex-1 flex-col p-0"
        >
          <div class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden [overscroll-behavior:auto] [scrollbar-width:thin]">
            <div class="space-y-3 p-4 pt-0">
          <div v-for="group in activityByDay" :key="group.day">
            <h3 class="text-muted-foreground mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-widest">
              <CalendarDays class="size-2.5" aria-hidden="true" />
              {{ group.day }}
            </h3>
            <Timeline>
              <TimelineItem
                v-for="item in group.items"
                :key="item.id"
                status="muted"
                class="hover:bg-muted/25 -mx-2 rounded-md px-2 transition-[background-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                <TimelineMedia variant="icon" status="muted" :class="['bg-muted/60', activityIcon(item.type).tone]">
                  <component
                    :is="activityIcon(item.type).icon"
                    :stroke-width="STATUS_STROKE[activityIcon(item.type).status]"
                  />
                </TimelineMedia>
                <TimelineContent class="space-y-0.5 pb-0.5">
                  <div class="flex items-center gap-2">
                    <Avatar class="size-5">
                      <AvatarFallback class="text-xs font-semibold">{{ item.actor.initials }}</AvatarFallback>
                    </Avatar>
                    <TimelineTitle class="text-xs leading-snug">
                      <span class="font-semibold">{{ item.actor.name }}</span>
                      <span class="text-muted-foreground font-normal">&nbsp;{{ item.text }}</span>
                    </TimelineTitle>
                  </div>
                  <TimelineDate class="text-muted-foreground pl-7 text-xs">
                    {{ formatActivityTime(item) }}{{ item.meta ? ` · ${item.meta}` : '' }}
                  </TimelineDate>
                </TimelineContent>
              </TimelineItem>
            </Timeline>
          </div>
          </div>
          </div>
        </CardContent>
        <!-- Iter-22: timezone anchor footer. Activity timestamps render
             as `09:14`, `15:08`, `9:42 AM`-style strings with zero zone
             hint, which is locale-ambiguous for a distributed team
             scanning the feed. The iter-20 carry-over offered two paths
             (suffix every timestamp vs. footer-line assertion); picking
             the footer because it preserves the dense per-row layout
             (no extra width per row, no per-string `· PT` repetition)
             and only spends one line of card-footer real estate to
             frame the entire feed against the same PT zone already
             anchored on the header date badge. Sits OUTSIDE the
             scrollable CardContent so it stays pinned regardless of
             scroll position, and the scroll-shadow gradient continues
             to fade against the same neutral background. -->
        <!-- Iter-25: zone label sourced from the shared `useTimeZone()`
             composable rather than a hardcoded `PT` literal, so the
             header date-badge formatter + this footer line both pivot
             together when a settings flip lands. Output today is
             pixel-identical to iter-24's hardcoded string. -->
        <p class="text-muted-foreground/70 px-4 pb-3 text-xs tabular-nums">
          All times shown in {{ timeZone }}.
        </p>
      </Card>

      <!-- Right-column action lane. Tagged `print-hide` so the print
           stylesheet collapses Quick actions + pending-CTAs on paper
           (none of it is meaningful on a read-only page — see scoped
           `@media print` rule at file tail). -->
      <div ref="rightColRef" class="print-hide space-y-3 lg:col-span-4 lg:self-start">
        <!-- Pending approvals (managers+ only) -->
        <!-- Tonal left-edge cue: the card carries an action-required
             status (the warning-toned count chip is the only signal
             today). A 2px left border in `warning/40` makes the card
             scannable as "needs you" from the row gestalt — the same
             colour token the count chip already uses, so the language
             is consistent. Cheap, additive, and doesn't shift layout. -->
        <Card v-if="pendingApprovals.length && (persona === 'manager' || persona === 'admin')" class="border-l-2 border-l-warning/40">
          <CardHeader class="p-4 pb-2">
            <div class="flex items-center justify-between gap-3">
              <CardTitle class="text-sm">Pending approvals</CardTitle>
              <!-- Pending count chip: tonal warning text on a muted neutral
                   chip rather than a saturated yellow fill. The full
                   yellow brick read as the loudest element on the card
                   in dark mode and fought the card title for attention.
                   `min-w-7 justify-center` stabilises the chip width so
                   the badge doesn't shrink/grow as the count crosses the
                   single→double digit threshold (8 vs 12 used to render
                   at noticeably different widths and made the header bob
                   on a live feed). -->
              <Badge variant="secondary" class="text-warning font-bold tabular-nums min-w-7 justify-center px-1.5">
                {{ pendingApprovals.length }}
              </Badge>
            </div>
            <CardDescription>Action items waiting on you.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-1.5 p-4 pt-0">
            <!-- Iter-22: `group` class on the NuxtLink so the per-row
                 chevron picks up the page-wide hover translate vocabulary
                 (matches Top-reqs + iter-22 Recent-hires View-all). -->
            <NuxtLink
              v-for="r in pendingApprovals.slice(0, 3)"
              :key="r.id"
              to="/time-off"
              class="group hover:bg-muted/40 focus-visible:ring-ring focus-visible:ring-offset-background flex items-start gap-2 rounded-md p-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <Avatar class="size-7 shrink-0">
                <AvatarFallback class="text-xs font-semibold">
                  {{ findRequester(r)?.initials ?? '??' }}
                </AvatarFallback>
              </Avatar>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium truncate">
                  {{ findRequester(r)?.name ?? r.employeeId }}
                </p>
                <p class="text-muted-foreground text-xs">
                  {{ REQUEST_TYPE_LABELS[r.type] }} · {{ r.days }} day{{ r.days === 1 ? '' : 's' }}
                </p>
              </div>
              <ChevronRight class="text-muted-foreground mt-1.5 size-3.5 shrink-0 transition-all group-hover:translate-x-0.5" />
            </NuxtLink>
            <!-- Footer-action separator mirrors the Quick-actions card
                 below it (body / context-pill divider). Without this the
                 "See all" button sat flush against the third request row
                 and read as a misaligned fourth row rather than as a
                 footer CTA. The justify-between push aligns the chevron
                 to the row's right edge — same gesture as the per-row
                 chevrons above, so the whole card reads as one rhythm. -->
            <Separator class="my-1.5" />
            <Button variant="ghost" size="sm" class="group text-muted-foreground w-full justify-between" as-child>
              <NuxtLink to="/time-off">
                See all {{ pendingApprovals.length }} pending
                <ChevronRight class="size-3 transition-all group-hover:translate-x-0.5" />
              </NuxtLink>
            </Button>
          </CardContent>
        </Card>

        <!-- Pending-approvals positive empty state. Previously when the
             queue cleared, the whole card disappeared (v-if on
             pendingApprovals.length) which left a hole in the right
             column for managers/admins — and worse, denied them the
             positive feedback of seeing "inbox zero". Split into a
             v-else-if branch with success-tone left edge mirroring the
             warning-tone edge of the populated card, so the slot reads
             as "this is your approvals lane" regardless of state.
             aria-live=polite so screen readers announce the transition
             from "N pending" → "all clear" when a manager approves the
             last item. -->
        <Card
          v-else-if="(persona === 'manager' || persona === 'admin')"
          class="border-l-2 border-l-success/40"
          aria-live="polite"
        >
          <CardHeader class="p-4 pb-2">
            <div class="flex items-center justify-between gap-3">
              <CardTitle class="text-sm">Pending approvals</CardTitle>
              <CheckCircle2 class="text-success size-4 shrink-0" aria-hidden="true" />
            </div>
            <CardDescription>All clear — no requests waiting on you.</CardDescription>
          </CardHeader>
        </Card>

        <!-- Quick actions -->
        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Quick actions</CardTitle>
            <CardDescription>Shortcuts scoped to your persona.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-1.5 p-4 pt-0">
            <NuxtLink
              v-for="action in visibleActions"
              :key="action.label"
              :to="action.to"
              class="hover:border-border hover:bg-muted/50 focus-visible:ring-ring focus-visible:ring-offset-background group flex items-center gap-3 rounded-lg border border-transparent p-3 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <div class="bg-muted/60 group-hover:bg-info/10 group-hover:text-info text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md transition-colors">
                <component :is="resolveIcon(action.icon)" class="size-4" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-foreground text-sm font-semibold">{{ action.label }}</p>
                <p class="text-muted-foreground line-clamp-1 text-xs">{{ action.description }}</p>
              </div>
            </NuxtLink>
            <Separator class="my-2" />
            <!-- Persona context: was muted/70 + 10px (basically invisible)
                 and carried important info — that the action list is
                 SCOPED by role. Promoted to a tonal info pill with an
                 icon so it reads as a context cue instead of fine
                 print. Still secondary to the card body. -->
            <!-- Persona context strip. Iter-2 promoted this from grey
                 fine-print to a tonal info pill, but the fill at `/8` in
                 dark mode drops below the perceptual threshold against
                 the card background (the OKLCH chroma at 8% alpha barely
                 lifts off the surface). Bumped `/8` → `/10` so the strip
                 has a quiet but real presence in dark; light mode was
                 already comfortable so the bump is invisible there. The
                 persona name itself was floating as inline text inside a
                 sentence — promoted to a token-like anchor with a
                 hairline `border-b border-info/30` underline so the eye
                 lands on "what role am I acting as" at a glance.
                 Underline replaces no visual chrome — purely additive. -->
            <div class="bg-info/10 text-foreground/80 flex items-start gap-2 rounded-md px-2 py-1.5">
              <Sparkles class="text-info mt-0.5 size-3 shrink-0" />
              <p class="text-xs leading-snug">
                Acting as <span :key="persona" class="text-foreground border-b border-info/30 font-semibold capitalize hr-persona-flip inline-block">{{ persona }}</span>.
                <span class="text-muted-foreground">Switch via the topbar avatar.</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
 * Staggered reveal for the dashboard rows below the KPI band.
 * Triggered when `ready` flips after the 450ms `useDataReady` window,
 * the four grid rows fade-up with a 80ms cascade so the page settles
 * with a subtle rhythm rather than a hard skeleton-to-content cut.
 *
 * Carry-over from iter 5 (motion suggested 3 iters running). Pure CSS
 * keyframes, no JS scheduler, no new deps. `backwards` fill mode so the
 * initial frame (opacity 0) applies before the delay elapses — without
 * this, the row flashes at full opacity for one frame, then animates.
 *
 * `prefers-reduced-motion` honoured: animation collapses to a 1ms
 * step so reduced-motion users see the content immediately, no
 * vestibular distress.
 */
@keyframes hr-reveal {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.hr-reveal {
  animation: hr-reveal 240ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

@media (prefers-reduced-motion: reduce) {
  .hr-reveal {
    animation-duration: 1ms;
    animation-delay: 0ms !important;
  }
}

/*
 * Print stylesheet. The dashboard is built for a screen reader of a
 * different kind — a person scanning a colour-coded set of charts +
 * tonal pills. On paper, those charts render as black canvas rectangles
 * and the tonal pills lose their semantic colour entirely. The
 * `@media print` rule below strips the surface to what *does* print
 * meaningfully:
 *
 *   - Hide all <canvas> elements (ECharts traces become useless ink
 *     bricks). The KPI tile's `sparkSummary` aria-label already encodes
 *     "trending up +13%. Range 218–247." as text — surface it as a
 *     visible line in print via the `:after` content tap on the spark
 *     wrapper, so the KPI band still communicates trend on paper.
 *   - Hide the interactive sidebar column (Quick actions, "View all"
 *     chevrons, hover affordances) — none of it survives transfer to a
 *     read-only page.
 *   - Suppress the staggered reveal + spark draw-in animations so the
 *     print render isn't a snapshot of a mid-animation frame.
 *   - Force `print-color-adjust: exact` on the tonal pills + leave-type
 *     rings so browsers preserve the OKLCH-derived colours rather than
 *     stripping them to greyscale. Two-tone print (B/W + accent) is
 *     more informative than monochrome.
 *
 * Closes the iter-14 carry-over for a print stylesheet leveraging the
 * iter-15 sparkSummary strings. No new dependency, no markup change
 * required for charts (selector-driven), zero impact on screen
 * rendering.
 */
@media print {
  /* Preserve OKLCH-derived tonal pills, leave-type rings, status
     borders, kpi-tile chips. Without this Chrome ships greyscale for
     non-text colours and the surface loses its leave-type / status /
     direction signal. */
  :deep(*) {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Hide all ECharts canvases — they print as opaque ink rectangles. */
  :deep(canvas) {
    display: none !important;
  }

  /* Hide the right-column action lane (Quick actions, pending CTAs).
     None of it is meaningful on paper; collapsing it gives the
     activity feed full-width breathing room for print. */
  :deep([data-print-hide]),
  :deep(.print-hide) {
    display: none !important;
  }

  /* Suppress all motion. A mid-animation print render produces faded
     rows + half-drawn sparks. */
  :deep(.hr-reveal),
  :deep([class*='hr-spark']) {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }

  /* Activity feed: avoid orphan group eyebrows breaking from their
     first item across a page boundary. */
  :deep(h3) {
    break-after: avoid;
  }

  :deep(li),
  :deep(article) {
    break-inside: avoid;
  }
}

/*
 * Persona-name flip animation. The topbar persona switcher mutates
 * `usePersona().current`, which re-renders the header h1 + Quick-actions
 * context strip. Without motion, the swap is a snap-replace ("Admin" →
 * "Manager") with zero acknowledgement that scope just changed — the
 * most important contextual word on the page mutates silently. A
 * vue-driven `:key="persona"` on each persona span forces Vue to tear
 * down + remount the element on every persona switch, which retriggers
 * the CSS keyframe defined here. 180ms ease-out, 4px upward slide + fade,
 * `prefers-reduced-motion` collapsed to 1ms. Closes the 6-iter
 * carry-over.
 */
@keyframes hr-persona-flip {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.hr-persona-flip {
  animation: hr-persona-flip 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

@media (prefers-reduced-motion: reduce) {
  .hr-persona-flip {
    animation-duration: 1ms;
  }
}

/*
 * Iter-19: activity-feed scroll-shadow. The Recent-activity card caps
 * its inner CardContent at `max-h-[420px] overflow-y-auto` so a tall
 * feed (16 items today; arbitrarily long in production) doesn't push
 * the right-column Pending-approvals + Quick-actions cards below the
 * fold. Without a visual cue, the truncation reads as a hard clip; the
 * mask-image fades the bottom 32px of the scroll container so the eye
 * registers "more below" without needing a scroll-listener-driven JS
 * shadow. `mask-image` is supported across evergreen browsers; the
 * `-webkit-mask-image` companion covers Safari which still requires
 * the prefix for the gradient form. The mask auto-resolves to a full
 * pass-through (no fade) when the content is short enough not to
 * overflow — pure CSS, no observer.
 *
 * `print` strips the cap so the printed page receives the entire feed
 * inline (no scroll on paper). Pairs with the existing canvas-hidden +
 * action-lane-hidden print rules so the feed can stretch full-width.
 */
/*
 * Iter-21: dual-edge scroll-shadow. Iter-19 added a single bottom-edge
 * fade so the truncation read as "more below" — but once the user
 * scrolled down, the top stayed sharp and content above became
 * invisible. Now the mask is driven by a `data-scroll-state` attribute
 * (top / middle / bottom) set by a vueuse `useScroll` on the
 * CardContent so the fade follows the scroll position:
 *
 *   - top    : only bottom edge fades (initial state — there's nothing
 *              above to hint at).
 *   - middle : both top *and* bottom fade — content lives in both
 *              directions.
 *   - bottom : only top edge fades — there's nothing below.
 *
 * Pure attribute selector + CSS mask, no DOM swap, no extra wrapper.
 * The mask transitions implicitly between states (mask-image isn't
 * formally transitionable but the swap is fast enough at 80ms
 * useScroll throttle that the eye reads it as a soft handoff).
 */
.hr-scroll-shadow {
  mask-image: linear-gradient(to bottom, black 0, black calc(100% - 32px), transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 0, black calc(100% - 32px), transparent 100%);
}

.hr-scroll-shadow[data-scroll-state='middle'] {
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    black 32px,
    black calc(100% - 32px),
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0,
    black 32px,
    black calc(100% - 32px),
    transparent 100%
  );
}

.hr-scroll-shadow[data-scroll-state='bottom'] {
  mask-image: linear-gradient(to bottom, transparent 0, black 32px, black 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, black 32px, black 100%);
}

@media print {
  .hr-scroll-shadow {
    max-height: none !important;
    overflow: visible !important;
    mask-image: none !important;
    -webkit-mask-image: none !important;
  }
}
</style>
