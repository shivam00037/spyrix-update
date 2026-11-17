import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const siteUrlInput = String(process.env.VITE_SITE_URL || '').trim();

const robotsPath = path.join(publicDir, 'robots.txt');
const indexPath = path.join(root, 'index.html');
let robots = 'User-agent: *\nAllow: /\nDisallow: /api/\n';

async function updateIndexMetadata(publicBaseUrl) {
  let html = await readFile(indexPath, 'utf8');
  const priorCanonical = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"\s*\/>/i)?.[1] || '/';
  let priorOrigin = '';
  try { priorOrigin = new URL(priorCanonical).origin; } catch { /* The previous canonical is relative. */ }

  const canonicalUrl = publicBaseUrl || '/';
  const heroImageUrl = publicBaseUrl ? new URL('assets/hero-art.png', publicBaseUrl).href : '/assets/hero-art.png';
  html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/i, `<link rel="canonical" href="${canonicalUrl}" />`);

  const setMeta = (key, content, attribute = 'property') => {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matcher = new RegExp(`<meta\\s+${attribute}="${escaped}"\\s+content="[^"]*"\\s*\\/?\\s*>`, 'i');
    const tag = `<meta ${attribute}="${key}" content="${content}" />`;
    if (matcher.test(html)) html = html.replace(matcher, tag);
    else html = html.replace('</head>', `    ${tag}\n  </head>`);
  };
  setMeta('og:url', canonicalUrl);
  setMeta('og:image', heroImageUrl);
  setMeta('twitter:image', heroImageUrl, 'name');

  const schemaPattern = /(<script\s+type="application\/ld\+json"\s*>)([\s\S]*?)(<\/script>)/i;
  const schemaMatch = html.match(schemaPattern);
  if (schemaMatch) {
    try {
      const schema = JSON.parse(schemaMatch[2]);
      const normalizeSchemaUrl = (value) => {
        if (typeof value !== 'string') return value;
        if (publicBaseUrl && value.startsWith('/')) return new URL(value.slice(1), publicBaseUrl).href;
        if (!publicBaseUrl && priorOrigin && value.startsWith(priorOrigin)) return value.slice(priorOrigin.length) || '/';
        return value;
      };
      const visit = (value, key = '') => {
        if (Array.isArray(value)) return value.map((entry) => visit(entry));
        if (value && typeof value === 'object') {
          for (const [childKey, childValue] of Object.entries(value)) value[childKey] = visit(childValue, childKey);
          return value;
        }
        return ['@id', 'url', 'logo'].includes(key) ? normalizeSchemaUrl(value) : value;
      };
      html = html.replace(schemaPattern, `$1\n      ${JSON.stringify(visit(schema), null, 2)}\n    $3`);
    } catch (error) {
      console.error(`[SPYRIX SEO] Could not update JSON-LD metadata: ${error.message}`);
      process.exit(1);
    }
  }
  await writeFile(indexPath, html, 'utf8');
}

if (!siteUrlInput) {
  console.warn('[SPYRIX SEO] VITE_SITE_URL is not set. robots.txt will be emitted without a sitemap URL; configure your real HTTPS domain before production deployment.');
  await rm(path.join(publicDir, 'sitemap.xml'), { force: true });
  await writeFile(robotsPath, robots, 'utf8');
  await updateIndexMetadata(null);
  process.exit(0);
}

let siteUrl;
try {
  siteUrl = new URL(siteUrlInput);
  if (!['https:', 'http:'].includes(siteUrl.protocol)) throw new Error('Use an HTTP(S) URL.');
  if (siteUrl.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(siteUrl.hostname)) {
    throw new Error('Use HTTPS for the production website URL.');
  }
} catch (error) {
  console.error(`[SPYRIX SEO] Invalid VITE_SITE_URL: ${error.message}`);
  process.exit(1);
}

const canonical = `${siteUrl.origin}${siteUrl.pathname.replace(/\/$/, '')}/`;
const lastmod = new Date().toISOString().slice(0, 10);
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${canonical.replaceAll('&', '&amp;')}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`;
await mkdir(publicDir, { recursive: true });
await writeFile(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
robots += `Sitemap: ${canonical.replace(/\/$/, '')}/sitemap.xml\n`;
await writeFile(robotsPath, robots, 'utf8');
await updateIndexMetadata(canonical);
console.log(`[SPYRIX SEO] Generated sitemap.xml and absolute page metadata for ${canonical}`);
