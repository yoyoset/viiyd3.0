#!/usr/bin/env node
// 社媒发布台账：作品 × 平台 的"发过没有"。唯一事实来源是 private/social/queue.json 里 status=posted 的条目。
// 规则（2026-11-01 用户定）：台账按 作品×平台 打勾。发过的不是永久排除而是**权重往后放**：没发过的先发；
// 没东西发了，或者隔了一两个月（COOLDOWN_DAYS），可以再发，发得最久的先重发。新作品随时会有。
//
//   node scripts/social_ledger.js            写 private/social/LEDGER.md（矩阵 + 各平台还没发的）
//   node scripts/social_ledger.js --json     只打印 JSON
//
// 被 social_plan.js 引用：require('./social_ledger').load()
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const COOLDOWN_DAYS = 60; // 同作品同平台至少隔这么多天才能重发
const QUEUE = path.join(ROOT, 'private/social/queue.json');
const OUT = path.join(ROOT, 'private/social/LEDGER.md');

// ig_reel / ig_carousel 是同一个账号，台账里合成 ig
const PLAT = { xhs: 'xhs', douyin: 'douyin', ig_reel: 'ig', ig_carousel: 'ig', channels: 'channels', reddit: 'reddit' };
const PLATFORMS = ['xhs', 'douyin', 'ig', 'channels'];
// 不是"作品"的内容页，不进台账
const EXCLUDE = new Set(['test-rule-compliance', 'warhammer-painting-beginner-guide', '3d-print-custom-figure-chromatic']);

function readFront(work) {
  for (const f of ['index.zh.md', 'index.md']) {
    const p = path.join(ROOT, 'content/work', work, f);
    if (!fs.existsSync(p)) continue;
    const t = fs.readFileSync(p, 'utf8').replace(/^﻿/, '');
    const g = (k) => (t.match(new RegExp('^' + k + ':\\s*"?([^"\\n]*)"?', 'm')) || [])[1];
    const vids = [...t.matchAll(/video\/([A-Za-z0-9_-]+)\.mp4/g)].map((m) => m[1]);
    return { title: g('title'), tier: g('tier'), photos: +g('photos') || 0, timeLog: g('time_log'), video: vids[0] || null };
  }
  return null;
}

function load() {
  const q = JSON.parse(fs.readFileSync(QUEUE, 'utf8').replace(/^﻿/, ''));
  const posts = q.posts;
  const posted = {}; // platform -> Map(work -> 最近一次发布时间)
  for (const p of PLATFORMS.concat('reddit')) posted[p] = new Map();
  for (const x of posts) {
    if (x.status !== 'posted') continue;
    const p = PLAT[x.platform];
    if (!p) continue;
    const at = x.posted_at || x.date;
    const m = posted[p];
    if (!m.has(x.slug) || m.get(x.slug) < at) m.set(x.slug, at);
  }
  const works = fs.readdirSync(path.join(ROOT, 'content/work'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && !EXCLUDE.has(d.name))
    .map((d) => d.name)
    .filter((w) => readFront(w));
  return { q, posts, posted, works };
}

if (require.main === module) {
  const { posted, works, posts } = load();
  const short = (s) => (s ? '✓ ' + String(s).slice(5, 10) : '');
  const rows = works.map((w) => {
    const f = readFront(w);
    return { work: w, title: f.title, cells: PLATFORMS.map((p) => short(posted[p].get(w))) };
  });
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  }
  const todo = PLATFORMS.map((p) => works.filter((w) => !posted[p].has(w)).length);
  const lines = [];
  lines.push('# 社媒发布台账（自动生成，别手改）', '');
  lines.push('> `node scripts/social_ledger.js` 重新生成。来源：`queue.json` 里 `status: posted` 的条目。');
  lines.push(`> 规则（2026-11-01）：发过的打 ✓，权重往后放；没发过的先发。没东西发了或隔了 ${COOLDOWN_DAYS} 天以上才重发，发得最久的先。`);
  lines.push('> 单元格是发布日（月-日），空 = 这个平台还没发过。2026-10 之前不在队列里的老帖（IG 老号 830+ 帖等）不计。', '');
  lines.push('| 平台 | ' + PLATFORMS.join(' | ') + ' |', '|---|' + PLATFORMS.map(() => '---').join('|') + '|');
  lines.push('| 还没发的作品数 | ' + todo.join(' | ') + ' |', '');
  lines.push(`共 ${works.length} 件作品。`, '');
  lines.push('| 作品 | ' + PLATFORMS.join(' | ') + ' |', '|---|' + PLATFORMS.map(() => '---').join('|') + '|');
  for (const r of rows) lines.push(`| ${r.work} | ${r.cells.join(' | ')} |`);
  lines.push('');
  const pending = {};
  for (const x of posts) if (['planned', 'ready'].includes(x.status) && PLAT[x.platform]) pending[PLAT[x.platform]] = (pending[PLAT[x.platform]] || 0) + 1;
  lines.push('待发条目数：' + PLATFORMS.map((p) => `${p} ${pending[p] || 0}`).join('，'), '');
  fs.writeFileSync(OUT, lines.join('\n'));
  console.log('written', OUT, '\n还没发的作品数', PLATFORMS.map((p, i) => `${p}=${todo[i]}`).join(' '));
}

module.exports = { COOLDOWN_DAYS, load, readFront, PLAT, PLATFORMS };
