#!/usr/bin/env node
/**
 * VIIYD 4.0 内容模型迁移 — DOCS/REDESIGN_4.0_PLAN.md §3
 *
 * 补齐 4.0 新增 front matter 字段，作用于 content/work/<slug>/index.md 与 index.zh.md。
 *
 *   system     从 tags 推导（old-world / 40k / aos / kill-team / joytoy / other）
 *   delivered  从 date 取 YYYY.MM
 *
 * 设计约定（改动前先读）：
 * - **幂等**：只补缺失字段，已有值一律不动。可反复重跑。
 * - **同 slug 双语一致**：system/delivered 是事实性字段，中英文取同一个值；
 *   以 index.md 的 tags/date 为准，zh 版跟随，避免两边推导出不同分类。
 * - **不引入 gallery 字段**：图集仍由 `photos: N` 推导 _01.._NN（CLAUDE.md 红线）。
 * - **顺手去 BOM**：27 个 zh 文件带 UTF-8 BOM（历史遗留，疑似某次 PowerShell 写入所致）。
 *   Hugo 两种都吃，但 BOM 会让任何按 `startsWith('---')` 解析 front matter 的工具翻车。
 *   本脚本改写文件时统一去掉 BOM —— 属于计划里「旧架构统一掉，不留新旧并存」的一部分。
 * - eiu 字段不在此脚本范围内 —— 依赖定价系数拍板（占位表 P1/P2/P4）。
 *
 * 用法：
 *   node scripts/migrate_4_0.js            # 干跑，只报告
 *   node scripts/migrate_4_0.js --apply    # 实际写入
 */

const fs = require('fs');
const path = require('path');

const WORK_DIR = path.join(__dirname, '..', 'content', 'work');
const APPLY = process.argv.includes('--apply');

/* tags → system 映射。按数组顺序匹配，先命中先赢，所以特指的写前面。
   依据是实际 tag 分布（56 单统计），不是凭空枚举。 */
const SYSTEM_RULES = [
  ['kill-team',  ['kill team']],
  ['joytoy',     ['joytoy']],
  ['old-world',  ['grand cathay', 'old world', 'the old world', 'bretonnia', 'empire of man']],
  ['aos',        ['age of sigmar', 'cities of sigmar', 'sigmar', 'freeguild', 'stormcast',
                  'nighthaunt', 'kharadron', 'seraphon', 'idoneth']],
  ['40k',        ['warhammer 40', '40k', 'space marine', 'chaos space marines', 'dark angels',
                  'necron', 'aeldari', 'custodes', 'astra militarum', 'death guard',
                  'tyranid', 'ork', 'tau', "t'au", 'drukhari', 'grey knight', 'sisters of battle',
                  'primarch', 'imperial', 'genestealer', 'leagues of votann', 'world eaters',
                  'thousand sons', 'blood angels', 'ultramarines', 'salamanders']],
  ['other',      ['3d print', 'black myth', 'wukong', 'chibi', 'wuxia']],
];

