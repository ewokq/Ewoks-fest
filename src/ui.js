// UI: menus/screens (career, shop, setup, challenges, My Song, settings, help, pause, analysis), HUD, keyboard + gamepad, help mode, tutorial, suggestions
const UI={scr:null,setup:null,lastHud:0,shopCat:'Equipment',setTab:'graphics',rebind:null,sugT:0,lastAn:null};
const owns=id=>SAVE.owned.includes(id);
const trackOwned=id=>STARTER_TRACKS.includes(id)||owns('trk_'+id);
const UA_={};
function scr(html,cls){const s=$('screen');s.className='screen'+(cls?' '+cls:'');$('scard').innerHTML=html;$('scard').scrollTop=0;UI.scr=true;}
function hideScr(){$('screen').className='screen hidden';UI.scr=null;}
const backBtn=(to)=>`<button data-u="${to||'menu'}">&#8592; Back</button>`;
const opt=(list,cur)=>list.map(([v,n])=>`<option value="${esc(v)}"${String(v)===String(cur)?' selected':''}>${esc(n)}</option>`).join('');
// ---------- main menu ----------
function menuScreen(){if(SES)endSession();const c=SAVE.career;
  scr(`<div class="hero"><h1 style="margin:.2rem 0">FESTIVAL CONTROL <small class="muted">${VERSION}</small></h1><p class="muted" style="margin:0">Run the lights, LED wall, lasers and pyro for a festival crowd.</p></div>
  <button class="playBig" data-u="play">▶ PLAY<span>Quick 2-minute show · random track · scored</span></button>
  <div class="menuBig menuGrid">
   <button data-u="career"><i>🏆</i><b>Career</b><span>Venue ${c.venue+1}/7 · ${c.credits} credits</span></button>
   <button data-u="free"><i>🎛️</i><b>Free Play</b><span>Everything unlocked, no score</span></button>
   <button data-u="mysong"><i>🎵</i><b>My Song</b><span>Play to a YouTube song</span></button>
   <button data-u="tutorial"><i>🎓</i><b>Tutorial</b><span>${SAVE.tutorialDone?'Completed ✓':'2 minutes, +100 credits'}</span></button>
   <button data-u="daily" class="hot"><i>📅</i><b>Daily Festival</b><span>${dailyMenuTxt()}</span></button>
   <button data-u="duel" class="hot"><i>⚔️</i><b>1v1 Duel</b><span>Same phone split-screen, or by link</span></button>
   <button data-u="mp"><i>👥</i><b>Multiplayer</b><span>Party mode · challenge links · leaderboards</span></button>
   <button data-u="settings"><i>⚙️</i><b>Settings</b><span>Console, graphics, sound</span></button>
  </div>
  <div class="menuSmall"><button data-u="quick">Show setup</button><button data-u="ach">Achievements ${Object.keys(SAVE.fun.ach).length}/${ACH.length}</button><button data-u="challenges">Challenges ${Object.keys(c.challenges).length}/${CHALLENGES.length}</button><button data-u="help">Help</button><button data-u="credits">Music credits</button><a href="classic/" style="color:var(--acc)">Classic v1.4</a></div>
  ${SAVE_NOTE?'<p style="text-align:center"><b style="color:var(--ok)">'+esc(SAVE_NOTE)+'</b></p>':''}`);SAVE_NOTE='';}
UA_.menu=()=>menuScreen();
// ---------- quick show / free play setup ----------
function setupScreen(mode){const st=UI.setup=UI.setup&&UI.setup.mode===mode?UI.setup:{mode,track:SAVE.lastTrack||'bigroom',env:'night',dj:'',style:'energetic',crowd:'arena',auto:mode==='free'?'assisted':'manual',short:false,venue:4};
  const trks=TRACKS.filter(t=>t.id!=='tutorial').map(t=>[t.id,trackLabel(t)]);if(!TMAP[st.track])st.track=TRACKS[0].id;const T0=TMAP[st.track],g=GMAP[T0.g];preloadTrack(st.track);
  scr(`<h2>${mode==='free'?'Free Play (sandbox)':'Show setup'}</h2><p class="muted">${mode==='free'?'Full rig of the chosen venue, everything unlocked, no score. Seek, loop sections, record replays.':'A scored show: timing, music sync, creativity, crowd, dynamics, composition and technical.'}</p>
  <div class="opts">
   <label>Track <select data-k="track">${opt(trks,st.track)}</select></label><div class="muted" style="font-size:.8rem">${T0.real?'🎧 Real track · '+esc(T0.real.lic)+' · ':'🎹 Synth track · '}${esc(g.look)}</div>
   <label>Stage / venue <select data-k="venue">${opt(VENUES.map((v,i)=>[i,v.name+' ('+v.kind+')']),st.venue)}</select></label>
   <label>Environment <select data-k="env">${opt(ENVS.map(e=>[e.id,e.name]),st.env)}</select></label>
   <label>DJ <select data-k="dj">${opt([['','Track default']].concat(DJS.map(d=>[d.id,d.name])),st.dj)}</select></label>
   <label>Show style <select data-k="style">${opt(STYLES.map(s=>[s[0],s[1]]),st.style)}</select></label>
   <label>Crowd size <select data-k="crowd">${opt(CROWD_SIZES.map(s=>[s[0],s[1]]),st.crowd)}</select></label>
   <label>Automation <select data-k="auto">${opt([['manual','Manual (you do everything)'],['assisted','Assisted (rig follows the song)'],['programmed','Programmed (your timeline cues)']],st.auto)}</select></label>
   <label><input type="checkbox" data-k="short"${st.short?' checked':''}> Short version (about half length)</label>
  </div><div class="row" style="margin-top:.8rem">${backBtn()}<button class="sel big" data-u="go">START ${mode==='free'?'SANDBOX':'SHOW'} ▶</button></div>`);}
UA_.quick=()=>setupScreen('show');UA_.free=()=>setupScreen('free');
UA_.go=()=>{const s=UI.setup,v=VENUES[+s.venue];SAVE.lastTrack=s.track;dirty();
  warnThen(()=>startSession({mode:s.mode,venue:+s.venue,env:s.env,track:s.track,dj:s.dj||null,style:s.style,crowdSize:s.crowd,auto:s.auto,short:s.short,scored:s.mode==='show',rig:v.rig,fx:v.fx}));};
