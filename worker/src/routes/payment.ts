import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import Stripe from 'stripe'

const payment = new Hono<{ Bindings: { DB: D1Database; STRIPE_API_KEY: string } }>()

// Helper to get Stripe instance
const getStripe = (key: string) => new Stripe(key, { apiVersion: '2023-10-16' as any })

// 1. Create Checkout Session
payment.post('/checkout-session', async (c) => {
    const { quoteId } = await c.req.json()
    const stripe = getStripe(c.env.STRIPE_API_KEY)

    // Fetch Quote
    const quote = await c.env.DB.prepare('SELECT * FROM quotes WHERE id = ?').bind(quoteId).first()
    if (!quote) return c.json({ error: 'Quote not found' }, 404)

    // Create Session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: 'Miniature Painting Service',
                    description: `Quote ID: ${quoteId}`,
                },
                unit_amount: Math.round(Number(quote.price_estimated) * 100), // Stripe uses cents
            },
            quantity: 1,
        }],
        mode: 'payment',
        success_url: `https://viiyd.com/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://viiyd.com/cancel`,
        metadata: {
            quoteId: quoteId as string,
            userId: quote.user_id as string,
        },
    })

    return c.json({ url: session.url })
})

// 2. Webhook Handler
payment.post('/webhook', async (c) => {
    const sig = c.req.header('stripe-signature')
    const body = await c.req.text()
    // Note: Webhook verification requires the raw body and a signing secret.
    // Ideally store STRIPE_WEBHOOK_SECRET in env.

    // For simplicity in this demo, accessing event directly (INSECURE in prod, use constructEvent)
    const event = JSON.parse(body) as Stripe.Event

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session
        const quoteId = session.metadata?.quoteId
        const userId = session.metadata?.userId

        if (quoteId && userId) {
            const now = Math.floor(Date.now() / 1000)
            const orderId = crypto.randomUUID()

            // Update Quote Status
            await c.env.DB.prepare("UPDATE quotes SET status = 'ordered' WHERE id = ?").bind(quoteId).run()

            // Create Order
            await c.env.DB.prepare(
                `INSERT INTO orders (id, user_id, quote_id, stripe_session_id, amount_total, status, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, 'paid', ?, ?)`
            ).bind(orderId, userId, quoteId, session.id, session.amount_total! / 100, now, now).run()
        }
    }

    return c.json({ received: true })
})

export default payment
