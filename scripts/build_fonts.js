#!/usr/bin/env node
/**
 * VIIYD 4.0 · 中文字体子集化（占位表 P15）
 *
 * 为什么要做（实测依据，2026-09-03）：
 * - Google 已把 Noto Serif SC / Sans SC 各切成 202 个 unicode-range 分片，
 *   字体文件本身不算大 —— 但**那份 @font-face CSS 本身就 454KB**。
 * - 更要命的是国内访问 fonts.googleapis.com 不可靠，而客户几乎全在国内微信里打开链接。
 * - 站内实测只用到约 900 个 CJK 字符，子集完全可控。
 *
 * 做法：向 Google Fonts 传 `text=` 参数拿到只含这些字的 woff2，下载后自托管。
 *
 * **必须分块请求**（踩过的坑）：989 个汉字 URL-encode 后接近 9KB，
 * 超长 URL 会被静默截断 —— 表现是「拿到了字体，但只有 2.7KB」，
 * 看着像成功，实际大部分字都没进子集。每块 200 字，逐块取。
 * Google 每块会返回带 `unicode-range` 的 @font-face，直接沿用它的分片信息，
 * 浏览器就只下载当前页面用得到的那几块 —— 与 Google 自己的切片策略一致。
 *
 * 已知取舍（不是遗漏）：
 * - 子集是**冻结**的。新增作品若用到子集外的字，会回退到系统 serif/sans。
 *   所以这个脚本要在内容更新后重跑 —— 已挂进 `npm run build`。
 * - 回退链写成 `'VIIYD Serif', serif`，不再挂 Google 的 CDN 兜底，
 *   否则 454KB 的 CSS 又回来了，等于白做。
 *
 * ⚠️ 当前状态：**未投产**。见文件末尾的「实测阻碍」。
 *
 * 用法：先 hugo 构建出 public/，再 node scripts/build_fonts.js
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'static', 'fonts');
const CSS_OUT = path.join(__dirname, '..', 'assets', 'css', 'fonts.css');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/* 要子集化的中文字体。拉丁与 mono 字符集小，一并本地化省事。 */
const FACES = [
  { family: 'Noto Serif SC', weights: ['900'], local: 'VIIYD Serif',  file: 'viiyd-serif-900',  cjk: true },
  { family: 'Noto Serif SC', weights: ['700'], local: 'VIIYD Serif',  file: 'viiyd-serif-700',  cjk: true, weight: 700 },
  { family: 'Noto Sans SC',  weights: ['400'], local: 'VIIYD Sans',   file: 'viiyd-sans-400',   cjk: true },
  { family: 'Noto Sans SC',  weights: ['500'], local: 'VIIYD Sans',   file: 'viiyd-sans-500',   cjk: true, weight: 500 },
];

function collectChars() {
  const files = [];
  (function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) files.push(p);
    }
  })(path.join(__dirname, '..', 'public'));

  if (!files.length) {
    console.error('✗ public/ 里没有 HTML —— 先跑 hugo 构建再执行本脚本');
    process.exit(1);
  }

  const set = new Set();
  for (const f of files) {
    const html = fs.readFileSync(f, 'utf8')
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<style[\s\S]*?<\/style>/g, '')
      .replace(/<[^>]+>/g, ' ');
    for (const ch of html) {
      const c = ch.codePointAt(0);
      if (c < 0x20) continue;
      set.add(ch);      // 拉丁字母数字标点也一并带上，中英混排才不会掉字
    }
  }
  return [...set].sort().join('');
}

const CHUNK = 200;   // 每块字数。再大 URL 就有被截断的风险

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* Google 对连发请求会直接掐连接（实测 80 次连发必断），所以要重试 + 节流 */
async function grab(url, asBuffer) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return asBuffer ? Buffer.from(await res.arrayBuffer()) : await res.text();
    } catch (e) {
      if (attempt === 4) throw e;
      await sleep(600 * attempt);
    }
  }
}

