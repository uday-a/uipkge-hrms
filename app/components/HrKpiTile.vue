<script setup lang="ts">
/**
 * HRMS-specific KPI tile. Pattern: label / number / delta pill+hint /
 * full-width sparkline strip pinned to the bottom of the card.
 *
 * Lives in app/components (not the registry) because it bakes a
 * specific layout opinion -- exactly the kind of decision the
 * registry's primitive-vs-block rule says shouldn't ship as a
 * primitive. Inside this app it's a useful shorthand we hit on every
 * surface that has a KPI band (dashboard, people, time-off, reviews,
 * recruiting, analytics, profile).
 *
 * `tone` semantics:
 *   - primary  (blue)    : neutral / informational
 *   - success  (emerald) : growth / "good" metric direction
 *   - warning  (amber)   : flagged / requires attention
 *   - danger   (rose)    : actionable / negative direction
 *
 * Spark line + icon chip share the tone so the tile reads as a single
 * visual unit rather than two unrelated coloured elements.
 */
import { computed, ref, watch } from 'vue'
import { ArrowDown, ArrowUp } from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkline } from '@/components/ui/charts/sparkline'
import { chartColors } from '@/components/ui/charts/useChartTheme'
import { useCountUp } from '@/composables/useCountUp'

export type KpiTone = 'info' | 'success' | 'warning' | 'destructive'

interface Props {
  label: string
  value: string | number
  delta?: { value: string; positive: boolean }
  spark?: number[]
  /**
   * Optional per-point labels (e.g. month names) aligned with `spark`.
   * When provided, `sparkSummary` includes a "peak {label}" anchor so
   * the trend description names *when* the high water mark happened.
   * Off-by-one safe: indices are clamped to the labels array length.
   */
  sparkLabels?: string[]
  hint?: string
  tone?: KpiTone
  /** Lucide icon component, e.g. `Users`. Optional. */
  icon?: any
}

const props = withDefaults(defineProps<Props>(), {
  tone: 'info',
})

// Tile value count-up. Iter-16 closes the 4-iter carry-over: the donut
// centre already ramped on `ready` flip via the same easeOutCubic curve,
// but the four big tile numbers (247 / 18 / 4.2% / 7) popped in
// fully-formed — the KPI band read as a half-coordinated row. The
// dashboard's `ready` ref is injected here (provide/inject path below)
// so the tile mounts under a v-if=ready and the ramp re-fires only on
// the readiness flip. Parse the numeric core out of the value string
// ("4.2%" → 4.2, precision 1; "247" → 247, precision 0). Suffix ("%")
// is re-appended at the template seam so the rendered string stays
// pixel-identical to the steady state.
//
// SSR-safe: useCountUp defaults `display` to the parsed target so the
// initial paint matches. The watch only fires on client.
const valueParts = computed(() => {
  const raw = String(props.value)
  // Match leading number (optionally signed/decimal) + the rest as suffix.
  const match = raw.match(/^(-?\d+(?:\.\d+)?)(.*)$/)
  if (!match) return { num: null as number | null, suffix: raw, precision: 0 }
  const numStr = match[1]!
  const suffix = match[2] ?? ''
  const dotIdx = numStr.indexOf('.')
  const precision = dotIdx === -1 ? 0 : numStr.length - dotIdx - 1
  return { num: Number(numStr), suffix, precision }
})

// Tiles always render under `v-if="ready"` on the dashboard, so by the
// time this watch fires, `ready` is already true and the count-up
// triggers immediately on mount. Synthesise a local trigger ref that
// flips true on setup so the ramp plays once on appearance.
const localTrigger = ref(false)
const target = computed(() => valueParts.value.num ?? 0)
const displayNum = useCountUp(target.value, localTrigger, {
  duration: 600,
  precision: valueParts.value.precision,
})
// Kick the ramp after a tick so the component reaches its first paint
// at 0 and the eye sees the climb. Without this we'd land already-true.
if (typeof window !== 'undefined') {
  requestAnimationFrame(() => {
    localTrigger.value = true
  })
}

// Iter-21: re-ramp the count-up when the persona switches. iter-18 added
// the persona-name flip keyframe so the header h1 + Quick-actions context
// strip acknowledge a scope change with motion — but the KPI band sat
// frozen, so a viewer switching admin → manager saw the most important
// contextual word slide but the numbers below it never moved. Even when
// the underlying tile values are identical across personas (today's mock
// renders the same KPI set for all three), retriggering the ramp makes
// the band visibly *acknowledge* the persona switch and reads as "we
// re-fetched for your scope". When a real persona-scoped KPI set lands,
// the same retrigger will let the new numbers settle in instead of
// snap-replacing. usePersona is Nuxt auto-imported via the dashboard's
// composables; available globally in script setup.
const { current: persona } = usePersona()
watch(persona, () => {
  if (typeof window === 'undefined') return
  localTrigger.value = false
  // Flip back to true on next frame so the trigger's watcher in
  // useCountUp re-fires the rAF ramp. Single frame gap is enough for
  // the watch to register the change-of-state.
  requestAnimationFrame(() => {
    localTrigger.value = true
  })
})