// ---------- career ----------
function careerScreen(){const c=SAVE.career;
  scr(`<h2>Career</h2><div class="row"><b>${c.credits} credits</b><span class="muted">· ${c.shows} shows · reputation ${c.rep}</span><button class="sel" data-u="shop">Shop</button></div>
  <p class="muted">Score at least the venue's requirement to unlock the next stage. Credits = reward × score%, +100 per mission.</p>
  ${VENUES.map((v,i)=>{const lock=i>c.venue,b=c.best[v.id];return `<div class="tile${lock?' lock':''}"><div><b>${i+1}. ${esc(v.name)}</b> <span class="muted">${esc(v.kind)} · ${ENVMAP[v.env].name} · ${v.crowd} people</span><br><small>${lock?'&#128274; Score '+VENUES[i-1].req+'+ at '+esc(VENUES[i-1].name)+' to unlock':`Need ${v.req}+ · reward ${v.reward} · best ${b!=null?b:'–'} · missions ${v.missions.filter(m=>c.missions[v.id+':'+m.id]).length}/${v.missions.length}`}</small></div>${lock?'':`<button data-u="venue" data-v="${i}">Play</button>`}</div>`;}).join('')}
  <div class="row" style="margin-top:.6rem">${backBtn()}</div>`);}
UA_.career=()=>careerScreen();
function venueScreen(i){const v=VENUES[i],c=SAVE.career,R=careerRig(v),F=careerFx(v);const tr=TRACKS.filter(t=>t.id!=='tutorial'&&trackOwned(t.id));UI.setup={mode:'career',venue:i,track:v.track&&tr.find(t=>t.id===v.track)?v.track:tr.find(t=>t.id===SAVE.lastTrack)?SAVE.lastTrack:tr[0].id,auto:'manual',short:false};
  scr(`<h2>${esc(v.name)}</h2><p class="muted">${esc(v.kind)} · ${ENVMAP[v.env].name} · crowd ${v.crowd} · need ${v.req}+ to advance</p>
  <div class="lbl">Missions</div>${v.missions.map(m=>`<div>${c.missions[v.id+':'+m.id]?'✅':'⬜'} ${esc(m.txt)}</div>`).join('')}
  <div class="lbl">Your rig here (venue max in brackets)</div><div class="muted" style="font-size:.85rem">${RIG_TYPES.filter(k=>v.rig[k]).map(k=>`${TYPE_NAME[k]} ${R[k]||0} (${v.rig[k]})`).join(' · ')}<br>${FX_TYPES.filter(k=>v.fx[k]).map(k=>`${FX_NAMES[k]} ${F[k]||0} (${v.fx[k]})`).join(' · ')}</div>
  <div class="opts"><label>Track <select data-k="track">${opt(tr.map(t=>[t.id,(t.id===v.track?'★ ':'')+trackLabel(t)]),UI.setup.track)}</select></label>
  <label>Automation <select data-k="auto">${opt([['manual','Manual'],['assisted','Assisted'],['programmed','Programmed']],'manual')}</select></label><label><input type="checkbox" data-k="short"> Short version</label></div>
  <div class="row" style="margin-top:.8rem">${backBtn('career')}<button data-u="shop">Shop</button><button class="sel big" data-u="goCareer">PLAY ▶</button></div>`);}
UA_.venue=v=>venueScreen(+v);
UA_.goCareer=()=>{const s=UI.setup,v=VENUES[s.venue];SAVE.lastTrack=s.track;dirty();
  warnThen(()=>startSession({mode:'career',venue:s.venue,env:v.env,track:s.track,dj:null,style:'energetic',crowdSize:null,crowdN:v.crowd,auto:s.auto,short:s.short,scored:true,rig:careerRig(v),fx:careerFx(v)}));};
// ---------- shop ----------
function shopScreen(){const cats=[...new Set(SHOP.map(s=>s.cat))],c=SAVE.career;
  scr(`<h2>Shop <small class="muted">${c.credits} credits</small></h2><div class="row">${cats.map(k=>`<button class="chip${UI.shopCat===k?' sel':''}" data-u="shopCat" data-v="${esc(k)}">${esc(k)}</button>`).join('')}</div>
  ${SHOP.filter(s=>s.cat===UI.shopCat).map(s=>{const o=owns(s.id),need=s.needs&&!owns(s.needs);return `<div class="tile${need?' lock':''}"><div><b>${esc(s.name)}</b><br><small class="muted">${o?'Owned':need?'Requires: '+esc(SHOPMAP[s.needs].name):s.price+' credits'}</small></div>${
    o?(s.skin?`<button data-u="skin" data-v="${s.skin}" class="${SAVE.skin===s.skin?'sel':''}">${SAVE.skin===s.skin?'Equipped':'Equip'}</button>`:'<span>✓</span>'):need?'':`<button data-u="buy" data-v="${s.id}"${c.credits<s.price?' disabled':''}>Buy ${s.price}</button>`}</div>`;}).join('')}
  ${UI.shopCat==='Console skins'?`<div class="tile"><div><b>Default skin</b></div><button data-u="skin" data-v="default" class="${SAVE.skin==='default'?'sel':''}">${SAVE.skin==='default'?'Equipped':'Equip'}</button></div>`:''}
  <p class="muted" style="font-size:.8rem">Equipment adds fixtures to your career rig (each venue still has a maximum it can hang). Free Play always has the full rig.</p><div class="row">${backBtn('career')}</div>`);}
UA_.shop=()=>shopScreen();UA_.shopCat=v=>{UI.shopCat=v;shopScreen();};
UA_.buy=v=>{const s=SHOPMAP[v],c=SAVE.career;if(!s||owns(v))return;if(c.credits<s.price){toast('Not enough credits');sfx('deny');return;}if(s.needs&&!owns(s.needs)){toast('Buy '+SHOPMAP[s.needs].name+' first');return;}
  c.credits-=s.price;SAVE.owned.push(v);if(s.skin){SAVE.skin=s.skin;applySettings();}persist(false);sfx('cash');toast('Bought: '+s.name);shopScreen();};
