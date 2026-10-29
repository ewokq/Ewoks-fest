/*YTPARSE*/
// Parse any YouTube link (watch?v=, youtu.be/, shorts/, embed/, live/, music./m./www., extra params, timestamps) -> {id,start} or null
function parseYouTube(input){
  if(typeof input!=='string') return null;
  let s=input.trim().replace(/^[<"'\s]+|[>"'\s]+$/g,'');
  if(!s) return null;
  const ID=/^[A-Za-z0-9_-]{11}$/;
  if(ID.test(s)) return {id:s,start:0};
  if(!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s='https://'+s.replace(/^\/+/,'');
  let u; try{u=new URL(s);}catch(e){return null;}
  const host=u.hostname.toLowerCase().replace(/^(www|m|music|gaming)\./,'');
  const tparse=v=>{if(!v)return 0;v=String(v);if(/^\d+(\.\d+)?$/.test(v))return Math.floor(+v);const m=v.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/i);return m?((+m[1]||0)*3600+(+m[2]||0)*60+(+m[3]||0)):0;};
  const start=tparse(u.searchParams.get('t')||u.searchParams.get('start')||((u.hash.match(/t=([^&]+)/)||[])[1]));
  let id=null;
  if(host==='youtu.be'){id=u.pathname.split('/')[1];}
  else if(host==='youtube.com'||host==='youtube-nocookie.com'){
    const p=u.pathname.split('/').filter(Boolean);
    if(u.searchParams.get('v')) id=u.searchParams.get('v');
    else if(p[0]&&['shorts','embed','live','v','e','watch'].includes(p[0])&&p[1]) id=p[1];
    else if(p[0]==='attribution_link'&&u.searchParams.get('u')) return parseYouTube('https://www.youtube.com'+u.searchParams.get('u'));
  }
  if(!id) return null;
  id=id.slice(0,11);
  return ID.test(id)?{id,start}:null;
}
/*/YTPARSE*/
/*TEMPO*/
// ---- Auto BPM: pure onset + tempo estimation ----
// makeOnset(): returns fn(lowBand, highBand) -> onset strength for one block (log-energy flux, half-wave rectified)
function makeOnset(){let pl=null,ph=null;return function(lo,hi){let el=0,eh=0;const n=lo.length;for(let i=0;i<n;i++){el+=lo[i]*lo[i];eh+=hi[i]*hi[i];}
  const l=Math.log(1e-10+el/n),h=Math.log(1e-10+eh/n);const fl=pl===null?0:Math.max(0,l-pl),fh=ph===null?0:Math.max(0,h-ph);pl=l;ph=h;return 0.7*fl+0.3*fh;};}
// EDM tempo prior: house/big room/trance/dubstep 120-150 and DnB 170-176 preferred; slow (halftime) values discouraged
function tempoPrior(b){return b<95?0.55:b<110?0.75:b<=152?1:b<165?0.82:b<=177?0.97:0.8;}
// estimateTempo(env, fps) -> {bpm, conf 0..1, phase (frame index of a beat), down (0..3 beat offset of the likely "1"), z} or null
function estimateTempo(env,fps,o){o=o||{};const lo=o.min||70,hi=o.max||180,n=env.length;if(n<fps*4)return null;
  const w=Math.max(2,Math.round(fps*0.2)),ps=new Float64Array(n+1);for(let i=0;i<n;i++)ps[i+1]=ps[i]+env[i];
  const x=new Float32Array(n);let m2=0;for(let i=0;i<n;i++){const a=Math.max(0,i-w),b=Math.min(n,i+w+1);const v=Math.max(0,env[i]-(ps[b]-ps[a])/(b-a));x[i]=v;m2+=v*v;}
  if(m2<=1e-12)return {bpm:0,conf:0,phase:0,down:0,z:0,r:0};
  let mx=0;for(let i=0;i<n;i++)mx+=x[i];mx/=n;const xc=new Float32Array(n);for(let i=0;i<n;i++)xc[i]=x[i]-mx; // zero-mean copy for autocorrelation
  const maxLag=Math.min(n-2,Math.max(Math.ceil(60*fps/lo*4)+2,Math.floor(n*0.6))),ac=new Float32Array(maxLag+2);
  for(let l=0;l<=maxLag+1&&l<n;l++){let s=0;for(let i=0;i+l<n;i++)s+=xc[i]*xc[i+l];ac[l]=s/(n-l);}
  const ac0=ac[0]||1e-12;
  const A=t=>{if(t>maxLag)return 0;const i=Math.floor(t),f=t-i;return ac[i]*(1-f)+ac[i+1]*f;};
  // peak-picking autocorrelation: take the max within +-1 frame so slight tempo drift still counts
  const AP=t=>Math.max(A(t-1),A(t-0.5),A(t),A(t+0.5),A(t+1));
  const WK=[1,0.7,0.5,0.4];
  const S=b=>{const L=60*fps/b;let s=0,ws=0;for(let k=1;k<=4;k++){if(k*L>maxLag)break;s+=AP(k*L)*WK[k-1];ws+=WK[k-1];}return ws?s/ws:0;};
  const grid=[];for(let b=lo;b<=hi+1e-9;b+=0.5)grid.push([b,S(b)]);
  let mean=0;grid.forEach(g=>mean+=g[1]);mean/=grid.length;let sd=0;grid.forEach(g=>sd+=(g[1]-mean)*(g[1]-mean));sd=Math.sqrt(sd/grid.length)||1e-9;
  let best=null;for(const [b,s] of grid){const v=s*tempoPrior(b);if(!best||v>best[2])best=[b,s,v];}
  let bpm=best[0];
  // octave folding: halftime reads (e.g. 70, 87) become 140 / 174 if the double tempo is also well supported
  if(bpm<100&&bpm*2<=hi+1&&S(bpm*2)>=0.6*best[1])bpm=bpm*2;
  // DnB: a kick pattern on 1 and the "and" of 2 can read as 2/3 tempo (~115); prefer 172-175 if it is nearly as strong
  else if(bpm>=105&&bpm<=120&&bpm*1.5<=hi+1&&S(bpm*1.5)>=0.75*best[1])bpm=bpm*1.5;
  // fine refinement with exact (non peak-picked) autocorrelation
  const SF=b=>{const L=60*fps/b;let s=0;for(let k=1;k<=16;k++){if(k*L>maxLag)break;s+=A(k*L);}return s;}; // long-lag harmonics = fine tempo resolution
  let fb=bpm,fs=-1;for(let b=bpm-0.6;b<=bpm+0.6;b+=0.05){const s=SF(b);if(s>fs){fs=s;fb=b;}}bpm=Math.round(fb*10)/10;
  // confidence: how far the winner stands out (z) AND how periodic the onsets really are (r = normalized autocorrelation); noise has r ~ 0
  const z=(S(bpm)-mean)/sd, r=S(bpm)/ac0, conf=Math.max(0,Math.min(1,(z-1.2)/3))*Math.max(0,Math.min(1,(r-0.08)/0.22));
  // phase: comb over the window, most recent beats weigh more
  const P=60*fps/bpm,X=t=>{if(t<0||t>n-1)return 0;const i=Math.floor(t),f=t-i;return x[i]*(1-f)+(i+1<n?x[i+1]:0)*f;};
  let bp=0,bv=-1;for(let p=0;p<P;p+=0.25){let s=0;for(let t=p,k=0;t<n;t+=P,k++)s+=(X(t-1)*0.25+X(t)*0.5+X(t+1)*0.25)*(0.6+0.4*t/n);if(s>bv){bv=s;bp=p;}}
  // likely downbeat: the beat slot (of 4) with the strongest onsets
  const slot=[0,0,0,0];for(let t=bp,k=0;t<n;t+=P,k++)slot[k%4]+=X(t);let down=0;for(let j=1;j<4;j++)if(slot[j]>slot[down])down=j;
  return {bpm,conf,phase:bp,down,z,r};
}
/*/TEMPO*/
// ================= MY SONG (YouTube, audio only) =================
// Official IFrame Player API, loaded only when this mode is opened. The player stays rendered (nearly invisible) so iOS keeps its audio.
// The page cannot read YouTube audio (cross-origin), so the beat grid comes from BPM + phase, set by Auto BPM (mic), TAP or SYNC.
const YT={api:'none',player:null,ready:false,id:null,start:0,bpm:Store.get('ytBpm',128),off:0,state:-1,vt:0,rt:0,raw:-1,taps:[],drop:null,title:'',pending:false,err:'',revealT:0,checkN:0,url:'',msg:''};
const YT_BPMS=[100,122,124,126,128,130,138,140,150,174];
const YT_ERR={2:"That link doesn't point to a valid video. Check it and try again.",5:"This video can't play in the browser player. Try another upload of the song.",100:"That video was removed or is private. Try another upload of the song.",101:"This upload can't play outside YouTube. Try another upload of the song.",150:"This upload can't play outside YouTube. Try another upload of the song.",153:"YouTube refused to play here. Open the game from its web link (not a saved file) and try again."};
function ytCall(fn,...a){try{if(YT.player&&YT.ready&&YT.player[fn])return YT.player[fn](...a);}catch(e){}}
function ytMsg(m,ok){YT.msg=m||'';const el=$('ytMsg');if(el){el.textContent=m||'';el.style.color=ok?'var(--ok)':'var(--warn)';}}
function loadYTApi(){if(YT.api==='ready'||YT.api==='loading')return;if(window.YT_API_READY){YT.api='ready';return;}YT.api='loading';
  const prev=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{YT.api='ready';window.YT_API_READY=true;if(prev)try{prev();}catch(e){}ytInputChanged();};
  const sc=document.createElement('script');sc.src='https://www.youtube.com/iframe_api';sc.async=true;sc.onerror=()=>{YT.api='fail';sc.remove();ytMsg("Couldn't reach YouTube. Check your connection and try again (the rest of the game works offline).");};
  document.head.appendChild(sc);setTimeout(()=>{if(YT.api==='loading'){YT.api='fail';ytMsg('YouTube is taking too long to load. Check your connection and try again.');}},15000);}
function ytEnsurePlayer(id,start){if(YT.api!=='ready'||!window.YT||!window.YT.Player)return false;
  if(YT.player){if(YT.id!==id&&YT.ready)YT.player.cueVideoById({videoId:id,startSeconds:start||0});YT.id=id;YT.start=start||0;return true;}
  YT.id=id;YT.start=start||0;const pv={playsinline:1,rel:0,controls:1,fs:0,start:start||0};if(/^https?:/.test(location.protocol))pv.origin=location.origin;
  try{YT.player=new window.YT.Player('ytPlayer',{width:'100%',height:'100%',videoId:id,playerVars:pv,events:{
    onReady:()=>{YT.ready=true;ytVol();if(YT.id!==id)YT.player.cueVideoById({videoId:YT.id,startSeconds:YT.start});if(YT.pending){YT.pending=false;ytCall('playVideo');ytAutoplayCheck();}},
    onStateChange:e=>{YT.state=e.data;if(e.data===1){YT.err='';ytTitle();ytReveal(false);if(TR&&TR.yt)abStart();}if(e.data===5)ytTitle();if(e.data===0&&TR&&TR.yt){Bus.emit('mus','end',1);}
      if(TR&&TR.yt&&SEQ.playing&&e.data===2){ytAutoplayCheck(1200);}},
    onError:e=>ytOnError(e.data)}});}catch(e){ytMsg("Couldn't start the YouTube player. Try again.");return false;}return true;}
function ytVol(){ytCall('setVolume',Math.round(100*ST.vol.music*ST.vol.master));}
function ytOnError(code){const m=YT_ERR[code]||"This video can't be played here. Try another upload of the song.";YT.err=m;ytMsg(m);ytReveal(false);if(TR&&TR.yt)toast(m,4500);return m;}
function ytReveal(on){document.body.classList.toggle('ytreveal',!!on);}
function ytAutoplayCheck(ms){clearTimeout(YT.revealT);YT.checkN=0;const chk=()=>{if(!(TR&&TR.yt&&SEQ.playing)||YT.err||YT.state===1){if(YT.state===1)ytReveal(false);return;}
  if(YT.state===3&&YT.checkN++<3){YT.revealT=setTimeout(chk,1200);return;}ytReveal(true);};YT.revealT=setTimeout(chk,ms||2500);}
function ytTitle(){const d=ytCall('getVideoData');if(d&&d.title){YT.title=d.title;ytMsg('\u2713 '+d.title,true);ytRemember();if(TR&&TR.yt){TR.title=d.title;}}}
function ytRecent(){const r=Store.get('ytRecent',[]);return Array.isArray(r)?r.filter(x=>x&&typeof x.id==='string'):[];}
function ytRemember(){if(!YT.id)return;const prev=ytRecent().find(x=>x.id===YT.id)||{};let r=ytRecent().filter(x=>x.id!==YT.id);
  r.unshift({id:YT.id,url:YT.url||('https://youtu.be/'+YT.id),title:YT.title||prev.title||'',bpm:YT.bpm,off:YT.off,start:YT.start});Store.set('ytRecent',r.slice(0,10));}
function ytTime(){const p=YT.player;if(!p||!YT.ready||!p.getCurrentTime)return YT.vt;const raw=+p.getCurrentTime()||0,now=realNow();
  if(YT.state!==1){YT.vt=raw;YT.rt=now;YT.raw=raw;return raw;}const pred=YT.vt+(now-YT.rt);
  if(raw!==YT.raw){YT.raw=raw;const e=raw-pred;YT.vt=Math.abs(e)>0.2?raw:pred+e*0.25;YT.rt=now;return YT.vt;}return pred;}
function ytPos(){if(!YT.player||!YT.ready||YT.state<0||YT.state===5)return SEQ.playing?SEQ.pausedPos+(realNow()-SEQ.fallbackT0):SEQ.pausedPos;return Math.max(0,ytTime()-YT.off);}
const ytPlaying=()=>!!(TR&&TR.yt&&YT.state===1);
function ytPlay(){SEQ.fallbackT0=realNow();if(YT.ready){ytCall('playVideo');ytAutoplayCheck();}else YT.pending=true;}
function ytPause(){ytCall('pauseVideo');}
function ytSeek(sec){ytCall('seekTo',sec+YT.off,true);YT.vt=sec+YT.off;YT.rt=realNow();}
// sections for an unknown song: 16-bar blocks; once the user marks the DROP, blocks are counted from it
function ytSecAt(mb){const mk=(i,n,t,a)=>({i,n,t,a,b:a+16,e:SEC_ENERGY[t]});
  if(YT.drop!=null&&mb>=YT.drop){const k=Math.floor((mb-YT.drop)/16),cyc=[[3,'DROP','drop'],[5,'BREAKDOWN','break'],[6,'BUILD-UP','build'],[7,'DROP','drop']];const c=k===0?cyc[0]:cyc[1+((k-1)%3)];return mk(c[0],c[1],c[2],YT.drop+k*16);}
  const p=Math.floor(Math.max(0,mb)/16);const s=p===0?mk(0,'INTRO','intro',0):mk(1,'GROOVE','groove',p*16);if(YT.drop!=null&&s.b>YT.drop)s.b=YT.drop;return s;}
function ytTrack(){const bpm=YT.bpm;const tr={id:'yt',title:YT.title||'My Song',dj:{name:'YOU',col:'#ff2bd6'},g:{id:'yt',name:'My Song (YouTube)',pal:'main'},st:{},bpm,beat:60/bpm,secs:[],bars:1e5,prog:GMAP.bigroom.prog,loop:true,yt:true,markers:[]};
  tr.bar=tr.beat*4;tr.step=tr.beat/4;tr.loopA=0;tr.loopB=1e5;tr.len=1e6;return tr;}
function ytSetBpm(v,quiet){v=clamp(Math.round(v*10)/10,60,200);
  if(TR&&TR.yt){const vt=ytTime(),beats=(vt-YT.off)/TR.beat;YT.bpm=v;TR.bpm=v;TR.beat=60/v;TR.bar=TR.beat*4;TR.step=TR.beat/4;YT.off=vt-beats*TR.beat;lastGridStep=-1;}else YT.bpm=v;
  Store.set('ytBpm',YT.bpm);if(!quiet)toast(YT.bpm+' BPM');ytRemember();Bus.emit('ytbpm',YT.bpm);}
let ytDeb=0;
function ytInputChanged(){clearTimeout(ytDeb);ytDeb=setTimeout(()=>{const inp=$('ytUrl');if(!inp)return;const v=inp.value;if(!v.trim()){ytMsg('');return;}const p=parseYouTube(v);
  if(!p){ytMsg("That doesn't look like a YouTube link. Paste the whole link from the Share button.");return;}YT.url=v.trim();YT.err='';
  if(YT.api==='fail'){YT.api='none';loadYTApi();}
  if(ytEnsurePlayer(p.id,p.start)){if(!YT.title||YT.id!==p.id)ytMsg('\u2713 Video found: tap START',true);}else ytMsg(YT.api==='loading'?'Loading YouTube\u2026':'',true);},120);}
function ytStart(){ // runs inside the tap handler so iOS lets the video start
  const inp=$('ytUrl'),p=parseYouTube(inp?inp.value:'');
  if(!p){ytMsg(inp&&inp.value.trim()?"That doesn't look like a YouTube link. Paste the whole link from the Share button.":'Paste a YouTube link first.');return false;}
  if(YT.err&&YT.id===p.id){ytMsg(YT.err);return false;}YT.url=inp.value.trim();
  if(YT.api==='fail'){YT.api='none';loadYTApi();ytMsg('Retrying YouTube\u2026');return false;}
  if(!ytEnsurePlayer(p.id,p.start)){YT.pending=true;}
  else if(YT.ready){if(YT.player.getVideoData&&YT.player.getVideoData().video_id!==p.id)YT.player.loadVideoById({videoId:p.id,startSeconds:p.start||0});else YT.player.playVideo();ytAutoplayCheck();}
  else YT.pending=true;
  const rec=ytRecent().find(x=>x.id===p.id);if(rec){if(rec.off!=null)YT.off=rec.off;if(rec.bpm)YT.bpm=rec.bpm;}
  YT.drop=null;ytRemember();return true;}
function ytTap(e){const now=realNow(),T=YT.taps;if(T.length&&now-T[T.length-1]>2)T.length=0;T.push(now);if(T.length>9)T.shift();
  if(T.length>=4){const iv=(T[T.length-1]-T[0])/(T.length-1);let bpm=60/iv;while(bpm<90)bpm*=2;while(bpm>190)bpm/=2;bpm=Math.round(bpm*2)/2;abManual();const near=YT_BPMS.find(x=>Math.abs(x-bpm)<=1);ytSetBpm(near||bpm,true);
    const vt=ytTime(),k=Math.round((vt-YT.off)/TR.beat);YT.off=vt-k*TR.beat;lastGridStep=-1;return 'TAP '+(Math.round(YT.bpm*10)/10);}buzz(8);return 'TAP '+T.length+'/4';}
function ytSync(){abManual();const vt=ytTime(),k=Math.round((vt-YT.off)/TR.bar);YT.off=vt-k*TR.bar;lastGridStep=-1;toast('Synced: this is beat 1');buzz(12);ytRemember();}
function ytNudge(d){abManual();YT.off+=d;lastGridStep=-1;toast((d>0?'Later':'Earlier')+' '+Math.abs(d*1000|0)+' ms');ytRemember();}
function ytMarkDrop(){if(!(TR&&TR.yt))return;const rb=Math.max(0,Math.floor(songPos()/TR.bar+0.25));YT.drop=rb;Bus.emit('mus','drop',3);toast('DROP marked at bar '+(rb+1)+': sections now count from here');}
// ================= AUTO BPM (listens to the song through the mic) =================
const AB={on:Store.get('ytAuto',true),state:'off',stream:null,nodes:[],ctx:null,own:false,env:[],t0:0,blk:512,sr:48000,d:null,dS:[],bpm:0,conf:0,locked:false,lastEst:0,pend:0,hold:0,disagree:0,ests:0,IN_LAT:0.02,MIN:0.3,an:null,fbin:null};
const abFps=()=>AB.sr/AB.blk;
function abSession(t){try{if(navigator.audioSession)navigator.audioSession.type=t;}catch(e){}}
async function abStart(){if(!AB.on||AB.stream||AB.state==='asking'||!(TR&&TR.yt&&SEQ.playing))return;
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!window.isSecureContext){AB.state='nomic';abUI();return;}
  initAudio();AB.state='asking';abUI();let s;
  try{abSession('play-and-record');s=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false,channelCount:1}});}
  catch(e){abSession('playback');AB.state=(e&&e.name==='NotAllowedError')?'denied':'nomic';abUI();toast(AB.state==='denied'?'Mic blocked: use TAP / SYNC to match the beat':'No mic available: use TAP / SYNC',3200);abResumeOut();return;}
  if(!AB.on||!(TR&&TR.yt&&SEQ.playing)){s.getTracks().forEach(t=>t.stop());abSession('playback');AB.state='off';abUI();abResumeOut();return;}
  AB.stream=s;try{abGraph(A.ctx,false);}catch(e){try{const AC=window.AudioContext||window.webkitAudioContext,tr=s.getAudioTracks()[0],sr=(tr&&tr.getSettings&&tr.getSettings().sampleRate)||undefined;abGraph(new AC(sr?{sampleRate:sr}:{}),true);}catch(e2){abStop();AB.state='nomic';abUI();return;}}
  AB.state='listening';AB.env=[];AB.d=null;AB.dS=[];AB.lastEst=0;AB.ests=0;abUI();abResumeOut();}
