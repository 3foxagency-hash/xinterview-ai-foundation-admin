# XInterview — Design System (as implemented)

**Version:** 2.0 · **Status:** LOCKED — final, in production use
**Source spec:** `XInterview_Design_System_v2_0_Complete.pdf` (not in this repo — this file is the code-accurate distillation of it)
**Tokens live in:** [app/globals.css](../app/globals.css) (CSS custom properties) + [tailwind.config.ts](../tailwind.config.ts) (Tailwind class exposure)

## Read this before touching any color, spacing, radius, shadow, or z-index in this codebase

If you are an LLM (or a person) about to write or edit UI in this repo: **do not invent a color, a hex value, or a Tailwind class that isn't listed below.** Every value in the product traces back to a token in `globals.css`. If you need a color that doesn't exist yet, that is a design-system change, not a one-off — extend the token layer first (see "Extending the system" at the bottom), then use it.

This file documents what is **actually wired up in the code right now**, not just what the spec PDF says. Where the two differ, the difference is called out explicitly — follow this file, not your memory of the PDF.

---

## 1. The core rule: three-layer color contract

Every color on screen answers exactly one question. If you can't say which, it shouldn't be there.

| Layer | Question | Colors allowed | Tailwind classes |
|---|---|---|---|
| **Territory** | Where am I? | Module color (blue/emerald/amber/coral/teal/neutral) | `bg-jobs`, `text-candidates-ink`, `bg-interviews-wash-2`, etc. |
| **Action** | What can I do? | Indigo only | `bg-primary`, `text-primary-ink`, `border-primary` |
| **State** | What's happening? | Semantic success/info/warning/error | `bg-success-wash`, `text-error-ink`, etc. |

Non-negotiables:
- Canvas (`bg-background`) is always the app background; white (`bg-surface`) is always the card/table/form/sidebar surface. Never swap them.
- No pale/tinted indigo surfaces anywhere. Indigo is full-strength or it doesn't appear.
- Tables and forms are always neutral — color enters a table only through a badge or chip, never a row background.
- Coral (`ai`/`accent-ai` tokens) means AI and nothing else — never destructive, never decorative.
- At most two large tinted areas per screen (a stat band and, optionally, an AI panel).

---

## 2. Surfaces & text — the tokens everything else builds on

| Concept | CSS var | Tailwind class | Hex (light) | Hex (dark) |
|---|---|---|---|---|
| App background | `--canvas` (aliased via `--background`) | `bg-background` | `#FAFAFA` | `#0A0A0A` |
| Card/table/form/sidebar surface | `--surface-page` (via `--surface`) | `bg-surface` | `#FFFFFF` | `#141414` |
| Selected rows, wells, chips | `--surface-2` | `bg-surface-2` | `#F4F4F5` | `#1C1C1C` |
| Hover fill (ghost controls, nav) | `--surface-hover` | `bg-surface-hover` | `#F0F0F0` | `#232323` |
| Read-only field background | `--surface-sunken` | `bg-surface-sunken` | `#F5F5F5` | `#181818` |
| Modal/drawer backdrop | `--overlay` | `bg-overlay` | `rgba(10,10,10,.45)` | `rgba(0,0,0,.65)` |
| Primary text | `--text-1` (via `--heading`/`--body`/`--foreground`) | `text-heading` / `text-bodyText` / `text-foreground` | `#171717` | `#F5F5F5` |
| Secondary text | `--text-2` (via `--muted`) | `text-muted` / `text-muted-foreground` | `#404040` | `#C4C4C4` |
| Helper/caption text | `--text-3` | `text-text-3` | `#595959` | `#9E9E9E` |
| Chart axis labels **only** | `--text-4` | `text-text-4` | `#6E6E6E` | `#8A8A8A` |
| Disabled text | `--text-disabled` | `text-text-disabled` | `#A3A3A3` | `#5C5C5C` |
| Text on filled/dark surfaces | `--text-inverse` | `text-text-inverse` | `#FFFFFF` | `#0A0A0A` |
| Card/table/divider border | `--border-hairline` (via `--border`) | `border-border` | `#E5E5E5` | `#2A2A2A` |
| Input/secondary-button border | `--border-strong-token` (via `--border-strong`) | `border-border-strong` | `#D4D4D4` | `#3A3A3A` |
| Hover border | `--border-hover-token` (via `--border-hover`) | `border-border-hover` | `#A3A3A3` | `#52525b` |

