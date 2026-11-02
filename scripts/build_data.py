"""Builds site/data from the latest Overture Maps places release: California dining places, cut into small JSON tiles.

Run: pip install pyarrow && python scripts/build_data.py [release]
Reads Overture's public S3 bucket anonymously; no account or key is needed.
"""
import collections, json, math, pathlib, shutil, sys

import pyarrow.compute as pc
import pyarrow.dataset as ds
import pyarrow.fs as fs

BUCKET = 'overturemaps-us-west-2/release'
# Tile size in degrees; the page computes the same keys (site/app.js).
LAT_STEP, LON_STEP = 0.045, 0.055
CA_BBOX = (-124.5, 32.5, -114.1, 42.1)  # xmin, ymin, xmax, ymax
DINING = ['restaurant', 'casual_eatery', 'fast_food_restaurant', 'coffee_shop', 'cafe', 'bar',
          'smoothie_juice_bar', 'food_truck_stand', 'food_court']
MIN_CONFIDENCE = 0.5
OUT = pathlib.Path(__file__).resolve().parent.parent / 'site' / 'data'


def latest_release(s3):
    names = [i.base_name for i in s3.get_file_info(fs.FileSelector(BUCKET)) if i.type == fs.FileType.Directory]
    # Release names are dates with a patch suffix (2026-09-23.1), so they sort as text.
    return sorted(names)[-1]


def tile_key(lat, lon):
    return f'{math.floor(lat / LAT_STEP)}_{math.floor(lon / LON_STEP)}'


def main():
    s3 = fs.S3FileSystem(anonymous=True, region='us-west-2')
    release = sys.argv[1] if len(sys.argv) > 1 else latest_release(s3)
    data = ds.dataset(f'{BUCKET}/{release}/theme=places/type=place/', filesystem=s3, format='parquet')
    xmin, ymin, xmax, ymax = CA_BBOX
    where = ((ds.field('bbox', 'xmin') >= xmin) & (ds.field('bbox', 'xmax') <= xmax)
             & (ds.field('bbox', 'ymin') >= ymin) & (ds.field('bbox', 'ymax') <= ymax)
             & ds.field('basic_category').isin(DINING) & (ds.field('confidence') >= MIN_CONFIDENCE))
    table = data.to_table(filter=where, columns={
        'id': ds.field('id'), 'name': ds.field('names', 'primary'), 'cat': ds.field('taxonomy', 'primary'),
        'addresses': ds.field('addresses'), 'status': ds.field('operating_status'), 'conf': ds.field('confidence'),
        'lon': ds.field('bbox', 'xmin'), 'lat': ds.field('bbox', 'ymin'), 'licenses': ds.field('sources'),
    })
    print(f'{release}: {table.num_rows} rows in the box', flush=True)

    tiles, licenses = collections.defaultdict(list), collections.Counter()
    for row in table.to_pylist():
        address = (row['addresses'] or [None])[0] or {}
        if address.get('region') != 'CA' or row['status'] not in (None, 'open') or not (row['name'] or '').strip():
            continue
        licenses.update({s.get('license') or 'unknown' for s in row['licenses'] or []})
        line = ', '.join(p for p in (address.get('freeform'), address.get('locality')) if p)
        tiles[tile_key(row['lat'], row['lon'])].append({
            'i': row['id'][-8:], 'n': row['name'].strip(), 'c': row['cat'] or '', 'a': line,
            'y': round(row['lat'], 5), 'x': round(row['lon'], 5), 'p': round(row['conf'], 2),
        })

    count = sum(map(len, tiles.values()))
    assert count > 50_000, f'only {count} places; refusing to replace the data'
    shutil.rmtree(OUT, ignore_errors=True)
    (OUT / 't').mkdir(parents=True)
    for key, places in tiles.items():
        (OUT / 't' / f'{key}.json').write_text(json.dumps(places, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    meta = {'release': release, 'places': count, 'tiles': sorted(tiles), 'latStep': LAT_STEP, 'lonStep': LON_STEP,
            'licenses': dict(licenses.most_common())}
    (OUT / 'meta.json').write_text(json.dumps(meta, separators=(',', ':')), encoding='utf-8')
    print(f'{count} places in {len(tiles)} tiles; source licenses: {meta["licenses"]}')


if __name__ == '__main__':
    assert tile_key(0.0449, -0.001) == '0_-1'  # floor, not truncation, for negative longitudes
    main()
