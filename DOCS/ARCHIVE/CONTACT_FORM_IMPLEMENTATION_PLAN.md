# Contact Form Implementation Plan v2 (Telegram + Image Upload)

> **执行者**: Gemini 3 Agent
> **通知方式**: Telegram Bot
> **图片存储**: Cloudflare R2
> **预计工时**: 3-4 小时

---

## 一、架构概览

```
┌─────────────────┐      POST /api/contact      ┌──────────────────────┐
│  Hugo 前端表单   │  ─────────────────────────▶ │  Cloudflare Worker   │
│  (contact.html) │                             │  (contact-handler)   │
└─────────────────┘                             └──────────┬───────────┘
                                                           │
                    ┌──────────────────────────────────────┼──────────────────────────────────────┐
                    │                                      │                                      │
                    ▼                                      ▼                                      ▼
          ┌─────────────────┐                    ┌─────────────────┐                    ┌─────────────────┐
          │  Turnstile 验证  │                    │   Telegram Bot   │                    │   R2 图片存储    │
          │  (反垃圾)        │                    │   (即时通知)      │                    │   (参考图)       │
          └─────────────────┘                    └─────────────────┘                    └─────────────────┘
```

---

## 二、表单字段设计

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| **昵称** | 文本 | ✅ | 怎么称呼您 |
| **联络方式** | 文本 | ✅ | 微信/Email/Discord/其他 |
| **项目类型** | 下拉 | ✅ | 单件/小队/军团/其他 |
| **参考图片** | 文件 | ❌ | 最多3张，支持 JPG/PNG/WebP |
| **项目描述** | 多行文本 | ✅ | 想要什么效果、配色、截止日期等 |

---

## 三、文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `layouts/_default/contact.html` | MODIFY | 原生表单 + 图片上传 |
| `assets/js/contact-form.js` | NEW | 表单逻辑 + 图片预览 |
| `i18n/en.toml` | MODIFY | 表单翻译 |
| `i18n/zh.toml` | MODIFY | 表单翻译 |
| `workers/contact-handler/` | NEW | Worker 项目 |
| `workers/contact-handler/wrangler.toml` | NEW | 配置 (R2 绑定) |
| `workers/contact-handler/src/index.js` | NEW | 逻辑 |

---

## 四、详细实施

### Phase 1: 创建 Telegram Bot

#### 1.1 创建 Bot (用户手动操作)

1. 在 Telegram 中搜索 `@BotFather`
2. 发送 `/newbot`
3. 设置名称: `VIIYD Commission Bot`
4. 设置用户名: `viiyd_commission_bot`
5. **保存 Token**: `7123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
6. 获取 Chat ID:
   - 向 Bot 发送任意消息
   - 访问 `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - 找到 `chat.id` 字段

---

### Phase 2: Cloudflare Worker

#### 2.1 `wrangler.toml`

```toml
name = "viiyd-contact-handler"
main = "src/index.js"
compatibility_date = "2024-01-01"

[vars]
ALLOWED_ORIGIN = "https://viiyd.com"

# R2 绑定
[[r2_buckets]]
binding = "CONTACT_IMAGES"
bucket_name = "viiyd-contact-images"
```

#### 2.2 `src/index.js`

```javascript
export default {
  async fetch(request, env) {
    // CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(env)
      });
    }

    if (request.method !== 'POST') {
      return json({ success: false, error: 'Method not allowed' }, 405, env);
    }

    try {
      const formData = await request.formData();
      
      // 1. Turnstile 验证
      const turnstileToken = formData.get('cf-turnstile-response');
      if (!await verifyTurnstile(turnstileToken, env)) {
        return json({ success: false, error: 'Captcha failed' }, 400, env);
      }

      // 2. 提取字段
      const name = formData.get('name');
      const contact = formData.get('contact');
      const projectType = formData.get('projectType');
      const description = formData.get('description');

      if (!name || !contact || !projectType || !description) {
        return json({ success: false, error: 'Missing fields' }, 400, env);
      }

      // 3. 上传图片到 R2
      const imageUrls = [];
      const files = formData.getAll('images');
      for (const file of files) {
        if (file && file.size > 0) {
          const key = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
          await env.CONTACT_IMAGES.put(key, file.stream(), {
            httpMetadata: { contentType: file.type }
          });
          imageUrls.push(`https://r2.viiyd.com/${key}`);
        }
      }

      // 4. 发送 Telegram 通知
      await sendTelegramNotification({
        name, contact, projectType, description, imageUrls
      }, env);

      return json({ success: true, message: 'Submitted' }, 200, env);

    } catch (err) {
      console.error('Error:', err);
      return json({ success: false, error: 'Server error' }, 500, env);
    }
  }
};

