// Scoring + crowd engagement: 7 categories (Timing, Music Sync, Creativity/Variety, Crowd, Dynamics, Composition, Technical), mission metrics, post-show analysis
const ENG={e:0.3,target:0.3,spike:0,lastSpectacle:0,history:[]};
const CATS=[['timing','Timing'],['sync','Music Sync'],['creativity','Creativity / Variety'],['crowd','Crowd'],['dynamics','Dynamics'],['composition','Composition'],['technical','Technical']];
const CAT_W={timing:0.17,sync:0.18,creativity:0.15,crowd:0.2,dynamics:0.1,composition:0.1,technical:0.1};
let SCORE=null;
const ACCENTS={flash:1,bo:1,strobe:1,preset:1,cue:1,go:1,fx:1,macro:1,blind:1,laser:1};
function scoreReset(on){SCORE={on:!!on,accents:[],drops:[],samples:[],ring:[],looks:new Set(),led:new Set(),ledChanges:0,moves:new Set(),hues:new Set(),fxKinds:new Set(),pals:new Set(),cues:0,denies:0,pyroBad:0,strobeT:0,whiteT:0,playT:0,hazeSum:0,
  confetti:0,finale:{conf:false,fw:false},engMinAfter:1,firstDrop:false,sampleT:0,names:{},darkDrop:0,co2Drop:0,lastInt:0};ENG.e=0.3;ENG.history=[];}
scoreReset(false);
function SCORE_EV(kind,arg){if(!SCORE)return;if(kind==='deny')SCORE.denies++;}
function nearestBeatOff(){const bp=beatPos();return bp-Math.round(bp);}
Bus.on('cmd',(name,args,o)=>{if(!SCORE||!SEQ.playing)return;const S=SCORE;
  if(name==='preset'||name==='cue'||name==='go'){S.looks.add(name==='go'?'go'+SHOW.cueIdx:String(args[0]));if(name!=='preset')S.cues++;}
  if(name==='p'){const k=args[1];if(k==='pat')S.moves.add(args[2]);if(k==='lz')S.moves.add('lz:'+args[2]);if(k==='chase')S.moves.add('ch:'+args[2]);}
  if(name==='pal')S.pals.add(args[0]);if(name==='led'&&args[0]==='style'){S.led.add(args[1]);S.ledChanges++;}
  if(name==='fx'){const sec=curSec();if(PYRO_KINDS[args[0]]&&(sec==='break'||sec==='intro'))S.pyroBad++;}
  if(!o.manual||!ACCENTS[name])return;if((name==='flash'||name==='strobe'||name==='bo'||name==='laser')&&!args[0])return;if(name==='fx'&&!(FXS.stats.last[args[0]]>realNow()-0.05))return;
  const off=ST.quantize!=='off'&&(name==='cue'||name==='go'||name==='macro')?0.04:Math.abs(nearestBeatOff());const sc=clamp(1-(off-0.08)/0.27,0,1);S.accents.push({t:songPos(),b:beatPos(),off,sc,name});S.names[name]=(S.names[name]||0)+1;
  if(name==='fx'){S.fxKinds.add(args[0]);if(args[0]==='confetti')S.confetti++;}if(name==='macro')S.fxKinds.add('m:'+args[0]);
  const bp=beatPos();for(const d of S.drops)if(Math.abs(bp-d.b)<=1.05){d.hit=true;if(name==='fx'&&args[0]==='co2')S.co2Drop=1;}
  if(TR&&!TR.loop&&songPos()>TR.len-TR.bar*16){if(name==='fx'&&args[0]==='confetti')S.finale.conf=true;if(name==='fx'&&args[0]==='fireworks')S.finale.fw=true;if(name==='macro'&&args[0]==='finale'){S.finale.conf=S.finale.conf||(FXS.dev.confetti||[]).length>0;S.finale.fw=S.finale.fw||(FXS.dev.fireworks||[]).length>0&&G.env.outdoor;}}
  // spectacle bonus to crowd engagement when it fits the music
  const e=energyAt(bp/4);if(name==='fx'||name==='macro'||name==='flash'||name==='blind'){if(e>0.7&&off<0.2){ENG.spike=Math.min(0.25,ENG.spike+0.07);crowdCheer(0.6);CRW.boost=Math.min(1,CRW.boost+0.5);}else if(e<0.3&&name!=='fx')ENG.spike-=0.03;}});
