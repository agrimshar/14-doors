/* ---------- audio: every note is synthesised live ---------- */
const AU = { ctx:null, muted:false, cfg:null, step:0, bar:0, next:0, rate:1, wob:0, dens:1, arpI:0, sfxI:0 };
let aMaster, aMus, aLp, aRev, aDly, aNoise, aTimer;

function auStart(){
  if(AU.ctx){ AU.ctx.resume(); return; }
  const C=window.AudioContext||window.webkitAudioContext; if(!C) return;
  let ctx; try{ ctx=new C(); }catch(e){ return; }
  AU.ctx=ctx;
  const comp=ctx.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=5; comp.connect(ctx.destination);
  aMaster=ctx.createGain(); aMaster.gain.value=.72; aMaster.connect(comp);
  aLp=ctx.createBiquadFilter(); aLp.type='lowpass'; aLp.frequency.value=18000; aLp.connect(aMaster);
  aMus=ctx.createGain(); aMus.gain.value=0; aMus.connect(aLp);
  const len=ctx.sampleRate*3, ib=ctx.createBuffer(2,len,ctx.sampleRate);
  for(let c=0;c<2;c++){ const d=ib.getChannelData(c); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6); }
  aRev=ctx.createConvolver(); aRev.buffer=ib;
  const rg=ctx.createGain(); rg.gain.value=.55; aRev.connect(rg); rg.connect(aLp);
  aDly=ctx.createDelay(1.5); aDly.delayTime.value=.375;
  const fb=ctx.createGain(); fb.gain.value=.42; aDly.connect(fb); fb.connect(aDly);
  const dg=ctx.createGain(); dg.gain.value=.5; aDly.connect(dg); dg.connect(aLp);
  const nb=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate), nd=nb.getChannelData(0);
  for(let i=0;i<nd.length;i++) nd[i]=Math.random()*2-1;
  aNoise=nb;
  AU.next=ctx.currentTime+.1;
  aTimer=setInterval(auTick,30);
}
function auMute(m){ AU.muted=m; if(aMaster) aMaster.gain.setTargetAtTime(m?0:.72,AU.ctx.currentTime,.05); }
const mtof=m=>440*Math.pow(2,(m-69)/12);
function deg(cfg,d){ const n=cfg.sc.length; return cfg.root+cfg.sc[((d%n)+n)%n]+12*Math.floor(d/n); }

