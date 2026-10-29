// Audio: Web Audio procedural music engine, transport (play/pause/seek/loop), analyser, gain buses, crowd + ambience + SFX
const A={ctx:null,ok:false};
let TR=null; // current track model
const ACID=[0,0,12,0,3,0,7,12,0,10,0,3,0,15,7,0],ACID_ON=[1,0,1,1,1,0,1,1,1,1,0,1,1,1,0,1];
const ARP=[0,1,2,1,2,0,1,2,0,2,1,2,0,1,2,1], HOOK=[0,-1,2,-1,1,-1,2,0,-1,2,-1,1,2,-1,1,-1];
const mtof=m=>440*Math.pow(2,(m-69)/12);
function buildReal(t,o){const r=t.real,g=GMAP[t.g]||GENRES[1],bpm=r.bpm,beat=60/bpm,bar=beat*4;let a0=0,a1=r.bars;if(o.short){a0=r.short[0];a1=r.short[1];}
  let S=r.secs.filter(x=>x[1]>a0&&x[0]<a1).map(x=>[Math.max(x[0],a0)-a0,Math.min(x[1],a1)-a0,x[2],x[3]]);const nb=a1-a0,L=S[S.length-1];
  if(L[2]!=='outro'&&L[1]-L[0]>2){L[1]-=2;S.push([nb-2,nb,'outro','OUTRO']);}else if(L[2]!=='outro'){L[2]='outro';L[3]='OUTRO';}
  if(S[0][2]==='drop'&&o.short){} // short windows always start before a build
  const secs=S.map((x,i)=>({i,n:x[3],t:x[2],a:x[0],b:x[1],e:SEC_ENERGY[x[2]]}));
  const tr={id:t.id,title:t.title,artist:t.artist,dj:DJMAP[t.dj]||DJS[0],g,st:g.st,bpm,beat,secs,bars:nb,prog:g.prog,loop:false,short:!!o.short,yt:false,
    file:r.file,fileT0:r.off+a0*bar,real:r,genre:t.genre};
  tr.bar=bar;tr.step=beat/4;tr.loopA=0;tr.loopB=nb;tr.len=nb*bar;
  tr.markers=[];secs.forEach(s=>{if(s.i>0)tr.markers.push({bar:s.a,kind:s.t,name:s.n,imp:s.t==='drop'?1:s.t==='build'||s.t==='break'||s.t==='peak'?0.6:0.35});});
  return tr;}
function buildTrack(id,o){o=o||{};const t=TMAP[id]||TMAP.bigroom, g=GMAP[t.g];if(t.real&&!o.synth)return buildReal(t,o);
  let arr=(t.arr||g.arr).slice(); if(o.short) arr=arr.map(x=>Math.max(4,Math.round(x/2/4)*4));
  const bpm=o.bpm||t.bpm||g.bpm; let b=0;
  const secs=arr.map((l,i)=>{const s={i,n:SEC_NAMES[i][0],t:SEC_NAMES[i][1],a:b,b:b+l,e:SEC_ENERGY[SEC_NAMES[i][1]]};b+=l;return s;});
  const tr={id:t.id,title:t.title,dj:DJMAP[t.dj]||DJS[0],g,st:g.st,bpm,beat:60/bpm,secs,bars:b,prog:g.prog,loop:!!o.loop||id==='tutorial',short:!!o.short,yt:false};
  tr.bar=tr.beat*4;tr.step=tr.beat/4;tr.loopA=secs[1].a;tr.loopB=secs[8].b;tr.len=tr.bars*tr.bar;
  tr.markers=[];secs.forEach(s=>{if(s.i>0)tr.markers.push({bar:s.a,kind:s.t,name:s.n,imp:s.t==='drop'?1:s.t==='build'||s.t==='break'||s.t==='peak'?0.6:0.35});});
  return tr;}
function musBar(bar){if(!TR)return bar;if(!TR.loop||bar<TR.loopB)return bar;return TR.loopA+((bar-TR.loopA)%(TR.loopB-TR.loopA));}
function secAt(mb){if(TR.yt)return ytSecAt(mb);const S=TR.secs;for(const s of S)if(mb>=s.a&&mb<s.b)return s;return mb<0?S[0]:S[S.length-1];}
function energyAt(barF){if(!TR)return 0.5;const mb=musBar(Math.max(0,barF)),s=secAt(Math.floor(mb));if(TR.yt)return s.e;
  const p=(mb-s.a)/(s.b-s.a);if(s.t==='build')return lerp(0.42,0.92,p);if(s.t==='outro')return lerp(0.4,0.12,p);if(s.t==='intro')return lerp(0.15,0.32,p);return s.e;}
