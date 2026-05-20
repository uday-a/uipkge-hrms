<script setup lang="ts">
/**
 * Chat: 2-pane DM surface.
 *
 * Left rail: thread list (avatar + presence dot + last message preview
 * + unread count + relative ts).
 * Right pane: full thread with date-grouped messages, sender on the
 * right when it's "me", left otherwise. Composer at the bottom.
 *
 * Single-message DM model only -- no group chats, no channels. The
 * design language matches the registry's chat-two-pane block but is
 * inlined here so the HR app stays editable.
 */
import { computed, nextTick, ref } from 'vue'
import { Search, Send, Paperclip, Smile, ArrowLeft, Phone, Video, Info, MessageSquare } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import { THREADS, ME_ID, partner, type ChatThread, type ChatMessage } from '~/mocks/chat'

useHead({ title: 'Chat · uipkge HRMS' })

const threads = ref<ChatThread[]>(THREADS.map((t) => ({ ...t, messages: [...t.messages] })))

const search = ref('')
const activeId = ref<string>(threads.value[0]?.partnerId ?? '')
const active = computed(() => threads.value.find((t) => t.partnerId === activeId.value) ?? null)

const filteredThreads = computed(() => {
  if (!search.value.trim()) return threads.value
  const q = search.value.toLowerCase()
  return threads.value.filter((t) => {
    const p = partner(t)
    if (!p) return false
    if (p.name.toLowerCase().includes(q)) return true
    return t.messages.some((m) => m.text.toLowerCase().includes(q))
  })
})

function selectThread(t: ChatThread) {
  activeId.value = t.partnerId
  t.unread = 0
}

const composer = ref('')
const scrollAnchor = ref<HTMLElement | null>(null)
const composerEl = ref<{ $el?: HTMLElement } | HTMLElement | null>(null)

