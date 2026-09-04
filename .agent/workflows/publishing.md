---
description: VIIYD 3.0 内容发布流水线 (Image → R2 → Hugo → Git → Social)
---

# Workflow: VIIYD 3.0 Content Publishing Pipeline
# 状态: Active | 版本: 3.3

// turbo-all

## 0. 前置检查

在开始发布前，确认以下事项：
- [ ] 本地 Hugo 环境可正常 `hugo server` 运行
- [ ] Git 远程仓库连接正常
- [ ] Wrangler 已配置 (`npx wrangler whoami`)

---

## 1. 图片预处理 (Image Preprocessing)

### 1.1 放置原始图片
将相机导出的图片放入 `need_upload/` 文件夹

### 1.2 批量处理与 WebP 转换
```powershell
cd F:\my_ai\viiyd3.0
# 参数: [源文件夹] [项目代码] [可选日期YYYYMMDD]
node scripts/rename_images.js ./need_upload [PROJECT_CODE] 20260318
```

**输出说明:**
- 格式: `viiyd[DATE][CODE]_[NN].webp` (高清原图，90%质量)
- 缩略图: `viiyd[DATE][CODE]_[NN]_web.webp` (1600px，80%质量)
- **优势**: 本地预生成缩略图，完全避开 CDN 实时缩放费用。

---

## 2. 资产上传 (Asset Upload)

### 2.1 上传到 R2 (带 --remote 参数)

R2 存储结构: `viiyd-art-photos/[YYYY]/[MM]/[CODE]/`

```powershell
# 必须加 --remote 确保上传到生产环境
node scripts/fast_upload_r2.js ./need_upload viiyd-art-photos [YYYY]/[MM]/[CODE]
```

> **示例:**
> ```powershell
> node scripts/fast_upload_r2.js ./need_upload viiyd-art-photos 2026/03/lion
> ```

> [!IMPORTANT]
> **格式要求**: 全部图片必须为 `.webp`。

### 2.2 验证上传
直接访问 `https://photo.viiyd.com/[YYYY]/[MM]/[CODE]/[FILENAME]` 确认

### 2.3 清理本地
上传成功后可选择清空 `need_upload/`:
```powershell
Remove-Item "F:\mysite\viiyd3.0\need_upload\*" -Force
```

### 2.4 360° 展示视频（可选，强烈推荐）

360° 视频是高毛利加售项，也是社媒最强素材，有条件每个项目都做。

**R2 存储约定:** `viiyd-art-photos/video/[slug简称].mp4`（扁平目录，不按日期分层）

```powershell
# 上传视频（fast_upload_r2.js 只认图片扩展名，视频必须用 wrangler 直传）
wrangler r2 object put viiyd-art-photos/video/[NAME].mp4 --file "[本地视频路径]" --remote
```

> **示例（Bloodcrushers 实际发布记录）:**
> ```powershell
> wrangler r2 object put viiyd-art-photos/video/bloodcrushers.mp4 --file "F:\shortvideo\Bloodcrushers-30s.mp4" --remote
> ```
> 访问 `https://photo.viiyd.com/video/[NAME].mp4` 验证。

**接入页面 — frontmatter 加一行（双语两个文件都要加）:**

```yaml
video_360: "https://photo.viiyd.com/video/[NAME].mp4"
```

- 模板 `layouts/work/single.html` 的 `04a · 360° video(s)` 区块自动渲染：16:9 容器、autoplay/loop/muted/playsinline + controls，位置在 Field Notes 之后、Plates 网格之前。
- 双视频场景（如寂静王的本体+石碑）：第二条用 `video_360_menhir` 字段，自动变双列网格。
- **视频规格建议**: 15-30 秒、1080p、H.264 MP4、20-40MB。转台匀速一圈，深色背景与站点视觉一致。

**验证:** 构建后 `grep -o "video src=[^ ]*" public/work/[slug]/index.html` 应输出视频 URL；中英两个页面都要查。

---

## 3. 内容创建 (Content Generation)

### 3.1 Slug 命名规范
格式: `[主题]-[细节]-[类型]`
- 全小写、连字符分隔
- 包含 SEO 关键词
- 示例: `bullgryns-ash-wastes-desert-conversion`

### 3.2 创建 Work 目录
```powershell
mkdir "F:\mysite\viiyd3.0\content\work\[project-slug]"
```

### 3.3 生成双语页面
参考 `DOCS/WORK_TEMPLATE.md` 创建:
- `content/work/[slug]/index.md` (English)
- `content/work/[slug]/index.zh.md` (Chinese)

### 3.4 Frontmatter Schema

```yaml
---
title: "[Project Name]: [Subtitle]"
date: YYYY-MM-DDTHH:MM:SS+08:00
summary: "[One-line summary, max 100 chars]"
tags: ["Category", "Faction", "Unit Type"] 
cover: "https://photo.viiyd.com/[YYYY]/[MM]/[CODE]/[FILENAME].webp"
layout: "project"
photos: N  # 必填！= 画廊图片张数 (_01.._NN)。驱动 plates 网格和灯箱；漏写则页面布局错误且无法点击放大
optimized: true  # 必须开启，启用本地 WebP 缩略图同步
tier: "[Battleline|Specialist|Spec Ops|Master|Legend]"
system: "[40k|old-world|aos|kill-team|joytoy|other]"  # 4.0 必填。漏写这单不进任何分类页
delivered: "YYYY.MM"  # 4.0 必填。交付月，列表倒序依据。**双语必须写同一个值**
eiu: N  # 4.0 选填。定价系数拍板前可留空，留空即不显示
time_log: "XXh XXm"
model_count: N
paints:
  - name: "Paint Name"
    role: "[BASE|LAYER|SHADE|HIGHLIGHT|METALLIC|CONTRAST|DETAIL]"
    hex: "#XXXXXX"
    link: "https://..."
description: "[SEO description, 150-200 chars]"
---
```

