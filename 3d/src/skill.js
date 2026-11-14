/* ---------- the hands: a needle sweeps a bar, you press in the sweet spot three times ---------- */
const K={on:false};
function checkMods(){
  // what is in the blood decides how the needle moves; sober with a deep habit it goes flat (fast, narrow)
  const d=dominant(), L=load(), m={speed:1,width:1,sway:0,drift:0,mirror:0,lag:0,why:''};
  if(d){
    const k=doseK(d), c=d.s.cls, id=d.s.id;
    if(c==='stim'||c==='lite'){ m.speed*=lerp(1,.6,k); m.width*=lerp(1,1.5,k); m.why='sharp'; }
    else if(id==='al'||c==='dep'){ m.sway=.17*k; m.why='swaying'; }
    else if(c==='can'){ m.speed*=lerp(1,.55,k); m.drift=.24*k; m.why='drifting'; }
    else if(c==='psy'){ m.mirror=k; m.speed*=lerp(1,.8,k); m.why='mirrored'; }
    else if(c==='emp'){ m.width*=lerp(1,1.25,k); m.speed*=lerp(1,1.3,k); m.why='warm'; }
    else if(c==='dis'){ m.lag=.22*k; m.speed*=lerp(1,.7,k); m.why='late'; }
  } else if(S.habit>.5){ const h=(S.habit-.5)/.5; m.width*=1-.45*h; m.speed*=1+.3*h; m.why='flat'; }
  if(S.well<.2){ m.speed*=1.25; m.why=m.why||'tired'; }
  if(L>limit()*.85){ m.sway=Math.max(m.sway,.12); m.why='over'; }
  return m;
}
function startCheck(o){
  Object.assign(K,{on:true,t:0,p:Math.random(),dir:1,need:o.need||3,hits:[],speed:o.speed||1,width:o.width||.2,label:o.label,onEnd:o.onEnd,kind:o.kind||'task',c:R(.3,.7),wait:0,flash:0,hist:[],done:0});
  hold=0; keys.KeyE=keys.Space=false;
  const el=$('#check'); el.classList.add('on'); el.classList.toggle('act',K.kind==='act');
  $('#kText').textContent=o.label; $('#kHint').textContent=o.hint||'Press E when the needle is in the light'; kDots();
}
function kDots(){ $('#kHits').innerHTML=Array.from({length:K.need},(_,i)=>`<i class="${K.hits[i]===undefined?'':K.hits[i]>=1?'perf':K.hits[i]>0?'good':'miss'}"></i>`).join(''); }
function kCenter(m){ return clamp(K.c+Math.sin(G*.9)*m.drift,.08,.92); }
function kScore(s){ K.hits.push(s); K.c=R(.25,.75); K.wait=0; K.flash=s>0?1:-1; kDots(); sndFx(s>=1?'shard':s>0?'task':'step',s>=1?.9:s>0?.5:.6); if(K.hits.length>=K.need) K.done=.6; }
function kPress(){
  if(!K.on||K.hits.length>=K.need) return;
  const m=K.m||checkMods();
  let p=K.p; if(m.lag>0){ const h=K.hist.find(h=>h.t<=G-m.lag); if(h) p=h.p; }
  const d=Math.abs(p-kCenter(m)), w=K.width*m.width;
  kScore(d<=w*.22?1:d<=w*.5?.6:0);
}
function cancelCheck(){ if(!K.on) return; K.on=false; $('#check').classList.remove('on'); }
function updCheck(dt){
  if(!K.on) return;
  const m=K.m=checkMods();
  K.t+=dt;
  if(K.hits.length<K.need){
    K.p+=K.dir*dt*K.speed*m.speed*1.9; if(K.p>1){ K.p=2-K.p; K.dir=-1; } if(K.p<0){ K.p=-K.p; K.dir=1; }
    K.hist.unshift({t:G,p:K.p}); if(K.hist.length>60) K.hist.pop();
    K.wait+=dt; if(K.wait>2.6/(K.speed*m.speed)){ kScore(0); }   // hesitating is a miss too
  } else { K.done-=dt; if(K.done<=0){ K.on=false; $('#check').classList.remove('on'); keys.KeyE=keys.Space=false; const avg=K.hits.reduce((a,b)=>a+b,0)/K.need; K.onEnd(avg,K.hits); return; } }
  K.flash*=Math.exp(-dt*5);
  const c=kCenter(m), w=K.width*m.width;
  let p=clamp(K.p+(m.sway?Math.sin(G*3.1)*m.sway:0)); if(m.mirror>.5) p=1-p;
  $('#kSpot').style.left=((c-w/2)*100)+'%'; $('#kSpot').style.width=(w*100)+'%';
  $('#kNeedle').style.left=(p*100)+'%';
  const el=$('#check'); el.style.setProperty('--hit',K.flash>0?K.flash:0); el.style.setProperty('--miss',K.flash<0?-K.flash:0);
  $('#kMod').textContent=m.why;
}
addEventListener('keydown',e=>{ if(K.on&&(e.code==='KeyE'||e.code==='Space')&&!e.repeat){ e.preventDefault(); kPress(); } });
addEventListener('mousedown',e=>{ if(K.on&&S.phase==='play') kPress(); });
