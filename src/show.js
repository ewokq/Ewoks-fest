// Show state: masters, palettes, groups, selection, looks/presets, cues + GO, timeline programs, automation modes, macros (quantized), all mutations via CMD
const SHOW={master:1,speed:1,blackout:false,bo:1,flash:0,flashHeld:false,flashSet:null,flashT:0,strobeHold:false,haze:0.4,pal:'main',preset:'',
  led:{style:'geo',trans:'cross',tt:1,spd:0.5,bri:0.9,cm:'pal',mono:'#ffffff',react:0.6,sym:0,flash:true},armed:false,fb:0,cueIdx:-1,mode:'live',lastLookT:0,lzOn:false};
const AUTO={mode:'manual'};
let SES=null; // session (set by startSession)
const SEL={ids:[],grp:'all'};
const QUEUE=[];// [beat, fn]
function curPalette(){return (PALMAP[SHOW.pal]||PALETTES[0]).c;}
// ---- groups ----
function builtinGroups(){const L=FIX.list,by=t=>L.filter(f=>f.type===t).map(f=>f.id),gs=[['all','All',L.map(f=>f.id)]];
  RIG_TYPES.forEach(t=>{const ids=by(t);if(ids.length)gs.push([t,TYPE_NAME[t]+'s',ids]);});
  gs.push(['movers','Movers',L.filter(f=>f.type==='beam'||f.type==='spot').map(f=>f.id)],['left','Left',L.filter(f=>f.side<0).map(f=>f.id)],['center','Centre',L.filter(f=>f.side===0).map(f=>f.id)],['right','Right',L.filter(f=>f.side>0).map(f=>f.id)],
    ['odd','Odd',L.filter(f=>f.ci%2===0).map(f=>f.id)],['even','Even',L.filter(f=>f.ci%2===1).map(f=>f.id)],['floor','Floor beams',L.filter(f=>f.up).map(f=>f.id)]);
  return gs.filter(g=>g[2].length);}