UA_.skin=v=>{SAVE.skin=v;dirty();applySettings();shopScreen();};
// ---------- challenges ----------
function chScreen(){const c=SAVE.career.challenges;scr(`<h2>Challenges</h2>${CHALLENGES.map(ch=>`<div class="tile"><div><b>${c[ch.id]?'✅ ':''}${esc(ch.name)}</b><br><small class="muted">${esc(ch.desc)} · ${esc(TMAP[ch.track].title)} @ ${esc(VENUES[ch.venue].name)}</small></div><button data-u="ch" data-v="${ch.id}">Play</button></div>`).join('')}<div class="row">${backBtn()}</div>`);}
UA_.challenges=()=>chScreen();
// ---------- v2.2 music credits ----------
function creditsScreen(){const L=REAL_TRACKS.map(t=>{const r=t.real;return `<div class="crd"><b>${esc(r.title)}</b> – ${esc(r.artist)}<br><span class="muted">${esc(r.genre)} · ${Math.round(r.bpm)} BPM · <a href="${esc(r.lic_url)}" target="_blank" rel="noopener">${esc(r.lic)}</a> · <a href="${esc(r.page)}" target="_blank" rel="noopener">source (ccMixter)</a></span>${r.samples&&r.samples.length?'<br><span class="muted" style="font-size:.78rem">Samples: '+r.samples.map(x=>`<a href="${esc(x[2])}" target="_blank" rel="noopener">${esc(x[0])}</a> by ${esc(x[1])}`).join('; ')+'</span>':''}</div>`;}).join('');
  scr(`<h2>Music credits</h2><p class="muted" style="font-size:.85rem">The Career setlist uses real tracks published on ccMixter under Creative Commons Attribution (CC BY 3.0) and Attribution-NonCommercial (CC BY-NC 3.0) licenses. FESTIVAL CONTROL is free and non-commercial. Tracks are re-encoded to 128 kbps MP3 for streaming and otherwise unmodified. Synth tracks are generated live in your browser.</p><div class="credits">${L}</div><div class="row"><button class="pri" data-u="menu">Back</button></div>`);}
UA_.credits=()=>creditsScreen();
UA_.ch=id=>{const ch=CHALLENGES.find(c=>c.id===id),v=VENUES[ch.venue];warnThen(()=>startSession({mode:'challenge',challenge:ch,venue:ch.venue,env:ch.env,track:ch.track,dj:null,style:'energetic',crowdN:v.crowd,auto:'manual',scored:true,rig:ch.rig||v.rig,fx:ch.fx||v.fx}));};
// ---------- My Song ----------
function mySongScreen(){loadYTApi();const rec=ytRecent();
  scr(`<h2>My Song (YouTube)</h2><p class="muted">Paste a YouTube link. The music plays (the video stays hidden) and the show runs on a beat grid. Auto BPM listens through the microphone to lock the grid; TAP / SYNC / nudge to fine-tune. Unscored.</p>
  <input id="ytUrl" placeholder="https://youtu.be/…" style="width:100%" value="${esc(YT.url||'')}"><div id="ytMsg" style="min-height:1.3em;margin:.3rem 0">${esc(YT.msg||'')}</div>
  ${rec.length?'<div class="lbl">Recent</div><div class="row">'+rec.slice(0,6).map(r=>`<button class="chip" data-u="ytRec" data-v="${esc(r.id)}">${esc((r.title||r.id).slice(0,32))}</button>`).join('')+'</div>':''}
  <div class="opts"><label>Venue <select data-k="venue">${opt(VENUES.map((v,i)=>[i,v.name]),4)}</select></label><label>Environment <select data-k="env">${opt(ENVS.map(e=>[e.id,e.name]),'night')}</select></label>
  <label>Automation <select data-k="auto">${opt([['assisted','Assisted (rig follows the grid sections)'],['manual','Manual']],'assisted')}</select></label><label>Starting BPM <input type="number" id="ytBpmIn" min="60" max="200" step="0.5" value="${YT.bpm}" style="width:6rem"></label></div>
  <div class="row" style="margin-top:.6rem">${backBtn()}<button class="sel big" data-u="ytGo">START ▶</button></div>`);
  UI.setup={mode:'mysong',venue:4,env:'night',auto:'assisted'};const i=$('ytUrl');i.addEventListener('input',ytInputChanged);i.addEventListener('keydown',e=>e.stopPropagation());if(i.value)ytInputChanged();}
UA_.mysong=()=>mySongScreen();
UA_.ytRec=id=>{$('ytUrl').value='https://youtu.be/'+id;ytInputChanged();};
UA_.ytGo=()=>{const b=+($('ytBpmIn')||{}).value;if(b)ytSetBpm(b,true);initAudio();if(!ytStart())return;const s=UI.setup,v=VENUES[+s.venue];
  startSession({mode:'mysong',venue:+s.venue,env:s.env,track:'yt',dj:null,style:'energetic',crowdN:v.crowd,auto:s.auto,scored:false,rig:v.rig,fx:v.fx});};
function ytCtlBuild(){const y=$('ytCtl');y.innerHTML=`<button data-y="tap" data-help="Tap along to the beat 4+ times to set the BPM and phase.">TAP</button><button data-y="sync" data-help="Press exactly on beat 1 of a bar.">SYNC 1</button><button data-y="m" data-help="Nudge the grid 20 ms earlier.">◀ 20ms</button><button data-y="p" data-help="Nudge the grid 20 ms later.">20ms ▶</button><button data-y="bm">−BPM</button><span id="ytBpmL"></span><button data-y="bp">+BPM</button><button data-y="drop" data-help="Press when the drop hits: sections then count from here.">DROP!</button><button id="ytAB" data-y="ab" data-help="Auto BPM: listens through the microphone to the music from your speaker.">🎤</button>`;
  y.onclick=e=>{const b=e.target.closest('[data-y]');if(!b)return;const k=b.dataset.y;if(k==='tap'){b.textContent=ytTap(e);setTimeout(()=>b.textContent='TAP',1500);}else if(k==='sync')ytSync();else if(k==='m')ytNudge(-0.02);else if(k==='p')ytNudge(0.02);else if(k==='bm'){abManual();ytSetBpm(YT.bpm-0.5);}else if(k==='bp'){abManual();ytSetBpm(YT.bpm+0.5);}else if(k==='drop')ytMarkDrop();else if(k==='ab')abToggle();};}
