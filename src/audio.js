// Audio: Web Audio procedural music engine, transport (play/pause/seek/loop), analyser, gain buses, crowd + ambience + SFX
const A={ctx:null,ok:false};
let TR=null; // current track model
const ARP=[0,1,2,1,2,0,1,2,0,2,1,2,0,1,2,1], HOOK=[0,-1,2,-1,1,-1,2,0,-1,2,-1,1,2,-1,1,-1];
const mtof=m=>440*Math.pow(2,(m-69)/12);
function buildTrack(id,o){o=o||{};const t=TMAP[id]||TMAP.bigroom, g=GMAP[t.g];
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
// a "chain" owns all music voices; seeking/pausing fades the old chain out and builds a fresh one (cuts tails cleanly)
function newChain(){const c=A.ctx,old=A.ch;const ch={};
  ch.out=c.createGain();ch.out.connect(A.musicBus);
  ch.comp=c.createDynamicsCompressor();ch.comp.threshold.value=-14;ch.comp.ratio.value=4;ch.comp.attack.value=0.003;ch.comp.release.value=0.2;ch.comp.connect(ch.out);
  ch.drums=c.createGain();ch.drums.gain.value=0.9;ch.drums.connect(ch.comp);
  ch.duck=c.createGain();ch.duck.connect(ch.comp);ch.music=c.createGain();ch.music.gain.value=0.5;ch.music.connect(ch.duck);
  const dl=c.createDelay(1.5);dl.delayTime.value=TR?TR.beat*0.75:0.35;const fb=c.createGain();fb.gain.value=0.3;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2400;
  ch.send=c.createGain();ch.send.gain.value=0.3;ch.send.connect(dl);dl.connect(lp);lp.connect(fb);fb.connect(dl);lp.connect(ch.duck);ch.dl=dl;
  A.ch=ch;A.dist=null;A.rum=null;
  if(old){const t=c.currentTime;old.out.gain.cancelScheduledValues(t);old.out.gain.setValueAtTime(old.out.gain.value,t);old.out.gain.linearRampToValueAtTime(0,t+0.08);setTimeout(()=>{try{old.out.disconnect();}catch(e){}},400);}
}
function env(g,t,a,peak,dec){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(peak,0.0002),t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+dec);}
function noiseHit(t,dur,type,freq,q,vol,dest,att){const c=A.ctx,s=c.createBufferSource();s.buffer=A.noise;const f=c.createBiquadFilter();f.type=type;f.frequency.setValueAtTime(freq,t);f.Q.value=q;const g=c.createGain();env(g,t,att||0.001,vol,dur);s.connect(f);f.connect(g);g.connect(dest||A.ch.drums);s.start(t,Math.random()*1.5);s.stop(t+(att||0.001)+dur+0.05);return f;}
function tone(t,type,freq,dur,vol,dest,att,f2){const c=A.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);env(g,t,att||0.003,vol,dur);o.connect(g);g.connect(dest||A.ch.music);o.start(t);o.stop(t+(att||0.003)+dur+0.05);return o;}
function duckAt(t,d){const g=A.ch.duck.gain;g.cancelScheduledValues(t);g.setValueAtTime(0.3,t);g.linearRampToValueAtTime(1,t+d);}
function kick(t,v){tone(t,'sine',165,0.42,v,A.ch.drums,0.002,42);noiseHit(t,0.015,'highpass',3000,0.5,v*0.25);duckAt(t,0.23);}
function softKick(t,v){tone(t,'sine',110,0.35,v*0.7,A.ch.drums,0.004,45);duckAt(t,0.18);}
function hat(t,v,open){noiseHit(t,open?0.22:0.04,'highpass',open?6500:8500,0.7,v);}
function clap(t,v){for(let k=0;k<3;k++)noiseHit(t+k*0.011,0.03,'bandpass',1400,0.9,v);noiseHit(t+0.033,0.2,'bandpass',1300,0.8,v*0.8);}
function snare(t,v,p){noiseHit(t,0.12,'bandpass',1700+p*1500,0.8,v);tone(t,'triangle',180+p*260,0.08,v*0.5,A.ch.drums);}
function rim(t,v){tone(t,'square',820,0.03,v,A.ch.drums,0.001);noiseHit(t,0.02,'bandpass',2600,2,v*0.6);}
function crash(t,v){noiseHit(t,1.8,'highpass',4500,0.4,v);}
function bass(t,m,dur,v){const c=A.ctx,o=c.createOscillator(),o2=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type='sawtooth';o2.type='square';o.frequency.value=mtof(m);o2.frequency.value=mtof(m+12);
  f.type='lowpass';f.Q.value=7;f.frequency.setValueAtTime(1100,t);f.frequency.exponentialRampToValueAtTime(160,t+dur);env(g,t,0.004,v,dur);const g2=c.createGain();g2.gain.value=0.35;
  o.connect(f);o2.connect(g2);g2.connect(f);f.connect(g);g.connect(A.ch.music);o.start(t);o2.start(t);o.stop(t+dur+0.1);o2.stop(t+dur+0.1);}