// --- Helpers ---

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env)
    }
  });
}

async function verifyTurnstile(token, env) {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${env.TURNSTILE_SECRET}&response=${token}`
  });
  const result = await res.json();
  return result.success;
}

async function sendTelegramNotification(data, env) {
  const { name, contact, projectType, description, imageUrls } = data;
  
  // 项目类型映射
  const typeLabels = {
    single: '🎯 单件模型',
    squad: '👥 小队/战斗组',
    army: '⚔️ 完整军团',
    other: '✨ 其他/定制'
  };

  let message = `
📩 *新委托申请*

👤 *称呼*: ${escapeMarkdown(name)}
📱 *联络方式*: ${escapeMarkdown(contact)}
📦 *项目类型*: ${typeLabels[projectType] || projectType}

📝 *项目描述*:
${escapeMarkdown(description)}
`;

  if (imageUrls.length > 0) {
    message += `\n🖼️ *参考图片*: ${imageUrls.length}张`;
  }

  // 发送文本消息
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    })
  });

  // 发送图片 (如果有)
  for (const url of imageUrls) {
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        photo: url,
        caption: `来自 ${name} 的参考图`
      })
    });
  }
}

function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}
```

---

### Phase 3: 前端表单

#### 3.1 `layouts/_default/contact.html`

```html
{{ define "main" }}
<div class="min-h-screen bg-neutral-950 pt-32 pb-20">
    <div class="max-w-3xl mx-auto px-6">

        <header class="mb-16 text-center">
            <h1 class="text-4xl md:text-6xl font-black font-serif text-white uppercase tracking-wider mb-6">
                {{ T "contact_title" }}
            </h1>
            <p class="text-gray-400 font-mono text-sm md:text-base leading-relaxed max-w-xl mx-auto">
                {{ T "contact_intro" }}
            </p>
        </header>

        <div class="bg-neutral-900 border border-white/5 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-gold-500/5 via-transparent to-purple-500/5 opacity-50 pointer-events-none"></div>

            <form id="contact-form" class="relative z-10 space-y-6" enctype="multipart/form-data">
                
                <!-- Name -->
                <div>
                    <label class="block text-sm font-bold text-gray-300 mb-2">{{ T "form_name" }} *</label>
                    <input type="text" name="name" required
                        class="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 transition-all"
                        placeholder="{{ T "form_name_placeholder" }}">
                </div>

                <!-- Contact -->
                <div>
                    <label class="block text-sm font-bold text-gray-300 mb-2">{{ T "form_contact" }} *</label>
                    <input type="text" name="contact" required
                        class="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 transition-all"
                        placeholder="{{ T "form_contact_placeholder" }}">
                </div>

                <!-- Project Type -->
                <div>
                    <label class="block text-sm font-bold text-gray-300 mb-2">{{ T "form_project_type" }} *</label>
                    <select name="projectType" required
                        class="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50 transition-all">
                        <option value="">{{ T "form_select_option" }}</option>
                        <option value="single">{{ T "form_project_single" }}</option>
                        <option value="squad">{{ T "form_project_squad" }}</option>
                        <option value="army">{{ T "form_project_army" }}</option>
                        <option value="other">{{ T "form_project_other" }}</option>
                    </select>
                </div>

                <!-- Image Upload -->
                <div>
                    <label class="block text-sm font-bold text-gray-300 mb-2">{{ T "form_images" }}</label>
                    <div class="relative">
                        <input type="file" name="images" multiple accept="image/*"
                            class="hidden" id="image-input">
                        <label for="image-input"
                            class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-gold-500/50 transition-colors">
                            <svg class="w-8 h-8 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            <span class="text-sm text-gray-500">{{ T "form_images_hint" }}</span>
                        </label>
                    </div>
                    <div id="image-preview" class="flex flex-wrap gap-2 mt-3"></div>
                </div>

                <!-- Description -->
                <div>
                    <label class="block text-sm font-bold text-gray-300 mb-2">{{ T "form_description" }} *</label>
                    <textarea name="description" rows="5" required
                        class="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 transition-all resize-none"
                        placeholder="{{ T "form_description_placeholder" }}"></textarea>
                </div>

                <!-- Turnstile -->
                <div class="cf-turnstile" data-sitekey="{{ .Site.Params.turnstileSiteKey }}" data-theme="dark"></div>

                <!-- Submit -->
                <button type="submit" id="submit-btn"
                    class="w-full py-4 bg-gold-500 hover:bg-gold-400 text-neutral-900 font-bold rounded-lg shadow-lg hover:shadow-gold-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    <span id="btn-text">{{ T "form_submit" }}</span>
                    <span id="btn-loading" class="hidden">
                        <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </span>
                </button>

                <div id="form-status" class="hidden text-center p-4 rounded-lg"></div>
            </form>
        </div>

        <div class="mt-16 text-center">
            <p class="text-xs text-gray-500 font-mono uppercase tracking-widest mb-4">{{ T "contact_direct" }}</p>
            <a href="mailto:maylyy8@gmail.com" class="text-gold-500 hover:text-white transition-colors font-bold text-lg">
                maylyy8@gmail.com
            </a>
        </div>
    </div>
</div>

<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
<script src="{{ "js/contact-form.js" | relURL }}"></script>
{{ end }}
```

#### 3.2 `assets/js/contact-form.js`

```javascript
// Image Preview
const imageInput = document.getElementById('image-input');
const preview = document.getElementById('image-preview');

imageInput?.addEventListener('change', () => {
    preview.innerHTML = '';
    const files = Array.from(imageInput.files).slice(0, 3); // Max 3
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'w-20 h-20 rounded-lg overflow-hidden border border-white/10';
            div.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover">`;
            preview.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
});

