// v2.1 Simple console: big labelled pads, hints, drop countdown, glowing suggestions, timing judge (PERFECT / GREAT + combos), haptics, auto-arm pyro,
// pointer tutorial, first-launch welcome and a "new version" check. Pro mode = the full v2.0 console.
const SPADS=[['colors','🎨','Colours','tap'],['looks','💡','Looks','tap'],['led','📺','LED','tap'],['laser','🟢','Lasers','tog'],['flash','⚡','Flash','hold'],['strobe','💥','Strobe','hold'],
 ['bo','🌑','Blackout','tog'],['co2','💨','CO2','fx'],['flames','🔥','Flames','fx'],['confetti','🎊','Confetti','fx'],['fireworks','🎆','Fireworks','fx'],['drop','🚀','DROP!','tap']];
const SIM={combo:0,best:0,hint:'',glow:[],lastPop:0,lastLook:-99,lastAction:-99,perfect:0,great:0,ptrSel:null,updShown:false,armedAuto:false};
function isPro(){return ST.uiMode==='pro';}
function applyUiMode(){document.body.classList.toggle('pro',isPro());const b=$('bPro');if(b){b.classList.toggle('on',isPro());b.textContent=isPro()?'SIMPLE':'PRO';b.setAttribute('aria-label',isPro()?'Switch to the simple console':'Open the pro console');}
  if(!isPro()&&typeof CON!=='undefined'&&CON.open)conOpen(false);}
function setUiMode(m){ST.uiMode=m;dirty();applyUiMode();Bus.emit('pro',m);}
function cycNext(list,cur){const i=list.indexOf(cur);return list[(i+1)%list.length];}
function hasPyro(){return FX_TYPES.some(k=>PYRO_KINDS[k]&&(FXS.dev[k]||[]).length);}
function ensureArmed(){if(FXS.armed)return true;if(!hasPyro())return false;const r=CMD.run('arm',[true]);return r!==false&&FXS.armed;}
function simFx(kind){if(PYRO_KINDS[kind])ensureArmed();if(kind==='fireworks'&&!G.env.outdoor){toast('🎆 Fireworks are outdoor-only. Try 🎊 Confetti!');sfx('deny');return false;}
  if(!(FXS.dev[kind]||[]).length){toast(FX_NAMES[kind]+' are not in this rig'+(SES&&SES.mode==='career'?' (buy them in the Shop)':''));sfx('deny');return false;}
  const r=CMD.run('fx',[kind,{pat:CON.fxPat}]);return r!==false;}
function simAct(id,down){if(id==='flash'||id==='strobe'){padAct(id,down);return true;}if(!down)return false;
  switch(id){case 'colors':{const ids=PALETTES.map(p=>p.id);CMD.run('pal',[cycNext(ids,SHOW.pal),null]);SIM.lastLook=beatPos();return true;}
   case 'looks':{const ids=PRESET_NAMES.map(p=>p[0]).filter(x=>x!=='blackout');CMD.run('preset',[cycNext(ids,SIM.look||SHOW.presetId||'blue')]);SIM.look=cycNext(ids,SIM.look||'blue');SIM.lastLook=beatPos();return true;}
   case 'led':{const ok=LED_STYLES.map(s=>s[0]).filter(s=>ledUnlocked(s));CMD.run('led',['style',cycNext(ok,SHOW.led.style)]);return true;}
   case 'laser':padAct('laser',true);return true;case 'bo':padAct('bo',true);return true;
   case 'drop':{ensureArmed();if(SHOW.blackout)padAct('bo',true);CMD.run('macro',['drophit']);return true;}
   default:return simFx(id);}}
function spLabel(id){if(!SES)return '';switch(id){case 'colors':return (PALETTES.find(p=>p.id===SHOW.pal)||{}).name||'';case 'looks':return SHOW.preset||'';case 'led':return ((LED_STYLES.find(s=>s[0]===SHOW.led.style)||[])[1]||'').split(' ')[0];
  case 'laser':return SHOW.lzOn?'ON':'off';case 'bo':return SHOW.blackout?'DARK':'';case 'strobe':return 'hold';case 'flash':return 'hold';case 'fireworks':return G.env.outdoor?'':'outdoor only';
  case 'flames':return FXS.armed?'armed':'';default:return '';}}
