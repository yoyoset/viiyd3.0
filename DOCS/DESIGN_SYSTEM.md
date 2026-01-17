# 🎨 VIIYD 3.0: Design System (The Truth)

> **Source**: `.agent/skills/design_philosophy.md`
> **Status**: Frozen

---

## 1. Color Palette (Imperial Gold)

### Neautrals (Backgrounds)
| Name | Hex | Usage |
| :--- | :--- | :--- |
| `neutral-900` | `#171717` | **Main Background**. Deep Charcoal. |
| `neutral-800` | `#262626` | **Surface**. Cards, Modals. |
| `neutral-400` | `#a3a3a3` | **Body Text**. Reduced contrast for reading. |
| `white` | `#ffffff` | **Headings**. High emphasis only. |

### Accents (Gold)
| Name | Hex | Usage |
| :--- | :--- | :--- |
| `gold-400` | `#FFD700` | **Primary**. Links, Hover States, Icons. |
| `gold-500` | `#B8860B` | **Secondary**. Borders, Sub-headings. |
| `gold-900/10` | `rgba...` | **Subtle Backgrounds**. Selection states. |

---

## 2. Typography

### Body: `Inter`
*   **Weights**: 400 (Regular), 600 (Semi-Bold).
*   **Tracking**: `tight` for Headlines, `normal` for body.

### Tech: `JetBrains Mono`
*   **Usage**: Dates, Tags, Metadata, Code Blocks.
*   **Size**: `text-xs` or `text-sm`.

---

## 3. UI Component Contracts

### 3.1 Buttons
*   **Default**: Border `neutral-700`, Text `neutral-300`, Hover `border-gold-400 text-gold-400`.
*   **Primary**: Bg `gold-400`, Text `neutral-900`, Font `Bold`.

### 3.2 Cards (Bento)
*   **Bg**: `neutral-800`.
*   **Border**: `1px solid neutral-700`.
*   **Hover**: `border-gold-500/50`, `scale-[1.01]`, `shadow-2xl`.

### 3.3 Navigation
*   **Height**: `h-16` or `h-20`.
*   **Backdrop**: `backdrop-blur-md bg-neutral-900/80`.
*   **Z-Index**: `z-50`.

---

## 4. Tailwind Configuration Reference

```js
// tailwind.config.js snippet
theme: {
  extend: {
    colors: {
      neutral: { 900: '#171717', 800: '#262626' },
      gold: { 400: '#FFD700', 500: '#B8860B' }
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    }
  }
}
```
