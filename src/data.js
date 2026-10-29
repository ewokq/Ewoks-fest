// Data: genres/tracks (procedural), DJs, palettes, LED styles, environments, venues, equipment, shop, challenges, FX macros
const SEC_NAMES=[['INTRO','intro'],['GROOVE','groove'],['BUILD-UP','build'],['DROP','drop'],['MAIN GROOVE','main'],['BREAKDOWN','break'],['BUILD-UP 2','build'],['MAIN DROP','drop'],['PEAK','peak'],['OUTRO','outro']];
const SEC_ENERGY={intro:0.22,groove:0.45,build:0.6,drop:1,main:0.7,break:0.18,peak:0.95,outro:0.3};
const chord=(r,q)=>{const iv=q==='m'?[0,3,7]:q==='M'?[0,4,7]:q==='s'?[0,5,7]:[0,3,7,10];let n=r+24;while(n<53)n+=12;while(n>64)n-=12;return {r,n:iv.map(x=>n+x)};};
const PRG=(...a)=>a.map(([r,q])=>chord(r,q));
// style: kick (std|big|hard|rumble|soft), drums (four|half|break|shuffle|soft), bass (offbeat|roll|reese|wobble|house|pulse|growl|sub), lead (pluck|saw|stab|organ|arp|bell|none)
const GENRES=[
 {id:'progressive',name:'Progressive House',bpm:126,arr:[8,16,16,16,8,16,16,16,8,8],prog:PRG([33,'m'],[29,'M'],[36,'M'],[31,'M']),st:{kick:'std',drums:'four',bass:'offbeat',lead:'pluck',pad:1},pal:'main',look:'Wide beam fans, soft colour chases, big drop lift'},
 {id:'bigroom',name:'Big Room',bpm:128,arr:[8,8,8,16,8,8,8,16,8,8],prog:PRG([33,'m'],[29,'M'],[36,'M'],[31,'M']),st:{kick:'big',drums:'four',bass:'offbeat',lead:'pluck',pad:.7},pal:'main',look:'Huge strobes, flames on every drop, white flashes'},
 {id:'mainstage',name:'Mainstage EDM',bpm:128,arr:[8,16,8,16,8,16,8,16,8,8],prog:PRG([33,'m'],[29,'M'],[31,'M'],[28,'m']),st:{kick:'big',drums:'four',bass:'house',lead:'saw',pad:.9},pal:'main',look:'Full rig, lasers, confetti finale'},
 {id:'techhouse',name:'Tech House',bpm:125,arr:[16,16,8,16,16,8,8,16,8,8],prog:PRG([33,'m'],[33,'m'],[31,'M'],[33,'m']),st:{kick:'std',drums:'shuffle',bass:'pulse',lead:'stab',pad:.4},pal:'sunset',look:'Groovy chases, pixel rhythm, low strobes'},
 {id:'melodic',name:'Melodic Techno',bpm:122,arr:[16,16,8,16,8,16,8,16,16,8],prog:PRG([33,'m'],[29,'M'],[31,'M'],[28,'m']),st:{kick:'std',drums:'four',bass:'roll',lead:'bell',pad:1.2},pal:'deep',look:'Atmospheric haze, slow sweeps, cinematic LED'},
 {id:'peaktechno',name:'Peak Techno',bpm:132,arr:[16,16,8,16,16,8,8,16,16,8],prog:PRG([33,'m'],[33,'m'],[33,'m'],[31,'M']),st:{kick:'rumble',drums:'four',bass:'pulse',lead:'arp',pad:.5},pal:'mono',look:'Hypnotic white beams, heavy strobe, monochrome'},
 {id:'trance',name:'Trance',bpm:138,arr:[8,16,16,16,8,16,16,16,8,8],prog:PRG([33,'m'],[29,'M'],[31,'M'],[28,'m']),st:{kick:'std',drums:'four',bass:'roll',lead:'arp',pad:1.3},pal:'ice',look:'Laser tunnels, long breakdowns, euphoric lifts'},
 {id:'dnb',name:'Drum & Bass',bpm:174,arr:[16,16,16,24,16,16,16,24,16,8],prog:PRG([31,'m'],[31,'m'],[34,'M'],[29,'M']),st:{kick:'std',drums:'break',bass:'reese',lead:'pluck',pad:.6},pal:'acid',look:'Fast chases, double-time strobes'},
 {id:'dubstep',name:'Dubstep',bpm:140,arr:[8,16,8,16,8,8,8,16,8,8],prog:PRG([29,'m'],[29,'m'],[32,'M'],[27,'M']),st:{kick:'big',drums:'half',bass:'wobble',lead:'none',pad:.6},pal:'inferno',look:'Half-time hits, red/green, heavy pyro'},
 {id:'basshouse',name:'Bass House',bpm:126,arr:[8,16,8,16,8,8,8,16,8,8],prog:PRG([33,'m'],[33,'m'],[36,'M'],[31,'M']),st:{kick:'std',drums:'four',bass:'growl',lead:'organ',pad:.4},pal:'cyber',look:'Punchy blinders, neon colours'},
 {id:'futurerave',name:'Future Rave',bpm:130,arr:[8,16,8,16,8,16,8,16,8,8],prog:PRG([33,'m'],[31,'M'],[29,'M'],[28,'m']),st:{kick:'hard',drums:'four',bass:'offbeat',lead:'saw',pad:1},pal:'cyber',look:'Dark beams, aggressive lasers, glitch LED'},
 {id:'atmospheric',name:'Atmospheric / Cinematic',bpm:100,arr:[8,8,8,8,8,8,8,8,8,8],prog:PRG([33,'m'],[29,'M'],[24,'M'],[31,'M']),st:{kick:'soft',drums:'soft',bass:'sub',lead:'bell',pad:1.6},pal:'deep',look:'Fog, slow fades, gentle sweeps'}];
