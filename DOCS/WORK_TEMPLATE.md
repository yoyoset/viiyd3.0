# VIIYD Work Post Template (v4.0)

> **Purpose**: Machine-readable template for automated content publishing.
> **Target Consumer**: AI Agent performing content generation.
> **Last Updated**: 2026-09-03（4.0 改版：新增 system / delivered / eiu 等字段）

---

## I. Frontmatter Schema

```yaml
---
title: "[Project Name]: [Brief Subtitle]"
date: YYYY-MM-DDTHH:MM:SS+08:00
summary: "[One-line punchy summary for list page. Max 100 chars.]"
tags: ["[Category]", "[Faction]", "[Unit Type]", "委托"]  # Chinese posts add "委托"
cover: "https://photo.viiyd.com/[PHOTO_PREFIX]_01.jpg"
layout: "project"
photos: [N]  # REQUIRED. Number of gallery images (_01.._NN). Drives the plates grid + click-to-enlarge lightbox. Omit it and the lightbox WILL NOT work.
tier: "[Tier]"  # ENUM: Battleline | Specialist | Spec Ops | Master | Legend
system: "[System]"  # 4.0 必填。ENUM: 40k | old-world | aos | kill-team | joytoy | other
                    # 驱动作品页的「游戏类型」筛选与 /system/<值>/ 分类落地页。
                    # 漏写 = 这一单不会出现在任何分类页里。
delivered: "YYYY.MM"  # 4.0 必填。交付月，作品列表按此倒序。可与 date 的年月一致。
eiu: [N]  # 4.0 选填。该单 EIU 总量。定价系数拍板前（占位表 P1-P4）可以留空，
          # 留空时详情页与卡片不显示 EIU 行，不会报错。
models: "[构成描述]"  # 4.0 选填。一行，如「英雄 1 · 旗手 1」。
extras: ["[加购项]"]  # 4.0 选填。如 ["定制地台"]。可省略。
time_log: "[X]h [X]m"  # Format: "XXh XXm" (e.g., "45h 30m")
model_count: [N]  # Integer. Number of models. Defaults to 1.
paints:
  # STANDARD: Full Palette Required.
  # MUST cover: 1. Main Armor (Base/Shade/Light) 2. Cloth/Undersuit 3. Metallics 4. Leather/Details
  - name: "[Paint Name]"
    role: "[ROLE]"  # ENUM: BASE | LAYER | SHADE | HIGHLIGHT | METALLIC | CONTRAST | DETAIL
    hex: "#[XXXXXX]"  # 6-digit hex
    link: "[URL to product page]"
description: "[Longer narrative description for SEO/social. 150-200 chars.]"
---
```

### Field Validation Rules

| Field | Required | Validation |
|-------|----------|------------|
| title | ✅ | Non-empty string |
| date | ✅ | ISO 8601 **带时区**。写 `YYYY-MM-DD`（无时区）按 UTC 零点算，东八区凌晨会落在未来 → **Hugo 静默不生成该页**（`hugo list` 能看到，`public/` 里没有文件）|
| system | ✅ | 六个枚举值之一。审计脚本会挡住非法值 |
| delivered | ✅ | `YYYY.MM`。与 `index.zh.md` **必须写同一个值**（事实性字段，审计会比对双语一致性）|
| eiu | ⬜ | 整数。留空即不显示 |
| cover | ✅ | Must be `https://photo.viiyd.com/` URL |
| layout | ✅ | Must be `"project"` |
| photos | ✅ | Integer = number of `_01.._NN` gallery images. Required for the click-to-enlarge lightbox. Must match the `{{< lightbox >}}` count in the body. |
| tier | ✅ | One of: Battleline, Specialist, Spec Ops, Master, Legend |
| time_log | ✅ | Regex: `^\d+h \d+m$` |
| paints | ✅ | MUST be comprehensive: Armor, Cloth, Metal, Leather. Min 5-6 items. |
| tags | ✅ | Array with at least 1 item |
| model_count | ❌ | Integer, defaults to 1 |
| summary | ✅ | Non-empty string |
| description | ✅ | Non-empty string |

---

## II. Image Naming Convention

**Photo Prefix Pattern**: `viiyd[YYYYMMDD][PROJECT_CODE]`

Example: `viiyd20251104phot` → Photos from 2025-11-04, project code "phot"

**Image Sequence**: `[PREFIX]_01.jpg`, `[PREFIX]_02.jpg`, ...

