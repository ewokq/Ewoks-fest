// DJ: stylised figure in the booth; nods to the beat, works the decks, fist-pumps on builds, hands up on drops (+ moves pack: jumps, heart hands, spins)
const DJ={g:null,parts:{},t:0,move:'',moveT:0,col:'#ff2bd6'};
function buildDJ(dj,A){if(DJ.g){G.stage.remove(DJ.g);disposeTree(DJ.g);}const g=new THREE.Group();DJ.col=dj.col;
  const skin=new THREE.MeshStandardMaterial({color:0xc98a64,roughness:0.7}),shirt=new THREE.MeshStandardMaterial({color:new THREE.Color(dj.col).multiplyScalar(0.55),roughness:0.6,emissive:new THREE.Color(dj.col),emissiveIntensity:0.08}),dark=new THREE.MeshStandardMaterial({color:0x111116,roughness:0.8});
  const mk=(geo,m,x,y,z,par)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);(par||g).add(o);return o;};
  const P_=DJ.parts;P_.hip=new THREE.Group();g.add(P_.hip);P_.hip.position.y=0.95;
  mk(new THREE.BoxGeometry(0.22,0.95,0.22),dark,-0.14,0.47,0);mk(new THREE.BoxGeometry(0.22,0.95,0.22),dark,0.14,0.47,0);
  P_.torso=mk(new THREE.BoxGeometry(0.56,0.7,0.3),shirt,0,0.35,0,P_.hip);P_.head=new THREE.Group();P_.head.position.set(0,0.82,0);P_.hip.add(P_.head);
  mk(new THREE.SphereGeometry(0.17,14,10),skin,0,0.12,0,P_.head);const hp=mk(new THREE.TorusGeometry(0.18,0.035,6,16,Math.PI),dark,0,0.16,0,P_.head);hp.rotation.z=0;
  mk(new THREE.BoxGeometry(0.07,0.12,0.12),dark,-0.19,0.1,0,P_.head);mk(new THREE.BoxGeometry(0.07,0.12,0.12),dark,0.19,0.1,0,P_.head);
  const arm=s=>{const sh=new THREE.Group();sh.position.set(s*0.34,0.64,0);P_.hip.add(sh);const up=mk(new THREE.BoxGeometry(0.13,0.36,0.13),shirt,0,-0.18,0,sh);const el=new THREE.Group();el.position.set(0,-0.36,0);sh.add(el);
    mk(new THREE.BoxGeometry(0.11,0.34,0.11),skin,0,-0.17,0,el);return {sh,el};};P_.L=arm(-1);P_.R=arm(1);
  g.position.set(A.booth.x,A.booth.y,A.booth.z-1.0);G.stage.add(g);DJ.g=g;ledSetText(dj.name);}
// C={beat (float beats), sec, playing, drop (recent drop time), moves (owned pack), dt}
function djTick(dt,C){if(!DJ.g)return;const P_=DJ.parts,b=C.beat,ph=b-Math.floor(b),sec=C.sec,on=C.playing,en=(C.energy||0.5)*(C.dj?C.dj.energy:1);DJ.t+=dt;
  const nod=on?Math.pow(Math.sin(ph*Math.PI),2):0;P_.head.rotation.x=nod*0.35*(0.5+en);P_.hip.position.y=0.95-nod*0.05*(0.5+en);
  let ls=-0.9,le=-0.9,rs=-0.9,re=-0.9,lz=0,rz=0,jump=0,spin=0;// arms reaching to decks: shoulder pitch (x rot) and elbow
  const hype=sec==='drop'||sec==='peak';
  if(on&&C.moves&&DJ.moveT<=0&&Math.random()<dt*(hype?0.12:sec==='break'?0.06:0.01)){DJ.move=hype?pick(['jump','spin','jump']):sec==='break'?'heart':'';DJ.moveT=DJ.move==='spin'?1.2:DJ.move==='heart'?3:2;}
  DJ.moveT-=dt;const mv=DJ.moveT>0?DJ.move:'';
  if(!on){ls=rs=-0.15;le=re=-0.1;}
  else if(mv==='heart'){ls=rs=-2.9;le=re=-1.1;lz=-0.3;rz=0.3;}
  else if(hype&&(Math.floor(b/8)%2===0||mv==='jump')){ls=rs=-2.8+Math.sin(b*Math.PI)*0.15;le=re=-0.15;lz=-0.25;rz=0.25;if(mv==='jump')jump=Math.max(0,Math.sin(ph*Math.PI))*0.25;}
  else if(sec==='build'){rs=-2.6+(ph<0.5?0.5:0);re=-0.4;ls=-0.9;le=-1.0+Math.sin(DJ.t*3)*0.1;}
  else{ls=-0.9+Math.sin(DJ.t*1.3)*0.08;le=-0.95;rs=-0.85+Math.sin(DJ.t*1.7+1)*0.1;re=-1.0;}
  if(mv==='spin')spin=(1-DJ.moveT/1.2)*Math.PI*2;
  const k=1-Math.exp(-dt*12);const S=(o,ax,v)=>{o.rotation[ax]+=(v-o.rotation[ax])*k;};
  S(P_.L.sh,'x',ls);S(P_.L.el,'x',le);S(P_.R.sh,'x',rs);S(P_.R.el,'x',re);S(P_.L.sh,'z',lz);S(P_.R.sh,'z',rz);
  DJ.g.position.y=G.anch.booth.y+jump;DJ.g.rotation.y=spin;}