const GMAP={};GENRES.forEach(g=>GMAP[g.id]=g);
const DJS=[{id:'novak',name:'NOVA-K',col:'#ff2bd6',energy:1},{id:'lumen',name:'Lumen Drift',col:'#20e3ff',energy:0.7},{id:'kito',name:'KITO',col:'#ffb300',energy:0.85},{id:'mira',name:'MIRA SOL',col:'#9b5bff',energy:0.6},{id:'vanta',name:'VANTA',col:'#ffffff',energy:0.9},{id:'atlas',name:'Atlas Wave',col:'#3dff8e',energy:0.8}];
const DJMAP={};DJS.forEach(d=>DJMAP[d.id]=d);
// tracks: all procedural, fictional titles/artists
const TRACKS=[
 {id:'progressive',g:'progressive',title:'Skyline Promise',dj:'lumen'},{id:'bigroom',g:'bigroom',title:'Gravity Party',dj:'novak'},{id:'mainstage',g:'mainstage',title:'Ignite the Sky',dj:'atlas'},
 {id:'techhouse',g:'techhouse',title:'Groove Mechanics',dj:'kito'},{id:'melodic',g:'melodic',title:'Deep Signal',dj:'mira'},{id:'peaktechno',g:'peaktechno',title:'Iron Pulse',dj:'vanta'},
 {id:'trance',g:'trance',title:'Aurora Run',dj:'lumen'},{id:'dnb',g:'dnb',title:'Velocity',dj:'kito'},{id:'dubstep',g:'dubstep',title:'Fault Line',dj:'vanta'},
 {id:'basshouse',g:'basshouse',title:'Wobble District',dj:'novak'},{id:'futurerave',g:'futurerave',title:'Neon Rapture',dj:'atlas'},{id:'atmospheric',g:'atmospheric',title:'Glass Horizon',dj:'mira'},
 {id:'tutorial',g:'bigroom',title:'First Light (tutorial)',dj:'novak',arr:[4,4,4,8,4,4,4,8,4,4],bpm:124}];
const TMAP={};TRACKS.forEach(t=>TMAP[t.id]=t);
const STARTER_TRACKS=['progressive','bigroom','techhouse','melodic','tutorial'];
// colour palettes (spec 8)
const PALETTES=[
 {id:'main',name:'Mainstage Energy',c:['#2a6bff','#ff2bd6','#8a3bff','#ffffff']},
 {id:'inferno',name:'Inferno',c:['#ff2010','#ff6a00','#ffb000','#ffe2b0']},
 {id:'cyber',name:'Cyberpunk Neon',c:['#00f0ff','#ff1fa8','#9a2bff','#2040ff']},
 {id:'deep',name:'Deep Atmosphere',c:['#0a2a9f','#008c8c','#3a1a9f','#5aa0ff']},
 {id:'sunset',name:'Sunset Festival',c:['#ff7a1a','#ff4fa0','#8a3bd0','#ffd29a']},
 {id:'ice',name:'Ice Laser',c:['#a8d8ff','#ffffff','#3ae0ff','#6a8cff']},
 {id:'mono',name:'Monochrome Techno',c:['#ffffff','#dfe8ff','#fff2dd','#9aa6c0']},
 {id:'acid',name:'Acid Rave',c:['#9dff00','#ffee00','#20ff60','#d0ff40']}];