function subBass(t,m,dur,v){const c=A.ctx,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=mtof(m);g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v,t+0.05);g.gain.setValueAtTime(v,t+dur-0.08);g.gain.linearRampToValueAtTime(0.0001,t+dur);o.connect(g);g.connect(A.ch.music);o.start(t);o.stop(t+dur+0.05);}
function pad(t,notes,dur,v){const c=A.ctx;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(700,t);f.frequency.linearRampToValueAtTime(1800,t+dur*0.6);const g=c.createGain();
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v,t+0.25);g.gain.setValueAtTime(v,t+Math.max(0.3,dur-0.2));g.gain.linearRampToValueAtTime(0.0001,t+dur+0.3);f.connect(g);g.connect(A.ch.music);g.connect(A.ch.send);
  for(const n of notes)for(const det of [-9,9]){const o=c.createOscillator();o.type='sawtooth';o.frequency.value=mtof(n);o.detune.value=det;o.connect(f);o.start(t);o.stop(t+dur+0.4);}}
function lead(t,m,dur,v){const c=A.ctx,o=c.createOscillator(),o2=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type='square';o2.type='sawtooth';o.frequency.value=mtof(m);o2.frequency.value=mtof(m);o2.detune.value=12;
  f.type='lowpass';f.frequency.setValueAtTime(4200,t);f.frequency.exponentialRampToValueAtTime(900,t+dur);env(g,t,0.004,v,dur);o.connect(f);o2.connect(f);f.connect(g);g.connect(A.ch.music);g.connect(A.ch.send);o.start(t);o2.start(t);o.stop(t+dur+0.1);o2.stop(t+dur+0.1);}
function bell(t,m,dur,v){const c=A.ctx,o=c.createOscillator(),mo=c.createOscillator(),mg=c.createGain(),g=c.createGain();o.type='sine';o.frequency.value=mtof(m);mo.type='sine';mo.frequency.value=mtof(m)*3.5;mg.gain.setValueAtTime(mtof(m)*2,t);mg.gain.exponentialRampToValueAtTime(1,t+dur);
  mo.connect(mg);mg.connect(o.frequency);env(g,t,0.003,v,dur);o.connect(g);g.connect(A.ch.music);g.connect(A.ch.send);o.start(t);mo.start(t);o.stop(t+dur+0.1);mo.stop(t+dur+0.1);}
function riser(t,dur){const c=A.ctx,s=c.createBufferSource();s.buffer=A.noise;s.loop=true;const f=c.createBiquadFilter();f.type='bandpass';f.Q.value=2.5;f.frequency.setValueAtTime(300,t);f.frequency.exponentialRampToValueAtTime(7000,t+dur);
  const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.3,t+dur-0.02);g.gain.linearRampToValueAtTime(0.0001,t+dur+0.01);s.connect(f);f.connect(g);g.connect(A.ch.drums);s.start(t);s.stop(t+dur+0.05);
  tone(t,'sawtooth',110,dur,0.05,A.ch.music,dur*0.9,880);}
function subBoom(t){tone(t,'sine',70,1.8,0.9,A.ch.drums,0.005,28);}
function getDist(){if(!A.dist){const ws=A.ctx.createWaveShaper();const n=1024,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=Math.tanh(x*5);}ws.curve=c;const g=A.ctx.createGain();g.gain.value=0.6;ws.connect(g);g.connect(A.ch.drums);A.dist=ws;}return A.dist;}
function kickHard(t,v){const c=A.ctx,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(330,t);o.frequency.exponentialRampToValueAtTime(58,t+0.07);o.frequency.exponentialRampToValueAtTime(46,t+0.35);
  g.gain.setValueAtTime(v,t);g.gain.setTargetAtTime(0.0001,t+0.22,0.06);o.connect(g);g.connect(getDist());o.start(t);o.stop(t+0.6);noiseHit(t,0.02,'highpass',2500,0.5,v*0.3);duckAt(t,0.2);}
