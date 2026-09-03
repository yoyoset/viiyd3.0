# VIIYD 3.0 Frontend Design System（已退役）

> ## ⚠️ 这份文档描述的是 3.0，**不要照它建 UI**
>
> 2026-09-03 起站点已是 4.0（墨屏暗底 + 天水碧/朱砂/缃色，Noto Serif SC）。
> 本文提到的 `assets/css/main.css` 与 `layouts/painter/list.html` **都已删除**。
>
> **4.0 的设计系统看这三处：**
> - `assets/css/tokens.css` —— 令牌唯一来源（六色锁定、13 级字阶、限宽）
> - `CLAUDE.md` 的「前端约定（4.0）」一节 —— 红线与不可破坏的契约
> - `DOCS/REDESIGN_4.0_PLAN.md` —— 每个决定的依据，含六处偏离设计稿的理由
>
> 本文保留仅为历史参考（比如想知道 3.0 为什么那样做）。

> Status: **DEPRECATED（2026-09-03）**  
> Source: 3.0 时代的 `assets/css/main.css`（已删除）  
> Business role: A premium miniature-painting commission site, not a game UI, SaaS dashboard, or generic portfolio.

## 1. Brand Position

VIIYD is a small hand-painted miniature studio in Chengdu. The frontend should feel like a private art archive attached to a working painter's desk: collectible, restrained, tactile, and commercially trustworthy.

The site sells confidence before it sells price. It should make a visitor believe:

- the work is handmade and carefully documented;
- each commission is limited, personal, and not mass-produced;
- the painter has taste, process, and discipline;
- sending a model or requesting a quote feels low-risk.

## 2. Design Language

Use the current dossier/archive language as the standard:

- editorial art archive;
- warm paper and dark ink;
- wax seal / certificate cues;
- technical metadata used sparingly;
- large photographic evidence;
- quiet premium typography;
- limited yellow-gold accent;
- flat, sharp, document-like surfaces.

Do not revive the old cyber / PMC / neon / game-card direction.

Avoid:

- cyberpunk panels, glows, hologram effects, sci-fi HUD framing;
- rounded `2xl` card-heavy layouts;
- decorative gradient blobs or colored glassmorphism;
- emoji as UI anchors;
- marketing SaaS hero patterns;
- generic bento dashboards;
- overly masculine tactical copy when a quieter studio tone would convert better.

## 3. Core Tokens

The canonical tokens live in `assets/css/main.css`.

### Color

Primary palette:

| Token | Hex | Use |
| --- | --- | --- |
| `--bg` | `#fafaf6` / dark `#0e0c08` | Page background |
| `--paper` | `#f3f0e6` / dark `#1a1714` | Soft document panels |
| `--panel` | `#0c0c0a` / dark `#1f1b16` | High-contrast bands and CTAs |
| `--panel-text` | `#fafaf6` / dark `#f1ece0` | Text on dark panels |
| `--ink` | `#0c0c0a` / dark `#f1ece0` | Primary text and hard rules |
| `--ink-soft` | `#6e6c66` / dark `#8c8579` | Metadata, captions, secondary text |
| `--line` | `#1a1a18` / dark `#3a342a` | Strong separators |
| `--line-soft` | `#d6d4cc` / dark `#241f18` | Hairlines and quiet borders |
| `--yellow` | `#f5c64a` | Signature gold accent |
| `--yellow-dark` | `#c89518` | Gold border / darker emphasis |
| `--yellow-light` | `#ffe27a` | Hover and highlight |
| `--hero-dark` | `#070504` / dark `#050403` | Cinematic photo hero backing |

Rules:

- Gold is a signal, not a background theme. Use it for CTAs, seals, highlight text, and selected states.
- Most pages should be neutral, paper, ink, and photography-led.
- Prefer borders and rules over shadows.
- Do not create new hue families unless the content genuinely needs it.

### Typography

Canonical font tokens:

| Token | Font | Use |
| --- | --- | --- |
| `--font-serif` | Instrument Serif | Hero titles, dossier titles, quotes, certificate statements |
| `--font-sans` | Geist | Readable UI copy, card titles, body passages that need warmth |
| `--font-mono` | Geist Mono | Metadata, labels, nav, small operational text |

Rules:

- Serif creates the studio/art-object feeling. Use it for emotional or collectible moments.
- Sans is for clarity and commerce.
- Mono is for archive metadata, not for all body text.
- Keep letter spacing at `0` for normal prose. Use tracking only for labels, nav, and metadata.
- Do not scale text with viewport width directly. Use `clamp()` only for hero-scale display type where already established.

## 4. Layout Principles

### Page Rhythm

Use full-width bands and archive sections, not floating card stacks.

Standard spacing:

- Page horizontal padding: `--page-pad`.
- Dossier horizontal padding: `--dossier-pad`.
- Desktop section gaps: usually `32px` to `72px`.
- Image grid gaps: `12px` desktop, `8px` mobile.
- Mobile page padding becomes compact, currently `10px`.

### Surfaces

Approved surface types:

- full-bleed photo hero;
- document band with top/bottom hairlines;
- dark commission strip;
- archive table row;
- specimen card;
- certificate panel;
- lightbox overlay;
- modal form.

Avoid generic nested cards. Cards are allowed only when they represent an individual repeated item, a framed form, or a modal.

