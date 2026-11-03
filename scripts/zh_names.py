"""Chinese names for Overture places, from OpenStreetMap (ODbL) and the Name Suggestion Index (BSD-3), in Simplified Chinese.

OSM: dining places in California with a Chinese name, from Geofabrik's free Postpass service. A place gets the name of an OSM
object within 150 m whose name matches it (similarity >= 0.7, or the Chinese name appears in the Overture name).
Priority: OSM name:zh-Hans > name:zh / name:zh-Hant / a Chinese name tag > an NSI brand's name:zh.
Names already in Simplified are kept; the rest go through OpenCC t2s. When unsure, a place gets no Chinese name.
"""
import difflib, json, math, re, unicodedata, urllib.parse, urllib.request

from opencc import OpenCC

POSTPASS = 'https://postpass.geofabrik.de/api/interpreter'
NSI = 'https://cdn.jsdelivr.net/npm/name-suggestion-index@8/dist/json/nsi.min.json'
OSM_SQL = r"""SELECT tags->>'name' AS name, tags->>'name:en' AS en, tags->>'name:zh-Hans' AS hans, tags->>'name:zh-CN' AS cn,
 tags->>'name:zh' AS zh, tags->>'name:zh-Hant' AS hant, tags->>'name:zh-TW' AS tw, tags->>'name:zh-HK' AS hk, ST_Centroid(geom) AS geom
FROM postpass_pointpolygon
WHERE tags->>'amenity' IN ('restaurant','fast_food','cafe','bar','pub','food_court','ice_cream')
AND geom && ST_MakeEnvelope(-124.5,32.5,-114.1,42.1,4326)
AND (tags ? 'name:zh' OR tags ? 'name:zh-Hans' OR tags ? 'name:zh-Hant' OR tags ? 'name:zh-CN' OR tags ? 'name:zh-TW'
     OR tags ? 'name:zh-HK' OR tags->>'name' ~ '[一-鿿]')"""
# NSI items that apply in California.
US_SETS = {'001', '019', '021', 'us', 'us-ca'}
HAN = re.compile(r'[㐀-鿿豈-﫿][㐀-鿿豈-﫿·・ ]*[㐀-鿿豈-﫿]')
MAX_M, MIN_SIM = 150, 0.7
t2s = OpenCC('t2s').convert


def han(text):
    """The longest run of Chinese characters in a name ('Din Tai Fung 鼎泰豐' gives '鼎泰豐'), or ''."""
    runs = HAN.findall(text or '')
    return max(runs, key=len).replace(' ', '') if runs else ''


GENERIC = re.compile(r'(the|restaurant|cafe|kitchen|inc|llc)')


LATIN_WORD = r"[A-Za-z0-9&'’.,-]+"


def zh_part(text):
    """The Chinese part of a name, keeping Latin letters inside it ('1點點', '紅A餅店') but dropping space-separated
    Latin words around it ('Din Tai Fung 鼎泰豐' gives '鼎泰豐'), or '' when there is no Chinese."""
    for part in re.split(r'\s*[;/|()（）]\s*', (text or '').strip()):
        if not han(part):
            continue
        part = re.sub(rf'^({LATIN_WORD}\s+)+', '', part)
        part = re.sub(rf'(\s+{LATIN_WORD})+$', '', part).strip()
        if len(part) >= 2:
            return part
    return ''


def norm(text):
    """Lowercase Latin letters and digits only, without filler words, for comparing names across sources."""
    text = GENERIC.sub(' ', unicodedata.normalize('NFKD', text or '').lower())
    return re.sub(r'[^a-z0-9]', '', text)


def similar(a, b):
    """1 for the same name, also when one is the other plus a branch or place ('Ocean Star' / 'Ocean Star Monterey Park')."""
    a, b = norm(a), norm(b)
    if not a or not b:
        return 0
    if min(len(a), len(b)) >= 5 and (a.startswith(b) or b.startswith(a)):
        return 1.0
    return difflib.SequenceMatcher(None, a, b).ratio()


def meters(a, b):
    r = math.pi / 180
    h = math.sin((b[0] - a[0]) * r / 2) ** 2 + math.cos(a[0] * r) * math.cos(b[0] * r) * math.sin((b[1] - a[1]) * r / 2) ** 2
    return 12_742_000 * math.asin(math.sqrt(h))


