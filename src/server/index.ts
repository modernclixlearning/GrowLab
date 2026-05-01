import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'
import { authRoutes } from './routes/auth'
import { plantsRoutes } from './routes/plants'

const app = new Hono()

// CORS for dev (Vite dev server on port 3000)
app.use(
  '/api/*',
  cors({
    origin: process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000'],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)

// API routes
app.route('/api/auth', authRoutes)
app.route('/api/plants', plantsRoutes)

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: './dist/client' }))
  // SPA fallback
  app.get('/*', serveStatic({ path: './dist/client/index.html' }))
}

const port = parseInt(process.env.API_PORT ?? '4001', 10)
serve({ fetch: app.fetch, port }, () => {
  console.log(`API server running on http://localhost:${port}`)
})
