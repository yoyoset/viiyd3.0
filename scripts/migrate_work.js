/* ⚠️ DEPRECATED（2026-09-03，4.0 改版后停用）
 * 3.0 时代的一次性内容迁移。**在 4.0 内容上运行会破坏 front matter**（它不认识 system/delivered/eiu）。4.0 的迁移用 migrate_4_0.js。
 * 全站已无任何文档或配置引用它。保留仅为历史参考，**不要运行**。
 */
const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '../content/zh/posts');
const TARGET_BASE = path.join(__dirname, '../content/work');

console.log(`🚀 Starting Migration from ${SOURCE_DIR}`);

// Helper: Ensure directory exists
function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Helper: Extract valid frontmatter
function parseFrontMatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};

    const fm = {};
    match[1].split('\n').forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            let val = parts.slice(1).join(':').trim();
            // Remove quotes
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            // Parse array
            if (val.startsWith('[') && val.endsWith(']')) {
                val = val.slice(1, -1).split(',').map(s => s.trim().replace(/"/g, ''));
            }
            fm[key] = val;
        }
    });
    return fm;
}

// Helper: Extract images from content
function extractImages(content) {
    const regex = /{{< lightbox src="([^"]+)"(?: title="([^"]+)")?.*?>}}/g;
    const images = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        images.push({ src: match[1], title: match[2] || '' });
    }
    return images;
}

