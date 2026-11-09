"""Extract authored text without changing English content or user data."""
import json,re
from pathlib import Path
from bs4 import BeautifulSoup,Comment

ROOT=Path('docs'); OUT=ROOT/'locales'; OUT.mkdir(exist_ok=True)
normalize=lambda s:re.sub(r'\s+',' ',s).strip()
strings=set()
attrs=('aria-label','title','placeholder','alt')
def add(s):
    s=normalize(s)
    if s and re.search('[A-Za-z]',s):strings.add(s)
def document(html):
    soup=BeautifulSoup(html,'html.parser')
    for el in soup(['script','style','svg']):el.decompose()
    for text in soup.find_all(string=True):
        if not isinstance(text,Comment):add(text)
    for el in soup.find_all(True):
        for attr in attrs:
            if el.get(attr):add(el[attr])
        if el.name=='meta' and (el.get('name')=='description' or el.get('property') in ('og:title','og:description','og:image:alt') or el.get('name','').startswith('twitter:') and el.get('name')!='twitter:card'):add(el.get('content',''))

pages=[ROOT/'index.html',ROOT/'live.html',*sorted(ROOT.glob('*/index.html'))]
for page in pages:
    if page.parent.name not in ('es','fr','de','pt'):document(page.read_text(encoding='utf-8'))
for source in json.loads(Path('outputs/localization/runtime-literals.json').read_text(encoding='utf-8')):
    if '<' in source and re.search(r'<[a-zA-Z][^>]*>',source):document(source)
    else:
        s=normalize(source)
        if len(s)>1 and not re.search(r'(?:https?://|\b(?:function|const|return)\b|[.#][\w-]+\[|\bdata-[\w-]+=|\./|[{}];|=>)',s) and (re.match(r'[A-Z][a-z]',s) or ' ' in s or s in ('bell','beep','gong','off','horn','click')):
            add(s)
for s in ['Search timers','Search by name or activity','Clear search','No timers found. Try another name or activity.','Language','Timer results','Raw egg','All timers','Custom Timer','Search results','Switching languages keeps your saved settings.','English','Español','Français','Deutsch','Português']:
    add(s)
# Never translate code, styles, URLs or the brand. They can occur in template fragments.
strings={s for s in strings if not re.search(r'(?:https?://|^[/#.<\"]|[{}];|=>|\b(?:rgb|translate|rotate|scale)\(|\b(?:const|return|document|window)\.|\b(?:style|class|placeholder|aria-\w+)=)',s) and s not in ('Corp','CorpTimer','Timer')}
(OUT/'source.json').write_text(json.dumps(sorted(strings),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'{len(strings)} distinct strings; {sum(len(s) for s in strings)} source characters.')