// Form Submit
document.getElementById('contact-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const btnLoading = document.getElementById('btn-loading');
    const statusEl = document.getElementById('form-status');

    submitBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');

    try {
        const formData = new FormData(form);
        
        // Limit to 3 images
        const images = formData.getAll('images');
        formData.delete('images');
        images.slice(0, 3).forEach(img => formData.append('images', img));

        const response = await fetch('https://viiyd-contact-handler.YOUR_SUBDOMAIN.workers.dev', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            statusEl.className = 'text-center p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400';
            statusEl.innerHTML = '✓ ' + (document.documentElement.lang === 'zh' ? '提交成功！我们会尽快回复您。' : 'Submitted! We will reply soon.');
            statusEl.classList.remove('hidden');
            form.reset();
            preview.innerHTML = '';
            if (typeof turnstile !== 'undefined') turnstile.reset();
        } else {
            throw new Error(result.error || 'Failed');
        }
    } catch (err) {
        statusEl.className = 'text-center p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400';
        statusEl.textContent = '✗ ' + err.message;
        statusEl.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
    }
});
```

---

### Phase 4: i18n

#### `i18n/en.toml` (追加)

```toml
form_name = "Your Name"
form_name_placeholder = "How should we call you?"
form_contact = "Contact Method"
form_contact_placeholder = "WeChat / Email / Discord / etc."
form_project_type = "Project Type"
form_select_option = "Select..."
form_project_single = "Single Model"
form_project_squad = "Squad / Kill Team"
form_project_army = "Full Army"
form_project_other = "Other / Custom"
form_images = "Reference Images (Optional)"
form_images_hint = "Click to upload (max 3)"
form_description = "Project Details"
form_description_placeholder = "Describe what you want: color scheme, deadline, special requests..."
form_submit = "Submit Request"
contact_direct = "or email directly"
```

#### `i18n/zh.toml` (追加)

```toml
form_name = "您的称呼"
form_name_placeholder = "怎么称呼您？"
form_contact = "联络方式"
form_contact_placeholder = "微信 / 邮箱 / Discord / 等等"
form_project_type = "项目类型"
form_select_option = "请选择..."
form_project_single = "单件模型"
form_project_squad = "小队 / 战斗组"
form_project_army = "完整军团"
form_project_other = "其他 / 定制"
form_images = "参考图片 (可选)"
form_images_hint = "点击上传 (最多3张)"
form_description = "项目详情"
form_description_placeholder = "描述您想要的效果：配色方案、截止日期、特殊要求..."
form_submit = "提交委托"
contact_direct = "或直接发邮件"
```

---

### Phase 5: 配置与部署

#### 5.1 Hugo 配置

```toml
# hugo.toml
[params]
  turnstileSiteKey = "YOUR_TURNSTILE_SITE_KEY"