**Never use `text-3`/`text-4` for live body copy** — `text-3` is caption/helper only, `text-4` is chart axes only. Disabled text (`text-disabled`) is never used for anything a user is meant to read as active content.

---

## 3. Brand indigo & AI coral

| Token | Class | Light | Dark |
|---|---|---|---|
| Primary (buttons, active nav, focus, links) | `bg-primary` / `text-primary` | `#5B4FE9` | `#7C71F0` |
| Primary hover | `bg-primary-hover` | `#4338CA` | `#9188F3` |
| Primary pressed | `bg-primary-active` | `#3730A3` | `#A79EF6` |
| Primary link/ink text | `text-primary-ink` | `#4338CA` | `#A79EF6` |
| AI fill | `bg-ai` | `#FF6B4A` | `#FF8266` |
| AI hover (lightens, not darkens) | `bg-ai-hover` | `#FF8261` | `#FF9B84` |
| AI pressed | `bg-ai-pressed` | `#FF9A7D` | `#FFB09C` |
| AI text/label | `text-ai-ink` | `#C2410C` | `#FFA98F` |
| AI text on wash-2 / 11px micro-labels | `text-ai-ink-strong` | `#9A3412` | — |
| AI subtle panel bg | `bg-ai-wash` | `#FEF1EC` | `#2A1710` |
| AI visible card/badge bg | `bg-ai-wash-2` | `#FDE2D7` | `#371B0C` |
| AI panel border | `border-ai-border` | `#F5BFA8` | `#45210F` |

**AI buttons always use dark text on coral (`text-heading` / near-black), never white.** Hover and pressed states get *lighter*, never darker — darkening drops the label below AA contrast. This is implemented in `components/ui/button.tsx`'s `ai` variant.

There is no `primary-soft`/pale-indigo token by design. A control that needs a soft indigo-adjacent background uses `bg-surface-2` (neutral) with `text-primary`/`text-primary-ink` for the accent — never a tinted indigo fill.

---

## 4. Module color territories

Seven families, each with the same six-token shape: `{module}` (base fill), `{module}-ink`, `{module}-ink-strong`, `{module}-wash`, `{module}-wash-2`, `{module}-border`.

| Module | Base (light) | Base (dark) | Tailwind prefix |
|---|---|---|---|
| Jobs — blue | `#1B8FD1` | `#7FC4EE` | `jobs` (e.g. `bg-jobs-wash-2`, `text-jobs-ink`) |
| Candidates — emerald | `#0E9F6E` | `#6EDBB0` | `candidates` |
| Interviews — amber | `#E08A1E` | `#F0B95C` | `interviews` |
| Evaluations / AI — coral | `#FF6B4A` | `#FF8266` | `ai` (shares the AI token set above) |
| Reports — teal | `#159F96` | `#5FD3CA` | `reports` |
| Settings — neutral | `#525252` | `#C4C4C4` | `settings` |
| Dashboard — indigo | `#5B4FE9` | `#7C71F0` | uses `primary` directly — **no wash, no wash-2**. Dashboard KPI cards are white with a 3px indigo top bar, never a tinted fill. |

`base` is a fill/icon/chart-series color only — **never used for text**. `ink` is text on white/wash (AA contrast). `ink-strong` is text on wash-2 and all 11px micro-labels. Module color and semantic color never mix in the same component — a badge is either a status badge (semantic) or a module chip (territory), never both.

**Not yet wired up:** `data-module="jobs"` container scoping (spec §23) and the stat-band component (spec §11.2) don't exist in the codebase yet — there's no current page that needs them. The tokens above are ready for both whenever a screen does.

---

## 5. Semantic state colors

| State | Base | Ink | Wash | Border | Tailwind |
|---|---|---|---|---|---|
| Success | `#059669` | `#047857` | `#EDF7F1` | `#BBE5CD` | `bg-success`, `text-success-ink`, `bg-success-wash`, `border-success-border` |
| Info | `#0284C7` | `#0369A1` | `#EFF6FC` | `#BDDCF0` | `bg-info`, `text-info-ink`, `bg-info-wash`, `border-info-border` |
| Warning | `#D97706` | `#B45309` | `#FDF6EA` | `#F5DBA8` | `bg-warning`, `text-warning-ink`, `bg-warning-wash`, `border-warning-border` |
| Error | `#DC2626` | `#B91C1C` | `#FDF0F0` | `#F5C2C2` | `bg-error`, `text-error-ink`, `bg-error-wash`, `border-error-border` |

