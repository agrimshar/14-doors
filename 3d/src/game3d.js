'use strict';
/* ---------- helpers ---------- */
const TAU=Math.PI*2;
const clamp=(x,a=0,b=1)=>x<a?a:x>b?b:x, lerp=(a,b,t)=>a+(b-a)*t, ease=t=>t*t*(3-2*t);
const R=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
const pick=a=>a[(Math.random()*a.length)|0];
const hex3=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
const hexN=h=>parseInt(h.slice(1),16);
const $=s=>document.querySelector(s);
const REDUCE=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- state ---------- */
const S={phase:'title',day:0,clock:0,well:1,habit:0,worry:0,joy:0,dayJoy:0,doses:[],dayDoses:0,total:0,taken:{},today:{},done:{},
  lostToday:0,lost:0,shower:0,talked:false,cool:0,chain:0,stage:0,warned:false,flatSaid:false,blackout:false,order:[],kept:[],goalSaid:false};
const P={x:3.5,z:3,vx:0,vz:0,face:0,r:.35,walk:0};
const keys={}; const inputQ=[];
let C=null, G=0, hold=0, near=null, endKind=null, fade=0, fadeTo=null, yaw=3.68, pitch=-.05, locked=false, sky=null, stars=null, bob=0;
const V={red:0,flash:0,black:0,sky:0,dawn:0};
const walls=[], solids=[], gates=[], stations=[], npcs=[], tokens={}, motes=[], lamps={};

