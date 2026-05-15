# uipkge-hrms v2 — clean-slate template plan

**Date:** 2026-05-18
**Status:** Plan only (no code)
**Author:** Claude Opus 4.7 (1M)

## TL;DR

Scrap the current HRMS reference app and rebuild it as the canonical
"this is what shipping with uipkge looks like" template. The goal isn't
a real HRMS product — it's a polished consumer of every primitive + every
block in the registry, with realistic data and working flows. Ship it
in two phases: a 15-page MVP that proves the loop end-to-end, then a 30+
page expansion that fills out the long tail.

The current HRMS (12 routes, mostly placeholder) under-uses the registry
and predates ~40 new components and blocks. A scratch rebuild is faster
than patching it.

## Why scrap

1. **Predates the registry's growth.** Built when uipkge had ~40 items; we
   ship 167 today (82 primitives + 44 blocks + 23 charts + 18 bootstrap).
   Whole feature areas are absent: chat, inbox, AI assistant, kanban,
   timeline, segmented-gauge, smooth-funnel, header-filter data-table,
   richer form primitives.
2. **Layout pattern shifted.** New canonical chrome: `dashboard-layout`
   + `sidebar-01..07` + `page-toolbar` (planned). Current HRMS predates
   this surface.
3. **Demo quality bar moved.** The registry-site dogfooding lifted
   every chart demo to 5+ stories. HRMS is the natural place to show
   what those primitives look like *in context*, with real data shapes.
4. **Cheaper to rewrite than refactor.** The current app is small
   (12 routes, ~2k LOC). Touching every page to swap primitives + add
   missing flows would take longer than a clean rebuild.

## Goals

- Cover every primitive at least once, every block at least once.
- 30+ pages, each useful enough to read top-to-bottom as a reference for
  one HR sub-domain.
- Real-shape mock data: 200+ employees, 50+ time-off requests, 12 review
  cycles, full payroll history. Not "Lorem Employee 1 / Employee 2."
- Every list page has working filters, sort, pagination.
- Every form has Zod validation + success/error toasts.
- Dark + light mode both work end-to-end.
- Responsive (sidebar collapses, tables → cards on mobile).
- Deployable to Cloudflare Pages with `npm run deploy`.
- Performance budget: TTI < 2s on dashboard with all charts rendering.

## What makes a "decent template"

The checklist a reviewer (or a prospective adopter) would hold this to:

1. **Real data shapes.** Looks like real HR data; field shapes match
   what a buyer's data model would have (employee_id, manager_id,
   department_id, salary_band, etc.) — not just names + roles.
2. **Working interactions.** Buttons do something (mock handlers). Forms
   submit (return optimistic state). State persists in localStorage so
   refresh doesn't wipe the demo.
3. **Real routing.** Each page has its own URL. Back/forward works.
   Deep links resolve. No SPA-only navigation that breaks reloads.
4. **Accessibility.** Tab order is correct on every page. Focus rings
   visible. ARIA labels on every icon-only button. Color-contrast
   passes WCAG AA on both themes.
5. **Responsive.** Two breakpoints minimum: lg (1024px+) full chrome,
   md (768px+) collapsed sidebar, sm (<768px) tables → cards, drawer
   nav. No horizontal-scroll body.
6. **Loading states everywhere.** Skeleton for every async surface.
   Charts have placeholder rectangles. Tables have N skeleton rows.
   No layout shift when real data lands.
7. **Empty states.** "No employees yet" / "No payroll runs" / "No
   pending approvals" — each list page has one, with an illustration
   and CTA pointing at the create flow.
8. **Error states.** 404 + 500 pages using `centered-message-page`.
   Form-level + field-level errors with sensible recovery.
9. **i18n hooks.** Strings extracted to one source per page (no
   inline copy). Even though we ship English-only, a future translator
   only has one file per route to touch.
10. **Permission gates.** Three personas (Admin / Manager / Employee)
    with route-level + component-level guards. Switching persona in
    settings re-renders the right surfaces.
