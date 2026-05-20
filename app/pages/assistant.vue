<script setup lang="ts">
/**
 * HR assistant.
 *
 * Single-thread LLM chat scoped to HR policy questions. The mock
 * doesn't call an LLM -- it picks a canned response based on which
 * suggestion prompt the user clicks (or falls back to a default reply
 * when the user freeforms).
 *
 * Layout:
 *   - Greeting + 6 suggested prompts (data-driven)
 *   - Once the conversation starts, the suggestions collapse below
 *     a stack of chat bubbles
 *   - Footer composer with attachment button (visual only) + send
 *
 * Real consumers swap `replyTo()` for a streaming API call.
 */
import { computed, nextTick, ref } from 'vue'
import { Sparkles, Send, Paperclip, RotateCcw, ThumbsUp, ThumbsDown, Copy, CalendarDays, Banknote, FileText, Plane, GraduationCap, ShieldCheck } from 'lucide-vue-next'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'vue-sonner'

useHead({ title: 'HR assistant · uipkge HRMS' })

interface Msg {
  id: string
  from: 'user' | 'assistant'
  text: string
  at: string
}

const messages = ref<Msg[]>([])
const composer = ref('')
const thinking = ref(false)
const scrollAnchor = ref<HTMLElement | null>(null)

type SuggestionTone = 'info' | 'success' | 'accent' | 'warning' | 'highlight' | 'neutral'

const SUGGESTIONS: Array<{ icon: any; prompt: string; tag: string; tone: SuggestionTone }> = [
  { icon: CalendarDays, prompt: 'How much PTO do I have left this cycle?', tag: 'Time off', tone: 'info' },
  { icon: Banknote, prompt: 'When is the next payroll cycle and what is my net deposit?', tag: 'Payroll', tone: 'success' },
  { icon: FileText, prompt: 'Where do I find the parental leave policy?', tag: 'Policy', tone: 'accent' },
  { icon: Plane, prompt: 'How do I submit a business travel reimbursement?', tag: 'Expenses', tone: 'warning' },
  { icon: GraduationCap, prompt: 'What learning budget do I have left this year?', tag: 'Growth', tone: 'highlight' },
  { icon: ShieldCheck, prompt: 'How do I report a workplace incident anonymously?', tag: 'Safety', tone: 'neutral' },
]

// Per-tone chip + tag classes. Tokens, not raw palette — keeps the
// suggestion cards colour-coded while staying within the OKLCH design
// system. Tailwind v4 JIT still needs full strings spelled out.
const TONE_CHIP: Record<SuggestionTone, string> = {
  info: 'bg-info/10 text-info group-hover:bg-info/15',
  success: 'bg-success/10 text-success group-hover:bg-success/15',
  accent: 'bg-chart-3/10 text-chart-3 group-hover:bg-chart-3/15',
  warning: 'bg-warning/10 text-warning group-hover:bg-warning/15',
  highlight: 'bg-chart-1/10 text-chart-1 group-hover:bg-chart-1/15',
  neutral: 'bg-muted text-muted-foreground group-hover:bg-muted/80',
}

