<script setup lang="ts">
/**
 * Onboarding tour — first-launch welcome for new hires.
 *
 * 5-screen carousel rendered full-viewport (no topbar / sidebar) so
 * day-one users see one focused thing at a time. State is local-only:
 * Skip and the final "Go to dashboard" both navigate to /dashboard.
 *
 * Keyboard: ArrowRight + Cmd/Ctrl+Enter advance, ArrowLeft goes back,
 * Escape skips. The dialog autofocuses its primary action on mount and
 * announces step changes via aria-live.
 *
 * Persona/name: greet whoever's currently active per usePersona(); for
 * the canonical "new hire" demo we hard-pin ME_ID = 'E-0002' (Marcus
 * Rivera) so the greeting reads "Marcus" regardless of which persona
 * the demo viewer happens to be impersonating in the topbar.
 *
 * Persistence: a "seen" flag in localStorage means a refresh mid-demo
 * skips the tour. Cleared by /settings if we ever surface a "show me
 * the tour again" affordance.
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  Home,
  Search,
  CalendarDays,
  Inbox,
  MessageSquare,
  Sparkles,
  PartyPopper,
  ArrowLeft,
  ArrowRight,
  Check,
} from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import { EMPLOYEES } from '~/mocks/people'

useHead({ title: 'Welcome · uipkge HRMS' })
definePageMeta({ layout: false })

const ME_ID = 'E-0002'
const me = computed(() => EMPLOYEES.find((e) => e.id === ME_ID))
const firstName = computed(() => me.value?.name.split(' ')[0] ?? 'there')

// Slide content. Title uses a computed so SSR + client agree on the
// firstName (mock employees are static so no hydration risk).
const screens = computed(() => [
  {
    title: `Welcome to uipkge HRMS, ${firstName.value}!`,
    body: 'Your day-one home — find people, manage time-off, and complete reviews, all from one place.',
    visual: 'welcome' as const,
  },
  {
    title: 'Find your people',
    body: 'Quick-find any colleague with ⌘K or browse the full directory on the People page.',
    visual: 'search' as const,
  },
  {
    title: 'Request leave in seconds',
    body: 'Pick dates, write a short reason, and your manager gets notified instantly.',
    visual: 'timeoff' as const,
  },
  {
    title: 'Inbox + chat + assistant',
    body: 'HR notifications, DMs with colleagues, and an AI assistant that answers policy questions.',
    visual: 'inbox' as const,
  },
  {
    title: "You're all set",
    body: 'Jump to the dashboard to start your day.',
    visual: 'done' as const,
  },
])

const step = ref(0)
const last = computed(() => step.value === screens.value.length - 1)
const current = computed(() => screens.value[step.value]!)

const SEEN_KEY = 'hrms.onboarding.seen'
const nextBtn = ref<HTMLElement | null>(null)

function persistSeen() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Storage might be unavailable (private mode); fall through silently.
  }
}

function next() {
  if (last.value) {
    persistSeen()
    navigateTo('/dashboard')
    return
  }
  step.value += 1
}
function back() {
  if (step.value > 0) step.value -= 1
}
function skip() {
  persistSeen()
  navigateTo('/dashboard')
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
    e.preventDefault()
    next()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    back()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    skip()
  }
}

onMounted(() => {
  // If we've already seen the tour, fast-forward to the dashboard so a
  // refresh mid-demo doesn't restart from screen 1.
  try {
    if (window.localStorage.getItem(SEEN_KEY) === '1') {
      navigateTo('/dashboard', { replace: true })
      return
    }
  } catch {
    // localStorage unavailable; show tour anyway.
  }
  window.addEventListener('keydown', onKey)
  // Autofocus the primary action so keyboard users have somewhere to land.
  nextBtn.value?.focus?.()
})
onUnmounted(() => {
  if (typeof window !== 'undefined') window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <main class="from-muted/40 to-background grid min-h-svh place-items-center bg-gradient-to-b p-4">
    <Card
      class="border-primary/20 w-full max-w-xl rounded-2xl border-2 shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onb-title"
      aria-describedby="onb-body"
    >
      <CardContent class="space-y-6 p-8 sm:p-10">
        <!-- Progress dots — colour AND shape signal current/past/future. -->
        <div
          class="flex items-center justify-center gap-2"
          role="progressbar"
          :aria-valuenow="step + 1"
          :aria-valuemin="1"
          :aria-valuemax="screens.length"
          :aria-label="`Step ${step + 1} of ${screens.length}`"
        >
          <span
            v-for="(_, i) in screens"
            :key="i"
            :aria-current="i === step ? 'step' : undefined"
            :class="[
              'h-1.5 rounded-full transition-all duration-300',
              i === step
                ? 'bg-primary w-6'
                : i < step
                  ? 'bg-primary/60 ring-primary/40 w-1.5 ring-1'
                  : 'bg-muted-foreground/25 w-1.5',
            ]"
          />
        </div>

        <!-- Slide -->
        <Transition name="onb-fade" mode="out-in">
          <div :key="step" class="space-y-5 text-center" aria-live="polite" aria-atomic="true">
            <div class="flex justify-center">
              <!-- 1. Welcome -->
              <div
                v-if="current.visual === 'welcome'"
                class="bg-primary/10 text-primary flex size-24 items-center justify-center rounded-full"
                aria-hidden="true"
              >
                <Home class="size-12" />
              </div>

              <!-- 2. Search -->
              <div
                v-else-if="current.visual === 'search'"
                class="w-full max-w-sm space-y-2 text-left"
                aria-hidden="true"
              >
                <div class="bg-background/80 flex items-center gap-2 rounded-lg border px-3 py-2.5 shadow-sm">
                  <Search class="text-muted-foreground size-4" />
                  <span class="text-muted-foreground text-sm">Search people, pages…</span>
                  <kbd class="bg-muted text-muted-foreground ml-auto rounded px-1.5 py-0.5 text-xs font-semibold">⌘K</kbd>
                </div>
                <div class="space-y-1.5 rounded-lg border p-2">
                  <div class="hover:bg-muted/40 flex items-center gap-2 rounded p-1.5">
                    <Avatar class="size-7">
                      <AvatarFallback class="text-xs font-semibold">SC</AvatarFallback>
                    </Avatar>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-xs font-medium">Sarah Connor</p>
                      <p class="text-muted-foreground truncate text-xs">VP Engineering · San Francisco</p>
                    </div>
                  </div>
                  <div class="hover:bg-muted/40 flex items-center gap-2 rounded p-1.5">
                    <Avatar class="size-7">
                      <AvatarFallback class="text-xs font-semibold">DC</AvatarFallback>
                    </Avatar>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-xs font-medium">Diane Cho</p>
                      <p class="text-muted-foreground truncate text-xs">Head of Talent · New York</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 3. Time-off -->
              <div v-else-if="current.visual === 'timeoff'" class="w-full max-w-xs space-y-2" aria-hidden="true">
                <div class="rounded-lg border p-3 text-left">
                  <div class="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                    <CalendarDays class="size-3.5" />May 2026
                  </div>
                  <div class="text-muted-foreground mb-1 grid grid-cols-7 gap-1 text-center text-xs font-semibold">
                    <span v-for="d in ['S','M','T','W','T','F','S']" :key="d">{{ d }}</span>
                  </div>
                  <div class="grid grid-cols-7 gap-1 text-center text-xs tabular-nums">
                    <span v-for="n in 31" :key="n"
                      :class="[
                        'rounded py-0.5',
                        n >= 18 && n <= 22 ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground',
                      ]"
                    >{{ n }}</span>
                  </div>
                </div>
                <p class="bg-success/10 text-success rounded-md border px-2.5 py-1 text-center text-xs font-medium">
                  May 18 – 22 selected
                </p>
              </div>

              <!-- 4. Stay informed -->
              <div v-else-if="current.visual === 'inbox'" class="grid w-full max-w-sm grid-cols-3 gap-2" aria-hidden="true">
                <div class="space-y-1.5 rounded-lg border p-2.5">
                  <Inbox class="text-primary size-4" />
                  <p class="text-xs font-semibold">Inbox</p>
                  <p class="text-muted-foreground text-xs leading-snug">HR notices</p>
                </div>
                <div class="space-y-1.5 rounded-lg border p-2.5">
                  <MessageSquare class="text-primary size-4" />
                  <p class="text-xs font-semibold">Chat</p>
                  <p class="text-muted-foreground text-xs leading-snug">DMs &amp; channels</p>
                </div>
                <div class="space-y-1.5 rounded-lg border p-2.5">
                  <Sparkles class="text-primary size-4" />
                  <p class="text-xs font-semibold">Assistant</p>
                  <p class="text-muted-foreground text-xs leading-snug">Ask anything</p>
                </div>
              </div>

              <!-- 5. Done -->
              <div
                v-else
                class="bg-success/10 text-success flex size-24 items-center justify-center rounded-full"
                aria-hidden="true"
              >
                <PartyPopper class="size-12" />
              </div>
            </div>

            <!-- Copy -->
            <div class="space-y-2">
              <h1 id="onb-title" class="text-2xl font-bold tracking-tight sm:text-3xl">{{ current.title }}</h1>
              <p id="onb-body" class="text-muted-foreground text-sm sm:text-base">{{ current.body }}</p>
            </div>
          </div>
        </Transition>

        <!-- Footer actions -->
        <div class="flex items-center justify-between gap-3 pt-2">
          <Button variant="ghost" @click="skip">
            Skip tour
          </Button>
          <div class="flex items-center gap-2">
            <Button
              v-if="step > 0"
              variant="outline"
              @click="back"
              aria-label="Previous step"
            >
              <ArrowLeft class="mr-1 size-4" />Back
            </Button>
            <Button ref="nextBtn" @click="next">
              <Check v-if="last" class="mr-1 size-4" />
              {{ last ? 'Go to dashboard' : 'Next' }}
              <ArrowRight v-if="!last" class="ml-1 size-4" />
            </Button>
          </div>
        </div>

        <p class="text-muted-foreground/70 text-center text-xs">
          Tip: press <kbd class="bg-muted rounded px-1 py-0.5 text-xs font-semibold">←</kbd> /
          <kbd class="bg-muted rounded px-1 py-0.5 text-xs font-semibold">→</kbd> to navigate,
          <kbd class="bg-muted rounded px-1 py-0.5 text-xs font-semibold">Esc</kbd> to skip.
        </p>
      </CardContent>
    </Card>
  </main>
</template>

<style scoped>
.onb-fade-enter-active,
.onb-fade-leave-active {
  transition: opacity var(--dur-base, 200ms) var(--ease-out, ease-out),
    transform var(--dur-base, 200ms) var(--ease-out, ease-out);
}
.onb-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.onb-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
