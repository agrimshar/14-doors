import os, json, time, sys, urllib.request, threading
from concurrent.futures import ThreadPoolExecutor
KEY=os.environ["MESHY_KEY"]; API="https://api.meshy.ai/openapi/v2/text-to-3d"
OUT=os.path.join(os.path.dirname(__file__),"..","assets"); STATE=os.path.join(os.path.dirname(__file__),"meshy_state.json")
STYLE=" Clean simple geometry, semi-realistic, cyberpunk futuristic techno style, dark matte surfaces with thin glowing neon accent strips, single object centered, no background, no floor, game asset."
PROPS={
 "door":   ("A small freestanding arched doorway, a clean minimal portal prop: slim dark matte metal frame with a thin glowing neon edge strip, flat smooth surfaces, simple geometry, futuristic cyberpunk style, game asset, no base clutter", "01a1db9f-f57e-70be-85e9-aa57f297f102"),
 "bed":    ("A low modern platform bed with dark grey sheets and two pillows, slim black frame, a thin neon light strip under the base.", None),
 "desk":   ("A sleek futuristic desk with a slim floating holographic monitor and a glowing keyboard, dark matte surfaces.", None),
 "chair":  ("A modern ergonomic desk chair, dark matte with slim metal frame.", None),
 "guitar": ("An electric guitar resting upright on a simple metal stand, dark body with glowing neon fret markers.", None),
 "shower": ("A rectangular walk-in shower enclosure: three clear glass panels in a slim chrome frame, open front, a rain shower head on a chrome bar, white tiled back wall, thin neon strip along the top edge.", None),
 "counter":("A modern kitchen base cabinet unit, rectangular, matte dark grey doors with slim handles, smooth white stone countertop with a steel sink basin and a black cooktop on top, crisp straight edges, thin neon strip under the counter edge.", None),
 "table":  ("A modern dining table with two simple chairs, dark wood top, slim black metal legs.", None),
 "coffee": ("A compact futuristic coffee machine with a small glowing display, matte black.", None),
 "plant":  ("A tall indoor plant with broad leaves in a sleek matte dark planter with a thin neon ring at the rim.", None),
 "sofa":   ("A modern low sofa with clean lines, dark charcoal fabric, slim metal legs, thin neon strip along the base.", None),
 "tv":     ("A slim wall-mounted flat television with a thin glowing frame, matte black.", None),
 "armchair":("A modern armchair with clean lines, dark fabric, slim black metal legs.", None),
 "hoop":   ("A basketball hoop on a slim metal pole with a backboard, orange rim, clean simple geometry.", None),
 "bench":  ("A simple modern outdoor bench, dark wood slats on a slim black steel frame.", None),
 "lamp":   ("A tall minimalist floor lamp, slim dark pole with a glowing cylindrical neon tube at the top.", None),
 "speaker":("A tall professional PA loudspeaker cabinet, matte black box with two large round speaker cones with visible dust caps and a horn tweeter at the top, metal grille, glowing neon ring around each cone.", None),
 "person": ("A stylized faceless human figure standing upright in a neutral pose, smooth simple surfaces, slim futuristic jumpsuit, no facial features, clean minimal game character.", None),
 "rug":    ("A flat rectangular rug with a simple geometric cyberpunk pattern, dark with thin neon lines, very thin.", None),
 "fence":  ("A low modern garden fence segment, horizontal dark slats with a thin neon strip, clean simple geometry.", None),
}
lock=threading.Lock(); state=json.load(open(STATE)) if os.path.exists(STATE) else {}
def save():
    with lock: json.dump(state,open(STATE,"w"),indent=1)
def req(method,url,body=None):
    r=urllib.request.Request(url,method=method,data=json.dumps(body).encode() if body else None,headers={"Authorization":"Bearer "+KEY,"Content-Type":"application/json"})
    return json.load(urllib.request.urlopen(r,timeout=60))
def wait(tid):
    while True:
        t=req("GET",f"{API}/{tid}")
        if t["status"] in("SUCCEEDED","FAILED","CANCELED","EXPIRED"): return t
        time.sleep(10)
def run(name):
    prompt,pre=PROPS[name]; st=state.setdefault(name,{})
    try:
        if "preview" not in st:
            if pre: st["preview"]=pre
            else:
                body={"mode":"preview","prompt":prompt+("" if name=="door" else STYLE),"ai_model":"meshy-7.1","should_remesh":True,"target_polycount":20000,"target_formats":["glb"]}
                if name=="person": body["pose_mode"]="a-pose"
                st["preview"]=req("POST",API,body)["result"]
            save()
        t=wait(st["preview"]); print(name,"preview",t["status"],t.get("task_error"),flush=True)
        if t["status"]!="SUCCEEDED": st["error"]=str(t.get("task_error")); save(); return
        if "refine" not in st:
            st["refine"]=req("POST",API,{"mode":"refine","preview_task_id":st["preview"],"enable_pbr":True,"texture_resolution":"2k","target_formats":["glb"]})["result"]; save()
        t=wait(st["refine"]); print(name,"refine",t["status"],t.get("task_error"),flush=True)
        if t["status"]!="SUCCEEDED": st["error"]=str(t.get("task_error")); save(); return
        urllib.request.urlretrieve(t["model_urls"]["glb"],f"{OUT}/{name}.glb")
        os.makedirs(os.path.join(os.path.dirname(__file__),"thumbs"),exist_ok=True); urllib.request.urlretrieve(t["thumbnail_url"],os.path.join(os.path.dirname(__file__),"thumbs",name+".png"))
        st["done"]=True; st["size"]=os.path.getsize(f"{OUT}/{name}.glb"); save(); print(name,"DONE",st["size"],flush=True)
    except Exception as e:
        print(name,"ERROR",repr(e),flush=True); st["error"]=repr(e); save()
names=sys.argv[1:] or list(PROPS)
with ThreadPoolExecutor(6) as ex: list(ex.map(run,names))
print("ALL DONE")
