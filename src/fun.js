// v2.3 "more fun" layer: combo multiplier + HYPE points, FEVER (player-triggered overdrive), timed crowd requests,
// 1-5 star ratings, Daily Festival with streaks, achievements, end-of-show highlights, extra juice (edge glow, sparks, haptics).
// Design notes: Guitar Hero Star Power (player chooses when to cash in), Fuser crowd requests, GMTK "juice", ethical daily missions (no FOMO, grace day).
const FUN={on:false,req_on:false,hype:0,mult:1,fever:0,feverOn:false,feverEnd:0,feverReady:false,req:null,nextReq:0,reqDone:0,reqMiss:0,hl:[],maxMult:1,feverN:0,perfDrops:0,newAch:[],rng:Math.random};
const HYPE_PTS={perfect:300,great:150,drop:1000},REQ_PTS=1500,FEVER_BEATS=32,MULT_STEP=8;
const funMult=c=>Math.min(4,1+Math.floor((c||0)/MULT_STEP));
const STAR_T=[40,55,70,82,92];
function funStars(pct){let n=0;STAR_T.forEach(t=>{if(pct>=t)n++;});return Math.max(1,n);}
const starStr=(n,max)=>'★'.repeat(n)+'☆'.repeat((max||5)-n);
// ---- achievements (each pays credits once) ----
const ACH=[['first','🎬','First show','Finish a scored show',100],['combo25','🔗','On the beat','Reach a 25 combo',150],['combo50','🎯','Metronome','Reach a 50 combo',300],
 ['mult4','✖️','Max multiplier','Reach the ×4 HYPE multiplier',150],['fever','🔥','FEVER!','Trigger FEVER mode',100],['pdrop','🚀','Perfect drop','Hit DROP! exactly on a drop',100],
 ['req3','🙋','Crowd pleaser','Fulfil 3 crowd requests in one show',150],['hype50k','📣','Hype machine','Score 50,000 HYPE in one show',200],['stars5','⭐','Headliner','Get 5 stars on a show',300],
 ['stars3x5','🌟','Setlist hero','Get 3+ stars on 5 different real tracks',250],['daily3','📅','Regular','Play the Daily Festival 3 days in a row',200],['duelwin','⚔️','Duel winner','Win a 1v1 Duel',150],
 ['crate','💿','Crate digger','Play all 10 real tracks in scored shows',250]];
const ACHMAP=Object.fromEntries(ACH.map(a=>[a[0],a]));
function funAch(id){const a=ACHMAP[id];if(!a||!SAVE||!SAVE.fun||SAVE.fun.ach[id])return false;SAVE.fun.ach[id]=1;SAVE.career.credits+=a[4];dirty();FUN.newAch.push(id);
  toast(`🏅 Achievement: ${a[1]} ${a[2]} (+${a[4]} credits)`,2600);sfx('cheer');return true;}
function achScreen(){const A=SAVE.fun.ach,n=ACH.filter(a=>A[a[0]]).length;
  scr(`<h2>🏅 Achievements <small class="muted">${n}/${ACH.length}</small></h2><p class="muted">Each one pays credits once. No timers, no pressure.</p>
  <div class="achList">${ACH.map(a=>`<div class="ach${A[a[0]]?' got':''}"><i>${A[a[0]]?a[1]:'🔒'}</i><div><b>${esc(a[2])}</b><span>${esc(a[3])}</span></div><em>${A[a[0]]?'✓':'+'+a[4]}</em></div>`).join('')}</div>
  <div class="row" style="margin-top:.8rem">${backBtn()}</div>`);}
UA_.ach=()=>achScreen();
// ---- session lifecycle ----
function funReset(S){Object.assign(FUN,{hype:0,mult:1,fever:0,feverOn:false,feverEnd:0,feverReady:false,req:null,nextReq:24,reqDone:0,reqMiss:0,hl:[],maxMult:1,feverN:0,perfDrops:0,newAch:[]});
  const ok=!!(S&&TR&&!TR.yt&&S.mode!=='tutorial');FUN.on=ok&&S.scored&&!S.cfg.duel;FUN.req_on=ok&&(S.scored||!!S.cfg.duel);FUN.rng=seeded(((S&&S.cfg.seed)||1)^0x9e3779b9);
  document.body.classList.remove('fever','m2','m3','m4');document.body.classList.toggle('funon',FUN.on);funHud(true);}
