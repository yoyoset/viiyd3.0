import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import { setCookie, deleteCookie, getCookie } from 'hono/cookie'

const auth = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET: string } }>()

// Helper hash function (using Web Crypto API)
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// 1. Register User
auth.post('/register', async (c) => {
    const { email, password } = await c.req.json()

    if (!email || !password) return c.json({ error: 'Missing fields' }, 400)

    const passwordHash = await hashPassword(password)
    const id = crypto.randomUUID()
    const now = Math.floor(Date.now() / 1000)

    try {
        await c.env.DB.prepare(
            `INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
        ).bind(id, email, passwordHash, now, now).run()

        return c.json({ message: 'User created', userId: id }, 201)
    } catch (e) {
        return c.json({ error: 'Email already exists or DB error' }, 409)
    }
})

// 2. Login
auth.post('/login', async (c) => {
    const { email, password } = await c.req.json()
    const passwordHash = await hashPassword(password)

    // Validate user
    const user = await c.env.DB.prepare(
        `SELECT * FROM users WHERE email = ? AND password_hash = ?`
    ).bind(email, passwordHash).first()

    if (!user) return c.json({ error: 'Invalid credentials' }, 401)

    // Create JWT
    const payload = {
        sub: user.id,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    }
    const token = await sign(payload, c.env.JWT_SECRET)

    // Set HttpOnly Cookie
    setCookie(c, 'auth_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'None', // Adjust based on frontend domain
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
    })

    return c.json({ message: 'Logged in success' })
})

// 3. Get Current User (Protected)
auth.get('/me', async (c) => {
    const token = getCookie(c, 'auth_token')
    if (!token) return c.json({ error: 'Unauthorized' }, 401)

    try {
        const payload = await verify(token, c.env.JWT_SECRET, "HS256")
        const user = await c.env.DB.prepare('SELECT id, email, role FROM users WHERE id = ?').bind(payload.sub).first()
        return c.json({ user })
    } catch (e) {
        return c.json({ error: 'Invalid token' }, 401)
    }
})

// 4. Logout
auth.post('/logout', (c) => {
    deleteCookie(c, 'auth_token')
    return c.json({ message: 'Logged out' })
})

export default auth
