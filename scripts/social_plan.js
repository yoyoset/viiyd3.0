#!/usr/bin/env node
// 社媒排期：按台账（social_ledger.js）填空档：没在该平台发过的作品优先，发过的往后放，隔够 COOLDOWN_DAYS 天或没东西发才重发。只写 planned 空壳，正文由人/起稿模型补。
//
//   node scripts/social_plan.js --from 2026-11-02 --to 2026-12-12            试跑，只打印
//   node scripts/social_plan.js --from 2026-11-02 --to 2026-12-12 --write    写入 queue.json
//
// 做两件事：
//  1. 执法：待发条目的作品在**该平台** COOLDOWN_DAYS 天内发过 → skipped（抖音让位时，同作品的 IG / 视频号整组让位）；
//     同一作品在同一平台排了多天 → 只留最早一天。
//  2. 补位：发帖日（--days 指定）每个平台缺条目就补。
//     发帖日默认周一/三/五（--days 可改，2026-11-01 定：11-02 那周周一到周五，之后一/三/五）。
//     抖音 / IG / 视频号同作品；小红书优先同作品，同作品小红书发过就另挑；周三小红书是 H7 价格帖，必须有 time_log。
const fs = require('fs');
const path = require('path');
const { load, readFront, PLAT, COOLDOWN_DAYS } = require('./social_ledger');
const daysBetween = (a, b) => Math.round((new Date(a.slice(0, 10)) - new Date(b.slice(0, 10))) / 864e5);

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const WRITE = process.argv.includes('--write');
const FROM = arg('--from'), TO = arg('--to');
if (!FROM || !TO) { console.error('需要 --from YYYY-MM-DD --to YYYY-MM-DD'); process.exit(1); }
const DAYS = (arg('--days') || '1,3,5').split(',').map(Number); // 默认周一/三/五；某周要多发就 --days 1,2,3,4,5 单独跑那一周
const TAG = '2026-11-01 台账排期';

const { q, posts, posted, works } = load();
const active = (x) => ['planned', 'ready'].includes(x.status);
const front = Object.fromEntries(works.map((w) => [w, readFront(w)]));
const tierOrd = { Legend: 0, Master: 1, 'Spec Ops': 2, Specialist: 3, Battleline: 4 };
const pool = [...works].sort((a, b) => ((tierOrd[front[a].tier] ?? 5) * 1000 - front[a].photos) - ((tierOrd[front[b].tier] ?? 5) * 1000 - front[b].photos));
const skip = (x, why) => { x.status = 'skipped'; x.note = (x.note ? x.note + '；' : '') + `${TAG}：${why}`; };
const log = [];

// ---- 1. 执法 ----
for (const x of posts) {
  const p = PLAT[x.platform];
  if (!active(x) || !p) continue;
  if (posted[p].has(x.slug) && daysBetween(x.date, posted[p].get(x.slug)) < COOLDOWN_DAYS) { skip(x, `该作品在${p}发过(${posted[p].get(x.slug).slice(0, 10)})，不足 ${COOLDOWN_DAYS} 天，先让没发过的；够了天数或没东西发时会重新排`); log.push('skip ' + x.id); }
}
const skippedDouyin = new Set(posts.filter((x) => x.platform === 'douyin' && x.note && x.note.includes(TAG) && x.status === 'skipped').map((x) => x.id));
for (const x of posts) {
  if (!active(x) || !['ig_reel', 'ig_carousel', 'channels'].includes(x.platform)) continue;
  const gone = skippedDouyin.has(x.mirror) || posts.some((d) => skippedDouyin.has(d.id) && d.date === x.date && d.slug === x.slug);
  if (gone) { skip(x, '同组抖音让位(同作品同平台已发过)，整组一起让位，作品留给以后重新分组'); log.push('skip(group) ' + x.id); }
}
{ // 同平台同作品只排一天
  const by = {};
  for (const x of posts) if (active(x) && PLAT[x.platform]) (by[PLAT[x.platform] + '|' + x.slug] = by[PLAT[x.platform] + '|' + x.slug] || []).push(x);
  for (const k in by) {
    const ds = [...new Set(by[k].map((x) => x.date))].sort();
    if (ds.length > 1) for (const x of by[k]) if (x.date !== ds[0]) { skip(x, `同作品同平台只排一天，保留最早 ${ds[0]}`); log.push('skip(dup) ' + x.id); }
  }
}