function initAudio(){
  if(A.ctx){if(A.ctx.state==='suspended'&&!document.hidden)A.ctx.resume().catch(()=>{});return;}
  try{if(navigator.audioSession&&!YT.mic)navigator.audioSession.type='playback';}catch(e){}
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  let c;try{c=new AC({latencyHint:'interactive'});}catch(e){try{c=new AC();}catch(e2){return;}}
  A.ctx=c;A.ok=true;
  const lim=c.createDynamicsCompressor();lim.threshold.value=-10;lim.knee.value=6;lim.ratio.value=8;lim.attack.value=0.002;lim.release.value=0.18;
  A.master=c.createGain();lim.connect(A.master);A.master.connect(c.destination);A.lim=lim;
  A.an=c.createAnalyser();A.an.fftSize=1024;A.an.smoothingTimeConstant=0.6;A.fbin=new Uint8Array(A.an.frequencyBinCount);A.tbin=new Uint8Array(A.an.fftSize);
  A.musicBus=c.createGain();A.musicBus.connect(lim);A.musicBus.connect(A.an);
  A.crowdBus=c.createGain();A.crowdBus.connect(lim);A.envBus=c.createGain();A.envBus.connect(lim);A.fxBus=c.createGain();A.fxBus.connect(lim);A.uiBus=c.createGain();A.uiBus.connect(lim);
  const len=c.sampleRate*2,buf=c.createBuffer(1,len,c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;A.noise=buf;
  // crowd bed (noise through formant-ish band) + ambience
  const src=c.createBufferSource();src.buffer=buf;src.loop=true;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=950;bp.Q.value=0.55;
  A.crowdG=c.createGain();A.crowdG.gain.value=0;src.connect(bp);bp.connect(A.crowdG);A.crowdG.connect(A.crowdBus);src.start();
  const s2=c.createBufferSource();s2.buffer=buf;s2.loop=true;s2.playbackRate.value=0.7;A.ambF=c.createBiquadFilter();A.ambF.type='lowpass';A.ambF.frequency.value=400;A.ambG=c.createGain();A.ambG.gain.value=0;s2.connect(A.ambF);A.ambF.connect(A.ambG);A.ambG.connect(A.envBus);s2.start();
  newChain();setVolumes();
  try{const s=c.createBufferSource();s.buffer=c.createBuffer(1,1,22050);s.connect(c.destination);s.start(0);}catch(e){}
  if(c.state!=='running')c.resume().catch(()=>{});
  c.onstatechange=()=>Bus.emit('audiostate',c.state);
}
function setVolumes(){if(!A.ctx)return;const v=ST.vol,t=A.ctx.currentTime;const s=(n,x)=>n.gain.setTargetAtTime(x,t,0.05);
  s(A.master,v.master*0.9);s(A.musicBus,TR&&TR.yt?0:v.music);s(A.crowdBus,v.crowd);s(A.envBus,v.env);s(A.fxBus,v.fx);s(A.uiBus,v.ui);}
// ===== v2.2 synth engine: mix bus with reverb/delay sends, sidechain pump, filter sweeps and a mastering stage =====
function makeIR(c,sec,decay,pre){const sr=c.sampleRate,n=Math.floor(sr*sec),b=c.createBuffer(2,n,sr),p=Math.floor(sr*(pre||0.012));
  for(let k=0;k<2;k++){const d=b.getChannelData(k);let lp=0;for(let i=0;i<n;i++){const x=i/n,w=Math.random()*2-1;lp+=(w-lp)*(0.35+0.6*(1-x));d[i]=i<p?0:lp*Math.pow(1-x,decay);}}return b;}
function satCurve(drive){const n=2048,cv=new Float32Array(n),k=Math.tanh(drive);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;cv[i]=Math.tanh(x*drive)/k;}return cv;}
// a "chain" owns all music voices; seeking/pausing fades the old chain out and builds a fresh one (cuts tails cleanly)
function newChain(){const c=A.ctx,old=A.ch;const ch={};if(!A.irHall){A.irHall=makeIR(c,2.8,3.4,0.02);A.irPlate=makeIR(c,1.1,2.2,0.004);A.cv={soft:satCurve(1.4),warm:satCurve(2.5),hard:satCurve(9),gnarl:satCurve(18)};}
  ch.out=c.createGain();ch.out.connect(A.musicBus);
  // mastering: tone shelves -> glue compressor -> soft clipper -> (global limiter)
  const ls=c.createBiquadFilter();ls.type='lowshelf';ls.frequency.value=120;ls.gain.value=-6;const pk=c.createBiquadFilter();pk.type='peaking';pk.frequency.value=2800;pk.Q.value=0.7;pk.gain.value=2.5;const hs=c.createBiquadFilter();hs.type='highshelf';hs.frequency.value=7000;hs.gain.value=5;
  ch.comp=c.createDynamicsCompressor();ch.comp.threshold.value=-16;ch.comp.ratio.value=3;ch.comp.knee.value=8;ch.comp.attack.value=0.012;ch.comp.release.value=0.16;
  const clip=c.createWaveShaper();clip.curve=A.cv.soft;clip.oversample='2x';const mk=c.createGain();mk.gain.value=0.92;
  ch.bus=c.createGain();ch.bus.connect(ls);ls.connect(pk);pk.connect(hs);hs.connect(ch.comp);ch.comp.connect(clip);clip.connect(mk);mk.connect(ch.out);
  ch.drums=c.createGain();ch.drums.gain.value=0.9;ch.drums.connect(ch.bus);
  // music path: sidechain pump (duck) -> sweepable high-pass -> sweepable low-pass -> bus
  ch.duck=c.createGain();ch.hp=c.createBiquadFilter();ch.hp.type='highpass';ch.hp.frequency.value=12;ch.hp.Q.value=0.9;ch.lp=c.createBiquadFilter();ch.lp.type='lowpass';ch.lp.frequency.value=20000;ch.lp.Q.value=1.1;
  ch.duck.connect(ch.hp);ch.hp.connect(ch.lp);ch.lp.connect(ch.bus);ch.music=c.createGain();ch.music.gain.value=0.5;ch.music.connect(ch.duck);
  // stereo ping-pong delay send
  const B=TR?TR.beat:0.47,dl=c.createDelay(2),dr=c.createDelay(2);dl.delayTime.value=B*0.75;dr.delayTime.value=B*0.75;const fb=c.createGain();fb.gain.value=0.38;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3200;const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=300;
  const mg=c.createChannelMerger(2);ch.send=c.createGain();ch.send.gain.value=0.3;ch.send.connect(hp);hp.connect(dl);dl.connect(lp);lp.connect(dr);dr.connect(fb);fb.connect(dl);lp.connect(mg,0,0);dr.connect(mg,0,1);const dg=c.createGain();dg.gain.value=0.8;mg.connect(dg);dg.connect(ch.duck);ch.dl=dl;ch.dr=dr;
  // reverb sends: hall (pumped with the music) and plate (drums)
  ch.rev=c.createGain();ch.rev.gain.value=1;const cv=c.createConvolver();cv.buffer=A.irHall;const rg=c.createGain();rg.gain.value=0.5;ch.rev.connect(cv);cv.connect(rg);rg.connect(ch.duck);
  ch.plate=c.createGain();const cp=c.createConvolver();cp.buffer=A.irPlate;const pg=c.createGain();pg.gain.value=0.45;const php=c.createBiquadFilter();php.type='highpass';php.frequency.value=500;ch.plate.connect(php);php.connect(cp);cp.connect(pg);pg.connect(ch.bus);
  A.ch=ch;A.dist=null;A.rum=null;
  if(old){const t=c.currentTime;old.out.gain.cancelScheduledValues(t);old.out.gain.setValueAtTime(old.out.gain.value,t);old.out.gain.linearRampToValueAtTime(0,t+0.08);setTimeout(()=>{try{old.out.disconnect();}catch(e){}},400);}
}
function env(g,t,a,peak,dec){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(peak,0.0002),t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+dec);}
function sendTo(src,dest,v){const g=A.ctx.createGain();g.gain.value=v;src.connect(g);g.connect(dest);return g;}
function noiseHit(t,dur,type,freq,q,vol,dest,att){const c=A.ctx,s=c.createBufferSource();s.buffer=A.noise;const f=c.createBiquadFilter();f.type=type;f.frequency.setValueAtTime(freq,t);f.Q.value=q;const g=c.createGain();env(g,t,att||0.001,vol,dur);s.connect(f);f.connect(g);g.connect(dest||A.ch.drums);s.start(t,Math.random()*1.5);s.stop(t+(att||0.001)+dur+0.05);f.out=g;return f;}
function tone(t,type,freq,dur,vol,dest,att,f2){const c=A.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);env(g,t,att||0.003,vol,dur);o.connect(g);g.connect(dest||A.ch.music);o.start(t);o.stop(t+(att||0.003)+dur+0.05);o.out=g;return o;}
// sidechain pump: the music bus ducks on every kick and breathes back with a smooth curve
function duckAt(t,d){const g=A.ch.duck.gain,depth=TR&&TR.st&&TR.st.pump!=null?TR.st.pump:0.7;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(1-depth,t+0.006);g.setTargetAtTime(1,t+0.03,Math.max(0.03,d*0.32));}
// filter sweeps on the music path (HP up through a build, LP opening through an intro / closing in the outro)
function sweep(node,t,from,to,dur){const f=node.frequency;f.cancelScheduledValues(t);f.setValueAtTime(from,t);f.exponentialRampToValueAtTime(to,t+Math.max(0.05,dur));}
function sweepReset(t){if(!A.ch)return;sweep(A.ch.hp,t,A.ch.hp.frequency.value||12,12,0.03);sweep(A.ch.lp,t,Math.max(200,A.ch.lp.frequency.value||20000),20000,0.03);}
function sat(dest,curve,pre,post){const c=A.ctx,ws=c.createWaveShaper();ws.curve=A.cv[curve]||A.cv.warm;const a=c.createGain(),b=c.createGain();a.gain.value=pre||1;b.gain.value=post||1;a.connect(ws);ws.connect(b);b.connect(dest);return a;}
// ---- drums: layered kicks (click + punch + body/sub through saturation) ----
function kickL(t,v,o){const c=A.ctx;o=o||{};const sh=sat(A.ch.drums,o.curve||'warm',o.drive||1.2,0.85);
  noiseHit(t,0.006,'highpass',5000,0.7,v*(o.click||0.32));tone(t,'triangle',3200,0.012,v*0.18,A.ch.drums,0.0005,700);
  const p=c.createOscillator(),pg=c.createGain();p.type='sine';p.frequency.setValueAtTime(o.pf||260,t);p.frequency.exponentialRampToValueAtTime(o.bf||62,t+(o.pt||0.04));pg.gain.setValueAtTime(v*0.9,t);pg.gain.setTargetAtTime(0.0001,t+0.03,0.03);p.connect(pg);pg.connect(sh);p.start(t);p.stop(t+0.25);
  const b=c.createOscillator(),bg=c.createGain();b.type='sine';b.frequency.setValueAtTime(o.bf||62,t);b.frequency.exponentialRampToValueAtTime(o.ef||44,t+(o.dec||0.38));bg.gain.setValueAtTime(0.0001,t);bg.gain.linearRampToValueAtTime(v,t+0.004);bg.gain.setTargetAtTime(0.0001,t+(o.hold||0.08),(o.dec||0.38)/4);b.connect(bg);bg.connect(sh);b.start(t);b.stop(t+(o.dec||0.38)+0.4);
  duckAt(t,o.duck||0.24);}
function kick(t,v){kickL(t,v,{});}
function softKick(t,v){kickL(t,v*0.7,{pf:160,bf:58,dec:0.3,click:0.08,drive:0.8,duck:0.18});}
function bigKick(t,v){kickL(t,v,{pf:320,bf:58,ef:40,dec:0.55,hold:0.12,drive:1.8,click:0.4,duck:0.3});noiseHit(t,0.05,'lowpass',900,0.7,v*0.25);}
// hardstyle kick: distorted pitch-drop that settles on the root and rings ("tok" + tail)
function getDist(){if(!A.dist){const c=A.ctx,ws=c.createWaveShaper();ws.curve=A.cv.gnarl;ws.oversample='2x';const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=4200;const pk=c.createBiquadFilter();pk.type='peaking';pk.frequency.value=180;pk.gain.value=5;pk.Q.value=1.2;const g=c.createGain();g.gain.value=0.42;ws.connect(pk);pk.connect(lp);lp.connect(g);g.connect(A.ch.drums);A.dist=ws;}return A.dist;}
function kickHard(t,v,root){const c=A.ctx,o=c.createOscillator(),g=c.createGain(),f=mtof((root||33)%12+33);o.type='sine';o.frequency.setValueAtTime(900,t);o.frequency.exponentialRampToValueAtTime(140,t+0.022);o.frequency.exponentialRampToValueAtTime(f*1.02,t+0.09);o.frequency.linearRampToValueAtTime(f*0.97,t+0.42);
  g.gain.setValueAtTime(v*1.2,t);g.gain.setValueAtTime(v*1.2,t+0.26);g.gain.setTargetAtTime(0.0001,t+0.27,0.05);o.connect(g);g.connect(getDist());o.start(t);o.stop(t+0.6);
  noiseHit(t,0.012,'highpass',2500,0.5,v*0.35);tone(t,'sine',f/2,0.4,v*0.5,A.ch.drums,0.003);duckAt(t,0.26);}
