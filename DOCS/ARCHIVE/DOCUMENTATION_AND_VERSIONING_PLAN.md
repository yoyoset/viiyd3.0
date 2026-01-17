# System Documentation & Versioning Plan (VIIYD 3.0)

> **目标**: 固化当前系统状态，留存技术文档，确立 v3.0 版本基线。
> **执行者**: Gemini 3 Agent
> **预计工时**: 1.5 - 2 小时

---

## 一、文档体系重构

当前 `DOCS/` 目录包含大量过程性"Plan"文档。我们需要将其整合为**永久性技术资产**。

### 1. 创建 `DOCS/TECHNICAL_MANUAL_v3.md` (核心技术手册)
这将是系统的"使用说明书"，包含：
*   **架构总览**: Hugo + Tailwind + Vanilla JS + Cloudflare Workers (Telegram Bot).
*   **核心功能逻辑**:
    *   **Lightbox**: 响应式布局、手势逻辑、DOM 结构。
    *   **Contact Form**: 前端验证、Worker 转发、Telegram 格式、R2 存储。
    *   **i18n**: 双语配置规则、TOML 结构。
*   **关键配置**: Wrangler 凭据清单、Hugo Params。

### 2. 更新 `DOCS/STANDARDS.md` (开发标准)
*   补充 **UI 交互标准**: 按钮动效、表单反馈。
*   补充 **Work 内容标准**: 基于最新的 `index.zh.md` 结构 (去除 CTA)。
*   更新 **CSS 规范**: `Imperial Gold` 配色系统定义。

### 3. "Plan" 文档归档
*   创建 `DOCS/ARCHIVE/`。
*   将已完成的 `*_PLAN.md` 移动到归档目录，保持根目录整洁。

---

## 二、版本固化 (Git Versioning)

### 1. 代码冻结
*   确认所有功能正常（Lightbox, Contact, i18n）。
*   确认无未提交代码 (`git status` clean)。

### 2. 打标签 (Tagging)
*   执行 `git tag -a v3.0.0 -m "Release: VIIYD 3.0 Imperial Gold Edition - Includes Lightbox & Contact Form"`。
*   推送到 GitHub: `git push origin v3.0.0`。

### 3. 生成版本报告 (`VERSION_REPORT.md`)
*   记录 v3.0.0 的 commit hash。
*   列出关键功能清单。
*   已知问题 (Known Issues) 列表（如有）。

---

## 三、执行步骤

1.  **归档旧文档**: 清理 `DOCS/`。
2.  **编写手册**: 撰写 `TECHNICAL_MANUAL_v3.md`。
3.  **修订标准**: 更新 `STANDARDS.md`。
4.  **版本发布**: Git Tag & Push。
5.  **最终交付**: 提交所有新文档。

---

## 四、主要变更点

| 模块 | v3.0 状态 | 说明 |
|------|-----------|------|
| **Contact** | ✅ Cloudflare Worker + Telegram | 包含图片上传、Turnstile |
| **Lightbox** | ✅ 纯响应式 JS | 修复了移动端布局、手势 |
| **Work Post** | ✅ 标准化结构 | 移除了旧版 CTA 组件 |
| **Tech Stack** | ✅ Hugo + Tailwind 4 | 无 jQuery，轻量化 |

---

**确认执行？**
请回复确认，我将开始整理并生成文档。
