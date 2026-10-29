// Crowd v2.1: instanced human silhouettes (legs, torso, arms with elbows, heads, hair/hats, phones, glowsticks, flags, totems, shoulder riders)
// animated per person on the GPU (beat bounce with own phase, head nods, fist pumps, hands-up waves, build-up claps, unison drop jumps, breakdown sway + phones,
// circle pits for heavy genres, turning to face the stage, cheer bursts + energy waves from front to back). LOD: detailed near tier, billboard impostors far, carpet beyond.
const CRW={mesh:null,far:null,phones:null,phones2:null,carpet:null,n:0,nNear:0,nFar:0,nDraw:0,u:null,hands:0,jump:0,sway:0,phone:0,boost:0,clap:0,nod:0,uni:0,pump:0,face:0.7,cheer:0,
  waveZ:0,waveA:0,pit:0,pitA:0,pits:[],z0:5,z1:40,hw0:10,lastSec:'',heavy:false,strobeUp:0,spots:[]};
const HEAVY_G=['dubstep','dnb','peaktechno','basshouse','futurerave'];
function mergeParts(parts){let nv=0,ni=0;parts.forEach(p=>{nv+=p.g.attributes.position.count;ni+=p.g.index.count;});
  const pos=new Float32Array(nv*3),nor=new Float32Array(nv*3),lim=new Float32Array(nv),mat=new Float32Array(nv),op=new Float32Array(nv),idx=new Uint32Array(ni);let vo=0,io=0;
  parts.forEach(p=>{const g=p.g,P_=g.attributes.position,N=g.attributes.normal,I=g.index;pos.set(P_.array,vo*3);nor.set(N.array,vo*3);lim.fill(p.l,vo,vo+P_.count);mat.fill(p.m,vo,vo+P_.count);op.fill(p.o||0,vo,vo+P_.count);
    for(let i=0;i<I.count;i++)idx[io+i]=I.array[i]+vo;vo+=P_.count;io+=I.count;g.dispose();});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(nor,3));
  g.setAttribute('aLimb',new THREE.BufferAttribute(lim,1));g.setAttribute('aMat',new THREE.BufferAttribute(mat,1));g.setAttribute('aOpt',new THREE.BufferAttribute(op,1));g.setIndex(new THREE.BufferAttribute(idx,1));return g;}
// limbs: 0 body, 1/2 legs L/R, 3 head, 4/5 left upper/fore arm, 6/7 right upper/fore arm. mats: 0 shirt 1 pants 2 skin 3 hair/hat 4 shoes 5 phone 6 screen 7 glowstick 8 flag 9 pole 10 totem
// opts: 0 always, 1 short hair, 2 cap, 3 long hair, 4 beanie, 10 phone, 11 glowstick, 12 flag, 13 totem
function humanGeo(){const P=[];const add=(g,x,y,z,l,m,o)=>{g.translate(x,y,z);P.push({g,l,m,o});};
  const cyl=(r1,r2,h,s)=>new THREE.CylinderGeometry(r1,r2,h,s,1),box=(w,h,d)=>new THREE.BoxGeometry(w,h,d),sph=(r,w,h,t)=>new THREE.SphereGeometry(r,w,h,0,Math.PI*2,0,t||Math.PI);
  for(const s of [-1,1]){const L=s<0?1:2;add(cyl(0.078,0.06,0.82,6),s*0.1,0.47,0,L,1);add(box(0.11,0.08,0.25),s*0.1,0.04,-0.04,L,4);
    const U=s<0?4:6,F=s<0?5:7;add(cyl(0.056,0.05,0.31,5),s*0.22,1.42-0.155,0,U,0);add(cyl(0.047,0.04,0.27,5),s*0.22,1.12-0.135,0,F,2);add(box(0.07,0.09,0.06),s*0.22,0.81,0,F,2);}
  add(box(0.34,0.2,0.21),0,0.92,0,0,1);{const t=cyl(0.205,0.165,0.56,8);t.scale(1,1,0.62);add(t,0,1.18,0,0,0);}add(box(0.46,0.1,0.22),0,1.42,0,0,0);add(cyl(0.05,0.05,0.12,5),0,1.5,0,0,2);
  {const h=sph(0.115,8,6);h.scale(1,1.12,1.04);add(h,0,1.63,0,3,2);}
  add(sph(0.123,8,4,Math.PI*0.55),0,1.64,0.012,3,3,1);
  add(sph(0.127,8,3,Math.PI/2),0,1.66,0,3,3,2);add(box(0.2,0.02,0.15),0,1.67,-0.13,3,3,2);
  add(sph(0.124,8,4,Math.PI*0.58),0,1.64,0.012,3,3,3);add(box(0.21,0.32,0.07),0,1.46,0.09,3,3,3);
  {const b=sph(0.13,8,4,Math.PI*0.52);b.scale(1,1.22,1);add(b,0,1.645,0,3,3,4);}
  add(box(0.075,0.15,0.014),0.22,0.74,-0.03,7,5,10);{const sc=new THREE.PlaneGeometry(0.064,0.13);sc.rotateY(Math.PI);add(sc,0.22,0.74,-0.039,7,6,10);}
  add(cyl(0.015,0.015,0.34,5),-0.22,0.7,-0.03,5,7,11);
  add(cyl(0.012,0.012,1.7,4),0.22,0.81-0.85,0,7,9,12);{const c=new THREE.PlaneGeometry(0.62,0.4,4,1);add(c,0.22+0.31,-0.64,0,7,8,12);}
  add(cyl(0.014,0.014,1.9,4),0.22,0.81-0.95,0,7,9,13);add(box(0.5,0.36,0.035),0.22,-0.9,0,7,10,13);
  return mergeParts(P);}
