import { Hono } from 'hono'
import { apiEstimate } from '../module_quote/api_estimate'
import { apiLead } from '../module_quote/api_lead'

const quote = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET: string } }>()

// NEW: Visual Estimate Endpoint (Public)
quote.post('/estimate', async (c) => {
    return apiEstimate(c.req.raw)
})

// NEW: Lead Capture Endpoint (Public)
quote.post('/lead', async (c) => {
    return apiLead(c.req.raw, c.env)
})

// Legacy /calculate endpoint (Marked for deprecation)
quote.post('/calculate', async (c) => {
    return c.json({ error: "Deprecated. Use /api/quote/estimate" }, 410)
})

export default quote
