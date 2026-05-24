/**
 * Cloudflare Pages Function — /api/commission
 * Proxies to viiyd-contact-handler worker which holds all bindings & secrets.
 */
const WORKER_URL = 'https://viiyd-contact-handler.yoyoset.workers.dev/api/commission';

export async function onRequestPost(context) {
  try {
    const req = new Request(WORKER_URL, {
      method: 'POST',
      headers: context.request.headers,
      body: context.request.body,
    });
    const res = await fetch(req);
    // Pass response back, stripping CORS headers (Pages adds its own)
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: 'Gateway error' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