function hat(t,v,open){const h=noiseHit(t,open?0.2:0.035,'highpass',open?7000:9000,0.7,v);if(open)sendTo(h.out,A.ch.plate,0.25);}
function clap(t,v){for(let k=0;k<4;k++){const n=noiseHit(t+k*0.009,0.022,'bandpass',1250,1.1,v*(k===3?1:0.8));}const tl=noiseHit(t+0.03,0.22,'bandpass',1150,0.8,v*0.85);sendTo(tl.out,A.ch.plate,0.9);noiseHit(t,0.06,'highpass',5500,0.6,v*0.25);}
function snare(t,v,p){const n=noiseHit(t,0.14,'bandpass',1900+p*1500,0.7,v);const n2=noiseHit(t,0.09,'highpass',4500,0.6,v*0.5);const b=tone(t,'triangle',190+p*260,0.09,v*0.55,A.ch.drums,0.001,150+p*200);sendTo(n.out,A.ch.plate,0.7);sendTo(b.out,A.ch.plate,0.3);}
function rim(t,v){tone(t,'square',820,0.03,v,A.ch.drums,0.001);const n=noiseHit(t,0.02,'bandpass',2600,2,v*0.6);sendTo(n.out,A.ch.plate,0.5);}
function tom(t,m,v){const o=tone(t,'sine',mtof(m)*2,0.25,v,A.ch.drums,0.002,mtof(m));sendTo(o.out,A.ch.plate,0.5);}
function crash(t,v){const a=noiseHit(t,2.2,'highpass',4200,0.4,v),b=noiseHit(t,1.2,'bandpass',7800,0.9,v*0.5);sendTo(a.out,A.ch.rev,0.25);}
// ---- bass ----
function bass(t,m,dur,v){const c=A.ctx,o=c.createOscillator(),o2=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type='sawtooth';o2.type='square';o.frequency.value=mtof(m);o2.frequency.value=mtof(m+12);o2.detune.value=6;
  f.type='lowpass';f.Q.value=6;f.frequency.setValueAtTime(1400,t);f.frequency.exponentialRampToValueAtTime(170,t+dur);env(g,t,0.004,v,dur);const g2=c.createGain();g2.gain.value=0.3;const s=c.createOscillator();s.type='sine';s.frequency.value=mtof(m);const sg=c.createGain();sg.gain.value=0.6;
  o.connect(f);o2.connect(g2);g2.connect(f);f.connect(g);s.connect(sg);sg.connect(g);g.connect(sat(A.ch.music,'warm',1.3,0.8));o.start(t);o2.start(t);s.start(t);o.stop(t+dur+0.1);o2.stop(t+dur+0.1);s.stop(t+dur+0.1);}
function subBass(t,m,dur,v){const c=A.ctx,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=mtof(m);g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v,t+0.05);g.gain.setValueAtTime(v,t+Math.max(0.06,dur-0.08));g.gain.linearRampToValueAtTime(0.0001,t+dur);o.connect(g);g.connect(A.ch.music);o.start(t);o.stop(t+dur+0.05);}
// acid line (303-style resonant saw with accent + slide)
function acid(t,m,dur,v,acc,slide){const c=A.ctx,o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type='sawtooth';o.frequency.setValueAtTime(mtof(m),t);if(slide)o.frequency.exponentialRampToValueAtTime(mtof(slide),t+dur*0.8);
  f.type='lowpass';f.Q.value=acc?18:13;f.frequency.setValueAtTime(acc?3200:1600,t);f.frequency.exponentialRampToValueAtTime(220,t+dur*0.9);env(g,t,0.003,v*(acc?1.3:1),dur);o.connect(f);f.connect(g);g.connect(sat(A.ch.music,'hard',1.5,0.35));sendTo(g,A.ch.send,0.25);o.start(t);o.stop(t+dur+0.05);}
// ---- pads / leads ----
function pad(t,notes,dur,v){const c=A.ctx;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(700,t);f.frequency.linearRampToValueAtTime(2200,t+dur*0.6);const g=c.createGain();
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v,t+0.3);g.gain.setValueAtTime(v,t+Math.max(0.35,dur-0.2));g.gain.linearRampToValueAtTime(0.0001,t+dur+0.35);f.connect(g);g.connect(A.ch.music);sendTo(g,A.ch.rev,0.9);sendTo(g,A.ch.send,0.3);
  const pl=c.createStereoPanner?c.createStereoPanner():null,pr=c.createStereoPanner?c.createStereoPanner():null;if(pl){pl.pan.value=-0.6;pr.pan.value=0.6;pl.connect(f);pr.connect(f);}
  for(const n of notes)[-11,11].forEach((det,k)=>{const o=c.createOscillator();o.type='sawtooth';o.frequency.value=mtof(n);o.detune.value=det;o.connect(pl?(k?pr:pl):f);o.start(t);o.stop(t+dur+0.45);});}
// supersaw: 5-7 detuned saws per note spread across the stereo field, high-passed, with filter envelope
const SS_DET=[-36,-22,-9,0,9,22,36],SS_PAN=[-0.85,-0.55,-0.25,0,0.25,0.55,0.85];
function supersaw(t,notes,dur,v,o){o=o||{};const c=A.ctx,f=c.createBiquadFilter(),hp=c.createBiquadFilter(),g=c.createGain();f.type='lowpass';f.Q.value=0.8;f.frequency.setValueAtTime(o.cut||8000,t);if(o.cutEnd)f.frequency.exponentialRampToValueAtTime(o.cutEnd,t+dur);
  hp.type='highpass';hp.frequency.value=o.hp||170;const att=o.att||0.004,rel=o.rel||0.12;g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v,t+att);g.gain.setValueAtTime(v,t+Math.max(att+0.01,dur));g.gain.exponentialRampToValueAtTime(0.0001,t+dur+rel);
  f.connect(hp);hp.connect(g);g.connect(A.ch.music);sendTo(g,A.ch.rev,o.rev!=null?o.rev:0.5);if(o.dly)sendTo(g,A.ch.send,o.dly);
  const nv=notes.length>1?5:7,idx=nv===5?[0,2,3,4,6]:[0,1,2,3,4,5,6],P={};const pan=k=>{if(!c.createStereoPanner)return f;const key=SS_PAN[k];if(!P[key]){P[key]=c.createStereoPanner();P[key].pan.value=key;P[key].connect(f);}return P[key];};
  const end=t+dur+rel+0.05;for(const n of notes)for(const k of idx){const os=c.createOscillator();os.type='sawtooth';os.frequency.value=mtof(n);os.detune.value=SS_DET[k]+(Math.random()-0.5)*4;if(o.glide)os.frequency.exponentialRampToValueAtTime(mtof(n+o.glide),t+dur);os.connect(pan(k));os.start(t+Math.random()*0.002);os.stop(end);}}
function lead(t,m,dur,v){supersaw(t,[m],dur,v*0.9,{cut:5200,cutEnd:1600,dly:0.35,rev:0.4});}
function saw3(t,m,dur,v,cut){supersaw(t,[m],dur,v,{cut:cut||6500,cutEnd:(cut||6500)*0.4,dly:0.3,rev:0.35,rel:0.06});}
function bell(t,m,dur,v){const c=A.ctx,o=c.createOscillator(),mo=c.createOscillator(),mg=c.createGain(),g=c.createGain();o.type='sine';o.frequency.value=mtof(m);mo.type='sine';mo.frequency.value=mtof(m)*3.5;mg.gain.setValueAtTime(mtof(m)*2,t);mg.gain.exponentialRampToValueAtTime(1,t+dur);
  mo.connect(mg);mg.connect(o.frequency);env(g,t,0.003,v,dur);o.connect(g);g.connect(A.ch.music);sendTo(g,A.ch.send,0.5);sendTo(g,A.ch.rev,0.6);o.start(t);mo.start(t);o.stop(t+dur+0.1);mo.stop(t+dur+0.1);}