function buildSimplePads(){const p=$('spads');if(!p)return;p.innerHTML=SPADS.map(([id,ic,n,k])=>`<button class="sp sp-${id}${k==='fx'&&id!=='co2'&&id!=='confetti'?' pyro':''}" data-s="${id}" aria-label="${esc(n)}" data-help="${esc(n)}"><i>${ic}</i><b>${esc(n)}</b><small></small></button>`).join('');
  p.querySelectorAll('.sp').forEach(b=>{const id=b.dataset.s,hold=(SPADS.find(x=>x[0]===id)||[])[3]==='hold';let isDown=false;
    b.addEventListener('pointerdown',e=>{if(document.body.classList.contains('helpmode'))return;e.preventDefault();isDown=true;b.classList.add('hit');const ok=simAct(id,true);judgeTap(id,ok);});
    const up=()=>{if(!isDown)return;isDown=false;b.classList.remove('hit');if(hold)simAct(id,false);};['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,up));
    b.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();e.stopPropagation();if(!e.repeat){simAct(id,true);judgeTap(id,true);}}});b.addEventListener('keyup',e=>{if((e.key===' '||e.key==='Enter')&&hold){e.stopPropagation();simAct(id,false);}});});}
// ---- timing judge ----
const JUDGED={flash:1,strobe:1,bo:1,co2:1,flames:1,confetti:1,fireworks:1,drop:1,colors:1,looks:1,laser:1,drophit:1,sparks:1,blind:1,go:1};
// v2.3: the judge itself is shared by the solo player and both Duel players (P = per-player state)
function judgeCore(P,id){const bp=beatPos(),off=Math.abs(bp-Math.round(bp));
  const sec=curSecObj();const dropB=sec&&sec.t==='drop'?sec.a*4:null;const nm=nextMarker();let nearDrop=dropB!=null&&bp-dropB<1.05&&bp-dropB>-0.3;
  if(!nearDrop&&nm&&nm.m.kind==='drop'){const left=nm.bars*4-(bp-Math.floor(bp/4)*4);if(left<0.35)nearDrop=true;}
  const big=id==='drop'||id==='drophit'||id==='flames'||id==='fireworks'||id==='confetti'||id==='co2'||id==='flash';let k;
  if(nearDrop&&big&&realNow()-(P.dropPop||0)>3){P.dropPop=realNow();P.combo++;k='drop';}
  else if(off<0.12){P.combo++;P.perfect++;k='perfect';}else if(off<0.25){P.combo++;P.great++;k='great';}else{k='miss';P.lostCombo=P.combo;P.combo=0;}
  P.best=Math.max(P.best||0,P.combo);return k;}
function judgeTap(id,ok){buzz(12);if(!ok||!SES||!SEQ.playing||!JUDGED[id]||(SES.cfg&&SES.cfg.duel))return;SIM.lastAction=beatPos();const k=judgeCore(SIM,id);
  if(k==='drop'){pop('PERFECT DROP!','drop');sfx('dropok');buzz([30,40,70]);CRW.boost=Math.min(1,CRW.boost+0.25);}
  else if(k==='perfect'){pop(SIM.combo>=3?`PERFECT ×${SIM.combo}`:'PERFECT','perfect');sfx('perfect',1);buzz(25);CRW.boost=Math.min(1,CRW.boost+0.04);}
  else if(k==='great'){pop(SIM.combo>=3?`GREAT ×${SIM.combo}`:'GREAT','great');sfx('great',1);}
  else if(SIM.lostCombo>=3)pop('Combo lost – tap on the beat','miss');
  Bus.emit('judge',k,id,SIM);
  if(k!=='miss'&&SIM.combo>0&&SIM.combo%5===0){sfx('combo');buzz([20,30,20,30,40]);pop(`COMBO ×${SIM.combo}!`,'combo');crowdReact(0.4);}}
function pop(txt,cls){const p=$('pop');if(!p)return;p.textContent=txt;p.className='show '+(cls||'');void p.offsetWidth;p.classList.add('go');clearTimeout(SIM.popT);SIM.popT=setTimeout(()=>p.className='',900);}
Bus.on('cmd',(n,a,o)=>{if(o&&o.manual&&isPro()&&SES&&{flash:a&&a[0],strobe:a&&a[0],macro:1,bo:1,go:1,blind:1}[n])judgeTap(n==='macro'?'drophit':n,true);});
// ---- auto-arm pyro in Simple mode ----
Bus.on('mus',(k,i)=>{if(k!=='section'||!SES||isPro()||!ST.autoArm||!TR||TR.yt)return;const s=TR.secs[i];if(!s||!hasPyro())return;
  if((s.t==='build'||s.t==='drop'||s.t==='peak')&&!FXS.armed){if(CMD.run('arm',[true],{auto:true})!==false&&FXS.armed){SIM.armedAuto=true;toast('🔥 Pyro armed for the '+(s.t==='build'?'drop':'peak'),1800);}}
  else if((s.t==='break'||s.t==='outro')&&FXS.armed&&SIM.armedAuto){CMD.run('arm',[false],{auto:true});SIM.armedAuto=false;}});
