"""Rebuilds site/fonts/eatmeowever-ui-sc.woff2: the glyphs the Chinese UI uses, from Resource Han Rounded CN Regular (OFL).

Run after changing Chinese text in site/app.js or site/index.html:
  pip install fonttools brotli
  python scripts/build_sc_font.py path/to/ResourceHanRoundedCN-Regular.ttf
The font is from https://github.com/CyanoHao/Resource-Han-Rounded/releases/tag/v0.990 (RHR-CN-0.990.7z).
Restaurant names are not in it; they use a system serif (style.css .zhn).
"""
import pathlib, sys

from fontTools import subset
from fontTools.ttLib import TTFont

SITE = pathlib.Path(__file__).resolve().parent.parent / 'site'
OUT = SITE / 'fonts' / 'eatmeowever-ui-sc.woff2'

text = (SITE / 'app.js').read_text(encoding='utf-8') + (SITE / 'index.html').read_text(encoding='utf-8')
# Plus 月 for the ticket's date, which Intl.DateTimeFormat writes (11月3日).
wanted = set(range(32, 127)) | {ord(c) for c in text + '月' if ord(c) >= 0xA0}
font = TTFont(sys.argv[1])
selected = wanted & set(font.getBestCmap())
options = subset.Options()
options.flavor = 'woff2'
options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14, 16, 17]
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=selected)
subsetter.subset(font)
# A distinct family name for the derivative; the original copyright and OFL records stay.
for record in font['name'].names:
    if record.nameID in (1, 3, 4, 6, 16):
        record.string = ('eatmeowever-ui-sc' if record.nameID == 6 else 'EatMeowever UI SC').encode(record.getEncoding())
font.save(OUT)
# Every CJK character of the UI must be in the font; symbols it lacks (★ ♡ …) fall back to the other UI fonts.
missing = {c for c in wanted - selected if 0x2E80 <= c}
assert not missing, f'missing glyphs: {"".join(map(chr, sorted(missing)))}'
print(f'{len(selected)} glyphs, {OUT.stat().st_size} bytes; not in the font: {"".join(map(chr, sorted(wanted - selected)))}')
