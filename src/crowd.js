// Crowd: instanced low-poly people with a GPU animation shader (beat jumps, sway, hands up, phone lights), plus a far "crowd carpet" for depth
const CRW={mesh:null,phones:null,carpet:null,n:0,u:null,hands:0,jump:0,sway:0,phone:0,boost:0};
function mergeGeo(parts){let nv=0,ni=0;parts.forEach(p=>{nv+=p.g.attributes.position.count;ni+=p.g.index.count;});const pos=new Float32Array(nv*3),nor=new Float32Array(nv*3),arm=new Float32Array(nv),idx=new Uint32Array(ni);let vo=0,io=0;
  parts.forEach(p=>{const g=p.g,P_=g.attributes.position,N=g.attributes.normal,I=g.index;pos.set(P_.array,vo*3);nor.set(N.array,vo*3);arm.fill(p.arm||0,vo,vo+P_.count);for(let i=0;i<I.count;i++)idx[io+i]=I.array[i]+vo;vo+=P_.count;io+=I.count;g.dispose();});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(nor,3));g.setAttribute('aArm',new THREE.BufferAttribute(arm,1));g.setIndex(new THREE.BufferAttribute(idx,1));return g;}
function personGeo(){const b=(w,h,d,x,y,z,arm)=>{const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);return {g,arm};};
  return mergeGeo([b(0.36,0.78,0.22,0,0.39,0),b(0.44,0.62,0.26,0,1.08,0),b(0.24,0.26,0.24,0,1.55,0),b(0.12,0.62,0.12,-0.29,0.97,0,-1),b(0.12,0.62,0.12,0.29,0.97,0,1)]);}
const CROWD_V=`attribute vec3 aOff;attribute vec3 aCol;attribute vec4 aR;attribute float aArm;
uniform float uTime,uBeat,uJump,uHands,uSway,uFogD;varying vec3 vC,vN,vW;varying float vFog,vY;
void main(){vec3 p=position;float h=aR.x;float ph=aOff.z;float dz=aOff.y;float eng=clamp(aR.y*(1.25-dz/70.),0.,1.3);
 float up=clamp(uHands*eng*1.4-aR.w*0.35,0.,1.);
 if(aArm!=0.){vec2 sh=vec2(aArm*0.29,1.28);vec2 q=p.xy-sh;float a=aArm*(up*2.75+up*0.25*sin(uTime*3.+ph*7.))+aArm*0.08;float c=cos(a),s=sin(a);q=vec2(c*q.x-s*q.y,s*q.x+c*q.y);p.xy=q+sh;}
 p*=h;float jb=fract(uBeat+ph*0.06);float jump=uJump*eng*max(0.,sin(jb*3.14159))*0.32*(0.6+aR.z*0.6);
 p.x+=sin(uTime*1.7+ph*6.)*0.07*uSway*p.y;p.y+=jump;
 vec3 wp=vec3(aOff.x,0.,aOff.y)+p;vW=wp;vY=p.y;vN=normal;vC=aCol;
 vec4 mv=viewMatrix*vec4(wp,1.);float d=-mv.z;vFog=1.-exp(-uFogD*uFogD*d*d);gl_Position=projectionMatrix*mv;}`;
const CROWD_F=`uniform vec3 uLight,uFogC,uL,uR;uniform float uFlash,uAmb;varying vec3 vC,vN,vW;varying float vFog,vY;
void main(){float face=max(0.,-vN.z)*0.7+max(0.,vN.y)*0.5+0.15;float side=clamp(vW.x/30.,-1.,1.);vec3 L=uLight+uL*max(0.,-side)+uR*max(0.,side);
 float top=smoothstep(0.9,1.7,vY);vec3 c=vC*(uAmb+L*face*(0.55+top*0.6))+L*top*0.15*max(0.,vN.y)+vec3(uFlash)*face*0.6;gl_FragColor=vec4(mix(c,uFogC,vFog),1.);}`;
