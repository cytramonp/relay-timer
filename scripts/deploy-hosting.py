"""Publish docs/ through Firebase Hosting REST API using a short-lived access token.

PowerShell: $env:RELAY_DEPLOY_ACCESS_TOKEN=(gcloud auth print-access-token --account=cytramonp@gmail.com --quiet).Trim()
Then: python scripts/deploy-hosting.py
Never save the access token in the repository or pass it as a command argument.
"""
import gzip
import hashlib
import json
import os
from pathlib import Path
from urllib.request import Request, urlopen

SITE = 'relay-timer-web-7c39'
ROOT = Path(__file__).resolve().parents[1] / 'docs'
TOKEN = os.environ['RELAY_DEPLOY_ACCESS_TOKEN']
BASE = 'https://firebasehosting.googleapis.com/v1beta1/'

def request(method, path, payload=None, binary=False):
    body = payload if binary else (json.dumps(payload).encode() if payload is not None else None)
    url = path if path.startswith('https://') else BASE + path
    req = Request(url, data=body, method=method, headers={
        'Authorization': 'Bearer ' + TOKEN,
        'Content-Type': 'application/octet-stream' if binary else 'application/json',
        'x-goog-user-project': SITE,
    })
    with urlopen(req, timeout=90) as response:
        raw = response.read()
        return json.loads(raw) if raw else {}

files, blobs = {}, {}
for path in sorted(ROOT.rglob('*')):
    if not path.is_file() or path.is_symlink() or any(part.startswith('.') for part in path.relative_to(ROOT).parts):
        continue
    compressed = gzip.compress(path.read_bytes(), mtime=0)
    digest = hashlib.sha256(compressed).hexdigest()
    files['/' + path.relative_to(ROOT).as_posix()] = digest
    blobs[digest] = compressed

config = {'config': {'headers': [
    {'glob': '**', 'headers': {'Cache-Control': 'public,max-age=300'}},
    {'glob': '**/*.html', 'headers': {'Cache-Control': 'no-cache'}},
    {'glob': '/sw.js', 'headers': {'Cache-Control': 'no-cache'}},
]}}
version = request('POST', f'sites/{SITE}/versions', config)['name']
upload = request('POST', version + ':populateFiles', {'files': files})
for digest in upload.get('uploadRequiredHashes', []):
    request('POST', upload['uploadUrl'] + '/' + digest, blobs[digest], binary=True)
request('PATCH', version + '?updateMask=status', {'status': 'FINALIZED'})
release = request('POST', f'sites/{SITE}/releases?versionName={version}', {})
print(json.dumps({'site': SITE, 'files': len(files), 'release': release['name'], 'url': f'https://{SITE}.web.app'}))
