// Test harness only. Never imported by application code and no bypass flag in the app.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
let ts;
try { ts = require('typescript'); }
catch { ts = require(path.join(require('node:child_process').execSync('npm root -g',{encoding:'utf8'}).trim(),'typescript')); }
const ROOT = path.resolve(__dirname,'../..');
const originalLoad = Module._load;
let mockContext = () => ({user:null, profile:null});
const calls=[];
const jsx = (type, props) => ({type, props});
function resolveLocal(name) {
 const target=path.join(ROOT,name.slice(2));
 for(const suffix of ['', '.ts', '.tsx','.json']) if(fs.existsSync(target+suffix)&&fs.statSync(target+suffix).isFile()) return target+suffix;
 throw new Error('Missing local module '+name);
}
function authClient() {
 const c=mockContext(); calls.push('authClient');
 if(c.throwClient)throw new Error('private error that must not leak');
 return {
  auth:{async getUser(){calls.push('getUser');if(c.throwUser)throw new Error('private auth error');return {data:{user:c.user??null},error:c.userError??null};}},
  from(table){calls.push('from:'+table);return {
   select(columns){calls.push('select:'+columns);return {
    eq(key,value){calls.push('eq:'+key+':'+value);return {
     async maybeSingle(){calls.push('maybeSingle');if(c.throwProfile)throw new Error('private db error');return {data:c.profile??null,error:c.profileError??null};}
    };}
   };}
  };}
 };
}
Module._load=function(name,parent,isMain) {
 if(name==='server-only')return {};
 if(name==='@/lib/auth/serverRouteAuth')return {getServerAuthClient:async()=>authClient()};
 if(name==='@/lib/clean/assessments/assessmentPermissions')return {
  canAccessAssessmentLab:(_v,p)=>mockContext().labEnabled!==false&&p?.is_admin===true,
 };
 if(name==='next/navigation')return {
  notFound(){throw new Error('NEXT_NOT_FOUND');},redirect(to){throw new Error('NEXT_REDIRECT:'+to);},
 };
 if(name==='react/jsx-runtime')return {jsx,jsxs:jsx,Fragment:'fragment'};
 if(name==='next/link')return {__esModule:true,default:'link'};
 if(name==='@/app/components/clean/assessment-lab/AssessmentAccessGate')return {__esModule:true,default:'staff-gate'};
 if(name==='@/app/components/clean/assessment-lab/AssessmentLabWorkspace')return {__esModule:true,default:'old-lab'};
 if(name==='@/app/components/clean/assessment-lab/TrustedAssetProof')return {__esModule:true,default:'proof-player'};
 if(name.startsWith('@/'))return originalLoad.call(this,resolveLocal(name),parent,isMain);
 return originalLoad.call(this,name,parent,isMain);
};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(module,file)=>{
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,resolveJsonModule:true}}).outputText;
 module._compile(code,file);
};
exports.ROOT=ROOT;exports.ts=ts;exports.calls=calls;
exports.setContextProvider=fn=>{mockContext=fn;};
exports.useContext=c=>{mockContext=()=>c;calls.length=0;};