// ---------- tutorial ----------
const TUT={on:false,i:0};
const TUT_STEPS=[['Welcome, operator! Open the lighting console: tap 🎛 (top right) or press Q.',(e)=>e==='conopen'],
 ['Pick a fixture group: tap a group chip such as "All beams" (or tap a light in the 3D view while the console is open).',(e,n,a)=>e==='cmd'&&n==='sel'&&a[0].length>0],
 ['Open the COLOR tab and tap a palette or a swatch.',(e,n)=>e==='cmd'&&(n==='pal'||n==='p')&&CON.tab==='color'],
 ['Go back to LIGHTS and tap a preset, e.g. "Red beam fan".',(e,n)=>e==='cmd'&&n==='preset'],
 ['Hold FLASH right on a beat (watch the beat dot next to the BPM).',(e,n,a)=>e==='cmd'&&n==='flash'&&a[0]],
 ['Tap ARM to arm the pyro, then CO2 or FLAMES on a big moment.',(e,n,a)=>e==='fx'],
 ['Open the LED tab and change the LED wall style.',(e,n,a)=>e==='cmd'&&n==='led'&&a[0]==='style'],
 ['Switch camera angle: tap 🎥 (or press V).',(e)=>e==='cam'],
 ['Done! Shows are scored on timing, music sync, variety and the crowd. End the session from the SHOW tab, or play a Career show.',()=>false]];
function tutShow(){const t=$('tut');if(!TUT.on){t.classList.add('hidden');return;}if(TUT.i===0)TUT.pro=ST.uiMode==='pro';const SS=tutSteps();t.classList.remove('hidden');t.classList.toggle('big',!!ST.tutBig);const s=SS[TUT.i];const last=TUT.i===SS.length-1;
  t.innerHTML=`<b>Step ${TUT.i+1}/${SS.length}</b> ${esc(s[0])} `+(last?`<button class="chip sel tbtn" data-tt="close">Keep playing</button><button class="chip tbtn" data-tt="menu">Main menu</button>`:`<button class="chip tbtn" data-tt="skip">Skip step</button><button class="chip tbtn" data-tt="end">End tutorial</button>`);
  if(ST.tutSpeak&&window.speechSynthesis){try{speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(s[0]));}catch(e){}}
  if(last&&!SAVE.tutorialDone){SAVE.tutorialDone=true;SAVE.career.credits+=100;persist(false);toast('Tutorial complete: +100 credits',2500);}}
function tutEv(e,n,a){if(!TUT.on)return;if(!TUT.pro&&TUT.lastT&&realNow()-TUT.lastT<0.35)return;const s=tutSteps()[TUT.i];const f=s&&(TUT.pro?s[1]:s[2]);if(f&&f(e,n,a||[])){TUT.i++;TUT.lastT=realNow();sfx('ok');buzz([15,30,15]);tutShow();}}
// ---------- settings ----------
const SET_DEF={graphics:[['quality','Quality','sel',[['auto','Auto (adaptive)'],['0.6','Low'],['0.8','Medium'],['1','High']]],['resScale','Resolution scale','rng',[0.5,1.5,0.05]],['fpsCap','Frame cap','sel',[[0,'Unlimited'],[30,'30 fps'],[60,'60 fps']]],
   ['bloom','Bloom glow','chk'],['reflections','Floor reflections','chk'],['crowdQ','Crowd density (on next show)','rng',[0.25,1.5,0.05]],['particleQ','Particle quality','rng',[0.25,1.5,0.05]],['ledQ','LED wall quality','rng',[0.5,1,0.05]],['drawDist','Draw distance','rng',[0.5,1.5,0.05]],
   ['perfMode','Performance mode (lowest settings)','chk'],['showFps','Show FPS','chk'],['aa','Anti-aliasing (applies on reload)','chk']],
 audio:[['vol.master','Master','rng',[0,1,0.01]],['vol.music','Music','rng',[0,1,0.01]],['vol.crowd','Crowd','rng',[0,1,0.01]],['vol.env','Environment / ambience','rng',[0,1,0.01]],['vol.fx','Effects (pyro, CO2)','rng',[0,1,0.01]],['vol.ui','Interface clicks','rng',[0,1,0.01]]],
 access:[['reduceFlash','Reduce flashing','chk'],['noStrobe','Disable strobe effects','chk'],['reduceShake','Reduce camera shake','chk'],['reduceMotion','Reduce motion','chk'],['flashWarn','Show photosensitivity warning','chk'],['colorBlind','Colour-blind friendly HUD','chk'],
   ['uiScale','Interface size','rng',[0.8,1.4,0.05]],['textScale','Text size','rng',[0.8,1.5,0.05]],['tutBig','Large tutorial text','chk'],['tutSpeak','Read tutorial aloud','chk'],['haptics','Vibration (where supported)','chk']],
 gameplay:[['uiMode','Console','sel',[['simple','Simple (big pads)'],['pro','Pro (full console)']]],['hints','Hints & drop countdown','chk'],['autoArm','Auto-arm pyro in Simple mode','chk'],['beginner','Beginner suggestions (Pro)','chk'],['quantize','Quantize cues/macros','sel',[['off','Off'],['half','½ beat'],['beat','Beat'],['bar','Bar']]],['maxFx','Max simultaneous FX','rng',[2,12,1]]]};