Bus.on('session',S=>funReset(S));
function setMultClass(m){const b=document.body.classList;['m2','m3','m4'].forEach(c=>b.toggle(c,c==='m'+m));}
function funHl(kind,txt,v){FUN.hl.push({t:songPos(),kind,txt,v:v||0});if(FUN.hl.length>40)FUN.hl.shift();}
function hitSpark(id,kind){const el=document.querySelector(`#spads [data-s="${id}"]`);if(!el||!el.offsetParent)return;const r=el.getBoundingClientRect(),s=document.createElement('div');
  s.className='spark '+kind;s.style.left=(r.left+r.width/2)+'px';s.style.top=(r.top+r.height/2)+'px';s.innerHTML='<i></i><i></i><i></i><i></i><i></i><i></i>';document.body.appendChild(s);setTimeout(()=>s.remove(),650);}
Bus.on('judge',(k,id,P)=>{if(!FUN.on)return;
  if(k==='miss'){if(FUN.mult>1){FUN.mult=1;setMultClass(1);}funHud();return;}
  const m=funMult(P.combo);if(m>FUN.mult){const x=$('multN');if(x){x.classList.remove('bump');void x.offsetWidth;x.classList.add('bump');}if(m===4)funHl('mult','Hit ×4 multiplier',4);}
  FUN.mult=m;FUN.maxMult=Math.max(FUN.maxMult,m);setMultClass(m);
  const gain=HYPE_PTS[k]*m*(FUN.feverOn?2:1);FUN.hype+=gain;hitSpark(id,k);
  if(!FUN.feverOn)funFill(k==='drop'?0.25:k==='perfect'?0.035:0.015);
  if(k==='drop'){FUN.perfDrops++;funHl('drop','PERFECT DROP',gain);funAch('pdrop');}
  if(P.combo&&P.combo%10===0)funHl('combo','Combo ×'+P.combo,P.combo);
  if(P.combo>=25)funAch('combo25');if(P.combo>=50)funAch('combo50');if(m>=4)funAch('mult4');if(FUN.hype>=50000)funAch('hype50k');funHud();});
function funFill(a){const was=FUN.fever>=1;FUN.fever=Math.min(1,FUN.fever+a);if(!was&&FUN.fever>=1&&!FUN.feverOn){FUN.feverReady=true;toast('🔥 FEVER ready! Tap FEVER (or B) to double your HYPE',2200);sfx('combo');buzz([20,30,20]);}}
function funFever(){if(!FUN.on||FUN.feverOn||FUN.fever<1||!SEQ.playing)return false;FUN.feverOn=true;FUN.feverReady=false;FUN.feverEnd=beatPos()+FEVER_BEATS;FUN.feverN++;
  document.body.classList.add('fever');pop('FEVER ×2!','drop');sfx('dropok');buzz([40,30,40,30,80]);crowdReact(1);crowdCheer(0.8);CRW.boost=1;ENG.e=Math.min(1,ENG.e+0.06);
  funHl('fever','FEVER for 8 bars');funAch('fever');funHud();return true;}
UA_.fever=()=>funFever();
// ---- crowd requests (Fuser-style): a timed ask from the crowd; fulfil it for bonus HYPE + cheer, miss it and the crowd dips a little ----
const REQS={colors:['🎨','New colours!',1],looks:['💡','New look!',1],flash:['⚡','Flash ×4!',4],laser:['🟢','Lasers!',1],strobe:['💥','Strobe!',1],confetti:['🎊','Confetti!',1],flames:['🔥','Flames!',1],led:['📺','New LED wall!',1]};
function reqPool(sec){const has=k=>(FXS.dev[k]||[]).length>0,lz=FIX.list.some(f=>f.type==='laser');let L;
  if(sec==='break')L=['colors','looks','led'];else if(sec==='build')L=['strobe','flash','colors'];else if(sec==='drop'||sec==='peak')L=['confetti','flames','flash','looks','laser'];else L=['colors','looks','laser','flash','led'];
  return L.filter(k=>(k!=='confetti'&&k!=='flames'||has(k))&&(k!=='laser'||lz));}
function reqSpawn(bp){const sec=curSecObj(),L=reqPool(sec?sec.t:'groove');if(!L.length)return;const k=L[(FUN.rng()*L.length)|0];
  FUN.req={k,n:REQS[k][2],got:[0,0],t0:bp,until:bp+16};sfx('ok');funHud(true);}
