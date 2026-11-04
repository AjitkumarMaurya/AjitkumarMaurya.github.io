# Portfolio QA report

Validated 4 November 2026 against the local working tree in Chromium 155. The checks below were completed locally before publication. Deployment status is separate from these local validation results. Machine-readable results are in [tests/qa-results.json](tests/qa-results.json).

## Delivered

- Charcoal/indigo visual system and persistent light/dark themes; local system typography, technology logos and original interface illustration.
- Complete hero, five published product stories, about, eight skill categories, leadership journey, open-source explorer, engineering highlights and contact sections.
- Confirmed email, GitHub links and downloadable one-page tagged profile PDF. No invented career dates, employers, credentials, testimonials, metrics or per-product technology assignments.
- Genuine existing Google Play image URLs, screenshot dialogs and explicit image fallbacks. Personal contributions are separated from publisher ownership.
- Search, technology/language filters, sorting, curated original work first and opt-in forks. Local JSON snapshot, bounded public refresh, timeouts, and safe handling of API text and URLs.
- Sticky navigation, keyboard/mobile interactions, section reveals, motion controls, reduced-motion support, progress indicator and back-to-top control.
- Canonical/OG/Twitter metadata, sharing image, Person structured data, favicon, sitemap, robots.txt and static GitHub Pages compatibility.

## Browser regression: passed

All 14 check groups completed using `tests/browser_checks.py`, including four axe scans:

- All sections, five products, eight skills and five leadership practice areas render.
- Repository search, no-results state, reset, Android/Flutter/Kotlin/experiment filters, language filters, fork separation and alphabetical sorting.
- Every in-page fragment resolves; original public section and product anchors remain. PDF CTAs return a real PDF; email CTAs use the supplied address. New-tab links include `noopener`.
- Screenshot dialog opens, Escape closes it, focus returns to the initiating link, and original artwork remains linked.
- Theme switching, updated accessible labels and preference persistence across reload.
- Every section inspected at 320, 360, 390, 768, 1024, 1440 and 1920px widths. No document horizontal overflow. Mobile navigation opens, closes via Escape and closes after selecting a section.
- Reduced-motion behavior, pause/resume and live changes to the system motion preference.
- All products, selected repositories and mobile navigation remain usable without JavaScript.
- Valid SEO/structured data and no local HTTP errors or uncaught JavaScript exceptions.
- Controlled successful public API response renders safely; unsafe URLs are rejected and HTML in descriptions is treated as text. This is an integration fixture, not a claim of live API access.

Accessibility scans found **zero automated violations** against WCAG 2 A/AA, WCAG 2.1 A/AA and axe best-practice rules in desktop dark, desktop light, mobile light with navigation open, and mobile dark states. Manual keyboard focus was exercised. These checks do not establish complete WCAG conformance or replace screen-reader/real-device testing.

Fixed during QA: visible-label/accessible-name mismatches, the back-to-top landmark placement, and narrow-phone overflow from decorative orbits.

## Lighthouse lab results

Lighthouse 13.6.0, default mobile and desktop presets, local Python HTTP server:

| Metric | Mobile | Desktop |
| --- | ---: | ---: |
| Performance | 100 | 100 |
| Accessibility | 100 | 100 |
| Best practices | 96 | 96 |
| SEO | 100 | 100 |
| First contentful paint | 1.2 s | 0.3 s |
| Largest contentful paint | 1.2 s | 0.3 s |
| Total blocking time | 10 ms | 0 ms |
| Cumulative layout shift | 0 | 0 |

These are local lab measurements with remote image/API requests blocked. They do not measure production image payloads, real-user Core Web Vitals or INP. Best practices is 96 because the browser logs failed remote resource requests. JavaScript exception checks passed independently. Local serving also lacks production compression/cache headers; GitHub Pages behavior remains to be measured after deployment.

## Assets and external links

- All six selected repositories passed actual read-only `git ls-remote` checks: `imdbkt`, `news_app_newsapi_io`, `galleryImagePicker`, `flutter_ai_scrapper`, `CountryCodePickerProject`, `SeasonalGreeting`.
- Local technology SVGs were fetched from Devicon and its license is included. Local profile, styles, scripts, SVG symbols, sharing image and JSON requests passed.
- The profile PDF is a single A4 page; the final export uses tagged output. Its editable HTML source remains available.
- The optimizer produced a valid 600 × 315 WebP from the 1200 × 630 local sharing PNG in a conversion check; invalid image data was rejected.
- **Remote Google Play artwork caching could not complete.** The environment proxy denies `play-lh.googleusercontent.com` with HTTP 403. The cache tool's failure path leaves references and files unchanged. Original artwork URLs remain on the page; labeled fallbacks replace broken-image displays.
- **Live API availability is unverified.** `api.github.com` is denied by the proxy; the saved collection and error state were tested.
- **Store/public-site reachability is unverified.** Actual requests to all five Play Store pages, the publisher catalogue and the public portfolio returned proxy tunnel HTTP 403. This is a policy denial, not evidence that those URLs are broken.

## Remaining actions

1. Apply the saved environment network settings for `play-lh.googleusercontent.com`, `api.github.com`, `play.google.com` and `ajitkumarmaurya.github.io`. Existing allowed domains were preserved. Saving the draft did not apply it; environment publication is separate from website deployment.
2. Run `python3 tools/cache_artwork.py` with access enabled, then recheck all real images, live API behavior, store links and Lighthouse with the actual assets. Real Google Play image optimization and successful live refresh remain outstanding.
3. Supply a verified LinkedIn URL if it should be added. None was guessed. The supplied email and public GitHub profile provide working contact links now.
4. Review the generated professional profile and deploy through the repository's GitHub Pages workflow when desired. Verify the resulting deployment independently of these local checks.
