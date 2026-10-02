/** LOCAL TEST SERVER ONLY. Fake auth is confined to this file/test-loader.cjs.
 * No application route imports this script. Binds loopback, never deployed. */
const { ROOT, ts, setContextProvider } = require('./test-loader.cjs');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {AsyncLocalStorage}=require('node:async_hooks');
const store=new AsyncLocalStorage();setContextProvider(()=>store.getStore()||{});
const L=path.join(ROOT,'lib/clean/assessments/trusted-asset-proof');
const {GET}=require(path.join(ROOT,'app/api/internal/assessment-lab/assets-proof/[fileName]/route.ts'));
const {getTrustedAssetProofItems}=require(path.join(L,'catalogue.server.ts'));
const engine=ts.transpileModule(fs.readFileSync(path.join(L,'assessment-proof.ts'),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const css=fs.readFileSync(path.join(L,'assessment-proof.css'),'utf8');
process.env.VERCEL_ENV='preview';process.env.MYLEARNA_ASSESS_ASSET_PROOF='true';
function html(){return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LOCAL TEST HARNESS · MyLearna</title><style>body{margin:0}${css}</style></head><body><div id="mylearna-proof"></div><script>(()=>{const exports={};${engine}\nconst items=${JSON.stringify(getTrustedAssetProofItems()).replaceAll('<','\\u003c')}; window.__proof={mount:exports.mountAssessmentProof,items}; window.__proof.controller=exports.mountAssessmentProof(document.getElementById('mylearna-proof'),items);})();</script></body></html>`;}
const server=http.createServer((req,res)=>{
 const staff=req.headers.cookie?.split(';').some(c=>c.trim()==='proof_fixture=staff');
 const context=staff?{user:{id:'staff-fixture'},profile:{is_admin:true}}:{user:null,profile:null};
 store.run(context,async()=>{
  try{
   const url=new URL(req.url,'http://127.0.0.1');
   if(req.method!=='GET'){res.writeHead(405);res.end();return;}
   if(url.pathname==='/'){
    res.writeHead(staff?200:401,{'content-type':'text/html; charset=utf-8','cache-control':'no-store','content-security-policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; connect-src 'self'; base-uri 'none'; form-action 'none'"});
    res.end(staff?html():'Staff-only local test fixture.');return;
   }
   const prefix='/api/internal/assessment-lab/assets-proof/';
   if(url.pathname.startsWith(prefix)){
    const fileName=decodeURIComponent(url.pathname.slice(prefix.length));
    const result=await GET(new Request('http://127.0.0.1'+url.pathname),{params:Promise.resolve({fileName})});
    res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));return;
   }
   res.writeHead(404);res.end();
  }catch(e){console.error(e);res.writeHead(500);res.end('Local harness error');}
 });
});
server.listen(Number(process.env.PROOF_PORT||4318),'127.0.0.1',()=>console.log('LOCAL proof harness ready on 127.0.0.1:'+server.address().port));
