/**
 * Music Route — Gemini AI Song Recommendations + YouTube Search
 * 100% Free: Gemini (free tier) + YouTube Data API v3 (free tier)
 */

const express = require('express');
const axios   = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router  = express.Router();

const genAI  = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const YT_BASE = 'https://www.googleapis.com/youtube/v3';

/* ── Emotion → curated Indian song queries ── */
const EMOTION_PLAYLISTS = {
  happy: {
    hindi:        ['Kesariya Arijit Singh', 'Tum Hi Ho Arijit Singh', 'London Thumakda', 'Badtameez Dil', 'Gallan Goodiyan', 'Nagada Sang Dhol', 'Balam Pichkari', 'Dilliwali Girlfriend'],
    bengali:      ['Ei Moner Gohine Tumi', 'Mon Majhi Re', 'Tomake Chai Arijit Singh Bengali', 'Hawa Hawa Bengali', 'Sada Sada Kala Kala'],
    punjabi:      ['Proper Patola', 'Lamberghini Doorbeen', 'Morni Banke', 'Ik Vaari Aa', 'Naah Harrdy Sandhu', 'G.O.A.T Diljit Dosanjh'],
    tamil:        ['Rowdy Baby Maari 2', 'Kannaana Kanney', 'Aalaporan Tamizhan', 'Vaathi Coming'],
    instrumental: ['Shankar Ehsaan Loy instrumental', 'AR Rahman piano instrumental', 'Bollywood happy instrumental'],
    english:      ['Happy Pharrell Williams', 'Blinding Lights The Weeknd', 'Levitating Dua Lipa', 'Good as Hell Lizzo'],
  },
  sad: {
    hindi:        ['Channa Mereya Arijit Singh', 'Tujhe Kitna Chahne Lage', 'Agar Tum Saath Ho', 'Phir Le Aya Dil', 'Hamari Adhuri Kahani', 'Kabira YJHD Arijit', 'Main Rahoon Ya Na Rahoon Armaan Malik', 'Tera Yaar Hoon Main'],
    bengali:      ['Tumi Jake Bhalobaso Nachiketa', 'Ei Raat Tomar Aamar Shironamhin', 'Aamar Sonar Bangla Tagore', 'Eki Labonye Prabir'],
    punjabi:      ['Ranjha Shershaah B Praak', 'Dooriyan Love Aaj Kal', 'Aithey Aa'],
    tamil:        ['Munbe Vaa Sillunu Oru Kadhal', 'Venmathi Venmathiye', 'Nenjukkul Peidhidum'],
    instrumental: ['Sad Hindi instrumental piano', 'Melancholic Indian music', 'Sitar sad classical'],
    english:      ['Let Her Go Passenger', 'Fix You Coldplay', 'Someone Like You Adele', 'The Night We Met Lord Huron'],
  },
  angry: {
    hindi:        ['Zinda Hai Toh Tiger Zinda Hai', 'Malhari Bajirao Mastani', 'Khalibali Padmaavat', 'Swag Se Swagat', 'Ghungroo War', 'Jai Jai Shivshankar'],
    punjabi:      ['5 Taara Diljit', 'Ikk Kudi Udta Punjab', 'Sauda Khara Khara'],
    tamil:        ['Vaathi Coming Master', 'Beast Mode Thalapathy'],
    english:      ['Lose Yourself Eminem', 'Eye of the Tiger Survivor', 'Thunderstruck ACDC', 'Believer Imagine Dragons'],
    instrumental: ['Power intense instrumental', 'High energy Indian drums dhol'],
  },
  fearful: {
    hindi:        ['Namo Namo Kedarnath', 'Ik Onkar AR Rahman', 'Om Namah Shivaya mantra peaceful', 'Gayatri Mantra calm'],
    bengali:      ['Ananda Dhara Bahiche Tagore', 'Durga Durge Durgotinashini'],
    instrumental: ['432 Hz healing frequency music', 'Tibetan singing bowls meditation', 'Deep breathing relaxation music', 'Indian flute bansuri calm'],
    english:      ['Weightless Marconi Union', 'Solfeggio 528 Hz healing'],
  },
  disgusted: {
    hindi:        ['Shake It Off Hindi remix', 'Aankh Marey Simmba', 'Desi Girl Dostana', 'Dhoom 2 theme'],
    english:      ['Shake It Off Taylor Swift', 'Roar Katy Perry', 'Stronger Kanye West'],
    punjabi:      ['Jatt Di Clip 2 Sidhu Moosewala'],
  },
  surprised: {
    hindi:        ['Chammak Challo Ra One', 'Desi Girl Dostana', 'Bhaag DK Bose Delhi Belly', 'Drama Queen'],
    english:      ['Uptown Funk Bruno Mars', 'Happy Pharrell', 'Can\'t Stop the Feeling Justin Timberlake'],
    punjabi:      ['Muchh Rakhi Aa Pav Dharia'],
  },
  neutral: {
    hindi:        ['Ilahi YJHD Arijit Singh', 'Yeh Dooriyan Love Aaj Kal', 'Safar Jab Harry Met Sejal', 'Pichle Saat Dinon Mein', 'Tera Hone Laga Hoon Atif Aslam'],
    bengali:      ['Mon Majhi Re Bobby Hain', 'Ei Shohorer Sheshe Anupam Roy', 'Aamader Chhutiir Din'],
    instrumental: ['Morning raga Indian classical', 'Peaceful sitar music', 'Indian lofi chill beats'],
    english:      ['Circles Post Malone', 'Sunflower Post Malone Spider-Man', 'Watermelon Sugar Harry Styles'],
  },
  calm: {
    hindi:        ['Lag Ja Gale Lata Mangeshkar', 'O Re Piya Aaja Nachle', 'Tujhse Naraaz Nahin Zindagi', 'Sooraj Ki Baahon Mein', 'Raabta Agent Sasco', 'Tera Ban Jaunga Kabir Singh'],
    bengali:      ['Tumi Robe Nirobe Rabindra Sangeet', 'Aguner Poroshmoni', 'Aaj Ei Meghla Raat', 'Swapno Je Tor'],
    instrumental: ['Raag Yaman sitar evening', 'Ravi Shankar morning raga', 'Bansuri flute meditation', 'Veena classical peaceful'],
    english:      ['Weightless Marconi Union', 'Clair de Lune Debussy', 'River Joni Mitchell'],
  },
  energetic: {
    hindi:        ['Zinda Hai Toh Tiger Zinda Hai', 'Malhari Bajirao Mastani', 'Ghungroo War Hrithik', 'Khalibali Padmaavat', 'Swag Se Swagat Tiger Zinda Hai', 'Jai Jai Shivshankar War'],
    bengali:      ['Aalo Aalo Nachiketa', 'Tumi Aacho Tai'],
    punjabi:      ['G.O.A.T Diljit Dosanjh', 'Patiala Peg Diljit', '5 Taara Diljit', 'Proper Patola'],
    english:      ['Eye of the Tiger Survivor', 'Lose Yourself Eminem', 'Thunderstruck ACDC', 'Believer Imagine Dragons'],
  },
  romantic: {
    hindi:        ['Tum Se Hi Jab We Met', 'Jeene Laga Hoon Ramaiya Vastavaiya', 'Dil Dhadakne Do title', 'Pehla Nasha Jo Jeeta', 'Tere Bina Guru Arijit', 'Tera Ban Jaunga Arijit Kabir Singh'],
    bengali:      ['Lukochuri Mon Nachiketa', 'Tomari Hote Chai', 'Bhalobasha Mane', 'Chand Ke Paar Chalo Bengali'],
    punjabi:      ['Tenu Leke Salaam E Ishq', 'Yaar Anmulle Gurdas Maan'],
    english:      ['Perfect Ed Sheeran', 'All of Me John Legend', 'Thinking Out Loud Ed Sheeran'],
  },
  focused: {
    hindi:        ['AR Rahman instrumental focus', 'Slowed reverb Bollywood study', 'Hindi lofi beats study'],
    instrumental: ['Indian classical morning raga study', 'Raag Bhairav morning study', 'Tabla meditation rhythm focus'],
    english:      ['Lo-fi hip hop study beats', 'Chill study music ambient', 'Brain.fm focus music'],
  },
  anxious: {
    hindi:        ['Namo Namo Kedarnath AR Rahman', 'Ik Onkar Waheguru peaceful', 'Om Namah Shivaya mantra', 'Shiv Stuti calming'],
    bengali:      ['Ananda Dhara Bahiche Tagore', 'Tumi Robe Nirobe calm Rabindra Sangeet'],
    instrumental: ['432 Hz healing music anxiety', 'Tibetan singing bowls stress relief', 'Pranayama breathing music', 'Bansuri flute stress relief'],
    english:      ['Weightless Marconi Union stress', '40 Hz gamma waves focus calm'],
  },
};

