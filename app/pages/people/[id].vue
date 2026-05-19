<script setup lang="ts">
/**
 * Employee profile page.
 *
 * Layout (top -> bottom):
 *   - Hero strip: avatar + name + key facts (title / dept / location /
 *     start / status) + Edit / Message / More actions.
 *   - 4 KPI tiles: tenure, PTO balance, review status, direct reports.
 *   - Tabs: Overview / Time-off / Compensation (admin only) /
 *     Documents / Activity. Each tab renders its own card.
 *
 * If the id is unknown we navigate the user back to /people rather
 * than throw a hard 404 -- the dataset is mock so a stale URL is the
 * most common failure mode.
 *
 * Compensation tab is persona-gated. The whole tab disappears for
 * non-admins; we don't fall back to a "you can't see this" panel
 * because the surface should look identical to a real admin's profile
 * page minus that one tile.
 */
import { computed } from 'vue'
import { ArrowLeft, Mail, Phone, MapPin, Clock, Cake, CalendarDays, MessageSquare, MoreHorizontal, Briefcase, Target, FileText, Receipt, GraduationCap, FileSignature, Activity, Plus, Download, Pencil, ChevronRight } from 'lucide-vue-next'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { KpiGrid } from '@/components/ui/kpi-grid'
import HrKpiTile from '@/components/HrKpiTile.vue'
import { Timeline, TimelineItem, TimelineMedia, TimelineContent, TimelineTitle, TimelineDate } from '@/components/ui/timeline'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'vue-sonner'

import { findEmployee, STATUS_LABELS, STATUS_TONE, TYPE_LABELS, formatSalary, EMPLOYEES } from '~/mocks/people'
import { getEmployeeDetail, REVIEW_STATUS_LABELS, DOC_CATEGORY_LABELS } from '~/mocks/employee-detail'

const route = useRoute()
const id = computed(() => String(route.params.id))
const { isAdmin } = usePersona()

const employee = computed(() => findEmployee(id.value))
const detail = computed(() => (employee.value ? getEmployeeDetail(id.value) : undefined))

useHead(() => ({
  title: employee.value ? `${employee.value.name} · uipkge HRMS` : `Employee ${id.value} · uipkge HRMS`,
}))

const manager = computed(() => (detail.value?.reportsToId ? findEmployee(detail.value.reportsToId) : undefined))

const reports = computed(() =>
  (detail.value?.directReports ?? [])
    .map((rid) => findEmployee(rid))
    .filter((e): e is NonNullable<typeof e> => !!e),
)

// Tenure formatted as "Xy Ym" or "Xm" when under a year. Mirrors the
// language used in the directory's tenureMonths column.
const tenureLabel = computed(() => {
  if (!employee.value) return '—'
  const m = employee.value.tenureMonths
  const y = Math.floor(m / 12)
  const r = m % 12
  if (y === 0) return `${m} mo`
  if (r === 0) return `${y}y`
  return `${y}y ${r}m`
})

// Single number for the PTO tile: total used vs total accrued across
// vacation+sick+personal. Showing the breakdown lives inside the
// Time-off tab.
const ptoSummary = computed(() => {
  if (!detail.value) return { used: 0, total: 0 }
  const used = detail.value.pto.vacation.used + detail.value.pto.sick.used + detail.value.pto.personal.used
  const total = detail.value.pto.vacation.total + detail.value.pto.sick.total + detail.value.pto.personal.total
  return { used, total }
})

function copyEmail() {
  if (!employee.value || !import.meta.client) return
  navigator.clipboard?.writeText(employee.value.email).then(() => toast.success('Email copied'))
}
</script>

