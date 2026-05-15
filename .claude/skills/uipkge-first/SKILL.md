---
name: uipkge-first
description: Use when the user asks to add, build, or create any UI component or primitive (button, card, dialog, sheet, command palette, table, form field, chart, etc.) in this HRMS template. Routes to the @uipkge registry instead of hand-rolling shadcn-vue primitives. Trigger phrases include "add a button", "I need a dialog", "create a table", "we need a date picker", "make a sidebar", or any request that would naturally land in `app/components/ui/`.
---

# uipkge-first

This repo's UI is **100% @uipkge-registry-driven**. It is the canonical consumer of the [uipkge](https://uipkge.dev) registry — proving the registry works end-to-end. There is no hand-rolled shadcn-vue, no copy-pasted Radix wrappers, no "I'll just inline this Tailwind class group." Every primitive in `app/components/ui/` was pulled from the registry via `npx shadcn-vue add @uipkge/<name>`.

## The rule

**Before writing any component that lives in `app/components/ui/`, check the registry.** If it exists there, install it. If it doesn't, the right move is to propose the primitive upstream in uipkge first, then install it here — not silently hand-roll.

## How to invoke

```bash
npx shadcn-vue@latest add @uipkge/<name> -y
```

Names follow the registry's catalog (e.g. `button`, `card`, `dialog`, `sheet`, `tabs`, `form`, `data-table`, `command`, `chart-line`, etc.). Run without args to list:

```bash
npx shadcn-vue@latest add @uipkge
```

After install, each ui dir auto-exports via `index.ts`, so use the named import:

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
</script>
```

## Why registry-driven is right for this repo

1. **It IS the showcase.** This template's whole job is to prove uipkge ships a complete UI surface. Hand-rolling a primitive defeats the purpose.
2. **No abstraction debt.** The code is in the repo, every line owned. shadcn-vue's "you own it" + a registry = starting point without an upstream dep.
3. **Consistency across the 15→45 pages.** Every Card on every page shares the same border radius, padding scale, shadow token. Subtly-different Cards across pages would break the showcase.
4. **Token-bound.** Registry components consume OKLCH CSS variables (`--background`, `--foreground`, `--primary`, etc.) that `@uipkge/tailwind` already wires up. Hand-rolled primitives drift off the token system within a week.
5. **Accessibility is pre-solved.** reka-ui primitives underneath each Card/Dialog/Sheet have correct ARIA, focus management, keyboard handling.
6. **Upgrade path.** `npx shadcn-vue@latest add @uipkge/<name> -y --overwrite` re-pulls the latest registry version. Hand-rolled forks can't.

## Composition pattern

Build pages from **registry primitives (`app/components/ui/`) → composed blocks (`app/components/blocks/`) → pages (`app/pages/`)**.

- `ui/` is registry-managed. Don't edit those files by hand unless permanently forking that component — and if you do, leave a comment explaining why.
- `blocks/` is project-owned (`CommandPalette`, `ConversionFunnel`, `MetricsGrid`, `ProfileMenu`, `QuickActions`, …). Combine registry primitives here. This is where the HRMS app's voice lives.
- `pages/` consumes both. Keep page files thin; push composition into blocks.

## What to do when registry doesn't have it

1. **Check first.** `npx shadcn-vue@latest add @uipkge` and scan the list.
2. **Compose from primitives.** Often what looks like "we need component X" is actually "we need Card + Button + Input arranged differently." Build that as a block in `app/components/blocks/`.
3. **Propose upstream.** If a primitive genuinely doesn't exist, the right move per `docs/template-design.md` is to propose it in uipkge first, then consume it here. Don't fork inside this repo.
4. **Ask the user.** "Registry doesn't have a Foo. Options: compose from Card+Button as a block, or push a primitive upstream. Which?" Don't silently hand-roll.

## Anti-patterns to refuse

- Pasting a shadcn-vue.com snippet directly into `app/components/ui/`. Use the registry instead.
- Inlining Tailwind class combinations that duplicate what `Button` or `Card` already provides.
- Wrapping a registry component in a thin project-specific wrapper "just to add one prop" — usually the registry component already takes that prop, or you can pass it through `class` + `cn()`.
- Hand-rolling forms with raw `<input>` instead of `Input` + `Label` + `FormField` from `@/components/ui/form`.
- Building a new sidebar instead of consuming `@/components/ui/sidebar` + `app/components/nav/AppSidebar.vue`.

## Verification

After adding a registry component, confirm:

1. `app/components/ui/<name>/index.ts` exists and re-exports.
2. Auto-import works: in any `.vue` template, the PascalCase name (e.g. `<Button>`) resolves without an explicit import (Nuxt scans `app/components/` with `pathPrefix: false`).
3. The component honors the dark/light toggle (it should — registry components consume CSS vars).
4. `npx nuxi typecheck` passes if available; otherwise smoke-test the page in the dev server (port 3330).

If any of those fail, the registry install may have collided with an existing file — re-run with `--overwrite` if appropriate.