const TONE_TAG: Record<SuggestionTone, string> = {
  info: 'border-info/30 text-info bg-info/5',
  success: 'border-success/30 text-success bg-success/5',
  accent: 'border-chart-3/30 text-chart-3 bg-chart-3/5',
  warning: 'border-warning/30 text-warning bg-warning/5',
  highlight: 'border-chart-1/30 text-chart-1 bg-chart-1/5',
  neutral: 'border-border text-muted-foreground bg-muted/40',
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function replyTo(prompt: string): string {
  const p = prompt.toLowerCase()
  if (p.includes('pto') || p.includes('time off') || p.includes('vacation')) {
    return [
      'You have **15 vacation days, 8 sick days, and 3 personal days remaining** this cycle.',
      '',
      'Your last approved trip was Mar 9 – Mar 13. The current pending request is Jun 15 – Jun 19 (5 days, with Sarah Connor for approval).',
      '',
      'Use [Time off](/time-off) to request more or check the team OOO calendar.',
    ].join('\n')
  }
  if (p.includes('payroll') || p.includes('payslip') || p.includes('deposit')) {
    return [
      'The next payroll cycle closes **Apr 28** and pays out **Apr 30** at 09:00 IST.',
      '',
      'Your most recent payslip (Apr 2026) is available on your profile. Net deposit was credited Apr 30.',
      '',
      'Adjust your bank details in Settings → Banking. Reach out to people-team@uipkge-hrms.dev if you spot a discrepancy.',
    ].join('\n')
  }
  if (p.includes('parental') || p.includes('maternity') || p.includes('paternity') || p.includes('policy')) {
    return [
      'Our parental leave policy, effective **Jul 1, 2026**:',
      '',
      '• **16 weeks fully paid** for the primary caregiver',
      '• **8 weeks fully paid** for the secondary caregiver',
      '• Adoption + surrogacy covered identically to birth',
      '• **Phase-back option:** 4 weeks at 60% time after returning',
      '',
      'Full doc lives in Settings → Policies. Questions: people-team@uipkge-hrms.dev.',
    ].join('\n')
  }
  if (p.includes('travel') || p.includes('reimburse') || p.includes('expense')) {
    return [
      'Travel reimbursement flow:',
      '',
      '1. Submit the expense in **Settings → Expenses** within 30 days of incurring it.',
      '2. Attach receipts (PDF or photo). The OCR-extracted total is editable.',
      '3. Your manager auto-approves up to $1,000 USD; above that triggers Finance review.',
      '4. Approved reimbursements land in your next paycheck.',
      '',
      'Per diem for international travel: $75/day food + $250/night lodging unless pre-approved otherwise.',
    ].join('\n')
  }
  if (p.includes('learning') || p.includes('budget') || p.includes('course') || p.includes('growth')) {
    return [
      'Your individual learning budget is **$2,500 USD per fiscal year**. You\'ve used $640 (Conf 2026 ticket).',
      '',
      'Eligible expenses include courses, books, conferences, and certifications relevant to your role. Submit through Settings → Expenses with category "Learning".',
      '',
      'Approvals are auto-granted up to $500; larger items need manager sign-off.',
    ].join('\n')
  }
  if (p.includes('incident') || p.includes('report') || p.includes('hr complaint')) {
    return [
      'To report a workplace incident:',
      '',
      '• **Anonymous channel:** report.uipkge-hrms.dev/anon — routes to the People team without identifying details.',
      '• **Named report:** people-team@uipkge-hrms.dev or your direct HR partner.',
      '• **Emergency / safety risk:** call 1-800-555-HELP (24/7).',
      '',
      'All reports are taken seriously. Retaliation for good-faith reporting is against our code of conduct.',
    ].join('\n')
  }
  return [
    'I\'m a mock HR assistant in this demo template — I don\'t reach out to a real LLM yet. Try one of the suggested prompts above for a canned response, or wire me up in `app/pages/assistant.vue` (the `replyTo()` function) to your own model.',
    '',
    'In a real consumer, this surface streams from a managed Claude / OpenAI endpoint scoped to HR-policy docs.',
  ].join('\n')
}

async function send(text?: string) {
  const userText = (text ?? composer.value).trim()
  if (!userText) return
  messages.value.push({ id: `u-${Date.now()}`, from: 'user', text: userText, at: nowTime() })
  composer.value = ''
  await nextTick()
  scrollAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })

  thinking.value = true
  // Small visual delay so it feels like the assistant is "thinking".
  await new Promise((r) => setTimeout(r, 600))
  thinking.value = false
  messages.value.push({ id: `a-${Date.now()}`, from: 'assistant', text: replyTo(userText), at: nowTime() })
  await nextTick()
  scrollAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
}

function reset() {
  messages.value = []
  composer.value = ''
  toast.info('Conversation cleared')
}

function copy(text: string) {
  if (!import.meta.client) return
  navigator.clipboard?.writeText(text).then(() => toast.success('Copied'))
}

