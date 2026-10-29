// Fixtures: rig layout from equipment counts, per-fixture parameters (base layer + live override layer), chases, movement, strobe, instanced rendering
const MOVES=[['static','Static'],['circle','Circle'],['fig8','Figure 8'],['hsweep','H sweep'],['vsweep','V sweep'],['fan','Fan'],['cross','Cross'],['rotfan','Rotating fan'],['audience','Audience'],['stage','Stage'],['random','Random'],['custom','Custom XY']];
const CHASES=[['none','None'],['pulse','Pulse'],['alt','Alternate'],['wave','Wave'],['snake','Snake'],['random','Random'],['build','Build'],['colorAlt','Colour alt'],['colorWave','Colour wave']];
const GOBOS=[['open','Open'],['dots','Dots'],['stripes','Stripes'],['star','Star'],['ring','Ring'],['shatter','Shatter']];
const SYNCS=[['free','Free'],['1/2','\u00BD beat'],['1','1 beat'],['2','2 beats'],['4','1 bar'],['8','2 bars'],['phrase','Phrase']];
const SYNC_BEATS={'1/2':0.5,'1':1,'2':2,'4':4,'8':8,'phrase':32};
const DIRS=[['fwd','Forward'],['rev','Reverse'],['bounce','Bounce'],['center','Centre out']];
const PXPATS=[['solid','Solid'],['chase','Chase'],['rainbow','Rainbow'],['vu','VU meter'],['sparkle','Sparkle'],['split','Split']];
const LZPATS=[['fan','Fan'],['scan','Scan'],['tunnel','Tunnel'],['sheet','Liquid sky'],['cross','Crossing'],['wave','Wave'],['circle','Circle'],['star','Starburst'],['random','Random']];
const PARAM_DEFS={
 on:{t:'bool',d:true,l:'On'},int:{t:'range',d:0.8,l:'Intensity'},col:{t:'color',d:'#2a6bff',l:'Colour'},col2:{t:'color',d:'#ff2bd6',l:'Colour 2'},
 chase:{t:'enum',o:CHASES,d:'none',l:'Chase'},strobe:{t:'range',d:0,l:'Strobe'},pat:{t:'enum',o:MOVES,d:'static',l:'Movement'},
 spd:{t:'range',d:0.4,l:'Speed'},rng:{t:'range',d:0.5,l:'Range'},phs:{t:'range',d:0.5,l:'Phase spread'},pan:{t:'range',min:-1,max:1,d:0,l:'Pan'},tilt:{t:'range',min:-1,max:1,d:0,l:'Tilt'},
 size:{t:'range',d:0.3,l:'Beam size'},focus:{t:'range',d:0.7,l:'Focus'},gobo:{t:'enum',o:GOBOS,d:'open',l:'Gobo'},fade:{t:'range',d:0.15,l:'Fade time'},
 sync:{t:'enum',o:SYNCS,d:'1',l:'Sync'},dir:{t:'enum',o:DIRS,d:'fwd',l:'Direction'},pxPat:{t:'enum',o:PXPATS,d:'solid',l:'Pixel pattern'},lz:{t:'enum',o:LZPATS,d:'fan',l:'Laser pattern'}};
const TYPE_PARAMS={beam:['on','int','col','col2','chase','strobe','pat','spd','rng','phs','pan','tilt','size','focus','fade','sync','dir'],spot:['on','int','col','col2','chase','strobe','pat','spd','rng','phs','pan','tilt','size','focus','gobo','fade','sync','dir'],
 wash:['on','int','col','col2','chase','strobe','pat','spd','rng','phs','pan','tilt','size','fade','sync','dir'],strobe:['on','int','col','chase','strobe','spd','phs','fade','sync','dir'],blinder:['on','int','col','chase','strobe','spd','phs','fade','sync','dir'],
 pixel:['on','int','col','col2','chase','strobe','pxPat','spd','phs','fade','sync','dir'],laser:['on','int','col','col2','lz','spd','rng','phs','pan','tilt','size','fade','sync']};
