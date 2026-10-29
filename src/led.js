// LED walls: one procedural shader (16 content styles, 8 transition types), shared uniforms across the main wall, wings, header, deck strip and DJ booth
const LEDU={uTime:{value:0},uBeat:{value:0},uKick:{value:0},uE:{value:0.5},uBri:{value:1},uA:{value:0},uB:{value:0},uMix:{value:1},uTr:{value:0},uSpd:{value:1},uQ:{value:1},
  c0:{value:C3('#2a6bff')},c1:{value:C3('#ff2bd6')},c2:{value:C3('#8a3bff')},c3:{value:C3('#ffffff')},uEq:{value:new Float32Array(16)},uTex:{value:null},uFlash:{value:0},uSym:{value:0}};
const LED_IDX={};LED_STYLES.forEach((s,i)=>LED_IDX[s[0]]=i);
const LED_TIDX={};LED_TRANS.forEach((s,i)=>LED_TIDX[s[0]]=i);
let LEDMATS=[];
function resetLedMats(){LEDMATS.forEach(m=>m.dispose());LEDMATS=[];}
const LED_FRAG=`
uniform float uTime,uBeat,uKick,uE,uBri,uA,uB,uMix,uTr,uSpd,uQ,uAsp,uSlot,uFlash,uSym;uniform vec3 c0,c1,c2,c3;uniform float uEq[16];uniform sampler2D uTex;varying vec2 vUv;
float h1(float n){return fract(sin(n)*43758.5453);} float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
vec3 pal(float t){t=fract(t)*4.;vec3 a=t<1.?mix(c0,c1,t):t<2.?mix(c1,c2,t-1.):t<3.?mix(c2,c3,t-2.):mix(c3,c0,t-3.);return a;}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
vec3 style(float id,vec2 uv){float T=uTime;vec2 p=(uv-.5)*vec2(uAsp,1.);float k=uKick;vec3 col=vec3(0);
 if(id<.5){vec2 q=rot(T*.2)*p*3.;vec2 g=abs(fract(q)-.5);float l=smoothstep(.06,.0,abs(max(g.x,g.y)-.35+.1*k));float d=smoothstep(.04,.0,abs(g.x+g.y-.5));col=pal(T*.05+floor(q.x)*.1)*(l+d*.6)*(.6+k);}
 else if(id<1.5){col=pal(uv.x*.6+uv.y*.2+T*.08)*(.55+.45*sin(uv.y*3.+T))+k*.25*c3;}
 else if(id<2.5){vec2 q=p*vec2(12.,8.);q.y-=T*2.;vec2 i=floor(q),f=fract(q)-.5;float r=h2(i);vec2 o=vec2(h2(i+3.)-.5,h2(i+7.)-.5)*.5;float d=length(f-o);col=pal(r+T*.03)*smoothstep(.12+.15*k,0.,d)*step(.4,r)*2.;}
 else if(id<3.5){float w=0.;for(int i=0;i<4;i++){float fi=float(i);float y=.5+.18*sin(uv.x*(3.+fi*1.7)*uAsp+T*(1.+fi*.4)+fi)*(1.+k*.6)-fi*.12+.18;w+=smoothstep(.03,0.,abs(uv.y-y))*1.2;col+=pal(fi*.25+T*.03)*smoothstep(.03,0.,abs(uv.y-y));}col+=pal(T*.02)*.12*uv.y;}
 else if(id<4.5){float bx=floor(uv.x*16.);float v=0.;for(int i=0;i<16;i++){if(abs(float(i)-bx)<.5)v=uEq[i];}float cell=fract(uv.y*20.);float on=step(uv.y,v)*step(.15,cell)*step(.08,fract(uv.x*16.))*step(fract(uv.x*16.),.92);col=pal(uv.y*.7+.1)*on*1.4+pal(.5)*step(abs(uv.y-v),.02)*1.5;}
 else if(id<5.5){float r=0.;vec2 q=p;for(int i=0;i<5;i++){float fi=float(i);q=rot(T*.3*(mod(fi,2.)*2.-1.))*q;vec2 a=abs(q);float s=max(a.x,a.y);r+=smoothstep(.02,0.,abs(s-(.12+fi*.1)*(1.+k*.3)));}col=pal(T*.05+length(p))*r;}
 else if(id<6.5){float r=length(p)+.001,a=atan(p.y,p.x);float z=.3/r+T*1.5;float ring=smoothstep(.2,0.,abs(fract(z)-.5)-.2);float sp=step(.5,fract(a/6.2832*12.+z*.2));col=pal(floor(z)*.13)*ring*(.4+.6*sp)*min(1.,r*4.)*(1.+k);}
 else if(id<7.5){vec2 q=p*1.5;float m=0.;int N=uQ>.5?6:3;for(int i=0;i<6;i++){if(i>=N)break;q=abs(q)/dot(q,q)-vec2(.9+.1*sin(T*.2),.6);m+=exp(-abs(q.x*q.y)*4.);}col=pal(m*.1+T*.05)*m*.35*(1.+k*.5);}
 else if(id<8.5){vec2 q=p*2.;q+=vec2(vn(q+T*.3),vn(q-T*.25))*1.5;float n=vn(q*1.5+T*.2);col=pal(n+T*.04)*(.4+n)*(1.+k*.3);}
 else if(id<9.5){vec2 q=p;q.y=-q.y+.1;float hz=.12;if(q.y>-hz+.001&&uv.y<.55){float z=1./(q.y+hz+.05);vec2 g=vec2(q.x*z,z+T*2.);vec2 f=abs(fract(g)-.5);float l=smoothstep(.06*z*.15+.02,0.,min(f.x,f.y));col=pal(.0)*l*1.2*(1.-uv.y*1.5)+pal(.3)*k*.2;}else{col=mix(c2*.3,c1*.15,uv.y);}}
 else if(id<10.5){vec2 b=floor(uv*vec2(8.,14.));float r=h2(b+floor(T*8.));float s=step(.75-k*.3,r);vec2 off=vec2(h1(b.y+floor(T*12.))-.5,0.)*.1*s;col=pal(r+T*.1)*s*1.3;col.r+=s*.3*step(.5,fract((uv.x+off.x)*40.));}
 else if(id<11.5){float l=smoothstep(.006,0.,abs(fract(uv.x*4.+T*.05)-.5)-.0)+smoothstep(.004,0.,abs(uv.y-.5-sin(T*.5)*.3));col=vec3(1.)*l*.9+vec3(1.)*k*.12;}
 else if(id<12.5){vec2 q=p;float sun=smoothstep(.26,.25,length(q-vec2(0.,.12)))*step(.0,q.y-.12+.25);float stripes=step(.3,fract((q.y-.12)*18.-T*.3))+step(.12,q.y);col=mix(c1,c0,uv.y)*.25+mix(c3,c1,1.-uv.y*1.5)*sun*stripes;
   float mtn=.42+.08*sin(q.x*6.+1.)+.05*sin(q.x*13.)+.03*vn(vec2(q.x*20.,1.));if(uv.y<mtn){col=c2*.08;float z=1./(mtn-uv.y+.05);vec2 g=fract(vec2(q.x*z*.5,z+T));col+=c0*smoothstep(.06,0.,min(abs(g.x-.5),abs(g.y-.5)))*.8;}}
 else if(id<13.5){vec2 b=floor(uv*vec2(4.,3.));float r=h2(b+floor(uBeat*0.+T*0.)+floor(uTime*.0));float bt=pow(1.-fract(uBeat),3.);float sel=step(.5,h2(b+floor(uBeat)));col=pal(h2(b)+floor(uBeat)*.25)*bt*sel*1.6+c3*k*.15;}
 else if(id<14.5){float a=atan(p.y-.6,p.x);float rays=pow(.5+.5*sin(a*14.+T*.3),6.)*smoothstep(1.4,.0,length(p-vec2(0.,.6)));float n=vn(p*3.+vec2(T*.1,0.));col=mix(c0*.15,c1*.5,n)*.6+c3*rays*.5;}
 else{vec2 tu=vec2(uv.x,uv.y);vec4 t=texture2D(uTex,tu);float g=t.a;col=pal(uv.x*.5+T*.05)*(.1+.08*sin(uv.y*40.+T*4.))+mix(c3,pal(T*.1),.4)*g*(1.2+k*.8);}
 return col;}
void main(){vec2 uv=vUv;if(uSlot>2.5){uv=(floor(uv*vec2(48.,4.))+.5)/vec2(48.,4.);}
 if(uSym>.5&&uSlot<0.5)uv.x=abs(uv.x-.5)+.5;
 vec3 A=style(uA,uv),B=style(uB,uv),c;float m=clamp(uMix,0.,1.);
 if(uTr<.5)c=m>.5?B:A;else if(uTr<1.5)c=m<.5?A*(1.-2.*m):B*(2.*m-1.);else if(uTr<2.5)c=mix(A,B,m);else if(uTr<3.5)c=mix(A,B,smoothstep(m-.05,m+.05,1.-uv.x+0.*m))*(1.-step(1.,0.));
 else if(uTr<4.5){vec3 w=c1*1.2;c=m<.5?mix(A,w,m*2.):mix(w,B,m*2.-1.);}else if(uTr<5.5){float r=h2(vec2(floor(uv.y*24.),floor(uTime*25.)));c=r<m?B:A;if(abs(r-m)<.08)c=c3;}
 else if(uTr<6.5){c=length((uv-.5)*vec2(uAsp,1.))<m*1.2*uAsp*.6?B:A;}else c=mix(A,B,smoothstep(0.,1.,m))*(1.-.5*sin(m*3.1416));
 if(uTr>2.5&&uTr<3.5)c=uv.x<m?B:A;
 c*=uBri;c+=c3*uFlash;
 // slight LED pixel structure on the big surfaces
 if(uSlot<2.5&&uQ>.5){vec2 px=fract(vUv*vec2(uAsp,1.)*90.);c*=.82+.18*step(.12,px.x)*step(.12,px.y);}
 gl_FragColor=vec4(c,1.);}`;
