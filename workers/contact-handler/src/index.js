/**
 * viiyd-contact-handler
 *
 * Routes:
 *   POST /api/contact     — 原有联系表单（保留）
 *   POST /api/commission  — 新委托弹窗 POP
 *
 * Bindings:
 *   R2:  CONTACT_IMAGES   (bucket: viiyd-contact-images)
 *   D1:  DB               (database: viiyd-db)
 * Secrets (已部署，无需重设):
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_CHAT_ID
 *   TURNSTILE_SECRET
 */

export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin') || '';
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
        const allowedOrigin = isLocalhost ? origin : (env.ALLOWED_ORIGIN || 'https://viiyd.com');

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders(allowedOrigin) });
        }
        if (request.method !== 'POST') {
            return json({ success: false, error: 'Method not allowed' }, 405, allowedOrigin);
        }

        const url = new URL(request.url);

        try {
            if (url.pathname === '/api/commission') {
                return await handleCommission(request, env, allowedOrigin, isLocalhost);
            }
            if (url.pathname === '/api/contact') {
                return await handleContact(request, env, allowedOrigin, isLocalhost);
            }
            return json({ success: false, error: 'Not found' }, 404, allowedOrigin);
        } catch (err) {
            console.error('Error:', err);
            return json({ success: false, error: 'Server error: ' + err.message }, 500, allowedOrigin);
        }
    }
};

