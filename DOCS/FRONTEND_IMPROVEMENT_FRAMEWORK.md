# VIIYD Frontend Improvement Framework

> ⚠️ **2026-09-03 注**：本文是 3.0 时代的前端改进框架，已被 4.0 改版整体取代。保留作历史参考。


> Purpose: Make the current Claude redesign work as a commercial acquisition system, while preserving the dossier/archive design language.

## 1. North Star

VIIYD should feel like a premium hand-painted miniature studio with a private archive, not a generic gallery or gaming service shop.

Commercial north star:

> Use high-end work dossiers to attract qualified clients, use clear service pages to filter budget and fit, use process pages to remove risk, and use the quote flow to capture commission-ready leads.

The frontend must do four jobs:

1. Prove the work is excellent.
2. Explain what kind of commissions fit.
3. Reduce trust and shipping risk.
4. Convert qualified visitors into quote requests.

## 2. Commercial Strategy

### Target Client Priority

Do not serve every visitor equally. The site should be biased toward high-quality, high-fit commissions.

| Priority | Client Type | Commercial Value | Site Treatment |
| --- | --- | --- | --- |
| 1 | Display characters / centerpiece clients | High ticket, best match for dossier language | Lead with these in hero, Services, and examples |
| 2 | Kill Team / elite squad clients | Strong ticket, repeatable, portfolio-friendly | Make this the main scalable service path |
| 3 | JoyToy / figure repaint clients | Differentiated, social-friendly | Use as a distinctive specialty, not the whole brand |
| 4 | Repair / repaint clients | Trust-building, useful entry offer | Offer as selective service; avoid making it the lead |
| 5 | Full army / bulk tabletop clients | Can create revenue but risks low-margin workload | Accept selectively; do not make it the primary positioning |

### Positioning Rules

- The homepage should signal "selective premium commission" within 8 seconds.
- The archive should prove capability across project types.
- Services should filter for fit, not maximize inquiry volume.
- Process should reduce friction before private chat.
- Quote should collect enough context to avoid long back-and-forth.

### Pricing Philosophy

Prices should qualify clients, not imitate a commodity rate card.

Avoid leading with the cheapest per-model number. A low anchor like `¥120 / model` can make the studio feel like a batch-painting shop.

Use price language like:

- "Most character commissions start from ¥600."
- "Kill Team and squad projects are quoted as a set after reference review."
- "Battleline work is accepted selectively for cohesive units and small forces."
- "Legend projects are quoted after scope review and queue confirmation."

Recommended expression:

| Tier | Pricing Style | Why |
| --- | --- | --- |
| Battleline | project-based or unit-set quote | Avoid cheap per-model anchoring |
| Specialist | set quote / from price | Main commercial tier |
| Master | character from price | Clear high-value anchor |
| Legend | scope review only | Protects time and premium perception |

### Lead Quality Rules

The quote flow should help filter:

- budget fit;
- project type;
- deadline risk;
- model condition;
- shipping location;
- desired quality tier.

High inquiry volume is not the goal. Qualified, respectful, adequately budgeted inquiries are the goal.

## 3. Funnel Structure

```text
Discovery
  ↓
Home / High-Intent Landing Pages
  ↓
Work Archive / Featured Dossiers
  ↓
Services + Process
  ↓
Commission Modal / Quote Page
  ↓
Private Follow-up
```

### Discovery Sources

- Search: Warhammer painting commission, Kill Team painting, JoyToy repaint, 战锤涂装委托, 成都战锤涂装.
- Social: Instagram, 小红书, WeChat sharing, Reddit/Discord case posts.
- Referral: clients sharing their dossier pages.

### Conversion Principle

Every page should offer exactly one primary commercial action:

`Start a commission` / `发起委托`

Secondary actions can exist, but must not compete with the primary action.

Secondary actions can exist, but must not compete with the primary action.

Primary CTA hierarchy:

1. `Start a commission` for qualified commercial pages.
2. `View the archive` for proof-first moments.
3. `Read the process` when risk reduction is the next best step.

## 4. Page Roles

### Home

Role: storefront and routing hub.

Primary question answered:

> Is this the right studio for the kind of miniature I want painted?

Required sections:

1. Hero with strongest current work or latest representative work.
2. Direct positioning: what is painted, for whom, and current queue status.
3. Two primary actions: `View the archive`, `Start a commission`.
4. Featured work grouped by commercial intent: hero, Kill Team, centerpiece, JoyToy/repaint.
5. Commission status: open slots, typical reply time, limited queue.
6. Short trust strip: Chengdu, hand-painted, bilingual contact, documented process.

First-screen message:

> This is not cheap batch painting. This is selective miniature commission work documented piece by piece.

Design ratio:

- 60% art/proof.
- 40% commercial clarity.

Primary metric:

- Commission CTA opens from home.

