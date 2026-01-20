---
name: Vanilla JS Mastery (No Frameworks)
description: Protocols and patterns for writing clean, performant Vanilla JavaScript in the VIIYD 3.0 ecosystem.
---

# Vanilla JS Mastery (The "Zero-Framework" Doctrine)

In VIIYD 3.0, we reject heavy frameworks (React, Vue, Alpine) in favor of raw, performant DOM manipulation. This skill defines the patterns to maintain codebase sanity without external dependencies.

## 1. Core Philosophy
*   **No Build Steps (logic-wise):** JS should be understandable by the browser (ES6+ Modules allowed).
*   **State Management:** Use `dataset` attributes on DOM elements as the source of truth for UI state.
*   **Event Delegation:** Attach listeners to containers, not individual dynamic elements.

## 2. DOM Manipulation Patterns

### 2.1 Selector Caching
Don't querying the DOM inside loops or high-frequency events.
```javascript
// ✅ Correct
const container = document.getElementById('gallery');
const items = container.querySelectorAll('.item');

// ❌ Incorrect
window.addEventListener('scroll', () => {
    document.querySelectorAll('.item').forEach(...) // Thrashing
});
```

### 2.2 Class Toggling (The "State" Pattern)
Use CSS classes to represent state, not inline styles.
```javascript
// ✅ Correct
element.classList.toggle('is-active');

// ❌ Incorrect
element.style.display = 'block';
```

## 3. Worker Integration (Backend Proxy)
All business logic (Quotes, Auth) lives in Cloudflare Workers. JS is just the messenger.

### 3.1 Fetch Wrapper Pattern
Always handle network errors gracefully.
```javascript
async function callWorker(endpoint, data) {
    try {
        const response = await fetch(`/api/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`Worker Error: ${response.status}`);
        return await response.json();
    } catch (e) {
        console.error("Communication Breakdown:", e);
        // Show user-facing toast/error
        return null;
    }
}
```

## 4. Performance Guardrails
*   **Defer Everything:** All custom scripts must be loaded with `defer` in `head.html`.
*   **Debounce Input:** Never listen to `input` or `resize` without a debounce wrapper.
*   **Lazy Load:** Use `IntersectionObserver` for images or heavy DOM elements outside the viewport.
