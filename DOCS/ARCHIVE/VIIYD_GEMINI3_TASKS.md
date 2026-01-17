# VIIYD 网站技术任务 - Gemini 3 执行清单
# Technical Tasks for AI Agent Execution

> **执行说明**: 这是可由 AI 代理自动执行的代码任务清单
> **项目路径**: `f:\mysite\viiyd3.0`
> **技术栈**: Hugo + Tailwind CSS v4 + Cloudflare Pages

---

## 📋 联络信息

```yaml
email: maylyy8@gmail.com
instagram: https://www.instagram.com/viiyang.yingying/
wechat_qr: /img/mywechat.jpg
```

---

## ✅ 任务 1: 页脚联络区域

**文件**: `layouts/partials/footer.html`

**需求**:
- 添加联络信息区块
- 包含 Email 链接、Instagram 图标链接、微信二维码
- 中英文自适应

**参考代码**:
```html
<div class="footer-contact">
  <h4>{{ T "contact_title" }}</h4>
  <div class="flex gap-4">
    <!-- Email -->
    <a href="mailto:maylyy8@gmail.com" title="Email">
      <svg><!-- email icon --></svg>
    </a>
    <!-- Instagram -->
    <a href="https://www.instagram.com/viiyang.yingying/" target="_blank" title="Instagram">
      <svg><!-- instagram icon --></svg>
    </a>
    <!-- WeChat QR Modal Trigger -->
    <button onclick="showWechatModal()" title="WeChat">
      <svg><!-- wechat icon --></svg>
    </button>
  </div>
</div>

<!-- WeChat QR Modal -->
<div id="wechat-modal" class="hidden fixed inset-0 bg-black/80 z-50">
  <div class="bg-white p-6 rounded-xl max-w-xs mx-auto mt-20">
    <img src="/img/mywechat.jpg" alt="WeChat QR Code">
    <button onclick="hideWechatModal()">Close</button>
  </div>
</div>
```

**验证**: 访问网站页脚，确认三个联络方式可见且可点击

---

## ✅ 任务 2: 创建联络页面

**新建文件**:
- `content/contact/_index.md`
- `content/contact/_index.zh.md`
- `layouts/_default/contact.html`

**English 内容** (`_index.md`):
```yaml
---
title: "Contact"
layout: "contact"
---
```

**中文内容** (`_index.zh.md`):
```yaml
---
title: "联络我们"
layout: "contact"
---
```

**模板** (`contact.html`):
- 显示联络信息
- 嵌入 Tally 表单 (iframe)
- 表单 URL 占位符: `https://tally.so/embed/YOUR_FORM_ID`

**验证**: 访问 `/contact/` 和 `/zh/contact/` 页面正常显示

---

## ✅ 任务 3: 作品页添加询价 CTA

**文件**: `layouts/work/single.html`

**需求**: 在每个作品详情页底部添加询价按钮

**参考代码**:
```html
<div class="work-cta mt-12 p-8 bg-neutral-900 rounded-2xl text-center">
  <h3 class="text-xl text-white mb-4">{{ T "work_cta_title" }}</h3>
  <p class="text-gray-400 mb-6">{{ T "work_cta_desc" }}</p>
  <a href="/contact/" class="inline-block bg-gold-500 text-black px-8 py-3 rounded-xl">
    {{ T "work_cta_button" }}
  </a>
</div>
```

**翻译文件** (`i18n/en.yaml`, `i18n/zh.yaml`):
```yaml
# en.yaml
work_cta_title: "Like This Work?"
work_cta_desc: "Contact us for a similar commission quote"
work_cta_button: "Get Quote"

# zh.yaml
work_cta_title: "喜欢这个作品？"
work_cta_desc: "联系我们获取同款涂装报价"
work_cta_button: "立即咨询"
```

**验证**: 打开任意作品页，确认底部有询价区块

---

## ✅ 任务 4: RSS Feed 优化

**文件**: `layouts/_default/rss.xml` (如不存在则新建)

**需求**: 确保 RSS feed 包含完整图片 URL，方便自动化工具抓取

**验证**: 访问 `/index.xml` 确认 RSS 输出正常

---

## ✅ 任务 5: SEO Meta 标签

**文件**: `layouts/partials/head.html`

**需求**: 确保每个页面有:
- `<title>` 标签
- `<meta name="description">` 标签
- Open Graph 标签 (og:title, og:description, og:image)
- Twitter Card 标签

**验证**: 使用浏览器开发者工具检查 `<head>` 内容

---

## ✅ 任务 6: JSON-LD 结构化数据

**文件**: `layouts/partials/head.html`

**需求**: 添加 LocalBusiness JSON-LD

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "VIIYD Miniature Painting Studio",
  "description": "Professional Warhammer and miniature painting commission service",
  "url": "https://viiyd.com",
  "email": "maylyy8@gmail.com",
  "sameAs": [
    "https://www.instagram.com/viiyang.yingying/"
  ]
}
</script>
```

**验证**: 使用 Google Rich Results Test 检测

---

## ✅ 任务 7: Sitemap 配置

**文件**: `hugo.toml` 或 `config.toml`

**需求**: 确保 sitemap 启用

```toml
[sitemap]
  changefreq = "weekly"
  filename = "sitemap.xml"
  priority = 0.5
```

**验证**: 访问 `/sitemap.xml` 确认生成

---

## 🚫 不可执行任务 (需人工处理)

以下任务需要人工完成，AI 无法执行:

- 社交媒体账号注册
- 内容创作与发布
- 付费广告配置
- 商务合作洽谈
- Tally 表单创建 (需要人工操作)

---

## 执行顺序建议

1. 任务 5 (SEO Meta) - 基础设施
2. 任务 6 (JSON-LD) - 基础设施
3. 任务 7 (Sitemap) - 基础设施
4. 任务 1 (页脚) - 联络入口
5. 任务 2 (联络页) - 联络核心
6. 任务 3 (作品CTA) - 转化优化
7. 任务 4 (RSS) - 自动化准备

---

*此文档供 Gemini 3 或其他 AI 代理执行*
*生成时间: 2026-01-17*
