# 🦅 VIIYD 3.0: AI-Native Development Governance Plan

> **Objective**: Establish a robust, scalable, and AI-optimized workflow for managing the "Project Rebirth" (viiyd 3.0) lifecycle. This plan defines how the User (Product Owner) and the AI (Tech Lead) collaborate to maintain the "Clean Slate" philosophy while accelerating development.

---

## 🧠 1. The "AI Brain" (Knowledge Management)

To solve the context-window limitation, we will use specific **Artifacts** as external memory.

### 1.1 `ROADMAP.md` (Strategic View)
*   **Purpose**: Tracks high-level milestones (e.g., "Phase 1: Foundation", "Phase 2: Content Migration").
*   **Update Frequency**: Updated after every major feature completion.
*   **Role**: Keeps us focused on the "Big Picture".

### 1.1b `.agent/rules/` (Governance Constraints) - **[NEW]**
*   **`CORE_RULES.md`**: The Prime Directives (Safety, "No Themes").
*   **`WRITING_STYLE.md`**: Protocols for Internal, Blog, and Social writing.

### 1.1c `.agent/skills/` (Capability Expansion) - **[NEW]**
*   **`tailwind_hugo.md`**: Architecture best practices (Pipes, PurgeCSS).
*   **`writing_mastery.md`**: High-Agency communication guidelines.
*   **`design_philosophy.md`**: The "Imperial Gold" aesthetic guide.

### 1.2 `DESIGN_SYSTEM.md` (Visual Truth)
*   **Purpose**: The single source of truth for the "Imperial Gold" identity.
*   **Content**:
    *   Color Hex Codes (Gold-400, Neutral-900).
    *   Typography rules (Inter vs JetBrains Mono).
    *   Component contracts (e.g., "Buttons must always have `hover:scale-105`").
*   **Rule**: AI must check this file before writing any HTML/CSS to ensure consistency.

### 1.3 `TECH_SPEC.md` (Technical Truth)
*   **Purpose**: Documentation of the "Zero-Theme" architecture.
*   **Content**:
    *   Directory structure rules.
    *   JavaScript module logic (e.g., Lightbox state management).
    *   Hugo layouts hierarchy.

---

## ⚙️ 2. The Development Workflow (Protocol)

We will adhere to a strict **"Proposal -> Execution -> Verification"** loop to prevent regression.

### Step 1: Request & Analysis
*   **User**: "I want a new specific feature (e.g., Comments Section)."
*   **AI**: Analyzes `TECH_SPEC.md` and `DESIGN_SYSTEM.md` to scope the impact.

### Step 2: The Logic Check (Implementation Plan)
*   **AI**: Creates/Updates `implementation_plan.md`.
*   **Content**:
    1.  **Files to Modify**: Exact paths.
    2.  **Risk Assessment**: Will this break the layout?
    3.  **Design Check**: Does this use "Imperial Gold" colors?
*   **User**: Approves the plan (or corrects it).

### Step 3: Execution (Agentic Mode)
*   **AI**: Writes code in minimal chunks (Atomic Commits).
*   **AI**: Automatically fixes linting errors.

### Step 4: Verification (The "Health Check")
*   **AI**: Runs `hugo` build to check for errors.
*   **AI**: Checks for "Dead Code" (unused CSS/JS).
*   **AI**: Updates `ROADMAP.md` to mark progress.

---

## 🛡️ 3. Optimization, Maintenance & Safety Strategy

To keep the project "Clean", we will implement the following routine checks:

### 3.1 The Safety Net (Rollback Protocol)
*   **Git Strategy**: Before any complex "Execution" phase, we assume the current state is committed.
*   **Failure Mode**: If `hugo build` fails during Verification:
    1.  **Stop**: Do not attempt blind fixes.
    2.  **Report**: Notify User with the specific error log.
    3.  **Revert**: Offer to revert file changes to the last known good state.

### 3.2 The "Monday Clean-Up" (Periodic)
*   **Audit**: Scan for unused images in `assets/`.
*   **Refactor**: Consolidate repetitive Tailwind classes into `@apply` or Partial templates.
*   **Perf**: Check `hugo_stats.json` size and build times.

### 3.3 Tooling & Visibility
*   **Artifacts**: Use `render_diffs` or `diff` blocks in `implementation_plan.md` updates so the User sees *exactly* what changed.
*   **Preview**: During Verification, explicitly confirm `hugo server` is running on `localhost:1313`.

---

## 🚀 4. Immediate Action Plan (Next Steps)

1.  **Initialize**: `ROADMAP.md` (Strategy) and `DESIGN_SYSTEM.md` (Visuals).
2.  **Audit**: Run a full scan of `layouts/` to ensure **Mobile Responsiveness** (missing in v1.0).
3.  **Execute**: "Bento Grid" (Phase 2) with strict componentization.

---

**Signed**: *Antigravity (AI Tech Lead)*
**Version**: 1.1 (Audited)
**Date**: 2026-01-16
