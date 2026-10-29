// v2.3 1v1 DUEL: two players, one phone, same show at the same time (split screen: portrait = face-to-face, landscape = side by side).
// Each player has their own pads, judge, combo, multiplier, FEVER and points; crowd requests go to whoever answers first.
// Async alternative: "Duel by link" = play the seeded show, send a link, your friend plays the same show and gets a head-to-head stats table.
const DUEL={P:[],names:['P1','P2'],track:'',el:null,keys:{},setup:null,last:null};
const DPADS=[['flash','⚡','Flash','hold'],['colors','🎨','Colours','tap'],['looks','💡','Looks','tap'],['laser','🟢','Lasers','tap'],['fx','🎊','Pyro','tap'],['drop','🚀','DROP!','tap']];
const DKEYS=[{KeyQ:'flash',KeyW:'colors',KeyE:'looks',KeyA:'laser',KeyS:'fx',KeyD:'drop',KeyF:'fever'},{KeyU:'flash',KeyI:'colors',KeyO:'looks',KeyJ:'laser',KeyK:'fx',KeyL:'drop',KeyH:'fever'}];
function duelP(name){return {name,pts:0,combo:0,best:0,perfect:0,great:0,drops:0,miss:0,req:0,mult:1,fever:0,feverOn:false,feverEnd:0,lastB:-99,dropPop:0,lostCombo:0};}
function duelFxKind(){for(const k of ['confetti','flames','co2','fireworks'])if((FXS.dev[k]||[]).length&&(k!=='fireworks'||G.env.outdoor))return k;return 'confetti';}
// ---- setup ----
function duelScreen(){const S=DUEL.setup=DUEL.setup||{n1:mpName()||'',n2:'',track:'',how:'local'};
  const trks=[['','🎲 Random real track']].concat(REAL_TRACKS.map(t=>[t.id,trackLabel(t)]));
  scr(`<h2>⚔️ 1v1 Duel</h2><p class="muted">Same song, same stage, same moment. Hit the beat, nail the drop, answer the crowd. Most points wins.</p>
  <div class="duelHow"><button class="${S.how==='local'?'sel':''}" data-u="duelHow" data-v="local"><i>📱</i><b>Same phone</b><span>Split screen, play at the same time</span></button>
   <button class="${S.how==='link'?'sel':''}" data-u="duelHow" data-v="link"><i>🔗</i><b>By link</b><span>Play now, send the same show to a friend</span></button></div>
  <div class="opts">${S.how==='local'?`<div class="pnames"><input id="dN1" maxlength="16" placeholder="Player 1" value="${esc(S.n1)}"><input id="dN2" maxlength="16" placeholder="Player 2" value="${esc(S.n2)}"></div>`:''}
   <label>Track <select id="dT">${opt(trks,S.track)}</select></label></div>
  <p class="muted" style="font-size:.8rem">${S.how==='local'?'Portrait: lay the phone flat between you, Player 2 sits opposite. Landscape: sit side by side. Keyboard: P1 Q W E / A S D, FEVER F · P2 U I O / J K L, FEVER H.':'You play a scored Normal show, then share a duel link. Your friend plays the exact same show and you both see a head-to-head table.'}</p>
  <div class="row" style="margin-top:.6rem">${backBtn()}<button class="sel big" data-u="duelGo">${S.how==='local'?'START DUEL ▶':'PLAY & SEND ▶'}</button></div>`,'duelScr');
  const sync=()=>{const a=$('dN1'),b=$('dN2');if(a)S.n1=a.value;if(b)S.n2=b.value;S.track=$('dT').value;};['dN1','dN2'].forEach(k=>{const e=$(k);if(e){e.oninput=sync;e.addEventListener('keydown',ev=>ev.stopPropagation());}});$('dT').onchange=sync;DUEL.sync=sync;}
UA_.duel=()=>duelScreen();
UA_.duelHow=v=>{DUEL.sync&&DUEL.sync();DUEL.setup.how=v==='link'?'link':'local';duelScreen();};
UA_.duelGo=()=>{DUEL.sync&&DUEL.sync();const S=DUEL.setup,track=S.track&&TMAP[S.track]?S.track:pick(REAL_TRACKS).id;preloadTrack(track);
  if(S.how==='link'){needName(()=>startMp({venue:4,track,seed:0,diff:'normal'},{kind:'solo',duel:true}),'Your name goes on the duel link.');return;}
  let a=cleanName(S.n1)||'Player 1',b=cleanName(S.n2)||'Player 2';if(a===b)b=b.slice(0,13)+' 2';duelStart([a,b],track,0);};
