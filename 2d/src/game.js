'use strict';
/* ---------- helpers ---------- */
const TAU=Math.PI*2;
const clamp=(x,a=0,b=1)=>x<a?a:x>b?b:x, lerp=(a,b,t)=>a+(b-a)*t, ease=t=>t*t*(3-2*t);
const R=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
const hex3=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
const $=s=>document.querySelector(s);
const HUES=['#ff3b3b','#ff8a1f','#ffd60a','#b6ff3c','#35d07f','#00e5c8','#00b7ff','#3d6bff','#8a3dff','#d14dff','#ff2e93','#ff5c8a'];
const JEWEL=['#ffcf3a','#e0115f','#10c98f','#2a5cff','#ff7a1a','#c04dff'];
const REDUCE=matchMedia('(prefers-reduced-motion: reduce)').matches;
const DEF={decay:.92,zoom:0,rot:0,flow:.004,dx:0,dy:0,ca:.004,vig:.3,wob:0,scan:0,bloom:1,sat:1.1,grain:.03};

/* ---------- state ---------- */
const S={phase:'title',well:1,tide:0,shards:[],visits:{},total:0,opened:0,sel:[]};
const P={x:0,y:0,vx:0,vy:0,r:22,glow:1,jx:0,jy:0};
const ptr={x:0,y:0}, tgt={x:0,y:0};
const V={};
const B={on:false,p:0,ex:0,gain:0};
const DBG={bot:false};
let wipe=0;
let T=null, D=null, G=0, W=1280, H=720, U=1, asp=16/9, q=1, kShow=0, lastModes=[0,-1], slow=0;

/* ---------- gl ---------- */
const cv=$('#gl');
const gl=cv.getContext('webgl2',{antialias:false,alpha:false,powerPreference:'high-performance'});
const spr=document.createElement('canvas'), sx=spr.getContext('2d');
let PM,PF,sprTex,fb=[],vao;
function shader(type,src){
  const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){ console.error(gl.getShaderInfoLog(s)); throw new Error('shader compile'); }
  return s;
}
function program(fs){
  const p=gl.createProgram();
  gl.attachShader(p,shader(gl.VERTEX_SHADER,VERT)); gl.attachShader(p,shader(gl.FRAGMENT_SHADER,fs));
  gl.bindAttribLocation(p,0,'aP'); gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)){ console.error(gl.getProgramInfoLog(p)); throw new Error('link'); }
  const u={}, n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);
  for(let i=0;i<n;i++){ const info=gl.getActiveUniform(p,i); u[info.name.replace('[0]','')]=gl.getUniformLocation(p,info.name); }
  return {p,u};
}
let HALF=false;
function mkTex(w,h,mip){
  const t=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,t);
  if(mip&&HALF) gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,w,h,0,gl.RGBA,gl.HALF_FLOAT,null);
  else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,mip?gl.LINEAR_MIPMAP_LINEAR:gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  if(mip) gl.generateMipmap(gl.TEXTURE_2D);
  return t;
}
function glInit(){
  PM=program(FRAG_MAIN); PF=program(FRAG_FB);
  HALF=!!gl.getExtension('EXT_color_buffer_float');
  if(HALF){ // make sure this GPU can really render and mipmap half-float
    const t=mkTex(4,4,true), f=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE||gl.getError()!==gl.NO_ERROR) HALF=false;
    gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.deleteFramebuffer(f); gl.deleteTexture(t);
  }
  vao=gl.createVertexArray(); gl.bindVertexArray(vao);
  const b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
}
function resize(){
  const w=Math.max(2,cv.clientWidth), h=Math.max(2,cv.clientHeight);
  const ox=W, oy=H;
  asp=w/h; H=h<560?540:720; W=Math.max(2,Math.round(H*asp)); U=H/720;
  spr.width=W; spr.height=H;
  const s=Math.min(Math.min(devicePixelRatio||1,2),Math.sqrt(1.7e6/(w*h)))*q;
  cv.width=Math.max(2,Math.round(w*s)); cv.height=Math.max(2,Math.round(h*s));
  for(const f of fb){ gl.deleteTexture(f.t); gl.deleteFramebuffer(f.f); }
  if(sprTex) gl.deleteTexture(sprTex);
  sprTex=mkTex(W,H,false);
  fb=[0,1].map(()=>{
    const t=mkTex(W,H,true), f=gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER,f); gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);
    gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT);
    return {t,f};
  });
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  P.x*=W/ox; P.y*=H/oy; ptr.x*=W/ox; ptr.y*=H/oy;
}
const toP=(x,y)=>[(x/W*2-1)*asp,-(y/H*2-1)];
function render(){
  gl.bindVertexArray(vao);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,sprTex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,spr);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  // trails
  gl.bindFramebuffer(gl.FRAMEBUFFER,fb[1].f); gl.viewport(0,0,W,H); gl.useProgram(PF.p);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,fb[0].t);
  let u=PF.u;
  gl.uniform1i(u.uSpr,0); gl.uniform1i(u.uPrev,1);
  gl.uniform1f(u.uDecay,wipe>0?0:V.decay); if(wipe>0) wipe--; gl.uniform1f(u.uZoom,V.zoom); gl.uniform1f(u.uRot,V.rot); gl.uniform1f(u.uFlow,V.flow);
  gl.uniform1f(u.uT,G); gl.uniform1f(u.uAsp,asp); gl.uniform2f(u.uDrift,V.dx,V.dy);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  gl.bindTexture(gl.TEXTURE_2D,fb[1].t); gl.generateMipmap(gl.TEXTURE_2D);
  // the world
  gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.viewport(0,0,cv.width,cv.height); gl.useProgram(PM.p);
  u=PM.u;
  gl.uniform1i(u.uFb,1);
  gl.uniform2f(u.uRes,cv.width,cv.height);
  const pp=toP(P.x,P.y);
  gl.uniform2f(u.uPlayer,pp[0],pp[1]); gl.uniform2f(u.uVc,V.focus?pp[0]:0,V.focus?pp[1]:0);
  gl.uniform1f(u.uT,V.t); gl.uniform1f(u.uG,G); gl.uniform1f(u.uK,V.k); gl.uniform1f(u.uBeat,V.beat);
  gl.uniform1f(u.uAuxA,V.auxA); gl.uniform1f(u.uAuxB,V.auxB); gl.uniform1f(u.uDawn,V.dawn);
  gl.uniform1i(u.uMA,V.mA); gl.uniform1i(u.uMB,V.mB);
  const car=carried(); gl.uniform1i(u.uShardN,car.length);
  if(car.length){ const a=new Float32Array(15); car.forEach((id,i)=>a.set(hex3(SUB[id].a),i*3)); gl.uniform3fv(u.uShard,a); }
  gl.uniform1f(u.uCA,V.ca); gl.uniform1f(u.uSat,V.sat); gl.uniform1f(u.uVig,V.vig); gl.uniform1f(u.uWob,V.wob);
  gl.uniform1f(u.uScan,V.scan); gl.uniform1f(u.uDbl,V.dbl); gl.uniform1f(u.uBloom,V.bloom);
  gl.uniform1f(u.uBlack,V.black); gl.uniform1f(u.uFlash,V.flash); gl.uniform1f(u.uGrain,V.grain);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  fb.reverse();
}
const carried=()=>S.shards.slice(-5);

