// Inlines 3d/src (plus the shared shaders, data, audio and base styles from 2d/src) into the root index.html
const fs=require('fs'),p=require('path');
const d=f=>fs.readFileSync(p.join(__dirname,'..','2d','src',f),'utf8'), h=f=>fs.readFileSync(p.join(__dirname,'src',f),'utf8');
const js=[d('shaders.js'),d('data.js'),h('house.js'),d('audio.js'),h('post.js'),'const VO='+fs.readFileSync(p.join(__dirname,'audio','voice','manifest.json'),'utf8')+';',h('sound.js'),h('props.js'),h('game3d.js')].join('\n');
const html=h('index.html').replace('/*CSS*/',()=>d('style.css')+'\n'+h('house.css')).replace('/*JS*/',()=>js);
fs.writeFileSync(p.join(__dirname,'..','index.html'),html);
console.log('built index.html',html.length,'bytes');
