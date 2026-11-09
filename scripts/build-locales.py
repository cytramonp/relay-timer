"""Build complete static translations. No network, credentials or account required."""
import argparse,json,re,posixpath
from pathlib import Path
from urllib.parse import urljoin,urlsplit,urlunsplit
from xml.etree import ElementTree as ET
from bs4 import BeautifulSoup,Comment,Doctype

parser=argparse.ArgumentParser();parser.add_argument('--root',default='docs');args=parser.parse_args()
ROOT=Path(args.root);ORIGIN='https://corptimer.com'
LANGUAGES={'en':'English','es':'Español','fr':'Français','de':'Deutsch','pt':'Português'}
normalize=lambda s:re.sub(r'\s+',' ',s).strip()
english=[ROOT/'index.html',*sorted(p for p in ROOT.glob('*/index.html') if p.parent.name not in LANGUAGES)]
paths=[('/'+p.relative_to(ROOT).as_posix()).replace('index.html','') for p in english]
paths.append('/live.html')
(ROOT/'locale-routes.js').write_text('export const publicPaths='+json.dumps([p[1:] for p in paths])+';\n',encoding='utf-8')
catalogs={lang:json.loads((ROOT/'locales'/f'{lang}.json').read_text(encoding='utf-8')) for lang in LANGUAGES if lang!='en'}
missing={lang:set() for lang in catalogs};counts={}
def translated(s,lang,record=True):
    key=normalize(s)
    if lang=='en' or not re.search('[a-zA-Z]',key):return s
    result=catalogs[lang].get(key)
    if result is None:
        if record and key not in ('Corp','Timer','CorpTimer','Alex','English','Español','Français','Deutsch','Português') and not key.startswith(('http','mailto:')):missing[lang].add(key)
        return s
    return s[:len(s)-len(s.lstrip())]+result+s[len(s.rstrip()):]
def locale_url(path,lang):return ORIGIN+('' if lang=='en' else '/'+lang)+path
def relative_url(target,path,lang):
    current=('' if lang=='en' else '/'+lang)+path
    folder=current if current.endswith('/') else posixpath.dirname(current)+'/'
    result=posixpath.relpath(target,folder)
    return result+('/' if target.endswith('/') else '')
def switcher(path,lang):
    label=translated('Language',lang)
    globe='<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor"/><path d="M2 10h16M10 2c-5 4-5 12 0 16M10 2c5 4 5 12 0 16" fill="none" stroke="currentColor"/></svg>'
    links=''.join(f'<a href="{relative_url(locale_url(path,code).replace(ORIGIN,""),path,lang)}" lang="{code}" hreflang="{code}"'+(' aria-current="page"' if code==lang else '')+f'>{name}</a>' for code,name in LANGUAGES.items())
    return f'<!-- language-menu:start --><details class="language-switcher"><summary aria-label="{label}">{globe}<span>{lang.upper()}</span></summary><div class="language-options">{links}</div></details><!-- language-menu:end -->'
def strip_injected(html):
    html=re.sub(r'<!-- language-menu:start -->.*?<!-- language-menu:end -->','',html,flags=re.S)
    return re.sub(r'<!-- localization:start -->.*?<!-- localization:end -->\s*','',html,flags=re.S)
def head(path,lang):
    alternates=''.join(f'<link rel="alternate" hreflang="{code}" href="{locale_url(path,code)}">' for code in LANGUAGES)
    alternates+=f'<link rel="alternate" hreflang="x-default" href="{locale_url(path,"en")}">'
    return '<!-- localization:start -->'+alternates+f'<link rel="stylesheet" href="{relative_url("/localization.css",path,lang)}?v=1"><script type="module" src="{relative_url("/localization.js",path,lang)}?v=1"></script><!-- localization:end -->\n'
def inject(html,path,lang):
    html=html.replace('</head>',head(path,lang)+'</head>',1)
    # Live screen has a different header; it stays noindex in every language.
    if path=='/live.html':return html.replace('</header>',switcher(path,lang)+'</header>',1)
    return re.sub(r'(<header\b.*?</nav>)',lambda m:m[1].replace('</nav>',switcher(path,lang)+'</nav>'),html,count=1,flags=re.S)
def href(value,path,lang,is_page=False):
    if not value or value.startswith(('#','data:','blob:','mailto:','tel:')):return value
    url=urlsplit(urljoin(ORIGIN+path,value))
    if url.netloc!='corptimer.com':return value
    target=url.path
    if is_page and target in paths:target=('' if lang=='en' else '/'+lang)+target
    return urlunsplit(('', '',relative_url(target,path,lang),url.query,url.fragment))