function duelStart(names,track,seed){const V=VENUES[4];DUEL.names=names;DUEL.track=track;DUEL.seed=seed||((globalThis.Math.random()*4294967295)>>>0)||1;
  warnThen(()=>startSession({mode:'show',venue:4,env:V.env,track,dj:null,style:'energetic',crowdSize:'massive',crowdN:Math.min(V.crowd,4000),auto:'assisted',short:true,scored:false,rig:V.rig,fx:V.fx,seed:DUEL.seed,duel:{names:names.slice()}}));}
function duelReset(){DUEL.P=[duelP(DUEL.names[0]),duelP(DUEL.names[1])];DUEL.fx=duelFxKind();duelBuild();}
Bus.on('session',S=>{const on=!!(S&&S.cfg.duel);document.body.classList.toggle('duel',on);if(on){DUEL.names=S.cfg.duel.names;duelReset();toast(`⚔️ ${DUEL.names[0]} vs ${DUEL.names[1]}: tap on the beat!`,2200);}else duelRemove();});
function duelRemove(){document.body.classList.remove('duel');if(DUEL.el){DUEL.el.remove();DUEL.el=null;}}
// ---- split-screen overlay ----
function duelPanel(i){const P=DUEL.P[i],fx=DUEL.fx;const ic={confetti:'🎊',flames:'🔥',co2:'💨',fireworks:'🎆'}[fx]||'🎊',nm=(FX_NAMES[fx]||'Pyro').split(' ')[0];
  return `<div class="dp dp${i+1}" data-p="${i}"><div class="dpHead"><b class="dpName">${esc(P.name)}</b><span class="dpPts">0</span><span class="dpMult">×1</span><span class="dpCombo"></span></div>
  <div class="dpPads">${DPADS.map(([id,i2,n])=>`<button class="dpad dpad-${id}" data-d="${id}"><i>${id==='fx'?ic:i2}</i><b>${id==='fx'?esc(nm):n}</b></button>`).join('')}</div>
  <button class="dpFever" data-d="fever"><b>FEVER 0%</b></button><div class="dpPop"></div></div>`;}
