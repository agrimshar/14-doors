/* ---------- the story: edit freely. every line of text in the game lives here ---------- */
const SC = {
  maj:[0,2,4,5,7,9,11], lyd:[0,2,4,6,7,9,11], mix:[0,2,4,5,7,9,10], dor:[0,2,3,5,7,9,10],
  min:[0,2,3,5,7,8,10], phr:[0,1,3,5,7,8,10], pen:[0,2,4,7,9], whole:[0,2,4,6,8,10]
};
const SUBS = [
{ id:'md', code:'Md', name:'MDMA', place:'The Warm Room', cls:'emp', a:'#ff2e93', b:'#ffc94d',
  dur:34, cost:.40, tide:.35, need:22, hint:'Everything comes to you.',
  lines:['Someone handed me water and I loved them for it.','Every person in the room was the best person I had ever met. I told them so.','Tuesday came for all of it.'],
  lesson:'The love was real. I could have said it sober.',
  phys:{k:38,d:9}, vis:{decay:.95,zoom:.003,flow:.006,ca:.006,bloom:1.4,sat:1.2},
  mus:{bpm:124,root:54,sc:SC.lyd,prog:[0,4,5,3],k:'x...x...x...x...',h:'..x...x...x...x.',s:'....x.......x...',bass:'..x...x...x...x.',
    arp:{ins:'pluck',wave:'sawtooth',step:1,dens:.9,mode:'up',oct:1,vel:.13,cut:3800,dur:.16},pad:{wave:'sawtooth',cut:1500,vel:.07},sfx:'bell'} },
{ id:'ps', code:'Ps', name:'Mushrooms / LSD', place:'The Garden', cls:'psy', a:'#a855ff', b:'#b6ff3c',
  dur:36, cost:.24, tide:.1, need:40, hint:'What you touch, you touch six times.',
  lines:['The carpet started breathing before I did.','Everything was connected to everything. It was hilarious, and it was holy.','Eight hours later I was still relearning how doors work.'],
  lesson:'The world is stranger and kinder than I had been looking at it.',
  phys:{k:26,d:8}, vis:{decay:.965,rot:.006,zoom:.004,flow:.008,ca:.008,bloom:1.2,sat:1.25},
  mus:{bpm:92,root:50,sc:SC.mix,prog:[0,6,3,0],k:'x.....x...x.....',h:'x.x.x.x.x.x.x.x.',hv:.25,bass:'x.......x.......',
    arp:{ins:'bell',step:2,dens:.7,mode:'rnd',oct:1,vel:.13},pad:{wave:'triangle',cut:2200,vel:.11},rev:.5,sfx:'bell'} },
{ id:'cn', code:'Cn', name:'Cannabis', place:'The Slow Green', cls:'can', a:'#35d07f', b:'#e9b949',
  dur:32, cost:.12, tide:-.15, need:12, hint:'Slow down. It will wait.',
  lines:['Time went soft around the edges.','The song had been playing for four minutes, or for my entire life.','I laughed at something. Then I forgot what.'],
  lesson:'Slow is a place I can visit without smoking.',
  phys:{k:9,d:4.2}, vis:{decay:.975,flow:.01,dy:.0012,ca:.003,bloom:1.3,sat:1.05,vig:.35},
  mus:{bpm:74,root:51,sc:SC.dor,prog:[0,3,0,4],k:'x.....x..x......',s:'....x.......x...',h:'x.xxx.x.x.xxx.x.',hv:.3,swing:.22,bass:'x.....x..x......',
    arp:{ins:'ep',step:4,dens:.65,mode:'rnd',oct:1,vel:.16},pad:{wave:'sine',cut:1200,vel:.15},lp:2600,wob:14,sfx:'ep'} },
{ id:'al', code:'Al', name:'Alcohol', place:'Last Call', cls:'dep', a:'#ff9a2e', b:'#ff3b5c',
  dur:32, cost:.24, tide:-.3, need:14, hint:'The first ones are the easy ones.',
  lines:['The first two were the best two. They always were.','I got louder. I thought that was the same as funnier.','The room kept moving after I stopped.'],
  lesson:'It lends me tonight and bills me tomorrow.',
  phys:{k:22,d:3.5}, vis:{decay:.94,flow:.006,wob:.3,ca:.006,sat:1.15},
  mus:{bpm:100,root:48,sc:SC.mix,prog:[0,3,0,4],k:'x.....x.x.......',s:'....x.......x...',h:'x..x..x..x..x..x',hv:.3,swing:.3,bass:'x...x...x...x...',
    arp:{ins:'pluck',wave:'square',step:2,dens:.55,mode:'rnd',oct:1,vel:.1,cut:1800,dur:.2},pad:{wave:'triangle',cut:1000,vel:.1},lp:5000,wob:30,sfx:'pluck'} },
{ id:'kt', code:'Kt', name:'Ketamine', place:'The Corridor', cls:'dis', a:'#7ff3ea', b:'#e8ffff',
  dur:32, cost:.2, tide:-.25, need:3, hint:'Your body follows. Eventually.',
  lines:['My hands were a long way down.','I watched myself from the far end of a corridor.','Coming back felt like being poured into a body.'],
  lesson:'Distance from myself is a view. It is also a place I can get stuck.',
  phys:{k:14,d:6}, vis:{decay:.9,zoom:-.004,scan:1,ca:.012,sat:.7,vig:.5,grain:.06},
  mus:{bpm:60,root:46,sc:SC.whole,prog:[0,2,0,4],k:'x...............',
    arp:{ins:'bell',step:4,dens:.4,mode:'rnd',oct:2,vel:.13},pad:{wave:'sine',cut:600,vel:.22},rev:.8,dly:.5,lp:3000,sfx:'bell'} },
{ id:'cf', code:'Cf', name:'Caffeine', place:'Nine A.M.', cls:'lite', a:'#ffd60a', b:'#fff3d6',
  dur:24, cost:.07, tide:.14, need:12, hint:'Keep up.',
  lines:['The one nobody counts.','Lists. Plans. A better version of me by noon.','By three I was borrowing from four.'],
  lesson:'Even the small ones are loans.',
  phys:{k:90,d:16}, vis:{decay:.8,ca:.002,sat:1.2,vig:.15,bloom:.8},
  mus:{bpm:138,root:55,sc:SC.maj,prog:[0,3,4,0],k:'x.......x.......',h:'x.x.x.x.x.x.x.x.',hv:.35,bass:'x...x...x...x...',
    arp:{ins:'pluck',wave:'triangle',step:2,dens:.95,mode:'up',oct:1,vel:.2,cut:5000,dur:.1},pad:{wave:'triangle',cut:1400,vel:.05},sfx:'pluck'} },
{ id:'nc', code:'Nc', name:'Nicotine', place:'The Ember', cls:'lite', a:'#ff6a1a', b:'#9db4c8',
  dur:24, cost:.06, tide:.08, need:10, hint:'Touch the ember. It fades fast.',
  lines:['Seven seconds of quiet.','Then the wanting it again, which I mistook for needing a break.','It never took me anywhere. It just kept asking.'],
  lesson:'Relief from a craving is a different thing from pleasure.',
  phys:{k:30,d:9}, vis:{decay:.97,dy:.002,flow:.012,sat:.9,vig:.5,bloom:1.2},
  mus:{bpm:80,root:45,sc:SC.min,prog:[0,0,5,0],k:'x..x............',kv:.5,
    arp:{ins:'ep',step:8,dens:.6,mode:'rnd',oct:1,vel:.18},pad:{wave:'sawtooth',cut:500,vel:.12},lp:3500,rev:.5,sfx:'ep'} },
{ id:'co', code:'Co', name:'Cocaine', place:'The Mirror', cls:'stim', a:'#a8e6ff', b:'#ffffff', hard:true,
  dur:22, cost:.34, tide:.42, need:22, hint:'Each one is worth less than the last.',
  lines:['I was the most interesting person alive for twenty minutes.','Each line did a little less and asked a little more.','The sun came up on a conversation nobody would remember.'],
  lesson:'Confidence that needs refilling every twenty minutes is a debt.',
  phys:{k:60,d:14}, vis:{decay:.82,ca:.012,sat:.85,vig:.35,bloom:.9,grain:.05},
  mus:{bpm:128,root:47,sc:SC.phr,prog:[0,1,0,1],k:'x..x..x.x..x..x.',h:'xxxxxxxxxxxxxxxx',hv:.3,s:'....x.......x...',bass:'x.xx.x.xx.xx.x.x',riser:true,
    arp:{ins:'pluck',wave:'square',step:1,dens:.8,mode:'up',oct:2,vel:.08,cut:6000,dur:.07},pad:{wave:'sawtooth',cut:3000,vel:.05},sfx:'pluck'} },
{ id:'ad', code:'Ad', name:'Adderall', place:'The Grid', cls:'stim', a:'#3d6bff', b:'#ff8a1f',
  dur:30, cost:.24, tide:.36, need:30, hint:'One thing at a time. In order.',
  lines:['One thing. Only one thing. Finally.','I organised my whole life in a night and forgot to eat.','At four in the morning I was alphabetising something that did not need it.'],
  lesson:'Focus is a spotlight. It does not choose what is worth lighting.',
  phys:{k:70,d:17}, vis:{decay:.86,ca:.002,vig:.5,sat:1.1},
  mus:{bpm:120,root:52,sc:SC.pen,prog:[0,0,3,3],h:'x...x...x...x...',hv:.5,k:'x.......x.......',kv:.5,
    arp:{ins:'sine',step:1,dens:1,mode:'seq',seq:[0,2,4,2,5,4,2,4],oct:1,vel:.13,dur:.12},pad:{wave:'triangle',cut:900,vel:.08},sfx:'sine'} },
{ id:'dx', code:'Dx', name:'Dexedrine', place:'The Thread', cls:'stim', a:'#ff3b2f', b:'#ffe9dc',
  dur:30, cost:.2, tide:.32, need:18, hint:'Stay on the thread.',
  lines:['Cleaner. A straight line where the noise used to be.','I could hold the thread for as long as I never looked away.','The line kept going after I was done.'],
  lesson:'A steady hand is worth more than a fast one.',
  phys:{k:50,d:13}, vis:{decay:.93,dx:-.004,ca:.003,vig:.3},
  mus:{bpm:108,root:50,sc:SC.dor,prog:[0,3,4,0],k:'x.......x.......',kv:.6,h:'..x...x...x...x.',hv:.3,bass:'x.......x.....x.',
    arp:{ins:'pluck',wave:'sawtooth',step:2,dens:.8,mode:'up',oct:0,vel:.12,cut:2200,dur:.25},pad:{wave:'sawtooth',cut:1100,vel:.1},sfx:'pluck'} },
{ id:'xn', code:'Xn', name:'Xanax', place:'The Quiet', cls:'dep', a:'#b9b4ff', b:'#ffc9b8',
  dur:34, cost:.2, tide:-.4, need:4, hint:'Nothing here can hurt you.',
  lines:['The alarm in my chest finally stopped.','Nothing mattered, and that felt like peace.','I am missing a Thursday. I have stopped looking for it.'],
  lesson:'Quiet I cannot remember is not rest.',
  phys:{k:12,d:6}, vis:{decay:.97,flow:.004,ca:.001,sat:.7,vig:.2,bloom:1.6,grain:.02},
  mus:{bpm:56,root:53,sc:SC.maj,prog:[0,3,0,3],
    arp:{ins:'ep',step:8,dens:.5,mode:'rnd',oct:1,vel:.14},pad:{wave:'sine',cut:700,vel:.22},lp:520,rev:.6,sfx:'ep'} },
{ id:'cb', code:'2C', name:'2C-B', place:'Neon Geometry', cls:'psy', a:'#ff00c8', b:'#c6ff00',
  dur:32, cost:.2, tide:.12, need:18, hint:'Your trail gathers too.',
  lines:['The colours came in on rails.','Everything I touched left a line, and the lines made sense.','I laughed until the geometry let go.'],
  lesson:'Joy does not have to mean anything.',
  phys:{k:45,d:9}, vis:{decay:.975,rot:-.004,flow:.002,ca:.01,sat:1.3,vig:.2},
  mus:{bpm:116,root:57,sc:SC.pen,prog:[0,2,3,0],k:'x..x....x.x.....',s:'....x.......x...',h:'x.xxx.xxx.xxx.xx',hv:.25,bass:'x..x..x...x.x...',
    arp:{ins:'pluck',wave:'square',step:1,dens:.6,mode:'rnd',oct:1,vel:.1,cut:4500,dur:.09},pad:{wave:'triangle',cut:1600,vel:.06},dly:.4,sfx:'pluck'} },
{ id:'mm', code:'4M', name:'4-MMC', place:'The Wave', cls:'emp', a:'#00e5ff', b:'#8a3dff',
  dur:32, cost:.3, tide:.4, need:6, hint:'Each wave is smaller. Fly through AGAIN to bring it back. It costs.',
  lines:['It came in waves, and every wave said again.','I was not chasing the feeling. I was chasing the start of it.','The bag was empty and the wanting was not.'],
  lesson:'Wanting more and enjoying it run on different engines.',
  phys:{k:60,d:11}, vis:{decay:.9,dx:.006,ca:.014,sat:1.2,bloom:1.2},
  mus:{bpm:140,root:52,sc:SC.min,prog:[0,5,3,4],k:'x...x...x...x...',h:'..x...x...x...x.',bass:'.xxx.xxx.xxx.xxx',
    arp:{ins:'pluck',wave:'sawtooth',step:1,dens:1,mode:'up',oct:1,vel:.11,cut:5000,dur:.1},pad:{wave:'sawtooth',cut:2000,vel:.07},sfx:'pluck'} },
{ id:'dm', code:'Dm', name:'DMT', place:'The Breakthrough', cls:'psy', a:'#ffcf3a', b:'#e0115f',
  dur:22, cost:.15, tide:0, need:30, hint:'Stop steering.',
  lines:['Three breaths, and the room came apart like a curtain.','There was nothing to steer. There was only letting go.','Fifteen minutes. I have spent years thinking about them.'],
  lesson:'Some things only open when I stop gripping.',
  phys:{k:30,d:10}, vis:{decay:.96,zoom:.02,rot:.01,ca:.016,sat:1.35,vig:.1,bloom:1.3},
  mus:{bpm:170,root:49,sc:SC.whole,prog:[0,1,2,3],riser:true,
    arp:{ins:'bell',step:1,dens:.9,mode:'up',oct:2,vel:.07},pad:{wave:'sawtooth',cut:4000,vel:.1},rev:.6,sfx:'bell'} }
];
const SUB = {}; SUBS.forEach((s,i)=>{ s.i=i; SUB[s.id]=s; });