---

## III. Body Structure (Markdown)

### 3.1 Image Gallery
```html
<div class="image-grid">
{{< lightbox src="https://photo.viiyd.com/[PREFIX]_01.jpg" title="[Alt Text EN]" >}}
{{< lightbox src="https://photo.viiyd.com/[PREFIX]_02.jpg" title="[Alt Text EN]" >}}
<!-- Add more images as needed -->
</div>
```

> ⚠️ **Lightbox requirement:** the live gallery + click-to-enlarge is rendered by the
> `photos: N` frontmatter (the plates grid in `layouts/work/single.html`), **not** by these
> shortcodes — when `photos:` is set, the body `.Content` is not rendered at all. Always set
> `photos:` to the number of images. Run `node scripts/audit_content.js` to catch a missing
> `photos:` (it fails with a `MissingPhotos` error).

### 3.2 Content Wrapper
```html
<div class="space-y-4 my-4">
<!-- All content cards go inside this wrapper -->
</div>
```

### 3.3 Hook Block (Required)
```html
<div class="bg-gradient-to-r from-neutral-800 to-transparent border-l-4 border-gold-500 p-6 rounded-r-lg">
    <h3 class="text-xl font-bold text-white mb-2">🔥 [Use Case Title]: [Category]</h3>
    <p class="text-gray-300 leading-relaxed">
        [Engaging copy describing the intent, not just colors. 2-3 sentences.]
    </p>
</div>
```

### 3.4 Technical Cards (Required)

#### Card 1: The Alchemy (Paint Recipes)
```html
<div class="grid md:grid-cols-2 gap-4">

<div class="bg-neutral-800/30 p-5 rounded border border-emerald-500/20 hover:border-emerald-500/40 transition-colors group">
    <div class="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
        <h4 class="font-bold text-emerald-400 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            [i18n: alchemy]
        </h4>
        <span class="text-[10px] uppercase text-gray-500">[i18n: color_data]</span>
    </div>
    <ul class="space-y-3 text-sm text-gray-300">
        <li class="flex justify-between">
            <span>[Emoji] [Area Name]</span>
            <span class="font-mono text-emerald-200">[Paint Name]</span>
        </li>
        <!-- Add more rows as needed -->
    </ul>
</div>
```

#### Card 2: Tactical Protocol (Techniques)
```html
<div class="bg-neutral-800/30 p-5 rounded border border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
    <div class="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
        <h4 class="font-bold text-cyan-400 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
            [i18n: protocol]
        </h4>
        <span class="text-[10px] uppercase text-gray-500">[i18n: methodology]</span>
    </div>
    <p class="text-sm text-gray-400 mb-2">[i18n: techniques_intro]:</p>
    <ul class="space-y-2 text-sm text-gray-300 list-disc list-inside marker:text-cyan-500">
        <li><strong>[Technique Name]:</strong> [Brief explanation]</li>
        <!-- Add more techniques as needed -->
    </ul>
</div>

</div>
```

### 3.5 Closing Wrapper
```html
</div>
```

---

## IV. REMOVED Components (v3.0)

> ⚠️ **DO NOT INCLUDE**: These blocks were removed in v3.0

- ❌ **Bottom CTA Block** ("Ready to Deploy?" / "准备好部署了吗?")
- ❌ **Stats Bar** (auto-generated by template, not embedded in content)

---

## V. Localization (Bilingual Posts)

Each Work post requires TWO files:
- `content/work/[slug]/index.md` (English)
- `content/work/[slug]/index.zh.md` (Chinese)

### Translation Fields

| Field | EN Example | ZH Example |
|-------|------------|------------|
| title | "Pink Horrors: The Laughing Horde" | "粉色惧妖：奸奇的笑声" |
| summary | "Warp-spawned creatures..." | "诞生于亚空间能量的扭曲生物..." |
| description | "Multi-layer glazing..." | "多层半透明罩染和亚空间发光效果..." |
| Hook h3 | "🔥 Use Case: Tabletop Deploy" | "🔥 作战定位: 战场部署" |
| Alchemy title | "The Alchemy" | "调色配方" |
| Protocol title | "Tactical Protocol" | "战术规程" |

### i18n Keys (from `i18n/*.toml`)
- `alchemy`, `protocol`, `color_data`, `methodology`

---

## VI. Complete Example (English)

