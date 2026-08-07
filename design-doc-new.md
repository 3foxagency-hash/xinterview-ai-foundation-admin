# XInterview Design System

### Admin Dashboard — Full Reference

This is the single source of truth for visual design on the XInterview admin dashboard. It covers
typefaces, color, typography, spacing, components, data visualization, states, and accessibility.

Light and dark are both first-class. Every token has a value in each.

---

## 1. Principles

1. **Hierarchy comes from typography and spacing first**, surfaces and borders second, color last.
2. **A surface or a border must be earned.** If spacing expresses the grouping, don't draw a box.
   Do not wrap every metric, section, and comparison in a card.
3. **Color signals state, never importance.** Blue = link, focus, info. Red = error. Amber = warning.
   Green = success. Nothing is colored because it happens to be the good number.
4. **Text you expect someone to read is near-black.** Gray is reserved for text meant to be skipped.
   This is not a style choice — it is the rule the whole system rests on. See §4.
5. **Three font weights, no more.** 400 for reading, 500 for interactive, 600 for headings.
6. **One radius.** 6px on nearly everything.

---

## 2. Typefaces

```css
--font-sans:
  "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-mono:
  "Geist Mono", ui-monospace, "SF Mono", Menlo, Monaco, "Courier New", monospace;
```

Geist Sans and Geist Mono are licensed under the SIL Open Font License — free for commercial use.

**Install**

```bash
npm install geist
```

```jsx
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

**Weights — three, with strict roles**

| Weight | Role                                                                             |
| ------ | -------------------------------------------------------------------------------- |
| 400    | Body copy, table cells, descriptions, paragraphs                                 |
| 500    | UI and interactive text — nav items, buttons, form labels, table headers, badges |
| 600    | Headings and emphasis                                                            |

Never use 700. If something is not loud enough at 600, make it larger, not heavier. Hierarchy in
this system comes from size and letter-spacing, not weight.

**Where Geist Mono is used**

Candidate IDs, interview IDs, timestamps, durations, match scores, API keys, plan labels, and short
uppercase eyebrow labels. Set only the identifier in mono — never the whole sentence, never a whole
table. Add `font-feature-settings: "tnum"` to any column of numbers that must align vertically.

Never mix Sans and Mono inside a single text block.

**Font smoothing**

`-webkit-font-smoothing: antialiased` thins strokes on macOS. It is safe here only because the text
underneath is near-black. Set text color correctly first (§4), then apply smoothing.

---

## 3. Color — Light Theme

**Backgrounds**

| Token            | Hex       | Use                                                     |
| ---------------- | --------- | ------------------------------------------------------- |
| `background-100` | `#ffffff` | Page, cards, sidebar, inputs — the default surface      |
| `background-200` | `#fafafa` | Secondary surface, used sparingly for subtle separation |

**Gray scale.** The step number encodes intent, not lightness. Pick the step by what you are doing,
not by how dark it looks.

| Token       | Hex       | Meaning                                        |
| ----------- | --------- | ---------------------------------------------- |
| `gray-100`  | `#f2f2f2` | Default component background · active nav fill |
| `gray-200`  | `#ebebeb` | Hover background                               |
| `gray-300`  | `#e6e6e6` | Active / pressed background                    |
| `gray-400`  | `#eaeaea` | **Default border**                             |
| `gray-500`  | `#c9c9c9` | Hover border                                   |
| `gray-600`  | `#a8a8a8` | Active border                                  |
| `gray-700`  | `#8f8f8f` | Disabled text, placeholders                    |
| `gray-800`  | `#7d7d7d` | High-contrast fill, hover                      |
| `gray-900`  | `#4d4d4d` | **Secondary text and icons**                   |
| `gray-1000` | `#171717` | **Primary text, icons, and primary buttons**   |

> `gray-400` (`#eaeaea`) is intentionally _lighter_ than `gray-300` (`#e6e6e6`). It derives from the
> alpha border value composited on white. Not a typo — use `gray-400` for borders regardless.

**Gray alpha.** Translucent, so it layers correctly over any background. Use for borders, dividers,
overlays, and hover states.

| Token            | Value       |     | Token             | Value       |
| ---------------- | ----------- | --- | ----------------- | ----------- |
| `gray-alpha-100` | `#0000000d` |     | `gray-alpha-600`  | `#0000003d` |
| `gray-alpha-200` | `#00000015` |     | `gray-alpha-700`  | `#00000070` |
| `gray-alpha-300` | `#0000001a` |     | `gray-alpha-800`  | `#00000082` |
| `gray-alpha-400` | `#00000014` |     | `gray-alpha-900`  | `#000000b3` |
| `gray-alpha-500` | `#00000036` |     | `gray-alpha-1000` | `#000000e8` |

**Blue** — links, focus rings, info, Beta tags

| 100       | 200       | 300       | 400       | 500       | 600       | **700**       | 800       | 900       | 1000      |
| --------- | --------- | --------- | --------- | --------- | --------- | ------------- | --------- | --------- | --------- |
| `#f0f7ff` | `#e9f4ff` | `#dfefff` | `#cae7ff` | `#94ccff` | `#48aeff` | **`#006bff`** | `#0059ec` | `#005ff2` | `#002359` |

**Accent scales.** Each runs `100`–`1000` on the same intent mapping. Key steps:

| Scale  | 100 (fill) | 400 (border) | 700 (solid) | 800 (solid hover) | 900 (text) | Meaning                       |
| ------ | ---------- | ------------ | ----------- | ----------------- | ---------- | ----------------------------- |
| Red    | `#ffeeef`  | `#f9c5c8`    | `#e5484d`   | `#da3036`         | `#ca2a30`  | Rejected, failed, destructive |
| Amber  | `#fff6e5`  | `#ffdd9e`    | `#ffb224`   | `#ff990a`         | `#a35200`  | Pending, needs review         |
| Green  | `#eefcf1`  | `#b4dfc4`    | `#45a557`   | `#3d9a50`         | `#297c3b`  | Hired, passed, completed      |
| Purple | `#fbf3fe`  | `#e5d3f7`    | `#8e4ec6`   | `#8347b9`         | `#793aaf`  | AI-generated (§16)            |

