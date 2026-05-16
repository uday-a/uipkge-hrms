<script setup lang="ts">
/**
 * HRMS sidebar — sidebar-02 block from the uipkge registry, adapted to
 * this template's persona-aware nav.
 *
 * What the registry shipped:
 *   - Sidebar (collapsible="icon") + SidebarRail
 *   - TeamSwitcher / NavMain / NavProjects / NavSecondary / NavUser
 *   - Demo data (Playground / Models / Documentation / Settings)
 *
 * What we kept:
 *   - `Sidebar collapsible="icon"` -- gives us icon-only collapse w/
 *     tooltips, the big UX upgrade over the previous flat sidebar
 *   - `NavUser` block -- reuses its avatar + dropdown shape, fed Marcus
 *     Rivera as the canonical demo "me"
 *   - `SidebarRail` -- the click-strip on the inside edge that toggles
 *     collapse
 *
 * What we replaced:
 *   - TeamSwitcher -> HRMS brand mark (gradient "h" tile + name/tagline)
 *   - NavMain / NavProjects / NavSecondary -> 8 SidebarGroup blocks driven
 *     by `navForPersona(persona)` so the sidebar reflows when the topbar
 *     persona switcher fires
 *
 * Active-state highlight is the same registry pattern (`:is-active=`); the
 * left-edge accent bar is preserved via the `data-[active=true]:before:*`
 * utilities. Each menu button gets `:tooltip=` so icon-collapsed users
 * still see the label.
 */
import { computed } from 'vue'
import * as icons from 'lucide-vue-next'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { OverlayScroll } from '@/components/ui/overlay-scroll'
import NavUser from './NavUser.vue'
import { navForPersona } from '~/lib/nav'

const { current: persona } = usePersona()
const route = useRoute()

const sections = computed(() => navForPersona(persona.value))

function iconFor(name?: string) {
  if (!name) return null
  return (icons as Record<string, any>)[name] ?? null
}

// Canonical "me" for the demo. Single source so every persona renders
// the same avatar without forking SSR/client.
const ME = {
  name: 'Marcus Rivera',
  email: 'marcus.rivera@uipkge-hrms.dev',
}
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <NuxtLink to="/dashboard" class="flex items-center gap-2.5 px-2 py-1.5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
        <svg viewBox="0 0 324 324" class="size-7 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Nuxt">
          <path d="M181.767 270H302.211C306.037 270 309.795 269.003 313.108 267.107C316.421 265.211 319.172 262.484 321.084 259.2C322.996 255.915 324.002 252.19 324 248.399C323.998 244.607 322.989 240.883 321.074 237.601L240.187 98.7439C238.275 95.4607 235.525 92.7342 232.213 90.8385C228.901 88.9429 225.143 87.9449 221.318 87.9449C217.494 87.9449 213.736 88.9429 210.424 90.8385C207.112 92.7342 204.361 95.4607 202.449 98.7439L181.767 134.272L141.329 64.7975C139.416 61.5145 136.664 58.7884 133.351 56.8931C130.038 54.9978 126.28 54 122.454 54C118.629 54 114.871 54.9978 111.558 56.8931C108.245 58.7884 105.493 61.5145 103.58 64.7975L2.92554 237.601C1.01067 240.883 0.00166657 244.607 2.06272e-06 248.399C-0.00166244 252.19 1.00407 255.915 2.91605 259.2C4.82803 262.484 7.57884 265.211 10.8918 267.107C14.2047 269.003 17.963 270 21.7886 270H97.3936C127.349 270 149.44 256.959 164.641 231.517L201.546 168.172L221.313 134.272L280.637 236.1H201.546L181.767 270ZM96.1611 236.065L43.3984 236.054L122.49 100.291L161.953 168.172L135.531 213.543C125.436 230.051 113.968 236.065 96.1611 236.065Z" fill="#00DC82" />
        </svg>
        <div class="flex flex-col leading-tight min-w-0 group-data-[collapsible=icon]:hidden">
          <span class="text-sm font-bold tracking-tight">HRMS</span>
          <span class="text-muted-foreground text-xs tracking-wide">Powered by uipkge</span>
        </div>
      </NuxtLink>
    </SidebarHeader>

    <!-- SidebarContent ships `overflow-auto` which paints a native
         scrollbar gutter when the nav list exceeds viewport height —
         on short windows that causes the sidebar to shift as items
         appear/disappear. Override to `overflow-visible` and let
         `OverlayScroll` (Slack-style hidden-native + auto-fading
         custom thumb) handle the scroll instead, matching the activity
         feed on the dashboard. -->
    <SidebarContent class="gap-1 overflow-visible group-data-[collapsible=icon]:overflow-hidden">
      <OverlayScroll class="flex-1 min-h-0">
      <SidebarGroup v-for="section in sections" :key="section.label" class="py-1">
        <SidebarGroupLabel class="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 px-2">
          {{ section.label }}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in section.items" :key="item.to">
              <SidebarMenuButton
                :is-active="route.path === item.to"
                as-child
                :tooltip="item.label"
                class="relative data-[active=true]:bg-muted/80 data-[active=true]:font-semibold data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1.5 data-[active=true]:before:bottom-1.5 data-[active=true]:before:w-0.5 data-[active=true]:before:rounded-r-full data-[active=true]:before:bg-primary"
              >
                <NuxtLink :to="item.to">
                  <component :is="iconFor(item.icon)" v-if="iconFor(item.icon)" class="size-4 shrink-0" />
                  <span>{{ item.label }}</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      </OverlayScroll>
    </SidebarContent>

    <SidebarFooter>
      <NavUser :user="ME" />
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>