function abGraph(c,own){const src=c.createMediaStreamSource(AB.stream),lp=c.createBiquadFilter(),hp=c.createBiquadFilter(),mg=c.createChannelMerger(2),pr=c.createScriptProcessor(AB.blk,2,1),z=c.createGain();
  lp.type='lowpass';lp.frequency.value=150;lp.Q.value=0.7;hp.type='highpass';hp.frequency.value=3000;z.gain.value=0;
  src.connect(lp);src.connect(hp);lp.connect(mg,0,0);hp.connect(mg,0,1);mg.connect(pr);pr.connect(z);z.connect(c.destination);
  const an=c.createAnalyser();an.fftSize=1024;an.smoothingTimeConstant=0.6;src.connect(an);AB.an=an;AB.fbin=new Uint8Array(an.frequencyBinCount); // mic analyser drives light reactivity in My Song
  const on=makeOnset();AB.sr=c.sampleRate;AB.ctx=c;AB.own=own;AB.nodes=[src,lp,hp,mg,pr,z,an];AB.t0=-1;
  pr.onaudioprocess=e=>{const ib=e.inputBuffer,bt=AB.blk/AB.sr;if(AB.t0<0){AB.t0=e.playbackTime-bt*2;AB.T0p=e.playbackTime;AB.cnt=0;}
    const lag=Math.floor((e.playbackTime-AB.T0p)/bt+0.5)-AB.cnt;if(lag>0&&lag<200){AB.cnt+=lag;for(let i=0;i<lag;i++)AB.env.push(0);}else if(lag>=200){AB.T0p=e.playbackTime;AB.cnt=0;AB.env=[];AB.t0=e.playbackTime-bt*2;}
    AB.cnt++;AB.env.push(on(ib.getChannelData(0),ib.numberOfChannels>1?ib.getChannelData(1):ib.getChannelData(0)));
    const keep=Math.ceil(abFps()*14);if(AB.env.length>keep*1.5){const cut=AB.env.length-keep;AB.env.splice(0,cut);AB.t0+=cut*AB.blk/AB.sr;}};
  if(c.state!=='running')c.resume().catch(()=>{});}
