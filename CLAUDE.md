# VIIYD 4.0 — 商业网站架构约定

成都战锤微缩模型涂装委托工作室的双语（zh/en）Hugo 站点。**这是赚钱的商业站**，下面的约定是踩坑后固化的，改动前必须理解为什么。

> 4.0 改版的完整过程、待办与占位登记见 `DOCS/REDESIGN_4.0_PLAN.md` 与 `DOCS/REDESIGN_4.0_PLACEHOLDERS.md`。
> 本文件只写「长期成立的约定」，不复述改版过程。

## 图片三级加载架构（不可破坏）

所有作品图存 R2（`photo.viiyd.com`），按访问场景分三级加载：

| 场景 | 加载什么 | 大小 | 由谁产生 |
|------|---------|------|---------|
| 列表缩略图 / 卡片 | `cdn-cgi/image/width=200..800` 实时缩放 | ~8-50KB | `optimized-image` partial 的 `width` 参数 |
| 页面浏览（主图 / 图集 / 灯箱初开） | `[NAME]_web.webp` 1600px 预生成 | ~110-270KB | `rename_images.js` 生成并上传 |
| 灯箱内**双击放大后** | `[NAME].webp` 高清原图 | ~0.7-2.4MB | 仅此时加载，浏览器缓存 |

- 模板里**任何** `photo.viiyd.com` 图片都必须经过 `layouts/partials/optimized-image.html`，禁止直接 `<img src="{{ .Params.cover }}">`（曾导致列表页 60MB）。
- `optimized: true` 的页面走 `_web` 后缀；旧页面/无 `_web` 的走 cdn-cgi 1600px 兜底。
- 原图只在灯箱 `toggleZoom()` 时通过 `data-full-res` 加载——**这是有意设计**：用户要看笔触细节时才付出流量。
- 关于页的实景照走另一条路：它们是 page bundle 里的 10–13MB 原始 JPEG，用 Hugo 的 `.Process "resize 1600x webp q80"` 构建期处理（产出 96–192KB）。**不要直接输出原图。**

## 灯箱契约（lightbox.js ↔ 模板）

`assets/js/lightbox.js` 绑定 `.lightbox-trigger` 类，按以下属性取图：
- `data-web-src` → 灯箱打开时显示（_web 版）
- `data-full-res` → **双击**放大时切换（原图）；再双击切回 `data-web-src`
- `data-src` → 兜底

底部常驻信息行读 `.plates-grid` 上的 `data-lb-meta` / `data-lb-cta`，读不到就整行不显示（英文站靠这个天然不出询价按钮）。

**排查提示**：灯箱元素由 JS 用纯内联样式创建，**没有 id 也没有 class**，用 `[id*=lightbox]` 之类选择器找不到它 —— 按 `position:fixed` + `z-index:9000` 去找。

## 作品页渲染逻辑（work/single.html）

- frontmatter `photos: N` > 0 时渲染图集网格（从 cover 推导 `[PREFIX]_01.._NN`），**正文 `.Content` 完全不渲染**。
- **不要引入 `gallery` 数组字段**替代这套推导 —— audit 脚本与 pre-commit 都守着 `photos`。
- `photos:` 漏写 = 布局退化 + 灯箱失效。展示页（cover 为 R2 `_NN` 格式）**必填** `photos:`。
- 内联 style 含 `/`（如 `aspect-ratio:4/5`）必须 `printf ... | safeCSS`，否则 Hugo 输出 `ZgotmplZ`。
- **`range` 里的 `$` 指向的是列表页，不是当前条目。** 进了 `{{ with .Params.cover }}` 之后 `.` 是字符串，要用条目标题必须先在 range 里 `{{ $t := .Title }}` 捕获，否则 56 张图会共用同一个 alt。

## 内容规范

- `tier` 枚举严格限定：`Battleline | Specialist | Spec Ops | Master | Legend`。文章类省略 tier 行，模板容忍缺失。
- `system` 枚举：`40k | old-world | aos | kill-team | joytoy | other`。同时是 Hugo taxonomy，产出 `/system/40k/` 落地页。
- **日期必须用当前真实系统时间且带时区。** 写 `date: 2026-09-03`（无时区=UTC 零点）在东八区凌晨会落在未来，**Hugo 直接不生成该页面** —— 症状很迷惑：`hugo list all` 能列出它，`public/` 里却没有文件。
- 内容文件**不要带 UTF-8 BOM**。Hugo 能吃，但任何按 `startsWith('---')` 解析 front matter 的脚本都会翻车。
- Markdown 里的 HTML 不能缩进（会渲染成代码块）。
- 完整模板：`DOCS/WORK_TEMPLATE.md`；发布流程：`.agent/workflows/publishing.md`。

## 前端约定（4.0）

