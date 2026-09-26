/**
 * VIIYD 配色提取 —— 给「颜料太杂、给不出逐单涂料清单」的作品生成 `palette:` 色值
 *
 * 用法:
 *   node scripts/extract_palette.js ./need_upload/[folder]
 *   （读目录里的 *_web.webp；rename_images.js 跑完后即可用）
 *
 * 输出: 每个色相组一行「组名  #HEX  像素数」，外加一段可直接粘进 front matter 的 YAML 草稿。
 * 组名（yellow/green/…）只是色相分组，**部位名要人看照片后改**（氏族黄 / 兽人皮肤 / 红布…），
 * 像素数太少的组多半是噪点或阴影，不要照单全收。
 *
 * 为什么这样取（2026-09 在 Meganobz 50 张图上实测）:
 *   - 直接 k-means：被大面积主色的明暗层次占满（10 个簇里 7 个是黄甲的不同阴影），皮肤、布料小面积色全丢。
 *   - 按色相分组后取亮度中位：比照片观感偏暗偏脏（暗部把中位拉低）。
 *   - 最终：按色相分组，取每组亮度 75–95 分位的像素求各通道中位 = 受光面颜色，与照片观感一致。
 *   - 背景是黑布：亮度 < 7% 的像素直接丢；低饱和的按亮度分成「金属」和「黑」两组。
 *   - 「copper/橙」组经常只是黄色的阴影，看情况取舍。
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
if (!dir || !fs.existsSync(dir)) {
    console.error('❌ 用法: node scripts/extract_palette.js ./need_upload/[folder]');
    process.exit(1);
}
const files = fs.readdirSync(dir).filter(f => /_web\.webp$/i.test(f)).sort();
if (!files.length) { console.error('❌ 目录里没有 *_web.webp'); process.exit(1); }

function hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let h = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) {
        const d = mx - mn;
        s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
        h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
        h *= 60;
    }
    return [h, s, l];
}

const GROUPS = { yellow: [], green: [], red: [], blue: [], purple: [], copper: [], metal: [], black: [] };
const ROLE = { yellow: 'ARMOUR', green: 'SKIN', red: 'CLOTH', blue: 'CLOTH', purple: 'CLOTH', copper: 'DETAIL', metal: 'METAL', black: 'DETAIL' };

(async () => {
    for (const f of files) {
        const { data } = await sharp(path.join(dir, f)).resize(120, 120, { fit: 'cover' })
            .removeAlpha().raw().toBuffer({ resolveWithObject: true });
        for (let i = 0; i < data.length; i += 3) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const [h, s, l] = hsl(r, g, b);
            if (l < 0.07) continue;                       // 黑布背景
            const p = [r, g, b, l];
            if (s < 0.15) { if (l > 0.35) GROUPS.metal.push(p); else if (l > 0.1 && l < 0.2) GROUPS.black.push(p); continue; }
            if (s < 0.35) continue;                       // 灰浊过渡色，不代表任何一块颜色
            if (h >= 38 && h < 60) GROUPS.yellow.push(p);
            else if (h >= 75 && h < 160) GROUPS.green.push(p);
            else if (h >= 345 || h < 12) GROUPS.red.push(p);
            else if (h >= 195 && h < 250) GROUPS.blue.push(p);
            else if (h >= 250 && h < 345) GROUPS.purple.push(p);
            else if (h >= 14 && h < 32) GROUPS.copper.push(p);
        }
    }
    const hex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
    const rows = [];
    for (const [k, a] of Object.entries(GROUPS)) {
        if (a.length < 200) continue;                     // 太少 = 噪点
        a.sort((x, y) => x[3] - y[3]);
        const lit = a.slice(Math.floor(a.length * 0.75), Math.floor(a.length * 0.95));
        const med = [0, 1, 2].map(j => { const v = lit.map(p => p[j]).sort((x, y) => x - y); return v[v.length >> 1]; });
        rows.push({ k, hex: hex(med), n: a.length });
    }
    rows.sort((a, b) => b.n - a.n);
    console.log(`📷 ${files.length} 张 _web 图\n`);
    rows.forEach(r => console.log(`   ${r.k.padEnd(7)} ${r.hex}  ${r.n}`));
    console.log('\n# 粘进 front matter 前，把 name 改成部位名（双语各一份），删掉不需要的组');
    console.log('palette:');
    rows.forEach(r => console.log(`  - name: "${r.k}"\n    role: "${ROLE[r.k]}"\n    hex: "${r.hex}"`));
})();
