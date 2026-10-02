const {ROOT,useContext}=require('./test-loader.cjs');
const path=require('node:path'),assert=require('node:assert/strict'),fs=require('node:fs');
const L=path.join(ROOT,'lib/clean/assessments/trusted-asset-proof');
const {fetchStoredProofAsset,ProofAssetDeliveryError}=require(path.join(L,'assessment-proof.ts'));
const {getTrustedAssetProofItems,getTrustedAssetProofFile}=require(path.join(L,'catalogue.server.ts'));
const {GET}=require(path.join(ROOT,'app/api/internal/assessment-lab/assets-proof/[fileName]/route.ts'));
const items=getTrustedAssetProofItems(), checks=[];
function c(name,val){assert.ok(val,name);checks.push(name);}
const signal=()=>new AbortController().signal;
async function fail(name,item,format,fetcher,code){await assert.rejects(fetchStoredProofAsset(item,format,signal(),fetcher),e=>e instanceof ProofAssetDeliveryError&&e.code===code);checks.push(name);}
async function main(){
 process.env.MYLEARNA_ASSESS_ASSET_PROOF='true';process.env.VERCEL_ENV='preview';
 useContext({user:{id:'staff-fixture'},profile:{is_admin:true}});
 for(const item of items)for(const format of ['svg','png']){
  const {bytes,mime}=await fetchStoredProofAsset(item,format,signal(),async(href,opts)=>{
   c(item.kind+'/'+format+': same-origin credentials',opts.credentials==='same-origin');
   c(item.kind+'/'+format+': no cache or redirects',opts.cache==='no-store'&&opts.redirect==='error');
   return GET(new Request('https://proof.example'+href),{params:Promise.resolve({fileName:href.split('/').pop()})});
  });
  c(item.kind+'/'+format+': exact delivered bytes',Buffer.compare(Buffer.from(bytes),getTrustedAssetProofFile(item.asset.id+'.'+format).bytes)===0);
  c(item.kind+'/'+format+': expected type',mime===(format==='svg'?'image/svg+xml':'image/png'));
 }
 const i=items[0], source=getTrustedAssetProofFile(i.asset.id+'.svg');
 for(const status of [401,403])await fail('denied '+status,i,'svg',async()=>new Response(null,{status}),'access_denied');
 for(const status of [404,500,503])await fail('unavailable '+status,i,'svg',async()=>new Response(null,{status}),'load_error');
 await fail('wrong MIME',i,'svg',async()=>new Response(source.bytes,{headers:{'content-type':'text/html'}}),'wrong_mime');
 await fail('wrong byte length',i,'svg',async()=>new Response('<svg/>',{headers:{'content-type':'image/svg+xml'}}),'integrity_mismatch');
 const edited=source.bytes.slice();edited[20]^=1;
 await fail('same-size wrong hash',i,'svg',async()=>new Response(edited,{headers:{'content-type':'image/svg+xml'}}),'integrity_mismatch');
 for(const href of ['https://evil.example/diagram.svg','/api/internal/assessment-lab/assets-proof/../private','/api/internal/assessment-lab/assets-proof/a?token=x']){
  let called=false;await fail('path blocked '+href,{...i,asset:{...i.asset,svgHref:href}},'svg',async()=>{called=true;return new Response();},'load_error');c('no outbound request for rejected path',!called);
 }
 const out=path.resolve(process.env.PROOF_EVIDENCE_DIR||path.join(ROOT,'.assessment-proof-evidence'));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'delivery-tests.json'),JSON.stringify({status:'passed',assertions:checks.length,scope:'Real browser delivery function with native Node Web Crypto and real asset route under mocked auth; fetch boundary supplied by test',checks},null,2));console.log(checks.length+' delivery assertions passed');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
