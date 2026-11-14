/* ---------- the house: what each substance does here, the people, the routine. edit freely ---------- */
const X3 = {
  md:{load:.55,hab:.04,joy:12,dur:24,pos:[11.5,20.8],day:2,ov:.45,trail:.6,ca:.006,sat:1.4,vig:.25,spd:1.1},
  ps:{load:.6,hab:.01,joy:12,dur:30,pos:[12.7,20.8],day:2,ov:.6,kal:.45,wob:.6,trail:.8,ca:.008,sat:1.5,zoom:1,spd:.85},
  cn:{load:.35,hab:.03,joy:8,dur:26,pos:[3.6,.8],day:0,ov:.4,trail:.85,sat:1.1,vig:.35,spd:.6,acc:2.5},
  al:{load:.4,hab:.06,joy:8,dur:24,pos:[10.8,13.1],day:1,ov:.3,wob:1.3,dbl:.012,trail:.5,ca:.006,spd:.9,acc:4,sway:1},
  kt:{load:.55,hab:.06,joy:9,dur:22,pos:[15.1,20.8],day:2,ov:.45,scan:1,pix:.5,ca:.012,sat:.55,vig:.5,spd:.6,lag:.6},
  cf:{load:.12,hab:.02,joy:3,dur:20,pos:[12,.8],day:0,ov:.18,sat:1.2,spd:1.25},
  nc:{load:.15,hab:.05,joy:4,dur:14,pos:[6.3,5.2],day:0,ov:.3,sat:.85,vig:.45,spd:1},
  co:{load:.5,hab:.1,joy:11,dur:14,pos:[13.9,20.8],day:2,ov:.4,ca:.012,sat:.8,vig:.45,spd:1.6,acc:30},
  ad:{load:.35,hab:.06,joy:7,dur:26,pos:[10.4,2.4],day:1,ov:.3,vig:.75,sat:1.1,spd:1.3},
  dx:{load:.35,hab:.06,joy:7,dur:26,pos:[10.4,3.8],day:1,ov:.3,vig:.4,spd:1.3},
  xn:{load:.45,hab:.08,joy:6,dur:26,pos:[10.4,1],day:1,ov:.4,trail:.9,sat:.6,vig:.2,spd:.55,acc:2.5},
  cb:{load:.5,hab:.02,joy:11,dur:24,pos:[16.3,20.8],day:2,ov:.5,kal:.2,trail:.85,ca:.01,sat:1.5,spd:1},
  mm:{load:.55,hab:.1,joy:10,dur:16,pos:[17.5,20.8],day:2,ov:.45,ca:.014,sat:1.3,spd:1.4},
  dm:{load:.7,hab:0,joy:13,dur:12,pos:[18.7,20.8],day:2,ov:.85,kal:.8,zoom:2,trail:.9,ca:.016,sat:1.6,spd:.12}
};
SUBS.forEach(s=>{ s.x=X3[s.id]; });

const DAYS = ['Thursday','Friday','Saturday','Sunday'];
const DAYLEN = 130;          // seconds of play from 08:00 to midnight
const GOALS = [16,24,32,38];   // joy needed each day to keep it

const TASKS = [
  {id:'work',name:'Do the coursework',x:5.8,z:1.7,day:0,joy:3,kind:'focus',room:'bed',line:'Two pages. They were good pages.'},
  {id:'guitar',name:'Play guitar',x:1.4,z:4.8,day:0,joy:4,kind:'play',room:'bed',line:'I played the same four chords and meant them.'},
  {id:'eat',name:'Eat with Mom',x:15.5,z:4.3,day:0,joy:3,kind:'bond',room:'kit',well:.2,line:'She asked about my week. I told her some of it.'},
  {id:'plant',name:'Water the plant',x:18.7,z:7.25,day:0,joy:2,kind:'care',room:'hall',line:'It had a new leaf.'},
  {id:'shower',name:'Take a shower',x:8.1,z:1.3,day:1,joy:2,kind:'care',room:'bath',well:.15,line:'Ten minutes of hot water. Nobody could tell after that.'},
  {id:'tv',name:'Watch the game with Dad',x:2.6,z:11.5,day:1,joy:3,kind:'bond',room:'liv',line:'We yelled at the same referee.'},
  {id:'hoops',name:'Shoot hoops with Jay',x:4.5,z:18,day:2,joy:4,kind:'play',room:'yard',well:.1,line:'I was out of breath and it felt like mine.'}
];