### 3.5 Body 结构

**从重命名脚本输出中直接复制 Shortcodes:**
```html
<div class="image-grid">
{{< lightbox src="https://photo.viiyd.com/2026/01/code/..." title="" >}}
...
</div>
```

> ⚠️ 注意：当 frontmatter 设置了 `photos: N` 时，真正渲染画廊的是
> `layouts/work/single.html` 的 plates 网格（正文 `.Content` 不会输出）。
> 上面的 shortcodes 仅作为冗余备份保留。`photos:` 漏写会被 pre-commit
> 审计（`node scripts/audit_content.js`）拦截。

关键组件:
1. Hook Block (Use Case)
2. Alchemy Card (Paint Recipes)
3. Protocol Card (Techniques)

> [!WARNING]
> **HTML 不要缩进！** Markdown 中的 HTML 块不能有前置空格，否则会被渲染为代码块。

---

### 3.6 分享文案

给 `index.md`/`index.zh.md` 各加一行 `share_caption`（纯正文，不要手打标签或链接——
模板会自动拼标签、追加链接）。怎么写见 `DOCS/MARKETING/SHARE_CAPTION_STANDARD.md`。
构建后到该作品页顶部图标 / 底部分享区点开面板，确认四个渠道（小红书/朋友圈/
Instagram/Facebook）文案都出来了。

---

## 4. 本地验证 (Local Verification)

### 4.1 构建检查
```powershell
cd F:\mysite\viiyd3.0
hugo --gc --minify
```
确认无错误/警告输出。

### 4.2 预览检查
```powershell
hugo server -D
```
**检查清单:**
- [ ] `http://localhost:1313/work/[slug]/` (EN)
- [ ] `http://localhost:1313/zh/work/[slug]/` (ZH)
- [ ] 图片加载正常
- [ ] 响应式布局正常
- [ ] Lightbox 点击放大功能正常
- [ ] Tier/Time 等 Stats 正确显示

---

## 5. 部署 (Git Ops)

### 5.1 Git 提交
```powershell
cd F:\mysite\viiyd3.0
git add .
git commit -m "feat(work): add [Project Name] commission showcase"
git push origin main
```

### 5.2 验证部署
- 等待 Cloudflare Pages 构建完成 (约1-2分钟)
- 访问 `https://viiyd.com/work/[slug]/` 确认上线
- 访问 `https://viiyd.com/zh/work/[slug]/` 确认中文版

### 5.3 错误处理
如果部署失败:
```powershell
# 查看最近提交
git log -3 --oneline

# 回滚到上一个版本
git revert HEAD --no-edit
git push origin main
```

---

## 6. 社交媒体推广 (Social Promotion)

### 6.1 Anti-Robot 写作规则
**严禁:**
- ❌ "Dive into", "Unleash", "Game changer", "In today's world"
- ❌ "绝绝子", "家人们", "无语子" (过度网感)

**推荐:**
- ✅ 第一人称视角 ("这批委托花了我整整40小时...")
- ✅ 专业术语 + 故事性
- ✅ 简洁有力，避免空洞华丽辞藻

### 6.2 平台模板

#### Twitter/X
```
[HOOK - 最重要的信息/视觉亮点]

[1-2句技术/故事]

[链接]

#warhammer40k #miniaturepainting #commission
```

#### Instagram
```
[情感化开场]

[创作过程 2-3句]

[Call to action]

.
.
.
#战锤 #微缩模型涂装 #warhammer #minipainting
```

#### 小红书
```
[口语化标题 + emoji]

[真实感受/经历]
[技术亮点分享]

📌 更多作品: viiyd.com

#战锤 #微缩模型 #手涂 #桌游
```

---

## 7. 执行命令

启动发布流程:
```
/publishing
```
或:
```
运行发布流程，项目: [PROJECT_NAME], 代码: [CODE]
```

---

## Appendix: Quick Reference

### 文件路径
| 用途 | 路径 |
|------|------|
| 待上传图片 | `F:\mysite\viiyd3.0\need_upload\` |
| 重命名脚本 | `F:\mysite\viiyd3.0\scripts\rename_images.js` |
| 上传脚本 | `F:\mysite\viiyd3.0\scripts\upload_r2.js` |
| 内容模板 | `F:\mysite\viiyd3.0\DOCS\WORK_TEMPLATE.md` |
| 项目标准 | `F:\mysite\viiyd3.0\DOCS\STANDARDS.md` |

### R2 配置
- Bucket: `viiyd-art-photos`
- 结构: `YYYY/MM/[CODE]/`
- 公开域名: `https://photo.viiyd.com/`

---

**Last Updated**: 2026-07-20
**Version**: 3.4 (新增 2.4 · 360° 视频发布)