/* ---------- sprites ---------- */
const glowCache={};
function glowSpr(col){
  let c=glowCache[col];
  if(!c){
    c=document.createElement('canvas'); c.width=c.height=64;
    const g=c.getContext('2d'), gr=g.createRadialGradient(32,32,0,32,32,32);
    gr.addColorStop(0,'#ffffff'); gr.addColorStop(.16,col); gr.addColorStop(.5,col+'50'); gr.addColorStop(1,col+'00');
    g.fillStyle=gr; g.fillRect(0,0,64,64); glowCache[col]=c;
  }
  return c;
}
function glow(x,y,r,col,a=1){ if(a<=0||r<=0) return; sx.globalAlpha=Math.min(1,a); sx.drawImage(glowSpr(col),x-r,y-r,r*2,r*2); }
let parts=[];
function burst(x,y,col,n){
  for(let i=0;i<n;i++){ const a=R(TAU), v=R(60,240)*U; parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:R(.4,.9),age:0,col}); }
  if(parts.length>500) parts.splice(0,parts.length-500);
}
function updParts(dt){
  for(const p of parts){ p.age+=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=1-2.2*dt; p.vy*=1-2.2*dt; }
  parts=parts.filter(p=>p.age<p.life);
}
function drawParts(){ for(const p of parts) glow(p.x,p.y,7*U,p.col,1-p.age/p.life); }
function drawComet(col,g=1){
  glow(P.x+P.jx,P.y+P.jy,56*U*g,col,.9);
  glow(P.x+P.jx,P.y+P.jy,22*U*Math.max(.5,g),'#ffffff',1);
}

/* ---------- inside a door ---------- */
function mote(o){ const m=Object.assign({x:0,y:0,vx:0,vy:0,r:9*U,val:1,col:'#ffffff',age:0},o); T.motes.push(m); return m; }
const count=o=>{ let n=0; for(const m of T.motes) if(m.o===o&&!m.dead) n++; return n; };
const beat=bpm=>Math.exp(-((T.t*bpm/60)%1)*5);
function thread(x,t){ const px=(x/W*2-1)*asp; return H/2-(.30*Math.sin(px*1.3+t*.8)+.13*Math.sin(px*3.1-t*1.3))*H/2; }
function collect(m){
  if(m.dead) return; m.dead=true;
  const v=m.val*T.yield*T.mult;
  T.light+=v; burst(m.x,m.y,m.col,8); sCollect(); if(v>0) popGain(v);
  const b=BEH[m.o]; if(b.onCollect) b.onCollect(T.st[m.o],m);
}

