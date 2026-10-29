// Multiplayer: challenge link round-trip + tamper rejection, link -> identical show + head-to-head + counter link chain, seed determinism, leaderboard trim, party flow (3 players) -> podium, mobile layout
const {launch,page}=require('./lib');const VPN=process.argv[2]||'portrait';const SO='/workspace/festival/shot-mp-'+VPN+'-';
const R={fails:[]};const log=(k,v)=>{R[k]=v;console.log(k,JSON.stringify(v));};const ok=(k,c)=>{if(!c)R.fails.push(k);};
const W=ms=>new Promise(r=>setTimeout(r,ms));
async function layout(p,name){const r=await p.evaluate(()=>{const sc=document.querySelector('#screen:not(.hidden),.scr:not(.hidden)')||document.body;const vw=innerWidth;
  const over=[...document.querySelectorAll('button,input,select')].filter(e=>e.offsetParent&&e.getBoundingClientRect().right>vw+1).map(e=>e.textContent.slice(0,20)||e.id);
  const small=[...document.querySelectorAll('button')].filter(e=>e.offsetParent&&e.closest('#ui,#screen,.scr,#scr')&&e.getBoundingClientRect().height<43.5).map(e=>e.textContent.trim().slice(0,20));
  return {sw:document.documentElement.scrollWidth,vw,over,small};});log('layout_'+name,r);ok('layout_'+name,r.sw<=r.vw+1&&!r.over.length&&(VPN==='desktop'||!r.small.length));await p.screenshot({path:SO+name+'.png'});}
