/**
 * EAM Mirror v2 — Frontend App
 * AI: Google Gemini 2.5 Flash (FREE)
 * Music: YouTube Data API v3 (FREE)
 * Emotion: face-api.js (FREE, on-device)
 */
'use strict';

/* ── Config ── */
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? `http://${window.location.hostname}:3000`
  : window.location.origin;

/* ── State ── */
const STATE = {
  user:          JSON.parse(localStorage.getItem('eam_user') || 'null'),
  sessionId:     localStorage.getItem('eam_sid') || genId(),
  emotion:       { dominant:'neutral', confidence:.5, emotions:{} },
  selectedLang:  'hindi',
  tracks:        [],
  allTracks:     [],
  curIdx:        0,
  playing:       false,
  shuffle:       false,
  repeat:        false,
  chatMsgs:      [],
  journalEntries:JSON.parse(localStorage.getItem('eam_journal') || '[]'),
  scans:         +localStorage.getItem('eam_scans'  || '0') || 0,
  songs:         +localStorage.getItem('eam_songs'  || '0') || 0,
  liked:         new Set(JSON.parse(localStorage.getItem('eam_liked') || '[]')),
  cameraOn:      false,
  modelsLoaded:  false,
  ytPlayer:      null,
  ytReady:       false,
};
localStorage.setItem('eam_sid', STATE.sessionId);
function genId(){ return Math.random().toString(36).slice(2)+Date.now().toString(36); }
let chatLang = 'auto';

/* ══════════════════════════════════
   AURORA BACKGROUND
══════════════════════════════════ */
const THEMES = {
  nebula: {cls:'',       blobs:[[0,229,255],[124,58,237],[244,63,142],[20,20,40]]},
  solar:  {cls:'t-solar',blobs:[[251,191,36],[249,115,22],[239,68,68],[30,10,0]]},
  forest: {cls:'t-forest',blobs:[[34,197,94],[6,182,212],[163,230,53],[0,20,10]]},
  crimson:{cls:'t-crimson',blobs:[[244,63,94],[217,70,239],[251,146,60],[30,0,10]]},
  mono:   {cls:'t-mono', blobs:[[226,232,240],[148,163,184],[100,116,139],[20,20,22]]},
};
let cBlobs = THEMES.nebula.blobs;

const bgCvs = document.getElementById('bg-canvas');
const bgCtx = bgCvs.getContext('2d');
let BW=0, BH=0;
const blobDefs=[{fx:.12,fy:.08,rx:.42,vx:.0004,vy:.00035,ph:0},{fx:.85,fy:.82,rx:.36,vx:-.0003,vy:-.00028,ph:2.1},{fx:.5,fy:.42,rx:.30,vx:.00045,vy:.00020,ph:4.2},{fx:.18,fy:.70,rx:.24,vx:.00025,vy:-.00038,ph:1.0}];
const motes=Array.from({length:70},()=>newMote());
function newMote(){return{x:Math.random(),y:1+Math.random()*.05,vx:(Math.random()-.5)*.0007,vy:-(Math.random()*.0012+.0003),a:Math.random()*.5+.06,sz:Math.random()*1.8+.3,life:0,max:180+Math.random()*320,ci:Math.floor(Math.random()*3)}}
function resizeBg(){BW=bgCvs.width=window.innerWidth;BH=bgCvs.height=window.innerHeight}
resizeBg();window.addEventListener('resize',resizeBg);
(function bgLoop(){
  bgCtx.clearRect(0,0,BW,BH);
  const t=Date.now()*.001;
  blobDefs.forEach((b,i)=>{
    const bx=(b.fx+Math.sin(t*b.vx*1000+b.ph)*.11)*BW,by=(b.fy+Math.cos(t*b.vy*1000+b.ph)*.09)*BH,br=b.rx*Math.max(BW,BH);
    const [r,g,bv]=cBlobs[i%cBlobs.length];
    const g2=bgCtx.createRadialGradient(bx,by,0,bx,by,br);
    g2.addColorStop(0,`rgba(${r},${g},${bv},.09)`);g2.addColorStop(.5,`rgba(${r},${g},${bv},.03)`);g2.addColorStop(1,`rgba(${r},${g},${bv},0)`);
    bgCtx.fillStyle=g2;bgCtx.beginPath();bgCtx.arc(bx,by,br,0,Math.PI*2);bgCtx.fill();
  });
  motes.forEach(m=>{
    m.life++;m.x+=m.vx;m.y+=m.vy;
    if(m.life>=m.max||m.x<0||m.x>1||m.y<-.02)Object.assign(m,newMote());
    const pr=m.life/m.max,pa=pr<.12?m.a*(pr/.12):pr>.72?m.a*(1-(pr-.72)/.28):m.a;
    const [r,g,bv]=cBlobs[m.ci%cBlobs.length];
    bgCtx.fillStyle=`rgba(${r},${g},${bv},${pa})`;bgCtx.beginPath();bgCtx.arc(m.x*BW,m.y*BH,m.sz,0,Math.PI*2);bgCtx.fill();
  });
  requestAnimationFrame(bgLoop);
})();

