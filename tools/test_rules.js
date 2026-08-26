const fs=require('fs'),path=require('path');
const ROOT=path.join(process.env.HOME,'jobs-platform');
for(const f of ['Config.gs','Scoring.gs']) eval(fs.readFileSync(path.join(ROOT,'apps-script',f),'utf8'));
const base={company:'Acme',industry:'climate',description:'We are hiring.',postedAt:new Date(Date.now()-3*86400000).toISOString(),salaryMin:0,salaryMax:0,tier:'A',headcount:120,companyToken:'acme',department:''};
const cases=[
 ['Customer Success Manager','San Francisco',false,'reject','refused role'],
 ['Recruiting Coordinator','San Francisco',false,'reject','refused role'],
 ['Talent Operations Specialist','San Francisco',false,'reject','talent ops'],
 ['Executive Assistant','San Francisco',false,'reject','exec assistant'],
 ['Senior Business Operations Analyst','San Francisco',false,'reject','too senior'],
 ['Business Operations Analyst II','San Francisco',false,'reject','level II'],
 ['Sales Development Manager','San Francisco',false,'reject','manager outside program'],
 ['Program Manager, Deployment','San Francisco',false,'accept','PM is an IC title'],
 ['Account Executive','Remote - Europe',true,'reject','europe'],
 ['Account Executive','Remote - EMEA',true,'reject','emea'],
 ['Operations Associate','Austin, TX',false,'reject','metro not listed'],
 ['Operations Associate','Remote - United States',true,'accept','us remote'],
 ['Revenue Operations Associate','San Francisco',false,'accept','revops family'],
 ['Business Operations Associate','San Francisco',false,'accept','bizops family'],
 ['Software Engineer','San Francisco',false,'reject','not a target family'],
 ['Project Coordinator','San Luis Obispo, CA',false,'accept','slo'],
];
let pass=0,fail=0;
for(const [title,loc,remote,expect,note] of cases){
  const r=scoreJob_(Object.assign({},base,{title,location:loc,remote}),null);
  const got=r.ok?'accept':'reject';
  const ok=got===expect;
  ok?pass++:fail++;
  console.log(`${ok?'PASS':'FAIL'}  ${expect.padEnd(6)} ${title} @ ${loc}  ${ok?'':'-> got '+got+' '}(${r.rejectReason||('score '+r.score+', '+r.familyLabel)}) [${note}]`);
}
// family routing
console.log('\nfamily routing:');
[['Revenue Operations Associate','revops'],['Business Operations','bizops'],['Sales Operations Analyst','revops'],
 ['Business Development Representative','sdr'],['Business Development Associate','bizdev'],
 ['Technical Program Manager','program'],['Chief of Staff','founders_assoc'],['Logistics Coordinator','supplychain']]
 .forEach(([t,want])=>{const f=classifyRole_(t,'');const got=f?f.key:'none';
   const ok=got===want;ok?pass++:fail++;console.log(`${ok?'PASS':'FAIL'}  ${t} -> ${got} (want ${want})`);});
// scoring behaviours
console.log('\nscoring behaviours:');
const j=(o)=>scoreJob_(Object.assign({},base,{title:'Operations Associate',location:'San Francisco',remote:false},o),null);
const plain=j({});
const cold=j({description:'You will make 80 cold calls per day and hit quota.'});
const rich=j({salaryMin:95000,salaryMax:120000,salaryText:'$95K-$120K'});
const stretch=j({tier:'B',headcount:400});
const checks=[['cold calling penalised',cold.score<plain.score],['salary bonus applied',rich.score>plain.score],
  ['tier B discounted',stretch.score<plain.score],['tier surfaced',stretch.tier==='B']];
checks.forEach(([n,ok])=>{ok?pass++:fail++;console.log(`${ok?'PASS':'FAIL'}  ${n}`);});
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