const LANG_LABELS = {
  hindi: '🇮🇳 Hindi', bengali: '🎵 Bengali', punjabi: '🎤 Punjabi',
  tamil: '🎭 Tamil', telugu: '🎬 Telugu', english: '🎸 English',
  instrumental: '🎷 Instrumental', all: '🌐 All',
};

/* ── YouTube search helper ── */
async function ytSearch(query, maxResults = 6) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('YouTube API key not configured');

  const { data } = await axios.get(`${YT_BASE}/search`, {
    params: {
      part: 'snippet', q: query, type: 'video',
      videoCategoryId: '10', maxResults,
      regionCode: 'IN', relevanceLanguage: 'hi', key,
    },
    timeout: 8000,
  });

  return (data.items || []).map(item => ({
    id:        item.id.videoId,
    title:     item.snippet.title,
    artist:    item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
  }));
}

/* ── GET /api/music/recommend ── */
router.get('/recommend', async (req, res) => {
  const { emotion = 'neutral', language = 'hindi', max = 12 } = req.query;

  const playlist = EMOTION_PLAYLISTS[emotion.toLowerCase()] || EMOTION_PLAYLISTS.neutral;
  const lang     = language.toLowerCase();
  const queries  = playlist[lang] || playlist.hindi || Object.values(playlist)[0] || [];

  if (!queries.length) {
    return res.json({ tracks: [], emotion, language, message: 'No curated tracks for this combination' });
  }

  const sample = [...queries].sort(()=>Math.random()-.5).slice(0, Math.min(Number(max), queries.length));

  try {
    const results = await Promise.allSettled(sample.map(q => ytSearch(q, 2)));

    const tracks = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .filter((v, i, a) => v.id && a.findIndex(t => t.id === v.id) === i)
      .map(t => ({ ...t, language: lang }))
      .slice(0, Number(max));

    res.json({ emotion, language, languageLabel: LANG_LABELS[lang] || lang, tracks, totalFound: tracks.length });
  } catch (err) {
    console.error('[Music recommend error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/music/ai-recommend  — Gemini picks song names, YouTube finds them ── */
router.post('/ai-recommend', async (req, res) => {
  const { emotion, mood_detail, language = 'hindi', count = 10 } = req.body;
  if (!emotion) return res.status(400).json({ error: '`emotion` is required' });

  try {
    // Step 1: Gemini generates song recommendations
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { maxOutputTokens: 500, temperature: 0.8, responseMimeType: 'application/json' },
    });

    const prompt = `You are an expert in Indian music across all languages.
The user is currently feeling: ${emotion}${mood_detail ? ` (${mood_detail})` : ''}.
Preferred language: ${language}.

Recommend exactly ${count} songs that perfectly match this emotion.
Focus on these artists based on language:
- Hindi: Arijit Singh, AR Rahman, Shreya Ghoshal, Atif Aslam, Sonu Nigam, KK, Mohit Chauhan, Armaan Malik, Jubin Nautiyal, Neha Kakkar
- Bengali: Nachiketa, Lopamudra Mitra, Rupankar, Shironamhin, Anupam Roy, Arijit Singh Bengali songs
- Punjabi: Diljit Dosanjh, Satinder Sartaaj, Gurdas Maan, B Praak, Harrdy Sandhu
- Tamil: AR Rahman Tamil, Sid Sriram, Anirudh Ravichander
- English: Popular emotional matching songs

Respond ONLY with a valid JSON array, no markdown, no explanation:
[{"title":"Song Name","artist":"Artist Name","language":"hindi","reason":"why this matches the mood"}]`;

    const result = await model.generateContent(prompt);
    let songs = [];
    try {
      songs = JSON.parse(result.response.text());
    } catch {
      return res.status(500).json({ error: 'Failed to parse AI recommendations' });
    }

    // Step 2: Search YouTube for each song
    const ytResults = await Promise.allSettled(
      songs.map(s => ytSearch(`${s.title} ${s.artist} official audio`, 1))
    );

    const tracks = songs.map((s, i) => {
      const yt = ytResults[i]?.status === 'fulfilled' ? ytResults[i].value[0] : null;
      return {
        title:     s.title,
        artist:    s.artist,
        language:  s.language,
        reason:    s.reason,
        videoId:   yt?.id || null,
        thumbnail: yt?.thumbnail || null,
        ytTitle:   yt?.title || null,
      };
    }).filter(t => t.videoId);

    res.json({ emotion, language, tracks });
  } catch (err) {
    console.error('[AI recommend error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/music/search?q=arijit ── */
router.get('/search', async (req, res) => {
  const { q, max = 10 } = req.query;
  if (!q) return res.status(400).json({ error: '`q` param required' });

  try {
    const tracks = await ytSearch(q, Number(max));
    res.json({ query: q, tracks });
  } catch (err) {
    console.error('[Search error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/music/video-info?id=VIDEO_ID ── */
router.get('/video-info', async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: '`id` required' });
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return res.status(500).json({ error: 'YouTube API key not configured' });

  try {
    const { data } = await axios.get(`${YT_BASE}/videos`, {
      params: { part: 'snippet,contentDetails', id, key },
      timeout: 6000,
    });
    const item = data.items?.[0];
    if (!item) return res.status(404).json({ error: 'Video not found' });

    const dur = item.contentDetails?.duration || 'PT0S';
    const m   = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const total = (+(m?.[1]||0))*3600 + (+(m?.[2]||0))*60 + (+(m?.[3]||0));
    const fmt = total >= 3600
      ? `${Math.floor(total/3600)}:${String(Math.floor((total%3600)/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`
      : `${Math.floor(total/60)}:${String(total%60).padStart(2,'0')}`;

    res.json({
      id, title: item.snippet.title, artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
      duration: fmt, durationSec: total,
    });
  } catch (err) {
    console.error('[Video info error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/music/languages ── */
router.get('/languages', (req, res) => {
  res.json({ languages: Object.entries(LANG_LABELS).map(([key, label]) => ({ key, label })) });
});

module.exports = router;
