# Project skills for the uipkge-hrms template

This directory ships **Claude Code skills** that turn this template's conventions into agent-enforced guardrails. They activate automatically when their trigger phrases appear in a session, so anyone (or any AI session) working on this repo gets the same discipline.

Skills are loaded by Claude Code from `.claude/skills/<name>/SKILL.md` in the working directory. Nothing to install — they're picked up automatically.

This set is the HRMS-applicable subset of the [`nuxt-boilerplate`](https://github.com/uday-a/nuxt-boilerplate) skills. Backend-flavored skills (auth gating on server routes, response envelope, db migration, logger conventions, secret exposure on `runtimeConfig`) are deliberately omitted because this repo is mock-only: no `server/api/**`, no Drizzle, no logger. They'll be pulled in if/when a real backend lands.

## What's here

| Skill | Fires when | What it does |
|---|---|---|
| [`uipkge-first`](./uipkge-first/SKILL.md) | User wants to add a UI primitive (Button, Card, Dialog, Form, etc.) | Routes to `npx shadcn-vue@latest add @uipkge/<name>` and refuses silent hand-rolling. Explains why a registry-driven UI is the right call for this showcase template. |
| [`add-page`](./add-page/SKILL.md) | User creates a file under `app/pages/**` | Picks the right bucket (default app surface / persona-gated / auth entry / dynamic), sets `definePageMeta` middleware and `useHead` correctly, flags SSR-sensitive patterns. |
| [`shipping-check`](./shipping-check/SKILL.md) | User signals "done", "ready to commit", "ship it" | Runs the narrow gate this repo currently supports: `nuxi prepare`, `nuxi typecheck`, dev-server + responsive smoke, staged-files boundary. |

## External skills (pulled from skills.sh)

These skills are not project-authored — they're community-maintained framework references installed via the [skills.sh](https://skills.sh) CLI. The installed versions are pinned in `skills-lock.json` at the repo root.

| Skill | Source | Why we picked it |
|---|---|---|
| [`nuxt`](./nuxt/SKILL.md) | `antfu/skills@nuxt` | Generated from the official Nuxt docs by Anthony Fu (Nuxt core team). Authoritative Nuxt 3/4 reference covering auto-imports, file-based routing, `useFetch` vs `$fetch`, Nitro server routes, hybrid rendering. |
| [`vue`](./vue/SKILL.md) | `antfu/skills@vue` | Generated from the Vue 3 docs by Anthony Fu. Covers Composition API, script setup macros, reactivity, `<Transition>` / `<Teleport>` / `<Suspense>` / `<KeepAlive>`. |
| [`reka-ui`](./reka-ui/SKILL.md) | `onmax/nuxt-skills@reka-ui` | Headless Vue primitives that shadcn-vue (and the `@uipkge` registry) is built on top of. Covers the `asChild` composition pattern, controlled vs uncontrolled state, accessibility patterns. |

### Updating external skills

To pull newer versions of an installed skill:

```bash
npx skills update <skill-name>
```

To restore the full set on a fresh clone (pulls each pinned version from `skills-lock.json`):

```bash
npx skills experimental_install
```

## Skills NOT pulled (and why)

These exist in the `nuxt-boilerplate` source set but were left out here because the underlying concern doesn't exist in HRMS:

| Skill | Why omitted |
|---|---|
| `auth-gating-check` | No `server/api/**`, no `requireUserSession`. Auth is mock + persona-only. |
| `response-envelope` | No API handlers. |
| `db-migration` | No Drizzle, no `server/db/schema.ts`. |
| `logger-conventions` | No server logger. |
| `secret-exposure-check` | No `runtimeConfig`, no real env secrets. |
| `error-handling` | Server-error-flavoured; doesn't fit a mock-only client. |
| `i18n-keys` | Repo is English-only today. Pull when i18n lands (Phase 2 per `docs/template-design.md`). |

When any of these concerns appears in this repo, copy the skill from `nuxt-boilerplate/.claude/skills/<name>/SKILL.md`, adapt the file paths/conventions to HRMS, and add it to the table above.
