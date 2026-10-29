// Sweeps every console control in every tab + pads and reports which produced an observable state change
const {launch,page,closeModal}=require('./lib');
const vp=process.argv[2]||'portrait';const SKIP=new Set(['endShow','restart','impShow','expShow','replay','cine','clean','compact']);
(async()=>{const b=await launch();const {p,errs}=await page(b,vp);const out={vp,tabs:{},pads:{},noEffect:[],extra:{}};
 await p.evaluate(()=>{__fc.SAVE().seenWarn=true;__fc.ST.quantize='off';__fc.startSession({mode:'free',venue:6,env:'night',track:'bigroom',style:'spectacular',crowdSize:'massive',auto:'manual',scored:false,rig:__fc.careerRig?undefined:undefined});});
 await p.waitForTimeout(1500);
 await p.click('#bCon');await p.waitForTimeout(300);out.extra.panelOpen=await p.evaluate(()=>__fc.CON.open);
 await p.evaluate(()=>{__fc.FXS.armed=true;});
 const tabs=await p.$$eval('#tabs [data-t]',e=>e.map(x=>x.dataset.t).filter(t=>t!=='full'));
 for(const tab of tabs){if(process.argv[3]&&!process.argv[3].split(',').includes(tab))continue;out.extra['sel_before_'+tab]=await p.evaluate(()=>__fc.SEL.grp+':'+__fc.SEL.ids.length);await p.evaluate(()=>__fc.CMD.run('sel',[[],'']));await p.click(`#tabs [data-t="${tab}"]`);await p.waitForTimeout(200);if(tab==='fx')await p.evaluate(()=>{__fc.FXS.armed=true;__fc.renderPanel();});
  const n=await p.$$eval('#pbody [data-a], #pbody input[type=range], #pbody select, #pbody canvas',e=>e.length);const res=[];
  for(let i=0;i<n;i++){const d=await p.evaluate(i=>{const e=[...document.querySelectorAll('#pbody [data-a], #pbody input[type=range], #pbody select, #pbody canvas')][i];if(!e)return null;
     return {tag:e.tagName,a:e.dataset.a||e.dataset.s||e.id||'',v:e.dataset.v||'',t:(e.textContent||e.getAttribute('aria-label')||e.dataset.help||'').trim().slice(0,28),dis:e.disabled};},i);
   if(!d)break;if(SKIP.has(d.a)){res.push([d.a,d.t,'skipped(tested separately)']);continue;}if(d.dis){res.push([d.a,d.t,'disabled']);continue;}
   if(tab==='fx')await p.evaluate(()=>{__fc.FXS.armed=true;__fc.FXS.cool={};});
   const before=await p.evaluate(()=>__fp());let toastBefore=await p.evaluate(()=>document.getElementById('toast')?document.getElementById('toast').textContent:'');
   await p.waitForFunction(()=>!__fc.CON.needs,null,{timeout:2000}).catch(()=>{});
   let pre=null;
   if(d.tag==='CANVAS'){const el=(await p.$$('#pbody [data-a], #pbody input[type=range], #pbody select, #pbody canvas'))[i];await el.scrollIntoViewIfNeeded();const bb=await el.boundingBox();await p.mouse.move(bb.x+bb.width*0.5,bb.y+bb.height*0.5);await p.mouse.down();await p.mouse.move(bb.x+bb.width*0.85,bb.y+bb.height*0.2,{steps:5});await p.mouse.up();}
   else pre=await p.evaluate(i=>{const e=[...document.querySelectorAll('#pbody [data-a], #pbody input[type=range], #pbody select, #pbody canvas')][i];
     if(e.tagName==='INPUT'){const mn=+e.min||0,mx=+e.max||1,cur=+e.value;let v=mn+(mx-mn)*0.27;if(Math.abs(v-cur)<(mx-mn)*0.1)v=mn+(mx-mn)*0.8;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return null;}
     if(e.tagName==='SELECT'){e.selectedIndex=(e.selectedIndex+1)%e.options.length;e.dispatchEvent(new Event('change',{bubbles:true}));return null;}
     const act=e.classList.contains('sel')||e.classList.contains('on')||(e.dataset.a==='sw'&&__fc.FIX.list.every(f=>(f.ovr[__fc.CON.colT]||f.base[__fc.CON.colT]||e.dataset.v)===e.dataset.v));const D0=e.dataset.a==='sw'?[__fc.CON.colT,__fc.FIX.list[0].base[__fc.CON.colT],e.isConnected]:null;e.click();if(D0){D0.push(__fc.FIX.list[0].base[__fc.CON.colT]);window.__D=(window.__D||[]).concat([D0]);}return act?'already-active':null;},i);
   await p.waitForTimeout(120);const m=await closeModal(p,'Test '+i);if(m)await p.waitForTimeout(120);
   const after=await p.evaluate(()=>__fp());const toast=await p.evaluate(()=>document.getElementById('toast')?document.getElementById('toast').textContent:'');
   const changed=before!==after;res.push([d.a+(d.v?'='+d.v:''),d.t,changed?'changed':pre?pre:(toast!==toastBefore&&toast?'toast:'+toast.slice(0,60):'NO EFFECT')]);if(!changed&&!pre){out.noEffect.push(tab+':'+d.a+'='+d.v+' "'+d.t+'" '+(toast!==toastBefore?'toast:'+toast:''));if(process.env.DIAG)out.diag=(out.diag||[]).concat([await p.evaluate(()=>JSON.stringify({colT:__fc.CON.colT,sel:__fc.SEL,auto:__fc.AUTO.mode,f0:__fc.FIX.list.slice(0,3).map(f=>[f.type,f.base.col,f.ovr.col,f.base.move]),needs:__fc.CON.needs}))]);}
   // re-open tab in case control changed tab/panel
   await p.evaluate(t=>{if(!__fc.CON.open)__fc.conOpen(true,t);else if(__fc.CON.tab!==t){__fc.CON.tab=t;__fc.renderPanel();}},tab);
  }
  out.tabs[tab]=res;}
 // pads
 await p.evaluate(()=>__fc.conOpen(false));
 for(const id of await p.$$eval('#pads [data-p]',e=>e.map(x=>x.dataset.p))){await p.evaluate(()=>{__fc.FXS.cool={};});if(id!=='arm')await p.evaluate(()=>{__fc.FXS.armed=true;});
  const before=await p.evaluate(()=>__fp());const ph=await p.$(`#pads [data-p="${id}"]`);await ph.scrollIntoViewIfNeeded();const bb=await ph.boundingBox();
  if(!bb){out.pads[id]='not visible';continue;}await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.mouse.down();await p.waitForTimeout(150);const mid=await p.evaluate(()=>__fp());await p.mouse.up();await p.waitForTimeout(150);const after=await p.evaluate(()=>__fp());
  out.pads[id]=(mid!==before||after!==before)?'changed':'NO EFFECT';if(out.pads[id]!=='changed')out.noEffect.push('pad:'+id);}
 // HUD buttons
 for(const id of ['bCam','bPlay','bPlay','bRec','bRec']){const b0=await p.evaluate(()=>__fp());await p.click('#'+id);await p.waitForTimeout(200);const b1=await p.evaluate(()=>__fp());out.extra[id+'_'+Math.random().toString(36).slice(2,4)]=b0!==b1?'changed':'NO EFFECT';}
 out.extra.replay=await p.evaluate(async()=>{__fc.CMD.rec={track:'x',start:__fc.songPos(),log:[]};__fc.CMD.run('pal',['ice',null]);__fc.SES().lastReplay=__fc.CMD.rec;__fc.CMD.rec=null;return __fc.SES().lastReplay.log.length;});
 for(const a of ['cine','clean','compact']){await p.evaluate(a=>{__fc.CA[a]&&__fc.CA[a]();},a);await p.waitForTimeout(100);out.extra[a]=await p.evaluate(()=>document.body.className);await p.evaluate(()=>{document.body.classList.remove('cine','clean','compact');});}
 // keyboard (desktop)
 if(vp==='desktop'){const keys={KeyJ:'flash',KeyK:'blackout',KeyP:'arm',KeyV:'cam',Enter:'go',KeyQ:'lights',KeyR:'led',KeyT:'flames',Digit2:'g2',Space:'play'};out.keys={};
  for(const [k,n] of Object.entries(keys)){await p.evaluate(k=>{__fc.FXS.cool={};if(k==='KeyT')__fc.FXS.armed=true;},k);const b0=await p.evaluate(()=>__fp());await p.keyboard.down(k);await p.waitForTimeout(120);const mid=await p.evaluate(()=>__fp());await p.keyboard.up(k);await p.waitForTimeout(120);const b1=await p.evaluate(()=>__fp());out.keys[k]=(b0!==b1||b0!==mid)?'changed':'NO EFFECT';}}
 out.D=await p.evaluate(()=>window.__D);out.errors=errs.concat(await p.evaluate(()=>__fc.ERRORS.map(e=>e.where+': '+e.msg)));
 console.log(JSON.stringify(out,null,1));await b.close();})();
