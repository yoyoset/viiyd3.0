---
name: Visual System (Imperial Gold)
description: The definitive design tokens, layout rules, and animation protocols for the VIIYD 3.0 "Imperial Gold" aesthetic.
---

# Visual System: Imperial Gold

This document encodes the visual DNA of the project. Deviating from these codes defaults to "Generic Template" (Unacceptable).

## 1. Color Palette (The "Imperial" Spectrum)

### 1.1 Gold (The Primary Accent)
*   **Base:** `text-gold-500` (#EAB308) - Used for primary actions, borders, and highlights.
*   **Glow:** `shadow-[0_0_30px_rgba(234,179,8,0.3)]` - Mandatory for hover states on gold elements.

### 1.2 The Void (Backgrounds)
*   **Deepest:** `bg-neutral-950` (Main Body Background)
*   **Surface:** `bg-neutral-900` (Cards, Panels)
*   **Glass:** `bg-neutral-900/80 backdrop-blur-md` (Overlays, Sticky Headers)

### 1.3 Semaphore (Functional Colors)
*   **Cyan (Tech/Process):** `text-cyan-500` / `border-cyan-500/20`
*   **Emerald (Success/Paid):** `text-emerald-500`
*   **Fuchsia (Archive/Logs):** `text-fuchsia-500`

## 2. Layout Patterns

### 2.1 The "30/40/30" Header
The navigation header MUST follow this strict grid to ensure balance:
```html
<header class="grid grid-cols-[30%_40%_30%] ...">
    <!-- Left: Brand/Logo -->
    <!-- Center: Navigation Links -->
    <!-- Right: Actions/Language -->
</header>
```

### 2.2 The "Bento" Grid
*   **Container:** `class="grid grid-cols-1 md:grid-cols-4 gap-4"`
*   **Philosophy:** Mix of square (`aspect-square`), tall (`row-span-2`), and wide (`col-span-2`) cards.
*   **Content:** Never empty. If no image, use a "Signal Lost" placeholder or CSS pattern.

## 3. Animation Protocols
Static layouts are dead layouts.

### 3.1 Micro-Interactions
*   **Hover Lift:** `transition-all duration-300 hover:-translate-y-1`
*   **Hover Glow:** `group-hover:opacity-100 placeholder-glow`

### 3.2 Mandatory Keyframes
If using Tailwind config, ensure these are available:
*   `animate-pulse-gold`: A slow, breathing glow for CTA buttons.
*   `animate-float`: Subtle vertical bobbing for hero images.

## 4. Typography
*   **Headings:** `font-serif` (Playfair/Merriweather style) - Imperial authority.
*   **Data/Meta:** `font-mono` (JetBrains/Fira) - Technical precision.
*   **Body:** `font-sans` (Inter/System) - Readability.
