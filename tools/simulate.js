const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.join(process.env.HOME,'jobs-platform');
const CACHE=path.join(ROOT,'tools','.cache');
globalThis.__nodeGetJson=(url)=>{
  const p=path.join(CACHE,crypto.createHash('md5').update(url).digest('hex')+'.json');
  if(!fs.existsSync(p))return null;
  const raw=fs.readFileSync(p,'utf8'); try{return JSON.parse(raw);}catch(e){return null;}
};
for(const f of ['Config.gs','Companies.gs','Sources.gs','Scoring.gs'])
  eval(fs.readFileSync(path.join(ROOT,'apps-script',f),'utf8'));

const companies=JSON.parse(fs.readFileSync(path.join(ROOT,'tools','active.json'),'utf8'));
let all=[],rejects={},matched=[];
for(const co of companies){
  const jobs=fetchCompany_({token:co.token,source:co.source,name:co.name,industry:co.industry});
  jobs.forEach(j=>{j.tier=co.tier;j.headcount=co.headcount;});
  all=all.concat(jobs);
  for(const j of jobs){
    const r=scoreJob_(j,null);
    if(r.ok) matched.push({j,r});
    else rejects[r.rejectReason]=(rejects[r.rejectReason]||0)+1;
  }
}
matched.sort((a,b)=>b.r.score-a.r.score);
console.log(`companies fetched: ${companies.length}`);
console.log(`postings seen:     ${all.length}`);
console.log(`matched:           ${matched.length}`);
console.log('\nrejection reasons:');
Object.entries(rejects).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(`  ${String(v).padStart(5)}  ${k}`));

const fam={},met={},ind={};
matched.forEach(({j,r})=>{fam[r.familyLabel]=(fam[r.familyLabel]||0)+1;met[r.metro]=(met[r.metro]||0)+1;ind[j.industry]=(ind[j.industry]||0)+1;});
console.log('\nmatched by role family:');Object.entries(fam).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(`  ${String(v).padStart(4)}  ${k}`));
console.log('\nmatched by metro:');Object.entries(met).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(`  ${String(v).padStart(4)}  ${k}`));
console.log('\nmatched by tier:');const tt={};matched.forEach(({r})=>tt[r.tier]=(tt[r.tier]||0)+1);Object.entries(tt).forEach(([k,v])=>console.log(`  ${String(v).padStart(4)}  tier ${k}`));
console.log('\nmatched by industry:');Object.entries(ind).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(`  ${String(v).padStart(4)}  ${k}`));

console.log('\n=== what day one would show him ===');
matched.slice(0,5).forEach(({j,r},i)=>{
  console.log(`\n${i+1}. [${r.score}] ${j.title} — ${j.company}`);
  console.log(`   ${j.location} | ${j.industry} | posted ${String(j.postedAt).slice(0,10)} | ${j.salaryText||'no comp listed'}`);
  console.log(`   ${r.reasons.join(' · ')}`);
  console.log(`   ${j.url}`);
});
console.log('\n=== next 15 (the backlog) ===');
matched.slice(5,20).forEach(({j,r},i)=>console.log(`${String(i+6).padStart(3)}. [${r.score}] ${j.title} — ${j.company} (${j.location})`));