function env(g,t,a,peak,dur,rel){
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(peak,t+a);
  g.gain.setValueAtTime(peak,t+Math.max(a,dur)); g.gain.exponentialRampToValueAtTime(0.0001,t+Math.max(a,dur)+rel);
}
function out(node,send,dsend){
  node.connect(aMus);
  if(send){ const s=AU.ctx.createGain(); s.gain.value=send; node.connect(s); s.connect(aRev); }
  if(dsend){ const s=AU.ctx.createGain(); s.gain.value=dsend; node.connect(s); s.connect(aDly); }
}
function osc(type,f,t,stop){
  const o=AU.ctx.createOscillator(); o.type=type; o.frequency.value=f;
  if(AU.wob) o.detune.value=AU.wob*Math.sin(t*2.1)+AU.wob*.5*Math.sin(t*.7);
  o.start(t); o.stop(stop); return o;
}
function pluck(m,t,vel,o={}){
  const ctx=AU.ctx, dur=o.dur||.2, f=mtof(m);
  const os=osc(o.wave||'triangle',f,t,t+dur+.4), lp=ctx.createBiquadFilter(), g=ctx.createGain();
  lp.type='lowpass'; lp.Q.value=2; lp.frequency.setValueAtTime(o.cut||3000,t); lp.frequency.exponentialRampToValueAtTime(Math.max(200,f),t+dur+.2);
  g.gain.setValueAtTime(vel,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur+.3);
  os.connect(lp); lp.connect(g); out(g,o.rev??.2,o.dly||0);
}
function bell(m,t,vel,o={}){
  const ctx=AU.ctx, f=mtof(m), dur=o.dur||1.6;
  const car=osc('sine',f,t,t+dur+.1), mod=osc('sine',f*3.51,t,t+dur+.1), mg=ctx.createGain(), g=ctx.createGain();
  mg.gain.setValueAtTime(f*1.6,t); mg.gain.exponentialRampToValueAtTime(1,t+dur*.6);
  mod.connect(mg); mg.connect(car.frequency);
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vel,t+.005); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  car.connect(g); out(g,o.rev??.45,o.dly??.15);
}
function ep(m,t,vel,o={}){
  const ctx=AU.ctx, f=mtof(m), dur=o.dur||1.4;
  const a=osc('sine',f,t,t+dur+.1), b=osc('triangle',f*2,t,t+dur+.1), bg=ctx.createGain(), g=ctx.createGain(), tr=ctx.createGain(), l=osc('sine',4.5,t,t+dur+.1), lg=ctx.createGain();
  bg.gain.value=.18; lg.gain.value=.25; l.connect(lg); lg.connect(tr.gain);
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vel,t+.012); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  a.connect(g); b.connect(bg); bg.connect(g); g.connect(tr); out(tr,o.rev??.4,o.dly||0);
}
function sine(m,t,vel,o={}){
  const g=AU.ctx.createGain(), dur=o.dur||.15; const os=osc('sine',mtof(m),t,t+dur+.2);
  env(g,t,.004,vel,dur,.12); os.connect(g); out(g,o.rev??.25,o.dly??.2);
}
const INS={pluck,bell,ep,sine};
function pad(notes,t,dur,o){
  const ctx=AU.ctx;
  for(const m of notes) for(const dt of [-7,7]){
    const os=osc(o.wave||'sawtooth',mtof(m),t,t+dur+1.4); os.detune.value+=dt;
    const lp=ctx.createBiquadFilter(), g=ctx.createGain(); lp.type='lowpass'; lp.frequency.value=o.cut||1200;
    g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(o.vel||.1,t+dur*.35); g.gain.setValueAtTime(o.vel||.1,t+dur*.8); g.gain.linearRampToValueAtTime(0.0001,t+dur+1.2);
    os.connect(lp); lp.connect(g); out(g,o.rev??.4,0);
  }
}
function bass(m,t,dur,vel){
  const ctx=AU.ctx, a=osc('sawtooth',mtof(m),t,t+dur+.1), b=osc('sine',mtof(m),t,t+dur+.1), lp=ctx.createBiquadFilter(), g=ctx.createGain();
  lp.type='lowpass'; lp.frequency.value=420; env(g,t,.008,vel,dur*.7,.08);
  a.connect(lp); lp.connect(g); b.connect(g); g.connect(aMus);
}
function noise(t,dur,type,f,vel,q,sweep){
  const ctx=AU.ctx, s=ctx.createBufferSource(), fl=ctx.createBiquadFilter(), g=ctx.createGain();
  s.buffer=aNoise; s.loop=true; fl.type=type; fl.frequency.setValueAtTime(f,t); fl.Q.value=q||1;
  if(sweep) fl.frequency.exponentialRampToValueAtTime(sweep,t+dur);
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vel,t+Math.min(.02,dur*.3)); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  s.connect(fl); fl.connect(g); s.start(t); s.stop(t+dur+.05); return g;
}
function kick(t,vel){
  const ctx=AU.ctx, o=ctx.createOscillator(), g=ctx.createGain();
  o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(42,t+.12);
  g.gain.setValueAtTime(vel,t); g.gain.exponentialRampToValueAtTime(0.0001,t+.3);
  o.connect(g); g.connect(aMus); o.start(t); o.stop(t+.35);
}
function hat(t,vel){ noise(t,.05,'highpass',7500,vel).connect(aMus); }
function snare(t,vel){ const g=noise(t,.16,'bandpass',1900,vel,.8); out(g,.25,0); }
function riser(cfg,t,dur){
  const ctx=AU.ctx;
  for(let i=0;i<3;i++){
    const f=mtof(cfg.root+12*i), o=ctx.createOscillator(), g=ctx.createGain(); o.type='sine';
    o.frequency.setValueAtTime(f,t); o.frequency.exponentialRampToValueAtTime(f*2,t+dur);
    g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(.05,t+dur*.5); g.gain.linearRampToValueAtTime(0.0001,t+dur);
    o.connect(g); out(g,.4,0); o.start(t); o.stop(t+dur+.05);
  }
}

function setMusic(cfg){
  if(!AU.ctx) { AU.cfg=cfg; return; }
  const t=AU.ctx.currentTime;
  aMus.gain.cancelScheduledValues(t); aMus.gain.setTargetAtTime(0,t,.12);
  setTimeout(()=>{
    AU.cfg=cfg; AU.step=0; AU.bar=0; AU.rate=1; AU.dens=1; AU.wob=cfg?(cfg.wob||0):0; AU.arpI=0;
    if(!cfg||!AU.ctx) return;
    const n=AU.ctx.currentTime; AU.next=n+.08;
    aMus.gain.cancelScheduledValues(n); aMus.gain.setTargetAtTime(1,n,.25);
    aLp.frequency.setTargetAtTime(cfg.lp||18000,n,.3);
  },380);
}
function auLp(f,tc){ if(AU.ctx) aLp.frequency.setTargetAtTime(f,AU.ctx.currentTime,tc||.2); }
function auTick(){
  const ctx=AU.ctx, cfg=AU.cfg; if(!ctx||!cfg||ctx.state!=='running') return;
  if(AU.next<ctx.currentTime-.3) AU.next=ctx.currentTime+.05;
  while(AU.next<ctx.currentTime+.14){
    const s16=60/(cfg.bpm*AU.rate)/4;
    const sw=(AU.step%2===1&&cfg.swing)?cfg.swing*s16:0;
    try{ playStep(cfg,AU.step,AU.next+sw,s16); }catch(e){ AU.err=String(e&&e.message); }
    AU.next+=s16; AU.step++;
  }
}
function playStep(cfg,step,t,s16){
  const i=step%16; if(i===0&&step>0) AU.bar++;
  const rootD=cfg.prog[AU.bar%cfg.prog.length];
  if(i===0){
    if(cfg.pad) pad([deg(cfg,rootD),deg(cfg,rootD+2),deg(cfg,rootD+4),deg(cfg,rootD+6)],t,s16*16,{...cfg.pad,rev:cfg.rev});
    if(cfg.riser) riser(cfg,t,s16*32);
  }
  if(cfg.k&&cfg.k[i]==='x') kick(t,(cfg.kv||1)*.55);
  if(cfg.h&&cfg.h[i]==='x') hat(t,(cfg.hv||.4)*.22);
  if(cfg.s&&cfg.s[i]==='x') snare(t,.2);
  if(cfg.bass&&cfg.bass[i]==='x') bass(deg(cfg,rootD)-12,t,s16*1.6,.2);
  const a=cfg.arp;
  if(a&&i%a.step===0&&Math.random()<a.dens*AU.dens){
    let d;
    if(a.mode==='seq') d=rootD+a.seq[(step/a.step)%a.seq.length|0];
    else if(a.mode==='up') d=rootD+[0,2,4,6,7,4,6,2][AU.arpI++%8];
    else d=rootD+[0,2,4,6,7,9][Math.random()*6|0];
    INS[a.ins](deg(cfg,d)+12*(a.oct||0),t,a.vel,{wave:a.wave,cut:a.cut,dur:a.dur,rev:cfg.rev,dly:cfg.dly});
  }
}

