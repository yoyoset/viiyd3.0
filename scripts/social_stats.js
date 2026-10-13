/**
 * VIIYD 社媒数据记录 —— 从手机上三个 App 的「我的主页」读播放 / 点赞 / 粉丝，记一笔快照
 *
 * 用法:
 *   node scripts/social_stats.js collect            # 采一次，追加到 private/social/stats.json，并重出报表
 *   node scripts/social_stats.js collect xhs douyin # 只采指定平台（xhs / douyin / ig）
 *   node scripts/social_stats.js report             # 只重出 private/social/stats.html
 *
 * 能读到什么（2026-10-13 实测，全部来自 uiautomator dump 的文字，不截图）:
 *   小红书  主页笔记格的 content-desc「笔记,<标题>,来自…,27赞，193阅读」→ 每条的赞和阅读，按标题对回队列
 *   抖音    主页作品格的 content-desc「播放数N」→ 每条播放（格子里没有标题，按发布时间倒序对回队列）
 *   IG      主页 Reels 页的 content-desc「觀看次數：128」→ 每条 Reel 播放（同样按倒序对）
 *   三个号的粉丝数；小红书「获赞与收藏」、抖音「获赞」
 * 读不到的: IG 轮播的赞（要逐条点进去）、各平台的收藏 / 评论 / 主页访问 —— 这次不做。
 *
 * 按倒序对号的前提是「队列外没有另发东西」。对不上的数字原样记在 unmatched 里，不硬凑。
 *
 * 只读：只打开三个社媒 App 的个人主页，只滑动，不点任何帖子、不点赞、不发东西。
 * 找不到预期的文字（弹窗挡住、没登录、界面改版）就记一条 error 跳过这个平台，不乱点。
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const QUEUE = path.join(ROOT, 'private/social/queue.json');
const STATS = path.join(ROOT, 'private/social/stats.json');
const HTML = path.join(ROOT, 'private/social/stats.html');
const ADB = process.env.ADB || 'F:/my_ai/pixel/platform-tools/adb.exe';
const ENV = { ...process.env, MSYS_NO_PATHCONV: '1' };
const UI = '/sdcard/Pictures/VIIYD/ui.xml';

const adb = (...a) => execFileSync(ADB, a, { env: ENV, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const tap = (x, y) => { adb('shell', 'input', 'tap', String(x), String(y)); sleep(3500); };
const scroll = () => { adb('shell', 'input', 'swipe', '540', '1900', '540', '900', '400'); sleep(2000); };
const launch = pkg => { adb('shell', 'monkey', '-p', pkg, '-c', 'android.intent.category.LAUNCHER', '1'); sleep(6000); };

function dump() {
    // 视频在播时 uiautomator 偶尔等不到 idle，重试两次
    for (let i = 0; i < 3; i++) {
        try {
            adb('shell', 'uiautomator', 'dump', UI);
            const xml = adb('shell', 'cat', UI);
            const un = s => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&quot;/g, '"').replace(/&amp;/g, '&');
            return [...xml.matchAll(/<node [^>]*>/g)].map(m => ({
                text: un((m[0].match(/ text="([^"]*)"/) || [])[1] || ''),
                desc: un((m[0].match(/ content-desc="([^"]*)"/) || [])[1] || ''),
            }));
        } catch (e) { sleep(1500); }
    }
    return [];
}

// "2,630" / "1.2万" / "1.3w" / "4.5k" → 数字
function num(s) {
    const m = String(s).replace(/,/g, '').match(/([\d.]+)\s*([万萬wWkK]?)/);
    if (!m) return null;
    return Math.round(parseFloat(m[1]) * ({ '万': 1e4, '萬': 1e4, w: 1e4, W: 1e4, k: 1e3, K: 1e3 }[m[2]] || 1));
}

// 进到「我的主页」顶部：点底栏的「我」；App 上次停在主页中段时头部不在屏上，往下拉回顶再看。
// 不按返回键 —— 实测在小红书主页按返回会直接退出 App，后面的点击就落到桌面上了（2026-10-13）。
function gotoProfile(pkg, tabXY, isProfile) {
    launch(pkg);
    for (let i = 0; i < 3; i++) {
        tap(...tabXY);
        let nodes = dump();
        if (isProfile(nodes)) return nodes;
        for (let j = 0; j < 2; j++) { adb('shell', 'input', 'swipe', '540', '900', '540', '1900', '300'); sleep(1500); }
        nodes = dump();
        if (isProfile(nodes)) return nodes;
    }
    return null;
}

const labelValue = (nodes, label) => { const i = nodes.findIndex(n => n.text === label); return i > 0 ? num(nodes[i - 1].text) : null; };

const readers = {
    xhs() {
        const first = gotoProfile('com.xingin.xhs', [972, 2278], ns => ns.some(n => /获赞与收藏/.test(n.desc)));
        if (!first) throw new Error('没进到小红书主页');
        const pick = re => { const n = first.find(n => re.test(n.desc)); return n ? num(n.desc) : null; };
        const account = { followers: pick(/\d粉丝$/), likes: pick(/获赞与收藏$/) };
        const items = new Map();
        let nodes = first;
        for (let i = 0; i < 8; i++) {
            const before = items.size;
            for (const n of nodes) {
                const m = n.desc.match(/^笔记,(.*),来自[^,]*,(\S+?)赞，(\S+?)阅读/);
                if (m) items.set(m[1], { title: m[1], likes: num(m[2]), views: num(m[3]) });
            }
            if (i > 0 && items.size === before) break;
            scroll(); nodes = dump();
        }
        return { account, items: [...items.values()], by: 'title' };
    },
    douyin() {
        const first = gotoProfile('com.ss.android.ugc.aweme', [972, 2261], ns => ns.some(n => n.text === '获赞') && ns.some(n => n.text === '编辑主页'));
        if (!first) throw new Error('没进到抖音主页');
        const account = { followers: labelValue(first, '粉丝'), likes: labelValue(first, '获赞') };
        const views = [];
        let nodes = first, done = false;
        for (let i = 0; i < 8 && !done; i++) {
            // 滚动后同一格会再出现一次：只在第一屏之后接上「比已有更多」的部分
            const page = nodes.filter(n => /^播放数/.test(n.desc)).map(n => num(n.desc));
            if (i === 0) views.push(...page);
            else if (!nodes.some(n => n.text === '暂时没有更多了')) views.push(...page.slice(-3));
            done = nodes.some(n => n.text === '暂时没有更多了');
            if (!done) { scroll(); nodes = dump(); }
        }
        return { account, items: views.map(v => ({ views: v })), by: 'order' };
    },
    ig() {
        const first = gotoProfile('com.instagram.android', [972, 2275], ns => ns.some(n => /粉絲人數$/.test(n.desc)));
        if (!first) throw new Error('没进到 IG 主页');
        const account = { followers: num(first.find(n => /粉絲人數$/.test(n.desc)).desc) };
        const tab = first.findIndex(n => n.desc === 'Reels' && first.some(x => x.desc === '網格檢視'));
        if (tab < 0) throw new Error('IG 主页上没找到 Reels 页签');
        tap(540, 1962);                       // 主页中部的 Reels 页签（不是底栏那个）
        scroll();
        const views = dump().filter(n => /Reel。觀看次數：/.test(n.desc)).map(n => num(n.desc.split('觀看次數：')[1]));
        if (!views.length) throw new Error('IG Reels 页没读到观看次数');
        return { account, items: views.map(v => ({ views: v })), by: 'order', kind: 'ig_reel' };
    },
};

const PLATFORMS = { xhs: ['xhs'], douyin: ['douyin'], ig: ['ig_reel'] };

function collect(which) {
    const q = JSON.parse(fs.readFileSync(QUEUE, 'utf8'));
    const posted = q.posts.filter(p => p.status === 'posted' && p.posted_at);
    const snap = { at: new Date().toISOString(), accounts: {}, posts: {}, unmatched: {}, errors: [] };
    for (const key of which) {
        try {
            const r = readers[key]();
            snap.accounts[key] = r.account;
            const mine = posted.filter(p => PLATFORMS[key].includes(p.platform))
                .sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at));
            const rest = [];
            r.items.forEach((it, i) => {
                const p = r.by === 'title' ? mine.find(p => p.title === it.title) : mine[i];
                if (p) snap.posts[p.id] = { views: it.views, ...(it.likes != null ? { likes: it.likes } : {}) };
                else rest.push(it);
            });
            if (rest.length) snap.unmatched[key] = rest;
            console.log(`✅ ${key}  粉丝 ${r.account.followers}  读到 ${r.items.length} 条，对上 ${r.items.length - rest.length} 条`);
        } catch (e) {
            snap.errors.push(`${key}: ${e.message}`);
            console.log(`⚠️  ${key}  ${e.message}`);
        }
    }
    adb('shell', 'input', 'keyevent', '3');   // 回桌面，不把 App 留在前台
    const all = fs.existsSync(STATS) ? JSON.parse(fs.readFileSync(STATS, 'utf8')) : { snapshots: [] };
    all.snapshots.push(snap);
    fs.writeFileSync(STATS, JSON.stringify(all, null, 2) + '\n');
    return snap;
}

function report() {
    if (!fs.existsSync(STATS)) { console.error('❌ 还没有快照，先跑 collect'); process.exit(1); }
    const { snapshots } = JSON.parse(fs.readFileSync(STATS, 'utf8'));
    const q = JSON.parse(fs.readFileSync(QUEUE, 'utf8'));
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const day = iso => new Date(iso).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const NAME = { xhs: '小红书', douyin: '抖音', ig: 'IG', ig_reel: 'IG Reel', ig_carousel: 'IG 轮播', reddit: 'Reddit' };
    const delta = (a, b) => a == null || b == null || a === b ? '' : ` <i>${a > b ? '+' : ''}${a - b}</i>`;

    // 每条帖子：最新一笔 + 相对上一笔的变化 + 全部历史
    const rows = q.posts.filter(p => p.status === 'posted').sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at)).map(p => {
        const hist = snapshots.filter(s => s.posts[p.id]).map(s => ({ at: s.at, ...s.posts[p.id] }));
        const cur = hist[hist.length - 1], prev = hist[hist.length - 2];
        const days = ((Date.now() - new Date(p.posted_at)) / 864e5).toFixed(0);
        return `<tr><td>${day(p.posted_at)}<br><small>${days} 天前</small></td><td>${NAME[p.platform] || p.platform}</td><td>${esc(p.title)}</td>`
            + (cur ? `<td class=n>${cur.views ?? '—'}${delta(cur.views, prev && prev.views)}</td><td class=n>${cur.likes ?? '—'}${delta(cur.likes, prev && prev.likes)}</td>`
                + `<td><small>${hist.map(h => `${day(h.at).split(' ')[0]}: ${h.views ?? '—'}`).join(' → ')}</small></td>`
                : '<td class=n>—</td><td class=n>—</td><td><small>读不到（IG 轮播）或还没采过</small></td>') + '</tr>';
    }).join('\n');

    const keys = ['xhs', 'douyin', 'ig'];
    const acct = snapshots.slice(-12).map((s, i, arr) => `<tr><td>${day(s.at)}</td>` + keys.map(k => {
        const a = s.accounts[k], b = i > 0 ? arr[i - 1].accounts[k] : null;
        return a ? `<td class=n>${a.followers ?? '—'}${delta(a.followers, b && b.followers)}</td><td class=n>${a.likes ?? '—'}${delta(a.likes, b && b.likes)}</td>` : '<td class=n>—</td><td class=n>—</td>';
    }).join('') + '</tr>').reverse().join('\n');

    const last = snapshots[snapshots.length - 1];
    const warn = last.errors;
    fs.writeFileSync(HTML, `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VIIYD 社媒数据</title>
<style>
body{background:#0E1113;color:#D6ECF0;font:15px/1.6 system-ui,"Microsoft YaHei",sans-serif;margin:0;padding:24px 16px;max-width:1100px;margin:auto}
h1{font-size:20px;margin:0 0 4px}h2{font-size:15px;color:#5AA4AE;margin:32px 0 8px}
p,small{color:#758A99}table{border-collapse:collapse;width:100%}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #758A9940;vertical-align:top}
th{color:#758A99;font-weight:400;font-size:13px}.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
i{font-style:normal;color:#5AA4AE;font-size:13px}.w{color:#F0C239}.x{overflow-x:auto}
</style>
<h1>VIIYD 社媒数据</h1>
<p>最近一次采集：${day(last.at)} · 共 ${snapshots.length} 笔快照 · 蓝色小字是相对上一笔的变化</p>
${warn.map(w => `<p class=w>⚠ ${esc(w)}</p>`).join('')}
<h2>每条帖子</h2>
<div class=x><table><tr><th>发布<th>平台<th>标题<th class=n>播放 / 阅读<th class=n>赞<th>历次</tr>
${rows}
</table></div>
<h2>账号（最近 12 笔，新的在上）</h2>
<div class=x><table><tr><th>时间<th class=n>小红书粉丝<th class=n>获赞与收藏<th class=n>抖音粉丝<th class=n>获赞<th class=n>IG 粉丝<th class=n></tr>
${acct}
</table></div>
<p>读不到的：IG 轮播的赞、各平台收藏 / 评论。抖音和 IG Reel 按「最新的在最前」对回队列，队列外另发过东西时会错位。</p>
</html>
`);
    console.log(`📄 ${path.relative(ROOT, HTML)}`);
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'collect') {
    const which = rest.length ? rest : Object.keys(readers);
    const bad = which.filter(k => !readers[k]);
    if (bad.length) { console.error(`❌ 不认识的平台：${bad.join(' ')}（可选 xhs / douyin / ig）`); process.exit(1); }
    const snap = collect(which);
    report();
    if (snap.errors.length) process.exit(2);
} else if (cmd === 'report') report();
else { console.error('用法: node scripts/social_stats.js collect [xhs douyin ig] | report'); process.exit(1); }