function reqHit(pad,who){const R=FUN.req;if(!FUN.req_on||!R||!SEQ.playing)return;const k=pad==='fireworks'||pad==='co2'?'confetti':pad;if(k!==R.k)return;const w=who|0;R.got[w]++;
  if(R.got[w]<R.n){funHud(true);return;}FUN.req=null;FUN.nextReq=beatPos()+24+((FUN.rng()*4)|0)*4;FUN.reqDone++;crowdReact(0.7);crowdCheer(0.6);sfx('combo');
  if(SES&&SES.cfg.duel){duelReq(w);}else{const g=REQ_PTS*FUN.mult*(FUN.feverOn?2:1);FUN.hype+=g;funFill(0.2);toast(`🙌 Request done! +${fmtPts(g)} HYPE`,1400);funHl('req','Crowd request: '+REQS[k][1],g);if(FUN.reqDone>=3)funAch('req3');}
  const b=$('req');if(b){b.classList.remove('miss');b.classList.add('done');}funHud(true);}
const CMD_PAD={pal:'colors',preset:'looks',led:'led',macro:'drop'};
Bus.on('cmd',(n,a,o)=>{if(!FUN.req||!o||!o.manual||(SES&&SES.cfg.duel))return;let p=CMD_PAD[n];if(n==='led'&&a&&a[0]!=='style')p=null;
  if(n==='fx')p=a&&a[0];else if((n==='flash'||n==='strobe'||n==='laser')&&a&&a[0])p=n;if(p)reqHit(p,0);});
// ---- per-frame (HUD rate) ----
function funTick(){if(!SES)return;const bp=beatPos();
  if(FUN.feverOn&&bp>=FUN.feverEnd){FUN.feverOn=false;FUN.fever=0;document.body.classList.remove('fever');toast('FEVER over: fill it again with PERFECTs',1500);}
  if(FUN.req_on&&SEQ.playing){if(FUN.req&&bp>=FUN.req.until){FUN.req=null;FUN.reqMiss++;FUN.nextReq=bp+20;ENG.e=Math.max(0,ENG.e-0.04);if(!(SES.cfg.duel))toast('😕 Missed the crowd request',1200);sfx('deny');const b=$('req');if(b)b.classList.add('miss');}
    else if(!FUN.req&&bp>=FUN.nextReq&&TR&&bp<TR.len*TR.bpm/60-24)reqSpawn(bp);}
  funHud();if(SES.cfg.duel&&typeof duelTick==='function')duelTick();}
function funHud(force){const box=$('hypeBox');if(!box)return;box.classList.toggle('hidden',!FUN.on);
  if(FUN.on){$('hypeN').textContent=fmtPts(FUN.hype);$('multN').textContent='×'+FUN.mult;const bp=SES?beatPos():0;
    const fb=$('bFever'),fill=FUN.feverOn?Math.max(0,(FUN.feverEnd-bp)/FEVER_BEATS):FUN.fever;fb.classList.remove('hidden');fb.style.setProperty('--f',(fill*100).toFixed(0)+'%');
    fb.classList.toggle('ready',FUN.fever>=1&&!FUN.feverOn);fb.classList.toggle('on',FUN.feverOn);const lb=FUN.feverOn?'FEVER ×2':FUN.fever>=1?'FEVER!':'FEVER '+Math.floor(FUN.fever*100)+'%';if(fb.dataset.l!==lb){fb.dataset.l=lb;fb.querySelector('b').textContent=lb;}}
  else{const fb=$('bFever');if(fb)fb.classList.add('hidden');}
  const rq=$('req');if(!rq)return;const R=FUN.req,show=FUN.req_on&&!!R&&!(SES&&SES.cfg.duel);
  if(show){const bp=beatPos(),left=Math.max(0,(R.until-bp)/16);const t=`🙋 Crowd wants: ${REQS[R.k][0]} ${REQS[R.k][1]}${R.n>1?' '+R.got[0]+'/'+R.n:''}`;
    if(rq.dataset.t!==t){rq.dataset.t=t;rq.innerHTML=`<span>${esc(t)}</span><i></i>`;rq.className='';}rq.querySelector('i').style.width=(left*100).toFixed(0)+'%';}
  else if(!rq.classList.contains('hidden')&&!(rq.classList.contains('done')||rq.classList.contains('miss'))){rq.classList.add('hidden');rq.dataset.t='';}
  else if((rq.classList.contains('done')||rq.classList.contains('miss'))&&!R){clearTimeout(FUN.rqT);FUN.rqT=setTimeout(()=>{if(!FUN.req){rq.className='hidden';rq.dataset.t='';}},900);}}