function bigKick(t,v){kick(t,v);tone(t,'sine',62,0.55,v*0.55,A.ch.drums,0.004,38);noiseHit(t,0.05,'lowpass',900,0.7,v*0.3);}
function rumble(t,v){if(!A.rum){const c=A.ctx,lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=150;const dl=c.createDelay(1);dl.delayTime.value=TR.step;const fb=c.createGain();fb.gain.value=0.5;
    lp.connect(dl);dl.connect(fb);fb.connect(dl);const out=c.createGain();out.gain.value=1.1;dl.connect(out);out.connect(A.ch.duck);A.rum=lp;}
  tone(t+0.02,'triangle',52,0.22,v,A.rum,0.01,40);}
function wobble(t,m,dur,rate,v){const c=A.ctx,o=c.createOscillator(),o2=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain(),l=c.createOscillator(),lg=c.createGain();
  o.type='sawtooth';o2.type='square';o.frequency.value=mtof(m);o2.frequency.value=mtof(m-12);f.type='lowpass';f.Q.value=8;f.frequency.value=650;l.type='sine';l.frequency.value=rate;lg.gain.value=1500;l.connect(lg);lg.connect(f.frequency);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+0.01);g.gain.setValueAtTime(v,t+dur-0.03);g.gain.linearRampToValueAtTime(0.0001,t+dur);
  o.connect(f);o2.connect(f);f.connect(g);g.connect(A.ch.music);o.start(t);o2.start(t);l.start(t);o.stop(t+dur+0.05);o2.stop(t+dur+0.05);l.stop(t+dur+0.05);}
function reese(t,m,dur,v){const c=A.ctx,f=c.createBiquadFilter(),g=c.createGain();f.type='lowpass';f.Q.value=4;f.frequency.setValueAtTime(320,t);f.frequency.linearRampToValueAtTime(950,t+dur*0.5);f.frequency.linearRampToValueAtTime(360,t+dur);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+0.02);g.gain.setValueAtTime(v,t+dur-0.05);g.gain.linearRampToValueAtTime(0.0001,t+dur);f.connect(g);g.connect(A.ch.music);
  for(const d of [-20,20]){const o=c.createOscillator();o.type='sawtooth';o.frequency.value=mtof(m);o.detune.value=d;o.connect(f);o.start(t);o.stop(t+dur+0.05);}
  const s=c.createOscillator();s.type='sine';s.frequency.value=mtof(m-12);s.connect(g);s.start(t);s.stop(t+dur+0.05);}
function saw3(t,m,dur,v,cut){const c=A.ctx,f=c.createBiquadFilter(),g=c.createGain();f.type='lowpass';f.frequency.value=cut||5200;env(g,t,0.004,v,dur);f.connect(g);g.connect(A.ch.music);g.connect(A.ch.send);
  for(const d of [-15,0,15]){const o=c.createOscillator();o.type='sawtooth';o.frequency.value=mtof(m);o.detune.value=d;o.connect(f);o.start(t);o.stop(t+dur+0.1);}}
function pluck(t,m,dur,v,bright){const c=A.ctx,o=c.createOscillator(),o2=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type='sawtooth';o2.type='square';o.frequency.value=mtof(m);o2.frequency.value=mtof(m+12);o2.detune.value=7;
  f.type='lowpass';f.Q.value=3;f.frequency.setValueAtTime(bright||7000,t);f.frequency.exponentialRampToValueAtTime(450,t+Math.min(dur,0.25));env(g,t,0.002,v,dur);o.connect(f);o2.connect(f);f.connect(g);g.connect(A.ch.music);g.connect(A.ch.send);o.start(t);o2.start(t);o.stop(t+dur+0.1);o2.stop(t+dur+0.1);}
function stab(t,notes,v,organ){const c=A.ctx,g=c.createGain(),f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=organ?2600:4500;env(g,t,0.003,v,organ?0.16:0.38);f.connect(g);g.connect(A.ch.music);g.connect(A.ch.send);
  for(const n of notes){const o=c.createOscillator();o.type=organ?'square':'triangle';o.frequency.value=mtof(n+12);o.connect(f);o.start(t);o.stop(t+0.45);
    if(!organ){const o2=c.createOscillator();o2.type='sine';o2.frequency.value=mtof(n+24);o2.connect(f);o2.start(t);o2.stop(t+0.3);}}}
// ---- sequencer / transport ----
const SEQ={playing:false,songStart:0,nextStep:0,nextTime:0,pausedPos:0,ended:false,evq:[],fallbackT0:0};
function songPos(){ // show clock in seconds (frozen while paused)
  if(TR&&TR.yt&&typeof ytPos==='function'){const p=ytPos();if(p!=null)return p;}
  if(!SEQ.playing)return SEQ.pausedPos;
  if(!A.ctx||A.ctx.state!=='running')return SEQ.pausedPos+(realNow()-SEQ.fallbackT0);
  return Math.max(0,A.ctx.currentTime-SEQ.songStart-(A.ctx.outputLatency||0));}
