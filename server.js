/**
 * EAM Mirror v2 — Main Express Server
 */

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const http      = require('http');
const WebSocket = require('ws');
const path      = require('path');

// ✅ Correct imports (NO routes folder)
const chatRoutes    = require('./chat');
const musicRoutes   = require('./music');
const emotionRoutes = require('./emotion');

const app    = express();
const server = http.createServer(app);

/* ─── WebSocket ─── */
const wss      = new WebSocket.Server({ server, path: '/ws' });
const wsHandler = require('./services/ws-chat');

wss.on('connection', (ws) => {
  console.log('[WS] Client connected. Total:', wss.clients.size);

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }

      if (msg.type === 'chat') {
  ws.send(JSON.stringify({
    type: 'message',
    message: 'Chat temporarily disabled'
  }));
}
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () =>
    console.log('[WS] Client disconnected. Total:', wss.clients.size)
  );

  ws.send(JSON.stringify({
    type: 'connected',
    message: 'EAM Mirror v2 WebSocket ready ✓'
  }));
});

/* ─── Middleware ─── */
app.use(helmet({ crossOriginEmbedderPolicy: false }));

// ✅ FIXED static (serve index.html correctly)
app.use(express.static(__dirname));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error(`CORS blocked: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

/* ─── Rate Limiting ─── */
app.use(rateLimit({
  windowMs: 60000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false
}));

const chatLimiter = rateLimit({
  windowMs: 60000,
  max: 40,
  message: { error: 'Too many chat requests. Try again in a minute.' }
});

const musicLimiter = rateLimit({
  windowMs: 60000,
  max: 80
});

/* ─── Routes ─── */
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/music', musicLimiter, musicRoutes);
app.use('/api/emotion', emotionRoutes);

/* ─── Health Check ─── */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EAM Mirror API v2',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    env: {
      gemini: !!process.env.GEMINI_API_KEY,
      youtube: !!process.env.YOUTUBE_API_KEY,
    },
  });
});

/* ─── SPA Fallback ─── */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* ─── Error Handler ─── */
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

/* ─── Start ─── */
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket running on ws://localhost:${PORT}/ws`);
});

module.exports = { app, wss };