11. **Global search.** Cmd-K opens a command palette searching
    people / docs / tickets / pages. Already shipped as a block.
12. **Sortable + filterable + paginated lists.** Every list page uses
    `data-table` with the new per-column header filters.
13. **Print-friendly.** Payslips / offers / contracts have a print
    stylesheet so they look right via Cmd-P.
14. **Code quality.** Page = one file, components extracted only when
    reused twice. Pinia stores by domain (people, payroll, etc.).
    Comments on non-obvious bits (timezone handling, currency formatting).
15. **README.** Top-level doc explaining: how to add a route, how to
    swap a primitive, how to wire to a real API, how to extend the
    permission model.

## Pages (target surface)

### Phase 1 — MVP (15 pages)

Picks one representative page per HR sub-domain so the loop is closed
end-to-end before going broad.

| # | Route | Purpose | Primary registry items |
|---|---|---|---|
| 1 | `/dashboard` | Day-one home for current user (3 KPI tiles, hiring funnel, activity feed, quick actions) | `kpi-grid`, `metrics-grid`, `smooth-funnel`, `segmented-gauge`, `timeline` (day-grouped activity), `quick-actions`, `area-chart` |
| 2 | `/people` | Employees list | `data-table` w/ header filters, `avatar`, `badge`, `sparkline`, `advance-select`, `command-palette` |
| 3 | `/people/[id]` | Employee profile (header + 4 tabs) | `profile-menu`, `vertical-tabs`, `card`, `data-list`, `labeled-value`, `timeline`, `progress-breakdown` |
| 4 | `/people/new` | Add-employee wizard (5 steps) | `stepper`, `form`, `file-upload`, `pin-input`, `switch`, `selectable-card-radio` (planned), `done-confirmation-step` |
| 5 | `/time-off` | Calendar view + pending requests | `event-calendar`, `data-table`, `badge`, `range-calendar`, `sheet` |
| 6 | `/reviews` | Review cycle list + detail sheet | `data-table` (header filters), `sheet`, `rich-text-editor`, `rating`, `progress` |
| 7 | `/recruiting` | Candidates pipeline | `kanban-board`, `avatar`, `badge`, `tour` (first-time hint) |
| 8 | `/inbox` | HR inbox (announcements, requests) | `inbox` block |
| 9 | `/chat` | HR ↔ employee chat | `chat-two-pane` block |
| 10 | `/assistant` | AI assistant for policy lookups | `ai-llm-chat` block |
| 11 | `/analytics/headcount` | Headcount dashboard | `bar-chart`, `area-chart`, `kpi-grid`, `segmented-gauge`, `treemap-chart` |
| 12 | `/settings` | Org settings | `form`, `toggle-setting-list`, `theme-customize`, `tabs`, `color-picker` |
| 13 | `/auth/sign-in` | Sign-in (mock) | `auth-sign-in` block |
| 14 | `/onboarding-tour` | First-launch tour overlay | `tour` (6-step variant), `centered-message-page` (welcome step) |
| 15 | `/404` + `/500` | Error pages | `centered-message-page` |

### Phase 2 — Expansion (30+ pages)

Adds the long tail that makes the template feel like a real product.

**Time & attendance**
- `/time-off/[id]` — request detail + approval thread
- `/time-tracking` — clock in/out + week view
- `/holidays` — company holiday calendar
- `/approvals` — manager-level approval queue (multi-domain)

**Performance**
- `/reviews/[id]` — review form (multi-section)
- `/goals` — OKRs list + tree
- `/one-on-ones` — 1:1 notes (rich-text + history)
- `/feedback` — 360 feedback flow

**Recruiting (ATS)**
- `/recruiting/jobs` — open job listings
- `/recruiting/jobs/[id]` — job detail + applicants
- `/recruiting/candidates/[id]` — candidate profile w/ scorecards
- `/recruiting/interviews` — interview schedule
- `/recruiting/offers` — offer letter generator

**Payroll & comp**
- `/payroll` — payroll runs
- `/payroll/[id]` — pay run detail + line items
- `/payroll/payslips` — employee payslip history
- `/payroll/payslips/[id]` — printable payslip
- `/comp/salary-bands` — salary band table
- `/comp/equity` — equity grants table

