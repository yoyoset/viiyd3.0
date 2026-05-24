# Commission Worker — Setup Guide

## 1. Install Wrangler

```bash
npm install -g wrangler
wrangler login
```

## 2. Create Cloudflare resources

```bash
cd workers/commission

# D1 database
npm run db:create
# → copy the database_id into wrangler.toml [[d1_databases]] id field

# KV namespace for rate limiting
npm run kv:create
# → copy the id into wrangler.toml [[kv_namespaces]] id field

# R2 bucket for reference photo uploads
wrangler r2 bucket create viiyd-commission-refs
```

## 3. Set secrets

```bash
wrangler secret put TELEGRAM_BOT_TOKEN
# paste the token from @BotFather

wrangler secret put TELEGRAM_CHAT_ID
# paste your private chat ID (find it via @userinfobot)

wrangler secret put TURNSTILE_SECRET_KEY
# paste from Cloudflare Dashboard → Turnstile
```

## 4. Run the DB migration

```bash
# Local dev:
npm run db:migrate

# Production (remote):
npm run db:migrate:remote
```

## 5. Add your Turnstile site key to hugo.toml

```toml
[params]
  turnstileSiteKey = "0x4AAAAAACNE6SxZEmTQJClP"   # already there — verify it's correct
```

The modal will automatically render the Turnstile widget when this param is set.

## 6. Deploy the Worker

```bash
npm run deploy
```

## 7. Add the route in Cloudflare

After deploying, go to Cloudflare Dashboard → Workers & Pages → viiyd-commission → Triggers → Add Route:

- Route: `viiyd.com/api/commission*`
- Zone: `viiyd.com`

Or uncomment the routes in `wrangler.toml` and redeploy.

## 8. Test

Open the site, click any "Commission" or "建立委托" button, fill in the form, and submit.
You should:
- See the success state with a `VY-YYYY-MMDD-XX` ticket ID
- Receive a Telegram message pinned to your chat with inline Accept/Decline/Reply buttons

## Telegram bot quick start

1. Message @BotFather → `/newbot` → follow prompts → copy the token
2. Start a chat with your new bot (send it any message)
3. Get your chat ID: `https://api.telegram.org/bot<TOKEN>/getUpdates`
   Look for `"chat": {"id": 123456789}` in the result
4. Use that ID as `TELEGRAM_CHAT_ID`
