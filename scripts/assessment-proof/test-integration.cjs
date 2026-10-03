const {ROOT,useContext,calls}=require('./test-loader.cjs');
const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict'),crypto=require('node:crypto');
const L=path.join(ROOT,'lib/clean/assessments/trusted-asset-proof');
const {isTrustedAssetProofEnabled}=require(path.join(L,'environment.ts'));
const {getTrustedAssetProofAccess}=require(path.join(L,'access.server.ts'));
const {getTrustedAssetProofFile,getTrustedAssetProofItems}=require(path.join(L,'catalogue.server.ts'));
const {GET}=require(path.join(ROOT,'app/api/internal/assessment-lab/assets-proof/[fileName]/route.ts'));
const page=require(path.join(ROOT,'app/(auth)/assessment-lab/assets-proof/page.tsx')).default;
const checks=[];function c(name,condition){assert.ok(condition,name);checks.push(name);}
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const url='https://proof.example/api/internal/assessment-lab/assets-proof/';
const request=name=>new Request(url+name);
const invoke=name=>GET(request(name),{params:Promise.resolve({fileName:name})});
const staff={user:{id:'staff-fixture'},profile:{is_admin:true}};
async function main(){
 const before={flag:process.env.MYLEARNA_ASSESS_ASSET_PROOF,vercel:process.env.VERCEL_ENV,node:process.env.NODE_ENV};
 try {
  for(const flag of [undefined,'','false','TRUE','true'])for(const vercel of [undefined,'production','preview','development','staging'])for(const node of ['development','production','test']) {
   const expected=flag==='true'&&(vercel==='preview'||!vercel&&node==='development');
   c('environment:'+JSON.stringify([flag,vercel,node]),isTrustedAssetProofEnabled({MYLEARNA_ASSESS_ASSET_PROOF:flag,VERCEL_ENV:vercel,NODE_ENV:node})===expected);
  }
  process.env.MYLEARNA_ASSESS_ASSET_PROOF='false';process.env.VERCEL_ENV='preview';useContext(staff);
  c('disabled gate', (await getTrustedAssetProofAccess()).status===404);
  c('disabled makes no auth or db call',calls.length===0);
  process.env.MYLEARNA_ASSESS_ASSET_PROOF='true';
  const denied=[
   [{},401],
   [{user:{id:'family-fixture'},profile:{is_admin:false}},403],
   [{user:{id:'family-fixture',user_metadata:{role:'admin',is_admin:true}},profile:{is_admin:false}},403],
   [{user:{id:'staff-fixture'},profile:{is_admin:'true'}},403],
   [{user:{id:'staff-fixture'},profile:{is_admin:1}},403],
   [{user:{id:'staff-fixture'},profile:{is_admin:true},profileError:{message:'private-db-error'}},403],
   [{...staff,userError:{message:'private-token-error'}},401],
   [{...staff,labEnabled:false},403],
   [{...staff,throwClient:true},503],[{...staff,throwUser:true},503],[{...staff,throwProfile:true},503],
  ];
  for(let i=0;i<denied.length;i++) {
   const [context,status]=denied[i];useContext(context);const access=await getTrustedAssetProofAccess();
   c('gate deny '+i,access.allowed===false&&access.status===status);
   const response=await invoke('myl-assess-number-line-v1.svg');
   c('asset deny '+i,response.status===status);
   c('deny cache '+i,response.headers.get('cache-control').includes('no-store'));
   c('deny no secret/body/asset leak '+i,await response.text()==='Assessment proof unavailable.');
   await assert.rejects(page(),status===401?/NEXT_REDIRECT:\/login\?next=/:/NEXT_NOT_FOUND/);checks.push('page deny '+i);
  }
  useContext(staff);c('staff allowed',(await getTrustedAssetProofAccess()).allowed===true);
  c('verified session queried before profile',calls.indexOf('getUser')<calls.indexOf('from:profiles'));
  c('role reads own verified ID',calls.includes('eq:id:staff-fixture'));
  c('role projection is restricted',calls.includes('select:is_admin'));
  const manifest=JSON.parse(fs.readFileSync(path.join(L,'assets/manifest.json'),'utf8'));
  const items=getTrustedAssetProofItems();c('six source fixtures',items.length===6);
  for(const item of items){
   const original=manifest.items.find(i=>i.id===item.id);
   const withoutHrefs=structuredClone(item);delete withoutHrefs.asset.svgHref;delete withoutHrefs.asset.pngHref;
   assert.deepEqual(withoutHrefs,original);checks.push(item.kind+': question/content unchanged');
   for(const format of ['svg','png']){
    const name=item.asset.id+'.'+format, file=getTrustedAssetProofFile(name);
    const bytes=fs.readFileSync(path.join(L,'assets',name));
    c(name+': original checksum',sha(bytes)===item.asset[format+'Sha256']);
    c(name+': original/served bytes exact',Buffer.compare(bytes,file.bytes)===0);
    const res=await invoke(name);c(name+': staff HTTP 200',res.status===200);
    c(name+': HTTP bytes exact',Buffer.compare(bytes,Buffer.from(await res.arrayBuffer()))===0);
    c(name+': content type exact',res.headers.get('content-type')===file.mimeType);
    c(name+': no CDN caching',res.headers.get('cache-control').includes('no-store')&&res.headers.get('vercel-cdn-cache-control')==='no-store');
    c(name+': digest header',res.headers.get('x-mylearna-asset-sha256')===sha(bytes));
    c(name+': nosniff',res.headers.get('x-content-type-options')==='nosniff');
   }
  }
  for(const name of ['../../package.json','__proto__','constructor','myl-assess-clock-v2.svg','anything.png','myl-assess-clock-v1.svg?bypass=1']) {
   c('allowlist:'+name,getTrustedAssetProofFile(name)===null);
   c('HTTP unknown:'+name,(await invoke(name)).status===404);
  }
  // Alter a copied transport record in test memory only: actual shipped source stays unchanged.
  const pack=require(path.join(L,'assetBytes.generated.json'));const record=pack['myl-assess-array-v1.svg'];const old=record.base64;
  record.base64=Buffer.from('tampered').toString('base64');
  assert.throws(()=>getTrustedAssetProofFile('myl-assess-array-v1.svg'),/integrity/);checks.push('server checks bytes not just manifest');
  c('server corrupt fails closed',(await invoke('myl-assess-array-v1.svg')).status===503);record.base64=old;
  const allowedPage=await page();c('page maintains staff gate',allowedPage.type==='staff-gate');
  const children=allowedPage.props.children;c('page passes six fixtures only to authorised staff',children[1].props.items.length===6);
  process.env.VERCEL_ENV='production';useContext(staff);
  c('production gate refuses even admin',(await getTrustedAssetProofAccess()).status===404);
  c('production asset refuses even admin',(await invoke('myl-assess-array-v1.svg')).status===404);
  await assert.rejects(page(),/NEXT_NOT_FOUND/);checks.push('production page unavailable');
  c('production does not contact database',calls.length===0);
  const report={status:'passed',assertions:checks.length,scope:'Real page/route/helper functions under mocked existing auth and Next render adapters; NOT a full Next.js or live Supabase test',checks};
  const output=path.resolve(process.env.PROOF_EVIDENCE_DIR||path.join(ROOT,'.assessment-proof-evidence'));fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'integration-tests.json'),JSON.stringify(report,null,2));
  console.log(checks.length+' integration assertions passed');
 }finally{for(const [key,val] of Object.entries({MYLEARNA_ASSESS_ASSET_PROOF:before.flag,VERCEL_ENV:before.vercel,NODE_ENV:before.node}))if(val===undefined)delete process.env[key];else process.env[key]=val;}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
