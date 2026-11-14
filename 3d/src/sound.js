/* ---------- generated audio: music beds, ambience, voice (ElevenLabs) layered over the procedural sfx ---------- */
const AUD='3d/audio/';
const SND={bed:null,beds:{},amb:{},fx:{},voice:null,duck:1,on:false,me:{}};
function setMusic(cfg){ AU.cfg=null; sndOpenSfx(); } // the generated beds replace the procedural sequencer; keep its sfx
function sndOpenSfx(){ if(AU.ctx) aMus.gain.setTargetAtTime(1,AU.ctx.currentTime,.1); } // the sfx share the sequencer's bus, which auStart leaves at 0
function sndEl(path,loop,vol){ const a=new Audio(AUD+path); a.loop=loop; a.volume=vol; a.preload='auto'; a.tgt=vol; return a; }
function sndLayer(map,id,path,target){ let a=map[id]; if(!a){ a=map[id]=sndEl(path,true,0); a.tgt=0; } a.tgt=target; return a; }
function sndStart(){ if(SND.on) return; SND.on=true; sndOpenSfx(); for(const k of ['door','task','shard','sleep','caught','heart','step']) SND.fx[k]=sndEl('sfx/'+k+'.mp3',false,1); }
function sndFx(k,vol=1){ if(!SND.on||AU.muted) return; const s=SND.fx[k]; if(!s) return; const c=s.cloneNode(); c.volume=vol; c.play().catch(()=>{}); }
function sndVoice(path,vol=1){
  if(!SND.on||AU.muted||!path) return;
  if(SND.voice){ try{ SND.voice.pause(); }catch(e){} }
  const a=new Audio(AUD+'voice/'+path); a.volume=vol; SND.voice=a; SND.duck=.35;
  a.addEventListener('ended',()=>{ if(SND.voice===a){ SND.voice=null; SND.duck=1; } });
  a.play().catch(()=>{ if(SND.voice===a){ SND.voice=null; SND.duck=1; } });
}
function sndSay(who,text){ const m=VO.npc[who]; if(m&&m[text]) sndVoice(m[text],.95); }
function sndMe(key){ if(SND.me[key]) return; SND.me[key]=true; sndVoice(VO.me[key],.9); }
function sndStory(txt){
  if(!SND.rev){ SND.rev={}; for(const k in STORY){ const v=STORY[k]; if(typeof v==='string') SND.rev[v]=k; else v.forEach((t,i)=>{ if(t) SND.rev[t]=k==='days'?'day'+i:'locked'+i; }); } }
  const k=SND.rev[txt]; if(k) { SND.me[k]=false; sndMe(k); }
}
function sndTick(dt){
  if(!SND.on) return;
  const ph=S.phase, t=clamp(S.clock/DAYLEN), d=dominant(), hi=d&&doseK(d)>.05;
  const bed=ph==='end'?'end':ph==='play'?(hi?'high':stage()>=1?'worry':t>.62?'night':'hub'):'hub';
  for(const k of ['hub','night','high','worry','end']) sndLayer(SND.beds,k,'music/'+k+'.mp3',k===bed?.55:0);
  const yard=ph==='play'&&P.z>13.5?1:0, dawn=ph==='card'||ph==='end'?1:0;
  sndLayer(SND.amb,'room','sfx/room.mp3',ph==='play'?.22*(1-yard):0);
  sndLayer(SND.amb,'yard','sfx/yard.mp3',ph==='play'?.3*yard:0);
  sndLayer(SND.amb,'dawn','sfx/dawn.mp3',.25*dawn);
  if(AU.muted&&SND.voice){ try{ SND.voice.pause(); }catch(e){} SND.voice=null; SND.duck=1; }
  const mute=AU.muted?0:1, k=Math.min(1,dt*1.6);
  for(const map of [SND.beds,SND.amb]) for(const id in map){
    const a=map[id], want=a.tgt*mute*(map===SND.beds?SND.duck:1);
    const v=a.volume+(want-a.volume)*k; a.volume=clamp(Math.abs(v-want)<.004?want:v);
    if(a.volume>0&&a.paused) a.play().catch(()=>{}); else if(a.volume===0&&!a.paused&&want===0) a.pause();
  }
  if(ph==='play'&&!C){ const v=Math.hypot(P.vx,P.vz); SND.stepT=(SND.stepT||0)-dt*v; if(v>.6&&SND.stepT<=0){ SND.stepT=.95; sndFx('step',.35); } }
}
