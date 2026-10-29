// v2.3.1: camera = one small angle-changer button (🎥 + label), 5 presets, smooth move, remembered in the save.
// Checks the camera button never overlaps HYPE / FEVER / request / pads / other HUD buttons in Simple, Pro and the duel. Screenshots shot-v231-*.png
const {launch,page}=require('./lib');const VPN=process.argv[2]||'portrait';const SO='/workspace/festival/shot-v231-'+VPN+'-';
const URL=process.env.FC_URL||'http://127.0.0.1:18432/index.html';
const R={fails:[]};const log=(k,v)=>{R[k]=v;console.log(k,JSON.stringify(v));};const ok=(k,c)=>{if(!c){R.fails.push(k);console.log('  FAIL',k);}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
const overlap=()=>{const vis=e=>{if(!e)return null;const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden'||e.closest('.hidden'))return null;const r=e.getBoundingClientRect();return r.width&&r.height?r:null;};
  const hit=(a,b)=>a.left<b.right-0.5&&b.left<a.right-0.5&&a.top<b.bottom-0.5&&b.top<a.bottom-0.5;
  const cams=['#bCam'].map(s=>[s,vis(document.querySelector(s))]).filter(x=>x[1]);
  const others=[...document.querySelectorAll('#hypeBox,#bFever,#req,#pads,#spads,#pads button,#spads button,#bottom button,#topbar button,#guide,#panel,#duel .dpad,#duel [class*=hype],#duel button,#mpTarget,#meters')].filter(e=>e.id!=='bCam'&&!e.contains(document.getElementById('bCam'))).map(e=>[e.id||e.className||e.tagName,vis(e)]).filter(x=>x[1]);
  const bad=[];for(const [n,c] of cams)for(const [m,o] of others)if(hit(c,o))bad.push(n+'×'+m);
  const c=cams[0]&&cams[0][1];return {cam:c?[Math.round(c.left),Math.round(c.top),Math.round(c.width),Math.round(c.height)]:null,camOpacity:c?getComputedStyle(document.getElementById('bCam')).backgroundColor:null,checked:others.length,bad,vw:innerWidth,sw:document.documentElement.scrollWidth};};
(async()=>{const b=await launch();let {p,errs}=await page(b,VPN,URL);
 await p.evaluate(()=>{localStorage.clear();});await p.reload();await W(1800);
 const v=await p.evaluate(()=>__fc.VERSION);log('version',v);ok('version',v==='v2.3.1');
 const noOld=await p.evaluate(()=>({freePad:!!document.getElementById('freePad'),camPop:!!document.getElementById('camPop'),reset:[...document.querySelectorAll('button')].some(b=>/reset view/i.test(b.textContent))}));
 log('oldUiGone',noOld);ok('oldUiGone',!noOld.freePad&&!noOld.camPop&&!noOld.reset);
 const start=()=>p.evaluate(()=>{const f=__fc;f.SAVE().welcomed=true;f.SAVE().tutorialDone=true;f.SAVE().seenWarn=true;f.startSession({mode:'show',venue:4,env:'night',track:'r_party',dj:null,style:'energetic',crowdSize:null,crowdN:2000,auto:'manual',short:true,scored:true,seed:777,diff:'normal',mp:{kind:'solo'}});});
 await start();await W(2500);await p.evaluate(()=>{const s=document.getElementById('screen');if(s&&!s.classList.contains('hidden'))__fc.hideScr&&__fc.hideScr();});
 await p.evaluate(()=>__fc.setUiMode('simple'));await W(400);
 // cycle the 5 angles by tapping; label + mode change; smooth (no instant jump)
 const seq=[];for(let i=0;i<6;i++){const s=await p.evaluate(()=>({m:__fc.CAM.mode,l:document.getElementById('camLbl').textContent,blend:__fc.CAM.blend}));seq.push(s);
   if(i===1)await p.screenshot({path:SO+'angle-crowd.png'});if(i===2)await p.screenshot({path:SO+'angle-dj.png'});if(i===3)await p.screenshot({path:SO+'angle-wide.png'});if(i===4)await p.screenshot({path:SO+'angle-side.png'});
   await p.tap('#bCam');await W(90);const mid=await p.evaluate(()=>__fc.CAM.blend);seq[i].blendAfterTap=Math.round(mid*100)/100;await W(1400);}
 log('cycle',seq.map(s=>s.m+':'+s.l+':'+s.blendAfterTap));
 ok('cycle',seq.map(s=>s.m).join()==='foh,crowd,dj,wide,side,foh'&&seq.map(s=>s.l).join()==='Front,Crowd POV,DJ booth,Wide,Side,Front'&&seq.slice(0,5).every(s=>s.blendAfterTap<1));
 // remember last angle across a reload + new session
 await p.tap('#bCam');await W(300);await p.tap('#bCam');await W(300);const saved=await p.evaluate(()=>{__fc.persist(false);return __fc.SAVE().cam;});
 await p.reload();await W(1800);await start();await W(1500);const after=await p.evaluate(()=>({m:__fc.CAM.mode,l:document.getElementById('camLbl').textContent}));
 log('remember',{saved,after});ok('remember',saved==='wide'&&after.m==='wide'&&after.l==='Wide');
 // set back to Front for screenshots
 await p.evaluate(()=>__fc.camSet('foh',true));await p.evaluate(()=>__fc.setUiMode('simple'));await W(600);
 // old drag gesture no longer moves to a free camera
 const box=await p.evaluate(()=>{const r=document.getElementById('c').getBoundingClientRect();return {x:r.width/2,y:r.height*0.3};});
 await p.mouse.move(box.x,box.y);await p.mouse.down();await p.mouse.move(box.x+120,box.y+40,{steps:6});await p.mouse.up();await W(200);
 const md=await p.evaluate(()=>__fc.CAM.mode);log('dragNoFree',md);ok('dragNoFree',md==='foh');
 // layouts
 let o=await p.evaluate(overlap);log('simple',o);ok('simple',o.cam&&!o.bad.length&&o.cam[2]>=43.5&&o.cam[3]>=43.5&&o.sw<=o.vw+1);
 await p.screenshot({path:SO+'front.png'});
 const tc=await p.evaluate(async()=>{__fc.toast('Pyro armed for the drop',3000);await new Promise(r=>setTimeout(r,300));const a=document.getElementById('toast').getBoundingClientRect(),hs=['hypeBox','bFever'].map(i=>document.getElementById(i).getBoundingClientRect());return {toastBottom:Math.round(a.bottom),hypeTop:Math.round(hs[0].top),hit:hs.some(h=>a.left<h.right&&h.left<a.right&&a.top<h.bottom&&h.top<a.bottom)};});
 log('toastClear',tc);ok('toastClear',!tc.hit);
 await p.evaluate(()=>{const f=__fc;f.SIM&&0;const h=document.getElementById('hypeN');});
 await p.evaluate(()=>__fc.setUiMode('pro'));await W(500);o=await p.evaluate(overlap);log('pro',o);ok('pro',o.cam&&!o.bad.length);
 await p.screenshot({path:SO+'pro.png'});
 await p.evaluate(()=>{__fc.conOpen&&__fc.conOpen(true);});await W(500);o=await p.evaluate(overlap);log('proConsole',o);ok('proConsole',!o.cam||!o.bad.length);
 await p.evaluate(()=>{__fc.conOpen&&__fc.conOpen(false);__fc.setUiMode('simple');__fc.camSet('wide');});await W(1600);
 o=await p.evaluate(overlap);log('simpleWide',o);ok('simpleWide',!o.bad.length);
 // duel: topbar hidden -> no camera button covering the split screen
 await p.evaluate(()=>__fc.UA.duel());await W(300);
 await p.evaluate(()=>{const n1=document.getElementById('dN1'),n2=document.getElementById('dN2');n1.value='Ann';n2.value='Bob';n1.dispatchEvent(new Event('input'));const s=document.getElementById('dT');s.value='r_party';s.dispatchEvent(new Event('change'));__fc.UA.duelGo();});
 await W(3000);o=await p.evaluate(overlap);log('duel',o);ok('duel',!o.cam&&!o.bad.length);await p.screenshot({path:SO+'duel.png'});
 log('errors',errs);ok('noErrors',!errs.length);
 console.log('FAILS',JSON.stringify(R.fails));await b.close();process.exit(R.fails.length?1:0);})().catch(e=>{console.error(e);process.exit(2);});