> **Sourcing.** The backgrounds, gray scale, gray-alpha ladder, and blue scale above are taken
> directly from Vercel's published Geist token file. The red / amber / green / purple steps and the
> dark theme in §3.1 could not be read from a public source and are the standard Geist values.
> §23 has a 30-second browser snippet that extracts the real values — run it before locking the theme.

### 3.1 Color — Dark Theme

Same token names, different values. Dark is not an inversion of light.

| Token            | Hex       |     | Token       | Hex       |
| ---------------- | --------- | --- | ----------- | --------- |
| `background-100` | `#0a0a0a` |     | `gray-500`  | `#454545` |
| `background-200` | `#000000` |     | `gray-600`  | `#878787` |
| `gray-100`       | `#1a1a1a` |     | `gray-700`  | `#8f8f8f` |
| `gray-200`       | `#1f1f1f` |     | `gray-800`  | `#7d7d7d` |
| `gray-300`       | `#292929` |     | `gray-900`  | `#a1a1a1` |
| `gray-400`       | `#2e2e2e` |     | `gray-1000` | `#ededed` |

The polarity flips: in dark mode the **primary button is `gray-1000` (near-white) with
`background-100` (near-black) text.** It is still "the ink," inverted.

Accent solids hold: blue-700 `#0072f5` · red-700 `#e5484d` · amber-700 `#ffb224` ·
green-700 `#45a557` · purple-700 `#8e4ec6`.

Accent _text_ steps lighten: blue-900 `#52a8ff` · red-900 `#ff6166` · amber-900 `#f1a10d` ·
green-900 `#62c073` · purple-900 `#bf7af0`.

Gray-alpha uses white on the same ladder: `#ffffff0d`, `#ffffff15`, `#ffffff1a`, `#ffffff14`, …

---

## 4. Text and icon color

This is the most important table in the document. Every piece of text on every screen belongs to
exactly one of these three tiers.

### Tier 1 — Primary · `gray-1000` · `#171717` light / `#ededed` dark · 17.9 : 1

Everything the user is meant to read:

- Sidebar nav labels — at rest, on hover, and when active
- Sidebar nav icons
- Page titles and all headings
- Card titles and stat numbers
- The primary column of any table (candidate name, job title, interview title)
- Form field labels and input values
- Button labels on Secondary and Tertiary buttons
- Body paragraphs and list item titles
- The user's own name in the account row

### Tier 2 — Secondary · `gray-900` · `#4d4d4d` light / `#a1a1a1` dark · 8.5 : 1

Supporting text the eye passes over on the way to something else:

- Table column headers
- Sub-text beneath a primary value ("Senior Engineer", "Recruiter", "Third Party")
- Timestamps and metadata
- Helper text under a form field
- Section eyebrow labels
- Chevrons, expand carets, sort arrows, the search magnifier
- The caption line on a stat card
- Breadcrumb ancestors

### Tier 3 — Muted · `gray-700` · `#8f8f8f` · 3.2 : 1 — **fails WCAG AA**

Only two uses:

- Input placeholder text
- Disabled items — label and icon together

**Never use `gray-700` for content anyone is expected to read.** A well-built screen has almost none
of it. If a placeholder and a disabled row are the only `gray-700` on the page, that is correct.

There is no fourth tier. If a piece of text does not fit one of these rows, it probably should not
be on the screen.

---

## 5. Typography Scale

Four token families. `copy-14` and `label-14` cover most of the dashboard.

**Headings** — weight 600. Letter-spacing tightens as size grows.

| Token        | Size / Line height | Tracking  | Use                                       |
| ------------ | ------------------ | --------- | ----------------------------------------- |
| `heading-48` | 48 / 56            | `-2.88px` | Marketing only                            |
| `heading-40` | 40 / 48            | `-2.4px`  | Onboarding, first-run screens             |
| `heading-32` | 32 / 40            | `-1.28px` | Page hero · **stat card numbers**         |
| `heading-24` | 24 / 32            | `-0.96px` | **Page title** — "Candidates", "Settings" |
| `heading-20` | 20 / 26            | `-0.4px`  | Section header, modal title               |
| `heading-16` | 16 / 24            | `-0.32px` | Card title                                |
| `heading-14` | 14 / 20            | `0`       | Dense card title, table section header    |

**Copy** — multi-line body text, weight 400, taller line height.

| Token     | Size / Line height | Use                                  |
| --------- | ------------------ | ------------------------------------ |
| `copy-24` | 24 / 36            | Lede paragraph                       |
| `copy-20` | 20 / 30            | Large intro text                     |
| `copy-18` | 18 / 28            | Report summary intro                 |
| `copy-16` | 16 / 24            | AI report body, primary reading text |
| `copy-14` | 14 / 20            | **Default body text, table cells**   |
| `copy-13` | 13 / 18            | Sub-text, metadata, helper text      |

**Labels** — single-line, scannable, weight 500.

| Token      | Size / Line height | Use                                      |
| ---------- | ------------------ | ---------------------------------------- |
| `label-20` | 20 / 26            | Large section label                      |
| `label-16` | 16 / 24            | Wordmark, prominent label                |
| `label-14` | 14 / 20            | **Nav items, form labels, list rows**    |
| `label-12` | 12 / 16            | Table headers, badges, eyebrows, keycaps |

**Buttons** — weight 500.

`button-16` (16 / 20) · **`button-14` (14 / 20)** · `button-12` (12 / 16)

**Rules**

