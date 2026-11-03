# EatMeowever demo · 吃什喵

Can't decide where to eat? Pick a spot, and the printer cat prints you an order ticket for a random restaurant nearby. Swipe it away for another, or stamp it and go.

**Try it:** https://kennyufish.github.io/eat-meowever-demo/

This is a free, public demo of EatMeowever that covers **California only**. It is a plain static site:

- No accounts, nothing saved, no server. The draw runs in your browser.
- Your location is read with the browser's location prompt and never leaves your device. You can pick a city instead.
- The only requests are for this site's own data files and, after a draw, the Google Maps embed for the drawn place.

## How it works

- `scripts/build_data.py` reads the latest [Overture Maps](https://overturemaps.org) places release from its public S3 bucket, keeps California dining places (restaurants, cafes, bars, food trucks and similar) with a confidence of at least 0.5, and writes them as about 2,800 small JSON tiles (about 0.045° × 0.055°, roughly 5 km).
- `site/` is the page: `index.html`, `style.css` and `app.js`, with no build step. It is the EatMeowever app's Ticket Stack draw screen (printer cat, order tickets, swipe pile), ported to plain JavaScript. `app.js` loads the tiles around you, filters by category, cuisine and distance, and picks one at random. The UI is in Simplified Chinese or English; theme, sound (off by default), language and unit are remembered in your browser only.
- `.github/workflows/pages.yml` deploys `site/` to GitHub Pages on every push. On the 3rd of each month it rebuilds the data first and keeps it on the `data` branch; if the rebuild fails, the previous data is deployed again.

Run it locally:

```bash
pip install -r scripts/requirements.txt
python scripts/build_data.py
python -m http.server -d site 8000
```

The map embed needs a Google Maps Embed API key in `site/config.js` (`window.EMBED_KEY`). Without one, the page still works and shows only the Google Maps and Apple Maps links. The deployed site gets the key from the `MAPS_EMBED_KEY` repository secret. That key is restricted to the Maps Embed API and to this site's URL; it is visible in the page by design.

## Data and credits

Places data © [Overture Maps Foundation](https://overturemaps.org), from the release named on the page and in `data/meta.json`. Overture's Places theme combines several sources, each under its own license ([Overture attribution](https://docs.overturemaps.org/attribution/)):

- Most sources (Meta, Microsoft and others): [CDLA Permissive 2.0](https://cdla.dev/permissive-2-0/).
- Foursquare: [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0), Copyright 2024 Foursquare Labs, Inc. See the [Foursquare places NOTICE](https://opensource.foursquare.com/places-notice-txt/). The data was transformed to the Overture schema, and this project trims and re-tiles it further.
- AllThePlaces: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).

Chinese names: when the page is in Chinese, some places also show a Chinese name in Simplified Chinese. They come from [OpenStreetMap](https://www.openstreetmap.org/copyright) (`name:zh-Hans`, `name:zh`, `name:zh-Hant` or a Chinese `name` on a dining place within 150 m whose name matches) and, for chains, from the [Name Suggestion Index](https://github.com/osmlab/name-suggestion-index). `scripts/zh_names.py` fetches the OSM side from Geofabrik's free [Postpass](https://postpass.geofabrik.de/) service each month and converts Traditional names with OpenCC. A place with no confident match keeps only its English name. These names are © OpenStreetMap contributors under the [ODbL](https://opendatacommons.org/licenses/odbl/), with brand names from the Name Suggestion Index (BSD 3-Clause). They sit in their own files, `data/zh/*.json`, which are offered under the ODbL. That is a different license from the code. See [NOTICE](NOTICE).

Only places that Overture marks as open are kept. Names are shown as listed in the source, mostly in English. Place data can be wrong or out of date, so check Google Maps for opening hours and status before you go.

Fonts: subsets of Huninn, Resource Han Rounded, Fredoka, IBM Plex Mono and Noto Serif TC, under the SIL Open Font License (`site/fonts/*-OFL.txt`). The Simplified Chinese UI font is rebuilt with `scripts/build_sc_font.py`.

This project is not affiliated with Google, Apple, Foursquare or the Overture Maps Foundation.

## Known limits

- Overture's operating status can lag behind reality, so a drawn place may have closed, or may not be a restaurant at all. "Closed / not a restaurant" on a place's details hides it from future draws. The list stays in your browser only, and Settings shows how many are hidden and can clear them.
- There are no opening hours; check Google Maps before you go.

## License

The code is under the [MIT License](LICENSE).

The MIT License does not cover the names "EatMeowever" and "吃什喵" or the cat artwork. They are reserved; please do not use them for your own app or fork without permission.