// Template Generator
function generateTemplate(isCN, title, date, summary, tags, images, oldContent = "") {
    const langSuffix = isCN ? "zh" : "en";
    const layout = "project";
    const tier = "Spec Ops"; // Default tier

    // Master Copy Placeholders (English)
    const enCopy = `
<!-- THE HOOK -->
<div class="bg-gradient-to-r from-neutral-800 to-transparent border-l-4 border-gold-500 p-6 rounded-r-lg">
<h3 class="text-xl font-bold text-white mb-2">🔥 Use Case: Battlefield Deployment</h3>
<p class="text-gray-300 leading-relaxed">
This unit has been prepared for tabletop deployment with a focus on durability and visual clarity. The color scheme is optimized for recognition at a distance while maintaining clean details for closer inspection.
</p>
</div>

<!-- VISUAL STATS BAR -->
<div class="flex flex-wrap gap-4 items-center justify-between bg-neutral-900/50 p-4 rounded border border-white/5">
<div class="flex items-center gap-3">
<span class="text-3xl">🎯</span>
<div>
<span class="block text-2xl font-black text-white">1</span>
<span class="text-[10px] text-gray-500 uppercase tracking-widest">Unit</span>
</div>
</div>
<div class="w-px h-8 bg-white/10 hidden md:block"></div>
<div class="flex items-center gap-3">
<span class="text-3xl">⏱️</span>
<div>
<span class="block text-2xl font-black text-cyan-400">20h</span>
<span class="text-[10px] text-gray-500 uppercase tracking-widest">Time Log</span>
</div>
</div>
<div class="w-px h-8 bg-white/10 hidden md:block"></div>
<div class="flex items-center gap-3">
<span class="text-3xl">💎</span>
<div>
<span class="block text-2xl font-black text-gold-400">Standard</span>
<span class="text-[10px] text-gray-500 uppercase tracking-widest">Tier</span>
</div>
</div>
</div>

<!-- TECHNICAL CARDS -->
<div class="grid md:grid-cols-2 gap-4">
<!-- Card 1: Alchemy -->
<div class="bg-neutral-800/30 p-5 rounded border border-emerald-500/20 hover:border-emerald-500/40 transition-colors group">
<h4 class="font-bold text-emerald-400 mb-2">The Alchemy</h4>
<ul class="space-y-2 text-sm text-gray-300">
<li class="flex justify-between"><span>Base</span><span class="font-mono text-emerald-200">Standard</span></li>
<li class="flex justify-between"><span>Highlight</span><span class="font-mono text-cyan-200">Layered</span></li>
</ul>
</div>
<!-- Card 2: Protocol -->
<div class="bg-neutral-800/30 p-5 rounded border border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
<h4 class="font-bold text-cyan-400 mb-2">Tactical Protocol</h4>
<p class="text-sm text-gray-400">Standard application of base coats, washes, and edge highlights.</p>
</div>
</div>

<!-- BOTTOM CTA -->
<div class="bg-gradient-to-r from-purple-900/20 via-neutral-900 to-neutral-900 p-6 rounded border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-neutral-800 transition-all cursor-pointer group" onclick="window.location='/rates'">
<div><h4 class="text-lg font-bold text-white mb-1">Ready to Deploy?</h4></div>
<button class="px-6 py-2 bg-purple-600 text-white font-bold rounded">INITIATE COMMISSION -></button>
</div>
`;

    // Master Copy Placeholders (Chinese)
    const cnCopy = `
<!-- THE HOOK -->
<div class="bg-gradient-to-r from-neutral-800 to-transparent border-l-4 border-gold-500 p-6 rounded-r-lg">
<h3 class="text-xl font-bold text-white mb-2">🔥 作战定位: 战场部署 (Tabletop Standard)</h3>
<p class="text-gray-300 leading-relaxed">
本单位专为桌面游戏设计，注重耐用性与视觉清晰度。配色方案经过优化，确保在远距离上易于识别，同时在近距离观察时保留清晰的细节。
</p>
</div>

<!-- VISUAL STATS BAR -->
<div class="flex flex-wrap gap-4 items-center justify-between bg-neutral-900/50 p-4 rounded border border-white/5">
<div class="flex items-center gap-3">
<span class="text-3xl">🎯</span>
<div>
<span class="block text-2xl font-black text-white">1</span>
<span class="text-[10px] text-gray-500 uppercase tracking-widest">单位数量</span>
</div>
</div>
<div class="w-px h-8 bg-white/10 hidden md:block"></div>
<div class="flex items-center gap-3">
<span class="text-3xl">⏱️</span>
<div>
<span class="block text-2xl font-black text-cyan-400">20h</span>
<span class="text-[10px] text-gray-500 uppercase tracking-widest">执行工时</span>
</div>
</div>
<div class="w-px h-8 bg-white/10 hidden md:block"></div>
<div class="flex items-center gap-3">
<span class="text-3xl">💎</span>
<div>
<span class="block text-2xl font-black text-gold-400">Standard</span>
<span class="text-[10px] text-gray-500 uppercase tracking-widest">质量等级</span>
</div>
</div>
</div>

<!-- TECHNICAL CARDS -->
<div class="grid md:grid-cols-2 gap-4">
<!-- Card 1: Alchemy -->
<div class="bg-neutral-800/30 p-5 rounded border border-emerald-500/20 hover:border-emerald-500/40 transition-colors group">
<h4 class="font-bold text-emerald-400 mb-2">炼金配方 (The Alchemy)</h4>
<ul class="space-y-2 text-sm text-gray-300">
<li class="flex justify-between"><span>底色</span><span class="font-mono text-emerald-200">标准</span></li>
<li class="flex justify-between"><span>高光</span><span class="font-mono text-cyan-200">层叠</span></li>
</ul>
</div>
<!-- Card 2: Protocol -->
<div class="bg-neutral-800/30 p-5 rounded border border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
<h4 class="font-bold text-cyan-400 mb-2">战术规程 (Protocol)</h4>
<p class="text-sm text-gray-400">标准的基础色、渍洗和边缘高光处理。</p>
</div>
</div>

<!-- BOTTOM CTA -->
<div class="bg-gradient-to-r from-purple-900/20 via-neutral-900 to-neutral-900 p-6 rounded border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-neutral-800 transition-all cursor-pointer group" onclick="window.location='/rates'">
<div><h4 class="text-lg font-bold text-white mb-1">准备好部署了吗？</h4></div>
<button class="px-6 py-2 bg-purple-600 text-white font-bold rounded">启动委托程序 -></button>
</div>

<!-- Original Content Integration -->
<div class="mt-8 pt-8 border-t border-white/10 opacity-70">
<h4 class="text-sm font-bold text-gray-500 mb-4 uppercase tracking-widest">/// ARCHIVE_DATA (原始内容)</h4>
<div class="prose prose-invert max-w-none text-gray-400 text-sm">
${oldContent}
</div>
</div>
`;

    // Construct Gallery (NO INDENTATION!)
    let galleryHTML = '<div class="image-grid">\n';
    images.forEach(img => {
        galleryHTML += `{{< lightbox src="${img.src}" title="${img.title}" >}}\n`;
    });
    galleryHTML += '</div>\n\n';

    // Construct Tags
    const tagsStr = Array.isArray(tags) ? `["${tags.join('", "')}"]` : '[]';

    // Return Full Markdown
    return `---
title: "${title}"
date: ${date}
summary: "${summary || (isCN ? '点击查看详细展示。' : 'Click to view detailed showcase.')}"
tags: ${tagsStr}
cover: "${images[0] ? images[0].src : ''}"
layout: "${layout}"
tier: "${tier}"
description: "${isCN ? '自动迁移内容' : 'Automated migrated content'}"
---

${galleryHTML}

<div class="space-y-4 my-4">
${isCN ? cnCopy : enCopy}
</div>
`;
}

