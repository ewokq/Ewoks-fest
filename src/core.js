// Core: utilities, device, event bus, versioned save system, settings, key bindings, command log (drives replay + scoring)
const VERSION='v2.0';
const SAVE_VERSION=1;
const params=new URLSearchParams(location.search);
const UA=navigator.userAgent||'';
const IS_IOS=/iPad|iPhone|iPod/.test(UA)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const IS_TOUCH=('ontouchstart' in window)||navigator.maxTouchPoints>0;
const IS_MOBILE=IS_IOS||/Android|Mobile/i.test(UA)||(IS_TOUCH&&Math.min(screen.width,screen.height)<820);
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,k)=>a+(b-a)*k;
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[(Math.random()*a.length)|0];
const realNow=()=>performance.now()/1000;
const approach=(a,b,dt,tau)=>tau<=0.001?b:a+(b-a)*(1-Math.exp(-dt/tau));
const fmtT=s=>{s=Math.max(0,s|0);return (s/60|0)+':'+String(s%60).padStart(2,'0');};
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-3);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function seeded(seed){let s=seed>>>0||1;return ()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
// ---- color helpers (hex strings in state, THREE.Color at render) ----
function hexOk(h){return typeof h==='string'&&/^#[0-9a-f]{6}$/i.test(h);}
function h2rgb(h){if(!hexOk(h))h='#ffffff';const n=parseInt(h.slice(1),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];}
function rgb2h(r,g,b){const c=v=>('0'+Math.round(clamp(v,0,1)*255).toString(16)).slice(-2);return '#'+c(r)+c(g)+c(b);}
function hsv2rgb(h,s,v){h=((h%1)+1)%1;const i=Math.floor(h*6),f=h*6-i,p=v*(1-s),q=v*(1-f*s),t=v*(1-(1-f)*s);return [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6];}
function rgb2hsv(r,g,b){const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;if(d){if(mx===r)h=((g-b)/d)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h/=6;if(h<0)h+=1;}return [h,mx?d/mx:0,mx];}
function hexHue(h){const [r,g,b]=h2rgb(h);return rgb2hsv(r,g,b);}
function mixHex(a,b,k){const A=h2rgb(a),B=h2rgb(b);return rgb2h(lerp(A[0],B[0],k),lerp(A[1],B[1],k),lerp(A[2],B[2],k));}
// ---- event bus ----
const Bus={h:{},on(e,f){(this.h[e]=this.h[e]||[]).push(f);},emit(e,...a){const l=this.h[e];if(l)for(const f of l){try{f(...a);}catch(err){reportError(err,'bus:'+e);}}}};
// ---- error handling: never crash the show; log, show a small notice once ----
const ERRORS=[];
function reportError(err,where){ERRORS.push({where,msg:String(err&&err.message||err)});try{console.warn('[FC]',where,err);}catch(e){} if(ERRORS.length<=3&&typeof toast==='function')toast('Something went wrong ('+where+'), the show continues.',2600);}
window.addEventListener('error',e=>{ if(e&&e.message&&/ResizeObserver/.test(e.message))return; ERRORS.push({where:'window',msg:e.message});});
// ---- storage ----
const LSK='festctl2_';
const Store={ok:true,
  get(k,d){try{const v=localStorage.getItem(LSK+k);return v==null?d:JSON.parse(v);}catch(e){return d;}},
  set(k,v){try{localStorage.setItem(LSK+k,JSON.stringify(v));return true;}catch(e){this.ok=false;return false;}},
  raw(k){try{return localStorage.getItem(LSK+k);}catch(e){return null;}},
  del(k){try{localStorage.removeItem(LSK+k);}catch(e){}}};
const DEF_SETTINGS={quality:'auto',resScale:1,fpsCap:0,aa:!IS_MOBILE,shadows:false,volumetric:2,reflections:true,crowdQ:1,particleQ:1,ledQ:1,lightQ:1,bloom:true,drawDist:1,perfMode:false,showFps:false,
  uiScale:1,textScale:1,colorBlind:false,reduceShake:false,reduceMotion:false,reduceFlash:false,noStrobe:false,flashWarn:true,beginner:false,tutBig:false,tutSpeak:false,camSens:1,
  vol:{master:0.9,music:0.85,crowd:0.6,env:0.5,fx:0.6,ui:0.5},maxFx:6,quantize:'beat',skin:'default',haptics:true};
const ACTIONS=[['playPause','Play / pause music','Space'],['menu','Pause menu','Escape'],['lights','Open lighting controls','KeyQ'],['fx','Open special-effects controls','KeyE'],['led','Open LED controls','KeyR'],['dash','Full dashboard','Tab'],
 ['cueZ','Fire selected lighting cue','KeyZ'],['cueX','Apply selected visual (LED) preset','KeyX'],['cueC','Fire selected special-effect sequence','KeyC'],['cam','Switch camera','KeyV'],['go','GO next cue','Enter'],['mode','Toggle LIVE / PROGRAMMING','KeyF'],
 ['flash','Flash / bump (hold)','KeyJ'],['blackout','Blackout','KeyK'],['strobe','Strobe (hold)','KeyL'],['arm','Arm / disarm pyro','KeyP'],['flames','Fire flames','KeyT'],['co2','Fire CO2','KeyY'],['confetti','Fire confetti','KeyN'],['sparks','Fire sparks','KeyM'],['fireworks','Launch fireworks','KeyG'],
 ['g1','Group bank 1','Digit1'],['g2','Group bank 2','Digit2'],['g3','Group bank 3','Digit3'],['g4','Group bank 4','Digit4'],['g5','Group bank 5','Digit5'],['g6','Group bank 6','Digit6'],['g7','Group bank 7','Digit7'],['g8','Group bank 8','Digit8'],
 ['help','Help mode','Slash'],['compact','Compact mode (hide console)','KeyH']];
function defBindings(){const b={};ACTIONS.forEach(a=>b[a[0]]=a[2]);return b;}
// ---- versioned save ----
function freshSave(){return {v:SAVE_VERSION,created:Date.now(),settings:JSON.parse(JSON.stringify(DEF_SETTINGS)),bind:defBindings(),
  career:{credits:400,xp:0,rep:0,venue:0,best:{},missions:{},challenges:{},shows:0},owned:[],skin:'default',
  groups:[],presets:[],cues:[],programs:{},ledPresets:[],macros:[],festivals:[],swatches:['#ff2bd6','#20e3ff','#ffffff','#ffb300'],favorites:[],tutorialDone:false,seenWarn:false,lastTrack:'bigroom'};}
let SAVE, SAVE_NOTE='';
function sanitizeSave(s){
  const f=freshSave(); if(!s||typeof s!=='object'||Array.isArray(s)) throw new Error('not an object');
  const out=Object.assign(f,{}); 
  if(typeof s.v!=='number'||s.v>SAVE_VERSION) throw new Error('unknown save version');
  for(const k of Object.keys(f)){ if(!(k in s)) continue; const a=f[k],b=s[k];
    if(Array.isArray(a)){ if(Array.isArray(b)) out[k]=b.filter(x=>x!=null&&(typeof x!=='object'||!Array.isArray(x))).slice(0,200); }
    else if(a&&typeof a==='object'){ if(b&&typeof b==='object'&&!Array.isArray(b)) out[k]=Object.assign({},a,b); }
    else if(typeof a===typeof b) out[k]=b; }
  out.settings=Object.assign({},DEF_SETTINGS,out.settings); out.settings.vol=Object.assign({},DEF_SETTINGS.vol,out.settings.vol||{});
  for(const [k,v] of Object.entries(DEF_SETTINGS)) if(typeof out.settings[k]!==typeof v) out.settings[k]=v;
  out.bind=Object.assign(defBindings(),out.bind); for(const k in out.bind) if(typeof out.bind[k]!=='string') out.bind[k]=defBindings()[k]||'';
  const c=out.career; ['credits','xp','rep','venue','shows'].forEach(k=>{c[k]=Number.isFinite(+c[k])?Math.max(0,Math.floor(+c[k])):0;}); c.venue=Math.min(c.venue,6);
  ['best','missions','challenges'].forEach(k=>{if(!c[k]||typeof c[k]!=='object'||Array.isArray(c[k]))c[k]={};});
  out.owned=out.owned.filter(x=>typeof x==='string');
  out.groups=out.groups.filter(g=>g&&typeof g.name==='string'&&Array.isArray(g.ids));
  out.presets=out.presets.filter(p=>p&&typeof p.name==='string'&&p.look&&typeof p.look==='object');
  out.cues=out.cues.filter(q=>q&&typeof q.name==='string'&&typeof q.id==='string');
  if(!out.programs||typeof out.programs!=='object')out.programs={};
  for(const k in out.programs){const p=out.programs[k];if(!p||!Array.isArray(p.ev))delete out.programs[k];else p.ev=p.ev.filter(e=>e&&Number.isFinite(e.b)&&typeof e.cue==='string');}
  out.swatches=out.swatches.filter(hexOk).slice(0,16);
  return out;
}
function loadSave(){
  const raw=Store.raw('save');
  if(raw==null){SAVE=freshSave();
    // veteran bonus: players of the old "Drop Control 3D" get a credit gift once
    try{if(localStorage.getItem('dropctl_save')||localStorage.getItem('dc_save')){SAVE.career.credits+=500;SAVE_NOTE='Welcome back, Ewok Fest veteran: +500 credits!';}}catch(e){}
    return;}
  try{SAVE=sanitizeSave(JSON.parse(raw));}
  catch(e){Store.set('save_corrupt_'+Date.now(),raw);SAVE=freshSave();SAVE_NOTE='Your save data could not be read, so a fresh save was started (the old data was backed up).';}
}
let saveDirty=false, lastSaveT=0;
function persist(manual){SAVE.saved=Date.now();const ok=Store.set('save',SAVE);saveDirty=false;lastSaveT=realNow();if(manual)toast(ok?'Saved \u2713':'Could not save: storage is full or blocked.',1800);else if(!ok)toast('Autosave failed: storage is full or blocked.',2500);return ok;}
function dirty(){saveDirty=true;}
setInterval(()=>{if(saveDirty&&realNow()-lastSaveT>4)persist(false);},5000);
window.addEventListener('pagehide',()=>{if(saveDirty)persist(false);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&saveDirty)persist(false);});
loadSave();
const ST=SAVE.settings;
// ---- toast / confirm (with undo for deletions) ----
let toastT=0;
function toast(msg,ms,action){const t=$('toast');if(!t)return;t.innerHTML='';const s=document.createElement('span');s.textContent=msg;t.appendChild(s);
  if(action){const b=document.createElement('button');b.textContent=action.label;b.className='chip';b.onclick=()=>{t.classList.add('hidden');action.fn();};t.appendChild(b);}
  t.classList.remove('hidden');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.add('hidden'),ms||1600);}