- Page titles: `heading-24`, `gray-1000`, never colored.
- Sidebar nav items: `label-14` — 14px / 20px / weight 500 / `gray-1000`.
- Table column headers: `label-12`, weight 500, `gray-900`, **sentence case, not uppercase**.
- Stat numbers: `heading-32`, `gray-1000`, tabular figures.
- The mono uppercase eyebrow (`label-12` mono, `+0.4px` tracking, `gray-900`) is the one decorative
  typographic move the system allows. Use it above content sections, sparingly. Not in the sidebar.
- Keep prose to 60–68 characters per line. Rewrite before shrinking type.
- Fix a stranded word in a heading by editing the copy or the measure, never by shrinking one element.
- Enable ligatures globally: `font-feature-settings: "liga" 1`.

---

## 6. Spacing & Layout

**4px scale: `4, 8, 12, 16, 24, 32, 40, 64, 96`.** No arbitrary pixel values.

**Three-step rhythm.** Memorize this and most layout questions answer themselves.

| Relationship                                   | Gap       |
| ---------------------------------------------- | --------- |
| Inside a group — icon to label, label to value | `8px`     |
| Between groups                                 | `16px`    |
| Between sections                               | `32–40px` |

**Card padding:** `24px` default · `16px` compact · `32px` hero.

**Every gap has exactly one owner.** The flex or grid container sets it; children add no margins.
Reset the margins of grouped direct children rather than patching one awkward transition.

**Grid**

| Property       | Value                                                   |
| -------------- | ------------------------------------------------------- |
| Columns        | 12                                                      |
| Page max width | `1400px`                                                |
| Sidebar width  | `260px` fixed, `64px` collapsed                         |
| Breakpoints    | `sm` 401 · `md` 601 · `lg` 961 · `xl` 1200 · `2xl` 1400 |

Reading prose occupies 6–7 columns. Tables, charts, and major comparisons may use all 12.

**Radius — three values, that is all**

| Token         | Value    | Use                                                                  |
| ------------- | -------- | -------------------------------------------------------------------- |
| `radius-sm`   | `6px`    | Buttons, inputs, cards, panels, menus, nav items — nearly everything |
| `radius-md`   | `8px`    | Modals and large dialogs only                                        |
| `radius-full` | `9999px` | Status pills and avatars only                                        |

**Control heights — one ladder for buttons, inputs, and selects**

| Size                 | Height | Horizontal padding | Type        |
| -------------------- | ------ | ------------------ | ----------- |
| Small                | `32px` | `0 6px`            | `button-14` |
| **Medium (default)** | `40px` | `0 10px`           | `button-14` |
| Large                | `48px` | `0 14px`           | `button-16` |

Sidebar nav items are `36px` — the one exception, because they sit in a denser stack.

---

## 7. Elevation

Hierarchy comes from tonal surfaces and 1px hairlines first. Shadows stay almost invisible.

| Level              | Light                                                                                             | Dark                                          |
| ------------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Raised card        | `0 2px 2px rgba(0,0,0,0.04)`                                                                      | Hairline only, no shadow                      |
| Popover / dropdown | `0 1px 1px rgba(0,0,0,0.02), 0 4px 8px -4px rgba(0,0,0,0.04), 0 16px 24px -8px rgba(0,0,0,0.06)`  | Same geometry, `gray-400` hairline carries it |
| Modal              | `0 1px 1px rgba(0,0,0,0.02), 0 8px 16px -4px rgba(0,0,0,0.04), 0 24px 32px -8px rgba(0,0,0,0.06)` | Same                                          |

**Use `box-shadow: 0 0 0 1px rgba(0,0,0,0.08)` instead of a CSS border on containers.** A CSS border
changes the box model and shifts layout on hover; the shadow ring does not. This is the single most
recognizable implementation detail of the system.

In dark mode, shadows do nothing on near-black. Define every edge with `gray-400` (`#2e2e2e`).

---

## 8. Buttons

| Variant       | Fill             | Border           | Text             | Use                                            |
| ------------- | ---------------- | ---------------- | ---------------- | ---------------------------------------------- |
| **Primary**   | `gray-1000`      | none             | `background-100` | The one main action per screen                 |
| **Secondary** | `background-100` | `gray-alpha-400` | `gray-1000`      | Supporting actions, Cancel                     |
| **Tertiary**  | transparent      | none             | `gray-1000`      | Low-emphasis actions; gray-alpha tint on hover |
| **Error**     | `red-800`        | none             | `#ffffff`        | Destructive only — Delete, Reject              |

**States — the scale does the work**

| State    | Treatment                                                                   |
| -------- | --------------------------------------------------------------------------- |
| Hover    | Fill steps `100` → `200`; border steps `400` → `500`                        |
| Active   | Fill steps `200` → `300`; border steps `500` → `600`                        |
| Disabled | `gray-100` fill, `gray-700` text, `cursor: not-allowed`                     |
| Loading  | Label stays, 16px spinner replaces the leading icon, button non-interactive |
| Focus    | `box-shadow: 0 0 0 2px var(--background-100), 0 0 0 4px var(--blue-700)`    |

**Hover animates `background-color` and `color` only.** No transform, no scale, no opacity shift.

**Rules**

- One Primary button visible per view.
- There is no colored "special" variant. Importance is expressed by position and by being the only
  filled button on the screen.
- Icon buttons are square at the same height ladder (32 / 40 / 48) with a 16px icon in `gray-1000`.

---

## 9. Inputs & Forms

| Property    | Value                       |
| ----------- | --------------------------- |
| Fill        | `background-100`            |
| Border      | 1px `gray-alpha-400`        |
| Radius      | `6px`                       |
| Height      | `40px` (32 small, 48 large) |
| Padding     | `0 12px`                    |
| Value text  | `label-14`, **`gray-1000`** |
| Placeholder | `gray-700`                  |

**Value color and placeholder color are different tokens.** Do not use one for both.

