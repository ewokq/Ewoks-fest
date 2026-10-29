// Special effects: particle pools (additive fire/sparks/fireworks; blended CO2/confetti/streamers/haze), device layout, emitters, pyro arm rules
const PV=`attribute vec4 aC;attribute float aS;attribute float aK;varying vec4 vC;varying float vK;uniform float uScale;void main(){vC=aC;vK=aK;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=min(384.,aS*uScale/max(.3,-mv.z));gl_Position=projectionMatrix*mv;}`;
const PF=`uniform sampler2D uTex;varying vec4 vC;varying float vK;void main(){vec2 pc=gl_PointCoord;float a;
 if(vK>1.5){float w=abs(sin(vK*3.7));if(abs(pc.x-.5)>.07+.35*w*0.2||abs(pc.y-.5)>.48)discard;a=1.;}
 else if(vK>.5){float w=.15+.85*abs(sin(vK*9.1));if(abs(pc.x-.5)>.5*w||abs(pc.y-.5)>.3)discard;a=1.;}
 else a=texture2D(uTex,pc).a;gl_FragColor=vec4(vC.rgb,vC.a*a);if(gl_FragColor.a<.004)discard;}`;
function makePool(n,additive){const g=new THREE.BufferGeometry();const pos=new Float32Array(n*3),col=new Float32Array(n*4),sz=new Float32Array(n),kk=new Float32Array(n);for(let i=0;i<n;i++)pos[i*3+1]=-999;
  const at=(nm,a,k)=>{const b=new THREE.BufferAttribute(a,k);b.setUsage(THREE.DynamicDrawUsage);g.setAttribute(nm,b);return b;};
  const P_={n,pos:at('position',pos,3),col:at('aC',col,4),sz:at('aS',sz,1),kk:at('aK',kk,1),vx:new Float32Array(n),vy:new Float32Array(n),vz:new Float32Array(n),life:new Float32Array(n),max:new Float32Array(n),
    kind:new Uint8Array(n),drag:new Float32Array(n),grav:new Float32Array(n),s0:new Float32Array(n),s1:new Float32Array(n),r:new Float32Array(n),gg:new Float32Array(n),b:new Float32Array(n),a0:new Float32Array(n),ph:new Float32Array(n),head:0,alive:0};
  const m=new THREE.ShaderMaterial({uniforms:{uTex:{value:GLOW},uScale:{value:300}},vertexShader:PV,fragmentShader:PF,transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,fog:false,toneMapped:!additive});
  const pts=new THREE.Points(g,m);pts.frustumCulled=false;pts.renderOrder=additive?8:9;P_.pts=pts;G.scene.add(pts);return P_;}
const PK={fire:1,spark:2,fw:3,trail:4,smoke:5,conf:6,strm:7,haze:8};
const FXS={add:null,nrm:null,dev:{},em:[],shells:[],cool:{},armed:false,active:0,pyroL:0,stats:{fired:{},last:{}}};
function initFX(){const q=clamp(ST.particleQ,0.25,1.5);if(FXS.add){G.scene.remove(FXS.add.pts);G.scene.remove(FXS.nrm.pts);}
  FXS.add=makePool(Math.round((IS_MOBILE?2600:5000)*q),true);FXS.nrm=makePool(Math.round((IS_MOBILE?2200:4000)*q),false);}
function spawn(P_,o){const i=P_.head;P_.head=(P_.head+1)%P_.n;const p=P_.pos.array;p[i*3]=o.x;p[i*3+1]=o.y;p[i*3+2]=o.z;P_.vx[i]=o.vx||0;P_.vy[i]=o.vy||0;P_.vz[i]=o.vz||0;
  P_.life[i]=0;P_.max[i]=o.life||1;P_.kind[i]=o.k;P_.drag[i]=o.drag||0;P_.grav[i]=o.grav||0;P_.s0[i]=o.s0||1;P_.s1[i]=o.s1==null?P_.s0[i]:o.s1;P_.r[i]=o.r==null?1:o.r;P_.gg[i]=o.g==null?1:o.g;P_.b[i]=o.b==null?1:o.b;P_.a0[i]=o.a==null?1:o.a;P_.ph[i]=Math.random()*6.28;
  P_.kk.array[i]=o.shape||0;return i;}
