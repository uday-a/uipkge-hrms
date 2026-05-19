<script setup lang="ts">
/**
 * Add Employee — 4-step admin-only wizard.
 *
 * Layout:
 *   - Numbered horizontal stepper across the top.
 *   - Single Card hosts the active step's content; Back/Continue (or
 *     Submit on step 4) live in the card footer.
 *
 * Steps:
 *   1. Personal (name, email, phone, pronouns, birthday)
 *   2. Role     (title, department, level, employment type, manager)
 *   3. Comp & start (salary, bonus %, equity, start date, location)
 *   4. Review   (read-only summary + welcome-email / onboarding-tasks
 *                checkboxes + Submit)
 *
 * The wizard does NOT persist anywhere — submit toasts and bounces to
 * /people. We intentionally skip vee-validate here because the demo's
 * intent is to *show the flow*, not gate progression on validation.
 *
 * Manager pool: filter EMPLOYEES to anyone whose title contains
 * "Manager", "VP", "Head", "C*O", or any level above IC4 — that's the
 * realistic reports-to set in a real HRMS.
 */
import { computed, ref } from 'vue'
import { Check, ChevronLeft, ChevronRight, User, Briefcase, DollarSign, ClipboardCheck, UserPlus } from 'lucide-vue-next'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'vue-sonner'

import {
  DEPARTMENTS,
  LOCATIONS,
  EMPLOYMENT_TYPES,
  EMPLOYEES,
  TYPE_LABELS,
  formatSalary,
} from '~/mocks/people'

useHead({ title: 'Add employee · uipkge HRMS' })
definePageMeta({ middleware: 'require-admin' })

// ── Step metadata ──────────────────────────────────────────────────────────
// Kept inline (not a mocks file — this is page-local copy) so the wizard
// reads top-to-bottom and the labels can be tweaked without a round-trip.
const STEPS = [
  { id: 1, label: 'Personal', description: 'Who is being added?', icon: User },
  { id: 2, label: 'Role', description: 'What will they do?', icon: Briefcase },
  { id: 3, label: 'Comp & start', description: 'Pay and start date.', icon: DollarSign },
  { id: 4, label: 'Review', description: 'Confirm and create the record.', icon: ClipboardCheck },
] as const

const LEVELS = ['L3', 'L4', 'L5', 'M4', 'M5', 'VP+'] as const

// "Manager-shaped" titles -- anyone who could plausibly be a reports-to
// for a new hire. Drives the manager Select on step 2.
const MANAGER_KEYWORDS = ['Manager', 'Head', 'VP', 'COO', 'CFO', 'CEO', 'Lead']
const managers = computed(() =>
  EMPLOYEES
    .filter((e) => e.status === 'active' && MANAGER_KEYWORDS.some((k) => e.title.includes(k)))
    .sort((a, b) => a.name.localeCompare(b.name)),
)

// ── Wizard state ───────────────────────────────────────────────────────────
const step = ref(1)

const form = ref({
  // 1 — personal
  name: '',
  email: '',
  phone: '',
  pronouns: '',
  birthday: '',
  // 2 — role
  title: '',
  department: '' as (typeof DEPARTMENTS)[number] | '',
  level: '' as (typeof LEVELS)[number] | '',
  employmentType: 'full-time' as (typeof EMPLOYMENT_TYPES)[number],
  managerId: '',
  // 3 — comp & start
  salary: '' as string | number,
  bonusPct: '' as string | number,
  equity: '' as string | number,
  startDate: '',
  location: '' as (typeof LOCATIONS)[number] | '',
  // 4 — review options
  sendWelcomeEmail: true,
  createOnboardingTasks: true,
})

const managerName = computed(() => EMPLOYEES.find((e) => e.id === form.value.managerId)?.name ?? '—')

function next() {
  if (step.value < STEPS.length) step.value += 1
}
function back() {
  if (step.value > 1) step.value -= 1
}

function submit() {
  // Mock submission: the registry-driven HRMS demo never persists. The
  // toast + redirect is the contract every other "mutating" page follows.
  const name = form.value.name.trim() || 'Employee'
  toast.success(`${name} added (mock)`)
  navigateTo('/people')
}
</script>