```

#### 5.2 Worker Secrets (Cloudflare Dashboard)

| 变量 | 说明 |
|------|------|
| `TURNSTILE_SECRET` | Turnstile 密钥 |
| `TELEGRAM_BOT_TOKEN` | Bot Token |
| `TELEGRAM_CHAT_ID` | 接收消息的 Chat ID |

#### 5.3 R2 Bucket

```bash
# 创建 R2 Bucket
npx wrangler r2 bucket create viiyd-contact-images

# 配置公开访问 (可选，用于 Telegram 发图)
# 在 Cloudflare Dashboard 中设置自定义域名: r2.viiyd.com
```

#### 5.4 部署

```bash
cd workers/contact-handler
npx wrangler deploy
```

---

## 五、凭据信息 (已收集)

> ⚠️ **敏感信息**: 这些密钥仅供 Gemini 3 执行时使用，部署后应从此文档删除

| 变量 | 值 | 用途 |
|------|-----|------|
| `TELEGRAM_BOT_TOKEN` | `8523608067:AAEwgtLwDzxO9DEIVQp27HufY7REj-ANSsw` | Worker Secret |
| `TELEGRAM_CHAT_ID` | `1852746006` | Worker Secret |
| `TURNSTILE_SECRET` | `0x4AAAAAACNE6bWA6GUt2G5zVtC73OJY88w` | Worker Secret |
| `turnstileSiteKey` | `0x4AAAAAACNE6SxZEmTQJClP` | hugo.toml [params] |

### 部署时配置

#### Hugo 配置 (`hugo.toml`)
```toml
[params]
  turnstileSiteKey = "0x4AAAAAACNE6SxZEmTQJClP"
```

#### Worker Secrets (使用 wrangler)
```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
# 输入: 8523608067:AAEwgtLwDzxO9DEIVQp27HufY7REj-ANSsw

npx wrangler secret put TELEGRAM_CHAT_ID
# 输入: 1852746006

npx wrangler secret put TURNSTILE_SECRET
# 输入: 0x4AAAAAACNE6bWA6GUt2G5zVtC73OJY88w
```

---

## 六、验证计划

| 测试项 | 预期结果 |
|--------|----------|
| 表单渲染 | 所有字段正确显示 |
| 图片预览 | 选择图片后显示缩略图 |
| Turnstile | 无感验证通过 |
| 提交成功 | 显示成功消息 |
| Telegram 通知 | 收到文本 + 图片 |
| 错误处理 | 显示友好错误提示 |

---

## 七、预估时间

| 阶段 | 时间 |
|------|------|
| Phase 1: Telegram Bot 创建 | 10 min (用户操作) |
| Phase 2: Worker 开发 | 60 min |
| Phase 3: 前端表单 | 45 min |
| Phase 4: i18n | 15 min |
| Phase 5: 配置部署 | 30 min |
| 验证测试 | 30 min |
| **总计** | **~3 小时** |