- CSS 三层，顺序不能换：`tokens.css`（令牌）→ `base.css`（全局元素与版式）→ `components.css`（组件），由 `head.html` 用 `resources.Concat` 合并。
- **六色锁定**，不引入第七种：墨 `#0E1113` / 天水碧 `#5AA4AE` / 朱砂 `#FF4C00` / 缃色 `#F0C239` / 月白 `#D6ECF0` / 墨灰 `#758A99`。朱砂只用于按钮永不用于段落；缃色只给 Legend 与 logo。
- **全站 0 圆角 0 阴影**，唯二例外：logo 圆环 `border-radius:50%`、Legend 条 `box-shadow: inset 2px 0 0 var(--gold)`。
- **限宽 `--content-max: 1440px`**，推翻了设计稿的「全宽」（理由见 PLAN §2-E）。列表卡片统一裁切保持整齐；详情页主图 / 首屏 / 灯箱保留自然比例配 `max-height`。
- `[hidden]{display:none!important}` **不能删** —— 浏览器默认的 `[hidden]` 优先级极低，`.work-card{display:flex}` 就能顶掉它，筛选与视图切换全靠这条。
- 所有可点区域 ≥44px。微信内置浏览器没有 hover 兜底。
- 单一暗色主题，不做 light/dark 双分支。

## 定价与转化

- 全站只出现 `1 EIU = ¥40` 一处金额，其余一律只显示倍数。**EIU 怎么算、含不含组装地台运费，故意不写**（规格 §19）——这是商业策略不是文案缺失。
- 所有系数集中在 `data/pricing.yaml`，模板与 `estimator.js` 都从这里读，**任何地方都不要写死数字**。
- 估算器只输出 EIU，**不换算金额**（有意的摩擦，最后一步仍需联系）。
- 询价入口写 `data-wechat-open="<来源>"` 即可，`wechat.js` 用事件委托统一绑定并写 `?from=` 归因。三个入口共用同一个浮层实例。
- 浮层默认态：中文站 QR，英文站直落表单。**表单链路（Worker → D1 → Telegram）不要动**。
- 英文站按规格 §12 精简：不出 EIU 数字、不放估算器、询价改 Instagram。

## 质量门禁

- `node scripts/audit_content.js`——校验 `photos:`、tier 枚举、占位文案，非零退出。
- pre-commit hook（`.githooks/pre-commit`，经 `core.hooksPath` 启用）自动跑审计 + URL 空格检查。
- `npm run build` = 审计 + `hugo --gc --minify`。
- 改模板后验证：`hugo --gc --minify` 然后 grep `public/` 确认（`lightbox-trigger` 数量 = photos 数、无 `ZgotmplZ`、图片 URL 含 `_web`/`cdn-cgi`）。
  **注意 minify 后属性引号是「有条件保留」的**：普通值去引号（`class=work-card`），
  但值里含 `:` `/` 等字符时会保留（`property="og:image"`、`href="https://..."`）。
  grep 产物时两种形态都要兼容，写成 `property="?og:image"?` 这样 ——
  只写一种会得到「0 处」的假结论，这个坑已经栽过三次。
  另外 `grep -E` 的 `.` **默认不匹配换行**，用 `xxx.{0,400}` 截多行 HTML 会提前截断，
  看起来像「后面什么都没有」。查跨行结构用 Node/Python 读文件，别用 grep。
- **自动化浏览器里测不了两类东西**（标签页 `document.hidden === true`）：
  ① `requestAnimationFrame` 不触发（滚动吸顶那类效果）；
  ② **`setTimeout` 被节流到约 1 秒** —— 双击判定窗口 300ms 根本进不去，
  会误判成「双击放大坏了」。要测短间隔就用忙等 `while(Date.now()-t0<150){}`。
  另外 `getBoundingClientRect()` 全部归零（不算布局），可见性判断要用 `computedStyle.display`。
- **浏览器里像是「JS 完全没跑」时，先查 JS 的 MIME**：
  `curl -s -o /dev/null -w '%{content_type}' http://localhost:1313/js/archive.js`。
  本机注册表 `HKCR\.js` 没有 `Content Type` 键，陈旧的 hugo server 进程会把 JS 发成
  `text/plain`，Chrome 直接拒绝执行（控制台报 `Refused to execute script`）——
  **所有 JS 静默失效，浏览器断言会得到假失败**。重启 server 即恢复（`.css` 不受影响）。
  生产构建不受此影响：CF Pages 会发正确的 MIME。
- **`hugo server` 运行时不要跑 `hugo --gc --minify`** —— dev server 会往 `public/` 里回写，
  把 `http://localhost:1313/` 混进产物（语言别名的 redirect、sitemap 的 loc 都中过招）。
  验收生产产物前先 `taskkill //F //IM hugo.exe` 再 `rm -rf public && hugo --gc --minify`。
- **配置项静默失效是这个项目最常见的坑**，已栽三次：`enableRobotsTXT`、
  `defaultContentLanguage(InSubdir)` 都因为写在 `[params]` / `[languages.*]` 之后
  而变成了那张表的子键；taxonomy 写成复数名则取不到 front matter 的值。
  **三次都不报错、构建照样成功。** 改完配置用 `hugo config --format json` 核对实际生效值，
  别只看构建是否通过。