const PALMAP={};PALETTES.forEach(p=>PALMAP[p.id]=p);
const LED_STYLES=[
 ['geo','Geometric animation'],['gradient','Colour gradients'],['particles','Particle visuals'],['waves','Abstract waves'],['eq','Equalizer visuals'],['rotate','Rotating shapes'],['tunnel','Tunnel effects'],['fractal','Fractal-style'],
 ['liquid','Liquid colours'],['grid','Grid patterns'],['glitch','Glitch effects'],['mono','Minimal monochrome'],['landscape','Futuristic landscape'],['rhythm','Rhythmic flashes'],['cinematic','Cinematic visuals'],['text','DJ name / logo']];
const LED_STARTER=['geo','gradient','waves','eq','mono','rhythm','text'];
const LED_PACK_A=['particles','rotate','tunnel','fractal'], LED_PACK_B=['liquid','grid','glitch','landscape','cinematic'];
const LED_TRANS=[['cut','Cut'],['fadeblack','Fade to black'],['cross','Crossfade'],['wipe','Wipe'],['wash','Colour wash'],['glitch','Glitch'],['geo','Geometric'],['cine','Cinematic (slow)']];
// environments (spec 4)
const ENVS=[
 {id:'night',name:'Night Festival',outdoor:true,sky:['#01020a','#1a0f33'],fog:'#0a0b1c',fogD:0.0105,ground:'#14161d',amb:0.55,haze:0.35,props:'festival',day:0},
 {id:'desert',name:'Desert Festival',outdoor:true,sky:['#0a0618','#4a1f2a'],fog:'#221423',fogD:0.008,ground:'#3a2a20',amb:0.6,haze:0.25,props:'desert',day:0},
 {id:'coastal',name:'Coastal Festival',outdoor:true,sky:['#010312','#10264a'],fog:'#0a1428',fogD:0.009,ground:'#2a2a2c',amb:0.6,haze:0.3,props:'coast',day:0},
 {id:'arena',name:'Indoor Arena',outdoor:false,sky:['#040408','#0a0a14'],fog:'#08080f',fogD:0.014,ground:'#18181e',amb:0.4,haze:0.55,props:'arena',day:0},
 {id:'warehouse',name:'Underground Warehouse',outdoor:false,sky:['#050403','#0c0806'],fog:'#0b0806',fogD:0.022,ground:'#1a1714',amb:0.3,haze:0.75,props:'warehouse',day:0},
 {id:'cyber',name:'Cyberpunk Festival',outdoor:true,sky:['#05010f','#2a0640'],fog:'#14062a',fogD:0.012,ground:'#0a0a16',amb:0.5,haze:0.45,props:'cyber',day:0},
 {id:'sunset',name:'Sunset to Night',outdoor:true,sky:['#3a6ab0','#ffb070'],fog:'#a07070',fogD:0.006,ground:'#2a3420',amb:1,haze:0.25,props:'festival',day:1},
 {id:'rain',name:'Rainy Festival',outdoor:true,sky:['#05070c','#1a2230'],fog:'#141a24',fogD:0.016,ground:'#101318',amb:0.5,haze:0.4,props:'festival',day:0,rain:true}];