const TYPE_NAME={beam:'Beam',spot:'Spot',wash:'Wash',strobe:'Strobe',blinder:'Blinder',pixel:'Pixel strip',laser:'Laser'};
const TYPE_PFX={beam:'B',spot:'SP',wash:'W',strobe:'ST',blinder:'BL',pixel:'PX',laser:'L'};
const TYPE_COL={beam:'#20e3ff',spot:'#ffd27a',wash:'#ff2bd6',strobe:'#ffffff',blinder:'#ffb300',pixel:'#3dff8e',laser:'#00ff6a'};
function typeDefaults(type){const b={};for(const k of TYPE_PARAMS[type])b[k]=PARAM_DEFS[k].d;
  if(type==='wash'){b.int=0.6;b.size=0.5;b.col='#8a3bff';}if(type==='strobe'){b.on=false;b.col='#ffffff';b.int=1;}if(type==='blinder'){b.on=false;b.col='#ffd9a0';b.int=1;}
  if(type==='laser'){b.on=false;b.col='#00ff6a';b.col2='#20e3ff';b.size=0.5;}if(type==='pixel'){b.col='#ff2bd6';b.int=0.7;}if(type==='spot'){b.col='#ffffff';b.gobo='dots';b.int=0.6;}return b;}
const FIX={list:[],map:{},byType:{},stats:{int:0,move:0,strobe:0,hues:0,cols:[],L:[0,0,0],C:[0,0,0],R:[0,0,0],flash:0,laser:0},meshes:null};
// ---- rig layout ----
function buildRig(rig,A){fixDispose();FIX.list=[];FIX.map={};FIX.byType={};
  const W=A.W,tx=A.towerX,mk=(type,i,n,pos,o)=>{const f=Object.assign({id:TYPE_PFX[type]+(i+1),type,i,n,pos,up:false,base:typeDefaults(type),ovr:{},
    cur:{int:0,r:0,g:0,b:0,pan:0,tilt:0,size:0.3,out:0,lr:0,lg:0,lb:0},hp:0,ht:0.6,dirv:V3(0,-1,0)},o||{});f.side=pos.x<-W*0.15?-1:pos.x>W*0.15?1:0;f.u=clamp(pos.x/W+0.5,0,1);FIX.list.push(f);FIX.map[f.id]=f;(FIX.byType[type]=FIX.byType[type]||[]).push(f);return f;};
  const span=(n,w)=>i=>n<2?0:(i/(n-1)-0.5)*w;
  // beams: alternate truss / deck floor (floor ones fire up into the sky)
  const nb=rig.beam||0,nt=Math.ceil(nb/2),nf=nb-nt;for(let i=0;i<nb;i++){const fl=i%2===1;const k=fl?(i-1)/2:i/2,n=fl?nf:nt;
    mk('beam',i,nb,fl?V3(span(n,W*0.86)(k),A.DH+0.35,-0.7):V3(span(n,tx*1.8)(k),A.trussY,A.trussFrontZ),{up:fl,ht:fl?0.25:0.55});}
  const ns=rig.spot||0;for(let i=0;i<ns;i++)mk('spot',i,ns,V3(span(ns,tx*1.5)(i),A.midY,A.trussMidZ),{ht:0.45});
  const nw=rig.wash||0;for(let i=0;i<nw;i++){const tw=i>=nw-2&&nw>=6;const p=tw?V3((i===nw-1?1:-1)*tx,A.TH*0.55,A.trussFrontZ+0.4):V3(span(tw?nw-2:nw,tx*1.7)(nw>=6?i:i)*(nw>=6?1:1),A.trussY-0.3,A.trussFrontZ-1.3);
    mk('wash',i,nw,p,{ht:tw?0.95:0.35,hp:tw?(i===nw-1?-0.5:0.5):0});}
  const nst=rig.strobe||0;for(let i=0;i<nst;i++){const top=i%2===0;mk('strobe',i,nst,top?V3(span(Math.ceil(nst/2),A.ledW)(i/2|0),A.backY-0.3,A.ledZ+0.6):V3(span(Math.floor(nst/2),tx*1.7)((i-1)/2|0),A.trussY+0.05,A.trussFrontZ+0.45));}
  const nbl=rig.blinder||0;for(let i=0;i<nbl;i++)mk('blinder',i,nbl,V3(span(nbl,W*0.8)(i),A.DH+0.35,-0.25));
  const npx=rig.pixel||0;for(let i=0;i<npx;i++){const sx=i%2?1:-1,k=i>>1;mk('pixel',i,npx,V3(sx*(A.ledW/2+0.5+k*(A.W/2-A.ledW/2-1)/Math.max(1,Math.ceil(npx/2))),A.DH+0.2,A.ledZ+1.2+k*1.5),{len:A.ledH+1});}
  const nl=rig.laser||0;for(let i=0;i<nl;i++){const p=i<2?V3((i?1:-1)*tx*0.95,A.TH+0.5,A.trussFrontZ):i<4?V3((i===2?-1:1)*A.ledW*0.25,A.backY+0.5,A.ledZ+0.6):V3((i===4?-1:1)*W*0.42,A.DH+0.4,-0.4);mk('laser',i,nl,p);}
  // order within each type left to right for chases
  for(const t in FIX.byType){FIX.byType[t].sort((a,b)=>a.pos.x-b.pos.x||a.pos.y-b.pos.y).forEach((f,k,a)=>{f.ci=k;f.cn=a.length;});}
  fixMeshes();Bus.emit('rig',FIX.list);return FIX.list;}