function allGroups(){const b=builtinGroups();(SAVE.groups||[]).forEach(g=>{const ids=g.ids.filter(id=>FIX.map[id]);if(ids.length)b.push(['u:'+g.name,g.name,ids,true]);});return b;}
function groupIds(gid){const g=allGroups().find(x=>x[0]===gid);return g?g[2]:[];}
function selFix(){return SEL.ids.map(id=>FIX.map[id]).filter(Boolean);}
// ---- parameter writes (layering: assisted/programmed automation owns the base layer, live edits become overrides) ----
function layerKey(o){return (o&&o.layer)||(AUTO.mode==='manual'?'base':'ovr');}
function setP(ids,k,v,layer){for(const id of ids){const f=FIX.map[id];if(!f||!TYPE_PARAMS[f.type].includes(k))continue;if(layer==='base'){f.base[k]=v;delete f.ovr[k];}else f.ovr[k]=v;}}
function hasOverrides(){return FIX.list.some(f=>Object.keys(f.ovr).length);}
function effParams(f){return Object.assign({},f.base,f.ovr);}
// ---- looks ----
function snapshotLook(){const fx={};FIX.list.forEach(f=>fx[f.id]=effParams(f));return {pal:SHOW.pal,fx,led:Object.assign({},SHOW.led),haze:SHOW.haze};}
const POS_KEYS=['pat','spd','rng','phs','pan','tilt','sync','dir','lz'],COL_KEYS=['col','col2'];
function lookFromTypes(types,o){o=o||{};const fx={};FIX.list.forEach(f=>{const t=types[f.type]||types.all;if(!t)return;fx[f.id]=Object.assign({},typeof t==='function'?t(f):t);});return Object.assign({fx},o);}
function palCols(id){return (PALMAP[id]||PALETTES[0]).c;}
function builtinLook(id){const pc=palCols(SHOW.pal),c0=pc[0],c1=pc[1],c2=pc[2],c3=pc[3],off={on:false};const sty=ledOk;
  switch(id){
   case 'blue':return lookFromTypes({beam:{on:true,int:0.45,col:'#1f4dff',col2:'#20e3ff',pat:'fan',rng:0.5,spd:0.2,chase:'wave',sync:'4',tilt:0.1},spot:{on:true,int:0.35,col:'#2a6bff',gobo:'dots',pat:'circle',spd:0.15,rng:0.3},wash:{on:true,int:0.7,col:'#0a2aff',chase:'none'},strobe:off,blinder:off,pixel:{on:true,int:0.5,col:'#1f4dff',pxPat:'solid'},laser:off},{led:{style:sty('gradient'),cm:'mono',mono:'#2a6bff'},haze:0.6});
   case 'white':return lookFromTypes({all:{on:true,int:1,col:'#ffffff',col2:'#ffffff',chase:'none',pat:'static',strobe:0},laser:{on:true,int:1,col:'#ffffff',col2:'#ffffff',lz:'sheet'},strobe:{on:true,int:1,col:'#ffffff',strobe:0}},{led:{style:sty('mono'),cm:'mono',mono:'#ffffff'}});
   case 'redfan':return lookFromTypes({beam:{on:true,int:0.9,col:'#ff1a10',col2:'#ff6a00',pat:'fan',rng:0.85,spd:0.3,tilt:0.15,chase:'none'},spot:{on:true,int:0.6,col:'#ff3a20',pat:'hsweep',spd:0.3},wash:{on:true,int:0.55,col:'#ff2010'},strobe:off,blinder:off,pixel:{on:true,int:0.6,col:'#ff2010',col2:'#ff8000',pxPat:'chase'},laser:{on:true,int:0.7,col:'#ff2010',col2:'#ff6a00',lz:'fan'}},{led:{style:sty('geo'),cm:'pal'},pal:'inferno'});
   case 'purple':return lookFromTypes({beam:{on:true,int:0.25,col:'#8a3bff',pat:'vsweep',spd:0.1,rng:0.4,chase:'none'},spot:{on:true,int:0.4,col:'#b070ff',gobo:'ring',pat:'circle',spd:0.1},wash:{on:true,int:0.5,col:'#6a1bff',chase:'wave',sync:'8'},strobe:off,blinder:off,pixel:{on:true,int:0.4,col:'#8a3bff',pxPat:'sparkle'},laser:off},{led:{style:sty('liquid','waves'),cm:'mono',mono:'#8a3bff'},haze:0.75});
   case 'cyantunnel':return lookFromTypes({beam:{on:false},spot:{on:true,int:0.3,col:'#20e3ff',pat:'static'},wash:{on:true,int:0.25,col:'#0aa0ff'},strobe:off,blinder:off,pixel:{on:true,int:0.4,col:'#20e3ff',pxPat:'chase'},laser:{on:true,int:1,col:'#20e3ff',col2:'#ffffff',lz:'tunnel',spd:0.5,rng:0.6}},{led:{style:sty('tunnel','eq'),cm:'mono',mono:'#20e3ff'},haze:0.8});
   case 'maindrop':return lookFromTypes({beam:f=>({on:true,int:1,col:c0,col2:c1,pat:'circle',spd:0.6,rng:0.7,phs:0.6,chase:'pulse',sync:'1',tilt:0.1}),spot:{on:true,int:0.8,col:c3,col2:c2,pat:'fig8',spd:0.5,gobo:'stripes'},wash:{on:true,int:0.9,col:c1,col2:c2,chase:'colorAlt',sync:'2'},strobe:{on:true,int:1,col:'#ffffff',strobe:0.65},blinder:{on:true,int:1,chase:'alt',sync:'2'},pixel:{on:true,int:1,col:c0,col2:c1,pxPat:'split'},laser:{on:true,int:1,col:c0,col2:c1,lz:'scan',spd:0.6}},{led:{style:sty('eq'),cm:'pal'}});
   case 'blackout':return lookFromTypes({all:{on:false}});
   case 'finale':return lookFromTypes({beam:{on:true,int:1,col:c0,col2:c1,pat:'rotfan',spd:0.7,rng:0.9,chase:'colorWave',sync:'2'},spot:{on:true,int:1,col:'#ffffff',pat:'random',spd:0.7,gobo:'star'},wash:{on:true,int:1,col:c1,col2:c0,chase:'colorWave',sync:'4'},strobe:{on:true,int:1,col:'#ffffff',strobe:0.5},blinder:{on:true,int:1,chase:'random'},pixel:{on:true,int:1,pxPat:'rainbow'},laser:{on:true,int:1,col:c0,col2:c2,lz:'star',spd:0.7}},{led:{style:sty('rhythm'),cm:'pal'}});
   case 'build':return lookFromTypes({beam:{on:true,int:0.7,col:c0,col2:c1,pat:'vsweep',spd:0.5,chase:'build',sync:'4'},spot:{on:true,int:0.6,col:c3,pat:'circle',spd:0.5},wash:{on:true,int:0.6,col:c1,chase:'pulse',sync:'1'},strobe:{on:true,int:0.6,strobe:0.25},blinder:off,pixel:{on:true,int:0.8,col:c0,pxPat:'vu'},laser:off},{led:{style:sty('rotate','geo'),cm:'pal'}});
   case 'groove':return lookFromTypes({beam:{on:true,int:0.75,col:c0,col2:c1,pat:'hsweep',spd:0.35,rng:0.6,chase:'alt',sync:'2'},spot:{on:true,int:0.5,col:c2,pat:'circle',spd:0.25,gobo:'dots'},wash:{on:true,int:0.6,col:c1,col2:c0,chase:'wave',sync:'4'},strobe:off,blinder:off,pixel:{on:true,int:0.7,col:c0,col2:c1,pxPat:'chase'},laser:{on:true,int:0.6,col:c0,col2:c1,lz:'wave',spd:0.3}},{led:{style:sty('waves','geo'),cm:'pal'}});}
  return null;}
