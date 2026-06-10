# VIIYD 3.0 — 商业网站架构约定

成都战锤微缩模型涂装委托工作室的双语（en/zh）Hugo 站点。**这是赚钱的商业站**，下面的约定是踩坑后固化的，改动前必须理解为什么。

## 图片三级加载架构（不可破坏）

所有作品图存 R2（`photo.viiyd.com`），按访问场景分三级加载：

| 场景 | 加载什么 | 大小 | 由谁产生 |
|------|---------|------|---------|
| 列表缩略图 / 卡片 | `cdn-cgi/image/width=200..800` 实时缩放 | ~8-50KB | `optimized-image` partial 的 `width` 参数 |
| 页面浏览（hero/plates/灯箱初开） | `[NAME]_web.webp` 1600px 预生成 | ~110-270KB | `rename_images.js` 生成并上传 |
| 灯箱内**点击放大后** | `[NAME].webp` 高清原图 | ~1.4-2.4MB | 仅此时加载，浏览器缓存 |

- 模板里**任何** `photo.viiyd.com` 图片都必须经过 `layouts/partials/optimized-image.html`，禁止直接 `<img src="{{ .Params.cover }}">`（曾导致列表页 60MB）。
- `optimized: true` 的页面走 `_web` 后缀；旧页面/无 `_web` 的走 cdn-cgi 1600px 兜底。
- 原图只在灯箱 `toggleZoom()` 时通过 `data-full-res` 加载——**这是有意设计**：用户要看笔触细节时才付出流量。

## 灯箱契约（lightbox.js ↔ 模板）

`assets/js/lightbox.js` 绑定 `.lightbox-trigger` 类，按以下属性取图：
- `data-web-src` → 灯箱打开时显示（_web 版）
- `data-full-res` → 点击放大时切换（原图）；缩小切回 `data-web-src`
- `data-src` / `<img src>` → 兜底

产出 trigger 的两个地方：`layouts/work/single.html` 的 plates 网格（主路径）和 `layouts/shortcodes/lightbox.html`（安全网）。**两处都必须保留 `lightbox-trigger` 类**——2026-06 曾因短代码缺类导致 9 个页面无法点击放大。

## 作品页渲染逻辑（work/single.html）

- frontmatter `photos: N` > 0 时渲染 plates 网格（从 cover 推导 `[PREFIX]_01.._NN`），**正文 `.Content` 完全不渲染**。
- `photos:` 漏写 = 布局退化 + 灯箱失效。展示页（cover 为 R2 `_NN` 格式）**必填** `photos:`。
- 正文里的 `{{< lightbox >}}` 短代码只是冗余备份。
- 内联 style 含 `/`（如 `aspect-ratio:4/5`）必须 `printf ... | safeCSS`，否则 Hugo 输出 `ZgotmplZ`。

## 内容规范

- `tier` 枚举严格限定：`Battleline | Specialist | Spec Ops | Master | Legend`。文章类（如指南）省略 tier 行，模板容忍缺失。
- 日期必须用当前真实系统时间（Hugo 跳过未来日期内容）。
- Markdown 里的 HTML 不能缩进（会渲染成代码块）。
- 完整模板：`DOCS/WORK_TEMPLATE.md`；发布流程：`.agent/workflows/publishing.md`。

## 质量门禁

- `node scripts/audit_content.js`——校验 `photos:`（MissingPhotos）、tier 枚举（InvalidTier）、占位文案，非零退出。
- pre-commit hook（`.githooks/pre-commit`，经 `core.hooksPath` 启用）自动跑审计 + URL 空格检查。
- `npm run build` = 审计 + `hugo --gc --minify`。
- 改模板后验证：`hugo --gc --minify` 然后 grep `public/` 确认（如 `lightbox-trigger` 数量 = photos 数、无 `ZgotmplZ`、图片 URL 含 `_web`/`cdn-cgi`）。

## SEO 已固化的配置

- 标题/描述在 `hugo.toml` 按语言配置（关键词：Warhammer/战锤、miniature painting commission/涂装委托、NMM、OSL、成都）。
- `head.html` 包含：hreflang（en/zh-CN/x-default）、JSON-LD（首页 ProfessionalService、作品页 VisualArtwork）、og:image 站级兜底（`params.ogImage`）、favicon 全套、非阻塞字体。
- `params.cfBeaconToken` 填入后启用 Cloudflare Web Analytics（wrangler OAuth 无 RUM 权限，token 只能 dashboard 手取）。

## 发布快速参考

```powershell
node scripts/rename_images.js ./need_upload [CODE] [YYYYMMDD]   # 转 WebP + 生成 _web
node scripts/fast_upload_r2.js ./need_upload viiyd-art-photos [YYYY]/[MM]/[CODE]
# 双语内容 content/work/[slug]/{index.md,index.zh.md}，frontmatter 必含 photos: N
hugo --gc --minify   # 本地验证
git add . && git commit && git push origin main   # pre-commit 自动审计
```
