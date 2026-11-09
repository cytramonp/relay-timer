"""Scoped Firebase Hosting release. Preserve every unrelated live file and config."""
import argparse,concurrent.futures,gzip,hashlib,json,os
from pathlib import Path
from urllib.request import Request,urlopen
parser=argparse.ArgumentParser();parser.add_argument('action',choices=['snapshot','deploy']);args=parser.parse_args()
ROOT=Path('docs');OUT=Path('outputs/localization');BASE=OUT/'live-before';BASE.mkdir(parents=True,exist_ok=True)
SITE='relay-timer-web-7c39';API='https://firebasehosting.googleapis.com/v1beta1/'
token=os.environ['RELAY_DEPLOY_ACCESS_TOKEN']
def api(method,path,data=None,binary=False):
    payload=data if binary else json.dumps(data).encode() if data is not None else None
    req=Request(path if path.startswith('https:') else API+path,data=payload,method=method,headers={'Authorization':'Bearer '+token,'x-goog-user-project':SITE,'Content-Type':'application/octet-stream' if binary else 'application/json'})
    with urlopen(req,timeout=60) as r:
        raw=r.read();return json.loads(raw) if raw else {}
def changes():
    before=json.loads((OUT/'before-hashes.json').read_text());items={}
    for file in ROOT.rglob('*'):
        if not file.is_file() or file.name=='source.json' or any(x.startswith('.') for x in file.parts):continue
        if before.get(file.as_posix())!=hashlib.sha256(file.read_bytes()).hexdigest():items['/'+file.relative_to(ROOT).as_posix()]=file
    return items
if args.action=='snapshot':
    release=api('GET',f'sites/{SITE}/releases?pageSize=1')['releases'][0]
    files=[];cursor=''
    while True:
        result=api('GET',release['version']['name']+'/files?pageSize=1000'+('&pageToken='+cursor if cursor else ''));files.extend(result['files']);cursor=result.get('nextPageToken')
        if not cursor:break
    (BASE/'release.json').write_text(json.dumps(release,indent=2));(BASE/'files.json').write_text(json.dumps(files,indent=2))
    names={x['path'] for x in files};changed=changes();differences=[]
    def check(name):
        with urlopen(Request('https://corptimer.com'+name,headers={'Cache-Control':'no-cache'}),timeout=40) as r:body=r.read()
        file=BASE/name.lstrip('/');file.parent.mkdir(parents=True,exist_ok=True);file.write_bytes(body)
        local=OUT/'before/docs'/name.lstrip('/')
        if not local.exists() or body!=local.read_bytes():return name
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        for result in pool.map(check,[name for name in changed if name in names]):
            if result:differences.append(result)
    report={'release':release['name'],'live_files':len(files),'candidate_changes':list(changed),'local_before_differs_from_live':differences}
    (OUT/'scope-audit.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
else:
    release=json.loads((BASE/'release.json').read_text());entries=json.loads((BASE/'files.json').read_text());original={x['path']:x['hash'] for x in entries}
    latest=api('GET',f'sites/{SITE}/releases?pageSize=1')['releases'][0]
    assert latest['name']==release['name'],'Live release changed. Snapshot again.'
    audit=json.loads((OUT/'scope-audit.json').read_text());assert not audit['local_before_differs_from_live'],'Resolve source differences before deployment.'
    files=dict(original);blobs={};changed=changes()
    for name,file in changed.items():
        data=gzip.compress(file.read_bytes(),mtime=0);digest=hashlib.sha256(data).hexdigest();files[name]=digest;blobs[digest]=data
    version=api('POST',f'sites/{SITE}/versions',{'config':release['version']['config']})['name']
    upload=api('POST',version+':populateFiles',{'files':files})
    def send(digest):
        assert digest in blobs,'Unchanged file unexpectedly missing from Firebase';api('POST',upload['uploadUrl']+'/'+digest,blobs[digest],True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:list(pool.map(send,upload.get('uploadRequiredHashes',[])))
    api('PATCH',version+'?updateMask=status',{'status':'FINALIZED'})
    # Detect a concurrent release again immediately before promotion.
    assert api('GET',f'sites/{SITE}/releases?pageSize=1')['releases'][0]['name']==release['name'],'Concurrent release: staged version left unpublished.'
    deployed=api('POST',f'sites/{SITE}/releases?versionName={version}',{})
    report={'release':deployed['name'],'base_release':release['name'],'files':len(files),'changed_paths':list(changed),'preserved_files':len(original.keys()-changed.keys()),'hosting_config_preserved':True}
    (OUT/'deployment.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