function ledOk(s,alt){return ledUnlocked(s)?s:(alt&&ledUnlocked(alt)?alt:'geo');}
function ledUnlocked(s){if(!SES||SES.mode!=='career')return true;if(LED_STARTER.includes(s))return true;if(LED_PACK_A.includes(s))return SAVE.owned.includes('led_a');if(LED_PACK_B.includes(s))return SAVE.owned.includes('led_b');return false;}
// apply a look: trans snap|fade|color|pos, tt in beats, wave staggers fixtures left-to-right
function applyLook(look,o){if(!look)return;o=o||{};const layer=o.layer||layerKey(),tr=o.trans||'snap',tt=Math.max(0,o.tt==null?1:o.tt),beat=TR?TR.beat:0.5,dur=tr==='snap'?0:tt*beat,now=realNow();
  const keys=tr==='color'?COL_KEYS:tr==='pos'?POS_KEYS:null;
  const doF=f=>{const p=look.fx[f.id];if(!p)return;const src=keys?Object.fromEntries(keys.filter(k=>k in p).map(k=>[k,p[k]])):p;
    if(dur>0)f.xf={u:now+dur*1.2,tau:dur/3};else f.xf={u:now+0.05,tau:0.02};
    for(const k in src){if(!TYPE_PARAMS[f.type].includes(k))continue;if(layer==='base'){f.base[k]=src[k];delete f.ovr[k];}else f.ovr[k]=src[k];}};
  if(o.wave&&tt>0){const L=FIX.list.slice().sort((a,b)=>a.pos.x-b.pos.x),bp=beatPos();L.forEach((f,i)=>QUEUE.push([bp+i/Math.max(1,L.length-1)*tt,()=>doF(f)]));}else FIX.list.forEach(doF);
  if(!keys||tr==='color'){if(look.pal&&!keys){SHOW.pal=look.pal;}if(look.led&&!keys){const st=look.led.style;Object.assign(SHOW.led,look.led);if(st&&st!==LEDRT.cur){ledSwitch(st,SHOW.led.trans,SHOW.led.tt*beat);}}if(look.haze!=null&&!keys)SHOW.haze=look.haze;}
  SHOW.lastLookT=now;Bus.emit('look',o.name||'');}
// ---- quantized actions ----
function quantBeat(){const q=ST.quantize;if(q==='off'||!SEQ.playing)return null;const bp=beatPos(),d=q==='bar'?4:q==='half'?0.5:1,ph=bp/d-Math.floor(bp/d);if(ph<0.12)return null;return Math.ceil(bp/d)*d;}
function quantized(fn){const b=quantBeat();if(b==null)fn();else QUEUE.push([b,fn]);}
function runQueue(){const bp=beatPos();for(let i=QUEUE.length-1;i>=0;i--){if(QUEUE[i][0]<=bp+0.005){const f=QUEUE[i][1];QUEUE.splice(i,1);try{f();}catch(e){reportError(e,'queue');}}}}
// ---- macros ----
function runMacro(id){const m=MACROS.find(x=>x.id===id)||(SAVE.macros||[]).find(x=>x.id===id);if(!m)return false;const b0=quantBeat()??beatPos();
  m.steps.forEach(st=>{const [ob,act,a1,a2]=st;QUEUE.push([b0+ob,()=>{if(act==='flash')doFlashHit(1);else if(act==='blackout')CMD.run('bo',[!!a1],{auto:true});else if(act==='fx'){const r=fxFire(a1,a2||{});if(!r.ok)fxDenied(r);}else if(act==='blind')blindHit();}]);});
  SCORE_EV('macro',id);return true;}
