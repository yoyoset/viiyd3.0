# VIIYD Project Standards & Guidelines

This document serves as the source of truth for design, copywriting, and technical implementation standards for the VIIYD project.

> **2026-09-03 更正**：前端设计的唯一来源已不是 `DOCS/DESIGN_SYSTEM.md`（那份描述 3.0，已退役）。
> 4.0 看 `assets/css/tokens.css` 与 `CLAUDE.md` 的「前端约定（4.0）」。
> The current visual standard is the Claude redesign: dossier/archive, handmade studio, restrained premium editorial. Older cyber / PMC / bento language in this file is legacy and must not be used as precedent for new frontend work.

## 1. Copywriting Standard: "Archive Studio"

All site copy should support the current VIIYD positioning: a selective, hand-painted miniature studio with archival documentation for each commission.

*   **Tone:** Calm, precise, personal, premium, trustworthy.
*   **Keywords:** hand-painted, dossier, archive, reference, deadline, commission slot, certificate, studio, Chengdu, painted by hand.
*   **Vibe:** Private art archive meets working painter's desk.
*   **Don't say:** "Optimized for tabletop dominance and maximum visual impact."
*   **Do say:** "Painted by hand at VIIYD Studio, Chengdu."
*   **Don't say:** "Initiate deployment protocol."
*   **Do say:** "Send a reference picture and a deadline. I usually reply within 48h."

### Component Naming Conventions
*   **Project pages** → `Dossier` / `Archive`
*   **Photos** → `Plates`
*   **Painter commentary** → `Painter's Notes`
*   **Completion proof** → `Certificate`
*   **Commercial entry** → `Commission` / `Quote`
*   **Technical stats** → `Specimen Card`

## 2. Layout & Design Patterns

### Archive / Dossier Layout
*   **Structure:** New frontend work should follow `DOCS/DESIGN_SYSTEM.md`.
*   **Surfaces:** Prefer full-width bands, hairline separators, archive tables, document panels, and photographic grids.
*   **Spacing:** 用 `assets/css/tokens.css` 里的令牌（`--gut` / `--gut-m` / `--content-max`）。
    ~~`assets/css/main.css` 的 `--page-pad` / `--dossier-pad`~~ —— 该文件已于 4.0 删除。
*   **Aspect Ratios:** Use stable ratios such as `16/9`, `4/5`, `3/4`, `4/3`, or `1/1`; do not allow dynamic content to shift image layouts.
*   **Cards:** Avoid generic rounded card stacks. Cards are for repeated items, modals, forms, and explicit framed tools only.

### Legacy Patterns
*   **Bento grids, glassmorphism, emoji-anchored cards, neon/glow panels, and cyber/PMC copy are deprecated.**
*   Existing pages that still use these patterns are migration targets, not examples to copy.

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