// Splash orb
const splashCvs=document.getElementById('splash-orb'),splashCtx=splashCvs.getContext('2d');
let sT=0;
(function sLoop(){
  sT+=.014;
  splashCtx.clearRect(0,0,200,200);
  splashCtx.save();splashCtx.beginPath();splashCtx.arc(100,100,98,0,Math.PI*2);splashCtx.clip();
  splashCtx.fillStyle='#020509';splashCtx.fillRect(0,0,200,200);
  splashCtx.globalCompositeOperation='screen';
  cBlobs.slice(0,3).forEach(([r,g,bv],i)=>{
    const bx=100+Math.sin(sT*(.65+i*.18)+i*2)*62,by=100+Math.cos(sT*(.48+i*.13)+i*1.6)*56;
    const grd=splashCtx.createRadialGradient(bx,by,0,bx,by,80);
    grd.addColorStop(0,`rgba(${r},${g},${bv},.9)`);grd.addColorStop(1,`rgba(${r},${g},${bv},0)`);
    splashCtx.fillStyle=grd;splashCtx.fillRect(0,0,200,200);
  });
  splashCtx.restore();
  requestAnimationFrame(sLoop);
})();

// Load orb
const lCvs=document.getElementById('load-orb');
if(lCvs){const lCtx=lCvs.getContext('2d');let lT=0;(function ll(){lT+=.02;lCtx.clearRect(0,0,120,120);lCtx.save();lCtx.beginPath();lCtx.arc(60,60,58,0,Math.PI*2);lCtx.clip();lCtx.fillStyle='#020509';lCtx.fillRect(0,0,120,120);lCtx.globalCompositeOperation='screen';[[0,229,255],[124,58,237],[244,63,142]].forEach(([r,g,bv],i)=>{const bx=60+Math.sin(lT*(.65+i*.18)+i*2)*38,by=60+Math.cos(lT*(.48+i*.13)+i*1.6)*34;const grd=lCtx.createRadialGradient(bx,by,0,bx,by,50);grd.addColorStop(0,`rgba(${r},${g},${bv},.9)`);grd.addColorStop(1,`rgba(${r},${g},${bv},0)`);lCtx.fillStyle=grd;lCtx.fillRect(0,0,120,120);});lCtx.restore();requestAnimationFrame(ll);})();}

// Cursor halo
const halo=document.getElementById('cursor-halo');
document.addEventListener('mousemove',e=>{halo.style.transform=`translate(${e.clientX-180}px,${e.clientY-180}px)`});

/* ══════════════════════════════════
   FACE-API EMOTION DETECTION
══════════════════════════════════ */
const MODELS_URL='https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model';
let detLoop=null,videoEl,canvasEl;

async function loadFaceModels(){
  setProgress(10,'Loading face detection model…');
  try{
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL);
    setProgress(55,'Loading expression model…');
    await faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL);
    setProgress(95,'Ready!');
    STATE.modelsLoaded=true;
    await sleep(500);
    setProgress(100,'EAM Mirror ready ✓');
    await sleep(400);
    document.getElementById('model-overlay').classList.add('hidden');
  }catch(e){
    console.warn('[FaceAPI]',e.message);
    STATE.modelsLoaded=false;
    setProgress(100,'Starting in demo mode…');
    await sleep(700);
    document.getElementById('model-overlay').classList.add('hidden');
  }
}
function setProgress(p,lbl){
  const b=document.getElementById('model-prog'),l=document.getElementById('model-lbl');
  if(b)b.style.width=p+'%';
  if(l)l.textContent=lbl;
}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}

async function toggleCamera(){
  STATE.cameraOn?stopCamera():await startCamera();
}

async function startCamera(){
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{width:220,height:220,facingMode:'user'}});
    videoEl=document.getElementById('scan-video');
    canvasEl=document.getElementById('scan-canvas');
    videoEl.srcObject=stream;
    await videoEl.play();
    STATE.cameraOn=true;
    document.getElementById('scan-orb-fallback').style.display='none';
    const btn=document.getElementById('cam-toggle-btn');
    if(btn){btn.innerHTML='<span class="ms">videocam_off</span>Stop Camera';btn.classList.add('on');}
    setText('scan-status','Camera Active');
    if(STATE.modelsLoaded)startDetectionLoop();
    else{toast('Camera ready — tap Analyze for demo mode');setText('scan-status','Demo mode');}
  }catch(e){
    toast('Camera denied — using demo mode');
    document.getElementById('scan-orb-fallback').style.display='flex';
    runDemoDetection();
  }
}

function stopCamera(){
  videoEl?.srcObject?.getTracks().forEach(t=>t.stop());
  if(videoEl)videoEl.srcObject=null;
  STATE.cameraOn=false;
  if(detLoop){clearInterval(detLoop);detLoop=null;}
  const btn=document.getElementById('cam-toggle-btn');
  if(btn){btn.innerHTML='<span class="ms">videocam</span>Start Camera';btn.classList.remove('on');}
  document.getElementById('scan-orb-fallback').style.display='flex';
}

function startDetectionLoop(){
  if(detLoop)clearInterval(detLoop);
  detLoop=setInterval(async()=>{
    if(!videoEl||videoEl.readyState!==4)return;
    try{
      const r=await faceapi.detectSingleFace(videoEl,new faceapi.TinyFaceDetectorOptions({scoreThreshold:.3})).withFaceExpressions();
      if(r)onDetection(r);
      else setText('scan-status','No face — move closer');
    }catch(e){}
  },900);
}

