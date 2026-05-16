<script setup lang="ts">
/**
 * Top bar: sidebar toggle + breadcrumb + global search trigger +
 * notifications bell + user menu (with persona switcher).
 *
 * Search is a placeholder for the cmd-k command palette block.
 */
import { Bell, Settings, LogOut } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Persona } from '~/composables/usePersona'
import { PERSONA_LABELS } from '~/composables/usePersona'
import { INBOX_ITEMS } from '~/mocks/inbox'
import { navForPersona } from '~/lib/nav'
import type { CommandPaletteGroup, CommandPaletteItem } from '~/components/blocks/CommandPalette.vue'

const { current: persona, set: setPersona } = usePersona()

// Live unread count drives the bell badge. Reading the mock directly
// keeps the topbar in sync with the inbox without a global store --
// real consumers swap to a notifications API.
const unreadCount = computed(() => INBOX_ITEMS.filter((i) => i.unread).length)

// Cmd-K palette groups: persona-filtered nav tree → CommandPalette shape.
// `onSelect` does the actual navigation so the block stays pure-UI.
const paletteGroups = computed<CommandPaletteGroup[]>(() =>
  navForPersona(persona.value).map((section) => ({
    heading: section.label,
    items: section.items
      .filter((i) => i.to)
      .map((i): CommandPaletteItem => ({
        label: i.label,
        hint: i.to,
        onSelect: () => navigateTo(i.to!),
      })),
  })),
)
</script>

<template>
  <header class="bg-background/95 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
    <SidebarTrigger />
    <Separator orientation="vertical" class="h-5" />
    <div class="flex-1 min-w-0">
      <AppBreadcrumb />
    </div>

    <!-- Cmd-K command palette. The block ships its own trigger button +
         ⌘K hotkey listener; AppTopbar just passes the persona-aware
         nav as groups. -->
    <CommandPalette :groups="paletteGroups" trigger-label="Search…" placeholder="Jump to…" />

    <!-- Notifications bell with count badge. Routes to /inbox on click. -->
    <NuxtLink to="/inbox" class="relative">
      <Button variant="ghost" size="icon" class="size-9" aria-label="Notifications">
        <Bell class="size-4" />
      </Button>
      <span
        v-if="unreadCount > 0"
        class="bg-destructive text-destructive-foreground pointer-events-none absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs font-bold tabular-nums ring-2 ring-background"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </NuxtLink>

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" size="icon" class="size-9 rounded-full" aria-label="User menu">
          <Avatar class="size-8 ring-1 ring-border">
            <AvatarFallback class="text-xs font-semibold">MR</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-60">
        <DropdownMenuLabel class="font-normal">
          <div class="flex items-center gap-2.5">
            <Avatar class="size-9">
              <AvatarFallback class="text-xs font-semibold">MR</AvatarFallback>
            </Avatar>
            <div class="min-w-0">
              <p class="text-sm font-semibold truncate">Marcus Rivera</p>
              <p class="text-muted-foreground truncate text-xs">marcus@uipkge-hrms.dev</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel class="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
          View as
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          :model-value="persona"
          @update:model-value="(v) => setPersona(v as Persona)"
        >
          <DropdownMenuRadioItem
            v-for="key in (['admin', 'manager', 'employee'] as Persona[])"
            :key="key"
            :value="key"
            class="capitalize"
          >
            {{ PERSONA_LABELS[key] }}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem as-child>
          <NuxtLink to="/settings" class="flex items-center gap-2 cursor-pointer">
            <Settings class="size-3.5" />Settings
          </NuxtLink>
        </DropdownMenuItem>
        <DropdownMenuItem disabled class="flex items-center gap-2">
          <LogOut class="size-3.5" />Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </header>
</template>
