"""Re-encode already-approved source bytes. Never redraw or change an asset here."""
from pathlib import Path
import base64, hashlib, json, sys
ROOT = Path(__file__).resolve().parents[2]
LIB = ROOT / 'lib/clean/assessments/trusted-asset-proof'
manifest = json.loads((LIB / 'assets/manifest.json').read_text())
items = json.loads(json.dumps(manifest['items']))
pack = {}
for item in items:
    asset = item['asset']
    for kind, mime in [('svg', 'image/svg+xml'), ('png', 'image/png')]:
        path = LIB / asset[kind + 'Path']
        data = path.read_bytes()
        digest = hashlib.sha256(data).hexdigest()
        if digest != asset[kind + 'Sha256'] or len(data) != asset[kind + 'Bytes']:
            raise SystemExit('Asset differs from source manifest: ' + str(path))
        filename = asset['id'] + '.' + kind
        if path.name != filename:
            raise SystemExit('Source filename differs from asset identity: ' + str(path))
        pack[filename] = {'base64': base64.b64encode(data).decode(), 'mimeType': mime,
                          'sha256': digest, 'byteLength': len(data)}
        asset[kind + 'Href'] = '/api/internal/assessment-lab/assets-proof/' + filename
outputs = {LIB / 'assetBytes.generated.json': pack, LIB / 'items.generated.json': items}
for path, value in outputs.items():
    if '--check' in sys.argv:
        if json.loads(path.read_text()) != value:
            raise SystemExit('Generated transport differs: ' + str(path))
    else:
        path.write_text(json.dumps(value, indent=2) + '\n')
print('12 original assets and all six item records match the generated transport.')
