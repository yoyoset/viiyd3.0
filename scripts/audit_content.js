const fs = require('fs');
const path = require('path');

const workDir = path.join(__dirname, '../content/work');
const tiers = new Set();
const issues = [];
const titles = [];

/* 4.0 新增的枚举与双语一致性记录。
   下面几条检查全部来自 2026-09 改版时真实栽过的坑 ——
   它们的共同点是「不报错、构建照样成功」，所以必须由门禁挡住。 */
const SYSTEM_ENUM = ['40k', 'old-world', 'aos', 'kill-team', 'joytoy', 'other'];
const bilingual = {};   // slug -> { 'index.md': {...}, 'index.zh.md': {...} }

function walk(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            walk(filePath);
        } else if (file.endsWith('.md')) {
            const raw = fs.readFileSync(filePath, 'utf8');
            const slug = path.basename(path.dirname(filePath));

            /* BOM：Hugo 能吃，但任何按 startsWith('---') 解析 front matter 的
               脚本都会翻车（迁移脚本第一次跑就被 27 个文件绊住）。 */
            if (raw.charCodeAt(0) === 0xFEFF) {
                issues.push({ file: slug + '/' + file, type: 'BOM',
                    detail: '文件带 UTF-8 BOM，会让 front matter 解析器失效' });
            }
            const content = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;

            /* 未来日期 → Hugo 静默跳过该页：hugo list 能列出它，public/ 里却没有文件。
               无时区的 `date: YYYY-MM-DD` 按 UTC 零点算，东八区凌晨写就会落在未来。 */
            const dateMatch = content.match(/^date:\s*(.+)$/m);
            if (dateMatch) {
                const d = new Date(dateMatch[1].trim());
                if (!isNaN(d) && d.getTime() > Date.now()) {
                    issues.push({ file: slug + '/' + file, type: 'FutureDate',
                        detail: `date ${dateMatch[1].trim()} 在未来，Hugo 不会生成该页` });
                }
            }

            /* system 枚举 + 双语一致性 */
            const sysMatch = content.match(/^system:\s*["']?([^"'\n]+)["']?/m);
            const delMatch = content.match(/^delivered:\s*["']?([^"'\n]+)["']?/m);
            if (sysMatch && !SYSTEM_ENUM.includes(sysMatch[1].trim())) {
                issues.push({ file: slug + '/' + file, type: 'InvalidSystem',
                    detail: `system "${sysMatch[1].trim()}" 不在枚举内: ${SYSTEM_ENUM.join(' | ')}` });
            }
            if (file === 'index.md' || file === 'index.zh.md') {
                bilingual[slug] = bilingual[slug] || {};
                bilingual[slug][file] = {
                    system: sysMatch ? sysMatch[1].trim() : null,
                    delivered: delMatch ? delMatch[1].trim() : null,
                };
            }

            /* 2026-09-03：涂装等级已从产品中移除（每一单都是定制）。
               front matter 里的 tier 字段保留作历史数据但前端不渲染，
               所以这里降级为「有就校验拼写、没有也不报错」，不再阻断。 */
            const TIER_ENUM = ['Battleline', 'Specialist', 'Spec Ops', 'Master', 'Legend'];
            const tierMatch = content.match(/^tier:\s*["']?([^"'\n]+)["']?/m);
            if (tierMatch) {
                const tier = tierMatch[1].trim();
                tiers.add(tier);
                if (!TIER_ENUM.includes(tier)) {
                    issues.push({ file: slug + '/' + file, type: 'InvalidTier', detail: `tier "${tier}" is not in the enum: ${TIER_ENUM.join(' | ')}` });
                }
            }

            if (file.endsWith('.zh.md')) {

                // Check Title
                const titleMatch = content.match(/^title:\s*["']?([^"'\n]+)["']?/m);
                if (titleMatch) {
                    const title = titleMatch[1];
                    // Simple heuristic: if title has no Chinese characters, flag it
                    if (!/[一-龥]/.test(title)) {
                        titles.push({ file: slug, title: title });
                    }
                }

                // Check Bad Keywords
                if (content.includes('待确认') || content.includes('To be confirmed') || content.includes('Automated migrated content')) {
                    issues.push({ file: slug, type: 'Placeholder' });
                }
            }

            // Check lightbox wiring (both languages): showcase pages whose cover
            // follows the R2 `[PREFIX]_NN.webp` pattern render their gallery from
            // the `photos: N` plates grid in layouts/work/single.html. Missing
            // `photos:` drops the page to the raw .Content branch = broken layout
            // (the June-2026 regression). Pages with non-R2 covers (e.g. local
            // guide articles) legitimately rely on shortcodes and are exempt.
            const coverMatch = content.match(/^cover:\s*["']?(https:\/\/photo\.viiyd\.com\/\S*_\d+\.(webp|jpe?g|png))["']?/m);
            const usesLightbox = content.includes('{{< lightbox');
            const hasPhotos = /^photos:\s*\d+/m.test(content);
            if (coverMatch && usesLightbox && !hasPhotos) {
                issues.push({ file: slug + '/' + file, type: 'MissingPhotos', detail: 'uses {{< lightbox >}} but has no `photos: N` — lightbox will not work' });
            }
        }
    });
}