```markdown
---
title: "Pink Horrors: The Laughing Horde"
date: 2025-10-31T00:00:00+08:00
summary: "Warp-spawned creatures with ethereal glow effects."
tags: ["Warhammer", "Tzeentch", "Chaos Daemons", "Commission"]
cover: "https://photo.viiyd.com/viiyd20251104phot_01.jpg"
layout: "project"
tier: "Spec Ops"
time_log: "20h 00m"
model_count: 10
paints:
  - name: "Screamer Pink"
    role: "BASE"
    hex: "#CF1F7A"
    link: "https://www.warhammer.com/..."
  - name: "Carroburg Crimson"
    role: "SHADE"
    hex: "#4D112C"
    link: "https://www.warhammer.com/..."
  - name: "Pink Horror"
    role: "LAYER"
    hex: "#DE3677"
    link: "https://www.warhammer.com/..."
  - name: "Retributor Armour"
    role: "METALLIC"
    hex: "#DAA520"
    link: "https://www.warhammer.com/..."
  - name: "Reikland Fleshshade"
    role: "SHADE"
    hex: "#4B2E2A"
    link: "https://www.warhammer.com/..."
  - name: "Abaddon Black"
    role: "BASE"
    hex: "#000000"
    link: "https://www.warhammer.com/..."
description: "Multi-layer glazing and ethereal glow effects to capture the essence of Tzeentch."
---

<div class="image-grid">
{{< lightbox src="https://photo.viiyd.com/viiyd20251104phot_01.jpg" title="Pink Horrors Front View" >}}
{{< lightbox src="https://photo.viiyd.com/viiyd20251104phot_02.jpg" title="Skin Texture Detail" >}}
</div>

<div class="space-y-4 my-4">

<div class="bg-gradient-to-r from-neutral-800 to-transparent border-l-4 border-gold-500 p-6 rounded-r-lg">
    <h3 class="text-xl font-bold text-white mb-2">🔥 Use Case: Tabletop Deploy</h3>
    <p class="text-gray-300 leading-relaxed">
        Optimized for durability and visual clarity at gaming distance. Color scheme designed for instant recognition.
    </p>
</div>

<div class="grid md:grid-cols-2 gap-4">

<div class="bg-neutral-800/30 p-5 rounded border border-emerald-500/20 hover:border-emerald-500/40 transition-colors group">
    <div class="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
        <h4 class="font-bold text-emerald-400 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            The Alchemy
        </h4>
        <span class="text-[10px] uppercase text-gray-500">Color Data</span>
    </div>
    <ul class="space-y-3 text-sm text-gray-300">
        <li class="flex justify-between">
            <span>😈 Horror Skin</span>
            <span class="font-mono text-emerald-200">Screamer Pink</span>
        </li>
        <li class="flex justify-between">
            <span>🔥 Warpflame</span>
            <span class="font-mono text-yellow-200/80">Corax White</span>
        </li>
    </ul>
</div>

<div class="bg-neutral-800/30 p-5 rounded border border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
    <div class="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
        <h4 class="font-bold text-cyan-400 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
            Tactical Protocol
        </h4>
        <span class="text-[10px] uppercase text-gray-500">Methodology</span>
    </div>
    <p class="text-sm text-gray-400 mb-2">Key techniques deployed:</p>
    <ul class="space-y-2 text-sm text-gray-300 list-disc list-inside marker:text-cyan-500">
        <li><strong>Translucent Glazing:</strong> Multiple thin layers for soft warp glow.</li>
        <li><strong>OSL Accents:</strong> Blue/white highlights for ethereal atmosphere.</li>
    </ul>
</div>

</div>

</div>
```

---

## VII. Automation Integration Notes

For automated publishing pipelines:

1. **Input Data Required**:
   - Project metadata (title, tier, time_log, model_count)
   - Paint list (name, role, hex, link for each)
   - Image URLs (ordered sequence)
   - Copy text (summary, description, hook, techniques)

2. **Generation Steps**:
   1. Validate all required fields against schema (Section I)
   2. Generate frontmatter YAML
   3. Build image gallery shortcodes
   4. Assemble Hook block with localized text
   5. Assemble Technical Cards with paint/technique data
   6. Close wrapper divs
   7. Generate both EN and ZH versions

3. **Output Paths**:
   - `content/work/[slug]/index.md`
   - `content/work/[slug]/index.zh.md`

---

**End of Template Standard**
