/**
 * VIIYD 社媒数据记录 —— 从手机上三个 App 的「我的主页」读播放 / 点赞 / 粉丝，记一笔快照
 *
 * 用法:
 *   node scripts/social_stats.js collect            # 采一次，追加到 private/social/stats.json，并重出报表
 *   node scripts/social_stats.js collect xhs douyin # 只采指定平台（xhs / douyin / ig）
 *   node scripts/social_stats.js report             # 只重出 private/social/stats.html
 *   node scripts/social_stats.js praise "客户原话" [--who 称呼] [--work 作品slug] [--public]
 *                                                   # 记一条客户反馈到 private/social/feedback.json（--public = 客户同意公开）
 * 每次出完报表都会推到 http://10.1.1.13:8104（homepage 上的「VIIYD 社媒看板」卡片），不在家里网络时只提示、不报错。
 *
 * 能读到什么（2026-10-13 实测，全部来自 uiautomator dump 的文字，不截图）:
 *   小红书  主页笔记格的 content-desc「笔记,<标题>,来自…,27赞，193阅读」→ 每条的赞和阅读，按标题对回队列
 *   抖音    主页作品格的 content-desc「播放数N」→ 每条播放（格子里没有标题，按发布时间倒序对回队列）
 *   IG      主页 Reels 页的 content-desc「觀看次數：128」→ 每条 Reel 播放（同样按倒序对）
 *   三个号的粉丝数；小红书「获赞与收藏」、抖音「获赞」
 *   小红书每条笔记的收藏数、评论数和评论原文（2026-10-17 加）：逐条单击点进笔记详情读，返回键回主页
 *     （详情页按返回是回主页，只有在主页上按返回才会退出 App）。只读一级评论和露出来的回复，不点「展开回复」。
 *     评论原文合并存 private/social/comments.json（按帖子 id，去重，记首次看到的时间）。
 * 读不到的: IG 轮播的赞（要逐条点进去）、抖音和 IG 的评论 —— 这两家帖子页在播动画，uiautomator 拿不到 idle，
 *   dump 直接报错（2026-10-17 实测）；抖音点进去还会弹「赞过的人」面板，满屏「关注」按钮，盲点风险太大，不做。
 *
 * 按倒序对号的前提是「队列外没有另发东西」。对不上的数字原样记在 unmatched 里，不硬凑。
 *
 * 只读：只打开三个社媒 App 的个人主页，只滑动；唯一的点击是单击小红书笔记格进详情（单击不会点赞，双击才会），
 *   不点赞、不评论、不点关注、不发东西。
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
                id: ((m[0].match(/ resource-id="([^"]*)"/) || [])[1] || '').split('/').pop(),
                box: ((m[0].match(/ bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/) || []).slice(1).map(Number)),
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
// backOk：App 被留在没有底栏的子页时（抖音停在「新关注我的」，2026-10-17），只能返回一次再重新拉起。
function gotoProfile(pkg, tabXY, isProfile, backOk = false) {
    launch(pkg);
    for (let i = 0; i < 3; i++) {
        if (i > 0 && backOk) { adb('shell', 'input', 'keyevent', '4'); sleep(1500); launch(pkg); }
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

const XHS_COMMENT_POSTS = 12;   // 只看最新的 12 条，旧帖子很少再有人评论
const isXhsProfile = ns => ns.some(n => /获赞与收藏/.test(n.desc));

// 「昨天 11:25」「3小时前」「10-12」→ ISO；认不出就 null（原文另存）
function relTime(s, now = new Date()) {
    const sh = new Date(now.getTime() + 8 * 36e5);              // 东八区的「今天」
    const ymd = d => d.toISOString().slice(0, 10);
    const at = (dayOffset, hm) => new Date(`${ymd(new Date(sh.getTime() - dayOffset * 864e5))}T${hm || '12:00'}:00+08:00`).toISOString();
    let m;
    if (/^刚刚/.test(s)) return now.toISOString();
    if ((m = s.match(/^(\d+)\s*分钟前/))) return new Date(now - m[1] * 6e4).toISOString();
    if ((m = s.match(/^(\d+)\s*小时前/))) return new Date(now - m[1] * 36e5).toISOString();
    if ((m = s.match(/^今天\s*(\d\d:\d\d)/))) return at(0, m[1]);
    if ((m = s.match(/^昨天\s*(\d\d:\d\d)/))) return at(1, m[1]);
    if ((m = s.match(/^(\d+)\s*天前/))) return at(+m[1]);
    if ((m = s.match(/^(\d{4})-(\d\d)-(\d\d)/))) return new Date(`${m[1]}-${m[2]}-${m[3]}T12:00:00+08:00`).toISOString();
    if ((m = s.match(/^(\d\d)-(\d\d)/))) return new Date(`${ymd(sh).slice(0, 4)}-${m[1]}-${m[2]}T12:00:00+08:00`).toISOString();
    return null;
}

// 详情页一屏 → 评论列表。每条评论以 newTimePoiIpTransTv（「昨天 11:25 浙江 回复」）为锚：往前到最近的 tv_user_name
// 之间的 tv_content 是正文 —— 没有就是纯图片 / 表情评论（亵渎者那条，2026-10-17 实测）；
// 后面的 tv_like_num_new_engage 是这条评论的赞；用户名 x 起点比一级评论靠右的是楼中楼回复。
// 用户名只用来认出自己的回复，不存。正文要整条露出才算（被顶栏 / 底栏截一半的下一屏再读）。
function xhsParseComments(nodes, me) {
    const out = [];
    nodes.forEach((n, i) => {
        if (n.id !== 'newTimePoiIpTransTv') return;
        let u = i - 1;
        while (u >= 0 && nodes[u].id !== 'tv_user_name') u--;
        if (u < 0 || nodes[u].box[1] < 250) return;
        const body = nodes.slice(u + 1, i).filter(x => x.id === 'tv_content').map(x => x.text.trim()).join(' ');
        const like = nodes.slice(i + 1, i + 4).find(x => x.id === 'tv_like_num_new_engage');
        const raw = n.text.replace(/\s*回复\s*$/, '').trim();
        const ip = (raw.match(/\s(\S+)$/) || [])[1] || '';
        out.push({ text: body || '[图片 / 表情]', when: /[\d:-]/.test(ip) || !ip ? raw : raw.replace(/\s\S+$/, '').trim(), ip: /[\d:-]/.test(ip) ? '' : ip,
            likes: like && like.text.trim() ? num(like.text) : 0, reply: nodes[u].box[0] > 200, mine: nodes[u].text === me });
    });
    return out;
}

// 主页上逐条单击进详情读收藏 / 评论数和评论原文。任何一步回不到主页就停，不继续点（防止点到桌面上）。
function xhsComments(titles) {
    const res = {};
    const me = ((dump().find(n => /^头像,/.test(n.desc)) || {}).desc || '').replace(/^头像,/, '');
    for (let i = 0; i < 4; i++) { adb('shell', 'input', 'swipe', '540', '900', '540', '1900', '300'); sleep(1200); }
    for (const title of titles) {
        let card = null;
        for (let k = 0; k < 6 && !card; k++) {
            const ns = dump();
            if (!isXhsProfile(ns) && !ns.some(n => /^笔记,/.test(n.desc))) return res;
            // 点卡片露在顶栏（y>250）和底栏（y<2180）之间那段的中心；露出不到 300px 就再滑。
            // 列表到底时最后一行卡片的 bounds 会压进底栏（[1264,2213]），只能这样算，不能要求整张在屏上。
            card = ns.find(n => n.desc.startsWith(`笔记,${title},`) && n.box[1] > 250 && Math.min(n.box[3], 2180) - n.box[1] > 300);
            if (!card) { adb('shell', 'input', 'swipe', '540', '1700', '540', '1100', '400'); sleep(1500); }
        }
        if (!card) { console.log(`   ⚠️  主页上没找到「${title}」的卡片`); continue; }
        tap(Math.round((card.box[0] + card.box[2]) / 2), Math.round((card.box[1] + Math.min(card.box[3], 2180)) / 2));
        let ns = dump();
        const cnt = re => { const n = ns.find(n => re.test(n.desc)); return n ? (num(n.desc) ?? 0) : null; };
        const r = { collects: cnt(/^收藏/), comments: cnt(/^评论/), list: [] };
        // 没进到详情页：还在主页就跳过这条（此时按返回会退出 App）；落到别的页面就整段停下
        if (r.comments == null) {
            console.log(`   ⚠️  「${title}」没进到详情页`);
            if (ns.some(n => /^笔记,/.test(n.desc))) continue;
            return res;
        } else {
            const seen = new Set();
            for (let k = 0; k < 8; k++) {
                for (const c of xhsParseComments(ns, me)) { const key = c.text + '|' + c.when; if (!seen.has(key)) { seen.add(key); r.list.push(c); } }
                if (!r.comments || ns.some(n => /到底了|已到底/.test(n.text + n.desc))) break;
                adb('shell', 'input', 'swipe', '540', '2000', '540', '800', '400'); sleep(1800);
                ns = dump();
            }
            res[title] = r;
        }
        adb('shell', 'input', 'keyevent', '4'); sleep(2500);
        if (!dump().some(n => /^笔记,/.test(n.desc))) { console.log('   ⚠️  没回到小红书主页，评论只读到这里'); return res; }
    }
    return res;
}

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
        const comments = xhsComments([...items.keys()].slice(0, XHS_COMMENT_POSTS));
        return { account, items: [...items.values()], by: 'title', comments };
    },
    douyin() {
        const first = gotoProfile('com.ss.android.ugc.aweme', [972, 2261], ns => ns.some(n => n.text === '获赞') && ns.some(n => n.text === '编辑主页'), true);
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

const COMMENTS = path.join(ROOT, 'private/social/comments.json');
const FEEDBACK = path.join(ROOT, 'private/social/feedback.json');   // 客户反馈：{date, text, who?, work?, public}
// 评论原文按帖子累积：同一条（原文 + 发表时间原文）只记一次，seen = 第一次被采到的时间。
// 「昨天 11:25」这种相对时间第二天会变成「10-16」，所以去重键用换算后的日期而不是原文。
function saveComments(id, list, at) {
    const all = fs.existsSync(COMMENTS) ? JSON.parse(fs.readFileSync(COMMENTS, 'utf8')) : {};
    const have = all[id] || (all[id] = []);
    for (const c of list) {
        const t = relTime(c.when, new Date(at));
        const key = c.text + '|' + (t ? t.slice(0, 10) : c.when);
        const old = have.find(x => x.text + '|' + (x.at ? x.at.slice(0, 10) : x.when) === key);
        if (old) { old.likes = c.likes; continue; }
        have.push({ ...c, at: t, seen: at });
    }
    fs.writeFileSync(COMMENTS, JSON.stringify(all, null, 2) + '\n');
}

function collect(which) {
    const q = JSON.parse(fs.readFileSync(QUEUE, 'utf8'));
    const posted = q.posts.filter(p => p.status === 'posted' && p.posted_at);
    const snap = { at: new Date().toISOString(), accounts: {}, posts: {}, unmatched: {}, errors: [] };
    // 每晚 22:00 无人值守跑（计划任务 VIIYD-social-stats）：手机没连上或锁着屏就整笔记错误，不去解锁、不乱点
    let blocked = null;
    try {
        adb('shell', 'input', 'keyevent', 'KEYCODE_WAKEUP');
        if (/isKeyguardShowing=true/.test(adb('shell', 'dumpsys', 'window'))) blocked = '手机锁着屏';
    } catch (e) { blocked = '手机没连上 adb'; }
    if (blocked) { which = []; snap.errors.push(`全部: ${blocked}`); console.log(`⚠️  ${blocked}，这次不采`); }
    for (const key of which) {
        try {
            const r = readers[key]();
            snap.accounts[key] = r.account;
            const mine = posted.filter(p => PLATFORMS[key].includes(p.platform))
                .sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at));
            const rest = [];
            r.items.forEach((it, i) => {
                const p = r.by === 'title' ? mine.find(p => p.title === it.title) : mine[i];
                const c = r.comments && r.comments[it.title];
                if (p) snap.posts[p.id] = { views: it.views, ...(it.likes != null ? { likes: it.likes } : {}), ...(c ? { collects: c.collects, comments: c.comments } : {}) };
                else rest.push(it);
                if (p && c) saveComments(p.id, c.list, snap.at);
            });
            if (rest.length) snap.unmatched[key] = rest;
            console.log(`✅ ${key}  粉丝 ${r.account.followers}  读到 ${r.items.length} 条，对上 ${r.items.length - rest.length} 条`);
        } catch (e) {
            snap.errors.push(`${key}: ${e.message}`);
            console.log(`⚠️  ${key}  ${e.message}`);
        }
    }
    if (!blocked) adb('shell', 'input', 'keyevent', '3');   // 回桌面，不把 App 留在前台
    const all = fs.existsSync(STATS) ? JSON.parse(fs.readFileSync(STATS, 'utf8')) : { snapshots: [] };
    all.snapshots.push(snap);
    fs.writeFileSync(STATS, JSON.stringify(all, null, 2) + '\n');
    return snap;
}

// 看板的口径（2026-10-17 改）：
// - 「变化」一律按天比：今天最后一笔 vs 之前最近一个有数的日子。旧版按「上一笔快照」比，同一天连采两次时全是空的。
// - 每日新增播放 = 该平台所有已发帖子「截至当天最后一笔」的播放之和，再与前一个有数的日子相减；中间没采的日子并进下一天，提示里写几天合计。
// - 第 1 / 3 天播放：从发布时刻（记 0）到各笔快照之间线性插值；相邻两笔隔超过 1.5 天就不插（播放前几天涨得最猛，隔久了线性插值会严重低估），显示「—」（开始采集前就发了的帖子都这样）。
// - 「按写法比」按 queue.json 的 hook 分组，用第 3 天播放的中位数 —— 写法好不好要靠这一块回答，同一种写法没法跟自己比。
function report() {
    if (!fs.existsSync(STATS)) { console.error('❌ 还没有快照，先跑 collect'); process.exit(1); }
    const { snapshots } = JSON.parse(fs.readFileSync(STATS, 'utf8'));
    const q = JSON.parse(fs.readFileSync(QUEUE, 'utf8'));
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const TZ = { timeZone: 'Asia/Shanghai' };
    const dkey = x => new Date(x).toLocaleDateString('sv-SE', TZ);            // → 2026-10-17
    const mdk = k => `${+k.slice(5, 7)}/${+k.slice(8, 10)}`;
    const clock = iso => new Date(iso).toLocaleString('zh-CN', { ...TZ, month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const fmt = n => n == null ? '—' : n.toLocaleString('en-US');
    const sign = n => n == null ? '' : n > 0 ? `+${fmt(n)}` : n < 0 ? `−${fmt(-n)}` : '±0';
    const median = a => { const s = a.filter(x => x != null).sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[s.length >> 1] : Math.round((s[s.length / 2 - 1] + s[s.length / 2]) / 2)) : null; };
    const NAME = { xhs: '小红书', douyin: '抖音', ig: 'Instagram', ig_reel: 'IG Reel', ig_carousel: 'IG 轮播', reddit: 'Reddit' };
    const HOOK = { story: '小故事', H1: '工时', H2: '灰模→成品', H4: '代入', H5: '猜题', H6: '数字清单', 360: '360° 转台', H7: '报价提问' };
    const UNIT = { xhs: '阅读', douyin: '播放', ig: '播放' };
    const PLATS = { xhs: ['xhs'], douyin: ['douyin'], ig: ['ig_reel', 'ig_carousel'] };
    const DAY = 864e5, now = Date.now(), today = dkey(now);

    const posted = q.posts.filter(p => p.status === 'posted' && p.posted_at).sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at));
    const platOf = p => Object.keys(PLATS).find(k => PLATS[k].includes(p.platform));
    const form = p => p.video ? '视频' : '图文';
    const hist = id => snapshots.filter(s => s.posts[id]).map(s => ({ t: +new Date(s.at), ...s.posts[id] }));
    const latest = p => { const h = hist(p.id); return h[h.length - 1] || null; };
    // 发布后第 n 天的播放；null = 还没满 n 天，undefined = 那段时间没采到
    const atDay = (p, n) => {
        const t0 = +new Date(p.posted_at), tgt = t0 + n * DAY;
        if (now < tgt) return null;
        const pts = [{ t: t0, views: 0 }, ...hist(p.id).filter(x => x.views != null)];
        const j = pts.findIndex(x => x.t >= tgt);
        if (j < 1 || pts[j].t - pts[j - 1].t > 1.5 * DAY) return undefined;
        const a = pts[j - 1], b = pts[j];
        return Math.round(a.views + (b.views - a.views) * (tgt - a.t) / (b.t - a.t));
    };
    const lastField = (p, f) => { const h = hist(p.id).filter(x => x[f] != null); return h.length ? h[h.length - 1][f] : null; };
    const COMMENTS_ALL = fs.existsSync(COMMENTS) ? JSON.parse(fs.readFileSync(COMMENTS, 'utf8')) : {};
    const showDay = v => v === null ? '<span class=dim>未满</span>' : v === undefined ? '<span class=dim>—</span>' : `≈${fmt(v)}`;

    // ── 按天汇总：每个平台每天取最后一笔 ──
    const days = [];
    for (let t = +new Date(dkey(snapshots[0].at) + 'T12:00+08:00'); dkey(t) <= today; t += DAY) days.push(dkey(t));
    const daily = {};
    for (const k of Object.keys(PLATS)) {
        let prev = null;
        daily[k] = days.map((d, di) => {
            let idx = -1;
            snapshots.forEach((s, i) => { if (dkey(s.at) === d && s.accounts[k]) idx = i; });
            if (idx < 0) return { d, fresh: false };
            const s = snapshots[idx], T = +new Date(s.at);
            const views = posted.filter(p => platOf(p) === k).reduce((sum, p) => {
                const h = hist(p.id).filter(x => x.t <= T && x.views != null);
                return sum + (h.length ? h[h.length - 1].views : 0);
            }, 0);
            const row = { d, di, fresh: true, followers: s.accounts[k].followers, likes: s.accounts[k].likes, views };
            if (prev) Object.assign(row, { dViews: views - prev.views, dFollowers: row.followers - prev.followers, dLikes: row.likes != null && prev.likes != null ? row.likes - prev.likes : null, span: di - prev.di, since: prev.d });
            prev = row;
            return row;
        });
    }
    const fresh = k => daily[k].filter(r => r.fresh);

    // ── 小图：单一序列，不着平台色（平台靠标题区分），悬停看数 ──
    const W = 300, H = 64, lastN = days.slice(-21);
    const xOf = (i, n) => (i + 0.5) * W / n;
    function barChart(k) {
        const rows = daily[k].slice(-lastN.length), n = rows.length;
        const max = Math.max(1, ...rows.map(r => r.dViews || 0)), bw = Math.min(18, W / n - 3);
        const top = rows.reduce((m, r, i) => (r.dViews || 0) > (rows[m].dViews || 0) ? i : m, 0);
        return `<svg viewBox="0 -14 ${W} ${H + 30}" role=img aria-label="${NAME[k]}每日新增${UNIT[k]}">`
            + `<line x1=0 x2=${W} y1=${H} y2=${H} class=axis />`
            + rows.map((r, i) => {
                const x = xOf(i, n) - bw / 2;
                if (!r.fresh) return `<rect x=${x} y=${H - 2} width=${bw} height=2 class=gap><title>${mdk(r.d)}：没采</title></rect>`;
                if (r.dViews == null) return `<rect x=${x} y=${H - 2} width=${bw} height=2 class=gap><title>${mdk(r.d)}：第一笔，没有前一天可比</title></rect>`;
                const h = Math.max(2, Math.round(Math.max(0, r.dViews) / max * (H - 4)));
                return `<g><rect x=${xOf(i, n) - W / n / 2} y=-14 width=${W / n} height=${H + 14} fill=transparent />`
                    + `<rect x=${x} y=${H - h} width=${bw} height=${h} class="bar${r.span > 1 ? ' multi' : ''}" />`
                    + (i === top && r.dViews > 0 ? `<text x=${xOf(i, n)} y=${H - h - 4} text-anchor=middle class=val>${sign(r.dViews)}</text>` : '')
                    + `<title>${mdk(r.d)}：${sign(r.dViews)} ${UNIT[k]}${r.span > 1 ? `（${mdk(r.since)} 之后 ${r.span} 天合计）` : ''}</title></g>`;
            }).join('')
            + `<text x=0 y=${H + 14} class=lab>${mdk(rows[0].d)}</text><text x=${W} y=${H + 14} text-anchor=end class=lab>${mdk(rows[n - 1].d)}</text></svg>`;
    }
    function lineChart(k) {
        const rows = daily[k].slice(-lastN.length), n = rows.length, pts = rows.map((r, i) => ({ ...r, i })).filter(r => r.fresh);
        if (!pts.length) return '';
        const lo = Math.min(...pts.map(r => r.followers)), hi = Math.max(...pts.map(r => r.followers));
        const y = v => hi === lo ? H / 2 : H - 6 - (v - lo) / (hi - lo) * (H - 18);
        const last = pts[pts.length - 1];
        return `<svg viewBox="0 -14 ${W} ${H + 30}" role=img aria-label="${NAME[k]}粉丝">`
            + `<polyline class=ln points="${pts.map(r => `${xOf(r.i, n)},${y(r.followers)}`).join(' ')}" />`
            + pts.map(r => `<g><circle cx=${xOf(r.i, n)} cy=${y(r.followers)} r=10 fill=transparent /><circle cx=${xOf(r.i, n)} cy=${y(r.followers)} r=3.5 class=dot /><title>${mdk(r.d)}：${r.followers} 粉丝${r.dFollowers ? `（${sign(r.dFollowers)}）` : ''}</title></g>`).join('')
            + `<text x=${Math.min(W - 2, xOf(last.i, n) + 6)} y=${y(last.followers) - 8} text-anchor=end class=val>${last.followers}</text>`
            + `<text x=0 y=${H + 14} class=lab>${mdk(rows[0].d)}</text><text x=${W} y=${H + 14} text-anchor=end class=lab>${mdk(rows[n - 1].d)}</text></svg>`;
    }

    // ── 顶部：每个平台一块 ──
    const panels = Object.keys(PLATS).map(k => {
        const f = fresh(k), cur = f[f.length - 1];
        if (!cur) return `<div class=panel><h3>${NAME[k]}</h3><p>还没采到</p></div>`;
        const firstRow = f[0], n = posted.filter(p => platOf(p) === k).length;
        const ago = Math.round((now - new Date(cur.d + 'T12:00+08:00')) / DAY);
        return `<div class=panel><h3>${NAME[k]}<span>${cur.d === today ? '今天' : `${mdk(cur.d)} 的数（${ago} 天前）`}</span></h3>`
            + `<div class=kpis><div><b>${fmt(cur.followers)}</b><small>粉丝</small><i class=${cur.dFollowers > 0 ? 'up' : 'flat'}>${cur.since ? `较 ${mdk(cur.since)} ${sign(cur.dFollowers)}` : '第一笔'}</i></div>`
            + `<div><b>${fmt(cur.views)}</b><small>已发 ${n} 条的总${UNIT[k]}</small><i class=${cur.dViews > 0 ? 'up' : 'flat'}>${cur.since ? `较 ${mdk(cur.since)} ${sign(cur.dViews)}` : '第一笔'}</i></div>`
            + (cur.likes != null ? `<div><b>${fmt(cur.likes)}</b><small>${k === 'xhs' ? '获赞与收藏' : '获赞'}</small><i class=${cur.dLikes > 0 ? 'up' : 'flat'}>${cur.since ? `较 ${mdk(cur.since)} ${sign(cur.dLikes)}` : ''}</i></div>` : '')
            + `</div><p class=since>自 ${mdk(firstRow.d)} 起：粉丝 ${sign(cur.followers - firstRow.followers)} · ${UNIT[k]} ${sign(cur.views - firstRow.views)}</p>`
            + `<div class=charts><figure><figcaption>每日新增${UNIT[k]}</figcaption>${barChart(k)}</figure><figure><figcaption>粉丝</figcaption>${lineChart(k)}</figure></div></div>`;
    }).join('');

    // ── 每日明细表 ──
    const dayRows = days.slice().reverse().filter(d => Object.keys(PLATS).some(k => daily[k][days.indexOf(d)].fresh)).map(d => {
        const i = days.indexOf(d);
        return `<tr><th>${mdk(d)} ${'日一二三四五六'[new Date(d + 'T12:00+08:00').getDay()]}</th>` + Object.keys(PLATS).map(k => {
            const r = daily[k][i];
            if (!r.fresh) return '<td class=dim>没采</td><td class=dim>—</td>';
            return `<td>${fmt(r.followers)} <i>${r.dFollowers ? sign(r.dFollowers) : ''}</i></td><td>${r.dViews == null ? '<span class=dim>起点</span>' : sign(r.dViews)}${r.span > 1 ? `<span class=dim> (${r.span}天)</span>` : ''}</td>`;
        }).join('') + '</tr>';
    }).join('');

    // ── 帖子逐条：同平台内比 ──
    const postTables = Object.keys(PLATS).map(k => {
        const ps = posted.filter(p => platOf(p) === k);
        if (!ps.length) return '';
        const max = Math.max(1, ...ps.map(p => (latest(p) || {}).views || 0));
        return `<h3 class=sub>${NAME[k]}</h3><div class=scroll><table class=posts><thead><tr><th>发布</th><th>标题</th><th>写法 · 形式</th><th class=r>第 1 天</th><th class=r>第 3 天</th><th class=r>现在</th><th class=r>赞</th><th class=r>赞 / ${UNIT[k]}</th>${k === 'xhs' ? '<th class=r>收藏</th><th class=r>评论</th>' : ''}</tr></thead><tbody>`
            + ps.map(p => {
                const cur = latest(p), age = Math.floor((now - new Date(p.posted_at)) / DAY);
                const base = `<tr><td class=nowrap>${mdk(dkey(p.posted_at))}<span class=dim> · ${age ? age + ' 天' : '今天'}</span></td><td>${esc(p.title)}${p.platform !== k ? ` <span class=dim>${NAME[p.platform]}</span>` : ''}</td><td class=nowrap>${HOOK[p.hook] || p.hook} · ${form(p)}</td>`;
                if (!cur) return base + `<td colspan=${k === 'xhs' ? 7 : 5} class=dim>读不到（IG 轮播的数要逐条点进去看）</td></tr>`;
                const rate = cur.likes != null && cur.views ? cur.likes / cur.views : null;
                return base + `<td class=r>${showDay(atDay(p, 1))}</td><td class=r>${showDay(atDay(p, 3))}</td>`
                    + `<td class="r cur"><b>${fmt(cur.views)}</b><span class=mini><s style="width:${Math.max(2, Math.round((cur.views || 0) / max * 100))}%"></s></span></td>`
                    + `<td class=r>${cur.likes ?? '<span class=dim>—</span>'}</td><td class=r>${rate == null ? '<span class=dim>—</span>' : (rate * 100).toFixed(1) + '%'}</td>`
                    + (k === 'xhs' ? ['collects', 'comments'].map(f => { const v = lastField(p, f); return `<td class=r>${v == null ? '<span class=dim>—</span>' : v ? `<b>${v}</b>` : 0}</td>`; }).join('') : '') + '</tr>';
            }).join('') + '</tbody></table></div>';
    }).join('');

    // ── 按写法比 ──
    const hooksUsed = [...new Set(q.posts.filter(p => p.status !== 'skipped' && p.hook && p.hook !== '-').map(p => p.hook))];
    const hookRows = hooksUsed.map(h => `<tr><th>${HOOK[h] || h}</th>` + Object.keys(PLATS).map(k => {
        const ps = posted.filter(p => platOf(p) === k && p.hook === h);
        const d3 = ps.map(p => atDay(p, 3)).filter(v => v != null);
        if (!ps.length) return '<td class=dim>还没发</td>';
        return `<td>${d3.length ? `<b>${fmt(median(d3))}</b>` : '<span class=dim>—</span>'} <span class=dim>${ps.length} 条${d3.length < ps.length ? `，${d3.length} 条有第 3 天数` : ''}</span></td>`;
    }).join('') + '</tr>').join('');

    // ── 结论：只写数据撑得住的，样本不够就直说 ──
    const find = [];
    const hooksPosted = [...new Set(posted.map(p => p.hook))];
    const nextOther = q.posts.filter(p => (p.status === 'planned' || p.status === 'ready') && p.date >= today && p.hook !== 'story' && p.hook !== '-')
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    if (hooksPosted.length === 1) find.push(['warn', `<b>写法好不好，现在算不出来。</b>已发 ${posted.length} 条全是「${HOOK[hooksPosted[0]] || hooksPosted[0]}」，没有别的写法做对照，换不换都只能凭感觉。`
        + (nextOther.length ? `队列里 ${mdk(nextOther[0].date)} 起排的是 ${[...new Set(nextOther.slice(0, 6).map(p => HOOK[p.hook] || p.hook))].join(' / ')}，同平台各发 2–3 条后，下面「按写法比」就有对照了。` : '')]);
    const pairs = posted.filter(p => p.platform === 'douyin').map(d => [d, posted.find(x => x.platform === 'xhs' && x.slug === d.slug)])
        .filter(([d, x]) => x && latest(d) && latest(x)).map(([d, x]) => ({ t: d.title, dv: latest(d).views, xv: latest(x).views }));
    if (pairs.length) {
        const r = pairs.map(p => p.dv / Math.max(1, p.xv));
        find.push(['', `<b>同一篇内容，抖音的播放是小红书阅读的 ${Math.min(...r).toFixed(1)}–${Math.max(...r).toFixed(1)} 倍</b>（${pairs.map(p => `${esc(p.t.slice(0, 8))}… ${fmt(p.dv)} vs ${fmt(p.xv)}`).join('；')}）。注意抖音「播放」划过就算，小红书「阅读」要点开，口径不一样，倍数偏大。`]);
    }
    const grow = Object.keys(PLATS).map(k => { const f = fresh(k); return f.length > 1 ? { k, a: f[0], b: f[f.length - 1], n: posted.filter(p => platOf(p) === k && new Date(p.posted_at) >= new Date(f[0].d + 'T00:00+08:00')).length } : null; }).filter(Boolean);
    if (grow.length) find.push(['', `<b>涨粉：</b>${grow.map(g => `${NAME[g.k]} ${g.a.followers}→${g.b.followers}（${sign(g.b.followers - g.a.followers)}，期间新发 ${g.n} 条）`).join('；')}。`
        + (grow.some(g => g.b.followers > g.a.followers) ? `在带人关注的只有${grow.filter(g => g.b.followers > g.a.followers).map(g => NAME[g.k]).join('、')}。` : '三边都没涨粉。')]);
    for (const k of Object.keys(PLATS)) {
        const vals = posted.filter(p => platOf(p) === k).map(p => ({ p, v: atDay(p, 3) })).filter(x => x.v != null);
        if (vals.length < 2) continue;
        vals.sort((a, b) => b.v - a.v);
        const hi = vals[0], lo = vals[vals.length - 1];
        if (hi.v >= lo.v * 1.5) find.push(['', `<b>${NAME[k]}第 3 天：</b>最好「${esc(hi.p.title)}」≈${fmt(hi.v)}（${HOOK[hi.p.hook] || hi.p.hook} · ${form(hi.p)}），最差「${esc(lo.p.title)}」≈${fmt(lo.v)}，差 ${(hi.v / Math.max(1, lo.v)).toFixed(1)} 倍。${vals.length < 4 ? '只有 ' + vals.length + ' 条，先当线索看，别当结论。' : ''}`]);
    }
    const rated = posted.filter(p => platOf(p) === 'xhs').map(p => ({ p, c: latest(p) })).filter(x => x.c && x.c.likes != null && x.c.views >= 100).map(x => ({ ...x, r: x.c.likes / x.c.views }));
    if (rated.length >= 3) {
        const m = median(rated.map(x => x.r * 1e4)) / 1e4, top = rated.reduce((a, b) => b.r > a.r ? b : a);
        if (top.r >= m * 1.8) find.push(['', `<b>小红书赞率：</b>「${esc(top.p.title)}」${(top.r * 100).toFixed(1)}%，其余中位 ${(m * 100).toFixed(1)}%。阅读不一定最高，但看到的人更愿意点赞 —— 这类题材值得再来一条。`]);
    }
    const igNew = posted.filter(p => p.platform === 'ig_reel').map(p => ({ p, c: latest(p) })).filter(x => x.c);
    const igBase = (() => { for (let i = snapshots.length - 1; i >= 0; i--) if ((snapshots[i].unmatched.ig || []).length) return snapshots[i].unmatched.ig.map(x => x.views); return []; })();
    if (igBase.length >= 3 && igNew.length) find.push([igNew.every(x => x.c.views < median(igBase) / 2) ? 'warn' : '', `<b>IG Reel 对比老号自己：</b>主页上队列之外的 ${igBase.length} 条旧 Reel 播放中位 ${fmt(median(igBase))}（最高 ${fmt(Math.max(...igBase))}）；这轮发的 ${igNew.map(x => `「${esc(x.p.title)}」${fmt(x.c.views)}`).join('、')}。`]);
    const wk = days.slice(-7), got = wk.filter(d => Object.keys(PLATS).some(k => daily[k][days.indexOf(d)].fresh)).length;
    if (got < wk.length) find.push(['warn', `<b>近 ${wk.length} 天只有 ${got} 天采了数，</b>曲线是断的，没采的日子会并进下一天（柱子变浅）。要看清「每天涨多少」，得每天固定时间采一次。`]);
    const disc = posted.filter(p => platOf(p) === 'xhs').map(p => ({ p, c: lastField(p, 'comments'), v: lastField(p, 'views') })).filter(x => x.c != null && x.v);
    if (disc.length >= 2) {
        const top = disc.reduce((a, b) => b.c / b.v > a.c / a.v ? b : a), total = disc.reduce((n, x) => n + x.c, 0);
        if (top.c >= 2) find.push(['', `<b>评论：</b>小红书 ${disc.length} 条一共 ${total} 条评论，「${esc(top.p.title)}」一条就占 ${top.c} 条（每百阅读 ${(top.c / top.v * 100).toFixed(1)} 条）。原文在下面「评论区在聊什么」—— 看大家接的是故事还是涂装。`]);
    }
    const um = snapshots[snapshots.length - 1].unmatched || {};
    for (const k of Object.keys(um)) if (k !== 'ig') find.push(['warn', `<b>${NAME[k]}主页上有对不上队列的帖子：</b>${um[k].map(x => esc(x.title || `播放 ${x.views}`)).join('、')} —— 不在 queue.json 的 posted 里，数据没算进上面。`]);

    // ── 评论区：按帖子列原文，评论时间在 24 小时内的标「新」 ──
    const byId = Object.fromEntries(q.posts.map(p => [p.id, p]));
    const commentBlocks = Object.entries(COMMENTS_ALL).filter(([, l]) => l.length)
        .sort(([a], [b]) => new Date((byId[b] || {}).posted_at || 0) - new Date((byId[a] || {}).posted_at || 0))
        .map(([id, list]) => {
            const p = byId[id] || { title: id, platform: '' };
            return `<div class=cblock><h3 class=sub>${NAME[p.platform] || ''} · ${esc(p.title)} <span class=dim>${list.length} 条</span></h3><ul class=comments>`
                + list.map(c => {   // 按页面上的顺序（回复紧跟在被回复的那条后面），新采到的接在末尾
                    const fresh = c.at && now - new Date(c.at) < DAY;
                    return `<li class="${c.reply ? 'reply' : ''}${c.mine ? ' mine' : ''}">${fresh ? '<em class=new>新</em>' : ''}${c.mine ? '<em class=me>我回</em>' : ''}${esc(c.text)}`
                        + `<span class=dim> · ${c.at ? mdk(dkey(c.at)) : esc(c.when)}${c.ip ? ' ' + esc(c.ip) : ''}${c.likes ? ` · ${c.likes} 赞` : ''}</span></li>`;
                }).join('') + '</ul></div>';
        }).join('');

    // ── 客户反馈（praise 命令记的） ──
    const FEED = fs.existsSync(FEEDBACK) ? JSON.parse(fs.readFileSync(FEEDBACK, 'utf8')) : [];
    const feedRows = FEED.slice().sort((a, b) => b.date.localeCompare(a.date)).map(x =>
        `<li><q>${esc(x.text)}</q><span class=dim> —— ${esc(x.who || '客户')} · ${mdk(x.date)}${x.work ? ' · ' + esc(x.work) : ''}</span>${x.public ? '<em class=pub>可公开</em>' : ''}</li>`).join('');

    const WEEK = '日一二三四五六';
    const next = q.posts.filter(p => p.date >= today && (p.status === 'ready' || p.status === 'planned'))
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 8)
        .map(p => `<tr><td class=nowrap>${mdk(p.date)} ${WEEK[new Date(p.date + 'T12:00+08:00').getDay()]} ${p.time}</td><td class=nowrap>${NAME[p.platform] || p.platform}</td><td>${esc(p.title)}</td><td class=nowrap>${HOOK[p.hook] || p.hook}</td><td class="nowrap ${p.status}">${p.status === 'ready' ? (p.video ? '视频已备' : '素材已备') : '只有选题'}</td></tr>`).join('');

    const last = snapshots[snapshots.length - 1];
    fs.writeFileSync(HTML, `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VIIYD 社媒看板</title>
<style>
*{box-sizing:border-box}
body{background:#0E1113;color:#D6ECF0;font:14px/1.6 system-ui,"Microsoft YaHei",sans-serif;margin:0 auto;padding:24px 16px 48px;max-width:1200px}
h1{font-size:22px;margin:0}h2{font-size:15px;font-weight:600;margin:36px 0 12px;padding-bottom:8px;border-bottom:1px solid #758A9940}
h3.sub{font-size:13px;font-weight:400;color:#5AA4AE;margin:18px 0 6px}
p{margin:6px 0}.lede,.dim,.since,small,figcaption{color:#758A99}.lede{font-size:13px}
i{font-style:normal;font-size:12px}i.up{color:#5AA4AE}i.flat{color:#758A99}
.panels{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:12px;margin-top:18px}
.panel{border:1px solid #758A9940;padding:14px 16px}
.panel h3{margin:0 0 10px;font-size:15px;display:flex;justify-content:space-between;align-items:baseline}.panel h3 span{font-size:12px;font-weight:400;color:#758A99}
.kpis{display:flex;gap:22px;flex-wrap:wrap}.kpis div{display:flex;flex-direction:column}
.kpis b{font-size:30px;line-height:1.1;font-variant-numeric:tabular-nums}.kpis small{font-size:12px}
.since{font-size:12px;margin-top:8px}
.charts{display:grid;grid-template-columns:1fr;gap:10px;margin-top:10px}figure{margin:0}figcaption{font-size:12px}
svg{width:100%;height:auto;display:block;overflow:visible}
.axis{stroke:#758A9960;stroke-width:1}.bar{fill:#5AA4AE}.bar.multi{fill:#5AA4AE80}.gap{fill:#758A9950}
.ln{fill:none;stroke:#5AA4AE;stroke-width:2}.dot{fill:#5AA4AE;stroke:#0E1113;stroke-width:2}
.val{fill:#D6ECF0;font-size:11px}.lab{fill:#758A99;font-size:10px}
g:hover .bar,g:hover .dot{fill:#D6ECF0}
.find{list-style:none;padding:0;margin:0}.find li{padding:10px 14px;border-left:2px solid #5AA4AE;background:#758A9914;margin-bottom:8px}
.find li.warn{border-left-color:#F0C239}
.scroll{overflow-x:auto}
table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}
th,td{text-align:left;padding:7px 10px 7px 0;border-bottom:1px solid #758A9926;vertical-align:baseline}
thead th{font-weight:400;color:#758A99;font-size:12px}tbody th{font-weight:400}
.r{text-align:right}.nowrap{white-space:nowrap}
td.cur{min-width:110px}.mini{display:block;height:3px;background:#758A9926;margin-top:3px}.mini s{display:block;height:3px;background:#5AA4AE;margin-left:auto}
td.ready{color:#5AA4AE}td.planned{color:#758A99}
.comments,.feed{list-style:none;padding:0;margin:0}.comments li,.feed li{padding:6px 0;border-bottom:1px solid #758A9926}
.comments li.reply{padding-left:22px}.comments li.reply::before{content:'↳ ';color:#758A99}
em.new,em.me,em.pub{font-style:normal;font-size:11px;padding:0 5px;margin-right:6px;border:1px solid #5AA4AE;color:#5AA4AE}em.me{border-color:#758A99;color:#758A99}em.pub{margin:0 0 0 8px}
.feed q{quotes:'「' '」'}
@media(max-width:520px){.kpis b{font-size:26px}}
</style>
<h1>VIIYD 社媒看板</h1>
<p class=lede>最近一笔 ${clock(last.at)} · 共 ${snapshots.length} 笔快照，${days.filter(d => Object.keys(PLATS).some(k => daily[k][days.indexOf(d)].fresh)).length} 天有数 · 「较 x/x」都是跟前一个有数的日子比 · 鼠标停在柱子/圆点上看具体数</p>
${last.errors.map(w => `<p class=lede style="color:#F0C239">⚠ 最近一笔没采到：${esc(w)}</p>`).join('')}
<div class=panels>${panels}</div>
<h2>这些数说明了什么</h2>
<ul class=find>${find.map(([c, t]) => `<li class="${c}">${t}</li>`).join('')}</ul>
<h2>按写法比 <span class=dim style="font-weight:400;font-size:12px">· 第 3 天阅读/播放中位数</span></h2>
<div class=scroll><table><thead><tr><th>写法</th>${Object.keys(PLATS).map(k => `<th>${NAME[k]}</th>`).join('')}</tr></thead><tbody>${hookRows}</tbody></table></div>
<h2>评论区在聊什么 <span class=dim style="font-weight:400;font-size:12px">· 只有小红书读得到原文；抖音 / IG 帖子页在播动画，读不出来</span></h2>
${commentBlocks || '<p class=dim>还没采到评论</p>'}
<h2>客户怎么说 <span class=dim style="font-weight:400;font-size:12px">· 跟 Claude 说一句就记上；标「可公开」的才能上网站</span></h2>
${feedRows ? `<ul class=feed>${feedRows}</ul>` : '<p class=dim>还没有记录。收到客户夸奖 / 意见时，把原话发给 Claude 记一笔。</p>'}
<h2>每条帖子</h2>
<p class=lede>只在同一平台内比。第 1 / 3 天是按采集时刻推算的（≈），「—」表示那几天没采到，「未满」表示还没到。</p>
${postTables}
<h2>每日明细</h2>
<div class=scroll><table><thead><tr><th>日期</th>${Object.keys(PLATS).map(k => `<th>${NAME[k]} 粉丝</th><th>新增${UNIT[k]}</th>`).join('')}</tr></thead><tbody>${dayRows}</tbody></table></div>
<h2>接下来要发</h2>
${next ? `<div class=scroll><table><tbody>${next}</tbody></table></div>` : '<p class=dim>队列里没有待发的帖子</p>'}
<p class=lede style="margin-top:28px">读不到的：IG 轮播的赞和播放、各平台收藏和评论。抖音与 IG Reel 的格子里没有标题，按「最新的在最前」对回队列，队列外另发过东西时会错位。</p>
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
else if (cmd === 'praise' && rest[0]) {
    const opt = k => { const i = rest.indexOf(k); return i > 0 ? rest[i + 1] : undefined; };
    const all = fs.existsSync(FEEDBACK) ? JSON.parse(fs.readFileSync(FEEDBACK, 'utf8')) : [];
    all.push({ date: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' }), text: rest[0], ...(opt('--who') ? { who: opt('--who') } : {}), ...(opt('--work') ? { work: opt('--work') } : {}), public: rest.includes('--public') });
    fs.writeFileSync(FEEDBACK, JSON.stringify(all, null, 2) + '\n');
    console.log(`📝 记了第 ${all.length} 条客户反馈`);
    report(); deploy();
}
else { console.error('用法: node scripts/social_stats.js collect [xhs douyin ig] | report | praise "原话" [--who 称呼] [--work slug] [--public]'); process.exit(1); }
