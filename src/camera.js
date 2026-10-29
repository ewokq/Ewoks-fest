// Cameras: 5 preset angles (Front, Crowd POV, DJ booth, Wide, Side) cycled by the 🎥 button or V, with a smooth move between them. Tap on the 3D view selects fixtures when the console is open.
const CAM_MODES=[['foh','Front'],['crowd','Crowd POV'],['dj','DJ booth'],['wide','Wide'],['side','Side']];
const CAM_OLD={stage:'wide',faces:'crowd',free:'foh'}; // v2.3 angles saved in shows / replays
const CAM={mode:'foh',shake:0,pos:new THREE.Vector3(0,7,44),look:new THREE.Vector3(0,5,0),blend:1,zoom:1,ptrs:new Map(),down:null,t:0};
const _cp=new THREE.Vector3(),_cl=new THREE.Vector3();
// v2.3.1: the camera is a simple angle changer: one small 🎥 button cycles 5 preset angles with a smooth move; the last angle is saved.
function camSet(m,instant,save){m=CAM_OLD[m]||m;if(!CAM_MODES.find(x=>x[0]===m))m='foh';CAM.mode=m;CAM.blend=instant?1:0;CAM.zoom=1;camLabel();
  if(save&&typeof SAVE==='object'&&SAVE&&SAVE.cam!==m){SAVE.cam=m;typeof dirty==='function'&&dirty();}Bus.emit('cam',m);}
function camName(m){const x=CAM_MODES.find(v=>v[0]===m);return x?x[1]:'';}
function camLabel(){const l=$('camLbl'),b=$('bCam');if(l)l.textContent=camName(CAM.mode);if(b)b.setAttribute('aria-label','Camera angle: '+camName(CAM.mode)+'. Tap for next angle');}
function camNext(){const i=CAM_MODES.findIndex(v=>v[0]===CAM.mode);const m=CAM_MODES[(i+1)%CAM_MODES.length][0];camSet(m,false,true);}
function camTarget(dt,o){const A=G.anch;if(!A)return;const t=CAM.t,portrait=G.H>G.W;let p=_cp,l=_cl;
  switch(CAM.mode){
   case 'foh':p.set(Math.sin(t*0.07)*1.2,6.2,A.fohZ-2.5);l.set(0,A.ledY*0.62,0);if(portrait)p.z=Math.min(A.fohZ-2.5,A.fohZ*0.82);break;
   case 'wide':p.set(Math.sin(t*0.04)*A.W*0.35,24+Math.sin(t*0.07)*1.5,34);l.set(0,2.5,2);if(portrait){p.y+=6;p.z+=10;}break;
   case 'side':p.set(A.W*0.62+9,5.2+Math.sin(t*0.08)*0.4,9+Math.sin(t*0.06)*2);l.set(-2,A.ledY*0.5,2);if(portrait)p.x+=6;break;
   case 'crowd':{const bob=CRW.jump*Math.max(0,Math.sin((o.beat%1)*Math.PI))*0.18*(ST.reduceMotion?0.2:1);p.set(Math.sin(t*0.11)*3,1.85+bob,G.crowdZ0+9);l.set(0,A.ledY*0.75,0);break;}
   case 'dj':p.set(0.6,A.DH+2.5,A.booth.z-4.2);l.set(0,4,30);break;
  }}
function camTick(dt,o){CAM.t+=dt;camTarget(dt,o);CAM.blend=Math.min(1,CAM.blend+dt/0.9);const e=CAM.blend*CAM.blend*(3-2*CAM.blend),k=CAM.blend>=1?1:Math.max(1-Math.exp(-dt*4),e*0.35);
  CAM.pos.lerp(_cp,k);CAM.look.lerp(_cl,k);G.cam.position.copy(CAM.pos);
  CAM.shake=Math.max(0,CAM.shake-dt*1.8);if(CAM.shake>0&&!ST.reduceShake){const s=CAM.shake*0.12;G.cam.position.x+=(Math.random()-0.5)*s;G.cam.position.y+=(Math.random()-0.5)*s;}
  G.cam.lookAt(CAM.look);const bf=G.W<G.H?72:55;const f=bf/CAM.zoom;if(Math.abs(G.cam.fov-f)>0.01){G.cam.fov=f;G.cam.updateProjectionMatrix();}}
Bus.on('fx',(k)=>{if(k==='fireworks')CAM.shake=Math.min(1,CAM.shake+0.25);else if(k==='flames'||k==='co2')CAM.shake=Math.min(1,CAM.shake+0.12);});
function camInput(){const cv=$('c');
  // taps on the 3D view still pick fixtures when the console is open; no drag / pinch / wheel camera any more
  cv.addEventListener('pointerdown',e=>{CAM.ptrs.set(e.pointerId,1);if(CAM.ptrs.size===1)CAM.down={x:e.clientX,y:e.clientY,t:performance.now()};else CAM.down=null;});
  const up=e=>{const d=CAM.down;CAM.ptrs.delete(e.pointerId);if(d&&e.type==='pointerup'&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<=8&&performance.now()-d.t<400)camTap(e.clientX,e.clientY);if(!CAM.ptrs.size)CAM.down=null;};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);camLabel();}
function camTap(x,y){if(!SES||$('panel').classList.contains('hidden'))return;const f=pickFixture(x/G.W*2-1,-(y/G.H)*2+1);if(!f)return;
  const ids=SEL.ids.includes(f.id)?SEL.ids.filter(i=>i!==f.id):SEL.ids.concat(f.id);CMD.run('sel',[ids,'pick']);toast((SEL.ids.includes(f.id)?'Selected ':'Deselected ')+f.id,900);uiClick&&uiClick();}
