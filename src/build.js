// FESTIVAL CONTROL v2 build: one self-contained index.html = three.min.js (r160) + postprocessing + game modules
const fs=require('fs'),path=require('path');
const T='/tmp/t3/node_modules/three';
let three=fs.readFileSync(T+'/build/three.min.js','utf8');
three=three.replace(/console\.warn\('Scripts "build\/three\.js"[^']*'\),/,'void 0,');
const files=['shaders/CopyShader.js','shaders/LuminosityHighPassShader.js','shaders/OutputShader.js','postprocessing/Pass.js','postprocessing/ShaderPass.js','postprocessing/MaskPass.js','postprocessing/EffectComposer.js','postprocessing/RenderPass.js','postprocessing/UnrealBloomPass.js','postprocessing/OutputPass.js'];
const names=new Set();let body='';
for(const f of files){let s=fs.readFileSync(T+'/examples/jsm/'+f,'utf8');
  s=s.replace(/import\s*\{([^}]*)\}\s*from\s*'three';/g,(m,g)=>{g.split(',').map(x=>x.trim()).filter(Boolean).forEach(n=>names.add(n));return '';});
  s=s.replace(/import\s*\{[^}]*\}\s*from\s*'[^']*';/g,'');
  s=s.replace(/export\s*\{[^}]*\};?/g,'');
  body+='\n// ---- '+f+'\n'+s;}
const post='/* three.js r160 examples/jsm postprocessing (MIT) */\nwindow.POST=(function(){"use strict";const {'+[...names].join(',')+'}=THREE;\n'+body+'\nreturn {EffectComposer,RenderPass,UnrealBloomPass,OutputPass};})();';
const MODS=['core','data','audio','yt','scene','fixtures','led','sfx','crowd','dj','show','score','camera','console','ui','simple','mp','fun','duel','main'];
const RM=JSON.parse(fs.readFileSync(path.join(__dirname,'..','music','tracks.json'),'utf8')).map(t=>({id:t.id,g:t.g,genre:t.genre,title:t.title,artist:t.artist,file:t.file,page:t.page,lic:t.lic,lic_url:t.lic_url,samples:t.samples,bpm:t.bpm,off:t.off,dur:t.dur,bars:t.bars,secs:t.secs.map(x=>[x[0],x[1],x[2],x[3]]),drops:t.drops,short:t.short,dj:t.dj}));
const game='(function(){"use strict";\nconst REAL_META='+JSON.stringify(RM)+';\n'+MODS.map(m=>'// ===================== '+m+'.js =====================\n'+fs.readFileSync(path.join(__dirname,m+'.js'),'utf8')).join('\n')+'\n})();';
fs.writeFileSync(path.join(__dirname,'..','game.bundle.js'),game);
let html=fs.readFileSync(path.join(__dirname,'template.html'),'utf8');
for(const [k,v] of [['THREE',three],['POST',post],['GAME',game]]){ if(/<\/script/i.test(v)) throw new Error(k+' contains </script'); html=html.replace('/*__'+k+'__*/',()=>v);}
fs.writeFileSync(path.join(__dirname,'..','index.html'),html);
console.log('built',html.length,'bytes');
