<script setup lang="ts">
/**
 * Performance reviews.
 *
 * Tabs:
 *   1. My reviews         -- always visible. Current cycle status,
 *                            self-review form (Sheet drawer), peer
 *                            requests I owe, history of past cycles.
 *   2. Team               -- manager+. Direct reports with their
 *                            review progress + per-report quick-action.
 *   3. Calibration        -- admin. Department x rating heatmap so
 *                            the calibrator can spot skewed bands.
 *
 * Hero strip up top shows the active cycle, completion %, and the two
 * due dates (self + manager).
 *
 * The self-review form is intentionally split into 4 sections rendered
 * inside a Sheet -- mirrors the layout reviewers actually see, but
 * keeps the page itself uncluttered until the user clicks "Continue".
 *
 * Mutations are toast-only; the mock store is read-only by design so
 * SSR + client never diverge.
 */
import { computed, ref } from 'vue'
import { Award, CalendarCheck2, MessageSquarePlus, FileCheck2, FileEdit, Sparkles, Star, Users, UserCheck, ListChecks, PenLine, X, Save, Send, History, ChevronRight, CalendarRange } from 'lucide-vue-next'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KpiGrid } from '@/components/ui/kpi-grid'
import { Progress } from '@/components/ui/progress'
import HrKpiTile from '@/components/HrKpiTile.vue'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { toast } from 'vue-sonner'

import {
  CYCLES,
  ACTIVE_CYCLE_ID,
  ME_ID,
  MY_PEER_REQUESTS,
  MY_PAST_REVIEWS,
  RATING_LABELS,
  RATING_TONE,
  statusFor,
  statusForCycle,
  summary,
  calibrationGrid,
  type Rating,
} from '~/mocks/reviews'
import { EMPLOYEES, findEmployee } from '~/mocks/people'

useHead({ title: 'Reviews · uipkge HRMS' })

const { isAdmin, isManager } = usePersona()

const activeCycle = computed(() => CYCLES.find((c) => c.id === ACTIVE_CYCLE_ID)!)
const cycleSummary = computed(() => summary(ACTIVE_CYCLE_ID))
const myStatus = computed(() => statusFor(ME_ID))

const myReports = computed(() =>
  EMPLOYEES.filter((e) => e.manager === findEmployee(ME_ID)?.name).map((e) => ({
    employee: e,
    status: statusFor(e.id),
  })),
)

// Team-wide view = everyone the current user could approve / write a
// review for. For Marcus (E-0002) the team is small. Fall back to
// "department peers" so the demo always shows a meaningful list.
const teamRows = computed(() => {
  const me = findEmployee(ME_ID)
  if (!me) return []
  const direct = EMPLOYEES.filter((e) => e.manager === me.name)
  if (direct.length) return direct.map((e) => ({ employee: e, status: statusFor(e.id) }))
  return EMPLOYEES.filter((e) => e.department === me.department && e.id !== me.id)
    .slice(0, 12)
    .map((e) => ({ employee: e, status: statusFor(e.id) }))
})

const calibration = computed(() => calibrationGrid(ACTIVE_CYCLE_ID).sort((a, b) => b.total - a.total))

// ── Self-review drawer ─────────────────────────────────────────────────────
const selfSheetOpen = ref(false)
const review = ref({
  accomplishments: 'Shipped design-system v3 GA two weeks ahead of plan. Mentored 3 IC4 engineers through their first quarter. Led the accessibility working group across Eng + Design.',
  growth: 'Push harder on cross-org alignment before kicking off large refactors. Spend more time recording short demos for async review.',
  goals: 'Take more risk on staff-level scope: lead the next-gen tokens initiative end-to-end. Speak at one external conference by EOY.',
  managerAsk: 'More coaching on staff/principal trajectory; calibrated feedback on growth gaps.',
  rating: '4' as '1' | '2' | '3' | '4' | '5',
})

function openSelfReview() {
  selfSheetOpen.value = true
}
function saveDraft() {
  toast.success('Draft saved (mock)')
}
function submitReview() {
  toast.success('Self-review submitted (mock)')
  selfSheetOpen.value = false
}

function startManagerReview(empId: string) {
  toast.info(`Open manager review for ${findEmployee(empId)?.name} (mock)`)
}

function writePeerReview(rid: string) {
  toast.info(`Open peer review form for ${findEmployee(rid)?.name} (mock)`)
}