const CROWD_COMMON=`uniform float uTime,uBeat,uJump,uHands,uSway,uFogD,uClap,uNod,uUni,uPump,uPhone,uFace,uCheer,uWaveZ,uWaveA,uZ0,uMot,uPitA;uniform vec4 uPit[2];
float bounceOf(float ph,out float bf){float bt=uBeat+(ph-.5)*.2*(1.-uUni);bf=fract(bt);return max(0.,sin(bf*3.14159));}
float engOf(vec4 r,float dz){return clamp(r.y*(1.25-dz/70.),0.,1.3);}
float waveOf(float dz){return uWaveA*exp(-pow((dz-uWaveZ)/4.5,2.));}
vec2 pitMove(vec2 xz,float ph,inout float yaw,out float inPit){inPit=0.;for(int k=0;k<2;k++){vec4 P=uPit[k];if(P.w>.01){vec2 d=xz-P.xy;float L=length(d);if(L<P.z){float s=P.w*smoothstep(P.z,P.z*.55,L);inPit=max(inPit,s);
   float a=uPitA*(.8+fract(ph*7.)*.5)*(1.3-L/P.z);float c=cos(a),sn=sin(a);vec2 rd=vec2(c*d.x-sn*d.y,sn*d.x+c*d.y);float rr=mix(L,P.z*.4+L*.6,s);rd=normalize(rd+1e-4)*rr;
   xz=P.xy+rd+vec2(sin(uTime*7.+ph*40.),cos(uTime*6.+ph*31.))*.22*s;vec2 f=normalize(vec2(-rd.y,rd.x));yaw=mix(yaw,atan(-f.x,-f.y),s);}}}return xz;}
vec3 skinOf(float r){vec3 a=vec3(.98,.8,.66),b=vec3(.84,.62,.45),c=vec3(.58,.39,.26),d=vec3(.34,.22,.14);return r<.33?mix(a,b,r*3.):r<.66?mix(b,c,(r-.33)*3.):mix(c,d,(r-.66)*3.);}`;
const CROWD_V=`attribute float aLimb,aMat,aOpt;attribute vec4 aOff,aR,aV;attribute vec3 aCol,aCol2,aHair;
${CROWD_COMMON}
varying vec3 vC,vN,vW;varying float vFog,vY,vEm;
vec3 rx(vec3 v,float a){float c=cos(a),s=sin(a);return vec3(v.x,v.y*c-v.z*s,v.y*s+v.z*c);}
vec3 ry(vec3 v,float a){float c=cos(a),s=sin(a);return vec3(v.x*c+v.z*s,v.y,-v.x*s+v.z*c);}
vec3 rz(vec3 v,float a){float c=cos(a),s=sin(a);return vec3(v.x*c-v.y*s,v.x*s+v.y*c,v.z);}
void main(){float hat=aV.z,prop=aV.w,vis=1.;
 if(aOpt>.5&&aOpt<9.5)vis=step(abs(hat-(aOpt-1.)),.1);else if(aOpt>9.5)vis=step(abs(prop-(aOpt-9.)),.1);
 if(vis<.5){gl_Position=vec4(2.,2.,2.,1.);vC=vec3(0.);vN=vec3(0.,1.,0.);vW=vec3(0.);vFog=0.;vY=0.;vEm=0.;return;}
 vec3 p=position,n=normal;float h=aR.x,ph=aOff.z,r1=aR.z,r2=aR.w,w=aV.x;float dz=aOff.y-uZ0;float eng=engOf(aR,dz);float wv=waveOf(dz);
 float cheer=clamp(uCheer*eng+wv,0.,1.);float rider=step(.01,aV.y);float thr=.25+r2*.65;float up=smoothstep(thr-.07,thr+.07,uHands*eng*1.3+cheer);if(rider>.5)up=max(up,clamp(uHands*1.5+.35,0.,1.));
 float bf;float bounce=bounceOf(ph,bf);float yaw=aOff.w*(1.-uFace);float inPit;vec2 xz=pitMove(aOff.xy,ph,yaw,inPit);
 float jumpA=(uJump*eng*(.55+r1*.6)*(1.+uUni*.9)+wv*.7+inPit*.5)*uMot;
 if(aMat>7.5&&aMat<8.5){p.z+=sin(uTime*5.+p.x*9.+ph*20.)*.07*clamp((p.x-.22)*2.,0.,1.);}
 p.x*=w;p.z*=mix(1.,w,.7);
 if(aLimb>.5&&aLimb<2.5){float s=aLimb<1.5?-1.:1.;vec3 H=vec3(s*.1*w,.88,0.);vec3 v=p-H;
   float kick=sin(uTime*9.+s*1.57+ph*6.)*.55*inPit*uMot;
   if(rider>.5){v=rz(rx(v,-1.0),s*.38);n=rz(rx(n,-1.0),s*.38);}else{v=rx(v,kick);n=rx(n,kick);}p=H+v;}
 else if(aLimb>2.5&&aLimb<3.5){vec3 N=vec3(0.,1.49,0.);float nod=uNod*eng*(.16+.12*r1)*pow(1.-bf,2.)*uMot+up*.12;vec3 v=rx(p-N,nod*-1.+.0);n=rx(n,-nod);p=N+v;}
 else if(aLimb>3.5){float s=aLimb<5.5?-1.:1.;bool fore=(aLimb>4.5&&aLimb<5.5)||aLimb>6.5;vec3 S=vec3(s*.22*w,1.42,0.);
   vec4 P=vec4(.12,.12+.1*sin(uTime*2.+ph*9.)*uSway,0.,.35+.25*bounce*uJump);
   float clap=uClap*step(r2,.8)*(1.-up);float cp=pow(max(0.,cos(bf*6.2832)),6.);P=mix(P,vec4(.12,1.3,.2+.24*cp,.75),clap);
   float pumper=step(.5,fract(r1*13.));float both=step(.75,fract(r1*29.));float pump=smoothstep(r2*.6+.1,r2*.6+.2,uPump*eng*1.2)*pumper*(s>0.?1.:both)*(1.-up);P=mix(P,vec4(2.55,.45,0.,.25+.95*(1.-bounce)),pump);
   P=mix(P,vec4(2.72+.22*sin(uTime*3.+ph*7.+s),.25,0.,.15),up);
   float twirl=step(1.5,prop)*step(prop,2.5)*(s<0.?1.:0.);P=mix(P,vec4(2.5+.4*sin(uTime*6.+ph*9.),.4,.3*cos(uTime*6.+ph*9.),.2),twirl*max(up,.4*uJump));
   float filmer=step(.5,prop)*step(prop,1.5)*(s>0.?1.:0.);float phone=filmer*clamp(max(uPhone,step(.6,r1)*.95)+cheer*.0,0.,1.);P=mix(P,vec4(.08,2.0,.12,.3),phone);
   float pole=step(2.5,prop)*(s>0.?1.:0.);P=mix(P,vec4(2.62+.12*sin(uTime*2.+ph*5.),.3+.1*sin(uTime*1.3+ph),0.,.15),pole);
   vec3 v=p-S;if(fore){vec3 e=vec3(0.,-.31,0.);v=e+rx(v-e,P.w);n=rx(n,P.w);}
   v=rz(ry(rx(v,P.y),s*P.z),s*P.x);n=rz(ry(rx(n,P.y),s*P.z),s*P.x);p=S+v;}
 float sw=uSway*sin(uTime*1.7+ph*6.)*.07*uMot;p=rz(p,sw);n=rz(n,sw);
 p*=h;p=ry(p,yaw);n=ry(n,yaw);
 vec3 wp=vec3(xz.x,aV.y+jumpA*bounce*.32,xz.y)+p;vW=wp;vY=p.y/h;vN=n;
 float m=aMat;vEm=0.;
 if(m<.5)vC=aCol;else if(m<1.5)vC=aCol2;else if(m<2.5)vC=skinOf(r1);else if(m<3.5)vC=aHair;else if(m<4.5)vC=vec3(.05);else if(m<5.5)vC=vec3(.03);
 else if(m<6.5){vC=vec3(.75,.85,1.);vEm=.4+.9*max(uPhone,step(.6,r1));}
 else if(m<7.5){vC=fract(r2*7.)<.33?vec3(.2,1.,.4):fract(r2*7.)<.66?vec3(1.,.2,.8):vec3(.2,.7,1.);vEm=1.1+.5*sin(uTime*4.+ph*20.);}
 else if(m<8.5){vC=mix(aCol,aHair,step(.5,fract(position.x*4.)))*.9+.05;}else if(m<9.5)vC=vec3(.35);
 else{vC=fract(r2*5.)<.5?vec3(1.,.3,.7):vec3(.3,.9,1.);vEm=.25;}
 vec4 mv=viewMatrix*vec4(wp,1.);float d=-mv.z;vFog=1.-exp(-uFogD*uFogD*d*d);gl_Position=projectionMatrix*mv;}`;
