---
name: Design Philosophy (Imperial Gold)
description: The visual language guide for VIIYD 3.0, focusing on Dark Mode, Minimalism, and Gold Accents.
---

# Imperial Gold Design System

## 1. Core Aesthetics

*   **Theme**: Dark Mode Native.
    *   **Background**: `neutral-900` (`#171717`) - Deep Charcoal, not Pitch Black.
    *   **Surface**: `neutral-800` (`#262626`) - Cards & Modals.
*   **Accents**:
    *   **Primary**: `gold-400` (`#FFD700`) - Text Links, Hovers, Icons.
    *   **Secondary**: `gold-500` (`#B8860B`) - Borders, Sub-headings.
*   **Typography**:
    *   **Body**: `Inter` - Clean, readable sans-serif.
    *   **Tech**: `JetBrains Mono` - For metadata, dates, and code.

## 2. Minimalist Principles (2025)

*   **Negative Space**: Give content room to breathe. Increase standard padding by 1.5x.
*   **Micro-Interactions**:
    *   Buttons: Substle scale (`scale-105`) on hover.
    *   Links: Underline expansion or color shift.
*   **Glassmorphism**: Use `backdrop-blur-md` + `bg-neutral-900/80` for Headers and Floating UI.

## 3. Component Rules

### Buttons
*   **Style**: Outline or Ghost default. Solid Gold only for PRIMARY Call-to-Action.
*   **Shape**: `rounded-md` (Slightly rounded, not pill).

### Imagery
*   **Treatment**: No raw images. Wrap in containers.
*   **Hover**: Slight brightness increase or zoom (`duration-500`).

### Layout (Bento)
*   **Grid**: Dense, modular CSS Grid.
*   **Content**: High density without clutter.

## 4. Accessibility
*   **Contrast**: Ensure Gold-on-Black meets WCAG AA (Check contrast ratio).
*   **Focus**: Gold outlines for keyboard navigation.
