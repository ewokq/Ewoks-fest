// Main: boot, sessions (career / show / free play / challenge / tutorial / My Song), frame loop, end-of-show analysis + rewards, adaptive quality, test hook
const SHOW_DEF=JSON.parse(JSON.stringify(SHOW));
const RUN={last:0,fpsA:60,low:0,high:0,replay:null,menuT:0,booted:false};
function sumRig(base,key,cap){const o=Object.assign({},base);SAVE.owned.forEach(id=>{const s=SHOPMAP[id];if(s&&s[key])for(const k in s[key])o[k]=(o[k]||0)+s[key][k];});if(cap)for(const k in o)o[k]=Math.min(o[k],cap[k]||0);return o;}
function careerRig(v){return sumRig(STARTER_RIG,'rig',v.rig);}
function careerFx(v){return sumRig(STARTER_FX,'fx',v.fx);}
function resetShowState(){const d=JSON.parse(JSON.stringify(SHOW_DEF));for(const k in d)SHOW[k]=d[k];SEL.ids=[];SEL.grp='';QUEUE.length=0;autoSecI=-1;_prevBP=0;_prevFB=0;
  FIX.list.forEach(f=>{f.ovr={};});FXS.armed=false;FXS.stats={fired:{},last:{}};fxStopAll();}
function crowdCount(cfg){if(cfg.crowdN)return cfg.crowdN;const c=CROWD_SIZES.find(x=>x[0]===cfg.crowdSize);return c?c[2]:2500;}
function buildWorld(cfg){const V=VENUES[cfg.venue]||VENUES[4];buildStage(V,cfg.env);const A=G.anch;buildRig(cfg.rig||V.rig,A);buildFXDevices(cfg.fx||V.fx,A);buildCrowd(crowdCount(cfg)*(STYLES.find(s=>s[0]===cfg.style)?1:1),A);return V;}
function startSession(cfg){try{initAudio();}catch(e){}hideScr();if(SES)endSession(true);
  if(!cfg.seed)cfg.seed=((globalThis.Math.random()*4294967295)>>>0)||1;rngSeed(cfg.seed);if(!cfg.diff&&cfg.scored)cfg.diff=cfgDiff(cfg);
  const V=VENUES[cfg.venue]||VENUES[4];
  if(cfg.track==='yt')loadYT();else loadTrack(cfg.track,{short:!!cfg.short});
  buildWorld(cfg);const dj=cfg.dj?DJMAP[cfg.dj]:(TR.dj&&TR.dj.id?TR.dj:{name:'YOU',col:'#ff2bd6',energy:0.9,id:'you'});buildDJ(dj,G.anch);
  SES={cfg,mode:cfg.mode,scored:!!cfg.scored,venue:V,env:G.env,djObj:dj,started:realNow(),done:false,lastReplay:null,style:cfg.style};
  resetShowState();AUTO.mode=cfg.auto||'manual';SHOW.haze=G.env.haze;const g=GMAP[TR.g&&TR.g.id||'bigroom']||GENRES[1];SHOW.pal=PALMAP[g.pal]?g.pal:'main';
  CMD.run('pal',[SHOW.pal,null],{auto:true,norec:true});CMD.run('preset',['blue'],{auto:true,norec:true});if(AUTO.mode==='assisted')autoSection(true);
  setAmbience(G.env);scoreReset(SES.scored);ENG.e=0.35;CMD.rec=SES.scored?{track:TR.id,start:0,log:[]}:null;RUN.replay=null;
  camSet('foh',true);conOpen(false);$('panel').classList.remove('full');CON.progCue=null;CON.tab='lights';$('hud').classList.remove('hidden');document.body.classList.add('insession');
  TUT.on=cfg.mode==='tutorial';TUT.i=0;tutShow();if(cfg.mode==='tutorial')ST.beginner=ST.beginner;
  transportPlay();toast((SES.scored?'Show: ':'')+TR.title+(TR.artist?' – '+TR.artist:'')+' @ '+V.name,1800);
  setTimeout(()=>{if(!SES||!TR)return;const k=VENUES.findIndex(v=>v===V),nv=VENUES[k+1];preloadTrack(nv&&nv.track||'');},5000);Bus.emit('session',SES);}
function endSession(quiet){transportStop();if(TR&&TR.yt){ytPause();abStop();}fxStopAll();FXS.armed=false;CMD.rec=null;RUN.replay=null;SES=null;
  $('hud').classList.add('hidden');conOpen(false);TUT.on=false;tutShow();setHelpMode(false);document.body.classList.remove('insession','clean');if(!quiet)menuScene();}