**Learning**
- `/learning` — course catalog
- `/learning/[id]` — course player (lessons + progress)
- `/learning/certifications` — completed certifications list

**Documents & policies**
- `/documents` — file manager (use `file-manager` block when shipped)
- `/policies` — policy library w/ search
- `/contracts/[id]` — e-sign flow (multi-step + signature pad)

**Help desk**
- `/tickets` — ticket list (data-table)
- `/tickets/[id]` — ticket thread (`conversation-thread` pattern)
- `/knowledge-base` — articles + search

**Analytics**
- `/analytics/hiring` — hiring funnel + cohort retention
- `/analytics/attrition` — attrition trends + heatmap
- `/analytics/diversity` — diversity dashboard (pie + treemap)
- `/analytics/compensation` — comp band visualization (boxplot)

**Engagement**
- `/recognition` — recognition feed (timeline + reactions)
- `/anniversaries` — work anniversaries + birthdays
- `/surveys` — pulse survey templates
- `/surveys/[id]` — survey detail + results

**Admin**
- `/settings/roles` — role + permission matrix
- `/settings/audit-log` — audit log (timeline)
- `/settings/api-keys` — API keys management
- `/settings/integrations` — integrations directory
- `/settings/billing` — subscription + invoices
- `/me` — current user profile + preferences

## Registry coverage matrix

Goal: every registry item appears in at least one page. This is the
acceptance criterion for "decent template" goal #1.

### Primitives (82 of 82 covered)

| Category | Items | Where used |
|---|---|---|
| **Action** | button, toggle, toggle-group, theme-switch | Every page (button), settings (toggle group), header (theme-switch) |
| **Form** | input, label, form, textarea, checkbox, switch, radio-group, select, advance-select, file-upload, date-picker, time-picker, range-calendar, color-picker, masked-input, slider, range-slider, number-field, knob, mentions, tags-input, pin-input | New-employee wizard, time-off form, settings, payroll line edit |
| **Data display** | avatar, badge, chip, card, table, data-table, data-list, list, labeled-value, virtual-list, lazy-image, code-block, icons, icon-box, kpi-grid, payment-card, rating, qr-code, calendar | People profile, employee directory, dashboard |
| **Feedback** | alert, alert-modal, empty-state, progress, progress-item, progress-linear, spinner, sonner, icon-transition | Approvals, payroll runs, anywhere errors surface |
| **Overlay** | dialog, sheet, popover, dropdown-menu, context-menu, hover-card, command | Add-employee modal, time-off detail sheet, command palette |
| **Navigation** | breadcrumb, pagination, menubar, navigation-menu | Every page chrome |
| **Disclosure** | accordion, collapsible | FAQ in policies, optional sections in reviews |
| **Layout** | grid, aspect-ratio, page, scroll-area, separator, sidebar, resizable, anchor, section-card | Page shells, dashboard layout |
| **Date / time** | calendar, range-calendar, date-picker, time-picker | Time-off, interview scheduling |
| **Tour** | tour | First-launch + recruiting onboarding |
| **Tabs** | tabs, vertical-tabs | Employee profile, settings, reviews |
| **Stepper** | stepper | New-employee, e-sign, onboarding |
| **Rich text** | rich-text-editor | 1:1 notes, review feedback, policy editor |
| **Timeline** | timeline | Activity feed, candidate progress, audit log |
| **Trees / hierarchy** | tree-view | Org chart sidebar, doc folders |
| **Overflow** | overlay-scroll, scroll-area | Tables on small viewport |
| **Charts** (23) | all chart wrappers | Analytics pages + dashboard sparklines |

### Blocks (44 of 44 covered)

