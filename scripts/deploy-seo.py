"""Publish a validated SEO overlay; retain every other file and the hosting config.

The baseline must contain Firebase's release.json and files.json and the downloaded
public documents. Use RELAY_DEPLOY_ACCESS_TOKEN, never a token on the command line.
"""
import argparse
import gzip
import hashlib
import json
import os
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

parser = argparse.ArgumentParser()
parser.add_argument('--baseline', required=True)
parser.add_argument('--staging', required=True)
args = parser.parse_args()
baseline, staging = Path(args.baseline), Path(args.staging)
base_release = json.loads((baseline / 'release.json').read_text())
base_files = json.loads((baseline / 'files.json').read_text())
site = 'relay-timer-web-7c39'
base = 'https://firebasehosting.googleapis.com/v1beta1/'
token = os.environ['RELAY_DEPLOY_ACCESS_TOKEN']

def request(method, endpoint, payload=None, binary=False):
    body = payload if binary else (json.dumps(payload).encode() if payload is not None else None)
    req = Request(endpoint if endpoint.startswith('https://') else base + endpoint,
                  data=body, method=method, headers={
                      'Authorization':'Bearer ' + token,
                      'Content-Type':'application/octet-stream' if binary else 'application/json',
                      'x-goog-user-project':site})
    with urlopen(req, timeout=60) as response:
        raw = response.read()
        return json.loads(raw) if raw else {}

latest = request('GET', f'sites/{site}/releases?pageSize=1')['releases'][0]
assert latest['name'] == base_release['name'], 'Live release changed; refresh and revalidate the SEO overlay.'
files = {item['path']:item['hash'] for item in base_files}
original = dict(files)
pages = [p for p in files if p.endswith('/index.html')]
for page in pages:
    before = (baseline / page.lstrip('/')).read_bytes()
    after = (staging / page.lstrip('/')).read_bytes()
    assert before.split(b'</head>',1)[1] == after.split(b'</head>',1)[1], 'SEO changed page body: ' + page
    assert b'<!-- seo:start -->' in after and after.count(b'<!-- seo:start -->') == 1, page

icons = ['favicon.ico','favicon-96x96.png','apple-touch-icon.png','icon-192.png','icon-512.png','icon-maskable-512.png']
overlay = pages + ['/manifest.webmanifest','/sitemap.xml','/sw.js'] + ['/' + name for name in icons]
overlay += ['/' + file.relative_to(staging).as_posix() for file in (staging / 'assets/social').glob('*.png')]
blobs = {}
for name in overlay:
    compressed = gzip.compress((staging / name.lstrip('/')).read_bytes(), mtime=0)
    digest = hashlib.sha256(compressed).hexdigest()
    files[name] = digest
    blobs[digest] = compressed
assert all(files[name] == digest for name,digest in original.items() if name not in overlay)

version = request('POST', f'sites/{site}/versions', {'config':base_release['version']['config']})['name']
upload = request('POST', version + ':populateFiles', {'files':files})
for digest in upload.get('uploadRequiredHashes', []):
    assert digest in blobs, 'Firebase unexpectedly needs an unchanged base file.'
    request('POST', upload['uploadUrl'] + '/' + digest, blobs[digest], binary=True)
request('PATCH', version + '?updateMask=status', {'status':'FINALIZED'})
release = request('POST', f'sites/{site}/releases?versionName={version}', {})
report = {'site':site,'base_release':base_release['name'],'release':release['name'],'version':version,
          'files':len(files),'changed_paths':[name for name in overlay if original.get(name) != files[name]],
          'unchanged_base_files':sum(1 for name in original if original[name] == files[name]),
          'preserved_hosting_config':True,'public_page_bodies_unchanged':True}
(staging.parent / 'deployment.json').write_text(json.dumps(report,indent=2) + '\n')
print(json.dumps(report))