Secondary metrics:

- archive clicks;
- services clicks;
- language switch use.

### Work Archive

Role: proof library and browsing engine.

Primary question answered:

> Has this studio painted something like what I want?

Improvements:

- Keep archive table as the core component.
- Add filters by buyer intent:
  - Want a hero painted?
  - Planning a Kill Team?
  - Need a centerpiece?
  - Repainting a JoyToy / figure?
  - Repairing a failed paint job?
  - Building a small force?
- Preserve faction filters, but make buyer-intent filters more prominent.
- Add a compact commission CTA after the first screen and at page end.

Design ratio:

- 75% browsing/proof.
- 25% conversion.

Primary metric:

- dossier clicks by buyer-intent filter.

Secondary metrics:

- filter use;
- CTA opens from archive;
- scroll depth.

### Work Dossier

Role: proof, delivery artifact, share asset, and conversion hook.

Primary question answered:

> Can I trust this painter with detail, process, and presentation?

Keep:

- cinematic hero;
- specimen card;
- painter notes;
- plates gallery;
- paint manifest;
- certificate;
- loop-back CTA.

Improvements:

- Add a small "Commission something like this" data block:
  - suitable tier;
  - likely budget style, not exact price unless reliable;
  - typical timeline;
  - related service type;
  - CTA.
- Add related dossiers by project type, not only chronology.
- Make share copy less platform-specific and more client-forward.

Design ratio:

- 80% art/proof.
- 20% conversion.

Primary metric:

- commission CTA opens from dossiers.

Secondary metrics:

- lightbox zooms;
- share copy usage;
- related dossier clicks.

### Services / Rates

Role: commercial clarity and qualification.

Primary question answered:

> What should I buy, what does it cost, and what level fits my model?

This is the highest-priority redesign target.

Recommended structure:

1. Page masthead: "Commission Standards" / "委托档次".
2. A short buyer-facing explanation: "Choose by model type and desired finish, not by paint count."
3. Tier comparison as document rows, not rounded pricing cards.
3. Each tier includes:
   - name;
   - best for;
   - starts from;
   - typical timeline;
   - what is included;
   - not a fit for;
   - representative dossier image/link.
4. Add-ons:
   - assembly/prep;
   - magnetization;
   - basing;
   - repair/repaint;
   - 3D print handling if still offered.
5. Clear quote CTA.

Recommended tier model:

| Tier | Role | Use |
| --- | --- | --- |
| Battleline | Table-ready work | units, rank-and-file, simple squads |
| Specialist | Main commercial tier | Kill Teams, elite units, detailed squads |
| Master | Display work | characters, centerpieces, advanced effects |
| Legend | Rare top tier | large centerpiece, diorama, high-risk custom |

Commercial notes:

- `Specialist` and `Master` should feel like the main business.
- `Battleline` should be useful but not brand-defining.
- `Legend` should create aspiration and protect premium perception.
- Every tier should show a real dossier example, because proof sells better than adjectives.

Design ratio:

- 40% art/proof.
- 60% information.

Primary metric:

- quote CTA opens from Services.

Secondary metrics:

- tier row engagement;
- dossier example clicks;
- drop-off before quote.

### Process

Role: risk reduction.

Primary question answered:

> What happens after I contact the studio, and is my model safe?

Recommended structure:

1. Send references and model list.
2. Quote and queue slot.
3. Deposit.
4. Prep / assembly / priming.
5. Midpoint progress check.
6. Final polish and approval photos.
7. Final payment.
8. Packaging and tracked shipping.
9. Aftercare / repair policy.

Content must answer:

- how revisions work;
- what happens if the parcel is damaged;
- whether international shipping is supported;
- what is rejected;
- how urgent deadlines are handled.

Commercial function:

This page should reduce private-message explanation time. If a client reads it before contacting, the conversation should start closer to "here is my model list and deadline" and farther from "how does this work?"

Design ratio:

- 30% art.
- 70% trust information.

Primary metric:

- quote CTA opens after process sections.

Secondary metrics:

- FAQ/detail expansion;
- process page visits before quote submission.

### Painter

Role: personal trust.

Primary question answered:

> Who is painting my model?

Keep the current intimate desk/studio tone.

Improvements:

- Strengthen "I like to paint" and "I do not take" lists.
- Add more real studio/desk/process photography where available.
- Link directly to representative dossiers for each preferred project type.

Design ratio:

- 70% personal trust.
- 30% conversion.

### Contact / Quote

Role: lead capture.

Primary question answered:

> What do I need to send to get a useful quote?

Direction:

- The commission modal is the standard interaction.
- The contact page should either reuse the modal structure or become a dedicated quote page.
- Avoid maintaining two separate lead forms with different fields and visual language.

Required fields:

- name;
- preferred contact;
- project type;
- desired tier or "not sure";
- budget range;
- deadline;
- country/city for shipping;
- model status: unassembled / assembled / painted / damaged;
- notes;
- reference photos.

Optional future additions:

- number of models;
- model owner already has kit vs needs sourcing;
- permission to feature finished dossier publicly.

Design ratio:

- 20% art.
- 80% form efficiency.

Primary metric:

- successful quote submissions.

Secondary metrics:

- form starts;
- form abandonment;
- file upload usage;
- percentage of leads with budget range filled.

## 5. SEO / Landing Page Structure

Do not put evergreen acquisition articles inside `work`.

SEO comes after Services, Process, and Quote are commercially solid. Traffic should not be scaled before the conversion path is clear.

Create a future `guides` or `services` landing structure:

```text
/services/warhammer-painting-commission/
/services/kill-team-painting-commission/
/services/joytoy-repaint/
/services/miniature-repair-repaint/
/guides/how-to-choose-miniature-painting-tier/
/guides/how-to-ship-miniatures-for-commission/
```

Each landing page should contain:

1. Specific search-intent headline.
2. Short buyer explanation.
3. Relevant dossier examples.
4. Recommended tier.
5. Process/risk answer.
6. Quote CTA.

Landing page priority:

1. Warhammer painting commission.
2. Kill Team painting commission.
3. JoyToy repaint.
4. Miniature repair/repaint.
5. Shipping / choosing tier guides.

## 6. Navigation Framework

Primary nav should support the commercial path:

- Work
- Services
- Process
- Painter
- Start a commission

Guidance:

- `Start a commission` should be visually distinct but still quiet.
- `Contact` can exist in footer or as a secondary route if quote becomes primary.
- Avoid nav labels that are too poetic for new buyers.

## 7. Component Migration Targets

Build or standardize these components before redesigning too many pages:

1. `studio-page-header`
   - small wordmark;
   - page title;
   - eyebrow;
   - language switcher when needed.

2. `commission-cta-strip`
   - dark panel;
   - slot status;
   - reply time;
   - CTA button.

3. `tier-row`
   - tier metadata;
   - fit / not fit;
   - starts from;
   - representative image.

4. `trust-protocol-step`
   - phase number;
   - title;
   - plain-language explanation.

5. `related-dossier-card`
   - image;
   - title;
   - tier;
   - project type.

Do not introduce a full component library. Keep Hugo partials small and close to existing patterns.

## 8. Implementation Order

### Phase 1: Commercial Clarity

- Done: document current design system.
- Done: mark old cyber/bento language as deprecated.
- Next: redesign Services/Rates in current dossier language with buyer fit, price framing, and real examples.

### Phase 2: Quote Qualification

- Unify Contact page and commission modal behavior.
- Add budget range, model status, shipping location, and project scope.
- Preserve the current calm modal language.

### Phase 3: Trust and Risk Reduction

- Redesign Process as commission protocol / risk-reduction page.
- Add consistent CTA strips to commercial pages.
- Make revision, deposit, shipping, damage, deadline, and rejection policies easy to find.

### Phase 4: Home Conversion Pass

- Strengthen first-screen positioning.
- Add commission status and a direct quote path.
- Keep the current art/archive feel.

### Phase 5: Archive as Acquisition Engine

- Add buyer-intent filters to Work archive.
- Add "commission something like this" blocks to dossiers.
- Add related dossiers by project type.

### Phase 6: SEO Landing Pages

- Move guide-like content out of `work`.
- Add service landing pages for high-intent keywords.
- Link each landing page to examples and quote flow.

## 9. Measurement Framework

Track the funnel by intent, not vanity traffic.

Core events:

- `cta_commission_open`
- `quote_form_start`
- `quote_form_submit`
- `quote_form_error`
- `wechat_click`
- `email_click`
- `instagram_click`
- `archive_filter_use`
- `dossier_lightbox_zoom`
- `dossier_share_copy`
- `services_tier_click`

Core questions:

- Which page opens the most quote flows?
- Which project type produces the best leads?
- Which tier gets interest but no submissions?
- Which language version converts better?
- Are users opening quote before or after reading Process?

Lead quality fields to review manually:

- budget range;
- project type;
- deadline;
- model condition;
- location;
- reference photo quality.

## 10. Quality Gates

Before a frontend page is considered done:

- It follows `DOCS/DESIGN_SYSTEM.md`.
- It has one clear primary CTA.
- It answers its assigned buyer question.
- It serves the target client priority instead of treating every commission type equally.
- It avoids low-price anchoring unless the page intentionally qualifies budget-sensitive work.
- All `photo.viiyd.com` images use `optimized-image.html`.
- Mobile layout has no overlapping text or unstable image grids.
- `npm.cmd run build` passes.
- For template changes, inspect generated `public/` output for image URLs, lightbox triggers, and `ZgotmplZ`.