const getS=k=>k.startsWith('vol.')?ST.vol[k.slice(4)]:ST[k];
function setS(k,v){if(k.startsWith('vol.'))ST.vol[k.slice(4)]=v;else ST[k]=v;dirty();applySettings();}
function settingsScreen(){const T=UI.setTab;const tabs=[['graphics','Graphics'],['audio','Audio'],['access','Accessibility'],['gameplay','Gameplay'],['keys','Controls'],['data','Data']];let h='';
  if(SET_DEF[T])h=SET_DEF[T].map(([k,l,t,o])=>{const v=getS(k);if(t==='chk')return `<label><input type="checkbox" data-sk="${k}"${v?' checked':''}> ${l}</label>`;if(t==='sel')return `<label>${l} <select data-sk="${k}">${opt(o,v)}</select></label>`;
    return `<label class="sl"><span>${l}</span><input type="range" data-sk="${k}" min="${o[0]}" max="${o[1]}" step="${o[2]}" value="${v}"><output>${o[1]<=1.5?Math.round(v*100)+'%':v}</output></label>`;}).join('')+(T==='gameplay'?`<div class="item"><span class="nm">DJ name (multiplayer)</span><button data-u="mpEditName">${esc(mpName()||'Set name')}</button></div>`:'');
  else if(T==='keys')h=`<p class="muted">Tap a key to rebind it, then press the new key. Touch players: everything is also on screen. Gamepad: A flash · B blackout · X GO · Y flames · LB/RB camera · Start pause.</p>`+ACTIONS.map(a=>`<div class="item"><span class="nm">${esc(a[1])}</span><button data-u="rebind" data-v="${a[0]}" class="kbd${UI.rebind===a[0]?' sel':''}">${UI.rebind===a[0]?'press a key…':esc(SAVE.bind[a[0]]||'—')}</button></div>`).join('')+`<button data-u="keyReset">Reset to defaults</button>`;
  else h=`<div class="row"><button data-u="expSave">Export save file</button><button data-u="impSave">Import save file</button></div><div class="row"><button data-u="setReset">Reset settings</button><button class="danger" data-u="saveReset">Reset ALL progress</button></div><p class="muted">Saves are stored in this browser (localStorage) and autosave every few seconds. Export to move them to another device.</p>`;
  scr(`<h2>Settings</h2><div class="row">${tabs.map(([k,n])=>`<button class="chip${T===k?' sel':''}" data-u="setTab" data-v="${k}">${n}</button>`).join('')}</div><div class="opts">${h}</div><div class="row" style="margin-top:.6rem"><button data-u="${SES?'pause':'menu'}">&#8592; Back</button></div>`);}
UA_.settings=()=>settingsScreen();UA_.setTab=v=>{UI.setTab=v;UI.rebind=null;settingsScreen();};
UA_.rebind=v=>{UI.rebind=v;settingsScreen();};UA_.keyReset=()=>{SAVE.bind=defBindings();dirty();settingsScreen();};
UA_.expSave=()=>downloadJSON(SAVE,'festival-control-save.json');UA_.impSave=()=>{FILE_MODE='save';$('fileIn').click();};
UA_.setReset=()=>confirmBox('Reset settings?','All settings go back to defaults.','Reset',()=>{Object.assign(ST,JSON.parse(JSON.stringify(DEF_SETTINGS)));dirty();applySettings();settingsScreen();});
UA_.saveReset=()=>confirmBox('Reset ALL progress?','Credits, unlocks, cues and settings will be erased. This cannot be undone (export first if unsure).','Erase everything',()=>{Store.del('save');location.reload();},true);
// ---------- help ----------
function helpScreen(){scr(`<h2>Help</h2><div style="font-size:.9rem;line-height:1.45">
 <p><b>Goal:</b> make the light show feel like the music. Calm in breakdowns, build tension, go dark just before a drop, then hit it with everything right on the beat.</p>
 <p><b>Console (🎛 / Q):</b> LIGHTS = groups, intensity, chases, presets · COLOR = palettes, swatches, wheel · MOVE = patterns, XY position, gobos, lasers · FX = pyro, CO2, confetti, sequences · LED = wall content and transitions · CUES = record/fire cues, timeline programming · SHOW = quantize, camera, sections.</p>
 <p><b>Selection:</b> group chips or tap fixtures in the 3D view while the console is open. With nothing selected, edits apply to all fixtures. <b>Release</b> returns to the base/automated look.</p>
 <p><b>Pads:</b> FLASH and STROBE are hold buttons. Pyro (flames, sparks, fireworks) needs ARM first; it auto-disarms when you pause. Fireworks are outdoor-only.</p>
 <p><b>Camera:</b> tap 🎥 (top right) to switch angle: Front, Crowd POV, DJ booth, Wide, Side. The small label shows the current angle and it is remembered. Keyboard: V.</p>
 <p><b>Help mode:</b> tap ? (or press /) and then tap any control to see what it does.</p>
 <p><b>Keys:</b> ${ACTIONS.slice(0,22).map(a=>`<span class="kbd">${esc((SAVE.bind[a[0]]||'').replace(/^Key|^Digit/,''))}</span> ${esc(a[1])}`).join(' · ')}</p></div>
 <div class="row">${backBtn(SES?'pause':'menu')}<button data-u="helpMode">? Help mode</button></div>`);}
UA_.help=()=>helpScreen();UA_.helpMode=()=>{hideScr();if(SES&&SEQ.pausedForMenu){SEQ.pausedForMenu=false;transportPlay();}setHelpMode(true);};
function setHelpMode(on){document.body.classList.toggle('helpmode',on);$('helpCap').classList.toggle('hidden',!on);if(on)$('helpCap').textContent='HELP MODE: tap any control to see what it does. Tap here to exit.';}
// ---------- pause ----------
function pauseScreen(){if(!SES)return;if(SEQ.playing){transportPause();SEQ.pausedForMenu=true;}if(FXS.armed){CMD.run('arm',[false],{auto:true});toast('Pyro disarmed (paused)');}
  scr(`<h2>Paused</h2><p class="muted">${esc(TR?TR.title:'')} · ${SES.scored?'scored show':'unscored'}</p><div class="menuGrid"><button data-u="resume"><b>Resume</b></button><button data-u="restartS"><b>Restart</b></button><button data-u="settings"><b>Settings</b></button><button data-u="help"><b>Help</b></button>
  <button data-u="saveNow"><b>Save</b><span>progress, cues, presets</span></button><button data-u="expShowP"><b>Export show</b><span>JSON file</span></button><button data-u="impShowP"><b>Import show</b></button><button data-u="quit"><b>Quit to menu</b><span>${SES.scored?'no rewards':''}</span></button></div>`);}
