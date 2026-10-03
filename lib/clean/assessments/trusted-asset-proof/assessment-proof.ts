import type { AssetFormat, AssetState, Mode, ProofItem, ResponseRecord, TechnicalEvent } from './types';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const rawImage = (item: ProofItem, format: AssetFormat) => format === 'svg' ? item.asset.svgHref : item.asset.pngHref;
const checksum = (item: ProofItem, format: AssetFormat) => format === 'svg' ? item.asset.svgSha256 : item.asset.pngSha256;

export class ProofAssetDeliveryError extends Error {
  constructor(public readonly code: TechnicalEvent['type']) {
    super("The assessment diagram could not be verified.");
  }
}

/** Fetch exact approved bytes before decode. Injectable fetch is a test boundary, not an auth bypass. */
export async function fetchStoredProofAsset(
  item: ProofItem, format: AssetFormat, signal: AbortSignal,
  fetcher: typeof fetch = fetch,
) {
  const href=rawImage(item,format);
  if(!href.startsWith('/api/internal/assessment-lab/assets-proof/') || href.includes('..') || href.includes('?') || href.includes('#')) {
    throw new ProofAssetDeliveryError('load_error');
  }
  const response=await fetcher(href,{
    credentials:'same-origin',cache:'no-store',redirect:'error',signal,
  });
  if(response.status===401||response.status===403)throw new ProofAssetDeliveryError('access_denied');
  if(!response.ok)throw new ProofAssetDeliveryError('load_error');
  const mime=format==='svg'?'image/svg+xml':'image/png';
  if(response.headers.get('content-type')?.split(';')[0].trim()!==mime)throw new ProofAssetDeliveryError('wrong_mime');
  const bytes=await response.arrayBuffer();
  const expectedBytes=format==='svg'?item.asset.svgBytes:item.asset.pngBytes;
  if(bytes.byteLength!==expectedBytes)throw new ProofAssetDeliveryError('integrity_mismatch');
  // HTTPS (or a browser-trusted local development origin) is required; never skip verification.
  if(!globalThis.crypto?.subtle)throw new ProofAssetDeliveryError('load_error');
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  const actual=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
  if(actual!==checksum(item,format))throw new ProofAssetDeliveryError('integrity_mismatch');
  return {bytes,mime};
}

/** Deterministic shuffle for the proof. Answer IDs stay stable, independent of display order. */
export function orderedOptions(item: ProofItem, attempt: number) {
  let seed = [...item.id].reduce((a,c) => (a * 31 + c.charCodeAt(0)) >>> 0, 17 + attempt);
  const options = [...item.options];
  for(let i=options.length-1;i>0;i--) {
    seed = (Math.imul(seed,1664525) + 1013904223) >>> 0;
    const j = seed % (i+1); [options[i],options[j]] = [options[j],options[i]];
  }
  return options;
}

/** Guard at the scoring boundary, not just a disabled button. No asset -> no score. */
export function recordAnswer(item: ProofItem, state: AssetState, option: string | null,
  context: {format: AssetFormat; mode: Mode; hintUsed: boolean; descriptionOpened: boolean}): ResponseRecord {
  if(state !== 'ready') throw new Error('An unavailable diagram cannot be scored.');
  if(option !== null && !item.options.some(x => x.id === option)) throw new Error('Unknown option ID.');
  return {
    itemId:item.id,itemVersion:item.version,assetId:item.asset.id,assetVersion:item.asset.version,
    assetSha256:checksum(item,context.format),...context,
    status:option === null ? 'not_known' : 'answered',selectedOptionId:option,
    correct:option === null ? null : option === item.correctOptionId,
  };
}

export function summarise(items: readonly ProofItem[], responses: readonly ResponseRecord[]) {
  const valid = new Map(responses.filter(r => items.some(i => i.id === r.itemId)).map(r => [r.itemId,r]));
  const answered = [...valid.values()].filter(r => r.status === 'answered');
  return {
    total:items.length, answered:answered.length, correct:answered.filter(r => r.correct === true).length,
    incorrect:answered.filter(r => r.correct === false).length,
    notKnown:[...valid.values()].filter(r => r.status === 'not_known').length,
    notAttempted:items.length-valid.size, supported:answered.filter(r => r.hintUsed).length,
  };
}