// ---- FX: risers, impacts, downlifters ----
function riser(t,dur){const c=A.ctx,s=c.createBufferSource();s.buffer=A.noise;s.loop=true;const f=c.createBiquadFilter();f.type='bandpass';f.Q.value=2.5;f.frequency.setValueAtTime(300,t);f.frequency.exponentialRampToValueAtTime(9000,t+dur);
  const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.28,t+dur-0.02);g.gain.linearRampToValueAtTime(0.0001,t+dur+0.01);s.connect(f);f.connect(g);g.connect(A.ch.drums);sendTo(g,A.ch.rev,0.5);s.start(t);s.stop(t+dur+0.05);
  // pitch riser: a supersaw climbing an octave
  supersaw(t+dur*0.5,[57],dur*0.5,0.018,{cut:1500,cutEnd:9000,glide:12,att:dur*0.45,rel:0.02,rev:0.6,hp:400});}
function impact(t,v){subBoom(t,v);crash(t,0.55*v);const n=noiseHit(t,0.5,'lowpass',2200,0.6,0.35*v,A.ch.drums);sendTo(n.out,A.ch.rev,0.8);}
function downlifter(t,dur,v){const c=A.ctx,s=c.createBufferSource();s.buffer=A.noise;s.loop=true;const f=c.createBiquadFilter();f.type='bandpass';f.Q.value=1.6;f.frequency.setValueAtTime(8000,t);f.frequency.exponentialRampToValueAtTime(180,t+dur);
  const g=c.createGain();g.gain.setValueAtTime(v||0.2,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);s.connect(f);f.connect(g);g.connect(A.ch.drums);sendTo(g,A.ch.rev,0.9);s.start(t);s.stop(t+dur+0.05);tone(t,'sine',220,dur,0.12*(v||0.2)/0.2,A.ch.music,0.005,40);}
function rumble(t,v){if(!A.rum){const c=A.ctx,lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=160;const dl=c.createDelay(1);dl.delayTime.value=TR.step;const fb=c.createGain();fb.gain.value=0.5;
    const cv=c.createConvolver();cv.buffer=A.irHall;lp.connect(cv);cv.connect(dl);lp.connect(dl);dl.connect(fb);fb.connect(dl);const out=c.createGain();out.gain.value=1.1;dl.connect(sat(out,'warm',1.5,0.8));out.connect(A.ch.duck);A.rum=lp;}
  tone(t+0.02,'triangle',52,0.22,v,A.rum,0.01,40);}
function subBoom(t,v){tone(t,'sine',72,2.2,0.9*(v||1),A.ch.drums,0.005,30);}
// ---- formant vocal chops ("hey", "oh", "ah", "yeah") ----
const VOW={a:[800,1150,2900],e:[420,1800,2600],i:[300,2250,3000],o:[460,800,2830],u:[330,700,2500]},VG=[1,0.5,0.22];
function vox(t,m,dur,v,v1,v2,o){o=o||{};const c=A.ctx,src=c.createOscillator(),g=c.createGain(),mix=c.createGain();src.type='sawtooth';src.frequency.setValueAtTime(mtof(m)*(o.scoop?0.94:1),t);if(o.scoop)src.frequency.exponentialRampToValueAtTime(mtof(m),t+0.06);
  const vib=c.createOscillator(),vg=c.createGain();vib.frequency.value=5.6;vg.gain.value=o.vib||6;vib.connect(vg);vg.connect(src.detune);
  const nz=c.createBufferSource();nz.buffer=A.noise;const ng=c.createGain();ng.gain.setValueAtTime(o.breath||0.18,t);ng.gain.exponentialRampToValueAtTime(0.01,t+0.05);nz.connect(ng);
  const F1=VOW[v1]||VOW.a,F2=VOW[v2||v1]||F1;for(let k=0;k<3;k++){const bp=c.createBiquadFilter();bp.type='bandpass';bp.Q.value=[7,11,14][k];bp.frequency.setValueAtTime(F1[k],t);bp.frequency.linearRampToValueAtTime(F2[k],t+dur*0.7);
    const bg=c.createGain();bg.gain.value=VG[k]*7;src.connect(bp);ng.connect(bp);bp.connect(bg);bg.connect(mix);}
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v,t+0.012);g.gain.setValueAtTime(v,t+Math.max(0.02,dur-0.03));g.gain.exponentialRampToValueAtTime(0.0001,t+dur+0.04);mix.connect(g);g.connect(A.ch.music);sendTo(g,A.ch.rev,o.rev!=null?o.rev:0.45);sendTo(g,A.ch.send,o.dly!=null?o.dly:0.3);
  src.start(t);vib.start(t);nz.start(t,Math.random());const e=t+dur+0.1;src.stop(e);vib.stop(e);nz.stop(e);}
// ---- bass-music voices: wobble, growl, reese ----
function wobble(t,m,dur,rate,v){const c=A.ctx,o=c.createOscillator(),o2=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain(),l=c.createOscillator(),lg=c.createGain(),s=c.createOscillator(),sg=c.createGain();
  o.type='sawtooth';o2.type='square';o.frequency.value=mtof(m);o2.frequency.value=mtof(m);o2.detune.value=-7;f.type='lowpass';f.Q.value=9;f.frequency.value=700;l.type='sine';l.frequency.value=rate;lg.gain.value=1700;l.connect(lg);lg.connect(f.frequency);
  s.type='sine';s.frequency.value=mtof(m-12);sg.gain.value=0.7;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+0.01);g.gain.setValueAtTime(v,t+dur-0.03);g.gain.linearRampToValueAtTime(0.0001,t+dur);
  o.connect(f);o2.connect(f);f.connect(sat(g,'hard',1.4,0.5));s.connect(sg);sg.connect(g);g.connect(A.ch.music);[o,o2,l,s].forEach(x=>{x.start(t);x.stop(t+dur+0.05);});}
// growl: FM saw through a moving vowel formant + distortion ("yoi")
function growl(t,m,dur,v,v1,v2){const c=A.ctx,o=c.createOscillator(),mo=c.createOscillator(),mg=c.createGain(),g=c.createGain(),bp=c.createBiquadFilter(),bp2=c.createBiquadFilter(),mx=c.createGain(),s=c.createOscillator(),sg=c.createGain();
  o.type='sawtooth';o.frequency.value=mtof(m);mo.type='sine';mo.frequency.value=mtof(m)*1.5;mg.gain.setValueAtTime(mtof(m)*3,t);mg.gain.linearRampToValueAtTime(mtof(m)*0.6,t+dur);mo.connect(mg);mg.connect(o.frequency);
  const A1=VOW[v1||'o'],A2=VOW[v2||'i'];bp.type='bandpass';bp.Q.value=5;bp.frequency.setValueAtTime(A1[0],t);bp.frequency.exponentialRampToValueAtTime(A2[0],t+dur*0.8);bp2.type='bandpass';bp2.Q.value=6;bp2.frequency.setValueAtTime(A1[1],t);bp2.frequency.exponentialRampToValueAtTime(A2[1],t+dur*0.8);
  o.connect(bp);o.connect(bp2);bp.connect(mx);bp2.connect(mx);mx.gain.value=3;const d=sat(g,'gnarl',1.2,0.32);mx.connect(d);s.type='sine';s.frequency.value=mtof(m-12);sg.gain.value=0.75;s.connect(sg);sg.connect(g);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+0.008);g.gain.setValueAtTime(v,t+Math.max(0.02,dur-0.03));g.gain.linearRampToValueAtTime(0.0001,t+dur);g.connect(A.ch.music);[o,mo,s].forEach(x=>{x.start(t);x.stop(t+dur+0.05);});}
function reese(t,m,dur,v){const c=A.ctx,f=c.createBiquadFilter(),g=c.createGain();f.type='lowpass';f.Q.value=3;f.frequency.setValueAtTime(300,t);f.frequency.linearRampToValueAtTime(1100,t+dur*0.5);f.frequency.linearRampToValueAtTime(380,t+dur);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+0.02);g.gain.setValueAtTime(v,t+dur-0.05);g.gain.linearRampToValueAtTime(0.0001,t+dur);f.connect(sat(g,'warm',1.6,0.6));g.connect(A.ch.music);
  for(const d of [-24,-9,9,24]){const o=c.createOscillator();o.type='sawtooth';o.frequency.value=mtof(m);o.detune.value=d;o.connect(f);o.start(t);o.stop(t+dur+0.05);}
  const s=c.createOscillator(),sg=c.createGain();s.type='sine';s.frequency.value=mtof(m-12);sg.gain.value=0.9;s.connect(sg);sg.connect(g);s.start(t);s.stop(t+dur+0.05);}