UA_.pause=()=>pauseScreen();UA_.resume=()=>{hideScr();if(SEQ.pausedForMenu){SEQ.pausedForMenu=false;transportPlay();}};
UA_.restartS=()=>{hideScr();SEQ.pausedForMenu=false;restartSong();};UA_.saveNow=()=>persist(true);UA_.expShowP=()=>downloadJSON(exportShow(),'festival-control-show.json');UA_.impShowP=()=>{FILE_MODE='show';$('fileIn').click();};
UA_.quit=()=>{SEQ.pausedForMenu=false;menuScreen();};
// ---------- analysis ----------
function analysisScreen(R,rw){UI.lastAn={R,rw};let M={html:'',btns:null};try{M=mpResults(R);}catch(e){reportError(e,'mpResults');}const grade=R.overall>=90?'S':R.overall>=80?'A':R.overall>=70?'B':R.overall>=55?'C':'D';
  scr(`<h2>Show analysis <small class="muted">${esc(TR?TR.title:'')}</small></h2><div class="row"><div style="font-size:3rem;font-weight:800;color:var(--acc)">${R.overall}</div><div><b>Grade ${grade}</b><br><span class="muted">${R.accents} accents · ${R.drops.length} drops (${R.drops.filter(d=>d.hit).length} hit) · ${R.drops.filter(d=>d.moment).length} big moments</span></div></div>
  ${R._funHtml||''}${M.html}
  ${CATS.map(([k,n])=>`<div class="catrow"><span>${n}</span><div class="bar"><i style="width:${R.cats[k]}%"></i></div><b>${R.cats[k]}</b></div>`).join('')}
  <div class="lbl">Show graph: intensity (cyan) vs music energy (white) and crowd (pink); dots = drops (green hit / red missed)</div><canvas class="graph" id="graph" style="width:100%;height:120px"></canvas>
  ${rw&&rw.lines.length?'<div class="lbl">Results</div>'+rw.lines.map(l=>`<div>${l}</div>`).join(''):''}
  <div class="lbl">Tips</div>${R.tips.map(t=>`<div>• ${esc(t)}</div>`).join('')}
  <div class="row" style="margin-top:.8rem">${M.btns||`<button data-u="retry">Play again</button>${SES&&SES.mode==='career'?'<button data-u="career">Career</button><button data-u="shop">Shop</button>':''}<button class="sel" data-u="menu">Menu</button>`}</div>`);
  requestAnimationFrame(()=>drawGraph(R));}
function drawGraph(R){const c=$('graph');if(!c)return;const r=c.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);c.width=r.width*d;c.height=r.height*d;const x=c.getContext('2d'),W=c.width,H=c.height,sm=R.samples;if(!sm.length)return;const T=sm[sm.length-1].t||1;
  x.fillStyle='rgba(255,255,255,.04)';x.fillRect(0,0,W,H);const line=(f,col,w)=>{x.strokeStyle=col;x.lineWidth=w*d;x.beginPath();sm.forEach((s,i)=>{const X=s.t/T*W,Y=H-f(s)*H*0.92-2;i?x.lineTo(X,Y):x.moveTo(X,Y);});x.stroke();};
  line(s=>targetInt(s.m),'rgba(255,255,255,.55)',1);line(s=>s.e,ST.colorBlind?'#ffb000':'#ff2bd6',1.5);line(s=>s.i,'#20e3ff',2);R.drops.forEach(dr=>{x.fillStyle=dr.hit?(ST.colorBlind?'#3a8bff':'#3dff8e'):(ST.colorBlind?'#ffb000':'#ff3b3b');x.beginPath();x.arc(dr.t/T*W,8*d,4*d,0,7);x.fill();});}
UA_.retry=()=>{const c=SES&&SES.cfg;if(c)startSession(c);else menuScreen();};
UA_.tutorial=()=>warnThen(()=>startSession({mode:'tutorial',venue:3,env:'night',track:'tutorial',dj:null,style:'energetic',crowdN:1500,auto:'assisted',scored:false,rig:VENUES[3].rig,fx:VENUES[3].fx}));
// photosensitivity warning before the first show
function warnThen(fn){if(!ST.flashWarn||SAVE.seenWarn){fn();return;}
  scr(`<h2>⚠ Photosensitivity warning</h2><p>This game contains flashing lights, strobes and fast-moving patterns that may trigger seizures in people with photosensitive epilepsy.</p><p class="muted">You can reduce flashing and disable strobes now or any time in Settings → Accessibility.</p>
  <div class="opts"><label><input type="checkbox" id="wRF"${ST.reduceFlash?' checked':''}> Reduce flashing</label><label><input type="checkbox" id="wNS"${ST.noStrobe?' checked':''}> Disable strobe effects</label></div><div class="row"><button class="sel big" id="wOk">Continue</button></div>`);
  $('wOk').onclick=()=>{ST.reduceFlash=$('wRF').checked;ST.noStrobe=$('wNS').checked;SAVE.seenWarn=true;persist(false);hideScr();fn();};}
// ---------- settings application ----------
function applySettings(){const b=document.body,r=document.documentElement.style;r.setProperty('--ui',ST.uiScale);r.setProperty('--txt',ST.textScale);document.documentElement.style.fontSize=(15*ST.uiScale*ST.textScale)+'px';
  ['amber','ice','acid'].forEach(s=>b.classList.toggle('skin-'+s,SAVE.skin===s));b.classList.toggle('cb',!!ST.colorBlind);$('fps').classList.toggle('hidden',!ST.showFps);
  if(typeof G!=='undefined'&&G.R){if(ST.quality!=='auto')G.quality=+ST.quality;if(ST.perfMode)G.quality=Math.min(G.quality,0.55);applyDpr();}setVolumes();ytVol&&ytVol();if(typeof applyUiMode==='function')applyUiMode();}