const ENVMAP={};ENVS.forEach(e=>ENVMAP[e.id]=e);
// rig = max fixture counts; S = stage scale
const RIG_TYPES=['beam','spot','wash','strobe','blinder','pixel','laser'];
const FX_TYPES=['flames','co2','confetti','streamers','sparks','fireworks'];
const VENUES=[
 {id:'vault',name:'The Vault',kind:'Underground club',env:'warehouse',S:0.55,crowd:250,req:50,reward:300,rig:{beam:6,spot:0,wash:6,strobe:2,blinder:2,pixel:2,laser:1},fx:{flames:2,co2:2,confetti:1,streamers:0,sparks:2,fireworks:0},
  missions:[{id:'sync',txt:'Timing score 60+',k:'timing',v:60},{id:'drop',txt:'Hit the first drop (accent within 1 beat)',k:'dropHit',v:1}]},
 {id:'neon',name:'Neon Room',kind:'Local venue',env:'arena',S:0.65,crowd:600,req:55,reward:400,rig:{beam:8,spot:2,wash:6,strobe:4,blinder:2,pixel:2,laser:2},fx:{flames:4,co2:2,confetti:2,streamers:0,sparks:4,fireworks:0},
  missions:[{id:'var',txt:'Use 3+ different looks (presets/cues)',k:'looks',v:3},{id:'break',txt:'Keep the breakdown calm (intensity < 45%)',k:'calmBreak',v:1}]},
 {id:'hall',name:'Grand Hall',kind:'Concert hall',env:'arena',S:0.8,crowd:1200,req:60,reward:550,rig:{beam:10,spot:4,wash:8,strobe:4,blinder:4,pixel:4,laser:2},fx:{flames:4,co2:4,confetti:2,streamers:2,sparks:4,fireworks:0},
  missions:[{id:'led',txt:'Change the LED style 3+ times',k:'ledChanges',v:3},{id:'eng',txt:'Crowd engagement 60%+ on average',k:'engAvg',v:60}]},
 {id:'river',name:'Riverside Fest',kind:'Regional festival',env:'night',S:0.9,crowd:2000,req:62,reward:700,rig:{beam:12,spot:4,wash:8,strobe:6,blinder:4,pixel:4,laser:3},fx:{flames:6,co2:4,confetti:2,streamers:2,sparks:6,fireworks:1},
  missions:[{id:'co2',txt:'Fire CO2 on a drop',k:'co2Drop',v:1},{id:'dyn',txt:'Dynamic range score 60+',k:'dynamics',v:60}]},
 {id:'horizon',name:'Horizon Mainstage',kind:'Large outdoor mainstage',env:'desert',S:1,crowd:3000,req:65,reward:900,rig:{beam:14,spot:6,wash:10,strobe:8,blinder:6,pixel:6,laser:4},fx:{flames:8,co2:6,confetti:4,streamers:2,sparks:8,fireworks:1},
  missions:[{id:'moment',txt:'Create a memorable drop moment (dark before, big hit on the drop)',k:'moments',v:1},{id:'creat',txt:'Creativity score 65+',k:'creativity',v:65}]},
 {id:'pulse',name:'Global Pulse',kind:'International EDM festival',env:'coastal',S:1.15,crowd:3600,req:68,reward:1200,rig:{beam:16,spot:6,wash:12,strobe:8,blinder:6,pixel:6,laser:5},fx:{flames:8,co2:6,confetti:4,streamers:4,sparks:8,fireworks:1},
  missions:[{id:'fin',txt:'Finale: confetti + fireworks in the last phrase',k:'finale',v:1},{id:'tech',txt:'Technical execution 70+',k:'technical',v:70}]},
 {id:'nexus',name:'NEXUS 2099',kind:'Futuristic mega-festival',env:'cyber',S:1.3,crowd:4200,req:72,reward:2000,rig:{beam:18,spot:8,wash:12,strobe:10,blinder:8,pixel:8,laser:6},fx:{flames:10,co2:8,confetti:4,streamers:4,sparks:10,fireworks:1},
  missions:[{id:'all',txt:'Overall score 75+',k:'overall',v:75},{id:'eng2',txt:'Crowd never below 40% after the first drop',k:'holdCrowd',v:1}]}];
