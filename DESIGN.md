# CORECON CLEANING SYSTEM — DESIGN.md

Version: 1.0
Source: Official Corecon Design System
Platform: Cleaner PWA + Admin Panel
Style Direction: Enterprise SaaS + Mobile-First + Operational UI

---

# DESIGN PRINCIPLES

Corecon is a professional operational platform for cleaning service management.

The interface must communicate:

* trust
* operational clarity
* speed
* reliability
* professionalism

The visual language should feel:

* clean
* structured
* modern
* calm
* highly usable under real-world working conditions

Avoid:

* flashy visuals
* startup gimmicks
* futuristic effects
* visual clutter
* unnecessary animations

Primary inspiration:

* Vercel
* Linear
* modern enterprise SaaS

Secondary inspiration:

* Claude conversational UX
* operational logistics dashboards

---

# COLOR SYSTEM

## Primary Brand Colors

```css
--navy-dark: #111E33;
--navy: #1B2A4A;
--navy-light: #243A63;

--gold-dark: #A07830;
--gold: #C9A84C;
--gold-light: #E0C070;
```

## Semantic Colors

```css
--success: #1E8449;
--success-bg: #E9F7EF;

--error: #C0392B;
--error-bg: #FDEDEC;

--warning: #B7770D;
--warning-bg: #FEF9E7;

--info: #1A5276;
--info-bg: #EAF2FF;
```

## Neutral Palette

```css
--white: #FFFFFF;
--off-white: #F8F7F4;

--gray-100: #F2F2F2;
--gray-300: #CCCCCC;
--gray-500: #888888;
--gray-700: #444444;
--gray-900: #1A1A1A;
```

---

# COLOR USAGE RULES

## Navy

Use navy tones for:

* headers
* navigation
* dashboard structure
* cards requiring emphasis
* enterprise identity

## Gold

Use gold ONLY for:

* CTA emphasis
* important actions
* premium highlights
* status accents

Never overuse gold.

Gold is an accent color, not a background system.

## Semantic Colors

Use semantic colors consistently:

* green → success/completed
* red → destructive/errors
* yellow → warnings/pending
* blue → informational

Never invent additional semantic colors.

---

# TYPOGRAPHY

## Primary Fonts

### Poppins

Use for:

* headings
* buttons
* labels
* navigation
* badges
* UI emphasis

Weights allowed:

* Light
* Regular
* Medium
* Bold

### Lora

Use for:

* body text
* descriptions
* paragraphs
* long-form reading

Weights allowed:

* Regular
* Italic

---

# TYPOGRAPHIC SCALE

## Display

```css
font-family: Poppins;
font-weight: 700;
font-size: 36px;
line-height: 1.2;
```

Use for:

* landing hero
* main dashboard titles

---

## H1

```css
font-family: Poppins;
font-weight: 700;
font-size: 28px;
line-height: 1.2;
```

Use for:

* section headers
* major views

---

## H2

```css
font-family: Poppins;
font-weight: 700;
font-size: 22px;
```

Use for:

* cards
* subsections

---

## H3

```css
font-family: Poppins;
font-weight: 500;
font-size: 16px;
```

Use for:

* subtitles
* labels
* metadata headers

---

## Body Large

```css
font-family: Lora;
font-size: 13px;
line-height: 1.5;
```

---

## Body

```css
font-family: Lora;
font-size: 11px;
line-height: 1.5;
```

---

## Caption

```css
font-family: Poppins;
font-weight: 300;
font-size: 9px;
```

---

## Label

```css
font-family: Poppins;
font-weight: 500;
font-size: 9px;
letter-spacing: 0.05em;
text-transform: uppercase;
```

---

# TYPOGRAPHY RULES

* Never use more than 2 Poppins weights in the same view.
* Use Lora for any text block longer than 2 lines.
* Always preserve hierarchy.
* Never reduce body line-height below 1.5.
* Labels and badges should use increased tracking.
* Avoid oversized typography on operational screens.

---

# SPACING SYSTEM

Base unit: 8px

## Scale

```css
4px   = xs
8px   = sm
16px  = md
24px  = lg
32px  = xl
48px  = 2xl
64px  = 3xl
```

---

# SPACING RULES

## 4px

Use only for:

* icon/text spacing
* dense inline layouts

## 8px

Use for:

* badge padding
* chip spacing
* compact controls

## 16px

Default spacing for:

* forms
* cards
* sections
* mobile layouts

## 24px–32px

Use between:

* dashboard sections
* grouped modules

## 48px–64px

Use only for:

* page structure
* desktop spacing
* layout separation

---

# GRID SYSTEM

## Mobile

* 1–4 columns
* margin: 16px
* gutter: 8px

## Tablet/Desktop

* 12-column grid
* margin: 40px
* gutter: 8px

---

# LAYOUT PRINCIPLES