// ---- rendering ----
const CONE_V=`attribute vec4 aCol;attribute vec2 aG;varying vec4 vC;varying float vT,vE,vU;varying vec2 vGo;
void main(){mat4 m=modelMatrix*instanceMatrix;vec4 wp=m*vec4(position,1.);vec3 n=normalize(mat3(m)*normal);vec3 v=normalize(cameraPosition-wp.xyz);vE=abs(dot(n,v));vT=-position.y;vU=uv.x;vC=aCol;vGo=aG;gl_Position=projectionMatrix*viewMatrix*wp;}`;
const CONE_F=`uniform float uHaze,uTime;varying vec4 vC;varying float vT,vE,vU;varying vec2 vGo;
void main(){float sharp=vGo.y;float e=pow(vE,1.0+sharp*2.5);float along=pow(clamp(1.-vT,0.,1.),1.3)*smoothstep(0.,.04,vT)+0.0;float g=1.;float gi=vGo.x;
 if(gi>.5){float a=vU*6.2832;if(gi<1.5)g=step(.5,fract(vU*10.+uTime*.2))*step(.3,fract(vT*14.));else if(gi<2.5)g=step(.5,fract(vU*8.+uTime*.3));else if(gi<3.5)g=pow(abs(sin(a*2.5+uTime)),6.);else if(gi<4.5)g=smoothstep(.2,.6,vE)*.4+step(.85,vE)*.6;else g=step(.55,fract(sin(floor(vU*24.)*91.3+floor(vT*10.)*17.1)*437.5));g=mix(.08,1.,g);}
 float a=vC.a*e*along*g*(0.1+uHaze*1.15);gl_FragColor=vec4(vC.rgb,a);}`;
