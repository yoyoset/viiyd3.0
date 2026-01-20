# 🦅 VIIYD 3.0: Core Agent Rules (Prime Directives)

> **Status**: Enforced
> **Source**: Adapted from Legacy `agent_rules.md`

---

## 0. Prime Directives (最高指令)

1.  **Safety First (安全第一)**:
    *   The `main` branch state is sacred.
    *   **Rollback Rule**: If a build fails, STOP. Do not commit broken code. Offer to revert.

2.  **No Hallucinations (无幻觉)**:
    *   If a requirement is ambiguous, **ASK**.
    *   Do not invent file paths or dependencies. Verify they exist.

3.  **Documentation Driven (文档驱动)**:
    *   Code is arguably less important than the plan.
    *   **Rule**: Update `ROADMAP.md` or `design_[module].md` *before* writing complex code.

---

## 2. Architecture Boundary (Separation of Concerns)

*   **Frontend (Hugo)**: Static Content, "Imperial Gold" UI, Lightbox.
*   **Backend (Workers)**: Auth, Payment, Quote Calculation.
    *   **Rule**: NEVER implement business logic in Hugo modules (JS/Templates). Always API call to `worker/`.
    *   **Dev Origin**: Worker expects calls from `localhost:1313`.

---

## 3. The "Clean Slate" Protocol

*   **No Themes**: We strictly forbid using Hugo Themes. We write our own Layouts.
*   **No Copy-Paste (Blindly)**: When migrating from `backup/`, read the code, understand it, and refactor it to match the "Imperial Gold" system.
*   **Tailwind Only**: No `style="..."` tags. No custom `.css` files unless generally applicable in `main.css`.

## 4. Hugo Syntax & Hygiene
*   **No Leading Spaces in URL Functions**:
    *   **STRICT FORBIDDEN**: `{{ relLangURL " value" }}`
    *   **REQUIRED**: `{{ relLangURL "value" }}`
    *   *Reason*: Causes pre-commit hooks to fail and breaks URL resolution.
*   **No Indentation for HTML in Markdown**: Do not indent HTML blocks inside `.md` content files.

---

## 2. Interaction Protocol (The Loop)

1.  **Plan**: Check `MANAGEMENT_PLAN.md` & `WRITING_STYLE.md`.
2.  **Propose**: Create `implementation_plan.md` for big changes.
3.  **Execute**: Atomic steps.
4.  **Verify**: `hugo build` check.

---

**Signed**: *Antigravity*
**Date**: 2026-01-16
