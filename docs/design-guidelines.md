# Tiplives — Design Guidelines

## Emotional Tone

**Feels like a professional football analytics terminal — calm, precise, trustworthy, and quietly confident.**

This direction follows the Lovable principle of **starting with feeling before features** and designing for **emotional clarity, not just function**. The product should feel focused and supportive, never noisy or casino-like. :contentReference[oaicite:0]{index=0}

---

## Design Intent

Tiplives should help users feel:

- informed
- in control
- fast
- calm
- supported

It should never feel:

- flashy
- chaotic
- manipulative
- luck-driven
- emotionally loud

Core metaphor:

- **football analysis terminal**
- not a sportsbook
- not a prediction machine
- not a gambling app

---

## Visual Personality

Style anchors:

- **shadcn/ui** for clean component structure
- **Linear** for precision and polish
- **Apple Human Interface** for calm spacing and kind interactions

Visual adjectives:

- analytical
- restrained
- modern
- compact
- high-signal
- trustworthy

---

## Typography

Typography should optimize **2-second scanning**.

Primary font:

- **Inter**

Supporting font option for data-heavy labels:

- **JetBrains Mono** or **IBM Plex Mono** for odds, repetition counts, and small statistical chips

Use mono sparingly. The UI should still feel clean, not overly technical.

### Type Hierarchy

#### H1
- Size: 40px
- Weight: 700
- Line height: 1.2
- Use: hero headline, page title

Example:
**See what keeps repeating.**

#### H2
- Size: 28px
- Weight: 700
- Line height: 1.25
- Use: section titles, dashboard page titles

#### H3
- Size: 20px
- Weight: 600
- Line height: 1.3
- Use: cards, detail blocks, modal headings

#### H4
- Size: 16px
- Weight: 600
- Line height: 1.4
- Use: table group labels, filter labels

#### Body Large
- Size: 16px
- Weight: 400
- Line height: 1.6
- Use: landing copy, summaries

#### Body
- Size: 14px
- Weight: 400
- Line height: 1.6
- Use: standard app text

#### Caption
- Size: 12px
- Weight: 500
- Line height: 1.5
- Use: odds labels, timestamps, helper text

#### Data Emphasis
- Size: 18px
- Weight: 700
- Line height: 1.3
- Use: repetition numbers such as **19 / 20**

### Typography Rules

- Keep line length short on the landing page
- Use bold only for key signal text
- Let numbers carry visual weight
- Maintain at least **1.5x line-height** for readable dense screens
- Never use decorative type

---

## Color System

The palette should feel like a **cool, focused sports intelligence interface**.

### Core Palette

#### Background
- Hex: `#0B0F14`
- RGB: `11, 15, 20`

Use for app shell and page background.

#### Surface / Cards
- Hex: `#121821`
- RGB: `18, 24, 33`

Use for rows, cards, drawers, and modals.

#### Elevated Surface
- Hex: `#18212D`
- RGB: `24, 33, 45`

Use for hover states and selected items.

#### Border
- Hex: `#1D2633`
- RGB: `29, 38, 51`

Use for dividers, table outlines, chips.

#### Primary Text
- Hex: `#F3F4F6`
- RGB: `243, 244, 246`

Use for all main readable text.

#### Secondary Text
- Hex: `#C7CDD6`
- RGB: `199, 205, 214`

Use for supportive content.

#### Muted Text
- Hex: `#9CA3AF`
- RGB: `156, 163, 175`

Use for captions and tertiary labels.

### Signal Colors

#### Strong Trend / Positive
- Hex: `#22C55E`
- RGB: `34, 197, 94`

Use for:
- strong repetition
- positive trend badges
- active CTA emphasis

#### Strong Trend Hover
- Hex: `#16A34A`
- RGB: `22, 163, 74`

Use for:
- hover state on strong actions

#### Moderate Trend / Warning
- Hex: `#F59E0B`
- RGB: `245, 158, 11`

Use for:
- medium-strength patterns
- warning or caution chips

#### Weak Signal / Negative
- Hex: `#EF4444`
- RGB: `239, 68, 68`

Use for:
- weak or degraded pattern signals
- destructive states

#### Info / Link Accent
- Hex: `#38BDF8`
- RGB: `56, 189, 248`

Use for:
- secondary emphasis
- links
- filter highlights

### Semantic Meaning

- **Green** = strong repetition
- **Yellow** = moderate confidence
- **Red** = weak pattern or caution
- **Blue** = neutral context or utility

### Contrast Rules

