# Dependency Upgrade Plan

Research date: 2026-08-29
Scope: `package.json` at repo root (Next.js admin app)

## Progress log

- [x] **Group 1 — safe patches** — done 2026-08-29. `npm run typecheck`, `npm run lint`, `npm run build` all pass (pre-existing lint errors unrelated to this change, confirmed via `git stash` diff).
- [x] **ESLint flat-config migration** — done 2026-08-29. `.eslintrc.json` replaced with `eslint.config.mjs`; `lint` script now runs `eslint .` directly instead of `next lint`.
- [x] **Group 2** — done 2026-08-29 (sonner, lucide-react). eslint 9→10 **deferred**, see note below.
- [x] **zod + @hookform/resolvers** — done 2026-08-29, see notes below. Non-trivial: 4 breaking-API fixes were needed.
- [x] **recharts, tailwind-merge, date-fns** — done 2026-08-29, see notes below. **Group 3 complete.**
- [x] **react-day-picker 8→10** — done 2026-08-29, see notes below. Full `calendar.tsx` rewrite required, as expected.
- [x] **framer-motion 11→13** — done 2026-08-29, see notes below. Clean bump, no code changes needed.
- [ ] **Tailwind 3→4 — deliberately skipped for now** (2026-08-29). Highest visual-regression risk in this whole plan; this environment has no browser screenshot tooling to verify it, so it's deferred until it can be checked visually. Doing TypeScript and Next.js 16 first instead.
- [ ] **TypeScript 5→7 — blocked upstream** (checked 2026-08-29, not done). See notes below.
- [x] **Next.js 15→16** — done 2026-08-29, see notes below. Several real issues hit and resolved; details below.

## Current state

The project is already on a fairly modern stack: **Next.js 15.3.9**, **React 19**, **TypeScript 5.9**, **Tailwind CSS 3.4**. There is no `middleware.ts`, ESLint errors are ignored during builds (`next.config.js`), and images are unoptimized (likely for static/Netlify export). This is a healthier starting point than most projects — the upgrade work here is incremental, not a rescue job.

`npm outdated` output (installed vs. latest on npm):

| Package | Installed | Latest | Jump |
|---|---|---|---|
| next | 15.3.9 | 16.3.3 | major |
| eslint-config-next | 15.5.22 | 16.3.3 | major (tracks next) |
| react-day-picker | 8.10.2 | 10.0.1 | 2 majors |
| recharts | 2.15.4 | 3.10.1 | major |
| tailwindcss | 3.4.19 | 4.3.3 | major |
| eslint | 9.39.5 | 10.9.1 | major |
| zod | 3.25.76 | 4.5.2 | major |
| sonner | 1.7.4 | 2.0.8 | major |
| lucide-react | 0.468.0 | 1.37.0 | major |
| tailwind-merge | 2.6.1 | 3.6.0 | major |
| framer-motion | 11.18.2 | 13.1.1 | 2 majors |
| @hookform/resolvers | 3.10.0 | 5.9.1 | 2 majors |
| date-fns | 3.6.0 | 4.4.0 | major |
| typescript | 5.9.3 | 7.0.2 | 2 majors |
| input-otp | 1.4.2 | 1.5.0 | minor |
| @netlify/plugin-nextjs | 5.15.1 | 5.15.13 | patch |
| postcss | 8.5.25 | 8.5.26 | patch |
| @types/node, @types/react-dom | — | — | patch/minor |

Below, everything is grouped by how safe it is to move, not by version number alone — a "major" bump can be a non-event (sonner) or a real rewrite (react-day-picker).

---

## Group 1 — Safe now, do first

No code changes expected. These are patch/minor bumps or majors with no breaking API touched by this codebase.

- **@netlify/plugin-nextjs** 5.15.1 → 5.15.13 (patch)
- **postcss** 8.5.25 → 8.5.26 (patch)
- **@types/node**, **@types/react-dom** → latest patch/minor
- **input-otp** 1.4.2 → 1.5.0 (minor)
- **@hookform/resolvers** — used with `zod` via `zodResolver`; safe to bump to whatever major matches the zod version you land on (see Group 3)

Command:
```bash
npm update @netlify/plugin-nextjs postcss @types/node @types/react-dom input-otp
```