/* ---------- three ---------- */
const cv=$('#gl');
let renderer,scene,camera,hemi,sun,rtScene,rtA,rtB,postMat,copyMat,postScene,copyScene,ortho,usePost=true,player,pLight,vTmp;
let RW=2,RH=2,q=1,slow=0;
function M(color,o={}){ const m=new THREE.MeshStandardMaterial({color,roughness:o.rough??.85,metalness:0,emissive:o.em??0x000000,emissiveIntensity:o.ei??1}); if(o.map){ m.map=o.map; m.bumpMap=o.map; m.bumpScale=o.bs??.012; } return m; }
function box(w,h,d,x,y,z,color,o={}){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),o.basic?new THREE.MeshBasicMaterial({color}):M(color,o));
  m.position.set(x,y,z); m.castShadow=!o.flat; m.receiveShadow=true; scene.add(m);
  if(o.solid) solids.push([x-w/2,z-d/2,x+w/2,z+d/2]);
  return m;
}
function wall(x1,z1,x2,z2){
  const t=.25, hz=Math.abs(z2-z1)<.01;
  const w=hz?x2-x1:t, d=hz?t:z2-z1, cx=(x1+x2)/2, cz=(z1+z2)/2;
  box(w,2.7,d,cx,1.35,cz,0x5a4e96,{rough:.9,map:texFit('wall',Math.max(w,d),2.7)});
  box(w+.03,.06,d+.03,cx,2.73,cz,0xf7f0e3,{basic:true,flat:true});
  box(w+.04,.07,d+.04,cx,.035,cz,0xff2e93,{basic:true,flat:true});
  walls.push([cx-w/2,cz-d/2,cx+w/2,cz+d/2]);
}
function archShape(w,h){
  const s=new THREE.Shape(), r=w/2;
  s.moveTo(-r,0); s.lineTo(-r,h-r); s.absarc(0,h-r,r,Math.PI,0,true); s.lineTo(r,0); s.lineTo(-r,0);
  return s;
}
function doorway(x,z,day){
  const pm=new THREE.MeshBasicMaterial({color:0xf7f0e3});
  for(const dx of [-.8,.8]){ const p=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,2,8),pm); p.position.set(x+dx,1,z); scene.add(p); }
  const a=new THREE.Mesh(new THREE.TorusGeometry(.8,.05,8,24,Math.PI),pm); a.position.set(x,2,z); scene.add(a);
  if(day){
    const g=new THREE.Mesh(new THREE.ShapeGeometry(archShape(1.6,2.8),16),new THREE.MeshBasicMaterial({color:0xff6b5d,transparent:true,opacity:.42,side:THREE.DoubleSide,depthWrite:false}));
    g.position.set(x,0,z); scene.add(g);
    gates.push({day,mesh:g,box:[x-.8,z-.2,x+.8,z+.2],x,z});
  }
}
function figurePose(f,want){
  if(f.state===want) return; const to=f[want], from=f[f.state]; f.state=want;
  to.reset().setEffectiveWeight(1).play(); to.crossFadeFrom(from,.3,false);
}
function figure(col,model){
  const g=new THREE.Group(), c=hexN(col), f={g,head:new THREE.Group(),mixer:null,act:null};
  f.body=prop(model||'person_walk',0,0,Object.assign({size:[null,1.72,null],uniform:true,fb:c,ready:(m,clips)=>{
    if(!clips||!clips.length) return;
    // one walk clip from the rig; its passing pose (legs together), held, is the standing pose we crossfade to when the walk stops
    f.mixer=new THREE.AnimationMixer(m); f.walk=f.mixer.clipAction(clips[0]); f.walk.timeScale=1.05;
    f.idle=f.mixer.clipAction(THREE.AnimationUtils.subclip(clips[0],'idle',8,9,30)); f.idle.setLoop(THREE.LoopRepeat); f.idle.play(); f.state='idle';
  }},model?{}:{tint:c,ei:.12}));
  scene.remove(f.body); g.add(f.body); g.add(f.head);
  f.mark=new THREE.Mesh(new THREE.OctahedronGeometry(.13),new THREE.MeshBasicMaterial({color:0xff6b5d})); f.mark.position.y=2.05; f.mark.visible=false; g.add(f.mark);
  const glow=new THREE.PointLight(c,.5,2.5,2); glow.position.y=1.1; g.add(glow);
  scene.add(g);
  return f;
}
function ring(x,z,col){
  const m=new THREE.Mesh(new THREE.RingGeometry(.48,.6,32),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));
  m.rotation.x=-Math.PI/2; m.position.set(x,.03,z); scene.add(m); return m;
}
function lamp(id,x,z,col){
  const l=new THREE.PointLight(col,1,13,2); l.position.set(x,2.2,z); scene.add(l); lamps[id]=l;
}
function buildWorld(){
  scene=new THREE.Scene(); scene.background=new THREE.Color(0x06050c); scene.fog=new THREE.Fog(0x2a1840,18,95); mkTextures();
  camera=new THREE.PerspectiveCamera(72,1,.05,260);
  hemi=new THREE.HemisphereLight(0xaab4ff,0x4a3626,.5); scene.add(hemi);
  scene.environment=mkEnv();
  sun=new THREE.DirectionalLight(0xffe2b8,1); sun.position.set(2,20,4); sun.target.position.set(10,0,11);
  sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
  const sc=sun.shadow.camera; sc.left=-17; sc.right=17; sc.top=17; sc.bottom=-17; sc.near=1; sc.far=60; sun.shadow.bias=-.0006;
  scene.add(sun); scene.add(sun.target);
  // ground and floors
  box(90,.1,90,10,-.12,11,0x08070f,{flat:true});
  const floors=[[0,0,7,6,0x5a4e8a,'wood'],[7,0,11,6,0x3a6a78,'tile'],[11,0,20,6,0x7a6050,'tile'],[0,6,20,8.5,0x4a4260,'concrete'],[0,8.5,12,14,0x6a5a3c,'wood'],[12,8.5,20,14,0x4e485c,'concrete'],[0,14,20,22,0x8aa884,'grass']];
  for(const [x1,z1,x2,z2,c,k] of floors) box(x2-x1,.1,z2-z1,(x1+x2)/2,-.05,(z1+z2)/2,c,{flat:true,rough:.95,map:texFit(k,x2-x1,z2-z1),bs:k==='grass'?.03:.015});
  // walls
  wall(0,0,20,0); wall(0,0,0,14); wall(20,0,20,14); wall(0,14,15.2,14); wall(16.8,14,20,14);
  wall(0,6,4.2,6); wall(5.8,6,8.2,6); wall(9.8,6,14.2,6); wall(15.8,6,20,6);
  wall(0,8.5,5.2,8.5); wall(6.8,8.5,15.2,8.5); wall(16.8,8.5,20,8.5);
  wall(7,0,7,6); wall(11,0,11,6); wall(12,8.5,12,14);
  doorway(5,6); doorway(9,6,1); doorway(15,6); doorway(6,8.5,1); doorway(16,8.5); doorway(16,14,2);
  // yard fence: generated segments on top of the collision line
  for(const [x1,z1,x2,z2] of [[0,22,20,22],[0,14,0,22],[20,14,20,22]]){
    const hz=Math.abs(z2-z1)<.01, len=hz?x2-x1:z2-z1, n=Math.round(len/2.5), seg=len/n;
    for(let i=0;i<n;i++){ const t=(i+.5)*seg; prop('fence',hz?x1+t:x1,hz?z1:z1+t,{size:[seg+.02,.75,.16],ry:hz?0:Math.PI/2,fb:0x24382c}); }
    const w=hz?x2-x1:.12, d=hz?.12:z2-z1; walls.push([(x1+x2)/2-w/2-.1,(z1+z2)/2-d/2-.1,(x1+x2)/2+w/2+.1,(z1+z2)/2+d/2+.1]);
  }
  // bedroom
  prop('bed',1.05,1.45,{size:[1.6,.55,2.3],solid:true,fb:0x4a3f6b});
  prop('desk',5.8,.55,{size:[1.7,.8,.7],ry:0,solid:true,fb:0x3a2f2a});
  prop('chair',5.8,1.35,{size:[.55,.9,.55],ry:0,solid:.45,fb:0x35304a});
  prop('guitar',.45,4.8,{size:[null,1.15,null],ry:Math.PI/2,uniform:true,fb:0xb5651d});
  prop('lamp',6.55,5.45,{size:[.4,1.7,.4],solid:.3,fb:0x35304a});
  prop('rug',3.6,3.4,{size:[2.6,.03,1.8],flat:true,fb:0x3a2c55});
  // bathroom
  prop('shower',7.95,.95,{size:[1.5,2.2,1.5],ry:Math.PI,solid:1.2,fb:0x7fd0e0});
  box(.5,1.1,3.8,10.6,.55,2.4,0x2f3b4a,{solid:true});
  // kitchen
  for(const x of [12.8,15.6,18.4]) prop('counter',x,.5,{size:[2.8,.9,.7],ry:0,solid:true,fb:0x3b3430});
  prop('coffee',12,.5,{size:[.3,.36,.3],y:.9,ry:0,uniform:true,fb:0x16161a});
  prop('table',15.5,3.1,{size:[1.8,.78,1.1],solid:[1.8,1.1],fb:0x5a4636});
  // hall
  prop('plant',19.4,7.25,{size:[.8,1.4,.8],uniform:true,fb:0x2f9e5b});
  // living room
  prop('sofa',2.6,13.2,{size:[3,.85,1],ry:Math.PI,solid:true,fb:0x3d4a63});
  prop('tv',2.6,8.8,{size:[2.2,1.1,.14],y:.55,fb:0x0d0f18});
  prop('speaker',4.3,9,{size:[.6,1.5,.5],solid:.5,fb:0x16161a}); prop('speaker',.9,9,{size:[.6,1.5,.5],solid:.5,fb:0x16161a});
  prop('armchair',10.8,13.6,{size:[1,.9,1],ry:-Math.PI/2,solid:true,fb:0x4a2f2a});
  prop('lamp',.7,13.3,{size:[.4,1.7,.4],solid:.3,fb:0x35304a});
  prop('rug',2.6,11.2,{size:[2.4,.03,1.6],flat:true,fb:0x4a3a22});
  // entry
  prop('rug',16,13.2,{size:[1.4,.03,.8],flat:true,fb:0x3a3344}); prop('lamp',19.3,13.3,{size:[.4,1.7,.4],solid:.3,fb:0x35304a});
  // yard
  prop('hoop',2.7,18,{size:[1.2,3.1,.7],ry:Math.PI/2,solid:.3,fb:0x999999});
  prop('bench',13.6,21.3,{size:[2.4,.8,.8],solid:true,fb:0x4a3b2a}); prop('bench',16.6,21.3,{size:[2.4,.8,.8],solid:true,fb:0x4a3b2a});
  prop('speaker',9.7,21.2,{size:[.9,2.1,.7],ry:Math.PI,solid:true,fb:0x16161a}); prop('speaker',1.2,21.2,{size:[.9,2.1,.7],ry:Math.PI,solid:true,fb:0x16161a});
  // lamps
  lamp('bed',3.5,3,0xff7ad9); lamp('bath',9,3,0x5fe8ff); lamp('kit',15.5,3,0xffb46a); lamp('hall',10,7.25,0xb9a0ff); lamp('liv',6,11.2,0xffc94d); lamp('yard',10,18,0x4ad6c0); lamp('ent',16,11,0xff8a6a);
  // the fourteen doors, small enough to hold
  for(const s of SUBS){
    const g=new THREE.Group(), col=hexN(s.a);
    const m=new THREE.Group(); g.add(m);
    const core=new THREE.Mesh(new THREE.OctahedronGeometry(.2,0),new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:1.5,roughness:.25,metalness:.1}));
    const shell=new THREE.Mesh(new THREE.IcosahedronGeometry(.33,1),new THREE.MeshPhysicalMaterial({color:hexN(s.b),transparent:true,opacity:.3,roughness:.08,metalness:0,transmission:.5,side:THREE.DoubleSide,depthWrite:false}));
    m.add(core); m.add(shell);
    const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.26,.32,.1,24),M(0x14121f,{em:col,ei:.3})); plinth.position.y=-1.25; g.add(plinth);
    const halo=new THREE.Mesh(new THREE.RingGeometry(.3,.36,24),new THREE.MeshBasicMaterial({color:hexN(s.b),transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false}));
    halo.rotation.x=-Math.PI/2; halo.position.y=-1.19; g.add(halo);
    const pl=new THREE.PointLight(col,.9,3.2,2); pl.position.y=-.1; g.add(pl);
    g.position.set(s.x.pos[0],1.3,s.x.pos[1]); scene.add(g);
    tokens[s.id]={g,m,s};
    stations.push({type:'sub',s,x:s.x.pos[0],z:s.x.pos[1],day:s.x.day,reach:1.7});
  }
  const beam=(x,z,col)=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,2.6,10),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.55,depthWrite:false})); m.position.set(x,1.3,z); scene.add(m); return m; };
  for(const t of TASKS){ t.ring=ring(t.x,t.z,0xffb46a); t.beam=beam(t.x,t.z,0xffb46a); stations.push({type:'task',t,x:t.x,z:t.z,day:t.day,reach:1.5}); }
  const bed={type:'bed',x:2.3,z:1.5,day:0,reach:1.5,ring:ring(2.3,1.5,0xf7f0e3),beam:beam(2.3,1.5,0xf7f0e3)}; stations.push(bed); S.bed=bed;
  sky=new THREE.Mesh(new THREE.SphereGeometry(110,24,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
    uniforms:{top:{value:new THREE.Color(0x0b0830)},mid:{value:new THREE.Color(0x7a2f8f)},bot:{value:new THREE.Color(0xff8a6a)}},
    vertexShader:'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader:'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP; float hs(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); } void main(){ vec3 n=normalize(vP); float h=n.y; vec3 c=mix(bot,mid,smoothstep(-.02,.22,h)); c=mix(c,top,smoothstep(.15,.75,h)); c+=bot*.55*exp(-abs(h-.01)*22.); float a=atan(n.z,n.x); vec2 g=vec2(a*22.,h*60.); float cl=hs(floor(g*.5)); c+=mid*.18*smoothstep(.55,1.,cl)*smoothstep(.05,.3,h)*(1.-smoothstep(.3,.7,h)); gl_FragColor=vec4(c,1.); }'}));
  sky.position.set(10,0,11); scene.add(sky);
  addSkyline(); addGrass(); addDecor();
  const sp=new Float32Array(900); for(let i=0;i<300;i++){ const a=R(TAU), e=R(.12,1.5), r=100; sp[i*3]=10+Math.cos(a)*Math.cos(e)*r; sp[i*3+1]=Math.sin(e)*r; sp[i*3+2]=11+Math.sin(a)*Math.cos(e)*r; }
  const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.BufferAttribute(sp,3));
  stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:2,sizeAttenuation:false,transparent:true,opacity:.8,fog:false,depthWrite:false})); scene.add(stars);
  // people
  for(const d of NPCS){
    const f=figure(d.col,d.id+'_walk'), el=document.createElement('div'); el.className='bubble'; $('#bubbles').appendChild(el);
    npcs.push({d,f,el,x:d.path[0][0],z:d.path[0][1],i:0,wait:1,face:0,sayT:0,cool:R(2,6),knock:null,sees:false});
  }
  player=figure('#f7f0e3');
  pLight=new THREE.PointLight(0xffb46a,.7,7,2); pLight.position.y=1.6; player.g.add(pLight);
  for(let i=0;i<36;i++){
    const m=new THREE.Mesh(new THREE.SphereGeometry(.11,10,8),new THREE.MeshBasicMaterial({color:0xffffff})); m.visible=false; scene.add(m);
    motes.push({m,on:false,x:0,z:0,y:1,ph:R(TAU)});
  }
  vTmp=new THREE.Vector3();
}
function mkPost(){
  const U=o=>{ const u={}; for(const k in o) u[k]={value:o[k]}; return u; };
  postMat=new THREE.RawShaderMaterial({glslVersion:THREE.GLSL3,vertexShader:POST_VERT,fragmentShader:POST_FRAG,depthTest:false,depthWrite:false,
    uniforms:U({uScene:null,uPrev:null,uRes:new THREE.Vector2(2,2),uPlayer:new THREE.Vector2(0,0),uT:0,uG:0,uK:0,uBeat:0,uAuxA:0,uAuxB:0,uDawn:0,uSky:0,uMixB:1,
      uMA:0,uMB:-1,uShardN:0,uShard:new Float32Array(15),uCA:.0015,uSat:1,uVig:.28,uWob:0,uScan:0,uDbl:0,uBloom:.9,uBlack:0,uFlash:0,uGrain:.03,uKal:0,uTrail:0,uPix:0,uZoom:0,uRed:0})});
  copyMat=new THREE.RawShaderMaterial({glslVersion:THREE.GLSL3,vertexShader:POST_VERT,fragmentShader:COPY_FRAG,depthTest:false,depthWrite:false,uniforms:U({uTex:null,uRes:new THREE.Vector2(2,2)})});
  ortho=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  postScene=new THREE.Scene(); const a=new THREE.Mesh(new THREE.PlaneGeometry(2,2),postMat); a.frustumCulled=false; postScene.add(a);
  copyScene=new THREE.Scene(); const b=new THREE.Mesh(new THREE.PlaneGeometry(2,2),copyMat); b.frustumCulled=false; copyScene.add(b);
}
function resize(){
  const w=Math.max(2,cv.clientWidth), h=Math.max(2,cv.clientHeight);
  const s=Math.min(Math.min(devicePixelRatio||1,2),Math.sqrt(2.0e6/(w*h)))*q;
  RW=Math.max(2,Math.round(w*s)); RH=Math.max(2,Math.round(h*s));
  renderer.setPixelRatio(1); renderer.setSize(RW,RH,false);
  camera.aspect=w/h; camera.updateProjectionMatrix();
  for(const r of [rtScene,rtA,rtB]) if(r) r.dispose();
  rtScene=new THREE.WebGLRenderTarget(RW,RH,{minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter,generateMipmaps:true});
  rtA=new THREE.WebGLRenderTarget(RW,RH,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:false});
  rtB=new THREE.WebGLRenderTarget(RW,RH,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:false});
  postMat.uniforms.uRes.value.set(RW,RH); copyMat.uniforms.uRes.value.set(RW,RH);
}
let postChecked=0;
function render(){
  if(!usePost){ renderer.setRenderTarget(null); renderer.render(scene,camera); return; }
  renderer.setRenderTarget(rtScene); renderer.render(scene,camera);
  postMat.uniforms.uScene.value=rtScene.texture; postMat.uniforms.uPrev.value=rtB.texture;
  renderer.setRenderTarget(rtA); renderer.render(postScene,ortho);
  copyMat.uniforms.uTex.value=rtA.texture;
  renderer.setRenderTarget(null); renderer.render(copyScene,ortho);
  const t=rtA; rtA=rtB; rtB=t;
  if(postChecked<3&&++postChecked===3){
    try{ const pr=renderer.properties.get(postMat), pg=pr&&(pr.currentProgram||pr.program); if(pg&&pg.diagnostics&&pg.diagnostics.runnable===false) usePost=false; }catch(e){}
  }
}