- **Label** above the field: `label-14` weight 500, `gray-1000`, `8px` gap to the field.
- **Helper text** below: `copy-13` `gray-900`, `8px` gap.
- **Error:** border `red-700`, helper text `red-900`, plus a 16px inline icon. Never color alone.
- **Focus:** the two-layer blue ring. Never remove focus rings.
- Field to field: `16px`. Group to group: `24px`.
- Preserve invalid entries rather than silently clamping or resetting them.

**Keyboard-shortcut keycap** (as in a search field): 20×20px, 1px `gray-400` border, `4px` radius,
`label-12` mono, `gray-900`, right-aligned inside the input.

**Checkbox:** 16px, `4px` radius, 1px `gray-400`. Checked: `gray-1000` fill, white check glyph.
**Radio:** 16px circle, 1px `gray-400`. Checked: 5px `gray-1000` centre dot.
**Switch:** 36×20 track, `6px`→`9999px` radius, `gray-400` off / `gray-1000` on, 16px white thumb.

---

## 10. Sidebar / Navigation

**Container**

| Property           | Value                                                 |
| ------------------ | ----------------------------------------------------- |
| Width              | `260px` fixed · `64px` collapsed                      |
| Background         | `background-100` `#ffffff` (light) / `#0a0a0a` (dark) |
| Right edge         | 1px `gray-400` vertical hairline                      |
| Horizontal padding | `8px` — nav items are inset, the hairline is not      |
| Section padding    | `8px` vertical                                        |

The sidebar is the same surface as the page, separated by a hairline. It is not a tinted slab.

**Workspace switcher (top row)**

24px avatar · workspace name `label-14` weight 500 `gray-1000`, truncated with ellipsis ·
plan badge as a pill (`gray-100` fill, `gray-900` text, `label-12`, `2px 8px`) · 16px up/down
chevron `gray-900` right-aligned. Row 40px, `6px` radius, `gray-100` on hover.

**Nav item**

| State          | Fill        | Label       | Icon        |
| -------------- | ----------- | ----------- | ----------- |
| Rest           | transparent | `gray-1000` | `gray-1000` |
| Hover          | `gray-100`  | `gray-1000` | `gray-1000` |
| **Active**     | `gray-100`  | `gray-1000` | `gray-1000` |
| Active + hover | `gray-200`  | `gray-1000` | `gray-1000` |
| Disabled       | transparent | `gray-700`  | `gray-700`  |

Height `36px` · radius `6px` · padding `0 8px` · icon 16px · icon-to-label gap `12px` ·
type `label-14` weight 500.

**The active state does not change text color.** The label stays near-black and a light gray fill
appears behind it. That is the entire active treatment — no colored text, no colored fill, no left
accent bar.

**Grouping**

Group with a **1px `gray-400` horizontal hairline** spanning the sidebar's inner width, `8px` above
and below. Prefer this over uppercase eyebrow labels — every eyebrow adds a block of gray text
competing with the nav labels beside it.

If a group genuinely needs a name, use `label-12` weight 500 `gray-900`, sentence case, `8px` bottom
margin.

**Trailing elements**

| Element            | Spec                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Count badge        | Pill, `gray-100` fill, `gray-900` text, `label-12`, `2px 8px`. Amber (`amber-100` / `amber-900`) only when the count needs attention. |
| `Beta` / `New` tag | Pill, `blue-100` fill, `blue-700` text, `label-12`                                                                                    |
| Expand caret       | 16px chevron-right, `gray-900`                                                                                                        |
| Unread dot         | 6px circle, `blue-700`                                                                                                                |

**Destructive item (e.g. "Danger zone")**

Label and icon `red-900`, hover fill `red-100`, paired with a warning-triangle glyph. This is the
only colored label permitted in the sidebar.

**Account row (bottom)**

Separated by a 1px `gray-400` hairline. 24px avatar or monogram — monogram uses `gray-100` fill with
`gray-1000` initials. Name `label-14` weight 500 `gray-1000`. Role `copy-13` `gray-900`.
16px chevron `gray-900`.

**Logo**

The brand mark is the one place brand color survives: a single 28px rounded-square mark. The wordmark
beside it is `label-16` weight 600 `gray-1000`. Brand color never spreads beyond the mark itself.

**Semantics**

Wrap in `<nav>`. Put `aria-current="page"` on the active item — the gray fill is not a screen-reader
signal.

---

## 11. Application Shell

| Element        | Light                                       | Dark             |
| -------------- | ------------------------------------------- | ---------------- |
| App background | `#ffffff`                                   | `#0a0a0a`        |
| Sidebar        | `#ffffff`                                   | `#0a0a0a`        |
| Card / panel   | `#ffffff` + `0 0 0 1px` gray-400 ring       | `#0a0a0a` + ring |
| Card hover     | `gray-100`                                  | `gray-100`       |
| Top bar        | transparent, 1px `gray-400` bottom hairline | same             |
| Page title     | `heading-24` `gray-1000`                    | same             |

**Stat cards.** No colored icon tiles. No decorative icon color cycling. A stat card is:

1. Mono uppercase `label-12` caption in `gray-900`
2. The number in `heading-32` `gray-1000` with tabular figures
3. An optional `copy-13` `gray-900` delta line

Color appears in a stat card only if the delta encodes a real state, and then it is always paired
with an arrow glyph.

**Breadcrumbs.** `copy-14`. Ancestors `gray-900`, current page `gray-1000`, `/` separator `gray-700`.

**Tabs.** `label-14` weight 500, 40px tall, `16px` gap. Rest `gray-900`; active `gray-1000` with a
2px `gray-1000` underline; hover `gray-1000`. Track hairline `gray-400` beneath the full row.

**Dropdown / menu.** `background-100` fill, `gray-400` ring, `6px` radius, popover shadow, `4px`
padding around the list. Items 32px tall, `label-14` `gray-1000`, `gray-100` on hover. Separators are
1px `gray-400` hairlines with `4px` spacing.