function confirmBox(title,text,okLabel,fn,danger){const m=$('modal'),c=$('mcard');c.innerHTML='<h2></h2><p class="muted"></p><div class="row" style="justify-content:flex-end"><button id="mNo">Cancel</button><button id="mYes"></button></div>';
  c.querySelector('h2').textContent=title;c.querySelector('p').textContent=text;const y=c.querySelector('#mYes');y.textContent=okLabel||'OK';if(danger)y.className='danger';else y.className='sel';
  m.classList.remove('hidden');c.querySelector('#mNo').onclick=()=>m.classList.add('hidden');y.onclick=()=>{m.classList.add('hidden');fn();};y.focus();}
function promptBox(title,value,fn){const m=$('modal'),c=$('mcard');c.innerHTML='<h2></h2><input id="mIn" maxlength="40" style="width:100%"><div class="row" style="justify-content:flex-end;margin-top:.6rem"><button id="mNo">Cancel</button><button id="mYes" class="sel">OK</button></div>';
  c.querySelector('h2').textContent=title;const i=c.querySelector('#mIn');i.value=value||'';m.classList.remove('hidden');setTimeout(()=>{i.focus();i.select();},30);
  const done=()=>{const v=i.value.trim().slice(0,40);m.classList.add('hidden');if(v)fn(v);};c.querySelector('#mNo').onclick=()=>m.classList.add('hidden');c.querySelector('#mYes').onclick=done;i.onkeydown=e=>{if(e.key==='Enter')done();e.stopPropagation();};}
function buzz(p){if(ST.haptics&&navigator.vibrate)try{navigator.vibrate(p);}catch(e){}}
// ---- command log: every show-state mutation goes through CMD.run so it can be recorded, replayed and scored ----
const CMD={reg:{},rec:null,replaying:false,
  def(name,fn){this.reg[name]=fn;},
  run(name,args,o){const f=this.reg[name];if(!f){reportError('unknown cmd '+name,'cmd');return;}
    let r;try{r=f.apply(null,args||[]);}catch(e){reportError(e,'cmd:'+name);return;}
    const manual=!(o&&o.auto)&&!this.replaying;
    if(this.rec&&!this.replaying&&!(o&&o.norec)){const t=+songPos().toFixed(3),L=this.rec.log,last=L[L.length-1];
      // coalesce rapid slider drags of the same control (keeps replays small, still exact at 60ms)
      if(o&&o.coalesce&&last&&last[1]===name&&last[3]===o.coalesce&&t-last[0]<0.06){last[2]=args;}
      else L.push([t,name,args,o&&o.coalesce||0]);}
    Bus.emit('cmd',name,args,{manual,auto:!!(o&&o.auto)});
    return r;}};
