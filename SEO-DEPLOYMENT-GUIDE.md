# SPYRIX Invoice SEO deployment checklist

SPYRIX includes a search-oriented page title, description, keyword hints, Open Graph/Twitter metadata, Schema.org JSON-LD for the organization, website, web application and FAQ, favicon sizes, a robots file, and a sitemap generator.

## Set the public website URL

Before the production frontend build, set `VITE_SITE_URL` in Vercel to the real canonical HTTPS domain, with no trailing slash, for example `https://your-project.vercel.app`. Redeploy so `client/scripts/generate-seo-assets.mjs` can generate an absolute canonical URL, absolute social image URLs, JSON-LD URLs, `/robots.txt` and `/sitemap.xml`.

Without `VITE_SITE_URL`, the helper intentionally omits the sitemap URL and does not claim a guessed production domain. Set the correct URL and rebuild once a custom domain is attached.

## After deployment

1. Confirm the homepage opens over HTTPS and that the canonical link points to the same public domain.
2. Confirm `/robots.txt` and `/sitemap.xml` are accessible.
3. Verify the site in Google Search Console and submit the sitemap.
4. Use URL Inspection to test the home page and request indexing.
5. Keep the public intro text factual, useful and unique. Avoid keyword stuffing and fake ratings or claims.
6. Keep the site fast, accessible and mobile-friendly; fix indexing/crawl issues surfaced in Search Console.

SEO cannot guarantee a particular ranking. Ranking depends on many factors, including competition, crawl/indexing, useful content, reputation and technical quality.