const LZ_F=`uniform float uHaze;varying vec4 vC;varying float vT,vE,vU;varying vec2 vGo;void main(){float a=vC.a*(1.-vT*.6)*(0.35+uHaze*0.9)*smoothstep(0.,.3,vE+.2);gl_FragColor=vec4(vC.rgb,a);}`;
const GLOW_V=`attribute vec3 aC;attribute float aS;varying vec3 vC;uniform float uScale;void main(){vC=aC;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=min(256.,aS*uScale/max(.5,-mv.z));gl_Position=projectionMatrix*mv;}`;
const GLOW_F=`uniform sampler2D uTex;varying vec3 vC;void main(){vec4 t=texture2D(uTex,gl_PointCoord);gl_FragColor=vec4(vC*t.a,t.a);if(t.a<.01)discard;}`;
function addAttr(geo,name,n,k){const a=new THREE.InstancedBufferAttribute(new Float32Array(n*k),k);a.setUsage(THREE.DynamicDrawUsage);geo.setAttribute(name,a);return a;}
function fixDispose(){const M=FIX.meshes;if(!M)return;for(const k in M){const o=M[k];if(o&&o.isObject3D){G.scene.remove(o);o.geometry.dispose();if(o.material&&!o.material.userData.keep)o.material.dispose();}}FIX.meshes=null;}
const LZN=16,PXN=24;
function fixMeshes(){const M=FIX.meshes={};const L=FIX.list,cones=L.filter(f=>f.type==='beam'||f.type==='spot'||f.type==='wash');
  const coneU={uHaze:G.HZ,uTime:G.T};
  if(cones.length){const g=new THREE.CylinderGeometry(0.02,1,1,20,1,true);g.translate(0,-0.5,0);
    const m=new THREE.ShaderMaterial({uniforms:coneU,vertexShader:CONE_V,fragmentShader:CONE_F,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false,toneMapped:false});
    const im=new THREE.InstancedMesh(g,m,cones.length);im.frustumCulled=false;M.aCol=addAttr(g,'aCol',cones.length,4);M.aG=addAttr(g,'aG',cones.length,2);im.renderOrder=5;G.scene.add(im);M.cone=im;M.cones=cones;}
  const lz=L.filter(f=>f.type==='laser');if(lz.length){const g=new THREE.CylinderGeometry(1,1,1,4,1,true);g.translate(0,-0.5,0);
    const m=new THREE.ShaderMaterial({uniforms:coneU,vertexShader:CONE_V,fragmentShader:LZ_F,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false,toneMapped:false});
    const n=lz.length*LZN,im=new THREE.InstancedMesh(g,m,n);im.frustumCulled=false;M.lzCol=addAttr(g,'aCol',n,4);addAttr(g,'aG',n,2);im.renderOrder=6;G.scene.add(im);M.lz=im;M.lzs=lz;}
  // bodies (also used for picking): one instanced box mesh
  const bg=new THREE.BoxGeometry(1,1,1),bm=new THREE.MeshStandardMaterial({color:0x15161b,metalness:0.5,roughness:0.5});const body=new THREE.InstancedMesh(bg,bm,Math.max(1,L.length));
  const mm=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=V3(1,1,1);
  L.forEach((f,i)=>{const s=f.type==='strobe'?[1.3,0.45,0.35]:f.type==='blinder'?[1.1,0.55,0.25]:f.type==='pixel'?[0.18,f.len||8,0.18]:f.type==='laser'?[0.6,0.4,0.6]:f.type==='wash'?[0.6,0.45,0.6]:[0.45,0.55,0.45];
    const p=f.type==='pixel'?f.pos.clone().add(V3(0,(f.len||8)/2,0)):f.pos;sc.set(...s);q.identity();mm.compose(p,q,sc);body.setMatrixAt(i,mm);f.bi=i;});
  body.userData.pick=L;G.scene.add(body);M.body=body;
  // emissive panels: strobes, blinders and pixel cells (instanced, colour per instance)
  const pm=new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false});
  const pan=L.filter(f=>f.type==='strobe'||f.type==='blinder');if(pan.length){const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),pm,pan.length);
    pan.forEach((f,i)=>{sc.set(f.type==='strobe'?1.2:1,f.type==='strobe'?0.3:0.42,0.05);mm.compose(f.pos.clone().add(V3(0,0,f.type==='strobe'?0.2:0.14)),q.identity(),sc);im.setMatrixAt(i,mm);im.setColorAt(i,C3('#111'));});G.scene.add(im);M.pan=im;M.pans=pan;}
  const px=L.filter(f=>f.type==='pixel');if(px.length){const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),pm,px.length*PXN);let k=0;
    px.forEach(f=>{const len=f.len||8;for(let j=0;j<PXN;j++){sc.set(0.22,len/PXN*0.7,0.22);mm.compose(f.pos.clone().add(V3(0,(j+0.5)*len/PXN,0.06)),q.identity(),sc);im.setMatrixAt(k,mm);im.setColorAt(k,C3('#000'));k++;}});G.scene.add(im);M.px=im;M.pxs=px;}
  // lens glows: cones (1), strobes (2), blinders (4 cells), lasers (1)
  const gl=[];L.forEach(f=>{const n=f.type==='strobe'?2:f.type==='blinder'?4:f.type==='pixel'?0:1;for(let j=0;j<n;j++)gl.push([f,j]);});
  if(gl.length){const g=new THREE.BufferGeometry();const pos=new Float32Array(gl.length*3),col=new Float32Array(gl.length*3),sz=new Float32Array(gl.length);
    gl.forEach(([f,j],i)=>{let o=V3(0,0,0);if(f.type==='strobe')o.set((j-0.5)*0.6,0,0.3);if(f.type==='blinder')o.set((j%2-0.5)*0.5,((j>>1)-0.5)*0.22,0.2);if(f.type!=='strobe'&&f.type!=='blinder'&&f.type!=='laser')o.set(0,f.up?0.3:-0.3,0);pos.set([f.pos.x+o.x,f.pos.y+o.y,f.pos.z+o.z],i*3);});
    g.setAttribute('position',new THREE.BufferAttribute(pos,3));const ca=new THREE.BufferAttribute(col,3);ca.setUsage(THREE.DynamicDrawUsage);g.setAttribute('aC',ca);const sa=new THREE.BufferAttribute(sz,1);sa.setUsage(THREE.DynamicDrawUsage);g.setAttribute('aS',sa);
    const m=new THREE.ShaderMaterial({uniforms:{uTex:{value:GLOW},uScale:{value:300}},vertexShader:GLOW_V,fragmentShader:GLOW_F,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,toneMapped:false});
    const pts=new THREE.Points(g,m);pts.frustumCulled=false;pts.renderOrder=7;G.scene.add(pts);M.glow=pts;M.glows=gl;}}