// ---------- screen event delegation ----------
function screenInput(){const sc=$('scard');
  sc.addEventListener('click',e=>{const el=e.target.closest('[data-u]');if(!el)return;const f=UA_[el.dataset.u];if(f){uiClick();f(el.dataset.v,el);}});
  sc.addEventListener('change',e=>{const el=e.target;if(el.dataset.k&&UI.setup){UI.setup[el.dataset.k]=el.type==='checkbox'?el.checked:el.value;if(el.dataset.k==='track')preloadTrack(el.value);if(el.dataset.k==='track'&&UI.setup.mode!=='career'&&UI.setup.mode!=='mysong')setupScreen(UI.setup.mode);}
    if(el.dataset.sk){const t=el.type;setS(el.dataset.sk,t==='checkbox'?el.checked:t==='range'?+el.value:(isNaN(+el.value)||el.value===''?el.value:(el.dataset.sk==='quality'&&el.value==='auto'?'auto':+el.value)));}});
  sc.addEventListener('input',e=>{const el=e.target;if(el.dataset.sk&&el.type==='range'){setS(el.dataset.sk,+el.value);const o=el.nextElementSibling;if(o)o.textContent=+el.max<=1.5?Math.round(el.value*100)+'%':el.value;}});
  $('fileIn').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const o=JSON.parse(rd.result);
    if(FILE_MODE==='save'){const s=sanitizeSave(o);confirmBox('Import save?','This replaces your current progress with the file\'s.','Import',()=>{Store.set('save',s);location.reload();});}
    else{importShow(o);toast('Show imported: '+SAVE.cues.length+' cues, '+SAVE.presets.length+' presets');CON.needs=true;}}catch(err){toast('Could not import: '+err.message,3000);}};rd.readAsText(f);});}
// ---------- HUD ----------
function hudInput(){$('bMenu').onclick=()=>{uiClick();pauseScreen();};$('bCam').onclick=()=>{uiClick();camNext();};$('bCon').onclick=()=>{uiClick();conOpen();};
  $('bPlay').onclick=()=>{uiClick();if(SEQ.playing)transportPause();else{if(SEQ.ended&&!SES.scored)transportSeek(0);transportPlay();}};
  $('bRestart').onclick=()=>{uiClick();if(SES.scored)confirmBox('Restart the show?','Your score so far will be reset.','Restart',()=>restartSong());else restartSong();};
  $('bBack').onclick=()=>{if(!SES.scored&&TR&&!TR.yt)transportSeek(Math.max(0,songPos()-8*TR.bar));};$('bFwd').onclick=()=>{if(!SES.scored&&TR&&!TR.yt)transportSeek(songPos()+8*TR.bar);};
  const v=$('vol');v.value=ST.vol.music;v.oninput=()=>{ST.vol.music=+v.value;dirty();setVolumes();ytVol();};
  $('bRec').onclick=()=>toggleRec();$('helpCap').onclick=()=>setHelpMode(false);
  $('tut').addEventListener('click',e=>{const k=e.target.dataset.tt;if(!k)return;const SS=tutSteps();if(k==='menu'){TUT.on=false;tutShow();menuScreen();return;}if(k==='end'){TUT.on=false;tutShow();toast('Tutorial closed – replay it from the menu any time');return;}if(TUT.i>=SS.length-1||k==='close'){TUT.on=false;tutShow();}else{TUT.i++;tutShow();}});
  Bus.on('pro',m=>tutEv('pro',m));
  // help mode: intercept taps on anything with data-help
  document.addEventListener('click',e=>{if(!document.body.classList.contains('helpmode'))return;if(e.target.closest('#helpCap'))return;const h=e.target.closest('[data-help]');if(h){e.preventDefault();e.stopPropagation();$('helpCap').textContent='ℹ '+h.dataset.help+'  (tap here to exit help mode)';}},true);
  document.addEventListener('pointerdown',e=>{if(document.body.classList.contains('clean')&&!e.target.closest('#screen,#modal')){document.body.classList.remove('clean');e.stopPropagation();}},true);
  Bus.on('cmd',(n,a)=>tutEv('cmd',n,a));Bus.on('fx',k=>tutEv('fx',k));Bus.on('cam',m=>tutEv('cam',m));Bus.on('conopen',t=>tutEv('conopen',t));
  Bus.on('mus',(k,i)=>{if((k==='section'||k==='drop')&&TR){setTimeout(()=>{const s=TR.yt?null:TR.secs[i];const n=s?s.n:(k==='drop'?'DROP':'');if(!n)return;const b=$('banner');b.textContent=n;b.className=k==='drop'?'drop':'';clearTimeout(b._t);b._t=setTimeout(()=>b.className='hidden',1600);},10);}});}
