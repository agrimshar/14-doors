/* ---------- procedural surfaces: wall plaster, floors, grass, posters, the city outside ---------- */
const TEX={}, CITY={mats:[],grass:null,glow:[]};
function cTex(w,h,draw,size){
  const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d'); draw(g,w,h);
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=4; t.wsize=size||1; return t;
}
function grain(g,w,h,n,lo,hi,a){ for(let i=0;i<n;i++){ const v=Math.floor(lo+Math.random()*(hi-lo)); g.fillStyle=`rgba(${v},${v},${v},${a})`; g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*3,1+Math.random()*3); } }
function mkTextures(){
  // plaster with a chair rail and a faint panel seam; near-white so the wall colour tints it
  TEX.wall=cTex(256,512,(g,w,h)=>{
    g.fillStyle='#ddd8e8'; g.fillRect(0,0,w,h); grain(g,w,h,5000,90,255,.28); for(let i=0;i<3;i++){ g.fillStyle='rgba(0,0,0,.07)'; g.fillRect(0,0,w,h*.62*Math.random()); }
    g.fillStyle='rgba(0,0,0,.14)'; g.fillRect(0,h*.62,w,6); g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(0,h*.62+6,w,3);
    g.fillStyle='rgba(0,0,0,.10)'; g.fillRect(w-3,0,3,h); g.fillRect(0,h-18,w,18); g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(0,h-20,w,2);
    for(let i=0;i<4;i++){ g.fillStyle='rgba(0,0,0,.05)'; g.fillRect(0,h*.62+30+i*70,w,1); }
  },1.35);
  TEX.wood=cTex(512,512,(g,w,h)=>{
    g.fillStyle='#d8c4ac'; g.fillRect(0,0,w,h);
    for(let r=0;r<6;r++){ const y=r*h/6, off=(r%2)*w/2; for(let k=-1;k<2;k++){ const x=off+k*w, v=190+Math.random()*50; g.fillStyle=`rgb(${v},${v*.9},${v*.78})`; g.fillRect(x+2,y+2,w-4,h/6-4);
      for(let i=0;i<40;i++){ g.strokeStyle=`rgba(90,60,30,${.08+Math.random()*.12})`; g.lineWidth=1; g.beginPath(); const yy=y+Math.random()*h/6; g.moveTo(x,yy); g.bezierCurveTo(x+w*.3,yy+Math.random()*6-3,x+w*.6,yy+Math.random()*6-3,x+w,yy); g.stroke(); } } }
    g.fillStyle='rgba(30,20,10,.5)'; for(let r=0;r<=6;r++) g.fillRect(0,r*h/6-1,w,2);
  },1.6);
  TEX.tile=cTex(512,512,(g,w,h)=>{
    g.fillStyle='#8a8f9a'; g.fillRect(0,0,w,h); const n=4, s=w/n;
    for(let i=0;i<n;i++) for(let j=0;j<n;j++){ const v=205+Math.random()*35; g.fillStyle=`rgb(${v},${v+3},${v+8})`; g.fillRect(i*s+4,j*s+4,s-8,s-8); grain(g,s,s,0,0,0,0); }
    grain(g,w,h,1500,120,255,.12);
  },1.2);
  TEX.concrete=cTex(512,512,(g,w,h)=>{
    g.fillStyle='#bdbac4'; g.fillRect(0,0,w,h); grain(g,w,h,6000,90,230,.16);
    g.strokeStyle='rgba(40,30,50,.35)'; g.lineWidth=1.5; for(let i=0;i<5;i++){ g.beginPath(); let x=Math.random()*w,y=Math.random()*h; g.moveTo(x,y); for(let k=0;k<5;k++){ x+=Math.random()*60-30; y+=Math.random()*60-30; g.lineTo(x,y); } g.stroke(); }
    g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(0,h/2-1,w,2); g.fillRect(w/2-1,0,2,h);
  },2.2);
  TEX.grass=cTex(512,512,(g,w,h)=>{
    g.fillStyle='#2e5a2a'; g.fillRect(0,0,w,h);
    for(let i=0;i<9000;i++){ const gr=70+Math.random()*90, r=20+Math.random()*40; g.strokeStyle=`rgba(${r},${gr},${30+Math.random()*30},.7)`; g.lineWidth=1; const x=Math.random()*w,y=Math.random()*h; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.random()*6-3,y-4-Math.random()*8); g.stroke(); }
    for(let i=0;i<60;i++){ g.fillStyle='rgba(20,30,15,.25)'; g.beginPath(); g.ellipse(Math.random()*w,Math.random()*h,10+Math.random()*30,6+Math.random()*16,Math.random()*3,0,TAU); g.fill(); }
  },1.8);
  TEX.blade=cTex(32,64,(g,w,h)=>{ g.clearRect(0,0,w,h); const gd=g.createLinearGradient(0,h,0,0); gd.addColorStop(0,'#1f4a1e'); gd.addColorStop(1,'#7fcf6a'); g.fillStyle=gd; g.beginPath(); g.moveTo(w*.5-6,h); g.lineTo(w*.5+6,h); g.quadraticCurveTo(w*.5+3,h*.4,w*.5,0); g.quadraticCurveTo(w*.5-3,h*.4,w*.5-6,h); g.fill(); },1);
  TEX.blade.wrapS=TEX.blade.wrapT=THREE.ClampToEdgeWrapping;
  TEX.win=cTex(128,256,(g,w,h)=>{
    g.fillStyle='#07060c'; g.fillRect(0,0,w,h); const cols=['#ffd27a','#7af0ff','#ff7ad9','#fff2d0','#9ab0ff'];
    for(let y=6;y<h-6;y+=14) for(let x=4;x<w-4;x+=12){ if(Math.random()<.42){ g.fillStyle=cols[Math.floor(Math.random()*cols.length)]; g.globalAlpha=.35+Math.random()*.65; g.fillRect(x,y,7,9); } }
    g.globalAlpha=1;
  },1);
}
function texFit(name,u,v){ const s=TEX[name], t=s.clone(); t.needsUpdate=true; t.repeat.set(u/s.wsize,v/s.wsize); return t; }
// a dark city on every horizon, lit windows brighter at night
function addSkyline(){
  const win=TEX.win;
  for(let i=0;i<110;i++){
    const a=(i/110)*TAU+R(-.02,.02), r=R(34,62), h=R(6,34), w=R(3,9), d=R(3,9);
    const t=win.clone(); t.needsUpdate=true; t.repeat.set(w/3,h/6);
    const m=new THREE.MeshStandardMaterial({color:0x0b0a16,roughness:.9,metalness:0,emissive:0xffffff,emissiveMap:t,emissiveIntensity:.6});
    const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); b.position.set(10+Math.cos(a)*r,h/2-.2,11+Math.sin(a)*r); b.rotation.y=-a; scene.add(b); CITY.mats.push(m);
    if(Math.random()<.3){ const c=[0xff2e93,0x5fe8ff,0xffd27a,0xb97aff][Math.floor(R(4))]; const s=new THREE.Mesh(new THREE.BoxGeometry(w*.7,.25,.25),new THREE.MeshBasicMaterial({color:c,fog:false})); s.position.set(0,h/2+.5,0); b.add(s); CITY.glow.push(s.material); }
  }
  const moon=new THREE.Mesh(new THREE.SphereGeometry(5,24,16),new THREE.MeshBasicMaterial({color:0xfff1d6,fog:false})); moon.position.set(10-70,48,11-60); scene.add(moon); CITY.moon=moon;
  const halo=new THREE.Mesh(new THREE.SphereGeometry(8.5,24,16),new THREE.MeshBasicMaterial({color:0xffe6c0,transparent:true,opacity:.18,fog:false,depthWrite:false})); moon.add(halo);
}
// swaying grass blades across the yard, instanced
function addGrass(){
  const geo=new THREE.PlaneGeometry(.14,.42,1,2); geo.translate(0,.21,0);
  const mat=new THREE.MeshStandardMaterial({map:TEX.blade,transparent:true,alphaTest:.5,side:THREE.DoubleSide,roughness:.9,metalness:0,color:0x8fb088});
  mat.userData.u={value:0};
  mat.onBeforeCompile=sh=>{ sh.uniforms.uT=mat.userData.u; sh.vertexShader='uniform float uT;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\n float ph=instanceMatrix[3].x*1.7+instanceMatrix[3].z*1.3; transformed.x+=uv.y*uv.y*.09*sin(uT*1.7+ph); transformed.z+=uv.y*uv.y*.05*cos(uT*1.3+ph);\n#endif'); };
  const N=2600, im=new THREE.InstancedMesh(geo,mat,N), o=new THREE.Object3D();
  for(let i=0;i<N;i++){ o.position.set(R(.4,19.6),0,R(14.4,21.6)); o.rotation.y=R(TAU); const s=R(.7,1.4); o.scale.set(s,s,s); o.updateMatrix(); im.setMatrixAt(i,o.matrix); }
  im.castShadow=false; im.receiveShadow=true; scene.add(im); CITY.grass=mat;
}
function tickTex(G,night){
  if(CITY.grass) CITY.grass.userData.u.value=G;
  const e=.35+1.1*night; for(const m of CITY.mats) m.emissiveIntensity=e;
}
// framed abstract prints and glowing windows on the walls
function poster(x,y,z,ry,w,h,seed){
  const t=cTex(256,256*h/w|0,(g,W,H)=>{
    const pal=[['#ff2e93','#5fe8ff','#0b0830'],['#ffb46a','#b97aff','#1a1250'],['#35d07f','#ff6b5d','#0c1a2a'],['#7af0ff','#ff7ad9','#140a2a']][seed%4];
    g.fillStyle=pal[2]; g.fillRect(0,0,W,H);
    for(let i=0;i<18;i++){ g.globalAlpha=.25+Math.random()*.5; g.fillStyle=pal[i%2]; if(seed%2){ g.fillRect(Math.random()*W,Math.random()*H,4+Math.random()*W*.3,3+Math.random()*8); } else { g.beginPath(); g.arc(Math.random()*W,Math.random()*H,8+Math.random()*50,0,TAU); g.fill(); } }
    g.globalAlpha=1; g.strokeStyle=pal[0]; g.lineWidth=3; g.beginPath(); g.moveTo(0,H*.72); for(let x=0;x<=W;x+=8) g.lineTo(x,H*.72-Math.sin(x*.05+seed)*12-Math.random()*4); g.stroke();
  },1);
  const grp=new THREE.Group();
  const frame=new THREE.Mesh(new THREE.BoxGeometry(w+.08,h+.08,.04),M(0x120f1a,{rough:.5})); grp.add(frame);
  const art=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,roughness:.6,metalness:0,emissive:0xffffff,emissiveMap:t,emissiveIntensity:.35})); art.position.z=.025; grp.add(art);
  grp.position.set(x,y,z); grp.rotation.y=ry; scene.add(grp); return grp;
}
function windowPane(x,y,z,ry,w,h){
  const grp=new THREE.Group();
  grp.add(new THREE.Mesh(new THREE.BoxGeometry(w+.12,h+.12,.06),M(0x1a1724,{rough:.6})));
  const t=TEX.win.clone(); t.needsUpdate=true; t.repeat.set(w*1.2,h*1.1);
  const pane=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({color:0x2a1a4a,roughness:.1,metalness:0,emissive:0xffffff,emissiveMap:t,emissiveIntensity:.8})); pane.position.z=.035; grp.add(pane);
  for(let i=0;i<Math.floor(h/.12);i++){ const s=new THREE.Mesh(new THREE.BoxGeometry(w,.03,.01),M(0xd9d4e0,{rough:.7})); s.position.set(0,h/2-.06-i*.12,.05); grp.add(s); }
  const bar=new THREE.Mesh(new THREE.BoxGeometry(.04,h,.01),M(0x1a1724)); bar.position.z=.045; grp.add(bar);
  grp.position.set(x,y,z); grp.rotation.y=ry; scene.add(grp); CITY.mats.push(pane.material); return grp;
}
function addDecor(){
  // generated wall pieces: neon eye over the TV wall, shelf above the bed, kitchen clock, print in the entry, blinds window in the bathroom
  prop('neon',8,8.68,{size:[1.6,.9,.12],y:1.5,fb:0xff2e93});
  prop('shelf',1.3,.2,{size:[1.4,.5,.3],y:1.35,fb:0x3a2f2a});
  prop('clock',19,.18,{size:[.6,.6,.1],y:1.9,fb:0x16161a});
  prop('poster',19.82,9.4,{size:[1.2,.9,.08],y:1.25,ry:-Math.PI/2,fb:0x16161a});
  prop('window',10,.16,{size:[1.2,1.1,.12],y:1.1,fb:0x1a1724});
  // bedroom: print above the bed on the north wall, window on the west wall
  poster(2.4,1.9,.14,0,.9,.6,0); poster(3.9,1.75,.14,0,.5,.7,1);
  windowPane(.14,1.6,3.3,Math.PI/2,1.4,1.1);
  // bathroom: small print
  poster(7.9,1.8,.14,0,.5,.5,3);
  // kitchen: window over the counters
  windowPane(15.6,1.75,.14,0,1.8,1);
  // hall: a row of three small prints on the south face of the bedroom wall
  for(let i=0;i<3;i++) poster(11.2+i*.9,1.7,6.14,0,.55,.55,i);
  poster(2.8,1.7,6.14,0,1,.6,2);
  // living room: window on the west wall, a big print behind the sofa
  windowPane(.14,1.6,11.2,Math.PI/2,1.6,1.1);
  poster(2.6,1.85,13.86,Math.PI,1.6,.9,1);
  poster(8.5,1.75,13.86,Math.PI,.6,.8,0);
  // entry: window by the door
  windowPane(19.86,1.6,11.2,-Math.PI/2,1.2,1.1);
}