// career equipment: starter rig + purchasable upgrades (non-essential extras; sandbox always has everything)
const STARTER_RIG={beam:4,spot:0,wash:4,strobe:2,blinder:0,pixel:0,laser:0}, STARTER_FX={flames:0,co2:2,confetti:0,streamers:0,sparks:0,fireworks:0};
const SHOP=[
 {id:'eq_beams',cat:'Equipment',name:'Beam pack (+4 moving beams)',price:250,rig:{beam:4}},
 {id:'eq_beams2',cat:'Equipment',name:'Beam pack II (+6 beams)',price:600,rig:{beam:6},needs:'eq_beams'},
 {id:'eq_beams3',cat:'Equipment',name:'Beam pack III (+6 beams)',price:1100,rig:{beam:6},needs:'eq_beams2'},
 {id:'eq_wash',cat:'Equipment',name:'Wash pack (+4 LED washes)',price:200,rig:{wash:4}},
 {id:'eq_wash2',cat:'Equipment',name:'Wash pack II (+4 washes)',price:500,rig:{wash:4},needs:'eq_wash'},
 {id:'eq_spots',cat:'Equipment',name:'Gobo spots (4 moving spots)',price:400,rig:{spot:4}},
 {id:'eq_spots2',cat:'Equipment',name:'Gobo spots II (+4)',price:900,rig:{spot:4},needs:'eq_spots'},
 {id:'eq_strobe',cat:'Equipment',name:'Strobe pack (+4 strobes)',price:300,rig:{strobe:4}},
 {id:'eq_strobe2',cat:'Equipment',name:'Strobe pack II (+4)',price:700,rig:{strobe:4},needs:'eq_strobe'},
 {id:'eq_blind',cat:'Equipment',name:'Audience blinders (4)',price:350,rig:{blinder:4}},
 {id:'eq_blind2',cat:'Equipment',name:'Blinders II (+4)',price:800,rig:{blinder:4},needs:'eq_blind'},
 {id:'eq_pixel',cat:'Equipment',name:'Pixel strips (4)',price:450,rig:{pixel:4}},
 {id:'eq_pixel2',cat:'Equipment',name:'Pixel strips II (+4)',price:900,rig:{pixel:4},needs:'eq_pixel'},
 {id:'eq_laser',cat:'Equipment',name:'Laser projectors (2)',price:600,rig:{laser:2}},
 {id:'eq_laser2',cat:'Equipment',name:'Laser projectors II (+2)',price:1200,rig:{laser:2},needs:'eq_laser'},
 {id:'eq_laser3',cat:'Equipment',name:'Laser projectors III (+2)',price:2000,rig:{laser:2},needs:'eq_laser2'},
 {id:'fx_flames',cat:'Pyro & SFX',name:'Flame jets (4)',price:400,fx:{flames:4}},
 {id:'fx_flames2',cat:'Pyro & SFX',name:'Flame jets II (+6)',price:1000,fx:{flames:6},needs:'fx_flames'},
 {id:'fx_co2',cat:'Pyro & SFX',name:'CO2 jets II (+6)',price:400,fx:{co2:6}},
 {id:'fx_conf',cat:'Pyro & SFX',name:'Confetti cannons (2)',price:350,fx:{confetti:2}},
 {id:'fx_conf2',cat:'Pyro & SFX',name:'Confetti cannons II (+2)',price:700,fx:{confetti:2},needs:'fx_conf'},
 {id:'fx_stream',cat:'Pyro & SFX',name:'Streamer cannons (4)',price:450,fx:{streamers:4}},
 {id:'fx_sparks',cat:'Pyro & SFX',name:'Spark fountains (6)',price:500,fx:{sparks:6}},
 {id:'fx_sparks2',cat:'Pyro & SFX',name:'Spark fountains II (+4)',price:900,fx:{sparks:4},needs:'fx_sparks'},
 {id:'fx_fw',cat:'Pyro & SFX',name:'Fireworks package (outdoor)',price:1200,fx:{fireworks:1}},
 {id:'led_a',cat:'LED content',name:'LED pack: Particles, Rotate, Tunnel, Fractal',price:400,led:LED_PACK_A},
 {id:'led_b',cat:'LED content',name:'LED pack: Liquid, Grid, Glitch, Landscape, Cinematic',price:700,led:LED_PACK_B},
 {id:'trk_mainstage',cat:'Music',name:'Track: "Ignite the Sky" (Mainstage EDM)',price:250,track:'mainstage'},
 {id:'trk_peaktechno',cat:'Music',name:'Track: "Iron Pulse" (Peak Techno)',price:250,track:'peaktechno'},
 {id:'trk_trance',cat:'Music',name:'Track: "Aurora Run" (Trance)',price:300,track:'trance'},
 {id:'trk_dnb',cat:'Music',name:'Track: "Velocity" (Drum & Bass)',price:300,track:'dnb'},
 {id:'trk_dubstep',cat:'Music',name:'Track: "Fault Line" (Dubstep)',price:300,track:'dubstep'},
 {id:'trk_basshouse',cat:'Music',name:'Track: "Wobble District" (Bass House)',price:300,track:'basshouse'},
 {id:'trk_futurerave',cat:'Music',name:'Track: "Neon Rapture" (Future Rave)',price:350,track:'futurerave'},
 {id:'trk_atmospheric',cat:'Music',name:'Track: "Glass Horizon" (Cinematic)',price:350,track:'atmospheric'},
 {id:'dj_moves',cat:'DJ',name:'DJ moves pack (jumps, heart hands, spins)',price:300,dj:true},
 {id:'skin_amber',cat:'Console skins',name:'Console skin: Amber',price:150,skin:'amber'},
 {id:'skin_ice',cat:'Console skins',name:'Console skin: Ice',price:150,skin:'ice'},
 {id:'skin_acid',cat:'Console skins',name:'Console skin: Acid',price:150,skin:'acid'}];
