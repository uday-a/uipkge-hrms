---
name: shipping-check
description: Use this skill after implementing any feature, bug fix, or refactor in this HRMS template, BEFORE staging or committing. Runs the quality gate that catches typecheck regressions, broken auto-imports, and accidentally-staged files. Trigger phrases include "I'm done", "ready to commit", "looks good, ship it", "finished the feature", or any signal that work is complete and about to land.
---

# shipping-check

This repo doesn't yet ship lefthook / eslint / knip / jscpd — those are on the roadmap. Until they land, the gate is narrower but the discipline is the same: don't claim done without running checks.

## When to invoke

- User says "done", "ready", "commit this", "ship it", or any other "wrap-up" signal.
- About to call `Bash git commit` or `Bash git add` for a non-trivial change.
- Right after `Edit`/`Write` for a feature, before reporting completion.

## When NOT to invoke

- Pure documentation changes touching only `.md` files.
- Drafts the user explicitly marked WIP.
- Inside a `/safe-remove` flow — that skill has its own audit matrix.

## The gate

Run these checks. Surface PASS/FAIL for each. Stop on the first FAIL and fix before continuing.

```bash
npx nuxi prepare                # 1. regenerate .nuxt types — required if any module/component path changed
npx nuxi typecheck              # 2. vue-tsc. May need `npm i -D vue-tsc` if not present yet
```

Plus three human-judgment checks:

3. **Dev-server smoke** — page renders in the running dev server (`http://localhost:3330`)? Theme toggle works on it? Persona switches behave correctly?
4. **Responsive smoke** — resize to 768px; sidebar collapses, tables fit, no horizontal scroll.
5. **Boundary check** — `git status -s` shows only the files relevant to the stated task. No `.env`, no `node_modules`, no `.playwright-mcp/` screenshots accidentally staged.

## Pass criteria

| Check | Pass means |
|---|---|
| nuxi prepare | Exits 0. Required because auto-import types regenerate from `nuxt.config.ts` + `app/components/` scan |
| typecheck | `0 errors`. If a pre-existing baseline exists, count must not increase |
| dev-server smoke | Manually walked the changed surface(s); no console errors |
| responsive smoke | No layout collapse at 768px; verified manually |
| boundary | `git status -s` only lists files relevant to the stated task |

## Fail handling

**typecheck fails:** Read the error. Common causes in this codebase:
- Auto-imports not regenerated → re-run `npx nuxi prepare`.
- New ref typed too loosely; explicit generic helps.
- Cross-package type brand mismatch (e.g. `@internationalized/date` vs reka-ui's re-export) → cast at the boundary with a comment.
- Strict `noUncheckedIndexedAccess` — guard with `?? default` or hoist into a computed.

**vue-tsc not installed:** `npm i -D vue-tsc` and re-run. Don't skip the check.

**dev-server smoke fails:** Read the browser console + the dev-server terminal. Don't chase symptoms — find the root cause (`/systematic-debugging`).

**boundary fails:** Stash unrelated changes (`git stash --keep-index`), commit the focused change, then unstash.

## Output template

When invoking, report the gate result like this:

```
### Shipping check — <feature name>

| Check             | Status | Evidence                            |
|-------------------|--------|-------------------------------------|
| nuxi prepare      | PASS   | Types regenerated                   |
| typecheck         | PASS   | 0 errors                            |
| dev-server smoke  | PASS   | /dashboard renders, no console errs |
| responsive smoke  | PASS   | 768px breakpoint clean              |
| boundary          | PASS   | 4 files, all under app/pages/foo/   |

Ready to commit.
```

Don't claim PASS unless you ran the command or the visual check and saw the output. "I think it's fine" is not PASS.

## What this skill explicitly does NOT do

- It does NOT run `npm run build`. Build runs in deploy. Surfacing build breakage here is fine *if* the user is about to deploy, but it's not part of the per-commit gate.
- It does NOT run lint or duplicate detection. Those tools aren't wired up yet — when they land, update this skill.
- It does NOT commit. Surface the gate result, wait for the user to say "commit" or fix any failure.
- It does NOT replace `/safe-remove` for deletions. Run that first if your change removes anything.