const HUB_MUS  = {bpm:60,root:50,sc:SC.pen,prog:[0,0,3,3],arp:{ins:'bell',step:4,dens:.3,mode:'rnd',oct:2,vel:.09},pad:{wave:'triangle',cut:900,vel:.15},rev:.7};
const DAWN_MUS = {bpm:66,root:50,sc:SC.maj,prog:[0,3,4,0],bass:'x...............',arp:{ins:'bell',step:2,dens:.55,mode:'up',oct:2,vel:.1},pad:{wave:'sawtooth',cut:2400,vel:.13},rev:.7};

/* ---------- what happens when two doors open at once ---------- */
const PAIRS = {
  'md+ps':{name:'Candy flip',line:'They lifted each other. I have not seen colour like that before or since.',yield:1.5,cost:1.3,int:1.3},
  'cb+md':{name:'Nexus flip',line:'The geometry got a heartbeat.',yield:1.4,cost:1.3,int:1.2},
  'kt+md':{name:'Kitty flip',line:'Warm, and very far away, at the same time.',yield:1.2,cost:1.3,int:1.2},
  'cf+nc':{name:'Coffee and a cigarette',line:'The oldest pairing I know. Small, and it knew its place.',yield:1.35,cost:1,int:1},
  'al+nc':{name:'The smoke outside the bar',line:'Half the reason I went outside was the conversation.',yield:1.2,cost:1.1,int:1},
  'al+xn':{name:'Blackout',line:'I have no story for this one. That is the story. This is the pairing that stops people breathing.',yield:0,cost:2,int:1,black:1},
  'al+co':{name:'Feels like sober',line:'The tide said level. My heart knew better.',yield:1.1,cost:1.8,int:1.1,pound:.5},
  'al+md':{name:'Blunted',line:'The drink sat on the glow like a wet coat.',yield:.6,cost:1.4,int:.8},
  'md+mm':{name:'Overdrawn',line:'Two withdrawals from the same account.',yield:1.1,cost:1.8,int:1.2,pound:.4}
};
const CLASS_RULES = [
  [['stim','stim'],{name:'Stacked',line:'More was not more. It was only louder.',yield:.7,cost:1.5,int:1.2,pound:1}],
  [['stim','lite'],{name:'One more push',line:'A little extra on top of a lot. I felt it in my jaw.',yield:.9,cost:1.2,int:1.1,pound:.4}],
  [['emp','stim'],{name:'Overdrawn',line:'Two withdrawals from the same account.',yield:1,cost:1.7,int:1.2,pound:.6}],
  [['stim','dep'],{name:'Tug of war',line:'The tide says level. The well says otherwise.',yield:.8,cost:1.7,int:1}],
  [['emp','dep'],{name:'Blunted',line:'One of them kept turning the other one down.',yield:.6,cost:1.4,int:.8}],
  [['dep','dep'],{name:'Sinking',line:'Too far down to see anything.',yield:.2,cost:1.7,int:.7,black:.6}],
  [['dep','dis'],{name:'Sinking',line:'Too far down to see anything. I should not have been alone.',yield:.3,cost:1.6,int:.7,black:.5}],
  [['dep','psy'],{name:'The off switch',line:'It turned the colours down. It works. That is the whole trouble with it.',yield:.45,cost:1.2,int:.5,mute:1}],
  [['can','psy'],{name:'The amplifier',line:'The green turned everything up. Some nights that tipped it over.',yield:1.25,cost:1.1,int:1.5}],
  [['psy','psy'],{name:'Too many doors',line:'Two infinities do not add. I held on to the floor.',yield:.9,cost:1.3,int:1.7}],
  [['psy','dis'],{name:'Far out',line:'I went a long way and brought back very little I could say.',yield:1.2,cost:1.3,int:1.5}],
  [['emp','psy'],{name:'Lifted',line:'They lifted each other.',yield:1.35,cost:1.3,int:1.3}],
  [['psy','stim'],{name:'Sharp edges',line:'The wonder was there. So was the grinding of my teeth.',yield:.9,cost:1.3,int:1.2,pound:.4}],
  [['can','dep'],{name:'The spins',line:'The room turned and I turned the other way.',yield:.6,cost:1.3,int:1,spin:1}],
  [['can','stim'],{name:'Crossed wires',line:'Fast heart, slow thoughts.',yield:.85,cost:1.2,int:1,pound:.4}]
];
function comboOf(a,b){
  const key=[a.id,b.id].sort().join('+');
  if(PAIRS[key]) return PAIRS[key];
  for(const [cl,r] of CLASS_RULES)
    if((cl[0]===a.cls&&cl[1]===b.cls)||(cl[0]===b.cls&&cl[1]===a.cls)) return r;
  return {name:'Side by side',line:'They mostly ignored each other.',yield:1,cost:1.1,int:1};
}

const TEXT = {
  hubDefault:'Choose a door. Choose two to mix them. Carry five lights to morning.',
  hubDry:'The well is dry and the doors will not open. Hold the light and breathe.',
  hubEnough:'You are carrying enough. Now come back to level. Hold the light and breathe.',
  hubReady:'Five lights, a full well, level ground. The morning is yours.',
  hubPair:(a,b)=>`${a} with ${b}. You find out inside.`,
  noNew:'You already carry this one. It is never the first time twice.',
  dry:'The well was dry. The colours did not come.',
  slipped:'It slipped through my fingers. Some nights do.',
  ending:(o,c)=>`I opened ${o} ${o===1?'door':'doors'}. I left ${c} closed. They will keep.`
};
const WIN = { lights:5, well:.7, tide:.2 };
