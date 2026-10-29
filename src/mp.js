// Multiplayer: challenge links (seeded, checksummed), head-to-head results, local leaderboards, pass-the-phone party mode
const MP={party:null,pending:null,lastLink:''};
const MP_SALT='fc-ewoks-fest-v1';
const DIFFS=[['easy','Easy · assisted rig · 2 min'],['normal','Normal · manual · 2 min'],['pro','Pro · manual · full song']];
const DIFFN={easy:'Easy',normal:'Normal',pro:'Pro'};
function diffCfg(d){return d==='easy'?{auto:'assisted',short:true}:d==='pro'?{auto:'manual',short:false}:{auto:'manual',short:true};}
function cfgDiff(c){return c.diff||(c.auto==='assisted'?'easy':c.short===false?'pro':'normal');}
function fnv32(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return h>>>0;}
function mpSum(b){return (fnv32(MP_SALT+b).toString(36)+fnv32(b+'|'+MP_SALT).toString(36).slice(0,3));}
const b64e=s=>btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const b64d=s=>decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/'))));
function cleanName(n){return String(n==null?'':n).replace(/[\u0000-\u001f\u007f<>"'`&\\]/g,'').replace(/\s+/g,' ').trim().slice(0,16);}
const fmtPts=n=>(n|0).toLocaleString('en-US');
function showPoints(R){const cs=Object.values(R.cats||{}).reduce((a,b)=>a+(+b||0),0);return Math.max(0,Math.min(99999,Math.round((R.overall||0)*100+cs*10+((R.metrics&&R.metrics.dropHit)||0)*500+Math.min(R.accents||0,300)*5+Math.min(10000,(R.hype||0)/20))));}
function chalEncode(o){const p={v:1,ve:o.venue|0,t:o.track,sd:o.seed>>>0,d:o.diff,n:cleanName(o.name),s:o.score|0,c:(o.chain||[]).slice(-5).map(([n,s])=>[cleanName(n),s|0])};if(o.x)p.x=packX(o.x);if(o.duel)p.k='duel';const b=b64e(JSON.stringify(p));return b+'.'+mpSum(b);}
function chalDecode(str){try{str=String(str||'').trim();const i=str.lastIndexOf('.');if(i<1)return null;const b=str.slice(0,i),sum=str.slice(i+1);if(!/^[A-Za-z0-9_-]+$/.test(b)||sum!==mpSum(b))return null;
  const p=JSON.parse(b64d(b));if(!p||p.v!==1||!Number.isInteger(p.ve)||!VENUES[p.ve]||typeof p.t!=='string'||!TMAP[p.t]||p.t==='tutorial'||!DIFFN[p.d]||!Number.isInteger(p.s)||p.s<0||p.s>99999||!Number.isInteger(p.sd)||!Array.isArray(p.c))return null;
  const n=cleanName(p.n);if(!n)return null;const chain=p.c.filter(x=>Array.isArray(x)&&x.length===2&&Number.isInteger(x[1])&&x[1]>=0&&x[1]<=99999).slice(-5).map(([a,s])=>[cleanName(a)||'?',s]);
  return {venue:p.ve,track:p.t,seed:p.sd>>>0,diff:p.d,name:n,score:p.s,chain,x:unpackX(p.x),duel:p.k==='duel'};}catch(e){return null;}}
// v2.3: optional per-show stats on links (async Duel head-to-head). Old links simply have none.
const XK=['st','bc','pf','gr','dr','rq','hy'];
function packX(x){return XK.map(k=>Math.max(0,Math.min(9999999,(x&&x[k])|0)));}
function unpackX(a){if(!Array.isArray(a)||a.length!==XK.length||!a.every(v=>Number.isInteger(v)&&v>=0&&v<=9999999))return null;const o={};XK.forEach((k,i)=>o[k]=a[i]);o.st=Math.max(1,Math.min(5,o.st));return o;}
const baseUrl=()=>location.href.replace(/[?#].*$/,'');
function chalUrl(o){return baseUrl()+'#c='+chalEncode(o);}
// ---- name (asked once, editable in Settings) ----
function mpName(){return cleanName(SAVE.mp&&SAVE.mp.name);}
function askName(then,why){scr(`<h2>What's your DJ name?</h2><p class="muted">${esc(why||'Shown on challenge links and leaderboards. You can change it later in Settings → Gameplay.')}</p>
  <div class="opts"><label>Name <input id="mpName" maxlength="16" autocomplete="nickname" enterkeyhint="done" value="${esc(mpName())}" placeholder="e.g. DJ Ewok" style="font-size:1.1rem;padding:.6rem;min-height:44px;width:100%"></label></div>
  <p id="mpNameErr" class="muted" style="color:var(--bad,#ff6b6b)"></p><div class="row" style="margin-top:.6rem">${backBtn()}<button class="sel big" data-u="mpNameOk">Save ▶</button></div>`);
  MP.afterName=then;const i=$('mpName');if(i){i.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();UA_.mpNameOk();}});setTimeout(()=>{try{i.focus();}catch(e){}},50);}}
UA_.mpNameOk=()=>{const i=$('mpName'),n=cleanName(i&&i.value);if(!n){const e=$('mpNameErr');if(e)e.textContent='Type a name (1–16 letters).';return;}SAVE.mp.name=n;dirty();persist(false);const f=MP.afterName;MP.afterName=null;if(f)f();else menuScreen();};
function needName(then,why){if(mpName())then();else askName(then,why);}
UA_.mpEditName=()=>askName(()=>{toast('Name saved: '+mpName());settingsScreen();});
// ---- leaderboards (local, top 10 per track@venue and overall) ----
function lbKey(t,v){return t+'@'+v;}
function lbAdd(key,e){const L=SAVE.mp.lb[key]=(SAVE.mp.lb[key]||[]).filter(x=>Array.isArray(x));L.push(e);L.sort((a,b)=>b[1]-a[1]||a[3]-b[3]);L.length=Math.min(L.length,10);return L.indexOf(e);}
function lbRecord(name,pts,cfg){const e=[cleanName(name)||'You',pts|0,cfgDiff(cfg),Date.now(),cfg.track,cfg.venue|0],e2=e.slice();const r1=lbAdd(lbKey(cfg.track,cfg.venue|0),e),r2=lbAdd('all',e2);dirty();persist(false);return {rank:r1,overall:r2,ents:[e,e2]};}
function lbTable(L,hi){if(!L||!L.length)return '<p class="muted">No scores yet: play a scored show.</p>';
  return `<table class="lbt">${L.map((e,i)=>`<tr${i===hi?' class="me"':''}><td>${['🥇','🥈','🥉'][i]||i+1}</td><td>${esc(e[0])}</td><td class="r">${fmtPts(e[1])}</td><td class="muted">${DIFFN[e[2]]||''}${e[4]&&TMAP[e[4]]?' · '+esc(TMAP[e[4]].title):''}</td></tr>`).join('')}</table>`;}
function lbScreen(key){const keys=Object.keys(SAVE.mp.lb).filter(k=>k!=='all'&&SAVE.mp.lb[k].length);key=key&&SAVE.mp.lb[key]?key:'all';
  const nm=k=>{if(k==='all')return 'Overall (all tracks)';const [t,v]=k.split('@');return (TMAP[t]?TMAP[t].title:t)+' @ '+(VENUES[+v]?VENUES[+v].name:v);};
  scr(`<h2>🏅 Leaderboards</h2><p class="muted">Top 10 on this device. Challenge friends with a link to compare across phones.</p>
  <div class="opts"><label>Board <select id="lbSel">${opt([['all',nm('all')]].concat(keys.map(k=>[k,nm(k)])),key)}</select></label></div>
  ${lbTable(SAVE.mp.lb[key])}<div class="row" style="margin-top:.8rem">${backBtn('mp')}</div>`);
  const s=$('lbSel');if(s)s.onchange=()=>lbScreen(s.value);}
UA_.lb=v=>lbScreen(v);
// ---- multiplayer hub ----
function mpScreen(){scr(`<h2>👥 Multiplayer</h2><p class="muted">See who gets the most points.</p>
  <div class="menuBig menuGrid">
   <button data-u="party"><i>🎉</i><b>Party mode</b><span>2–8 players, pass the phone</span></button>
   <button data-u="mpChalNew"><i>📣</i><b>Challenge a friend</b><span>Play, then send your score as a link</span></button>
   <button data-u="lb"><i>🏅</i><b>Leaderboards</b><span>Top 10 per track and overall</span></button>
   <button data-u="mpEditName2"><i>🪪</i><b>Your name</b><span>${esc(mpName()||'not set')}</span></button>
  </div><div class="row" style="margin-top:.8rem">${backBtn()}</div>`);}
UA_.mp=()=>mpScreen();UA_.mpEditName2=()=>askName(()=>mpScreen());
UA_.mpChalNew=()=>needName(()=>{const t=pick(REAL_TRACKS),v=VENUES[4];preloadTrack(t.id);startMp({venue:4,track:t.id,seed:0,diff:'normal'},{kind:'solo'});});
// ---- start a multiplayer-aware show ----
function startMp(c,mp){const V=VENUES[c.venue]||VENUES[4],d=diffCfg(c.diff);SAVE.lastTrack=c.track;dirty();
  warnThen(()=>startSession({mode:'show',venue:c.venue,env:V.env,track:c.track,dj:null,style:'energetic',crowdSize:null,crowdN:Math.min(V.crowd,4000),auto:d.auto,short:d.short,scored:true,rig:V.rig,fx:V.fx,seed:c.seed||0,diff:c.diff,mp}));}
// ---- receiving a challenge link ----
function chalScreen(c){const T=TMAP[c.track],V=VENUES[c.venue];preloadTrack(c.track);
  scr(`<div class="hero"><h1 style="margin:.2rem 0">${c.duel?'⚔️ Duel!':'📣 Challenge!'}</h1><p class="chalBig">Beat ${esc(c.name)}'s <b>${fmtPts(c.score)}</b></p>
  <p class="muted">${esc(T.title)}${T.artist?' – '+esc(T.artist):''} · ${esc(V.name)} · ${DIFFN[c.diff]} · same show seed</p></div>
  ${c.chain.length?'<div class="lbl">Challenge chain</div>'+chainHtml(c.chain.concat([[c.name,c.score]])):''}
  <div class="row" style="margin-top:.8rem"><button data-u="menu">Not now</button><button class="sel big" data-u="chalGo">ACCEPT ▶</button></div>`);MP.pending=c;}
function chainHtml(ch){return `<div class="chain">${ch.map(([n,s],i)=>`<span>${esc(n)} <b>${fmtPts(s)}</b></span>`).join('<i>→</i>')}</div>`;}
UA_.chalGo=()=>{const c=MP.pending;if(!c)return menuScreen();needName(()=>startMp(c,{kind:'vs',vs:{name:c.name,score:c.score,x:c.x,duel:c.duel},chain:c.chain}),'Your name goes on the counter-challenge link.');};
function chalFromHash(){const m=/[#&]c=([^&]+)/.exec(location.hash||'');if(!m)return false;try{history.replaceState(null,'',location.href.replace(/#.*$/,''));}catch(e){}
  const c=chalDecode(decodeURIComponent(m[1]));if(!c){menuScreen();toast('⚠️ That challenge link is broken or was edited, so it can\'t be played.',4000);return true;}
  if(SES)endSession(true);chalScreen(c);return true;}
// ---- results: points, head-to-head, counter-challenge, leaderboard ----
function mpResults(R){const S=SES;if(!S||!S.scored)return {html:'',btns:null};const cfg=S.cfg,mp=cfg.mp||{kind:'solo'};
  if(R._mp)return R._mp;const pts=R.points=showPoints(R);let html=`<div class="ptsRow"><span class="pts">${fmtPts(pts)}</span><span class="muted">show points</span></div>`,btns=null;
  if(mp.kind==='party'){const P=MP.party;if(P&&P.id===mp.pid){const pl=P.players[P.i];pl.score=pts;pl.pct=R.overall;lbRecord(pl.name,pts,cfg);
      const left=P.players.slice(P.i+1);html+=`<div class="h2h"><b>${esc(pl.name)}</b> scored <b>${fmtPts(pts)}</b>${P.i>0?' · leader: '+esc(partyLeader(P).name)+' '+fmtPts(partyLeader(P).score):''}</div>`;
      btns=left.length?`<button class="danger" data-u="partyQuit">Quit party</button><button class="sel big" data-u="partyNext">Pass to ${esc(left[0].name)} ▶</button>`:`<button class="sel big" data-u="podium">🏆 Podium</button>`;}}
  else{const me=mpName()||'You',r=lbRecord(me,pts,cfg);
    if(mp.kind==='vs'){const d=pts-mp.vs.score,win=d>0;html+=`<div class="h2h ${win?'win':d<0?'lose':''}"><div><span>${esc(me)}</span><b>${fmtPts(pts)}</b></div><i>vs</i><div><span>${esc(mp.vs.name)}</span><b>${fmtPts(mp.vs.score)}</b></div></div>
      <p class="h2hMsg">${win?'🏆 You beat '+esc(mp.vs.name)+' by '+fmtPts(d)+'!':d<0?'😤 '+esc(mp.vs.name)+' wins by '+fmtPts(-d)+'. Rematch?':'🤝 Dead heat!'}</p>`+(mp.vs.x&&R.fx?h2hStats(me,R.fx,mp.vs.name,mp.vs.x):'')+chainHtml((mp.chain||[]).concat([[mp.vs.name,mp.vs.score],[me,pts]]));if(win&&mp.vs.duel){SAVE.fun.stats.duels++;SAVE.fun.stats.duelWins++;funAch('duelwin');}else if(mp.vs.duel)SAVE.fun.stats.duels++;}
    if(r.rank>=0&&r.rank<10)html+=`<p class="muted">#${r.rank+1} on this track's leaderboard${r.overall>=0&&r.overall<10?' · #'+(r.overall+1)+' overall':''}</p>`;
    const chain=mp.kind==='vs'?(mp.chain||[]).concat([[mp.vs.name,mp.vs.score]]).slice(-4):[];
    MP.link={venue:cfg.venue|0,track:cfg.track,seed:cfg.seed,diff:cfgDiff(cfg),score:pts,chain,ents:r.ents,x:R.fx||null,duel:!!mp.duel||mp.kind==='vs'&&!!mp.vs.duel};mpLink();
    html+=`<div class="row"><button class="sel" data-u="mpShare">📣 ${mp.kind==='vs'?'Send counter-challenge':mp.duel?'⚔️ Send duel link':'Challenge a friend'}</button><button data-u="lb" data-v="${esc(lbKey(cfg.track,cfg.venue|0))}">🏅 Leaderboard</button></div><div id="shareBox"></div>`;}
  R._mp={html,btns};return R._mp;}
function h2hStats(a,A,b,B){const rows=[['⭐ Stars','st'],['📣 HYPE','hy'],['🔗 Best combo','bc'],['🎯 Perfects','pf'],['🚀 Perfect drops','dr'],['🙋 Requests','rq']];
  return `<table class="h2hT"><tr><th></th><th>${esc(a)}</th><th>${esc(b)}</th></tr>${rows.map(([n,k])=>{const x=A[k]|0,y=B[k]|0;return `<tr><td>${n}</td><td class="${x>y?'w':''}">${k==='st'?starStr(x):fmtPts(x)}</td><td class="${y>x?'w':''}">${k==='st'?starStr(y):fmtPts(y)}</td></tr>`;}).join('')}</table>`;}
function mpLink(){const L=MP.link;if(!L)return '';const me=mpName()||'You';L.ents.forEach(e=>{if(e[0]==='You'&&me!=='You')e[0]=me;});const T=TMAP[L.track];
  MP.lastText=L.duel?`⚔️ ${me} challenges you to a Festival Control duel: ${fmtPts(L.score)} pts on ${T?T.title:'this track'}. Same show, your turn!`:`Beat ${me}'s ${fmtPts(L.score)} on ${T?T.title:'this track'} in Festival Control!`;return MP.lastLink=chalUrl(Object.assign({name:me},L));}
UA_.mpShare=()=>{if(!MP.link)return;if(!mpName()){const keep=UI.lastAn;askName(()=>{dirty();analysisScreen(keep.R,keep.rw);doShare(mpLink());},'Your name goes on the challenge link so your friend knows who to beat.');return;}doShare(mpLink());};
function shareFallback(url,msg){const b=$('shareBox');if(b)b.innerHTML=`<p class="muted">${esc(msg)}</p><input id="shareUrl" readonly value="${esc(url)}" style="width:100%;font-size:.8rem;padding:.5rem;min-height:44px" onclick="this.select()">`;const i=$('shareUrl');if(i){i.focus();i.select();}}
function doShare(url){const txt=MP.lastText||'Beat my score in Festival Control!';
  if(navigator.share){navigator.share({title:'Festival Control challenge',text:txt,url}).then(()=>toast('Challenge sent!')).catch(e=>{if(e&&e.name==='AbortError')return;copyLink(url);});return;}copyLink(url);}
function copyLink(url){const ok=()=>{toast('🔗 Challenge link copied: paste it to a friend',2600);shareFallback(url,'Copied. Here it is too:');};
  try{if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(url).then(ok,()=>legacyCopy(url));else legacyCopy(url);}catch(e){legacyCopy(url);}}
function legacyCopy(url){shareFallback(url,'Copy this link and send it to a friend:');let ok=false;try{ok=document.execCommand('copy');}catch(e){}if(ok)toast('🔗 Challenge link copied',2200);}
// ---- party mode (pass the phone) ----
function partyScreen(){const P=UI.partySetup=UI.partySetup||{n:2,names:['','','','','','','',''],track:'',venue:4,diff:'normal'};
  const trks=[['','🎲 Random real track']].concat(TRACKS.filter(t=>t.id!=='tutorial').map(t=>[t.id,trackLabel(t)]));
  scr(`<h2>🎉 Party mode</h2><p class="muted">Everyone plays the same show (same track, stage and seed) one after another. Highest points wins the podium.</p>
  <div class="opts"><label>Players <select id="pN">${opt([2,3,4,5,6,7,8].map(n=>[n,n+' players']),P.n)}</select></label>
  <div class="pnames">${Array.from({length:P.n},(_,i)=>`<input class="pname" data-i="${i}" maxlength="16" placeholder="Player ${i+1}" value="${esc(P.names[i]||(i===0?mpName():''))}">`).join('')}</div>
  <label>Track <select id="pT">${opt(trks,P.track)}</select></label><label>Stage <select id="pV">${opt(VENUES.map((v,i)=>[i,v.name]),P.venue)}</select></label>
  <label>Difficulty <select id="pD">${opt(DIFFS,P.diff)}</select></label></div>
  <div class="row" style="margin-top:.8rem">${backBtn('mp')}<button class="sel big" data-u="partyGo">START PARTY ▶</button></div>`);
  const sync=()=>{document.querySelectorAll('.pname').forEach(e=>P.names[+e.dataset.i]=e.value);P.track=$('pT').value;P.venue=+$('pV').value;P.diff=$('pD').value;};
  $('pN').onchange=()=>{sync();P.n=+$('pN').value;partyScreen();};['pT','pV','pD'].forEach(k=>$(k).onchange=sync);document.querySelectorAll('.pname').forEach(e=>e.oninput=sync);UI.partySync=sync;}
UA_.party=()=>partyScreen();
UA_.partyGo=()=>{UI.partySync&&UI.partySync();const S=UI.partySetup;const seen={};const players=Array.from({length:S.n},(_,i)=>{let n=cleanName(S.names[i])||'Player '+(i+1);if(seen[n]){n=n.slice(0,13)+' '+(++seen[n]);}else seen[n]=1;return {name:n,score:null,pct:null};});
  const track=S.track&&TMAP[S.track]?S.track:pick(REAL_TRACKS).id;MP.party={id:uid(),players,i:0,venue:S.venue,track,diff:S.diff,seed:(window.Math.random()*4294967296)>>>0};preloadTrack(track);partyTurn();};
function partyLeader(P){return P.players.filter(p=>p.score!=null).sort((a,b)=>b.score-a.score)[0];}
function partyTurn(){const P=MP.party;if(SES)endSession(true);const pl=P.players[P.i],T=TMAP[P.track];
  scr(`<div class="hero pass"><div class="wIcon">📱➡️</div><h1>Pass the phone to</h1><p class="chalBig"><b>${esc(pl.name)}</b></p><p class="muted">Player ${P.i+1} of ${P.players.length} · ${esc(T.title)} · ${esc(VENUES[P.venue].name)} · ${DIFFN[P.diff]}</p>
  ${P.i>0?'<p>To beat: <b>'+esc(partyLeader(P).name)+' '+fmtPts(partyLeader(P).score)+'</b></p>':''}</div>
  <div class="row" style="margin-top:.8rem"><button class="danger" data-u="partyQuit">Quit party</button><button class="sel big" data-u="partyPlay">I'm ${esc(pl.name)}: GO ▶</button></div>`);}
UA_.partyPlay=()=>{const P=MP.party;if(!P)return menuScreen();startMp({venue:P.venue,track:P.track,seed:P.seed,diff:P.diff},{kind:'party',pid:P.id,player:P.i});};
UA_.partyNext=()=>{const P=MP.party;if(!P)return menuScreen();P.i++;partyTurn();};
UA_.partyQuit=()=>{MP.party=null;menuScreen();};
function podiumScreen(){const P=MP.party;if(!P)return menuScreen();if(SES)endSession(true);const R=P.players.map((p,i)=>Object.assign({o:i},p)).sort((a,b)=>(b.score||0)-(a.score||0)||a.o-b.o);
  const top=[R[1],R[0],R[2]];const H=[ '4.2rem','6rem','3rem'],M=['🥈','🥇','🥉'];
  scr(`<h2 style="text-align:center">🏆 Podium</h2><div class="podium">${top.map((p,k)=>p?`<div class="pod p${k}"><div class="pm">${M[k]}</div><div class="pn">${esc(p.name)}</div><div class="ps">${fmtPts(p.score)}</div><div class="pb" style="height:${H[k]}">${k===1?1:k===0?2:3}</div></div>`:'<div class="pod"></div>').join('')}</div>
  <table class="lbt">${R.map((p,i)=>`<tr${i===0?' class="me"':''}><td>${i+1}</td><td>${esc(p.name)}</td><td class="r">${fmtPts(p.score)}</td><td class="muted">${p.pct}%</td></tr>`).join('')}</table>
  <p style="text-align:center">🎉 <b>${esc(R[0].name)}</b> wins${R[1]&&R[1].score===R[0].score?' (tie on points, first to play takes it)':''}!</p>
  <div class="row" style="margin-top:.8rem"><button data-u="partyQuit">Menu</button><button data-u="partyAgain">Same players, new song</button><button class="sel big" data-u="partyRematch">Rematch ▶</button></div>`,'podiumScr');sfx&&sfx('cheer');}
UA_.podium=()=>podiumScreen();
UA_.partyRematch=()=>{const P=MP.party;if(!P)return menuScreen();P.players.forEach(p=>{p.score=null;p.pct=null;});P.i=0;P.id=uid();partyTurn();};
UA_.partyAgain=()=>{const P=MP.party;if(!P)return menuScreen();P.players.forEach(p=>{p.score=null;p.pct=null;});P.i=0;P.id=uid();P.track=pick(REAL_TRACKS.filter(t=>t.id!==P.track)).id;P.seed=(window.Math.random()*4294967296)>>>0;preloadTrack(P.track);partyTurn();};
function mpInit(){if(!SAVE.mp||typeof SAVE.mp!=='object')SAVE.mp={name:'',lb:{}};if(!SAVE.mp.lb||typeof SAVE.mp.lb!=='object'||Array.isArray(SAVE.mp.lb))SAVE.mp.lb={};SAVE.mp.name=cleanName(SAVE.mp.name);
  for(const k of Object.keys(SAVE.mp.lb)){const L=SAVE.mp.lb[k];if(!Array.isArray(L)){delete SAVE.mp.lb[k];continue;}SAVE.mp.lb[k]=L.filter(e=>Array.isArray(e)&&typeof e[0]==='string'&&Number.isFinite(e[1])).map(e=>{e[0]=cleanName(e[0])||'?';return e;}).slice(0,10);}
  Bus.on('session',S=>{const el=$('mpTarget');if(!el)return;const m=S&&S.cfg&&S.cfg.mp;let t='';
    if(m&&m.kind==='vs')t=`🎯 Beat ${esc(m.vs.name)}'s ${fmtPts(m.vs.score)}`;else if(m&&m.kind==='party'&&MP.party){const P=MP.party,L=partyLeader(P);t=`🎉 ${esc(P.players[P.i].name)}'s turn${L?` · to beat: ${esc(L.name)} ${fmtPts(L.score)}`:''}`;}
    el.innerHTML=t;el.classList.toggle('hidden',!t);if(t)toast(t.replace(/<[^>]*>/g,''),2600);});
  addEventListener('hashchange',()=>{if(/[#&]c=/.test(location.hash))chalFromHash();});}