/** 从 front matter 文本里取一个标量字段的原始值（不解析 YAML，避免引依赖）。 */
function readScalar(fm, key) {
  const m = fm.match(new RegExp('^' + key + ':\s*(.*)$', 'm'));
  if (!m) return null;
  return m[1].trim().replace(/^["']|["']$/g, '');
}

/** 取 tags 行（可能是 ["a", "b"] 单行形式，这是本仓库的实际写法）。 */
function readTags(fm) {
  const m = fm.match(/^tags:\s*\[(.*)\]\s*$/m);
  if (!m) return [];
  // 逐个取双引号内的内容 —— 不能按逗号切，"Warhammer 40,000" 会被切坏
  return (m[1].match(/"[^"]*"/g) || []).map(s => s.slice(1, -1));
}

function deriveSystem(tags) {
  const hay = tags.join(' | ').toLowerCase();
  for (const [system, keywords] of SYSTEM_RULES) {
    if (keywords.some(k => hay.includes(k))) return system;
  }
  return null;   // 交给人工，不猜
}

function deriveDelivered(dateStr) {
  if (!dateStr) return null;
  const m = dateStr.match(/^(\d{4})-(\d{2})/);
  return m ? `${m[1]}.${m[2]}` : null;
}

/** 在 front matter 末尾插入字段，保持原有内容与换行不变。 */
function insertFields(raw, fields) {
  const end = raw.indexOf('\n---', 4);          // 第二个 --- 的位置
  if (!raw.startsWith('---') || end === -1) return null;
  const lines = Object.entries(fields).map(([k, v]) => `${k}: "${v}"`).join('\n');
  return raw.slice(0, end) + '\n' + lines + raw.slice(end);
}

const BOM = '﻿';

/** 读文件并剥掉 BOM，同时告知调用方原本有没有 BOM。 */
function readMd(p) {
  const raw = fs.readFileSync(p, 'utf8');
  return raw.charCodeAt(0) === 0xFEFF
    ? { text: raw.slice(1), hadBom: true }
    : { text: raw, hadBom: false };
}

const report = { updated: [], skipped: [], needsReview: [], noFrontMatter: [], bomStripped: [] };

for (const slug of fs.readdirSync(WORK_DIR)) {
  const dir = path.join(WORK_DIR, slug);
  if (!fs.statSync(dir).isDirectory()) continue;

  const enPath = path.join(dir, 'index.md');
  if (!fs.existsSync(enPath)) continue;

  const { text: enRaw } = readMd(enPath);
  const fmEnd = enRaw.indexOf('\n---', 4);
  if (!enRaw.startsWith('---') || fmEnd === -1) { report.noFrontMatter.push(slug); continue; }
  const enFm = enRaw.slice(0, fmEnd);

  // 以 en 版为事实来源，双语共用同一组推导结果
  const system    = deriveSystem(readTags(enFm));
  const delivered = deriveDelivered(readScalar(enFm, 'date'));

  if (!system) report.needsReview.push({ slug, tags: readTags(enFm) });

  for (const file of ['index.md', 'index.zh.md']) {
    const p = path.join(dir, file);
    if (!fs.existsSync(p)) continue;
    const { text: raw, hadBom } = readMd(p);
    const end = raw.indexOf('\n---', 4);
    if (!raw.startsWith('---') || end === -1) { report.noFrontMatter.push(`${slug}/${file}`); continue; }
    const fm = raw.slice(0, end);

    const add = {};
    if (system    && readScalar(fm, 'system')    === null) add.system = system;
    if (delivered && readScalar(fm, 'delivered') === null) add.delivered = delivered;

    if (!Object.keys(add).length) {
      // 字段齐了，但 BOM 还在的话仍然要清
      if (hadBom) {
        if (APPLY) fs.writeFileSync(p, raw);
        report.bomStripped.push(`${slug}/${file}`);
      } else {
        report.skipped.push(`${slug}/${file}`);
      }
      continue;
    }

    const next = insertFields(raw, add);
    if (!next) { report.noFrontMatter.push(`${slug}/${file}`); continue; }
    if (hadBom) report.bomStripped.push(`${slug}/${file}`);
    if (APPLY) fs.writeFileSync(p, next);   // 写回时不带 BOM
    report.updated.push(`${slug}/${file} → ${Object.entries(add).map(([k, v]) => `${k}=${v}`).join(' ')}`);
  }
}

const mode = APPLY ? '已写入' : '干跑（加 --apply 实际写入）';
console.log(`\n=== VIIYD 4.0 内容迁移 · ${mode} ===\n`);
console.log(`补齐字段: ${report.updated.length} 处`);
console.log(`已有字段跳过: ${report.skipped.length} 处`);
if (report.needsReview.length) {
  console.log(`\n⚠️  system 无法推导，需人工指定（占位表 P11）: ${report.needsReview.length} 单`);
  for (const r of report.needsReview) console.log(`   ${r.slug}\n     tags: ${r.tags.join(', ')}`);
}
if (report.bomStripped.length) {
  console.log(`
🧹 顺手清掉 UTF-8 BOM: ${report.bomStripped.length} 个文件`);
}
if (report.noFrontMatter.length) {
  console.log(`\n❌ front matter 解析失败: ${report.noFrontMatter.join(', ')}`);
}
console.log('');
