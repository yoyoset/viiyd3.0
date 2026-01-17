# VIIYD 3.0 System Handoff Protocol

> **Document Purpose**: Agent-to-Agent handoff. This document enables a new AI model to understand, maintain, and extend the VIIYD 3.0 system without prior context.
> **Last Updated**: 2026-01-18
> **System Version**: v3.0.0

---

## I. System Context Acquisition

Before any modification, execute these steps to acquire system state:

### 1.1 Project Root
```
f:\mysite\viiyd3.0
```

### 1.2 Technology Stack
| Layer | Technology | Notes |
|-------|------------|-------|
| Static Site Generator | Hugo (Extended) | Config: `hugo.toml` |
| CSS Framework | Tailwind CSS v4 | Entry: `assets/css/main.css` |
| JavaScript | Vanilla JS (ES6+) | No jQuery, no frameworks |
| Backend | Cloudflare Workers | Located: `workers/contact-handler/` |
| Notification | Telegram Bot API | Bot: `@viiyd_bot` |
| Image Storage | Cloudflare R2 | Bucket: `viiyd-contact-images` |
| Anti-Spam | Cloudflare Turnstile | Widget in `contact.html` |

### 1.3 Running Local Server
```bash
# Development (includes drafts)
hugo server -D -p 1314

# Production preview
hugo server -p 1316
```

---

## II. Core Module Index

### 2.1 Lightbox (`assets/js/lightbox.js`)
**Purpose**: Full-screen image viewer with swipe gestures.

**Key Logic**:
- **Responsive Navigation**: CSS-based (`md:hidden` / `hidden md:flex`), NOT JS-based device detection.
- **Toolbar Layout**: `justify-between` with `mx-auto` centered button group.
- **Swipe Detection**: `startX` tracking with `typeof startX === 'number'` safety check.
- **Zoom**: Pinch-to-zoom + double-tap toggle, constrained pan boundaries.

**DOM Structure**:
```
lightbox (fixed fullscreen)
├── imgContainer (holds current image)
├── toolbar (bottom bar)
│   ├── prevToolbar (mobile only: md:hidden)
│   ├── centerGroup (share, save, zoom, counter)
│   └── nextToolbar (mobile only: md:hidden)
├── prevFloating (desktop only: hidden md:flex)
├── nextFloating (desktop only: hidden md:flex)
└── closeBtn (top-right, always visible)
```

**Troubleshooting**:
- Arrows disappear? Check CSS responsive classes.
- Swipe not working? Check `isZoomed` state logic.
- Button not clickable? Check `pointer-events-auto` on children.

---

### 2.2 Contact Form

**Frontend** (`layouts/_default/contact.html`):
- Native form with `enctype="multipart/form-data"`.
- Turnstile widget via `data-sitekey` from `hugo.toml` params.
- Image preview via `FileReader` in `assets/js/contact-form.js`.

**Backend** (`workers/contact-handler/src/index.js`):
- Receives `FormData` (not JSON).
- Validates Turnstile token via Cloudflare API.
- Uploads images to R2 bucket.
- Sends Telegram notification with Markdown formatting.

**Credentials** (stored as Wrangler secrets):
| Secret Name | Purpose |
|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Bot API access |
| `TELEGRAM_CHAT_ID` | Notification recipient |
| `TURNSTILE_SECRET` | Server-side verification |

**Worker URL**: `https://viiyd-contact-handler.yoyoset.workers.dev`

**Troubleshooting**:
- Turnstile "Invalid Domain"? Expected on localhost; works on `viiyd.com`.
- Telegram not receiving? Check bot token and chat ID in Wrangler secrets.
- CORS error? Verify `ALLOWED_ORIGIN` in `wrangler.toml`.

---

### 2.3 Internationalization (i18n)

**Files**:
- `i18n/en.toml` (English)
- `i18n/zh.toml` (Chinese)

**Structure** (Hugo convention):
```toml
[key_name]
other = "Translated string"
```

**Usage in templates**:
```html
{{ T "key_name" }}
```

**Common Keys** (Contact Form):
- `form_name`, `form_contact`, `form_project_type`, `form_description`, `form_submit`

---

## III. Design System

### 3.1 Color Palette (Imperial Gold)
| Token | Value | Usage |
|-------|-------|-------|
| `gold-500` | `#D4AF37` | Primary accent, buttons, links |
| `neutral-900` | `#171717` | Card backgrounds |
| `neutral-950` | `#0a0a0a` | Page background |

### 3.2 Typography
- **Headlines**: `font-serif font-black uppercase tracking-wider`
- **Body**: `font-mono` for labels, `font-sans` for paragraphs
- **Sizes**: Tailwind scale (`text-sm`, `text-xl`, etc.)

### 3.3 Component Patterns
- **Card**: `bg-neutral-900 border border-white/5 rounded-2xl p-8`
- **Button (Gold)**: `bg-gold-500 hover:bg-gold-400 text-neutral-900 font-bold rounded-lg`
- **Input**: `bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white`

---

## IV. Work Post Standard

**Template File**: `DOCS/WORK_TEMPLATE.md`

**Structure** (post-v3.0):
```markdown
---
title: "..."
date: YYYY-MM-DD
cover: "https://photo.viiyd.com/..."
layout: "project"
tier: "Spec Ops | Specialist | ..."
paints: [...]
---

<div class="image-grid">
{{< lightbox ... >}}
</div>

<!-- Technical Cards (Alchemy + Protocol) -->
<!-- NO BOTTOM CTA (removed in v3.0) -->

</div>
```

---

## V. Deployment & Versioning

