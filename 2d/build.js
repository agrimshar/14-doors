// Inlines 2d/src into a single self-contained 2d/index.html
const fs=require('fs'),p=require('path');
const s=f=>fs.readFileSync(p.join(__dirname,'src',f),'utf8');
const js=['shaders.js','data.js','audio.js','game.js'].map(s).join('\n');
const html=s('index.html').replace('/*CSS*/',()=>s('style.css')).replace('/*JS*/',()=>js);
fs.writeFileSync(p.join(__dirname,'index.html'),html);
console.log('built 2d/index.html',html.length,'bytes');