function statusTone(s?: string) {
  if (s === 'submitted') return 'bg-success/10 text-success border-success/20'
  if (s === 'in-progress') return 'bg-warning/10 text-warning border-warning/20'
  return 'bg-muted text-muted-foreground border-muted-foreground/20'
}

function statusLabel(s?: string) {
  if (s === 'submitted') return 'Submitted'
  if (s === 'in-progress') return 'In progress'
  return 'Not started'
}
</script>

<template>
  <div class="space-y-3 p-3 md:p-4">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="space-y-1">
        <div class="flex flex-wrap items-center gap-2">
          <Badge variant="outline" class="text-xs">{{ activeCycle.label }}</Badge>
          <span class="text-muted-foreground text-xs">{{ activeCycle.period }}</span>
        </div>
        <h1 class="text-xl font-bold tracking-tight">Performance reviews</h1>
        <p class="text-muted-foreground text-xs">
          Self-review due {{ activeCycle.selfDue }} · Manager review due {{ activeCycle.managerDue }} · Cycle closes {{ activeCycle.closes }}.
        </p>
      </div>
      <Button @click="openSelfReview">
        <PenLine class="mr-2 size-4" />
        {{ myStatus?.selfStatus === 'submitted' ? 'View my self-review' : myStatus?.selfStatus === 'in-progress' ? 'Continue self-review' : 'Start self-review' }}
      </Button>
    </header>

    <KpiGrid>
      <HrKpiTile
        label="My self-review"
        :value="statusLabel(myStatus?.selfStatus)"
        :hint="`Due ${activeCycle.selfDue}`"
        tone="warning"
        :icon="UserCheck"
      />
      <HrKpiTile
        label="Peer reviews I owe"
        :value="`${MY_PEER_REQUESTS.filter((p) => p.status === 'pending').length} / ${MY_PEER_REQUESTS.length}`"
        :hint="`Reminders go out ${activeCycle.selfDue}`"
        tone="info"
        :icon="MessageSquarePlus"
      />
      <HrKpiTile
        label="Self-reviews submitted"
        :value="`${cycleSummary.selfPct}%`"
        :hint="`${cycleSummary.selfSubmitted} / ${cycleSummary.eligible} employees`"
        tone="success"
        :icon="FileCheck2"
      />
      <HrKpiTile
        label="Manager reviews"
        :value="`${cycleSummary.managerPct}%`"
        :hint="`${cycleSummary.managerSubmitted} / ${cycleSummary.eligible} reviews`"
        tone="info"
        :icon="FileEdit"
      />
    </KpiGrid>

    <Tabs default-value="mine">
      <TabsList>
        <TabsTrigger value="mine">My reviews</TabsTrigger>
        <TabsTrigger v-if="isManager" value="team">
          Team
          <span class="bg-warning/15 text-warning ml-1.5 rounded-full px-1.5 text-xs font-semibold tabular-nums">
            {{ teamRows.filter((r) => r.status?.managerStatus !== 'submitted').length }}
          </span>
        </TabsTrigger>
        <TabsTrigger v-if="isAdmin" value="calibration">Calibration</TabsTrigger>
      </TabsList>

      <!-- My reviews -->
      <TabsContent value="mine" class="space-y-6">
        <div class="grid gap-6 lg:grid-cols-3">
          <!-- Self-review card -->
          <Card class="lg:col-span-2">
            <CardHeader class="p-4 pb-2">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <CardTitle class="text-sm">Self-review · {{ activeCycle.label }}</CardTitle>
                  <CardDescription>Four sections + an overall rating. Save a draft any time.</CardDescription>
                </div>
                <Badge :class="['capitalize', statusTone(myStatus?.selfStatus)]">
                  {{ statusLabel(myStatus?.selfStatus) }}
                </Badge>
              </div>
            </CardHeader>
            <CardContent class="space-y-3 p-4 pt-0">
              <ol class="space-y-3">
                <li v-for="(step, i) in (['Accomplishments', 'Growth areas', 'Q3 goals', 'Manager ask'])" :key="step"
                  class="flex items-start gap-3 rounded-md border p-2"
                >
                  <div class="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                    {{ i + 1 }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium">{{ step }}</p>
                    <p class="text-muted-foreground line-clamp-2 text-xs">
                      <template v-if="i === 0">{{ review.accomplishments.slice(0, 110) }}…</template>
                      <template v-else-if="i === 1">{{ review.growth.slice(0, 110) }}…</template>
                      <template v-else-if="i === 2">{{ review.goals.slice(0, 110) }}…</template>
                      <template v-else>{{ review.managerAsk.slice(0, 110) }}…</template>
                    </p>
                  </div>
                  <ChevronRight class="text-muted-foreground mt-1 size-4" />
                </li>
              </ol>
              <Separator />
              <div class="flex items-center justify-between gap-2">
                <p class="text-muted-foreground text-xs">Current draft rating</p>
                <Badge :class="RATING_TONE[Number(review.rating) as Rating]">
                  {{ RATING_LABELS[Number(review.rating) as Rating] }}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <!-- Manager review status -->
          <Card>
            <CardHeader class="p-4 pb-2">
              <CardTitle class="text-sm">Manager review</CardTitle>
              <CardDescription>From {{ findEmployee(ME_ID)?.manager }}.</CardDescription>
            </CardHeader>
            <CardContent class="p-4 pt-0 space-y-3">
              <Badge :class="statusTone(myStatus?.managerStatus)">
                {{ statusLabel(myStatus?.managerStatus) }}
              </Badge>
              <p class="text-muted-foreground text-sm">
                Your manager's review will be released after the calibration round on
                <span class="text-foreground font-medium">{{ activeCycle.closes }}</span>.
                Until then, only the rating is held by HR.
              </p>
              <Separator />
              <p class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Peer feedback received</p>
              <p class="text-sm">
                <span class="font-bold tabular-nums">{{ myStatus?.peerCount.submitted ?? 0 }}</span>
                <span class="text-muted-foreground"> / {{ myStatus?.peerCount.invited ?? 0 }} invited</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <!-- Peer reviews I owe -->
        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Peer reviews I need to write</CardTitle>
            <CardDescription>Due {{ activeCycle.selfDue }}. Each takes ~5 minutes.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-1.5 p-4 pt-0">
            <EmptyState
              v-if="!MY_PEER_REQUESTS.length"
              :icon="UserCheck"
              title="No peer reviews requested"
              description="When teammates ask for your feedback, they'll appear here."
              class="py-6"
            />
            <div
              v-for="req in MY_PEER_REQUESTS"
              :key="req.id"
              class="flex flex-wrap items-center justify-between gap-3 rounded-md border p-2"
            >
              <div class="flex items-center gap-3">
                <Avatar class="size-8">
                  <AvatarFallback class="text-xs font-semibold">{{ findEmployee(req.revieweeId)?.initials }}</AvatarFallback>
                </Avatar>
                <div>
                  <p class="text-sm font-medium">{{ findEmployee(req.revieweeId)?.name }}</p>
                  <p class="text-muted-foreground text-xs">
                    {{ findEmployee(req.revieweeId)?.title }} · Due {{ req.dueAt }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Badge :variant="req.status === 'submitted' ? 'success' : 'warning'" class="capitalize">
                  {{ req.status === 'submitted' ? 'Submitted' : 'Pending' }}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="req.status === 'submitted'"
                  @click="writePeerReview(req.revieweeId)"
                >
                  <PenLine class="mr-2 size-3.5" />
                  {{ req.status === 'submitted' ? 'View' : 'Write' }}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- History -->
        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Past reviews</CardTitle>
            <CardDescription>Two completed cycles on file.</CardDescription>
          </CardHeader>
          <CardContent class="p-4 pt-0 space-y-3">
            <EmptyState
              v-if="!MY_PAST_REVIEWS.length"
              :icon="History"
              title="No past reviews"
              description="Completed cycles will be archived here."
              class="py-6"
            />
            <div
              v-for="past in MY_PAST_REVIEWS"
              :key="past.cycleId"
              class="space-y-2 rounded-lg border p-4"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <Badge variant="outline" class="text-xs">
                    {{ CYCLES.find((c) => c.id === past.cycleId)?.label ?? past.cycleId }}
                  </Badge>
                  <span class="text-muted-foreground text-xs">
                    <History class="mr-1 inline size-3" />
                    Submitted {{ past.selfSubmittedAt }} · Manager: {{ past.managerName }}
                  </span>
                </div>
                <Badge :class="RATING_TONE[past.finalRating]">
                  <Star class="size-3" />{{ RATING_LABELS[past.finalRating] }}
                </Badge>
              </div>
              <p class="text-sm">{{ past.managerHeadline }}</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Team (manager+) -->
      <TabsContent v-if="isManager" value="team" class="space-y-6">
        <Card>
          <CardHeader class="p-4 pb-2">
            <div class="flex items-center justify-between gap-3">
              <div>
                <CardTitle class="text-sm">{{ findEmployee(ME_ID)?.manager === 'CEO' ? 'My team' : `${findEmployee(ME_ID)?.department} team` }}</CardTitle>
                <CardDescription>Self-review + manager-review status across {{ teamRows.length }} people.</CardDescription>
              </div>
              <Button variant="outline" size="sm" @click="toast.info('Bulk reminders sent (mock)')">
                <MessageSquarePlus class="mr-2 size-3.5" />Send reminders
              </Button>
            </div>
          </CardHeader>
          <CardContent class="space-y-1.5 p-4 pt-0">
            <EmptyState
              v-if="!teamRows.length"
              :icon="Users"
              title="No reports yet"
              description="Direct reports will appear here once they're assigned."
              class="py-6"
            />
            <div
              v-for="row in teamRows"
              :key="row.employee.id"
              class="flex flex-wrap items-center justify-between gap-3 rounded-md border p-2"
            >
              <div class="flex items-center gap-3">
                <Avatar class="size-8">
                  <AvatarFallback class="text-xs font-semibold">{{ row.employee.initials }}</AvatarFallback>
                </Avatar>
                <div>
                  <NuxtLink :to="`/people/${row.employee.id}`" class="text-sm font-medium hover:underline">
                    {{ row.employee.name }}
                  </NuxtLink>
                  <p class="text-muted-foreground text-xs">{{ row.employee.title }}</p>
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <div class="flex items-center gap-1.5">
                  <span class="text-muted-foreground text-xs uppercase tracking-wide">Self</span>
                  <span :class="['rounded-full border px-1.5 py-0.5 text-xs font-semibold capitalize', statusTone(row.status?.selfStatus)]">
                    {{ statusLabel(row.status?.selfStatus) }}
                  </span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-muted-foreground text-xs uppercase tracking-wide">Mgr</span>
                  <span :class="['rounded-full border px-1.5 py-0.5 text-xs font-semibold capitalize', statusTone(row.status?.managerStatus)]">
                    {{ statusLabel(row.status?.managerStatus) }}
                  </span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-muted-foreground text-xs uppercase tracking-wide">Peers</span>
                  <span class="tabular-nums text-xs font-medium">
                    {{ row.status?.peerCount.submitted ?? 0 }}/{{ row.status?.peerCount.invited ?? 0 }}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="row.status?.selfStatus !== 'submitted'"
                  @click="startManagerReview(row.employee.id)"
                >
                  <FileEdit class="mr-2 size-3.5" />
                  {{ row.status?.managerStatus === 'submitted' ? 'View' : 'Write' }}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Calibration (admin). ClientOnly: SSR sentinel persona is
           'admin' so dept × rating distribution + cycle timeline would
           ship in initial HTML otherwise. -->
      <TabsContent v-if="isAdmin" value="calibration" class="space-y-6">
        <ClientOnly>
        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Department × rating distribution</CardTitle>
            <CardDescription>Only completed manager reviews are counted. Watch for top-heavy or bottom-heavy bands.</CardDescription>
          </CardHeader>
          <CardContent class="p-4 pt-0">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b">
                    <th scope="col" class="text-muted-foreground py-2 pr-3 text-left text-xs font-semibold uppercase tracking-wide">Department</th>
                    <th
                      v-for="r in [5, 4, 3, 2, 1] as Rating[]"
                      :key="r"
                      scope="col"
                      :aria-label="`Rating ${r} — ${RATING_LABELS[r]}`"
                      class="px-2 py-2 text-center text-xs font-semibold"
                    >
                      <Badge :class="RATING_TONE[r]">
                        <Star class="size-3" />{{ r }}
                      </Badge>
                    </th>
                    <th scope="col" class="text-muted-foreground py-2 pl-3 text-right text-xs font-semibold uppercase tracking-wide">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="dept in calibration"
                    :key="dept.department"
                    class="border-b last:border-0"
                  >
                    <td class="py-2 pr-3 font-medium">{{ dept.department }}</td>
                    <td v-for="r in [5, 4, 3, 2, 1] as Rating[]" :key="r" class="px-2 py-2 text-center">
                      <div
                        :class="['mx-auto flex h-8 items-center justify-center rounded text-xs font-bold tabular-nums', dept.byRating[r] > 0 ? RATING_TONE[r] : 'text-muted-foreground/50']"
                        :style="dept.byRating[r] ? `min-width: ${24 + dept.byRating[r] * 6}px` : 'min-width: 24px'"
                      >
                        {{ dept.byRating[r] || '—' }}
                      </div>
                    </td>
                    <td class="text-muted-foreground py-2 pl-3 text-right tabular-nums text-xs">{{ dept.total }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Cycle timeline</CardTitle>
            <CardDescription>Past + active + upcoming review cycles.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-1.5 p-4 pt-0">
            <div
              v-for="cycle in CYCLES"
              :key="cycle.id"
              class="flex flex-wrap items-center justify-between gap-3 rounded-md border p-2"
            >
              <div class="flex items-center gap-3">
                <div class="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-md">
                  <CalendarRange class="size-4" />
                </div>
                <div>
                  <p class="text-sm font-medium">{{ cycle.label }}</p>
                  <p class="text-muted-foreground text-xs">{{ cycle.period }} · Closes {{ cycle.closes }}</p>
                </div>
              </div>
              <Badge
                :variant="cycle.status === 'active' ? 'default' : 'outline'"
                class="capitalize text-xs"
              >
                {{ cycle.status }}
              </Badge>
            </div>
          </CardContent>
        </Card>
        </ClientOnly>
      </TabsContent>
    </Tabs>

    <!-- Self-review drawer -->
    <Sheet v-model:open="selfSheetOpen">
      <SheetContent class="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle class="flex items-center gap-2">
            <Sparkles class="text-primary size-4" />
            Self-review · {{ activeCycle.label }}
          </SheetTitle>
          <SheetDescription>
            Submit by {{ activeCycle.selfDue }}. Saving a draft auto-syncs across devices.
          </SheetDescription>
        </SheetHeader>
        <div class="space-y-3 px-4 py-4">
          <div class="space-y-2">
            <Label for="acc">Top accomplishments this cycle</Label>
            <p class="text-muted-foreground text-xs">Concrete outcomes shipped + impact.</p>
            <Textarea id="acc" v-model="review.accomplishments" rows="5" />
          </div>
          <div class="space-y-2">
            <Label for="growth">Where am I growing?</Label>
            <p class="text-muted-foreground text-xs">Specific. Honest.</p>
            <Textarea id="growth" v-model="review.growth" rows="4" />
          </div>
          <div class="space-y-2">
            <Label for="goals">Goals for next cycle</Label>
            <p class="text-muted-foreground text-xs">3-5 outcomes — your manager will calibrate these in 1:1.</p>
            <Textarea id="goals" v-model="review.goals" rows="4" />
          </div>
          <div class="space-y-2">
            <Label for="ask">Ask of my manager</Label>
            <Textarea id="ask" v-model="review.managerAsk" rows="3" />
          </div>
          <Separator />
          <div class="space-y-3">
            <Label>Overall self-rating</Label>
            <RadioGroup v-model="review.rating" class="space-y-2">
              <label
                v-for="key in (['5', '4', '3', '2', '1'])"
                :key="key"
                :class="['flex items-center gap-3 rounded-md border p-2 cursor-pointer transition-colors', review.rating === key ? 'border-primary bg-primary/5' : 'hover:bg-muted/40']"
              >
                <RadioGroupItem :value="key" />
                <div>
                  <p class="text-sm font-medium">{{ RATING_LABELS[Number(key) as Rating] }}</p>
                  <p class="text-muted-foreground text-xs">
                    <template v-if="key === '5'">Consistently delivered beyond what was expected at this level.</template>
                    <template v-else-if="key === '4'">Strong performance, exceeded most expectations at this level.</template>
                    <template v-else-if="key === '3'">Solid execution against expectations at this level.</template>
                    <template v-else-if="key === '2'">Met some but not all expectations at this level.</template>
                    <template v-else>Below expectations — improvement plan recommended.</template>
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>
        </div>
        <SheetFooter class="flex flex-row items-center justify-end gap-2 px-4 pb-6">
          <Button variant="ghost" @click="selfSheetOpen = false">
            <X class="mr-2 size-3.5" />Close
          </Button>
          <Button variant="outline" @click="saveDraft">
            <Save class="mr-2 size-3.5" />Save draft
          </Button>
          <Button @click="submitReview">
            <Send class="mr-2 size-3.5" />Submit
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  </div>
</template>