Bus.on('mus',(k,a)=>{if(!SCORE)return;if(k==='drop'){const bp=beatPos();const pre=SCORE.ring.length?SCORE.ring.slice(-8).reduce((s,x)=>s+x,0)/Math.min(8,SCORE.ring.length):SCORE.lastInt;
  const d={b:bp,t:songPos(),pre,hit:SCORE.accents.some(x=>Math.abs(x.b-bp)<=1.05),moment:false,post:0};SCORE.drops.push(d);SCORE.firstDrop=true;setTimeout(()=>{d.post=SCORE.lastInt;if(d.pre<0.32&&d.post>0.62)d.moment=true;},Math.round((TR?TR.beat:0.5)*1100));
  if(SEQ.playing)crowdCheer(0.5);}});
function curSec(){if(!TR)return 'groove';const s=secAt(musBar(Math.floor(beatPos()/4)));return s?s.t:'groove';}
function outInt(){return clamp(FIX.stats.int*0.8+ledLevel()*0.25*SHOW.bo,0,1);}
const targetInt=m=>0.08+0.86*m;
function engTick(dt){const playing=SEQ.playing||(TR&&TR.yt&&ytPlaying());const bp=beatPos(),mus=TR?energyAt(bp/4):0.3,I=outInt(),sec=curSec();
  let t=0.3;if(playing){const match=clamp(1-Math.abs(I-targetInt(mus))*1.3,0,1);t=0.18+0.42*match;const fresh=Math.exp(-(realNow()-SHOW.lastLookT)/Math.max(20,(TR?TR.bar:2)*24));t+=0.14*fresh;
    if(mus>0.6&&FIX.stats.move>0)t+=0.08;if(mus>0.6&&FIX.stats.hues>=2)t+=0.05;if(mus>0.8&&I<0.2)t-=0.25;if(SCORE&&SCORE.playT>20&&SCORE.strobeT/SCORE.playT>0.45)t-=0.12;if(FXS.pyroL>0.3&&(sec==='break'||sec==='intro'))t-=0.1;
    if(sec==='break'&&I<0.5&&mus<0.3)t+=0.05;t*=0.75+0.35*mus;}
  ENG.spike=approach(ENG.spike,0,dt,4);ENG.target=clamp(t+ENG.spike,0,1);ENG.e=approach(ENG.e,ENG.target,dt,2.2);
  if(!SCORE||!SCORE.on||!SEQ.playing)return;const S=SCORE;S.playT+=dt;S.lastInt=I;if(FIX.stats.strobe>0||SHOW.strobeHold)S.strobeT+=dt;
  const st=FIX.stats;if(st.hues===1&&st.cols[0]==='w'&&I>0.7)S.whiteT+=dt;st.cols.forEach(h=>S.hues.add(h));S.hazeSum+=SHOW.haze*dt;if(mus>0.85&&I<0.15)S.darkDrop+=dt;
  if(S.firstDrop)S.engMinAfter=Math.min(S.engMinAfter,ENG.e);
  S.sampleT+=dt;if(S.sampleT>=0.25){S.sampleT=0;S.ring.push(I);if(S.ring.length>32)S.ring.shift();S.samples.push({t:songPos(),i:I,m:mus,e:ENG.e,s:sec,h:st.hues});}}