(async()=>{const b=await launch();let {p,errs}=await page(b,VPN);
 await p.evaluate(()=>{localStorage.clear();});await p.reload();await W(2000);
 // 1) codec round trip + tamper
 const codec=await p.evaluate(()=>{const f=__fc,o={venue:3,track:'r_party',seed:123456789,diff:'pro',name:'DJ <Ewok>',score:12345,chain:[['Ann',100],['Bob',2000]]};
  const s=f.chalEncode(o),d=f.chalDecode(s);const [b64,sum]=s.split('.');
  const flip=c=>c==='A'?'B':'A';const t1=b64.slice(0,5)+flip(b64[5])+b64.slice(6)+'.'+sum;
  const forged=btoa(JSON.stringify({v:1,ve:3,t:'r_party',sd:1,d:'pro',n:'X',s:99999,c:[]})).replace(/=+$/,'');
  return {s,d,rt:!!d&&d.venue===3&&d.track==='r_party'&&d.seed===123456789&&d.diff==='pro'&&d.name==='DJ Ewok'&&d.score===12345&&d.chain.length===2,
   tFlip:f.chalDecode(t1),tSum:f.chalDecode(b64+'.'+sum.slice(0,-1)+(sum.slice(-1)==='0'?'1':'0')),tForged:f.chalDecode(forged+'.'+sum),tNoSum:f.chalDecode(b64),tGarb:f.chalDecode('%%%.zz'),tEmpty:f.chalDecode(''),
   tScore:f.chalDecode((()=>{const x=btoa(JSON.stringify({v:1,ve:3,t:'r_party',sd:1,d:'pro',n:'X',s:100000,c:[]})).replace(/=+$/,'');return x+'.'+'0';})())};});
 log('codec',codec);ok('roundtrip',codec.rt);['tFlip','tSum','tForged','tNoSum','tGarb','tEmpty','tScore'].forEach(k=>ok('tamper_'+k,codec[k]===null));
 // 2) seed determinism
 const det=await p.evaluate(()=>{const f=__fc;f.rngSeed(42);const a=[f.rand(),f.rand()];f.rngSeed(42);const b=[f.rand(),f.rand()];f.rngSeed(0);return a[0]===b[0]&&a[1]===b[1];});log('seedDeterminism',det);ok('seed',det);
 // 3) open a challenge link (fresh page with name unset) -> challenge screen -> accept -> name prompt -> show with same cfg
 const url=(process.env.FC_URL||'file:///workspace/festival/index.html').replace(/[?#].*$/,'')+'#c='+codec.s;
 await p.goto('about:blank');await p.goto(url);await W(2500);
 const cs=await p.evaluate(()=>({txt:(document.querySelector('.chalBig')||{}).textContent,hash:location.hash,go:!!document.querySelector('[data-u="chalGo"]')}));log('challengeScreen',cs);ok('chalScreen',cs.go&&/Beat DJ Ewok's\s*12,345/.test(cs.txt)&&cs.hash==='');
 await layout(p,'challenge');
 await p.click('[data-u="chalGo"]');await W(400);ok('namePrompt',await p.evaluate(()=>!!document.getElementById('mpName')));await layout(p,'name');
 await p.fill('#mpName','Tester');await p.click('[data-u="mpNameOk"]');await W(500);await p.evaluate(()=>{const b=document.getElementById('wOk');if(b)b.click();});await W(2500);
 const ses=await p.evaluate(()=>{const S=__fc.SES();return S&&{venue:S.cfg.venue,track:S.cfg.track,seed:S.cfg.seed,diff:S.cfg.diff,auto:S.cfg.auto,short:S.cfg.short,mp:S.cfg.mp,chip:document.getElementById('mpTarget').textContent,chipVis:!document.getElementById('mpTarget').classList.contains('hidden'),play:__fc.SEQ.playing};});
 log('session',ses);ok('sameShow',ses&&ses.venue===3&&ses.track==='r_party'&&ses.seed===123456789&&ses.diff==='pro'&&ses.short===false&&ses.chipVis&&/12,345/.test(ses.chip));
 await p.screenshot({path:SO+'inshow.png'});
 await W(3000);await p.evaluate(()=>__fc.finishShow(false));await W(1500);
 const an=await p.evaluate(()=>({h2h:(document.querySelector('.h2h')||{}).textContent,msg:(document.querySelector('.h2hMsg')||{}).textContent,chain:(document.querySelector('.chain')||{}).textContent,link:__fc.MP.lastLink,pts:__fc.UI.lastAn&&__fc.UI.lastAn.R.points,lb:__fc.SAVE().mp.lb}));
 const counter=await p.evaluate(l=>__fc.chalDecode(l.split('#c=')[1]),an.link);log('analysis',{h2h:an.h2h,msg:an.msg,chain:an.chain,pts:an.pts,counter});
 ok('h2h',!!an.h2h&&/DJ Ewok/.test(an.h2h)&&/Tester/.test(an.h2h));ok('counterLink',counter&&counter.name==='Tester'&&counter.score===an.pts&&counter.seed===123456789&&counter.track==='r_party'&&counter.venue===3&&counter.diff==='pro'&&JSON.stringify(counter.chain)===JSON.stringify([['Ann',100],['Bob',2000],['DJ Ewok',12345]]));
 ok('lbRecorded',(an.lb['r_party@3']||[]).length===1&&(an.lb.all||[]).length===1);
 await layout(p,'analysis');
 // share: navigator.share absent on desktop chromium -> copy fallback shows input
 await p.evaluate(()=>{try{delete navigator.share;}catch(e){}Object.defineProperty(navigator,'share',{value:undefined,configurable:true});});
 await p.click('[data-u="mpShare"]');await W(600);const sb=await p.evaluate(()=>{const i=document.getElementById('shareUrl');return i&&i.value;});log('shareFallback',!!sb);ok('shareFallback',sb===an.link);
 // navigator.share path
 const sh=await p.evaluate(async()=>{let got=null;Object.defineProperty(navigator,'share',{value:o=>{got=o;return Promise.resolve();},configurable:true});document.querySelector('[data-u="mpShare"]').click();await new Promise(r=>setTimeout(r,200));return got;});log('navigatorShare',sh);ok('navShare',sh&&sh.url===an.link&&/Tester/.test(sh.text));
 // 4) tampered link -> toast + menu, no session
 await p.goto('about:blank');const bad=url.slice(0,-8)+(url.slice(-8,-7)==='a'?'b':'a')+url.slice(-7);await p.goto(bad);await W(2500);
 const tb=await p.evaluate(()=>({ses:!!__fc.SES(),menu:!!document.querySelector('.playBig'),toast:(document.getElementById('toast')||{}).textContent||''}));log('tamperedLink',tb);ok('tamperedLink',!tb.ses&&tb.menu);
 // 5) leaderboard trim
 const lb=await p.evaluate(()=>{const f=__fc,c={track:'r_acceptance',venue:2,auto:'manual',short:true};for(let i=0;i<12;i++)f.lbRecord('P'+i,1000+i*10,c);const L=f.SAVE().mp.lb['r_acceptance@2'];return {n:L.length,top:L[0][1],bottom:L[9][1],all:f.SAVE().mp.lb.all.length};});log('leaderboardTrim',lb);ok('lbTrim',lb.n===10&&lb.top===1110&&lb.bottom===1020&&lb.all===10);
 await p.click('[data-u="mp"]');await W(300);await layout(p,'hub');await p.click('[data-u="lb"]');await W(300);await layout(p,'leaderboard');
 // 6) party mode, 3 players
 await p.click('[data-u="mp"]');await W(200);await p.click('[data-u="party"]');await W(300);await p.selectOption('#pN','3');await W(200);
 const ins=await p.$$('.pname');await ins[0].fill('Ann');await ins[1].fill('Bob');await ins[2].fill('Cy');await p.selectOption('#pT','r_again');await layout(p,'partySetup');
 await p.click('[data-u="partyGo"]');await W(300);const seeds=[];
 for(let i=0;i<3;i++){const pass=await p.evaluate(()=>(document.querySelector('.chalBig')||{}).textContent);ok('pass'+i,pass===['Ann','Bob','Cy'][i]);if(i===1)await layout(p,'pass');
  await p.click('[data-u="partyPlay"]');await W(400);await p.evaluate(()=>{const b=document.getElementById('wOk');if(b)b.click();});await W(2000);
  seeds.push(await p.evaluate(()=>{const S=__fc.SES();return S&&[S.cfg.seed,S.cfg.track,S.cfg.venue,document.getElementById('mpTarget').textContent];}));
  await p.evaluate(()=>__fc.finishShow(false));await W(1200);
  const nb=await p.evaluate(()=>[...document.querySelectorAll('.row button')].map(b=>b.dataset.u));log('partyButtons'+i,nb);
  if(i<2){ok('next'+i,nb.includes('partyNext'));await p.click('[data-u="partyNext"]');await W(300);}else{ok('podiumBtn',nb.includes('podium'));await p.click('[data-u="podium"]');await W(500);}}
 log('partySeeds',seeds);ok('partySame',seeds.every(s=>s&&s[0]===seeds[0][0]&&s[1]==='r_again'&&s[2]===4));
 const pod=await p.evaluate(()=>({names:[...document.querySelectorAll('.pod .pn')].map(e=>e.textContent),rows:document.querySelectorAll('.lbt tr').length,players:__fc.MP.party.players.map(p=>[p.name,p.score])}));log('podium',pod);ok('podium',pod.names.length===3&&pod.rows===3&&pod.players.every(x=>Number.isInteger(x[1])));
 await layout(p,'podium');
 // 7) settings name edit
 await p.click('[data-u="partyQuit"]');await W(200);await p.click('[data-u="settings"]');await W(200);await p.click('[data-u="setTab"][data-v="gameplay"]');await W(200);
 const nmBtn=await p.evaluate(()=>(document.querySelector('[data-u="mpEditName"]')||{}).textContent);ok('settingsName',nmBtn==='Tester');
 await p.click('[data-u="mpEditName"]');await p.fill('#mpName','Neo');await p.click('[data-u="mpNameOk"]');await W(300);ok('renamed',await p.evaluate(()=>__fc.SAVE().mp.name==='Neo'));
 await p.evaluate(()=>__fc.SAVE&&window.dispatchEvent(new Event('beforeunload')));await W(300);await p.reload();await W(2000);
 const per=await p.evaluate(()=>({name:__fc.SAVE().mp.name,lb:Object.keys(__fc.SAVE().mp.lb)}));log('persisted',per);ok('persist',per.name==='Neo'&&per.lb.includes('r_again@4'));
 log('errors',errs);ok('noErrors',!errs.length);log('FAILS',R.fails);await b.close();process.exit(R.fails.length?1:0);})().catch(e=>{console.error('CRASH',e);process.exit(2);});
