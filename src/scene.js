// Scene: renderer + bloom, sky/fog/ground, environment props, stage deck, truss, LED wall surfaces, DJ booth, speaker arrays, stage wash lights
const G={R:null,scene:null,cam:null,comp:null,bloom:null,W:1,H:1,dpr:1,S:1,env:ENVS[0],stage:null,props:null,HZ:{value:0.5},T:{value:0},lights:{},anch:{},quality:1,crowdZ0:5};
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const C3=h=>new THREE.Color(h);
function glowTex(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(0.2,'rgba(255,255,255,0.75)');g.addColorStop(0.5,'rgba(255,255,255,0.18)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);
  const t=new THREE.CanvasTexture(c);return t;}
let GLOW=null;
function initScene(){
  const cv=$('c');let R;
  try{R=new THREE.WebGLRenderer({canvas:cv,antialias:!!ST.aa,powerPreference:'high-performance',alpha:false,stencil:false});}
  catch(e){throw new Error('WebGL is not available on this device/browser.');}
  G.R=R;R.setClearColor(0x05060c,1);R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.05;R.outputColorSpace=THREE.SRGBColorSpace;
  G.scene=new THREE.Scene();G.cam=new THREE.PerspectiveCamera(55,1,0.1,900);G.cam.position.set(0,7,44);
  GLOW=glowTex();
  const P=window.POST;G.comp=new P.EffectComposer(R);G.comp.addPass(new P.RenderPass(G.scene,G.cam));
  G.bloom=new P.UnrealBloomPass(new THREE.Vector2(256,256),0.85,0.55,0.22);G.comp.addPass(G.bloom);G.comp.addPass(new P.OutputPass());
  G.scene.fog=new THREE.FogExp2(0x0a0b1c,0.01);
  G.hemi=new THREE.HemisphereLight(0x8090c0,0x101018,0.5);G.scene.add(G.hemi);
  G.moon=new THREE.DirectionalLight(0x8090ff,0.25);G.moon.position.set(-30,60,40);G.scene.add(G.moon);
  // stage wash lights (left/centre/right) driven by fixture output, plus a front "audience" light and a pyro flicker light
  ['L','C','R'].forEach((k,i)=>{const l=new THREE.PointLight(0xffffff,0,60,1.6);l.position.set((i-1)*12,14,2);G.scene.add(l);G.lights[k]=l;});
  G.lights.A=new THREE.PointLight(0xffffff,0,70,1.4);G.lights.A.position.set(0,10,10);G.scene.add(G.lights.A);
  G.lights.P=new THREE.PointLight(0xff8a30,0,40,1.8);G.lights.P.position.set(0,4,2);G.scene.add(G.lights.P);
  onResize();window.addEventListener('resize',onResize);window.addEventListener('orientationchange',()=>setTimeout(onResize,200));
  if(window.visualViewport)window.visualViewport.addEventListener('resize',onResize);
}
function onResize(){if(!G.R)return;const w=window.innerWidth,h=window.innerHeight;G.W=w;G.H=h;applyDpr();G.cam.aspect=w/h;G.cam.fov=w<h?72:55;G.cam.updateProjectionMatrix();Bus.emit('resize',w,h);}
function applyDpr(){const base=Math.min(window.devicePixelRatio||1,IS_MOBILE?2:1.75);const d=clamp(base*ST.resScale*G.quality,0.5,2);G.dpr=d;G.R.setPixelRatio(d);G.R.setSize(G.W,G.H,false);G.comp.setPixelRatio(d);G.comp.setSize(G.W,G.H);
  G.bloom.resolution.set(G.W*d/2,G.H*d/2);}
// ---- materials ----
const MAT={};
function mats(){if(MAT.ok)return;MAT.ok=1;
  MAT.truss=new THREE.MeshStandardMaterial({color:0x9aa0aa,metalness:0.85,roughness:0.35});
  MAT.dark=new THREE.MeshStandardMaterial({color:0x101116,metalness:0.3,roughness:0.7});
  MAT.deck=new THREE.MeshStandardMaterial({color:0x1a1b22,metalness:0.4,roughness:0.45});
  MAT.speaker=new THREE.MeshStandardMaterial({color:0x0b0b0e,metalness:0.2,roughness:0.85});
  MAT.frame=new THREE.MeshStandardMaterial({color:0x22242c,metalness:0.6,roughness:0.5});
  MAT.barrier=new THREE.MeshStandardMaterial({color:0x50545c,metalness:0.7,roughness:0.4});}
function box(w,h,d,m,x,y,z,par){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);(par||G.stage).add(o);return o;}
// truss segment between two points: 4 chords + zig-zag diagonals as one instanced mesh per call group
function trussBatch(segs,sz){const chord=new THREE.CylinderGeometry(0.045,0.045,1,5,1);const list=[];
  const up=V3(0,1,0);
  for(const [a,b] of segs){const d=b.clone().sub(a),L=d.length(),dir=d.clone().normalize();
    // local frame
    let side=Math.abs(dir.y)>0.9?V3(1,0,0):V3(0,1,0);const u=V3().crossVectors(dir,side).normalize(),v=V3().crossVectors(dir,u).normalize();const h=sz/2;
    const corners=[[h,h],[h,-h],[-h,-h],[-h,h]].map(([p,q])=>u.clone().multiplyScalar(p).add(v.clone().multiplyScalar(q)));
    corners.forEach(c=>list.push([a.clone().add(c),b.clone().add(c)]));
    const n=Math.max(1,Math.round(L/sz));for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n;for(let c=0;c<4;c+=2){const c0=corners[c],c1=corners[(c+1)%4];
      list.push([a.clone().lerp(b,t0).add(c0),a.clone().lerp(b,t1).add(c1)]);}}}
  const im=new THREE.InstancedMesh(chord,MAT.truss,list.length);const m=new THREE.Matrix4(),q=new THREE.Quaternion(),s=V3(1,1,1);
  list.forEach(([p,r],i)=>{const d=r.clone().sub(p),L=d.length();q.setFromUnitVectors(up,d.normalize());s.set(1,L,1);m.compose(p.clone().add(r).multiplyScalar(0.5),q,s);im.setMatrixAt(i,m);});
  G.stage.add(im);return im;}
