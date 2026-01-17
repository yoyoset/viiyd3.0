---
name: Tailwind CSS for Hugo
description: Best practices for architecting Tailwind CSS within a Hugo project.
---

# Tailwind CSS x Hugo Architecture

## 1. Setup & Configuration (v4 Standard)

> [!CAUTION]
> **Tailwind CSS v4 Requirement**
> This project uses Tailwind CSS **v4**. Do NOT use legacy v3 configuration.
> *   **Plugin**: Must use `@tailwindcss/postcss`, NOT `tailwindcss`.
> *   **CSS Syntax**: Must use `@import "tailwindcss";`, NOT `@tailwind base;`.

### 1.1 Dependencies
```bash
npm install -D tailwindcss @tailwindcss/postcss postcss postcss-cli autoprefixer
```

### 1.2 Configuration Rules

*   **`postcss.config.js`** (Root):
    ```js
    module.exports = {
      plugins: {
        '@tailwindcss/postcss': {}, // v4 Plugin
        autoprefixer: {},
      },
    }
    ```

*   **`tailwind.config.js`**: Still required for `content` paths.
    ```js
    module.exports = {
      content: ["./layouts/**/*.html", "./content/**/*.{html,js,md}"],
      theme: { extend: {} },
      plugins: [],
    }
    ```

## 2. Directory Structure

*   `assets/css/main.css`: The entry point.
    ```css
    @import "tailwindcss";
    /* No @layer utilities needed by default in v4 unless customizing */
    ```
*   **Usage**: In `layouts/partials/head.html`, use Hugo Pipes.

## 3. Production Optimization

*   **Minification**:
    ```go
    {{ $style := resources.Get "css/main.css" | css.PostCSS }}
    {{ if hugo.IsProduction }}
        {{ $style = $style | minify | fingerprint }}
    {{ end }}
    <link rel="stylesheet" href="{{ $style.RelPermalink }}">
    ```
*   **Typography**: Use `@tailwindcss/typography` for Markdown content (`.prose`).
    ```html
    <article class="prose prose-invert lg:prose-xl">
      {{ .Content }}
    </article>
    ```

## 4. Anti-Patterns (Avoid)

*   ❌ Creating separate CSS files for every component (defeats Utility-First purpose).
*   ❌ Hardcoding styles in `head.html` without PostCSS processing.
*   ❌ Forgetting to include `content` paths, leading to missing styles in production.