function toggleRec(){if(!SES)return;if(CMD.rec){SES.lastReplay=CMD.rec;CMD.rec=null;toast('Recording saved: '+SES.lastReplay.log.length+' actions (SHOW tab → Watch)');}else{CMD.rec={track:TR.id,start:songPos(),log:[]};toast('Recording your actions…');}$('bRec').classList.toggle('on',!!CMD.rec);CON.needs=true;}
function nextMarker(){if(!TR||TR.yt)return null;const cb=Math.floor(beatPos()/4);const mb=musBar(cb);return TR.markers.find(m=>m.bar>mb)?{m:TR.markers.find(m=>m.bar>mb),bars:TR.markers.find(m=>m.bar>mb).bar-mb}:null;}
function hudTick(dt){if(!SES||!TR)return;const now=realNow(),bp=beatPos(),fr=bp-Math.floor(bp);$('beatDot').classList.toggle('on',SEQ.playing&&fr<0.18);
  const sec=curSecObj(),mus=sec?sec.e:(TR.yt?ytSecAt(musBar(Math.floor(bp/4))).e:0.5);$('mInt').style.width=(outInt()*100).toFixed(0)+'%';$('mMus').style.left=(targetInt(mus)*100).toFixed(0)+'%';$('mEng').style.width=(ENG.e*100).toFixed(0)+'%';
  if(now-UI.lastHud<0.12)return;UI.lastHud=now;
  $('tTrack').textContent=TR.title+' · '+(SES.djObj?SES.djObj.name:TR.dj.name);$('tBpm').textContent=(Math.round(TR.bpm*10)/10)+' BPM';$('tTime').textContent=fmtT(songPos())+(TR.yt?'':' / '+fmtT(TR.len));
  const ys=TR.yt?ytSecAt(musBar(Math.floor(bp/4))):null;$('tSec').textContent=sec?sec.n:ys?ys.n:'';const nm=nextMarker();$('tNext').textContent=nm&&nm.bars<=8?`→ ${nm.m.name} in ${nm.bars}`:'';
  $('tPreset').textContent=SHOW.preset||'';const ls=SES.scored?liveScore():null;$('tScore').textContent=SES.scored?(ls==null?'SCORE –':'SCORE '+ls):'';$('tScore').classList.toggle('hidden',!SES.scored);
  const mt=$('modeTag');mt.textContent=SHOW.mode==='prog'?'PROG':'LIVE';mt.classList.toggle('live',SHOW.mode!=='prog');$('bPlay').innerHTML=SEQ.playing?'&#9208;':'&#9654;';
  $('ytCtl').classList.toggle('hidden',!TR.yt);$('ytBpmL').textContent=TR.yt?(Math.round(YT.bpm*10)/10)+'':'';if(TR.yt)abUI();
  // beginner / assisted suggestions
  const sg=$('suggest');let msg='';if((ST.beginner||SES.mode==='tutorial')&&SEQ.playing&&!TR.yt){const pyro=FX_TYPES.some(k=>PYRO_KINDS[k]&&(FXS.dev[k]||[]).length);
    if(nm&&nm.m.kind==='drop'&&nm.bars<=4)msg=(pyro&&!FXS.armed?'Drop coming: ARM the pyro now. ':'')+'Go dark or minimal, then hit FLASH / FLAMES on the drop!';
    else if(sec&&sec.t==='drop'&&bp-sec.a*4<8)msg='DROP! Fire your effects on the beat.';else if(sec&&sec.t==='break')msg='Breakdown: calm colours, slow movement, no pyro.';else if(sec&&sec.t==='build')msg='Build-up: raise intensity and speed, add strobes near the end.';}
  sg.textContent=msg;sg.classList.toggle('hidden',!msg);
  simTick();try{funTick();}catch(e){}const bh=$('bottom').offsetHeight;if(bh&&bh!==UI.botH){UI.botH=bh;document.documentElement.style.setProperty('--botH',bh+'px');}
  if(ST.showFps)$('fps').textContent=(G.fps||0).toFixed(0)+' fps · q'+G.quality.toFixed(2);
  const sc=!!SES.scored;$('bBack').classList.toggle('hidden',sc||TR.yt);$('bFwd').classList.toggle('hidden',sc||TR.yt);$('bRec').classList.toggle('hidden',SES.mode!=='free');}
// ---------- keyboard ----------
function keyInput(){addEventListener('keydown',e=>{if(UI.rebind){e.preventDefault();SAVE.bind[UI.rebind]=e.code;UI.rebind=null;dirty();settingsScreen();return;}
  const tg=e.target;if(tg&&(tg.tagName==='INPUT'&&tg.type!=='range'&&tg.type!=='checkbox'||tg.tagName==='SELECT'||tg.tagName==='TEXTAREA'))return;if(!$('modal').classList.contains('hidden'))return;
  const act=Object.keys(SAVE.bind).find(k=>SAVE.bind[k]===e.code);if(!act)return;
  if(act==='menu'){e.preventDefault();if(UI.scr&&SES)UA_.resume();else if(SES)pauseScreen();return;}if(!SES||UI.scr)return;e.preventDefault();if(e.repeat&&act!=='playPause')return;keyAct(act,true);});
 addEventListener('keyup',e=>{if(!SES||UI.scr)return;const act=Object.keys(SAVE.bind).find(k=>SAVE.bind[k]===e.code);if(act==='flash'||act==='strobe')keyAct(act,false);});}
function keyAct(a,down){if(!down){padAct(a,false);return;}const tabs={lights:'lights',fx:'fx',led:'led'};
  if(tabs[a]){if(CON.open&&CON.tab===a)conOpen(false);else conOpen(true,a);return;}
  switch(a){case 'playPause':$('bPlay').click();break;case 'dash':conOpen(true);$('panel').classList.toggle('full');break;case 'cam':camNext();break;case 'go':CMD.run('go',[]);break;case 'mode':toggleMode();break;
   case 'cueZ':{const c=SAVE.cues[Math.max(0,SHOW.cueIdx)];if(c)CMD.run('cue',[c.id]);else CMD.run('preset',[pick(PRESET_NAMES)[0]]);break;}
   case 'cueX':{const L=SAVE.ledPresets;if(L.length)CA.ledP(String((UI.ledI=((UI.ledI||0)+1)%L.length)));else{const ok=LED_STYLES.filter(s=>ledUnlocked(s[0]));CMD.run('led',['style',ok[(ok.findIndex(s=>s[0]===LEDRT.cur)+1)%ok.length][0]]);}break;}
   case 'cueC':CMD.run('macro',[MACROS[(UI.macI=((UI.macI==null?-1:UI.macI)+1)%MACROS.length)].id]);break;
   case 'flash':case 'strobe':padAct(a,true);break;case 'blackout':padAct('bo',true);break;case 'arm':padAct('arm',true);break;
   case 'flames':case 'co2':case 'confetti':case 'sparks':case 'fireworks':padAct(a,true);break;
   case 'help':setHelpMode(!document.body.classList.contains('helpmode'));break;case 'compact':document.body.classList.toggle('compact');break;
   default:if(/^g\d$/.test(a)){const g=allGroups()[+a.slice(1)-1];if(g)CMD.run('sel',[g[2].slice(),g[0]]);}}}
// ---------- gamepad ----------
const GP={prev:[]};
function gamepadTick(){if(!SES||UI.scr||!navigator.getGamepads)return;let p=null;try{p=[...navigator.getGamepads()].find(x=>x);}catch(e){}if(!p)return;const map={0:'flash',1:'blackout',2:'go',3:'flames',4:'camP',5:'cam',9:'menu'};
  p.buttons.forEach((b,i)=>{const was=GP.prev[i],is=b.pressed;GP.prev[i]=is;const a=map[i];if(!a||was===is)return;if(a==='menu'){if(is)pauseScreen();return;}if(a==='camP'||a==='cam'){if(is)camNext();return;}keyAct(a,is);});}
function uiInit(){screenInput();hudInput();keyInput();conInput();buildPads();tlInput();ytCtlBuild();applySettings();simpleInit();funInit();duelInit();}
