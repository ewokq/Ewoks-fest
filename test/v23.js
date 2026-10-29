// v2.3: HYPE multiplier, FEVER, crowd requests, stars, achievements, Daily Festival + streak, save migration v1->v2,
// 1v1 Duel split screen (touch + keyboard, both orientations, winner screen, rematch), async duel link (head-to-head stats). Screenshots shot-v23-*.png
const {launch,page}=require('./lib');const VPN=process.argv[2]||'portrait';const SO='/workspace/festival/shot-v23-'+VPN+'-';
const URL=process.env.FC_URL||'http://127.0.0.1:18432/index.html';
const R={fails:[]};const log=(k,v)=>{R[k]=v;console.log(k,JSON.stringify(v));};const ok=(k,c)=>{if(!c){R.fails.push(k);console.log('  FAIL',k);}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
async function layout(p,name,sel){const r=await p.evaluate(sel=>{const vw=innerWidth,vh=innerHeight;const root=sel?document.querySelector(sel):document;
  const btn=[...(root||document).querySelectorAll('button,input,select')].filter(e=>e.offsetParent||getComputedStyle(e).position==='fixed');
  const over=btn.filter(e=>{const b=e.getBoundingClientRect();return b.width&&(b.right>vw+1||b.left<-1||(sel==='#duel'||sel==='#bottom')&&(b.bottom>vh+1||b.top<-1));}).map(e=>e.textContent.trim().slice(0,20)||e.id);
  const small=btn.filter(e=>{const b=e.getBoundingClientRect();return b.width&&e.closest('#screen,#duel,#bottom')&&Math.min(b.height,b.width)<43.5&&e.type!=='checkbox'&&e.type!=='range';}).map(e=>e.textContent.trim().slice(0,20)||e.className);
  return {sw:document.documentElement.scrollWidth,vw,over,small};},sel);log('layout_'+name,r);ok('layout_'+name,r.sw<=r.vw+1&&!r.over.length&&!r.small.length);await p.screenshot({path:SO+name+'.png'});return r;}
const onBeat=`(async()=>{const f=__fc;for(let i=0;i<400;i++){const b=f.beatPos(),o=b-Math.round(b);if(Math.abs(o)<0.05)return true;await new Promise(r=>setTimeout(r,8));}return false;})()`;
(async()=>{const b=await launch();let {p,errs}=await page(b,VPN,URL);
 await p.evaluate(()=>{localStorage.clear();});await p.reload();await W(1800);
 // 0) version + migration of a v2.2 (v1) save
 const keys=await p.evaluate(()=>{__fc.persist(false);return Object.keys(localStorage);});const SK=keys.find(k=>/save$/.test(k));
 await p.evaluate(SK=>{const s=JSON.parse(localStorage.getItem(SK));delete s.fun;s.v=1;s.career.credits=1234;s.lastTrack='r_mouse';s.mp.lb={'r_mind@0':[['Old',5000,'normal',1,'r_mind',0]]};localStorage.setItem(SK,JSON.stringify(s));},SK);
 await p.reload();await W(1800);
 const mig=await p.evaluate(()=>{const f=__fc,s=f.SAVE();return {ver:f.VERSION,sv:f.SAVE_VERSION,v:s.v,fun:!!s.fun&&!!s.fun.daily&&!!s.fun.stats,credits:s.career.credits,last:s.lastTrack,menuHas:[...document.querySelectorAll('#scard [data-u]')].map(e=>e.dataset.u)};});
 log('migration',mig);ok('version',mig.ver==='v2.3');ok('migration',mig.v===2&&mig.fun&&mig.credits===1234&&mig.last==='bigroom');
 const corrupt=await p.evaluate(()=>{const s=__fc.sanitizeSave({v:2,fun:{stars:{r_x:'9e99'},ach:'bad',daily:{last:'<x>',streak:-5,best:{'2026-01-01':1e9}},stats:null}});return s.fun;});
 log('sanitize',corrupt);ok('sanitize',corrupt.stars.r_x<=1e7&&typeof corrupt.ach==='object'&&corrupt.daily.last===''&&corrupt.daily.streak===0&&corrupt.daily.best['2026-01-01']===99999&&corrupt.stats.duels===0);
 const mb=await p.evaluate(()=>{const s=__fc.SAVE();s.seenWarn=true;s.welcomed=true;s.mp.name='Neo';__fc.menuScreen();return [...document.querySelectorAll('#scard [data-u]')].map(e=>e.dataset.u);});
 log('menuButtons',mb);ok('menuButtons',['daily','duel','ach'].every(k=>mb.includes(k)));
 await layout(p,'menu','#scard');
 // 1) solo scored show: HYPE, multiplier, FEVER, crowd request, stars, achievements
 await p.evaluate(()=>{__fc.UA.dailyGo&&0;const f=__fc;f.startSession({mode:'show',venue:4,env:'night',track:'r_party',dj:null,style:'energetic',crowdSize:null,crowdN:2000,auto:'manual',short:true,scored:true,seed:777,diff:'normal',mp:{kind:'solo'}});});
 await W(2500);
 const fun1=await p.evaluate(async()=>{const f=__fc,F=f.FUN,W=ms=>new Promise(r=>setTimeout(r,ms));const o={on:F.on,req_on:F.req_on,hud:!document.getElementById('hypeBox').classList.contains('hidden')};
  f.SIM.combo=16;f.Bus.emit('judge','perfect','flash',f.SIM);o.mult=F.mult;o.hype=F.hype;o.body=document.body.className;
  F.fever=0.99;f.Bus.emit('judge','drop','drop',f.SIM);o.feverReady=F.fever>=1;o.feverBtn=document.getElementById('bFever').className;
  const h0=F.hype;o.fever=f.funFever();o.feverOn=F.feverOn&&document.body.classList.contains('fever');f.Bus.emit('judge','perfect','flash',f.SIM);o.feverGain=F.hype-h0;
  const bp=f.beatPos();F.req={k:'colors',n:1,got:[0,0],t0:bp,until:bp+16};F.nextReq=bp+99;for(let i=0;i<30&&document.getElementById('req').classList.contains('hidden');i++)await W(100);o.reqShown=!document.getElementById('req').classList.contains('hidden');o.reqText=document.getElementById('req').textContent;
  const h1=F.hype;f.simAct('colors',true);o.reqDone=F.reqDone;o.reqGain=F.hype-h1;
  f.Bus.emit('judge','miss','flash',Object.assign({},f.SIM,{combo:0}));o.multAfterMiss=F.mult;
  F.req={k:'laser',n:1,got:[0,0],t0:f.beatPos()-20,until:f.beatPos()-0.1};const e0=f.ENG.e;await W(400);o.reqMissed=F.reqMiss===1&&!F.req;o.ach=Object.keys(f.SAVE().fun.ach);return o;});
 log('fun',fun1);ok('fun_on',fun1.on&&fun1.req_on&&fun1.hud);ok('mult',fun1.mult===3&&fun1.hype===900&&/m3/.test(fun1.body));ok('fever',fun1.feverReady&&/ready/.test(fun1.feverBtn)&&fun1.fever&&fun1.feverOn);
 ok('feverDouble',fun1.feverGain===300*3*2);ok('request',fun1.reqShown&&fun1.reqDone===1&&fun1.reqGain===1500*3*2&&/colours/i.test(fun1.reqText));ok('missResetsMult',fun1.multAfterMiss===1);ok('reqMiss',fun1.reqMissed);
 ok('achInShow',['pdrop','fever','mult4'].filter(a=>fun1.ach.includes(a)).length>=2);
 await p.evaluate(()=>{const F=__fc.FUN,bp=__fc.beatPos();F.req={k:'confetti',n:1,got:[0,0],t0:bp,until:bp+16};F.fever=1;F.feverOn=false;F.mult=3;});await W(400);
 await layout(p,'hud','#bottom');
 // finish -> analysis with stars + HYPE + highlights; points include HYPE bonus
 const an=await p.evaluate(async()=>{const f=__fc;f.finishShow(false);await new Promise(r=>setTimeout(r,600));const s=f.SAVE(),c=document.getElementById('scard');
  return {stars:!!c.querySelector('.starsRow .stars'),chips:c.querySelectorAll('.chips span').length,hl:!!c.querySelector('.hls'),hasAchLine:/Achievement/.test(c.textContent),first:!!s.fun.ach.first,
   starSaved:s.fun.stars.r_party>=1,played:s.fun.played.r_party,stats:s.fun.stats,ptsBonus:f.showPoints({overall:50,cats:{},metrics:{},accents:0,hype:40000})-f.showPoints({overall:50,cats:{},metrics:{},accents:0})};});
 log('analysis',an);ok('analysis',an.stars&&an.chips>=5&&an.hl&&an.hasAchLine&&an.first&&an.starSaved&&an.played===1&&an.ptsBonus===2000);
 await layout(p,'analysis','#scard');
 // 2) stars thresholds
 const st=await p.evaluate(()=>[0,39,40,55,70,82,92,100].map(__fc.funStars));log('stars',st);ok('stars',JSON.stringify(st)==='[1,1,1,2,3,4,5,5]');
 // 3) Daily Festival: deterministic cfg, streak with 1 grace day, play + result + share text
 const dl=await p.evaluate(()=>{const f=__fc,k=f.dayKey(),a=f.dailyCfg(k),b2=f.dailyCfg(k),c=f.dailyCfg('2030-01-02');const D=f.SAVE().fun.daily;
  const d=new Date();d.setDate(d.getDate()-2);D.last=f.dayKey(d);D.streak=2;f.dailyRecord(k,5000,3);const s1=D.streak,a3=!!f.SAVE().fun.ach.daily3;
  D.last='2020-01-01';D.streak=7;D.best={};f.dailyRecord(k,4000,2);const s2=D.streak,best=D.best[k];f.dailyRecord(k,6000,3);const s3=D.streak,best2=D.best[k];
  return {same:JSON.stringify(a)===JSON.stringify(b2),diff:JSON.stringify(a)!==JSON.stringify(c),trackOk:!!f.TRACKS.find(t=>t.id===a.track),s1,a3,s2,best,s3,best2,bestStreak:D.bestStreak};});
 log('daily',dl);ok('daily',dl.same&&dl.diff&&dl.trackOk&&dl.s1===3&&dl.a3&&dl.s2===1&&dl.best===4000&&dl.s3===1&&dl.best2===6000&&dl.bestStreak>=3);
 await p.evaluate(()=>__fc.UA.daily());await W(300);await layout(p,'daily','#scard');
 const dplay=await p.evaluate(async()=>{const f=__fc;f.UA.dailyGo();await new Promise(r=>setTimeout(r,2500));const S=f.SES();const o={daily:S&&S.cfg.mp&&S.cfg.mp.daily,seed:S&&S.cfg.seed,track:S&&S.cfg.track};
  f.finishShow(false);await new Promise(r=>setTimeout(r,500));o.res=!!document.querySelector('#scard .dailyRes');o.share=!!document.querySelector('#scard [data-u="dailyShare"]');return o;});
 log('dailyPlay',dplay);ok('dailyPlay',!!dplay.daily&&dplay.res&&dplay.share);
 const sh=await p.evaluate(async()=>{let got=null;navigator.share=o=>{got=o;return Promise.resolve();};__fc.UA.dailyShare();await new Promise(r=>setTimeout(r,100));return got&&got.text;});log('dailyShare',sh);ok('dailyShare',/Daily/.test(sh||'')&&/streak/.test(sh||''));
 // 4) achievements screen
 await p.evaluate(()=>__fc.UA.ach());await W(300);const ach=await p.evaluate(()=>({n:document.querySelectorAll('.ach').length,got:document.querySelectorAll('.ach.got').length}));log('achScreen',ach);ok('achScreen',ach.n===13&&ach.got>=4);
 await layout(p,'achievements','#scard');
 // 5) links: stats + duel flag round trip; v2.2 links still decode
 const lk=await p.evaluate(()=>{const f=__fc,x={st:4,bc:33,pf:20,gr:5,dr:2,rq:3,hy:45000};const L=f.chalEncode({venue:4,track:'r_hero',seed:99,diff:'normal',name:'Ann',score:7000,chain:[],x,duel:true});const d=f.chalDecode(L);
  const old=f.chalEncode({venue:4,track:'r_hero',seed:99,diff:'normal',name:'Ann',score:7000,chain:[]}),od=f.chalDecode(old);return {x:d.x,duel:d.duel,oldX:od.x,oldDuel:od.duel,bad:f.unpackX([1,2,'x',4,5,6,7]),L};});
 log('links',lk);ok('links',lk.x&&lk.x.bc===33&&lk.x.hy===45000&&lk.duel===true&&lk.oldX===null&&lk.oldDuel===false&&lk.bad===null);
 // async duel by link: accept -> play -> head-to-head stats table
 await p.evaluate(L=>{location.hash='c='+L;},lk.L);await W(1200);
 const h2=await p.evaluate(async()=>{const f=__fc,t=document.querySelector('#scard h1').textContent;f.UA.chalGo();await new Promise(r=>setTimeout(r,2500));f.SIM.combo=10;f.Bus.emit('judge','perfect','flash',f.SIM);
  f.finishShow(false);await new Promise(r=>setTimeout(r,500));const c=document.getElementById('scard');return {title:t,table:!!c.querySelector('.h2hT'),rows:c.querySelectorAll('.h2hT tr').length,share:(c.querySelector('[data-u="mpShare"]')||{}).textContent,link:f.chalDecode(f.MP.lastLink.split('#c=')[1])};});
 log('asyncDuel',{title:h2.title,table:h2.table,rows:h2.rows,share:h2.share,linkDuel:h2.link&&h2.link.duel,linkX:h2.link&&h2.link.x});ok('asyncDuel',/Duel/.test(h2.title)&&h2.table&&h2.rows===7&&h2.link&&h2.link.duel&&!!h2.link.x);
 await layout(p,'duel-link-result','#scard');
 // 6) duel setup screen
 await p.evaluate(()=>__fc.UA.duel());await W(300);await layout(p,'duel-setup','#scard');
 // 7) same-phone split-screen duel
 await p.evaluate(()=>{const n1=document.getElementById('dN1'),n2=document.getElementById('dN2');n1.value='Ann';n2.value='Bob';n1.dispatchEvent(new Event('input'));const s=document.getElementById('dT');s.value='r_party';s.dispatchEvent(new Event('change'));__fc.UA.duelGo();});
 await W(3000);
 const d0=await p.evaluate(()=>{const f=__fc,d=document.getElementById('duel'),S=f.SES();const tf=getComputedStyle(d.querySelector('.dp2')).transform;
  return {el:!!d,body:document.body.classList.contains('duel'),topbar:getComputedStyle(document.getElementById('topbar')).display,pads:d.querySelectorAll('.dpad').length,scored:S.scored,duel:!!S.cfg.duel,names:f.DUEL.P.map(x=>x.name),rot:tf,playing:f.SEQ.playing,fun:f.FUN.on,req:f.FUN.req_on};});
 log('duelStart',d0);ok('duelStart',d0.el&&d0.body&&d0.topbar==='none'&&d0.pads===12&&!d0.scored&&d0.duel&&d0.names.join()==='Ann,Bob'&&d0.playing&&!d0.fun&&d0.req);
 if(VPN==='portrait')ok('p2Rotated',/matrix\(-1/.test(d0.rot));
 // touch taps (real pointer events) on P1 pads, on the beat
 const t1=[];for(let i=0;i<5;i++){await p.evaluate(onBeat);await p.tap('.dp1 .dpad-colors');await W(220);}
 for(let i=0;i<2;i++){await p.evaluate(onBeat);await p.keyboard.down('KeyU');await W(60);await p.keyboard.up('KeyU');await W(250);}
 const d1=await p.evaluate(()=>{const P=__fc.DUEL.P;return P.map(x=>({pts:x.pts,combo:x.combo,perfect:x.perfect,great:x.great,miss:x.miss}));});
 log('duelTaps',d1);ok('duelTaps',d1[0].pts>0&&d1[0].perfect+d1[0].great+d1[0].miss>=4&&d1[1].perfect+d1[1].great+d1[1].miss>=1);
 // timing accuracy without input latency of the software-rendered test browser: press exactly on the beat
 const acc=await p.evaluate(async()=>{const f=__fc,P=f.DUEL.P[0];let hits=0;for(let i=0;i<3;i++){for(let j=0;j<400;j++){const b=f.beatPos(),o=b-Math.round(b);if(Math.abs(o)<0.04&&Math.round(b)!==P.lastB)break;await new Promise(r=>setTimeout(r,5));}
   const n=P.perfect+P.great;f.duelPress(0,'looks',true);if(P.perfect+P.great>n)hits++;}return hits;});log('duelOnBeat',acc);ok('duelOnBeat',acc>=2);
 // anti-mash: many taps in one beat count once
 const mash=await p.evaluate(()=>{const f=__fc,P=f.DUEL.P[1],n0=P.perfect+P.great+P.miss;for(let i=0;i<8;i++)f.duelPress(1,'looks',true);return P.perfect+P.great+P.miss-n0;});log('antiMash',mash);ok('antiMash',mash<=1);
 // shared crowd request goes to the first player who answers
 const rq=await p.evaluate(async()=>{const f=__fc,bp=f.beatPos();f.FUN.req={k:'looks',n:1,got:[0,0],t0:bp,until:bp+16};f.FUN.nextReq=bp+99;await new Promise(r=>setTimeout(r,300));const shown=!document.querySelector('#duel .dReq').classList.contains('hidden');
  const p0=f.DUEL.P[0].pts,r0=f.DUEL.P[0].req;f.duelPress(0,'looks',true);return {shown,req:f.DUEL.P[0].req-r0,gain:f.DUEL.P[0].pts-p0>=1500,cleared:!f.FUN.req};});
 log('duelReq',rq);ok('duelReq',rq.shown&&rq.req===1&&rq.gain&&rq.cleared);
 const fv=await p.evaluate(()=>{const f=__fc,P=f.DUEL.P[1];P.fever=1;f.duelHud();const ready=document.querySelector('.dp2 .dpFever').classList.contains('ready');const ok=f.duelPress(1,'fever',true);return {ready,on:P.feverOn};});
 log('duelFever',fv);ok('duelFever',fv.ready&&fv.on);
 await p.evaluate(()=>{const f=__fc,bp=f.beatPos();f.FUN.req={k:'flash',n:4,got:[1,2],t0:bp,until:bp+16};f.DUEL.P[0].combo=12;f.DUEL.P[0].mult=2;f.duelHud();});await W(300);
 await layout(p,'duel','#duel');
 // finish -> winner screen + stats, rematch
 const fin=await p.evaluate(async()=>{const f=__fc;f.DUEL.P[0].pts=9000;f.DUEL.P[1].pts=4000;f.finishShow(true);await new Promise(r=>setTimeout(r,500));const c=document.getElementById('scard'),s=f.SAVE().fun;
  return {h1:c.querySelector('h1').textContent,rows:c.querySelectorAll('.duelT tr').length,overlayGone:!document.getElementById('duel'),bodyDuel:document.body.classList.contains('duel'),duels:s.stats.duels,wins:s.stats.duelWins,ach:!!s.ach.duelwin,btns:[...c.querySelectorAll('[data-u]')].map(e=>e.dataset.u)};});
 log('duelEnd',fin);ok('duelEnd',/Ann wins/.test(fin.h1)&&fin.rows===8&&fin.overlayGone&&!fin.bodyDuel&&fin.duels>=1&&fin.wins>=1&&fin.ach&&['duelRematch','duelNew','menu'].every(k=>fin.btns.includes(k)));
 await layout(p,'duel-winner','#scard');
 const rm=await p.evaluate(async()=>{const f=__fc,s0=f.DUEL.seed;f.UA.duelRematch();await new Promise(r=>setTimeout(r,2000));const S=f.SES();return {duel:!!(S&&S.cfg.duel),seed:S&&S.cfg.seed===s0,pts:f.DUEL.P.map(x=>x.pts),el:!!document.getElementById('duel')};});
 log('rematch',rm);ok('rematch',rm.duel&&rm.seed&&rm.pts.join()==='0,0'&&rm.el);
 // menu cleans up the duel
 const mc=await p.evaluate(()=>{__fc.menuScreen();return {el:!!document.getElementById('duel'),body:document.body.classList.contains('duel')};});ok('duelCleanup',!mc.el&&!mc.body);
 // normal show after a duel: HUD back, judge works
 const back=await p.evaluate(async()=>{const f=__fc;f.startSession({mode:'show',venue:4,env:'night',track:'r_again',dj:null,style:'energetic',crowdSize:null,crowdN:2000,auto:'manual',short:true,scored:true,seed:5,diff:'normal',mp:{kind:'solo'}});await new Promise(r=>setTimeout(r,1500));
  return {topbar:getComputedStyle(document.getElementById('topbar')).display,fun:f.FUN.on,hype:f.FUN.hype};});log('afterDuel',back);ok('afterDuel',back.topbar!=='none'&&back.fun&&back.hype===0);
 const e2=errs.filter(e=>!/404|favicon/.test(e));log('errors',e2);ok('errors',!e2.length);
 console.log('FAILS',JSON.stringify(R.fails));await b.close();process.exit(R.fails.length?1:0);})().catch(e=>{console.error(e);process.exit(2);});
