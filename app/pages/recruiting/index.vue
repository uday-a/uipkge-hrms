<script setup lang="ts">
/**
 * Recruiting pipeline.
 *
 * Layout:
 *   - Hero with primary "Open requisition" CTA + secondary "Add candidate"
 *   - 4 KPI tiles (open reqs / candidates / avg time-to-hire / offer acceptance)
 *   - Requisition filter strip (all / per-req chips)
 *   - 5-column kanban: Applied / Screened / Interviewed / Offer / Hired
 *
 * The kanban is read-only -- drag-to-move is a real product feature
 * but here the mock layer is immutable so we keep the cards static and
 * surface a detail Sheet on click.
 *
 * Column counts use the FULL stage totals (482 applied etc.) rather
 * than the rendered sample so the demo reads as a real pipeline.
 *
 * Manager+ gate via middleware (matches the prior page rule).
 */
import { computed, ref } from 'vue'
import { Plus, UserRoundPlus, Users, BarChart3, Clock, ThumbsUp, Filter, MessageSquare, Calendar, ChevronRight, Star, X } from 'lucide-vue-next'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { KpiGrid } from '@/components/ui/kpi-grid'
import HrKpiTile from '@/components/HrKpiTile.vue'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Board, BoardCard, BoardLane, BoardLaneBody, BoardLaneEmpty, BoardLaneHeader } from '@/components/ui/board'
import { useBoard } from '@/composables/useBoard'
import { toast } from 'vue-sonner'

import {
  REQUISITIONS,
  CANDIDATES,
  STAGE_LABELS,
  STAGE_TONE,
  STAGE_DOT_TONE,
  STAGE_TOTALS,
  SOURCE_TONE,
  TIME_TO_HIRE_DAYS,
  OFFER_ACCEPTANCE_RATE,
  findReq,
  findHiringManager,
  findRecruiter,
  daysSince,
  type Stage,
  type Candidate,
} from '~/mocks/recruiting'

useHead({ title: 'Recruiting · uipkge HRMS' })
definePageMeta({ middleware: 'require-manager' })

const STAGES: Stage[] = ['applied', 'screened', 'interviewed', 'offer', 'hired']

const reqFilter = ref<string>('all')

// Local stage overrides — mock is immutable, so DnD writes here.
const stageOverrides = ref<Record<string, Stage>>({})
const stageOf = (c: Candidate): Stage => stageOverrides.value[c.id] ?? c.stage

const filteredCandidates = computed(() => {
  if (reqFilter.value === 'all') return CANDIDATES
  return CANDIDATES.filter((c) => c.requisitionId === reqFilter.value)
})

const byStage = computed(() => {
  const grouped: Record<Stage, Candidate[]> = { applied: [], screened: [], interviewed: [], offer: [], hired: [] }
  for (const c of filteredCandidates.value) grouped[stageOf(c)].push(c)
  return grouped
})

// Wire useBoard against the byStage computed. Writes route through the
// onChange callback so we keep the existing stageOverrides ref as the
// single source of truth (mock layer stays immutable).
const boardLanes = computed({
  get: () => byStage.value as Record<string, Candidate[]>,
  set: () => {
    // The composable splices its own working copy and then assigns it
    // back; we ignore that write because our onChange callback is the
    // canonical mutation path. This keeps stage overrides authoritative
    // even when the user re-filters mid-drag.
  },
})

const {
  state: boardState,
  handlers: boardHandlers,
  moveItem: boardMoveItem,
  toggleSelection: boardToggleSelection,
  clearSelection: boardClearSelection,
  registerAllowedLanes: boardRegisterAllowedLanes,
  unregisterAllowedLanes: boardUnregisterAllowedLanes,
  registerLaneDisabled: boardRegisterLaneDisabled,
  unregisterLaneDisabled: boardUnregisterLaneDisabled,
  isLaneAcceptingFor: boardIsLaneAcceptingFor,
} = useBoard<Candidate>({
  lanes: boardLanes,
  onChange: ({ itemId, itemIds, from, to }) => {
    if (from === to) return
    // Bulk-rewrite stageOverrides for every item in the drop.
    const next = { ...stageOverrides.value }
    for (const id of itemIds) next[id] = to as Stage
    stageOverrides.value = next
    const lead = CANDIDATES.find((x) => x.id === itemId)
    if (!lead) return
    if (itemIds.length === 1) {
      toast.success(`Moved ${lead.name}: ${STAGE_LABELS[from as Stage]} → ${STAGE_LABELS[to as Stage]}`)
    } else {
      toast.success(`Moved ${itemIds.length} candidates → ${STAGE_LABELS[to as Stage]}`)
    }
  },
})

