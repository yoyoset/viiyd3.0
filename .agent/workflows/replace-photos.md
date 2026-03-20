---
description: VIIYD 3.0 项目照片替换流程 (Replace Photos)
---

# Workflow: VIIYD 3.0 Project Photo Replacement

用于已有项目的图片更新或替换。此流程已适配 **Zero CDN Cost** WebP 标准。

// turbo-all

## 1. 准备新素材
1. 清空 `F:\my_ai\viiyd3.0\need_upload\` 文件夹。
2. 将新的原始图片放入 `need_upload/`。

## 2. 重新处理图片 (Rename & Optimize)
使用升级后的重命名脚本。这将自动执行 WebP 转码并消除原始 JPG。

```powershell
# 参数: [源文件夹] [项目代码] [可选日期YYYYMMDD]
# 示例: node scripts/rename_images.js ./need_upload huron 20260318
node scripts/rename_images.js ./need_upload [PROJECT_CODE] [DATE]
```

**效果**:
- 原始文件转码为 `viiyd[DATE][CODE]_[NN].webp` (90%质量)
- 生成 **本地优化版** `viiyd[DATE][CODE]_[NN]_web.webp` (1600px 80%质量)
- **优势**: 节省 ~60% 存储空间，且完全避开 Cloudflare 动态缩放费用。

## 3. 上传至 R2
上传到项目对应的存储路径。必须带 `--remote`。

```powershell
# 参数: [源文件夹] [Bucket] [R2路径]
# 示例: node scripts/fast_upload_r2.js ./need_upload viiyd-art-photos 2026/03/huron
node scripts/fast_upload_r2.js ./need_upload viiyd-art-photos [TARGET_R2_PATH]
```

## 4. 更新内容页面
同步更新 `index.md` 和 `index.zh.md`。

1. **开启优化标志**: 在 Frontmatter 中添加 `optimized: true`。
2. **更新 URL 路径**: 批量将 `.jpg` 替换为 `.webp`。
3. **验证 Shortcodes**: 确保 `lightbox` 里的 `src` 指向高清 `.webp`，模板会自动处理缩略图展示。

## 5. 本地预览与提交
```powershell
hugo server -D
# 确认 Lightbox 放大正常且无 404
git add .
git commit -m "chore(work): update photos to WebP for [Project Name]"
git push origin main
```