/* ── POST /api/commission ─────────────────────────────────────── */
async function handleCommission(request, env, allowedOrigin, isLocalhost) {
    const formData = await request.formData();

    // 1. Honeypot
    if (formData.get('website')) {
        return json({ success: true, ticket: 'VY-SPAM' }, 200, allowedOrigin);
    }

    // 2. Turnstile
    if (!isLocalhost) {
        const token = formData.get('cf-turnstile-response');
        if (!await verifyTurnstile(token, env)) {
            return json({ success: false, error: 'Captcha verification failed' }, 400, allowedOrigin);
        }
    }

    // 3. 必填字段校验
    const name    = (formData.get('name') || '').trim();
    const contact = (formData.get('contact') || '').trim();
    const project = formData.get('project') || '';
    const tier    = formData.get('tier') || '';
    if (!name || !contact || !project || !tier) {
        return json({ success: false, error: 'Missing required fields' }, 400, allowedOrigin);
    }

    const deadline = (formData.get('deadline') || '').trim();
    const notes    = (formData.get('notes') || '').trim();

    // 4. 图片上传到 R2
    const imageUrls = [];
    const files = formData.getAll('refs');
    for (const file of files) {
        if (file && file.size > 0) {
            const ext = (file.name || 'img').split('.').pop().toLowerCase();
            const key = `commissions/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            await env.CONTACT_IMAGES.put(key, file.stream(), {
                httpMetadata: { contentType: file.type || 'application/octet-stream' }
            });
            imageUrls.push(key);
        }
    }

    // 5. 生成票号 VY-YYYY-MMDD-XX
    const ticket = generateTicket();
    const createdAt = Date.now();

    // 6. 写入 D1
    if (env.DB) {
        try {
            await env.DB.prepare(
                `INSERT INTO commissions (id, created_at, name, contact, project, tier, deadline, notes, reference_urls, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`
            ).bind(
                ticket, createdAt, name, contact, project, tier,
                deadline || null, notes || null, JSON.stringify(imageUrls)
            ).run();
        } catch (dbErr) {
            // 如果表还没建，先建表再重试；D1 失败绝不能阻断 Telegram 通知（那才是真正的客源）
            try {
                if (dbErr.message && dbErr.message.includes('no such table')) {
                    await createCommissionsTable(env.DB);
                    await env.DB.prepare(
                        `INSERT INTO commissions (id, created_at, name, contact, project, tier, deadline, notes, reference_urls, status)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`
                    ).bind(
                        ticket, createdAt, name, contact, project, tier,
                        deadline || null, notes || null, JSON.stringify(imageUrls)
                    ).run();
                } else {
                    console.error('[D1] commission insert error:', dbErr);
                }
            } catch (retryErr) {
                console.error('[D1] commission insert retry failed:', retryErr);
            }
        }
    }

    // 7. Telegram 通知
    const telegramOk = await sendCommissionTelegram({ ticket, name, contact, project, tier, deadline, notes, imageUrls }, env);
    if (!telegramOk) console.error('[Telegram] commission notify failed');

    return json({ success: true, ticket }, 200, allowedOrigin);
}

/* ── POST /api/contact (原有逻辑，保持不变) ────────────────────── */
async function handleContact(request, env, allowedOrigin, isLocalhost) {
    const formData = await request.formData();

    const turnstileToken = formData.get('cf-turnstile-response');
    if (!isLocalhost) {
        if (!await verifyTurnstile(turnstileToken, env)) {
            return json({ success: false, error: 'Captcha verification failed' }, 400, allowedOrigin);
        }
    }

    const name        = formData.get('name');
    const contact     = formData.get('contact');
    const projectType = formData.get('projectType');
    const description = formData.get('description');

    if (!name || !contact || !projectType || !description) {
        return json({ success: false, error: 'Missing required fields' }, 400, allowedOrigin);
    }

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

    const typeLabels = { single: '🎯 单件模型', squad: '👥 小队/战斗组', army: '⚔️ 完整军团', other: '✨ 其他/定制' };
    let message = `📩 *新委托申请*\n\n👤 *称呼*: ${escapeMarkdown(name)}\n📱 *联络方式*: ${escapeMarkdown(contact)}\n📦 *项目类型*: ${typeLabels[projectType] || projectType}\n\n📝 *项目描述*:\n${escapeMarkdown(description)}`;
    if (imageUrls.length > 0) message += `\n\n🖼️ *参考图片*: ${imageUrls.length}张`;

    try {
        const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: message, parse_mode: 'Markdown' })
        });
        const result = await res.json();
        if (result.ok) {
            for (const url of imageUrls) {
                await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, photo: url, caption: `来自 ${name} 的参考图` })
                });
            }
        }
    } catch (err) {
        console.error('Telegram error:', err);
    }

    return json({ success: true, message: 'Submitted successfully' }, 200, allowedOrigin);
}

/* ── helpers ─────────────────────────────────────────────────── */

function generateTicket() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm   = String(now.getMonth() + 1).padStart(2, '0');
    const dd   = String(now.getDate()).padStart(2, '0');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const xx = Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `VY-${yyyy}-${mm}${dd}-${xx}`;
}

async function createCommissionsTable(db) {
    // D1 的 db.exec() 按行执行，多行 SQL 会报 "incomplete input"，必须用 prepare 逐条执行
    await db.prepare(
        `CREATE TABLE IF NOT EXISTS commissions (id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, name TEXT NOT NULL, contact TEXT NOT NULL, project TEXT NOT NULL, tier TEXT NOT NULL, deadline TEXT, notes TEXT, reference_urls TEXT, status TEXT DEFAULT 'new', telegram_message_id INTEGER)`
    ).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at DESC)`).run();
}

async function sendCommissionTelegram({ ticket, name, contact, project, tier, deadline, notes, imageUrls }, env) {
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return false;

    const projectLabel = { single: '单件模型', squad: '小队 5-10', vehicle: '载具/战争引擎', diorama: '场景/展示台', repair: '修复/补色', other: '其他' };
    const tierLabel    = { tabletop: 'Tabletop (¥120+)', display: 'Display (¥600+)', unsure: '待定' };

    const lines = [
        `🟡 NEW COMMISSION · ${ticket}`,
        `─────────────────────────────────`,
        `${name}`,
        `${contact}`,
        ``,
        `Project: ${projectLabel[project] || project} · ${tierLabel[tier] || tier}`,
        deadline ? `Deadline: ${deadline}` : null,
        notes ? `\nNotes:\n${notes}` : null,
        imageUrls.length ? `\nRefs: ${imageUrls.length} attached` : null,
        `─────────────────────────────────`,
    ].filter(l => l !== null).join('\n');

    try {
        const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: env.TELEGRAM_CHAT_ID,
                text: lines,
                reply_markup: {
                    inline_keyboard: [[
                        { text: '✓ Accept', callback_data: `accept:${ticket}` },
                        { text: '✗ Decline', callback_data: `decline:${ticket}` },
                    ]]
                }
            })
        });
        const data = await res.json();
        if (data.ok) {
            // Pin the message
            await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/pinChatMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, message_id: data.result.message_id })
            });
        }
        return data.ok;
    } catch (err) {
        console.error('[Telegram]', err);
        return false;
    }
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
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
    });
}

function escapeMarkdown(text) {
    if (!text) return '';
    return String(text).replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}