const CROWD_LIGHT=`uniform vec3 uLight,uFogC,uL,uR,uRim;uniform float uFlash,uAmb;uniform vec4 uSp[8];uniform vec3 uSpC[8];
vec3 spotsAt(vec3 w){vec3 s=vec3(0.);for(int i=0;i<8;i++){vec4 q=uSp[i];if(q.w>0.){float d=length(w.xz-q.xy);s+=uSpC[i]*smoothstep(q.z,q.z*.3,d);}}return s;}`;
const CROWD_F=`${CROWD_LIGHT}varying vec3 vC,vN,vW;varying float vFog,vY,vEm;
void main(){vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;vec3 V=normalize(cameraPosition-vW);float face=max(0.,-N.z)*.75+max(0.,N.y)*.45+.12;float side=clamp(vW.x/30.,-1.,1.);
 vec3 L=uLight+uL*max(0.,-side)+uR*max(0.,side);float top=smoothstep(.9,1.7,vY);vec3 sp=spotsAt(vW);
 vec3 c=vC*(uAmb+L*face*(.32+top*.4)+sp*(.25+.6*max(N.y,0.)+.3*max(-N.z,0.)));
 float rim=pow(1.-abs(dot(N,V)),3.)*(.35+.65*top);float back=max(0.,V.z);c+=uRim*rim*(.25+back*.75);c+=vec3(uFlash)*face*.6;c=c/(1.+max(c.r,max(c.g,c.b))*.6);c+=vC*vEm;
 gl_FragColor=vec4(mix(c,uFogC,vFog*(1.-min(vEm,1.)*.6)),1.);}`;
