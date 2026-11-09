"""One-off catalog authoring. Sends only authored public website text.

Translations are checked in, reviewed and served locally. No user text, account
data, credentials or live timer state is sent. Not part of the site build.
"""
import concurrent.futures,json,re,time,urllib.parse,urllib.request
from pathlib import Path
ROOT=Path('docs/locales')
source=json.loads((ROOT/'source.json').read_text(encoding='utf-8'))
def request(text,lang):
    query=urllib.parse.urlencode({'client':'gtx','sl':'en','tl':lang,'dt':'t','q':text})
    with urllib.request.urlopen('https://translate.googleapis.com/translate_a/single?'+query,timeout=45) as response:
        value=json.load(response)
    return ''.join(row[0] for row in value[0] if row[0])
def translate(lang):
    file=ROOT/(lang+'.json'); data=json.loads(file.read_text(encoding='utf-8')) if file.exists() else {}
    pending=[s for s in source if s not in data]; batches=[];batch=[];length=0
    for s in pending:
        if length+len(s)>3200 and batch:batches.append(batch);batch=[];length=0
        batch.append(s);length+=len(s)+20
    if batch:batches.append(batch)
    for bi,batch in enumerate(batches):
        payload='\n\n'.join(f'[CT{i:04d}] {s}' for i,s in enumerate(batch))
        for attempt in range(3):
            try:
                output=request(payload,lang)
                matches=list(re.finditer(r'\[\s*CT\s*(\d{4})\s*\]',output,re.I))
                if [int(m[1]) for m in matches]!=list(range(len(batch))):raise ValueError('Batch markers changed')
                for i,m in enumerate(matches):
                    text=output[m.end():matches[i+1].start() if i+1<len(matches) else len(output)].strip()
                    text=re.sub(r'\{\s*(\d+)\s*\}',r'{\1}',text)
                    if not text or sorted(re.findall(r'\{\d+\}',batch[i]))!=sorted(re.findall(r'\{\d+\}',text)):raise ValueError('Placeholder changed')
                    data[batch[i]]=text
                break
            except Exception as e:
                if attempt==2:raise RuntimeError(f'{lang} batch {bi}: {e}') from None
                time.sleep(2)
        file.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print(f'{lang}: {bi+1}/{len(batches)} batches; {len(data)} strings',flush=True)
        time.sleep(.2)
    return lang,len(data)
if __name__=='__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        for result in pool.map(translate,['es','fr','de','pt']):print(result,flush=True)