export type ProofController = {destroy: () => void};
/** Staff-only UI proof. Only asset GETs; no response persistence or learner identifiers. */
export function mountAssessmentProof(root: HTMLElement, ITEMS: readonly ProofItem[]): ProofController {
  if (ITEMS.length !== 6) throw new Error("The review proof requires exactly six fixtures.");
  let screen: 'intro'|'question'|'summary'|'review' = 'intro';
  let mode: Mode = 'assess', format: AssetFormat = 'svg', state: AssetState = 'loading';
  let index = 0, attempt = 0, selected: string | null = null, hintUsed = false, descriptionOpened = false;
  let responses: ResponseRecord[] = [], technical: TechnicalEvent[] = [];
  let paused = false, generation = 0, timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  let request: AbortController | undefined;
  let displayedUrl: string | undefined;
  const saved = () => responses.find(r => r.itemId === ITEMS[index].id);
  const find = <T extends Element=HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  function cancelPending() {
    generation++;
    if(timer) clearTimeout(timer);
    request?.abort(); request=undefined;
    if(displayedUrl) URL.revokeObjectURL(displayedUrl);
    displayedUrl=undefined;
  }
  function header() {
    return `<header class="myl-header"><div class="myl-brand" aria-label="MyLearna">My<span>Learna</span><small>ASSESS</small></div><span class="myl-lab">Technical proof · not a live assessment</span>${screen==='question'?'<button class="myl-quiet" data-action="pause">Pause</button>':'<span class="myl-version">Asset library v1</span>'}</header>`;
  }
  function intro() {
    const s = summarise(ITEMS,responses);
    return `<main class="myl-intro"><p class="myl-eyebrow">MYLEARNA ASSESSMENT LAB</p><h1>Clear diagrams.<br>Questions you can trust.</h1><p class="myl-lead">Six carefully drawn maths samples, displayed as fixed assets.<br class="myl-desktop-break"> This proof checks the visuals and the player—not your child’s level.</p>
      <div class="myl-intro-actions"><div class="myl-mode" role="group" aria-label="Choose sample mode"><button data-action="mode-assess" aria-pressed="${mode==='assess'}">Assess</button><button data-action="mode-practise" aria-pressed="${mode==='practise'}">Practise</button></div><p class="myl-mode-copy">${mode==='assess'?'Answers are reviewed at the end. No time limit.':'Feedback and an optional hint appear with each question.'}</p>
      <button class="myl-primary" data-action="${paused?'resume':'start'}">${paused?`Resume sample · ${s.answered+s.notKnown} of 6 recorded`:'Start sample assessment'} <span aria-hidden="true">→</span></button>
      <button class="myl-text" data-action="review">Inspect the six original assets</button></div>
      <div class="myl-mini-grid">${ITEMS.map(i=>`<div><img src="${i.asset.svgHref}" width="${i.asset.width}" height="${i.asset.height}" alt="${escapeHtml(i.title)} sample diagram"><strong>${i.title}</strong></div>`).join('')}</div>
      <aside class="myl-note">Staff review only. No child account or response database writes. Responses stay in memory until this page is closed or reloaded. These are new technical samples, not published or calibrated assessment items.</aside></main>`;
  }
  function question() {
    const item=ITEMS[index], response=saved();
    return `<main class="myl-player"><div class="myl-progress-meta"><span>${mode==='assess'?'ASSESS':'PRACTISE'} · MATHS SAMPLE</span><strong>Question ${index+1} of ${ITEMS.length}</strong></div><div class="myl-progress" role="progressbar" aria-label="Responses recorded" aria-valuenow="${responses.length}" aria-valuemin="0" aria-valuemax="6">${ITEMS.map((_,i)=>`<span class="${i<responses.length?'done':i===index?'current':''}"></span>`).join('')}</div>
      <h1 class="myl-question" tabindex="-1">${item.question}</h1>
      <div class="myl-workspace"><section class="myl-stimulus-panel" aria-label="Question diagram"><div class="myl-stimulus-top"><span>${item.title}</span><button class="myl-quiet" data-action="enlarge" disabled>Enlarge diagram <span aria-hidden="true">↗</span></button></div>
      <figure class="myl-figure"><div class="myl-loading" role="status">Loading the diagram…</div><img id="myl-stimulus" class="myl-stimulus" width="${item.asset.width}" height="${item.asset.height}" alt="${escapeHtml(item.alt)}" style="visibility:hidden"></figure>
      <div class="myl-error" role="alert" hidden><strong>The diagram did not load correctly.</strong><p>This question is paused. It has not been marked wrong.</p><button class="myl-secondary" data-action="retry">Retry diagram</button></div>
      <details class="myl-description"><summary>Diagram description</summary><p>${escapeHtml(item.alt)}</p></details></section>
      <section class="myl-answer-panel" aria-label="Answer controls"><form><fieldset ${response?'disabled':''}><legend>Choose one answer</legend><div class="myl-options">${orderedOptions(item,attempt).map((o,n)=>`<label class="myl-option ${selected===o.id?'selected':''}"><input type="radio" name="answer" value="${o.id}" ${selected===o.id?'checked':''} disabled><span class="myl-option-letter" aria-hidden="true">${String.fromCharCode(65+n)}</span><span>${escapeHtml(o.label)}</span></label>`).join('')}</div></fieldset>
      <div class="myl-response" aria-live="polite">${response?responseMessage(item,response):''}</div>
      ${response?`<button type="button" class="myl-primary myl-full" data-action="next">${index===ITEMS.length-1?'View sample summary':'Next question'} <span aria-hidden="true">→</span></button>`:`<button type="submit" class="myl-primary myl-full" data-action="answer" disabled>${mode==='assess'?'Save answer':'Check answer'} <span aria-hidden="true">→</span></button><button type="button" class="myl-text myl-full" data-action="unknown" disabled>I don’t know yet</button>`}
      ${mode==='practise'&&!response?'<button type="button" class="myl-text myl-full" data-action="hint" disabled>Show a hint</button>':''}<p class="myl-hint" role="status" ${hintUsed?'':'hidden'}>${hintUsed?escapeHtml(item.hint):''}</p></form></section></div>
      <footer class="myl-question-footer"><span>No timer. Take the time you need.</span><span>${mode==='assess'?'Feedback stays hidden until the end.':'Hints are recorded separately from independent responses.'}</span></footer>
      <details class="myl-qa"><summary>Reviewer controls</summary><div><label>Stored asset format <select aria-label="Asset format" ${response?'disabled':''}><option value="svg" ${format==='svg'?'selected':''}>SVG · original vector</option><option value="png" ${format==='png'?'selected':''}>PNG · same source, 2× export</option></select></label><button class="myl-secondary" data-action="failure" ${response?'disabled':''}>Simulate image failure</button><span class="myl-asset-id">${item.asset.id}<br>SHA-256: ${checksum(item,format).slice(0,16)}…</span></div><p>Changing format does not change the question. No answer can be saved while its diagram is unavailable.</p></details></main>`;
  }
  function responseMessage(item: ProofItem, r: ResponseRecord) {
    if(mode==='assess') return '<div class="myl-recorded"><strong>Response recorded.</strong><p>You can move to the next question.</p></div>';
    return `<div class="myl-recorded"><strong>${r.status==='not_known'?'Let’s look at it together.':r.correct?'That’s right.':'Not quite—here is how it works.'}</strong><p>${escapeHtml(item.explanation)}</p>${r.hintUsed?'<small>A hint was used for this response.</small>':''}</div>`;
  }
  function summary() {
    const s=summarise(ITEMS,responses);
    return `<main class="myl-summary"><p class="myl-eyebrow">SAMPLE COMPLETE</p><h1>Here’s what was recorded.</h1><p class="myl-lead">This is a six-item technical proof, not a placement result or a statement of mastery.</p><div class="myl-summary-stats"><div><strong>${s.correct}</strong><span>correct answers</span></div><div><strong>${s.incorrect}</strong><span>incorrect answers</span></div><div><strong>${s.notKnown}</strong><span>“not known yet”</span></div><div><strong>${technical.length}</strong><span>technical events · not scored</span></div></div>
      <div class="myl-result-list">${ITEMS.map((i,n)=>{const r=responses.find(r=>r.itemId===i.id);return `<article><span class="myl-result-number">${n+1}</span><div><h2>${i.title}</h2><p>${i.question}</p><p class="myl-result-answer"><strong>${!r?'Not attempted':r.status==='not_known'?'Not known yet':r.correct?'Correct':'Incorrect'}</strong>${r?.selectedOptionId?` · Selected: ${escapeHtml(i.options.find(o=>o.id===r.selectedOptionId)!.label)}`:''}</p><p>${escapeHtml(i.explanation)}</p>${r?.hintUsed?'<small class="myl-support">Hint used · supported response</small>':''}${r?.descriptionOpened?'<small class="myl-support">Diagram description opened</small>':''}</div></article>`}).join('')}</div>
      <div class="myl-summary-actions"><button class="myl-primary" data-action="restart">Back to sample start</button><button class="myl-secondary" data-action="export">Download review record</button><button class="myl-text" data-action="review">Inspect original assets</button></div><aside class="myl-note">Nothing has been sent to MyLearna, saved to a child profile or added to a report. Full production delivery still needs server-side scoring, approved content and accessibility review.</aside></main>`;
  }
  function review() {
    return `<main class="myl-review"><p class="myl-eyebrow">SOURCE-ASSET REVIEW</p><h1>The exact diagrams the player uses.</h1><p class="myl-lead">Fixed SVG originals and PNG exports. No AI reconstruction, decorative scene or cropped worksheet page.</p><button class="myl-secondary" data-action="home">Return to sample</button><div class="myl-review-grid">${ITEMS.map((i,n)=>`<article><div class="myl-review-title"><span>0${n+1} / ${i.title}</span><span>v${i.asset.version}</span></div><img src="${i.asset.svgHref}" width="${i.asset.width}" height="${i.asset.height}" alt="${escapeHtml(i.alt)}"><h2>${i.question}</h2><p>${escapeHtml(i.explanation)}</p><div class="myl-downloads"><a href="${i.asset.svgHref}" download="${i.asset.id}.svg">SVG original</a><a href="${i.asset.pngHref}" download="${i.asset.id}.png">PNG export</a></div><code>${i.asset.id}<br>${i.asset.svgSha256}</code><p class="myl-candidate">Visual direction approved · item validation pending</p></article>`).join('')}</div></main>`;
  }
  function syncControls() {
    if(screen!=='question')return;
    const ready=state==='ready', response=saved();
    root.querySelectorAll<HTMLInputElement>('input[name=answer]').forEach(e=>e.disabled=!ready||Boolean(response));
    const btn=root.querySelector<HTMLButtonElement>('[data-action=answer]');if(btn)btn.disabled=!ready||selected===null||Boolean(response);
    for(const name of ['unknown','hint']) {const e=root.querySelector<HTMLButtonElement>(`[data-action=${name}]`);if(e)e.disabled=!ready||Boolean(response);}
    find<HTMLButtonElement>('[data-action=enlarge]').disabled=!ready;
    const next=root.querySelector<HTMLButtonElement>('[data-action=next]');if(next)next.disabled=!ready;
    root.dataset.assetState=state;
  }
  function loadAsset() {
    cancelPending();
    state='loading';
    const token=generation, item=ITEMS[index], requestedFormat=format;
    const img=find<HTMLImageElement>('#myl-stimulus');
    find<HTMLElement>('.myl-error').hidden=true;
    find<HTMLElement>('.myl-loading').hidden=false;
    img.style.visibility='hidden'; syncControls();
    const current=()=>!disposed && token===generation && screen==='question';
    function failed(type: TechnicalEvent['type']) {
      if(!current() || state==='error') return;
      if(timer)clearTimeout(timer);
      request?.abort();
      state='error'; technical.push({itemId:item.id,type,format:requestedFormat});
      img.style.visibility='hidden';
      find<HTMLElement>('.myl-loading').hidden=true;
      find<HTMLElement>('.myl-error').hidden=false; syncControls();
    }
    img.onerror=()=>failed('load_error');
    img.onload=()=> {
      if(!current() || state!=='loading' || !displayedUrl || img.getAttribute('src')!==displayedUrl)return;
      const scale=requestedFormat==='png'?2:1;
      if(img.naturalWidth!==item.asset.width*scale || img.naturalHeight!==item.asset.height*scale) {
        failed('wrong_dimensions'); return;
      }
      if(timer)clearTimeout(timer);
      state='ready'; img.style.visibility='visible';
      find<HTMLElement>('.myl-loading').hidden=true; syncControls();
    };
    const abort=new AbortController(); request=abort;
    timer=setTimeout(()=>failed('timeout'),8000);
    void (async()=> {
      try {
        const {bytes,mime}=await fetchStoredProofAsset(item,requestedFormat,abort.signal);
        if(!current() || state!=='loading')return;
        displayedUrl=URL.createObjectURL(new Blob([bytes],{type:mime}));
        img.src=displayedUrl;
      } catch (error) {
        if(current() && state==='loading')failed(error instanceof ProofAssetDeliveryError ? error.code : 'load_error');
      }
    })();
  }
  function render(focus=false) {
    cancelPending();root.className='myl-assess-proof';root.innerHTML=header()+(screen==='intro'?intro():screen==='question'?question():screen==='summary'?summary():review());
    root.dataset.screen=screen;
    if(screen==='question') {
      loadAsset();
      find<HTMLDetailsElement>('.myl-description').addEventListener('toggle',()=>{if(find<HTMLDetailsElement>('.myl-description').open)descriptionOpened=true;});
    }
    if(focus) {const heading=root.querySelector<HTMLElement>('h1');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});root.scrollIntoView({block:'start'});}
  }
  function submit(option: string|null) {
    if(state!=='ready'||saved())return;
    const r=recordAnswer(ITEMS[index],state,option,{format,mode,hintUsed,descriptionOpened});
    responses=[...responses.filter(x=>x.itemId!==r.itemId),r];selected=option;render();
  }
  function enlarge() {
    if(state!=='ready')return;const previous=document.activeElement as HTMLElement|null;
    const item=ITEMS[index],dialog=document.createElement('dialog');dialog.className='myl-dialog';
    dialog.innerHTML=`<div class="myl-dialog-top"><h2>${item.title} · original asset</h2><button class="myl-secondary" data-close>Close</button></div><div class="myl-dialog-image"><img src="${displayedUrl}" width="${item.asset.width}" height="${item.asset.height}" alt="${escapeHtml(item.alt)}"></div><p>On a small screen, scroll within the diagram to see the whole original. The image is not stretched.</p>`;
    root.append(dialog);dialog.querySelector('[data-close]')!.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',()=>{dialog.remove();previous?.focus();});dialog.showModal();
  }
  function click(event: Event) {
    const target=(event.target as Element).closest<HTMLElement>('[data-action]');if(!target||!root.contains(target)||(target as HTMLButtonElement).disabled)return;
    switch(target.dataset.action) {
      case 'start': case 'restart':
        index=0;attempt++;selected=null;responses=[];technical=[];hintUsed=false;descriptionOpened=false;paused=false;
        screen=target.dataset.action==='start'?'question':'intro';render(true);break;
      case 'mode-assess': case 'mode-practise':
        mode=target.dataset.action==='mode-assess'?'assess':'practise';index=0;selected=null;responses=[];technical=[];hintUsed=false;descriptionOpened=false;paused=false;render();break;
      case 'pause':paused=true;screen='intro';render(true);break;
      case 'resume':screen='question';render(true);break;
      case 'home':screen='intro';render(true);break;
      case 'review':screen='review';render(true);break;
      case 'unknown':submit(null);break;
      case 'next':
        if(state!=='ready'||!saved())return;
        if(index===ITEMS.length-1)screen='summary';else{index++;selected=null;hintUsed=false;descriptionOpened=false;}
        render(true);break;
      case 'hint':if(state!=='ready'||saved()||mode!=='practise')return;hintUsed=true;find<HTMLElement>('.myl-hint').hidden=false;find<HTMLElement>('.myl-hint').textContent=ITEMS[index].hint;break;
      case 'retry':loadAsset();break;
      case 'failure':
        if(saved())return;cancelPending();state='error';technical.push({itemId:ITEMS[index].id,type:'simulated_failure',format});
        find<HTMLImageElement>('#myl-stimulus').style.visibility='hidden';find<HTMLElement>('.myl-loading').hidden=true;find<HTMLElement>('.myl-error').hidden=false;syncControls();break;
      case 'enlarge':enlarge();break;
      case 'export':{
        const report={schemaVersion:1,purpose:'technical-proof-only',notAPlacementTest:true,mode,summary:summarise(ITEMS,responses),responses,technicalEvents:technical};
        const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
        const link=document.createElement('a');link.href=url;link.download='MyLearna-Assess-Proof-Review.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);break;
      }
    }
  }
  function change(event: Event) {
    const e=event.target as HTMLInputElement;
    if(e.name==='answer'&&state==='ready'&&!saved()) {
      selected=e.value;root.querySelectorAll<HTMLLabelElement>('.myl-option').forEach(l=>l.classList.toggle('selected',l.querySelector<HTMLInputElement>('input')?.value===selected));syncControls();
    }
    if(e.matches('select[aria-label="Asset format"]')&&!saved()) {format=e.value==='png'?'png':'svg';render();}
  }
  function submitEvent(e: Event){e.preventDefault();if(selected!==null)submit(selected);}
  root.addEventListener('click',click);root.addEventListener('change',change);root.addEventListener('submit',submitEvent);render();
  return {destroy(){disposed=true;cancelPending();root.removeEventListener('click',click);root.removeEventListener('change',change);root.removeEventListener('submit',submitEvent);root.replaceChildren();}};
}
