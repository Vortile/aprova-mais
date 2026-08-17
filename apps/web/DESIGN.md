# Design System Strategy: The Academic Atelier

This design system is crafted for **Aprende+**, a premium tutoring service based in Manaus. Moving away from the cold, clinical nature of corporate "EdTech" and the frantic energy of "playful" learning apps, this system adopts an editorial, high-end approach. We treat the digital interface as an **Academic Atelier**: a sophisticated, calm, and highly organized space where student growth is nurtured through clarity and human warmth.

---

## 1. Creative North Star: "The Curated Sanctuary"

The digital experience must feel like a quiet, high-end study lounge. We achieve this through **Soft Minimalism**—a style that prioritizes breathing room (whitespace) and tonal depth over structural lines. By utilizing intentional asymmetry and overlapping elements, we break the "bootstrap template" feel, creating a signature identity that feels bespoke and authoritative.

---

## 2. Color & Tonal Architecture

The palette is rooted in the lush but muted tones of a sophisticated study.

- **Primary (#1d6875):** A deep, intellectual teal used for core branding and navigation. It conveys competence and calm.
- **Tertiary (#2563eb):** Our "Action Blue" accent. This vibrant blue is reserved for CTAs and key focal points, giving a modern, high-trust educational feel.
- **Surface (#faf9f6):** The "Off-white" foundation. It is softer on the eyes than pure white, mimicking high-quality parchment.

### The "No-Line" Rule

To maintain a premium editorial feel, **1px solid borders are strictly prohibited for sectioning.**

- **Defining Boundaries:** Use background color shifts. A section intended to stand out should move from `surface` to `surface-container-low` (#f4f4f0).
- **The "Glass & Gradient" Rule:** For hero sections or high-impact areas, use subtle gradients transitioning from `primary` (#1d6875) to `primary-container` (#a4e8f7). Floating elements should utilize **Glassmorphism**: use semi-transparent surface colors with a `backdrop-filter: blur(20px)` to create a "frosted glass" effect.

---

## 3. Typography: Editorial Cadence

We utilize **Manrope**, a modern sans-serif that balances geometric precision with humanistic warmth.

- **Display & Headlines:** Use `display-lg` (3.5rem) and `headline-lg` (2rem) with **Bold** weights. These are our "anchors." They should feel confident and take up space, often with tighter letter-spacing (-2%) to feel like a high-end magazine header.
- **Body Text:** Use `body-lg` (1rem) for standard reading. Ensure a generous line-height (1.6) to prevent eye fatigue during long sessions.
- **Hierarchy as Brand:** By creating a high contrast between the bold `headline-sm` (1.5rem) and the light `label-md` (0.75rem), we convey a sense of curated organization.

---

## 4. Elevation & Depth: Tonal Layering

Traditional shadows and borders are replaced by **Tonal Layering**. We build the interface like stacked sheets of fine paper.

- **The Layering Principle:**
  - Level 0: `surface` (#faf9f6) - The base canvas.
  - Level 1: `surface-container-low` (#f4f4f0) - Subtle secondary sections.
  - Level 2: `surface-container-lowest` (#ffffff) - High-priority cards or interactive elements.
- **Ambient Shadows:** If an element must float (like a modal), use a shadow with a 24px blur and 4% opacity. The shadow color must be a tint of `on-surface` (#303330), never pure black.
- **The "Ghost Border" Fallback:** If accessibility requires a stroke, use `outline-variant` (#b0b3ae) at 15% opacity. This creates a "suggestion" of a boundary rather than a hard wall.

---

## 5. Signature Components

### Buttons (The Warm Focus)

- **Primary CTA:** Uses `tertiary` (#8c510b) with `on-tertiary` (#fff7f4) text.
  - _Styling:_ `lg` rounding (1rem). No border.
- **Secondary Action:** `primary-container` (#a4e8f7) with `on-primary-container` (#005763) text.
- **Interaction:** On hover, apply a subtle `surface-bright` inner glow rather than a dark overlay.

### Cards & Content Blocks

- **Forbid Dividers:** Never use lines to separate content within a card. Use the Spacing Scale (e.g., `8` - 2.75rem) to create separation through "void space."
- **Structure:** Use `surface-container-highest` (#e1e3de) for small, informational "pills" inside a `surface-container-low` card to create nested depth.

### Input Fields

- **Style:** No bottom lines or full outlines. Use a solid background of `surface-container` (#eeeeea) with `md` rounding (0.75rem).
- **Active State:** Transition the background to `surface-container-lowest` (#ffffff) and add a "Ghost Border" of `primary` at 20% opacity.

### Selection Chips

- **Style:** Use `secondary-container` (#b9ebf4) for unselected states. When active, transition to `primary` (#1d6875) with `on-primary` (#eefbff) text. This provides a clear, "competent" visual confirmation of choice.

---

## 6. Do's and Don'ts

### Do

- **Embrace Asymmetry:** Offset images or text blocks slightly from the grid to create a bespoke, non-standard layout.
- **Use Generous Whitespace:** If you think there is enough space, add 20% more. This is a "calm" service; the UI must never feel crowded.
- **Mobile-First Precision:** On mobile, ensure touch targets for buttons are at least `12` (4rem) in height, even if the visual element is smaller.

### Don't

- **No "Corporate" Blue:** Avoid standard #0000FF. Only use our signature Teal and Gold.
- **No Hard Edges:** Avoid `none` rounding. Everything should have at least `sm` (0.25rem) to feel approachable and "warm."
- **No Pure Black:** Text should always be `on-surface` (#303330) to maintain the soft, premium contrast against the off-white background.