const BEH={
  md:{ init(st){ st.sp=0; },
    update(st,dt,s){
      st.sp-=dt;
      if(st.sp<=0&&count('md')<24){ st.sp=.3; mote({o:'md',x:R(.08,.92)*W,y:R(.1,.9)*H,vx:R(-12,12)*U,vy:R(-12,12)*U,col:R()<.5?s.a:s.b}); }
      const pulse=beat(124); T.beat=Math.max(T.beat,pulse);
      for(const m of T.motes) if(m.o==='md'){
        const dx=P.x-m.x, dy=P.y-m.y, dd=Math.hypot(dx,dy)+1, reach=340*U;
        if(dd<reach){ const f=((260+900*pulse)*(1-dd/reach)+60)*U; m.vx+=dx/dd*f*dt; m.vy+=dy/dd*f*dt; }
        m.vx*=1-1.2*dt; m.vy*=1-1.2*dt;
      }
    } },
  ps:{ init(st){ st.sp=0; st.g=0; },
    update(st,dt){
      st.sp-=dt;
      if(st.sp<=0&&count('ps')<36){
        st.sp=1.1; const g=++st.g, rad=R(.14,.46)*H, a0=R(TAU), w=R(.08,.22)*(R()<.5?-1:1), ph=R(TAU), col=HUES[(g*5)%12];
        for(let i=0;i<6;i++) mote({o:'ps',g,rad,rad0:rad,ang:a0+i*TAU/6,w,ph,col});
      }
      for(const m of T.motes) if(m.o==='ps'){
        m.ang+=m.w*dt*T.timeScale; m.rad=m.rad0*(1+.12*Math.sin(T.t*.6+m.ph));
        m.x=W/2+Math.cos(m.ang)*m.rad; m.y=H/2+Math.sin(m.ang)*m.rad;
      }
    },
    onCollect(st,m){
      let n=0;
      for(const o of T.motes) if(o.o==='ps'&&o.g===m.g&&!o.dead){ o.dead=true; n++; T.light+=o.val*T.yield*T.mult; burst(o.x,o.y,o.col,6); }
      if(n&&T.yield>0) popGain((n+1)*T.yield*T.mult);
    },
    draw(){
      const dx=P.x-W/2, dy=P.y-H/2;
      for(let i=1;i<6;i++){ const a=i*TAU/6,c=Math.cos(a),s=Math.sin(a); glow(W/2+dx*c-dy*s,H/2+dx*s+dy*c,30*U,'#ffffff',.5); }
    } },
  cn:{ init(st){ st.sp=0; st.f=[.42,.74]; },
    update(st,dt,s){
      T.timeScale=Math.min(T.timeScale,.55);
      st.sp-=dt;
      if(st.sp<=0&&count('cn')<12){ st.sp=1.2; mote({o:'cn',x:R(.1,.9)*W,y:R(.15,.9)*H,vx:R(-10,10)*U,vy:R(-22,-6)*U,col:R()<.6?s.a:s.b,r:17*U,val:2,ph:R(TAU)}); }
      for(const m of T.motes) if(m.o==='cn'){
        m.vx+=Math.sin(T.t*.7+m.ph)*10*U*dt; m.vx*=1-.8*dt; m.vy+=(-14*U-m.vy)*dt*.9;
        if(m.y<-30*U) m.y=H+20*U;
        if(m.x<-30*U) m.x=W+20*U; else if(m.x>W+30*U) m.x=-20*U;
      }
      if(st.f.length&&T.t/T.dur>st.f[0]){
        st.f.shift(); caption('…wait. What was I doing?',3.2); T.flash=Math.max(T.flash,.1);
        for(const m of T.motes) if(m.o==='cn'){ m.vx=R(-420,420)*U; m.vy=R(-420,420)*U; }
      }
    } },
  al:{ init(st){ st.sp=0; },
    update(st,dt,s){
      const ramp=ease(clamp((T.t-7)/13));
      tgt.x+=(Math.sin(T.t*1.3)*150+Math.sin(T.t*2.9)*40)*U*ramp; tgt.y+=Math.cos(T.t*1.1)*90*U*ramp;
      T.dbl=Math.max(T.dbl,ramp*.013*(.6+.4*Math.sin(T.t*1.7))); T.wob=Math.max(T.wob,ramp*1.1);
      AU.wob=30+60*ramp;
      st.sp-=dt;
      if(st.sp<=0&&count('al')<22){
        st.sp=.42; const early=T.t<10;
        mote({o:'al',x:R(.06,.94)*W,y:H+20*U,vy:-R(70,130)*U,col:early?'#ffd27a':(R()<.5?s.a:s.b),r:(early?12:9)*U,val:early?2:1,ph:R(TAU)});
      }
      for(const m of T.motes) if(m.o==='al'){ m.x+=Math.sin(T.t*2+m.ph)*30*U*dt; if(m.y<-30*U) m.dead=true; }
    } },
  kt:{ init(st){ st.q=[]; st.sp=0; st.hole=0; },
    update(st,dt,s){
      st.q.push({x:ptr.x,y:ptr.y,t:T.t});
      while(st.q.length>2&&st.q[1].t<T.t-.65) st.q.shift();
      tgt.x=st.q[0].x; tgt.y=st.q[0].y;
      st.sp-=dt;
      if(st.sp<=0&&count('kt')<8){ st.sp=1.5; const rad=R(.2,.46)*H; mote({o:'kt',rad,ang:R(TAU),w:(R()<.5?-1:1)*R(.12,.3),col:R()<.7?s.a:'#ffffff',r:11*U,val:3}); }
      for(const m of T.motes) if(m.o==='kt'){ if(!T.freeze) m.ang+=m.w*dt; m.x=W/2+Math.cos(m.ang)*m.rad*1.25; m.y=H/2+Math.sin(m.ang)*m.rad; }
      if(st.hole<=0&&T.t>4&&T.t<T.dur-4&&Math.hypot(P.x-W/2,P.y-H/2)<.2*H/2){ st.hole=2.2; caption('I was nowhere for a while.',2.8); sBlack(); }
      if(st.hole>0){
        st.hole-=dt; T.flash=Math.max(T.flash,Math.sin(clamp(st.hole/2.2)*Math.PI)*.95); T.freeze=true;
        if(st.hole<=0){ const a=R(TAU); P.x=W/2+Math.cos(a)*H*.4; P.y=H/2+Math.sin(a)*H*.4; P.vx=P.vy=0; }
      }
    },
    draw(st,s){
      sx.globalAlpha=.55; sx.strokeStyle=s.a; sx.lineWidth=1.3*U;
      sx.beginPath(); sx.moveTo(ptr.x,ptr.y); sx.lineTo(P.x,P.y); sx.stroke();
      sx.beginPath(); sx.arc(ptr.x,ptr.y,9*U,0,TAU); sx.stroke(); sx.globalAlpha=1;
    } },
  cf:{ init(st){ st.sp=0; st.i=0; st.c={x:W/2,y:H/2,r:H*.28}; },
    update(st,dt,s){
      st.sp-=dt;
      if(st.sp<=0){
        st.sp=.44; st.i++;
        if(st.i%9===0) st.c={x:R(.25,.75)*W,y:R(.3,.7)*H,r:R(.14,.3)*H};
        const a=st.i*.62;
        mote({o:'cf',x:st.c.x+Math.cos(a)*st.c.r,y:st.c.y+Math.sin(a)*st.c.r,col:st.i%2?s.a:s.b,life:2.6});
      }
      P.jx+=R(-1.8,1.8)*U; P.jy+=R(-1.8,1.8)*U;
    } },
  nc:{ init(st){ st.e=1; st.sp=0; st.es=1; },
    update(st,dt,s){
      st.e=Math.max(0,st.e-dt/4.2); T.aux.nc=st.e;
      st.sp-=dt;
      if(st.sp<=0&&count('nc')<16){ st.sp=.42; mote({o:'nc',k:'s',x:R(.08,.92)*W,y:H+15*U,vx:R(-8,8)*U,vy:-R(30,60)*U,col:s.b,ph:R(TAU)}); }
      st.es-=dt;
      let em=0; for(const m of T.motes) if(m.k==='e'&&!m.dead) em++;
      if(st.es<=0&&em<1){ st.es=1; mote({o:'nc',k:'e',x:R(.12,.88)*W,y:R(.18,.82)*H,col:s.a,r:13*U,val:0}); }
      for(const m of T.motes) if(m.o==='nc'&&m.k==='s'){
        m.x+=Math.sin(T.t+m.ph)*14*U*dt; m.can=st.e>.1; m.al=st.e>.1?1:.25; if(m.y<-20*U) m.dead=true;
      }
      P.glow=Math.min(P.glow,.3+.7*st.e);
    },
    onCollect(st,m){ if(m.k==='e'){ st.e=1; st.es=1.6; sBreath(1,.9); T.flash=Math.max(T.flash,.07); } } },
  co:{ init(st){ st.n=0; st.sp=0; },
    update(st,dt,s){
      const pr=clamp(T.t/T.dur);
      T.vig=Math.max(T.vig,.35+.6*pr); T.kMul=1+1.4*pr; AU.rate=1+.3*pr;
      st.sp-=dt;
      if(st.sp<=0&&count('co')<16){
        st.sp=lerp(.5,.16,pr); const sp=lerp(110,400,pr)*U, a=R(TAU);
        mote({o:'co',x:R(.08,.92)*W,y:R(.1,.9)*H,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,col:R()<.6?'#ffffff':s.a,r:8*U,bounce:true});
      }
      const v=Math.max(1,10-st.n);
      for(const m of T.motes) if(m.o==='co') m.val=v;
    },
    onCollect(st){ st.n++; } },
  ad:{ init(st){ st.list=[]; st.last=-9; st.m=1; },
    update(st,dt,s){
      st.list=st.list.filter(m=>!m.dead);
      if(!st.list.length){
        const cell=H/16, cols=3+((R()*2)|0), mi=Math.floor(W/2/cell)-2;
        const i0=Math.round(R(-mi,mi-cols*2)), j0=Math.round(R(-5,2));
        for(let r=0;r<2;r++) for(let c=0;c<cols;c++){
          const cc=r%2?cols-1-c:c;
          st.list.push(mote({o:'ad',x:W/2+(i0+cc*2)*cell,y:H/2+(j0+r*2)*cell,col:s.a,r:8*U}));
        }
      }
      st.list.forEach((m,i)=>{ m.can=i===0; m.al=i===0?1:.35; m.col=i===0?s.b:s.a; m.r=(i===0?12:7)*U; });
      if(T.t-st.last>1.8) st.m=1;
      T.mult=Math.max(T.mult,st.m); T.vig=Math.max(T.vig,.55); T.focus=true;
    },
    onCollect(st){ st.m=T.t-st.last<1.8?Math.min(2,st.m+.25):1; st.last=T.t; },
    draw(st,s){
      const L=st.list.filter(m=>!m.dead); if(!L.length) return;
      sx.lineWidth=1.5*U; sx.globalAlpha=.6; sx.strokeStyle=s.b;
      sx.beginPath(); sx.moveTo(P.x,P.y); sx.lineTo(L[0].x,L[0].y); sx.stroke();
      sx.globalAlpha=.3; sx.strokeStyle=s.a; sx.beginPath(); sx.moveTo(L[0].x,L[0].y);
      for(let i=1;i<L.length;i++) sx.lineTo(L[i].x,L[i].y);
      sx.stroke(); sx.globalAlpha=1;
    } },
  dx:{ init(st){ st.sp=0; st.s=0; },
    update(st,dt,s){
      st.sp-=dt;
      if(st.sp<=0){ st.sp=.55; mote({o:'dx',x:W+20*U,vx:-170*U,col:R()<.7?s.a:s.b}); }
      for(const m of T.motes) if(m.o==='dx'){ m.y=thread(m.x,T.t); if(m.x<-30*U) m.dead=true; }
      st.on=Math.abs(P.y-thread(P.x,T.t))<38*U;
      st.s=clamp(st.s+(st.on?dt/4:-dt*1.2));
      T.mult=Math.max(T.mult,1+st.s); T.aux.dx=st.s;
    },
    draw(st,s){ if(st.on) glow(P.x,thread(P.x,T.t),(30+34*st.s)*U,s.a,.85); } },
  xn:{ init(st){ st.next=7; st.b=0; st.sp=0; st.cut=false; },
    update(st,dt,s){
      T.timeScale=Math.min(T.timeScale,.6);
      st.sp-=dt;
      if(st.sp<=0&&count('xn')<9){ st.sp=1.3; mote({o:'xn',x:R(.1,.9)*W,y:R(.12,.88)*H,vx:R(-6,6)*U,vy:R(-6,6)*U,col:R()<.5?s.a:s.b,r:13*U}); }
      if(st.b<=0&&T.t>st.next&&T.t<T.dur-8){ st.b=2.6; st.cut=false; sBlack(); }
      if(st.b>0){
        const p=1-st.b/2.6; st.b-=dt;
        T.black=Math.max(T.black,Math.sqrt(Math.sin(clamp(p)*Math.PI)));
        if(p>.5&&!st.cut){ st.cut=true; for(const m of T.motes) m.dead=true; T.t+=3.5; }
        if(st.b<=0){ st.next=T.t+R(6,8); caption('I think some time went by.',2.4); }
      }
    } },
  cb:{ init(st){ st.tr=[]; st.sp=0; st.c=0; },
    update(st,dt,s){
      st.c+=dt; if(st.c>.03){ st.c=0; st.tr.push({x:P.x,y:P.y}); if(st.tr.length>70) st.tr.shift(); }
      st.sp-=dt;
      if(st.sp<=0&&count('cb')<22){ st.sp=.36; mote({o:'cb',x:R(.06,.94)*W,y:R(.1,.92)*H,col:[s.a,s.b,'#00f0ff'][(R()*3)|0]}); }
      if(T.freeze||V.black>.5) return;
      for(const m of T.motes) if(m.o==='cb'&&!m.dead&&m.age>.2){
        for(let i=0;i<st.tr.length;i+=3){ const p=st.tr[i]; if((p.x-m.x)**2+(p.y-m.y)**2<(m.r+12*U)**2){ collect(m); break; } }
      }
    },
    draw(st,s){
      const tr=st.tr, cols=[s.a,s.b,'#00f0ff']; sx.lineWidth=5*U; sx.lineCap='round';
      for(let i=1;i<tr.length;i++){
        sx.globalAlpha=i/tr.length*.9; sx.strokeStyle=cols[((i/8)|0)%3];
        sx.beginPath(); sx.moveTo(tr[i-1].x,tr[i-1].y); sx.lineTo(tr[i].x,tr[i].y); sx.stroke();
      }
      sx.globalAlpha=1;
    } },
  mm:{ init(st){ st.n=14; st.w=null; st.next=3.2; st.g=null; st.again=0; },
    update(st,dt,s){
      T.beat=Math.max(T.beat,beat(140)*.6);
      if(!st.w&&T.t>st.next&&T.t<T.dur-5){
        const n=Math.max(2,Math.round(st.n)); st.w={p:0};
        const ph=R(TAU);
        for(let i=0;i<n;i++) mote({o:'mm',x:(-.05-i*.035)*W,y:H*(.5+.3*Math.sin(i*.5+ph)),vx:1.1*W/2.8,col:i%2?s.a:s.b});
        sWhoosh(.5); st.n*=.58;
      }
      if(st.w){
        st.w.p+=dt/2.8; T.aux.mm=st.w.p;
        if(st.w.p>=1.15){ st.w=null; st.next=T.t+2.4; if(T.t<T.dur-9) st.g={x:R(.2,.8)*W,y:R(.25,.75)*H,t:3.4}; }
      } else T.aux.mm=-4;
      for(const m of T.motes) if(m.o==='mm'&&m.x>W+40*U) m.dead=true;
      if(st.g){
        st.g.t-=dt; T.gate=st.g;
        if(Math.hypot(P.x-st.g.x,P.y-st.g.y)<46*U){
          st.n=14; st.g=null; st.next=T.t+.3; S.well=clamp(S.well-.045); T.extra+=.045; T.flash=Math.max(T.flash,.22); sBoom();
          if(++st.again===3) caption('Again. Again. Again.',2.6);
        } else if(st.g.t<=0) st.g=null;
      }
    },
    draw(st,s){
      const g=st.g; if(!g) return;
      const r=(46+6*Math.sin(T.t*8))*U;
      sx.globalAlpha=clamp(g.t)*.9; sx.strokeStyle=s.a; sx.lineWidth=3*U;
      sx.beginPath(); sx.arc(g.x,g.y,r,0,TAU); sx.stroke(); sx.globalAlpha=1;
      glow(g.x,g.y,r*1.6,s.b,.3*clamp(g.t));
    } },
  dm:{ init(st){ st.o=0; st.sp=0; st.lx=ptr.x; st.ly=ptr.y; st.ap=26*U; },
    update(st,dt){
      const sp=Math.hypot(ptr.x-st.lx,ptr.y-st.ly)/Math.max(dt,.001)/U; st.lx=ptr.x; st.ly=ptr.y;
      st.o=clamp(st.o+(sp<30?dt/2.2:-dt*2.5));
      tgt.x=W/2+(ptr.x-W/2)*.06; tgt.y=H/2+(ptr.y-H/2)*.06;
      st.ap=lerp(26,300,ease(st.o))*U; T.zoom=Math.max(T.zoom,.012+.02*st.o);
      st.sp-=dt;
      if(st.sp<=0&&T.t>2){
        st.sp=.11; const a=((R()*8)|0)*TAU/8+T.t*.4, v=R(120,220)*U;
        mote({o:'dm',x:W/2+Math.cos(a)*60*U,y:H/2+Math.sin(a)*60*U,vx:Math.cos(a)*v,vy:Math.sin(a)*v,acc:1.6,col:JEWEL[(R()*JEWEL.length)|0],r:8*U,can:false});
      }
      if(T.freeze) return;
      for(const m of T.motes) if(m.o==='dm'&&!m.dead){
        const d=Math.hypot(m.x-W/2,m.y-H/2);
        if(d<st.ap&&m.age>.12) collect(m); else if(d>Math.max(W,H)) m.dead=true;
      }
    },
    draw(st){
      sx.globalAlpha=.45+.45*st.o; sx.strokeStyle='#ffffff'; sx.lineWidth=1.5*U;
      sx.beginPath(); sx.arc(W/2,H/2,st.ap,0,TAU); sx.stroke(); sx.globalAlpha=1;
    } }
};

