"""Rendering regression, NOT live Next/Vercel validation.
Browser navigation is blocked in the execution environment: set_content is used.
The fetch test boundary bridges to real route functions over a local Node HTTP harness;
the auth boundary is fake. Web Crypto is bridged to hashlib only because about:blank
is not a secure context. test-delivery.cjs separately uses native Node Web Crypto.
"""
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError
import json,hashlib,base64,os,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
LIB=ROOT/'lib/clean/assessments/trusted-asset-proof'
E=Path(os.environ.get('PROOF_EVIDENCE_DIR',str(ROOT/'.assessment-proof-evidence')));E.mkdir(parents=True,exist_ok=True)
M=json.loads((LIB/'items.generated.json').read_text());checks=[];errors=[]
port=4321;base=f'http://127.0.0.1:{port}'
log=open(E/'browser-http-harness.log','w');proc=subprocess.Popen(['node',str(Path(__file__).with_name('http-harness.cjs'))],env={**os.environ,'PROOF_PORT':str(port)},stdout=log,stderr=log)
def request(path,cookie=True):
 r=Request(base+path,headers={'Cookie':'proof_fixture=staff'} if cookie else {})
 try:return urlopen(r,timeout=3)
 except HTTPError as e:return e
try:
 for _ in range(40):
  try:html=request('/').read().decode();break
  except OSError:time.sleep(.1)
 else:raise RuntimeError('HTTP harness failed')
 def transport(path):
  if not path.startswith('/api/internal/assessment-lab/assets-proof/'):raise ValueError('unexpected fixture request')
  r=request(path);return {'status':r.status,'headers':dict(r.headers),'data':base64.b64encode(r.read()).decode()}
 def check(name,val):assert val,name;checks.append(name)
 BOOT='''<script>(()=>{
window.__requests=[];window.__inject=null;
const realFetch=window.fetch.bind(window);
window.fetch=async(href,options={})=>{
 if(!String(href).startsWith('/api/internal/assessment-lab/assets-proof/')) return realFetch(href,options);
 window.__requests.push({href,method:options.method||'GET',credentials:options.credentials,cache:options.cache});
 if(window.__inject==='timeout')return new Promise((resolve,reject)=>{options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});});
 const result=await window.__proofTransport(String(href));
 let bytes=Uint8Array.from(atob(result.data),c=>c.charCodeAt(0));
 const headers=new Headers(result.headers);
 if(window.__inject==='corrupt'){bytes=bytes.slice();bytes[20]^=1;}
 if(window.__inject==='mime')headers.set('content-type','text/html');
 if(window.__inject==='denied')return new Response('Denied',{status:403});
 return new Response(bytes,{status:result.status,headers});
};
Object.defineProperty(crypto,'subtle',{configurable:true,value:{digest:async(name,bytes)=>{
 if(name!=='SHA-256')throw new Error('Unexpected digest');
 return Uint8Array.from(await window.__proofDigest(Array.from(new Uint8Array(bytes)))).buffer;
}}});
})();</script>'''
 html=html.replace('<head>','<head>'+BOOT,1)
 def button(page,a):return page.locator('[data-action="'+a+'"]')
 def ready(page):page.wait_for_selector('#mylearna-proof[data-screen="question"][data-asset-state="ready"]',timeout=6000)
 def start(page,mode='assess'):
  page.evaluate('window.__proof?.controller?.destroy()');page.set_content(html,wait_until='load');button(page,'mode-'+mode).click();button(page,'start').click();ready(page)
 def correct(page,item):page.locator('label.myl-option:has(input[value="'+item['correctOptionId']+'"])').click()
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('MYLEARNA_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  def new(width=1440,height=1000):
   context=browser.new_context(viewport={'width':width,'height':height},has_touch=width<900,reduced_motion='reduce')
   page=context.new_page();page.set_default_timeout(10000);page.expose_function('__proofTransport',transport);page.expose_function('__proofDigest',lambda data:list(hashlib.sha256(bytes(data)).digest()));page.on('pageerror',lambda e:errors.append(str(e)))
   return context,page
  for name,w,h in ([] if os.environ.get('PROOF_FAILURES_ONLY') else [('desktop',1440,1000),('tablet',834,1112),('phone',390,844),('narrow-phone',320,740),('landscape',844,390)]):
   print('Viewport',name,flush=True);ctx,page=new(w,h);start(page)
   for n,item in enumerate(M):
    ready(page);img=page.locator('#myl-stimulus');box=img.bounding_box();panel=page.locator('.myl-stimulus-panel').bounding_box()
    check(name+'/'+item['kind']+': proportions',abs(box['width']/box['height']-item['asset']['width']/item['asset']['height'])<.005)
    check(name+'/'+item['kind']+': no clipping',box['x']>=panel['x'] and box['x']+box['width']<=panel['x']+panel['width']+.5)
    check(name+'/'+item['kind']+': no page overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    check(name+'/'+item['kind']+': empty selection disabled',button(page,'answer').is_disabled())
    check(name+'/'+item['kind']+': four options',page.locator('input[name=answer]').count()==4)
    displayed=bytes(page.evaluate("async()=>Array.from(new Uint8Array(await (await fetch(document.querySelector('#myl-stimulus').src)).arrayBuffer()))"))
    check(name+'/'+item['kind']+': displayed approved SVG bytes',hashlib.sha256(displayed).hexdigest()==item['asset']['svgSha256'])
    if name in ['desktop','phone']:page.screenshot(path=str(E/f'integrated-{name}-{item["kind"]}.png'),full_page=True)
    if name=='phone' and n==0:
     button(page,'enlarge').click();check('dialog opened',page.locator('dialog').is_visible());page.keyboard.press('Escape');page.locator('dialog').wait_for(state='detached');check('dialog closed',page.locator('dialog').count()==0);check('dialog focus restored',button(page,'enlarge').evaluate('(e)=>document.activeElement===e'))
    correct(page,item);button(page,'answer').click();ready(page)
    check(name+'/'+item['kind']+': Assess holds feedback',item['explanation'] not in page.locator('.myl-response').inner_text())
    button(page,'next').click()
   check(name+': six correct',page.locator('.myl-summary-stats>div').nth(0).inner_text().startswith('6\n'))
   reqs=page.evaluate('window.__requests');check(name+': no response POSTs',all(r['method']=='GET' and r['credentials']=='same-origin' and r['cache']=='no-store' for r in reqs))
   check(name+': no local response storage',page.evaluate("(()=>{try{return !localStorage.length&&!sessionStorage.length}catch{return true}})()"))
   ctx.close()
  for name,w in ([] if os.environ.get('PROOF_FAILURES_ONLY') else [('desktop',1440),('phone',390)]):
   print('PNG',name,flush=True);ctx,page=new(w);start(page);page.locator('.myl-qa summary').click();page.select_option('select','png');ready(page)
   for item in M:
    ready(page);data=bytes(page.evaluate("async()=>Array.from(new Uint8Array(await(await fetch(document.querySelector('#myl-stimulus').src)).arrayBuffer()))"))
    check('PNG/'+name+'/'+item['kind']+': bytes',hashlib.sha256(data).hexdigest()==item['asset']['pngSha256'])
    correct(page,item);button(page,'answer').click();ready(page);button(page,'next').click()
   check('PNG/'+name+': same scoring',page.locator('.myl-summary-stats>div').nth(0).inner_text().startswith('6\n'));ctx.close()
  ctx,page=new(390,844)
  for scenario in ['corrupt','mime','denied','timeout']:
   print('Failure',scenario,flush=True);start(page);page.evaluate('(value)=>window.__inject=value',scenario);button(page,'pause').click();button(page,'resume').click();print('  waiting',flush=True)
   page.wait_for_selector('#mylearna-proof[data-asset-state="error"]',timeout=10000);print('  error reached',flush=True)
   check(scenario+': blocked',button(page,'answer').is_disabled() and button(page,'unknown').is_disabled())
   check(scenario+': not scored',page.locator('[role=progressbar]').get_attribute('aria-valuenow')=='0')
   if scenario=='corrupt':page.screenshot(path=str(E/'integrated-image-failure.png'),full_page=True)
   page.evaluate('window.__inject=null');button(page,'retry').click();ready(page);print('  recovered',flush=True);check(scenario+': retry recovers',button(page,'unknown').is_enabled())
  print('Dimensions',flush=True);start(page);page.evaluate('window.__proof.items[0].asset.width+=1');button(page,'pause').click();button(page,'resume').click();page.wait_for_selector('#mylearna-proof[data-asset-state="error"]')
  check('wrong dimensions blocked',button(page,'unknown').is_disabled())
  # Real default code uses crypto.subtle; absence must fail closed rather than skip verification.
  print('Missing crypto',flush=True);start(page);page.evaluate("Object.defineProperty(crypto,'subtle',{configurable:true,value:undefined})");button(page,'pause').click();button(page,'resume').click();page.wait_for_selector('#mylearna-proof[data-asset-state="error"]');check('missing crypto blocked',button(page,'unknown').is_disabled())
  print('Practise',flush=True);start(page,'practise');button(page,'hint').click();correct(page,M[0]);button(page,'answer').click();ready(page)
  check('practise feedback',M[0]['explanation'] in page.locator('.myl-response').inner_text());check('hint use visible','hint was used' in page.locator('.myl-response').inner_text())
  button(page,'next').click();ready(page);button(page,'unknown').click();ready(page);button(page,'next').click()
  for item in M[2:]:ready(page);correct(page,item);button(page,'answer').click();ready(page);button(page,'next').click()
  check('unknown not incorrect',page.locator('.myl-summary-stats>div').nth(1).inner_text().startswith('0\n') and page.locator('.myl-summary-stats>div').nth(2).inner_text().startswith('1\n'))
  print('Export',flush=True)
  with page.expect_download() as event:button(page,'export').click()
  event.value.save_as(str(E/'integrated-review-record.json'));record=json.loads((E/'integrated-review-record.json').read_text())
  check('supported response recorded',record['responses'][0]['hintUsed'] is True)
  check('no learner identifiers',not any(k in record for k in ['learnerId','familyId','childId','userId']))
  check('versions persisted only in local export',all(len(r['assetSha256'])==64 and r['assetVersion']==1 for r in record['responses']))
  # This tests imperative cleanup, not a claim of React Strict Mode validation.
  start(page);page.evaluate("window.__proof.controller.destroy(); window.__proof.controller=window.__proof.mount(document.querySelector('#mylearna-proof'),window.__proof.items)")
  check('destroy/remount one start control',button(page,'start').count()==1);button(page,'start').click();ready(page);correct(page,M[0]);button(page,'answer').click();ready(page)
  check('remount no duplicate response',page.locator('[role=progressbar]').get_attribute('aria-valuenow')=='1')
  check('no uncaught JavaScript errors',not errors)
  ctx.close();browser.close()
 report={'status':'passed','assertions':len(checks),'scope':'Chromium set_content fixtures using exact integrated player and HTTP route bytes; mocked auth, fetch bridge and about:blank digest bridge. Not a Next.js/Vercel/real-device test. Native cryptographic path tested separately in Node.','checks':checks,'pageErrors':errors}
 (E/'browser-tests.json').write_text(json.dumps(report,indent=2));print(len(checks),'browser assertions passed')
finally:
 proc.terminate();proc.wait(timeout=5);log.close()
