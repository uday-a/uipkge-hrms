# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Reference HRMS template that consumes the [uipkge](https://uipkge.dev) UI registry. **Not** a real product, **not** a design system — it's the showcase that proves uipkge primitives + blocks work end-to-end in a realistic app. Mock data, mock auth, no backend. v2 is a clean-slate rebuild; plan in `docs/template-design.md`.

Implication: no bespoke primitives in this repo. If a page needs something the registry doesn't have, the right move is to propose the primitive upstream in uipkge first, then `shadcn-vue add` it here.

## Common commands

```bash
npm run dev                              # http://localhost:3330
npx shadcn-vue@latest add @uipkge/<name> -y   # pull a registry primitive/block
npm run generate                         # static prerender → .output/public (deploy anywhere)
```

## Stack quirks worth knowing

- **Nuxt 4** with `components: [{ path: '~/components', pathPrefix: false }]` — `<AppSidebar />` works without folder prefix. Don't add prefixes.
- **Tailwind v4** via `@uipkge/tailwind` OKLCH tokens. Use tokens, not hardcoded hex.
- **shadcn-vue** registry config in `components.json`; `@uipkge` registry resolves to `https://uipkge.dev/r/nuxt/{name}.json`.
- **State**: Pinia is **not** wired (tripped an SSR error). Use `useState` + composables.

## SSR-sensitive patterns

The dashboard prerenders, so server and client must produce identical markup:

- **Mock data is hand-built** (`app/mocks/*.ts`) — no `Math.random`, no `faker`, no `Date.now()`. Adding randomness breaks hydration.
- **Theme** lives in a cookie (`useTheme`), not localStorage — server reads the cookie before first HTML to render the right icon.
- **Persona** lives in localStorage (`usePersona`) — sentinel `'admin'` on server, client hydrates from storage. Route guards in `app/middleware/require-*.ts` are client-only and bail with `if (import.meta.server) return`.

## Personas

Three: `admin` / `manager` / `employee`. `usePersona()` gates UI; `require-admin` / `require-manager` middleware gate routes. Switch via the topbar profile menu. Persona is the demo's main interactive variable — when adding a screen, decide what each persona sees.

## Layout / chrome

Single layout (`app/layouts/default.vue`) wraps every page in `SidebarProvider` + `AppSidebar` + `AppTopbar`. Don't introduce a second layout unless a page genuinely can't live in this chrome (auth pages already use `definePageMeta({ layout: false })`).

## Skills

`.claude/skills/` ships project-local skills mirroring the [`nuxt-boilerplate`](https://github.com/uday-a/nuxt-boilerplate) set, scoped to what this mock-only template actually has: `uipkge-first`, `add-page`, `shipping-check`, plus external `nuxt` / `vue` / `reka-ui` references pinned in `skills-lock.json`. Backend-flavoured skills (auth gating, response envelope, db migration, logger, secret exposure) are deliberately not present — pull them from the boilerplate when a real backend lands. See `.claude/skills/README.md` for the full table.