// device layout (counts from the session's equipment)
function buildFXDevices(fx,A){const D=FXS.dev={};const W=A.W,span=(n,w)=>i=>n<2?0:(i/(n-1)-0.5)*w;
  D.flames=[];for(let i=0;i<(fx.flames||0);i++)D.flames.push(V3(span(fx.flames,W*0.88)(i),A.DH,-0.35));
  D.co2=[];for(let i=0;i<(fx.co2||0);i++){const tw=i>=(fx.co2-2)&&fx.co2>=4;D.co2.push(tw?V3((i%2?1:-1)*A.towerX,A.TH*0.7,A.trussFrontZ+0.3):V3(span(fx.co2>=4?fx.co2-2:fx.co2,W*0.7)(i),A.DH,-0.5));}
  D.confetti=[];for(let i=0;i<(fx.confetti||0);i++)D.confetti.push(V3((i%2?1:-1)*(W/2-1.5-(i>>1)*3),A.DH+0.4,-0.2));
  D.streamers=[];for(let i=0;i<(fx.streamers||0);i++)D.streamers.push(V3((i%2?1:-1)*(W/4+(i>>1)*2),A.DH+0.4,-0.2));
  D.sparks=[];for(let i=0;i<(fx.sparks||0);i++)D.sparks.push(V3(span(fx.sparks,W*0.75)(i),A.DH,-0.2));
  D.fireworks=fx.fireworks?[V3(-A.W*0.6,0,-A.D-25),V3(0,0,-A.D-35),V3(A.W*0.6,0,-A.D-25)]:[];
  FXS.em=[];FXS.shells=[];}
function patDelay(pat,i,n){const u=n<2?0:i/(n-1);switch(pat){case 'lr':return u;case 'rl':return 1-u;case 'out':return Math.abs(u-0.5)*2;case 'in':return 1-Math.abs(u-0.5)*2;case 'alt':return (i%2)*0.5;case 'random':return Math.random();default:return 0;}}
const PYRO_KINDS={flames:1,sparks:1,fireworks:1};
const FX_NAMES={flames:'Flames',co2:'CO2',confetti:'Confetti',streamers:'Streamers',sparks:'Sparks',fireworks:'Fireworks'};
// returns {ok,reason}
function fxFire(kind,o){o=o||{};const D=FXS.dev[kind]||[];
  if(!D.length)return {ok:false,reason:FX_NAMES[kind]+': not in your rig'+(SES&&SES.mode==='career'?' (buy it in the shop)':'')};
  if(kind==='fireworks'&&!G.env.outdoor)return {ok:false,reason:'Fireworks are outdoor-only (indoor venue)'};
  if(PYRO_KINDS[kind]&&!FXS.armed)return {ok:false,reason:'Pyro is not armed: press ARM first'};
  const now=realNow();if(FXS.cool[kind]&&now<FXS.cool[kind])return {ok:false,reason:FX_NAMES[kind]+' recharging\u2026'};
  if(FXS.em.length>=Math.max(2,ST.maxFx)*Math.max(4,D.length)*1.5)return {ok:false,reason:'Too many effects at once (limit in settings)'};
  const pat=o.pat||'all',spacing=(o.spacing!=null?o.spacing:0.35)*(TR?TR.beat:0.5),dur=o.dur||(kind==='flames'?0.55:kind==='co2'?0.9:kind==='sparks'?(o.kind==='waterfall'?2.4:1.6):0.2);
  const sel=o.dev!=null?[o.dev]:D.map((_,i)=>i);
  sel.forEach(i=>{if(!D[i])return;const d=patDelay(pat,i,D.length)*spacing*(pat==='random'?1.5:Math.max(1,D.length-1)/Math.max(1,D.length-1));FXS.em.push({kind,i,p:D[i],t0:now+d,t1:now+d+dur,acc:0,o,fired:false});});
  FXS.cool[kind]=now+(kind==='fireworks'?0.8:kind==='confetti'||kind==='streamers'?1.2:0.25);
  FXS.stats.fired[kind]=(FXS.stats.fired[kind]||0)+1;FXS.stats.last[kind]=now;Bus.emit('fx',kind,o);return {ok:true};}
