/**
 * VIIYD Commission Worker
 * Routes:
 *   POST /api/commission        — submit commission form
 *   POST /api/commission/upload — get R2 presigned upload URL
 *
 * Bindings required (wrangler.toml):
 *   D1:  COMMISSIONS_DB
 *   R2:  REFS_BUCKET
 *   KV:  RATE_LIMIT_KV
 * Secrets (wrangler secret put):
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_CHAT_ID
 *   TURNSTILE_SECRET_KEY   (optional — skip if not configured)
 */

const ALLOWED_ORIGINS = [
  'https://viiyd.com',
  'https://www.viiyd.com',
  'http://localhost:1313',
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

    const corsHeaders = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      if (request.method === 'POST' && url.pathname === '/api/commission/upload') {
        return await handleUpload(request, env, corsHeaders);
      }
      if (request.method === 'POST' && url.pathname === '/api/commission') {
        return await handleCommission(request, env, corsHeaders);
      }
      return json({ error: 'Not found' }, 404, corsHeaders);
    } catch (err) {
      console.error(err);
      return json({ error: 'Internal error' }, 500, corsHeaders);
    }
  },
};

/* ── POST /api/commission/upload ─────────────────────────────── */
async function handleUpload(request, env, corsHeaders) {
  const { filename, size } = await request.json();
  if (!filename || size > 20 * 1024 * 1024) {
    return json({ error: 'Invalid file' }, 400, corsHeaders);
  }
  const ext = filename.split('.').pop().toLowerCase();
  const allowed = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp', 'gif'];
  if (!allowed.includes(ext)) {
    return json({ error: 'File type not allowed' }, 400, corsHeaders);
  }

  const key = `refs/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  // Generate presigned URL (valid for 5 minutes)
  const url = await env.REFS_BUCKET.createPresignedUrl('PUT', key, {
    expiresIn: 300,
    httpMetadata: { contentType: mimeFor(ext) },
  });

  return json({ url, key }, 200, corsHeaders);
}

/* ── POST /api/commission ─────────────────────────────────────── */
async function handleCommission(request, env, corsHeaders) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const body = await request.json();

  /* honeypot */
  if (body.website) return json({ ok: true, ticket: 'VY-SPAM' }, 200, corsHeaders);

  /* rate limit: 3 per IP per hour */
  const rateKey = `rl:${ip}`;
  const rateData = await env.RATE_LIMIT_KV.get(rateKey, 'json') || { count: 0, reset: 0 };
  const now = Date.now();
  if (now > rateData.reset) {
    rateData.count = 0;
    rateData.reset = now + 3600_000;
  }
  if (rateData.count >= 3) {
    return json({ error: 'Too many submissions. Please wait an hour.' }, 429, corsHeaders);
  }
  rateData.count += 1;
  await env.RATE_LIMIT_KV.put(rateKey, JSON.stringify(rateData), { expirationTtl: 3600 });

  /* Turnstile validation (skip if no secret configured) */
  if (env.TURNSTILE_SECRET_KEY && body.turnstile_token) {
    const ok = await verifyTurnstile(body.turnstile_token, ip, env.TURNSTILE_SECRET_KEY);
    if (!ok) return json({ error: 'Captcha failed. Please reload and try again.' }, 403, corsHeaders);
  }

  /* validate required fields */
  const { name, contact, project, tier } = body;
  if (!name?.trim() || !contact?.trim() || !project || !tier) {
    return json({ error: 'Missing required fields.' }, 400, corsHeaders);
  }

  /* generate ticket ID: VY-YYYY-MMDD-XX */
  const ticket = generateTicket();
  const createdAt = Date.now();

  /* insert into D1 */
  await env.COMMISSIONS_DB.prepare(
    `INSERT INTO commissions (id, created_at, name, contact, project, tier, deadline, notes, reference_urls, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`
  ).bind(
    ticket,
    createdAt,
    name.trim(),
    contact.trim(),
    project,
    tier,
    body.deadline?.trim() || null,
    body.notes?.trim() || null,
    JSON.stringify(body.reference_keys || [])
  ).run();

  /* send Telegram notification (non-blocking) */
  ctx_sendTelegram(env, ticket, body);

  return json({ ok: true, ticket }, 200, corsHeaders);
}

/* ── helpers ─────────────────────────────────────────────────── */

function generateTicket() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const xx = Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `VY-${yyyy}-${mm}${dd}-${xx}`;
}

async function verifyTurnstile(token, ip, secret) {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, response: token, remoteip: ip }),
  });
  const data = await res.json();
  return data.success === true;
}

function ctx_sendTelegram(env, ticket, body) {
  // Fire and forget — don't await
  sendTelegram(env, ticket, body).catch(e => console.error('Telegram error:', e));
}

async function sendTelegram(env, ticket, body) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;

  const refCount = (body.reference_keys || []).length;
  const refLine = refCount > 0 ? `References: ${refCount} attached\n` : '';

  const text = [
    `🟡 NEW COMMISSION · ${ticket}`,
    `─────────────────────────────────`,
    `${body.name}`,
    `${body.contact}`,
    ``,
    `Project: ${projectLabel(body.project)} · ${tierLabel(body.tier)}`,
    body.deadline ? `Deadline: ${body.deadline}` : null,
    ``,
    body.notes ? `Notes:\n${body.notes}` : null,
    refLine || null,
    `─────────────────────────────────`,
  ].filter(l => l !== null).join('\n');

  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '✓ Accept', callback_data: `accept:${ticket}` },
          { text: '✗ Decline', callback_data: `decline:${ticket}` },
          { text: '↩ Reply', callback_data: `reply:${ticket}` },
        ]],
      },
    }),
  });

  const data = await res.json();
  if (data.ok && data.result?.message_id) {
    // Pin the message
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/pinChatMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, message_id: data.result.message_id }),
    });

    // Store message_id for future edits on status change
    await env.COMMISSIONS_DB.prepare(
      `UPDATE commissions SET telegram_message_id = ? WHERE id = ?`
    ).bind(data.result.message_id, ticket).run();
  }
}

function projectLabel(p) {
  const map = {
    single: 'Single character',
    squad: 'Squad of 5–10',
    vehicle: 'Vehicle / war engine',
    diorama: 'Diorama / display',
    repair: 'Repair / touch-up',
    other: 'Other',
  };
  return map[p] || p;
}

function tierLabel(t) {
  const map = {
    tabletop: 'Tabletop (¥120+)',
    display: 'Display (¥600+)',
    unsure: 'Not sure',
  };
  return map[t] || t;
}

function mimeFor(ext) {
  const m = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif', gif: 'image/gif' };
  return m[ext] || 'application/octet-stream';
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}
