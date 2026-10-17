import argparse
import json
import re
import urllib.request
import urllib.error
import urllib.parse
import xml.etree.ElementTree as ET
from pathlib import Path
from bs4 import BeautifulSoup

parser = argparse.ArgumentParser()
parser.add_argument('--root', required=True)
parser.add_argument('--base', help='Optional local or live HTTP origin; performs GET checks only')
args = parser.parse_args()
root = Path(args.root).resolve()
origin = 'https://victoryglobalmaterials.com'
pages = [root/'index.html', root/'thank-you.html', *sorted((root/'products').glob('*.html')), *sorted((root/'markets').glob('*.html'))]
assert len(pages) == 14
assets, titles, descriptions = set(), set(), set()
public_remote_links = {'https://wa.me/6589736956', 'https://www.pub.gov.sg/Professionals/Requirements/Water-Supply-Services/Water-Fittings'}
for page in pages:
    soup = BeautifulSoup(page.read_text(encoding='utf-8'), 'html.parser')
    assert soup.html['data-mode'] == 'production'
    assert soup.html['lang'] == 'en' and len(soup.select('h1')) == 1
    assert not soup.select('.beta-banner')
    assert not re.search(r'beta preview|local sample|simulated|preview complete|no enquiry has been sent|sample form', soup.get_text(' '), re.I)
    assert not re.search(r'zalo|wa\.me/8618664333510|Vietnam projects|nationwide logistics', str(soup), re.I)
    expected = origin+'/' + ('' if page.name == 'index.html' else page.relative_to(root).as_posix())
    assert soup.select_one('link[rel="canonical"]')['href'] == expected
    assert soup.select_one('meta[property="og:url"]')['content'] == expected
    assert soup.select_one('meta[name="robots"]')['content'] == ('noindex, follow' if page.name == 'thank-you.html' else 'index, follow')
    title, description = soup.title.get_text(), soup.select_one('meta[name="description"]')['content']
    assert title not in titles and description not in descriptions
    titles.add(title)
    descriptions.add(description)
    assert soup.select_one('script[src$="assets/analytics.js"]')
    assert all(a['href'] == 'https://wa.me/6589736956' for a in soup.select('a[href*="wa.me"]'))
    assert soup.select_one('a[href="tel:+8618664333510"]')
    for script in soup.select('script[type="application/ld+json"]'):
        graph = json.loads(script.string)['@graph']
        for entity in graph:
            assert entity['@type'] != 'LocalBusiness'
            if entity['@type'] == 'Organization': assert 'areaServed' not in entity
            if entity['@type'] == 'Product':
                assert not {'offers', 'review', 'aggregateRating', 'brand', 'manufacturer'} & entity.keys()
                assert entity['name'] == soup.h1.get_text()
                assert entity['description'] == soup.select_one('.detail-summary').get_text()
                assert [[x.get_text() for x in row.select('th,td')] for row in soup.select('.spec-table tr')] == [[p['name'],p['value']] for p in entity['additionalProperty']]
    for link in soup.select('a[href]'):
        url = urllib.parse.urlsplit(link['href'])
        if url.scheme in ['mailto','tel']: continue
        if url.scheme:
            assert link['href'] in public_remote_links
            continue
        target = page.parent / urllib.parse.unquote(url.path) if url.path else page
        assert target.is_file(), link['href']
        if url.fragment: assert BeautifulSoup(target.read_text(encoding='utf-8'),'html.parser').find(id=url.fragment)
    for element in soup.select('img[src],script[src],link[rel="stylesheet"]'):
        ref = element.get('src') or element['href']
        assert not urllib.parse.urlsplit(ref).scheme
        asset = (page.parent / urllib.parse.unquote(ref)).resolve()
        assert asset.is_file(), ref
        assets.add(asset.relative_to(root).as_posix())
        if element.name == 'img': assert 'alt' in element.attrs

home = BeautifulSoup((root/'index.html').read_text(encoding='utf-8'), 'html.parser')
form = home.select_one('form')
assert form['action'] == 'https://formsubmit.co/info@victory-global.cn' and form['method'] == 'post'
assert form.select_one('[name="_next"]')['value'] == origin+'/thank-you.html'
assert form.select_one('[name="_captcha"]')['value'] == 'false'
assert form.select_one('[name="_honey"]').has_attr('hidden')
assert form.select_one('#enquiry-destination').has_attr('required')
assert form.select_one('button').get_text() == 'Send Enquiry →'
for field in form.select('input:not([type="hidden"]):not([hidden]),textarea'):
    assert home.find('label',attrs={'for':field['id']})
runtime = (root/'assets/catalog.js').read_text(encoding='utf-8')
payload = json.loads(runtime.split(' = ',1)[1].strip().removesuffix(';'))
assert payload['mode'] == 'production'
assert all('unconfirmed' not in product and 'specifications' not in product for product in payload['products'])
assert 'sourceCommit' not in payload and 'company' not in payload
for locale in ['en','vi','zh']:
    assert 'beta' not in payload['ui'][locale]['previewNote'].lower()
assert payload['ui']['vi']['sendEnquiry'] == 'Gửi yêu cầu →'
assert payload['ui']['zh']['sendEnquiry'] == '发送询盘 →'
assert "if (data.mode !== 'production')" in (root/'assets/site.js').read_text(encoding='utf-8')
assert "html[data-mode=\"production\"]{--beta-height:0px}" in (root/'assets/beta.css').read_text(encoding='utf-8')
analytics = (root/'assets/analytics.js').read_text(encoding='utf-8')
assert 'G-G62KT54MPQ' in analytics and 'location.hostname' in analytics
locations = [e.text for e in ET.parse(root/'sitemap.xml').findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert len(locations) == len(set(locations)) == 13 and origin+'/' in locations
assert not any('thank-you' in loc or 'review' in loc for loc in locations)
assert all((root/(urllib.parse.urlsplit(loc).path.lstrip('/') or 'index.html')).is_file() for loc in locations)
robots = (root/'robots.txt').read_text()
assert not re.search(r'Disallow:\s*/\s*(?:\n|$)',robots)
assert 'Sitemap: '+origin+'/sitemap.xml' in robots
assert (root/'CNAME').read_text().strip() == 'victoryglobalmaterials.com'
for private in ['review.html','.preview','docs','data','src','scripts']:
    assert not (root/private).exists(), 'Unexpected preview source in release: '+private
if (root/'_source').exists(): assert '  - _source' in (root/'_config.yml').read_text()
fetches = 0
if args.base:
    base = args.base.rstrip('/')+'/'
    for relative in [p.relative_to(root).as_posix() for p in pages]+sorted(assets)+['robots.txt','sitemap.xml']:
        response = urllib.request.urlopen(base+urllib.parse.quote(relative),timeout=30)
        assert response.status == 200
        assert 'noindex' not in response.headers.get('X-Robots-Tag','').lower()
        body = response.read()
        if relative.endswith('.html'):
            live = BeautifulSoup(body,'html.parser')
            assert live.html.get('data-mode') == 'production', 'Old page still served: '+relative
        fetches += 1
    for private in ['review.html','_source/data/catalog.json','.preview/readability-report.json']:
        try:
            urllib.request.urlopen(base+private,timeout=30)
            raise AssertionError('Private path is publicly served: '+private)
        except urllib.error.HTTPError as e: assert e.code == 404
print(f'PASS production: {len(pages)} pages, {len(assets)} assets, {len(locations)} canonical URLs; real-form configuration, analytics, indexability, contacts, schema and release isolation. HTTP GET checks: {fetches}. No enquiry sent.')