const LED_VERT='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
const SLOT_ID={main:0,wingL:1,wingR:2,header:2,strip:3,booth:4};
function ledMaterial(slot,asp){const u=Object.assign({},LEDU,{uAsp:{value:asp},uSlot:{value:SLOT_ID[slot]||0}});
  const m=new THREE.ShaderMaterial({uniforms:u,vertexShader:LED_VERT,fragmentShader:LED_FRAG,fog:false,toneMapped:false});LEDMATS.push(m);return m;}
let ledTextName='';
function ledSetText(name){if(name===ledTextName&&LEDU.uTex.value)return;ledTextName=name;const c=document.createElement('canvas');c.width=1024;c.height=256;const x=c.getContext('2d');
  x.clearRect(0,0,1024,256);x.font='900 150px -apple-system,Segoe UI,Helvetica,Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#fff';x.shadowColor='#fff';x.shadowBlur=24;
  let s=150;while(x.measureText(name).width>960&&s>40){s-=10;x.font='900 '+s+'px -apple-system,Segoe UI,Helvetica,Arial,sans-serif';}x.fillText(name,512,128);
  if(LEDU.uTex.value)LEDU.uTex.value.dispose();const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;LEDU.uTex.value=t;}
// state is owned by show.js (SHOW.led); this ticks the uniforms
const LEDRT={cur:'geo',prev:'geo',t:1,dur:0.5,tr:'cross',tm:0};
function ledSwitch(style,tr,dur){if(!(style in LED_IDX))return;if(style===LEDRT.cur&&LEDRT.t>=1)return;LEDRT.prev=LEDRT.t<0.5?LEDRT.prev:LEDRT.cur;LEDRT.cur=style;LEDRT.tr=tr||'cross';LEDRT.dur=tr==='cut'?0.001:Math.max(0.05,dur||0.6);LEDRT.t=0;}
function ledTick(dt,L,palCols,beat,kick,energy,bl){LEDRT.t=Math.min(1,LEDRT.t+dt/LEDRT.dur);
  LEDRT.tm+=dt*(0.15+L.spd*2)*(ST.reduceMotion?0.5:1);
  const u=LEDU;u.uTime.value=LEDRT.tm;u.uBeat.value=beat;u.uKick.value=L.react*kick;u.uE.value=energy;u.uA.value=LED_IDX[LEDRT.prev];u.uB.value=LED_IDX[LEDRT.cur];u.uMix.value=LEDRT.t;u.uTr.value=LED_TIDX[LEDRT.tr]||0;
  u.uQ.value=ST.ledQ>=1?1:0;u.uSym.value=L.sym?1:0;
  let bri=L.bri*(bl?0:1);if(L.style==='rhythm'&&ST.reduceFlash)bri*=0.6;u.uBri.value=approach(u.uBri.value,bri,dt,0.06);u.uFlash.value=L.flash?(SHOW.flash||0):0;
  const cs=L.cm==='mono'?['#ffffff','#c8d0e0','#8090a0',L.mono||'#ffffff']:palCols;[u.c0,u.c1,u.c2,u.c3].forEach((c,i)=>c.value.set(cs[i%cs.length]));
  if(L.cm==='mono'){const m=C3(L.mono||'#ffffff');u.c0.value.copy(m);u.c1.value.copy(m).multiplyScalar(0.6);u.c2.value.copy(m).multiplyScalar(0.3);u.c3.value.copy(m);}
  const eq=u.uEq.value,fb=(TR&&!TR.yt&&A.fbin&&SEQ.playing)?A.fbin:(AB.fbin&&AB.an?AB.fbin:null);
  for(let i=0;i<16;i++){let v;if(fb){const a=Math.floor(Math.pow(i/16,1.8)*fb.length*0.6)+1;v=fb[a]/255;}else v=clamp(energy*(0.5+0.5*Math.sin(LEDRT.tm*3+i*0.9))*(0.6+kick*0.5),0,1);eq[i]=approach(eq[i],v*0.95,dt,0.05);}}
// average LED colour (for stage/crowd light and intensity metric)
function ledLevel(){const u=LEDU;const k=u.uBri.value,base=LEDRT.cur==='mono'||LEDRT.cur==='rhythm'?0.35:0.55;return k*base+u.uFlash.value;}
