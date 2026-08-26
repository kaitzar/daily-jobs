const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.join(process.env.HOME,'jobs-platform');
const CACHE=path.join(ROOT,'tools','.cache');
globalThis.__nodeGetJson=(url)=>{const p=path.join(CACHE,crypto.createHash('md5').update(url).digest('hex')+'.json');
  if(!fs.existsSync(p))return null;try{return JSON.parse(fs.readFileSync(p,'utf8'));}catch(e){return null;}};
for(const f of ['Config.gs','Companies.gs','Sources.gs','Scoring.gs'])
  eval(fs.readFileSync(path.join(ROOT,'apps-script',f),'utf8'));
const companies=JSON.parse(fs.readFileSync(path.join(ROOT,'tools','active.json'),'utf8'));
let matched=[];
for(const co of companies){const jobs=fetchCompany_({token:co.token,source:co.source,name:co.name,industry:co.industry});
  jobs.forEach(j=>{j.tier=co.tier;j.headcount=co.headcount;});
  for(const j of jobs){const r=scoreJob_(j,null);if(r.ok)matched.push({j,r});}}
matched.sort((a,b)=>b.r.score-a.r.score);
const shape=({j,r})=>({job_id:j.id,company:j.company,title:j.title,location:j.location,metro:r.metro,
  remote:!!j.remote,industry:j.industry,url:j.url,posted_at:String(j.postedAt).slice(0,10),score:r.score,
  family:r.family,family_label:r.familyLabel,reasons:r.reasons,salary:j.salaryText||'',has_letter:false,
  excerpt:String(j.description||'').slice(0,500),status:'served',tier:r.tier,headcount:j.headcount||''});
const decided={};
const letters={};
const RESUME_LABELS={bizops:'Business Ops / Strategy & Ops',program:'Program / Project Coordination',
 revops:'Revenue / Sales Operations',bizdev:'Business Development',ae:'Account Executive',
 sdr:'Sales Development',supplychain:'Supply Chain / Logistics Ops',founders_assoc:"Founder's Associate"};
const SAMPLE=`Treeswift is doing the thing I spent two months of this year doing by hand - I planted 5,000 trees on a 50-day off-grid deployment in Sequoia National Forest, and the hardest part was never the planting. It was knowing what was actually out there.

On that deployment I partnered with leadership on logistics planning and team coordination for a 150,000-tree restoration effort, which meant resupply, crew scheduling and contingency planning with no connectivity. Before that I independently ran the day-to-day of a small manufacturer - bookings, technician scheduling, QuickBooks inventory and vendor shipments.

What draws me to this role is that it sits between the field and the numbers. I've built financial models and ROI projections at a founding-stage startup, and I've also carried supplies up a mountain.

I'd welcome the chance to talk about where the operations gaps are as you scale.`;
http.createServer((req,res)=>{
  const u=new URL(req.url,'http://x');
  if(u.pathname==='/api'){
    const a=u.searchParams.get('action');let out={ok:true};
    const five=matched.slice(0,5).map(shape).map(j=>({...j,status:decided[j.job_id]||'served'}));
    const remaining=five.filter(j=>j.status==='served').length;
    if(a==='today')out={ok:true,date:new Date().toISOString().slice(0,10),jobs:five,remaining,
      all_decided:remaining===0,backlog_unlocked:remaining===0,pool_size:matched.length};
    else if(a==='backlog')out=remaining>0?{ok:true,locked:true,remaining,jobs:[]}:{ok:true,locked:false,jobs:matched.slice(5,20).map(shape)};
    else if(a==='decide'){decided[u.searchParams.get('job_id')]=u.searchParams.get('decision');out={ok:true};}
    else if(a==='undo'){delete decided[u.searchParams.get('job_id')];out={ok:true};}
    else if(a==='letter'){
      const id=u.searchParams.get('job_id');const force=u.searchParams.get('force')==='1';
      const j=matched.map(shape).find(x=>x.job_id===id)||five[0];
      if(!letters[id]||force)letters[id]=SAMPLE;
      out={ok:true,job_id:id,letter:letters[id],cached:!force,
        resume_family:j.family,resume_label:RESUME_LABELS[j.family]||'default'};
    }
    else if(a==='pdf'){out={ok:false,error:'PDF generation runs in Apps Script only'};}
    else if(a==='stats')out={ok:true,by_family:[{family:'sdr',applied:1,skipped:5,skip_rate:83,influencing:true},
      {family:'program',applied:4,skipped:1,skip_rate:20,influencing:true}],by_company:[],totals:{applied:5,skipped:6}};
    res.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
    return res.end(JSON.stringify(out));
  }
  if(req.method==='POST'){
    let body='';req.on('data',c=>body+=c);
    return req.on('end',()=>{
      try{const d=JSON.parse(body);if(d.action==='save_letter')letters[d.job_id]=d.text;}catch(e){}
      res.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
      res.end(JSON.stringify({ok:true}));
    });
  }
  let f=u.pathname==='/'?'/index.html':u.pathname;
  const p=path.join(ROOT,'web',f);
  if(!fs.existsSync(p)){res.writeHead(404);return res.end('nf');}
  const ct=f.endsWith('.css')?'text/css':f.endsWith('.js')?'text/javascript':'text/html';
  let body=fs.readFileSync(p,'utf8');
  if(f==='/config.js')body='window.JOBS_CONFIG={API_URL:"http://127.0.0.1:8899/api",API_KEY:""};';
  res.writeHead(200,{'Content-Type':ct});res.end(body);
}).listen(8899,()=>console.log('mock on 8899, matched='+matched.length));
