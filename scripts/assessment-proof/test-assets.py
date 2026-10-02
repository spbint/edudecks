"""Independent checks against the saved SVG geometry, not the authoring functions."""
from pathlib import Path
import xml.etree.ElementTree as ET
import json,hashlib,math,base64,re,io,os
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
R=ROOT/'lib/clean/assessments/trusted-asset-proof'
E=Path(os.environ.get('PROOF_EVIDENCE_DIR',str(ROOT/'.assessment-proof-evidence')));E.mkdir(parents=True,exist_ok=True)
M=json.loads((R/'assets/manifest.json').read_text());checks=[]
def check(name,condition):
 assert condition,name
 checks.append(name)
for i in M['items']:
 a=i['asset'];raw=(R/a['svgPath']).read_bytes();svg=ET.fromstring(raw);nodes=list(svg.iter());
 check(i['kind']+' SHA-256 source',hashlib.sha256(raw).hexdigest()==a['svgSha256'])
 check(i['kind']+' fixed viewBox',svg.get('viewBox')==f'0 0 {a["width"]} {a["height"]}')
 check(i['kind']+' preserve entire view',svg.get('preserveAspectRatio')=='xMidYMid meet')
 check(i['kind']+' no runtime scripts/foreign objects',all(n.tag.split('}')[-1] not in ['script','foreignObject','image','text'] for n in nodes))
 check(i['kind']+' no external dependencies',all(not k.startswith('on') and not ('href' in k) for n in nodes for k in n.attrib))
 rawpng=(R/a['pngPath']).read_bytes();png=Image.open(io.BytesIO(rawpng))
 check(i['kind']+' PNG header/dimensions',png.format=='PNG' and png.size==(a['width']*2,a['height']*2))
 check(i['kind']+' PNG hash',hashlib.sha256(rawpng).hexdigest()==a['pngSha256'])
 options=i['options'];check(i['kind']+' four distinct answers',len(options)==len(set(o['id'] for o in options))==len(set(o['label'] for o in options))==4)
 correct=next(o['label'] for o in options if o['id']==i['correctOptionId'])
 if i['kind']=='number-line':
  ticks=[n for n in nodes if 'data-tick' in n.attrib];xs=[float(n.get('x1')) for n in ticks]
  check('Number line: 11 equal intervals endpoints',len(xs)==11 and all(abs(xs[j+1]-xs[j]-54.4)<1e-7 for j in range(10)))
  check('Number line: correct values on ticks',[int(n.get('data-tick')) for n in ticks]==list(range(0,21,2)))
  marker=next(n for n in nodes if 'data-marker' in n.attrib);points=re.findall(r'[-\d.]+',marker.get('d'));mx=float(points[2]);answer=round((mx-xs[0])/(xs[-1]-xs[0])*20)
  check('Number line: visible marker = scored answer',answer==14 and correct==str(answer))
 if i['kind']=='fraction-bar':
  cells=[n for n in nodes if 'data-cell' in n.attrib];shade=[n for n in nodes if 'data-shaded' in n.attrib]
  check('Fraction: equal widths and heights',len(cells)==8 and len(set((n.get('width'),n.get('height')) for n in cells))==1)
  check('Fraction: contiguous equal regions',all(float(cells[j].get('x'))+float(cells[j].get('width'))==float(cells[j+1].get('x')) for j in range(7)))
  check('Fraction: shaded portion = scored answer',len(shade)==5 and correct==f'{len(shade)}/{len(cells)}')
 if i['kind']=='clock':
  hands={n.get('data-hand'):n for n in nodes if 'data-hand' in n.attrib}
  def angle(n):return math.degrees(math.atan2(float(n.get('x2'))-float(n.get('x1')),float(n.get('y1'))-float(n.get('y2'))))%360
  ha,ma=angle(hands['hour']),angle(hands['minute'])
  check('Clock: 60 minute ticks',len([n for n in nodes if 'data-clock-tick' in n.attrib])==60)
  check('Clock: hour hand advances with minutes',abs(ha-102.5)<.00001)
  check('Clock: minute hand correct',abs(ma-150)<.00001)
  check('Clock: geometry = scored time',correct==f'{int(ha//30)}:{round(ma/6):02}')
 if i['kind']=='array':
  counters=[n for n in nodes if 'data-counter' in n.attrib]
  check('Array: three rows, four columns',len(set(n.get('cx') for n in counters))==4 and len(set(n.get('cy') for n in counters))==3)
  check('Array: 12 nonoverlapping counters',len(counters)==12 and all(math.hypot(float(a.get('cx'))-float(b.get('cx')),float(a.get('cy'))-float(b.get('cy')))>=44 for j,a in enumerate(counters) for b in counters[j+1:]))
  check('Array: scored count matches',correct==str(len(counters)))
 if i['kind']=='measurement':
  ticks=[n for n in nodes if 'data-ruler-tick' in n.attrib];strip=next(n for n in nodes if 'data-object' in n.attrib)
  x0=float(ticks[0].get('x1'));unit=float(ticks[2].get('x1'))-x0;s=(float(strip.get('x'))-x0)/unit;e=s+float(strip.get('width'))/unit
  check('Ruler: 2 to 9 aligned on same scale',s==2 and e==9 and unit==46)
  check('Ruler: scored difference not endpoint',correct==f'{int(e-s)} cm')
 if i['kind']=='geometry':
  shape=next(n for n in nodes if 'data-triangle' in n.attrib);ps=[tuple(map(float,x.split(','))) for x in shape.get('points').split()]
  u=(ps[0][0]-ps[1][0],ps[0][1]-ps[1][1]);v=(ps[2][0]-ps[1][0],ps[2][1]-ps[1][1]);dot=u[0]*v[0]+u[1]*v[1]
  check('Geometry: genuine perpendicular edges',dot==0 and math.hypot(*u)>0 and math.hypot(*v)>0)
  check('Geometry: angle matches scored description',correct=='Right-angled')
report={'status':'passed','assertions':len(checks),'checks':checks,'note':'Independent geometry/byte checks only. Human curriculum approval is still pending.'}
(E/'asset-checks.json').write_text(json.dumps(report,indent=2))
print(f'{len(checks)} asset assertions passed.')