const CARPET_F=`uniform vec3 uLight,uFogC;uniform float uBeat,uJump,uTime;varying vec2 vUv;varying float vFog;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec2 g=vUv*vec2(220.,90.);vec2 id=floor(g),f=fract(g)-.5;float r=h(id);vec2 o=vec2(r-.5,h(id+3.)-.5)*.5;float b=max(0.,sin(fract(uBeat+r*.2)*3.14))*uJump*.25;float d=length(f-o-vec2(0.,b));
 float head=smoothstep(.32,.18,d);vec3 c=mix(vec3(.02),vec3(.05)+uLight*.5,head)*(0.7+0.3*r);float ph=step(.985,h(id+floor(uTime*.2)))*head;c+=vec3(.6,.7,1.)*ph*uJump*0.;gl_FragColor=vec4(mix(c,uFogC,vFog),1.);}`;
const CARPET_V=`varying vec2 vUv;varying float vFog;uniform float uFogD;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);float d=-mv.z;vFog=1.-exp(-uFogD*uFogD*d*d);gl_Position=projectionMatrix*mv;}`;
function buildCrowd(count,A){if(CRW.mesh){G.scene.remove(CRW.mesh);CRW.mesh.geometry.dispose();}if(CRW.phones){G.scene.remove(CRW.phones);CRW.phones.geometry.dispose();}if(CRW.carpet){G.scene.remove(CRW.carpet);CRW.carpet.geometry.dispose();}
  const cap=IS_MOBILE?2600:6500;const n=Math.max(60,Math.min(cap,Math.round(count*clamp(ST.crowdQ,0.2,1.5)*(IS_MOBILE?0.75:1))));CRW.n=n;
  const geo=personGeo();const off=new Float32Array(n*3),col=new Float32Array(n*4/4*3),r4=new Float32Array(n*4);const z0=G.crowdZ0,depth=Math.min(62,14+count/90),fz=A.fohZ;
  const CL=['#1b1d2a','#2a2233','#16222e','#33272a','#222','#3a3a44','#4a1830','#183048','#3a3a20','#111522','#d8d8e0','#7a1f1f'];const ph=[];
  for(let i=0;i<n;i++){let x,z,t=0;do{const u=Math.pow(Math.random(),1.25);z=z0+u*depth;const hw=A.W*0.55+z*0.55;x=(Math.random()*2-1)*hw;t++;}while(t<8&&Math.abs(x)<4.8&&Math.abs(z-fz)<3.4);
    off.set([x,z,Math.random()],i*3);const c=C3(pick(CL)).multiplyScalar(rnd(0.6,1.2));col.set([c.r,c.g,c.b],i*3);r4.set([rnd(0.88,1.1),rnd(0.55,1),Math.random(),Math.random()],i*4);if(r4[i*4+3]>0.78&&ph.length<1200)ph.push(x+0.3,2.15*r4[i*4],z);}
  const ig=new THREE.InstancedBufferGeometry();ig.index=geo.index;for(const k in geo.attributes)ig.setAttribute(k,geo.attributes[k]);ig.instanceCount=n;
  ig.setAttribute('aOff',new THREE.InstancedBufferAttribute(off,3));ig.setAttribute('aCol',new THREE.InstancedBufferAttribute(col,3));ig.setAttribute('aR',new THREE.InstancedBufferAttribute(r4,4));
  const fogC=G.scene.fog?G.scene.fog.color.clone():C3('#000');
  CRW.u={uTime:G.T,uBeat:{value:0},uJump:{value:0},uHands:{value:0},uSway:{value:0},uFogD:{value:0.01},uLight:{value:C3('#223')},uL:{value:C3('#000')},uR:{value:C3('#000')},uFogC:{value:fogC},uFlash:{value:0},uAmb:{value:0.12}};
  const m=new THREE.ShaderMaterial({uniforms:CRW.u,vertexShader:CROWD_V,fragmentShader:CROWD_F});const mesh=new THREE.Mesh(ig,m);mesh.frustumCulled=false;G.scene.add(mesh);CRW.mesh=mesh;
  // phone lights (breakdowns)
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(ph),3));const pc=new Float32Array(ph.length);for(let i=0;i<pc.length;i+=3){pc[i]=0.8;pc[i+1]=0.85;pc[i+2]=1;}pg.setAttribute('aC',new THREE.BufferAttribute(pc,3));const ps=new Float32Array(ph.length/3).fill(0.5);pg.setAttribute('aS',new THREE.BufferAttribute(ps,1));
  const pm=new THREE.ShaderMaterial({uniforms:{uTex:{value:GLOW},uScale:{value:300},uA:{value:0}},vertexShader:GLOW_V,fragmentShader:GLOW_F.replace('gl_FragColor=vec4(vC*t.a,t.a);','gl_FragColor=vec4(vC*t.a*uA,t.a*uA);').replace('uniform sampler2D uTex;','uniform sampler2D uTex;uniform float uA;'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
  CRW.phones=new THREE.Points(pg,pm);CRW.phones.frustumCulled=false;G.scene.add(CRW.phones);
  // far crowd carpet beyond the instanced people (outdoor festivals feel endless)
  const cz=z0+depth,cd=G.env.outdoor?90:Math.max(4,40-depth);if(cd>4){const cg=new THREE.PlaneGeometry(A.W*1.2+cz*1.4+cd*1.2,cd,1,1);cg.rotateX(-Math.PI/2);
    const cm=new THREE.ShaderMaterial({uniforms:{uLight:CRW.u.uLight,uFogC:CRW.u.uFogC,uBeat:CRW.u.uBeat,uJump:CRW.u.uJump,uTime:G.T,uFogD:CRW.u.uFogD},vertexShader:CARPET_V,fragmentShader:CARPET_F});
    CRW.carpet=new THREE.Mesh(cg,cm);CRW.carpet.position.set(0,0.9,cz+cd/2-1);G.scene.add(CRW.carpet);}
  return n;}
// per-frame: C={beat, e (engagement 0..1), energy, sec, hype}
function crowdTick(dt,C){if(!CRW.u)return;const u=CRW.u,sec=C.sec||'groove',e=C.e,en=C.energy;CRW.boost=Math.max(0,CRW.boost-dt*0.6);
  const jumpT=(sec==='drop'||sec==='peak'?1:sec==='main'||sec==='groove'?0.55:sec==='build'?0.35:0.05)*clamp(e*1.4,0,1)*(C.playing?1:0);
  const handsT=clamp((sec==='drop'||sec==='peak'?0.75:sec==='build'?0.45:0.12)*e*1.3+CRW.boost,0,1);const swayT=sec==='break'||sec==='intro'||sec==='outro'?1:0.4;
  CRW.jump=approach(CRW.jump,jumpT,dt,0.4);CRW.hands=approach(CRW.hands,handsT,dt,0.35);CRW.sway=approach(CRW.sway,swayT,dt,1);CRW.phone=approach(CRW.phone,sec==='break'&&C.playing?clamp(e*1.5,0.2,1):0,dt,1.2);
  u.uBeat.value=C.beat;u.uJump.value=ST.reduceMotion?CRW.jump*0.3:CRW.jump;u.uHands.value=CRW.hands;u.uSway.value=CRW.sway;u.uFogD.value=G.scene.fog?G.scene.fog.density:0.01;u.uFogC.value.copy(G.scene.fog.color);
  const s=FIX.stats,k=1/Math.max(1,1);const mixc=(r,a)=>{const w=r[3]||0;return a.setRGB(r[0],r[1],r[2]).multiplyScalar(w>0?Math.min(1.2,w*0.5)/w*1.2:0);};
  mixc(s.C,u.uLight.value);mixc(s.L,u.uL.value);mixc(s.R,u.uR.value);u.uLight.value.add(_c.setRGB(0.15,0.09,0.03).multiplyScalar(FXS.pyroL*1.5));
  u.uFlash.value=Math.min(1,(C.flash||0)*0.8+(s.strobe>0&&C.strobeOn?0.3:0));u.uAmb.value=0.06+G.env.amb*0.1;
  if(CRW.phones){CRW.phones.material.uniforms.uA.value=CRW.phone;CRW.phones.material.uniforms.uScale.value=G.H*G.dpr*0.35;}}