### 5.1 Git Workflow
- **Main Branch**: `main` (production-ready)
- **Hugo Deployment**: Cloudflare Pages (auto-deploy on push)
- **Worker Deployment**: Manual via `npx wrangler deploy`

### 5.2 Version Tags
| Tag | Description |
|-----|-------------|
| `v3.0.0` | Current stable (Imperial Gold, Lightbox, Contact Form) |

### 5.3 Tagging a New Release
```bash
git tag -a v3.x.x -m "Release notes..."
git push origin v3.x.x
```

---

## VI. File Quick Reference

| File | Purpose |
|------|---------|
| `hugo.toml` | Site config, params, menus |
| `layouts/_default/baseof.html` | Base template |
| `layouts/_default/contact.html` | Contact form page |
| `layouts/partials/head.html` | `<head>` content |
| `layouts/partials/header.html` | Site header/nav |
| `layouts/partials/footer.html` | Site footer |
| `assets/js/lightbox.js` | Lightbox module |
| `assets/js/contact-form.js` | Form handler |
| `assets/css/main.css` | Tailwind entry |
| `workers/contact-handler/` | Cloudflare Worker |
| `i18n/*.toml` | Translations |
| `content/work/*/index.md` | Work posts (EN) |
| `content/work/*/index.zh.md` | Work posts (ZH) |

---

## VII. Hugo Shortcodes

### 7.1 Lightbox Shortcode (`layouts/shortcodes/lightbox.html`)
```html
{{< lightbox src="URL" title="Alt Text" >}}
```
- **src**: Image URL (required)
- **title**: Alt text / caption (required)

### 7.2 Usage in Work Posts
```markdown
<div class="image-grid">
{{< lightbox src="https://photo.viiyd.com/xxx_01.jpg" title="Front View" >}}
{{< lightbox src="https://photo.viiyd.com/xxx_02.jpg" title="Detail" >}}
</div>
```

---

## VIII. Hugo Configuration (`hugo.toml`)

### 8.1 Key Params
```toml
[params]
  turnstileSiteKey = "0x4AAAAAACNE6SxZEmTQJClP"  # Cloudflare Turnstile
```

### 8.2 Language Structure
- `defaultContentLanguage = 'en'`
- English: `languages.en` with menu under `[[languages.en.menu.main]]`
- Chinese: `languages.zh` with menu under `[[languages.zh.menu.main]]`

---

## IX. Tailwind CSS Configuration

### 9.1 Entry Point
`assets/css/main.css` - Uses Tailwind v4 `@import` syntax

### 9.2 Custom Colors (defined in CSS)
```css
@theme {
  --color-gold-500: #D4AF37;
  --color-gold-400: #E5C158;
  /* Additional tokens defined here */
}
```

### 9.3 Build Process
Hugo Pipes handles Tailwind compilation. No separate `tailwind.config.js` needed in v4.

---

## X. Header Layout Logic

### 10.1 30/40/30 Grid Structure (`layouts/partials/header.html`)
```
┌──────────┬────────────────────┬──────────┐
│  LOGO    │      NAV LINKS     │  LANG SW │
│  (30%)   │       (40%)        │   (30%)  │
└──────────┴────────────────────┴──────────┘
```

- **Left (30%)**: Logo, always visible
- **Center (40%)**: Nav links, `justify-center`, hidden on mobile
- **Right (30%)**: Language switcher, `justify-end`
- **Mobile**: Hamburger menu replaces center nav

---

## XI. User Preferences (Documented Decisions)

| Decision | Choice | Date | Reason |
|----------|--------|------|--------|
| Notification Method | Telegram Bot | 2026-01-17 | User prefers instant mobile push over email |
| Anti-Spam | Turnstile | 2026-01-17 | Seamless UX, no user interaction required |
| Form Fields | Name, Contact, Type, Images, Description | 2026-01-17 | User-defined minimal set |
| Bottom CTA in Work Posts | REMOVED | 2026-01-17 | User requested removal for cleaner design |
| Header Title on Contact Page | REMOVED | 2026-01-17 | User preferred form-only view |

---

## XII. Known Issues & Constraints

1. **Turnstile on Localhost**: Shows "Invalid Domain" - expected, works in production.
2. **R2 Public Access**: Bucket `viiyd-contact-images` must have public access enabled for Telegram to fetch images. Configure via Cloudflare Dashboard → R2 → Bucket Settings → Public Access.
3. **Tailwind v4**: Uses new `@import` syntax, not `@tailwind` directives.
4. **Worker CORS**: Only allows requests from `https://viiyd.com`. Update `ALLOWED_ORIGIN` in `wrangler.toml` if domain changes.

---

## XIII. Agent Handoff Checklist

When handing off to a new agent, ensure:

- [ ] Agent has read this document in full.
- [ ] Agent can locate and parse `hugo.toml`.
- [ ] Agent understands the Lightbox DOM structure and responsive classes.
- [ ] Agent knows the Worker URL (`https://viiyd-contact-handler.yoyoset.workers.dev`) and redeployment process.
- [ ] Agent understands i18n TOML structure: `[key] other = "val"`.
- [ ] Agent is aware of user preferences (Section XI).
- [ ] Agent knows R2 bucket requires public access for Telegram images.
- [ ] Agent can locate and modify the Lightbox shortcode if needed.

---

## XIV. Document Maintenance

- **Update Trigger**: Any structural change to Lightbox, Contact Form, or Header.
- **Version Bump**: When tagging a new Git release, update Section V.2.
- **Review Frequency**: After each major feature addition.

---

**End of Handoff Protocol**
