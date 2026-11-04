# Ajit Kumar Maurya — Portfolio

A static, responsive portfolio for GitHub Pages. Plain HTML, CSS and JavaScript; no backend, runtime dependencies, package installation or build step.

## Develop

From the repository root:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Serve the files over HTTP so the repository snapshot can load. The main page is `index.html`.

## Source map

- `index.html`: semantic sections, project stories, selected repository fallback and metadata. Existing public section anchors are retained.
- `assets/styles.css`: theme tokens, shared components, responsive layouts and reduced-motion behavior.
- `assets/app.js`: navigation, theme persistence, motion controls, artwork dialogs and safe repository rendering.
- `assets/repositories.json`: public repository snapshot. Six reviewed projects are prioritized; archives, sparse/irrelevant entries and empty live repositories are omitted. Forks are opt-in.
- `assets/products.json`: original artwork URLs and store links retained for provenance and local caching.
- `resume.html`: editable professional profile source. It intentionally contains no invented employment dates, employers or education.
- `assets/ajit-kumar-maurya-profile.pdf`: downloadable, single-page tagged profile generated from `resume.html`.
- `assets/social-card.html` / `.png`: sharing card source and export.

Update contact details in both the main page and profile, and regenerate exports after profile changes. The confirmed email is `ajitmauray@gmail.com`. LinkedIn is omitted because no verified URL was supplied. Skills and the 7+ years of experience are user-supplied; app descriptions, publishers, artwork links and repository descriptions are retained from the original portfolio and public profile. Product contributions are distinguished from organizational ownership. Product-specific Kotlin/Flutter stack claims are avoided where the available evidence only establishes Android.

## Browser and accessibility checks

The prepared cloud environment provides Python Playwright and Chromium. With the server running:

```sh
python3 tests/browser_checks.py
```

To include axe-core scans, set `AXE_PATH` to an installed `axe.min.js`:

```sh
AXE_PATH=/tmp/portfolio-audit/node_modules/axe-core/axe.min.js python3 tests/browser_checks.py
```

The suite uses real browser interactions against the local page, deterministic external-service failures, and a controlled successful GitHub response. It writes results to `/tmp/portfolio-browser-results.json`. This does not verify actual GitHub API availability; see [QA.md](QA.md).

## Generate assets

With the server running and Python Playwright available:

```sh
python3 tools/generate_exports.py
```

To cache the original Google Play icons/screenshots as local optimized WebP files, after enabling HTTPS access to `play-lh.googleusercontent.com`:

```sh
python3 tools/cache_artwork.py
```

This optional maintenance tool requires Pillow. It verifies downloaded images, limits dimensions, and updates HTML references only after every image has decoded successfully. Original URLs remain in the manifest. Its blocked-network failure path was verified; real artwork conversion awaits network access.

## External resources and hosting

Technology logos, styles, scripts, profile and sharing assets are local. System typography avoids external font requests. Only official app artwork and the optional public GitHub refresh use external resources:

- `play-lh.googleusercontent.com`: official Google Play artwork.
- `api.github.com`: public repository refresh; no token needed. Requests time out and preserve the local snapshot on failure.
- `play.google.com`: outbound product and publisher links.

Deploy the repository as a static GitHub Pages site using the existing repository publication workflow. `.nojekyll`, `robots.txt`, a sitemap and canonical/OG metadata are included. See GitHub deployment activity for publication status; the local validation results are recorded in QA.md.

## Attribution

Product names, icons and Google Play screenshots belong to their respective publishers, identified in each project story. Technology logos are from [Devicon](https://github.com/devicons/devicon); its MIT license is included at `assets/icons/LICENSE-devicon.txt`. The monogram, interface illustration, sharing card and outline icons are authored for this portfolio. No stock photos, testimonials or client logos are used.