function pluck(t,m,dur,v,bright){const c=A.ctx,o=c.createOscillator(),o2=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type='sawtooth';o2.type='square';o.frequency.value=mtof(m);o2.frequency.value=mtof(m+12);o2.detune.value=7;
  f.type='lowpass';f.Q.value=3;f.frequency.setValueAtTime(bright||7000,t);f.frequency.exponentialRampToValueAtTime(450,t+Math.min(dur,0.25));env(g,t,0.002,v,dur);o.connect(f);o2.connect(f);f.connect(g);g.connect(A.ch.music);sendTo(g,A.ch.send,0.6);sendTo(g,A.ch.rev,0.4);o.start(t);o2.start(t);o.stop(t+dur+0.1);o2.stop(t+dur+0.1);}
function stab(t,notes,v,organ){const c=A.ctx,g=c.createGain(),f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=organ?2600:4500;env(g,t,0.003,v,organ?0.16:0.38);f.connect(g);g.connect(A.ch.music);sendTo(g,A.ch.send,0.45);sendTo(g,A.ch.rev,0.35);
  for(const n of notes){const o=c.createOscillator();o.type=organ?'square':'triangle';o.frequency.value=mtof(n+12);o.connect(f);o.start(t);o.stop(t+0.45);
    if(!organ){const o2=c.createOscillator();o2.type='sine';o2.frequency.value=mtof(n+24);o2.connect(f);o2.start(t);o2.stop(t+0.3);}}}
// ---- v2.2 file player: real tracks stream through an <audio> element -> MediaElementSource -> music bus (analyser, limiter) ----
const FILE={els:{},cur:null,aP:0,aE:0,lastE:-1,fadeAt:0,hint:false};
function fileEl(url){let o=FILE.els[url];if(o){o.used=realNow();return o;}
  const el=document.createElement('audio');el.preload='auto';el.setAttribute('playsinline','');el.playsInline=true;el.src=url;
  o={el,url,src:null,g:null,used:realNow(),err:false};FILE.els[url]=o;
  el.addEventListener('error',()=>{o.err=true;if(FILE.cur===o)fileFail('load');});
  el.addEventListener('waiting',()=>{if(FILE.cur===o&&SEQ.playing)Bus.emit('fileWait',1);});
  const ks=Object.keys(FILE.els);if(ks.length>3){ks.sort((a,b)=>FILE.els[a].used-FILE.els[b].used);for(const k of ks){if(Object.keys(FILE.els).length<=3)break;const x=FILE.els[k];if(x===FILE.cur||x===o)continue;
    try{x.el.pause();x.el.removeAttribute('src');x.el.load();if(x.src)x.src.disconnect();}catch(e){}delete FILE.els[k];}}
  return o;}
function preloadTrack(id){const t=TMAP[id];if(t&&t.real)try{fileEl(t.real.file);}catch(e){}}
function fileConnect(o){if(!A.ctx||o.src)return;try{o.src=A.ctx.createMediaElementSource(o.el);o.g=A.ctx.createGain();o.src.connect(o.g);o.g.connect(A.musicBus);}catch(e){reportError&&reportError(e,'mediasrc');}}
function fileGain(v,tc){const o=FILE.cur;if(!o)return;if(o.g&&A.ctx){const g=o.g.gain,t=A.ctx.currentTime;g.cancelScheduledValues(t);if(tc)g.setTargetAtTime(v,t,tc);else g.setValueAtTime(v,t);}else o.el.volume=v;}
function fileFail(why){if(!TR||!TR.file)return;const pos=songPos();TR.file=null;TR.fileFailed=why||'err';toast('Could not load the track – playing the synth version instead',3500);
  if(SEQ.playing){SEQ.pausedPos=pos;SEQ.fallbackT0=realNow();if(A.ctx)startSeq(pos);}Bus.emit('track',TR);}
function filePos(){const o=FILE.cur,el=o.el,now=realNow(),e=el.currentTime-TR.fileT0;
  if(el.paused||el.seeking||el.readyState<3){FILE.aE=e;FILE.aP=now;FILE.lastE=e;return Math.max(0,e);}
  if(e!==FILE.lastE){FILE.lastE=e;const pred=FILE.aE+(now-FILE.aP);if(Math.abs(pred-e)>0.05||e<FILE.aE){FILE.aE=e;FILE.aP=now;}}
  return Math.max(0,FILE.aE+(now-FILE.aP)-(A.ctx&&A.ctx.outputLatency||0));}
function filePlay(){const o=FILE.cur;if(!o)return;fileConnect(o);FILE.fadeAt=0;fileGain(1);const el=o.el,want=TR.fileT0+SEQ.pausedPos;
  try{if(Math.abs(el.currentTime-want)>0.05)el.currentTime=want;}catch(e){}
  const p=el.play();if(p&&p.catch)p.catch(err=>{if(err&&err.name==='NotAllowedError'){SEQ.playing=false;SEQ.pausedPos=Math.max(0,el.currentTime-TR.fileT0);toast('Tap ▶ to start the music',2500);Bus.emit('transport','pause');}});
  if(el.readyState<3)toast('Loading track…',1500);
  if(!FILE.hint&&/iP(hone|ad|od)/.test(navigator.userAgent)){FILE.hint=true;let seen=false;try{seen=localStorage.getItem('fc_iosHint');localStorage.setItem('fc_iosHint','1');}catch(e){}
    if(!seen)setTimeout(()=>toast('🔇 No sound? Flip the silent switch off and turn the volume up',4500),1600);}}
function fileTick(){if(!TR||!TR.file||!FILE.cur||!SEQ.playing)return;const p=songPos();
  if(!FILE.fadeAt&&p>TR.len-TR.bar*1.5){FILE.fadeAt=p;fileGain(0,TR.bar*0.35);}
  if((p>=TR.len-0.02||FILE.cur.el.ended)&&!SEQ.ended){SEQ.ended=true;try{FILE.cur.el.pause();}catch(e){}Bus.emit('mus','end',1);}}
// ---- sequencer / transport ----
const SEQ={playing:false,songStart:0,nextStep:0,nextTime:0,pausedPos:0,ended:false,evq:[],fallbackT0:0};
function songPos(){ // show clock in seconds (frozen while paused)
  if(TR&&TR.yt&&typeof ytPos==='function'){const p=ytPos();if(p!=null)return p;}
  if(!SEQ.playing)return SEQ.pausedPos;
  if(TR&&TR.file&&FILE.cur)return filePos();
  if(!A.ctx||A.ctx.state!=='running')return SEQ.pausedPos+(realNow()-SEQ.fallbackT0);
  return Math.max(0,A.ctx.currentTime-SEQ.songStart-(A.ctx.outputLatency||0));}
const beatPos=()=>TR?songPos()/TR.beat:0;
function startSeq(pos){if(!A.ctx){SEQ.fallbackT0=realNow();return;}const c=A.ctx;newChain();
  SEQ.songStart=c.currentTime+0.06-pos;SEQ.nextStep=Math.max(0,Math.ceil((pos-0.001)/TR.step));SEQ.nextTime=SEQ.songStart+SEQ.nextStep*TR.step;SEQ.evq.length=0;}
function transportPlay(){if(!TR||SEQ.playing)return;initAudio();if(TR.yt){SEQ.playing=true;ytPlay&&ytPlay();Bus.emit('transport','play');return;}
  if(SEQ.ended){SEQ.pausedPos=0;SEQ.ended=false;}SEQ.playing=true;SEQ.fallbackT0=realNow();if(TR.file){filePlay();}else startSeq(SEQ.pausedPos);Bus.emit('transport','play');}
function transportPause(){if(!SEQ.playing)return;SEQ.pausedPos=songPos();SEQ.playing=false;if(TR&&TR.yt){ytPause&&ytPause();}else if(TR&&TR.file&&FILE.cur){try{FILE.cur.el.pause();}catch(e){}}else if(A.ctx)newChain();Bus.emit('transport','pause');}
function transportSeek(sec){if(!TR)return;sec=clamp(sec,0,TR.loop?1e6:TR.len-0.05);SEQ.ended=false;
  if(TR.yt){ytSeek&&ytSeek(sec);SEQ.pausedPos=sec;Bus.emit('transport','seek');return;}
  SEQ.pausedPos=sec;lastGridStep=-1;if(TR.file&&FILE.cur){FILE.fadeAt=0;fileGain(1);try{FILE.cur.el.currentTime=TR.fileT0+sec;}catch(e){}FILE.aE=sec;FILE.aP=realNow();}else if(SEQ.playing){SEQ.fallbackT0=realNow();startSeq(sec);}Bus.emit('transport','seek');}