const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
function computeScore(){const S=SCORE,sm=S.samples,R={cats:{},metrics:{},tips:[]};
  R.cats.timing=S.accents.length>=3?avg(S.accents.map(a=>a.sc))*100:40+S.accents.length*5;
  const match=avg(sm.map(x=>clamp(1-Math.abs(x.i-targetInt(x.m))*1.5,0,1))),hits=S.drops.filter(d=>d.hit).length;
  R.cats.sync=100*(0.65*match+0.35*(S.drops.length?hits/S.drops.length:0.5));
  let cr=S.looks.size*7+S.led.size*5+S.moves.size*3+Math.min(8,S.hues.size)*3+S.fxKinds.size*5+S.pals.size*4+(S.cues?8:0);const tot=S.accents.length,top=Math.max(0,...Object.values(S.names));if(tot>8&&top/tot>0.6)cr*=0.85;R.cats.creativity=Math.min(100,cr);
  R.cats.crowd=avg(sm.map(x=>x.e))*100*1.15;
  const dI=avg(sm.filter(x=>x.s==='drop'||x.s==='peak').map(x=>x.i)),bI=avg(sm.filter(x=>x.s==='break').map(x=>x.i));const moments=S.drops.filter(d=>d.moment).length;
  R.cats.dynamics=(sm.some(x=>x.s==='break')&&sm.some(x=>x.s==='drop'))?(dI-bI)*110+moments*12+15:(Math.max(0,...sm.map(x=>x.i))-Math.min(1,...sm.map(x=>x.i)))*80+moments*12;
  const sf=S.playT?S.strobeT/S.playT:0,wf=S.playT?S.whiteT/S.playT:0,ah=avg(sm.map(x=>x.h));
  R.cats.composition=100-Math.max(0,sf-0.3)*150-Math.max(0,ah-4)*8-Math.max(0,wf-0.35)*60-S.pyroBad*6-(sm.length&&avg(sm.map(x=>x.i))<0.12?30:0);
  R.cats.technical=100-S.denies*7-S.pyroBad*5-S.darkDrop*2.5;
  for(const k in R.cats)R.cats[k]=Math.round(clamp(R.cats[k],0,100));
  R.overall=Math.round(CATS.reduce((s,[k])=>s+R.cats[k]*CAT_W[k],0));
  const M=R.metrics;Object.assign(M,R.cats);M.overall=R.overall;M.dropHit=hits;M.looks=S.looks.size;M.calmBreak=sm.some(x=>x.s==='break')&&bI<0.45?1:0;M.ledChanges=S.ledChanges;M.engAvg=Math.round(avg(sm.map(x=>x.e))*100);M.co2Drop=S.co2Drop;
  M.moments=moments;M.finale=S.finale.conf&&S.finale.fw?1:0;M.holdCrowd=S.firstDrop&&S.engMinAfter>=0.4?1:0;M.haze=S.playT&&S.hazeSum/S.playT>=0.6?1:0;M.noConfetti=S.confetti===0?1:0;
  // tips for the weakest categories
  const order=CATS.map(c=>c[0]).sort((a,b)=>R.cats[a]-R.cats[b]);const TIP={timing:'Hit flashes, cues and pyro right on the beat: watch the beat dot, or set quantize to "beat" for cues.',sync:'Follow the music energy: calm looks in breakdowns, full rig on drops. Fire something within one beat of every drop.',
    creativity:'Use more variety: different presets/cues, movement patterns, LED styles, palettes and effect types.',crowd:'Keep the crowd engaged: change the look every few phrases and give them big moments on drops.',dynamics:'Create contrast: go dark or minimal right before a drop, then hit it hard.',
    composition:'Keep it coherent: 2–3 colours at a time, do not leave strobes running constantly, no pyro in breakdowns.',technical:'Avoid failed actions (pyro not armed, missing gear) and dark drops.'};
  R.tips=order.slice(0,3).filter(k=>R.cats[k]<85).map(k=>TIP[k]);if(!R.tips.length)R.tips.push('Excellent show! Try a bigger venue or a challenge.');
  R.samples=sm;R.drops=S.drops.map(d=>({t:d.t,hit:d.hit,moment:d.moment}));R.accents=S.accents.length;R.sf=sf;return R;}
function liveScore(){if(!SCORE||!SCORE.on||SCORE.samples.length<8)return null;try{return computeScore().overall;}catch(e){return null;}}