- 本地调试完记得 `taskkill //F //IM hugo.exe` —— 残留的 hugo server 会占着 1313 端口发陈旧内容，而新进程静默退到 1314，症状是浏览器拿到空页但 `curl` 正常。
- **`git push` 成功 ≠ 线上已更新**。CF Pages 是异步构建，push 只保证 GitHub 有了这次提交，
  不保证构建会成功、也不保证已经跑完。2026-09-03 实测栽过：删 `postcss.config.js`
  时判断「没有模板用到」——漏看了 `head.html:44` 的 `{{ $css = $css | css.PostCSS }}`
  （这行不受 `hugo.IsProduction` 限制，每次构建都跑）。本地 `hugo --gc --minify`
  一直不报错，是因为本地 `node_modules/.bin/postcss` 是改 `package.json` 前装的旧文件，
  没有 `npm ci` 过，**测的是假阴性**；CF Pages 每次都是干净 `npm clean-install`，
  连续 3 次 `Failure`，线上停在旧版本，而当时的回复一直在说"已推送"。
  **改完任何可能影响构建的文件（`package.json`/`postcss.config.js`/依赖）后，
  必须先 `rm -rf node_modules && npm ci && npm run build` 本地复现一次干净环境**，
  不能信本地残留的 `node_modules`。
  **push 后一定要用 `wrangler` 核实真实构建结果**，不能只看 `git push` 有没有报错：
  ```bash
  cd /f/my_ai/viiyd3.0
  npx wrangler pages deployment list --project-name=viiyd3-0   # 看最新几条 Status 列
  ```
  项目名 `viiyd3-0`，account id `48b4b98607fc35c1a9cca79b698cd3c9`（本机已 `wrangler login`，
  token 在 `%APPDATA%/xdg.config/.wrangler/config/default.toml`，可直接查 CF API 拿构建日志，
  见 `deployments/{id}/history/logs`）。`wrangler pages deployment list` 顶部几行是最新——
  `Status` 列出现 `Failure` 就是构建炸了，不是"还在排队"，要去 dash 链接看日志定位。
  排查同一类问题（模板里某个 `resources.*`/`css.*`/`js.*` 管道调用）时，
  **搜依赖包名不够**——PostCSS 的调用点写的是 Hugo 内建函数名 `css.PostCSS`，
  不含 `postcss` 这个字符串，`grep -rn postcss layouts/` 是搜不到的，
  要搜 `resources.Get|.Process|css\.|js\.Build` 这类管道函数本身。

## SEO 已固化的配置

- 标题/描述在 `hugo.toml` 按语言配置。`defaultContentLanguage = 'en'` 且不带子目录 —— **不要翻转**，56 个作品页的英文版占着根 URL 且已被索引（理由见 PLAN §2-A）。
- 路径保持 `/work/`，不要改成 `/works/`（同上）。
- `head.html` 包含：hreflang（en/zh-CN/x-default）、JSON-LD、og:image 站级兜底、favicon 全套、非阻塞字体。
- **往 `<script>` 里注入 Go 值，要分清两种情况**（2026-09-03 全站扫过一遍）：
  - 注入**对象/数组**（`var x = {{ $d | jsonify }}`）→ **必须加 `| safeJS`**。
    少了它模板会把 JSON 当 JS 字符串再转义一次，产出 `var x = "{\"k\":…}"` ——
    不报错、`JSON.parse` 也过得去，但拿到的是字符串不是对象，字段全 `undefined`。
    已在两处栽过：`head.html` 的 JSON-LD、`404.html` 的中文文案包。
  - 注入**已经包在引号里的字符串**（`btn.textContent = '{{ T "x" }}'`）→ **不要加 `safeJS`**。
    这里 Go 的转义正是需要的，它防止文案里的引号逃逸出字符串。
    加了 `safeJS` 等于关掉这层保护，是往 XSS 上走。
- **JSON-LD 必须先 `dict` 组装再整体 `jsonify | safeJS`**。在 `<script type="application/ld+json">`
  里逐字段写 `{{ . | jsonify }}`，Go 模板会当作 JS 字符串再转义一次，
  产出 `"url":"\"https://…\""` —— 能 JSON.parse，但每个值都带字面引号，结构化数据全废。
  这是 3.0 就有的问题，2026-09-03 才发现（此前只验了「能解析」，没验值）。
- 联系方式与渠道链接集中在 `data/contact.yaml`，留空的一律不渲染，不要在模板里硬编码。
- 页面结构：首页 · `/work/` · `/services/` · `/about/`，另有 `/tier/*` `/system/*` 分类页兼作投放落地页。旧路径 `/rates/` `/process/` `/contact/` `/painter/` 全部走 alias 重定向。

## 发布快速参考

```powershell
node scripts/rename_images.js ./need_upload [CODE] [YYYYMMDD]   # 转 WebP + 生成 _web
node scripts/fast_upload_r2.js ./need_upload viiyd-art-photos [YYYY]/[MM]/[CODE]
# 双语内容 content/work/[slug]/{index.md,index.zh.md}
# frontmatter 必含 photos: N、tier、system、delivered，date 用带时区的真实时间
hugo --gc --minify   # 本地验证
git add . && git commit && git push origin main   # pre-commit 自动审计
```
