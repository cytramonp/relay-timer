"""Verify public language documents and exact assets after a scoped release."""
import argparse,concurrent.futures,hashlib,json,re
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request,urlopen
from bs4 import BeautifulSoup
p=argparse.ArgumentParser();p.add_argument('--base-url',default='https://corptimer.com');args=p.parse_args()
root=Path('docs');out=Path('outputs/localization');out.mkdir(parents=True,exist_ok=True)
def get(path):
    with urlopen(Request(args.base_url.rstrip('/')+path,headers={'Cache-Control':'no-cache'}),timeout=40) as response:
        assert response.status==200,(path,response.status)
        return response.read()
sitemap=get('/sitemap.xml').decode();urls=re.findall('<loc>(.*?)</loc>',sitemap)
assert len(urls)==len(set(urls))==220
def page(url):
    path=urlsplit(url).path;html=get(path);local=(root/path.strip('/')/'index.html').read_bytes();assert html==local,path+' HTML differs'
    soup=BeautifulSoup(html,'html.parser');language=path.split('/')[1] if path.split('/')[1] in ('es','fr','de','pt') else 'en'
    assert soup.html['lang']==language,path
    assert soup.select_one('link[rel=canonical]')['href']==url,path
    alternates=soup.select('link[rel=alternate][hreflang]');assert {x['hreflang'] for x in alternates}=={'en','es','fr','de','pt','x-default'}
    assert 'noindex' not in soup.select_one('meta[name=robots]')['content']
    assert soup.select_one('.language-switcher') and soup.select_one('[data-timer-search]'),path
    for script in soup.select('script[type="application/ld+json"]'):json.loads(script.string)
    return {'path':path,'language':language,'bytes':len(html),'guide':bool(soup.select_one('.timer-guide'))}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:pages=list(pool.map(page,urls))
assets=['/localization.js','/i18n-core.js','/locale-routes.js','/localization.css','/egg-visual.js','/timer-menu.js','/timer.js','/board-editor.js','/duration-dial.js','/specialty-board.js','/special-timers.js','/library.js','/timer-favorites.js','/sw.js',*[f'/locales/{l}.json' for l in ('es','fr','de','pt')]]
def asset(name):
    raw=get(name);assert raw==(root/name.lstrip('/')).read_bytes(),name+' bytes differ';return name
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(asset,assets))
robots=get('/robots.txt').decode();assert 'OAI-SearchBot' in robots
for lang in ('','es/','fr/','de/','pt/'):
    path='/'+lang+'live.html';assert 'Disallow: '+path in robots
    soup=BeautifulSoup(get(path),'html.parser');assert 'noindex' in soup.select_one('meta[name=robots]')['content']
report={'base_url':args.base_url,'public_pages':len(pages),'languages':sorted({p['language'] for p in pages}),'exact_assets':len(assets),'noindex_live_pages':5,'pages':pages}
(out/'public-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='pages'}))