def fetch(url, data=None):
    body = urllib.parse.urlencode({'data': data}).encode() if data else None
    with urllib.request.urlopen(urllib.request.Request(url, body, {'User-Agent': 'eat-meowever-demo data build'}), timeout=300) as r:
        return json.loads(r.read())


def osm_names():
    """[(lat, lon, latin name, zh name in Simplified)] for OSM dining places in California with a Chinese name."""
    out = []
    for f in fetch(POSTPASS, OSM_SQL)['features']:
        p, (lon, lat) = f['properties'], f['geometry']['coordinates']
        zh = zh_part(p.get('hans') or p.get('cn'))
        if not zh:
            zh = t2s(zh_part(p.get('zh') or p.get('hant') or p.get('tw') or p.get('hk') or p.get('name')))
        latin = p.get('en') or re.sub(HAN, ' ', p.get('name') or '')
        if len(zh) >= 2:
            out.append((lat, lon, latin, zh))
    return out


def nsi_names():
    """{normalized brand name: zh name in Simplified} for dining brands that apply in the US."""
    out = {}
    for key, cat in fetch(NSI)['nsi'].items():
        if not key.startswith('brands/amenity/') or key.split('/')[2] not in ('restaurant', 'fast_food', 'cafe', 'bar', 'pub', 'ice_cream'):
            continue
        for item in cat['items']:
            loc, tags = item.get('locationSet', {}), item['tags']
            # locationSet entries can also be coordinates (lists); only region codes matter here.
            codes = lambda k: {x.lower() for x in loc.get(k, []) if isinstance(x, str)}
            if not US_SETS & codes('include') or US_SETS & codes('exclude'):
                continue
            zh = zh_part(tags.get('name:zh-Hans')) or t2s(zh_part(tags.get('name:zh') or tags.get('name:zh-Hant')))
            if len(zh) < 2:
                continue
            for name in [item.get('displayName'), tags.get('name'), tags.get('brand'), *item.get('matchNames', [])]:
                if norm(name):
                    out[norm(name)] = zh
    return out


def find(places):
    """{(tile key, short id): (zh name, 'osm' | 'nsi')} for places with a confident Chinese name.
    places: [(tile key, place dict with i/n/y/x/b)], b being the brand name or ''."""
    cell = lambda lat, lon: (math.floor(lat / 0.002), math.floor(lon / 0.002))
    grid = {}
    for key, p in places:
        grid.setdefault(cell(p['y'], p['x']), []).append((key, p))
    found = {}
    osm = osm_names()
    for lat, lon, latin, zh in osm:
        cy, cx = cell(lat, lon)
        best = None
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                for key, p in grid.get((cy + dy, cx + dx), []):
                    if meters((lat, lon), (p['y'], p['x'])) > MAX_M:
                        continue
                    sim = similar(latin, p['n'])
                    if zh in t2s(p['n']) or han(p['n']) and t2s(han(p['n'])) == zh:
                        sim = 1.0
                    if sim >= MIN_SIM and (not best or sim > best[0]):
                        best = (sim, key, p)
        if best:
            found[(best[1], best[2]['i'])] = (zh, 'osm')
    print(f'OSM: {len(osm)} places with a Chinese name, {len(found)} matched', flush=True)
    brands = nsi_names()
    nsi = 0
    for key, p in places:
        if (key, p['i']) in found:
            continue
        zh = brands.get(norm(p['n'])) or brands.get(norm(p.get('b')))
        if zh:
            found[(key, p['i'])] = (zh, 'nsi')
            nsi += 1
    print(f'NSI: {len(brands)} brand names with a Chinese name, {nsi} places matched', flush=True)
    return found


assert zh_part('Din Tai Fung 鼎泰豐') == '鼎泰豐' and zh_part('紅A餅店') == '紅A餅店' and zh_part('CD Bakery & Deli;友誼餅家小館') == '友誼餅家小館'
assert han('Din Tai Fung 鼎泰豐') == '鼎泰豐' and han('Sam Woo') == '' and norm("McDonald's") == 'mcdonalds'
assert similar('Ocean Star Restaurant', 'Ocean Star') == 1 and similar('Cafe Tosca', 'Cafe Zoetrope') < 0.7 and similar('Pho', 'Pho Ha') < 1
