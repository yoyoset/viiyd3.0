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
                    // Assuming R2 bucket is public or handled via worker, but here using a hypothetical domain
                    // The plan mentioned r2.viiyd.com, we will stick to that.
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