**Modal.** `background-100`, `8px` radius, modal shadow, `24px` padding, `512px` default max width.
Overlay `rgba(0,0,0,0.5)`. Title `heading-20` `gray-1000`. Close button is a 32px Tertiary icon
button, top-right. Actions right-aligned in the footer: Secondary then Primary.

**Tooltip.** `gray-1000` fill, `background-100` text, `copy-13`, `6px` radius, `4px 8px` padding.

**Pagination.** 32px square Secondary buttons. Current page: `gray-100` fill, `gray-1000` text.

**Avatar.** Circle. 24 / 32 / 40px. `gray-100` fill, `gray-1000` initials at `label-12` or `label-14`.

---

## 12. Tables & Data Grids

| Element                                  | Light                                             | Dark           |
| ---------------------------------------- | ------------------------------------------------- | -------------- |
| Header background                        | transparent                                       | transparent    |
| Header text                              | `label-12`, weight 500, `gray-900`, sentence case | `gray-900`     |
| Header bottom border                     | 1px `gray-400`                                    | 1px `gray-400` |
| Row border                               | 1px `gray-400`                                    | 1px `gray-400` |
| Row hover                                | `gray-100`                                        | `gray-100`     |
| Primary cell (candidate name, job title) | `copy-14` `gray-1000`                             | `gray-1000`    |
| Sub-text beneath it                      | `copy-13` `gray-900`                              | `gray-900`     |
| Zebra striping                           | **Not used** — hairlines and hover only           | same           |
| Row height                               | 48px normal · 40px compact                        | same           |

**Rules**

- Numeric columns (match score, duration, count) are **right-aligned, Geist Mono, tabular figures** —
  and so are their headers. A right-aligned column never gets a left-aligned header.
- IDs and timestamps: Geist Mono `copy-13` `gray-900`.
- Keep precision consistent down a column. No fake precision.
- Sort indicators: 16px chevrons in `gray-900`, never colored.
- Selection column: 16px checkbox per §9, plus a select-all in the header row.
- Bottom-align multi-line column headers.
- Reorder columns around the user's lookup task before shrinking or wrapping them. A table with five
  or more columns owns the full section width.
- Use a semantic `<table>` with `<caption>`, `<thead>`, `<tbody>`, and `scope` attributes.

---

## 13. Status Badges

Pill · `9999px` radius · `label-12` weight 500 · `2px 8px` padding · tinted `100` fill,
`900` text, `400` border.

| Status            | Fill        | Text        | Border      |
| ----------------- | ----------- | ----------- | ----------- |
| Hired / Passed    | `green-100` | `green-900` | `green-400` |
| In progress       | `blue-100`  | `blue-900`  | `blue-400`  |
| Pending review    | `amber-100` | `amber-900` | `amber-400` |
| Rejected / Failed | `red-100`   | `red-900`   | `red-400`   |
| Draft / Archived  | `gray-100`  | `gray-900`  | `gray-400`  |

Every badge carries a word. Color is never the only signal.

---

## 14. Data Visualization

Charts default to a **gray monochrome ramp**, with **one** series in blue when a single series
carries the argument.

| Series       | Light     | Dark      |
| ------------ | --------- | --------- |
| Focal series | `#006bff` | `#0072f5` |
| Series 1     | `#171717` | `#ededed` |
| Series 2     | `#7d7d7d` | `#7d7d7d` |
| Series 3     | `#a8a8a8` | `#878787` |
| Series 4     | `#c9c9c9` | `#454545` |

**Rules**

- Gridlines 1px `gray-400`. No bold axis lines. No dark rounded card wrapping the chart.
- **Direct labels beat legends.** Reserve a clear lane so no mark, line, or annotation crosses a
  label's glyph box.
- Zero baselines on every length encoding. Never crop bars to exaggerate a small difference; show
  the exact delta on the same basis.
- Do not turn a bar green because the number is favorable. Visual salience follows the argument.
- Every peer bar shares one documented scale, and its length must encode the value.
- Give every chart a caption stating what to notice and what it does not establish.
- Provide a semantic table or text alternative for material chart data.

---

## 15. Icons

- **Set:** Geist Icons (`npm install @geist-ui/icons`) or Lucide — both are 1.5px outline families
  sized correctly for Geist Sans. Do not mix families.
- **Size:** 16px is the dashboard default. 20px in page headers and empty states. 12px inside badges.
- **Color:** `gray-1000` wherever the icon sits beside primary text — nav items, buttons, list rows,
  form affordances. `gray-900` only for chevrons, carets, sort arrows, and the search magnifier.
  `gray-700` for disabled. Never colored decoratively. Never placed in a colored tile.
- **Gap:** `12px` to the label in the sidebar, `8px` inline.
- Align optically to the text baseline, not to the bounding box.
- Prefer a text label. Use an icon alone only where the action is unmistakable — close, search, more.

---

## 16. AI-Powered Surfaces

XInterview's AI features need a consistent marker so users always know what was machine-generated.
The system is achromatic by design, so that marker is expressed through **form, not hue**:

1. **A mono uppercase label.** `AI` in Geist Mono, `label-12`, `+0.4px` tracking, `gray-900`,
   placed beside the value.
2. **One consistent 16px sparkle icon** in `gray-900`, always paired with that label.
3. **A `gray-400` ring with a `background-200` fill** around AI-generated report blocks — set apart
   by surface, not by color.

**If a hue is required** — for example so the AI Match Score column is findable at a glance — the
only permitted forms are a **~10px indicator dot** in `purple-700` or a **numeral** in `purple-900`.
Never a purple fill, never a purple button, never a purple background.

**One carrier, used everywhere it applies, used nowhere else.** The moment the AI marker appears on
something that isn't AI-generated, it stops meaning anything.

The mono `AI` label is mandatory even when the purple numeral is present — per §17, color is never
the only signal.

---

## 17. Accessibility

**Contrast**

