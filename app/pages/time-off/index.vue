<script setup lang="ts">
/**
 * Time-off page.
 *
 * Tabs:
 *   1. My requests   -- the current viewer's own requests (mocked to
 *                       Marcus Rivera, E-0002). Always visible.
 *   2. Team requests -- manager/admin only. Lists pending approvals
 *                       first, then approved + cancelled. Inline
 *                       approve / reject actions.
 *   3. Calendar      -- 4-week strip view of upcoming approved OOO
 *                       across the team. Per-day chips colour-coded
 *                       by leave type.
 *
 * KPI strip (4 tiles) sits above the tabs and counts apply across all
 * statuses (PTO balance + days used YTD come from the current user;
 * pending approvals + upcoming OOO come from the team view).
 *
 * Approve/reject are toast-only -- mutating the source list would
 * desync SSR/client because the page hot-reloads from the same mock
 * across navigations. A real consumer wires an API mutation here.
 */
import { computed, ref } from 'vue'
import { CalendarPlus, CalendarDays, CalendarOff, Hourglass, UsersRound, Check, X, MessageSquare, FileX, ArrowRight } from 'lucide-vue-next'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KpiGrid } from '@/components/ui/kpi-grid'
import { Separator } from '@/components/ui/separator'
import HrKpiTile from '@/components/HrKpiTile.vue'
import { toast } from 'vue-sonner'

import {
  REQUESTS,
  ME_ID,
  REQUEST_TYPE_LABELS,
  REQUEST_TYPE_TONE,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONE,
  findRequester,
  ooOnDay,
  type RequestType,
} from '~/mocks/time-off'

// Theme-bound colour map. Maps leave type → chart-N OKLCH token so the
// avatars + legend swatches flip with dark mode and the theme customiser.
// `color-mix` produces the translucent fill the calendar avatars use.
const LEAVE_TYPE_COLOR: Record<RequestType, string> = {
  vacation: 'var(--chart-1)',
  sick: 'var(--chart-2)',
  parental: 'var(--chart-3)',
  personal: 'var(--chart-4)',
  bereavement: 'var(--chart-5)',
}
function leaveTint(type: RequestType) {
  return `color-mix(in oklch, ${LEAVE_TYPE_COLOR[type]} 18%, transparent)`
}
import { getEmployeeDetail } from '~/mocks/employee-detail'

useHead({ title: 'Time off · uipkge HRMS' })

const { isManager } = usePersona()

const TODAY = '2026-05-18'

// ── My requests ─────────────────────────────────────────────────────────────
const myRequests = computed(() =>
  REQUESTS.filter((r) => r.employeeId === ME_ID).sort((a, b) => (a.from < b.from ? 1 : -1)),
)

const myDetail = computed(() => getEmployeeDetail(ME_ID))

const myPtoUsed = computed(() => {
  if (!myDetail.value) return 0
  return myDetail.value.pto.vacation.used + myDetail.value.pto.sick.used + myDetail.value.pto.personal.used
})

const myPtoTotal = computed(() => {
  if (!myDetail.value) return 0
  return myDetail.value.pto.vacation.total + myDetail.value.pto.sick.total + myDetail.value.pto.personal.total
})

const myUpcoming = computed(() =>
  myRequests.value.filter((r) => r.from >= TODAY && r.status !== 'cancelled' && r.status !== 'rejected'),
)

// ── Team requests ───────────────────────────────────────────────────────────
const teamRequests = computed(() => {
  // Everyone's requests except mine. Sort: pending first, then approved
  // (upcoming first), then everything else newest-first.
  const others = REQUESTS.filter((r) => r.employeeId !== ME_ID)
  return others.sort((a, b) => {
    const aRank = a.status === 'pending' ? 0 : a.status === 'approved' ? 1 : 2
    const bRank = b.status === 'pending' ? 0 : b.status === 'approved' ? 1 : 2
    if (aRank !== bRank) return aRank - bRank
    return a.from < b.from ? -1 : 1
  })
})

const teamPending = computed(() => teamRequests.value.filter((r) => r.status === 'pending'))
const teamUpcomingApproved = computed(() =>
  teamRequests.value.filter((r) => r.status === 'approved' && r.from >= TODAY),
)

// ── Calendar ────────────────────────────────────────────────────────────────
// Render a 28-day strip starting today. Each cell shows up to 3 OOO
// avatars; remaining count rendered as a +N pill.
const calendarDays = computed(() => {
  const out: { iso: string; label: string; weekday: string; isToday: boolean }[] = []
  const [y0, m0, d0] = TODAY.split('-').map(Number)
  const start = new Date(Date.UTC(y0!, m0! - 1, d0!))
  for (let i = 0; i < 28; i++) {
    const d = new Date(start.getTime() + i * 86400000)
    const iso = d.toISOString().slice(0, 10)
    out.push({
      iso,
      label: `${d.getUTCDate()}`,
      weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()]!,
      isToday: iso === TODAY,
    })
  }
  return out
})

function ooForDay(iso: string) {
  return ooOnDay(iso)
}

const pendingTab = ref('mine')