// ---- parameter evaluation ----
const P=(f,k)=>{const o=f.ovr[k];return o!==undefined?o:f.base[k];};
const SPD_MUL=[0.25,0.5,1,2,4];
function cyc(f,t,bp,slow){const s=P(f,'sync')||'1',spd=P(f,'spd')||0;if(s==='free')return realNow()*(slow?0.04+spd*0.6:0.2+spd*4);const d=SYNC_BEATS[s]||1;return bp/d*SPD_MUL[Math.round(spd*4)]/(slow?2:1);}
function ord(f){const d=P(f,'dir')||'fwd',n=Math.max(1,f.cn),k=f.ci;if(d==='rev')return (n-1-k)/n;if(d==='center')return Math.abs(k-(n-1)/2)/n*2*0.5;if(d==='bounce'){return k/n;}return k/n;}
function hashf(n){const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);}
function chaseVal(f,x,ch){const n=Math.max(1,f.cn),o=ord(f),ph=P(f,'phs');if(P(f,'dir')==='bounce'){const b=(x%2+2)%2;x=b>1?2-b:b;}
  switch(ch){case 'pulse':{const p=x-Math.floor(x+o*ph*0);return Math.pow(1-((x-o*ph)-Math.floor(x-o*ph)),2.2);}
    case 'alt':return ((Math.floor(x)+f.ci)%2)?1:0.04;
    case 'wave':return 0.5+0.5*Math.sin((x-o*ph*2)*Math.PI*2);
    case 'snake':{const k=Math.floor(x*Math.max(1,n/4))%n;const kk=P(f,'dir')==='rev'?n-1-f.ci:f.ci;return k===kk?1:0.05;}
    case 'random':return hashf(Math.floor(x*2)*13+f.ci*7.3)>0.5?1:0.05;
    case 'build':{const b=(x/4)-Math.floor(x/4);return o<=b?1:0.05;}
    default:return 1;}}
const DOWN=V3(0,-1,0),UPV=V3(0,1,0);
function aimDir(f,pan,tilt,out){const t=tilt,p=pan;out.set(Math.sin(t)*Math.sin(p),(f.up?1:-1)*Math.cos(t),Math.sin(t)*Math.cos(p));return out.normalize();}
function moveOff(f,x,o){const pat=P(f,'pat')||'static',r=(P(f,'rng')||0)*0.9,n=Math.max(1,f.cn),u=(f.ci/(Math.max(1,n-1)))-0.5,ph=P(f,'phs')*ord(f);const th=(x+ph)*Math.PI*2;let dp=0,dt=0;
  switch(pat){case 'circle':dp=r*Math.cos(th);dt=r*0.6*Math.sin(th);break;case 'fig8':dp=r*Math.sin(th);dt=r*0.5*Math.sin(th*2);break;case 'hsweep':dp=r*1.2*Math.sin(th);break;case 'vsweep':dt=r*0.8*Math.sin(th);break;
    case 'fan':dp=u*r*2.4+0.1*Math.sin(th)*r;break;case 'cross':dp=-(f.side||(u<0?-1:1))*r*(0.7+0.5*Math.sin(th));break;case 'rotfan':dp=u*r*2.4*Math.cos(th);dt=u*r*0.6*Math.sin(th);break;
    case 'audience':dt=0.6+r*0.25*Math.sin(th);dp=u*0.7+0.15*Math.sin(th*0.5)*r;break;case 'stage':dt=-0.25;dp=u*0.5+(f.up?0:Math.PI)*0;break;
    case 'random':dp=r*1.2*(hashf(Math.floor(x)+f.ci*3.1)-0.5)*2;dt=r*0.6*(hashf(Math.floor(x)+f.ci*5.7+1)-0.5)*2;break;}
  o.dp=dp;o.dt=dt;return o;}