| Pair                               | Ratio    | Verdict                      |
| ---------------------------------- | -------- | ---------------------------- |
| `gray-1000` `#171717` on `#ffffff` | 17.9 : 1 | AAA                          |
| `gray-900` `#4d4d4d` on `#ffffff`  | 8.5 : 1  | AAA                          |
| `gray-700` `#8f8f8f` on `#ffffff`  | 3.2 : 1  | **Fails AA for normal text** |
| `gray-900` `#a1a1a1` on `#0a0a0a`  | 8.9 : 1  | AAA                          |

`gray-700` is the one trap in the palette. Placeholders and disabled states only.

**Requirements**

- Never convey status, or AI-versus-human, by color alone. Every badge carries a word; every AI
  surface carries the mono `AI` label; every inline error carries an icon.
- Focus rings are never removed. The two-layer ring exists so it survives on any surface.
- Landmarks, one `<h1>` per page, ordered headings, a skip link, native controls with visible labels.
- `<nav>` for the sidebar with `aria-current="page"` on the active item.
- Semantic `<table>` with caption, head, body, and `scope`.
- Give grid and flex children `min-width: 0` so dense tables reflow instead of overflowing.
- Respect `prefers-reduced-motion`. The base experience must be complete without motion.
- Light and dark must have equivalent hierarchy and contrast. Verify both before shipping.

---

## 18. Motion

Default to stillness. Motion only explains a state change, preserves continuity, or confirms an
action.

| Interaction                | Property                      | Duration | Easing                  |
| -------------------------- | ----------------------------- | -------- | ----------------------- |
| Hover / active on controls | `background-color`, `color`   | 120ms    | `ease`                  |
| Dropdown, popover open     | `opacity`, small `translateY` | 150ms    | `ease-out`              |
| Modal open                 | `opacity`, `scale(0.98 → 1)`  | 200ms    | `ease-out`              |
| Skeleton pulse             | `opacity`                     | 1200ms   | `ease-in-out`, infinite |

**Never:** auto-scrolling marquees, simulated typing cursors, pulsing status indicators, scroll-reveal
on every section, parallax, bounce, or hover transforms on interactive elements.

---

## 19. States & Feedback

| State            | Treatment                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Skeleton loading | `gray-100` blocks, `6px` radius, subtle opacity pulse. Never a colored shimmer.                                                        |
| Empty state      | `copy-14` `gray-1000` headline, `copy-13` `gray-900` supporting line, one 20px `gray-700` icon, one Secondary button. No illustration. |
| Error banner     | `red-100` fill, `red-900` text, 1px `red-400` ring, 16px icon, `6px` radius. No left accent bar.                                       |
| Warning banner   | `amber-100` fill, `amber-900` text, 1px `amber-400` ring.                                                                              |
| Info banner      | `blue-100` fill, `blue-900` text, 1px `blue-400` ring.                                                                                 |
| Success toast    | `background-100` fill, `gray-400` ring, `copy-14` `gray-1000`, 16px `green-700` check icon.                                            |
| AI processing    | `label-12` mono `gray-900` status text plus a 16px gray spinner. Quiet, not celebratory.                                               |
| Focus            | Two-layer blue ring, everywhere, always visible.                                                                                       |

---

## 20. CSS Tokens

```css
:root {
  /* type */
  --font-sans:
    "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, "SF Mono", Menlo, Monaco, monospace;

  /* surfaces */
  --background-100: #ffffff;
  --background-200: #fafafa;

  /* gray */
  --gray-100: #f2f2f2;
  --gray-600: #a8a8a8;
  --gray-200: #ebebeb;
  --gray-700: #8f8f8f;
  --gray-300: #e6e6e6;
  --gray-800: #7d7d7d;
  --gray-400: #eaeaea;
  --gray-900: #4d4d4d;
  --gray-500: #c9c9c9;
  --gray-1000: #171717;

  /* gray alpha */
  --gray-alpha-100: #0000000d;
  --gray-alpha-600: #0000003d;
  --gray-alpha-200: #00000015;
  --gray-alpha-700: #00000070;
  --gray-alpha-300: #0000001a;
  --gray-alpha-800: #00000082;
  --gray-alpha-400: #00000014;
  --gray-alpha-900: #000000b3;
  --gray-alpha-500: #00000036;
  --gray-alpha-1000: #000000e8;

  /* accents */
  --blue-100: #f0f7ff;
  --blue-400: #cae7ff;
  --blue-700: #006bff;
  --blue-900: #005ff2;
  --red-100: #ffeeef;
  --red-400: #f9c5c8;
  --red-700: #e5484d;
  --red-800: #da3036;
  --red-900: #ca2a30;
  --amber-100: #fff6e5;
  --amber-400: #ffdd9e;
  --amber-700: #ffb224;
  --amber-900: #a35200;
  --green-100: #eefcf1;
  --green-400: #b4dfc4;
  --green-700: #45a557;
  --green-900: #297c3b;
  --purple-100: #fbf3fe;
  --purple-400: #e5d3f7;
  --purple-700: #8e4ec6;
  --purple-900: #793aaf;

  /* semantic — use these in components, not raw grays */
  --text-primary: var(--gray-1000);
  --text-secondary: var(--gray-900);
  --text-disabled: var(--gray-700);
  --icon-primary: var(--gray-1000);
  --icon-secondary: var(--gray-900);
  --border-default: var(--gray-400);
  --border-hover: var(--gray-500);

  /* shape */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-full: 9999px;

  /* space */
  --space-1: 4px;
  --space-5: 32px;
  --space-2: 8px;
  --space-6: 40px;
  --space-3: 12px;
  --space-7: 64px;
  --space-4: 16px;
  --space-8: 96px;

  /* sizing */
  --height-sm: 32px;
  --height-md: 40px;
  --height-lg: 48px;
  --nav-item-height: 36px;
  --sidebar-width: 260px;
  --page-width: 1400px;

  /* elevation */
  --shadow-border: 0 0 0 1px rgba(0, 0, 0, 0.08);
  --shadow-card: 0 2px 2px rgba(0, 0, 0, 0.04);
  --shadow-menu:
    0 1px 1px rgba(0, 0, 0, 0.02), 0 4px 8px -4px rgba(0, 0, 0, 0.04),
    0 16px 24px -8px rgba(0, 0, 0, 0.06);
  --shadow-modal:
    0 1px 1px rgba(0, 0, 0, 0.02), 0 8px 16px -4px rgba(0, 0, 0, 0.04),
    0 24px 32px -8px rgba(0, 0, 0, 0.06);
  --focus-ring: 0 0 0 2px var(--background-100), 0 0 0 4px var(--blue-700);
}

[data-theme="dark"] {
  --background-100: #0a0a0a;
  --background-200: #000000;

  --gray-100: #1a1a1a;
  --gray-600: #878787;
  --gray-200: #1f1f1f;
  --gray-700: #8f8f8f;
  --gray-300: #292929;
  --gray-800: #7d7d7d;
  --gray-400: #2e2e2e;
  --gray-900: #a1a1a1;
  --gray-500: #454545;
  --gray-1000: #ededed;

  --gray-alpha-100: #ffffff0d;
  --gray-alpha-400: #ffffff14;
  --gray-alpha-200: #ffffff15;
  --gray-alpha-500: #ffffff36;
  --gray-alpha-300: #ffffff1a;
  --gray-alpha-600: #ffffff3d;

  --blue-700: #0072f5;
  --blue-900: #52a8ff;
  --red-700: #e5484d;
  --red-900: #ff6166;
  --amber-700: #ffb224;
  --amber-900: #f1a10d;
  --green-700: #45a557;
  --green-900: #62c073;
  --purple-700: #8e4ec6;
  --purple-900: #bf7af0;

  --shadow-border: 0 0 0 1px rgba(255, 255, 255, 0.08);
  --shadow-card: none;
}

body {
  font-family: var(--font-sans);
  font-feature-settings: "liga" 1;
  background: var(--background-100);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
}

.tabular {
  font-variant-numeric: tabular-nums;
}
.mono {
  font-family: var(--font-mono);
}
```