const displayValue = computed(() => {
  if (valueParts.value.num === null) return String(props.value)
  const p = valueParts.value.precision
  return `${displayNum.value.toFixed(p)}${valueParts.value.suffix}`
})

// Icon chip + delta pill resolve to OKLCH semantic tokens. Theme flips
// (light/dark + future "theme customizer" tweaks) ripple through the
// whole app via these CSS variables -- no per-component hex.
const TONE_CHIP: Record<KpiTone, string> = {
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
}

// Hint copy carries the tile's tone at low saturation so the row reads
// as a tone-coordinated unit instead of "coloured chip + uniformly
// muted footer". Sat is intentionally low (text-{tone}/75) — the chip
// already shouts; the hint is the quiet annotation that backs it up.
// Falls back to muted-foreground for info (neutral default) so we
// don't accidentally re-tint every tile blue.
const TONE_HINT: Record<KpiTone, string> = {
  info: 'text-muted-foreground',
  success: 'text-success/80',
  warning: 'text-warning/85',
  destructive: 'text-destructive/85',
}

// Sparkline color: single token across all tiles so the KPI band reads
// as a coordinated row instead of a rainbow. The delta pill (↑/↓ +N)
// already carries the good/bad direction signal — the spark is just
// "trend exists". We pull chart-1 from the resolved palette (chartColors
// is a Ref of computed hex/rgba; ECharts canvas can't read CSS vars
// directly).
const lineColor = computed(() => chartColors.value[0]!)
const iconChipClass = computed(() => TONE_CHIP[props.tone])
const hintToneClass = computed(() => TONE_HINT[props.tone])

// Sparkline semantic description. The spark renders as a canvas via
// ECharts, so screen readers see nothing — only the value + delta pill
// communicate trend, and only one direction-bit (up/down). For sighted
// users the spark shape tells "steady" vs "spiked" vs "decline", but
// that detail is invisible to keyboard/AT users. Build a textual
// summary from the spark array: first → last delta, direction word,
// and peak. Used as both `aria-label` (announced) and `title`
// (hover-detail tooltip for mouse users who hover the trace).
const sparkSummary = computed(() => {
  if (!props.spark?.length) return ''
  const arr = props.spark
  const first = arr[0]!
  const last = arr[arr.length - 1]!
  const peak = Math.max(...arr)
  const trough = Math.min(...arr)
  const diff = last - first
  const pct = first === 0 ? 0 : Math.round((diff / first) * 100)
  const dir = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat'
  const dirWord = dir === 'flat' ? 'flat' : `trending ${dir}`
  const span = arr.length
  // Iter-19: peak-month context. The iter-15 sparkSummary stopped at
  // `Range {min}–{max}` which told sighted/print readers the magnitude
  // but never *when* the high water mark happened. With aligned labels
  // (the dashboard now passes 12 month names so the spark and the
  // HEADCOUNT_TREND speak the same vocabulary), the summary anchors the
  // peak to a calendar beat. Falls back to numeric-only when no labels
  // — non-dashboard consumers don't have to wire month metadata.
  const labels = props.sparkLabels
  // Iter-20: trough→peak swing copy for non-monotonic series. The
  // direction word (`trending up/down`) only describes first → last —
  // it misses dramatic intra-series swings where the peak or trough
  // sit *inside* the range, not at the endpoints. e.g. a series that
  // went 9 → 4 → 18 reads as "trending up +100%" but the real story is
  // a 4-to-18 swing (the dip in the middle gets lost). Detect
  // non-monotonic series by checking whether peak/trough indices fall
  // strictly inside (0, span-1), and when both do, append a "Swung
  // {trough}→{peak} over the period." clause that names the magnitude
  // of the round trip. Carry-over from iter-19 closed.
  const peakIdx = arr.indexOf(peak)
  const troughIdx = arr.indexOf(trough)
  const lastIdx = span - 1
  const peakInside = peakIdx > 0 && peakIdx < lastIdx
  const troughInside = troughIdx > 0 && troughIdx < lastIdx
  const isNonMonotonic = peakInside || troughInside
  if (labels && labels.length === arr.length) {
    const peakLabel = labels[peakIdx] ?? ''
    const troughLabel = labels[troughIdx] ?? ''
    const base = `${span}-point trend, ${dirWord} ${pct >= 0 ? '+' : ''}${pct}%. Peak ${peakLabel} at ${peak}, low ${troughLabel} at ${trough}.`
    if (isNonMonotonic && peak !== trough) {
      const earlierLabel = troughIdx < peakIdx ? troughLabel : peakLabel
      const laterLabel = troughIdx < peakIdx ? peakLabel : troughLabel
      const earlierVal = troughIdx < peakIdx ? trough : peak
      const laterVal = troughIdx < peakIdx ? peak : trough
      return `${base} Swung ${earlierLabel} ${earlierVal} → ${laterLabel} ${laterVal}.`
    }
    return base
  }
  const baseNoLabels = `${span}-point trend, ${dirWord} ${pct >= 0 ? '+' : ''}${pct}%. Range ${trough}–${peak}.`
  if (isNonMonotonic && peak !== trough) {
    const earlierVal = troughIdx < peakIdx ? trough : peak
    const laterVal = troughIdx < peakIdx ? peak : trough
    return `${baseNoLabels} Swung ${earlierVal} → ${laterVal}.`
  }
  return baseNoLabels
})
</script>