**Status: done.** `@types/node` landed on `^26.4.0` (matches the Node 26.4.0 runtime already in use locally). Verified with `typecheck` + `lint` + `build` — all pass; the handful of lint errors present are pre-existing (confirmed by diffing lint output against the pre-upgrade tree) and were already suppressed at build time via `next.config.js`'s `eslint.ignoreDuringBuilds`.

## Group 2 — Low-risk majors, do next

The major version number changed but the parts of the API this codebase touches did not.

- **sonner** 1.7.4 → 2.x — usage across 31 files is all `toast.success()` / `toast.error()` style calls; that surface is unchanged in v2. Skim the changelog for the `Toaster` props you actually pass (theme/position) before bumping.
- **lucide-react** 0.468.0 → 1.x — icon components are used as plain `<IconName />` imports throughout (150 references); v1 is mostly a stabilization release (semver commitment going forward), not an API rewrite. Spot-check that every icon name you import still exists (a few icons get renamed/removed between releases).
- **eslint** 9.x → 10.x, paired with **eslint-config-next** bumped to match whatever Next major you're on. Flat config (`eslint.config.js`) is what Next 16's `eslint-config-next` expects — this repo currently uses the older `.eslintrc.json` format, so this one needs a small migration (see Next.js section below).

**Update 2026-08-29 — sonner and lucide-react done, eslint major deferred.** Bumped `sonner` 1.7.4→2.0.8 and `lucide-react` 0.468.0→1.37.0 via `npm install sonner@latest lucide-react@latest`. `typecheck` passed clean (would have flagged any renamed/removed icon export), `build` succeeded, and a dev-server smoke test hit `/login`, `/dashboard`, and `/reports` (icon- and toast-heavy pages) — all compiled and returned 200 with no console/server errors. The `Toaster` wrapper in `components/providers/app-toaster.tsx` uses only stable v1/v2 props (`position`, `richColors`, `closeButton`, `duration`, `toastOptions.classNames`), so no code changes were needed.

The **eslint 9→10 bump was checked and deferred**: `npm view eslint-config-next@15.5.24 peerDependencies` shows `{ eslint: '^7.23.0 || ^8.0.0 || ^9.0.0' }` — the latest `eslint-config-next` release on the 15.x track (matching our current Next 15) does not declare support for ESLint 10 yet. Bumping ESLint alone now would create a peer dependency conflict. This will be picked up together with the Next.js 15→16 step, where `eslint-config-next` also jumps to the 16.x line (which should declare ESLint 10 support).

