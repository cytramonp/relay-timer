"""Audit the static release, or the actual public response with --base-url."""
import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
import json
from pathlib import Path
import struct
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser()
parser.add_argument('--root', default='docs')
parser.add_argument('--base-url')
parser.add_argument('--report', default='outputs/seo-2026-10-30/audit.json')
args = parser.parse_args()
root = Path(args.root)
origin = 'https://corptimer.com'

def read(url):
    if args.base_url:
        request = Request(args.base_url.rstrip('/') + urlparse(url).path,
                          headers={'Cache-Control': 'no-cache', 'Accept-Encoding': 'identity'})
        with urlopen(request, timeout=30) as response:
            assert response.status == 200, url
            assert response.url == request.full_url, (url, response.url)
            return response.read()
    path = urlparse(url).path
    return (root / (path.lstrip('/') + ('index.html' if path.endswith('/') else ''))).read_bytes()

class Head(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.meta = {}; self.links = {}; self.title = ''; self.schemas = []; self.current = ''
        self.feed(html.split('</head>')[0])
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta' and ('name' in attrs or 'property' in attrs):
            key = attrs.get('name', attrs.get('property'))
            assert key not in self.meta, 'Duplicate metadata: ' + key
            self.meta[key] = attrs.get('content', '')
        if tag == 'link': self.links.setdefault(attrs.get('rel'), []).append(attrs)
        if tag == 'title': self.current = 'title'
        if tag == 'script' and attrs.get('type') == 'application/ld+json': self.current = 'schema'
    def handle_data(self, data):
        if self.current == 'title': self.title += data
        if self.current == 'schema': self.schemas.append(json.loads(data))
    def handle_endtag(self, tag):
        if tag in ('script', 'title'): self.current = ''

tree = ET.fromstring(read(origin + '/sitemap.xml'))
urls = [n.text for n in tree.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert urls and len(urls) == len(set(urls))
assets = set()
pages = []
for url, body in zip(urls, ThreadPoolExecutor(max_workers=6).map(read, urls)):
    html = body.decode('utf-8'); head = Head(html); meta = head.meta
    assert len(head.links.get('canonical', [])) == 1 and head.links['canonical'][0]['href'] == url, url
    assert '<h1' in html and '<html lang="en"' in html and 'noindex' not in meta.get('robots', ''), url
    assert 15 <= len(head.title) <= 65, (url, head.title)
    assert 70 <= len(meta['description']) <= 165, (url, meta['description'])
    assert meta['og:site_name'] == 'CorpTimer' and meta['og:url'] == url, url
    assert meta['og:title'] == meta['twitter:title'] == head.title, url
    assert meta['og:description'] == meta['twitter:description'] == meta['description'], url
    assert meta['og:image'] == meta['twitter:image'] and meta['og:image'].startswith(origin + '/'), url
    assert meta['og:image:alt'] == meta['twitter:image:alt'] and meta['og:image:alt'], url
    assert meta['og:image:width'] == '1200' and meta['og:image:height'] == '630', url
    assert meta['twitter:card'] == 'summary_large_image' and head.schemas, url
    assert len(head.links.get('apple-touch-icon', [])) == 1 and len(head.links.get('manifest', [])) == 1, url
    for link in head.links['icon'] + head.links['apple-touch-icon'] + head.links['manifest']:
        assets.add(urljoin(url, link['href']))
    assets.add(meta['og:image'])
    if url == origin + '/':
        types = [item['@type'] for schema in head.schemas for item in schema.get('@graph', [schema])]
        assert 'WebSite' in types and 'WebApplication' in types
    pages.append({'url':url, 'title':head.title, 'description':meta['description'], 'image':meta['og:image']})
for key in ['title', 'description']:
    assert all(v == 1 for v in Counter(p[key] for p in pages).values()), 'Duplicate ' + key

manifest = json.loads(read(origin + '/manifest.webmanifest'))
for icon in manifest['icons']: assets.add(urljoin(origin + '/', icon['src']))
assert any(icon['purpose'] == 'maskable' for icon in manifest['icons'])
asset_report = []
asset_urls = sorted(assets)
for url, body in zip(asset_urls, ThreadPoolExecutor(max_workers=6).map(read, asset_urls)):
    if url.endswith('.png'):
        assert body[:8] == b'\x89PNG\r\n\x1a\n', url
        dimensions = struct.unpack('>II', body[16:24])
        expected = (1200,630) if '/assets/' in url else {'favicon-96x96.png':(96,96),'apple-touch-icon.png':(180,180),'icon-192.png':(192,192),'icon-512.png':(512,512),'icon-maskable-512.png':(512,512)}[url.rsplit('/',1)[1]]
        assert dimensions == expected, (url, dimensions)
    if url.endswith('.ico'):
        assert struct.unpack('<HHH', body[:6]) == (0,1,3), url
    asset_report.append({'url':url,'bytes':len(body)})
robots = read(origin + '/robots.txt').decode()
assert 'Sitemap: https://corptimer.com/sitemap.xml' in robots and 'Disallow: /live.html' in robots
assert 'noindex' in Head(read(origin + '/live.html').decode()).meta['robots']
assert not any('live.html' in url for url in urls)
report = {'mode':'live' if args.base_url else 'local', 'pages':pages,'assets':asset_report,'robots':'pass','live_session_noindex':'pass'}
out = Path(args.report); out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(report,indent=2) + '\n',encoding='utf-8')
print(json.dumps({'mode':report['mode'],'pages_passed':len(pages),'assets_passed':len(asset_report),'report':str(out)}))