function fxArm(on){FXS.armed=!!on;sfx(on?'arm':'disarm');Bus.emit('arm',FXS.armed);}
function fxStopAll(){FXS.em=[];FXS.shells=[];}
function emitTick(dt){const now=realNow(),q=clamp(ST.particleQ,0.25,1.5),A_=FXS.add,N_=FXS.nrm;let act=0,pyro=0;
  for(let k=FXS.em.length-1;k>=0;k--){const e=FXS.em[k];if(now<e.t0)continue;if(!e.fired){e.fired=true;const s=e.kind==='fireworks'?'fwlaunch':e.kind;if(e.i===0||e.kind!=='flames')sfx(s,e.kind==='flames'?0.8:0.6);if(e.kind==='confetti'||e.kind==='streamers')burstConf(e);if(e.kind==='fireworks')launchShell(e);}
    if(now>e.t1){FXS.em.splice(k,1);continue;}act++;const p=e.p;
    if(e.kind==='flames'){pyro+=1;e.acc+=dt*260*q;while(e.acc>=1){e.acc--;spawn(A_,{k:PK.fire,x:p.x+rnd(-0.25,0.25),y:p.y+0.2,z:p.z+rnd(-0.25,0.25),vx:rnd(-1.2,1.2),vy:rnd(11,17)*(e.o.h||1),vz:rnd(-1.2,1.2),life:rnd(0.45,0.8),drag:1.6,grav:-2,s0:1.1,s1:2.8,r:1,g:0.36,b:0.05,a:0.17});}
      if(Math.random()<0.5)spawn(N_,{k:PK.smoke,x:p.x,y:p.y+7,z:p.z,vx:rnd(-1,1),vy:rnd(2,4),vz:rnd(-1,1),life:2.2,drag:0.8,s0:3,s1:9,r:0.08,g:0.07,b:0.07,a:0.25});}
    else if(e.kind==='co2'){e.acc+=dt*220*q;const up=p.y>4;while(e.acc>=1){e.acc--;spawn(N_,{k:PK.smoke,x:p.x+rnd(-0.1,0.1),y:p.y+0.2,z:p.z,vx:rnd(-1.5,1.5)+(up?-Math.sign(p.x)*rnd(2,6):0),vy:up?rnd(-2,4):rnd(16,24),vz:rnd(-1.5,1.5)+(up?rnd(2,6):0),life:rnd(1.2,2),drag:2.6,grav:-0.3,s0:1.2,s1:7,r:0.92,g:0.95,b:1,a:0.55});}}
    else if(e.kind==='sparks'){pyro+=0.5;const wf=e.o.kind==='waterfall';e.acc+=dt*(wf?420:220)*q;while(e.acc>=1){e.acc--;if(wf){const A=G.anch;spawn(A_,{k:PK.spark,x:rnd(-A.towerX,A.towerX),y:A.trussY-0.3,z:A.trussFrontZ+0.3,vx:rnd(-0.3,0.3),vy:rnd(-1,0),vz:rnd(-0.3,0.3),life:rnd(1,1.6),grav:9,drag:0.3,s0:0.35,s1:0.15,r:1,g:0.85,b:0.5,a:1});}
        else spawn(A_,{k:PK.spark,x:p.x,y:p.y+0.1,z:p.z,vx:rnd(-1.6,1.6),vy:rnd(6,10),vz:rnd(-1.6,1.6),life:rnd(0.7,1.2),grav:9.8,drag:0.4,s0:0.35,s1:0.12,r:1,g:0.85,b:0.55,a:1});}}}
  // fireworks shells
  for(let k=FXS.shells.length-1;k>=0;k--){const s=FXS.shells[k];s.t+=dt;s.y+=s.vy*dt;s.vy-=9.8*dt*0.6;s.x+=s.vx*dt;spawn(A_,{k:PK.trail,x:s.x,y:s.y,z:s.z,life:0.5,s0:0.6,s1:0.1,r:1,g:0.8,b:0.5,a:0.8});
    if(s.vy<3||s.t>2.2){FXS.shells.splice(k,1);explode(s);}}
  FXS.active=act;FXS.pyroL=approach(FXS.pyroL,pyro?1:0,dt,pyro?0.03:0.25);
  // haze layer (low, drifting), colour picked from the stage light
  if(G.HZ.value>0.05&&Math.random()<dt*10*G.HZ.value*q){const A=G.anch,c=FIX.stats.C;const w=c[3]||1;spawn(N_,{k:PK.haze,x:rnd(-A.W*0.6,A.W*0.6),y:rnd(1,A.TH*0.8),z:rnd(-A.D,26),vx:rnd(-0.4,0.4),vy:rnd(-0.05,0.15),vz:rnd(-0.2,0.4),life:rnd(8,14),s0:18,s1:26,r:0.6,g:0.6,b:0.7,a:0.045*G.HZ.value});}
  integrate(A_,dt);integrate(N_,dt);}
function burstConf(e){const pal=curPalette(),n=Math.round((e.kind==='streamers'?90:520)*clamp(ST.particleQ,0.25,1.5)),p=e.p;
  for(let i=0;i<n;i++){const c=C3(e.o.col||pick(pal));const st=e.kind==='streamers';spawn(FXS.nrm,{k:st?PK.strm:PK.conf,shape:st?2:1,x:p.x,y:p.y+0.4,z:p.z,vx:-Math.sign(p.x||1)*rnd(1,7)+rnd(-3,3),vy:rnd(13,22),vz:rnd(5,14),life:rnd(st?6:5,st?9:9),drag:st?1.1:1.6,grav:st?2.2:1.6,s0:st?1.6:0.42,s1:st?1.6:0.42,r:c.r,g:c.g,b:c.b,a:1});}}
