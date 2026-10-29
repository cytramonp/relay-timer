"""Read-only release checks against the canonical public site."""
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import re
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ORIGIN = 'https://corptimer.com'
ROOT = Path(__file__).resolve().parents[1]

def fetch(url):
    request = Request(url, headers={'Cache-Control': 'no-cache', 'Accept-Encoding': 'identity'})
    with urlopen(request, timeout=30) as response:
        return response.status, response.geturl(), response.read()

status, _, sitemap_bytes = fetch(ORIGIN + '/sitemap.xml')
assert status == 200
sitemap = ET.fromstring(sitemap_bytes)
urls = [node.text for node in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
expected_tree = ET.fromstring((ROOT / 'docs' / 'sitemap.xml').read_bytes())
expected_urls = [node.text for node in expected_tree.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert urls == expected_urls and len(set(urls)) == len(urls), 'Public sitemap does not match this release'

def check_page(url):
    status, final_url, body = fetch(url)
    html = body.decode('utf-8')
    assert status == 200, url
    assert final_url == url, (url, final_url)
    assert '<details class="timer-switcher">' in html, url
    assert f'rel="canonical" href="{url}"' in html, url
    assert not re.search(r'name="robots"[^>]*noindex', html), url
    guide = url != ORIGIN + '/timers/'
    assert html.count('<details class="timer-guide">') == int(guide), url
    assert '<details class="timer-guide" open' not in html, url
    if guide:
        assert '<summary>How it works and advice' in html and '<li>' in html, url
    title = re.search(r'<title>(.*?)</title>', html).group(1)
    return {'url': url, 'status': status, 'title': title, 'static_guide': guide}

with ThreadPoolExecutor(max_workers=4) as pool:
    pages = list(pool.map(check_page, urls))
assets = []
for asset in ['/special-timers.css', '/special-timers.js', '/timer-menu.js', '/timer-engine.js', '/assets/timer-illustrations.jpg', '/board-engine.js', '/specialty-catalog.js', '/specialty-board.js', '/timer-favorites.js', '/assets/multi-stopwatch.png', '/assets/specialty-illustrations.png', '/assets/gong.wav', '/timer-account.js', '/timer-store.js', '/cue-player.js', '/timer-timeline.js', '/board-editor.js', '/fullscreen.js', '/timer-themes.js', '/timer-popularity.js', '/assets/routine-illustrations.png']:
    status, _, body = fetch(ORIGIN + asset)
    assert status == 200 and body == (ROOT / 'docs' / asset.lstrip('/')).read_bytes(), asset
    assets.append({'path': asset, 'status': status, 'sha256': hashlib.sha256(body).hexdigest()})
status, _, robots = fetch(ORIGIN + '/robots.txt')
assert status == 200 and b'User-agent: OAI-SearchBot' in robots and b'Sitemap: https://corptimer.com/sitemap.xml' in robots
status, _, llms = fetch(ORIGIN + '/llms.txt')
assert status == 200 and b'How it works and advice' in llms
for verification_file in (ROOT / 'docs').glob('google*.html'):
    status, _, body = fetch(ORIGIN + '/' + verification_file.name)
    assert status == 200 and body == verification_file.read_bytes(), 'Google verification document mismatch'
report = {'origin': ORIGIN, 'public_pages': pages, 'assets': assets, 'robots': 'pass', 'llms': 'pass', 'google_verification_file': 'pass'}
report_path = ROOT / 'outputs' / 'timer-library' / 'public-verification.json'
report_path.parent.mkdir(parents=True, exist_ok=True)
report_path.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'origin': ORIGIN, 'pages_passed': len(pages), 'assets_passed': len(assets), 'report': str(report_path)}))