function onDetection(result){
  const exp=result.expressions;
  const dom=Object.entries(exp).sort((a,b)=>b[1]-a[1])[0];
  STATE.emotion={dominant:dom[0],confidence:dom[1],emotions:exp};
  updateEmotionUI(exp,dom[0],dom[1]);
  setText('scan-status','Face detected ✓');
  STATE.scans++;
  localStorage.setItem('eam_scans',STATE.scans);
}

function updateEmotionUI(exp,dominant,confidence){
  const pct=Math.round(confidence*100);
  const emoMap={
    happy:    {name:'😊 Joy & Elation',  color:'var(--a1)'},
    sad:      {name:'😢 Sadness',         color:'#60a5fa'},
    angry:    {name:'😠 Anger',           color:'var(--err)'},
    fearful:  {name:'😨 Fear',            color:'var(--a2)'},
    disgusted:{name:'🤢 Disgust',         color:'#84cc16'},
    surprised:{name:'😲 Surprise',        color:'var(--warn)'},
    neutral:  {name:'😐 Neutral',         color:'var(--tx2)'},
  };
  const info=emoMap[dominant]||emoMap.neutral;
  setText('ec-name',info.name);
  setText('scan-emotion-name',info.name.split(' ').slice(1).join(' '));
  setText('scan-tagline',`Confidence: ${pct}%`);
  setText('ec-pct',pct+'%');
  setBar('ec-bar',pct);
  ['sad','angry','fearful','surprised'].forEach((e,i)=>{
    const v=Math.round((exp[e]||0)*100);
    setText(`em${i+1}`,v+'%');setBar(`eb${i+1}`,v);
  });
  setText('ec-meta',`Confidence: ${pct}% · ${new Date().toLocaleTimeString()}`);
  setText('chat-emotion-pill',info.name.split(' ')[0]+' '+(dominant[0].toUpperCase()+dominant.slice(1)));
}

function analyzeEmotion(){
  if(!STATE.cameraOn){toast('Start camera first!');return;}
  if(!STATE.modelsLoaded){runDemoDetection();toast('Demo analysis complete!');return;}
  if(videoEl&&videoEl.readyState===4){
    faceapi.detectSingleFace(videoEl,new faceapi.TinyFaceDetectorOptions({scoreThreshold:.3})).withFaceExpressions().then(r=>{
      if(r){onDetection(r);toast('Emotion captured! ✓');}
      else toast('No face detected — look at camera');
    });
  }
}

function runDemoDetection(){
  const demos=[
    {dom:'happy',    exp:{happy:.82,sad:.02,angry:.01,fearful:.01,disgusted:.01,surprised:.08,neutral:.05}},
    {dom:'sad',      exp:{happy:.05,sad:.74,angry:.08,fearful:.06,disgusted:.02,surprised:.02,neutral:.03}},
    {dom:'neutral',  exp:{happy:.15,sad:.08,angry:.05,fearful:.05,disgusted:.02,surprised:.05,neutral:.60}},
    {dom:'surprised',exp:{happy:.12,sad:.04,angry:.06,fearful:.08,disgusted:.01,surprised:.65,neutral:.04}},
  ];
  const d=demos[Math.floor(Math.random()*demos.length)];
  STATE.emotion={dominant:d.dom,confidence:d.exp[d.dom],emotions:d.exp};
  updateEmotionUI(d.exp,d.dom,d.exp[d.dom]);
  setText('scan-status','Demo mode');
}

/* ══════════════════════════════════
   YOUTUBE PLAYER
══════════════════════════════════ */
window.onYouTubeIframeAPIReady=function(){
  STATE.ytPlayer=new YT.Player('yt-player-iframe',{
    height:'180',width:'320',
    playerVars:{autoplay:0,controls:0,modestbranding:1,rel:0,origin:window.location.origin},
    events:{
      onReady:()=>{STATE.ytReady=true;},
      onStateChange:(e)=>{
        if(e.data===YT.PlayerState.PLAYING){STATE.playing=true;updatePlayBtn(true);startProgPoll();}
        else if(e.data===YT.PlayerState.PAUSED){STATE.playing=false;updatePlayBtn(false);}
        else if(e.data===YT.PlayerState.ENDED){STATE.playing=false;updatePlayBtn(false);stopProgPoll();nextT();}
      },
    },
  });
};

function initYTAPI(){
  if(document.getElementById('yt-api-scr'))return;
  document.getElementById('yt-iframe-container').innerHTML='<div id="yt-player-iframe"></div>';
  const s=document.createElement('script');
  s.id='yt-api-scr';s.src='https://www.youtube.com/iframe_api';
  document.head.appendChild(s);
}

function playVideoId(id){
  if(!STATE.ytReady||!STATE.ytPlayer){setTimeout(()=>playVideoId(id),600);return;}
  STATE.ytPlayer.loadVideoById(id);
  STATE.ytPlayer.playVideo();
  STATE.playing=true;updatePlayBtn(true);
}

function togglePlay(){
  if(!STATE.ytPlayer||!STATE.ytReady)return;
  if(STATE.playing){STATE.ytPlayer.pauseVideo();STATE.playing=false;updatePlayBtn(false);}
  else{STATE.ytPlayer.playVideo();STATE.playing=true;updatePlayBtn(true);}
}

function updatePlayBtn(p){
  const b=document.getElementById('playbtn');
  if(b)b.querySelector('.ms').textContent=p?'pause':'play_arrow';
}