const _mo={dp:0,dt:0},_d=V3(0,0,0),_c=new THREE.Color(),_c2=new THREE.Color(),_m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_s=V3(1,1,1),_v=V3(0,0,0);
function strobeMul(f,s,t){if(s<=0.001)return 1;if(ST.noStrobe)return 0.75;let hz=2+s*18;let duty=0.22;if(ST.reduceFlash){hz=Math.min(hz,2);}const ph=(t*hz+f.ci*0.13*(s>0.8?1:0))%1;const v=ph<duty?1:0;return ST.reduceFlash?0.5+0.5*v*0.5:v;}
function fixTick(dt,C){const bp=C.bp,t=realNow(),L=FIX.list,st=FIX.stats;let si=0,sm=0,ss=0,sl=0;const reg=[[0,0,0,0],[0,0,0,0],[0,0,0,0]];const hues=new Set();
  for(const f of L){const on=P(f,'on'),ch=P(f,'chase')||'none';const x=cyc(f,t,bp,false);let c=on?P(f,'int'):0;if(on&&ch!=='none'&&ch!=='colorAlt'&&ch!=='colorWave')c*=chaseVal(f,x,ch);
    const col=P(f,'col'),col2=P(f,'col2')||col;let k=0;if(ch==='colorAlt'||ch==='alt')k=((Math.floor(x)+f.ci)%2)&&ch==='colorAlt'?1:0;if(ch==='colorWave')k=0.5+0.5*Math.sin((x-ord(f)*P(f,'phs')*2)*Math.PI*2);
    _c.set(col);if(k>0){_c2.set(col2);_c.lerp(_c2,k);}
    let tau=Math.max(0.02,(P(f,'fade')||0)*1.4)*(C.fadeMul||1);if(f.xf&&t<f.xf.u)tau=f.xf.tau>0.03?Math.max(tau,f.xf.tau):f.xf.tau;const cu=f.cur;cu.int=approach(cu.int,c,dt,tau);cu.r=approach(cu.r,_c.r,dt,tau);cu.g=approach(cu.g,_c.g,dt,tau);cu.b=approach(cu.b,_c.b,dt,tau);
    // post-smoothing: strobe, flash/bump, blackout, master
    let I=cu.int*strobeMul(f,on?(P(f,'strobe')||0):0,t);
    if(C.strobeHold&&(C.strobeSet?C.strobeSet.has(f.id):(f.type==='strobe'||f.type==='blinder'||f.type==='wash'||f.type==='beam'))){const v=ST.noStrobe?0.8:(ST.reduceFlash?((t*2%1)<0.5?0.75:0.35):((t*14%1)<0.3?1:0));I=Math.max(I*0.3,v);}
    let fl=0;if(C.flash>0&&(!C.flashSet||C.flashSet.has(f.id))){fl=C.flash*(ST.reduceFlash?0.5:1);I=Math.max(I,fl);}
    I*=C.master*C.bo*(C.grp&&C.grp[f.type]!=null?C.grp[f.type]:1);
    cu.out=I;let r=cu.r,g=cu.g,b=cu.b;if(fl>0&&(f.type==='strobe'||f.type==='blinder')){r=lerp(r,1,fl);g=lerp(g,1,fl);b=lerp(b,1,fl);}cu.lr=r;cu.lg=g;cu.lb=b;
    // movement (moving heads + lasers)
    if(f.type==='beam'||f.type==='spot'||f.type==='wash'||f.type==='laser'){const xm=cyc(f,t,bp,true);moveOff(f,xm,_mo);const pat=P(f,'pat');
      let tp=f.hp+(P(f,'pan')||0)*1.3+_mo.dp,tt=f.ht+(P(f,'tilt')||0)*0.7+_mo.dt;if(pat==='custom'){tp=f.hp+(P(f,'pan')||0)*1.5;tt=f.ht+(P(f,'tilt')||0)*0.9;}
      if(pat==='stage'&&!f.up){tt=0.35;tp=Math.PI+(f.ci/(Math.max(1,f.cn-1))-0.5)*0.8;}
      tt=clamp(tt,-0.2,1.45);const mt=0.06+(P(f,'fade')||0)*0.4;cu.pan=approach(cu.pan,tp,dt,mt);cu.tilt=approach(cu.tilt,tt,dt,mt);if(pat!=='static'&&pat!=='custom'&&I>0.05)sm++;}
    cu.size=approach(cu.size,P(f,'size')||0.3,dt,0.15);
    if(I>0.02){si+=I*(f.type==='wash'?0.8:f.type==='blinder'||f.type==='strobe'?1.2:1);const hh=rgb2hsv(r,g,b);hues.add(hh[1]<0.25?'w':Math.round(hh[0]*12)%12);
      const ri=f.side+1,w=I*(f.type==='wash'?1.5:f.type==='blinder'?2:f.type==='strobe'?1.2:0.6);reg[ri][0]+=r*w;reg[ri][1]+=g*w;reg[ri][2]+=b*w;reg[ri][3]+=w;
      if((P(f,'strobe')||0)>0.05||C.strobeHold)ss++;if(f.type==='laser')sl+=I;}}
  st.int=L.length?clamp(si/Math.max(4,L.length*0.75),0,1):0;st.move=sm;st.strobe=ss;st.hues=hues.size;st.laser=sl;st.cols=[...hues];
  ['L','C','R'].forEach((k,i)=>{st[k]=reg[i];});
  fixRender(C);}
