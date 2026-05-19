<script setup lang="ts">
/**
 * Headcount analytics — admin/manager-only deep dive into the org's
 * shape. Sections (top → bottom):
 *
 *   1. Header + period chips (visual only) + Export CSV
 *   2. 4 KPI tiles (headcount, attrition, tenure, open reqs)
 *   3. Headcount trend (AreaChart, 12 months ending May 2026)
 *   4. Two-col: Department breakdown / Location split (bar lists)
 *   5. Two-col: Tenure distribution (BarChart) / Attrition reasons
 *   6. Top hiring departments with fill-rate progress
 *
 * All data is static (see app/mocks/analytics.ts). The page is read-
 * only by design -- "Export CSV" + the period chips are toast-only
 * affordances so the demo doesn't fork SSR/client state.
 */
import { computed, ref } from 'vue'
import { BarChart3, Briefcase, Download, UserMinus, Users } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Chip, ChipGroup } from '@/components/ui/chip'
import { KpiGrid } from '@/components/ui/kpi-grid'
import HrKpiTile, { type KpiTone } from '@/components/HrKpiTile.vue'
import { Progress } from '@/components/ui/progress'
import { AreaChart } from '@/components/ui/charts/area-chart'
import { BarChart } from '@/components/ui/charts/bar-chart'

import {
  HEADLINE_KPIS,
  HEADCOUNT_TREND_12MO,
  DEPT_BREAKDOWN,
  LOCATION_SPLIT,
  TENURE_BUCKETS,
  ATTRITION_REASONS,
  TOP_HIRING_DEPARTMENTS,
} from '~/mocks/analytics'

useHead({ title: 'Headcount analytics · uipkge HRMS' })
definePageMeta({ middleware: 'require-manager' })

// Period chips are display-only. The backing ref exists so the
// selected pill highlights, but no data slice depends on it -- this is
// a demo surface, not a filterable report.
const period = ref<'90d' | 'ytd' | '12mo'>('12mo')
const PERIODS: { value: typeof period.value; label: string }[] = [
  { value: '90d', label: 'Last 90 days' },
  { value: 'ytd', label: 'YTD' },
  { value: '12mo', label: 'Last 12 months' },
]

// Trend data shape required by AreaChart: { x, y }. We project once
// here so the template stays declarative.
const trendData = computed(() =>
  HEADCOUNT_TREND_12MO.map((p) => ({ x: p.month, y: p.active })),
)

// Tenure buckets feed BarChart with the same { x, y } shape.
const tenureData = computed(() =>
  TENURE_BUCKETS.map((b) => ({ x: b.label, y: b.value })),
)

const totalHeadcount = computed(() =>
  DEPT_BREAKDOWN.reduce((sum, d) => sum + d.value, 0),
)

const totalAttrition = computed(() =>
  ATTRITION_REASONS.reduce((sum, r) => sum + r.value, 0),
)

// Max value for the bar lists -- used to size each bar's fill width.
// We compute once per source instead of normalising in the template
// to keep the inline markup readable.
const maxDept = computed(() => Math.max(...DEPT_BREAKDOWN.map((d) => d.value)))
const maxLocation = computed(() => Math.max(...LOCATION_SPLIT.map((l) => l.value)))
const maxAttrition = computed(() => Math.max(...ATTRITION_REASONS.map((r) => r.value)))

// Map attrition tone enum -> Tailwind utility for the bar fill.
// Centralised here so the template stays free of conditional class
// soup.
function attritionBarClass(tone: 'destructive' | 'warning' | 'muted' | 'info') {
  switch (tone) {
    case 'destructive': return 'bg-destructive/70'
    case 'warning': return 'bg-warning/70'
    case 'info': return 'bg-primary/70'
    default: return 'bg-muted-foreground/40'
  }
}

function selectPeriod(value: typeof period.value) {
  period.value = value
}