Full dark-mode remap exists for all four (see `globals.css` `.dark` block). `error` additionally has an `active`/pressed shade (`bg-error-active`, `#991B1B` light / `#B91C1C` dark) used by the destructive button's pressed state.

---

## 6. Radius, shadow, spacing, z-index, motion

### Radius
| Token | Value | Use | Class |
|---|---|---|---|
| `--r-xs` | 4px | Chips, tag squares, checkbox | `rounded-xs` |
| `--r-sm` | 6px | Badges, small controls, nav item | `rounded-sm` |
| `--r-md` | 8px | Buttons, inputs, dropdowns, popovers | `rounded-md` |
| `--r-lg` | 12px | Cards, stat bands, table container | `rounded-lg` |
| `--r-xl` | 16px | Modals, drawers, large panels | `rounded-xl` |
| `--r-pill` | 9999px | Badges, avatars, pills, switch track | `rounded-full` |

### Shadow — borders define edges; shadow is for things that genuinely float
| Token | Value | Use |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(16,24,40,.05)` | Cards (optional lift), stat bands |
| `shadow-md` | `0 4px 12px rgba(16,24,40,.08)` | Dropdown, popover, tooltip |
| `shadow-lg` | `0 12px 32px rgba(16,24,40,.12)` | Drawer, command palette |
| `shadow-xl` | `0 16px 48px rgba(16,24,40,.16)` | Modal |

A card with only a hairline border and no shadow is nearly invisible against `bg-background` (they're ~2% apart in luminance by design). `globals.css` has a standing rule — `.border-border.bg-surface { box-shadow: var(--shadow-sm); }` — that gives every such card a shadow automatically. Don't fight this by stripping shadow off a card unless you have a specific reason.

### Spacing (Tailwind's numeric scale, extended to match exactly)
`1`=4px `2`=8px `3`=12px `4`=16px `5`=20px `6`=24px `8`=32px `10`=40px `12`=48px `16`=64px

### Z-index — every layered element uses a named class, never a raw number
`z-base`(0) `z-sticky`(10) `z-savebar`(20) `z-sidebar`(30) `z-topbar`(40) `z-dropdown`(50) `z-drawer-backdrop`(55) `z-drawer`(60) `z-modal-backdrop`(70) `z-modal`(71) `z-toast`(80) `z-tooltip`(90) `z-command`(100)

If you're adding a floating/overlay element, pick the matching class instead of `z-50`/`z-[60]`/etc. This was a real bug class in this codebase — several shadcn primitives shipped with raw `z-50` and have since been migrated.

### Motion
`--dur-fast`(120ms) `--dur-snap`(160ms) `--dur-base`(200ms) `--dur-slow`(240ms), easing `--ease-out: cubic-bezier(.16,1,.3,1)`. No bounce, no overshoot, no scale-on-press — color change only. Respect `prefers-reduced-motion` (handled globally in `globals.css`).

---

## 7. Components already built to spec

These exist in `components/ui/` and already consume the token layer correctly — extend them, don't fork them:

- **Button** (`button.tsx`) — variants `default` (primary), `secondary`, `ghost`, `link`, `ai`, `destructive`, `destructive-quiet`, plus legacy `outline`. Disabled state for filled variants (`bg-primary`/`bg-ai`/`bg-error`) is forced to a flat `bg-surface-2`/`text-disabled` via a `globals.css` rule scoped to those classes specifically — it does **not** apply to plain `<button>` elements generally, so it won't clobber Radix Switch/Checkbox/Tabs (which also render as `<button>`).
- **Badge** (`badge.tsx`) — variants `default`, `success`, `info`, `warning`, `error`, `ai`, plus legacy `primary`/`destructive`/`outline`. Pill radius, wash bg + ink text.
- **StatusBadge** (`components/settings/status-badge.tsx`) — dot + wash + ink pattern, real spec-shaped implementation (not a generic Badge).
- **Card** (`card.tsx`) — `rounded-lg` (12px) + `border` (hairline, gets the auto-shadow rule above) + `shadow-sm`.
- **Input / Textarea / Select** (`input.tsx`, `textarea.tsx`, `select.tsx`) — rest border `border-input` (→ `border-strong`), hover `border-border-hover`, focus `border-primary`, disabled `bg-surface-2` + `text-disabled` + `border-border`.
- **Table** (`table.tsx`) — white surface, `rounded-lg` container, `border-border` rows, header 44px/`text-muted`, row hover `bg-background`, selected row `bg-surface-2` + indigo left border.
- **Dialog / AlertDialog / Sheet / Drawer** — backdrop `bg-overlay` at `z-modal-backdrop`/`z-drawer-backdrop`, surface `bg-surface`, modal radius `rounded-xl` + `shadow-xl`, no border.
- **Popover / DropdownMenu / Tooltip / Select** listbox — `z-dropdown` / `z-tooltip`, `bg-popover` (→ white), hairline border, `shadow-md`.
- **Sidebar nav item + settings sub-nav** (`components/sidebar/nav-item.tsx`, `components/settings/settings-sub-nav.tsx`) — active item is a **solid** `bg-primary`/`text-primary-foreground` pill, never a tinted background. This is the one rule the spec calls out most emphatically (rule #3 in the non-negotiables) — don't regress it back to a pale/tinted active state.
- **Rich text editor** (`components/wizard/rich-text-editor.tsx`) — the expand-to-fullscreen toggle restyles the *same* DOM element rather than swapping components, specifically because an earlier version that swapped to a Radix `Dialog` caused the editable box to remount empty on every expand/collapse. If you ever need to make this fullscreen behavior use a portal again, you must re-sync `value` into the new node yourself.

### Components from the spec's inventory (§25) that do **not** exist yet
Stat band/stat card, module `data-module` scoping, toast content styling beyond the base Sonner wiring, command palette, stepper/wizard indicator, avatar/avatar group, score chip, module chip, file upload, tag input, rating input, date/time picker beyond the native `calendar.tsx`. Build these against the tokens above when a real screen needs them — don't scaffold them speculatively.

---

## 8. Known, deliberate deviations from the spec PDF

The PDF is the design intent; this is what shipped. Follow the code, not the PDF, when they disagree — and if you change the code, update this file in the same change.

| Spec says | Code does | Why |
|---|---|---|
| Dark mode via `[data-theme="dark"]` | Dark mode via `.dark` class on `<html>` | Matches this repo's existing `next-themes` wiring (`attribute="class"` in `app/layout.tsx`). Changing the selector strategy would be a much bigger, riskier change than the visual result is worth. |
| Field height 36px default | Inputs stay at the pre-existing 40px (`h-10`) | Resizing every control's height is a layout change with app-wide ripple effects that can't be verified without a browser; out of scope for a color/token pass. |
| Button sizes 32/36/40px (sm/md/lg) | Buttons keep their pre-existing 40/36/44px (default/sm/lg) heights | Same reasoning — colors, variants, radius and states were brought to spec; exact pixel heights were not, to avoid an unreviewed layout-wide change. |
| `--text` (canonical name) | `--text-1` internally, exposed as `text-heading`/`text-bodyText`/`text-foreground` | Avoids colliding with dozens of already-existing component classes that reference `text-heading`/`text-body` throughout the codebase. |

---

## 9. Extending the system

1. **Need a color that isn't above?** You almost certainly don't — try an existing module or semantic token first.
2. If it's genuinely new, it needs the full six-token shape (base/ink/ink-strong/wash/wash-2/border) plus a dark-mode set, added to **both** `app/globals.css` (`:root` and `.dark`) **and** `tailwind.config.ts`'s `colors` object — never just one.
3. Never hardcode a hex value or an arbitrary Tailwind value (`bg-[#...]`, `z-[60]`) in a component. If you're reaching for one, the token layer is missing something — fix the token layer, not the component.
4. **Legitimate exceptions** (verified, don't "fix" these): user-customizable brand colors (career page branding, score-band color pickers) — those are a *different* customer's own token system, not this one. Decorative one-off marketing panels (the auth pages' dark hero mockup, `video-panel.tsx`'s `#0A0A14` background) are also exempt — they're not part of the app chrome this system governs.
5. After adding a token, update this file's tables in the same change. This file is only useful if it stays true.