/* ---------- collision and sight ---------- */
function blockers(){ const b=walls.concat(solids); for(const g of gates) if(S.day<g.day) b.push(g.box); return b; }
let BL=[];
function resolve(o,r){
  for(let it=0;it<2;it++) for(const b of BL){
    const cx=clamp(o.x,b[0],b[2]), cz=clamp(o.z,b[1],b[3]), dx=o.x-cx, dz=o.z-cz, d2=dx*dx+dz*dz;
    if(d2<r*r){
      if(d2>1e-8){ const d=Math.sqrt(d2); o.x=cx+dx/d*r; o.z=cz+dz/d*r; }
      else { const l=o.x-b[0], rr=b[2]-o.x, t=o.z-b[1], bb=b[3]-o.z, m=Math.min(l,rr,t,bb); if(m===l) o.x=b[0]-r; else if(m===rr) o.x=b[2]+r; else if(m===t) o.z=b[1]-r; else o.z=b[3]+r; }
    }
  }
}
function segBox(ax,az,bx,bz,b){
  let t0=0,t1=1; const dd=[bx-ax,bz-az], pp=[ax,az];
  for(let k=0;k<2;k++){
    const d=dd[k], p=pp[k], mn=b[k], mx=b[k+2];
    if(Math.abs(d)<1e-9){ if(p<mn||p>mx) return false; }
    else { let a=(mn-p)/d, c=(mx-p)/d; if(a>c){ const t=a; a=c; c=t; } t0=Math.max(t0,a); t1=Math.min(t1,c); if(t0>t1) return false; }
  }
  return true;
}
function los(ax,az,bx,bz){
  for(const b of walls) if(segBox(ax,az,bx,bz,b)) return false;
  for(const g of gates) if(S.day<g.day&&segBox(ax,az,bx,bz,g.box)) return false;
  return true;
}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const visibleNpc=(range)=>{ let best=null,bd=range; for(const n of npcs){ if(S.day<n.d.day) continue; const d=dist(n,P); if(d<bd&&los(n.x,n.z,P.x,P.z)){ bd=d; best=n; } } return best; };