| Block | Where used |
|---|---|
| `dashboard-layout` | Site chrome on every authed page |
| `sidebar-01..07` | Sidebar variants showcased on theming page |
| `header-01`, `footer-01` | Public marketing pages (about, careers) |
| `auth-sign-in`, `auth-sign-up`, `auth-mfa`, `auth-password-reset` | Auth flow |
| `login-01`, `login-02`, `register-01` | Auth variants in /auth-variants showcase page |
| `inbox` | `/inbox` |
| `chat-thread`, `chat-two-pane` | `/chat` (one variant on direct messages, one on team channels) |
| `ai-llm-chat` | `/assistant` |
| `kanban-board` | `/recruiting` candidate pipeline |
| `event-calendar`, `event-list` | `/time-off`, `/holidays` |
| `command-palette` | Cmd-K from anywhere |
| `notifications-popover` | Header bell |
| `profile-menu` | Header user dropdown |
| `quick-actions` | Dashboard tile |
| `payment-form`, `saved-cards-list`, `checkout-flow` | `/settings/billing` |
| `pricing-01` | `/about/pricing` (when promoting an upgrade) |
| `hero-01`, `cta-01`, `features-01`, `faq-01` | Marketing pages |
| `logos-01/02/03`, `testimonials-01` | Marketing pages |
| `metrics-grid`, `analytics-overview`, `cost-breakdown`, `progress-breakdown`, `kpi-grid` | Analytics pages + dashboard |
| `theme-customize` | `/settings/theming` |
| `toggle-setting-list` | `/settings/notifications` |
| `bento-01` | Marketing landing |
| `contact-01` | `/help/contact` |

### Bootstrap (18 of 18)

`init`, `tailwind`, `utils`, `use-theme`, `use-month-grid`, `use-kanban`,
all the chart-theme bootstrap files. Installed via the single
`@uipkge/init` command at template setup. No separate page needed —
just verified by `npm install` working clean.

## Information architecture

### Sidebar nav (left rail, persistent on lg+)

```
HOME
  Dashboard

PEOPLE
  Directory
  Org chart
  My team           (managers only)

TIME
  Time-off
  Time tracking
  Holidays
  Approvals queue   (managers only)

PERFORMANCE
  Reviews
  Goals
  1:1 notes
  Feedback

RECRUITING
  Jobs
  Candidates
  Interviews
  Offers

PAYROLL & COMP
  Pay runs
  My payslips
  Salary bands     (admin only)
  Equity           (admin only)

LEARNING
  Catalog
  My courses
  Certifications

COMMUNICATION
  Inbox
  Chat
  Assistant
  Announcements

ANALYTICS         (admin / manager)
  Headcount
  Hiring funnel
  Attrition
  Diversity
  Compensation

ADMIN             (admin only)
  Documents
  Tickets
  Knowledge base
  Roles & permissions
  Audit log
  API keys
  Integrations
  Billing
  Theming
```

Sidebar adapts to permission level. Section headers persist; visible
item count adjusts.

### Top bar (every page)

- Sidebar toggle (mobile)
- Breadcrumb (current page hierarchy)
- Search (Cmd-K)
- Notifications bell (`notifications-popover`)
- Help (drawer or popover)
- Theme switch
- Profile dropdown (`profile-menu`)

### Right rail (on detail pages)

- Page sub-nav (anchor links to sections)
- Related actions
- Recent activity (mini timeline)

## Personas + permission model

Three personas covers HRMS spectrum without spiraling:

| Persona | Sees |
|---|---|
| **Admin** | Everything. Default in demo. |
| **Manager** | Direct reports only in People; approvals queue active; payroll viewable not editable; analytics for their team. |
| **Employee** | Own profile, own time-off, own goals, own payslips, inbox, chat, assistant. No team data. No analytics. |

Switching persona is a no-friction toggle in `/settings/persona`
(demo-only — not a real auth concept). Re-renders the sidebar +
strips/adds routes.

Permission gates are implemented in two layers:

1. **Route-level** — middleware checks `persona` in Pinia, redirects to
   `/403` if not allowed.
2. **Component-level** — `<RequireRole role="admin">` wrapper. Hides
   actions like "Terminate employee," "Edit pay run."

## Mock data layer

No real backend. Mock data lives in `app/mocks/`:

