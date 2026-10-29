"""Deploy reviewed Firestore rules using a short-lived token supplied in the environment."""
import json
import os
from pathlib import Path
from urllib.request import Request, urlopen

PROJECT = 'relay-timer-web-7c39'
ROOT = Path(__file__).resolve().parents[1]
TOKEN = os.environ['RELAY_DEPLOY_ACCESS_TOKEN']

def request(method, path, payload=None):
    body = json.dumps(payload).encode() if payload is not None else None
    req = Request('https://firebaserules.googleapis.com/v1/' + path, data=body, method=method,
                  headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'x-goog-user-project': PROJECT})
    with urlopen(req, timeout=40) as response:
        return json.load(response)

source = {'files': [{'name': 'firestore.rules', 'content': (ROOT / 'firestore.rules').read_text(encoding='utf-8')}]}
validation = request('POST', f'projects/{PROJECT}:test', {'source': source})
assert not any(i.get('severity') == 'ERROR' for i in validation.get('issues', [])), validation
release_path = f'projects/{PROJECT}/releases/cloud.firestore'
previous = request('GET', release_path)
ruleset = request('POST', f'projects/{PROJECT}/rulesets', {'source': source})
release = request('PATCH', release_path, {'release': {'name': release_path, 'rulesetName': ruleset['name']}, 'updateMask': 'rulesetName'})
assert request('GET', release_path)['rulesetName'] == ruleset['name']
print(json.dumps({'ruleset': ruleset['name'], 'previous': previous['rulesetName'], 'validation': 'pass', 'release': release['name']}))