function restartSong(){if(!SES)return;RUN.replay=null;if(SES.scored){scoreReset(true);CMD.rec={track:TR.id,start:0,log:[]};}fxStopAll();if(AUTO.mode==='assisted')autoSecI=-1;transportSeek(0);transportPlay();toast('Restarted');}
function startReplay(){const R=SES&&SES.lastReplay;if(!R||!R.log.length){toast('Nothing recorded yet: tap ⏺ to record');return;}if(CMD.rec)toggleRec();
  resetShowState();CMD.run('preset',['blue'],{auto:true,norec:true});RUN.replay={log:R.log,i:0};transportSeek(R.start||0);transportPlay();conOpen(false);toast('Replaying '+R.log.length+' recorded actions',2000);}
function replayTick(){const R=RUN.replay;if(!R)return;const t=songPos();CMD.replaying=true;try{while(R.i<R.log.length&&R.log[R.i][0]<=t){const e=R.log[R.i++];CMD.run(e[1],e[2]);}}finally{CMD.replaying=false;}if(R.i>=R.log.length){RUN.replay=null;toast('Replay finished');}}
function finishShow(natural){if(!SES||SES.done)return;if(!SES.scored){if(natural){toast('Song finished: press ▶ to play again, or End session in the SHOW tab',3500);SEQ.ended=false;transportPause();transportSeek(0);return;}menuScreen();return;}
  SES.done=true;transportPause();if(CMD.rec&&CMD.rec.log.length){SES.lastReplay=CMD.rec;}CMD.rec=null;if(FXS.armed)FXS.armed=false;let R;try{R=computeScore();}catch(e){reportError(e,'score');R={cats:{},overall:0,metrics:{},tips:[],samples:[],drops:[],accents:0};CATS.forEach(c=>R.cats[c[0]]=0);}
  const rw=applyRewards(R);persist(false);sfx(R.overall>=60?'cheer':'ok');crowdCheer(R.overall/100);analysisScreen(R,rw);Bus.emit('analysis',R);}
function applyRewards(R){const c=SAVE.career,L=[],M=R.metrics;let cr=0;c.shows++;c.xp+=R.overall;
  if(SES.mode==='career'){const i=SES.cfg.venue,v=VENUES[i];cr+=Math.round(v.reward*R.overall/100);L.push(`Venue reward: +${cr} credits (${v.reward} × ${R.overall}%)`);
    v.missions.forEach(m=>{const k=v.id+':'+m.id,ok=(M[m.k]||0)>=m.v;if(ok&&!c.missions[k]){c.missions[k]=1;cr+=100;L.push(`✅ Mission complete: ${esc(m.txt)} (+100)`);}else L.push(`${ok||c.missions[k]?'✅':'⬜'} ${esc(m.txt)}`);});
    const prev=c.best[v.id];if(prev==null||R.overall>prev){c.best[v.id]=R.overall;if(prev!=null)L.push('New best at '+esc(v.name)+'!');}
    if(R.overall>=v.req){c.rep+=1;if(c.venue===i&&i<VENUES.length-1){c.venue=i+1;L.push(`🔓 <b>Unlocked: ${esc(VENUES[i+1].name)}</b>`);}}else L.push(`Score ${v.req}+ here to unlock the next venue.`);}
  else if(SES.mode==='challenge'){const ch=SES.cfg.challenge,ok=ch.checks.every(([k,v])=>(M[k]||0)>=v);ch.checks.forEach(([k,v])=>L.push(`${(M[k]||0)>=v?'✅':'❌'} ${esc(k)}: ${M[k]==null?0:M[k]} / ${v}`));
    if(ok){if(!c.challenges[ch.id]){cr+=300;L.push('🏆 Challenge complete! +300 credits');}else L.push('🏆 Challenge complete (again)');c.challenges[ch.id]=Math.max(c.challenges[ch.id]||0,R.overall);}else L.push('Challenge not completed yet.');}
  else{cr+=Math.round(R.overall*1.5);L.push(`Show reward: +${cr} credits`);}
  c.credits+=cr;L.push(`<b>Credits: ${c.credits}</b>`);return {credits:cr,lines:L};}
