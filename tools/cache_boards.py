import json, os, re, hashlib, urllib.request, urllib.error, sys
from concurrent.futures import ThreadPoolExecutor
ROOT=os.path.expanduser("~/jobs-platform")
CACHE=os.path.join(ROOT,"tools",".cache"); os.makedirs(CACHE,exist_ok=True)
src=open(os.path.join(ROOT,"apps-script","Companies.gs")).read()
rows=re.findall(r'\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*(\d+),\s*(true|false)\s*,\s*(true|false)\s*\]',src)
active=[r for r in rows if r[5]=="true" and (r[6]=="true" or 50<=int(r[4])<=500)]
print(f"{len(rows)} companies, {len(active)} active in-band", file=sys.stderr)
def url_for(tok,srcname):
    if srcname=="greenhouse": return f"https://boards-api.greenhouse.io/v1/boards/{tok}/jobs?content=true"
    if srcname=="lever": return f"https://api.lever.co/v0/postings/{tok}?mode=json"
    return f"https://api.ashbyhq.com/posting-api/job-board/{tok}?includeCompensation=true"
def grab(r):
    u=url_for(r[0],r[1])
    p=os.path.join(CACHE,hashlib.md5(u.encode()).hexdigest()+".json")
    if os.path.exists(p): return (r[0],"cached")
    try:
        req=urllib.request.Request(u,headers={"User-Agent":"Mozilla/5.0","Accept":"application/json"})
        with urllib.request.urlopen(req,timeout=30) as resp:
            body=resp.read().decode("utf-8","replace")
        json.loads(body)
        open(p,"w").write(body); return (r[0],"ok")
    except Exception as e:
        open(p,"w").write("null"); return (r[0],f"fail {e}")
with ThreadPoolExecutor(max_workers=12) as ex:
    res=list(ex.map(grab,active))
bad=[x for x in res if x[1].startswith("fail")]
print(f"fetched {len(res)}, failures {len(bad)}: {bad[:8]}", file=sys.stderr)
json.dump([{"token":r[0],"source":r[1],"name":r[2],"industry":r[3],"headcount":int(r[4]),"tier":("A" if (r[6]=="true" or 50<=int(r[4])<=200) else "B")} for r in active],
          open(os.path.join(ROOT,"tools","active.json"),"w"))