- Maintain **WCAG AA minimum 4.5:1**
- Main text on dark surfaces must remain high-contrast
- Avoid low-contrast green-on-dark for important numbers
- Never encode meaning with color alone; pair with label or icon

### Light Mode

Not required for MVP.

If introduced later:

- keep the same semantic mapping
- reduce saturation slightly
- preserve the terminal-like calmness

---

## Spacing & Layout

The layout must support **speed and clarity**.

### Grid System

- Use an **8pt spacing system**
- Small spacing: 8
- Standard spacing: 16
- Comfortable spacing: 24
- Section spacing: 32
- Large layout spacing: 48 to 64

### Container Rules

#### Landing Page
- Max width: 1200px
- Wide but calm
- Strong whitespace between sections

#### Dashboard
- Max width: 1440px
- Dense, but never cramped
- Prioritize visible rows above the fold

### Card & Row Padding

#### Opportunity Row
- Vertical padding: 14 to 16px
- Horizontal padding: 16 to 20px

#### Filter Bar
- Gap: 12 to 16px
- Keep controls aligned in one visual lane

#### Detail Cards
- Padding: 20 to 24px

### Responsive Breakpoints

#### Mobile
- 320px to 767px
- Stack filters
- Convert table to cards
- Hide low-priority metadata first

#### Tablet
- 768px to 1023px
- Compress filter spacing
- Keep repetition and odds visible

#### Desktop
- 1024px and above
- Full table layout
- Optional slip drawer on right side

### Layout Priorities

The main dashboard should follow this order:

1. top navigation
2. date and filter controls
3. opportunity table
4. optional slip drawer

This should be obvious on first glance.

---

## Core Components

## Opportunity Row

This is the most important component in the product.

Each row should show:

- market
- pattern summary
- next match
- odds
- repetition
- heat badge
- quick action

### Row Behavior

A row must answer three questions instantly:

1. what is the pattern?
2. how strong is it?
3. what match is it tied to?

### Visual Priority Inside the Row

Highest attention:

- repetition count
- market
- pattern description

Secondary:

- odds
- match name
- context

Tertiary:

- badges
- small metadata
- helper text

### Example Structure

- Left: market + pattern text
- Middle: match + context
- Right: odds + repetition + action

---

## Filters

Filters should feel light, not technical.

Use:

- segmented controls for time
- dropdowns for league and context
- range inputs for odds
- chips for sample size

Rules:

- keep common filters always visible
- move advanced filters into a collapsible section
- show active filters clearly
- allow one-click reset

---

## Badges & Pattern Heat

Badge language should be plain and fast.

Suggested labels:

- **Very Hot**
- **Hot**
- **Steady**
- **Weak**

Do not use exaggerated gambling language.

Avoid:

- lock
- guaranteed
- cannot miss
- sure win

---

## Detail Page Design

The detail page should feel like a **clean analyst workspace**.

Sections:

- pattern summary
- repetition breakdown
- home/away split
- head-to-head context
- trend chart
- odds overview

Rules:

- keep charts simple
- prefer bars or small line visuals
- avoid overloaded dashboards
- one insight block per section

---

## Slip Builder Design

The slip builder must feel like a **simple calculator drawer**.

It should not resemble sportsbook betting slips too closely.

Use:

- clean rows
- compact odds display
- simple stake input
- payout box
- remove-item action

Tone:

- neutral
- utility-first
- supportive

---

## Motion & Interaction

The Lovable design philosophy emphasizes **behavior, not just state** and encourages interfaces that feel kind, calm, and emotionally supportive. Tiplives should use motion to reinforce confidence, never urgency. :contentReference[oaicite:1]{index=1}

### Motion Principles

- subtle
- quick
- informative
- non-distracting

### Motion Specs

- Hover transitions: **150–200ms**
- Drawer transitions: **200–250ms**
- Page fade/slide transitions: **200–300ms**
- Easing: gentle ease-out
- No bounce-heavy motion in core dashboard flows

### Microinteractions

#### Row Hover
- slight surface lift
- border brightens subtly
- no dramatic glow

#### Button Hover
- soft contrast increase
- no aggressive pulse

#### Filter Selection
- immediate visual confirmation
- active state should feel crisp and calm

#### Drawer Open
- smooth slide from right
- stable, not elastic

#### Empty State
- fade in softly
- reassuring copy
- offer next step clearly

### Kindness in Design

Per the uploaded Lovable design guidance, good product behavior should feel forgiving, patient, and emotionally aware. Tiplives should reflect that through soft feedback, clear recovery paths, and non-judgmental states. :contentReference[oaicite:2]{index=2}

Example:

- good: **No matching trends yet. Try widening your odds range.**
- bad: **No results found.**