function startTrip(ids){
  const subs=ids.map(i=>SUB[i]);
  const combo=subs.length>1?comboOf(subs[0],subs[1]):{name:'',line:'',yield:1,cost:1,int:1};
  const tol=subs.reduce((m,s)=>m*Math.pow(.55,S.visits[s.id]||0),1);
  const dry=S.well<.15?.25:S.well<.3?.6:1;
  T={subs,combo,t:0,dur:Math.max(...subs.map(s=>s.dur)),hard:subs.every(s=>s.hard),k:0,light:0,motes:[],st:{},aux:{},
     yield:combo.yield*tol*dry,costTotal:subs.reduce((a,s)=>a+s.cost,0)*combo.cost,spent:0,extra:0,well0:S.well,
     mult:1,flash:0,caps:[],down:false,ended:false,cut:0,shown:-1};
  S.tide=clamp(S.tide+subs.reduce((a,s)=>a+s.tide,0),-1,1);
  parts=[]; P.x=ptr.x; P.y=ptr.y; P.vx=P.vy=0;
  subs.forEach(s=>{ S.visits[s.id]=(S.visits[s.id]||0)+1; T.st[s.id]={}; BEH[s.id].init(T.st[s.id],s); });
  const d=T.dur, a=subs[0], b=subs[1];
  T.caps=b?[[4,a.lines[0]],[.42*d,combo.line],[.76*d,b.lines[2]]]:[[4,a.lines[0]],[.42*d,a.lines[1]],[.76*d,a.lines[2]]];
  lastModes=[a.i,b?b.i:-1];
  const m=Object.assign({},a.mus);
  if(b){ m.bpm=Math.round((a.mus.bpm+b.mus.bpm)/2); m.arp=b.mus.arp; m.lp=Math.min(a.mus.lp||18000,b.mus.lp||18000); m.wob=Math.max(a.mus.wob||0,b.mus.wob||0); m.riser=a.mus.riser||b.mus.riser; if(combo.mute||combo.black) m.lp=Math.min(m.lp,700); }
  setMusic(m); sWhoosh(); sBoom();
  $('#tWho').textContent=subs.map(s=>s.code+' · '+s.name).join('  +  ');
  $('#tPlace').textContent=b?combo.name:a.place;
  $('#tcCode').textContent=subs.map(s=>s.name).join(' + ');
  $('#tcPlace').textContent=b?combo.name:a.place;
  $('#tcHint').textContent=subs.map(s=>s.hint).join('  ');
  $('#tLight').textContent='0'; $('#tCap').classList.remove('on');
  $('#tCard').classList.add('on');
  S.phase='trip'; show('trip');
}
let capTimer=0;
function caption(txt,dur=5){ const el=$('#tCap'); el.textContent=txt; el.classList.add('on'); clearTimeout(capTimer); capTimer=setTimeout(()=>el.classList.remove('on'),dur*1000); }
let gainTimer=0;
function popGain(v){
  const now=performance.now(); if(now-gainTimer<90) return; gainTimer=now;
  const el=$('#tGain'); el.textContent='+'+(v>=10?Math.round(v):Math.round(v*10)/10); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
}
function botSteer(){
  if(T.st.dm) return;
  if(T.gate){ ptr.x=T.gate.x; ptr.y=T.gate.y; return; }
  let best=null, bd=1e12;
  for(const m of T.motes){
    if(m.dead||m.can===false) continue;
    if(m.k==='e'&&T.st.nc.e>.35) continue;
    const d=(m.x-P.x)**2+(m.y-P.y)**2; if(d<bd){ bd=d; best=m; }
  }
  if(best){ ptr.x=clamp(best.x,0,W); ptr.y=clamp(best.y,0,H); }
}
function updTrip(dt){
  if(T.cut>0){ T.cut-=dt; V.black=1; V.k=0; if(T.cut<=0) endTrip(); return; }
  T.t+=dt; const d=T.dur, c=T.combo;
  T.k=ease(clamp(T.t/4))*(T.hard?1:1-.75*ease(clamp((T.t-(d-6))/6)));
  const want=T.costTotal*clamp(T.t/d), dv=want-T.spent; T.spent=want; S.well=clamp(S.well-dv);
  if(T.t>3.6) $('#tCard').classList.remove('on');
  for(let i=T.shown+1;i<T.caps.length;i++) if(T.t>=T.caps[i][0]&&T.caps[i][1]){ T.shown=i; caption(T.caps[i][1]); }
  if(!T.down&&T.t>d-6&&!T.hard){ T.down=true; sDown(); auLp(900,2); }
  // per-frame modifiers
  T.mult=1; T.vig=0; T.wob=0; T.dbl=0; T.zoom=0; T.beat=0; T.black=0; T.freeze=false; T.kMul=1; T.timeScale=1; T.gate=null; T.focus=false;
  P.glow=1; P.jx=P.jy=0; AU.rate=1;
  T.flash*=Math.exp(-dt*3);
  if(DBG.bot) botSteer();
  tgt.x=ptr.x; tgt.y=ptr.y;
  if(c.black){ T.black=c.black*ease(clamp((T.t-5)/3))*(1-ease(clamp((T.t-(d-4))/3))); if(T.black>.5) T.freeze=c.black>=1; }
  if(c.pound){ const pb=beat(152); P.jx+=R(-3,3)*U*c.pound; P.jy+=R(-3,3)*U*c.pound; T.vig=Math.max(T.vig,.3+.5*pb*c.pound); AU.rate=1+.12*c.pound; }
  for(const s of T.subs) BEH[s.id].update(T.st[s.id],dt,s);
  // the body
  const n=T.subs.length; let k=0, dm=0; T.subs.forEach(s=>{ k+=s.phys.k; dm+=s.phys.d; }); k=k/n*T.kMul; dm/=n;
  if(!T.freeze){
    P.vx+=((tgt.x-P.x)*k-P.vx*dm)*dt; P.vy+=((tgt.y-P.y)*k-P.vy*dm)*dt;
    P.x=clamp(P.x+P.vx*dt,0,W); P.y=clamp(P.y+P.vy*dt,0,H);
    const rr0=P.r*U*(.6+.4*P.glow), ts=T.timeScale;
    for(const m of T.motes){
      if(m.dead) continue;
      m.age+=dt;
      if(m.acc){ m.vx*=1+m.acc*dt; m.vy*=1+m.acc*dt; }
      m.x+=m.vx*dt*ts; m.y+=m.vy*dt*ts;
      if(m.bounce){ if(m.x<10||m.x>W-10){ m.vx*=-1; m.x=clamp(m.x,10,W-10); } if(m.y<10||m.y>H-10){ m.vy*=-1; m.y=clamp(m.y,10,H-10); } }
      if(m.life&&m.age>m.life){ m.dead=true; continue; }
      if(m.can!==false&&T.black<.5){ const dx=m.x-P.x, dy=m.y-P.y, rr=rr0+m.r; if(dx*dx+dy*dy<rr*rr) collect(m); }
    }
  }
  T.motes=T.motes.filter(m=>!m.dead);
  updParts(dt);
  // the look
  const I=c.int*(REDUCE?.6:1), kk=T.k;
  const avg=key=>T.subs.reduce((a,s)=>a+(s.vis[key]??DEF[key]),0)/n, mx=key=>Math.max(...T.subs.map(s=>s.vis[key]??DEF[key]));
  kShow=kk*(c.mute?.6:1);
  V.k=kShow; V.mA=T.subs[0].i; V.mB=n>1?T.subs[1].i:-1; V.t=T.t;
  V.auxA=T.aux[T.subs[0].id]||0; V.auxB=n>1?(T.aux[T.subs[1].id]||0):0; V.beat=T.beat*(REDUCE?.3:1);
  V.decay=lerp(.9,avg('decay'),kk); V.zoom=(avg('zoom')+T.zoom)*kk*I; V.rot=avg('rot')*kk*I; V.flow=lerp(.004,mx('flow')*I,kk);
  V.dx=avg('dx')*kk; V.dy=avg('dy')*kk;
  V.ca=lerp(.003,mx('ca')*I,kk); V.vig=Math.max(lerp(.25,avg('vig'),kk),T.vig*kk);
  V.wob=((mx('wob')+T.wob)*I+(c.spin?1.6:0))*kk; V.scan=mx('scan')*kk; V.dbl=T.dbl*kk;
  V.bloom=lerp(1,avg('bloom'),kk); V.grain=mx('grain'); V.focus=T.focus;
  let sat=lerp(1,avg('sat'),kk)*lerp(.3,1,clamp(T.well0/.4));
  if(c.mute) sat*=.4;
  sat*=1-.45*clamp((T.t-(d-6))/6)*(T.costTotal>.3?1:.5)*(T.hard?0:1);
  V.sat=sat; V.black=T.black*.97; V.flash=T.flash; V.dawn=0;
  // hud
  $('#tProg').style.transform=`scaleX(${clamp(T.t/d)})`;
  $('#tLight').textContent=Math.round(T.light);
  $('#tWell').style.transform=`scaleX(${S.well})`;
  const ge=$('#gate');
  if(T.gate){ ge.style.opacity=clamp(T.gate.t); ge.style.left=(T.gate.x/W*100)+'%'; ge.style.top=(T.gate.y/H*100)+'%'; } else ge.style.opacity=0;
  if(T.t>=d&&!T.ended){ T.ended=true; if(T.hard){ T.cut=1; setMusic(null); sBoom(); } else endTrip(); }
}
function drawTrip(){
  for(const s of T.subs){ const b=BEH[s.id]; if(b.draw) b.draw(T.st[s.id],s); }
  for(const m of T.motes){
    const a=(m.al??1)*clamp(m.age*4)*(m.life?clamp((m.life-m.age)*2.5):1);
    glow(m.x,m.y,m.r*2.9*(1+.15*Math.sin(G*5+m.x*.05)),m.col,a);
    if(m.life){ sx.globalAlpha=a*.7; sx.strokeStyle=m.col; sx.lineWidth=1.5*U; sx.beginPath(); sx.arc(m.x,m.y,m.r*(1.2+2.2*(1-m.age/m.life)),0,TAU); sx.stroke(); }
  }
  drawParts();
  const s=T.subs[T.subs.length>1?((G*.7)|0)%2:0];
  drawComet(s.a,P.glow);
}
function endTrip(){
  const c=T.combo, need=T.subs.reduce((a,s)=>a+s.need,0)/T.subs.length, got=[];
  const okWell=T.well0>=.15, okCombo=c.yield>=.5, okLight=T.light>=need;
  for(const s of T.subs) if(!S.shards.includes(s.id)&&okWell&&okCombo&&okLight){ S.shards.push(s.id); got.push(s); }
  S.total+=T.light; S.opened+=1;
  const a=T.subs[0], b=T.subs[1];
  $('#cEyebrow').textContent=T.subs.map(s=>s.name).join(' + ')+(b?' · '+c.name:' · '+a.place);
  $('#cBig').textContent=got.length?(got.length>1?'Two lights, carried.':'A light, carried.'):'Nothing to carry.';
  let line;
  if(got.length) line=b?c.line:a.lines[2];
  else if(!okWell) line=TEXT.dry;
  else if(!okCombo) line=c.line;
  else if(T.subs.every(s=>S.shards.includes(s.id))) line=TEXT.noNew;
  else line=TEXT.slipped;
  $('#cLine').textContent=line;
  const spent=Math.round((T.spent+T.extra)*100);
  $('#cStats').innerHTML=`<dt>Light gathered</dt><dd>${Math.round(T.light)}</dd><dt>The well</dt><dd>−${spent}% · now ${Math.round(S.well*100)}%</dd><dt>The tide</dt><dd>${tideWord()}</dd>`;
  $('#cShards').innerHTML=got.map(lessonHTML).join('');
  if(got.length) sShard();
  setMusic(HUB_MUS);
  S.phase='card'; show('card'); S.sel=[]; T.done=true;
}
const lessonHTML=s=>`<div class="lesson" style="--c:${s.a}"><i></i><span><small>${s.name}</small>${s.lesson}</span></div>`;
const tideWord=()=>S.tide>WIN.tide?'running high':S.tide<-WIN.tide?'running low':'level';

