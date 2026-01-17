export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin') || '';
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');

        // CORS - allow localhost for development
        const allowedOrigin = isLocalhost ? origin : env.ALLOWED_ORIGIN;

        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: corsHeaders(allowedOrigin)
            });
        }

        if (request.method !== 'POST') {
            return json({ success: false, error: 'Method not allowed' }, 405, allowedOrigin);
        }

        try {
            const formData = await request.formData();

            // 1. Turnstile 验证 (skip on localhost for testing)
            const turnstileToken = formData.get('cf-turnstile-response');
            if (!isLocalhost) {
                if (!await verifyTurnstile(turnstileToken, env)) {
                    return json({ success: false, error: 'Captcha verification failed' }, 400, allowedOrigin);
                }
            }

            // 2. 提取字段
            const name = formData.get('name');
            const contact = formData.get('contact');
            const projectType = formData.get('projectType');
            const description = formData.get('description');

            if (!name || !contact || !projectType || !description) {
                return json({ success: false, error: 'Missing required fields' }, 400, allowedOrigin);
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
            const telegramResult = await sendTelegramNotification({
                name, contact, projectType, description, imageUrls
            }, env);

            if (!telegramResult.ok) {
                console.error('Telegram error:', telegramResult.error);
                // Still return success to user, but log the error
            }

            return json({ success: true, message: 'Submitted successfully' }, 200, allowedOrigin);

        } catch (err) {
            console.error('Error:', err);
            return json({ success: false, error: 'Server error: ' + err.message }, 500, allowedOrigin);
        }
    }
};

// --- Helpers ---

function corsHeaders(origin) {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

function json(data, status, origin) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(origin)
        }
    });
}

async function verifyTurnstile(token, env) {
    if (!token) return false;
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

    let message = `📩 *新委托申请*

👤 *称呼*: ${escapeMarkdown(name)}
📱 *联络方式*: ${escapeMarkdown(contact)}
📦 *项目类型*: ${typeLabels[projectType] || projectType}

📝 *项目描述*:
${escapeMarkdown(description)}`;

    if (imageUrls.length > 0) {
        message += `\n\n🖼️ *参考图片*: ${imageUrls.length}张`;
    }

    // 发送文本消息
    try {
        const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: env.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        const result = await res.json();

        if (!result.ok) {
            return { ok: false, error: result.description };
        }

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

        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

function escapeMarkdown(text) {
    if (!text) return '';
    return String(text).replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}
