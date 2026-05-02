# Handoff: Isla — API Key Manager App

## Overview
Isla is a mobile app (iOS-first) for securely storing, organising and copying API keys and secrets. Users can group secrets into workspaces, tag them by environment (prod / staging / dev), search, bulk-delete and copy to clipboard with a single tap.

## About the Design Files
The files in this bundle are **design references created in HTML** — interactive wireframes showing intended layout, structure and behaviour. They are **not** production code to copy directly. The task is to **recreate these designs in your target codebase** (SwiftUI, React Native, Flutter, etc.) using its established patterns, components and libraries.

The primary reference file is:
- `Isla Wireframes.html` — open in any browser; pan/zoom the canvas, click any artboard to focus it fullscreen.

---

## Fidelity
**Low-to-mid fidelity wireframes** — structure, flows and interactions are final. Visual polish (exact shadows, blur effects, icon set) should be applied using your codebase's existing design system. Color tokens and spacing below are considered **final design decisions**.

---

## Design Tokens

### Colors
| Token | Hex | Usage |
|---|---|---|
| `bg` | `#E8E3D8` | Screen background, warm linen |
| `surface` | `#F0EDE6` | Cards, input fields, secondary surfaces |
| `border` | `#D0C9BC` | Dividers, input borders, row separators |
| `text` | `#28200F` | Primary text, headings |
| `textSecondary` | `#8A7A66` | Captions, placeholders, meta info |
| `placeholder` | `#C8C2B6` | Empty state fills, skeleton boxes |
| `accent` | `#C4583A` | Primary CTA buttons, terracotta |
| `accentLight` | `rgba(196,88,58,0.1)` | Destructive action chips background |
| `textOnAccent` | `#FFF8F0` | Text on accent-colored buttons |

### Environment Tag Colors
| Env | Background | Usage |
|---|---|---|
| `prod` | `#FFEBEE` | Production secrets |
| `staging` | `#FFF8E1` | Staging secrets |
| `dev` | `#E8F5E9` | Development secrets |

### Spacing
- Base unit: `8px`
- Screen padding: `16px`
- Row padding: `13px 16px`
- Card gap: `12px`
- Section gap: `20px`

### Typography
- Font family: **DM Sans** (weights 400, 500, 600, 700)
- Large title: 22–24px / weight 700
- Body: 14px / weight 400–500
- Caption: 11–12px / weight 400 (secondary info), 700 (section headers, letter-spacing 0.5–0.6)
- Button: 14–15px / weight 600
- Section header: 11px / weight 700 / ALLCAPS / letter-spacing 0.6

### Border Radius
- Rows / list containers: `0` (full-bleed) or `14px` (inset cards)
- Buttons (primary/large): `12px`
- Buttons (small/chip): `8px`
- Env tags / pills: `20px` (fully rounded)
- Workspace cards: `16px`
- Toast pill: `99px` (fully rounded)
- Input fields: `12px`
- Sheet drag handle: `2px`

---

## Screens & Views

### 1. Lock Screen (4 variations — pick one)

#### A — Face ID / Biometric
- Centered layout, vertically stacked
- App logo placeholder (64×64, r:18) at top center
- App name "Isla" (24px/700) below logo
- Subtitle "Tap to unlock with Face ID" (15px, textSecondary)
- Biometric button: 64×64 circle, border 1.5px border, centered icon
- Footer: "Use Passcode instead" outline button (full-width, 50px, r:12)
- **Recommended:** Offer Face ID on first launch; fall back to passcode

#### B — PIN Pad
- Title "Enter Passcode" (17px/600) centered
- 6-dot indicator row (12×12 circles, filled = entered digit)
- 3×4 numpad grid: 54px tall keys, r:13, background `surface`, border `border`
- Delete key (⌫) no background

#### C — Passphrase
- Logo + title
- Labelled input field: "PASSPHRASE" label, 48px height, r:12
- "Unlock" primary button (full-width)
- "or unlock with Face ID" tertiary text link below

#### D — Tap to Unlock (minimal)
- Large logo (88×88, r:26)
- Large title (26px/700)
- Descriptive subtitle (14px, textSecondary, max-width 180px, centered)
- Circular unlock button (56×56, accent background)

---

### 2. Workspace List (4 variations)

#### A — Card Grid
- 2-column grid, `gap: 12px`, `padding: 12px 16px`
- Each card: r:16, border 1.5px, min-height 108px, padding 16px
- Card contents: icon placeholder (32×32, r:9), workspace name (14px/600), secret count (12px, textSecondary)
- Last card: dashed border, "+" symbol, background `surface`

#### B — List Rows (recommended for many workspaces)
- Full-bleed `IOSList` rows (52px tall, chevron right)
- Row: workspace name (left), secret count (detail, right), chevron
- Footer: "+ New Workspace" outline button (full-width, 50px)

#### C — No Workspaces / Flat List
- Single search bar (42px, r:12, background `surface`) at top
- Full-bleed list of all secrets directly (no workspace grouping)
- For users who opt out of workspace organisation

#### D — Recent + Workspaces (recommended default)
- "RECENTLY ACCESSED" section header (11px/700/ALLCAPS)
- 2 recent secret rows: name + "Workspace · time ago" meta, Copy button (small outline)
- "WORKSPACES" section header
- List rows for each workspace
- Ideal first-launch experience

---

### 3. Secret List (4 variations)