const NPCS = [
  {id:'mom',name:'Mom',col:'#ffb46a',day:0,path:[[13,2.2,3],[17,3,2],[15,4.6,1],[15,7.2,2],[15,4.6,0]],
    worried:[[15,4.6,0],[15,7.2,0],[6.4,7.2,5],[15,7.2,0]]},
  {id:'sis',name:'Maya',col:'#b9b4ff',day:0,path:[[2,7.2,2],[5,7.2,0],[5,4.8,2.5],[5,7.2,0],[10,7.2,1],[18,7.2,3],[10,7.2,0]],
    worried:[[5,7.2,1],[5,4.6,4],[5,7.2,0],[9,7.2,2]]},
  {id:'dad',name:'Dad',col:'#7fa0c8',day:1,path:[[3,11,4],[8,10.5,3],[6,12.6,5]]},
  {id:'jay',name:'Jay',col:'#35d07f',day:2,path:[[10,18,4],[7,17.5,3]]}
];

const SAY = {
  calm:{mom:['Morning, love.','Eat something, will you?','You sleeping all right?'],sis:['Hey.','Can I borrow your charger?','You are being weird. Normal weird.'],
        dad:['Game is on later.','Hey, kiddo.'],jay:['You coming out tonight?','I have got everything, if you want it.']},
  seen:['Your eyes are red.','Are you feeling okay?','You seem far away.','Why are you staring at the wall?'],
  caught:['What is that? What are you taking?','I saw that.'],
  worried:['Talk to me. Please.','We are worried about you.','You are not yourself lately.','I can hear you at night.'],
  lash:['Stop! What is wrong with you?','Do not touch me!'],
  over:['You are sweating. What did you take?','Why are you telling me all this?'],
  found:['Mom! Come here. Something is wrong.']
};

const STORY = {
  open:'Thursday. I kept it in my room, and I kept it quiet.',
  idle:'Nothing was happening. That was the problem.',
  itch:'Sitting still had started to cost something.',
  days:['','Friday. The rest of the house opened up, and so did the cabinets.','Saturday. Jay texted. Come outside.','Sunday. Whatever I was building, this was the day it showed.'],
  locked:['','Not today. Friday.','Not yet. Saturday.'],
  goal:'That was enough for one day. Bed, or a little more.',
  again:'It was never the first time twice.',
  flat:'Sober felt flat now. That was new.',
  limit:'I could feel the edge of it coming.',
  lash:'I do not remember deciding to do that.',
  over:'I could not stop talking. I told them everything except the truth.',
  compulse:'Again. I did not choose it. My hands did.',
  pace:'I could not sit still. I could not do anything else either.',
  scramble:'The floor and I disagreed about which way was forward.',
  blackout:'Then nothing. Then morning, and someone had put a blanket on me.',
  talk:'I told her. She did not shout. She put the kettle on.',
  dry:'There was nothing left in me to spend.',
  dayClear:'A clear day. It was enough on its own.',
  dayLevel:'A good day. I would call it level.',
  dayLoud:'I had fun. I got nothing done.',
  dayLost:'I do not remember all of it. They do.',
  dayGrey:'I kept everything under control and forgot to enjoy any of it.'
};
const ENDINGS = {
  level:{h:'Level.',t:'I kept my days and I kept my head. I still open a door now and then. I close it behind me. The house is loud with ordinary things, and I am in the middle of them.'},
  clear:{h:'Clear.',t:'I left every door closed. It turned out the house was enough, and so was I.'},
  grey:{h:'Careful.',t:'Nothing went wrong. Not much went right, either. Balance is more than staying out of trouble. It also means showing up for the good parts.'},
  known:{h:'They knew.',t:'They found out before I admitted it to myself. Nobody shouted. They sat on my bed and said they loved me, and that it had to change. That was where getting level began.'},
  hooked:{h:'It had me.',t:'I stopped choosing somewhere around Saturday. Everything after that was the habit, wearing my clothes. Getting out started with saying so out loud.'}
};