function approve(id: string) {
  toast.success(`Approved ${id} (mock)`)
}
function reject(id: string) {
  toast.warning(`Rejected ${id} (mock)`)
}
function comment(id: string) {
  toast.info(`Open comment thread on ${id} (mock)`)
}
function cancel(id: string) {
  toast.warning(`Cancelled ${id} (mock)`)
}
</script>

<template>
  <div class="space-y-3 p-3 md:p-4">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-bold tracking-tight">Time off</h1>
        <p class="text-muted-foreground text-xs">
          Request leave, approve your team's requests, and see who's off across the next 4 weeks.
        </p>
      </div>
      <Button>
        <CalendarPlus class="mr-2 size-4" />Request time off
      </Button>
    </header>

    <KpiGrid>
      <HrKpiTile
        label="My PTO balance"
        :value="`${myPtoTotal - myPtoUsed} / ${myPtoTotal} days`"
        hint="Vacation + sick + personal"
        tone="success"
        :icon="CalendarDays"
      />
      <HrKpiTile
        label="Used YTD"
        :value="myPtoUsed"
        hint="Days off taken"
        tone="info"
        :icon="CalendarDays"
      />
      <HrKpiTile
        label="Team pending"
        :value="teamPending.length"
        hint="Awaiting your review"
        tone="warning"
        :icon="Hourglass"
      />
      <HrKpiTile
        label="Upcoming team OOO"
        :value="teamUpcomingApproved.length"
        hint="Approved across next 4 weeks"
        tone="info"
        :icon="UsersRound"
      />
    </KpiGrid>

    <Tabs v-model="pendingTab">
      <TabsList>
        <TabsTrigger value="mine">My requests</TabsTrigger>
        <TabsTrigger v-if="isManager" value="team">
          Team requests
          <span v-if="teamPending.length" class="bg-warning/15 text-warning ml-1.5 rounded-full px-1.5 text-xs font-semibold tabular-nums">
            {{ teamPending.length }}
          </span>
        </TabsTrigger>
        <TabsTrigger value="calendar">Team calendar</TabsTrigger>
      </TabsList>

      <!-- My requests -->
      <TabsContent value="mine" class="space-y-6">
        <Card v-if="myUpcoming.length">
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Upcoming time off</CardTitle>
            <CardDescription>Approved + pending requests from today onwards.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-1.5 p-4 pt-0">
            <EmptyState
              v-if="!myUpcoming.length"
              :icon="CalendarOff"
              title="No upcoming time off"
              description="Nothing scheduled. Submit a request to plan ahead."
              class="py-6"
            />
            <div
              v-for="r in myUpcoming"
              :key="r.id"
              class="flex flex-wrap items-center justify-between gap-3 rounded-md border p-2"
            >
              <div class="flex items-center gap-3">
                <Badge :class="['capitalize', REQUEST_TYPE_TONE[r.type]]">
                  {{ REQUEST_TYPE_LABELS[r.type] }}
                </Badge>
                <div>
                  <p class="text-sm font-medium">{{ r.from }} <ArrowRight class="text-muted-foreground inline size-3" /> {{ r.to }}</p>
                  <p class="text-muted-foreground text-xs">{{ r.days }} working days{{ r.reason ? ` · ${r.reason}` : '' }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Badge :class="REQUEST_STATUS_TONE[r.status]">
                  {{ REQUEST_STATUS_LABELS[r.status] }}
                </Badge>
                <Button v-if="r.status === 'pending'" variant="ghost" size="sm" class="text-destructive" @click="cancel(r.id)">
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Request history</CardTitle>
            <CardDescription>All time-off requests submitted.</CardDescription>
          </CardHeader>
          <CardContent class="p-4 pt-0">
            <EmptyState
              v-if="!myRequests.length"
              :icon="FileX"
              title="No requests yet"
              description="You haven't submitted any time-off requests."
              class="py-6"
            />
            <ul v-else class="space-y-2">
              <li
                v-for="r in myRequests"
                :key="r.id"
                class="flex flex-wrap items-center justify-between gap-3 rounded-md border p-2"
              >
                <div class="flex items-center gap-3">
                  <Badge :class="['capitalize', REQUEST_TYPE_TONE[r.type]]">
                    {{ REQUEST_TYPE_LABELS[r.type] }}
                  </Badge>
                  <div>
                    <p class="text-sm font-medium">{{ r.from }} <ArrowRight class="text-muted-foreground inline size-3" /> {{ r.to }}</p>
                    <p class="text-muted-foreground text-xs">
                      {{ r.days }} days · Submitted {{ r.submittedAt }}{{ r.approver ? ` · Approved by ${r.approver}` : '' }}
                    </p>
                  </div>
                </div>
                <Badge :class="REQUEST_STATUS_TONE[r.status]">
                  {{ REQUEST_STATUS_LABELS[r.status] }}
                </Badge>
              </li>
            </ul>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Team requests (manager+) -->
      <TabsContent v-if="isManager" value="team" class="space-y-6">
        <Card v-if="teamPending.length">
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Pending approvals</CardTitle>
            <CardDescription>{{ teamPending.length }} request{{ teamPending.length === 1 ? '' : 's' }} awaiting your decision.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-1.5 p-4 pt-0">
            <div
              v-for="r in teamPending"
              :key="r.id"
              class="space-y-2 rounded-md border p-2"
            >
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <Avatar class="size-8">
                    <AvatarFallback class="text-xs font-semibold">
                      {{ findRequester(r)?.initials ?? '??' }}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p class="text-sm font-medium">
                      {{ findRequester(r)?.name ?? r.employeeId }}
                      <span class="text-muted-foreground font-normal"> · {{ findRequester(r)?.title }}</span>
                    </p>
                    <p class="text-muted-foreground text-xs">
                      {{ r.from }} <ArrowRight class="inline size-3" /> {{ r.to }} · {{ r.days }} days
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <Badge :class="['capitalize', REQUEST_TYPE_TONE[r.type]]">
                    {{ REQUEST_TYPE_LABELS[r.type] }}
                  </Badge>
                  <Button variant="ghost" size="icon" class="size-8" @click="comment(r.id)" aria-label="Comment">
                    <MessageSquare class="size-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" class="text-destructive hover:text-destructive" @click="reject(r.id)">
                    <X class="mr-1 size-3.5" />Reject
                  </Button>
                  <Button size="sm" @click="approve(r.id)">
                    <Check class="mr-1 size-3.5" />Approve
                  </Button>
                </div>
              </div>
              <p v-if="r.reason" class="text-muted-foreground border-t pt-2 text-xs">
                <span class="font-semibold">Reason:</span> {{ r.reason }}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">All team requests</CardTitle>
            <CardDescription>Approved, cancelled, and rejected requests across the team.</CardDescription>
          </CardHeader>
          <CardContent class="p-4 pt-0">
            <ul class="space-y-1.5">
              <li
                v-for="r in teamRequests.filter((x) => x.status !== 'pending')"
                :key="r.id"
                class="flex flex-wrap items-center justify-between gap-3 rounded-md border p-2"
              >
                <div class="flex items-center gap-3">
                  <Avatar class="size-7">
                    <AvatarFallback class="text-xs font-semibold">{{ findRequester(r)?.initials ?? '??' }}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p class="text-sm font-medium">
                      {{ findRequester(r)?.name ?? r.employeeId }}
                      <span class="text-muted-foreground font-normal">
                        — {{ REQUEST_TYPE_LABELS[r.type] }}
                      </span>
                    </p>
                    <p class="text-muted-foreground text-xs">
                      {{ r.from }} <ArrowRight class="inline size-3" /> {{ r.to }} · {{ r.days }} days{{ r.approver ? ` · ${r.approver}` : '' }}
                    </p>
                  </div>
                </div>
                <Badge :class="REQUEST_STATUS_TONE[r.status]">
                  {{ REQUEST_STATUS_LABELS[r.status] }}
                </Badge>
              </li>
            </ul>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Calendar -->
      <TabsContent value="calendar" class="space-y-4">
        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Next 4 weeks</CardTitle>
            <CardDescription>Who's off, by day. Hover a chip to see the leave type.</CardDescription>
          </CardHeader>
          <CardContent class="p-4 pt-0">
            <div class="grid grid-cols-7 gap-1.5">
              <div
                v-for="day in calendarDays"
                :key="day.iso"
                :class="[
                  'rounded-md border p-2 text-xs min-h-[88px]',
                  day.isToday ? 'border-primary bg-primary/5' : 'border-border',
                ]"
              >
                <div class="mb-1.5 flex items-center justify-between">
                  <span class="text-muted-foreground text-xs uppercase tracking-wide">{{ day.weekday }}</span>
                  <span :class="['tabular-nums', day.isToday ? 'text-primary font-bold' : 'font-medium']">{{ day.label }}</span>
                </div>
                <div class="flex flex-wrap gap-1">
                  <template v-for="(r, i) in ooForDay(day.iso).slice(0, 3)" :key="r.id">
                    <span
                      :class="['inline-flex items-center justify-center rounded-full border-2 border-background', '-ml-1.5 size-5 text-xs font-semibold ring-1 ring-border']"
                      :style="{ background: leaveTint(r.type) }"
                      :title="`${findRequester(r)?.name} · ${REQUEST_TYPE_LABELS[r.type]}`"
                    >
                      {{ findRequester(r)?.initials.slice(0, 2) }}
                    </span>
                  </template>
                  <span
                    v-if="ooForDay(day.iso).length > 3"
                    class="bg-muted text-muted-foreground inline-flex size-5 -ml-1.5 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-border"
                  >
                    +{{ ooForDay(day.iso).length - 3 }}
                  </span>
                  <span v-if="!ooForDay(day.iso).length" class="text-muted-foreground/50 text-xs">Quiet</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 pt-0">
            <p class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Leave types:</p>
            <span v-for="t in (['vacation', 'sick', 'personal', 'parental', 'bereavement'] as const)" :key="t" class="flex items-center gap-1.5 text-xs">
              <span class="size-2.5 rounded-full" :style="{ background: LEAVE_TYPE_COLOR[t] }" />
              {{ REQUEST_TYPE_LABELS[t] }}
            </span>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>