const SHOPMAP={};SHOP.forEach(s=>SHOPMAP[s.id]=s);
const STYLES=[['minimal','Minimal',0.45],['atmospheric','Atmospheric',0.6],['groovy','Groovy',0.75],['energetic','Energetic',0.9],['aggressive','Aggressive',1],['cinematic','Cinematic',0.8],['spectacular','Spectacular',1]];
const CROWD_SIZES=[['club','Small club',300],['medium','Medium venue',1200],['arena','Large arena',2500],['massive','Massive festival',4200]];
// challenges (mode C): each judged by the analysis metrics
const CHALLENGES=[
 {id:'grid',name:'Lock to the Grid',desc:'Every accent on the beat. Timing 75+.',track:'bigroom',env:'night',venue:4,checks:[['timing',75]]},
 {id:'drop',name:'Make the Drop',desc:'Go dark before the drop, then hit it with light and pyro.',track:'mainstage',env:'night',venue:4,checks:[['moments',1],['dropHit',1]]},
 {id:'calm',name:'Coherent Breakdown',desc:'Calm, coherent breakdown (low intensity, no pyro). Composition 65+.',track:'trance',env:'coastal',venue:5,checks:[['calmBreak',1],['composition',65]]},
 {id:'less',name:'Less is More',desc:'Tiny rig: 2 beams, 2 washes, LED only. Crowd 55%+.',track:'techhouse',env:'warehouse',venue:1,rig:{beam:2,spot:0,wash:2,strobe:0,blinder:0,pixel:0,laser:0},fx:{flames:0,co2:0,confetti:0,streamers:0,sparks:0,fireworks:0},checks:[['engAvg',55]]},
 {id:'hold',name:'Hold the Crowd',desc:'Crowd never drops below 40% after the first drop.',track:'dnb',env:'rain',venue:4,checks:[['holdCrowd',1]]},
 {id:'hypno',name:'Warehouse Hypnosis',desc:'Peak techno: haze 60%+, no confetti, composition 65+.',track:'peaktechno',env:'warehouse',venue:2,checks:[['haze',1],['noConfetti',1],['composition',65]]},
 {id:'finale',name:'Grand Finale',desc:'Confetti + fireworks in the last phrase, peak intensity at the end.',track:'futurerave',env:'cyber',venue:6,checks:[['finale',1],['overall',60]]}];
// coordinated special-effect sequences (spec 9H); steps: [beatOffset, action, arg]
const MACROS=[
 {id:'drophit',name:'Drop Hit',steps:[[0,'flash',1],[0,'fx','flames',{pat:'all'}],[0,'fx','co2',{}],[0,'blind','hit']]},
 {id:'wave',name:'Flame Wave',steps:[[0,'fx','flames',{pat:'lr',seq:'wave'}],[2,'fx','flames',{pat:'rl',seq:'wave'}]]},
 {id:'predrop',name:'Pre-drop Blackout',steps:[[0,'blackout',1],[3.5,'blackout',0],[4,'flash',1],[4,'fx','co2',{}]]},
 {id:'triple',name:'Triple Flame',steps:[[0,'fx','flames',{pat:'out'}],[1,'fx','flames',{pat:'in'}],[2,'fx','flames',{pat:'all'}]]},
 {id:'sparkle',name:'Spark Curtain',steps:[[0,'fx','sparks',{kind:'waterfall'}],[0,'fx','co2',{}]]},
 {id:'finale',name:'Grand Finale',steps:[[0,'fx','fireworks',{seq:'finale'}],[0,'fx','confetti',{seq:'rolling'}],[0,'fx','flames',{pat:'all'}],[1,'fx','sparks',{}],[2,'fx','streamers',{}],[4,'fx','flames',{pat:'alt'}]]}];
const PRESET_NAMES=[['blue','Blue atmosphere'],['white','Full white'],['redfan','Red beam fan'],['purple','Purple breakdown'],['cyantunnel','Cyan laser tunnel'],['maindrop','Main drop'],['blackout','Blackout'],['finale','Finale']];