// KPI tile presentation: tone + Lucide icon per headline label. The
// data shape (HEADLINE_KPIS) is mock-only so we key on label rather
// than introducing a discriminator field in the mock.
const KPI_PRESENTATION: Record<string, { tone: KpiTone; icon: any }> = {
  'Total headcount': { tone: 'success', icon: Users },
  'Attrition rate YTD': { tone: 'warning', icon: UserMinus },
  'Avg tenure': { tone: 'info', icon: Briefcase },
  'Open requisitions': { tone: 'info', icon: BarChart3 },
}

// Compose delta + label ("+12%" + "YoY" -> "+12% YoY") into the single
// string that HrKpiTile's delta prop expects.
function kpiDelta(d?: { value: string; positive: boolean; label?: string }) {
  if (!d) return undefined
  return {
    value: d.label ? `${d.value} ${d.label}` : d.value,
    positive: d.positive,
  }
}

function exportCsv() {
  // Mocked: real consumers would stream a CSV from their warehouse.
  toast.success('Headcount snapshot exported (mock CSV)')
}
</script>

<template>
  <div class="space-y-3 p-3 md:p-4">
    <!-- 1. Header -->
    <header class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div class="space-y-1">
        <h1 class="text-xl font-bold tracking-tight">Headcount analytics</h1>
        <p class="text-muted-foreground text-xs">
          Org-wide composition, trends, and attrition signals as of May 18, 2026.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <ChipGroup>
          <Chip
            v-for="p in PERIODS"
            :key="p.value"
            :variant="period === p.value ? 'filled' : 'outlined'"
            size="sm"
            class="cursor-pointer select-none"
            @click="selectPeriod(p.value)"
          >
            {{ p.label }}
          </Chip>
        </ChipGroup>
        <Button variant="outline" size="sm" @click="exportCsv">
          <Download class="mr-2 size-3.5" />
          Export CSV
        </Button>
      </div>
    </header>

    <!-- 2. KPI tiles -->
    <KpiGrid>
      <HrKpiTile
        v-for="tile in HEADLINE_KPIS"
        :key="tile.label"
        :label="tile.label"
        :value="tile.value"
        :delta="kpiDelta(tile.delta)"
        :hint="tile.hint"
        :tone="KPI_PRESENTATION[tile.label]?.tone"
        :icon="KPI_PRESENTATION[tile.label]?.icon"
      />
    </KpiGrid>

    <!-- 3. Headcount trend -->
    <Card>
      <CardHeader class="p-4 pb-2">
        <CardTitle class="text-sm">Headcount trend</CardTitle>
        <CardDescription>Active employees by month, Jun 2025 – May 2026.</CardDescription>
      </CardHeader>
      <CardContent class="p-4 pt-0">
        <ClientOnly>
          <AreaChart :data="trendData" x-field="x" y-field="y" :height="220" />
          <template #fallback>
            <div class="bg-muted/40 h-[220px] w-full animate-pulse rounded" />
          </template>
        </ClientOnly>
      </CardContent>
    </Card>

    <!-- 4. Department + Location -->
    <div class="grid gap-3 lg:grid-cols-2">
      <Card>
        <CardHeader class="p-4 pb-2">
          <CardTitle class="text-sm">Department breakdown</CardTitle>
          <CardDescription>{{ totalHeadcount }} employees across 8 functions.</CardDescription>
        </CardHeader>
        <CardContent class="p-4 pt-0 space-y-2.5">
          <div
            v-for="dept in DEPT_BREAKDOWN"
            :key="dept.name"
            class="space-y-1"
          >
            <div class="flex items-center justify-between gap-3 text-sm">
              <span class="flex items-center gap-2">
                <span class="size-2 rounded-full" :style="{ backgroundColor: dept.color }" />
                <span class="font-medium">{{ dept.name }}</span>
              </span>
              <span class="text-muted-foreground tabular-nums text-xs">
                {{ dept.value }}
                <span class="text-muted-foreground/60">
                  · {{ Math.round((dept.value / totalHeadcount) * 100) }}%
                </span>
              </span>
            </div>
            <div class="bg-muted/40 h-1.5 w-full overflow-hidden rounded-full">
              <div
                class="h-full rounded-full"
                :style="{ width: `${(dept.value / maxDept) * 100}%`, backgroundColor: dept.color }"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="p-4 pb-2">
          <CardTitle class="text-sm">Location split</CardTitle>
          <CardDescription>Six hubs incl. remote.</CardDescription>
        </CardHeader>
        <CardContent class="p-4 pt-0 space-y-2.5">
          <div
            v-for="loc in LOCATION_SPLIT"
            :key="loc.name"
            class="space-y-1"
          >
            <div class="flex items-center justify-between gap-3 text-sm">
              <span class="flex items-center gap-2">
                <span class="size-2 rounded-full" :style="{ backgroundColor: loc.color }" />
                <span class="font-medium">{{ loc.name }}</span>
              </span>
              <span class="text-muted-foreground tabular-nums text-xs">
                {{ loc.value }}
                <span class="text-muted-foreground/60">
                  · {{ Math.round((loc.value / totalHeadcount) * 100) }}%
                </span>
              </span>
            </div>
            <div class="bg-muted/40 h-1.5 w-full overflow-hidden rounded-full">
              <div
                class="h-full rounded-full"
                :style="{ width: `${(loc.value / maxLocation) * 100}%`, backgroundColor: loc.color }"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 5. Tenure + Attrition reasons -->
    <div class="grid gap-3 lg:grid-cols-2">
      <Card>
        <CardHeader class="p-4 pb-2">
          <CardTitle class="text-sm">Tenure distribution</CardTitle>
          <CardDescription>Five buckets across {{ totalHeadcount }} employees.</CardDescription>
        </CardHeader>
        <CardContent class="p-4 pt-0">
          <ClientOnly>
            <BarChart :data="tenureData" x-field="x" y-field="y" :height="200" />
            <template #fallback>
              <div class="bg-muted/40 h-[200px] w-full animate-pulse rounded" />
            </template>
          </ClientOnly>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="p-4 pb-2">
          <CardTitle class="text-sm">Attrition reasons</CardTitle>
          <CardDescription>
            {{ totalAttrition }} departures in the last 12 months.
          </CardDescription>
        </CardHeader>
        <CardContent class="p-4 pt-0 space-y-2.5">
          <div
            v-for="reason in ATTRITION_REASONS"
            :key="reason.reason"
            class="space-y-1"
          >
            <div class="flex items-center justify-between gap-3 text-sm">
              <span class="font-medium">{{ reason.reason }}</span>
              <span class="text-muted-foreground tabular-nums text-xs">
                {{ reason.value }}
                <span class="text-muted-foreground/60">
                  · {{ Math.round((reason.value / totalAttrition) * 100) }}%
                </span>
              </span>
            </div>
            <div class="bg-muted/40 h-1.5 w-full overflow-hidden rounded-full">
              <div
                :class="['h-full rounded-full', attritionBarClass(reason.tone)]"
                :style="{ width: `${(reason.value / maxAttrition) * 100}%` }"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 6. Top hiring departments -->
    <Card>
      <CardHeader class="p-4 pb-2">
        <CardTitle class="text-sm">Top hiring departments</CardTitle>
        <CardDescription>YTD fill rate against the 2026 hiring plan.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-3 p-4 pt-0">
        <div
          v-for="row in TOP_HIRING_DEPARTMENTS"
          :key="row.department"
          class="space-y-2"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="text-sm font-semibold">{{ row.department }}</span>
              <span class="text-muted-foreground text-xs">
                {{ row.filled }} filled · {{ row.open }} open · {{ row.planned }} planned
              </span>
            </div>
            <span class="text-muted-foreground tabular-nums text-xs">
              {{ Math.round((row.filled / row.planned) * 100) }}%
            </span>
          </div>
          <Progress :model-value="(row.filled / row.planned) * 100" class="h-2" />
        </div>
      </CardContent>
    </Card>
  </div>
</template>
