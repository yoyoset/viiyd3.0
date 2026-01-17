import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
    DB: D1Database
    SESSION_KV: KVNamespace
    JWT_SECRET: string
    STRIPE_API_KEY: string
}

import auth from './routes/auth'
import quote from './routes/quote'
import payment from './routes/payment'

const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use('*', cors({
    origin: ['https://viiyd.com', 'http://localhost:1313'], // Add your dev URL
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
}))

// Mount Routes
app.route('/api/auth', auth)
app.route('/api/quote', quote)
app.route('/api/payment', payment)

// Health Check
app.get('/', (c) => {
    return c.text('Viiyd Worker API is running!')
})

// Error Handling
app.onError((err, c) => {
    console.error(`${err}`)
    return c.json({ error: 'Internal Server Error', message: err.message }, 500)
})

export default app
