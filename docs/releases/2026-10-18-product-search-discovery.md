# Umbrella Home and Falcon TMS search discovery

The public product sites lacked sitemap endpoints and site identity markup. Umbrella's title used only “Umbrella”; Falcon's title did not use “Falcon TMS”. Language choices depended on JavaScript, making distinct translated content difficult to discover.

## Public identity and URLs

- Falcon uses “Falcon TMS — Test Management for QA Teams”, with matching Russian copy and a visible description of test management. English remains `https://tms.saturnusgo.com/`; Russian is pre-rendered at `/ru/`. Both have self-referencing canonicals and reciprocal language alternates. Changing language retains workflow selection, hash and attribution. The current cinematic design, screenshots and workflow are retained.
- Umbrella uses “Umbrella Home” in all four titles, with localized product descriptions. The same shipped catalog is rendered into HTML before deployment. Root is Russian; `?lang=en`, `?lang=es`, and `?lang=pt` serve translated documents for every visitor. No User-Agent detection or crawler-only content is used. Internal document paths are unavailable publicly.
- Both sites expose `robots.txt`, canonical-only XML sitemaps, WebSite and SoftwareApplication identity, and social previews. No fabricated reviews, ratings, offers, launch availability or backlinks are added.
- Language URLs take precedence over saved or browser preferences, so sharing/reloading a canonical URL keeps its language. Falcon also reconciles language on browser Back/Forward alongside workflow restoration. The Browser language option remains an explicit action to select the browser's current language.
- Falcon company hosts retain `noindex` and deny crawling. Public sign-in and workspace documents also use `noindex`; they are excluded from the sitemap. Umbrella subscription-management pages remain outside search.

## Operations

Falcon follows the existing scoped Pages and Worker release scripts. The Worker route allowlist includes the new `/ru/` artifact; it serves discovery endpoints locally, without exposing the SaturnusGo root sitemap or changing company routing.

Umbrella candidate: `output/seo-brand-discovery-20261018/umbrella-source`. It starts from the deployed responsive release and refreshes all 44 first-level source assets from production, preserving the newer Proton privacy contact and consent copy. Existing video/R2, waitlist proxy, bindings, variables, asset files and motion remain in place. Rebuild translated documents with:

```sh
node scripts/seo/build-umbrella.mjs /absolute/path/to/umbrella-source/public
```

`parse5` is pinned to the already installed version 7.3.0 for this build-time tool. It is not shipped to the browser or Worker.

Google Search Console is free. The user approved connecting it after confirming there is no billing. Verification uses a single Google-provided TXT record, without granting Google access to Cloudflare or changing existing mail records. Sitemap submission and live URL checks follow publication. Do not enable advertisements, Analytics, Google Cloud billing, paid indexing services or automatic scheduled monitoring.

## Verification and limits

Cover language preference precedence, preserving workflow URLs, reciprocal language discovery, private-page exclusion, locale HTTP routing, same HTML for visitors and crawlers, and production content/MIME/canonical/schema checks. Review the rendered pages to ensure SEO copy has not disturbed the established design.

Search presence and ranking are separate from successful deployment. Search Console can confirm crawlability and accept crawl requests; it cannot guarantee indexing dates or rankings. Google states recrawling can take days to weeks. Broad “Falcon” searches compete with established unrelated brands; the product is consistently identified as test management rather than transport management.

References: [Google site names](https://developers.google.com/search/docs/appearance/site-names), [localized pages](https://developers.google.com/search/docs/specialty/international/localized-versions), [Search Console overview](https://support.google.com/webmasters/answer/9128668).