<template>
  <div v-if="!employee" class="p-6">
    <Card>
      <CardContent class="space-y-3 p-8 text-center">
        <p class="text-foreground text-lg font-semibold">Employee not found</p>
        <p class="text-muted-foreground text-sm">No employee with id {{ id }} in this mock dataset.</p>
        <Button variant="outline" as-child class="mt-2">
          <NuxtLink to="/people">
            <ArrowLeft class="mr-2 size-4" />Back to directory
          </NuxtLink>
        </Button>
      </CardContent>
    </Card>
  </div>

  <div v-else class="space-y-3 p-3 md:p-4">
    <!-- Back affordance -->
    <Button variant="ghost" size="sm" class="-ml-2 text-muted-foreground" as-child>
      <NuxtLink to="/people">
        <ArrowLeft class="mr-2 size-4" />Back to directory
      </NuxtLink>
    </Button>

    <!-- Hero -->
    <Card>
      <CardContent class="p-6">
        <div class="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div class="flex items-start gap-5">
            <Avatar class="size-20 ring-background ring-2">
              <AvatarFallback class="text-xl font-bold">{{ employee.initials }}</AvatarFallback>
            </Avatar>
            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-2xl font-bold tracking-tight">{{ employee.name }}</h1>
                <span
                  v-if="detail?.pronouns"
                  class="text-muted-foreground text-xs font-medium"
                >
                  ({{ detail.pronouns }})
                </span>
                <Badge
                  :variant="STATUS_TONE[employee.status] === 'success' ? 'success' : STATUS_TONE[employee.status] === 'warning' ? 'warning' : 'secondary'"
                >
                  <span
                    :class="[
                      'size-1.5 rounded-full',
                      STATUS_TONE[employee.status] === 'success' ? 'bg-success' : STATUS_TONE[employee.status] === 'warning' ? 'bg-warning' : 'bg-muted-foreground/50',
                    ]"
                    aria-hidden="true"
                  />
                  {{ STATUS_LABELS[employee.status] }}
                </Badge>
              </div>
              <p class="text-muted-foreground text-xs">{{ employee.title }} · {{ employee.department }}</p>
              <div class="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span class="inline-flex items-center gap-1.5">
                  <Mail class="size-3" />
                  <button class="hover:text-foreground transition-colors" @click="copyEmail">{{ employee.email }}</button>
                </span>
                <span v-if="detail?.phone" class="inline-flex items-center gap-1.5">
                  <Phone class="size-3" />{{ detail.phone }}
                </span>
                <span class="inline-flex items-center gap-1.5">
                  <MapPin class="size-3" />{{ employee.location }}
                </span>
                <span v-if="detail?.timezone" class="inline-flex items-center gap-1.5">
                  <Clock class="size-3" />{{ detail.timezone }}
                </span>
                <span class="inline-flex items-center gap-1.5">
                  <CalendarDays class="size-3" />Started {{ employee.startDate }}
                </span>
                <span v-if="detail?.birthday" class="inline-flex items-center gap-1.5">
                  <Cake class="size-3" />Birthday {{ detail.birthday }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <Button v-if="isAdmin" size="sm">
              <Pencil class="mr-2 size-3.5" />Edit profile
            </Button>
            <Button variant="outline" size="sm" @click="toast.info('Open chat (mock)')">
              <MessageSquare class="mr-2 size-3.5" />Message
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="outline" size="icon" class="size-9">
                  <MoreHorizontal class="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-44">
                <DropdownMenuItem @click="toast.info('Download payslip (mock)')">Download payslip</DropdownMenuItem>
                <DropdownMenuItem @click="toast.info('Send onboarding email (mock)')">Resend welcome email</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem v-if="isAdmin" class="text-destructive" @click="toast.warning('Deactivate flow (mock)')">
                  Deactivate
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- KPI tiles -->
    <KpiGrid>
      <HrKpiTile
        label="Tenure"
        :value="tenureLabel"
        :hint="detail?.workAnniversary ? `Anniversary ${detail.workAnniversary}` : undefined"
        tone="info"
        :icon="Briefcase"
      />
      <HrKpiTile
        label="PTO balance"
        :value="`${ptoSummary.total - ptoSummary.used} / ${ptoSummary.total} days`"
        :hint="`${ptoSummary.used} used this cycle`"
        tone="success"
        :icon="CalendarDays"
      />
      <HrKpiTile
        label="Review cycle"
        :value="detail?.reviewCycle.period ?? '—'"
        :hint="detail ? REVIEW_STATUS_LABELS[detail.reviewCycle.status] : undefined"
        tone="warning"
        :icon="Target"
      />
      <HrKpiTile
        label="Direct reports"
        :value="reports.length"
        :hint="reports.length === 0 ? 'Individual contributor' : `Led by ${employee.name.split(' ')[0]}`"
        tone="info"
        :icon="Briefcase"
      />
    </KpiGrid>

    <!-- Tabs -->
    <Tabs default-value="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="time-off">Time off</TabsTrigger>
        <ClientOnly>
          <TabsTrigger v-if="isAdmin" value="comp">Compensation</TabsTrigger>
        </ClientOnly>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>

      <!-- Overview -->
      <TabsContent value="overview" class="space-y-6">
        <div class="grid gap-6 lg:grid-cols-3">
          <Card class="lg:col-span-2">
            <CardHeader class="p-4 pb-2">
              <CardTitle class="text-sm">About</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3 p-4 pt-0">
              <p class="text-sm leading-relaxed">{{ detail?.bio }}</p>
              <Separator />
              <div>
                <p class="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">Skills</p>
                <div class="flex flex-wrap gap-1.5">
                  <Badge v-for="s in detail?.skills" :key="s" variant="outline" class="text-xs font-normal">
                    {{ s }}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div>
                <p class="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">Goals · {{ detail?.reviewCycle.period }}</p>
                <ul class="space-y-3">
                  <li v-for="g in detail?.goals" :key="g.label">
                    <div class="mb-1 flex items-center justify-between text-sm">
                      <span class="font-medium">{{ g.label }}</span>
                      <span class="text-muted-foreground tabular-nums text-xs">{{ g.progress }}% · due {{ g.due }}</span>
                    </div>
                    <Progress :model-value="g.progress" class="h-1.5" />
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="p-4 pb-2">
              <CardTitle class="text-sm">Reporting line</CardTitle>
              <CardDescription>Manager + direct reports.</CardDescription>
            </CardHeader>
            <CardContent class="space-y-3 p-4 pt-0">
              <div>
                <p class="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">Reports to</p>
                <NuxtLink
                  v-if="manager"
                  :to="`/people/${manager.id}`"
                  class="hover:border-border hover:bg-muted/50 group flex items-center gap-3 rounded-lg border border-transparent p-2 transition-colors"
                >
                  <Avatar class="size-9">
                    <AvatarFallback class="text-xs font-semibold">{{ manager.initials }}</AvatarFallback>
                  </Avatar>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold">{{ manager.name }}</p>
                    <p class="text-muted-foreground truncate text-xs">{{ manager.title }}</p>
                  </div>
                  <ChevronRight class="text-muted-foreground size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </NuxtLink>
                <p v-else class="text-muted-foreground text-sm">Reports directly to the CEO.</p>
              </div>
              <Separator />
              <div>
                <p class="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
                  Direct reports · {{ reports.length }}
                </p>
                <ul v-if="reports.length" class="space-y-1">
                  <li v-for="r in reports" :key="r.id">
                    <NuxtLink
                      :to="`/people/${r.id}`"
                      class="hover:border-border hover:bg-muted/50 group flex items-center gap-3 rounded-lg border border-transparent p-2 transition-colors"
                    >
                      <Avatar class="size-7">
                        <AvatarFallback class="text-xs font-semibold">{{ r.initials }}</AvatarFallback>
                      </Avatar>
                      <div class="min-w-0 flex-1">
                        <p class="text-sm font-medium">{{ r.name }}</p>
                        <p class="text-muted-foreground truncate text-xs">{{ r.title }}</p>
                      </div>
                      <ChevronRight class="text-muted-foreground size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                    </NuxtLink>
                  </li>
                </ul>
                <p v-else class="text-muted-foreground text-sm">Individual contributor — no reports.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <!-- Time off -->
      <TabsContent value="time-off" class="space-y-6">
        <KpiGrid :columns="3">
          <Card v-for="kind in (['vacation', 'sick', 'personal'] as const)" :key="kind">
            <CardContent class="space-y-3 p-5">
              <p class="text-muted-foreground text-xs uppercase tracking-wide">{{ kind }}</p>
              <div class="flex items-baseline justify-between gap-2">
                <p class="text-2xl font-bold tabular-nums">
                  {{ (detail?.pto[kind].total ?? 0) - (detail?.pto[kind].used ?? 0) }}
                  <span class="text-muted-foreground text-base font-normal">days left</span>
                </p>
                <span class="text-muted-foreground tabular-nums text-xs">
                  {{ detail?.pto[kind].used ?? 0 }} / {{ detail?.pto[kind].total ?? 0 }}
                </span>
              </div>
              <Progress
                :model-value="((detail?.pto[kind].used ?? 0) / Math.max(1, detail?.pto[kind].total ?? 1)) * 100"
                class="h-1.5"
              />
            </CardContent>
          </Card>
        </KpiGrid>

        <Card>
          <CardHeader class="p-4 pb-2">
            <div class="flex items-center justify-between gap-3">
              <div>
                <CardTitle class="text-sm">PTO ledger</CardTitle>
                <CardDescription>Approved, pending, and cancelled time-off entries.</CardDescription>
              </div>
              <Button size="sm">
                <Plus class="mr-2 size-3.5" />Request time off
              </Button>
            </div>
          </CardHeader>
          <CardContent class="p-4 pt-0">
            <div v-if="!detail?.ptoLedger.length" class="text-muted-foreground py-8 text-center text-sm">
              No time-off entries on record.
            </div>
            <ul v-else class="space-y-2">
              <li
                v-for="entry in detail.ptoLedger"
                :key="entry.id"
                class="flex flex-wrap items-center justify-between gap-3 rounded-md border p-2"
              >
                <div class="flex items-center gap-3">
                  <Badge variant="outline" class="capitalize text-xs">{{ entry.type }}</Badge>
                  <div>
                    <p class="text-sm font-medium">{{ entry.from }} → {{ entry.to }}</p>
                    <p class="text-muted-foreground text-xs">
                      {{ entry.days }} working day{{ entry.days === 1 ? '' : 's' }}
                      <template v-if="entry.approver"> · Approved by {{ entry.approver }}</template>
                    </p>
                  </div>
                </div>
                <Badge
                  :variant="entry.status === 'approved' ? 'success' : entry.status === 'pending' ? 'warning' : 'secondary'"
                  class="capitalize"
                >
                  {{ entry.status }}
                </Badge>
              </li>
            </ul>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Compensation (admin only). ClientOnly: SSR's sentinel persona
           is 'admin' so the unguarded template would ship salary/equity
           HTML to every visitor. Render after hydration when persona is
           authoritative. -->
      <TabsContent v-if="isAdmin" value="comp" class="space-y-6">
        <ClientOnly>
        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Compensation</CardTitle>
            <CardDescription>Admin-only view. Includes base salary, equity, and benefits.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4 p-4 pt-0">
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p class="text-muted-foreground text-xs uppercase tracking-wide">Base salary</p>
                <p class="text-xl font-bold tabular-nums">{{ formatSalary(employee.salary) }}</p>
                <p class="text-muted-foreground text-xs">USD · annual</p>
              </div>
              <div>
                <p class="text-muted-foreground text-xs uppercase tracking-wide">Bonus target</p>
                <p class="text-xl font-bold tabular-nums">15%</p>
                <p class="text-muted-foreground text-xs">Of base</p>
              </div>
              <div>
                <p class="text-muted-foreground text-xs uppercase tracking-wide">Equity</p>
                <p class="text-xl font-bold tabular-nums">2,400 RSU</p>
                <p class="text-muted-foreground text-xs">4-yr vest · 1-yr cliff</p>
              </div>
              <div>
                <p class="text-muted-foreground text-xs uppercase tracking-wide">Employment type</p>
                <p class="text-xl font-bold capitalize">{{ TYPE_LABELS[employee.employmentType] }}</p>
                <p class="text-muted-foreground text-xs">Since {{ employee.startDate }}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p class="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">Recent payslips</p>
              <ul class="space-y-2">
                <li
                  v-for="(month, i) in (['Apr 2026', 'Mar 2026', 'Feb 2026'])"
                  :key="month"
                  class="flex items-center justify-between gap-3 rounded-md border p-2"
                >
                  <div class="flex items-center gap-3">
                    <div class="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-md">
                      <Receipt class="size-4" />
                    </div>
                    <div>
                      <p class="text-sm font-medium">Payslip · {{ month }}</p>
                      <p class="text-muted-foreground text-xs">Cycle {{ String(i + 2).padStart(2, '0') }} · Net deposited</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" @click="toast.info(`Download ${month} payslip (mock)`)">
                    <Download class="mr-2 size-3.5" />PDF
                  </Button>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
        </ClientOnly>
      </TabsContent>

      <!-- Documents -->
      <TabsContent value="documents" class="space-y-6">
        <Card>
          <CardHeader class="p-4 pb-2">
            <div class="flex items-center justify-between gap-3">
              <div>
                <CardTitle class="text-sm">Documents</CardTitle>
                <CardDescription>Contracts, tax, policies, benefits, and reviews.</CardDescription>
              </div>
              <Button size="sm">
                <Plus class="mr-2 size-3.5" />Upload document
              </Button>
            </div>
          </CardHeader>
          <CardContent class="p-4 pt-0">
            <EmptyState
              v-if="!detail?.documents?.length"
              :icon="FileText"
              title="No documents"
              description="Signed agreements, tax forms, and policy attachments will appear here."
              class="py-6"
            />
            <ul v-else class="space-y-2">
              <li
                v-for="doc in detail?.documents"
                :key="doc.id"
                class="flex flex-wrap items-center justify-between gap-3 rounded-md border p-2"
              >
                <div class="flex items-center gap-3">
                  <div class="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-md">
                    <component
                      :is="doc.category === 'tax' ? Receipt : doc.category === 'policy' ? FileSignature : doc.category === 'review' ? GraduationCap : FileText"
                      class="size-4"
                    />
                  </div>
                  <div>
                    <p class="text-sm font-medium">{{ doc.name }}</p>
                    <p class="text-muted-foreground text-xs">
                      {{ DOC_CATEGORY_LABELS[doc.category] }} ·
                      {{ doc.signedAt ? `Signed ${doc.signedAt}` : 'Unsigned' }} ·
                      {{ doc.sizeKb ? `${doc.sizeKb} KB` : '—' }}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" @click="toast.info(`Download ${doc.name} (mock)`)">
                  <Download class="mr-2 size-3.5" />Download
                </Button>
              </li>
            </ul>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Activity -->
      <TabsContent value="activity" class="space-y-6">
        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Activity</CardTitle>
            <CardDescription>Profile changes, time-off, reviews, kudos.</CardDescription>
          </CardHeader>
          <CardContent class="p-4 pt-0">
            <EmptyState
              v-if="!detail?.activity?.length"
              :icon="Activity"
              title="No activity yet"
              description="Profile changes, time-off, reviews, and kudos will land here."
              class="py-6"
            />
            <Timeline v-else>
              <TimelineItem
                v-for="entry in detail?.activity"
                :key="entry.id"
                :status="entry.type === 'kudos' ? 'success' : entry.type === 'pto' ? 'info' : entry.type === 'review' ? 'warning' : 'muted'"
              >
                <TimelineMedia variant="icon">
                  <component
                    :is="entry.type === 'pto' ? CalendarDays : entry.type === 'review' ? Target : entry.type === 'doc' ? FileText : entry.type === 'kudos' ? Activity : Briefcase"
                  />
                </TimelineMedia>
                <TimelineContent>
                  <TimelineTitle class="text-sm">{{ entry.text }}</TimelineTitle>
                  <TimelineDate class="text-muted-foreground/70 text-xs">
                    {{ entry.day }} · {{ entry.time }}{{ entry.meta ? ` · ${entry.meta}` : '' }}
                  </TimelineDate>
                </TimelineContent>
              </TimelineItem>
            </Timeline>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>