/* ---------- the body chemistry ---------- */
const doseK=d=>ease(clamp(1-d.t/d.dur))*clamp(d.t/2);
const load=()=>S.doses.reduce((a,d)=>a+d.load*clamp(1-d.t/d.dur),0);
const limit=()=>1-.45*clamp(S.habit);
const tells=()=>load()*(S.shower>0?.5:1);
const stage=()=>S.worry>=66?2:S.worry>=33?1:0;
const STAGES=['They do not know','They have noticed','They are worried'];
function dominant(){ let b=null,bv=0; for(const d of S.doses){ const v=d.load*clamp(1-d.t/d.dur); if(v>bv){ bv=v; b=d; } } return b; }
function addJoy(v){ S.joy=Math.max(0,S.joy+v); S.dayJoy+=v; if(v>0){ popGain(v); S.idle=0; } }
function doseJoy(s){ const n=S.today[s.id]||0, tot=S.taken[s.id]||0, dom=dominant(), combo=dom&&dom.s!==s?comboOf(dom.s,s):null; return s.x.joy*Math.pow(.6,n)*Math.pow(.88,tot)*(combo?combo.yield:1)*(S.well<.2?.4:1); }
function takeDose(s,forced){
  const n=S.today[s.id]||0, tot=S.taken[s.id]||0, dom=dominant();
  const combo=dom&&dom.s!==s?comboOf(dom.s,s):null;
  const j=doseJoy(s);
  S.today[s.id]=n+1; S.taken[s.id]=tot+1; S.dayDoses++; S.total++; if(!S.order.includes(s.id)) S.order.push(s.id);
  S.doses.push({s,t:0,dur:s.x.dur,load:s.x.load*(combo?Math.min(1.6,combo.cost):1),motes:Math.round(j*.6),spawn:0});
  addJoy(j*.4);
  S.well=clamp(S.well-s.cost*.5*(combo?combo.cost:1)); S.habit=clamp(S.habit+s.x.hab*(1+n*.5));
  sWhoosh(); sBoom(); sndFx('door',.9); V.flash=.25; musicFor();
  if(forced) caption(STORY.compulse,4);
  else if(combo) caption(combo.name+'. '+combo.line,6);
  else caption(n?STORY.again:(tot?s.lines[1]:s.lines[0]),5);
  const seer=visibleNpc(7);
  if(seer&&s.x.load>=.3){ S.worry+=18; say(seer,pick(SAY.caught),3.5); }
  if(combo&&combo.black) startLoss('blackout');
}
let musId='';
function musicFor(){
  const d=dominant(), id=d&&doseK(d)>.05?d.s.id:'hub';
  if(id===musId) return; musId=id; setMusic(id==='hub'?HUB_MUS:d.s.mus);
}

/* ---------- losing control ---------- */
function startLoss(type,target){
  if(C&&C.type==='blackout') return;
  C={type,target,t:0,hit:false}; S.lostToday++; S.lost++; hold=0;
  $('#lost').classList.add('on'); sBlack();
  if(type==='blackout'){ caption(S.well<=0?STORY.dry:STORY.blackout,6); fadeTo=()=>endDay(true); }
  else caption(STORY[type],5);
}
function endLoss(){
  if(!C) return;
  if(C.type!=='blackout'){ for(const d of S.doses) d.t+=d.dur*.4; S.well=clamp(S.well-.12); S.cool=7; }
  C=null; $('#lost').classList.remove('on');
}
function checkLoss(){
  if(S.well<=0){ startLoss('blackout'); return; }
  const L=load(), lim=limit();
  $('#hEdge').classList.toggle('on',L>lim*.85&&!C);
  if(L>lim*.85&&!S.warned){ S.warned=true; caption(STORY.limit,4); sndFx('heart',.8); }
  if(L<=lim||S.cool>0) return;
  const d=dominant(); if(!d) return; const s=d.s;
  if(s.id==='al'){ const n=visibleNpc(4.5); if(n) startLoss('lash',n); return; }
  if(s.cls==='emp'){ const n=visibleNpc(7); startLoss(n?'over':'scramble',n); return; }
  if(s.cls==='stim'||s.cls==='lite'){
    if(S.chain>=1){ startLoss('blackout'); return; }
    let best=null,bd=9; for(const id in tokens){ const t=tokens[id].s; if(S.day<t.x.day||(t.cls!=='stim'&&t.cls!=='lite')) continue; const dd=Math.hypot(t.x.pos[0]-P.x,t.x.pos[1]-P.z); if(dd<bd&&los(P.x,P.z,t.x.pos[0],t.x.pos[1])){ bd=dd; best=t; } }
    S.chain++; startLoss(best?'compulse':'pace',best); return;
  }
  if(s.cls==='dep'||s.cls==='dis'){ startLoss('blackout'); return; }
  startLoss('scramble');
}
function autopilot(dt){
  C.t+=dt; const t=C.type;
  let tx=0,tz=0,sp=0;
  if(t==='lash'||t==='over'){
    const n=C.target, dx=n.x-P.x, dz=n.z-P.z, d=Math.hypot(dx,dz)+1e-6;
    if(!C.hit){
      tx=dx/d; tz=dz/d; sp=t==='lash'?5.2:4;
      if(d<.95){
        C.hit=true; C.t=0;
        if(t==='lash'){ n.knock={vx:dx/d*7,vz:dz/d*7,t:.35}; V.red=1; sBoom(); say(n,pick(SAY.lash),4); S.worry+=30; addJoy(-4); for(const o of npcs) if(o!==n&&S.day>=o.d.day&&dist(o,P)<9) say(o,'What happened?!',3); }
        else { say(n,pick(SAY.over),4.5); S.worry+=18; }
      }
    } else if(C.t>(t==='lash'?1.8:3)) return endLoss();
    if(!C.hit&&C.t>5) return endLoss();
  } else if(t==='compulse'){
    const s=C.target, dx=s.x.pos[0]-P.x, dz=s.x.pos[1]-P.z, d=Math.hypot(dx,dz)+1e-6;
    if(!C.hit){ tx=dx/d; tz=dz/d; sp=5; if(d<1.5){ C.hit=true; C.t=0; takeDose(s,true); } else if(C.t>5) return endLoss(); }
    else if(C.t>1.2) return endLoss();
  } else if(t==='pace'){
    const a=C.t*3.2; tx=Math.cos(a); tz=Math.sin(a); sp=5.5; if(C.t>6.5) return endLoss();
  } else if(t==='scramble'){
    const a=2.2*Math.sin(C.t*1.3)+C.t*.9, i=inputDir(); tx=i.x*Math.cos(a)-i.z*Math.sin(a); tz=i.x*Math.sin(a)+i.z*Math.cos(a);
    if(!i.x&&!i.z){ tx=Math.cos(a*.7)*.5; tz=Math.sin(a*.7)*.5; } sp=3.4; if(C.t>7.5) return endLoss();
  } else if(t==='blackout'){ fade=clamp(C.t/2.2); if(C.t>2.6&&fadeTo){ const f=fadeTo; fadeTo=null; f(); } return; }
  P.vx+=(tx*sp-P.vx)*Math.min(1,10*dt); P.vz+=(tz*sp-P.vz)*Math.min(1,10*dt);
}

/* ---------- people ---------- */
function say(n,text,dur=3){ sndSay(n.d.id,text); if(SAY.caught.includes(text)||SAY.found.includes(text)) sndFx('caught',.7); n.el.textContent=text; n.el.classList.add('on'); n.sayT=dur; n.cool=dur+R(7,12); }
function updNpc(n,dt){
  const act=S.day>=n.d.day; n.f.g.visible=act; if(!act){ n.el.classList.remove('on'); return; }
  const path=(stage()===2&&n.d.worried)?n.d.worried:n.d.path;
  if(n.knock){ n.x+=n.knock.vx*dt; n.z+=n.knock.vz*dt; resolve(n,.3); n.knock.t-=dt; if(n.knock.t<=0){ n.knock=null; n.wait=3; } }
  else if(n.wait>0) n.wait-=dt;
  else {
    const w=path[n.i%path.length], dx=w[0]-n.x, dz=w[1]-n.z, d=Math.hypot(dx,dz);
    if(d<.12){ n.wait=w[2]; n.i=(n.i+1)%path.length; }
    else { const sp=1.35; n.x+=dx/d*Math.min(d,sp*dt); n.z+=dz/d*Math.min(d,sp*dt); n.face=Math.atan2(dx,dz); n.moving=true; }
  }
  const d=dist(n,P); n.sees=d<6.5&&los(n.x,n.z,P.x,P.z);
  if(n.sees&&(n.wait>0||stage()>0)) n.face=Math.atan2(P.x-n.x,P.z-n.z);
  n.cool-=dt;
  if(n.sees&&S.phase==='play'&&!C){
    const tl=tells();
    if(tl>.2){ S.worry+=tl*7*dt; if(n.cool<=0) say(n,pick(SAY.seen),3); }
    else if(S.well<.2){ S.worry+=1.5*dt; if(n.cool<=0) say(n,'You look awful. Are you eating?',3); }
    else if(n.cool<=0&&d<3.2) say(n,stage()===2?pick(SAY.worried):pick(SAY.calm[n.d.id]),3);
  }
  if(n.sayT>0){ n.sayT-=dt; if(n.sayT<=0) n.el.classList.remove('on'); }
  n.f.g.position.set(n.x,0,n.z); n.f.g.rotation.y=n.face;
  if(n.f.mixer){ figurePose(n.f,n.moving?'walk':'idle'); n.f.mixer.update(dt); } n.moving=false;
  n.f.mark.visible=stage()===2; n.f.mark.rotation.y=G*2;
  if(n.el.classList.contains('on')) place(n.el,n.x,2.3,n.z);
}
function place(el,x,y,z){
  vTmp.set(x,y,z).project(camera);
  el.style.visibility=vTmp.z>1?'hidden':'visible';
  el.style.left=((vTmp.x*.5+.5)*100)+'%'; el.style.top=((-vTmp.y*.5+.5)*100)+'%';
}