async function fetchSubset(face, chars) {
  const slices = [];
  let total = 0, idx = 0;

  for (let i = 0; i < chars.length; i += CHUNK) {
    const part = chars.slice(i, i + CHUNK);
    const url = 'https://fonts.googleapis.com/css2'
      + `?family=${encodeURIComponent(face.family)}:wght@${face.weights[0]}`
      + `&text=${encodeURIComponent(part)}`;

    const css = await grab(url, false);
    await sleep(120);
    const urlM   = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);
    const rangeM = css.match(/unicode-range:\s*([^;]+);/);
    if (!urlM) throw new Error(`拿不到 ${face.family} ${face.weights[0]} 第 ${idx} 块`);

    const buf  = await grab(urlM[1], true);
    await sleep(120);

    /* 体积闸门：真正的子集每片应在几十 KB 量级。
       Google 的 /l/font?kit= 是一次性短时 token，失效时会回吐完整字体（数 MB）
       甚至 0 字节 —— 两种都必须当成失败，否则会悄悄写出 100MB 的假子集。 */
    if (buf.length === 0) throw new Error(`${face.family} 第 ${idx} 块返回 0 字节（kit token 已失效）`);
    if (buf.length > 500 * 1024) {
      throw new Error(
        `${face.family} 第 ${idx} 块 ${(buf.length / 1024 / 1024).toFixed(1)}MB —— ` +
        `拿到的是完整字体不是子集，kit token 已失效。见脚本末尾「实测阻碍」。`
      );
    }
    const name = `${face.file}-${idx}.woff2`;
    fs.writeFileSync(path.join(OUT_DIR, name), buf);

    slices.push({ name, range: rangeM ? rangeM[1].trim() : null });
    total += buf.length;
    idx++;
  }
  return { slices, size: total };
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const chars = collectChars();
  console.log(`站内唯一字符: ${chars.length}`);

  const rules = ['/* 由 scripts/build_fonts.js 生成 —— 不要手改，改了下次构建会被覆盖 */'];
  let total = 0;

  for (const face of FACES) {
    const { slices, size } = await fetchSubset(face, chars);
    total += size;
    console.log(`  ${face.family} ${face.weights[0]} → ${slices.length} 片 · ${(size / 1024).toFixed(1)}KB`);
    for (const s of slices) {
      rules.push(
        '@font-face{',
        `  font-family:'${face.local}';`,
        `  font-weight:${face.weight || face.weights[0]};`,
        '  font-style:normal;',
        '  font-display:swap;',
        `  src:url('/fonts/${s.name}') format('woff2');`,
        ...(s.range ? [`  unicode-range:${s.range};`] : []),
        '}'
      );
    }
  }

  fs.writeFileSync(CSS_OUT, rules.join('\n') + '\n');
  console.log(`合计 ${(total / 1024).toFixed(1)}KB → static/fonts/`);
  console.log(`@font-face 写入 assets/css/fonts.css`);
})();

/* ─── 实测阻碍（2026-09-03，占位表 P15）────────────────────────────
 *
 * 这条路走不通，记录下来免得下次重走：
 *
 * 1. Google Fonts 的 `text=` 参数**确实有效** —— 返回的 @font-face 带着
 *    精确到所请求字符的 unicode-range，指向 `https://fonts.gstatic.com/l/font?kit=…`。
 * 2. 但 URL 有长度上限。989 个汉字 encode 后接近 9KB，**会被静默截断**：
 *    表现是「成功拿到字体，只有 2.7KB」，看着像成功，实际大部分字没进去。
 *    分成每块 200 字可以绕开。
 * 3. 真正的死路在这里：`/l/font?kit=…` 的 token **是一次性且短时的**。
 *    脚本连发 80 次请求时，前面若干块能拿到子集，后面 token 失效后
 *    同一个 URL 会**回吐完整字体（每片 4.5MB）**，最后写出 100MB 的假子集；
 *    再过一会儿同一 URL 又变成返回 0 字节。它不是可编程的稳定接口。
 *
 * 可行路径（需要先装工具，所以留给用户拍板）：
 *   a) `pip install fonttools brotli` + 下载 Noto Serif/Sans SC 源字体，
 *      用 `pyftsubset --text-file=… --flavor=woff2` 本地子集化。最可靠。
 *   b) npm 装 `subset-font`（内置 harfbuzz，纯离线），同样需要源字体文件。
 *   两条都要把约 30MB 的源字体放进仓库或构建缓存，需要决定放哪、要不要提交。
 *
 * 在此之前站点继续用 Google Fonts CDN —— 能用，但国内访问不可靠，
 * 且那份 @font-face CSS 本身就 454KB（实测）。
 * ──────────────────────────────────────────────────────────── */
