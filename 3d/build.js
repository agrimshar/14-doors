// Inlines 3d/src into the root index.html
const fs=require('fs'),p=require('path');
const h=f=>fs.readFileSync(p.join(__dirname,'src',f),'utf8');
const js=[h('shaders.js'),h('data.js'),h('house.js'),h('audio.js'),h('post.js'),'const VO='+fs.readFileSync(p.join(__dirname,'audio','voice','manifest.json'),'utf8')+';',h('sound.js'),h('skill.js'),h('tex.js'),h('props.js'),h('game3d.js')].join('\n');
const build=(()=>{try{return require('child_process').execSync('git rev-parse --short HEAD',{cwd:__dirname,stdio:['ignore','pipe','ignore']}).toString().trim();}catch(e){return 'local';}})()+' · '+new Date().toISOString().slice(0,10);
const html=h('index.html').replace('/*BUILD*/',build).replace('/*CSS*/',()=>h('style.css')+'\n'+h('house.css')).replace('/*JS*/',()=>js);
fs.writeFileSync(p.join(__dirname,'..','index.html'),html);
console.log('built index.html',html.length,'bytes');