let progInt=null;
function startProgPoll(){
  stopProgPoll();
  progInt=setInterval(()=>{
    if(!STATE.ytPlayer||!STATE.ytReady)return;
    try{
      const cur=STATE.ytPlayer.getCurrentTime()||0,dur=STATE.ytPlayer.getDuration()||0;
      if(dur>0){
        setBar('pfill',(cur/dur)*100);
        setText('pcur',fmtT(Math.floor(cur)));
        setText('ptot',fmtT(Math.floor(dur)));
      }
    }catch(e){}
  },500);
}
function stopProgPoll(){if(progInt){clearInterval(progInt);progInt=null;}}

function seekPlayer(e){
  if(!STATE.ytPlayer||!STATE.ytReady)return;
  const bar=document.getElementById('pbar'),r=bar.getBoundingClientRect();
  STATE.ytPlayer.seekTo((STATE.ytPlayer.getDuration()||0)*Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),true);
}

function toggleShuf(el){STATE.shuffle=!STATE.shuffle;el.classList.toggle('on',STATE.shuffle);toast(STATE.shuffle?'Shuffle on 🔀':'Shuffle off');}
function toggleRep(el){STATE.repeat=!STATE.repeat;el.classList.toggle('on',STATE.repeat);toast(STATE.repeat?'Repeat on 🔁':'Repeat off');}

function prevT(){
  if(!STATE.tracks.length)return;
  STATE.curIdx=(STATE.curIdx-1+STATE.tracks.length)%STATE.tracks.length;
  playCurrentTrack();
}
function nextT(){
  if(!STATE.tracks.length)return;
  if(STATE.repeat){playCurrentTrack();return;}
  STATE.curIdx=STATE.shuffle?Math.floor(Math.random()*STATE.tracks.length):(STATE.curIdx+1)%STATE.tracks.length;
  playCurrentTrack();
}

function playCurrentTrack(){
  const t=STATE.tracks[STATE.curIdx];if(!t)return;
  updatePlayerUI(t);
  if(t.videoId)playVideoId(t.videoId);
  renderTrackList();
  STATE.songs++;localStorage.setItem('eam_songs',STATE.songs);
}

function updatePlayerUI(t){
  setText('p-title',t.title||t.ytTitle||'Unknown');
  setText('p-artist',t.artist||'Unknown Artist');
  const img=document.getElementById('player-thumb-img'),ph=document.getElementById('player-thumb-ph');
  if(t.thumbnail){if(img){img.src=t.thumbnail;img.style.display='block';}if(ph)ph.style.display='none';}
  else{if(img)img.style.display='none';if(ph)ph.style.display='flex';}
  setBar('pfill',0);setText('pcur','0:00');setText('ptot','0:00');
}

