// v2.2: real tracks stream via <audio> -> MediaElementSource -> analyser; show clock follows the song; drop events within 1 beat of analysed drops.
const {launch,page}=require('./lib');const URL=process.env.FC_URL||'http://127.0.0.1:18432/index.html';
const vp=process.argv[2]||'desktop',ids=(process.argv[3]||'r_again,r_party,r_haunted').split(',');
(async()=>{const b=await launch();const {p,errs}=await page(b,vp,URL);let fail=0;const res=[];
 await p.evaluate(()=>{const f=__fc;window.__drops=[];f.Bus.on('mus',(k,v)=>{if(k==='end')window.__end=1;if(k==='drop'){const T=f.TR(),s=T.secs[v];window.__drops.push({sp:f.songPos(),nom:s.a*T.bar,ct:f.FILE.cur?f.FILE.cur.el.currentTime:-1});}});
  window.__fps=0;let n=0,t=performance.now();(function L(){n++;const d=performance.now()-t;if(d>2000){window.__fps=n*1000/d;n=0;t=performance.now();}requestAnimationFrame(L);})();});
 for(const id of ids){
  const r=await p.evaluate(async(id)=>{const f=__fc,meta=f.REAL_TRACKS.find(t=>t.id===id).real,W=ms=>new Promise(r=>setTimeout(r,ms));
   f.startSession({mode:'free',venue:4,env:'night',track:id,dj:null,style:'energetic',crowdSize:'arena',auto:'assisted',short:false,scored:false});
   const T=f.TR(),el=f.FILE.cur.el;for(let i=0;i<100&&el.readyState<3;i++)await W(100);
   const out={id,file:T.file,hasSrc:!!f.FILE.cur.src,drops:[]};
   for(const d of meta.drops.slice(0,2)){window.__drops=[];f.transportSeek(Math.max(0,d-T.fileT0-4));await W(6500);
     const e=window.__drops[0];out.drops.push({drop:d,nomFile:e?e.nom+T.fileT0:null,errBeats:e?(e.nom+T.fileT0-d)/T.beat:null,lagBeats:e?(e.sp-e.nom)/T.beat:null,clockVsEl:e?(e.ct-T.fileT0-e.sp):null});}
   out.rms=f.AN.rms;out.src=f.AN.src;f.transportPause();const p0=f.songPos();await W(800);out.pauseHold=Math.abs(f.songPos()-p0)<0.01&&el.paused;
   f.transportPlay();await W(800);out.resumed=!el.paused&&f.songPos()>p0;
   window.__end=0;f.transportSeek(T.len-3);await W(4500);out.ended=!!window.__end&&f.songPos()<1&&el.paused;out.fps=window.__fps;return out;},id);
  for(const d of r.drops){if(d.errBeats===null||Math.abs(d.errBeats)>1||Math.abs(d.clockVsEl)>0.1)fail++;}
  if(!r.hasSrc||r.src!=='music'||r.rms<0.05||!r.pauseHold||!r.resumed||!r.ended)fail++;
  console.log(JSON.stringify(r));}
 // fallback: broken file -> synth version, show keeps running
 const fb=await p.evaluate(async()=>{const f=__fc,W=ms=>new Promise(r=>setTimeout(r,ms));const t=f.REAL_TRACKS[0];const keep=t.real.file;t.real.file='music/missing.mp3';
   f.startSession({mode:'free',venue:4,env:'night',track:t.id,dj:null,style:'energetic',crowdSize:'arena',auto:'assisted',short:true,scored:false});await W(2500);
   const T=f.TR(),r={file:T.file,failed:T.fileFailed,playing:f.SEQ.playing,pos:f.songPos()};t.real.file=keep;return r;});
 if(fb.file!==null||!fb.failed||!fb.playing||fb.pos<0.5)fail++;console.log('fallback',JSON.stringify(fb));
 const e2=errs.filter(e=>!/missing\.mp3|404/.test(e));console.log('errs',e2);console.log(fail||e2.length?'REALTRACK FAIL '+fail:'REALTRACK PASS');await b.close();process.exit(fail?1:0);})();