const totalCandidates = computed(() => Object.values(STAGE_TOTALS).reduce((a, b) => a + b, 0))
const totalOpenReqs = computed(() => REQUISITIONS.filter((r) => r.status === 'open').length)
const onHoldReqs = computed(() => REQUISITIONS.filter((r) => r.status === 'on-hold').length)

const openCandidate = ref<Candidate | null>(null)

function selectCandidate(c: Candidate) {
  openCandidate.value = c
}
function advance(c: Candidate) {
  const next: Record<Stage, Stage | null> = { applied: 'screened', screened: 'interviewed', interviewed: 'offer', offer: 'hired', hired: null }
  const nextStage = next[c.stage]
  if (!nextStage) {
    toast.info(`${c.name} is already in the final stage.`)
    return
  }
  toast.success(`Moved ${c.name} → ${STAGE_LABELS[nextStage]} (mock)`)
}
function reject(c: Candidate) {
  toast.warning(`Rejected ${c.name} (mock)`)
}
function star(rating: number) {
  return Array.from({ length: 5 }, (_, i) => i < rating)
}
</script>

<template>
  <div class="space-y-3 p-3 md:p-4">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-bold tracking-tight">Recruiting</h1>
        <p class="text-muted-foreground text-xs">
          {{ totalCandidates }} candidates across {{ totalOpenReqs }} open requisitions, {{ onHoldReqs }} on hold.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <UserRoundPlus class="mr-2 size-4" />Add candidate
        </Button>
        <Button size="sm">
          <Plus class="mr-2 size-4" />Open requisition
        </Button>
      </div>
    </header>

    <KpiGrid>
      <HrKpiTile
        label="Open requisitions"
        :value="totalOpenReqs"
        :hint="`${onHoldReqs} on hold`"
        tone="info"
        :icon="BarChart3"
      />
      <HrKpiTile
        label="Active candidates"
        :value="totalCandidates - STAGE_TOTALS.hired"
        :hint="`${STAGE_TOTALS.hired} hired this quarter`"
        tone="success"
        :icon="Users"
      />
      <HrKpiTile
        label="Avg time-to-hire"
        :value="`${TIME_TO_HIRE_DAYS} days`"
        hint="7-day rolling avg"
        tone="warning"
        :icon="Clock"
      />
      <HrKpiTile
        label="Offer acceptance"
        :value="`${OFFER_ACCEPTANCE_RATE}%`"
        hint="Last 4 weeks"
        tone="success"
        :icon="ThumbsUp"
      />
    </KpiGrid>

    <!-- Requisition filter strip -->
    <Card>
      <CardContent class="flex flex-wrap items-center gap-2 p-3">
        <Filter class="text-muted-foreground size-4" />
        <button
          :class="['rounded-full border px-3 py-1 text-xs font-medium transition-colors', reqFilter === 'all' ? 'bg-foreground text-background border-foreground' : 'hover:bg-muted/50']"
          @click="reqFilter = 'all'"
        >
          All requisitions
          <span class="text-muted-foreground/70 ml-1 tabular-nums">{{ CANDIDATES.length }}</span>
        </button>
        <button
          v-for="req in REQUISITIONS.filter((r) => r.status === 'open')"
          :key="req.id"
          :class="['rounded-full border px-3 py-1 text-xs font-medium transition-colors', reqFilter === req.id ? 'bg-foreground text-background border-foreground' : 'hover:bg-muted/50']"
          @click="reqFilter = req.id"
        >
          {{ req.title }}
          <span class="text-muted-foreground/70 ml-1 tabular-nums">{{ CANDIDATES.filter((c) => c.requisitionId === req.id).length }}</span>
        </button>
      </CardContent>
    </Card>

    <!-- Kanban — driven by @uipkge/board + useBoard. Layout (grid + per
         column max-height) stays in the consumer; the primitive owns
         drop targeting, insertion index, transitions, keyboard a11y. -->
    <Board
      :dragging-id="boardState.draggingId"
      :dragging-ids="boardState.draggingIds"
      :drag-over-lane-id="boardState.dragOverLaneId"
      :just-moved-id="boardState.justMovedId"
      :selected-ids="boardState.selectedIds"
      :move-item="boardMoveItem"
      :toggle-selection="boardToggleSelection"
      :clear-selection="boardClearSelection"
      :register-allowed-lanes="boardRegisterAllowedLanes"
      :unregister-allowed-lanes="boardUnregisterAllowedLanes"
      :register-lane-disabled="boardRegisterLaneDisabled"
      :unregister-lane-disabled="boardUnregisterLaneDisabled"
      :is-lane-accepting-for="boardIsLaneAcceptingFor"
      class="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5"
    >
      <BoardLane
        v-for="stage in STAGES"
        :key="stage"
        :id="stage"
        class="max-h-[calc(100vh-280px)]"
        @dragover="(e: DragEvent) => boardHandlers.onLaneDragOver(e, stage)"
        @dragleave="boardHandlers.onLaneDragLeave(stage)"
        @drop="(e: DragEvent) => boardHandlers.onLaneDrop(e, stage)"
      >
        <BoardLaneHeader>
          <div class="flex items-center gap-2">
            <span :class="['size-2 rounded-full', STAGE_DOT_TONE[stage]]" />
            <span class="text-sm font-semibold capitalize">{{ STAGE_LABELS[stage] }}</span>
            <Badge variant="secondary" class="tabular-nums">
              {{ reqFilter === 'all' ? STAGE_TOTALS[stage] : byStage[stage].length }}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" class="size-9" aria-label="Add to column">
            <Plus class="size-3.5" />
          </Button>
        </BoardLaneHeader>

        <BoardLaneBody>
          <BoardCard
            v-for="c in byStage[stage]"
            :key="c.id"
            :id="c.id"
            @click="selectCandidate(c)"
            @dragstart="(e: DragEvent) => boardHandlers.onDragStart(e, c.id, stage)"
            @dragend="boardHandlers.onDragEnd"
          >
            <div class="mb-2 flex items-center gap-2 min-w-0">
              <Avatar class="size-8 shrink-0">
                <AvatarFallback class="text-xs font-semibold">{{ c.initials }}</AvatarFallback>
              </Avatar>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold leading-tight truncate">{{ c.name }}</p>
                <p class="text-muted-foreground truncate text-xs">
                  {{ findReq(c.requisitionId)?.title }}
                </p>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <span :class="['rounded-full px-1.5 py-0.5 text-xs font-semibold', SOURCE_TONE[c.source]]">
                {{ c.source }}
              </span>
              <span class="text-muted-foreground text-xs">
                · {{ daysSince(c.stageEnteredAt) }}d in stage
              </span>
              <span v-if="c.rating" class="ml-auto flex items-center gap-0.5">
                <Star
                  v-for="(filled, i) in star(c.rating)"
                  :key="i"
                  :class="['size-3', filled ? 'fill-warning text-warning' : 'fill-muted text-muted-foreground/30']"
                />
              </span>
            </div>
            <p v-if="c.nextStep" class="text-muted-foreground mt-2 line-clamp-1 border-t pt-2 text-xs">
              <Calendar class="mr-1 inline size-2.5" />{{ c.nextStep }}
            </p>
          </BoardCard>

          <!-- "+ N more" pill stays in the body slot — it sits inside the
               TransitionGroup which is fine because it has no v-for key
               and renders as a plain footer-style chip. -->
          <div
            v-if="reqFilter === 'all' && STAGE_TOTALS[stage] > byStage[stage].length"
            class="text-muted-foreground border-border/60 hover:border-foreground/30 hover:text-foreground cursor-default rounded-lg border border-dashed py-2 text-center text-xs transition-colors"
          >
            + {{ STAGE_TOTALS[stage] - byStage[stage].length }} more
          </div>
        </BoardLaneBody>

        <BoardLaneEmpty :when="byStage[stage].length === 0">
          No candidates in this stage for the current filter.
        </BoardLaneEmpty>
      </BoardLane>
    </Board>

    <!-- Detail sheet -->
    <Sheet :open="!!openCandidate" @update:open="(o: boolean) => !o && (openCandidate = null)">
      <SheetContent v-if="openCandidate" class="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div class="flex items-start gap-3">
            <Avatar class="size-12">
              <AvatarFallback class="text-sm font-bold">{{ openCandidate.initials }}</AvatarFallback>
            </Avatar>
            <div class="min-w-0 flex-1">
              <SheetTitle>{{ openCandidate.name }}</SheetTitle>
              <SheetDescription class="truncate">{{ openCandidate.email }}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div class="space-y-5 px-4 py-6">
          <div class="flex flex-wrap items-center gap-2">
            <Badge :class="STAGE_TONE[openCandidate.stage]">
              {{ STAGE_LABELS[openCandidate.stage] }}
            </Badge>
            <Badge :class="SOURCE_TONE[openCandidate.source]">
              {{ openCandidate.source }}
            </Badge>
            <span v-if="openCandidate.rating" class="flex items-center gap-0.5 ml-auto">
              <Star
                v-for="(filled, i) in star(openCandidate.rating)"
                :key="i"
                :class="['size-3.5', filled ? 'fill-warning text-warning' : 'fill-muted text-muted-foreground/30']"
              />
            </span>
          </div>

          <div class="space-y-1">
            <p class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Applied for</p>
            <p class="text-sm font-medium">{{ findReq(openCandidate.requisitionId)?.title }}</p>
            <p class="text-muted-foreground text-xs">
              {{ findReq(openCandidate.requisitionId)?.department }} · {{ findReq(openCandidate.requisitionId)?.level }} · {{ findReq(openCandidate.requisitionId)?.location }}
            </p>
          </div>

          <Separator />

          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-muted-foreground text-xs uppercase tracking-wide">Applied</p>
              <p class="font-medium">{{ openCandidate.appliedAt }}</p>
              <p class="text-muted-foreground text-xs">{{ daysSince(openCandidate.appliedAt) }} days ago</p>
            </div>
            <div>
              <p class="text-muted-foreground text-xs uppercase tracking-wide">In stage</p>
              <p class="font-medium">{{ daysSince(openCandidate.stageEnteredAt) }} days</p>
              <p class="text-muted-foreground text-xs">Since {{ openCandidate.stageEnteredAt }}</p>
            </div>
          </div>

          <Separator />

          <div class="space-y-2">
            <p class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Hiring team</p>
            <NuxtLink
              v-if="findHiringManager(findReq(openCandidate.requisitionId)!)"
              :to="`/people/${findHiringManager(findReq(openCandidate.requisitionId)!)!.id}`"
              class="hover:bg-muted/50 -mx-2 flex items-center gap-3 rounded-lg p-2 transition-colors"
            >
              <Avatar class="size-7">
                <AvatarFallback class="text-xs font-semibold">{{ findHiringManager(findReq(openCandidate.requisitionId)!)!.initials }}</AvatarFallback>
              </Avatar>
              <div>
                <p class="text-sm font-medium">{{ findHiringManager(findReq(openCandidate.requisitionId)!)!.name }}</p>
                <p class="text-muted-foreground text-xs">Hiring manager</p>
              </div>
            </NuxtLink>
            <NuxtLink
              v-if="findRecruiter(findReq(openCandidate.requisitionId)!)"
              :to="`/people/${findRecruiter(findReq(openCandidate.requisitionId)!)!.id}`"
              class="hover:bg-muted/50 -mx-2 flex items-center gap-3 rounded-lg p-2 transition-colors"
            >
              <Avatar class="size-7">
                <AvatarFallback class="text-xs font-semibold">{{ findRecruiter(findReq(openCandidate.requisitionId)!)!.initials }}</AvatarFallback>
              </Avatar>
              <div>
                <p class="text-sm font-medium">{{ findRecruiter(findReq(openCandidate.requisitionId)!)!.name }}</p>
                <p class="text-muted-foreground text-xs">Recruiter</p>
              </div>
            </NuxtLink>
          </div>

          <Separator />

          <div v-if="openCandidate.notes" class="space-y-2">
            <p class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Notes</p>
            <p class="text-sm">{{ openCandidate.notes }}</p>
          </div>

          <div v-if="openCandidate.nextStep" class="space-y-2">
            <p class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Next step</p>
            <p class="text-sm">{{ openCandidate.nextStep }}</p>
          </div>
        </div>

        <SheetFooter class="flex flex-row items-center justify-end gap-2 px-4 pb-6">
          <Button variant="outline" size="sm" @click="toast.info('Message ' + openCandidate.name + ' (mock)')">
            <MessageSquare class="mr-2 size-3.5" />Message
          </Button>
          <Button variant="outline" size="sm" class="text-destructive hover:text-destructive" @click="reject(openCandidate); openCandidate = null">
            <X class="mr-2 size-3.5" />Reject
          </Button>
          <Button size="sm" :disabled="openCandidate.stage === 'hired'" @click="advance(openCandidate); openCandidate = null">
            Advance<ChevronRight class="ml-2 size-3.5" />
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  </div>
</template>