walk(workDir);


/* ── CSS 产物结构门禁（2026-09-03 加）──────────────────────────
   起因：删一个未用的类时，正则把声明块也吃掉了，留下两个悬空选择器
   串到下一条规则上 —— 英文站所有主标题被渲染成 15px 正文，**已经进了生产**。
   而当时的「括号配平检查」是通过的：括号确实是平的，选择器合并不破坏括号。
   所以配平查不出这类错，只能对产物断言「关键规则必须长什么样」。 */

/* ── JS 语法门禁（2026-09-03 加）──────────────────────────────
   起因：lightbox.js 里有可选链 `?.`、可选 catch 绑定等 ES2020 语法。
   微信 X5 内核（常见 Chromium 86，长尾更旧）遇到这些是**解析期**错误 ——
   整个文件一行都不执行。表现是灯箱彻底不工作，而 .plate 的 href 指向
   0.7–2.4MB 原图，用户每点一张图就跳走下载一次。
   这类错本地测不出来（本机 Chrome 全都支持），只能靠静态门禁挡。 */
function auditJSSyntax() {
  const jsDir = path.join(__dirname, '..', 'assets', 'js');
  if (!fs.existsSync(jsDir)) return;

  const BANNED = [
    { re: /[\w\)\]]\?\./,          name: '可选链 ?.',        need: 'Chrome 80' },
    { re: /\?\?[^=]/,                name: '空值合并 ??',      need: 'Chrome 80' },
    { re: /catch\s*\{/,              name: '可选 catch 绑定',  need: 'Chrome 66' },
    { re: /\[\s*\.\.\.[a-zA-Z_$][\w$]*\.querySelectorAll/, name: '扩展 NodeList', need: 'NodeList 可迭代' },
    { re: /globalThis/,          name: 'globalThis',       need: 'Chrome 71' },
    { re: /\.replaceAll\(/,          name: 'String.replaceAll', need: 'Chrome 85' },
    { re: /\.at\(\s*-/,             name: 'Array.at(负数)',    need: 'Chrome 92' },
    { re: /structuredClone/,     name: 'structuredClone',  need: 'Chrome 98' },
  ];

  fs.readdirSync(jsDir).filter(f => f.endsWith('.js')).forEach(f => {
    const src = fs.readFileSync(path.join(jsDir, f), 'utf8');
    /* 去掉注释再匹配，免得注释里提到 ?. 就误报 */
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    BANNED.forEach(b => {
      if (b.re.test(code)) {
        issues.push({ file: 'assets/js/' + f, type: 'JSSyntaxTooNew',
          detail: `用了 ${b.name}（需 ${b.need}）—— 微信内核解析失败会让整个文件不执行` });
      }
    });
  });
}

function auditBuiltCSS() {
  const cssDir = path.join(__dirname, '..', 'public', 'css');
  if (!fs.existsSync(cssDir)) return;   // 没构建过就跳过，不阻塞
  /* public/css 会堆积历史 hash 文件，随便挑一个可能查的是旧产物。
     必须从首页 HTML 里读出当前真正引用的那个文件名。 */
  const home = path.join(__dirname, '..', 'public', 'index.html');
  if (!fs.existsSync(home)) return;
  /* dev server 构建不做 fingerprint，产物是 /css/viiyd.css；
     生产构建才是 viiyd.min.<hash>.css。两种都要认，
     否则 pre-commit 在 public/ 恰好是 dev 产物时会误拒提交。 */
  const ref = fs.readFileSync(home, 'utf8').match(/\/css\/(viiyd(?:\.min)?\.[a-f0-9.]*css)/);
  if (!ref) {
    issues.push({ file: 'public/index.html', type: 'CSSInvariant',
      detail: '首页没有引用 viiyd.min.*.css —— CSS 管线断了' });
    return;
  }
  const file = ref[1];
  const p2 = path.join(cssDir, file);
  if (!fs.existsSync(p2)) {
    issues.push({ file: 'public/css/' + file, type: 'CSSInvariant',
      detail: '首页引用的 CSS 文件不存在' });
    return;
  }
  /* 必须先剥掉 CSS 注释：dev 构建不压缩，注释会保留，
     而注释里正好写着 `:lang(en) …` 这类示例 —— 正则会匹配到注释文本，
     产生和真 bug 一模一样的报错（实测栽过）。 */
  const css = fs.readFileSync(p2, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  /* 每条断言 = 一个「曾经坏过或坏了代价很大」的不变式 */
  const invariants = [
    { name: 'display-1 保留自己的字号',
      re: /(^|\})[^{}]*\.display-1[^{}]*\{[^}]*--fs-display-1/ },
    { name: ':lang(en) 规则只管字体不管字号',
      test: () => {
        const m = css.match(/:lang\(en\)[^{]*\{([^}]*)\}/);
        return m ? !/font-size/.test(m[1]) : true;
      } },
    { name: '[hidden] 带 !important（筛选与视图切换全靠它）',
      re: /\[hidden\]\s*\{\s*display\s*:\s*none\s*!important\s*;?\s*\}/ },
    { name: '限宽容器 --content-max 存在',
      re: /--content-max:\s*1440px/ },
  ];

  invariants.forEach(v => {
    const ok = v.test ? v.test() : v.re.test(css);
    if (!ok) issues.push({ file: 'public/css/' + file, type: 'CSSInvariant',
      detail: `产物 CSS 不满足：${v.name}` });
  });
}

const report = {
    tiers: Array.from(tiers),
    titles: titles,
    issues: issues
};
fs.writeFileSync('audit_report.json', JSON.stringify(report, null, 2));
/* system / delivered 是事实性字段，双语必须一致 ——
   不一致会导致同一个委托单在两种语言下落进不同分类页。 */
Object.entries(bilingual).forEach(([slug, langs]) => {
    const en = langs['index.md'], zh = langs['index.zh.md'];
    if (!en || !zh) return;
    ['system', 'delivered'].forEach(k => {
        if (en[k] !== zh[k]) {
            issues.push({ file: slug, type: 'BilingualMismatch',
                detail: `${k}: en="${en[k]}" vs zh="${zh[k]}" —— 事实性字段双语必须一致` });
        }
    });
});


console.log('Report written to audit_report.json');

/* CSS 产物门禁必须在汇总之前跑 —— 上一版忘了调用，等于白加 */
auditBuiltCSS();
auditJSSyntax();

if (issues.length) {
    console.log(`\n⚠  ${issues.length} issue(s) found:`);
    issues.forEach(i => console.log(`   [${i.type}] ${i.file}${i.detail ? ' — ' + i.detail : ''}`));
    /* 会导致「页面坏掉但构建成功」的问题一律阻断提交。
       Placeholder 只是提醒（占位文案本来就允许暂存），不阻断。 */
    const BLOCKING = ['MissingPhotos', 'InvalidSystem',
                      'BOM', 'FutureDate', 'BilingualMismatch', 'CSSInvariant', 'JSSyntaxTooNew'];
    const hit = [...new Set(issues.filter(i => BLOCKING.includes(i.type)).map(i => i.type))];
    if (hit.length) {
        const FIX = {
            MissingPhotos:     'add `photos: N` to the frontmatter (N = number of _01.._NN images).',
            InvalidTier:       'use one of Battleline | Specialist | Spec Ops | Master | Legend.',
            InvalidSystem:     'use one of 40k | old-world | aos | kill-team | joytoy | other.',
            BOM:               '去掉开头的 UTF-8 BOM（migrate_4_0.js --apply 会顺手清）。',
            FutureDate:        'date 用带时区的当前真实时间，例如 2026-09-03T14:20:00+08:00。',
            BilingualMismatch: 'system / delivered 双语必须写同一个值。',
            JSSyntaxTooNew:    '把该语法降级成 ES5/ES2017 写法 —— 微信内核解析失败会让整个 JS 文件不执行。',
            CSSInvariant:      '产物 CSS 的关键规则被破坏 —— 多半是删/改 CSS 时正则连声明块一起吃掉了，去看那条规则。',
        };
        console.log('');
        hit.forEach(t => console.log('   ' + t + ' fix: ' + FIX[t]));
        process.exitCode = 1;
    }
} else {
    console.log('No issues found.');
}