function abResumeOut(){[0,250,900].forEach(ms=>setTimeout(()=>{if(A.ctx&&A.ctx.state==='suspended'&&!document.hidden)A.ctx.resume().catch(()=>{});if(AB.own&&AB.ctx&&AB.ctx.state!=='running')AB.ctx.resume().catch(()=>{});},ms));}
function abStop(keepState){AB.nodes.forEach(n=>{try{n.disconnect();}catch(e){}});if(AB.nodes[4])AB.nodes[4].onaudioprocess=null;AB.nodes=[];AB.an=null;
  if(AB.stream){AB.stream.getTracks().forEach(t=>t.stop());AB.stream=null;abSession('playback');abResumeOut();}
  if(AB.own&&AB.ctx){try{AB.ctx.close();}catch(e){}}AB.ctx=null;AB.own=false;AB.env=[];AB.pend=0;if(!keepState&&AB.state!=='denied'&&AB.state!=='nomic')AB.state=AB.on?'idle':'off';abUI();}
function abToggle(){AB.on=!AB.on;Store.set('ytAuto',AB.on);if(AB.on){if(AB.state==='denied'||AB.state==='nomic')AB.state='off';AB.locked=false;if(TR&&TR.yt&&SEQ.playing&&YT.state===1)abStart();else abUI();toast('Auto BPM on');}else{abStop();AB.state='off';abUI();toast('Auto BPM off: manual BPM');}}
function abTick(){if(!(TR&&TR.yt&&SEQ.playing))return;
  if(AB.on&&!AB.stream&&AB.state!=='asking'&&AB.state!=='denied'&&AB.state!=='nomic'&&YT.state===1){abStart();return;}
  if(!AB.stream||!AB.ctx||YT.state!==1||AB.t0<0)return;
  const d=ytTime()-AB.ctx.currentTime;AB.dS.push(d);if(AB.dS.length>9)AB.dS.shift();const dm=AB.dS.slice().sort((a,b)=>a-b)[AB.dS.length>>1];
  if(AB.d!==null&&Math.abs(dm-AB.d)>0.15){AB.env=[];AB.t0=-1;AB.dS=[d];AB.d=null;AB.lastEst=0;return;}AB.d=dm;
  const fps=abFps(),have=AB.env.length/fps,now=realNow();if(!AB.locked){AB.state='listening';abUI(Math.max(0,Math.ceil(7-have)));}
  if(have<(AB.locked?6:7)||now-AB.lastEst<(AB.locked?3:2))return;AB.lastEst=now;
  const N=Math.min(AB.env.length,Math.round(fps*10)),off0=AB.env.length-N,r=estimateTempo(AB.env.slice(off0),fps);if(!r)return;AB.ests++;
  AB.conf=AB.conf?AB.conf*0.5+r.conf*0.5:r.conf;
  if(r.conf<AB.MIN){if(!AB.locked&&AB.ests>=4&&AB.ests%4===0)toast("Can't hear a clear beat: turn the volume up, or use TAP",3000);abUI();return;}
  const B=TR.beat,beatVt=AB.t0+(off0+r.phase)*AB.blk/AB.sr-AB.IN_LAT+AB.d;
  if(!AB.locked||(now<AB.hold?false:Math.abs(r.bpm-YT.bpm)>=4&&r.conf>=0.5&&++AB.disagree>=3)){AB.disagree=0;if(now<AB.hold&&AB.locked)return;
    ytSetBpm(r.bpm,true);const down=beatVt+r.down*TR.beat;YT.off=down-Math.round((down-YT.off)/TR.bar)*TR.bar;lastGridStep=-1;
    AB.locked=true;AB.bpm=r.bpm;AB.state='locked';abUI();toast('Locked to your song: '+r.bpm+' BPM',2400);buzz(15);ytRemember();return;}
  if(Math.abs(r.bpm-YT.bpm)<4)AB.disagree=0;if(now<AB.hold){abUI();return;}
  if(Math.abs(r.bpm-YT.bpm)<4&&Math.abs(r.bpm-YT.bpm)>0.12)ytSetBpm(YT.bpm+(r.bpm-YT.bpm)*0.4,true);AB.bpm=r.bpm;
  let e=((beatVt-YT.off)%B+B)%B;if(e>B/2)e-=B;AB.pend=clamp(e*0.6,-B/4,B/4);AB.state='locked';abUI();}