/* ---------- sound effects ---------- */
function sfxOK(){ return AU.ctx&&AU.ctx.state==='running'; }
function sCollect(){
  if(!sfxOK()) return; const cfg=AU.cfg||HUB_MUS, t=AU.ctx.currentTime;
  const d=[0,2,4,6,7,9,11,9,7,6,4,2][AU.sfxI++%12];
  INS[cfg.sfx||'bell'](deg(cfg,d)+12,t,.16,{wave:'triangle',cut:5000,dur:.25,rev:.4,dly:.2});
}
function sWhoosh(v=1){ if(!sfxOK()) return; const t=AU.ctx.currentTime; out(noise(t,1.1,'bandpass',300,.3*v,1.2,5000),.5,0); }
function sBoom(){
  if(!sfxOK()) return; const ctx=AU.ctx,t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();
  o.frequency.setValueAtTime(90,t); o.frequency.exponentialRampToValueAtTime(28,t+.9);
  g.gain.setValueAtTime(.6,t); g.gain.exponentialRampToValueAtTime(0.0001,t+1.2);
  o.connect(g); out(g,.4,0); o.start(t); o.stop(t+1.3);
}
function sDown(){
  if(!sfxOK()) return; const ctx=AU.ctx,t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();
  o.type='triangle'; o.frequency.setValueAtTime(520,t); o.frequency.exponentialRampToValueAtTime(70,t+2.2);
  g.gain.setValueAtTime(.12,t); g.gain.exponentialRampToValueAtTime(0.0001,t+2.4);
  o.connect(g); out(g,.6,.2); o.start(t); o.stop(t+2.5);
}
function sShard(){
  if(!sfxOK()) return; const t=AU.ctx.currentTime;
  [0,4,7,11,14,19].forEach((s,i)=>bell(62+s,t+i*.09,.14,{dur:2.4,rev:.7,dly:.3}));
}
function sBreath(dir,dur=1.2){
  if(!sfxOK()) return; const t=AU.ctx.currentTime;
  out(noise(t,dur,'bandpass',dir>0?350:1600,.16,1.5,dir>0?1700:300),.5,0);
}
function sTick(){ if(!sfxOK()) return; pluck(86,AU.ctx.currentTime,.05,{dur:.03,cut:8000,rev:.1}); }
function sSelect(i){ if(!sfxOK()) return; bell(62+[0,2,4,7,9,12,14][i%7],AU.ctx.currentTime,.14,{dur:1.2}); }
function sBlack(){ if(!sfxOK()) return; const t=AU.ctx.currentTime; aLp.frequency.setTargetAtTime(160,t,.15); aLp.frequency.setTargetAtTime((AU.cfg&&AU.cfg.lp)||18000,t+1.8,.5); }
function sDawnNote(i){
  if(!sfxOK()) return; const t=AU.ctx.currentTime, m=50+[0,7,16,14,21][i%5];
  bell(m,t,.2,{dur:4,rev:.8,dly:.3}); pad([m],t,6,{wave:'sawtooth',cut:1800,vel:.07,rev:.7});
}
function sFinal(){
  if(!sfxOK()) return; const t=AU.ctx.currentTime;
  pad([38,50,57,62,66,69,76],t,9,{wave:'sawtooth',cut:3200,vel:.08,rev:.8});
  [0,4,7,12,16,19,24].forEach((s,i)=>bell(62+s,t+i*.16,.14,{dur:5,rev:.8,dly:.3}));
  sBoom();
}