// ---- 2. 补位 ----
const sched = { xhs: new Set(), douyin: new Set(), ig: new Set(), channels: new Set() };
for (const x of posts) if (active(x) && PLAT[x.platform] && sched[PLAT[x.platform]]) sched[PLAT[x.platform]].add(x.slug);
// 权重：没在该平台发过的排前面（按 pool 顺序）；发过的往后放，只有隔了 COOLDOWN_DAYS 天才能再选，发得最久的优先
let cur = FROM; // 当前正在补的发帖日
const free = (p, w) => !sched[p].has(w) && (!posted[p].has(w) || daysBetween(cur, posted[p].get(w)) >= COOLDOWN_DAYS);
const pick = (p, ok = () => true) => {
  const fresh = pool.filter((w) => !posted[p].has(w));
  const again = pool.filter((w) => posted[p].has(w)).sort((a, b) => posted[p].get(a).localeCompare(posted[p].get(b)));
  return [...fresh, ...again].find((w) => free(p, w) && ok(w));
};
const sdow = (d) => new Date(d + 'T00:00:00Z').getUTCDay();
const short = (w) => w.replace(/^\d{4}-\d{2}-\d{2}-/, '').split('-').slice(0, 3).join('-');
const ids = new Set(posts.map((x) => x.id));
const mk = (o) => { let id = o.id, n = 2; while (ids.has(id)) id = o.id + '-' + n++; ids.add(id); return { ...o, id }; };
const add = [];

for (let t = new Date(FROM + 'T00:00:00Z'); t <= new Date(TO + 'T00:00:00Z'); t = new Date(t.getTime() + 864e5)) {
  const d = t.toISOString().slice(0, 10);
  if (!DAYS.includes(sdow(d))) continue;
  cur = d;
  const E = posts.filter((x) => x.date === d && active(x));
  const has = (p) => E.some((x) => PLAT[x.platform] === p);
  // 抖音 / IG / 视频号 这一组
  let dy = E.find((x) => x.platform === 'douyin');
  let T = dy ? dy.slug : null, video = dy && dy.video;
  if (!T && (!has('ig') || !has('channels') || !has('douyin'))) {
    const ex = E.find((x) => x.platform === 'ig_reel' || x.platform === 'ig_carousel' || x.platform === 'channels');
    T = ex && free('douyin', ex.slug) ? ex.slug : pick('douyin', (w) => free('channels', w));
    if (T) {
      const v = front[T].video;
      video = (ex && ex.video) || (v ? { name: v } : null);
    }
  }
  const ds = T ? `${d}-douyin-${short(T)}` : null;
  if (T && !has('douyin')) { add.push(mk({ id: ds, date: d, time: '20:10', platform: 'douyin', slug: T, hook: video ? '360' : 'story', title: '', caption: '', tags: [], status: 'planned', ...(video ? { video } : {}), note: `${TAG}：没在抖音发过的作品先发` })); sched.douyin.add(T); }
  if (!has('ig')) { // 抖音这个作品 IG 已发过 / 当天没抖音 → IG 自己挑一个没发过的，不留空
    const W = T && free('ig', T) && !posted.ig.has(T) ? T : pick('ig');
    if (W) {
      const v = (W === T && video) || (front[W].video ? { name: front[W].video } : null);
      add.push(mk({ id: `${d}-ig${v ? 'reel' : 'carousel'}-${short(W)}`, date: d, time: '20:20', platform: v ? 'ig_reel' : 'ig_carousel', slug: W, hook: v ? '360' : 'story', title: '', caption: '', tags: [], status: 'planned', ...(v ? { video: v } : {}), note: `${TAG}：${W === T ? '跟当天抖音同作品' : 'IG 另挑没发过的作品(当天抖音那件 IG 已发过)'}` })); sched.ig.add(W);
    }
  }
  if (T && !has('channels') && free('channels', T)) { add.push(mk({ id: `${d}-channels-${short(T)}`, date: d, time: '20:30', platform: 'channels', slug: T, hook: video ? '360' : 'story', mirror: dy ? dy.id : ds, status: 'planned', note: `${TAG}：照抄当天抖音` })); sched.channels.add(T); }
  // 小红书
  if (!has('xhs')) {
    const wed = sdow(d) === 3;
    let X = wed ? pick('xhs', (w) => front[w].timeLog) : (T && free('xhs', T) && !posted.xhs.has(T) ? T : pick('xhs'));
    if (X) {
      add.push(mk({ id: `${d}-xhs-${short(X)}`, date: d, time: '20:00', platform: 'xhs', slug: X, hook: wed ? 'H7' : 'story', title: '', caption: '', tags: [], status: 'planned', note: `${TAG}：没在小红书发过的作品先发${wed ? '；周三 H7 价格话题，工时用作品页 time_log ' + front[X].timeLog : ''}` }));
      sched.xhs.add(X);
    }
  }
}

console.log(`执法 ${log.length} 条：`); log.forEach((l) => console.log('  ' + l));
console.log(`补位 ${add.length} 条：`);
for (const a of add.sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time))) console.log(`  ${a.date} ${a.time} ${a.platform.padEnd(12)} ${a.hook.padEnd(6)} ${a.slug}${a.video ? ' [video ' + a.video.name + ']' : ''}`);
if (WRITE) { posts.push(...add); fs.writeFileSync(path.join(__dirname, '../private/social/queue.json'), JSON.stringify(q, null, 2) + '\n'); console.log('WRITTEN'); }