function fixRender(C){const M=FIX.meshes;if(!M)return;const cam=G.cam.position;
  if(M.cone){const aC=M.aCol.array,aG=M.aG.array;M.cones.forEach((f,i)=>{const cu=f.cur;aimDir(f,cu.pan,cu.tilt,_d);f.dirv.copy(_d);
      let L=f.up?60:(_d.y<-0.03?Math.min(70,f.pos.y/-_d.y):70);const sz=cu.size;const rr=f.type==='beam'?0.012+sz*0.06:f.type==='spot'?0.05+sz*0.13:0.12+sz*0.32;
      _q.setFromUnitVectors(DOWN,_d);_s.set(L*rr,L,L*rr);_m.compose(f.pos,_q,_s);M.cone.setMatrixAt(i,_m);
      const I=cu.out*(f.type==='wash'?0.5:f.type==='spot'?0.85:1.2);aC[i*4]=cu.lr;aC[i*4+1]=cu.lg;aC[i*4+2]=cu.lb;aC[i*4+3]=I;
      aG[i*2]=f.type==='spot'?GOBOS.findIndex(g=>g[0]===P(f,'gobo')):0;aG[i*2+1]=f.type==='wash'?0:(P(f,'focus')!=null?P(f,'focus'):0.7);});
    M.cone.instanceMatrix.needsUpdate=true;M.aCol.needsUpdate=true;M.aG.needsUpdate=true;}
  if(M.lz){const aC=M.lzCol.array;let k=0;const t=realNow();M.lzs.forEach(f=>{const cu=f.cur,pat=P(f,'lz')||'fan',x=cyc(f,t,C.bp,true)*Math.PI*2,r=0.3+(P(f,'rng')||0.5)*0.9,n=Math.round(6+(cu.size||0.5)*(LZN-6));
      const toC=-Math.sign(f.pos.x)||1;
      for(let j=0;j<LZN;j++){let on=j<n,u=n>1?j/(n-1)-0.5:0,pan=cu.pan,tilt=cu.tilt+0.85;let I=cu.out*(on?1:0);let cc=j%2&&P(f,'col2')?1:0;
        switch(pat){case 'fan':pan+=u*r*2.2;break;case 'scan':pan+=u*r*1.2+Math.sin(x)*r;break;case 'tunnel':{const a=j/n*Math.PI*2+x;pan+=Math.cos(a)*0.28*r;tilt+=Math.sin(a)*0.18*r-0.05;break;}
          case 'sheet':pan+=u*r*2.6;tilt=1.38+0.06*Math.sin(x+u*6);break;case 'cross':pan+=toC*0.35*r+u*0.3*r+Math.sin(x)*0.2;break;case 'wave':pan+=u*r*2.2;tilt+=0.15*Math.sin(x*2+u*8)*r;break;
          case 'circle':{const a=j/n*Math.PI*2;pan+=Math.cos(a)*0.4*r*(0.8+0.2*Math.sin(x));tilt+=Math.sin(a)*0.25*r;break;}case 'star':{const a=j/n*Math.PI*2+x*0.3;pan+=Math.cos(a)*0.9*r;tilt+=Math.sin(a)*0.5*r;break;}
          case 'random':{const h=hashf(Math.floor(x*2)+j*3.3);pan+=(h-0.5)*2*r;tilt+=(hashf(h*9+j)-0.5)*0.5;I*=h>0.4?1:0;break;}}
        _d.set(Math.sin(tilt)*Math.sin(pan),-Math.cos(tilt),Math.sin(tilt)*Math.cos(pan)).normalize();
        const L=_d.y<-0.03?Math.min(80,f.pos.y/-_d.y):80;_q.setFromUnitVectors(DOWN,_d);const w=0.03;_s.set(w,L,w);_m.compose(f.pos,_q,_s);M.lz.setMatrixAt(k,_m);
        if(cc){_c.set(P(f,'col2'));aC.set([_c.r,_c.g,_c.b,I*1.6],k*4);}else aC.set([cu.lr,cu.lg,cu.lb,I*1.6],k*4);k++;}});
    M.lz.instanceMatrix.needsUpdate=true;M.lzCol.needsUpdate=true;}
  if(M.pan){M.pans.forEach((f,i)=>{const I=f.cur.out;_c.setRGB(0.04+f.cur.lr*I*4,0.04+f.cur.lg*I*4,0.04+f.cur.lb*I*4);M.pan.setColorAt(i,_c);});M.pan.instanceColor.needsUpdate=true;}
  if(M.px){let k=0;const t=realNow();M.pxs.forEach(f=>{const cu=f.cur,pp=P(f,'pxPat')||'solid',x=cyc(f,t,C.bp,false);_c2.set(P(f,'col2')||'#ffffff');
      for(let j=0;j<PXN;j++){let v=1,r=cu.lr,g=cu.lg,b=cu.lb;const u=j/PXN;
        if(pp==='chase'){const p=(x%1+1)%1;v=Math.max(0,1-Math.abs(u-p)*6);}else if(pp==='rainbow'){const c=hsv2rgb(u*0.8+x*0.25,1,1);r=c[0];g=c[1];b=c[2];}
        else if(pp==='vu'){v=u<clamp(AN.low*1.3+AN.kick*0.4,0,1)?1:0.03;if(u>0.75){r=1;g=0.2;b=0.1;}}else if(pp==='sparkle'){v=hashf(Math.floor(x*4)*31+j*7+f.ci)>0.75?1:0.05;}
        else if(pp==='split'){if((j<PXN/2)===((Math.floor(x)%2)===0)){r=_c2.r;g=_c2.g;b=_c2.b;}}
        const I=cu.out*v*3;_c.setRGB(r*I,g*I,b*I);M.px.setColorAt(k++,_c);}});M.px.instanceColor.needsUpdate=true;}
  if(M.glow){const ca=M.glow.geometry.attributes.aC,sa=M.glow.geometry.attributes.aS;M.glows.forEach(([f,j],i)=>{const cu=f.cur;let I=cu.out,s=2.2;
      if(f.type==='beam'||f.type==='spot'||f.type==='wash'){_v.copy(cam).sub(f.pos).normalize();const fc=Math.max(0,_v.dot(f.dirv));I*=0.25+0.75*fc*fc;s=f.type==='wash'?3.2:2.4;}
      else if(f.type==='strobe'){s=3.4;I*=1.4;}else if(f.type==='blinder'){s=2.6;}else if(f.type==='laser'){s=1.6;}
      ca.setXYZ(i,cu.lr*I,cu.lg*I,cu.lb*I);sa.setX(i,s*(0.4+I*0.8));});ca.needsUpdate=true;sa.needsUpdate=true;M.glow.material.uniforms.uScale.value=G.H*G.dpr*0.35;}}
// picking: returns fixture under the pointer (NDC coords)
const _ray=new THREE.Raycaster();
function pickFixture(nx,ny){if(!FIX.meshes||!FIX.meshes.body)return null;_ray.setFromCamera({x:nx,y:ny},G.cam);const h=_ray.intersectObject(FIX.meshes.body,false);if(h.length&&h[0].instanceId!=null)return FIX.list[h[0].instanceId]||null;
  // tolerant fallback: nearest fixture to the ray within 1.2m
  let best=null,bd=1.2;for(const f of FIX.list){const d=_ray.ray.distanceToPoint(f.pos);if(d<bd){bd=d;best=f;}}return best;}
