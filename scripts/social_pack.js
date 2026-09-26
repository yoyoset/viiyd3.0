/**
 * VIIYD 社媒素材打包 —— 把 private/social/queue.json 里的帖子变成「打开 App 就能发」的文件夹
 *
 * 用法:
 *   node scripts/social_pack.js <post-id>            # 打包一条
 *   node scripts/social_pack.js --from 2026-09-28 --to 2026-10-04   # 打包一个日期区间
 *   加 --push   打包后推到手机 /sdcard/Pictures/VIIYD/<post-id>/ 并触发媒体扫描
 *
 * 产出（private/social/outbox/<post-id>/）:
 *   01.jpg … NN.jpg   按平台比例裁切（小红书 3:4 = 1080×1440，IG 4:5 = 1080×1350，Reddit 原比例）
 *   reel.mp4          ig_reel：从 R2 的 360° 视频截 start..start+duration 秒（原片已是 1080×1920 竖版）
 *   caption.txt       标题 + 正文 + 标签，可直接整段复制
 *
 * 选图: queue 里写了 photos 就按它；没写就取 cover(_01) + 在 1..photos 间均匀取样（小红书 9 张，IG 8 张）。
 *   单张写成 "49:contain" = 整张缩进画框、黑边补齐，不裁切 —— 主体在方图里左右分得很开时用
 *   （实测：Meganobz 的两只地精在 3:4 智能裁切下会被切掉一只半）。黑底棚拍图补黑边看不出来。
 * 图源用 R2 的 _web 版（1600px），社媒压缩后看不出与原图的差别，流量小一个数量级。
 *
 * 只写社媒素材目录与手机的 Pictures/VIIYD/，不碰其它任何东西。
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const QUEUE = path.join(ROOT, 'private/social/queue.json');
const OUTBOX = path.join(ROOT, 'private/social/outbox');
const CACHE = path.join(ROOT, 'private/social/cache');
const ADB = process.env.ADB || 'F:/my_ai/pixel/platform-tools/adb.exe';

const RATIO = { xhs: [1080, 1440], ig_carousel: [1080, 1350], ig_reel: [1080, 1350], reddit: null };
const COUNT = { xhs: 9, ig_carousel: 8, ig_reel: 0, reddit: 4 };

function frontmatter(slug) {
    const f = path.join(ROOT, 'content/work', slug, 'index.md');
    const s = fs.readFileSync(f, 'utf8');
    const get = k => { const m = s.match(new RegExp('^' + k + ':\\s*"?([^"\\r\\n]*)"?', 'm')); return m ? m[1].trim() : null; };
    const videos = [...s.matchAll(/https:\/\/photo\.viiyd\.com\/video\/([\w-]+)\.mp4/g)].map(m => m[1]);
    return { cover: get('cover'), photos: parseInt(get('photos') || '0', 10), videos };
}

async function fetchTo(url, dest) {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return dest;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    return dest;
}

function pickPhotos(post, total) {
    if (post.photos && post.photos.length) return post.photos;
    const n = Math.min(COUNT[post.platform] || 0, total);
    if (n <= 0) return [];
    const picks = [1];
    for (let i = 1; i < n; i++) picks.push(1 + Math.round(i * (total - 1) / (n - 1 || 1)));
    return [...new Set(picks)];
}

async function pack(post) {
    const fm = frontmatter(post.slug);
    const dir = path.join(OUTBOX, post.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.mkdirSync(CACHE, { recursive: true });
    const prefix = fm.cover.replace(/_\d+\.webp$/, '');           // …/viiyd20260925meganobz

    const nums = pickPhotos(post, fm.photos);
    for (let i = 0; i < nums.length; i++) {
        const [num, mode] = String(nums[i]).split(':');
        const nn = num.padStart(2, '0');
        const url = `${prefix}_${nn}_web.webp`;
        const src = await fetchTo(url, path.join(CACHE, path.basename(url)));
        const out = path.join(dir, String(i + 1).padStart(2, '0') + '.jpg');
        const size = RATIO[post.platform];
        let img = sharp(src);
        if (size) img = mode === 'contain'
            ? img.resize(size[0], size[1], { fit: 'contain', background: '#000000' })
            : img.resize(size[0], size[1], { fit: 'cover', position: 'attention' });
        await img.jpeg({ quality: 90, mozjpeg: true }).toFile(out);
    }

    if (post.platform === 'ig_reel' && post.video) {
        const vsrc = await fetchTo(`https://photo.viiyd.com/video/${post.video.name}.mp4`, path.join(CACHE, post.video.name + '.mp4'));
        execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(post.video.start || 0), '-i', vsrc,
            '-t', String(post.video.duration || 15), '-c:v', 'libx264', '-crf', '20', '-preset', 'medium',
            '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', path.join(dir, 'reel.mp4')]);
    }

    const tags = (post.tags || []).map(t => '#' + t).join(' ');
    const text = [post.title, '', post.caption, '', tags].join('\n').trim() + '\n';
    fs.writeFileSync(path.join(dir, 'caption.txt'), text);
    return dir;
}

function push(dir, id) {
    const env = { ...process.env, MSYS_NO_PATHCONV: '1' };
    const remote = `/sdcard/Pictures/VIIYD/${id}`;
    execFileSync(ADB, ['shell', 'mkdir', '-p', remote], { env });
    for (const f of fs.readdirSync(dir)) {
        execFileSync(ADB, ['push', path.join(dir, f), `${remote}/${f}`], { env, stdio: 'ignore' });
    }
    // 让相册立刻看到新文件（Android 14 上逐个文件触发扫描）
    for (const f of fs.readdirSync(dir).filter(f => /\.(jpg|mp4)$/.test(f))) {
        execFileSync(ADB, ['shell', 'am', 'broadcast', '-a', 'android.intent.action.MEDIA_SCANNER_SCAN_FILE',
            '-d', `file://${remote}/${f}`], { env, stdio: 'ignore' });
    }
    return remote;
}

(async () => {
    const args = process.argv.slice(2);
    const doPush = args.includes('--push');
    const q = JSON.parse(fs.readFileSync(QUEUE, 'utf8'));
    let posts;
    const fi = args.indexOf('--from'), ti = args.indexOf('--to');
    if (fi >= 0) {
        const from = args[fi + 1], to = ti >= 0 ? args[ti + 1] : '9999-12-31';
        posts = q.posts.filter(p => p.date >= from && p.date <= to);
    } else {
        const id = args.find(a => !a.startsWith('--'));
        posts = q.posts.filter(p => p.id === id);
    }
    if (!posts.length) { console.error('❌ 队列里没有匹配的帖子'); process.exit(1); }
    for (const p of posts) {
        if (!p.caption) { console.log(`⏭  ${p.id}: 文案未写，跳过`); continue; }
        const dir = await pack(p);
        const files = fs.readdirSync(dir);
        let line = `✅ ${p.id}  ${files.filter(f => f.endsWith('.jpg')).length} 图${files.includes('reel.mp4') ? ' + reel' : ''}`;
        if (doPush) line += `  → 手机 ${push(dir, p.id)}`;
        console.log(line);
    }
})().catch(e => { console.error('❌', e.message); process.exit(1); });