- `employees.json` — 247 employees with realistic shapes
- `time-off.json` — 12 months of requests across cohorts
- `payroll.json` — 12 monthly pay runs
- `reviews.json` — 2 review cycles with mix of statuses
- `candidates.json` — 80 candidates across funnel stages
- `tickets.json` — open + resolved tickets
- `policies.json` — 20 policy documents

Reads via Pinia stores. Writes apply to in-memory store + persist a diff
to localStorage. Reset button in `/settings/reset` wipes localStorage
and re-seeds.

Each store has an artificial latency knob (`/settings/latency`) so we
can demonstrate skeleton states with `await sleep(800)` before resolving.

## Design system

### Tokens

Inherit from `@uipkge/tailwind` (OKLCH tokens, fonts: DM Sans + Anybody).
No app-level token forks. If we need a new token, propose it upstream
into the registry — this is the dogfood test.

### Density

App default: cozy (`density="cozy"` on data-table primitives).
Provide a `/settings/display` toggle for compact / cozy / comfortable
that persists per user.

### Iconography

Lucide-vue-next only. No custom SVGs unless they're domain illustrations
(empty states, 404). Maintain a `app/icons/` directory mapping HR
concepts to Lucide icons so swaps are centralized.

### Motion

`prefers-reduced-motion` respected globally. Defaults:
- Sidebar slide: 200ms ease-out
- Sheet open: 250ms ease-out
- Tab change: 150ms ease-out
- Page transition: none (use Nuxt's `pageTransition: false`)
- Skeleton pulse: 1.5s infinite
- Tooltips: 100ms in, 200ms out

### Empty / error / loading patterns

| State | Convention |
|---|---|
| Loading | `Skeleton` matching the final layout. Same dimensions. |
| Empty | `empty-state` block with illustration + 1 primary CTA |
| Error | `Alert variant="destructive"` for inline; `centered-message-page` for fatal |
| No permission | `centered-message-page` variant with 403 illustration |

## Tech stack

- **Framework:** Nuxt 4 (single-page mode + static prerender for public routes)
- **CSS:** Tailwind v4 + `@uipkge/tailwind` tokens
- **Components:** 100% from `@uipkge/*` registry via `npx shadcn-vue add`. No bespoke primitives in the template.
- **State:** Pinia stores by domain
- **Forms:** `vee-validate` + `zod` (also used by `form` primitive)
- **Routing:** Nuxt's file-based router
- **Tables:** `@tanstack/vue-table` via `@uipkge/data-table`
- **Charts:** ECharts via `@uipkge/charts` meta-bundle
- **Date:** `@internationalized/date` (same as registry)
- **Search:** Local filter via Pinia; Cmd-K via `@uipkge/command-palette`
- **Theming:** `@uipkge/use-theme` composable
- **Persistence:** `@vueuse/integrations/useLocalStorage`
- **Deploy:** Cloudflare Pages via `wrangler` (same pattern as registry-site)

## Project structure

```
uipkge-hrms/
├── app/
│   ├── pages/
│   │   ├── index.vue                  -> redirect to /dashboard
│   │   ├── dashboard.vue
│   │   ├── people/
│   │   │   ├── index.vue
│   │   │   ├── [id]/
│   │   │   │   ├── index.vue          (Overview tab)
│   │   │   │   ├── documents.vue
│   │   │   │   ├── time-off.vue
│   │   │   │   └── performance.vue
│   │   │   └── new.vue
│   │   ├── time-off/
│   │   ├── reviews/
│   │   ├── recruiting/
│   │   ├── payroll/
│   │   ├── analytics/
│   │   ├── settings/
│   │   ├── inbox.vue
│   │   ├── chat.vue
│   │   ├── assistant.vue
│   │   └── auth/
│   ├── components/
│   │   ├── nav/
│   │   │   ├── AppSidebar.vue
│   │   │   ├── AppTopbar.vue
│   │   │   └── AppBreadcrumb.vue
│   │   ├── people/
│   │   │   ├── EmployeeHeroCard.vue
│   │   │   ├── EmployeeTabsLayout.vue
│   │   │   └── …
│   │   ├── time-off/
│   │   ├── reviews/
│   │   ├── recruiting/
│   │   └── ui/                       (mirrors registry install targets)
│   ├── stores/
│   │   ├── people.ts
│   │   ├── time-off.ts
│   │   ├── reviews.ts
│   │   ├── payroll.ts
│   │   └── persona.ts
│   ├── composables/
│   │   ├── usePersona.ts
│   │   ├── useLatency.ts
│   │   └── useThemeOverride.ts
│   ├── mocks/
│   │   ├── employees.json
│   │   ├── …
│   ├── lib/
│   │   ├── format.ts                 (currency, date, percent)
│   │   ├── permissions.ts
│   │   └── seed.ts                   (re-seeds localStorage from JSON)
│   ├── icons/
│   │   └── domain.ts                 (Lucide -> HR concept map)
│   └── assets/
│       └── css/
│           └── main.css              (just `@import "tailwindcss";`)
├── public/
├── components.json
├── nuxt.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Phases / milestones

### Phase 0 — Setup (1 session)

- Init Nuxt 4 project at `uipkge-hrms/` (new repo)
- Run `npx shadcn-vue add @uipkge/init` to wire tokens + theming
- Install required primitives (one command per group)
- Stand up `AppSidebar` + `AppTopbar` skeleton
- Seed routes for the 15 MVP pages with placeholder `<EmptyState>` content
- CF Pages project + wrangler config
- README skeleton

**Exit criterion:** Clean `npm run dev`, sidebar nav clickable, all 15 routes resolve.

### Phase 1 — MVP (estimated 5–8 sessions)

Build the 15 MVP pages to "looks production-ready" quality. Order:

1. Dashboard (proves the layout works with all chart primitives)
2. People list (data-table header filters in real consumer code)
3. Employee profile (tabs + sheet + timeline)
4. Time-off (event-calendar + data-table)
5. Inbox / chat / assistant (validates 3 chat blocks work in a real app)
6. Reviews (sheet detail pattern)
7. Recruiting kanban (kanban-board in real consumer)
8. Headcount analytics (chart density check)
9. Settings (form + toggle-setting-list)
10. Onboarding wizard (stepper)
11. Add employee (multi-section form)
12. Auth sign-in (auth block consumer test)
13. Onboarding tour (tour primitive in real consumer)
14. 404 / 500 (centered-message-page)
15. Mock-data seeding + persona toggle

**Exit criterion:** Every MVP page passes the "decent template" checklist
items 1-15. Deployed to `uipkge-hrms.pages.dev`.

### Phase 2 — Expansion (estimated 10+ sessions)

Add the long tail in priority order:

1. Recruiting depth (jobs, candidates, interviews, offers)
2. Payroll depth (runs, payslips, salary bands)
3. Performance depth (reviews form, goals, 1:1 notes)
4. Time depth (time-tracking, holidays, approvals queue)
5. Documents / e-sign
6. Help desk / tickets / knowledge base
7. Learning module
8. Analytics depth (hiring funnel, attrition, diversity, comp)
9. Engagement (recognition, anniversaries, surveys)
10. Admin (roles, audit log, API keys, integrations, billing)
11. Marketing pages (public-facing about / careers / pricing for the
    template's own website-style routes)

**Exit criterion:** Registry coverage matrix at 100%. Every primitive
and every block used in at least one page.

### Phase 3 — Polish (estimated 2-3 sessions)

- Accessibility audit (axe-core run, fix violations)
- Lighthouse passes (90+ on every page for accessibility, performance,
  best-practices, SEO)
- Mobile pass (every page tested at 375px wide)
- Print stylesheets for payslips / offers / contracts
- Performance pass (lazy-load charts on analytics pages, virtual-scroll
  on long tables)
- README final pass (clear "how to add a feature" guide)
- Add `pnpm create uipkge-hrms` scaffolding command (if there's appetite
  for promoting the template as a starter)

## Open questions for the maintainer

Before writing code, decisions I need from you:

1. **Repo strategy.** New repo `uipkge-hrms-v2` and deprecate the old one,
   or force-push a fresh `main` into `uipkge-hrms`? My recommendation is
   a new repo so the old one stays accessible during transition; deprecate
   old after v2 ships.

2. **Domain naming.** Stay on `uipkge-hrms.pages.dev` or pick a more
   distinctive name (e.g. `peoplekge.dev`, `hrkge.dev`)? Recommendation:
   stay on `uipkge-hrms` — discoverability via the registry-site links
   beats novelty.

3. **Scope of MVP.** 15 pages is the right size for "complete enough to
   showcase, small enough to ship soon." Are there pages from the 30+
   list you'd promote into MVP, or trim from it?

4. **Personas in MVP.** Implementing the 3-persona model is +1 session
   of work and touches every route guard. Yes for MVP, or punt to Phase 2?
   Recommendation: yes for MVP. It's what separates a UI demo from a
   product template; without it, the data-table filters and approval
   queues lose their reason to exist.

5. **Mock vs real data hooks.** All mock for the template, or include
   working API endpoints (via Nitro server routes) that consumers can
   swap to a real backend? Recommendation: all mock for v1; document
   the swap-out in README. Adding real endpoints doubles the surface
   without adding showcase value.

6. **Theming variant.** Single theme (uipkge default) or ship 2-3
   themes that consumers can preview / switch? Recommendation: single
   theme for v1; `/settings/theming` lets users muck with the OKLCH
   tokens live (using `theme-customize` block) — that's enough
   theming surface for a template.

7. **Marketing pages.** Public-facing pages (`/about`, `/pricing`,
   `/careers`) that exercise hero-01 / pricing-01 / faq-01 — include
   in template or skip? Recommendation: include 3-4 (Home, Careers,
   Contact, 404) in Phase 2. They're the only place the marketing
   blocks get to live in context.

8. **Compliance / privacy banner.** GDPR / CCPA cookie banner block —
   ship as new block on this template, or leave as a future request?
   The HR domain makes the omission stand out; recommend authoring
   it during Phase 2.

9. **Form library.** vee-validate + zod is my pick; the `form`
   primitive already integrates with both. Confirm or counter-pick.

10. **Repo housing the planning artifact.** Should this plan live in
    `uipkge/ui/ai_docs/` (current location) or move to the new
    `uipkge-hrms-v2` repo's docs? I'd keep both: copy a frozen v1 of
    this plan into the new repo's `docs/template-design.md`, retain
    the working version here for cross-references back to registry
    items.

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Scope creep beyond the 30+ page list | Hard cap. Anything that's not on the list goes into a "future requests" backlog. |
| Registry gaps surface mid-build (no good primitive for X) | When a gap is found, propose into registry, ship there first, then consume. Avoid template-specific bespoke primitives. |
| Mock data feels fake | Use real-shape data + realistic names (no "Lorem"). Borrow public HR datasets for shape inspiration. |
| Performance regression at 200+ employees in tables | Virtual-scroll mode on every list page from day one. Test with 1000 rows during Phase 1. |
| Theme palette breaks contrast in dark mode | Run automated contrast check (axe) as part of CI on every PR. Don't merge if violations. |
| Permission gates feel like fake plumbing | Make persona switch *visible* in the topbar. Users notice when nav reshuffles. |

## Definition of done (for v1)

- 15 MVP pages live on `uipkge-hrms.pages.dev`
- Every page passes the "decent template" checklist 1-15
- Registry coverage matrix at >70% (charts + primitives + ≥30 blocks)
- README + design doc complete
- Lighthouse a11y 95+, perf 85+ on every page
- All 3 personas swap correctly
- Deployable to CF Pages with one command
- No console errors or hydration mismatches
- Mobile breakpoint works on all 15 pages

---

**Next step from here:** answer the 10 open questions, then I'll
scaffold Phase 0 in a new branch. Estimated total effort to ship Phase 1
to "deployed and polished": 8-12 working sessions.
