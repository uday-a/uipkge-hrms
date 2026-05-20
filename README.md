# uipkge HRMS

A reference **HRMS** (Human Resource Management System) template built end-to-end on
the [uipkge](https://uipkge.dev) UI registry. It is a polished, realistic consumer of
the registry's primitives and blocks — not a real product. **Mock data, mock auth, no
backend.** Every page is a copy-paste starting point for a real HR app.

- **Framework:** Nuxt 4 + Vue 3 (Composition API, `<script setup>`)
- **UI:** shadcn-vue primitives from the `@uipkge` registry, on Reka UI
- **Styling:** Tailwind v4 with OKLCH design tokens
- **Charts:** ECharts via `vue-echarts`
- **Tables:** TanStack Table (`@tanstack/vue-table`)
- **State:** `useState` + composables (no Pinia — see [Notes](#notes--constraints))

---

## Quick start

```bash
nvm use            # Node version from .nvmrc
npm install
npm run dev        # http://localhost:3330
```

| Script             | What it does                                  |
| ------------------ | --------------------------------------------- |
| `npm run dev`      | Dev server on port **3330**                   |
| `npm run build`    | Production server build (`.output/`)          |
| `npm run generate` | Static prerender (`.output/public/`)          |
| `npm run preview`  | Preview the production build locally          |

Deploy the output of `npm run generate` to any static host, or the `npm run build`
output to any Nitro-compatible Node host.

---

## Features

### Personas & access control

The demo's main interactive variable. Three personas gate what you see:

| Persona      | Sees                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| **Admin**    | Everything — all data, compensation, org settings, API keys, *Add employee* (default in demo)         |
| **Manager**  | Team data, approvals queue, recruiting pipeline, headcount analytics, team review/time-off tabs        |
| **Employee** | Own profile, own time-off, own reviews, comms (inbox / chat / assistant) only                          |

Switch persona from the **profile menu in the topbar**. The selection persists in
`localStorage`, the sidebar nav reflows, and table columns / tabs / cards show or hide
to match. Privileged routes are guarded by client-side middleware
(`require-admin`, `require-manager`) and bounce to `/403` when the persona is too low.

### Pages

| Route                   | Access     | What it does                                                                                                                              |
| ----------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `/dashboard`            | all        | Home. KPI tiles (headcount, attrition, tenure, open reqs), hiring funnel, department donut, 12-month headcount trend, out-of-office today, recent hires, activity feed. Live clock + timezone picker + keyboard-shortcut help. |
| `/people`               | all        | Employee directory. TanStack data table (60 employees) with sortable columns, multi-column filter sheet, bulk actions. Salary column admin-only. KPI band. |
| `/people/[id]`          | all        | Employee profile. Hero strip + KPI tiles + tabs (Overview / Time-off / Compensation [admin] / Documents / Activity). Manager + direct reports. |
| `/people/new`           | **admin**  | Add-employee wizard. 4-step stepper: Personal → Role → Comp & start → Review.                                                            |
| `/time-off`             | all        | Tabs: My requests / Team requests (manager+) / Calendar. KPI band, inline approve/reject, 4-week leave calendar strip.                   |
| `/reviews`              | all        | Tabs: My reviews / Team (manager+) / Calibration (admin). Self-review form in a sheet, peer requests, dept×rating calibration heatmap.   |
| `/recruiting`           | **manager+** | Kanban hiring pipeline. 5 lanes (Applied → Hired), requisition filter, candidate detail sheet, KPI tiles (time-to-hire, offer accept %). |
| `/analytics/headcount`  | **manager+** | Headcount analytics. KPI tiles, 12-month trend, department / location / tenure breakdowns, attrition reasons, period filters, CSV export (mock). |
| `/inbox`                | all        | 3-pane notification stream. Folder filters, 12+ notification types, detail pane with reply composer, unread/starred state.               |
| `/chat`                 | all        | 2-pane direct messaging. Thread list with presence + unread counts, date-grouped messages, auto-growing composer.                       |
| `/assistant`            | all        | HR assistant chat surface (mock conversational UI).                                                                                      |
| `/settings`             | all        | Tabs: Profile / Appearance / Notifications / Security / Integrations / Organization (admin). Theme + density controls wired live; rest toast-only. |
| `/onboarding-tour`      | all        | 5-screen welcome carousel for new hires (full-viewport, keyboard nav, `localStorage` dismissal).                                         |
| `/auth/sign-in`         | public     | Mock sign-in. Email/password + SSO buttons + "continue as persona" picker. No real auth.                                                 |
| `/403`                  | all        | Permission-denied page shown when a persona hits a guarded route.                                                                        |
| `/`                     | —          | Redirects to `/dashboard`.                                                                                                               |

### Cross-cutting UX

- **Keyboard shortcuts** — Vim-style chord navigation (`g d`, `g p`, `g t`, `g r`, `g i`, `g s`, `g a`) and `/` to open the command palette. `?` shows the help popover.
- **Command palette** — global search across pages and employees (`/` or ⌘K).
- **Theme** — light / dark / system, stored in a cookie so SSR renders the right colors with no flash.
- **Timezone picker** — PT / CT / ET / UTC presets; re-renders the dashboard clock, activity feed timestamps, and footer label.
- **Animated KPIs** — count-up number ramps run in lockstep across each KPI band, with skeleton → real transitions and `prefers-reduced-motion` support.
- **Charts** — area, bar, pie, and smooth-funnel charts (ECharts) driven by OKLCH theme tokens, with print-friendly text fallbacks.
- **Toasts** — every mock mutation confirms via `vue-sonner`.

---

## Project structure

```
app/
  pages/            16 routes (file-based)
  layouts/          single default layout (Sidebar + Topbar chrome)
  middleware/       require-admin, require-manager (client-only persona guards)
  components/
    ui/             @uipkge registry primitives (button, card, data-table, board, charts, …)
    blocks/         composed blocks (sidebar-02, command palette, profile menu, quick actions, …)
    nav/            AppTopbar, AppBreadcrumb
  composables/      usePersona, useTheme, useTimeZone, useNow, useCountUp, useBoard, …
  mocks/            hand-built mock data (people, time-off, recruiting, reviews, inbox, chat, …)
  lib/nav.ts        sidebar nav tree — single source of truth for nav + breadcrumbs
server/plugins/     theme cookie SSR plugin
docs/               design plan
```

---

## Registry usage

Every UI primitive comes from the uipkge registry — **no bespoke primitives** live in
this repo. If a page needs something the registry doesn't have, the right move is to
propose the primitive upstream in uipkge first, then pull it here:

```bash
npx shadcn-vue@latest add @uipkge/<name> -y
```

The bootstrap tokens, theme, and `cn()` utility came from `@uipkge/init`. Registry
config lives in `components.json`; `@uipkge` resolves to `https://uipkge.dev/r/{name}.json`.

---

## Notes & constraints

- **Mock-only.** No backend, no database, no real authentication. All "saves" are
  optimistic toasts.
- **Mock data is hand-built** (`app/mocks/*.ts`) — no `Math.random`, `faker`, or
  `Date.now()` at module scope, because the dashboard prerenders and SSR/client markup
  must match.
- **State** uses `useState` + composables. Pinia is intentionally not wired (it tripped
  an SSR error in the original deployment target).
- **Theme** lives in a cookie; **persona** lives in `localStorage` (server uses an
  `admin` sentinel, client hydrates). Route guards are client-only.
- Single layout wraps every page in `SidebarProvider` + sidebar + topbar; auth and
  onboarding pages opt out with `definePageMeta({ layout: false })`.

---

## License

[MIT](./LICENSE)