All list screens share these features:
- **Header bar**: Workspace name (22px/700 left) + "Select" button (14px/600, textSecondary right)
- **Row anatomy**: [optional checkbox] | name (14px/500) + env tag | masked value (••••••••••••) | Copy button (5px 11px, r:8)
- **Copied toast**: dark pill (#28200F) bottom-center, "✓ Copied" (15px/600, textOnAccent), fades in/out over 1.6s, translate Y animation 20px→0

#### A — Simple
- No env tags, no grouping, full-bleed list

#### B — Environment Tags (recommended)
- Each row shows env pill (prod/staging/dev) inline with name
- Multiple rows for same key name with different envs

#### C — Search Active
- Search bar (42px, r:12, 1.5px `text` border when active)
- Result count below search bar (12px, textSecondary)
- Inset list (r:14) for results

#### D — Grouped by Category
- Section headers ("AI", "PAYMENTS", "INFRASTRUCTURE") above each group
- Full-bleed groups with `border-top` + `border-bottom`

#### Bulk Delete Flow (all list variants)
1. User taps "Select" → checkboxes slide into each row
2. Tapping a row toggles its circular checkbox (22×22, r:11; filled accent when selected)
3. Selected rows get subtle accent background tint
4. When ≥1 row selected: selection toolbar appears between header and list
   - Left: "{N} selected" (13px, textSecondary)
   - Right: "🗑 Delete" chip (accent text, accentLight bg, accent border, r:8)
5. Tapping Delete opens the **Delete Confirmation Sheet**

#### Delete Confirmation Sheet
- Modal overlay: `rgba(40,32,15,0.45)` backdrop
- Bottom sheet: r:22 top corners, bg `bg`
- Drag handle (36×4, r:2, placeholder color)
- Title: "Delete N Secret(s)?" (18px/700)
- Subtitle: "This action cannot be undone." (13px, textSecondary)
- **Security Warning Card**: dashed border, surface bg, r:14
  - Shield icon (accent color, 32×32 container)
  - Heading: "Security Protocol" (13px/700)
  - Body: "Deleting these secrets is permanent. Ensure you have backups or have rotated these keys in your service dashboards before confirming." (12px, textSecondary, lineHeight 1.6)
- Buttons row: "Cancel" (outline, flex 1) + "Delete" (accent bg, flex 1)

---

### 4. Add / Edit Secret (4 variations)

#### A — Full-screen Form
- Standard nav bar with "New Secret" title
- Form fields: NAME, VALUE, ENVIRONMENT (segmented 3-button), WORKSPACE (select), NOTES
- Input: 48px height, r:12, border 1.5px `border`, bg `surface`
- Field label: 11px/700/ALLCAPS, textSecondary, letter-spacing 0.5
- Environment selector: 3 equal buttons (42px, r:10); active = accent bg + textOnAccent; inactive = bg + textSecondary + border
- Primary "Save Secret" button: full-width, 50px, r:12, accent bg

#### B — Bottom Sheet (recommended for quick add)
- Existing list visible behind dimmed sheet
- Sheet rises from bottom: r:22 top, drag handle, ✕ close button
- Compact form: NAME + VALUE + env selector + Save button
- Sheet padding: `12px 16px 36px`

#### C — Step Wizard
- 4-step progress indicator: numbered circles (26×26, r:13) connected by lines
  - Done: filled accent, ✓ checkmark
  - Active: filled text color
  - Pending: surface bg, border
- Step labels below circles (10px)
- Large step question (22px/700)
- Step subtitle (14px, textSecondary)
- Input field for current step
- "← Back" (outline) + "Continue →" (primary) button row

#### D — Inline Edit
- Edit mode expands inside the list row
- Expanded row: surface bg (#EDE8E0), "editing" tag, compact VALUE input + env selector + Cancel/Save buttons
- Adjacent rows remain visible and interactive

---

## Interactions & Behaviour

| Interaction | Behaviour |
|---|---|
| Copy button tap | Show "✓ Copied" toast pill — fade in (0.22s ease), hold 1.6s, fade out |
| Select mode enter | "Select" → "Cancel"; checkboxes slide in |
| Row checkbox tap | Toggle fill + row highlight (`rgba(196,88,58,0.07)`) |
| Delete chip tap | DeleteSheet slides up with backdrop |
| Sheet Cancel | Sheet dismisses, selection preserved |
| Sheet Delete | Rows removed, select mode exits |
| Workspace card tap | Navigate to Secret List for that workspace |

---

## State

| State | Type | Notes |
|---|---|---|
| `locked` | bool | App lock state; persists across sessions |
| `workspaces` | Workspace[] | List of workspaces |
| `secrets` | Secret[] | All secrets, associated to a workspace |
| `selectMode` | bool | Per-list-screen |
| `selectedIds` | Set<string> | Active selection |
| `confirmingDelete` | bool | DeleteSheet visibility |
| `copiedToast` | bool | Auto-resets after 1.6s |

### Secret model
```ts
interface Secret {
  id: string
  name: string        // e.g. "OPENAI_API_KEY"
  value: string       // encrypted at rest
  env: 'prod' | 'staging' | 'dev' | null
  workspaceId: string
  notes?: string
  createdAt: Date
  lastAccessedAt?: Date
}
```

---

## Assets
- No external images used
- Icons are inline SVG (trash, shield, checkmark) — replace with your icon library
- App logo: placeholder box — replace with final Isla mark

## Files in this Bundle
| File | Purpose |
|---|---|
| `Isla Wireframes.html` | Main design reference — all screens |
| `ios-frame.jsx` | iOS device frame component (React/Babel) |
| `design-canvas.jsx` | Pan/zoom canvas used to display artboards |
| `README.md` | This document |
