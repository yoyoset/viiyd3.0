/**
 * VIIYD 社媒数据记录 —— 从手机上三个 App 的「我的主页」读播放 / 点赞 / 粉丝，记一笔快照
 *
 * 用法:
 *   node scripts/social_stats.js collect            # 采一次，追加到 private/social/stats.json，并重出报表
 *   node scripts/social_stats.js collect xhs douyin # 只采指定平台（xhs / douyin / ig）
 *   node scripts/social_stats.js report             # 只重出 private/social/stats.html
 * 每次出完报表都会推到 http://10.1.1.13:8104（homepage 上的「VIIYD 社媒看板」卡片），不在家里网络时只提示、不报错。
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
// 看板：家里 10.1.1.13 上的 nginx 容器 viiyd-social（/root/viiyd-social，:8104），homepage 有卡片指过去
const DASH_HOST = process.env.VIIYD_DASH_HOST || 'root@10.1.1.13';
const DASH_DIR = '/root/viiyd-social/html';
const DASH_URL = 'http://10.1.1.13:8104';

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
    const TZ = { timeZone: 'Asia/Shanghai' };
    const day = iso => new Date(iso).toLocaleString('zh-CN', { ...TZ, month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const md = iso => new Date(iso).toLocaleDateString('zh-CN', { ...TZ, month: 'numeric', day: 'numeric' });
    const NAME = { xhs: '小红书', douyin: '抖音', ig: 'Instagram', ig_reel: 'IG Reel', ig_carousel: 'IG 轮播', reddit: 'Reddit' };
    const delta = (a, b) => a == null || b == null || a === b ? '' : `<i>${a > b ? '+' : ''}${a - b}</i>`;
    const last = snapshots[snapshots.length - 1], prev = snapshots[snapshots.length - 2];
    // 某个平台这次没采到时，往回找最近一笔有它的
    const acct = (k, upto) => { for (let i = upto; i >= 0; i--) if (snapshots[i].accounts[k]) return snapshots[i].accounts[k]; return null; };

    const posted = q.posts.filter(p => p.status === 'posted').sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at));
    const tiles = [['xhs', ['xhs'], '获赞与收藏'], ['douyin', ['douyin'], '获赞'], ['ig', ['ig_reel', 'ig_carousel'], '']].map(([k, plats, likeLabel]) => {
        const a = acct(k, snapshots.length - 1), b = acct(k, snapshots.length - 2);
        const n = posted.filter(p => plats.includes(p.platform)).length;
        return `<div class=tile><h3>${NAME[k]}</h3><b>${a ? a.followers ?? '—' : '—'}</b> <span>粉丝 ${a && b ? delta(a.followers, b.followers) : ''}</span>`
            + `<p>${likeLabel && a && a.likes != null ? `${likeLabel} ${a.likes} ${b ? delta(a.likes, b.likes) : ''} · ` : ''}已发 ${n} 条</p></div>`;
    }).join('');

    const hist = p => snapshots.filter(s => s.posts[p.id]).map(s => ({ at: s.at, ...s.posts[p.id] }));
    const max = Math.max(1, ...posted.map(p => { const h = hist(p); return h.length ? h[h.length - 1].views || 0 : 0; }));
    const rows = posted.map(p => {
        const h = hist(p), cur = h[h.length - 1], pv = h[h.length - 2];
        const days = Math.floor((Date.now() - new Date(p.posted_at)) / 864e5);
        const head = `<div class=post><div class=meta><em class="tag ${p.platform}">${NAME[p.platform] || p.platform}</em> ${md(p.posted_at)} · ${days ? days + ' 天前' : '今天'}</div><div class=title>${esc(p.title)}</div>`;
        if (!cur) return head + `<div class=none>读不到数（IG 轮播要逐条点进去看）</div></div>`;
        return head + `<div class=bar><s style="width:${Math.max(1, Math.round((cur.views || 0) / max * 100))}%"></s></div>`
            + `<div class=nums><b>${cur.views ?? '—'}</b> ${p.platform === 'xhs' ? '阅读' : '播放'} ${delta(cur.views, pv && pv.views)}`
            + (cur.likes != null ? ` · <b>${cur.likes}</b> 赞 ${delta(cur.likes, pv && pv.likes)}` : '')
            + (h.length > 1 ? `<small>${h.map(x => `${md(x.at)} ${x.views ?? '—'}`).join(' → ')}</small>` : '') + `</div></div>`;
    }).join('\n');

    const today = new Date().toLocaleDateString('sv-SE', TZ);
    const WEEK = '日一二三四五六';
    const next = q.posts.filter(p => p.date >= today && (p.status === 'ready' || p.status === 'planned'))
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 8)
        .map(p => `<div class=up><span>${+p.date.slice(5, 7)}/${+p.date.slice(8)} ${WEEK[new Date(p.date + 'T12:00+08:00').getDay()]} ${p.time}</span><em class="tag ${p.platform}">${NAME[p.platform] || p.platform}</em>`
            + `<span class=t>${esc(p.title)}</span><span class="st ${p.status}">${p.status === 'ready' ? (p.video ? '视频已备' : '素材已备') : '只有选题'}</span></div>`).join('\n');

    fs.writeFileSync(HTML, `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VIIYD 社媒看板</title>
<style>
*{box-sizing:border-box}
body{background:#0E1113;color:#D6ECF0;font:15px/1.6 system-ui,"Microsoft YaHei",sans-serif;margin:0 auto;padding:28px 16px 48px;max-width:1040px}
h1{font-size:22px;margin:0}h2{font-size:14px;font-weight:400;color:#758A99;letter-spacing:.08em;margin:36px 0 12px;padding-bottom:8px;border-bottom:1px solid #758A9940}
p,small,.meta,.none{color:#758A99;font-size:13px}i{font-style:normal;color:#5AA4AE;font-size:13px}
.warn{color:#F0C239}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:20px}
.tile{border:1px solid #758A9940;padding:16px 18px}.tile h3{margin:0 0 6px;font-size:13px;font-weight:400;color:#5AA4AE}
.tile b{font-size:40px;line-height:1.1;font-variant-numeric:tabular-nums}.tile p{margin:8px 0 0}
.post{padding:14px 0;border-bottom:1px solid #758A9926}.title{font-size:16px;margin:2px 0 8px}
.bar{background:#758A9926;height:6px}.bar s{display:block;height:6px;background:#5AA4AE}
.nums{margin-top:6px;font-variant-numeric:tabular-nums}.nums b{font-size:18px}.nums small{display:block}
.tag{font-style:normal;font-size:12px;padding:1px 7px;border:1px solid #758A99;color:#D6ECF0;margin-right:6px;white-space:nowrap}
.tag.xhs{border-color:#FF4C00}.tag.douyin{border-color:#D6ECF0}.tag.ig_reel,.tag.ig_carousel{border-color:#5AA4AE}
.up{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline;padding:9px 0;border-bottom:1px solid #758A9926}
.up>span:first-child{color:#758A99;font-size:13px;min-width:108px;font-variant-numeric:tabular-nums}.up .t{flex:1 1 200px}
.st{font-size:12px;color:#758A99}.st.ready{color:#5AA4AE}
</style>
<h1>VIIYD 社媒看板</h1>
<p>数据截至 ${day(last.at)} · 第 ${snapshots.length} 笔快照${prev ? ` · 蓝色小字是相对 ${day(prev.at)} 的变化` : ''} · 每次发帖前和每周日晚更新</p>
${last.errors.map(w => `<p class=warn>⚠ 这次没采到：${esc(w)}</p>`).join('')}
<div class=tiles>${tiles}</div>
<h2>已发的帖子</h2>
${rows}
<h2>接下来要发</h2>
${next || '<p>队列里没有待发的帖子</p>'}
<p style="margin-top:28px">读不到的：IG 轮播的赞、各平台收藏和评论。抖音与 IG Reel 的格子里没有标题，按「最新的在最前」对回队列，队列外另发过东西时会错位。</p>
</html>
`);
    console.log(`📄 ${path.relative(ROOT, HTML)}`);
}

// 把报表推到家里的 homepage 主机，卡片「VIIYD 社媒看板」指向它。推不上去不算采集失败，但要说出来。
function deploy() {
    try {
        execFileSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=8', DASH_HOST,
            `cat > ${DASH_DIR}/index.html.tmp && mv ${DASH_DIR}/index.html.tmp ${DASH_DIR}/index.html`],
            { input: fs.readFileSync(HTML), stdio: ['pipe', 'ignore', 'pipe'] });
        console.log(`📡 看板已更新 ${DASH_URL}`);
    } catch (e) {
        console.log(`⚠️  看板没更新（${DASH_HOST} 推不上去）：${String(e.stderr || e.message).trim().split('\n').pop()}`);
    }
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'collect') {
    const which = rest.length ? rest : Object.keys(readers);
    const bad = which.filter(k => !readers[k]);
    if (bad.length) { console.error(`❌ 不认识的平台：${bad.join(' ')}（可选 xhs / douyin / ig）`); process.exit(1); }
    const snap = collect(which);
    report();
    deploy();
    if (snap.errors.length) process.exit(2);
} else if (cmd === 'report') { report(); deploy(); }
else { console.error('用法: node scripts/social_stats.js collect [xhs douyin ig] | report'); process.exit(1); }
