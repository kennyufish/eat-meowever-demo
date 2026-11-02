# EatMeowever demo · 吃什喵

Can't decide where to eat? Pick a spot, a distance and a kind of food, and the cat draws one restaurant at random.

**Try it:** https://kennyufish.github.io/eat-meowever-demo/

This is a free, public demo of EatMeowever that covers **California only**. It is a plain static site:

- No accounts, nothing saved, no server. The draw runs in your browser.
- Your location is read with the browser's location prompt and never leaves your device. You can pick a city instead.
- The only requests are for this site's own data files and, after a draw, the Google Maps embed for the drawn place.

## How it works

- `scripts/build_data.py` reads the latest [Overture Maps](https://overturemaps.org) places release from its public S3 bucket, keeps California dining places (restaurants, cafes, bars, food trucks and similar) with a confidence of at least 0.5, and writes them as about 2,800 small JSON tiles (about 0.045° × 0.055°, roughly 5 km).
- `site/` is the page: `index.html`, `style.css` and `app.js`, with no build step. `app.js` loads the tiles around you, filters by distance and kind, and picks one at random.
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

Place data can be wrong or out of date. Check before you go.

Fonts: subsets of Fredoka and IBM Plex Mono, under the SIL Open Font License (`site/fonts/*-OFL.txt`).

This project is not affiliated with Google, Apple, Foursquare or the Overture Maps Foundation.

## License

The code is under the [MIT License](LICENSE).

The MIT License does not cover the names "EatMeowever" and "吃什喵" or the cat artwork. They are reserved; please do not use them for your own app or fork without permission.