// far tier: camera-facing billboards with an SDF human silhouette (arms follow hands-up), same beat/wave/pit maths
const IMP_V=`attribute vec4 aOff,aR;attribute vec3 aCol,aCol2;${CROWD_COMMON}
varying vec2 vQ;varying vec3 vS,vP,vK,vW;varying float vUp,vFog,vT;
void main(){float h=aR.x,ph=aOff.z;float dz=aOff.y-uZ0;float eng=engOf(aR,dz);float wv=waveOf(dz);float cheer=clamp(uCheer*eng+wv,0.,1.);
 float thr=.25+aR.w*.65;float up=smoothstep(thr-.07,thr+.07,uHands*eng*1.3+cheer);float bf;float b=bounceOf(ph,bf);float yaw=0.,ip;vec2 xz=pitMove(aOff.xy,ph,yaw,ip);
 float jumpA=(uJump*eng*(.55+aR.z*.6)*(1.+uUni*.9)+wv*.7)*uMot;vec3 base=vec3(xz.x,jumpA*b*.32,xz.y);
 vec3 tc=cameraPosition-base;tc.y=0.;vec3 f=normalize(tc+vec3(1e-4,0.,0.));vec3 rt=vec3(f.z,0.,-f.x);
 vec3 wp=base+rt*position.x*h+vec3(0.,position.y*h,0.)+f*.0;vW=wp;vQ=position.xy;vUp=up;vS=aCol;vP=aCol2;vK=skinOf(aR.z);vT=uTime+ph*20.;
 vec4 mv=viewMatrix*vec4(wp,1.);float d=-mv.z;vFog=1.-exp(-uFogD*uFogD*d*d);gl_Position=projectionMatrix*mv;}`;
const IMP_F=`${CROWD_LIGHT}varying vec2 vQ;varying vec3 vS,vP,vK,vW;varying float vUp,vFog,vT;
float sdB(vec2 p,vec2 b){vec2 d=abs(p)-b;return length(max(d,0.))+min(max(d.x,d.y),0.);}
float sdS(vec2 p,vec2 a,vec2 b,float r){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-r;}
void main(){vec2 q=vQ;float hd=length((q-vec2(0.,1.62))*vec2(1.,.9))-.12;float to=sdB(q-vec2(0.,1.14),vec2(.16,.3))-.045;float lg=min(sdB(q-vec2(-.09,.45),vec2(.065,.45)),sdB(q-vec2(.09,.45),vec2(.065,.45)));
 float wv=.05*sin(vT*3.);vec2 hl=mix(vec2(-.26,.84),vec2(-.34+wv,2.02),vUp),hr=mix(vec2(.26,.84),vec2(.34-wv,2.02),vUp);float ar=min(sdS(q,vec2(-.21,1.4),hl,.05),sdS(q,vec2(.21,1.4),hr,.05));
 float d=min(min(hd,to),min(lg,ar));if(d>0.)discard;vec3 col=hd<=0.?vK:lg<=0.&&to>0.?vP:vS;
 float top=smoothstep(.9,1.7,q.y);vec3 c=col*(uAmb+uLight*.5*(.35+.65*top)+spotsAt(vW)*.8)+uRim*smoothstep(-.04,0.,d)*.7+vec3(uFlash)*.3;c=c/(1.+max(c.r,max(c.g,c.b))*.6);
 gl_FragColor=vec4(mix(c,uFogC,vFog),1.);}`;
