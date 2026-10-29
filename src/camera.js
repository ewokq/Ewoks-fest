// Cameras: FOH booth, stage overview, in the crowd, DJ booth, free orbit (drag / pinch / wheel / on-screen pad / WASD). Tap on the 3D view selects fixtures when the console is open.
const CAM_MODES=[['foh','FOH booth'],['stage','Stage overview'],['crowd','In the crowd'],['dj','DJ booth'],['free','Free camera']];
const CAM={mode:'foh',shake:0,th:0,ph:0.18,r:46,tgt:new THREE.Vector3(0,5,0),pos:new THREE.Vector3(0,7,44),look:new THREE.Vector3(0,5,0),blend:1,keys:{},zoom:1,ptrs:new Map(),pinch0:0,down:null,t:0};
const _cp=new THREE.Vector3(),_cl=new THREE.Vector3();
function camSet(m,instant){if(!CAM_MODES.find(x=>x[0]===m))m='foh';if(m==='free'&&CAM.mode!=='free'){const A=G.anch,d=_cp.copy(G.cam.position).sub(CAM.tgt.set(0,A?A.ledY*0.6:5,0));CAM.r=clamp(d.length(),6,120);CAM.th=Math.atan2(d.x,d.z);CAM.ph=Math.asin(clamp(d.y/CAM.r,-0.1,1.3));}
  CAM.mode=m;CAM.blend=instant?1:0;CAM.zoom=1;$('freePad').classList.toggle('hidden',m!=='free');Bus.emit('cam',m);}
function camNext(){const i=CAM_MODES.findIndex(x=>x[0]===CAM.mode);camSet(CAM_MODES[(i+1)%CAM_MODES.length][0]);toast('Camera: '+CAM_MODES[(i+1)%CAM_MODES.length][1],1000);}
function camTarget(dt,o){const A=G.anch;if(!A)return;const t=CAM.t,portrait=G.H>G.W;let p=_cp,l=_cl;
  switch(CAM.mode){
   case 'foh':p.set(Math.sin(t*0.07)*1.2,6.2,A.fohZ-2.5);l.set(0,A.ledY*0.62,0);if(portrait)p.z=Math.min(A.fohZ-2.5,A.fohZ*0.82);break;
   case 'stage':p.set(Math.sin(t*0.05)*A.W*0.7,13+Math.sin(t*0.08)*2,24+Math.cos(t*0.05)*4);l.set(0,4.5,6);break;
   case 'crowd':{const bob=CRW.jump*Math.max(0,Math.sin((o.beat%1)*Math.PI))*0.18*(ST.reduceMotion?0.2:1);p.set(Math.sin(t*0.11)*3,1.85+bob,G.crowdZ0+9);l.set(0,A.ledY*0.75,0);break;}
   case 'dj':p.set(0.6,A.DH+2.5,A.booth.z-4.2);l.set(0,4,30);break;
   case 'free':{const k=CAM.keys,sp=dt*1.2*ST.camSens;if(k.l)CAM.th-=sp;if(k.r)CAM.th+=sp;if(k.u)CAM.ph+=sp*0.6;if(k.d)CAM.ph-=sp*0.6;if(k.i)CAM.r*=1-dt*0.9;if(k.o)CAM.r*=1+dt*0.9;
     CAM.ph=clamp(CAM.ph,-0.05,1.35);CAM.r=clamp(CAM.r,5,130);l.copy(CAM.tgt);p.set(Math.sin(CAM.th)*Math.cos(CAM.ph),Math.sin(CAM.ph),Math.cos(CAM.th)*Math.cos(CAM.ph)).multiplyScalar(CAM.r).add(l);p.y=Math.max(0.6,p.y);break;}}}
function camTick(dt,o){CAM.t+=dt;camTarget(dt,o);CAM.blend=Math.min(1,CAM.blend+dt/0.9);const k=CAM.blend>=1||CAM.mode==='free'&&CAM.blend>0.6?1:1-Math.exp(-dt*5);
  CAM.pos.lerp(_cp,k);CAM.look.lerp(_cl,k);G.cam.position.copy(CAM.pos);
  CAM.shake=Math.max(0,CAM.shake-dt*1.8);if(CAM.shake>0&&!ST.reduceShake){const s=CAM.shake*0.12;G.cam.position.x+=(Math.random()-0.5)*s;G.cam.position.y+=(Math.random()-0.5)*s;}
  G.cam.lookAt(CAM.look);const bf=G.W<G.H?72:55;const f=bf/CAM.zoom;if(Math.abs(G.cam.fov-f)>0.01){G.cam.fov=f;G.cam.updateProjectionMatrix();}}