// LED surfaces get the shared LED shader (led.js)
function ledPlane(w,h,x,y,z,ry,slot){const g=new THREE.PlaneGeometry(w,h,1,1);const m=new THREE.Mesh(g,ledMaterial(slot,w/h));m.position.set(x,y,z);m.rotation.y=ry||0;G.stage.add(m);
  box(w+0.3,h+0.3,0.25,MAT.frame,0,0,-0.16,m);return m;}
function buildStage(venue,envId){mats();const S=venue?venue.S:1;G.S=S;const env=ENVMAP[envId]||ENVS[0];G.env=env;
  if(G.stage){G.scene.remove(G.stage);disposeTree(G.stage);}if(G.props){G.scene.remove(G.props);disposeTree(G.props);}
  G.stage=new THREE.Group();G.scene.add(G.stage);G.props=new THREE.Group();G.scene.add(G.props);resetLedMats();
  const W=Math.max(22,36*S),D=Math.max(8,12*S),DH=1.6,TH=DH+Math.max(8,14*S);
  const A=G.anch={W,D,DH,TH,S,frontZ:0,trussFrontZ:-0.8,trussMidZ:-D*0.45,trussBackZ:-D+1.2,towerX:W/2-0.6,ledW:Math.max(12,20*S),ledH:Math.max(6,10*S)};
  A.ledY=DH+1.2+A.ledH/2;A.ledZ=-D+0.6;
  // deck + front skirt + stairs
  box(W,DH,D,MAT.deck,0,DH/2,-D/2);const skirt=box(W,DH*0.9,0.1,MAT.dark,0,DH*0.45,0.06);
  // front LED strip on the deck edge
  const strip=ledPlane(W*0.92,DH*0.62,0,DH*0.45,0.13,0,'strip');strip.children[0].visible=false;
  // main LED wall + side wings (+ upper header in big venues)
  A.led=ledPlane(A.ledW,A.ledH,0,A.ledY,A.ledZ,0,'main');
  const wingW=Math.max(5,8*S),wingH=A.ledH*0.8,wx=A.ledW/2+wingW/2+0.8;
  ledPlane(wingW,wingH,-wx,A.ledY-0.3,A.ledZ+1.6,0.32,'wingL');ledPlane(wingW,wingH,wx,A.ledY-0.3,A.ledZ+1.6,-0.32,'wingR');
  if(S>=0.9)ledPlane(A.ledW*0.7,A.ledH*0.18,0,A.ledY+A.ledH/2+1.2,A.ledZ+0.3,0,'header');
  // DJ booth with its own LED front
  A.booth=V3(0,DH,-D*0.32);box(4.2,1.1,1.6,MAT.dark,0,DH+0.55,A.booth.z);const bf=ledPlane(4,0.9,0,DH+0.55,A.booth.z+0.82,0,'booth');bf.children[0].visible=false;
  box(3.2,0.06,1,MAT.frame,0,DH+1.13,A.booth.z);
  // risers / LED-clad side steps
  box(8,0.6,3,MAT.deck,0,DH+0.3,A.booth.z-0.4);
  // truss: front, mid, back spans + 2 towers (ground supported)
  const tz=A.trussFrontZ,tx=A.towerX,sz=0.5*Math.max(0.8,S);
  trussBatch([[V3(-tx,0,tz),V3(-tx,TH,tz)],[V3(tx,0,tz),V3(tx,TH,tz)],[V3(-tx,TH,tz),V3(tx,TH,tz)],[V3(-tx*0.8,TH-0.8,A.trussMidZ),V3(tx*0.8,TH-0.8,A.trussMidZ)],
    [V3(-tx,TH,tz),V3(-tx*0.8,TH-0.8,A.trussMidZ)],[V3(tx,TH,tz),V3(tx*0.8,TH-0.8,A.trussMidZ)],[V3(-A.ledW/2-1,A.ledY+A.ledH/2+0.6,A.ledZ+0.4),V3(A.ledW/2+1,A.ledY+A.ledH/2+0.6,A.ledZ+0.4)],
    [V3(-tx*0.6,DH+0.25,-1.2),V3(tx*0.6,DH+0.25,-1.2)]],sz);
  A.trussY=TH-sz/2-0.25;A.midY=TH-0.8-sz/2-0.25;A.backY=A.ledY+A.ledH/2+0.6;
  // line arrays hanging at the sides
  for(const sx of [-1,1]){for(let i=0;i<6;i++){const b=box(1.4,0.55,1.1,MAT.speaker,sx*(tx+2.4),TH-1.2-i*0.6,tz+0.4);b.rotation.x=0.04*i;}
    box(0.06,1.2,0.06,MAT.truss,sx*(tx+2.4),TH-0.3,tz+0.4);
    // subs on the ground
    for(let i=0;i<3;i++)box(1.6,1.1,1.2,MAT.speaker,sx*(W/2-1.2-i*1.8),0.55,1.4);}
  // barrier + FOH tent
  const bw=W*1.05;box(bw,1.1,0.1,MAT.barrier,0,0.55,3.2);box(0.08,0.08,1,MAT.barrier,0,1.1,2.8);
  G.crowdZ0=4.4;
  const foh=new THREE.Group();G.props.add(foh);const fz=40+(S-1)*10;A.fohZ=fz;box(7,0.9,4,MAT.dark,0,0.45,fz,foh);box(7.4,0.1,4.6,MAT.frame,0,3.4,fz,foh);
  for(const [px,pz] of [[-3.5,-2.1],[3.5,-2.1],[-3.5,2.1],[3.5,2.1]])box(0.1,3.4,0.1,MAT.truss,px,1.7,fz+pz,foh);
  const desk=box(5,0.12,1.4,new THREE.MeshBasicMaterial({color:0x223355}),0,0.97,fz-0.9,foh);desk.rotation.x=-0.25;
  buildEnv(env,A);applyEnvLook(env);
  Bus.emit('stage',A);return A;}