<template>
  <Card class="hover:border-foreground/20 group relative overflow-hidden transition-colors">
    <CardContent class="space-y-4 p-5">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
            {{ label }}
          </p>
          <p class="mt-1.5 text-3xl font-bold tabular-nums tracking-tight">{{ displayValue }}</p>
        </div>
        <div
          v-if="icon"
          :class="['flex size-9 shrink-0 items-center justify-center rounded-lg', iconChipClass]"
        >
          <component :is="icon" class="size-4" />
        </div>
      </div>

      <div v-if="delta || hint" class="flex items-center justify-between gap-2">
        <!-- Delta pill: digit weight + tracking shift echoes the tone.
             Iter 11/12 carry-over flagged that the arrow carries the
             direction signal but the digit itself was uniformly `font-bold`
             regardless of sign — eye had to re-read the arrow to know good
             vs bad. Positive: `font-extrabold tracking-tight` (denser,
             leans forward). Negative: `font-bold tracking-normal italic`
             (slightly leaner, italic stylistic cue) so the two read as
             distinct visual classes without changing the colour token. -->
        <span
          v-if="delta"
          :class="[
            'inline-flex h-5 items-center gap-0.5 rounded-full px-1.5 text-xs tabular-nums',
            delta.positive
              ? 'bg-success/10 text-success font-extrabold tracking-tight'
              : 'bg-destructive/10 text-destructive font-bold tracking-normal italic',
          ]"
        >
          <component :is="delta.positive ? ArrowUp : ArrowDown" class="size-3" />
          {{ delta.value }}
        </span>
        <p v-if="hint" :class="['text-xs', hintToneClass]">{{ hint }}</p>
      </div>
    </CardContent>

    <!-- Sparkline as a slim trend line, not a coloured ribbon. Dropped
         the bg-muted strip + border-t separator so the spark reads as a
         subtle trace under the headline number instead of competing
         with it for attention. Height halved (44 -> 24).

         `hr-spark-draw` plays a one-shot horizontal reveal (scaleX 0→1)
         when the tile mounts, which is the same moment the parent's
         `ready` flag flips and the v-if reveals this tile. Pure CSS,
         400ms, settle curve. Origin-left so it draws from start of the
         trend toward "now" — reinforces the "look, a trace just landed"
         feel of the data-readiness window. `prefers-reduced-motion`
         honoured by the scoped guard below.

         Iter-23: bind `:key="persona"` so Vue tears down and remounts
         the wrapper on every persona switch — the CSS keyframe is a
         one-shot animation that only fires on element appearance, so
         re-keying is the cheapest way to replay it. Pairs with the
         iter-21 count-up retrigger on the digit above so the whole
         tile (number AND trace) acknowledges the scope change in
         coordinated motion instead of just the digit ramping while the
         spark sits frozen. -->
    <div
      v-if="spark?.length"
      :key="persona"
      class="hr-spark-draw -mb-px opacity-70"
      role="img"
      :aria-label="sparkSummary"
      :title="sparkSummary"
    >
      <ClientOnly>
        <Sparkline :data="spark" :color="lineColor" :height="24" />
        <template #fallback>
          <div class="h-6 w-full" />
        </template>
      </ClientOnly>
    </div>
    <!-- Print-only trend summary. The sparkline canvas above is hidden
         by the dashboard's `@media print` rule (canvases print as
         useless black rectangles), so the trend signal would be lost
         entirely on paper. Surface the iter-15 `sparkSummary` string as
         a visible footer line *only* on print: `hidden print:block`
         keeps it invisible on screen (the canvas + aria-label cover
         that audience already), and pushes the same text into the
         printed page so a paper reader gets "trending up +13%. Range
         218–247." under each tile. Closes the iter-14 print-stylesheet
         carry-over end-to-end (chart → text substitution). -->
    <p
      v-if="sparkSummary"
      class="text-muted-foreground hidden px-5 pb-3 text-xs tabular-nums print:block"
    >
      {{ sparkSummary }}
    </p>
  </Card>
</template>

<style scoped>
/*
 * Sparkline draw-in: the tile mounts when the page's data-readiness
 * window elapses (450ms in dashboard.vue), at which point this scaleX
 * keyframe plays once and the trace appears to "draw" left-to-right.
 * Carry-over from iter 8 prompt — KPI tile internal motion.
 *
 * `transform-origin: left center` so the reveal direction reads as
 * "from the past, toward now". Pure CSS, no JS scheduler.
 */
@keyframes hr-spark-draw {
  from {
    transform: scaleX(0);
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 0.7;
  }
}

.hr-spark-draw {
  transform-origin: left center;
  animation: hr-spark-draw 480ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
}

@media (prefers-reduced-motion: reduce) {
  .hr-spark-draw {
    animation-duration: 1ms;
  }
}
</style>