**Reference implementation — sidebar nav item**

```css
.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--nav-item-height);
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  color: var(--text-primary);
  background: transparent;
  transition:
    background-color 120ms ease,
    color 120ms ease;
}
.nav-item svg {
  width: 16px;
  height: 16px;
  color: var(--icon-primary);
}
.nav-item:hover {
  background: var(--gray-100);
}
.nav-item[aria-current="page"] {
  background: var(--gray-100);
}
.nav-item[aria-current="page"]:hover {
  background: var(--gray-200);
}
.nav-item[aria-disabled="true"],
.nav-item[aria-disabled="true"] svg {
  color: var(--text-disabled);
}
.nav-item:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
```

**Reference implementation — card and primary button**

```css
.card {
  background: var(--background-100);
  border-radius: var(--radius-sm);
  padding: var(--space-4);
  box-shadow: var(--shadow-border), var(--shadow-card);
}

.btn-primary {
  height: var(--height-md);
  padding: 0 10px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  color: var(--background-100);
  background: var(--gray-1000);
  transition: background-color 120ms ease;
}
.btn-primary:hover {
  background: var(--gray-900);
}
.btn-primary:disabled {
  background: var(--gray-100);
  color: var(--gray-700);
  cursor: not-allowed;
}
.btn-primary:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
```

---

## 21. Migration Reference

For engineers replacing the previous palette.

| Old value              | Old role                          | New token                                                                       |
| ---------------------- | --------------------------------- | ------------------------------------------------------------------------------- |
| `#5B4FE9`              | Primary                           | `gray-1000` `#171717` light / `#ededed` dark                                    |
| `#4338CA`              | Primary hover                     | `gray-900` on a `gray-1000` base                                                |
| `#EEF2FF`              | Active nav fill                   | `gray-100` `#f2f2f2`                                                            |
| `#FF6B4A`              | AI accent                         | Mono `AI` label + sparkle icon; purple dot or numeral only if required          |
| `#F6F5FF`              | App background                    | `background-100` `#ffffff`                                                      |
| `#E5E7EB`              | Border                            | `gray-400` `#eaeaea`, applied as a `0 0 0 1px` ring                             |
| `#1F242E`              | Heading text                      | `gray-1000` `#171717`                                                           |
| `#4B5563`              | Body text                         | `gray-1000` `#171717` for anything read; `gray-900` `#4d4d4d` for sub-text only |
| `#6B7280`              | Muted text                        | `gray-900` `#4d4d4d` — not `gray-700`, which fails AA                           |
| `#10B981`              | Success                           | `green-700` `#45a557`                                                           |
| `#F59E0B`              | Warning                           | `amber-700` `#ffb224`                                                           |
| `#EF4444`              | Error                             | `red-700` `#e5484d`                                                             |
| `#7C71F0`              | Info                              | `blue-700` `#006bff`                                                            |
| Radius 6 / 8 / 12 / 16 | badges / buttons / cards / modals | `9999px` / `6px` / `6px` / `8px`                                                |
| Inter                  | All type                          | Geist Sans, with Geist Mono for identifiers and figures                         |

---

## 22. Build Checklist

Work through this for every screen.

1. Swap the font stack to Geist Sans. Nothing else reads correctly until this is done.
2. Point every label, nav item, table name column, form label, and icon at `--text-primary`
   (`#171717`). Reserve `--text-secondary` for sub-text and metadata only.
3. Set the page and sidebar to `background-100`. Remove every tinted background.
4. Replace card shadows and CSS borders with `--shadow-border`.
5. Set every radius to 6px. Pills only for status badges and avatars.
6. Identify the one primary action → `gray-1000` button. Everything else is Secondary or Tertiary.
7. Strip decorative color. Color survives only where it encodes state, and always with a word or icon
   beside it.
