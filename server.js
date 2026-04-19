/**
 * EAM Mirror v2 — Main Express Server
 * Powered by Google Gemini (FREE) + YouTube Data API v3 (FREE)
 * face-api.js emotion detection (FREE, runs in browser)
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

const chatRoutes    = require('./routes/chat');
const musicRoutes   = require('./routes/music');
const emotionRoutes = require('./routes/emotion');

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
      if (msg.type === 'ping') { ws.send(JSON.stringify({ type: 'pong' })); return; }
      if (msg.type === 'chat') await wsHandler(ws, msg);
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () => console.log('[WS] Client disconnected. Total:', wss.clients.size));
  ws.send(JSON.stringify({ type: 'connected', message: 'EAM Mirror v2 WebSocket ready ✓' }));
});

/* ─── Middleware ─── */
app.use(helmet({ crossOriginEmbedderPolicy: false }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s=>s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

/* ─── Rate Limiting ─── */
app.use(rateLimit({ windowMs: 60_000, max: 150, standardHeaders: true, legacyHeaders: false }));
const chatLimiter  = rateLimit({ windowMs: 60_000, max: 40, message: { error: 'Too many chat requests. Try again in a minute.' } });
const musicLimiter = rateLimit({ windowMs: 60_000, max: 80 });

/* ─── Static Frontend ─── */
app.use(express.static(path.join(__dirname, '../frontend')));

/* ─── Routes ─── */
app.use('/api/chat',    chatLimiter,  chatRoutes);
app.use('/api/music',   musicLimiter, musicRoutes);
app.use('/api/emotion',               emotionRoutes);

/* ─── Health Check ─── */
app.get('/api/health', (req, res) => {
  res.json({
    status:    'ok',
    service:   'EAM Mirror API v2',
    version:   '2.0.0',
    aiEngine:  'Google Gemini 2.5 Flash (FREE)',
    music:     'YouTube Data API v3 (FREE)',
    emotion:   'face-api.js (FREE, browser)',
    timestamp: new Date().toISOString(),
    env: {
      gemini:  !!process.env.GEMINI_API_KEY,
      youtube: !!process.env.YOUTUBE_API_KEY,
    },
  });
});

/* ─── SPA Fallback ─── */
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));

/* ─── Error Handler ─── */
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

/* ─── Start ─── */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   🪞  EAM Mirror API  v2.0  (FREE)      ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  HTTP  →  http://localhost:${PORT}         ║`);
  console.log(`║  WS    →  ws://localhost:${PORT}/ws       ║`);
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  AI Engine  : Google Gemini 2.5 Flash  ║`);
  console.log(`║  Music      : YouTube Data API v3      ║`);
  console.log(`║  Emotion    : face-api.js (browser)    ║`);
  console.log('╚════════════════════════════════════════╝\n');
  console.log(`  Gemini key  : ${process.env.GEMINI_API_KEY  ? '✓ loaded' : '✗ MISSING — get free key at aistudio.google.com'}`);
  console.log(`  YouTube key : ${process.env.YOUTUBE_API_KEY ? '✓ loaded' : '✗ MISSING — get free key at console.developers.google.com'}`);
  console.log('');
});

module.exports = { app, wss };