def schema_value(value,lang,key=None):
    if isinstance(value,dict):
        result={k:schema_value(v,lang,k) for k,v in value.items()}
        if result.get('@type') in ('WebSite','WebPage','WebApplication','CollectionPage'):result['inLanguage']=lang
        return result
    if isinstance(value,list):return [schema_value(v,lang,key) for v in value]
    if isinstance(value,str):
        if key in ('name','description','headline','text'):return translated(value,lang,False)
        if key in ('url','@id','item') and value.startswith(ORIGIN):
            u=urlsplit(value)
            if u.path in paths:return locale_url(u.path,lang)+('#'+u.fragment if u.fragment else '')
    return value

for file in [*english,ROOT/'live.html']:
    path=('/'+file.relative_to(ROOT).as_posix()).replace('index.html','')
    original=strip_injected(file.read_text(encoding='utf-8'))
    # The English body remains byte-for-byte unchanged apart from the language UI.
    file.write_text(inject(original,path,'en'),encoding='utf-8')
    original_soup=BeautifulSoup(original,'html.parser')
    counts[path]={'paragraphs':len(original_soup.select('p')),'list_items':len(original_soup.select('li')),'headings':len(original_soup.select('h1,h2,h3,h4'))}
    for lang in catalogs:
        soup=BeautifulSoup(original,'html.parser');soup.html['lang']=lang
        for el in soup.find_all(True):
            if el.name=='script':
                if el.get('type')=='application/ld+json' and el.string:el.string=json.dumps(schema_value(json.loads(el.string),lang),ensure_ascii=False)
                if el.get('src'):el['src']=href(el['src'],path,lang)
                continue
            for attr in ('href','src','poster'):
                if el.get(attr):el[attr]=href(el[attr],path,lang,el.name=='a')
            if el.get('srcset'):el['srcset']=', '.join(' '.join([href(part.strip().split()[0],path,lang),*part.strip().split()[1:]]) for part in el['srcset'].split(','))
            if el.name=='option' and 'value' not in el.attrs:el['value']=el.get_text()
            for attr in ('aria-label','title','placeholder','alt'):
                if el.get(attr):el[attr]=translated(el[attr],lang)
            if el.name=='meta':
                name=el.get('property') or el.get('name','')
                if name in ('description','og:title','og:description','og:image:alt','twitter:title','twitter:description','twitter:image:alt'):el['content']=translated(el.get('content',''),lang)
                if name=='og:url':el['content']=locale_url(path,lang)
                if name=='og:locale':el['content']={'es':'es_ES','fr':'fr_FR','de':'de_DE','pt':'pt_BR'}[lang]
            if el.name=='link' and 'canonical' in el.get('rel',[]):el['href']=locale_url(path,lang)
        for node in list(soup.find_all(string=True)):
            if isinstance(node,(Comment,Doctype)) or node.find_parent(['script','style','svg']):continue
            if node.find_parent(class_='wordmark'):continue
            node.replace_with(translated(str(node),lang))
        output=inject(str(soup),path,lang)
        target=ROOT/lang/file.relative_to(ROOT);target.parent.mkdir(parents=True,exist_ok=True);target.write_text(output+'\n',encoding='utf-8')
        translated_soup=BeautifulSoup(output,'html.parser')
        for selector,key in [('p','paragraphs'),('li','list_items'),('h1,h2,h3,h4','headings')]:
            assert len(translated_soup.select(selector))==counts[path][key],f'Content lost in {lang}{path}: {key}'
urls=[locale_url(path,lang) for lang in LANGUAGES for path in paths if path!='/live.html']
(ROOT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'  <url><loc>{url}</loc></url>\n' for url in urls)+'</urlset>\n',encoding='utf-8')
robots=(ROOT/'robots.txt').read_text(encoding='utf-8')
robots=re.sub(r'Disallow: /(es|fr|de|pt)/live.html\n','',robots)
robots=robots.replace('Disallow: /live.html\n','Disallow: /live.html\n'+''.join(f'Disallow: /{lang}/live.html\n' for lang in catalogs))
(ROOT/'robots.txt').write_text(robots,encoding='utf-8')
llms=(ROOT/'llms.txt').read_text(encoding='utf-8').split('\n## Languages\n')[0]
(ROOT/'llms.txt').write_text(llms.rstrip()+'\n\n## Languages\n\n'+''.join(f'- [{name}]({locale_url("/timers/",lang)}): complete timer library and guides.\n' for lang,name in LANGUAGES.items()),encoding='utf-8')
report={'pages_per_language':len(english),'public_urls':len(urls),'content_counts':counts,'missing':{lang:sorted(items) for lang,items in missing.items()}}
Path('outputs/localization').mkdir(parents=True,exist_ok=True)
Path('outputs/localization/build-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Built {len(urls)} public pages and {len(LANGUAGES)} noindex live screens. All paragraph, list-item and heading counts preserved.')
if any(missing.values()):
    print('Missing translations:',{lang:len(items) for lang,items in missing.items()})
    raise SystemExit(1)