function doFlashHit(v){SHOW.flash=Math.max(SHOW.flash,v);SHOW.flashT=realNow();SHOW.flashSet=null;}
function blindHit(){const ids=new Set(FIX.list.filter(f=>f.type==='blinder'||f.type==='strobe').map(f=>f.id));if(!ids.size)return false;SHOW.flash=1;SHOW.flashSet=ids;SHOW.flashT=realNow();sfx('blinder',0.5);return true;}
function fxDenied(r){toast(r.reason,1800);sfx('deny');SCORE_EV('deny',r.reason);}
// ---- cues ----
function cueById(id){return (SAVE.cues||[]).find(c=>c.id===id);}
function sessionCues(){return (SAVE.cues||[]);}
function fireCue(c,o){if(!c)return;applyLook(c.look,{trans:c.trans,tt:c.tt,wave:c.wave,name:c.name,layer:o&&o.layer});SHOW.preset=c.name;if(c.fx)runMacro(c.fx);SHOW.cueIdx=sessionCues().indexOf(c);}
// ---- palettes ----
function applyPalette(id,ids,layer){const pc=palCols(id);SHOW.pal=id;const L=ids?ids.map(i=>FIX.map[i]).filter(Boolean):FIX.list;
  L.forEach(f=>{const k=RIG_TYPES.indexOf(f.type);const a=pc[k%4],b=pc[(k+1)%4];setP([f.id],'col',f.type==='strobe'||f.type==='blinder'?(id==='mono'?'#ffffff':mixHex(a,'#ffffff',0.6)):a,layer);setP([f.id],'col2',b,layer);});}
// ---- commands (recorded, replayable, scored) ----
CMD.def('sel',(ids,grp)=>{SEL.ids=ids.filter(id=>FIX.map[id]);SEL.grp=grp||'';Bus.emit('sel');});
CMD.def('p',(ids,k,v)=>{setP(ids,k,v,layerKey());Bus.emit('param',k);});
CMD.def('release',ids=>{(ids?ids.map(i=>FIX.map[i]).filter(Boolean):FIX.list).forEach(f=>{f.ovr={};f.xf={u:realNow()+0.6,tau:0.2};});Bus.emit('param','release');});
CMD.def('pal',(id,ids)=>{applyPalette(id,ids,layerKey());Bus.emit('param','pal');});
CMD.def('master',v=>{SHOW.master=clamp(v,0,1);});CMD.def('speed',v=>{SHOW.speed=clamp(v,0.25,4);});
CMD.def('bo',on=>{SHOW.blackout=!!on;Bus.emit('bo',SHOW.blackout);});
CMD.def('flash',(v,ids)=>{SHOW.flashHeld=!!v;if(v){SHOW.flash=1;SHOW.flashT=realNow();SHOW.flashSet=ids&&ids.length?new Set(ids):null;}});
CMD.def('strobe',on=>{SHOW.strobeHold=!!on;});
CMD.def('haze',v=>{SHOW.haze=clamp(v,0,1);});
CMD.def('led',(k,v)=>{if(k==='style'){if(!ledUnlocked(v)){toast('LED pack not owned (career shop)');return false;}ledSwitch(v,SHOW.led.trans,SHOW.led.tt*(TR?TR.beat:0.5));SHOW.led.style=v;}else SHOW.led[k]=v;Bus.emit('led',k);return true;});
CMD.def('preset',id=>{let look=builtinLook(id),nm=(PRESET_NAMES.find(p=>p[0]===id)||[])[1];if(!look){const p=(SAVE.presets||[]).find(x=>x.id===id);if(!p)return false;look=p.look;nm=p.name;}applyLook(look,{trans:'fade',tt:0.25,name:nm});SHOW.preset=nm;return true;});
CMD.def('cue',id=>{const c=cueById(id);if(!c)return false;quantized(()=>fireCue(c));return true;});
CMD.def('go',()=>{const L=sessionCues();if(!L.length){toast('No cues yet: record one in the CUES tab');return false;}const c=L[(SHOW.cueIdx+1)%L.length];quantized(()=>fireCue(c));return true;});
CMD.def('fx',(kind,o)=>{const r=fxFire(kind,o||{});if(!r.ok)fxDenied(r);return r.ok;});
CMD.def('arm',on=>{if(on&&SES&&SES.paused){toast('Resume the show to arm pyro');return false;}fxArm(on);SHOW.armed=FXS.armed;return true;});
CMD.def('macro',id=>runMacro(id));
CMD.def('blind',()=>{const ok=blindHit();if(!ok)toast('No blinders or strobes in your rig');return ok;});
CMD.def('auto',m=>{AUTO.mode=m;if(m==='manual'){FIX.list.forEach(f=>{Object.assign(f.base,f.ovr);f.ovr={};});}if(m==='assisted')autoSection(true);Bus.emit('auto',m);});
CMD.def('laser',on=>{SHOW.lzOn=!!on;setP(FIX.list.filter(f=>f.type==='laser').map(f=>f.id),'on',!!on,layerKey());return (FIX.byType.laser||[]).length>0;});
// ---- automation ----
const SEC_LOOK={intro:'blue',groove:'groove',build:'build',drop:'maindrop',main:'redfan',break:'purple',peak:'finale',outro:'blue'};
let autoSecI=-1;
function autoSection(force){if(!TR||AUTO.mode!=='assisted')return;const s=secAt(musBar(Math.floor(beatPos()/4)));if(!s)return;if(!force&&s.i===autoSecI)return;autoSecI=s.i;
  const look=builtinLook(SEC_LOOK[s.t]||'groove');if(look){look.pal=null;applyLook(look,{layer:'base',trans:s.t==='drop'?'snap':'fade',tt:s.t==='drop'?0:2});}}
