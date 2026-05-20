<script setup lang="ts">
/**
 * Inbox: 2-pane HR notification stream.
 *
 * Left rail (sm: collapses to list-only): folder filter (All / Unread /
 * Starred / by type).
 * Middle: notification list (avatar + type pill + preview).
 * Right: detail pane (full body + actionable buttons + reply composer
 * for items that warrant a reply).
 *
 * Marked-read state is in-memory only (resets on refresh) -- the mock
 * source is read-only and SSR keeps everyone in sync.
 */
import { computed, ref } from 'vue'
import { Inbox as InboxIcon, Star, StarOff, Reply, Forward, Trash2, MailOpen, MailMinus, ChevronRight, CalendarCheck, FileText, PartyPopper, Megaphone, AtSign, UserCheck, FileSignature, FilePlus, AlertCircle } from 'lucide-vue-next'
import type { Component } from 'vue'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'vue-sonner'

import { INBOX_ITEMS, TYPE_LABELS, TYPE_TONE, type InboxType, type InboxItem } from '~/mocks/inbox'
import { findEmployee } from '~/mocks/people'

useHead({ title: 'Inbox · uipkge HRMS' })

// In-memory copy so we can toggle unread / starred state without
// mutating the imported mock (which would also leak into other pages).
const items = ref<InboxItem[]>(INBOX_ITEMS.map((i) => ({ ...i })))

const filter = ref<'all' | 'unread' | 'starred' | InboxType>('all')

const filtered = computed(() => {
  if (filter.value === 'all') return items.value
  if (filter.value === 'unread') return items.value.filter((i) => i.unread)
  if (filter.value === 'starred') return items.value.filter((i) => i.starred)
  return items.value.filter((i) => i.type === filter.value)
})

const unreadCount = computed(() => items.value.filter((i) => i.unread).length)
const starredCount = computed(() => items.value.filter((i) => i.starred).length)

const selectedId = ref<string | null>(items.value[0]?.id ?? null)
const selected = computed(() => items.value.find((i) => i.id === selectedId.value) ?? null)

function select(item: InboxItem) {
  selectedId.value = item.id
  item.unread = false
}

function toggleStar(item: InboxItem) {
  item.starred = !item.starred
}

function toggleRead(item: InboxItem) {
  item.unread = !item.unread
}

function markAllRead() {
  items.value.forEach((i) => (i.unread = false))
  toast.success('All marked as read')
}

const reply = ref('')
function sendReply() {
  if (!reply.value.trim()) return
  toast.success('Reply sent (mock)')
  reply.value = ''
}

function typeIcon(type: InboxType) {
  switch (type) {
    case 'review-due': return UserCheck
    case 'time-off-request': return CalendarCheck
    case 'time-off-approved': return CalendarCheck
    case 'time-off-rejected': return AlertCircle
    case 'peer-feedback': return MessageSquareReply
    case 'offer-sent': return FilePlus
    case 'offer-accepted': return UserCheck
    case 'doc-signed': return FileSignature
    case 'mention': return AtSign
    case 'announcement': return Megaphone
    case 'birthday': return PartyPopper
    default: return FileText
  }
}

// Local re-import alias (lucide ships MessageSquareReply but vue tools
// sometimes complain at top-level imports of niche icons; declaring
// here keeps the imports list clean).
const MessageSquareReply = AtSign

const FOLDERS: { id: 'all' | 'unread' | 'starred' | InboxType; label: string; icon: Component }[] = [
  { id: 'all', label: 'All', icon: InboxIcon },
  { id: 'unread', label: 'Unread', icon: MailOpen },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'review-due', label: 'Reviews', icon: FileText },
  { id: 'time-off-request', label: 'Time off', icon: CalendarCheck },
  { id: 'mention', label: 'Mentions', icon: AtSign },
  { id: 'announcement', label: 'Announcements', icon: Megaphone },
]

function folderCount(f: typeof FOLDERS[number]) {
  if (f.id === 'all') return items.value.length
  if (f.id === 'unread') return unreadCount.value
  if (f.id === 'starred') return starredCount.value
  return items.value.filter((i) => i.type === f.id).length
}