const beatPos=()=>TR?songPos()/TR.beat:0;
function startSeq(pos){if(!A.ctx){SEQ.fallbackT0=realNow();return;}const c=A.ctx;newChain();
  SEQ.songStart=c.currentTime+0.06-pos;SEQ.nextStep=Math.max(0,Math.ceil((pos-0.001)/TR.step));SEQ.nextTime=SEQ.songStart+SEQ.nextStep*TR.step;SEQ.evq.length=0;}
function transportPlay(){if(!TR||SEQ.playing)return;initAudio();if(TR.yt){SEQ.playing=true;ytPlay&&ytPlay();Bus.emit('transport','play');return;}
  if(SEQ.ended){SEQ.pausedPos=0;SEQ.ended=false;}SEQ.playing=true;SEQ.fallbackT0=realNow();startSeq(SEQ.pausedPos);Bus.emit('transport','play');}
function transportPause(){if(!SEQ.playing)return;SEQ.pausedPos=songPos();SEQ.playing=false;if(TR&&TR.yt){ytPause&&ytPause();}else if(A.ctx)newChain();Bus.emit('transport','pause');}
function transportSeek(sec){if(!TR)return;sec=clamp(sec,0,TR.loop?1e6:TR.len-0.05);SEQ.ended=false;
  if(TR.yt){ytSeek&&ytSeek(sec);SEQ.pausedPos=sec;Bus.emit('transport','seek');return;}
  SEQ.pausedPos=sec;if(SEQ.playing){SEQ.fallbackT0=realNow();startSeq(sec);}Bus.emit('transport','seek');}
function transportStop(){SEQ.playing=false;SEQ.pausedPos=0;SEQ.ended=false;if(A.ctx&&A.ch)newChain();}
function loadTrack(id,o){transportStop();TR=buildTrack(id,o);if(A.ctx&&A.ch)A.ch.dl.delayTime.value=TR.beat*0.75;setVolumes();Bus.emit('track',TR);return TR;}
function schedule(){if(!SEQ.playing||!A.ctx||A.ctx.state!=='running'||!TR||TR.yt)return;
  const ahead=A.ctx.currentTime+0.16;let guard=0;
  while(SEQ.nextTime<ahead&&guard++<64){if(SEQ.nextTime>A.ctx.currentTime-0.05){try{playStep(SEQ.nextStep,SEQ.nextTime);}catch(e){reportError(e,'music');}}SEQ.nextStep++;SEQ.nextTime=SEQ.songStart+SEQ.nextStep*TR.step;}}