/* ---------- acting on the world ---------- */
function taskMult(t){
  const d=dominant(), L=load(); let m=1, slow=1;
  if(L<.1){ if(S.habit>.5){ m=.7; if(!S.flatSaid){ S.flatSaid=true; setTimeout(()=>caption(STORY.flat,4),2600); } } }
  else if(d){
    const c=d.s.cls, id=d.s.id;
    if(t.kind==='play'&&(c==='can'||c==='psy')) m=1.5;
    else if(t.kind==='bond'&&(id==='al'||c==='emp')&&L<limit()*.8) m=1.4;
    else if(t.kind==='focus'&&(c==='stim'||c==='lite')) m=1.5;
    else if(t.kind==='focus'&&(c==='dep'||c==='can'||c==='psy'||c==='dis')) m=.5;
    if(c==='stim'||c==='lite') slow=.5; else if(c==='can'||c==='dep'||c==='dis') slow=1.6;
  }
  if(S.well<.2) m*=.5;
  return {m,slow};
}
function doTask(t){
  const {m}=taskMult(t); S.done[t.id]=true; addJoy(t.joy*m);
  if(t.well) S.well=clamp(S.well+t.well);
  if(t.id==='shower') S.shower=30;
  if(t.kind==='bond'){ if(tells()>.35){ S.worry+=10; caption('They looked at me a second too long.',4); } else { if(load()<.1) S.worry=Math.max(0,S.worry-8); caption(t.line,4.5); } }
  else caption(t.line,4.5);
  t.ring.material.opacity=.15; if(lamps[t.room]) lamps[t.room].userData.lit=true;
  sShard(); sndFx('task',.8); V.flash=.12; hudTasks();
}
function talk(){ S.talked=true; S.worry=Math.max(0,S.worry-30); S.habit=clamp(S.habit-.08); addJoy(5); caption(STORY.talk,6); sShard(); const m=npcs[0]; say(m,'Thank you for telling me.',4); }
function findNear(){
  let best=null,bd=9;
  for(const st of stations){
    if(S.day<st.day) continue;
    if(st.type==='task'&&S.done[st.t.id]) continue;
    const d=Math.hypot(st.x-P.x,st.z-P.z); if(d<st.reach&&d<bd){ bd=d; best=st; }
  }
  const mom=npcs[0];
  if(S.worry>=40&&!S.talked&&load()<.1&&dist(mom,P)<1.8) best={type:'talk',x:mom.x,z:mom.z};
  return best;
}
function promptFor(st){
  if(st.type==='sub') return {text:st.s.name+' · +'+Math.round(doseJoy(st.s))+' joy',time:.7};
  if(st.type==='task'){ const k=taskMult(st.t); return {text:st.t.name+' · +'+Math.round(st.t.joy*k.m)+' joy',time:1.8*k.slow}; }
  if(st.type==='bed') return {text:'Sleep, and end '+DAYS[S.day],time:1.4};
  return {text:'Tell her the truth',time:2};
}
function act(st){
  if(st.type==='sub') takeDose(st.s);
  else if(st.type==='task') doTask(st.t);
  else if(st.type==='bed') endDay(false);
  else talk();
}
function inputDir(){
  const fw=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0), st=(keys.KeyD?1:0)-(keys.KeyA?1:0);
  let x=-Math.sin(yaw)*fw+Math.cos(yaw)*st, z=-Math.cos(yaw)*fw-Math.sin(yaw)*st;
  const l=Math.hypot(x,z); if(l>1){ x/=l; z/=l; } return {x,z};
}
const goalNow=()=>GOALS[S.day];
function target(){
  if(S.dayJoy>=goalNow()) return {x:S.bed.x,z:S.bed.z,name:'Your bed'};
  let best=null,bd=1e9;
  for(const t of TASKS){ if(S.day<t.day||S.done[t.id]) continue; const d=Math.hypot(t.x-P.x,t.z-P.z)+(los(P.x,P.z,t.x,t.z)?0:6); if(d<bd){ bd=d; best=t; } }
  return best?{x:best.x,z:best.z,name:best.name}:{x:S.bed.x,z:S.bed.z,name:'Your bed'};
}

/* ---------- a day ---------- */
function startDay(d){
  S.idle=0; S.idleSaid=false; S.itchSaid=false;
  Object.assign(S,{day:d,clock:0,doses:[],today:{},done:{},dayJoy:0,dayDoses:0,lostToday:0,talked:false,shower:0,chain:0,cool:0,warned:false,goalSaid:false});
  const bo=S.blackout; S.blackout=false;
  P.x=bo?(d>=1?9:9):2.4; P.z=bo?(d>=1?4.2:7.2):1.6; P.vx=P.vz=0; C=null; fade=1; fadeTo=null; inputQ.length=0; yaw=bo?R(TAU):3.68; pitch=-.05;
  $('#lost').classList.remove('on');
  for(const g of gates) g.mesh.visible=d<g.day;
  for(const id in tokens) tokens[id].g.visible=d>=tokens[id].s.x.day;
  for(const t of TASKS){ t.ring.visible=t.beam.visible=d>=t.day; t.ring.material.opacity=.8; }
  for(const k in lamps) lamps[k].userData.lit=false;
  S.bed.ring.material.color.setHex(0xf7f0e3);
  for(const n of npcs){ n.x=n.d.path[0][0]; n.z=n.d.path[0][1]; n.i=0; n.wait=R(1,3); n.knock=null; n.el.classList.remove('on'); }
  for(const m of motes){ m.on=false; m.m.visible=false; }
  BL=blockers(); musId=''; musicFor();
  hudTasks(); S.phase='play'; show('play');
  setTimeout(()=>caption(d===0?STORY.open:STORY.days[d],6),900);
}
function endDay(blackout){
  if(S.phase!=='play') return;
  const avail=TASKS.filter(t=>S.day>=t.day), done=avail.filter(t=>S.done[t.id]).length;
  const met=S.dayJoy>=goalNow(); S.kept[S.day]=met;
  const balanced=met&&S.lostToday===0, bonus=balanced?Math.round(S.dayJoy*.25):0;
  const hab0=S.habit;
  if(S.dayDoses===0){ S.habit=clamp(S.habit-.15); S.worry=Math.max(0,S.worry-12); } else if(S.dayDoses<=2) S.habit=clamp(S.habit-.06);
  if(blackout){ S.worry+=12; S.blackout=true; }
  S.joy+=bonus;
  let v,line;
  if(S.lostToday>0){ v='Lost.'; line=STORY.dayLost; }
  else if(S.dayDoses===0&&met){ v='Clear.'; line=STORY.dayClear; }
  else if(met){ v='Level.'; line=STORY.dayLevel; }
  else if(S.dayDoses>0){ v='Loud.'; line=STORY.dayLoud; }
  else { v='Grey.'; line=STORY.dayGrey; }
  $('#cEyebrow').textContent=DAYS[S.day]+' night';
  $('#cBig').textContent=v; $('#cLine').textContent=line; sndFx('sleep',.8); setTimeout(()=>sndStory(line),900);
  const dh=Math.round((S.habit-hab0)*100);
  $('#cStats').innerHTML=`<dt>Today's goal</dt><dd>${met?'Kept':'Missed'} · ${Math.round(S.dayJoy)} of ${goalNow()} joy${bonus?` · in-control bonus +${bonus}`:''}</dd><dt>Day to day</dt><dd>${done} of ${avail.length} done</dd><dt>Doors opened</dt><dd>${S.dayDoses}</dd><dt>The habit</dt><dd>${Math.round(S.habit*100)}%${dh<0?' · easing':''}</dd><dt>At home</dt><dd>${STAGES[stage()]}</dd>`;
  $('#cShards').innerHTML=balanced?`<div class="lesson" style="--c:#ffb46a"><i></i><span><small>Balance</small>Goal kept and never out of control. A quarter again on the day.</span></div>`:(S.dayDoses===0?`<div class="lesson" style="--c:#f7f0e3"><i></i><span><small>A clear day</small>The habit eased and the house relaxed.</span></div>`:'');
  $('#back').textContent=S.day>=DAYS.length-1?'See where it left me':'Next morning';
  S.well=clamp((blackout||S.clock>=DAYLEN?.6:1)-.35*S.habit,.2,1);
  S.doses=[]; setMusic(HUB_MUS); musId='hub'; S.phase='card'; show('card');
}
function finish(kind){
  const kept=S.kept.filter(Boolean).length;
  endKind=kind||(S.total===0&&kept>=3?'clear':(kept>=3&&S.worry<50&&S.habit<.5?'level':(S.habit>=.5?'hooked':(S.worry>=66?'known':'grey'))));
  const e=ENDINGS[endKind], good=endKind==='level'||endKind==='clear';
  $('#dKicker').textContent=good?'Monday morning':'Afterwards';
  $('#dTitle').textContent=e.h; $('#dText').textContent=e.t;
  $('#dStats').innerHTML=`<dt>Days kept</dt><dd>${S.kept.filter(Boolean).length} of ${DAYS.length}</dd><dt>Joy</dt><dd>${Math.round(S.joy)}</dd><dt>Doors opened</dt><dd>${S.total} · ${S.order.length} of 14 kinds</dd><dt>The habit</dt><dd>${Math.round(S.habit*100)}%</dd><dt>Times I lost control</dt><dd>${S.lost}</dd>`;
  $('#dLessons').innerHTML=S.order.slice(0,5).map(id=>{ const s=SUB[id]; return `<div class="lesson" style="--c:${s.a}"><i></i><span><small>${s.name}</small>${s.lesson}</span></div>`; }).join('');
  const arr=postMat.uniforms.uShard.value, cols=S.order.slice(0,5).map(id=>SUB[id].a); if(!cols.length) cols.push('#ffb46a','#ff6a8a','#b9b4ff');
  cols.forEach((c,i)=>arr.set(hex3(c),i*3)); postMat.uniforms.uShardN.value=cols.length;
  S.doses=[]; C=null; $('#lost').classList.remove('on'); V.dawn=0; S.endT=0;
  if(good){ setMusic(DAWN_MUS); sFinal(); } else { setMusic(HUB_MUS); sDown(); }
  S.phase='end'; show('dawn'); $('#dEnd').classList.add('on'); setTimeout(()=>sndMe('end'+endKind[0].toUpperCase()+endKind.slice(1)),1200);
}