function fmtT(s){return`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}

/* ══════════════════════════════════
   MUSIC RECOMMENDATIONS
══════════════════════════════════ */
let musicLangFilter='all';

async function loadMusicRecommendations(emotion,language){
  const tlist=document.getElementById('tlist'),lbl=document.getElementById('tlist-lbl');
  if(tlist)tlist.innerHTML='<div class="ldr"><span class="ms ldr-spin">refresh</span>Finding your soundtrack…</div>';
  if(lbl)lbl.textContent='Loading…';

  const emoMap={happy:'happy',sad:'sad',angry:'angry',fearful:'anxious',surprised:'happy',disgusted:'angry',neutral:'neutral',calm:'calm',energetic:'energetic'};
  const musicEmo=emoMap[emotion]||'neutral';
  setText('music-emotion-label',emotion[0].toUpperCase()+emotion.slice(1));

  try{
    const resp=await fetch(`${API_BASE}/api/music/recommend?emotion=${musicEmo}&language=${language}&max=14`);
    if(!resp.ok)throw new Error(`HTTP ${resp.status}`);
    const data=await resp.json();
    STATE.allTracks=data.tracks||[];
    STATE.tracks=STATE.allTracks;
    if(lbl)lbl.textContent=`${data.languageLabel||language} · ${STATE.allTracks.length} tracks`;
    if(STATE.tracks.length){STATE.curIdx=0;updatePlayerUI(STATE.tracks[0]);}
    renderTrackList();
  }catch(e){
    console.error('[Music]',e.message);
    if(tlist)tlist.innerHTML='<div class="ldr" style="color:var(--err)"><span class="ms" style="font-size:28px;display:block;margin-bottom:8px">cloud_off</span>Backend offline — run <code>npm start</code> in backend folder</div>';
    if(lbl)lbl.textContent='Connection error';
  }
}

function renderTrackList(filter){
  const el=document.getElementById('tlist');if(!el)return;
  let tracks=STATE.allTracks;
  if(filter&&filter!=='all')tracks=STATE.allTracks.filter(t=>(t.language||'').toLowerCase()===filter.toLowerCase());
  if(!tracks.length){el.innerHTML='<div class="ldr"><span class="ms mf" style="font-size:24px;display:block;animation:none">music_off</span>No tracks found</div>';return;}

  el.innerHTML=tracks.map((t,i)=>`
    <div class="tr${STATE.tracks[STATE.curIdx]?.videoId===t.videoId?' on':''}" onclick="selectTrack('${esc(t.videoId)}')">
      <div class="trn">${STATE.tracks[STATE.curIdx]?.videoId===t.videoId
        ?'<span class="ms mf" style="color:var(--a1);font-size:16px">graphic_eq</span>'
        :(i+1)}</div>
      <div class="tart">${t.thumbnail?`<img src="${t.thumbnail}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:10px"/>`:`<div style="width:100%;height:100%;background:linear-gradient(135deg,rgba(var(--a1r),.2),rgba(var(--a2r),.2));display:flex;align-items:center;justify-content:center"><span class="ms mf" style="font-size:18px;color:var(--a1)">music_note</span></div>`}</div>
      <div class="tinfo"><div class="ttitle">${esc(t.title||t.ytTitle||'Unknown')}</div><div class="tartist">${esc(t.artist||'Unknown')}</div></div>
      <div style="font-size:9px;font-family:var(--fd);color:var(--tx3);flex-shrink:0;margin-right:4px">${t.language||''}</div>
      <div class="tlike${STATE.liked.has(t.videoId)?' on':''}" onclick="event.stopPropagation();likeTrack('${esc(t.videoId)}')"><span class="ms${STATE.liked.has(t.videoId)?' mf':''}">favorite</span></div>
    </div>`).join('');
}

function selectTrack(videoId){
  const idx=STATE.allTracks.findIndex(t=>t.videoId===videoId);
  if(idx===-1)return;
  STATE.tracks=STATE.allTracks;STATE.curIdx=idx;
  playCurrentTrack();
}

function filterLang(el,lang){
  musicLangFilter=lang;
  document.querySelectorAll('#music-lang-chips .chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  renderTrackList(lang==='all'?null:lang);
}

function refreshTracks(){
  toast('Refreshing…');
  loadMusicRecommendations(STATE.emotion.dominant||'happy',STATE.selectedLang);
}

function likeTrack(id){
  STATE.liked.has(id)?STATE.liked.delete(id):STATE.liked.add(id);
  localStorage.setItem('eam_liked',JSON.stringify([...STATE.liked]));
  toast(STATE.liked.has(id)?'Added to favourites ❤️':'Removed from favourites');
  renderTrackList(musicLangFilter==='all'?null:musicLangFilter);
}

/* ══════════════════════════════════
   GEMINI AI CHAT (SSE Streaming)
══════════════════════════════════ */
let chatBusy=false;

function addMsg(role,text){
  const body=document.getElementById('chat-body');
  const now=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  const isAI=role==='ai'||role==='assistant';
  const d=document.createElement('div');
  d.className=`msg ${isAI?'ai':'user'}`;
  d.innerHTML=`${isAI?`<div class="msg-av"><span class="ms mf" style="font-size:14px;color:#000">auto_awesome</span></div>`:''}
    <div><div class="msg-bub">${esc(text).replace(/\n/g,'<br/>')}</div><div class="msg-time">${now}</div></div>
    ${!isAI?`<div class="msg-av" style="background:linear-gradient(135deg,var(--a3),var(--a2))"><span class="ms mf" style="font-size:14px;color:#000">person</span></div>`:''}`;
  body.appendChild(d);
  body.scrollTop=body.scrollHeight;
  return d;
}

function showTyping(){
  const body=document.getElementById('chat-body');
  const d=document.createElement('div');
  d.className='msg ai';d.id='typing-ind';
  d.innerHTML=`<div class="msg-av"><span class="ms mf" style="font-size:14px;color:#000">auto_awesome</span></div><div class="msg-bub"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
  body.appendChild(d);body.scrollTop=body.scrollHeight;
}
function removeTyping(){document.getElementById('typing-ind')?.remove();}

async function sendChat(){
  const inp=document.getElementById('chat-input');
  const text=inp.value.trim();
  if(!text||chatBusy)return;
  inp.value='';autoResize(inp);chatBusy=true;

  STATE.chatMsgs.push({role:'user',content:text});
  addMsg('user',text);
  showTyping();

  try{
    const resp=await fetch(`${API_BASE}/api/chat`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        messages:STATE.chatMsgs.map(m=>({role:m.role==='ai'?'assistant':m.role,content:m.content})),
        emotion:STATE.emotion,
        language:chatLang,
        stream:true,
      }),
    });
    if(!resp.ok)throw new Error(`HTTP ${resp.status} — is the backend running?`);

    removeTyping();
    const body=document.getElementById('chat-body');
    const aiDiv=document.createElement('div');
    aiDiv.className='msg ai';
    const now=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    aiDiv.innerHTML=`<div class="msg-av"><span class="ms mf" style="font-size:14px;color:#000">auto_awesome</span></div><div><div class="msg-bub" id="stream-bub"></div><div class="msg-time">${now}</div></div>`;
    body.appendChild(aiDiv);

    const reader=resp.body.getReader(),dec=new TextDecoder();
    let fullText='';

    while(true){
      const {done,value}=await reader.read();if(done)break;
      const chunk=dec.decode(value);
      for(const line of chunk.split('\n')){
        if(line.startsWith('data: ')){
          const raw=line.slice(6).trim();
          if(raw==='[DONE]')break;
          try{const p=JSON.parse(raw);if(p.text){fullText+=p.text;const b=document.getElementById('stream-bub');if(b){b.innerHTML=esc(fullText).replace(/\n/g,'<br/>');body.scrollTop=body.scrollHeight;}}}catch(e){}
        }
      }
    }

    document.getElementById('stream-bub')?.removeAttribute('id');
    STATE.chatMsgs.push({role:'ai',content:fullText});
  }catch(e){
    removeTyping();
    addMsg('ai',`Yaar, backend se connect nahi ho paya 😕\nMake sure to run: cd backend && npm start\n\nError: ${e.message}`);
  }
  chatBusy=false;
}