**Update 2026-08-29 — ESLint flat-config migration done, ahead of the version bump itself.** Ran `npx @next/codemod@canary next-lint-to-eslint-cli .`, which replaced `.eslintrc.json` with `eslint.config.mjs` and changed the `lint` script from `next lint` to `eslint .`. Two manual fixes were needed on top of the codemod's output:
1. The codemod assumed `eslint-config-next` exports flat config natively via `defineConfig([...nextCoreWebVitals])`, but the installed version (`15.5.22`) still ships the legacy `{ extends: [...] }` shape — that import crashed (`nextCoreWebVitals is not iterable`). Replaced it with the standard `FlatCompat` bridge (`@eslint/eslintrc`, added as an explicit devDependency rather than relying on it transitively through `eslint`).
2. Deleted the leftover `.eslintrc.json` (the codemod doesn't remove it automatically).

Verified lint output is byte-for-byte the same set of pre-existing errors/warnings (10 errors, 7 warnings, same files/lines) as before the migration, and `npm run build` still shows "Skipping linting" (confirming `next.config.js`'s `eslint.ignoreDuringBuilds` still applies under the new script). `npm run typecheck` and `npm run build` both pass. Config is now ready for the eslint 9→10 bump and for Next 16, which requires flat config.

## Group 3 — Medium-risk majors, needs a focused pass

Real API changes exist, but the codebase's usage surface is narrow enough to check by hand in under an hour each.

- **zod** 3.x → 4.x — only 3 files import zod directly. Zod 4 changes error-handling APIs (`.issues` shape, `ZodError` formatting) and some schema method signatures. Since usage is small, read the [zod v4 migration guide](https://zod.dev/v4/changelog) and update those 3 files together with `@hookform/resolvers` (bump both in the same commit — resolvers' zod adapter version must match).

**Update 2026-08-29 — done.** Bumped `zod` 3.25.76→4.5.2 and `@hookform/resolvers` 3.10.0→5.9.1 together (`@hookform/resolvers@5.9.1` declares `zod: '^3.25.0 || ^4.0.0'`, so it supports both — confirmed via `npm view` before touching anything). `npm run typecheck` surfaced 4 distinct breaking changes, all fixed:

1. **`errorMap` → `message`/`error`** — `lib/validation/settings.ts`: `z.enum([...], { errorMap: () => ({ message: '...' }) })` no longer type-checks; v4's enum options take `{ message: '...' }` directly. Fixed by dropping the callback.
2. **`ZodError.errors` → `ZodError.issues`** — `components/wizard/email-invite-card.tsx:79` read `result.error.errors[0]?.message`; v4 removed the `errors` alias. Renamed to `.issues`. (Searched the whole codebase for other occurrences — this was the only one.)
3. **`.optional().default(x)` input-type change** — Zod v4 splits every schema into a distinct input type (pre-defaults, so an `.optional()` field stays `T | undefined`) and output type (post-defaults, always `T`). The redundant `.optional()` before `.default()` no longer collapses away in the *input* type the way v3 did, which broke `useForm`+`zodResolver` typing on the login form (`remember` field). Fixed by removing the redundant `.optional()` everywhere it preceded `.default(...)` — 19 occurrences across `lib/validation/auth.ts` and `lib/validation/job.ts`. Runtime behavior is identical (`.default()` alone already makes a field omittable on input); this is a type-only cleanup.
4. **`useForm` input/output split** — `zodResolver` in v5 now types as `Resolver<z.input<Schema>, Context, z.output<Schema>>` — the raw form fields and the validated submit payload are different types whenever a schema has `.default()` fields. `app/(auth)/login/page.tsx` needed: `LoginInput` changed from `z.infer` (which is `z.output`, unaffected) to `z.input<typeof loginSchema>` for the form fields, a new `LoginOutput = z.output<typeof loginSchema>` export for the submit handler's parameter type, `useForm<LoginInput, any, LoginOutput>` (react-hook-form's third generic, `TTransformedValues`, is exactly for this), and `checked={rememberMe ?? true}` where the now-optional `watch("remember")` value feeds a boolean-only prop.

Verified with `typecheck` (clean), `lint` (same pre-existing errors as before, unrelated), `build` (succeeds), and a dev-server smoke test hitting `/login`, `/signup`, `/company-setup`, and `/jobs/new/setup` (the pages exercising the schemas that changed) — all compiled and returned 200 with no console errors.
- **recharts** 2.x → 3.x — only used in `app/(dashboard)/reports/page.tsx`. Recharts 3 changed internals (React 19 support, some prop renames on `ResponsiveContainer`/axis components). Single call site — review that one file's chart config against the v3 changelog.

**Update 2026-08-29 — done.** Bumped 2.15.4→3.10.1. `npm view recharts@3 peerDependencies` showed React 19 already covered, no conflicts. `typecheck`, `lint`, and `build` all pass with zero changes needed — the file's usage (`AreaChart`, `CartesianGrid`, `XAxis`, `YAxis`, `Tooltip`, `Area`, `ResponsiveContainer`) sits entirely within the stable, unchanged v3 API surface. Dev server compiled `/reports` cleanly with no console/server errors. **Caveat:** I could not get an actual browser screenshot in this environment (`chromium-cli` isn't installed here) — recommend a manual visual check of the reports chart before merging, since chart rendering is inherently a visual concern that type-checking can't fully cover.

- **tailwind-merge** 2.x → 3.x — used internally by the `cn()` helper (shadcn-style). Check `lib/utils.ts` still works; v3 mainly changed how custom Tailwind config is merged, which matters here since `tailwind.config.ts` has substantial custom `fontSize`/spacing tokens.

**Update 2026-08-29 — done.** Bumped 2.6.1→3.6.0. `lib/utils.ts` uses `extendTailwindMerge` with a custom `classGroups.font-size` entry (the project's own `text-display`/`text-h1`/etc. tokens) — exactly the kind of usage most likely to break on a config-shape change, so this got a dedicated runtime check rather than just typecheck/build. Wrote a small script exercising `cn()` directly: confirmed custom-vs-custom collisions (`cn('text-h1', 'text-body-sm')` → `text-body-sm`), custom-vs-builtin collisions (`cn('text-lg', 'text-h2')` → `text-h2`), and unrelated standard merges (padding, background color) all resolve correctly — the `extend.classGroups` config shape is unchanged in v3. `typecheck` and `build` pass.

- **date-fns** 3.x → 4.x — 4 files. v4 is mostly additive (time zone support) with few breaking changes for typical `format`/`parseISO` usage — verify the specific functions used still have the same signatures.

**Update 2026-08-29 — done.** Bumped 3.6.0→4.4.0. Usage across the 4 files is `format`, `isPast`, `isToday`, `formatDistanceToNow` with plain string tokens (`'PPP'`, `'yyyy-MM-dd'`, `'MMM d, yyyy'`) — no peer dependency changes. Ran a runtime check of each function/token combination actually used in the codebase; all produced identical output to expected v3 behavior (e.g. `format(d, 'PPP')` → `"August 29th, 2026"`). `typecheck`, `lint`, `build` all pass.

## Group 4 — High-risk majors, needs a dedicated task each

These require real migration work, not just a version bump. Do **not** bundle these with anything else — one PR each, so a regression is easy to isolate and revert.

### Tailwind CSS 3 → 4
This is the biggest lift in the list. Tailwind v4 changes the config format (CSS-first `@theme` instead of `tailwind.config.ts`), drops `postcss.config.js`'s `tailwindcss` plugin in favor of `@tailwindcss/postcss`, and the current config here has heavy custom design tokens (custom `fontSize` scale with explicit line-height/letter-spacing/weight per size, plus whatever else lives past line 20). Every one of those tokens needs to be translated to the new `@theme` CSS syntax. `tailwindcss-animate` also needs a v4-compatible replacement or manual porting (its successor is `tw-animate-css`). Budget real time for this one and do it with the dev server open, checking pages visually as you go — Tailwind's official upgrade tool (`npx @tailwindcss/upgrade`) automates a good chunk of it but won't get custom token semantics right on its own.

### react-day-picker 8 → 10
Two majors in one jump. v9 alone changed prop names, the `mode`/`selected` API shape, and CSS class hooks; this project's `components/ui/calendar.tsx` (the shadcn calendar wrapper) will need to be rewritten against the new API, not just re-versioned. Check whether shadcn/ui has published an updated `calendar.tsx` for the day-picker version you target and use that as the base rather than hand-porting.

**Update 2026-08-29 — done.** Bumped 8.10.2→10.0.1 (`react: '>=16.8.0'` peer, no conflict). As expected, `components/ui/calendar.tsx` needed a full rewrite — v9/v10 replaced the entire class-name-key system and the icon-override mechanism:

- `classNames` keys renamed wholesale: `caption`→`month_caption`, `nav_button_previous`/`nav_button_next`→`button_previous`/`button_next`, `table`→`month_grid`, `head_row`/`head_cell`→`weekdays`/`weekday`, `day`→`day` (unchanged) but selection/day-state modifiers moved from prefixed keys (`day_selected`, `day_today`, `day_outside`, `day_disabled`, `day_range_middle`, `day_hidden`) to bare keys (`selected`, `today`, `outside`, `disabled`, `range_middle`, `hidden`) since these are now composed from the library's own `DayFlag`/`SelectionState` enums rather than a `day_`-prefixed convention. Also added a new `day_button` key (the actual clickable button inside each day cell — didn't exist as a separate slot in v8).
- `components.IconLeft`/`components.IconRight` (two separate slots) collapsed into a single `components.Chevron` slot that receives an `orientation` prop (`'left' | 'right' | 'up' | 'down'`) and switches internally.

Verified the new class-name keys and the `Chevron` component's prop signature directly against the installed package's `.d.ts` files (`node_modules/react-day-picker/dist/.../UI.js` for the enum-derived key names, `Chevron.d.ts` for the orientation prop) rather than guessing from a changelog, since v10 is a very recent major (released the same day as v9's last release — essentially a peer-range graduation of v9's already-stable API).

Both real call sites (`components/wizard/share-link-card.tsx`, `components/wizard/job-details-form.tsx`) only pass top-level `DayPicker` props (`mode="single"`, `selected`, `onSelect`, `disabled`) — no `classNames`/`components` overrides at the call site — so the fix was fully contained to the wrapper; no call-site changes needed. `typecheck`, `lint`, `build` all pass, and both pages compile cleanly in dev.

**Caveat:** the calendar only renders inside a popover on click, and one of the two call sites (`share-link-card.tsx`) lives behind a dynamic `/jobs/[id]/edit/invite` route needing real job data — I could not click through and screenshot either popover in this environment (no `chromium-cli`/browser automation available here). The type-level verification is strong (props matched exactly against the installed package's types), but **recommend manually opening both date pickers in the browser before merging** to confirm the visual styling (especially the renamed `day_button`/`selected`/`range_middle` classes) looks right — this is the highest visual-regression risk of the changes done so far.

### framer-motion 11 → 13
Two majors, 13 usage sites. Framer Motion (now sometimes distributed as `motion`) has renamed the package itself in recent majors and changed some animation-orchestration APIs (`AnimatePresence` behavior, layout animation defaults). Check each of the 13 files against the migration notes; this is mechanical but must be done per-file since usage isn't centralized behind a wrapper.

**Update 2026-08-29 — done, turned out to be a non-event.** Bumped 11.18.2→13.1.1 (`react: '^18.0.0 || ^19.0.0'` peer — no conflict). Confirmed first that `framer-motion` on npm is still actively published and un-deprecated at v13 (the underlying repo moved to `motiondivision/motion`, but the npm package name and its `motion`/`AnimatePresence`/`MotionConfig` exports are unchanged). Audited all 13 files' imports and usage: only the stable core API is used (`motion`, `AnimatePresence` with `mode="wait"`, `MotionConfig`, `variants`, `layoutId` for one shared-element animation in `radio-card-group.tsx`) — nothing touching the parts of the API that actually changed across these majors (no `useAnimationControls`, `useDragControls`, custom easing curves, or the deprecated `exitBeforeEnter` prop). `typecheck`, `lint`, `build` all pass with zero code changes, and all 4 pages using page-level animation (`/login`, `/signup`, `/company-setup`, `/reset-password`) compiled cleanly in dev with no console/server errors.

**Caveat:** animation *behavior* (transition timing, exit/enter choreography, the shared-element `layoutId` check) is inherently something you have to watch happen, not something type-checking or a clean compile can fully confirm. No errors surfaced, but recommend a quick manual look at the login/signup page transitions and the radio-card-group's animated selection indicator before merging.

### Next.js 15 → 16 (+ React, if it moves)
Next 16 requires **Node.js 20.9+** (this repo currently on Node 26 — already fine) and moves fully to the flat ESLint config, drops some legacy APIs, and changes a handful of defaults (caching behavior, `next.config.js` option validation gets stricter). Since `next.config.js` here already sets `eslint.ignoreDuringBuilds: true` and `images.unoptimized: true`, check both options are still spelled the same way in v16 — config key validation is stricter and will hard-error on unknown/renamed keys. Follow the [official Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16) (or the `npx @next/codemod@canary upgrade latest` codemod, which handles most of the mechanical parts) rather than hand-editing. Do this **after** the ESLint flat-config migration (Group 2), since Next 16's lint tooling expects it.

**Update 2026-08-29 — done.** Ran `npx @next/codemod@canary upgrade latest`, which bumped `next` 15.3.9→16.3.3, `react`/`react-dom` to exact `19.2.8`, `eslint-config-next` to `16.3.3`, and rewrote `eslint.config.mjs` to drop the `FlatCompat` bridge (no longer needed — `eslint-config-next@16.3.3` exports flat config natively). Several real problems surfaced beyond the mechanical bump, all resolved:

1. **Dead `cacheComponents` opt-outs broke the build.** 14 files had a pre-existing, TODO-tagged `export const instant = false;` — an opt-out for Next's experimental "Cache Components" feature that was never actually turned on (`next.config.js` has no `cacheComponents` flag). It was inert dead code under Next 15 (silently ignored); Next 16 hard-errors on it (`Route segment config "instant" requires nextConfig.cacheComponents to be enabled`). Per your direction, removed the dead export + its TODO comment from all 14 files rather than enabling the feature — that stays a genuinely separate future task, as the original TODO already implied. Files touched: `app/layout.tsx`, `app/interview/[token]/layout.tsx`, `app/interview/[token]/page.tsx`, `app/jobs/new/page.tsx`, `app/jobs/[id]/edit/customisation/page.tsx`, and 9 files under `app/(dashboard)/`.
2. **`next.config.js`'s `eslint` key is no longer recognized.** Next 16 dropped `next build`'s built-in lint pass entirely (confirmed via `next build --help` — no `--eslint`/`--no-eslint` flag exists anymore; linting is fully separate from building now, consistent with `next lint` itself being replaced by direct `eslint .`). Removed the now-meaningless `eslint: { ignoreDuringBuilds: true }` block; `images: { unoptimized: true }` is unaffected and still valid.
3. **`tsconfig.json` auto-updated by Next itself** (not a manual edit) — `jsx` changed `"preserve"` → `"react-jsx"` (mandatory in Next 16, which requires the automatic JSX runtime) and `.next/dev/types/**/*.ts` was added to `include` (Turbopack's dev-mode type generation, since Next 16 uses Turbopack by default). Both are framework-driven, expected changes.
4. **`eslint-plugin-react` crashed under ESLint 10.** The codemod also hard-pinned root `eslint` to exact `10.9.1`. Running lint threw `TypeError: contextOrFilename.getFilename is not a function` from `eslint-plugin-react` (bundled inside `eslint-config-next@16.3.3`) — an internal ESLint 9 API that ESLint 10 removed. Checked: `eslint-plugin-react@7.37.5` (npm's latest) still only declares `eslint: '^3...^9.7'` — no version anywhere supports ESLint 10 yet. But `eslint-config-next@16.3.3`'s own peer requirement is just `eslint: '>=9.0.0'` — it doesn't actually need 10. Fixed by installing `eslint@9.39.5` (latest 9.x) instead of the codemod's pinned 10.9.1 — satisfies `eslint-config-next`'s real requirement without hitting the crash. This is the same conclusion the Group 2 update above already reached; Next 16 didn't change it.
5. **The codemod's new `eslint.config.mjs` widened lint scope beyond what the project had.** It added `eslint-config-next/typescript` (type-aware rules) on top of `core-web-vitals` — the original `.eslintrc.json` only ever had `next/core-web-vitals`. This alone added ~100 new problems in code that was never checked against these rules. Per your direction, dropped the `next/typescript` addition to keep scope matching what the project already had; also removed unused `path`/`fileURLToPath`/`__dirname` boilerplate the codemod left behind (no longer needed without `FlatCompat`).
6. **`core-web-vitals` itself got stricter too** — `eslint-config-next@16.3.3` bundles `eslint-plugin-react-hooks@7.1.1` (the newer "React Compiler"-era hooks linter) versus the `^5.2.0` line the project had under Next 15's config. This surfaces ~100 more problems (mostly `react-hooks/set-state-in-effect`, `react-hooks/refs`, `react-hooks/immutability` — all new rules), on top of the original 17-problem baseline. Per your direction, **left this as-is rather than adding an `overrides` pin** — a transitive-dependency version override here would be more fragile than the `next/typescript` fix (risks desyncing from what `eslint-config-next@16` expects internally) and the tradeoff wasn't worth it for a lint-only concern that doesn't block the build. **Net result: `npm run lint` currently reports ~111 problems, up from the 17-problem pre-existing baseline** — all newly-surfaced pre-existing code patterns flagged by Next 16's stricter default hooks rules, not regressions from this upgrade. Worth a separate cleanup pass at some point, but out of scope for a dependency-version upgrade.

Also noticed: Next 16's `next dev` now auto-generates `AGENTS.md` and `CLAUDE.md` at the repo root (framework-authored AI-assistant guidance files, regenerated on every `next dev` run per the comment inside `AGENTS.md` itself). These appeared as new untracked files during this work — flagged to you rather than silently committed or deleted, since that's a repo-wide decision beyond this upgrade's scope.

Verified with `typecheck` (clean), `build` (clean, no warnings), and a dev-server smoke test across 9 representative routes (`/login`, `/signup`, `/company-setup`, `/reset-password`, `/dashboard`, `/reports`, `/jobs/new/setup`, `/settings/team`, `/verify-email`) — all 200, no console/server errors, and Turbopack (Next 16's new default dev bundler) is noticeably faster than the previous webpack dev server.

### TypeScript 5 → 7
Two majors. TypeScript's own team has been staging a native (Go-based) compiler rewrite across recent majors, and 7.x is where that lands as default — the type-checking semantics are meant to stay compatible but the compiler binary and some edge-case inference behavior changes. Given `strict: true` is already on, run `tsc --noEmit` after bumping and fix whatever surfaces — don't assume zero diagnostics.

**Update 2026-08-29 — checked, blocked upstream, not done.** (Note: TypeScript 6 was never released as stable — the TS team's own plan jumps 5.9 straight to 7.0 to avoid confusion with the native-compiler rewrite, so "5→7" is really the next major, not two.) The blocker: `eslint-config-next@15.5.22` (current, matching our Next 15) pulls in `@typescript-eslint/eslint-plugin@8.66.0`, whose peer dependency is `typescript: '>=4.8.4 <6.1.0'` — it does not support TS 7 at all. Checked the *latest* `@typescript-eslint/eslint-plugin@8.68.0` too, in case a newer patch had picked up support — same `<6.1.0` cap. Ran `npm install typescript@latest --dry-run` to confirm this isn't just an overly-conservative range: npm reports it as an explicit **conflicting peer dependency**, not just a warning-level mismatch.

Forcing the bump now would mean running type-aware ESLint rules against a TypeScript version the linter's own peer contract says isn't supported — the kind of thing that can silently misbehave rather than fail loudly. Left `typescript` on `^5.7.3`. **Recommendation: revisit this once `@typescript-eslint` ships TS 7 support** (track their releases), or bundle it with the Next.js 15→16 step below if `eslint-config-next@16.x` turns out to pull in a `@typescript-eslint` version with TS 7 support by then — worth checking at that point rather than assuming.

---

## Recommended order of operations

Doing these in dependency order avoids re-doing work:

1. **Group 1** (safe patches) — one PR, zero behavior change expected.
2. **ESLint flat-config migration** (`.eslintrc.json` → `eslint.config.js`) — needed before both the ESLint major bump and the Next 16 bump.
3. **Group 2** (sonner, lucide-react, eslint) — one PR, smoke-test toasts and a page with icons.
4. **Group 3**, one package at a time: zod+resolvers together, then recharts, then tailwind-merge, then date-fns. Each gets its own PR so a regression is traceable.
5. **react-day-picker 8→10** — dedicated PR, visually verify every date picker in the app (candidate scheduling, filters, etc.).
6. **framer-motion 11→13** — dedicated PR, check all 13 animation sites.
7. **Tailwind 3→4** — dedicated PR, the single largest visual-regression risk. Do this with the dev server running and click through every page.
8. **TypeScript 5→7** — dedicated PR, run full typecheck + build.
9. **Next.js 15→16** — dedicated PR, last, since it depends on the ESLint flat-config work and benefits from everything else already being current. Use the official codemod.

After each PR: run `npm run typecheck`, `npm run lint`, `npm run build`, and manually click through the app in a browser before merging — this project doesn't have an automated test suite, so manual verification is the only safety net.

## General process for any single package bump

```bash
npm info <package> versions --json     # see what's actually available
npm install <package>@latest           # or a pinned major, e.g. @2
npm run typecheck && npm run lint && npm run build
npm run dev                            # click through affected pages
```

Check each package's changelog/migration guide before bumping — GitHub releases page or `CHANGELOG.md` in the package repo. For the "high-risk" group specifically, search for an official migration guide by name (most of these — Next.js, Tailwind, TypeScript — publish one) rather than upgrading blind.

## What's out of scope here

This document is research and a plan only — no packages have been upgraded as part of producing it. Each numbered step above should be its own conversation/PR when you're ready to act on it.
