const {chromium}=require('/tmp/t3/node_modules/playwright-core');
const ARGS=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required','--ignore-gpu-blocklist'];
async function launch(){return chromium.launch({executablePath:'/usr/bin/google-chrome',args:ARGS});}
const VP={portrait:{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'},
 landscape:{viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'},
 desktop:{viewport:{width:1440,height:900},deviceScaleFactor:1}};
async function page(b,vp,url,storage){const ctx=await b.newContext(Object.assign({acceptDownloads:true},VP[vp]));const p=await ctx.newPage();const errs=[];
 p.on('console',m=>{if(m.type()==='error')errs.push('console.error: '+m.text());});p.on('pageerror',e=>errs.push('pageerror: '+e.message));
 if(storage)await ctx.addInitScript(s=>{if(!sessionStorage.__init){sessionStorage.__init=1;localStorage.clear();for(const k in s)localStorage.setItem(k,s[k]);}},storage);
 await p.goto(url||'file:///workspace/festival/index.html');await p.waitForTimeout(1500);
 await p.evaluate(()=>{window.__fp=()=>{const f=__fc,S=Object.assign({},f.SHOW),sv=f.SAVE(),sc=f.SCORE()||{};delete S.fb;S.flash=S.flash>0.05;S.bo=Math.round(S.bo);
  return JSON.stringify({S,ovr:f.FIX.list.map(x=>[x.ovr,x.base]),st:f.ST,led:f.LEDRT.cur,cam:f.CAM.mode,arm:f.FXS.armed,fired:f.FXS.stats.fired,em:f.FXS.em.length,
   sav:[sv.presets.length,sv.cues.length,sv.groups.length,sv.swatches.length,JSON.stringify(sv.programs).length,JSON.stringify(sv.cues).length,JSON.stringify(sv.presets).length,JSON.stringify(sv.ledPresets||[]).length],
   auto:f.AUTO.mode,sel:f.SEL,con:[f.CON.tab,f.CON.colT,f.CON.fxPat,f.CON.cueOpt,f.CON.progCue,f.CON.open,f.CON.mode],body:document.body.className,play:f.SEQ.playing,
   panel:document.getElementById('panel').className,sc:[sc.cues,sc.ledChanges],modal:!document.getElementById('modal').classList.contains('hidden'),rec:!!f.CMD.rec,pos:Math.round(f.songPos())});};});
 return {p,errs,ctx};}
async function closeModal(p,txt){return p.evaluate(t=>{const m=document.getElementById('modal');if(!m||m.classList.contains('hidden'))return false;const i=document.getElementById('mIn');if(i){i.value=t||'Test';}const y=document.getElementById('mYes');if(y)y.click();return true;},txt);}
module.exports={launch,page,closeModal,VP};