function sendQuick(t){document.getElementById('chat-input').value=t;sendChat();}
function clearChat(){STATE.chatMsgs=[];document.getElementById('chat-body').innerHTML='';toast('Chat cleared');setTimeout(loadAISuggestion,300);}
function chatKeyDown(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat();}}
function autoResize(el){el.style.height='auto';el.style.height=Math.min(120,el.scrollHeight)+'px';}

async function loadAISuggestion(){
  if(STATE.emotion.dominant==='neutral'||!STATE.emotion.dominant)return;
  try{
    const r=await fetch(`${API_BASE}/api/chat/suggest`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({emotion:STATE.emotion})});
    if(r.ok){const d=await r.json();if(d.suggestion)addMsg('ai',d.suggestion);}
  }catch(e){
    addMsg('ai',`Namaste! 🙏 Main EAM hoon — tumhara emotional music companion, powered by Gemini AI.\n\nTumhara mood detect ho gaya hai: ${STATE.emotion.dominant}. Batao, kaisa feel ho raha hai? 🎵`);
  }
}

/* ══════════════════════════════════
   NAVIGATION
══════════════════════════════════ */
const PAGE_ORDER=['splash','login','signup','onboard','scanner','music','chat','journal','profile'];
const MAIN_PAGES=['scanner','music','chat','journal','profile'];
let curPage='splash';

function nav(to,dir){
  if(to===curPage)return;
  const from=curPage;curPage=to;
  const fromEl=document.getElementById('pg-'+from),toEl=document.getElementById('pg-'+to);
  const fwd=dir==='f'||(dir==='auto'&&PAGE_ORDER.indexOf(to)>PAGE_ORDER.indexOf(from));
  fromEl.classList.remove('enter-right','enter-left');
  fromEl.classList.add(fwd?'exit-left':'exit-right');
  setTimeout(()=>fromEl.classList.remove('active','exit-left','exit-right'),340);
  toEl.classList.remove('exit-left','exit-right','enter-right','enter-left','active');
  toEl.classList.add(fwd?'enter-right':'enter-left');
  void toEl.offsetWidth;
  toEl.classList.add('active');
  const sg=toEl.querySelector('.stg');
  if(sg)sg.querySelectorAll(':scope>*').forEach(el=>{el.style.animation='none';el.style.opacity='0';void el.offsetWidth;el.style.animation='';});
  if(MAIN_PAGES.includes(to)){
    document.getElementById('bnav').classList.add('up');
    MAIN_PAGES.forEach(p=>{const ni=document.getElementById('ni-'+p);if(ni)ni.classList.toggle('on',p===to);});
  }else{
    document.getElementById('bnav').classList.remove('up');
  }
  if(to==='music')initMusic();
  if(to==='chat')initChat();
  if(to==='profile')initProfile();
  if(to==='journal')initJournal();
}

/* ── Page Inits ── */
function initMusic(){
  initYTAPI();
  loadMusicRecommendations(STATE.emotion.dominant||'happy',STATE.selectedLang);
}
function initChat(){
  setText('chat-emotion-pill',STATE.emotion.dominant?(STATE.emotion.dominant[0].toUpperCase()+STATE.emotion.dominant.slice(1)):'—');
  if(!document.getElementById('chat-body').children.length)setTimeout(loadAISuggestion,400);
}
function initProfile(){
  if(STATE.user){
    setText('prof-name',STATE.user.name||'Guest');
    setText('prof-email',STATE.user.email||'@eam.mirror');
    setText('av-initials',(STATE.user.name||'G')[0].toUpperCase());
    setText('prof-so-sub',`See you next time, ${STATE.user.name?.split(' ')[0]||'friend'}`);
  }
  setText('stat-scans',STATE.scans);
  setText('stat-songs',STATE.songs);
  setText('stat-mood',STATE.emotion.dominant?(STATE.emotion.dominant[0].toUpperCase()+STATE.emotion.dominant.slice(1)):'—');
  setText('stat-acc',STATE.modelsLoaded?'Live':'Demo');
  buildMoodGrid();
}
function initJournal(){
  const today=new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  setText('journal-date','Today · '+today);
  buildMoodTags();renderJournalEntries();
}