function duelBuild(){if(DUEL.el)DUEL.el.remove();const d=document.createElement('div');d.id='duel';
  d.innerHTML=`${duelPanel(1)}<div class="dMid"><div class="dTug"><i></i><span class="dT1"></span><span class="dT2"></span></div><div class="dInfo"><div class="dReq hidden"></div><div class="dCd"></div></div><button class="dPause" aria-label="Pause">⏸</button></div>${duelPanel(0)}`;
  document.body.appendChild(d);DUEL.el=d;
  d.querySelectorAll('.dp').forEach(pn=>{const i=+pn.dataset.p;pn.querySelectorAll('[data-d]').forEach(b=>{const id=b.dataset.d;let down=false;
    b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();down=true;b.classList.add('hit');duelPress(i,id,true);});
    const up=()=>{if(!down)return;down=false;b.classList.remove('hit');duelPress(i,id,false);};['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,up));});});
  d.querySelector('.dPause').addEventListener('click',e=>{e.stopPropagation();pauseScreen();});
  d.addEventListener('contextmenu',e=>e.preventDefault());duelHud();}
function duelPress(i,id,down){if(!SES||!SES.cfg.duel||SES.done)return;const P=DUEL.P[i];if(!P)return;
  if(id==='fever'){if(down)duelFever(i);return;}
  const act=id==='fx'?DUEL.fx:id;
  if(act==='flash'){simAct('flash',down);}else if(!down)return;else if(act==='laser')padAct('laser',true);else simAct(act,true);
  if(!down)return;buzz(10);if(!SEQ.playing)return;reqHit(act,i);duelJudge(i,act);}
function duelJudge(i,id){const P=DUEL.P[i],bp=beatPos(),rb=Math.round(bp);if(rb===P.lastB&&id!=='drop')return;P.lastB=rb; // anti-mash: one judged tap per beat
  const k=judgeCore(P,id);let g=0;if(k==='miss'){P.miss++;P.mult=1;if(P.lostCombo>=3)duelPop(i,'COMBO LOST','miss');}
  else{P.mult=funMult(P.combo);if(k==='drop'){P.drops++;CRW.boost=Math.min(1,CRW.boost+0.2);sfx('dropok');}else sfx(k,1);
    g=HYPE_PTS[k]*P.mult*(P.feverOn?2:1);P.pts+=g;if(!P.feverOn)duelFill(i,k==='drop'?0.25:k==='perfect'?0.035:0.015);
    duelPop(i,(k==='drop'?'PERFECT DROP!':k.toUpperCase())+(P.combo>=3?' ×'+P.combo:''),k);if(P.combo>0&&P.combo%10===0){crowdReact(0.4);sfx('combo');}}
  duelHud();return k;}
function duelFill(i,a){const P=DUEL.P[i],was=P.fever>=1;P.fever=Math.min(1,P.fever+a);if(!was&&P.fever>=1){duelPop(i,'FEVER READY!','combo');buzz([20,30,20]);}}
function duelFever(i){const P=DUEL.P[i];if(!P||P.feverOn||P.fever<1||!SEQ.playing)return false;P.feverOn=true;P.feverEnd=beatPos()+FEVER_BEATS;duelPop(i,'FEVER ×2!','drop');sfx('dropok');crowdReact(1);crowdCheer(0.7);CRW.boost=1;duelHud();return true;}
function duelReq(w){const P=DUEL.P[w];if(!P)return;const g=REQ_PTS*P.mult*(P.feverOn?2:1);P.pts+=g;P.req++;duelFill(w,0.2);duelPop(w,'REQUEST! +'+fmtPts(g),'combo');duelHud();}
function duelPop(i,txt,cls){const el=DUEL.el&&DUEL.el.querySelector(`.dp${i+1} .dpPop`);if(!el)return;el.textContent=txt;el.className='dpPop '+(cls||'');void el.offsetWidth;el.classList.add('go');}
function duelTick(){if(!DUEL.el||!SES||!SES.cfg.duel)return;const bp=beatPos();DUEL.P.forEach((P,i)=>{if(P.feverOn&&bp>=P.feverEnd){P.feverOn=false;P.fever=0;}});duelHud();}
function duelHud(){const d=DUEL.el;if(!d)return;const bp=SES?beatPos():0;
  DUEL.P.forEach((P,i)=>{const pn=d.querySelector('.dp'+(i+1));if(!pn)return;const set=(s,v)=>{const e=pn.querySelector(s);if(e&&e.textContent!==v)e.textContent=v;};
    set('.dpPts',fmtPts(P.pts));set('.dpMult','×'+P.mult);set('.dpCombo',P.combo>=2?'combo '+P.combo:'');
    const fb=pn.querySelector('.dpFever'),f=P.feverOn?Math.max(0,(P.feverEnd-bp)/FEVER_BEATS):P.fever;fb.style.setProperty('--f',(f*100).toFixed(0)+'%');fb.classList.toggle('ready',P.fever>=1&&!P.feverOn);fb.classList.toggle('on',P.feverOn);
    set('.dpFever b',P.feverOn?'FEVER ×2':P.fever>=1?'🔥 FEVER! TAP':'FEVER '+Math.floor(P.fever*100)+'%');pn.classList.toggle('fever',P.feverOn);pn.classList.toggle('lead',P.pts>DUEL.P[1-i].pts);});
  const a=DUEL.P[0].pts,b=DUEL.P[1].pts,sh=a+b?a/(a+b):0.5;d.querySelector('.dTug i').style.width=(sh*100).toFixed(1)+'%';
  const t1=d.querySelector('.dT1'),t2=d.querySelector('.dT2');if(t1.textContent!==DUEL.P[0].name)t1.textContent=DUEL.P[0].name;if(t2.textContent!==DUEL.P[1].name)t2.textContent=DUEL.P[1].name;
  const R=FUN.req,rq=d.querySelector('.dReq');if(R){const t=`🙋 ${REQS[R.k][0]} ${REQS[R.k][1]}${R.n>1?' '+Math.max(R.got[0],R.got[1])+'/'+R.n:''}`;if(rq.textContent!==t)rq.textContent=t;rq.classList.remove('hidden');rq.style.setProperty('--l',(Math.max(0,(R.until-bp)/16)*100).toFixed(0)+'%');}else rq.classList.add('hidden');
  const h=simHint(),cd=d.querySelector('.dCd');if(cd.textContent!==h.cd)cd.textContent=h.cd;cd.classList.toggle('num',/^\d$/.test(h.cd));
  const g=h.g||[];d.querySelectorAll('.dpad').forEach(btn=>{const id=btn.dataset.d==='fx'?DUEL.fx:btn.dataset.d;btn.classList.toggle('glow',g.includes(id)||(R&&R.k===id));});}
// ---- end: winner screen ----
function duelStars(P){const j=P.perfect+P.great+P.drops+P.miss;if(!j)return 1;const acc=(P.perfect+P.great*0.6+P.drops)/j*100;let s=funStars(acc);if(j<12)s=Math.min(s,2);return s;}
function duelFinish(){if(!SES||SES.done)return;SES.done=true;transportPause();fxStopAll();const [A,B]=DUEL.P;const res=DUEL.P.map(P=>Object.assign({},P,{stars:duelStars(P),acc:(()=>{const j=P.perfect+P.great+P.drops+P.miss;return j?Math.round((P.perfect+P.great+P.drops)/j*100):0;})()}));
  const w=A.pts===B.pts?-1:A.pts>B.pts?0:1;const F=SAVE.fun.stats;F.duels++;if(w===0){F.duelWins++;funAch('duelwin');}F.maxCombo=Math.max(F.maxCombo,A.best|0,B.best|0);dirty();persist(false);DUEL.last={res,w};
  sfx('cheer');crowdCheer(1);crowdReact(1);duelRemove();duelResults();}
function duelResults(){const {res,w}=DUEL.last,T=TMAP[DUEL.track];
  const rows=[['Points',P=>fmtPts(P.pts),P=>P.pts],['Stars',P=>starStr(P.stars),P=>P.stars],['Best combo',P=>P.best|0,P=>P.best|0],['Perfects',P=>P.perfect,P=>P.perfect],['Perfect drops',P=>P.drops,P=>P.drops],['Crowd requests',P=>P.req,P=>P.req],['Accuracy',P=>P.acc+'%',P=>P.acc]];
  scr(`<div class="hero"><div class="wIcon">${w<0?'🤝':'🏆'}</div><h1 style="margin:.2rem 0">${w<0?'Dead heat!':esc(res[w].name)+' wins!'}</h1><p class="muted">${esc(T?T.title:'')} · ${fmtPts(Math.abs(res[0].pts-res[1].pts))} points apart</p></div>
  <table class="h2hT duelT"><tr><th></th><th class="${w===0?'w':''}">${w===0?'👑 ':''}${esc(res[0].name)}</th><th class="${w===1?'w':''}">${w===1?'👑 ':''}${esc(res[1].name)}</th></tr>
  ${rows.map(([n,f,v])=>{const a=v(res[0]),b=v(res[1]);return `<tr><td>${n}</td><td class="${a>b?'w':''}">${f(res[0])}</td><td class="${b>a?'w':''}">${f(res[1])}</td></tr>`;}).join('')}</table>
  <div class="row" style="margin-top:.8rem"><button data-u="menu">Menu</button><button data-u="duelNew">New song</button><button class="sel big" data-u="duelRematch">Rematch ▶</button></div>`,'duelRes');}
UA_.duelRematch=()=>duelStart(DUEL.names,DUEL.track,DUEL.seed);
UA_.duelNew=()=>{const others=REAL_TRACKS.filter(t=>t.id!==DUEL.track);const t=pick(others).id;preloadTrack(t);duelStart(DUEL.names,t,0);};
const _restartS=UA_.restartS;UA_.restartS=()=>{if(SES&&SES.cfg.duel){FUN.req=null;FUN.nextReq=24;duelReset();}_restartS();};
function duelInit(){addEventListener('keydown',e=>{if(!SES||!SES.cfg.duel||UI.scr||e.repeat||e.metaKey||e.ctrlKey)return;for(let i=0;i<2;i++){const id=DKEYS[i][e.code];if(id){e.preventDefault();e.stopImmediatePropagation();DUEL.keys[e.code]=1;duelPress(i,id,true);return;}}},true);
  addEventListener('keyup',e=>{if(!DUEL.keys[e.code])return;delete DUEL.keys[e.code];e.stopImmediatePropagation();for(let i=0;i<2;i++){const id=DKEYS[i][e.code];if(id)duelPress(i,id,false);}},true);}