function launchShell(e){const seq=e.o.seq==='finale'?5:1;FXS.dev.fireworks.forEach((p,i)=>{for(let k=0;k<seq;k++)setTimeout(()=>{FXS.shells.push({x:p.x+rnd(-6,6),y:2,z:p.z+rnd(-4,4),vx:rnd(-2,2),vy:rnd(30,40),t:0,col:pick(curPalette())});if(k>0)sfx('fwlaunch',0.4);},k*380+i*120);});}
function explode(s){const n=Math.round(220*clamp(ST.particleQ,0.25,1.5)),c=C3(s.col);sfx('boom',0.8);FXS.flashSky=1;
  for(let i=0;i<n;i++){const u=Math.random()*2-1,th=Math.random()*6.283,r=Math.sqrt(1-u*u),sp=rnd(10,15);spawn(FXS.add,{k:PK.fw,x:s.x,y:s.y,z:s.z,vx:r*Math.cos(th)*sp,vy:u*sp,vz:r*Math.sin(th)*sp,life:rnd(1.4,2.2),drag:1.1,grav:3,s0:1.1,s1:0.3,r:c.r,g:c.g,b:c.b,a:1});}}
function integrate(P_,dt){const p=P_.pos.array,c=P_.col.array,s=P_.sz.array,n=P_.n;let alive=0;
  for(let i=0;i<n;i++){if(P_.life[i]>=P_.max[i]){if(p[i*3+1]>-900){p[i*3+1]=-999;c[i*4+3]=0;}continue;}alive++;P_.life[i]+=dt;const t=P_.life[i]/P_.max[i];const dr=Math.exp(-P_.drag[i]*dt);
    P_.vx[i]*=dr;P_.vy[i]=P_.vy[i]*dr-P_.grav[i]*dt;P_.vz[i]*=dr;const kd=P_.kind[i];
    if(kd===PK.conf||kd===PK.strm){P_.ph[i]+=dt*6;P_.vx[i]+=Math.sin(P_.ph[i])*dt*2;const fy=(p[i*3+2]>CRW.z0&&p[i*3+2]<CRW.z1&&Math.abs(p[i*3])<CRW.hw0+(p[i*3+2]-CRW.z0)*0.55+CRW.z0*0.55)?1.72+((i*0.37)%0.25):0.05;if(p[i*3+1]<fy&&P_.vy[i]<=0){P_.vy[i]=0;P_.vx[i]=0;P_.vz[i]=0;p[i*3+1]=fy+(fy>1?Math.max(0,Math.sin(CRW.u?CRW.u.uBeat.value*Math.PI:0))*CRW.jump*0.08:0);}}
    p[i*3]+=P_.vx[i]*dt;p[i*3+1]+=P_.vy[i]*dt;p[i*3+2]+=P_.vz[i]*dt;
    let r=P_.r[i],g=P_.gg[i],b=P_.b[i],a=P_.a0[i];
    if(kd===PK.fire){g=lerp(0.85,0.2,t);b=lerp(0.4,0.02,t);r=lerp(1,0.8,t);a*=t<0.1?t*10:(1-t);r*=3;g*=3;b*=3;}
    else if(kd===PK.spark||kd===PK.trail){a*=1-t;r*=3;g*=3;b*=3;}else if(kd===PK.fw){a*=(1-t)*(0.7+0.3*Math.sin(P_.life[i]*40+i));r*=2.5;g*=2.5;b*=2.5;}
    else if(kd===PK.smoke){a*=t<0.15?t/0.15:(1-t)*(1-t);}else if(kd===PK.haze){a*=Math.sin(t*Math.PI);const C=FIX.stats.C,w=C[3]||0;if(w>0.01){const k=Math.min(1,w*0.6);r=lerp(0.5,C[0]/w,k);g=lerp(0.5,C[1]/w,k);b=lerp(0.6,C[2]/w,k);}}
    else if(kd===PK.conf||kd===PK.strm){a*=t>0.85?(1-t)/0.15:1;P_.kk.array[i]=(kd===PK.strm?2:1)+((P_.ph[i]*0.1)%1)*0.999;}
    c[i*4]=r;c[i*4+1]=g;c[i*4+2]=b;c[i*4+3]=a;s[i]=lerp(P_.s0[i],P_.s1[i],t);}
  P_.alive=alive;P_.pos.needsUpdate=true;P_.col.needsUpdate=true;P_.sz.needsUpdate=true;P_.kk.needsUpdate=true;P_.pts.material.uniforms.uScale.value=G.H*G.dpr*0.5;}
