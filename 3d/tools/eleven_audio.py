import os, json, urllib.request, re, sys
from concurrent.futures import ThreadPoolExecutor
KEY=os.environ["XI"]; OUT=os.path.join(os.path.dirname(__file__),"..","audio")
def post(url,body,fmt="mp3_44100_96"):
    r=urllib.request.Request(url+"?output_format="+fmt,method="POST",data=json.dumps(body).encode(),headers={"xi-api-key":KEY,"Content-Type":"application/json"})
    return urllib.request.urlopen(r,timeout=600).read()
def save(path,data):
    open(path,"wb").write(data); print(os.path.relpath(path,OUT),len(data),flush=True)
jobs=[]
MUSIC={
 "hub":  "Clean minimal techno ambient at 92 BPM. Warm analog pads, soft muted kick, gentle hi-hats, a hopeful intimate domestic morning feeling with a neon futuristic sheen. Steady and seamlessly loopable, no build-ups, no vocals.",
 "night":"Deep hypnotic dark techno at 118 BPM. Driving kick, rolling sub bass, cold neon synth stabs, late night city feeling. Steady, loopable, no vocals.",
 "high": "Psychedelic dreamy techno at 100 BPM. Swirling detuned synths, euphoric hazy pads, sidechained warmth, kaleidoscopic and blissful but slightly unstable. Steady, loopable, no vocals.",
 "worry":"Tense dark ambient with a slow sub-bass pulse, distant dissonant alarm tones, cold reverberant textures, anxious and heavy. Steady, loopable, no vocals.",
 "end":  "Emotional ambient piece with soft piano, warm synth pad swells and a slow heartbeat-like pulse, quiet resolution, finding level ground. No vocals."}
for k,p in MUSIC.items():
    jobs.append((f"music/{k}.mp3",lambda p=p: post("https://api.elevenlabs.io/v1/music",{"prompt":p,"music_length_ms":60000,"model_id":"music_v2","force_instrumental":True})))
SFX={
 "door":  ("Deep neon door whoosh opening with a soft electric hum and a bright synthetic shimmer tail, cyberpunk game", 1.6, False),
 "task":  ("Soft futuristic UI confirmation chime, two warm notes, clean", 1.0, False),
 "shard": ("Reversed glass shimmer rising into a short crystalline sparkle", 1.4, False),
 "sleep": ("Slow soft downward synth sweep fading into silence, falling asleep", 2.5, False),
 "caught":("Sharp short tense alarm stinger, synthetic, cyberpunk", 1.2, False),
 "heart": ("Slow heavy heartbeat, two beats, muffled, close", 1.6, False),
 "step":  ("Single soft footstep on a hard floor, indoor, quiet sneaker", .5, False),
 "room":  ("Quiet house room tone with a soft electrical hum and a distant refrigerator, seamless loop", 10, True),
 "dawn":  ("Quiet early morning birds and a distant city hum, seamless loop", 10, True),
 "yard":  ("Night backyard ambience, crickets, light breeze, distant muffled techno party bass, seamless loop", 10, True)}
for k,(t,d,lp) in SFX.items():
    jobs.append((f"sfx/{k}.mp3",lambda t=t,d=d,lp=lp: post("https://api.elevenlabs.io/v1/sound-generation",{"text":t,"duration_seconds":d,"loop":lp,"prompt_influence":.5,"model_id":"eleven_text_to_sound_v3"})))
VOICES={"mom":"XrExE9yKIg1WjnnlVkGX","sis":"cgSgspJ2msm6clMCkdW9","dad":"nPczCjzI2devNBz1zQrb","jay":"bIHbv24MWmeRgasZH58o","me":"fjLCveakZM9h9ztOIOie"}
SAY={"calm":{"mom":['Morning, love.','Eat something, will you?','You sleeping all right?'],"sis":['Hey.','Can I borrow your charger?','You are being weird. Normal weird.'],"dad":['Game is on later.','Hey, kiddo.'],"jay":['You coming out tonight?','I have got everything, if you want it.']},
 "seen":['Your eyes are red.','Are you feeling okay?','You seem far away.','Why are you staring at the wall?'],
 "caught":['What is that? What are you taking?','I saw that.'],
 "worried":['Talk to me. Please.','We are worried about you.','You are not yourself lately.','I can hear you at night.'],
 "lash":['Stop! What is wrong with you?','Do not touch me!'],
 "over":['You are sweating. What did you take?','Why are you telling me all this?'],
 "found":['Mom! Come here. Something is wrong.'], "extra":{"mom":['Thank you for telling me.'],"sis":['You look awful. Are you eating?'],"dad":['You look awful. Are you eating?'],"jay":['You look awful. Are you eating?']}}