8. Move numeric table columns to Geist Mono, tabular figures, right-aligned — headers included.
9. Apply the 8 / 16 / 32–40 spacing rhythm. Delete arbitrary pixel values.
10. Charts → gray ramp, one blue focal series, direct labels, zero baselines.
11. Mark AI surfaces with the mono `AI` label and sparkle icon. One carrier, nowhere else.
12. Build light and dark in parallel. Never invent a value for either mode.
13. Squint test — is one object clearly dominant? Text-mask test — does hierarchy survive with the
    words blurred? If every block carries equal weight, redesign before shipping.
14. Verify focus rings, keyboard navigation, and both themes before handoff.

---

## 23. Source Verification

Where each part of this system comes from, so your team knows what is settled and what to check.

### Confirmed against Vercel's published Geist documentation

| Item                      | Value as specified here                                                                                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backgrounds               | `background-100` `#ffffff`, `background-200` `#fafafa`                                                                                                                                                 |
| Gray scale (light)        | All ten steps, `#f2f2f2` → `#171717`                                                                                                                                                                   |
| Gray-alpha ladder (light) | All ten steps, `#0000000d` → `#000000e8`                                                                                                                                                               |
| Blue scale (light)        | All ten steps, `#f0f7ff` → `#002359`                                                                                                                                                                   |
| Step-intent mapping       | 100 default bg · 200 hover bg · 300 active bg · 400 default border · 500 hover border · 600 active border · 700 solid fill · 800 solid fill hover · 900 secondary text/icons · 1000 primary text/icons |
| Scale set                 | 10 scales: backgrounds, gray, gray-alpha, blue, red, amber, green, teal, purple, pink                                                                                                                  |
| Typefaces                 | Geist Sans + Geist Mono, SIL Open Font License                                                                                                                                                         |
| Type token families       | `heading-*`, `label-*`, `copy-*`, `button-*`; `copy-14` and `label-14` cover most UI                                                                                                                   |
| Weight ceiling            | 600. Never 700.                                                                                                                                                                                        |
| Button variants           | Primary `gray-1000` fill · Secondary `background-100` + `gray-alpha-400` border · Tertiary transparent + `gray-1000` text · Error `red-800` fill                                                       |
| Control heights           | 32 / 40 / 48px, padding `0 6px` / `0 10px` / `0 14px`, large steps up to `button-16`                                                                                                                   |
| Input                     | `background-100` fill, translucent border, 6px radius                                                                                                                                                  |
| Hover / active ladder     | Fill `100`→`200`→`300`; border `400`→`500`→`600`                                                                                                                                                       |
| Disabled                  | `gray-100` fill, `gray-700` text, `not-allowed` cursor                                                                                                                                                 |
| Focus ring                | `0 0 0 2px <surface>, 0 0 0 4px #006bff`                                                                                                                                                               |
| Spacing scale             | 4, 8, 12, 16, 24, 32, 40, 64, 96                                                                                                                                                                       |
| Spacing rhythm            | 8 within a group · 16 between groups · 32–40 between sections                                                                                                                                          |
| Card padding              | 24px default, 16px compact, 32px hero                                                                                                                                                                  |
| Breakpoints               | sm 401 · md 601 · lg 961 · xl 1200 · 2xl 1400                                                                                                                                                          |
| Page width                | 1400px                                                                                                                                                                                                 |
| Elevation                 | The three shadow stacks in §7                                                                                                                                                                          |
| Shadow-as-border          | `box-shadow: 0 0 0 1px` replaces CSS borders on containers                                                                                                                                             |
| Achromatic rule           | No new accent colors; a new status color may appear only at ~10px indicator-dot scale, never as a background or large fill                                                                             |
| Motion rule               | Interactive elements animate `background-color` and `color` only — no transform, no opacity                                                                                                            |
| Icons                     | `@geist-ui/icons`, outline, monochrome, consistent stroke weight                                                                                                                                       |

### Not independently confirmed — verify before locking

- The **dark theme** values in §3.1
- The **red / amber / green / purple** steps in §3

These are the standard Geist values, but Vercel publishes them behind JavaScript on
`vercel.com/geist/colors` rather than in a readable file, so they could not be checked against a
primary source. They are almost certainly correct. Confirm them anyway — it takes under a minute.

**Extract the real values yourself.** Open `https://vercel.com/geist/colors`, switch the page to
dark mode, open the browser console, and run:

```js
const scales = [
  "background",
  "gray",
  "gray-alpha",
  "blue",
  "red",
  "amber",
  "green",
  "teal",
  "purple",
  "pink"
];
const s = getComputedStyle(document.documentElement);
const out = {};
for (const name of scales) {
  for (let i = 1; i <= 10; i++) {
    const key = `--ds-${name}-${i * 100}`;
    const v = s.getPropertyValue(key).trim();
    if (v) out[key] = v;
  }
}
console.table(out);
copy(JSON.stringify(out, null, 2)); // now on your clipboard
```

Run it once in light mode and once in dark. Paste both results over the corresponding blocks in
§20. Every other value in this document stays as written.

### What is XInterview's own judgment, not Vercel's

These decisions are ours, made to fit the system rather than copied from it. Change them if the
product needs something different:

- Sidebar nav item height (36px) and the icon-to-label gap (12px)
- The status badge palette in §13 and which XInterview state maps to which hue
- The chart series ramp in §14
- The AI marker in §16 — Vercel has no equivalent, because Vercel has no AI-generated content to mark
- Keeping the brand mark in the sidebar
- The three-tier text rule in §4 — Vercel's tokens define primary and secondary text; assigning every
  XInterview element to a tier is our application of that rule

---

## 24. Licensing

Geist Sans and Geist Mono are released under the SIL Open Font License and may be used commercially,
including self-hosted. Design token values — hex codes, spacing scales, type ramps — are functional
and freely usable. Vercel's wordmark and triangle logo are trademarks and must never appear in
XInterview.
