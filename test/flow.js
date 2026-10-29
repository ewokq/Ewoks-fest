// End-to-end: menu -> career show (real UI clicks) played with an automated operator -> analysis -> rewards -> reload persistence -> shop purchase; plus screenshots
const {launch,page,closeModal}=require('./lib');const fs=require('fs');const O='/workspace/festival/';
const R={};const log=(k,v)=>{R[k]=v;console.log(k,JSON.stringify(v));};
const OPER=()=>{const f=__fc;let n=0;f.FXS.armed=false;
 f.Bus.on('mus',(k,i)=>{if(!f.SES())return;const s=f.TR().secs[i];
  if(k==='drop'){f.CMD.run('preset',['maindrop']);f.CMD.run('arm',[true]);setTimeout(()=>{f.padAct('flames',true);f.padAct('co2',true);f.padAct('flash',true);setTimeout(()=>f.padAct('flash',false),180);f.CMD.run('led',['style',['geo','waves','gradient'][n++%3]]);},5);}
  else if(k==='section'&&s){const t=s.t;if(t==='breakdown'||t==='intro'||t==='outro'){f.CMD.run('preset',[n%2?'purple':'blue']);f.CMD.run('arm',[false]);}else if(t==='build'){f.CMD.run('preset',['redfan']);f.CMD.run('led',['style','eq']);}else f.CMD.run('preset',['cyantunnel']);n++;}
  else if(k==='bar'&&Math.random()<0.25){const sec=f.curSec();if(sec==='drop'){f.padAct('confetti',true);f.CMD.run('blind',[]);}}});};