function abApply(){const now=realNow(),dt=Math.min(0.1,now-(AB.lastApply||now));AB.lastApply=now;if(!AB.pend)return;const mx=0.04*dt,s=clamp(AB.pend,-mx,mx);AB.pend=Math.abs(AB.pend-s)<1e-5?0:AB.pend-s;YT.off+=s;}
function abManual(){AB.hold=realNow()+15;AB.pend=0;}
function abLabel(secsLeft){const bars=n=>'\u25AE'.repeat(n)+'\u25AF'.repeat(4-n),c=Math.max(0,Math.min(4,Math.round(AB.conf*4)));
  if(!AB.on)return 'AUTO BPM: OFF';if(AB.state==='asking')return 'Allow the mic to auto-match BPM';if(AB.state==='denied')return 'Mic blocked: use TAP';if(AB.state==='nomic')return 'No mic: use TAP';
  if(AB.state==='locked')return 'AUTO '+(Math.round(YT.bpm*10)/10)+' BPM '+bars(c);if(AB.state==='listening')return 'Listening\u2026'+(secsLeft?' '+secsLeft+'s':' '+bars(c));return 'AUTO BPM: waiting for the song';}
function abUI(secsLeft){const b=$('ytAB');if(b){const t='\uD83C\uDFA4 '+abLabel(secsLeft);if(b.textContent!==t)b.textContent=t;}}
setInterval(abTick,500);
function loadYT(){transportStop();TR=ytTrack();lastGridStep=-1;setVolumes();Bus.emit('track',TR);return TR;}