## Cleaner App

Priority:

* speed
* clarity
* thumb usability
* outdoor readability

Rules:

* large touch targets
* sticky actions
* minimal navigation depth
* important actions reachable with one hand
* large status indicators
* high contrast outdoors

## Admin Panel

Priority:

* information density
* operational monitoring
* rapid management workflows

Rules:

* dashboard-oriented
* table-first layouts
* clear filtering
* realtime visibility
* strong hierarchy

---

# BUTTON SYSTEM

## Primary Button

Use for:

* start service
* finish service
* save
* confirm

Style:

* navy background
* white text
* medium elevation
* rounded corners
* bold label

---

## Secondary Button

Use for:

* navigation
* maps
* optional actions

Style:

* outlined
* navy border
* transparent background

---

## Destructive Button

Use ONLY for:

* delete
* deactivate
* cancel critical flow

Color:

* error red

---

# STATUS BADGES

Allowed statuses:

* Pending
* In Progress
* Returned
* Completed
* Offline
* Warning

Rules:

* compact
* uppercase
* highly readable
* semantic color only

---

# FORM DESIGN

Rules:

* always visible labels
* inline validation
* accessible contrast
* large mobile touch areas
* no floating labels

Validation states:

* default
* focus
* success
* error
* disabled

---

# CARD DESIGN

Cards must:

* use subtle borders
* soft shadows only
* clean spacing
* strong hierarchy

Avoid:

* heavy shadows
* neon effects
* glassmorphism

---

# ICONOGRAPHY

Use:

* Lucide React only

Sizes:

* 20px inline
* 24px actions
* 32px illustrations

Stroke width:

* 1.5px

Icons inherit text color.

---

# MOTION & ANIMATION

Allowed:

* subtle transitions
* state feedback
* loading transitions
* page fade-ins
* micro-interactions

Use:

* Framer Motion

Duration:

* 150–250ms preferred

Avoid:

* parallax
* exaggerated motion
* bouncing
* flashy effects
* unnecessary animation

---

# LOADING STATES

Mandatory:

* skeleton loaders
* optimistic UI when safe
* explicit sync states
* offline indicators

Any operation >300ms must show loading feedback.

---

# OFFLINE UX

The cleaner app is offline-first.

Must visibly communicate:

* syncing
* pending uploads
* offline mode
* retry states

Never hide connectivity status.

---

# PHOTO SYSTEM UX

Photo flows must:

* feel fast
* minimize taps
* show upload state
* show compression progress
* persist offline

Use:

* grid previews
* large thumbnails
* clear BEFORE/AFTER distinction

---

# MAPS & LOCATION UX

Location interactions must:

* clearly communicate GPS status
* show validation state
* explain radius errors
* provide actionable feedback

Messages must be operational and concise.

---

# ACCESSIBILITY

Mandatory:

* WCAG AA compliance
* keyboard navigation
* semantic HTML
* visible focus states
* proper labels
* color contrast compliance

Never rely only on color to communicate state.

---

# RESPONSIVENESS

Cleaner App:

* mobile-first ALWAYS

Admin Panel:

* desktop-first
* tablet-compatible

Avoid:

* horizontal scrolling
* overcrowded layouts
* hidden critical actions

---

# COMPONENT GUIDELINES

Prefer:

* reusable components
* composition
* consistent variants
* token-based styling

Avoid:

* one-off styles
* inline magic values
* duplicated components

---

# TAILWIND RULES

Use:

* Tailwind utility-first
* design tokens
* semantic classes
* reusable variants

Avoid:

* arbitrary values unless necessary
* deeply nested conditional styling

---

# UI ANTI-PATTERNS

NEVER:

* use glassmorphism
* abuse gradients
* use low contrast text
* create dense unreadable dashboards
* overanimate operational screens
* hide critical actions
* use tiny touch targets
* overload cards with information

---

# ENGINEERING UX RULES

All interfaces must optimize for:

* operational efficiency
* low cognitive load
* field usability
* mobile reliability
* fast workflows
* error prevention
* realtime clarity

The system is a business-critical operational tool.

Usability is more important than visual experimentation.

### Don't
- Don't introduce a sixth accent colour. The brand operates with ink + gray + the four-pair gradient palette; new accents flatten the voice.
- Don't render headlines in all-caps. Sentence-case + negative tracking is non-negotiable.
- Don't drop a single heavy drop-shadow on cards. The brand's elevation is built from stacked small offsets + inset hairline rings.
- Don't render the brand gradient at icon scale or in a single-colour reduced form. The gradient lives at hero scale only.
- Don't promote the geometric sans to weight 700. The brand's display ceiling is 600.
- Don't pair the marketing 100-px pill CTA shape with the 6-px nav radius on the same screen — pick a scale and stay there.
- Don't set body paragraphs in the mono face. The mono is for code + technical labels only.
