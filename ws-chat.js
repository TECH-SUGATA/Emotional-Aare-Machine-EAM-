/**
 * WebSocket Chat — Gemini streaming
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM = `You are EAM (Emotional AI Mirror), a warm empathetic AI companion in a music-emotion app.
Speak naturally in English, Hindi, Bengali or Hinglish depending on user preference.
Keep responses short (2-4 sentences). Be like a caring friend who loves music and understands emotions deeply.
Reference Indian music, seasons, festivals naturally. Never be clinical or robotic.`;

module.exports = async function handleWsChat(ws, msg) {
  const { messages = [], emotion, requestId } = msg;
  if (!messages.length) return;

  const send = (obj) => { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); };
  send({ type: 'chat_start', requestId });

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM,
      generationConfig: { maxOutputTokens: 512, temperature: 0.85 },
    });

    const history = messages.slice(0, -1).map(m => ({
      role:  m.role === 'assistant' || m.role === 'ai' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMsg   = messages[messages.length - 1];
    const emotionCtx = emotion ? `[Emotion: ${JSON.stringify(emotion)}]\n` : '';
    const userText   = emotionCtx + lastMsg.content;

    const chat   = model.startChat({ history });
    const result = await chat.sendMessageStream(userText);

    for await (const chunk of result.stream) {
      const token = chunk.text();
      if (token) send({ type: 'chat_token', token, requestId });
    }

    send({ type: 'chat_end', requestId });
  } catch (err) {
    send({ type: 'chat_error', message: err.message, requestId });
  }
};