/* ---------- the night ---------- */
function buildDoors(){
  const el=$('#doors');
  SUBS.forEach((s,i)=>{
    const b=document.createElement('button'); b.className='door'; b.id='door-'+s.id;
    b.style.setProperty('--a',s.a); b.style.setProperty('--b',s.b);
    b.innerHTML=`<span class="gem"></span><span class="n">${String(i+1).padStart(2,'0')}</span><span class="c">${s.code}</span><span class="nm">${s.name}</span>`;
    b.addEventListener('click',()=>{ const k=S.sel.indexOf(s.id); if(k>=0) S.sel.splice(k,1); else { if(S.sel.length>=2) S.sel.shift(); S.sel.push(s.id); } sSelect(i); hubRefresh(); });
    b.addEventListener('pointerenter',()=>{ if(b.disabled) return; sTick(); $('#status').textContent=`${s.place}. It spends about ${Math.round(s.cost*100)}% of the well, and the tide ${s.tide>.05?'rises':s.tide<-.05?'falls':'holds'}.`; });
    b.addEventListener('pointerleave',()=>hubRefresh());
    el.appendChild(b);
  });
  const g=$('#gems'); for(let i=0;i<WIN.lights;i++) g.appendChild(document.createElement('i'));
}
const ready=()=>S.shards.length>=WIN.lights&&S.well>=WIN.well&&Math.abs(S.tide)<=WIN.tide;
function hubRefresh(){
  const dry=S.well<.12;
  if(dry) S.sel=[];
  for(const s of SUBS){
    const b=$('#door-'+s.id);
    b.classList.toggle('sel',S.sel.includes(s.id)); b.classList.toggle('has',S.shards.includes(s.id)); b.classList.toggle('seen',!!S.visits[s.id]);
    b.disabled=dry;
  }
  const orb=$('#orb'); orb.style.setProperty('--well',S.well.toFixed(3));
  $('#wellV').textContent=`the well ${Math.round(S.well*100)}%`;
  const mk=$('#tideM'); mk.style.left=(50+S.tide*50)+'%'; mk.classList.toggle('off',Math.abs(S.tide)>WIN.tide);
  $('#tideV').textContent=tideWord();
  [...$('#gems').children].forEach((el,i)=>{ const id=carried()[i]; el.classList.toggle('on',!!id); if(id) el.style.setProperty('--c',SUB[id].a); });
  const go=$('#go'); go.disabled=!S.sel.length;
  go.textContent=S.sel.length?'Step through · '+S.sel.map(id=>SUB[id].code).join(' + '):'Step through';
  $('#morning').disabled=!ready();
  let st=TEXT.hubDefault;
  if(dry) st=TEXT.hubDry;
  else if(S.sel.length===2) st=TEXT.hubPair(SUB[S.sel[0]].name,SUB[S.sel[1]].name);
  else if(ready()) st=TEXT.hubReady;
  else if(S.shards.length>=WIN.lights) st=TEXT.hubEnough+` The well needs ${Math.round(WIN.well*100)}%.`;
  else if(S.shards.length) st=`${S.shards.length} of ${WIN.lights} lights. `+(S.well<.4?'The well is running low. Hold the light and breathe.':'Choose a door, or two.');
  $('#status').textContent=st;
}
function breathDown(){ if(S.phase!=='hub'||B.on||B.ex>0) return; B.on=true; B.p=0; sBreath(1,3); }
function breathUp(){
  if(!B.on) return; B.on=false;
  if(B.p>.45){ B.ex=1; B.gain=B.p; sBreath(-1,2.4); } else B.p=0;
}
function updHub(dt){
  if(B.on) B.p=clamp(B.p+dt/3);
  if(B.ex>0){
    B.ex-=dt/2.4; B.p=B.gain*ease(clamp(B.ex));
    if(B.ex<=0){
      B.ex=0; B.p=0;
      S.well=clamp(S.well+.2*B.gain); S.tide*=1-.6*B.gain; if(Math.abs(S.tide)<.05) S.tide=0;
      sSelect(4); hubRefresh();
    }
  }
  $('#orb').style.setProperty('--breath',B.p.toFixed(3));
  if(B.on||B.ex>0) auLp(500+B.p*9000,.1);
  idleLook(dt);
  V.sat=lerp(.25,1,clamp(S.well/.4)); V.flash=.05*B.p; V.bloom=1+B.p;
}
function idleLook(dt){
  kShow+=(0-kShow)*Math.min(1,dt*2.2);
  V.k=kShow; V.mA=lastModes[0]; V.mB=lastModes[1]; V.t=G; V.auxA=V.auxB=0; V.beat=0; V.dawn=0;
  V.decay=.93; V.zoom=0; V.rot=0; V.flow=.006; V.dx=0; V.dy=.0006; V.ca=.004; V.sat=1; V.vig=.3; V.wob=0; V.scan=0; V.dbl=0; V.bloom=1.1; V.black=0; V.flash=0; V.grain=.035; V.focus=false;
  P.vx+=((ptr.x-P.x)*40-P.vx*10)*dt; P.vy+=((ptr.y-P.y)*40-P.vy*10)*dt; P.x+=P.vx*dt; P.y+=P.vy*dt;
  P.glow=1; P.jx=P.jy=0;
  updParts(dt);
}
function drawIdle(){
  const car=carried();
  car.forEach((id,i)=>{ const a=G*.9+i*TAU/car.length; glow(P.x+Math.cos(a)*38*U,P.y+Math.sin(a)*38*U,16*U,SUB[id].a,.9); });
  drawParts();
  drawComet('#ffe2b8',.8);
}