---

## Voice & Tone

The product voice should feel:

- confident
- calm
- intelligent
- concise
- non-hype

It should never sound:

- pushy
- salesy
- loud
- casino-like

### Copy Rules

- lead with meaning
- keep sentences short
- use plain football language
- prefer clarity over jargon
- avoid prediction language

### Good Copy Examples

#### Onboarding
**Start with today’s strongest repeating patterns.**

#### Premium Prompt
**Unlock 27 premium patterns detected today.**

#### Success
**Added to slip. Combined odds updated.**

#### Empty State
**No strong patterns match these filters right now. Try tomorrow or widen the sample size.**

#### Error
**We couldn’t refresh trends right now. Please try again in a moment.**

---

## Navigation & Information Architecture

Keep top-level navigation minimal.

Recommended items:

- Dashboard
- Favorites
- Pricing
- Account

Secondary actions:

- Odds format toggle
- Theme toggle if added later
- Subscription status

Rules:

- one obvious primary action per screen
- avoid nested navigation
- keep labels literal

---

## System Consistency

Tiplives should repeat patterns so users learn the interface quickly.

Consistency rules:

- every opportunity row uses the same structure
- repetition values always appear in the same position
- odds always use consistent formatting
- all filters use shared chip/dropdown styles
- all badges follow one semantic system

Metaphor consistency:

- terminal
- analyst desk
- ranking board

Not:

- betting game
- casino card
- prediction contest

---

## Accessibility

Accessibility should be designed in from the start.

### Semantic Structure

Use:

- one H1 per page
- logical heading order
- landmarks for nav, main, aside, footer

### Keyboard Navigation

All interactive controls must support:

- tab navigation
- visible focus state
- enter/space activation where appropriate

### Focus Indicators

- high-contrast ring
- never remove default focus without replacement
- focus state must be clearly visible on dark surfaces

### ARIA & Labels

Use ARIA only where needed.

Must support:

- filter labels
- drawer labels
- icon buttons with descriptive names
- tables with clear header associations

### Readability

- text must remain legible on dark backgrounds
- avoid dense text blocks
- use icon + label together for critical actions

### Visual Accessibility Checklist

- contrast meets WCAG AA+
- color is never the only signal
- clickable targets are at least 40px tall
- charts have text equivalents where needed

---

## Page-Specific Design Notes

## Landing Page

Goal:

Explain the product in **5 seconds**.

Rules:

- one strong headline
- one clear supporting sentence
- one primary CTA
- one dashboard preview
- avoid long copy above the fold

Hero mood:

- premium
- calm
- analytical
- believable

Suggested structure:

- headline
- subtext
- CTA
- blurred dashboard preview with one visible row

---

## Dashboard

Goal:

Users identify the strongest pattern in **under 2 seconds**.

Rules:

- keep top rows visible immediately
- repetition score must stand out
- table density should feel efficient
- no decorative clutter

---

## Pricing / Paywall

Tone:

- informative
- confident
- respectful

Rules:

- show value clearly
- blur premium rows without frustration
- show what is locked
- explain what premium unlocks in plain language

Good prompt:

**Unlock full access to today’s strongest repeating football trends.**

---

## Emotional Audit Checklist

Review every major screen with these questions:

- Does this screen feel calm and analytical?
- Can a first-time user understand the main action instantly?
- Does the interface support the user instead of pressuring them?
- Do copy and motion reinforce trust?
- Would this still feel good after daily use?

---

## Technical QA Checklist

- Typography follows the defined scale
- Spacing follows the 8pt system
- Contrast meets WCAG AA+
- Interactive states are clearly distinct
- Motion stays mostly between 150–300ms
- Opportunity rows remain scannable at a glance
- Dark theme remains clean on low-brightness screens
- Mobile layouts preserve the main signal: pattern + repetition + odds

---

## Adaptive System Memory

If Tiplives later expands into more products or tools, preserve these anchors:

- dark terminal base
- calm green signal language
- dense but breathable analytics layout
- low-hype, high-trust copy tone

Reuse suggestion for future related products:

**Keep the Tiplives terminal mood and repetition-first UI logic for any future alert, watchlist, or AI explanation product.**

---

## Design Snapshot

### Color Palette Preview

```text
Background       #0B0F14
Surface          #121821
Elevated         #18212D
Border           #1D2633
Primary Text     #F3F4F6
Secondary Text   #C7CDD6
Muted Text       #9CA3AF
Strong Trend     #22C55E
Trend Hover      #16A34A
Moderate Trend   #F59E0B
Weak Signal      #EF4444
Info Accent      #38BDF8