/* ── AUTH ── */
function doLogin(){
  const e=document.getElementById('le').value.trim(),p=document.getElementById('lp').value;
  if(!e){toast('Enter your email');return;}if(!p){toast('Enter your password');return;}
  const name=e.split('@')[0].replace(/[._]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  STATE.user={name,email:e};localStorage.setItem('eam_user',JSON.stringify(STATE.user));
  toast('Welcome back! 🎵');setTimeout(()=>nav('onboard','f'),800);
}
function doSignup(){
  const n=document.getElementById('sn').value.trim(),e=document.getElementById('se').value.trim(),p=document.getElementById('sup').value;
  if(!n){toast('Enter your name');return;}if(!e){toast('Enter your email');return;}if(p.length<6){toast('Password must be 6+ chars');return;}
  STATE.user={name:n,email:e};localStorage.setItem('eam_user',JSON.stringify(STATE.user));
  toast('Account created! Welcome 🎵');setTimeout(()=>nav('onboard','f'),800);
}
function tpw(id,btn){
  const inp=document.getElementById(id),show=inp.type==='password';
  inp.type=show?'text':'password';
  btn.querySelector('.ms').textContent=show?'visibility_off':'visibility';
}
function strength(v){
  const bars=document.querySelectorAll('#stbar span');bars.forEach(b=>b.className='');
  if(!v)return;
  let s=0;if(v.length>=8)s++;if(/[A-Z]/.test(v))s++;if(/[0-9]/.test(v))s++;if(/[^A-Za-z0-9]/.test(v))s++;
  const cls=s<=1?'s-w':s<=2?'s-m':'s-g';
  for(let i=0;i<s&&i<4;i++)bars[i].classList.add(cls);
}
function signOut(){toast('Signing out… 👋');STATE.user=null;localStorage.removeItem('eam_user');setTimeout(()=>nav('splash','b'),1200);}

/* ── ONBOARD ── */
let obSlide=0;
const obTrack=document.getElementById('ob-track');
let obStartX=0;
obTrack.addEventListener('touchstart',e=>{obStartX=e.touches[0].clientX},{passive:true});
obTrack.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-obStartX;if(Math.abs(dx)>50){dx<0?goSlide(Math.min(obSlide+1,2)):goSlide(Math.max(obSlide-1,0));}});
function goSlide(n){
  obSlide=n;obTrack.style.transform=`translateX(-${n*100/3}%)`;
  document.querySelectorAll('.dd').forEach((d,i)=>d.classList.toggle('on',i===n));
  const btn=document.getElementById('ob-btn');
  if(btn)btn.innerHTML=n===2?'<span class="ms mf">auto_awesome</span>Start Scanning<span class="ms">arrow_forward</span>':'Continue<span class="ms">arrow_forward</span>';
}
function obNext(){obSlide<2?goSlide(obSlide+1):nav('scanner','f');}