// ---------- idle menu scene ----------
function menuScene(){if(!TR||TR.yt)loadTrack('bigroom',{});buildWorld({venue:4,env:'night',crowdN:1800});buildDJ(DJS[0],G.anch);resetShowState();AUTO.mode='manual';SHOW.haze=0.5;CMD.run('preset',['cyantunnel'],{auto:true,norec:true});CMD.run('led',['style','geo'],{auto:true,norec:true});CAM.mode='stage';camSet('stage',true);}
// ---------- frame loop ----------
function frame(tms){requestAnimationFrame(frame);const t=tms/1000;if(ST.fpsCap&&RUN.last&&t-RUN.last<1/ST.fpsCap-0.002)return;const dt=Math.min(0.1,RUN.last?t-RUN.last:0.016);RUN.last=t;
  try{tickAll(dt);}catch(e){reportError(e,'frame');}
  RUN.fpsA=lerp(RUN.fpsA,1/Math.max(dt,1e-3),0.05);G.fps=RUN.fpsA;
  if(ST.quality==='auto'&&!ST.perfMode){if(RUN.fpsA<40){RUN.low+=dt;RUN.high=0;if(RUN.low>2&&G.quality>0.5){G.quality=Math.max(0.5,G.quality-0.1);applyDpr();RUN.low=0;}}else if(RUN.fpsA>57){RUN.high+=dt;RUN.low=0;if(RUN.high>5&&G.quality<1){G.quality=Math.min(1,G.quality+0.1);applyDpr();RUN.high=0;}}else{RUN.low=0;RUN.high=0;}}}
function tickAll(dt){const playing=SEQ.playing;if(SES){songPos();pumpEvents();gridEvents();analyse(dt);if(TR&&TR.yt){abApply();abTick&&abTick();}replayTick();}
  if(!SES){SHOW.fb+=dt*2;}else showTick(dt);
  const bp=SES?beatPos():SHOW.fb,sec=SES?curSec():'groove',en=SES&&TR?energyAt(bp/4):0.6;
  fixTick(dt,SES?fixCtx():{bp:SHOW.fb,master:1,bo:1,flash:0,flashSet:null,strobeHold:false,strobeSet:null,grp:null});emitTick(dt);
  ledTick(dt,SHOW.led,curPalette(),bp,SES?AN.kick:0.4*Math.max(0,1-(bp%1)*4),en,SHOW.blackout);
  if(SES){engTick(dt);crowdLevel(ENG.e,dt);}
  crowdTick(dt,{beat:bp,e:SES?ENG.e:0.55,energy:en,sec,playing:SES?playing:true,flash:SHOW.flash,strobeOn:SHOW.strobeHold});
  if(SES)crowdAudioTick(dt,{e:ENG.e,sec,playing,size:clamp(CRW.n/6000,0,1)});
  djTick(dt,{beat:bp,sec,playing:SES?playing:true,energy:en,dj:SES?SES.djObj:DJS[0],moves:owns('dj_moves')||(SES&&SES.mode!=='career')});
  camTick(dt,{beat:bp});
  if(SES){hudTick(dt);padsTick();tlDraw();if(CON.needs&&!CON.dragging)renderPanel();gamepadTick();if(SEQ.ended&&!SES.done)finishShow(true);}
  else if(!UI.scr)menuScreen();
  sceneTick(dt);renderFrame();}
// ---------- boot ----------
function boot(){try{initScene();}catch(e){scr(`<h2>Can't start 3D</h2><p>${esc(e.message)}</p><p class="muted">Try another browser, or enable hardware acceleration.</p>`);return;}
  try{initFX();camInput();uiInit();menuScene();}catch(e){reportError(e,'boot');}
  // first touch anywhere unlocks audio on iOS
  const un=()=>{try{initAudio();if(A.ctx&&A.ctx.state==='suspended')A.ctx.resume();}catch(e){}};addEventListener('pointerdown',un,{capture:true});addEventListener('keydown',un,{capture:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&SES&&SEQ.playing&&!TR.yt&&!UI.scr)pauseScreen();});
  try{mpInit();}catch(e){reportError(e,'mp');}
  if(!chalFromHash()){if(!SAVE.welcomed&&!SAVE.tutorialDone&&!SAVE.career.shows)welcomeScreen();else menuScreen();}RUN.booted=true;requestAnimationFrame(frame);
  window.__fc={rand:()=>Math.random(),MP,chalEncode,chalDecode,chalUrl,chalFromHash,showPoints,lbRecord,mpName,rngSeed,fnv32,FILE,REAL_TRACKS,songPos,transportSeek,transportPlay,loadTrack,preloadTrack,transportPause,SIM,setUiMode,simTick,simHint,simAct,TUT,welcomeScreen,UA_,nextMarker,curSecObj,beatPos,SHOW,CMD,FIX,FXS,SCORE:()=>SCORE,ENG,SEQ,SAVE:()=>SAVE,ST,TR:()=>TR,SES:()=>SES,CRW,DJ,CAM,AN,A,G,CON,UI,LEDRT,AUTO,SEL,YT,computeScore,startSession,finishShow,menuScreen,careerRig,careerFx,transportSeek,songPos,beatPos,ERRORS,persist,UA:UA_,CA,padAct,conOpen,renderPanel,camSet,keyAct,TUT,VERSION,Bus,curSec,liveScore,TRACKS,SHOP,VENUES,secAt,musBar,Store};}
boot();
