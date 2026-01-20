# VIIYD Project Standards & Guidelines

This document serves as the source of truth for design, copywriting, and technical implementation standards for the VIIYD project.

## 1. Copywriting Standard: "The Master & Commander"

All project descriptions and site copy must adhere to the **"Master & Commander"** persona. We are not just painting toys; we are executing military-grade operations for tabletop deployment.

*   **Tone:** Authoritative, Professional, Kinetic, Engaging.
*   **Keywords:** Deployment, Logistics, Protocol, Alchemy, Ballistics, Tactics, High-Impact, Precision.
*   **Vibe:** Think "High-Tech Mercenary PMC" meets "Artisan Studio".
*   **Don't say:** "Here are the colors we used."
*   **Do say:** "The Alchemy: Color Data."
*   **Don't say:** "We painted it nicely."
*   **Do say:** "Optimized for tabletop dominance and maximum visual impact."

### Component Naming Conventions
*   **Recipes** → `The Alchemy` / `Pigment Analysis`
*   **Techniques** → `Tactical Protocol` / `Methodology`
*   **Stats** → `Mission Data` / `Field Report`

## 2. Layout & Design Patterns

### The "Bento" Grid
*   **Structure:** All image galleries must use the `.image-grid` class.
*   **Spacing:** Strictly `gap-2` (8px) on all sides.
*   **Aspect Ratio:** strictly `aspect-square`.
*   **Responsiveness:**
    *   Mobile: 3 columns (`grid-cols-3`)
    *   Tablet: 5 columns (`md:grid-cols-5`)
    *   Desktop: 6 columns (`lg:grid-cols-6`)

### Content Cards
*   **Style:** Dark glassmorphism backgrounds (`bg-neutral-800/30`) with subtle colored borders (`border-white/5` or `border-[color]-500/20`).
*   **Interaction:** Hover effects should include slight border brightening and/or glow.
*   **Typography:** Use Emoji icons sparingly but effectively to anchor headers (e.g., 🔥, 🎯, 💎).

## 3. Technical Implementation Rules

### Markdown HTML Rendering
*   **NO INDENTATION for HTML Blocks:** When writing HTML components inside Markdown files (e.g., cards, grids), **DO NOT INDENT** the HTML tags.
    *   **Incorrect (Rendered as Code):**
        ```html
            <div class="card">
        ```
    *   **Correct (Rendered as HTML):**
        ```html
        <div class="card">
        ```
*   **Inline Styles:** Avoid inline styles where possible; use Tailwind utility classes.

### Hugo Template Syntax
*   **No Leading Spaces in URL Functions:** When using `relLangURL` or `absLangURL`, **NEVER** include a leading space inside the quote string.
    *   **Incorrect:** `{{ relLangURL " contact" }}` (Causes Git pre-commit failure)
    *   **Correct:** `{{ relLangURL "contact" }}`

### CSS Reset & Overrides
*   **Typography Plugin Overrides:** The site uses `@tailwindcss/typography` (`.prose`). This plugin adds aggressive margins to elements like `figure` and `img`.
*   **Legitimate Use of `!important`:** To integrate custom layout components (like the Bento Grid) within prose content, it is **PERMISSIBLE AND REQUIRED** to use `!important` (e.g., `!m-0`) to force-reset margins on specific elements (`.image-grid figure`). This prevents layout collapse and ensures specific design intent overrides generic prose defaults.

## 4. File Structure
*   **Work Content:** `content/work/[project-name]/index.md`
*   **Images:** Hosted on `photo.viiyd.com`, referenced via `{{< lightbox >}}`.
*   **Template:** Always start new work posts by copying `WORK_TEMPLATE.md`.

## 5. Core Logic Modification Protocol

### "The Immutable Core" Rule
When encountering a system error (e.g., Hugo build failure, template errors, or logic conflicts):
1.  **Stop & Record:** Do not immediately attempt to fix the core logic (Layouts, Themes, Config). First, record the error details comprehensively.
2.  **Verify & Triage:** Double-check if the error can be resolved at the **Content Layer** (Markdown/Frontmatter) first.
    *   *Question:* "Did I feed the system the wrong data?" (Most likely)
    *   *Question:* "Is the system logic fundamentally broken?" (Least likely)
3.  **Strict Approval Chain:**
    *   If a Core Change (`layouts/`, `theme/`, `hugo.toml`, `static/js/`) is deemed absolutely necessary, it must be **documented as a proposal** and **double-checked** against the original architectural intent.
    *   **NEVER** modify core files as a "quick fix" for a single content error. Fix the content, not the machine.

## 6. Bilingual File Structure Standard

### Strategy: Co-Location (Bundle)
We use the **Leaf Bundle** strategy where English and Chinese files reside in the SAME directory. This ensures assets are shared and structure is mirrored 1:1.

*   **Structure:**
    ```text
    content/
    ├── work/
    │   └── [project-slug]/
    │       ├── index.md        (English - Main)
    │       └── index.zh.md     (Chinese - Localization)
    ├── about/
    │   ├── index.md
    │   └── index.zh.md
    └── rates/
        ├── index.md
        └── index.zh.md
    ```

*   **Prohibited:**
    *   **NO** `content/zh/` folder for content types (e.g., `content/zh/work` is BANNED).
    *   **NO** Orphaned language files. Every `index.md` MUST have an `index.zh.md`.

### Cleanup Protocol
Any folder found in `content/zh/` (legacy structure) must be:
1.  **Migrated** to the Co-Location structure if valuable.
2.  **Deleted** if redundant or empty.