Bus.on('fx',(k)=>{if(k==='fireworks')CAM.shake=Math.min(1,CAM.shake+0.25);else if(k==='flames'||k==='co2')CAM.shake=Math.min(1,CAM.shake+0.12);});
function camInput(){const cv=$('c');
  cv.addEventListener('pointerdown',e=>{cv.setPointerCapture&&cv.setPointerCapture(e.pointerId);CAM.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});if(CAM.ptrs.size===1)CAM.down={x:e.clientX,y:e.clientY,t:performance.now(),moved:0};
    if(CAM.ptrs.size===2){const [a,b]=[...CAM.ptrs.values()];CAM.pinch0=Math.hypot(a.x-b.x,a.y-b.y);CAM.down=null;}});
  cv.addEventListener('pointermove',e=>{const p=CAM.ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;if(CAM.down)CAM.down.moved+=Math.abs(dx)+Math.abs(dy);
    if(CAM.ptrs.size===1&&CAM.down&&CAM.down.moved>8){if(CAM.mode!=='free'){camSet('free',true);}CAM.th-=dx*0.006*ST.camSens;CAM.ph=clamp(CAM.ph+dy*0.004*ST.camSens,-0.05,1.35);}
    else if(CAM.ptrs.size===2){const [a,b]=[...CAM.ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(CAM.pinch0>0){if(CAM.mode!=='free')camSet('free',true);CAM.r=clamp(CAM.r*CAM.pinch0/d,5,130);}CAM.pinch0=d;}});
  const up=e=>{const d=CAM.down;CAM.ptrs.delete(e.pointerId);if(CAM.ptrs.size<2)CAM.pinch0=0;if(d&&d.moved<=8&&performance.now()-d.t<400&&e.type==='pointerup')camTap(e.clientX,e.clientY);if(!CAM.ptrs.size)CAM.down=null;};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{e.preventDefault();if(CAM.mode!=='free')camSet('free',true);CAM.r=clamp(CAM.r*(1+Math.sign(e.deltaY)*0.08),5,130);},{passive:false});
  const fp=$('freePad');const B=[['↺','Orbit left','l'],['▲','Tilt up','u'],['↻','Orbit right','r'],['＋','Zoom in','i'],['▼','Tilt down','d'],['－','Zoom out','o']];
  fp.innerHTML=B.map(b=>`<button data-k="${b[2]}" aria-label="${b[1]}" data-help="Free camera: ${b[1]} (hold). You can also drag to orbit and pinch to zoom.">${b[0]}</button>`).join('')+'<button data-k="reset" aria-label="Reset camera" style="grid-column:span 3;font-size:.75rem">Reset view</button>';
  fp.querySelectorAll('button').forEach(b=>{const k=b.dataset.k;if(k==='reset'){b.onclick=()=>{CAM.th=0;CAM.ph=0.18;CAM.r=46;};return;}
    const on=e=>{e.preventDefault();CAM.keys[k]=true;},off=()=>{CAM.keys[k]=false;};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off);b.addEventListener('pointercancel',off);});
  const km={KeyA:'l',ArrowLeft:'l',KeyD:'r',ArrowRight:'r',KeyW:'u',ArrowUp:'u',KeyS:'d',ArrowDown:'d',Equal:'i',Minus:'o'};
  addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||CAM.mode!=='free')return;const k=km[e.code];if(k){CAM.keys[k]=true;e.preventDefault();}});
  addEventListener('keyup',e=>{const k=km[e.code];if(k)CAM.keys[k]=false;});}
function camTap(x,y){if(!SES||$('panel').classList.contains('hidden'))return;const f=pickFixture(x/G.W*2-1,-(y/G.H)*2+1);if(!f)return;
  const ids=SEL.ids.includes(f.id)?SEL.ids.filter(i=>i!==f.id):SEL.ids.concat(f.id);CMD.run('sel',[ids,'pick']);toast((SEL.ids.includes(f.id)?'Selected ':'Deselected ')+f.id,900);uiClick&&uiClick();}
