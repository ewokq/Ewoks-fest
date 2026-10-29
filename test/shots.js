// extra screenshots: pyro moment, crowd overview, landscape console
const {launch,page}=require('./lib');const O='/workspace/festival/';
(async()=>{const b=await launch();
 let {p,errs}=await page(b,'portrait');
 const start=async(pp)=>{await pp.evaluate(()=>{__fc.SAVE().seenWarn=true;__fc.startSession({mode:'free',venue:6,env:'night',track:'bigroom',style:'spectacular',crowdSize:'massive',auto:'manual',scored:false});});await pp.waitForTimeout(2500);};
 await start(p);
 await p.evaluate(()=>{const T=__fc.TR(),d=T.secs.find(s=>s.t==='drop');__fc.transportSeek(d.a*T.bar+T.bar*2);__fc.CMD.run('preset',['redfan']);__fc.CMD.run('arm',[true]);__fc.camSet('foh');});
 await p.waitForTimeout(1500);
 await p.evaluate(()=>{for(const k of ['flames','sparks','fireworks'])__fc.padAct(k,true);});
 for(const ms of [250,500,900]){await p.waitForTimeout(ms===250?250:ms-250);await p.screenshot({path:`/tmp/pyro_${ms}.png`});console.log(ms,JSON.stringify(await p.evaluate(()=>({a:__fc.FXS.active,em:__fc.FXS.em.length}))));}
 await p.evaluate(()=>{__fc.CMD.run('preset',['blue']);__fc.camSet('stage');});await p.waitForTimeout(1500);await p.screenshot({path:'/tmp/crowd_stage.png'});
 await p.evaluate(()=>{__fc.camSet('crowd');});await p.waitForTimeout(1500);await p.screenshot({path:'/tmp/crowd_in.png'});
 await p.context().close();
 ({p,errs}=await page(b,'landscape'));await start(p);await p.evaluate(()=>__fc.setUiMode('pro'));await p.click('#bCon');await p.waitForTimeout(300);await p.click('#tabs [data-t="lights"]');await p.waitForTimeout(800);await p.screenshot({path:O+'shot-console-landscape.png'});
 await p.context().close();
 // ---- v2.1 screenshots ----
 const skip=async(pp)=>{await pp.evaluate(()=>{__fc.SAVE().seenWarn=true;});const w=await pp.$('[data-u="skipWelcome"]');if(w){await w.click();await pp.waitForTimeout(400);}};
 const ok=async(pp)=>{await pp.waitForTimeout(400);await pp.evaluate(()=>{const b=document.getElementById('wOk');if(b)b.click();});};
 ({p,errs}=await page(b,'portrait'));await skip(p);await p.waitForTimeout(600);await p.screenshot({path:O+'shot-v21-menu.png'});
 await p.click('[data-u="play"]');await ok(p);await p.waitForTimeout(3000);
 await p.evaluate(()=>{const T=__fc.TR(),d=T.secs.find(s=>s.t==='groove')||T.secs[1];__fc.transportSeek(d.a*T.bar+T.bar*1.2);__fc.CMD.run('preset',['cyantunnel']);});await p.waitForTimeout(1800);
 await p.evaluate(()=>__fc.CMD.run('pal',['cyber',null]));await p.waitForTimeout(900);await p.screenshot({path:O+'shot-v21-simple-console-portrait.png'});
 const hintInfo=await p.evaluate(async()=>{const T=__fc.TR(),i=T.secs.findIndex(s=>s.t==='drop');const d=T.secs[i];__fc.transportSeek(d.a*T.bar-T.bar*1.2);return d.a;});
 await p.waitForFunction(()=>/^[2-4]$/.test(document.getElementById('cdown').textContent),null,{timeout:8000,polling:30}).catch(()=>{});
 await p.evaluate(()=>{__fc.SIM.freeze=true;__fc.transportPause();});await p.waitForTimeout(500);
 await p.screenshot({path:O+'shot-v21-hint.png'});console.log('hint',JSON.stringify(await p.evaluate(()=>({cd:document.getElementById('cdown').textContent,hint:document.getElementById('hint').textContent,glow:[...document.querySelectorAll('.sp.glow')].map(e=>e.dataset.s)}))));await p.evaluate(()=>{__fc.SIM.freeze=false;});
 console.log('errs-portrait',JSON.stringify(errs));await p.context().close();
 ({p,errs}=await page(b,'desktop'));await skip(p);
 await p.evaluate(()=>{__fc.startSession({mode:'free',venue:4,env:'night',track:'bigroom',style:'spectacular',crowdSize:'massive',auto:'assisted',scored:false,rig:__fc.VENUES[4].rig,fx:__fc.VENUES[4].fx});});await ok(p);await p.waitForTimeout(2500);
 await p.evaluate(()=>{const T=__fc.TR(),d=T.secs.find(s=>s.t==='drop');__fc.transportSeek(d.a*T.bar-T.bar*0.25);__fc.camSet('faces');});await p.waitForTimeout(1300);
 await p.evaluate(()=>{__fc.CMD.run('preset',['maindrop']);__fc.simAct('confetti',true);__fc.simAct('flames',true);__fc.simAct('co2',true);});await p.waitForTimeout(1100);await p.screenshot({path:O+'shot-v21-crowd-drop.png'});
 console.log('drop',JSON.stringify(await p.evaluate(()=>({n:__fc.CRW.n,near:__fc.CRW.nNear,pits:__fc.CRW.pits&&__fc.CRW.pits.length,jump:__fc.CRW.jump,hands:__fc.CRW.hands}))));
 await p.evaluate(()=>{const T=__fc.TR(),d=T.secs.find(s=>s.t==='break');__fc.transportSeek(d.a*T.bar+T.bar*2);__fc.CMD.run('preset',['purple']);__fc.camSet('crowd');});await p.waitForTimeout(3500);
 await p.screenshot({path:O+'shot-v21-crowd-breakdown.png'});console.log('break',JSON.stringify(await p.evaluate(()=>({sec:__fc.curSecObj().t,phone:__fc.CRW.phone}))));
 console.log('errs',JSON.stringify(errs.concat(await p.evaluate(()=>__fc.ERRORS.map(e=>e.where+': '+e.msg)))));await b.close();})();