setInterval(schedule,25);
const qev=(t,k,v)=>SEQ.evq.push([t,k,v]);
function playStep(i,t){
  const bar=Math.floor(i/16),s=i%16;
  if(!TR.loop&&bar>=TR.bars){if(bar===TR.bars&&s===0){crash(t,0.4);subBoom(t);pad(t,TR.prog[0].n,TR.bar*2,0.06);qev(t,'end',1);}return;}
  const mb=musBar(bar),sec=secAt(mb),rel=mb-sec.a,len=sec.b-sec.a,ch=TR.prog[mb%TR.prog.length],st=TR.st,B=TR.beat,STP=TR.step,BR=TR.bar;
  const K=v=>{qev(t,'kick',v);switch(st.kick){case 'big':bigKick(t,v);break;case 'hard':kickHard(t,v);break;case 'soft':softKick(t,v);break;case 'rumble':kick(t,v);rumble(t,0.3*v);break;default:kick(t,v);}};
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
    case 'wobble':if(s%4===0){const r=[2,4,3,6][(s/4+rel)%4];wobble(t,ch.r+(rel%4===3&&s===12?7:0),B*0.96,r/B,0.3*lvl);}break;
    case 'growl':if(s%4===2||s===7||s===15)wobble(t,ch.r,STP*1.5,8/B,0.26*lvl);break;
    case 'sub':if(s===0)subBass(t,ch.r,BR*0.95,0.3*lvl);break;}};
  const LEAD=(lvl,oct)=>{const o=oct||0;switch(st.lead){
    case 'pluck':if(HOOK[s]>=0)pluck(t,ch.n[HOOK[s]]+12+o,STP*1.5,0.065*lvl);break;
    case 'saw':if(HOOK[s]>=0)saw3(t,ch.n[HOOK[s]]+12+o,STP*1.6,0.04*lvl);if(s===0)pad(t,ch.n,BR-0.05,0.025*lvl);break;
    case 'stab':if(s===3||s===6||s===10||s===13)stab(t,ch.n,0.07*lvl,false);break;
    case 'organ':if(s===2||s===6||s===10||s===14)stab(t,ch.n,0.06*lvl,true);break;
    case 'arp':saw3(t,ch.n[ARP[s]]+12+o,STP*0.9,0.033*lvl);break;
    case 'bell':if(s%3===0)bell(t,ch.n[ARP[s]]+24+o,STP*2.5,0.05*lvl);break;}};
  if(rel===0&&s===0)qev(t,'section',sec.i);
  if(s===0)qev(t,'bar',mb);
  switch(sec.t){
    case 'intro':groove(false);if(s===0&&rel%2===0)pad(t,ch.n,BR*2-0.1,0.04*st.pad);if(rel>=len/2&&s%4===2&&st.bass!=='reese'&&st.bass!=='wobble')BASS(0.6);break;
    case 'groove':groove(true);BASS(0.75);if(s===0&&rel%2===0)pad(t,ch.n,BR*2-0.1,0.03*st.pad);if(rel>=len/2&&(st.lead==='arp'||st.lead==='bell'||st.lead==='stab'))LEAD(0.5);break;
    case 'build':{const p=rel/len,last=rel===len-1;if(s===0&&rel===0)riser(t,BR*len);if(last&&s>=12){if(s===12)qev(t,'gap',1);break;}
      if(st.kick==='hard'&&rel>=len-4){const ev=rel<len-2?4:rel<len-1?2:1;if(s%ev===0)K(0.5+0.4*p);}
      else if(rel<len/2){if(st.drums==='half'||st.drums==='soft'){if(s===0)K(0.8);}else if(st.drums==='break'){if(s===0||s===10)K(0.85);}else if(s%4===0)K(0.85);}
      const every=p<0.25?8:p<0.5?4:p<0.75?2:1;if(s%every===0&&!(p<0.25&&s%8!==4))SN(0.12+0.4*p,p);
      if(s%2===1)hat(t,0.05+0.08*p,false);if(rel<len/2&&s%4===2&&st.drums!=='half')bass(t,ch.r,B*0.45,0.22);
      if(s===0)pad(t,ch.n,BR-0.05,(0.04+0.03*p)*st.pad);
      if((st.lead==='arp'||st.lead==='saw')&&s%2===0)saw3(t,ch.n[ARP[s]]+12,STP*0.8,0.018+0.02*p,1500+3500*p);
      if(st.lead==='pluck'&&rel>=len/2&&HOOK[s]>=0)pluck(t,ch.n[HOOK[s]]+12,STP*1.2,0.03+0.03*p,1500+4000*p);
      break;}
    case 'drop':case 'peak':
      if(rel===0&&s===0){crash(t,0.5);subBoom(t);qev(t,'drop',sec.i);}else if(rel%(sec.t==='peak'?4:8)===0&&s===0)crash(t,0.3);
      groove(true);BASS(1);LEAD(1,sec.t==='peak'&&rel>=len/2?12:0);if(st.lead==='none'&&s===0&&rel%2===0)pad(t,ch.n,BR*2-0.1,0.02);if(sec.t==='peak'&&s===0)pad(t,ch.n,BR-0.05,0.03*st.pad);break;
    case 'main':groove(true);BASS(0.85);if(st.lead!=='saw'&&st.lead!=='pluck')LEAD(0.6);else if(s%4===0&&HOOK[s]>=0)pluck(t,ch.n[HOOK[s]]+12,STP*1.4,0.04);if(s===0&&rel%2===0)pad(t,ch.n,BR*2-0.1,0.025*st.pad);break;
    case 'break':if(rel===0&&s===0)crash(t,0.25);if(s===0)pad(t,ch.n,BR,0.07*st.pad);if(s%4===2)hat(t,0.04,false);
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
function gridEvents(){if(!TR||!(TR.yt||!A.ctx||A.ctx.state!=='running'))return;if(!SEQ.playing&&!(TR.yt&&ytPlaying()))return;const stp=Math.floor(songPos()/TR.step);if(stp===lastGridStep)return;
  if(stp<lastGridStep||stp-lastGridStep>8){lastGridStep=stp;return;}
  for(let i=lastGridStep+1;i<=stp;i++){const s=i%16,mb=Math.floor(i/16),sec=secAt(musBar(mb));if(s===0){Bus.emit('mus','bar',mb);if(mb===sec.a)Bus.emit('mus',sec.t==='drop'?'drop':'section',sec.i);}
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