Bus.on('session',()=>{SIM.combo=0;SIM.best=0;SIM.perfect=0;SIM.great=0;SIM.armedAuto=false;SIM.look=null;});
// ---- hints, countdown, glow ----
function simHint(){if(!SES||!TR)return {t:'',g:[],cd:''};const playing=SEQ.playing,bp=beatPos();if(!playing)return {t:'Tap ▶ to start the music',g:[],cd:''};
  if(TR.yt)return {t:'',g:[],cd:''};const sec=curSecObj(),t=sec?sec.t:'groove',nm=nextMarker(),inSec=sec?bp-sec.a*4:99;let txt='',g=[],cd='';const pyro=hasPyro();
  if(nm&&nm.m.kind==='drop'&&nm.bars<=8){const left=nm.bars*4-(bp-Math.floor(bp/4)*4);const bars=Math.ceil(left/4-1e-6);
    if(left<=3.999){cd=String(Math.max(1,Math.ceil(left)));txt='Get ready… hit 🚀 DROP! on the drop';g=['drop'];}
    else{cd=`DROP IN ${bars} BAR${bars>1?'S':''}`;if(bars<=4){txt=pyro?(FXS.armed||ST.autoArm?'Drop in '+bars+' bars – pyro is armed, get ready!':'Drop in '+bars+' bars – arm pyro!'):'Drop in '+bars+' bars – get ready to hit DROP!';g=['strobe','drop'];}
      else{txt='Build-up! Hold 💥 Strobe and raise the energy';g=['strobe','flash'];}}}
  else if(t==='drop'&&inSec<8){txt=pyro?'DROP! Fire 🔥 Flames, 🎊 Confetti'+(G.env.outdoor?', 🎆 Fireworks':'')+'!':'DROP! Hit ⚡ Flash and 🎊 Confetti!';g=pyro?['flames','confetti','fireworks']:['flash','confetti'];if(!G.env.outdoor)g=g.filter(x=>x!=='fireworks');}
  else if(t==='drop'||t==='peak'){if(bp-SIM.lastLook>16){txt='Keep it big: change 💡 Looks or 🎨 Colours';g=['looks','colors'];}else{txt='Big moment – ⚡ Flash on the beat for combos';g=['flash'];}}
  else if(t==='break'){txt='Breakdown: calm 🎨 Colours, no pyro – phones are up!';g=bp-SIM.lastLook>16?['colors']:[];}
  else if(t==='build'){txt='Build-up! Hold 💥 Strobe as it rises';g=['strobe'];}
  else if(t==='outro'){txt='Outro – finish with 🎊 Confetti';g=['confetti'];}
  else if(bp-SIM.lastLook>16){txt='Change 🎨 Colours or 💡 Looks with the music';g=['colors','looks'];}
  else if(Math.floor(bp/32)%2===1){txt='Try 📺 LED for a new video wall';g=['led'];}
  return {t:txt,g,cd};}
function simTick(){if(!SES||!TR||SIM.freeze)return;const h=ST.hints?simHint():{t:'',g:[],cd:''};const hint=$('hint'),cd=$('cdown');
  if(hint){if(hint.textContent!==h.t)hint.textContent=h.t;hint.classList.toggle('hidden',!h.t||TUT.on);}
  if(cd){if(cd.textContent!==h.cd){cd.textContent=h.cd;cd.classList.toggle('num',/^\d$/.test(h.cd));if(/^\d$/.test(h.cd)){cd.classList.remove('tick');void cd.offsetWidth;cd.classList.add('tick');}}cd.classList.toggle('hidden',!h.cd);}
  const sp=$('spads');if(sp){const tg=TUT.on?(tutTarget()||'').replace(/.*data-s="(\w+)".*/,'$1'):'';sp.querySelectorAll('.sp').forEach(b=>{const id=b.dataset.s;b.classList.toggle('glow',h.g.includes(id)||tg===id);
    const l=spLabel(id);const s=b.querySelector('small');if(s.textContent!==l)s.textContent=l;
    b.classList.toggle('on',(id==='laser'&&SHOW.lzOn)||(id==='bo'&&SHOW.blackout));if(SPADS.find(x=>x[0]===id)[3]==='fx')b.classList.toggle('dim',!(FXS.dev[id]||[]).length||(id==='fireworks'&&!G.env.outdoor));});}
  const cb=$('combo');if(cb){cb.textContent=SIM.combo>=2?'COMBO ×'+SIM.combo:'';cb.classList.toggle('hidden',SIM.combo<2);}
  tutPtrTick();}
