/* ---------- generated props: Meshy GLB models, fitted into the house ---------- */
const ASSETS='3d/assets/';
const propCache={}, propAnims={};
function loadProp(name){
  if(!propCache[name]) propCache[name]=new Promise((ok,bad)=>{
    if(!THREE.GLTFLoader){ bad(new Error('no loader')); return; }
    new THREE.GLTFLoader().load(ASSETS+name+'.glb',g=>{ propAnims[name]=g.animations||[]; ok(g.scene); },undefined,bad);
  });
  return propCache[name];
}
// size:[w,h,d] (null = keep proportions from the others). ry = facing. tint = emissive wash for the neon look.
function prop(name,x,z,o={}){
  const [w,h,d]=o.size, holder=new THREE.Group(); holder.position.set(x,o.y||0,z); holder.rotation.y=o.ry||0; scene.add(holder);
  if(o.solid){ const a=Array.isArray(o.solid)?o.solid:o.solid===true?[w||d,d||w]:[o.solid,o.solid], rot=Math.abs(Math.sin(o.ry||0))>.5, sw=rot?a[1]:a[0], sd=rot?a[0]:a[1]; solids.push([x-sw/2,z-sd/2,x+sw/2,z+sd/2]); }
  const fallback=box(w||d||.5,h||.6,d||w||.5,0,(h||.6)/2,0,o.fb||0x3a3350,{solid:false}); scene.remove(fallback); holder.add(fallback);
  loadProp(name).then(src=>{
    const m=propAnims[name].length&&THREE.SkeletonUtils?THREE.SkeletonUtils.clone(src):src.clone(true), bb=propBounds(m), sz=new THREE.Vector3(); bb.getSize(sz);
    const want=[w,h,d], have=[sz.x,sz.y,sz.z], sc=[0,1,2].map(i=>want[i]?want[i]/Math.max(1e-4,have[i]):null);
    const base=Math.min(...sc.filter(v=>v!==null)); for(let i=0;i<3;i++) if(sc[i]===null) sc[i]=base;
    if(o.uniform){ const u=Math.min(...sc); sc[0]=sc[1]=sc[2]=u; }
    m.scale.set(sc[0],sc[1],sc[2]);
    const c=new THREE.Vector3(); bb.getCenter(c); m.position.set(-c.x*sc[0],-bb.min.y*sc[1],-c.z*sc[2]);
    m.traverse(n=>{ if(n.isMesh){ n.castShadow=!o.flat; n.receiveShadow=true; styleProp(n,o); } });
    holder.remove(fallback); holder.add(m); if(o.ready) o.ready(m,propAnims[name]);
  }).catch(e=>console.warn('prop',name,e.message||e));
  return holder;
}
// skinned meshes report unposed geometry bounds; measure the skeleton instead
function propBounds(m){
  m.updateMatrixWorld(true);
  const bb=new THREE.Box3(), v=new THREE.Vector3(); let bones=0;
  m.traverse(n=>{ if(n.isBone){ bones++; bb.expandByPoint(n.getWorldPosition(v)); } });
  if(bones>3){ const h=bb.max.y-bb.min.y; bb.max.y+=h*.1; bb.min.y-=h*.04; return bb; }
  return new THREE.Box3().setFromObject(m);
}
function styleProp(n,o){
  const mats=Array.isArray(n.material)?n.material:[n.material];
  n.material=mats.map(mt=>{
    const m=mt.clone(); m.side=THREE.FrontSide; m.roughness=Math.max(.55,m.roughness??.8); m.metalness=Math.min(.35,m.metalness??0); m.envMapIntensity=.7;
    if(m.map) m.map.encoding=THREE.LinearEncoding; // the scene renders linear; keep the albedo as painted
    if(o.tint!==undefined){ m.emissive=new THREE.Color(o.tint); m.emissiveIntensity=o.ei??.35; m.emissiveMap=null; }
    else if(m.emissiveMap){ m.emissive=new THREE.Color(0xffffff); m.emissiveIntensity=1.2; }
    else { m.emissive=new THREE.Color(0x2a1f4a); m.emissiveIntensity=.35; }
    return m;
  });
  if(n.material.length===1) n.material=n.material[0];
}
// a soft neon-horizon environment so PBR metal and glass have something to reflect
function mkEnv(){
  const W=64,H=32,data=new Uint8Array(W*H*3);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const t=y/(H-1), i=(y*W+x)*3; // t=0 top
    let r,g,b;
    if(t<.5){ const k=t/.5; r=lerp(10,110,k); g=lerp(8,40,k); b=lerp(40,150,k); }
    else if(t<.58){ const k=(t-.5)/.08; r=lerp(110,255,k); g=lerp(40,70,k); b=lerp(150,170,k); }
    else { const k=(t-.58)/.42; r=lerp(60,8,k); g=lerp(30,7,k); b=lerp(70,14,k); }
    data[i]=r; data[i+1]=g; data[i+2]=b;
  }
  const tex=new THREE.DataTexture(data,W,H,THREE.RGBFormat); tex.mapping=THREE.EquirectangularReflectionMapping; tex.needsUpdate=true;
  const pm=new THREE.PMREMGenerator(renderer); const env=pm.fromEquirectangular(tex).texture; pm.dispose(); tex.dispose();
  return env;
}