/* ---------- title ---------- */
function updTitle(dt){
  idleLook(dt);
  const seg=6.5, i=Math.floor(G/seg)%SUBS.length, l=(G%seg)/seg;
  V.k=Math.pow(Math.sin(l*Math.PI),.7)*.78; V.mA=i; V.mB=-1; V.t=G;
  V.auxA=i===6?.6+.4*Math.sin(G*1.5):i===12?(G*.4)%1.2:.5;
  const vis=SUBS[i].vis; V.sat=1.15; V.ca=lerp(.004,vis.ca??.004,V.k); V.scan=(vis.scan||0)*V.k; V.vig=.45;
  V.beat=Math.exp(-((G*2)%1)*5)*.6;
  lastModes=[i,-1]; kShow=V.k;
}

/* ---------- morning ---------- */
function startDawn(){
  D={t:0,i:-1,done:false,sp:0}; parts=[];
  $('#dLine').classList.remove('on'); $('#dEnd').classList.remove('on');
  setMusic(DAWN_MUS); sWhoosh(); S.phase='dawn'; show('dawn');
}
function updDawn(dt){
  D.t+=dt; idleLook(dt);
  const car=carried(), n=car.length;
  V.dawn=ease(clamp(D.t/(4+n*3.8)));
  V.bloom=1.3; V.sat=1.15; V.vig=.2*(1-V.dawn); V.decay=.95; V.dy=.0012;
  AU.dens=.6+V.dawn;
  const i=Math.floor((D.t-2)/3.8);
  if(i>=0&&i<n&&i!==D.i){
    D.i=i; const s=SUB[car[i]], el=$('#dLine');
    el.classList.remove('on');
    setTimeout(()=>{ el.innerHTML=`<small style="color:${s.a}">${s.name}</small>${s.lesson}`; el.classList.add('on'); },350);
    sDawnNote(i);
  }
  if(!D.done&&D.t>2+n*3.8+.8){
    D.done=true; $('#dLine').classList.remove('on');
    $('#dText').textContent=TEXT.ending(Object.keys(S.visits).length,SUBS.length-Object.keys(S.visits).length);
    $('#dLessons').innerHTML=S.shards.map(id=>lessonHTML(SUB[id])).join('');
    $('#dEnd').classList.add('on'); sFinal(); V.flash=.3; D.flash=.3;
  }
  if(D.flash){ D.flash*=Math.exp(-dt*1.5); V.flash=D.flash; }
  D.sp-=dt;
  if(D.sp<=0&&n){ D.sp=.16; const id=car[(R()*n)|0]; parts.push({x:R(W),y:H*.69+R(-6,6)*U,vx:R(-10,10)*U,vy:-R(20,60)*U*(.4+V.dawn),life:R(5,9),age:0,col:SUB[id].a,lan:true}); }
  for(const p of parts) if(p.lan){
    p.vy-=2*U*dt; p.vx+=Math.sin(G+p.x*.01)*6*U*dt;
    const dx=p.x-P.x, dy=p.y-P.y, dd=dx*dx+dy*dy; if(dd<(90*U)**2){ const d=Math.sqrt(dd)+1; p.vx+=dx/d*500*U*dt; p.vy+=dy/d*500*U*dt; }
  }
}
function drawDawn(){
  for(const p of parts) glow(p.x,p.y,(p.lan?11:7)*U,p.col,Math.min(1,p.age*2)*(1-p.age/p.life));
  drawComet('#fff3d6',.9);
}

