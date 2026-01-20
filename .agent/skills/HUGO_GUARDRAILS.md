---
name: Hugo Guardrails & Best Practices
description: Essential syntax rules, logic patterns, and anti-patterns for Hugo development in the VIIYD 3.0 project.
---

# Hugo Guardrails & Best Practices

This skill defines the non-negotiable technical standards for Hugo templates in this project. Adherence is mandatory to pass pre-commit hooks and ensure logic stability.

## 1. Syntax Guardrails

### 1.1 No Leading Spaces in URL Functions
**Severity:** CRITICAL (Breaks Git Hooks)

*   **Rule:** When using `relLangURL` or `absLangURL`, the string argument MUST NOT start with a space.
*   **Anti-Pattern (Forbidden):**
    ```html
    <a href="{{ relLangURL " contact" }}">  <!-- ❌ Leading space -->
    <a href="{{ relLangURL " work/" }}">    <!-- ❌ Trailing slash (inconsistent) -->
    ```
*   **Pattern (Required):**
    ```html
    <a href="{{ relLangURL "contact" }}">   <!-- ✅ Clean -->
    <a href="{{ relLangURL "work" }}">      <!-- ✅ Clean -->
    ```
*   **Self-Correction Regex:**
    `\{\{\s*relLangURL\s+" ` -> Replace with `{{ relLangURL "`

## 2. Logic Patterns

### 2.1 Image Fallback & Optimization
**Severity:** HIGH (Causes Broken Images)

*   **Context:** We often use a fallback logic to determine the cover image (e.g., specific cover -> first image -> default).
*   **Rule:** Once a variable (e.g., `$finalSrc`) is calculated via fallback logic, **YOU MUST USE THAT VARIABLE** in subsequent processing steps. Do NOT revert to using the raw `.Params` which might be empty.
*   **Anti-Pattern:**
    ```go
    {{ $finalSrc := ... (fallback logic) ... }}
    {{ if $finalSrc }}
        {{/* ❌ WRONG: Ignoring $finalSrc and using potentially empty .Params.cover */}}
        {{ $opt := partial "optimized-image" (dict "src" .Params.cover) }}
    {{ end }}
    ```
*   **Pattern:**
    ```go
    {{ $finalSrc := ... (fallback logic) ... }}
    {{ if $finalSrc }}
        {{/* ✅ CORRECT: Passing the calculated $finalSrc */}}
        {{ $opt := partial "optimized-image" (dict "src" $finalSrc) }}
    {{ end }}
    ```

## 3. HTML in Markdown
**Severity:** MEDIUM (Layout Issues)

*   **Rule:** Do NOT indent HTML tags inside Markdown files (`.md`). Indented HTML is rendered as a Code Block by Hugo's Goldmark renderer.
*   **Pattern:**
    ```html
    <!-- ✅ No indentation -->
    <div class="grid">
        ...
    </div>
    ```

## 4. Verification Protocol
Before confirming a task completed:
1.  **Grep Check:** Run `grep -r "relLangURL \" " layouts/` to ensure no spaces were introduced.
2.  **Logic Check:** If editing image logic, verify that the `partial` call uses the resolved variable.