<template>
  <div class="p-3 md:p-4">
    <div class="mx-auto w-full max-w-3xl space-y-3">
      <!-- Page header -->
      <header class="space-y-1">
        <div class="flex items-center gap-2">
          <UserPlus class="text-muted-foreground size-5" />
          <h1 class="text-xl font-bold tracking-tight">Add employee</h1>
        </div>
        <p class="text-muted-foreground text-xs">
          Four short steps. Nothing is saved until you submit on the final review.
        </p>
      </header>

      <!-- Stepper -->
      <ol class="flex items-start gap-2 sm:gap-3">
        <li
          v-for="(s, i) in STEPS"
          :key="s.id"
          class="flex flex-1 items-start gap-2 sm:gap-3"
        >
          <div class="flex flex-col items-center gap-1.5">
            <div
              :class="[
                'flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors',
                step > s.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : step === s.id
                    ? 'border-primary text-primary ring-primary/15 bg-background ring-4'
                    : 'border-muted-foreground/30 bg-background text-muted-foreground',
              ]"
            >
              <Check v-if="step > s.id" class="size-4" />
              <span v-else>{{ s.id }}</span>
            </div>
            <span
              :class="[
                'hidden text-xs font-medium uppercase tracking-wide sm:block',
                step >= s.id ? 'text-foreground' : 'text-muted-foreground',
              ]"
            >{{ s.label }}</span>
          </div>
          <!-- Connector between step bullets, except after the last one -->
          <div
            v-if="i < STEPS.length - 1"
            :class="[
              'mt-4 h-0.5 flex-1 rounded-full transition-colors',
              step > s.id ? 'bg-primary' : 'bg-muted',
            ]"
          />
        </li>
      </ol>

      <!-- Active step card -->
      <Card>
        <CardHeader class="p-4 pb-2">
          <CardTitle class="flex items-center gap-2 text-sm">
            <component :is="STEPS[step - 1]!.icon" class="text-muted-foreground size-4" />
            {{ STEPS[step - 1]!.label }}
          </CardTitle>
          <CardDescription>{{ STEPS[step - 1]!.description }}</CardDescription>
        </CardHeader>

        <CardContent class="space-y-3 p-4 pt-0">
          <!-- Step 1 · Personal -->
          <div v-if="step === 1" class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-2 sm:col-span-2">
              <Label for="name">Full name</Label>
              <Input id="name" v-model="form.name" name="name" autocomplete="name" placeholder="Paige Nelson" />
            </div>
            <div class="space-y-2">
              <Label for="email">Work email</Label>
              <Input id="email" v-model="form.email" name="email" type="email" autocomplete="email" placeholder="priya@uipkge-hrms.dev" />
            </div>
            <div class="space-y-2">
              <Label for="phone">Phone</Label>
              <Input id="phone" v-model="form.phone" name="phone" type="tel" autocomplete="tel" placeholder="+91 98765 43210" />
            </div>
            <div class="space-y-2">
              <Label for="pronouns">Pronouns</Label>
              <Input id="pronouns" v-model="form.pronouns" placeholder="she/her" />
            </div>
            <div class="space-y-2">
              <Label for="birthday">Birthday</Label>
              <Input id="birthday" v-model="form.birthday" name="birthday" type="date" autocomplete="bday" />
            </div>
          </div>

          <!-- Step 2 · Role -->
          <div v-else-if="step === 2" class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-2 sm:col-span-2">
              <Label for="title">Title</Label>
              <Input id="title" v-model="form.title" name="title" autocomplete="organization-title" placeholder="Senior Backend Engineer" />
            </div>
            <div class="space-y-2">
              <Label for="department">Department</Label>
              <Select v-model="form.department">
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="d in DEPARTMENTS" :key="d" :value="d">{{ d }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label for="level">Level</Label>
              <Select v-model="form.level">
                <SelectTrigger id="level">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="lvl in LEVELS" :key="lvl" :value="lvl">{{ lvl }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2 sm:col-span-2">
              <Label>Employment type</Label>
              <RadioGroup v-model="form.employmentType" class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <label
                  v-for="t in EMPLOYMENT_TYPES"
                  :key="t"
                  :class="[
                    'flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm transition-colors',
                    form.employmentType === t ? 'border-primary bg-primary/5' : 'hover:bg-muted/40',
                  ]"
                >
                  <RadioGroupItem :value="t" />
                  <span class="font-medium">{{ TYPE_LABELS[t] }}</span>
                </label>
              </RadioGroup>
            </div>
            <div class="space-y-2 sm:col-span-2">
              <Label for="manager">Reports to</Label>
              <Select v-model="form.managerId">
                <SelectTrigger id="manager">
                  <SelectValue placeholder="Pick a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="m in managers" :key="m.id" :value="m.id">
                    {{ m.name }} — {{ m.title }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Step 3 · Comp & start -->
          <div v-else-if="step === 3" class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="salary">Annual salary (USD)</Label>
              <Input id="salary" v-model="form.salary" type="number" placeholder="140000" />
            </div>
            <div class="space-y-2">
              <Label for="bonus">Bonus target (%)</Label>
              <Input id="bonus" v-model="form.bonusPct" type="number" placeholder="15" />
            </div>
            <div class="space-y-2">
              <Label for="equity">Equity (RSU count)</Label>
              <Input id="equity" v-model="form.equity" type="number" placeholder="2500" />
            </div>
            <div class="space-y-2">
              <Label for="start">Start date</Label>
              <Input id="start" v-model="form.startDate" type="date" />
            </div>
            <div class="space-y-2 sm:col-span-2">
              <Label for="location">Location</Label>
              <Select v-model="form.location">
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="l in LOCATIONS" :key="l" :value="l">{{ l }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Step 4 · Review -->
          <div v-else class="space-y-3">
            <div class="space-y-3 rounded-lg border p-4">
              <div class="flex items-center justify-between gap-2">
                <p class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Personal</p>
                <Button variant="ghost" size="sm" class="-mr-2" @click="step = 1">Edit</Button>
              </div>
              <dl class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <dt class="text-muted-foreground">Name</dt><dd>{{ form.name || '—' }}</dd>
                <dt class="text-muted-foreground">Email</dt><dd class="truncate">{{ form.email || '—' }}</dd>
                <dt class="text-muted-foreground">Phone</dt><dd>{{ form.phone || '—' }}</dd>
                <dt class="text-muted-foreground">Pronouns</dt><dd>{{ form.pronouns || '—' }}</dd>
                <dt class="text-muted-foreground">Birthday</dt><dd class="tabular-nums">{{ form.birthday || '—' }}</dd>
              </dl>
            </div>

            <div class="space-y-3 rounded-lg border p-4">
              <div class="flex items-center justify-between gap-2">
                <p class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Role</p>
                <Button variant="ghost" size="sm" class="-mr-2" @click="step = 2">Edit</Button>
              </div>
              <dl class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <dt class="text-muted-foreground">Title</dt><dd>{{ form.title || '—' }}</dd>
                <dt class="text-muted-foreground">Department</dt><dd>{{ form.department || '—' }}</dd>
                <dt class="text-muted-foreground">Level</dt><dd>{{ form.level || '—' }}</dd>
                <dt class="text-muted-foreground">Employment type</dt><dd>{{ TYPE_LABELS[form.employmentType] }}</dd>
                <dt class="text-muted-foreground">Reports to</dt><dd>{{ managerName }}</dd>
              </dl>
            </div>

            <div class="space-y-3 rounded-lg border p-4">
              <div class="flex items-center justify-between gap-2">
                <p class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Comp &amp; start</p>
                <Button variant="ghost" size="sm" class="-mr-2" @click="step = 3">Edit</Button>
              </div>
              <dl class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <dt class="text-muted-foreground">Salary</dt>
                <dd class="tabular-nums">{{ form.salary ? formatSalary(Number(form.salary)) : '—' }}</dd>
                <dt class="text-muted-foreground">Bonus target</dt>
                <dd class="tabular-nums">{{ form.bonusPct !== '' ? `${form.bonusPct}%` : '—' }}</dd>
                <dt class="text-muted-foreground">Equity (RSU)</dt>
                <dd class="tabular-nums">{{ form.equity !== '' ? form.equity : '—' }}</dd>
                <dt class="text-muted-foreground">Start date</dt>
                <dd class="tabular-nums">{{ form.startDate || '—' }}</dd>
                <dt class="text-muted-foreground">Location</dt>
                <dd>{{ form.location || '—' }}</dd>
              </dl>
            </div>

            <Separator />

            <div class="space-y-3">
              <label class="hover:bg-muted/30 flex cursor-pointer items-start gap-3 rounded-md border p-2 transition-colors">
                <Checkbox v-model="form.sendWelcomeEmail" class="mt-0.5" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium">Send welcome email</p>
                  <p class="text-muted-foreground text-xs">
                    Includes a magic-link sign-in and the onboarding tour URL.
                  </p>
                </div>
              </label>
              <label class="hover:bg-muted/30 flex cursor-pointer items-start gap-3 rounded-md border p-2 transition-colors">
                <Checkbox v-model="form.createOnboardingTasks" class="mt-0.5" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium">Create onboarding tasks</p>
                  <p class="text-muted-foreground text-xs">
                    Pre-fills the standard 12-item checklist (laptop, IT access, intro 1:1s, …).
                  </p>
                </div>
              </label>
            </div>
          </div>
        </CardContent>

        <CardFooter class="flex items-center justify-between gap-3 border-t p-3">
          <Button variant="ghost" :disabled="step === 1" @click="back">
            <ChevronLeft class="mr-1 size-4" />Back
          </Button>
          <div class="text-muted-foreground text-xs tabular-nums">
            Step {{ step }} of {{ STEPS.length }}
          </div>
          <Button v-if="step < STEPS.length" @click="next">
            Continue<ChevronRight class="ml-1 size-4" />
          </Button>
          <Button v-else @click="submit">
            <Check class="mr-1 size-4" />Submit
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>
