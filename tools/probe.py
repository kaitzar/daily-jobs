import json, sys, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

UA = {"User-Agent":"Mozilla/5.0 (compatible; jobfeed/1.0)"}

def get(url, timeout=20):
    req = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception:
        return 0, ""

def probe(entry):
    token, cat = entry.split("|")
    out = []
    s, b = get(f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs")
    if s == 200:
        try:
            n = len(json.loads(b).get("jobs", []))
            if n: out.append(("greenhouse", token, cat, n))
        except Exception: pass
    s, b = get(f"https://api.lever.co/v0/postings/{token}?mode=json")
    if s == 200:
        try:
            d = json.loads(b)
            if isinstance(d, list) and d: out.append(("lever", token, cat, len(d)))
        except Exception: pass
    s, b = get(f"https://api.ashbyhq.com/posting-api/job-board/{token}")
    if s == 200:
        try:
            n = len(json.loads(b).get("jobs", []))
            if n: out.append(("ashby", token, cat, n))
        except Exception: pass
    return out

entries = [l.strip() for l in open(sys.argv[1]) if l.strip()]
res = []
with ThreadPoolExecutor(max_workers=16) as ex:
    for r in ex.map(probe, entries):
        res.extend(r)
res.sort(key=lambda x: (x[2], x[1]))
for src, tok, cat, n in res:
    print(f"{src}\t{tok}\t{cat}\t{n}")
print(f"--- {len(res)} live boards of {len(entries)} candidates", file=sys.stderr)
