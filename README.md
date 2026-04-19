# 🪞 EAM Mirror v2 — Emotional AI Music Companion
### 100% FREE APIs — No Credit Card Needed

![Free](https://img.shields.io/badge/Cost-100%25%20FREE-22c55e?style=for-the-badge)
![Gemini](https://img.shields.io/badge/AI-Google%20Gemini%202.5%20Flash-4285F4?style=for-the-badge)
![YouTube](https://img.shields.io/badge/Music-YouTube%20API%20v3-FF0000?style=for-the-badge)

---

## ✨ What's Free & How

| Feature | Technology | Cost |
|---|---|---|
| 😊 Real-time emotion detection | face-api.js (runs in browser) | **FREE forever** |
| 🤖 AI chat (Hindi/Hinglish/English) | Google Gemini 2.5 Flash | **FREE** (generous quota) |
| 🎵 Indian music recommendations | AI picks songs → YouTube search | **FREE** (10K units/day) |
| ▶️ In-app music playback | YouTube IFrame Player API | **FREE** |
| 🎭 5 visual themes | Built-in CSS | **FREE** |
| 📓 Mood journal | localStorage | **FREE** |

---

## 🚀 3-Step Setup

### Step 1 — Get 2 FREE API Keys (5 minutes)

**A) Google Gemini Key (for AI chat)**
1. Visit [aistudio.google.com](https://aistudio.google.com)
2. Sign in with Google account
3. Click **"Get API Key"** → **"Create API key"**
4. Copy the key (starts with `AIza...`)

**B) YouTube Data API v3 Key (for music)**
1. Visit [console.developers.google.com](https://console.developers.google.com)
2. Create a new project → **"Enable APIs"**
3. Search **"YouTube Data API v3"** → Enable it
4. Go to **Credentials** → **"+ Create Credentials"** → **API Key**
5. Copy the key (also starts with `AIza...`)

> Both keys can be the SAME Google project — just enable both APIs!

---

### Step 2 — Setup Backend

```bash
cd eam-mirror/backend

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
```

Open `.env` and paste your keys:
```env
GEMINI_API_KEY=AIza...your_gemini_key...
YOUTUBE_API_KEY=AIza...your_youtube_key...
PORT=3000
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000
```

```bash
# Start the server
npm start
```

You'll see:
```
╔════════════════════════════════════════╗
║   🪞  EAM Mirror API  v2.0  (FREE)      ║
╠════════════════════════════════════════╣
║  HTTP  →  http://localhost:3000        ║
╚════════════════════════════════════════╝

  Gemini key  : ✓ loaded
  YouTube key : ✓ loaded
```

---

### Step 3 — Open the App

Just go to: **http://localhost:3000**

That's it! 🎉

---

## 🎵 Supported Indian Languages & Artists

| Language | Artists |
|---|---|
| 🇮🇳 Hindi | Arijit Singh, AR Rahman, Shreya Ghoshal, Atif Aslam, Sonu Nigam, KK, Mohit Chauhan, Armaan Malik, Jubin Nautiyal, Neha Kakkar |
| 🎵 Bengali | Nachiketa, Lopamudra Mitra, Rupankar, Shironamhin, Anupam Roy, Arijit Singh Bengali |
| 🎤 Punjabi | Diljit Dosanjh, Satinder Sartaaj, Gurdas Maan, B Praak, Harrdy Sandhu |
| 🎭 Tamil | AR Rahman Tamil, Sid Sriram, Anirudh Ravichander |
| 🎸 English | Major international artists |
| 🎷 Instrumental | Classical Indian, Lofi, Meditation |

---

## 📱 App Flow

```
Splash → Login → Onboarding
              ↓
   Scanner (face-api.js detects emotion live)
              ↓
   Music Page (Gemini AI picks songs → YouTube plays them)
              ↓
   Chat (Gemini 2.5 Flash talks in Hindi/Hinglish/English)
              ↓
   Journal (save mood entries with emotion tagging)
```

---

## 🔧 Troubleshooting

| Problem | Fix |
|---|---|
| "Backend offline" | Run `npm start` in `backend/` folder |
| "No music loading" | Check YouTube API key in `.env` |
| "AI chat not working" | Check Gemini API key in `.env` |
| "Camera denied" | Allow camera in browser — app works in demo mode too |
| Port 3000 in use | Change `PORT=3001` in `.env` |

---

## 🚢 Deploy for Free

**Render.com** (recommended):
1. Push to GitHub
2. New Web Service → connect repo → `npm start`
3. Add env vars in Render dashboard

---

## 📁 Structure

```
eam-mirror/
├── backend/
│   ├── server.js          ← Express server
│   ├── package.json
│   ├── .env.example       ← Copy to .env
│   ├── routes/
│   │   ├── chat.js        ← Gemini AI chat (SSE streaming)
│   │   ├── music.js       ← YouTube music recommendations
│   │   └── emotion.js     ← Emotion analysis
│   └── services/
│       └── ws-chat.js     ← WebSocket handler
└── frontend/
    ├── index.html
    └── js/app.js
```