/* ── LANG ── */
function setLang(el,lang){
  STATE.selectedLang=lang;
  document.querySelectorAll('.lchip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  toast(`Language: ${lang}`);
}

/* ── JOURNAL ── */
const moodTagData=[
  {label:'😊 Joyful',c:'#00e5ff'},{label:'😌 Calm',c:'#10b981'},{label:'⚡ Energised',c:'#fbbf24'},
  {label:'🔮 Focused',c:'#7c3aed'},{label:'💫 Inspired',c:'#f43f8e'},{label:'😔 Melancholic',c:'#64748b'},
  {label:'😤 Frustrated',c:'#ef4444'},{label:'🥰 Grateful',c:'#f97316'},
];
let selTags=[],tagsBuilt=false;
function buildMoodTags(){
  const el=document.getElementById('mood-tags');if(!el||tagsBuilt)return;tagsBuilt=true;
  el.innerHTML='<span style="font-size:11px;color:var(--tx2);align-self:center;font-family:var(--fd);font-weight:600">Mood:</span>';
  moodTagData.forEach(({label,c})=>{
    const d=document.createElement('div');
    d.style.cssText=`display:inline-flex;align-items:center;padding:5px 12px;border-radius:99px;font-family:var(--fd);font-size:11px;font-weight:700;cursor:pointer;border:1px solid;color:${c};border-color:${c}40;background:${c}15;transition:all .18s;margin-top:4px`;
    d.textContent=label;
    d.onclick=function(){const a=this.dataset.active==='1';this.dataset.active=a?'':'1';this.style.background=a?`${c}15`:`${c}33`;if(a)selTags=selTags.filter(l=>l!==label);else selTags.push(label);};
    el.appendChild(d);
  });
}
function saveJournalEntry(){
  const text=document.getElementById('journal-text')?.value.trim();
  if(!text){toast('Write something first!');return;}
  const entry={id:Date.now(),date:new Date().toISOString(),text,tags:[...selTags],emotion:STATE.emotion.dominant,confidence:STATE.emotion.confidence};
  STATE.journalEntries.unshift(entry);
  localStorage.setItem('eam_journal',JSON.stringify(STATE.journalEntries.slice(0,100)));
  document.getElementById('journal-text').value='';
  selTags=[];
  document.querySelectorAll('#mood-tags [data-active="1"]').forEach(el=>{el.dataset.active='';const c=el.style.color;el.style.background=`${c}15`;});
  renderJournalEntries();toast('Entry saved ✓');
}
function renderJournalEntries(){
  const el=document.getElementById('journal-entries');if(!el)return;
  const entries=STATE.journalEntries.slice(0,10);
  if(!entries.length){el.innerHTML='<div style="text-align:center;padding:24px;color:var(--tx3);font-size:13px">No entries yet. Write your first one! ✍️</div>';return;}
  const ec={happy:'#fbbf24',sad:'#60a5fa',angry:'#ef4444',fearful:'#8b5cf6',neutral:'#94a3b8',disgusted:'#84cc16',surprised:'#f97316'};
  el.innerHTML=entries.map(e=>{
    const d=new Date(e.date),ds=d.toLocaleDateString('en-IN',{weekday:'short',month:'short',day:'numeric'});
    const c=ec[e.emotion]||'#94a3b8';
    return`<div class="journal-entry"><div class="je-top"><span class="je-date">${ds}</span><span class="je-mood" style="--jm-bg:${c}18;--jm-c:${c}">${(e.emotion||'neutral')[0].toUpperCase()+(e.emotion||'neutral').slice(1)} ${Math.round((e.confidence||.5)*100)}%</span></div><p class="je-text">${esc(e.text)}</p></div>`;
  }).join('');
}

/* ── PROFILE ── */
const mc2=['#00e5ff','#f43f8e','#7c3aed','#fbbf24','#10b981','#f43f5e','#22c55e','#d946ef'];
const mn2=['Joy','Love','Calm','Energy','Peace','Stress','Growth','Inspired'];
let moodGridBuilt=false;
function buildMoodGrid(){
  const g=document.getElementById('mood-g');if(!g||moodGridBuilt)return;moodGridBuilt=true;g.innerHTML='';
  for(let i=0;i<28;i++){
    const ci=Math.floor(Math.random()*mc2.length),d=document.createElement('div');
    d.className='md';d.style.cssText=`background:${mc2[ci]}bb;box-shadow:0 0 10px ${mc2[ci]}44`;
    const dt=new Date(Date.now()-(27-i)*86400000);
    d.title=`${dt.toLocaleDateString('en-IN',{month:'short',day:'numeric'})}: ${mn2[ci]}`;
    d.onclick=()=>toast(`${dt.toLocaleDateString('en-IN',{weekday:'short',month:'short',day:'numeric'})}: ${mn2[ci]}`);
    g.appendChild(d);
  }
}
async function checkAPIStatus(){
  const el=document.getElementById('api-status-text');
  if(el)el.textContent='Checking…';
  try{
    const r=await fetch(`${API_BASE}/api/health`,{signal:AbortSignal.timeout(4000)});
    const d=await r.json();
    if(el)el.textContent=`Gemini:${d.env.gemini?'✓':'✗'} · YouTube:${d.env.youtube?'✓':'✗'} · Running ✓`;
    toast(`Backend OK · Gemini:${d.env.gemini?'✓':'✗'} · YouTube:${d.env.youtube?'✓':'✗'}`);
  }catch(e){
    if(el)el.textContent='Backend offline — run npm start';
    toast('Backend not running! Run: cd backend && npm start');
  }
}
function exportData(){
  const data={journalEntries:STATE.journalEntries,scans:STATE.scans,songs:STATE.songs,exportedAt:new Date().toISOString()};
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  a.download=`eam-mirror-${Date.now()}.json`;a.click();toast('Data exported!');
}

/* ── THEME ── */
function setTheme(name,el){
  const T=THEMES[name];cBlobs=T.blobs;document.body.className=T.cls;
  document.querySelectorAll('.tsw').forEach(s=>s.classList.remove('on'));el.classList.add('on');
  toast(`Theme: ${name} ✓`);
}
function setAcc(el,r1,r2){
  const s=document.documentElement.style;
  s.setProperty('--a1',`rgb(${r1})`);s.setProperty('--a1r',r1);s.setProperty('--a2',`rgb(${r2})`);s.setProperty('--a2r',r2);
  s.setProperty('--a1h',`rgba(${r1},.15)`);s.setProperty('--a1g',`rgba(${r1},.3)`);s.setProperty('--a2h',`rgba(${r2},.15)`);s.setProperty('--a2g',`rgba(${r2},.22)`);
  cBlobs[0]=r1.split(',').map(Number);cBlobs[1]=r2.split(',').map(Number);
  document.querySelectorAll('.ac').forEach(a=>a.classList.remove('on'));el.classList.add('on');toast('Accent updated ✓');
}
function setFs(el,v){document.querySelectorAll('.fo').forEach(f=>f.classList.remove('on'));el.classList.add('on');document.documentElement.style.fontSize=v+'px';toast('Font size updated ✓');}
function toggleMotion(el){el.classList.toggle('on');toast(el.classList.contains('on')?'Reduced motion on':'Reduced motion off');}
function openC(){document.getElementById('cdrawer').classList.add('show');document.getElementById('cov').classList.add('show');}
function closeC(){document.getElementById('cdrawer').classList.remove('show');document.getElementById('cov').classList.remove('show');}
(()=>{const dw=document.getElementById('cdrawer');let sy=0,dy=0,dr=false;dw.addEventListener('touchstart',e=>{sy=e.touches[0].clientY;dy=0;dr=true},{passive:true});dw.addEventListener('touchmove',e=>{if(!dr)return;dy=Math.max(0,e.touches[0].clientY-sy);dw.style.transform=`translateY(${dy}px)`;},{passive:true});dw.addEventListener('touchend',()=>{dr=false;if(dy>90){closeC();dw.style.transform='';}else{dw.style.transform='';}dy=0;});})();

/* ── Utilities ── */
function setText(id,v){const el=document.getElementById(id);if(el)el.textContent=v;}
function setBar(id,pct){const el=document.getElementById(id);if(el)el.style.width=Math.round(pct)+'%';}
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function rip(e,btn){const r=document.createElement('span');r.className='ripple';const rect=btn.getBoundingClientRect(),size=Math.max(rect.width,rect.height);r.style.cssText=`width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;btn.appendChild(r);setTimeout(()=>r.remove(),540);}
let toastT;
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('up');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('up'),2800);}

/* ── INIT ── */
(async function init(){
  document.getElementById('pg-splash').classList.add('active');
  if(STATE.user)setTimeout(()=>nav('scanner','f'),100);
  try{await loadFaceModels();}catch(e){document.getElementById('model-overlay').classList.add('hidden');}
})();