function programTick(prevB,bp){if(AUTO.mode!=='programmed'||!TR)return;const P_=SAVE.programs[TR.id];if(!P_||!P_.ev.length)return;if(bp<prevB||bp-prevB>8)return;
  for(const e of P_.ev){if(e.b>prevB&&e.b<=bp){const c=cueById(e.cue);if(c)fireCue(c,{layer:'base'});}}}
function placeProgram(cueId,beat){if(!TR)return;const P_=SAVE.programs[TR.id]=SAVE.programs[TR.id]||{ev:[]};const b=Math.round(beat/4)*4;P_.ev=P_.ev.filter(e=>Math.abs(e.b-b)>0.01);P_.ev.push({b,cue:cueId});P_.ev.sort((a,b)=>a.b-b.b);dirty();return b;}
// ---- per-frame ----
let _prevFB=0,_prevBP=0;
function showTick(dt){const bp=beatPos();if(SEQ.playing){SHOW.fb+=(bp-_prevBP)*SHOW.speed;if(Math.abs(bp-_prevBP)>8)SHOW.fb=bp;}programTick(_prevBP,bp);_prevBP=bp;runQueue();if(SEQ.playing)autoSection(false);
  SHOW.bo=approach(SHOW.bo,SHOW.blackout?0:1,dt,SHOW.blackout?0.04:0.08);
  if(!SHOW.flashHeld)SHOW.flash=Math.max(0,SHOW.flash-dt*(SHOW.flashSet?5:4));
  G.HZ.value=approach(G.HZ.value,SHOW.haze,dt,1.5);}
function fixCtx(){const grp=null;return {bp:SHOW.fb,master:SHOW.master,bo:SHOW.bo,flash:SHOW.flash,flashSet:SHOW.flashSet,strobeHold:SHOW.strobeHold,strobeSet:null,grp};}
// ---- export / import show (JSON) ----
function exportShow(){return {format:'festival-control-show',v:1,version:VERSION,exported:new Date().toISOString(),track:TR?TR.id:null,groups:SAVE.groups,presets:SAVE.presets,cues:SAVE.cues,programs:SAVE.programs,ledPresets:SAVE.ledPresets,macros:SAVE.macros,
  replay:CMD.rec?{track:CMD.rec.track,log:CMD.rec.log}:(SES&&SES.lastReplay)||null};}
function importShow(o){if(!o||o.format!=='festival-control-show')throw new Error('Not a Festival Control show file');const ok=(a,f)=>Array.isArray(a)?a.filter(f).slice(0,200):[];
  SAVE.groups=ok(o.groups,g=>g&&typeof g.name==='string'&&Array.isArray(g.ids));SAVE.presets=ok(o.presets,p=>p&&typeof p.name==='string'&&p.look&&p.look.fx);SAVE.cues=ok(o.cues,c=>c&&typeof c.id==='string'&&c.look&&c.look.fx);
  if(o.programs&&typeof o.programs==='object'){for(const k in o.programs){const p=o.programs[k];if(p&&Array.isArray(p.ev))SAVE.programs[k]={ev:p.ev.filter(e=>Number.isFinite(e.b)&&typeof e.cue==='string')};}}dirty();persist(false);}