// ---- tutorial (Simple) with a pointer ring ----
const TUT_SIMPLE=[['Tap 🎨 Colours to change the colour of every light.','[data-s="colors"]',(e,n)=>e==='cmd'&&n==='pal'],
 ['Tap 💡 Looks for a new lighting look.','[data-s="looks"]',(e,n)=>e==='cmd'&&n==='preset'],
 ['Tap 📺 LED to change the giant video wall.','[data-s="led"]',(e,n,a)=>e==='cmd'&&n==='led'&&a[0]==='style'],
 ['Hold 💥 Strobe for a second – crowds love it in build-ups.','[data-s="strobe"]',(e,n,a)=>e==='cmd'&&n==='strobe'&&a[0]],
 ['Tap 🚀 DROP! – best right when the countdown hits the drop.','[data-s="drop"]',(e,n,a)=>e==='cmd'&&n==='macro'],
 ['Fire 🔥 Flames or 🎊 Confetti. Pyro arms itself in Simple mode.','[data-s="flames"]',(e)=>e==='fx'],
 ['Want every fader? Tap PRO (top right) any time. Tap it twice to come back.','#bPro',(e)=>e==='pro'],
 ['You\'re ready! Tap on the beat for PERFECT combos and watch the crowd go wild.',null,()=>false]];
function tutSteps(){return TUT.pro?TUT_STEPS:TUT_SIMPLE;}
function tutTarget(){if(!TUT.on||TUT.pro)return null;const s=TUT_SIMPLE[TUT.i];return s?s[1]:null;}
function tutPtrTick(){const p=$('tutPtr');if(!p)return;const sel=tutTarget();const el=sel?document.querySelector(sel):null;const r=el&&el.offsetParent!==null?el.getBoundingClientRect():null;
  if(!r||!r.width){p.classList.add('hidden');return;}p.classList.remove('hidden');p.style.left=(r.left-6)+'px';p.style.top=(r.top-6)+'px';p.style.width=(r.width+12)+'px';p.style.height=(r.height+12)+'px';}
// ---- welcome (first launch) ----
function welcomeScreen(){scr(`<div class="welcome"><div class="wIcon">🎛️🔥🎊</div><h1>Welcome to FESTIVAL CONTROL</h1><p>You run the lights, lasers, LED wall and pyro for a huge festival crowd. Hit the big pads to the music and make the crowd go wild.</p>
  <button class="playBig" data-u="firstShow">▶ Start my first show<span>Guided · about 2 minutes</span></button><button class="linkBtn" data-u="skipWelcome">Skip – go to the menu</button></div>`,'wel');}
UA_.firstShow=()=>{SAVE.welcomed=true;dirty();UA_.tutorial();};UA_.skipWelcome=()=>{SAVE.welcomed=true;dirty();persist(false);menuScreen();};
let QNEXT=null;const quickNext=()=>{if(!QNEXT||!TMAP[QNEXT]){const pool=REAL_TRACKS.filter(t=>!SES||t.id!==TR.id);QNEXT=pick(pool).id;}preloadTrack(QNEXT);return QNEXT;};
UA_.play=()=>{const t=TMAP[quickNext()],v=VENUES[4];QNEXT=null;setTimeout(quickNext,6000);SAVE.lastTrack=t.id;dirty();
  warnThen(()=>startSession({mode:'show',venue:4,env:'night',track:t.id,dj:null,style:'energetic',crowdSize:'massive',auto:'assisted',short:true,scored:true,rig:v.rig,fx:v.fx}));};
// ---- new-version check (cache busting for iPhone home-screen / Safari caches) ----
function updCheck(){if(!/^https?:/.test(location.protocol)||!window.fetch)return;fetch(location.pathname+'?v='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.text():'').then(t=>{const m=/const VERSION='(v[\d.]+)'/.exec(t||'');
  if(m&&m[1]!==VERSION&&!SIM.updShown){SIM.updShown=true;const u=$('upd');u.innerHTML=`New version ${esc(m[1])} – tap to update`;u.classList.remove('hidden');u.onclick=()=>location.replace(location.pathname+'?v='+m[1].slice(1)+'&t='+Date.now());}}).catch(()=>{});}
function simpleInit(){buildSimplePads();const b=$('bPro');if(b)b.onclick=()=>{uiClick();setUiMode(isPro()?'simple':'pro');toast(isPro()?'Pro console: every control. Tap SIMPLE to go back.':'Simple console',1800);};applyUiMode();
  setTimeout(updCheck,4000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)updCheck();});}