// MAIN EXECUTION
try {
    const folders = fs.readdirSync(SOURCE_DIR).filter(f => fs.statSync(path.join(SOURCE_DIR, f)).isDirectory());
    console.log(`Found ${folders.length} projects to migrate.`);

    folders.forEach(folder => {
        const fullPath = path.join(SOURCE_DIR, folder);
        const indexFile = path.join(fullPath, 'index.md');

        if (!fs.existsSync(indexFile)) {
            console.warn(`Skipping ${folder}: index.md not found.`);
            return;
        }

        // Slug strategy: remove date prefix if present
        let slug = folder;
        if (folder.match(/^\d{4}-\d{2}-\d{2}-(.*)/)) {
            slug = folder.match(/^\d{4}-\d{2}-\d{2}-(.*)/)[1];
        }

        console.log(`Processing: ${folder} -> ${slug}`);

        const rawContent = fs.readFileSync(indexFile, 'utf-8');
        const fm = parseFrontMatter(rawContent);
        const images = extractImages(rawContent);

        // Derive titles
        const cnTitle = fm.title || slug;
        // Simple heuristic for English title: Replace hyphens with spaces and capitalize
        const enTitle = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        // Clean body content for migration (remove frontmatter and lightbox shortcodes)
        let bodyClean = rawContent.replace(/^---\n[\s\S]*?\n---/, '').trim();
        bodyClean = bodyClean.replace(/{{< lightbox .*?>}}/g, '').trim();
        bodyClean = bodyClean.replace(/<div class="image-grid">/g, '').replace(/<\/div>/g, '');

        // Generate files
        const enOutput = generateTemplate(false, enTitle, fm.date, fm.summary, fm.tags, images, "");
        const cnOutput = generateTemplate(true, cnTitle, fm.date, fm.summary, fm.tags, images, bodyClean);

        // specific target directory
        const targetDir = path.join(TARGET_BASE, slug);
        ensureDir(targetDir);

        // Write files
        fs.writeFileSync(path.join(targetDir, 'index.md'), enOutput);
        fs.writeFileSync(path.join(targetDir, 'index.zh.md'), cnOutput);

        console.log(`✅ Migrated ${slug}`);

        // Cleanup
        // fs.rmSync(fullPath, { recursive: true, force: true }); // Commented out for safety first run
    });

    console.log("Migration Script Completed Successfully.");

} catch (e) {
    console.error("Migration Failed:", e);
}
