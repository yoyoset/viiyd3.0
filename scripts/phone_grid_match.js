/**
 * 相册选图对号 —— 手机相册网格里每一格是 outbox 的第几张
 *
 * 用法:
 *   node scripts/phone_grid_match.js <截图.png> <post-id> <网格顶 y> [行数=4] [列数=3]
 *   截图用原始 1080 宽（adb exec-out screencap -p），不要缩过的。
 *
 * 为什么要有它：App 相册按文件修改时间排，同一秒推上去的 9 张顺序是乱的
 * （2026-10-13 抖音实测：09,07,08,05,06,03,04,01,02）。以前靠人眼对缩略图，
 * 同一个模型的 8 个角度很容易认错；这里把每格缩成 24×24 灰度和 outbox 逐张比差值。
 * 实测对的那张 d≈11，其余都 >30，差距够大；d>25 说明这格不是这一组的图。
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const [shot, id, top, rows = 4, cols = 3] = process.argv.slice(2);
if (!shot || !id || !top) { console.error('用法: node scripts/phone_grid_match.js <截图.png> <post-id> <网格顶 y> [行数] [列数]'); process.exit(1); }
const dir = path.resolve(__dirname, '../private/social/outbox', id);
const N = 24;
const vec = async img => [...await img.resize(N, N, { fit: 'fill' }).greyscale().raw().toBuffer()];

(async () => {
    const cell = Math.floor(1080 / cols);
    const refs = [];
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jpg'))) {
        // 相册缩略图是居中裁成的正方形
        const m = await sharp(path.join(dir, f)).metadata();
        const s = Math.min(m.width, m.height);
        refs.push([f, await vec(sharp(path.join(dir, f)).extract({ left: (m.width - s) >> 1, top: (m.height - s) >> 1, width: s, height: s }))]);
    }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const v = await vec(sharp(shot).extract({ left: c * cell + 10, top: +top + r * cell + 10, width: cell - 20, height: cell - 20 }));
        const sc = refs.map(([f, rv]) => [f, Math.round(rv.reduce((a, x, i) => a + Math.abs(x - v[i]), 0) / (N * N))]).sort((a, b) => a[1] - b[1]);
        const hit = sc[0][1] <= 25;
        console.log(`行${r} 列${c}  格心(${c * cell + (cell >> 1)},${+top + r * cell + (cell >> 1)})  ${hit ? sc[0][0] : '—'}  d=${sc[0][1]}`);
    }
})().catch(e => { console.error('❌', e.message); process.exit(1); });