async function send() {
  if (!composer.value.trim() || !active.value) return
  const msg: ChatMessage = {
    id: `m-${Date.now()}`,
    fromId: ME_ID,
    text: composer.value.trim(),
    at: `Today ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
  }
  active.value.messages.push(msg)
  composer.value = ''
  await nextTick()
  scrollAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  // Return focus to composer so the next message can be typed without re-clicking.
  const el = (composerEl.value as { $el?: HTMLElement })?.$el ?? composerEl.value
  ;(el as HTMLElement | null)?.querySelector?.('textarea')?.focus()
}

function presenceTone(p: 'online' | 'away' | 'offline') {
  return p === 'online' ? 'bg-success' : p === 'away' ? 'bg-warning' : 'bg-muted-foreground/40'
}

function isMe(id: string) {
  return id === ME_ID
}

function lastPreview(t: ChatThread): string {
  const last = t.messages[t.messages.length - 1]
  if (!last) return ''
  return last.text
}

// Split an `at` string like "Today 13:50" / "May 12 16:40" into
// { day, time }. The time is whatever matches the trailing HH:MM
// pattern; everything before it is treated as the day prefix.
function splitAt(at: string): { day: string; time: string } {
  const m = at.match(/^(.*?)\s*(\d{1,2}:\d{2})\s*$/)
  if (!m) return { day: at, time: '' }
  return { day: (m[1] ?? '').trim(), time: m[2] ?? '' }
}

// Group messages into chunks of consecutive entries that share the
// same `day` prefix so we can render a date separator between chunks.
const groupedMessages = computed(() => {
  if (!active.value) return [] as { day: string; items: ChatMessage[] }[]
  const groups: { day: string; items: ChatMessage[] }[] = []
  for (const m of active.value.messages) {
    const { day } = splitAt(m.at)
    const last = groups[groups.length - 1]
    if (last && last.day === day) last.items.push(m)
    else groups.push({ day, items: [m] })
  }
  return groups
})

// Auto-grow textarea up to 4 rows by reading the line count of the
// current composer value. Min 1 row, max 4.
const composerRows = computed(() => {
  const lines = composer.value ? composer.value.split('\n').length : 1
  return Math.min(Math.max(lines, 1), 4)
})
</script>

<template>
  <div class="flex h-[calc(100vh-3.5rem)]">
    <aside class="bg-card flex w-full max-w-md flex-col border-r md:w-[340px]">
      <div class="border-b px-4 py-3 space-y-2">
        <h1 class="text-lg font-bold tracking-tight">Chat</h1>
        <div class="relative">
          <Search class="text-muted-foreground absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
          <Input v-model="search" placeholder="Search conversations…" class="h-9 pl-8 text-sm" />
        </div>
      </div>
      <ul class="flex-1 overflow-y-auto">
        <li
          v-for="t in filteredThreads"
          :key="t.partnerId"
          :class="[
            'hover:bg-muted/40 relative cursor-pointer border-b transition-colors',
            activeId === t.partnerId ? 'bg-muted/60' : '',
          ]"
          @click="selectThread(t)"
        >
          <span
            v-if="activeId === t.partnerId"
            aria-hidden="true"
            class="bg-primary absolute inset-y-2 left-0 w-0.5 rounded-r"
          />
          <div class="flex items-start gap-3 p-3">
            <div class="relative">
              <Avatar class="size-10">
                <AvatarFallback class="text-xs font-semibold">{{ partner(t)?.initials }}</AvatarFallback>
              </Avatar>
              <span :class="['ring-card absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2', presenceTone(t.presence)]" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="mb-0.5 flex items-center justify-between gap-2">
                <p class="truncate text-sm font-semibold">{{ partner(t)?.name }}</p>
                <span class="text-muted-foreground shrink-0 text-xs tabular-nums">{{ t.lastTs }}</span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <p class="text-muted-foreground truncate text-xs">{{ lastPreview(t) }}</p>
                <span v-if="t.unread" class="flex shrink-0 items-center gap-1">
                  <span class="bg-primary size-1.5 animate-pulse rounded-full" aria-hidden="true" />
                  <span class="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs font-bold tabular-nums">
                    {{ t.unread }}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </li>
        <li v-if="!filteredThreads.length" class="text-muted-foreground p-6 text-center text-sm">
          No conversations match your search.
        </li>
      </ul>
    </aside>

    <section v-if="active" class="bg-background flex flex-1 flex-col">
      <div class="border-b px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Button variant="ghost" size="icon" class="size-8 md:hidden" aria-label="Back" @click="activeId = ''">
            <ArrowLeft class="size-4" />
          </Button>
          <div class="relative">
            <Avatar class="size-9">
              <AvatarFallback class="text-xs font-semibold">{{ partner(active)?.initials }}</AvatarFallback>
            </Avatar>
            <span :class="['ring-card absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2', presenceTone(active.presence)]" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold">{{ partner(active)?.name }}</p>
            <p class="text-muted-foreground text-xs capitalize">{{ active.presence }} · {{ partner(active)?.title }}</p>
            <p v-if="active.presence === 'online'" class="text-muted-foreground text-xs">Active now</p>
          </div>
        </div>
        <div class="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" class="size-8" aria-label="Voice call"><Phone class="size-4" /></Button>
          <Button variant="ghost" size="icon" class="size-8" aria-label="Video call"><Video class="size-4" /></Button>
          <Button variant="ghost" size="icon" class="size-8" aria-label="Info"><Info class="size-4" /></Button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-4 py-5 space-y-3">
        <EmptyState
          v-if="active && !active.messages.length"
          :icon="MessageSquare"
          title="No messages yet"
          description="Send the first message to start the conversation."
        />
        <template v-for="(group, gi) in groupedMessages" :key="`g-${gi}-${group.day}`">
          <div v-if="group.day" class="flex items-center justify-center">
            <span class="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-widest">
              {{ group.day }}
            </span>
          </div>
          <TransitionGroup name="msg" tag="div" class="space-y-3">
            <div
              v-for="m in group.items"
              :key="m.id"
              :class="['flex gap-2', isMe(m.fromId) ? 'justify-end' : 'justify-start']"
            >
              <Avatar v-if="!isMe(m.fromId)" class="size-7 self-end">
                <AvatarFallback class="text-xs font-semibold">{{ partner(active)?.initials }}</AvatarFallback>
              </Avatar>
              <div
                :class="[
                  'max-w-[78%] rounded-xl px-3 py-2 shadow-sm',
                  isMe(m.fromId)
                    ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md'
                    : 'bg-card rounded-2xl rounded-bl-md border',
                ]"
              >
                <p class="text-sm whitespace-pre-line leading-snug">{{ m.text }}</p>
                <p :class="['mt-1 text-xs tabular-nums', isMe(m.fromId) ? 'text-primary-foreground/70' : 'text-muted-foreground']">
                  {{ splitAt(m.at).time || m.at }}
                </p>
              </div>
            </div>
          </TransitionGroup>
        </template>
        <div ref="scrollAnchor" />
      </div>

      <div class="px-4 py-3">
        <div class="bg-card focus-within:ring-ring/30 rounded-2xl border shadow-sm transition-shadow focus-within:ring-2">
          <Textarea
            ref="composerEl"
            v-model="composer"
            :rows="composerRows"
            aria-label="Message"
            placeholder="Type a message…"
            class="min-h-0 resize-none rounded-2xl border-0 bg-transparent px-3 py-2.5 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            @keydown.enter.exact.prevent="send"
          />
          <div class="flex items-center justify-between gap-2 border-t px-2 py-1.5">
            <div class="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" class="size-8" aria-label="Attach"><Paperclip class="size-3.5" /></Button>
              <Button variant="ghost" size="icon" class="size-8" aria-label="Emoji"><Smile class="size-3.5" /></Button>
              <span
                v-if="!composer"
                class="text-muted-foreground ml-1 hidden text-xs sm:inline-block"
              >
                Press Enter to send · Shift+Enter for newline
              </span>
            </div>
            <Button size="sm" :disabled="!composer.trim()" @click="send">
              <Send class="mr-2 size-3.5" />Send
            </Button>
          </div>
        </div>
      </div>
    </section>
    <section v-else class="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <div class="bg-muted/60 mb-1 flex size-14 items-center justify-center rounded-full">
        <MessageSquare class="text-muted-foreground size-6" />
      </div>
      <p class="text-foreground text-sm font-semibold">No conversation selected</p>
      <p class="text-muted-foreground text-xs">Pick a conversation to read messages.</p>
    </section>
  </div>
</template>

<style scoped>
.msg-enter-active {
  transition: opacity 200ms ease, transform 200ms ease;
}
.msg-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.msg-leave-active {
  transition: opacity 120ms ease;
}
.msg-leave-to {
  opacity: 0;
}
</style>