const CARPET_F=`uniform vec3 uLight,uFogC;uniform float uBeat,uJump,uTime;varying vec2 vUv;varying float vFog;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec2 g=vUv*vec2(220.,90.);vec2 id=floor(g),f=fract(g)-.5;float r=h(id);vec2 o=vec2(r-.5,h(id+3.)-.5)*.5;float b=max(0.,sin(fract(uBeat+r*.2)*3.14))*uJump*.25;float d=length(f-o-vec2(0.,b));
 float head=smoothstep(.32,.18,d);vec3 c=mix(vec3(.02),vec3(.05)+uLight*.5,head)*(0.7+0.3*r);gl_FragColor=vec4(mix(c,uFogC,vFog),1.);}`;
const CARPET_V=`varying vec2 vUv;varying float vFog;uniform float uFogD;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);float d=-mv.z;vFog=1.-exp(-uFogD*uFogD*d*d);gl_Position=projectionMatrix*mv;}`;
const CRW_SHIRT=['#15161c','#1b1d2a','#e8e8ee','#2b2b33','#3a3f4a','#ff2bd6','#9dff00','#ff7a1a','#ffd400','#c81e3a','#12a5a5','#7a3bd0','#2a4a2a','#244a8a','#f2f2f2','#111','#5a1030','#ff4fa0','#20e3ff','#333844'];
const CRW_PANTS=['#1d2a44','#2a3a5a','#111','#1a1a1a','#3a3a3a','#5a5040','#20242c','#6a6a72','#2c3e66','#c8c0a8'];
const CRW_HAIR=['#0c0806','#1c120a','#3a2414','#6a4422','#b08850','#d8c080','#8a2a10','#ff3fb0','#3a7aff','#ececec','#111','#222'];
const CRW_HAT=['#111','#e8e8e8','#c81e3a','#244a8a','#ffd400','#ff2bd6','#2a4a2a','#ff7a1a','#20e3ff','#333'];
function crowdDispose(){['mesh','far','phones','phones2','carpet'].forEach(k=>{const m=CRW[k];if(m){G.scene.remove(m);m.geometry.dispose();m.material.dispose();CRW[k]=null;}});}
function phonePoints(arr,uA){const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(arr),3));const k=arr.length/3,pc=new Float32Array(k*3);for(let i=0;i<k;i++){pc[i*3]=0.75;pc[i*3+1]=0.82;pc[i*3+2]=1;}
  pg.setAttribute('aC',new THREE.BufferAttribute(pc,3));pg.setAttribute('aS',new THREE.BufferAttribute(new Float32Array(k).fill(0.6),1));
  const pm=new THREE.ShaderMaterial({uniforms:{uTex:{value:GLOW},uScale:{value:300},uA:{value:uA}},vertexShader:GLOW_V,fragmentShader:GLOW_F.replace('gl_FragColor=vec4(vC*t.a,t.a);','gl_FragColor=vec4(vC*t.a*uA,t.a*uA);').replace('uniform sampler2D uTex;','uniform sampler2D uTex;uniform float uA;'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
  const pts=new THREE.Points(pg,pm);pts.frustumCulled=false;G.scene.add(pts);return pts;}
function buildCrowd(count,A){crowdDispose();
  const q=clamp(ST.crowdQ,0.2,1.5),cap=IS_MOBILE?4200:11000;const n=Math.max(60,Math.min(cap,Math.round(count*q*(IS_MOBILE?0.85:1))));
  const nearCap=Math.round((IS_MOBILE?1000:2600)*Math.min(1,q+0.15));const z0=G.crowdZ0,depth=Math.min(62,14+count/90),fz=A.fohZ;CRW.z0=z0;CRW.z1=z0+depth;CRW.hw0=A.W*0.55;CRW.heavy=false;
  const P=[];for(let i=0;i<n;i++){let x,z,t=0;do{const u=Math.pow(Math.random(),1.25);z=z0+u*depth;const hw=A.W*0.55+(z-z0)*0.55+z0*0.55;x=(Math.random()*2-1)*hw;t++;}while(t<8&&Math.abs(x)<4.8&&Math.abs(z-fz)<3.4);P.push({x,z});}
  P.sort((a,b)=>a.z-b.z);const nNear=Math.min(nearCap,n),near=P.slice(0,nNear),farP=P.slice(nNear);
  const ph1=[],ph2=[];const mk=(p,o)=>{const shirt=C3(pick(CRW_SHIRT)).multiplyScalar(rnd(0.75,1.1)),pants=C3(pick(CRW_PANTS)).multiplyScalar(rnd(0.8,1.15));
    const hr=Math.random(),hat=hr<0.45?0:hr<0.65?1:hr<0.9?2:3;const hair=C3(hat===1||hat===3?pick(CRW_HAT):pick(CRW_HAIR));const pr=Math.random();const prop=pr<0.12?1:pr<0.19?2:pr<0.202?3:pr<0.212?4:0;
    const yaw=Math.random()<0.1?rnd(-1.6,1.6):rnd(-0.3,0.3);return Object.assign({x:p.x,z:p.z,ph:Math.random(),yaw,shirt,pants,hair,h:rnd(0.86,1.12),e:rnd(0.55,1),r1:Math.random(),r2:Math.random(),w:rnd(0.86,1.25),ry:0,hat,prop},o||{});};
  const NP=[];near.forEach(p=>{const a=mk(p);NP.push(a);if(Math.random()<0.016){const r=mk(p,{h:rnd(0.82,0.94),w:rnd(0.85,1),ph:a.ph,e:Math.min(1,a.e+0.2),prop:Math.random()<0.3?3:Math.random()<0.4?2:0});r.z+=0.02;r.ry=1.42*a.h-0.88*r.h+0.04;r.yaw=a.yaw;NP.push(r);}});
  const FP=farP.map(p=>mk(p));
  const film=(a)=>{if(a.prop!==1)return;const pt=[a.x+0.2*a.h,a.ry+1.74*a.h,a.z-0.42*a.h];(a.r1>0.6?ph1:ph2).push(...pt);};NP.forEach(film);FP.forEach(film);
  // near tier
  const fogC=G.scene.fog?G.scene.fog.color.clone():C3('#000');const V4=()=>new THREE.Vector4(0,0,0,0);
  CRW.u={uTime:G.T,uBeat:{value:0},uJump:{value:0},uHands:{value:0},uSway:{value:0},uFogD:{value:0.01},uClap:{value:0},uNod:{value:0},uUni:{value:0},uPump:{value:0},uPhone:{value:0},uFace:{value:0.7},uCheer:{value:0},
    uWaveZ:{value:0},uWaveA:{value:0},uZ0:{value:z0},uMot:{value:1},uPitA:{value:0},uPit:{value:[V4(),V4()]},
    uLight:{value:C3('#223')},uL:{value:C3('#000')},uR:{value:C3('#000')},uRim:{value:C3('#000')},uFogC:{value:fogC},uFlash:{value:0},uAmb:{value:0.12},uSp:{value:[0,1,2,3,4,5,6,7].map(V4)},uSpC:{value:[0,1,2,3,4,5,6,7].map(()=>new THREE.Color(0,0,0))}};
  const geo=humanGeo(),N=NP.length;const off=new Float32Array(N*4),c1=new Float32Array(N*3),c2=new Float32Array(N*3),c3=new Float32Array(N*3),r4=new Float32Array(N*4),v4=new Float32Array(N*4);
  NP.forEach((a,i)=>{off.set([a.x,a.z,a.ph,a.yaw],i*4);c1.set([a.shirt.r,a.shirt.g,a.shirt.b],i*3);c2.set([a.pants.r,a.pants.g,a.pants.b],i*3);c3.set([a.hair.r,a.hair.g,a.hair.b],i*3);r4.set([a.h,a.e,a.r1,a.r2],i*4);v4.set([a.w,a.ry,a.hat,a.prop],i*4);});
  const ig=new THREE.InstancedBufferGeometry();ig.index=geo.index;for(const k in geo.attributes)ig.setAttribute(k,geo.attributes[k]);ig.instanceCount=N;
  const IA=(a,s)=>new THREE.InstancedBufferAttribute(a,s);ig.setAttribute('aOff',IA(off,4));ig.setAttribute('aCol',IA(c1,3));ig.setAttribute('aCol2',IA(c2,3));ig.setAttribute('aHair',IA(c3,3));ig.setAttribute('aR',IA(r4,4));ig.setAttribute('aV',IA(v4,4));
  const m=new THREE.ShaderMaterial({uniforms:CRW.u,vertexShader:CROWD_V,fragmentShader:CROWD_F,side:THREE.DoubleSide});const mesh=new THREE.Mesh(ig,m);mesh.frustumCulled=false;G.scene.add(mesh);CRW.mesh=mesh;
  // far tier = far people, then the near people back-to-front (drawn as impostors when adaptive quality trims the near tier)
  const FA=FP.concat(NP.filter(a=>!a.ry).slice().reverse());const M=FA.length;const fo=new Float32Array(M*4),f1=new Float32Array(M*3),f2=new Float32Array(M*3),fr=new Float32Array(M*4);
  FA.forEach((a,i)=>{fo.set([a.x,a.z,a.ph,0],i*4);f1.set([a.shirt.r,a.shirt.g,a.shirt.b],i*3);f2.set([a.pants.r,a.pants.g,a.pants.b],i*3);fr.set([a.h,a.e,a.r1,a.r2],i*4);});
  const qg=new THREE.BufferGeometry();qg.setAttribute('position',new THREE.BufferAttribute(new Float32Array([-0.46,0,0, 0.46,0,0, 0.46,2.16,0, -0.46,2.16,0]),3));qg.setIndex([0,1,2,0,2,3]);
  const fg=new THREE.InstancedBufferGeometry();fg.index=qg.index;fg.setAttribute('position',qg.attributes.position);fg.setAttribute('aOff',IA(fo,4));fg.setAttribute('aCol',IA(f1,3));fg.setAttribute('aCol2',IA(f2,3));fg.setAttribute('aR',IA(fr,4));
  CRW.nFar=FP.length;CRW.nNear=N;CRW.nNearPeople=NP.filter(a=>!a.ry).length;fg.instanceCount=FP.length;
  const fm=new THREE.ShaderMaterial({uniforms:CRW.u,vertexShader:IMP_V,fragmentShader:IMP_F});const far=new THREE.Mesh(fg,fm);far.frustumCulled=false;G.scene.add(far);CRW.far=far;
  CRW.n=N+FP.length;CRW.nDraw=N;CRW.riders=N-CRW.nNearPeople;CRW.props={phone:NP.filter(a=>a.prop===1).length,glow:NP.filter(a=>a.prop===2).length,flag:NP.filter(a=>a.prop===3).length,totem:NP.filter(a=>a.prop===4).length};
  CRW.phones=phonePoints(ph1,0);CRW.phones2=phonePoints(ph2,0);
  const cz=z0+depth,cd=G.env.outdoor?90:Math.max(4,40-depth);if(cd>4){const cg=new THREE.PlaneGeometry(A.W*1.2+cz*1.4+cd*1.2,cd,1,1);cg.rotateX(-Math.PI/2);
    const cm=new THREE.ShaderMaterial({uniforms:{uLight:CRW.u.uLight,uFogC:CRW.u.uFogC,uBeat:CRW.u.uBeat,uJump:CRW.u.uJump,uTime:G.T,uFogD:CRW.u.uFogD},vertexShader:CARPET_V,fragmentShader:CARPET_F});
    CRW.carpet=new THREE.Mesh(cg,cm);CRW.carpet.position.set(0,0.9,cz+cd/2-1);G.scene.add(CRW.carpet);}
  CRW.pits=[];CRW.pit=0;return CRW.n;}
// reactions to the player's effects and the music
function crowdReact(a){CRW.cheer=Math.min(1,CRW.cheer+a*0.8);CRW.waveZ=-3;CRW.waveA=Math.max(CRW.waveA,Math.min(1,a));}
Bus.on('fx',k=>crowdReact(k==='fireworks'||k==='flames'?1:k==='confetti'||k==='streamers'||k==='sparks'?0.85:0.6));
Bus.on('cmd',(nm,a)=>{if(nm==='strobe'&&a&&a[0])CRW.strobeUp=1;else if(nm==='blind'||(nm==='flash'&&a&&a[0]))crowdReact(0.3);});
Bus.on('mus',k=>{if(k==='drop')crowdReact(1);});
function crowdSpots(){const out=CRW.spots;out.length=0;for(const f of FIX.list){if(!f.dirv||f.up||!(f.type==='beam'||f.type==='spot'||f.type==='wash'))continue;const cu=f.cur;if(!cu||cu.out<0.05)continue;const d=f.dirv;if(d.y>-0.05)continue;
    const t=(f.pos.y-1.6)/-d.y,x=f.pos.x+d.x*t,z=f.pos.z+d.z*t;if(z<CRW.z0-2||z>CRW.z1+4)continue;const sz=cu.size||0.3,rr=f.type==='beam'?0.012+sz*0.06:f.type==='spot'?0.05+sz*0.13:0.12+sz*0.32;
    out.push({x,z,r:clamp(t*rr*1.2+0.5,0.7,9),i:cu.out*(f.type==='wash'?0.35:f.type==='beam'?1:0.7),c:[cu.lr,cu.lg,cu.lb]});}
  out.sort((a,b)=>b.i-a.i);const u=CRW.u;for(let k=0;k<8;k++){const s=out[k];if(s){u.uSp.value[k].set(s.x,s.z,s.r,1);u.uSpC.value[k].setRGB(s.c[0],s.c[1],s.c[2]).multiplyScalar(s.i*0.5);}else u.uSp.value[k].set(0,0,0,0);}}
// per-frame: C={beat, e (engagement 0..1), energy, sec, playing, flash, strobeOn}
function crowdTick(dt,C){if(!CRW.u)return;const u=CRW.u,sec=C.sec||'groove',e=C.e,pl=C.playing?1:0;CRW.boost=Math.max(0,CRW.boost-dt*0.6);
  const hot=sec==='drop'||sec==='peak';const jumpT=(hot?1:sec==='main'||sec==='groove'?0.55:sec==='build'?0.35:0.05)*clamp(e*1.4,0,1)*pl;
  CRW.strobeUp=Math.max(0,CRW.strobeUp-dt*(C.strobeOn?0:1.2));if(C.strobeOn)CRW.strobeUp=1;
  const handsT=clamp((hot?0.75:sec==='build'?0.3:0.12)*e*1.3+CRW.boost+CRW.strobeUp*0.6,0,1);const swayT=sec==='break'||sec==='intro'||sec==='outro'?1:0.4;
  CRW.jump=approach(CRW.jump,jumpT,dt,0.4);CRW.hands=approach(CRW.hands,handsT,dt,0.35);CRW.sway=approach(CRW.sway,swayT,dt,1);
  CRW.phone=approach(CRW.phone,(sec==='break'?clamp(e*1.5,0.35,1):sec==='outro'?0.4:0)*pl,dt,1.2);
  CRW.clap=approach(CRW.clap,sec==='build'&&pl?clamp(e*1.6,0.3,1):0,dt,0.5);CRW.nod=approach(CRW.nod,(sec==='groove'||sec==='main'||sec==='intro'?1:hot?0.5:sec==='break'?0.25:0.6)*pl,dt,0.6);
  CRW.uni=approach(CRW.uni,sec==='drop'?1:sec==='peak'?0.5:0,dt,0.3);CRW.pump=approach(CRW.pump,(hot?0.9:sec==='main'?0.8:sec==='groove'?0.4:0)*pl,dt,0.5);
  CRW.face=approach(CRW.face,hot||sec==='build'?1:sec==='break'||sec==='intro'?0.45:0.75,dt,1.2);
  CRW.cheer=Math.max(0,CRW.cheer-dt*0.7);CRW.waveA=Math.max(0,CRW.waveA-dt*0.45);CRW.waveZ+=dt*24;
  // circle pits on heavy drops
  if(sec!==CRW.lastSec){CRW.lastSec=sec;if(hot){const g=TR&&TR.g?TR.g.id:'';CRW.heavy=HEAVY_G.includes(g);const k=CRW.n>1800?2:1;CRW.pits=[];for(let i=0;i<k;i++)CRW.pits.push({x:rnd(-CRW.hw0*0.8,CRW.hw0*0.8),z:CRW.z0+rnd(6,Math.min(16,(CRW.z1-CRW.z0)*0.6)),r:rnd(3.2,4.6)});}}
  const pitT=hot&&CRW.heavy&&pl&&e>0.35&&!ST.reduceMotion?1:0;CRW.pit=approach(CRW.pit,pitT,dt,0.8);CRW.pitA+=dt*1.3*CRW.pit;
  for(let k=0;k<2;k++){const p=CRW.pits[k];if(p&&CRW.pit>0.01)u.uPit.value[k].set(p.x,p.z,p.r,CRW.pit);else u.uPit.value[k].set(0,0,0,0);}
  u.uBeat.value=C.beat;u.uMot.value=ST.reduceMotion?0.3:1;u.uJump.value=CRW.jump;u.uHands.value=CRW.hands;u.uSway.value=CRW.sway;u.uClap.value=CRW.clap;u.uNod.value=CRW.nod;u.uUni.value=CRW.uni;u.uPump.value=CRW.pump;
  u.uPhone.value=CRW.phone;u.uFace.value=CRW.face;u.uCheer.value=CRW.cheer;u.uWaveZ.value=CRW.waveZ;u.uWaveA.value=CRW.waveA;u.uPitA.value=CRW.pitA;
  u.uFogD.value=G.scene.fog?G.scene.fog.density:0.01;if(G.scene.fog)u.uFogC.value.copy(G.scene.fog.color);
  const s=FIX.stats;const mixc=(r,a)=>{const w=r[3]||0;return a.setRGB(r[0],r[1],r[2]).multiplyScalar(w>0?Math.min(1.2,w*0.5)/w*1.2:0);};
  mixc(s.C,u.uLight.value);mixc(s.L,u.uL.value);mixc(s.R,u.uR.value);u.uLight.value.add(_c.setRGB(0.15,0.09,0.03).multiplyScalar(FXS.pyroL*1.5));
  u.uRim.value.copy(u.uLight.value).multiplyScalar(0.3).add(_c.setRGB(0.04,0.04,0.07));u.uRim.value.add(_c.setRGB(1,0.55,0.2).multiplyScalar(FXS.pyroL*0.35));
  u.uFlash.value=Math.min(1,(C.flash||0)*0.8+(s.strobe>0&&C.strobeOn?0.3:0));u.uAmb.value=0.06+G.env.amb*0.1;crowdSpots();
  // adaptive LOD: trim the near tier from the back when quality drops; those rows are drawn as impostors instead
  const k=Math.round(CRW.nNearPeople*clamp((G.quality-0.45)/0.55,0.35,1));const nd=k>=CRW.nNearPeople?CRW.nNear:Math.min(CRW.nNear,Math.round(k*CRW.nNear/Math.max(1,CRW.nNearPeople)));
  CRW.nDraw=nd;CRW.mesh.geometry.instanceCount=nd;CRW.far.geometry.instanceCount=CRW.nFar+(CRW.nNearPeople-Math.min(CRW.nNearPeople,k));
  const sc=G.H*G.dpr*0.35;[[CRW.phones,0.55*pl+0.15],[CRW.phones2,CRW.phone]].forEach(([p,a])=>{if(p){p.material.uniforms.uA.value=a;p.material.uniforms.uScale.value=sc;}});}