function transportStop(){SEQ.playing=false;SEQ.pausedPos=0;SEQ.ended=false;if(FILE.cur){try{FILE.cur.el.pause();}catch(e){}}if(A.ctx&&A.ch)newChain();}
function loadTrack(id,o){transportStop();TR=buildTrack(id,o);FILE.cur=null;lastGridStep=-1;
  if(TR.file){const f=fileEl(TR.file);if(f.err){TR.file=null;TR.fileFailed='load';}else{FILE.cur=f;try{f.el.currentTime=TR.fileT0;}catch(e){}}}if(A.ctx&&A.ch)A.ch.dl.delayTime.value=TR.beat*0.75;setVolumes();Bus.emit('track',TR);return TR;}
function schedule(){if(!SEQ.playing||!A.ctx||A.ctx.state!=='running'||!TR||TR.yt||TR.file)return;
  const ahead=A.ctx.currentTime+0.16;let guard=0;
  while(SEQ.nextTime<ahead&&guard++<64){if(SEQ.nextTime>A.ctx.currentTime-0.05){try{playStep(SEQ.nextStep,SEQ.nextTime);}catch(e){reportError(e,'music');}}SEQ.nextStep++;SEQ.nextTime=SEQ.songStart+SEQ.nextStep*TR.step;}}
setInterval(schedule,25);
const qev=(t,k,v)=>SEQ.evq.push([t,k,v]);
function playStep(i,t){
  const bar=Math.floor(i/16),s=i%16;
  if(!TR.loop&&bar>=TR.bars){if(bar===TR.bars&&s===0){crash(t,0.4);subBoom(t);pad(t,TR.prog[0].n,TR.bar*2,0.06);qev(t,'end',1);}return;}
  const mb=musBar(bar),sec=secAt(mb),rel=mb-sec.a,len=sec.b-sec.a,ch=TR.prog[mb%TR.prog.length],st=TR.st,B=TR.beat,STP=TR.step,BR=TR.bar;
  const K=v=>{qev(t,'kick',v);switch(st.kick){case 'big':bigKick(t,v);break;case 'hard':kickHard(t,v,ch.r);break;case 'soft':softKick(t,v);break;case 'rumble':kick(t,v);rumble(t,0.3*v);break;default:kick(t,v);}};
  const SN=(v,p)=>{qev(t,'snare',v);snare(t,v,p||0.3);};
  const groove=(full)=>{switch(st.drums){
    case 'half':if(s===0||(full&&s===10))K(1);if(s===8){SN(full?0.6:0.4);clap(t,full?0.5:0.3);}if(s%2===0)hat(t,0.09,false);if(full&&s===14)hat(t,0.16,true);return;
    case 'break':if(s===0||s===10)K(0.95);if(s===4||s===12)SN(0.55,0.55);if(full&&(s===7||s===15))snare(t,0.12,0.7);if(s%2===0)hat(t,s%4===2?0.14:0.07,false);if(full&&s===14)hat(t,0.18,true);return;
    case 'soft':if(s===0||s===8)K(0.7);if(full&&s===12)rim(t,0.05);if(s%4===2)hat(t,0.05,false);return;
    case 'shuffle':if(s%4===0)K(full?1:0.85);if(full&&(s===4||s===12))clap(t,0.38);if(s%4===2)hat(t,full?0.22:0.12,true);else if(s%2===1)hat(t,0.06,false);if(full&&(s===3||s===11))rim(t,0.06);if(full&&s===7&&rel%2)rim(t,0.05);return;
    default:if(s%4===0)K(full?1:0.85);if(full&&(s===4||s===12)){clap(t,st.kick==='rumble'?0.28:0.45);qev(t,'snare',0.5);}if(s%4===2)hat(t,full?0.24:0.14,true);else if(full||st.kick!=='big')hat(t,0.07,false);}};
  const BASS=(lvl)=>{switch(st.bass){
    case 'offbeat':if(s%4===2)bass(t,ch.r,STP*1.8,0.38*lvl);break;
    case 'house':if(s%4===2)bass(t,ch.r+(s===10?12:0),STP*1.6,0.36*lvl);break;
    case 'roll':if(s%4!==0)bass(t,ch.r+(s%4===3?12:0),STP*0.85,0.3*lvl);break;
    case 'pulse':if(s%2===1||s%4===2)bass(t,ch.r,STP*0.8,0.22*lvl);break;
    case 'reese':if(s===0||s===8)reese(t,ch.r+(s===8&&rel%2===1?3:0),BR*0.48,0.3*lvl);break;
    case 'wobble':if(s%4===0){const r=[2,4,3,6][(s/4+rel)%4];if(st.growl&&rel%2===1&&s>=8)growl(t,ch.r+12,B*0.9,0.28*lvl,s===8?'o':'a',s===8?'i':'u');else wobble(t,ch.r+(rel%4===3&&s===12?7:0),B*0.96,r/B,0.3*lvl);}break;
    case 'growl':if(s%4===2||s===7||s===15)growl(t,ch.r+12,STP*(s===15?1:1.6),0.24*lvl,s===7?'a':'o',s===15?'u':'i');break;
    case 'sub':if(s===0)subBass(t,ch.r,BR*0.95,0.3*lvl);break;}};
  const LEAD=(lvl,oct)=>{const o=oct||0;switch(st.lead){
    case 'pluck':if(HOOK[s]>=0)pluck(t,ch.n[HOOK[s]]+12+o,STP*1.5,0.065*lvl);break;
    case 'saw':if(HOOK[s]>=0)saw3(t,ch.n[HOOK[s]]+12+o,STP*1.6,0.04*lvl);if(s===0)pad(t,ch.n,BR-0.05,0.025*lvl);break;
    case 'stab':if(s===3||s===6||s===10||s===13)stab(t,ch.n,0.07*lvl,false);break;
    case 'organ':if(s===2||s===6||s===10||s===14)stab(t,ch.n,0.06*lvl,true);break;
    case 'arp':saw3(t,ch.n[ARP[s]]+12+o,STP*0.9,0.033*lvl);break;
    case 'bell':if(s%3===0)bell(t,ch.n[ARP[s]]+24+o,STP*2.5,0.05*lvl);break;}};
  // genre colour: supersaw chords, trance gate, acid line, formant vocal chops
  const EXTRA=(lvl)=>{const up=ch.n.map(n=>n+12);
    if(st.chords==='ss'&&(s===2||s===6||s===10||s===14)&&!(s===14&&rel%2))supersaw(t,up,STP*1.4,0.02*lvl,{cut:7500,cutEnd:2400,rev:0.45,dly:0.15});
    if(st.chords==='gate'&&s%2===0&&s!==6&&s!==14)supersaw(t,up,STP*0.85,0.016*lvl,{cut:6500,rel:0.025,rev:0.55,dly:0.2});
    if(st.acid&&ACID_ON[s])acid(t,ch.r+12+ACID[s],STP*(s===13?1.9:0.9),0.055*lvl,s%4===2||s===13,s===13?ch.r+12+ACID[15]:0);
    switch(st.vox){case 'hey':if(s===14&&rel%2===1)vox(t,ch.n[2]+12,STP*2.2,0.075*lvl,'e','i',{scoop:1});break;
      case 'oh':if((s===6||s===14)&&rel%2===0)vox(t,ch.n[s===6?1:2]+12,STP*1.8,0.06*lvl,'o','u',{scoop:1});break;
      case 'chop':if(s===3||s===7||s===10||s===14)vox(t,ch.n[[0,2,1,2][(s>>2)&3]]+12+(s===14&&rel%2?2:0),STP*(s===14?1.8:0.85),0.065*lvl,s===7?'o':'a',s===14?'e':null,{breath:0.3});break;
      case 'yeah':if(s===12&&rel%4===3)vox(t,ch.n[1]+12,STP*3,0.07*lvl,'i','a',{scoop:1});break;
      case 'yo':if(s===0&&rel%4===2)vox(t,ch.n[0]+12,STP*2.5,0.07*lvl,'o','u',{scoop:1,rev:0.7});break;
      case 'ah':if(s===8&&rel%4===1)vox(t,ch.n[2]+12,STP*4,0.05*lvl,'a','o',{vib:12,rev:0.8});break;}};
  if(rel===0&&s===0){qev(t,'section',sec.i);
    if(sec.t==='intro')sweep(A.ch.lp,t,450,18000,BR*len);else if(sec.t==='outro')sweep(A.ch.lp,t,18000,700,BR*len);
    else if(sec.t==='build')sweep(A.ch.hp,t,12,st.drums==='half'?260:650,BR*len);else sweepReset(t);
    if(sec.t==='break'){downlifter(t,BR*2,0.2);crash(t,0.3);}}
  if(s===0)qev(t,'bar',mb);
  switch(sec.t){
    case 'intro':groove(false);if(s===0&&rel%2===0)pad(t,ch.n,BR*2-0.1,0.04*st.pad);if(rel>=len/2&&s%4===2&&st.bass!=='reese'&&st.bass!=='wobble')BASS(0.6);break;
    case 'groove':groove(true);BASS(0.75);if(st.acid&&rel>=len/2)EXTRA(0.5);if(s===0&&rel%2===0)pad(t,ch.n,BR*2-0.1,0.03*st.pad);if(rel>=len/2&&(st.lead==='arp'||st.lead==='bell'||st.lead==='stab'))LEAD(0.5);break;
    case 'build':{const p=rel/len,last=rel===len-1;if(s===0&&rel===0)riser(t,BR*len);if(last&&s>=12){if(s===12)qev(t,'gap',1);break;}
      if(st.kick==='hard'&&rel>=len-4){const ev=rel<len-2?4:rel<len-1?2:1;if(s%ev===0)K(0.5+0.4*p);}
      else if(rel<len/2){if(st.drums==='half'||st.drums==='soft'){if(s===0)K(0.8);}else if(st.drums==='break'){if(s===0||s===10)K(0.85);}else if(s%4===0)K(0.85);}
      const every=p<0.25?8:p<0.5?4:p<0.75?2:1;if(s%every===0&&!(p<0.25&&s%8!==4))SN(0.12+0.4*p,p);
      if(s%2===1)hat(t,0.05+0.08*p,false);if(rel<len/2&&s%4===2&&st.drums!=='half')bass(t,ch.r,B*0.45,0.22);
      if(s===0)pad(t,ch.n,BR-0.05,(0.04+0.03*p)*st.pad);
      if(last&&s>=8)tom(t,ch.r+24-(s-8)*2,0.25);if(rel===len-1&&s===0)supersaw(t,[ch.n[0]+12,ch.n[2]+12],BR*0.75,0.02,{cut:900,cutEnd:9000,glide:0,att:BR*0.7,rel:0.02,rev:0.5,hp:300});
      if((st.lead==='arp'||st.lead==='saw')&&s%2===0)saw3(t,ch.n[ARP[s]]+12,STP*0.8,0.018+0.02*p,1500+3500*p);
      if(st.lead==='pluck'&&rel>=len/2&&HOOK[s]>=0)pluck(t,ch.n[HOOK[s]]+12,STP*1.2,0.03+0.03*p,1500+4000*p);
      break;}
    case 'drop':case 'peak':
      if(rel===0&&s===0){impact(t,1);qev(t,'drop',sec.i);}else if(rel%(sec.t==='peak'?4:8)===0&&s===0)crash(t,0.3);
      groove(true);BASS(1);EXTRA(sec.t==='peak'?1.1:1);LEAD(1,sec.t==='peak'&&rel>=len/2?12:0);if(st.lead==='none'&&s===0&&rel%2===0)pad(t,ch.n,BR*2-0.1,0.02);if(sec.t==='peak'&&s===0)pad(t,ch.n,BR-0.05,0.03*st.pad);break;
    case 'main':groove(true);BASS(0.85);EXTRA(0.6);if(st.lead!=='saw'&&st.lead!=='pluck')LEAD(0.6);else if(s%4===0&&HOOK[s]>=0)pluck(t,ch.n[HOOK[s]]+12,STP*1.4,0.04);if(s===0&&rel%2===0)pad(t,ch.n,BR*2-0.1,0.025*st.pad);break;
    case 'break':if(s===0)pad(t,ch.n,BR,0.07*st.pad);if(st.vox==='ah'||st.chords==='gate'){if(s===8&&rel%2===1)vox(t,ch.n[2]+12,STP*6,0.045,'a','o',{vib:14,rev:0.9});}if(s%4===2)hat(t,0.04,false);
      if(st.lead==='arp'){if(rel>=4&&s%4===0)saw3(t,ch.n[(s>>2)%3]+12,B*0.95,0.03);}else if(st.lead==='bell'){if(s%4===0)bell(t,ch.n[(s>>2)%3]+24,B*1.8,0.05);}
      else if(st.lead==='stab'||st.lead==='organ'){if(s===0||s===6||s===10)stab(t,ch.n,0.05,st.lead==='organ');}else if(st.bass==='reese'){if(s===0)reese(t,ch.r,BR*0.95,0.1);}
      else if(rel>=len/2&&s%2===0)lead(t,ch.n[ARP[s]]+12,STP*1.6,0.03);break;
    case 'outro':if(rel<len-2)groove(false);if(s===0)pad(t,ch.n,BR,0.06*st.pad);break;}
}
// called each frame: release scheduled musical events to the visual side when they become audible
function pumpEvents(){if(!A.ctx||!SEQ.evq.length)return;const now=A.ctx.currentTime-(A.ctx.outputLatency||0);let k=0;
  while(k<SEQ.evq.length&&SEQ.evq[k][0]<=now){const e=SEQ.evq[k];if(e[1]==='end'){if(SEQ.playing&&!TR.loop){SEQ.ended=true;}}Bus.emit('mus',e[1],e[2]);k++;}if(k)SEQ.evq.splice(0,k);}
