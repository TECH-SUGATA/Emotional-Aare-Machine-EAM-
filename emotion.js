/**
 * Emotion Route — Gemini-powered emotion analysis
 */

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router  = express.Router();

const genAI   = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const sessions = new Map(); // In-memory; replace with DB for production

/* ── POST /api/emotion/analyze ── */
router.post('/analyze', async (req, res) => {
  const { sessionId, emotions, dominant, confidence, timestamp } = req.body;
  if (!emotions || !dominant) return res.status(400).json({ error: '`emotions` and `dominant` required' });

  // Save to session history
  if (sessionId) {
    if (!sessions.has(sessionId)) sessions.set(sessionId, []);
    const arr = sessions.get(sessionId);
    arr.push({ emotions, dominant, confidence, timestamp: timestamp || new Date().toISOString() });
    if (arr.length > 50) arr.splice(0, arr.length - 50);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { maxOutputTokens: 250, temperature: 0.7, responseMimeType: 'application/json' },
    });

    const prompt = `Analyze this emotion scan for a music app user.
Detected emotions: ${JSON.stringify(emotions)}
Dominant: ${dominant} (confidence: ${Math.round((confidence||0.8)*100)}%)

Return ONLY a JSON object:
{
  "displayName": "human-friendly emotion name",
  "emoji": "single emoji",
  "tagline": "5-8 word poetic description",
  "musicMood": "one of: happy|sad|calm|energetic|romantic|focused|anxious|angry",
  "colorHex": "#hexcolor representing this emotion",
  "message": "one warm short sentence in Hinglish or English"
}`;

    const result = await model.generateContent(prompt);
    let analysis = {};
    try {
      analysis = JSON.parse(result.response.text());
    } catch {
      // Safe fallback
      const fallbacks = {
        happy:    { displayName:'Joy & Elation',    emoji:'😊', tagline:'Your heart sings with happiness',      musicMood:'happy',     colorHex:'#fbbf24', message:'Aaj toh kuch special sunate hain! 🎵' },
        sad:      { displayName:'Feeling Low',       emoji:'😢', tagline:'A gentle soul needing warmth',         musicMood:'sad',       colorHex:'#60a5fa', message:'Koi baat nahi, music sambhal lega.' },
        angry:    { displayName:'Fire Within',       emoji:'😠', tagline:'Intense energy ready to explode',      musicMood:'energetic', colorHex:'#ef4444', message:'Iss energy ko music se channel karo!' },
        fearful:  { displayName:'Need Comfort',      emoji:'😨', tagline:'Seeking peace and reassurance',       musicMood:'anxious',   colorHex:'#8b5cf6', message:'Saans lo, sab theek ho jayega. 🌸' },
        surprised:{ displayName:'Wide-Eyed Wonder',  emoji:'😲', tagline:'Something unexpected just happened',  musicMood:'happy',     colorHex:'#f97316', message:'Wah! Kya surprise hai aaj!' },
        disgusted:{ displayName:'Reset Mode',        emoji:'🤢', tagline:'Time for a fresh new start',          musicMood:'energetic', colorHex:'#84cc16', message:'Chalo kuch alag sunte hain.' },
        neutral:  { displayName:'Balanced State',    emoji:'😐', tagline:'Calm and steady as you are',          musicMood:'calm',      colorHex:'#94a3b8', message:'Peaceful vibes ke liye perfect time hai.' },
      };
      analysis = fallbacks[dominant] || fallbacks.neutral;
    }

    res.json({ dominant, confidence, analysis, timestamp: timestamp || new Date().toISOString() });
  } catch (err) {
    console.error('[Emotion analyze error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/emotion/history?sessionId=xxx ── */
router.get('/history', (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: '`sessionId` required' });
  const history = sessions.get(sessionId) || [];
  res.json({ sessionId, history, stats: computeStats(history) });
});

/* ── GET /api/emotion/list ── */
router.get('/list', (req, res) => {
  res.json({
    emotions: [
      { key:'happy',     label:'Happy',     emoji:'😊', color:'#fbbf24' },
      { key:'sad',       label:'Sad',       emoji:'😢', color:'#60a5fa' },
      { key:'angry',     label:'Angry',     emoji:'😠', color:'#ef4444' },
      { key:'fearful',   label:'Fearful',   emoji:'😨', color:'#8b5cf6' },
      { key:'disgusted', label:'Disgusted', emoji:'🤢', color:'#84cc16' },
      { key:'surprised', label:'Surprised', emoji:'😲', color:'#f97316' },
      { key:'neutral',   label:'Neutral',   emoji:'😐', color:'#94a3b8' },
    ],
  });
});

function computeStats(history) {
  if (!history.length) return {};
  const counts = {};
  history.forEach(h => { counts[h.dominant] = (counts[h.dominant]||0) + 1; });
  const dominant = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0];
  return { totalScans: history.length, dominantEmotion: dominant, emotionCounts: counts, lastScan: history[history.length-1]?.timestamp };
}

module.exports = router;