(async()=>{const b=await launch();let {p,errs,ctx}=await page(b,'portrait');
 await p.evaluate(()=>{localStorage.clear();});await p.reload();await p.waitForTimeout(2000);
 await p.evaluate(()=>{window.__fp=window.__fp||null;});
 await p.screenshot({path:O+'shot-menu.png'});
 const c0=await p.evaluate(()=>__fc.SAVE().career.credits);log('startCredits',c0);
 await p.click('[data-u="career"]');await p.waitForTimeout(300);await p.click('[data-u="venue"][data-v="0"]').catch(async()=>{await p.click('[data-u="venue"]');});await p.waitForTimeout(300);
 await p.check('[data-k="short"]');await p.waitForTimeout(100);
 await p.evaluate(OPER);
 await p.click('[data-u="goCareer"]');await p.waitForTimeout(400);const warned=await p.evaluate(()=>{const b=document.getElementById('wOk');if(b){b.click();return true;}return false;});log('photosensitivityWarningShown',warned);
 await p.waitForTimeout(3000);
 const st=await p.evaluate(()=>({ctx:__fc.A.ctx.state,play:__fc.SEQ.playing,pos:__fc.songPos(),len:__fc.TR().len,mode:__fc.SES().mode,title:__fc.TR().title,an:__fc.AN.src}));log('sessionStart',st);
 await p.waitForTimeout(2000);log('audioAdvancing',await p.evaluate(p0=>__fc.songPos()-p0,st.pos));
 // analyser shows real signal
 log('analyserLevel',await p.evaluate(()=>{const a=__fc.A.an;if(!a)return null;const d=new Uint8Array(a.frequencyBinCount);a.getByteFrequencyData(d);return d.reduce((s,x)=>s+x,0)/d.length;}));
 // wait for song end (natural) with a liveScore sample midway
 let mid=null;const t0=Date.now();while(Date.now()-t0<(st.len+20)*1000){await p.waitForTimeout(3000);const s=await p.evaluate(()=>({end:!!(__fc.SES()&&__fc.SES().done),pos:__fc.songPos(),ls:__fc.liveScore?__fc.liveScore():null}));if(!mid&&s.pos>st.len/2){mid=s;}if(s.end)break;}
 log('midLiveScore',mid);
 const an=await p.evaluate(()=>({scr:__fc.UI.scr,an:__fc.UI.lastAn&&{overall:__fc.UI.lastAn.R.overall,cats:__fc.UI.lastAn.R.cats,tips:__fc.UI.lastAn.R.tips,drops:__fc.UI.lastAn.R.drops.length,samples:__fc.UI.lastAn.R.samples.length,lines:__fc.UI.lastAn.rw.lines},credits:__fc.SAVE().career.credits,venue:__fc.SAVE().career.venue,missions:__fc.SAVE().career.missions,best:__fc.SAVE().career.best}));log('analysis',an);
 await p.waitForTimeout(500);await p.screenshot({path:O+'shot-analysis.png'});
 // persistence: reload
 await p.reload();await p.waitForTimeout(2000);const after=await p.evaluate(()=>({credits:__fc.SAVE().career.credits,venue:__fc.SAVE().career.venue,shows:__fc.SAVE().career.shows,best:__fc.SAVE().career.best}));log('afterReload',after);
 // shop: give enough credits for the test, buy first affordable Equipment item via UI
 await p.evaluate(()=>{__fc.SAVE().career.credits+=2000;__fc.persist();});
 await p.click('[data-u="career"]');await p.waitForTimeout(300);await p.click('[data-u="shop"]');await p.waitForTimeout(300);
 const rig0=await p.evaluate(()=>JSON.stringify(__fc.careerRig(__fc.VENUES[6]))+'|'+JSON.stringify(__fc.careerFx(__fc.VENUES[6])));
 const buy=await p.$('[data-u="buy"]');const bid=await buy.getAttribute('data-v');await buy.click();await p.waitForTimeout(300);await closeModal(p);await p.waitForTimeout(300);
 const bought=await p.evaluate(id=>({owned:__fc.SAVE().owned,credits:__fc.SAVE().career.credits,item:__fc.SHOP.find(s=>s.id===id)}),bid);
 const rig1=await p.evaluate(()=>JSON.stringify(__fc.careerRig(__fc.VENUES[6]))+'|'+JSON.stringify(__fc.careerFx(__fc.VENUES[6])));log('shopBuy',{bid,bought,rigChanged:rig0!==rig1});
 await p.screenshot({path:O+'shot-career-shop.png'});
 await p.reload();await p.waitForTimeout(1500);log('ownedAfterReload',await p.evaluate(()=>__fc.SAVE().owned));
 // console portrait
 await p.evaluate(()=>{__fc.SAVE().seenWarn=true;__fc.startSession({mode:'free',venue:6,env:'night',track:'bigroom',style:'spectacular',crowdSize:'massive',auto:'manual',scored:false});});
 await p.waitForTimeout(2500);await p.click('#bCon');await p.waitForTimeout(300);await p.click('#tabs [data-t="color"]');await p.waitForTimeout(800);await p.screenshot({path:O+'shot-console-portrait.png'});
 await p.evaluate(()=>__fc.conOpen(false));
 // drop + pyro
 await p.evaluate(()=>{const T=__fc.TR(),d=T.secs.find(s=>s.t==='drop');__fc.transportSeek(d.a*T.bar+T.bar*2);__fc.CMD.run('preset',['maindrop']);__fc.CMD.run('arm',[true]);__fc.camSet('foh');});
 await p.waitForTimeout(1500);await p.evaluate(()=>{for(const k of ['flames','co2','confetti','sparks','fireworks'])__fc.padAct(k,true);__fc.CMD.run('laser',[true]);});
 await p.waitForTimeout(700);await p.screenshot({path:O+'shot-drop-pyro.png'});log('pyroActive',await p.evaluate(()=>({active:__fc.FXS.active,em:__fc.FXS.em.length,fired:__fc.FXS.stats.fired})));
 await p.evaluate(()=>{__fc.camSet('crowd');__fc.padAct('confetti',true);});await p.waitForTimeout(1800);await p.screenshot({path:O+'shot-crowd.png'});
 log('crowdN',await p.evaluate(()=>__fc.CRW.n));
 // My Song screen
 await p.evaluate(()=>__fc.menuScreen());await p.waitForTimeout(300);await p.click('[data-u="mysong"]');await p.waitForTimeout(300);
 await p.fill('#ytUrl','https://www.youtube.com/watch?v=dQw4w9WgXcQ');await p.dispatchEvent('#ytUrl','input');await p.waitForTimeout(300);log('ytMsg',await p.evaluate(()=>document.getElementById('ytMsg').textContent));
 await p.fill('#ytUrl','not a url');await p.dispatchEvent('#ytUrl','input');await p.waitForTimeout(200);log('ytMsgBad',await p.evaluate(()=>document.getElementById('ytMsg').textContent));
 log('errors',errs.concat(await p.evaluate(()=>__fc.ERRORS.map(e=>e.where+': '+e.msg))));
 fs.writeFileSync(O+'test/flow-result.json',JSON.stringify(R,null,1));await b.close();})();