/* ---------- hud ---------- */
function hudTasks(){
  $('#hTasks').innerHTML=TASKS.filter(t=>S.day>=t.day).map(t=>`<li class="${S.done[t.id]?'done':''}"><i></i>${t.name}</li>`).join('');
}
let capTimer=0;
function caption(txt,dur=5){ sndStory(txt); const el=$('#tCap'); el.textContent=txt; el.classList.add('on'); clearTimeout(capTimer); capTimer=setTimeout(()=>el.classList.remove('on'),dur*1000); }
let gainT=0;
function popGain(v){ const now=performance.now(); if(now-gainT<120) return; gainT=now; const el=$('#tGain'); el.textContent='+'+(Math.round(v*10)/10); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
function hud(){
  const h=8+16*S.clock/DAYLEN, hh=Math.floor(h), mm=Math.floor((h-hh)*60/10)*10;
  $('#hDay').textContent=`${DAYS[S.day]} · ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`; $('#hDay').classList.toggle('late',h>=21);
  $('#hStage').textContent=STAGES[stage()];
  const g=goalNow(), met=S.dayJoy>=g;
  $('#hJoy').textContent=Math.round(S.dayJoy); $('#hGoal').textContent='/ '+g;
  $('#oBar').style.transform=`scaleX(${clamp(S.dayJoy/g)})`; $('#obj').classList.toggle('met',met);
  if(met&&!S.goalSaid){ S.goalSaid=true; caption(STORY.goal,5); sShard(); S.bed.ring.material.color.setHex(0xffb46a); }
  $('#oText').textContent=met?'Goal kept. Get to bed before midnight, or stay up for more.':`Reach ${g} joy, then sleep before midnight.`;
  const tg=target(), dx=tg.x-P.x, dz=tg.z-P.z, dd=Math.hypot(dx,dz);
  let a=Math.atan2(-dx,-dz)-yaw; a=Math.atan2(Math.sin(a),Math.cos(a));
  const mk=$('#mark'); mk.style.left=(50-clamp(a/.9,-1,1)*24)+'%'; mk.classList.toggle('edge',Math.abs(a)>.9);
  $('#mText').textContent=(Math.abs(a)>.9?(a>0?'‹ ':'')+tg.name+(a<0?' ›':''):tg.name)+' · '+Math.round(dd)+' m';
  [...$('#dGems').children].forEach((el,i)=>{ el.className=S.kept[i]===true?'on':S.kept[i]===false?'off':(i===S.day?'now':''); });
  const L=load(), lim=limit();
  $('#mWell').style.transform=`scaleX(${S.well})`;
  $('#mLoad').style.transform=`scaleX(${clamp(L/1.4)})`; $('#mLoad').classList.toggle('hot',L>lim*.85);
  $('#mLim').style.left=(lim/1.4*100)+'%';
  $('#mHab').style.transform=`scaleX(${clamp(S.habit)})`; $('#mHab').classList.toggle('hot',S.habit>.5);
  $('#mHome').style.transform=`scaleX(${clamp(S.worry/100)})`; $('#mHome').classList.toggle('hot',S.worry>=66);
  const pr=$('#prompt');
  if(near&&!C){ const p=promptFor(near); pr.classList.add('on'); $('#pText').textContent='Hold E · '+p.text; $('#pFill').style.transform=`scaleX(${clamp(hold)})`; }
  else pr.classList.remove('on');
}

/* ---------- frame ---------- */
function updPlay(dt){
  S.clock+=dt; if(S.shower>0) S.shower-=dt; if(S.cool>0) S.cool-=dt;
  for(const d of S.doses) d.t+=dt;
  S.doses=S.doses.filter(d=>d.t<d.dur);
  if(!S.doses.length) S.chain=0;
  musicFor();
  // standing still is not free: the well drains, faster the longer it goes and the deeper the habit
  S.idle=(S.idle||0)+dt;
  if(S.idle>18&&!C){ const k=1+(S.idle-18)/30; S.well=clamp(S.well-dt*.006*k*(1+S.habit*2)); if(!S.idleSaid){ S.idleSaid=true; caption(STORY.idle,4); } if(S.idle>45&&!S.itchSaid){ S.itchSaid=true; caption(STORY.itch,4); sndFx('heart',.6); } }
  // what the body will do
  let spd=1, acc=12, sway=0, lag=0;
  for(const d of S.doses){ const k=doseK(d), x=d.s.x; spd*=lerp(1,x.spd,k); acc=Math.min(acc,lerp(12,x.acc||12,k)); if(x.acc>12) acc=lerp(acc,x.acc,k); sway=Math.max(sway,(x.sway||0)*k); lag=Math.max(lag,(x.lag||0)*k); }
  if(S.well<.2) spd*=.7;
  const over=load()>limit()*.85;
  if(over) sway=Math.max(sway,.6);
  if(C){ autopilot(dt); if(C&&C.type!=='blackout'&&C.type!=='scramble'&&Math.hypot(P.vx,P.vz)>.5){ let a=Math.atan2(-P.vx,-P.vz)-yaw; a=Math.atan2(Math.sin(a),Math.cos(a)); yaw+=a*Math.min(1,6*dt); } }
  else { yaw+=((keys.ArrowLeft?1:0)-(keys.ArrowRight?1:0))*2.3*dt; if(sway>0) yaw+=Math.sin(G*1.1)*.35*sway*dt; }
  if(!C&&S.phase==='play'){
    let i=inputDir();
    if(lag>.05){ inputQ.push({t:G,x:i.x,z:i.z}); while(inputQ.length>1&&inputQ[1].t<G-lag) inputQ.shift(); i=inputQ[0]; } else inputQ.length=0;
    let tx=i.x, tz=i.z;
    if(sway>0){ const m=Math.hypot(tx,tz); tx+=Math.sin(G*1.7)*.7*sway*(m>0?1:.25); tz+=Math.cos(G*1.3)*.5*sway*(m>0?1:.25); }
    const sp=3.6*spd;
    P.vx+=(tx*sp-P.vx)*Math.min(1,acc*dt); P.vz+=(tz*sp-P.vz)*Math.min(1,acc*dt);
  }
  if(S.phase!=='play') return;
  P.x+=P.vx*dt; P.z+=P.vz*dt; resolve(P,P.r);
  for(const g of gates) if(S.day<g.day&&Math.hypot(g.x-P.x,g.z-P.z)<1.1&&!$('#tCap').classList.contains('on')) caption(STORY.locked[g.day],2.5);
  const v=Math.hypot(P.vx,P.vz); if(v>.2){ P.face=Math.atan2(P.vx,P.vz); P.walk+=v*dt; }
  // interaction
  for(const t of TASKS) if(S.done[t.id]) t.beam.visible=false;
  S.bed.beam.visible=S.dayJoy>=goalNow();
  near=C?null:findNear();
  if(near&&(keys.KeyE||keys.Space)){ hold+=dt/promptFor(near).time; if(hold>=1){ hold=0; keys.KeyE=keys.Space=false; act(near); } } else hold=Math.max(0,hold-dt*2);
  if(S.phase!=='play') return;
  // lights that only show when something is in your blood
  for(const d of S.doses){
    if(d.motes>0&&d.t>1.5){ d.spawn-=dt; if(d.spawn<=0){ d.spawn=.5; const m=motes.find(o=>!o.on); if(m){ for(let k=0;k<8;k++){ const a=R(TAU), r=R(1.6,5), x=P.x+Math.cos(a)*r, z=P.z+Math.sin(a)*r; if(x>.5&&x<19.5&&z>.5&&z<21.5&&los(P.x,P.z,x,z)){ m.on=true; m.x=x; m.z=z; m.life=9; m.m.visible=true; m.m.material.color.setHex(hexN(Math.random()<.5?d.s.a:d.s.b)); d.motes--; break; } } } } }
  }
  for(const m of motes) if(m.on){
    m.life-=dt; m.m.position.set(m.x,1+.25*Math.sin(G*2+m.ph),m.z); m.m.scale.setScalar(1+.3*Math.sin(G*5+m.ph));
    if(Math.hypot(m.x-P.x,m.z-P.z)<.75){ m.on=false; m.m.visible=false; addJoy(1); sCollect(); }
    else if(m.life<=0){ m.on=false; m.m.visible=false; }
  }
  for(const n of npcs) updNpc(n,dt);
  // thresholds
  const st=stage();
  if(st!==S.stage){ if(st>S.stage) caption(st===1?'They had started to notice.':'Now they were watching me.',4.5); S.stage=st; }
  if(!C) checkLoss();
  if(S.worry>=100&&S.phase==='play'){ S.worry=100; for(const n of npcs) if(S.day>=n.d.day) say(n,'We need to talk. Now.',5); if(!fadeTo){ C={type:'blackout',t:0}; $('#lost').classList.remove('on'); fadeTo=()=>finish('known'); } }
  else if(S.habit>=1&&S.phase==='play'&&!fadeTo){ C={type:'blackout',t:0}; fadeTo=()=>finish('hooked'); }
  else if(S.clock>=DAYLEN&&S.phase==='play'&&!fadeTo&&!C){ caption('Midnight. I fell asleep where I was standing.',4); endDay(false); }
  hud();
}
function lookNow(dt){
  const u=postMat.uniforms; let A=null,B=null,ka=0,kb=0;
  const ev={wob:0,kal:0,trail:0,ca:.0015,dbl:0,scan:0,pix:0,zoom:0,vig:.28,ov:0}; let sat=1;
  for(const d of S.doses){
    const k=doseK(d), x=d.s.x, w=k*d.load;
    if(w>ka){ B=A; kb=ka; A=d; ka=w; } else if(w>kb){ B=d; kb=w; }
    for(const key in ev) if(x[key]) ev[key]=Math.max(ev[key],x[key]*k*(key==='vig'||key==='ca'?1:(REDUCE?.5:1)));
    sat+=((x.sat||1)-1)*k;
  }
  if(S.phase!=='play'&&S.phase!=='card'){ A=B=null; }
  const lossT=C&&C.type!=='blackout'?1:0;
  u.uK.value=A?ev.ov:0; u.uMA.value=A?A.s.i:0; u.uMB.value=B?B.s.i:-1; u.uMixB.value=A&&B?clamp(kb/Math.max(ka,.01)):0;
  u.uT.value=G; u.uG.value=G; u.uBeat.value=A?Math.exp(-((G*A.s.mus.bpm/60)%1)*5)*(REDUCE?.3:1):0;
  u.uAuxA.value=A&&A.s.id==='nc'?.5+.5*Math.sin(G*1.5):(A&&A.s.id==='mm'?(G*.35)%1.2:.5); u.uAuxB.value=.5;
  u.uWob.value=ev.wob+lossT*1.2+(load()>limit()*.85?.5:0); u.uKal.value=ev.kal; u.uTrail.value=Math.max(ev.trail,lossT*.8); u.uCA.value=ev.ca+lossT*.01;
  u.uDbl.value=ev.dbl*(.6+.4*Math.sin(G*1.7)); u.uScan.value=ev.scan; u.uPix.value=ev.pix*(.5+.5*Math.sin(G*.9)); u.uZoom.value=ev.zoom;
  u.uVig.value=Math.max(ev.vig,lossT*.6);
  sat*=lerp(.35,1,clamp(S.well/.4)); if(!A&&S.habit>.5) sat*=.7;
  u.uSat.value=S.phase==='card'?.5:sat;
  V.red*=Math.exp(-dt*1.6); V.flash*=Math.exp(-dt*3);
  if(!C||C.type!=='blackout') fade=Math.max(0,fade-dt*.8);
  u.uRed.value=V.red; u.uFlash.value=V.flash; u.uBlack.value=Math.max(fade,S.phase==='title'?.3:S.phase==='card'?.5:S.phase==='end'?.2:0); u.uSky.value=V.sky; u.uDawn.value=V.dawn;
  u.uPlayer.value.set(0,0);
}
let camX=10,camY=20,camZ=30;
function updScene(dt){
  // sun and lamps follow the clock
  const t=S.phase==='title'?.82:S.phase==='end'?(endKind==='level'||endKind==='clear'?.05:.9):clamp(S.clock/DAYLEN);
  const night=ease(clamp((t-.6)/.25)), morn=1-ease(clamp(t/.25));
  sun.intensity=lerp(1.1,.4,night); sun.color.setRGB(lerp(1,.5,night),lerp(lerp(.93,.8,morn),.6,night),lerp(lerp(.85,.6,morn),1,night));
  sun.position.set(10+Math.cos(t*Math.PI)*14,16,11-8+Math.sin(t*Math.PI)*4);
  hemi.intensity=lerp(.5,.34,night);
  for(const k in lamps){ const l=lamps[k]; const target=(l.userData.lit?1.7:.95)+night*.5; l.intensity+=(target-l.intensity)*Math.min(1,dt*2); }
  // sky
  const K=[[0x3b2fa0,0xff7ab8,0xffd08a],[0x1a1250,0xc0308f,0xff6a3a],[0x05041a,0x2a1260,0x7a2f8f]];
  const seg=t<.6?0:1, f2=seg?clamp((t-.6)/.3):t/.6, U=sky.material.uniforms, names=['top','mid','bot'];
  for(let i=0;i<3;i++){ const c0=K[seg][i], c1=K[seg+1][i]; U[names[i]].value.setRGB(lerp((c0>>16&255),(c1>>16&255),f2)/255,lerp((c0>>8&255),(c1>>8&255),f2)/255,lerp((c0&255),(c1&255),f2)/255); }
  scene.fog.color.copy(U.mid.value).multiplyScalar(.45); stars.material.opacity=night*.9; tickTex(G,night);
  // the player's body
  const d=dominant(), hi=d?doseK(d):0, fp=S.phase==='play'||S.phase==='card';
  player.g.position.set(P.x,0,P.z); player.body.visible=player.head.visible=false;
  if(d&&hi>.05){ pLight.color.setHex(hexN(d.s.a)); pLight.intensity=.8+1.6*hi; }
  else { pLight.color.setHex(0xffb46a); pLight.intensity=.8; }
  for(const id in tokens){ const tk=tokens[id]; tk.m.rotation.y=G*.8+tk.s.i; tk.m.position.y=.12*Math.sin(G*1.6+tk.s.i); }
  for(const tk of TASKS) tk.beam.material.opacity=.4+.2*Math.sin(G*3+tk.x);
  // camera
  let fov=46;
  if(!fp){
    const a=G*.07, f=Math.min(1,dt*1.2);
    camX+=(10+Math.cos(a)*27-camX)*f; camY+=((S.phase==='end'?10:17)-camY)*f; camZ+=(11+Math.sin(a)*27-camZ)*f;
    camera.position.set(camX,camY,camZ); camera.lookAt(10,1,11);
  } else {
    const v=Math.hypot(P.vx,P.vz); bob+=v*dt*1.9;
    const over=load()>limit()*.85?1:0, loss=C&&C.type!=='blackout'?1:0;
    const roll=(d&&!REDUCE?Math.sin(G*.8)*.06*hi*(d.s.x.wob||d.s.x.kal?2:1):0)+over*Math.sin(G*2.2)*.07+(C&&C.type==='scramble'?Math.sin(C.t*1.7)*.4:0)+loss*Math.sin(G*9)*.03;
    camera.position.set(P.x,1.52+Math.sin(bob*2)*.035*(v>.3?1:0)-(S.well<.2?.12:0),P.z);
    camera.rotation.set(pitch+(d&&!REDUCE?Math.sin(G*.6)*.04*hi:0),yaw,roll,'YXZ');
    camX=P.x; camY=8; camZ=P.z+10;
    fov=72+(d?hi*(7*Math.sin(G*.6)+(d.s.x.spd>1.2?10:0)):0);
  }
  if(Math.abs(camera.fov-fov)>.05){ camera.fov=fov; camera.updateProjectionMatrix(); }
}
function show(id){ if(id!=='play'&&document.pointerLockElement){ try{ document.exitPointerLock(); }catch(e){} } document.querySelectorAll('.scr').forEach(el=>el.classList.toggle('on',el.id===id)); }
let last=0;
function frame(now){
  const raw=(now-last)/1000; last=now; const dt=Math.min(.05,Math.max(.001,raw)); G+=dt;
  if(raw>.034&&raw<.5) slow+=dt; else slow=Math.max(0,slow-dt*.5);
  if(slow>3&&q>.5){ q*=.8; slow=0; resize(); }
  if(S.phase==='play') updPlay(dt);
  else if(S.phase==='end'){ S.endT+=dt; const good=endKind==='level'||endKind==='clear'; V.sky+=((good?.8:.0)-V.sky)*Math.min(1,dt*.5); V.dawn=good?ease(clamp(S.endT/14)):0; for(const n of npcs) n.el.classList.remove('on'); }
  else if(S.phase==='title'){ V.sky=0; }
  if(S.phase!=='end') V.sky*=Math.exp(-dt*2);
  updScene(dt); lookNow(dt); sndTick(dt); render();
  requestAnimationFrame(frame);
}

/* ---------- wiring ---------- */
function resetAll(){
  Object.assign(S,{well:1,habit:0,worry:0,joy:0,total:0,taken:{},lost:0,stage:0,flatSaid:false,blackout:false,order:[],kept:[]});
  V.sky=0; V.dawn=0; SND.me={}; $('#dEnd').classList.remove('on'); startDay(0);
}
function boot(){
  if(!window.THREE){ fail('The 3D library did not load. Check the connection and reload.'); return; }
  try{
    renderer=new THREE.WebGLRenderer({canvas:cv,antialias:false,powerPreference:'high-performance'});
    if(!renderer.capabilities.isWebGL2) usePost=false;
    renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    buildWorld(); mkPost(); resize(); BL=blockers();
    for(const n of npcs) n.f.g.visible=false;
  }catch(e){ fail('Could not start 3D: '+e.message); return; }
  addEventListener('resize',resize);
  addEventListener('keydown',e=>{ if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)&&S.phase==='play') e.preventDefault(); if(!e.repeat) keys[e.code]=true; });
  addEventListener('keyup',e=>{ keys[e.code]=false; });
  addEventListener('blur',()=>{ for(const k in keys) keys[k]=false; });
  $('#begin').addEventListener('click',e=>{ e.currentTarget.blur(); auStart(); sndStart(); sWhoosh(); resetAll(); });
  $('#back').addEventListener('click',e=>{ e.currentTarget.blur(); sSelect(0); if(S.day>=DAYS.length-1) finish(); else startDay(S.day+1); });
  $('#again').addEventListener('click',e=>{ e.currentTarget.blur(); resetAll(); });
  $('#snd').addEventListener('click',e=>{ auStart(); auMute(!AU.muted); e.currentTarget.textContent=AU.muted?'Sound off':'Sound on'; e.currentTarget.blur(); });
  let drag=false;
  document.addEventListener('pointerlockchange',()=>{ locked=document.pointerLockElement===cv; $('#look').classList.toggle('off',locked); });
  addEventListener('mousemove',e=>{ if(S.phase!=='play'||!(locked||drag)) return; yaw-=e.movementX*.0024; pitch=clamp(pitch-e.movementY*.0024,-1.1,1.1); });
  addEventListener('mousedown',e=>{ if(S.phase!=='play'||(e.target.closest&&e.target.closest('button,.prompt'))) return; drag=true; try{ const pr=cv.requestPointerLock(); if(pr&&pr.catch) pr.catch(()=>{}); }catch(_){} });
  addEventListener('mouseup',()=>{ drag=false; });
  // touch: drag to walk and turn, press the prompt to act
  let tid=null,sx0=0,sy0=0;
  addEventListener('pointerdown',e=>{ if(e.pointerType==='mouse'||S.phase!=='play'||(e.target.closest&&e.target.closest('button,.prompt'))) return; tid=e.pointerId; sx0=e.clientX; sy0=e.clientY; });
  addEventListener('pointermove',e=>{ if(e.pointerId!==tid) return; const dx=e.clientX-sx0, dy=e.clientY-sy0; keys.ArrowRight=dx>24; keys.ArrowLeft=dx<-24; keys.KeyS=dy>24; keys.KeyW=dy<-24; });
  addEventListener('pointerup',e=>{ if(e.pointerId===tid){ tid=null; keys.ArrowRight=keys.ArrowLeft=keys.KeyS=keys.KeyW=false; } });
  const pr=$('#prompt'); pr.addEventListener('pointerdown',e=>{ e.preventDefault(); keys.KeyE=true; }); pr.addEventListener('pointerup',()=>{ keys.KeyE=false; }); pr.addEventListener('pointerleave',()=>{ keys.KeyE=false; });
  last=performance.now(); requestAnimationFrame(frame);
}
function fail(msg){ const el=$('#nogl'); el.hidden=false; el.textContent=msg; }
addEventListener('error',e=>{ if(S.phase==='title'&&!renderer) fail('Something went wrong starting the game: '+e.message); else console.error(e.message); const el=$('#err'); if(el){ el.hidden=false; el.textContent='Error: '+e.message+' (line '+e.lineno+')'; } });
window.__h={setYaw(v){ yaw=v; },S,P,takeDose,startDay,endDay,finish,startLoss,load,limit,npcs,get C(){return C;},SUB,TASKS,doTask,updPlay};
boot();
