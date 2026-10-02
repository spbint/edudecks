const {ROOT}=require('./test-loader.cjs');
const path=require('node:path');
const assert=require('node:assert/strict');
const ITEMS=require(path.join(ROOT,'lib/clean/assessments/trusted-asset-proof/items.generated.json'));
const {recordAnswer,orderedOptions,summarise}=require(path.join(ROOT,'lib/clean/assessments/trusted-asset-proof/assessment-proof.ts'));
const fs=require('node:fs');
let checks=0;const c=(condition)=>{assert.ok(condition);checks++};
const context={format:'svg',mode:'assess',hintUsed:false,descriptionOpened:false};
for(const i of ITEMS){
  for(const a of i.options){const r=recordAnswer(i,'ready',a.id,context);c(r.correct===(a.id===i.correctOptionId));c(r.assetSha256===i.asset.svgSha256);}
  for(const state of ['loading','error']){assert.throws(()=>recordAnswer(i,state,i.correctOptionId,context));checks++;}
  assert.throws(()=>recordAnswer(i,'ready','invalid',context));checks++;
  c(recordAnswer(i,'ready',null,context).correct===null);
  for(let attempt=0;attempt<8;attempt++){const os=orderedOptions(i,attempt);c(os.length===4&&new Set(os.map(o=>o.id)).size===4);c(os.find(o=>o.id===i.correctOptionId).label===i.options.find(o=>o.id===i.correctOptionId).label);}
}
const rs=[recordAnswer(ITEMS[0],'ready',ITEMS[0].correctOptionId,context),recordAnswer(ITEMS[1],'ready',null,context)];
const s=summarise(ITEMS,rs);c(s.correct===1);c(s.incorrect===0);c(s.notKnown===1);c(s.notAttempted===4);c(s.answered===1);
c(summarise(ITEMS,ITEMS.map(i=>recordAnswer(i,'ready',i.correctOptionId,context))).correct===6);
fs.writeFileSync(path.join(process.env.PROOF_EVIDENCE_DIR||path.join(ROOT,'.assessment-proof-evidence'),'logic-checks.json'),JSON.stringify({status:'passed',assertions:checks,scope:'Scoring guard, stable IDs under shuffling, correct/incorrect/not-known/not-attempted separation'},null,2));
console.log(`${checks} logic assertions passed.`);
