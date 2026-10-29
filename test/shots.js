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
 ({p,errs}=await page(b,'landscape'));await start(p);await p.click('#bCon');await p.waitForTimeout(300);await p.click('#tabs [data-t="lights"]');await p.waitForTimeout(800);await p.screenshot({path:O+'shot-console-landscape.png'});
 console.log('errs',JSON.stringify(errs.concat(await p.evaluate(()=>__fc.ERRORS.map(e=>e.where+': '+e.msg)))));await b.close();})();