// synthetic events when the audio clock isn't the source (YouTube mode / no audio): beat-grid driven
let lastGridStep=-1;
function gridEvents(){fileTick();if(!TR||!(TR.yt||TR.file||!A.ctx||A.ctx.state!=='running'))return;if(!SEQ.playing&&!(TR.yt&&ytPlaying()))return;const stp=Math.floor(songPos()/TR.step);if(stp===lastGridStep)return;
  if(stp<lastGridStep||stp-lastGridStep>(TR.file?48:8)){lastGridStep=stp;return;}
  for(let i=lastGridStep+1;i<=stp;i++){const s=i%16,mb=Math.floor(i/16),sec=secAt(musBar(mb));if(s===0){if(TR.file&&mb>=TR.bars)continue;Bus.emit('mus','bar',mb);if(mb===sec.a)Bus.emit('mus',sec.t==='drop'?'drop':'section',sec.i);}
    if(TR.file&&sec.t==='build'&&mb===sec.b-1&&s===12)Bus.emit('mus','gap',1);
    if(s%4===0&&sec.t!=='break')Bus.emit('mus','kick',sec.t==='drop'?1:0.8);if((s===4||s===12)&&sec.t!=='break'&&sec.t!=='intro')Bus.emit('mus','snare',0.5);}lastGridStep=stp;}
// ---- analyser features (music bus or mic in My Song mode) ----
const AN={low:0,mid:0,high:0,rms:0,onset:0,kick:0,src:'none',_pl:0};
function analyse(dt){let an=null;if(TR&&TR.yt){if(AB.an){an=AB.an;AN.src='mic';}else{AN.src='grid';}}else if(A.an&&SEQ.playing){an=A.an;AN.src='music';}
  if(!an){const bp=beatPos(),ph=bp-Math.floor(bp),e=TR?energyAt(bp/4):0;AN.kick=SEQ.playing||ytPlaying()?Math.pow(1-ph,4)*e:0;AN.low=AN.kick;AN.mid=e*0.5;AN.high=e*0.4;AN.rms=e*0.5;AN.onset=AN.kick;return;}
  const f=an===A.an?A.fbin:AB.fbin;an.getByteFrequencyData(f);const n=f.length,sr=A.ctx.sampleRate,hz=sr/2/n;let lo=0,mi=0,hi=0,ln=0,mn=0,hn=0;
  for(let i=1;i<n;i++){const fr=i*hz,v=f[i]/255;if(fr<160){lo+=v;ln++;}else if(fr<2500){mi+=v;mn++;}else if(fr<10000){hi+=v;hn++;}}
  lo/=ln||1;mi/=mn||1;hi/=hn||1;const tot=(lo+mi+hi)/3;AN.onset=Math.max(0,lo-AN._pl)*4;AN._pl=lo;
  AN.low=approach(AN.low,lo,dt,0.04);AN.mid=approach(AN.mid,mi,dt,0.06);AN.high=approach(AN.high,hi,dt,0.06);AN.rms=approach(AN.rms,tot,dt,0.1);AN.kick=Math.max(AN.kick*Math.exp(-dt*8),clamp(AN.onset,0,1));}
// ---- crowd + ambience + SFX ----
function crowdLevel(e,dt){if(!A.ctx)return;const t=A.ctx.currentTime;if(A.cheerUntil&&t<A.cheerUntil)return;A.crowdG.gain.setTargetAtTime(0.015+0.12*e*e,t,0.5);}
function crowdCheer(amt){if(!A.ctx)return;const t=A.ctx.currentTime,g=A.crowdG.gain;A.cheerUntil=t+1.1;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(0.06+0.3*amt,t+0.15);g.setTargetAtTime(0.03,t+0.7,0.7);
  for(let k=0;k<4;k++)tone(t+rnd(0,0.25),'sawtooth',rnd(500,900),0.5,0.008*amt,A.crowdBus,0.08,rnd(700,1300));}