SAY["extra"]["mom"].append('You look awful. Are you eating?')
STORY={'open':'Thursday. I kept it in my room, and I kept it quiet.','day1':'Friday. The rest of the house opened up, and so did the cabinets.','day2':'Saturday. Jay texted. Come outside.','day3':'Sunday. Whatever I was building, this was the day it showed.',
 'locked1':'Not today. Friday.','locked2':'Not yet. Saturday.','goal':'That was enough for one day. Bed, or a little more.','again':'It was never the first time twice.','flat':'Sober felt flat now. That was new.','limit':'I could feel the edge of it coming.','lash':'I do not remember deciding to do that.','over':'I could not stop talking. I told them everything except the truth.','compulse':'Again. I did not choose it. My hands did.','pace':'I could not sit still. I could not do anything else either.','scramble':'The floor and I disagreed about which way was forward.','blackout':'Then nothing. Then morning, and someone had put a blanket on me.','talk':'I told her. She did not shout. She put the kettle on.','dry':'There was nothing left in me to spend.','dayClear':'A clear day. It was enough on its own.','dayLevel':'A good day. I would call it level.','dayLoud':'I had fun. I got nothing done.','dayLost':'I do not remember all of it. They do.','dayGrey':'I kept everything under control and forgot to enjoy any of it.',
 'endLevel':'Level. I kept my days and I kept my head. I still open a door now and then. I close it behind me. The house is loud with ordinary things, and I am in the middle of them.',
 'endClear':'Clear. I left every door closed. It turned out the house was enough, and so was I.',
 'endGrey':'Careful. Nothing went wrong. Not much went right, either. Balance is more than staying out of trouble. It also means showing up for the good parts.',
 'endKnown':'They knew. They found out before I admitted it to myself. Nobody shouted. They sat on my bed and said they loved me, and that it had to change. That was where getting level began.',
 'endHooked':'It had me. I stopped choosing somewhere around Saturday. Everything after that was the habit, wearing my clothes. Getting out started with saying so out loud.'}
manifest={"npc":{k:{} for k in VOICES if k!="me"},"me":{}}
def tts(who,text,stab=.45,style=.3):
    return post(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICES[who]}",{"text":text,"model_id":"eleven_multilingual_v2","voice_settings":{"stability":stab,"similarity_boost":.8,"style":style}})
def slug(t): return re.sub(r'[^a-z0-9]+','_',t.lower()).strip('_')[:28]
for who in ["mom","sis","dad","jay"]:
    lines=set(SAY["calm"][who]+SAY["seen"]+SAY["caught"]+SAY["worried"]+SAY["lash"]+SAY["over"]+SAY["extra"][who]+(SAY["found"] if who=="sis" else []))
    for t in sorted(lines):
        f=f"voice/{who}_{slug(t)}.mp3"; manifest["npc"][who][t]=os.path.basename(f)
        jobs.append((f,lambda who=who,t=t: tts(who,t,.4,.35)))
for k,t in STORY.items():
    f=f"voice/me_{k}.mp3"; manifest["me"][k]=os.path.basename(f)
    jobs.append((f,lambda t=t: tts("me",t,.55,.2)))
json.dump(manifest,open(OUT+"/voice/manifest.json","w"),indent=1)
def run(j):
    f,fn=j; path=f"{OUT}/{f}"
    if os.path.exists(path) and os.path.getsize(path)>1000: return
    try: save(path,fn())
    except Exception as e:
        body=e.read().decode()[:300] if hasattr(e,"read") else ""; print("ERROR",f,repr(e),body,flush=True)
print(len(jobs),"jobs",flush=True)
with ThreadPoolExecutor(2) as ex: list(ex.map(run,jobs))
print("ALL DONE")