function disposeTree(o){o.traverse(n=>{if(n.geometry)n.geometry.dispose();if(n.material){const ms=Array.isArray(n.material)?n.material:[n.material];ms.forEach(m=>{if(!Object.values(MAT).includes(m)&&!m.userData.keep)m.dispose();});}});}
// ---- sky, ground, fog, environment props ----
let SKY=null,STARS=null,GROUND=null,RAIN=null,WATER=null;
function applyEnvLook(env){const f=G.scene.fog;f.color.set(env.fog);G.baseFogD=env.fogD;f.density=env.fogD;
  G.hemi.intensity=0.25+env.amb*0.45;G.hemi.color.set(env.day?0xffd8b0:0x8090c0);G.moon.intensity=env.day?0.9:0.22;G.moon.color.set(env.day?0xffc890:0x8090ff);
  if(SKY){SKY.material.uniforms.c0.value.set(env.sky[0]);SKY.material.uniforms.c1.value.set(env.sky[1]);}
  G.R.setClearColor(new THREE.Color(env.fog),1);}
function buildEnv(env,A){
  if(!SKY){SKY=new THREE.Mesh(new THREE.SphereGeometry(600,24,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{c0:{value:C3('#000')},c1:{value:C3('#222')},dayK:{value:0}},
    vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform vec3 c0,c1;uniform float dayK;varying vec3 vP;void main(){float h=clamp(vP.y*1.6+0.1,0.0,1.0);vec3 c=mix(c1,c0,pow(h,0.7));gl_FragColor=vec4(c,1.0);}'}));SKY.material.userData.keep=1;G.scene.add(SKY);}
  SKY.material.uniforms.dayK.value=env.day||0;
  if(!STARS){const n=900,p=new Float32Array(n*3);for(let i=0;i<n;i++){const th=Math.random()*Math.PI*2,ph=Math.random()*0.45+0.05;p[i*3]=Math.cos(th)*Math.cos(ph)*500;p[i*3+1]=Math.sin(ph)*500;p[i*3+2]=Math.sin(th)*Math.cos(ph)*500;}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));STARS=new THREE.Points(g,new THREE.PointsMaterial({color:0xaabbff,size:1.3,sizeAttenuation:false,fog:false,transparent:true,opacity:0.8}));STARS.material.userData.keep=1;G.scene.add(STARS);}
  STARS.visible=env.outdoor&&!env.rain&&!env.day;
  if(!GROUND){GROUND=new THREE.Mesh(new THREE.PlaneGeometry(700,700),new THREE.MeshStandardMaterial({color:0x14161d,roughness:0.75,metalness:0.15}));GROUND.rotation.x=-Math.PI/2;GROUND.material.userData.keep=1;G.scene.add(GROUND);}
  GROUND.material.color.set(env.ground);GROUND.material.roughness=env.rain&&ST.reflections?0.22:(ST.reflections?0.55:0.9);GROUND.material.metalness=env.rain&&ST.reflections?0.55:0.15;GROUND.material.needsUpdate=true;
  const P=G.props,dm=new THREE.MeshStandardMaterial({color:0x0c0d12,roughness:0.9}),W=A.W;
  const rng=seeded(7);
  if(env.props==='festival'||env.props==='desert'||env.props==='coast'){
    // delay towers with lights, side flags/tents
    for(const sx of [-1,1])for(const z of [22,46]){const x=sx*(W/2+4);box(0.6,9,0.6,MAT.truss,x,4.5,z,P);box(2,2.4,1.6,MAT.speaker,x,8,z-0.2,P);}
    for(let i=0;i<10;i++){const sx=i%2?1:-1,x=sx*(W/2+12+rng()*30),z=10+rng()*60;const t=new THREE.Mesh(new THREE.ConeGeometry(2.5+rng()*2,3+rng()*2,4),dm);t.position.set(x,1.6,z);t.rotation.y=rng()*3;P.add(t);}
    for(let i=0;i<8;i++){const x=(i-3.5)*12,z=85+rng()*10;const fl=new THREE.Mesh(new THREE.PlaneGeometry(1.2,2.2),new THREE.MeshBasicMaterial({color:new THREE.Color().setHSL(rng(),0.8,0.35),side:THREE.DoubleSide}));fl.position.set(x,7,z);P.add(fl);box(0.08,8,0.08,MAT.truss,x-0.6,4,z,P);}
  }
  if(env.props==='desert'){for(let i=0;i<14;i++){const d=new THREE.Mesh(new THREE.SphereGeometry(30+rng()*30,12,6,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0x3a2a20,roughness:1}));d.scale.y=0.18;d.position.set((rng()-0.5)*500,-1,-90-rng()*200);P.add(d);}}
  if(env.props==='coast'){WATER=new THREE.Mesh(new THREE.PlaneGeometry(800,300),new THREE.MeshStandardMaterial({color:0x081830,roughness:0.15,metalness:0.8}));WATER.rotation.x=-Math.PI/2;WATER.position.set(0,0.05,-180);P.add(WATER);
    for(let i=0;i<10;i++){const x=(i%2?1:-1)*(W/2+6+rng()*30),z=-10+rng()*70,h=7+rng()*4;const tr=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.3,h,5),dm);tr.position.set(x,h/2,z);tr.rotation.z=(rng()-0.5)*0.3;P.add(tr);
      for(let k=0;k<6;k++){const lf=new THREE.Mesh(new THREE.ConeGeometry(0.4,3.5,3),dm);lf.position.set(x,h,z);lf.rotation.set(1.2,k*1.05,0);P.add(lf);}}}
  if(env.props==='cyber'){for(let i=0;i<34;i++){const w=6+rng()*10,h=20+rng()*90,x=(rng()-0.5)*360,z=-70-rng()*200;if(Math.abs(x)<30&&z>-90)continue;
      const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,w),new THREE.MeshStandardMaterial({color:0x0a0a14,emissive:new THREE.Color().setHSL(0.75+rng()*0.4,1,0.5),emissiveIntensity:0.04+rng()*0.08,roughness:0.5}));b.position.set(x,h/2,z);P.add(b);
      if(rng()<0.5){const s=new THREE.Mesh(new THREE.BoxGeometry(w*1.02,1,w*1.02),new THREE.MeshBasicMaterial({color:new THREE.Color().setHSL(rng()<0.5?0.85:0.5,1,0.55)}));s.position.set(x,h*rng(),z);P.add(s);}}
    for(const sx of [-1,1])for(const z of [20,45]){box(0.4,10,0.4,MAT.frame,sx*(W/2+5),5,z,P);const s=box(0.3,8,0.3,new THREE.MeshBasicMaterial({color:sx>0?0xff1fa8:0x00f0ff}),sx*(W/2+5)+0.35,5,z,P);}}
  if(env.props==='arena'||env.props==='warehouse'){const wh=env.props==='warehouse',hh=wh?A.TH+5:A.TH+16,hw=wh?W+26:W+70,len=wh?110:150,z0=-A.D-6;
    const wm=new THREE.MeshStandardMaterial({color:wh?0x2a1e18:0x15161c,roughness:0.95});
    const back=box(hw,hh,1,wm,0,hh/2,z0,P);box(1,hh,len,wm,-hw/2,hh/2,z0+len/2,P);box(1,hh,len,wm,hw/2,hh/2,z0+len/2,P);box(hw,hh,1,wm,0,hh/2,z0+len,P);
    const roof=box(hw,0.6,len,new THREE.MeshStandardMaterial({color:0x08080b,roughness:1}),0,hh,z0+len/2,P);
    for(let i=0;i<6;i++)box(hw,0.5,0.5,MAT.truss,0,hh-1,z0+10+i*len/6,P);
    if(wh){for(let i=0;i<5;i++)for(const sx of [-1,1])box(0.9,hh,0.9,new THREE.MeshStandardMaterial({color:0x3a2a20,roughness:1}),sx*(W/2+4),hh/2,8+i*16,P);}
    else{for(let r=0;r<6;r++)for(const sx of [-1,1])box(14,0.8+r*1.2,len*0.8,dm,sx*(hw/2-8-r*0),0.4+r*0.6,z0+len*0.5,P);}
  }
  // rain
  if(RAIN){G.scene.remove(RAIN);RAIN.geometry.dispose();RAIN=null;}
  if(env.rain){const n=Math.round(2500*ST.particleQ),p=new Float32Array(n*6);for(let i=0;i<n;i++){const x=(Math.random()-0.5)*120,y=Math.random()*40,z=(Math.random()-0.3)*100;p.set([x,y,z,x+0.05,y-0.7,z],i*6);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));RAIN=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x8899bb,transparent:true,opacity:0.35}));G.scene.add(RAIN);}
}
function sceneTick(dt){G.T.value+=dt;if(RAIN){RAIN.position.y-=dt*28;if(RAIN.position.y<-20)RAIN.position.y+=20;}
  // haze also thickens the fog a bit
  const f=G.scene.fog;if(f)f.density=G.baseFogD*(0.75+G.HZ.value*0.6)*(ST.drawDist<1?1.5:1);}
function renderFrame(){G.bloom.enabled=!!ST.bloom;G.comp.render();}