// ---- Daily Festival: one seeded show per day, same for everyone; streak with a 1-day grace ----
function dayKey(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function dayNum(k){const [y,m,d]=k.split('-').map(Number);return Date.UTC(y,m-1,d)/864e5;}
function dailyCfg(k){k=k||dayKey();const s=fnv32('fc-daily|'+k)||1;const V=[1,2,3,4,5,6];return {venue:V[(s>>>8)%V.length],track:REAL_TRACKS[s%REAL_TRACKS.length].id,seed:s,diff:'normal',day:k};}
function dailyScreen(){const c=dailyCfg(),D=SAVE.fun.daily,T=TMAP[c.track],V=VENUES[c.venue],best=D.best[c.day];preloadTrack(c.track);
  const alive=D.last&&dayNum(c.day)-dayNum(D.last)<=2;
  scr(`<div class="hero"><h1 style="margin:.2rem 0">📅 Daily Festival</h1><p class="muted">${esc(c.day)} · one show a day, the same for every player</p></div>
  <div class="dailyCard"><b>${esc(T.title)}</b><span>${esc(T.artist||'')} · ${esc(T.genre||'')}</span><span>${esc(V.name)} · Normal · 2 min</span></div>
  <div class="dailyStats"><div><b>🔥 ${alive?D.streak:0}</b><span>day streak</span></div><div><b>${best!=null?fmtPts(best):'–'}</b><span>today's best</span></div><div><b>${D.bestStreak}</b><span>best streak</span></div></div>
  <p class="muted" style="font-size:.8rem">Miss a day? Your streak survives one skipped day. Replays are free, and your best score counts.</p>
  <div class="row" style="margin-top:.6rem">${backBtn()}<button class="sel big" data-u="dailyGo">▶ PLAY TODAY'S SHOW</button></div>`);}
UA_.daily=()=>dailyScreen();
UA_.dailyGo=()=>{const c=dailyCfg();startMp({venue:c.venue,track:c.track,seed:c.seed,diff:'normal'},{kind:'solo',daily:c.day});};
function dailyRecord(day,pts,stars){const D=SAVE.fun.daily;if(day!==dayKey()){return null;}const first=D.last!==day;
  if(first){const gap=D.last?dayNum(day)-dayNum(D.last):99;D.streak=gap<=2?D.streak+1:1;D.last=day;D.played++;D.bestStreak=Math.max(D.bestStreak,D.streak);}
  const prev=D.best[day];D.best[day]=Math.max(prev||0,pts);if(D.streak>=3)funAch('daily3');FUN.daily={day,pts,stars,streak:D.streak,best:D.best[day],newBest:prev==null||pts>prev};return FUN.daily;}
function dailyText(){const d=FUN.daily;if(!d)return '';return `FESTIVAL CONTROL Daily ${d.day}\n${starStr(d.stars)} ${fmtPts(d.pts)} pts\n🔥 ${d.streak}-day streak\n${baseUrl()}`;}
UA_.dailyShare=()=>{const t=dailyText();if(!t)return;if(navigator.share){navigator.share({text:t}).then(()=>toast('Shared!')).catch(e=>{if(e&&e.name!=='AbortError')dailyCopy(t);});return;}dailyCopy(t);};
function dailyCopy(t){const fb=()=>{const b=$('shareBox');if(b)b.innerHTML=`<p class="muted">Copy and share:</p><textarea readonly rows="4" style="width:100%;font-size:.85rem" onclick="this.select()">${esc(t)}</textarea>`;};
  try{if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(t).then(()=>{toast('📋 Result copied',1800);fb();},fb);else fb();}catch(e){fb();}}
// ---- end of show: stars, HYPE, highlights, achievements, credits ----
function funFinish(R){if(!SES||!SES.scored||SES.cfg.duel)return [];const F=SAVE.fun,id=TR&&TR.id,L=[];FUN.newAch=FUN.newAch||[];
  R.hype=FUN.hype;R.stars=funStars(R.overall);const st={st:R.stars,bc:SIM.best|0,pf:SIM.perfect|0,gr:SIM.great|0,dr:FUN.perfDrops,rq:FUN.reqDone,hy:Math.min(9999999,FUN.hype|0),mx:FUN.maxMult};R.fx=st;
  const prevStars=F.stars[id]||0;if(id&&R.stars>prevStars)F.stars[id]=R.stars;
  if(id&&TMAP[id]&&TMAP[id].real)F.played[id]=(F.played[id]||0)+1;
  const S=F.stats;S.fever+=FUN.feverN;S.req+=FUN.reqDone;S.perfDrops+=FUN.perfDrops;S.maxCombo=Math.max(S.maxCombo,SIM.best|0);S.maxHype=Math.max(S.maxHype,FUN.hype|0);
  funAch('first');if(R.stars>=5)funAch('stars5');if(REAL_TRACKS.filter(t=>(F.stars[t.id]||0)>=3).length>=5)funAch('stars3x5');if(REAL_TRACKS.every(t=>F.played[t.id]))funAch('crate');
  const mp=SES.cfg.mp;if(mp&&mp.daily)R._daily=true;
  R._funHtml=`<div class="starsRow"><span class="stars s${R.stars}">${starStr(R.stars)}</span>${R.stars>prevStars&&prevStars?'<em>New best!</em>':''}</div>
  <div class="chips"><span>📣 <b>${fmtPts(FUN.hype)}</b> HYPE</span><span>🔗 Best combo <b>${SIM.best|0}</b></span><span>✖️ Max <b>×${FUN.maxMult}</b></span><span>🎯 <b>${SIM.perfect|0}</b> perfect · <b>${SIM.great|0}</b> great</span><span>🚀 Perfect drops <b>${FUN.perfDrops}</b></span><span>🙋 Requests <b>${FUN.reqDone}/${FUN.reqDone+FUN.reqMiss}</b></span>${FUN.feverN?`<span>🔥 FEVER ×<b>${FUN.feverN}</b></span>`:''}</div>
  ${funHlHtml()}`;
  return L;}
function funAfterRewards(R,rw){if(!R||!rw)return;const c=SAVE.career;let d='';
  if(R._daily){const r=dailyRecord(SES.cfg.mp.daily,showPoints(R),R.stars||1);if(r)d=`<div class="dailyRes"><b>📅 Daily Festival ${esc(r.day)}</b> · 🔥 ${r.streak}-day streak${r.newBest?' · new best today!':''}<div class="row"><button class="sel" data-u="dailyShare">📤 Share result</button></div></div>`;}
  const A=FUN.newAch.map(id=>ACHMAP[id]).filter(Boolean);if(A.length){rw.lines.splice(Math.max(0,rw.lines.length-1),0,...A.map(a=>`🏅 Achievement: ${a[1]} ${esc(a[2])} (+${a[4]})`));rw.lines[rw.lines.length-1]=`<b>Credits: ${c.credits}</b>`;}
  R._funHtml=(R._funHtml||'')+d;dirty();}
function funHlHtml(){const H=FUN.hl.slice();if(!H.length)return '';const pri={drop:5,fever:4,mult:3,req:2,combo:1};
  const top=H.sort((a,b)=>pri[b.kind]-pri[a.kind]||b.v-a.v).slice(0,5).sort((a,b)=>a.t-b.t);
  return `<div class="lbl">Highlights</div><div class="hls">${top.map(h=>`<div><span class="muted">${fmtT(h.t)}</span> ${{drop:'🚀',fever:'🔥',mult:'✖️',req:'🙋',combo:'🔗'}[h.kind]} ${esc(h.txt)}${h.v>100&&h.kind!=='combo'?` <b>+${fmtPts(h.v)}</b>`:''}</div>`).join('')}</div>`;}
function funInit(){if(!SAVE.fun)SAVE.fun=freshFun();if(SAVE.lastTrack&&!TMAP[SAVE.lastTrack])SAVE.lastTrack='bigroom';
  const fb=$('bFever');if(fb)fb.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(!funFever()&&FUN.fever<1)toast('Fill FEVER with PERFECT taps, drops and crowd requests',1600);});
  addEventListener('keydown',e=>{if(e.code==='KeyB'&&SES&&!SES.cfg.duel&&!UI.scr&&!/INPUT|SELECT|TEXTAREA/.test((e.target&&e.target.tagName)||'')){funFever();}});}
function dailyMenuTxt(){const D=SAVE.fun.daily,k=dayKey(),alive=D.last&&dayNum(k)-dayNum(D.last)<=2;return D.last===k?`Played today ✓ · 🔥 ${D.streak}-day streak`:alive&&D.streak?`🔥 ${D.streak}-day streak: keep it going`:'One new show every day';}