// v2.1 procedural crowd voices: woos/screams, whistles, ensemble claps (build-ups) and a roar on drops, scaling with crowd energy
const CRA={t:0,lastClap:0};
function crPan(){const c=A.ctx;if(!c.createStereoPanner)return A.crowdBus;const p=c.createStereoPanner();p.pan.value=rnd(-0.85,0.85);p.connect(A.crowdBus);return p;}
function crowdWoo(t,amt){const c=A.ctx,o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain(),f0=Math.random()<0.5?rnd(420,620):rnd(260,380),d=rnd(0.35,0.9);
  o.type='sawtooth';o.frequency.setValueAtTime(f0,t);o.frequency.linearRampToValueAtTime(f0*rnd(1.35,1.7),t+d*0.35);o.frequency.linearRampToValueAtTime(f0*rnd(0.9,1.1),t+d);
  f.type='bandpass';f.frequency.setValueAtTime(rnd(900,1500),t);f.Q.value=2.2;env(g,t,0.06,0.022*amt,d);o.connect(f);f.connect(g);g.connect(crPan());o.start(t);o.stop(t+d+0.2);}
function crowdWhistle(t,amt){const c=A.ctx,o=c.createOscillator(),g=c.createGain(),f0=rnd(2100,2900),wolf=Math.random()<0.5;o.type='sine';o.frequency.setValueAtTime(f0,t);
  if(wolf){o.frequency.exponentialRampToValueAtTime(f0*1.35,t+0.16);o.frequency.setValueAtTime(f0*0.95,t+0.3);o.frequency.exponentialRampToValueAtTime(f0*1.3,t+0.45);o.frequency.exponentialRampToValueAtTime(f0*0.7,t+0.75);}
  else{const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=rnd(5,8);lg.gain.value=60;lfo.connect(lg);lg.connect(o.frequency);lfo.start(t);lfo.stop(t+0.9);}
  env(g,t,0.03,0.012*amt,wolf?0.75:0.8);o.connect(g);g.connect(crPan());o.start(t);o.stop(t+1);}
function crowdClaps(t,amt){const n=Math.round(5+7*amt);for(let k=0;k<n;k++)noiseHit(t+rnd(0,0.035),0.04,'bandpass',rnd(1100,2000),0.9,0.05*amt/Math.sqrt(n)*2.2,A.crowdBus);}
function crowdRoar(amt){if(!A.ctx||A.ctx.state!=='running')return;const t=A.ctx.currentTime+0.02;noiseHit(t,2.6,'bandpass',750,0.55,0.32*amt,A.crowdBus,0.12);noiseHit(t,1.8,'highpass',2500,0.5,0.06*amt,A.crowdBus,0.08);
  for(let k=0;k<10;k++)crowdWoo(t+rnd(0,1.4),amt);for(let k=0;k<4;k++)crowdWhistle(t+rnd(0.1,1.6),amt);crowdCheer(Math.min(1,amt+0.2));}
function crowdAudioTick(dt,o){if(!A.ctx||A.ctx.state!=='running'||!o.playing)return;const t=A.ctx.currentTime,e=clamp(o.e,0,1),sec=o.sec;
  const rate=(sec==='drop'||sec==='peak'?3.2:sec==='build'?1.4:sec==='break'?0.35:sec==='intro'||sec==='outro'?0.4:0.9)*e*e*(0.6+(o.size||0.5));
  if(Math.random()<rate*dt)crowdWoo(t+0.01,0.6+e*0.6);if(Math.random()<rate*dt*0.35)crowdWhistle(t+0.01,0.6+e*0.5);}
Bus.on('mus',(k,v)=>{if(!A.ctx||!SES)return;if(k==='drop')crowdRoar(clamp(ENG.e*1.2,0.4,1));
  else if(k==='kick'&&curSec()==='build'&&ENG.e>0.25){const t=A.ctx.currentTime+0.005;if(t-CRA.lastClap>0.2){CRA.lastClap=t;crowdClaps(t,clamp(ENG.e*1.3,0.3,1));}}});
Bus.on('fx',k=>{if(!A.ctx||A.ctx.state!=='running')return;const t=A.ctx.currentTime+0.15,n=k==='fireworks'||k==='flames'?4:2;for(let i=0;i<n;i++)crowdWoo(t+rnd(0,0.4),0.8);if(k==='fireworks'||k==='confetti')crowdWhistle(t+0.2,0.8);});
function setAmbience(e){if(!A.ctx)return;const t=A.ctx.currentTime;A.ambF.type=e.rain?'highpass':'lowpass';A.ambF.frequency.setTargetAtTime(e.rain?2500:(e.outdoor?380:180),t,0.2);A.ambG.gain.setTargetAtTime(e.rain?0.09:(e.outdoor?0.04:0.02),t,0.4);}
function sfx(id,amt){if(!A.ctx||A.ctx.state!=='running')return;const t=A.ctx.currentTime+0.005,D=A.fxBus;amt=amt==null?1:amt;
  switch(id){
    case 'flames':noiseHit(t,0.55,'lowpass',700,1,0.6*amt,D,0.02);tone(t,'sine',90,0.4,0.3*amt,D,0.01,45);break;
    case 'sparks':for(let k=0;k<12;k++)noiseHit(t+k*0.05+Math.random()*0.03,0.02,'highpass',5000,0.6,(0.1+Math.random()*0.15)*amt,D);break;
    case 'co2':noiseHit(t,0.7,'highpass',1800,0.5,0.4*amt,D,0.01);break;
    case 'confetti':noiseHit(t,0.25,'lowpass',900,0.8,0.5,D);for(let k=0;k<5;k++)noiseHit(t+0.1+k*0.05,0.02,'highpass',4500,0.6,0.08,D);break;
    case 'streamers':noiseHit(t,0.2,'lowpass',600,0.8,0.55,D);noiseHit(t+0.05,0.6,'bandpass',3000,1.2,0.08,D,0.05);break;
    case 'fwlaunch':tone(t,'sine',600,0.9,0.04,D,0.02,2200);noiseHit(t,0.8,'bandpass',3500,1,0.05,D,0.1);break;
    case 'boom':noiseHit(t,0.9,'lowpass',500,0.8,0.7,D);tone(t,'sine',80,0.6,0.45,D,0.003,35);for(let k=0;k<8;k++)noiseHit(t+0.2+k*0.06+Math.random()*0.05,0.02,'highpass',4000,0.6,0.1,D);break;
    case 'blinder':noiseHit(t,0.15,'highpass',3000,0.5,0.05,D);break;
    case 'arm':tone(t,'square',880,0.08,0.05,A.uiBus);tone(t+0.1,'square',1320,0.1,0.05,A.uiBus);break;
    case 'disarm':tone(t,'square',660,0.1,0.04,A.uiBus);tone(t+0.1,'square',440,0.12,0.04,A.uiBus);break;
    case 'deny':tone(t,'square',180,0.15,0.05,A.uiBus);break;
    case 'click':tone(t,'triangle',1400,0.025,0.03,A.uiBus,0.001);break;
    case 'go':tone(t,'sine',1046,0.12,0.05,A.uiBus,0.002);tone(t+0.05,'sine',1568,0.12,0.04,A.uiBus,0.002);break;
    case 'ok':tone(t,'sine',880,0.1,0.05,A.uiBus,0.002);tone(t+0.07,'sine',1320,0.14,0.05,A.uiBus,0.002);break;
    case 'cheer':tone(t,'triangle',784,0.15,0.05,A.uiBus);tone(t+0.1,'triangle',1046,0.15,0.05,A.uiBus);tone(t+0.2,'triangle',1568,0.3,0.05,A.uiBus);break;
    case 'perfect':tone(t,'sine',1568,0.09,0.045*amt,A.uiBus,0.002);tone(t+0.05,'sine',2349,0.16,0.04*amt,A.uiBus,0.002);break;
    case 'great':tone(t,'sine',1175,0.1,0.035*amt,A.uiBus,0.002);break;
    case 'combo':tone(t,'triangle',1046,0.08,0.04,A.uiBus);tone(t+0.06,'triangle',1318,0.08,0.04,A.uiBus);tone(t+0.12,'triangle',1568,0.16,0.045,A.uiBus);break;
    case 'dropok':tone(t,'sawtooth',523,0.12,0.03,A.uiBus,0.002);tone(t+0.08,'sawtooth',784,0.12,0.03,A.uiBus,0.002);tone(t+0.16,'sawtooth',1046,0.3,0.035,A.uiBus,0.002);break;
    case 'cash':tone(t,'triangle',1568,0.12,0.06,A.uiBus);tone(t+0.09,'triangle',2093,0.2,0.06,A.uiBus);break;}}
function uiClick(){sfx('click');}