const started = computed(() => messages.value.length > 0)

// Render markdown-ish content: bold, links, line breaks. Kept minimal
// to avoid pulling in a markdown lib for the mock. Escapes the full
// HTML-injection set + strips javascript:/data: URLs from link hrefs.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function safeHref(raw: string): string {
  const trimmed = raw.trim()
  // Only allow http(s), mailto, tel, and same-origin relative paths.
  if (/^(https?:|mailto:|tel:|\/)/i.test(trimmed)) return escapeHtml(trimmed)
  return '#'
}

function renderText(t: string): string {
  return escapeHtml(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\(([^)]+?)\)/g, (_m, label, href) =>
      `<a href="${safeHref(href)}" class="text-primary underline" rel="noopener noreferrer">${label}</a>`
    )
    .replace(/\n/g, '<br />')
}
</script>

<template>
  <div class="mx-auto flex h-[calc(100vh-3.5rem)] max-w-3xl flex-col">
    <header class="border-b px-5 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <!-- Header avatar: same blurred-ring treatment as the hero, smaller. -->
        <div class="relative">
          <div class="bg-primary/20 absolute inset-0 -z-10 rounded-full blur-xl" aria-hidden="true" />
          <div class="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full ring-1 ring-primary/20">
            <Sparkles class="size-4" />
          </div>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-lg font-bold tracking-tight">HR assistant</h1>
            <span class="text-success inline-flex items-center gap-1 text-xs font-medium">
              <span class="bg-success size-1.5 rounded-full" aria-hidden="true" />Online
            </span>
          </div>
          <p class="text-muted-foreground text-xs">Answers grounded in your HR policy + people data.</p>
        </div>
      </div>
      <Button v-if="started" variant="ghost" size="sm" @click="reset">
        <RotateCcw class="mr-2 size-3.5" />New conversation
      </Button>
    </header>

    <!-- Empty-state hero + suggestions -->
    <div v-if="!started" class="relative flex flex-1 flex-col items-center justify-center px-5 py-8">
      <!-- Decorative gradient wash behind the hero. Pointer-events none so
           it never intercepts clicks on the suggestion grid. -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-1/2 bg-gradient-to-b from-primary/5 to-transparent"
      />

      <!-- Tagline pill above the title -->
      <Badge variant="outline" class="mb-4 gap-1.5 px-2.5 py-1 text-xs font-medium">
        <Sparkles class="size-3 text-primary" />
        <span>AI assistant · beta</span>
      </Badge>

      <!-- Glowing icon: blurred halo behind a ringed icon chip. -->
      <div class="relative mb-5 flex items-center justify-center">
        <div class="bg-primary/20 absolute inset-0 -z-10 rounded-full blur-2xl" aria-hidden="true" />
        <div class="bg-primary/10 text-primary flex size-20 items-center justify-center rounded-full ring-1 ring-primary/20">
          <Sparkles class="size-16" />
        </div>
      </div>

      <h2 class="text-xl font-bold tracking-tight">How can I help today?</h2>
      <p class="text-muted-foreground mt-1 max-w-md text-center text-sm">
        Ask about your PTO balance, payroll, policy, expenses, or growth — I'll pull from your HR data.
      </p>
      <div class="mt-6 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          v-for="s in SUGGESTIONS"
          :key="s.prompt"
          class="bg-card hover:border-primary/50 hover:bg-muted/40 hover:-translate-y-0.5 hover:shadow-md group relative flex items-start gap-3 rounded-lg border p-3 text-left transition-all"
          @click="send(s.prompt)"
        >
          <div :class="['flex size-8 shrink-0 items-center justify-center rounded-md transition-colors', TONE_CHIP[s.tone]]">
            <component :is="s.icon" class="size-4" />
          </div>
          <div class="min-w-0 flex-1 pr-12">
            <Badge variant="outline" :class="['mb-1 text-xs font-medium', TONE_TAG[s.tone]]">{{ s.tag }}</Badge>
            <p class="text-sm leading-snug">{{ s.prompt }}</p>
          </div>
          <span class="text-muted-foreground absolute bottom-2.5 right-3 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
            Ask →
          </span>
        </button>
      </div>
    </div>

    <!-- Conversation -->
    <div v-else class="flex-1 overflow-y-auto px-5 py-6 space-y-5">
      <div
        v-for="m in messages"
        :key="m.id"
        :class="['group flex gap-2 pt-1', m.from === 'user' ? 'justify-end' : 'justify-start']"
      >
        <div v-if="m.from === 'assistant'" class="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full ring-1 ring-primary/20">
          <Sparkles class="size-3.5" />
        </div>
        <div :class="['space-y-1.5', m.from === 'user' ? 'max-w-[75%]' : 'max-w-[80%]']">
          <div
            :class="[
              'rounded-2xl px-4 py-2.5 shadow-sm',
              m.from === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-md'
                : 'bg-card border rounded-bl-md',
            ]"
          >
            <div class="text-sm leading-relaxed" v-html="renderText(m.text)" />
          </div>
          <div v-if="m.from === 'assistant'" class="flex items-center gap-2 pl-2">
            <span class="text-muted-foreground text-xs">{{ m.at }}</span>
            <div class="bg-muted/40 inline-flex items-center gap-2 rounded-full px-2 py-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <button class="text-muted-foreground hover:text-foreground transition-colors" @click="copy(m.text)" aria-label="Copy">
                <Copy class="size-3" />
              </button>
              <button class="text-muted-foreground hover:text-foreground transition-colors" @click="toast.success('Feedback recorded')" aria-label="Helpful">
                <ThumbsUp class="size-3" />
              </button>
              <button class="text-muted-foreground hover:text-foreground transition-colors" @click="toast.info('Feedback recorded')" aria-label="Not helpful">
                <ThumbsDown class="size-3" />
              </button>
            </div>
          </div>
          <div v-if="m.from === 'user'" class="text-muted-foreground pr-2 text-right text-xs">{{ m.at }}</div>
        </div>
        <Avatar v-if="m.from === 'user'" class="size-7 shrink-0">
          <AvatarFallback class="text-xs font-semibold">MR</AvatarFallback>
        </Avatar>
      </div>

      <div v-if="thinking" class="flex gap-2 pt-1">
        <div class="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full ring-1 ring-primary/20">
          <Sparkles class="size-3.5" />
        </div>
        <div class="bg-card rounded-2xl rounded-bl-md border px-4 py-3 shadow-sm">
          <div class="flex items-center gap-1">
            <span class="bg-foreground/40 size-1.5 animate-bounce rounded-full" style="animation-delay: 0ms" />
            <span class="bg-foreground/40 size-1.5 animate-bounce rounded-full" style="animation-delay: 150ms" />
            <span class="bg-foreground/40 size-1.5 animate-bounce rounded-full" style="animation-delay: 300ms" />
          </div>
        </div>
      </div>

      <div ref="scrollAnchor" />
    </div>

    <!-- Composer -->
    <div class="border-t px-5 py-3">
      <!-- Wrapped composer: textarea + action row share a single rounded
           card so the focus ring reads as one unit. -->
      <div class="bg-card focus-within:ring-primary/30 overflow-hidden rounded-2xl border transition-shadow focus-within:ring-2">
        <Textarea
          v-model="composer"
          rows="2"
          placeholder="Ask anything HR-related…"
          class="resize-none rounded-none border-0 bg-transparent text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          @keydown.enter.exact.prevent="send()"
        />
        <div class="flex items-center justify-between gap-2 px-2 py-1.5">
          <Button variant="ghost" size="sm" class="text-muted-foreground" aria-label="Attach">
            <Paperclip class="mr-2 size-3.5" />Attach file
          </Button>
          <div class="flex items-center gap-3">
            <span
              v-if="composer.length"
              class="text-muted-foreground text-xs tabular-nums"
            >
              {{ composer.length }} chars
            </span>
            <Button size="sm" :disabled="!composer.trim() || thinking" @click="send()">
              Send<Send class="ml-2 size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