/* ---------- frame ---------- */
function show(id){ wipe=2; document.querySelectorAll('.scr').forEach(el=>el.classList.toggle('on',el.id===id)); }
let last=0;
function frame(now){
  const raw=(now-last)/1000; last=now;
  const dt=Math.min(.05,Math.max(.001,raw)); G+=dt;
  if(raw>.03&&raw<.5) slow+=dt; else slow=Math.max(0,slow-dt*.5);
  if(slow>2.5&&q>.5){ q*=.8; slow=0; resize(); }
  if(S.phase==='title') updTitle(dt);
  else if(S.phase==='hub') updHub(dt);
  else if(S.phase==='trip') updTrip(dt);
  else if(S.phase==='card'){ idleLook(dt); kShow=Math.max(kShow,.16); V.k=kShow; V.sat=.45; }
  else if(S.phase==='dawn') updDawn(dt);
  sx.globalCompositeOperation='source-over'; sx.globalAlpha=1; sx.fillStyle='#000'; sx.fillRect(0,0,W,H);
  sx.globalCompositeOperation='lighter';
  if(S.phase==='trip'&&T&&!T.done&&T.cut<=0) drawTrip();
  else if(S.phase==='dawn') drawDawn();
  else drawIdle();
  sx.globalAlpha=1;
  render();
  requestAnimationFrame(frame);
}

