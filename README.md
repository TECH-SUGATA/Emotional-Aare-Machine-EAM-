<div align="center">

# 🪞 Emotional Aware Machine (EAM)
**Emotion → Intelligence → Music**

*An intelligent digital companion that understands your soul through your expressions.*

[![GitHub Stars](https://img.shields.io/github/stars/TECH-SUGATA/Emotional-Aare-Machine-EAM-?style=for-the-badge&color=ffd700)](https://github.com/TECH-SUGATA/Emotional-Aare-Machine-EAM-/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![JS](https://img.shields.io/badge/Language-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)]()
[![AI](https://img.shields.io/badge/AI-Gemini_2.5_Flash-orange?style=for-the-badge&logo=google-gemini)]()

[**Explore Live Demo 🌐**](https://tech-sugata.github.io/Emotional-Aare-Machine-EAM-/) • [**Report Bug 🐛**](https://github.com/TECH-SUGATA/Emotional-Aare-Machine-EAM-/issues) • [**Request Feature 💡**](https://github.com/TECH-SUGATA/Emotional-Aare-Machine-EAM-/issues)

---

"The machine doesn't just listen to your commands; it understands your heart."

</div>

## 📖 What is EAM?
**Emotional Aware Machine (EAM)** is a cutting-edge digital ecosystem designed to harmonize technology with human emotion. It leverages real-time facial recognition and generative AI to interpret your mood and curate a personalized environment through music and interactive conversation. 

Whether you're feeling joyful, stressed, or contemplative, EAM adapts to your vibe in real-time.

---

## ⚡ The Experience Flow
1. **Perception:** Camera feed detects facial micro-expressions using `face-api.js`.
2. **Cognition:** **Gemini 2.5 Flash** processes the emotional data to understand your context.
3. **Response:** A curated YouTube soundtrack and AI-driven chat response are generated instantly.

---

## 🚀 Key Features

* **😊 Emotion Intelligence:** On-device facial emotion recognition. Fast, private, and runs directly in the browser.
* **🤖 AI Companion:** High-level conversational AI supporting Hindi, English, and Hinglish.
* **🎵 Smart Music Engine:** Dynamic music curation across various genres (Hindi, Bengali, English, etc.) based on emotional valence.
* **🎭 Adaptive UI:** A premium "Mirror" interface that shifts its theme and visual accents based on your detected mood.
* **📓 Mood Journal:** Track your emotional journey over time with a lightweight, private logging system.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Premium Dark Theme), JavaScript (ES6+) |
| **Emotion Engine** | `face-api.js` (TensorFlow.js) |
| **Intelligence** | Google Gemini 2.5 Flash API |
| **Music Integration** | YouTube Data API & IFrame Player |
| **Backend** | Node.js + Express |

---

## 📂 Project Structure
```text
eam-mirror/
├── 📂 backend/
│   ├── server.js        # Express Core
│   ├── 📂 routes/       # API endpoints (Gemini AI, YouTube Data)
│   └── 📂 services/     # WebSocket & Logic handlers
└── 📂 frontend/
    ├── index.html       # Adaptive UI Shell
    └── 📂 js/           # app.js & Emotion detection logic


2. Setup Environment
Go to the backend folder and install dependencies:
cd backend
npm install
cp .env.example .env
Note: Open the .env file and add your GEMINI_API_KEY and YOUTUBE_API_KEY.

3. Launch
npm start

Open your browser to http://localhost:3000 to start the experience.
📁 Project Structure

eam-mirror/
├── 📂 backend/
│   ├── server.js        # Express server core
│   ├── 📂 routes/       # API endpoints (AI Chat, Music, Emotion)
│   └── 📂 services/     # WebSocket & Business logic
└── 📂 frontend/
    ├── index.html       # Adaptive UI shell
    └── 📂 js/           # app.js & Emotion engine logic

🌱 Roadmap
[ ] Phase 1: Spotify & Apple Music API integration for high-quality streaming.
[ ] Phase 2: Advanced Emotion Analytics Dashboard for trend tracking.
[ ] Phase 3: Multi-modal support (Voice tone analysis).
[ ] Phase 4: Mobile-native version for Android and iOS.
👨‍💻 Developed By
Sugata Nayak
Full Stack Developer • AI/ML Builder
🌟 Show Your Support
If this project resonates with you:
Star the repository to show your appreciation.
Fork the project to build your own version.
Share the project with friends or on social media.
License: Open-source and available for innovation under the MIT License