### Border Radius

The current visual language is mostly square and printed. Default to `0`.

Allowed:

- tiny radius only when browser-native controls or legacy assets require it;
- circular seal/badge/avatar only when the object itself is round.

Avoid:

- `rounded-xl`;
- `rounded-2xl`;
- pill-heavy interfaces unless the element is a true filter chip or small status label.

## 5. Component Standards

### Buttons

Base class: `.btn`.

Approved variants:

- `.btn-yellow`: primary commission CTA.
- `.btn-outline`: secondary page/action link.
- `.btn-ghost`: over-photo hero CTA only.

Rules:

- Buttons use mono, uppercase, small type.
- Use bracketed CTA copy only where already part of the dossier/archive voice.
- Primary action should usually be "Start a commission", "Commission a piece", or localized equivalent.
- Avoid large rounded SaaS buttons.

### Navigation

Current home/archive pages use page-specific navs. Keep nav quiet, metadata-like, and small.

Rules:

- Nav should not dominate photography.
- Language switcher must remain visible but secondary.
- On commercial pages, always preserve a clear route to Work and Commission/Contact.

### Photography

Photography is the product proof.

Rules:

- All `photo.viiyd.com` images in templates must go through `layouts/partials/optimized-image.html`.
- Work pages with `optimized: true` should use `_web` versions for browsing and original only for zoom.
- Use strong aspect ratios intentionally: `16/9`, `4/5`, `3/4`, `4/3`, `1/1`.
- Do not use dark abstract stock-like backgrounds when a real painted model image can carry the section.

### Archive Rows

The archive table is a core brand component.

Rules:

- Rows should feel like a catalog, not product cards.
- Keep thumbnail, subject, faction, scale, tier, hours, date, photo count.
- Filters should remain compact chips.
- Mobile may collapse metadata, but subject and image must remain prominent.

### Dossier Page

The work detail page is the highest-value conversion asset.

Required structure:

1. Cinematic hero.
2. Specimen card.
3. Painter notes when available.
4. 360 media when available.
5. Plates gallery.
6. Paint manifest when available.
7. Certificate.
8. Loop-back commission CTA.

Rules:

- Preserve `.lightbox-trigger`, `data-web-src`, and `data-full-res`.
- Do not render `.Content` when `photos > 0`.
- Preserve high-res image loading only on zoom.

### Commission Modal

The modal is the primary lead-capture pattern.

Rules:

- Keep it editorial and calm, not aggressive.
- Required fields should remain minimal: name, contact, project, tier.
- Reference images and deadline are high-value optional fields.
- Success state should feel personal and reassuring.
- Contact page should eventually reuse this same pattern instead of competing with it.

## 6. Copy Voice

The new voice is not the old "Master & Commander" voice.

Use:

- precise;
- calm;
- handmade;
- selective;
- archival;
- confident without shouting;
- bilingual where it reduces friction.

Good language:

- "Two display slots open."
- "Send a reference picture and a deadline."
- "Painted by hand at VIIYD Studio, Chengdu."
- "This dossier is yours to keep."
- "I usually reply within 48h."

Avoid:

- "deployment protocol" as the default tone;
- "mission data" everywhere;
- excessive military metaphors;
- overclaiming competition-level quality where the piece is not positioned that way;
- cheap urgency.

## 7. Page-Type Guidance

### Home

Role: storefront and proof gateway.

Should include:

- current strongest work or latest work;
- short identity statement;
- recent/featured work;
- commission status and clear CTA.

Do not turn it into a marketing SaaS landing page.

### Work List

Role: archive, filtering, trust.

Use compact metadata and high-density browsing. The archive itself is the credibility.

### Work Detail

Role: proof, delivery artifact, share asset, conversion.

This is the design source for the rest of the site.

### Services / Rates

Role: commercial clarity.

Must be redesigned into the current language before further business changes. Use real tiers, real examples, restrained comparison, and clear fit/not-fit guidance. Do not use the old dark rounded pricing cards as the future standard.

### Process

Role: risk reduction.

Should feel like a documented studio workflow, not a game quest timeline.

### Contact / Quote

Role: lead capture.

Should converge on the commission modal language and backend contract.

### Painter

Role: personal trust.

This page is close to the current standard. Preserve its intimate desk/studio tone.

## 8. Implementation Rules

- Prefer shared classes in `assets/css/main.css` before adding inline styles.
- New templates should use existing tokens and component classes first.
- Inline styles are allowed in current Hugo templates, but new repeated patterns should graduate into CSS.
- Do not add new frontend frameworks.
- Do not add new image loading paths that bypass `optimized-image.html`.
- Keep mobile layouts explicit: stable grids, fixed aspect ratios, no overlapping type.
- Run `npm.cmd run build` before considering a frontend change complete.

## 9. Deprecations

The following older design directions are deprecated:

- Inter / JetBrains Mono as canonical fonts.
- Dark-only "Imperial Gold" UI.
- Cyber / PMC / tactical dashboard tone.
- Emoji-led cards.
- Bento as the default page architecture.
- `rounded-2xl` pricing cards and glow-heavy service panels.
- Generic Tailwind marketing sections that do not match the dossier/archive language.

When old pages still use these patterns, treat them as migration targets, not precedent.