/* ---------- wiring ---------- */
function toHub(){ S.phase='hub'; S.sel=[]; hubRefresh(); show('hub'); }
function reset(){ Object.assign(S,{well:1,tide:0,shards:[],visits:{},total:0,opened:0,sel:[]}); kShow=0; setMusic(HUB_MUS); toHub(); }
function boot(saved){
  if(!gl){ $('#nogl').hidden=false; $('#title').classList.remove('on'); return; }
  try{ glInit(); }catch(e){ $('#nogl').hidden=false; $('#title').classList.remove('on'); return; }
  resize(); ptr.x=P.x=W*.7; ptr.y=P.y=H*.4;
  buildDoors();
  if(saved&&saved.shards){ Object.assign(S,saved,{sel:[]}); if(saved.phase!=='title') toHub(); }
  addEventListener('resize',resize);
  addEventListener('pointermove',e=>{ if(DBG.bot&&S.phase==='trip') return; const r=cv.getBoundingClientRect(); ptr.x=(e.clientX-r.left)/r.width*W; ptr.y=(e.clientY-r.top)/r.height*H; });
  addEventListener('pointerdown',e=>{ const r=cv.getBoundingClientRect(); ptr.x=(e.clientX-r.left)/r.width*W; ptr.y=(e.clientY-r.top)/r.height*H; if(AU.ctx) AU.ctx.resume(); });
  $('#begin').addEventListener('click',()=>{ auStart(); setMusic(HUB_MUS); sWhoosh(); toHub(); });
  $('#go').addEventListener('click',()=>{ if(S.sel.length){ auStart(); startTrip(S.sel.slice()); } });
  $('#back').addEventListener('click',()=>{ sSelect(0); toHub(); });
  $('#morning').addEventListener('click',()=>{ if(ready()){ auStart(); startDawn(); } });
  $('#again').addEventListener('click',reset);
  $('#leave').addEventListener('click',leave);
  $('#snd').addEventListener('click',e=>{ auStart(); auMute(!AU.muted); e.currentTarget.textContent=AU.muted?'Sound off':'Sound on'; e.currentTarget.setAttribute('aria-pressed',String(!AU.muted)); });
  const orb=$('#orb');
  orb.addEventListener('pointerdown',e=>{ auStart(); try{ orb.setPointerCapture(e.pointerId); }catch(_){} breathDown(); });
  orb.addEventListener('pointerup',breathUp); orb.addEventListener('pointercancel',breathUp);
  orb.addEventListener('contextmenu',e=>e.preventDefault());
  addEventListener('keydown',e=>{
    if(e.repeat) return;
    if(S.phase==='hub'&&e.code==='Space'&&document.activeElement.tagName!=='BUTTON'){ e.preventDefault(); auStart(); breathDown(); }
    else if(S.phase==='hub'&&e.code==='KeyB'){ auStart(); breathDown(); }
    else if(S.phase==='trip'&&e.code==='Escape') leave();
  });
  addEventListener('keyup',e=>{ if(e.code==='Space'||e.code==='KeyB') breathUp(); });
  if(window.claude&&window.claude.hot&&window.claude.hot.snapshot)
    window.claude.hot.snapshot(()=>({phase:S.phase==='title'?'title':'hub',well:S.well,tide:S.tide,shards:S.shards,visits:S.visits,total:S.total,opened:S.opened}));
  last=performance.now(); requestAnimationFrame(frame);
}
function leave(){ if(S.phase==='trip'&&T&&!T.ended&&T.cut<=0) T.t=Math.max(T.t,T.hard?T.dur:T.dur-6); }
window.__doors={S,DBG,startTrip,toHub,startDawn,get T(){return T;},SUBS};
if(window.claude&&window.claude.hot&&window.claude.hot.ready) window.claude.hot.ready(boot);
else boot((window.claude&&window.claude.hot&&window.claude.hot.data)||{});