// Pill colors for folder counts. Unread (amber/warning) and Starred
// (amber) are highlighted when > 0; everything else stays muted.
function folderCountClass(f: typeof FOLDERS[number], count: number) {
  if (count === 0) return 'text-muted-foreground/60'
  if (f.id === 'unread') return 'bg-warning/10 text-warning'
  if (f.id === 'starred') return 'bg-warning/10 text-warning'
  return 'text-muted-foreground'
}
</script>

<template>
  <div class="h-[calc(100vh-3.5rem)] flex flex-col">
    <header class="border-b px-4 py-3 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <InboxIcon class="text-muted-foreground size-5" />
        <div>
          <h1 class="text-lg font-bold tracking-tight">Inbox</h1>
          <p class="text-muted-foreground text-xs">{{ unreadCount }} unread · {{ items.length }} total</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" :disabled="!unreadCount" @click="markAllRead">
          <MailOpen class="mr-2 size-3.5" />Mark all read
        </Button>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Folder rail -->
      <aside class="bg-muted/30 hidden w-48 shrink-0 border-r p-2 sm:block">
        <nav class="space-y-0.5">
          <button
            v-for="f in FOLDERS"
            :key="f.id"
            :class="['hover:bg-muted/60 relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors', filter === f.id ? 'bg-muted/80 font-semibold' : '']"
            @click="filter = f.id"
          >
            <span
              v-if="filter === f.id"
              class="bg-primary absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full"
              aria-hidden="true"
            />
            <component :is="f.icon" class="text-muted-foreground size-3.5 shrink-0" />
            <span class="flex-1 truncate">{{ f.label }}</span>
            <span
              :class="['tabular-nums text-xs inline-flex items-center justify-center rounded-full px-1.5 min-w-[1.25rem] h-4 font-semibold', folderCountClass(f, folderCount(f))]"
            >{{ folderCount(f) }}</span>
          </button>
        </nav>
      </aside>

      <!-- List -->
      <section class="w-full max-w-md shrink-0 overflow-y-auto border-r md:w-[360px]">
        <ul role="listbox" aria-label="Inbox messages">
          <li
            v-for="item in filtered"
            :key="item.id"
            role="option"
            :aria-selected="selectedId === item.id"
            :aria-label="`${item.unread ? 'Unread: ' : ''}${item.title}`"
            :tabindex="0"
            :class="['focus-visible:ring-ring/40 focus-visible:outline-none focus-visible:ring-2 relative cursor-pointer border-b transition-colors duration-150', selectedId === item.id ? 'bg-muted/50' : 'hover:bg-muted/30', item.unread ? 'bg-primary/[0.02]' : '']"
            @click="select(item)"
            @keydown.enter.prevent="select(item)"
            @keydown.space.prevent="select(item)"
          >
            <span
              v-if="item.unread"
              class="bg-primary absolute left-0 top-0 bottom-0 w-0.5"
              aria-hidden="true"
            />
            <div class="flex items-start gap-3 p-3">
              <div :class="['flex size-9 shrink-0 items-center justify-center rounded-full ring-1 ring-border', TYPE_TONE[item.type]]">
                <component :is="typeIcon(item.type)" class="size-4" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="mb-0.5 flex items-center justify-between gap-2">
                  <p :class="['truncate text-sm', item.unread ? 'font-bold' : 'font-medium']">{{ item.title }}</p>
                  <span :class="['shrink-0 text-xs tabular-nums', item.unread ? 'text-foreground font-semibold' : 'text-muted-foreground/70']">{{ item.time }}</span>
                </div>
                <p class="text-muted-foreground line-clamp-2 text-xs">{{ item.preview }}</p>
                <div class="mt-1.5 flex items-center gap-1.5">
                  <Badge variant="outline" class="text-xs font-normal capitalize">
                    {{ TYPE_LABELS[item.type] }}
                  </Badge>
                  <span class="text-muted-foreground text-xs">· {{ item.day }}</span>
                  <Star v-if="item.starred" class="fill-warning text-warning ml-auto size-3" />
                </div>
              </div>
            </div>
          </li>
          <li v-if="!filtered.length">
            <EmptyState
              :icon="InboxIcon"
              title="Nothing in this folder"
              description="Items will show up here when there's activity for this filter."
              class="py-10"
            />
          </li>
        </ul>
      </section>

      <!-- Detail pane -->
      <section class="bg-card flex flex-1 flex-col overflow-hidden">
        <template v-if="selected">
          <div class="border-b px-5 py-4">
            <div class="mb-3 flex items-center justify-between gap-2">
              <Badge variant="outline" class="text-xs capitalize">{{ TYPE_LABELS[selected.type] }}</Badge>
              <div class="bg-card flex items-center overflow-hidden rounded-lg border [&>*+*]:border-l">
                <Button variant="ghost" size="icon" class="size-8 rounded-none" @click="toggleStar(selected)" :aria-label="selected.starred ? 'Unstar' : 'Star'">
                  <Star v-if="selected.starred" class="fill-warning text-warning size-4" />
                  <StarOff v-else class="size-4" />
                </Button>
                <Button variant="ghost" size="icon" class="size-8 rounded-none" @click="toggleRead(selected)" :aria-label="selected.unread ? 'Mark read' : 'Mark unread'">
                  <MailMinus v-if="selected.unread" class="size-4" />
                  <MailOpen v-else class="size-4" />
                </Button>
                <Button variant="ghost" size="icon" class="text-destructive size-8 rounded-none" @click="toast.warning('Deleted (mock)')" aria-label="Delete">
                  <Trash2 class="size-4" />
                </Button>
              </div>
            </div>
            <h2 class="text-xl font-bold tracking-tight">{{ selected.title }}</h2>
            <div class="mt-3 flex flex-wrap items-center gap-3">
              <div
                v-if="selected.fromId && findEmployee(selected.fromId)"
                class="bg-muted/30 inline-flex items-center gap-2 rounded-md px-3 py-2"
              >
                <span class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">From</span>
                <Avatar class="size-6">
                  <AvatarFallback class="text-xs font-semibold">{{ findEmployee(selected.fromId)!.initials }}</AvatarFallback>
                </Avatar>
                <span class="text-sm font-medium">{{ findEmployee(selected.fromId)!.name }}</span>
              </div>
              <span class="text-muted-foreground text-xs tabular-nums">{{ selected.day }} · {{ selected.time }}</span>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto px-5 py-5">
            <p class="text-sm leading-7 whitespace-pre-line">{{ selected.body }}</p>
            <div v-if="selected.actionable?.length" class="mt-5 space-y-2">
              <button
                v-for="action in selected.actionable"
                :key="action.label"
                type="button"
                class="hover:border-foreground/30 hover:bg-muted/40 group bg-card flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors"
                @click="action.href ? navigateTo(action.href) : toast.info(action.label + ' (mock)')"
              >
                <span>{{ action.label }}</span>
                <ChevronRight class="text-muted-foreground group-hover:text-foreground size-4 transition-colors" />
              </button>
            </div>
          </div>
          <Separator />
          <div class="space-y-2 px-5 py-4">
            <p class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Reply</p>
            <div class="bg-card focus-within:ring-ring/40 overflow-hidden rounded-xl border transition-shadow focus-within:ring-2">
              <Textarea
                v-model="reply"
                rows="3"
                placeholder="Type a quick reply…"
                class="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <div class="bg-muted/20 flex items-center justify-end gap-2 border-t px-3 py-2">
                <Button variant="ghost" size="sm" :disabled="!reply" @click="reply = ''">Discard</Button>
                <Button size="sm" :disabled="!reply.trim()" @click="sendReply">
                  <Reply class="mr-2 size-3.5" />Send
                </Button>
              </div>
            </div>
            <p class="text-muted-foreground/70 text-xs">Replies are sent to the original sender via system email.</p>
          </div>
        </template>
        <div v-else class="grid h-full place-items-center px-6">
          <EmptyState
            :icon="InboxIcon"
            title="No notification selected"
            description="Pick one from the list to read it."
          />
        </div>
      </section>
    </div>
  </div>
</template>
