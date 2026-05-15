---
name: add-page
description: Use this skill when creating any new route in `app/pages/**` in this HRMS template. Enforces the template's page conventions: correct layout choice, persona-based middleware where the page is privileged, `useHead` title, registry-first composition. Trigger phrases include "add a page", "create a route", "new screen", "make a /foo page", or any `Write` call that creates a file matching `app/pages/**/*.vue`.
---

# add-page

This template has clear page conventions. Following them gives you a working route in 30 seconds. Diverging means subtle bugs (wrong chrome, missing guard, layout collision, broken breadcrumb).

## Layouts available

There is exactly **one** layout: `default.vue`. It wraps every page in `SidebarProvider` + `AppSidebar` + `AppTopbar`. Almost every page wants this. Auth pages and the 403 page opt out with `layout: false`.

Don't add a second layout file unless a page genuinely can't live in this chrome — the cost of a parallel layout is high.

## Pick the right shape

Every new page falls into exactly one of these buckets. Pick first, then scaffold.

### Bucket 1 — Authenticated app surface (most pages)

The default. Lives anywhere under `app/pages/` that isn't auth or error.

```vue
<script setup lang="ts">
useHead({ title: '<Page> · uipkge HRMS' })
</script>

<template>
  <div class="space-y-6 p-6">
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold tracking-tight">
        <Title>
      </h1>
      <p class="text-muted-foreground text-sm">
        <One-line description>
      </p>
    </header>

    <!-- Compose from @/components/ui/* primitives and @/components/blocks/* -->
  </div>
</template>
```

Rules:
- No `definePageMeta` needed — the `default` layout is implicit.
- `useHead.title` follows pattern `'<Page> · uipkge HRMS'` for tab titles.
- Top heading uses `text-2xl font-semibold tracking-tight`. Match existing pages.
- Padding lives on the page wrapper (`p-6` or `space-y-6 p-6`), not the layout.

### Bucket 2 — Admin-only or manager-only page

Privileged pages gated by persona. Examples: `/people/new`, `/settings/persona`, `/settings/api-keys`, `/analytics/*` (manager+).

```vue
<script setup lang="ts">
definePageMeta({ middleware: 'require-admin' }) // or 'require-manager'
useHead({ title: 'Add employee · uipkge HRMS' })
</script>

<template>
  <!-- ...same shape as bucket 1 -->
</template>
```

Rules:
- Pick the right middleware:
  - `require-admin` — admin persona only. Drops manager + employee to `/403`.
  - `require-manager` — admin OR manager. Drops employee to `/403`.
- Both middlewares are **client-only** (persona lives in `localStorage`, the SSR pass can't read it). They `return` early on `import.meta.server`. This means SSR still prerenders the page; the redirect fires after hydration. **Do not** render secret data in template literals that ship in the SSR HTML — render it client-only via `<ClientOnly>` or guard with `isAdmin.value` from `usePersona()`.
- Lower-tier personas land on `/403.vue`, which uses `layout: false`.

### Bucket 3 — Auth entry (sign-in, sign-up, callback)

Lives under `app/pages/auth/**`.

```vue
<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Sign in · uipkge HRMS' })
</script>

<template>
  <div class="bg-background text-foreground min-h-svh grid place-items-center">
    <!-- AuthSignIn block, or composed from Card + Form primitives -->
  </div>
</template>
```

Rules:
- `layout: false` because auth pages render their own minimal shell — no sidebar, no topbar.
- Auth is mock-only in this repo. Don't wire `useUserSession` or any real auth helper — there is none. Use `usePersona()` if the page needs to change persona on "sign-in."

### Bucket 4 — Dynamic route (`[id].vue`)

```vue
<script setup lang="ts">
const route = useRoute()
const id = computed(() => String(route.params.id))

useHead(() => ({ title: `${id.value} · People` }))
</script>

<template>
  <!-- ... -->
</template>
```

Rules:
- `useHead` is the **function** form so the title reacts to param changes during client-side nav.
- Always coerce `route.params.X` to `String(...)` — Nuxt types it as `string | string[]`.
- Validate the param against the matching mock dataset (e.g. `app/mocks/people.ts`). Show the 404 path or a soft empty state — don't crash on unknown IDs.

## Mock-data hygiene (SSR-critical)

If the page reads from `app/mocks/*.ts`:

- The mock arrays are **hand-built**. No `Math.random`, no `faker`, no `Date.now()`. Adding randomness breaks SSR/CSR hydration.
- Treat mock data as read-only at the module level. If the page needs to "edit" mock state for the demo, use a `useState` or a small composable that holds the diff — don't mutate the import.

## Sidebar / navigation

If the new page belongs in the sidebar, add it to `app/components/nav/AppSidebar.vue`. Persona-gated entries should check `usePersona()` so the wrong personas don't see dead links.

If the page is reachable only via deep link (no sidebar entry), no nav update needed.

## i18n

Repo is English-only today (per `docs/template-design.md`, i18n is a Phase 2 goal). Don't pre-emptively wire `t('…')` calls. When i18n lands, strings will be extracted to per-page files — until then, inline copy is fine.

## What NOT to do

- **Don't** introduce a second layout file. The single `default` layout is intentional.
- **Don't** wire real auth helpers (`useUserSession`, `requireUserSession`, etc.). The repo is mock-only.
- **Don't** add a page without checking `app/pages/<name>` doesn't already exist as a directory (would shadow each other).
- **Don't** hand-roll primitives — invoke `uipkge-first` if the page needs a UI component.
- **Don't** render persona-gated secret data in SSR-visible markup. Middleware is client-only.

## Verification

After creating the page:

1. Hit `http://localhost:3330/<path>` in the running dev server. Page renders for the appropriate personas, redirects to `/403` for others.
2. Tab title matches `useHead.title`.
3. Sidebar item (if added) navigates correctly and highlights as active.
4. Toggle the theme — page works in both light and dark.
5. Resize to 768px — sidebar collapses, layout doesn't break.
