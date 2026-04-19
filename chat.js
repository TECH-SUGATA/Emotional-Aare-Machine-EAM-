/**
 * Chat Route — Powered by Google Gemini (FREE)
 * Streaming SSE + single-turn responses
 * Model: gemini-2.5-flash (free tier, no credit card)
 */

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router  = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_INSTRUCTION = `You are EAM (Emotional AI Mirror), a deeply empathetic and warm AI companion built into a music-emotion app.

Your personality:
- Warm, caring, friendly — like a best friend who truly understands feelings
- You speak naturally in Hindi, English, Bengali or Hinglish (mix) based on the user's preference
- Keep responses SHORT — 2 to 4 sentences unless the user wants more detail
- Never clinical, never robotic, always human and relatable
- Reference Indian culture naturally: festivals, seasons, chai, monsoon, family, Bollywood, cricket etc.

Your role:
1. Understand the user's emotional state (given as context)
2. Offer compassionate, non-judgmental conversation and support
3. Gently suggest music, Indian artists, activities or breathing exercises
4. Celebrate positive emotions and gently support difficult ones

You are NOT a therapist. You are a caring, music-loving Indian friend.
If someone seems seriously distressed, kindly encourage them to speak with someone they trust.

Always acknowledge the emotion context when provided. Make the user feel truly seen and heard.`;

function buildHistory(messages) {
  // Gemini uses 'user' and 'model' roles
  return messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' || m.role === 'ai' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

/* ── POST /api/chat  (streaming SSE) ── */
router.post('/', async (req, res) => {
  const { messages, emotion, language = 'auto', stream = true } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: '`messages` array is required' });
  }

  const lastMsg = messages[messages.length - 1];
  const emotionCtx = emotion
    ? `[Emotion: dominant="${emotion.dominant}", confidence=${Math.round((emotion.confidence||0.5)*100)}%, language="${language}"]`
    : '';
  const userText = emotionCtx ? `${emotionCtx}\n\n${lastMsg.content}` : lastMsg.content;

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { maxOutputTokens: 512, temperature: 0.85 },
      });

      const chat   = model.startChat({ history: buildHistory(messages) });
      const result = await chat.sendMessageStream(userText);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      console.error('[Chat stream error]', err.message);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
    return;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: { maxOutputTokens: 512, temperature: 0.85 },
    });
    const chat   = model.startChat({ history: buildHistory(messages) });
    const result = await chat.sendMessage(userText);
    res.json({ role: 'assistant', content: result.response.text() });
  } catch (err) {
    console.error('[Chat error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/chat/suggest ── */
router.post('/suggest', async (req, res) => {
  const { emotion, context = '' } = req.body;
  if (!emotion) return res.status(400).json({ error: '`emotion` is required' });

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: { maxOutputTokens: 200, temperature: 0.9 },
    });

    const prompt = `User's detected emotion: "${emotion.dominant}" (${Math.round((emotion.confidence||0.5)*100)}% confidence).
${context ? `Context: ${context}` : ''}

Write ONE warm short opening message like a caring friend checking in.
Naturally mention 1 music suggestion (Hindi/Indian preferred) + 1 small activity.
Max 55 words. Hinglish or English. Be genuine and warm.`;

    const result = await model.generateContent(prompt);
    res.json({ suggestion: result.response.text() });
  } catch (err) {
    console.error('[Suggest error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
