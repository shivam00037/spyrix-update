import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_SPYRIX_THEME, SPYRIX_THEME_IDS } from '../src/themeConfig.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(root, '..');
const read = relative => readFile(path.join(root, relative), 'utf8');
const rootRead = relative => readFile(path.join(projectRoot, relative), 'utf8');
const exists = async pathToCheck => { try { await access(pathToCheck); return true; } catch { return false; } };

const [rootPackage, clientPackage, auth, authContext, dataContext, api, server, authRoute, businessModel, index, seoScript, gitignore, render, vercel] = await Promise.all([
  rootRead('package.json'), read('package.json'), read('src/pages/Auth/AuthPage.jsx'), read('src/context/AuthContext.jsx'),
  read('src/data/DataContext.jsx'), read('src/api.js'), rootRead('server/src/server.js'), rootRead('server/src/routes/auth.js'),
  rootRead('server/src/models/Business.js'), read('index.html'), read('scripts/generate-seo-assets.mjs'), rootRead('.gitignore'),
  rootRead('render.yaml'), read('vercel.json'),
]);

assert.equal(DEFAULT_SPYRIX_THEME, 'neon-green', 'Neon Green & White is the default theme');
assert.ok(SPYRIX_THEME_IDS.includes('neon-green'));
assert.doesNotMatch(rootPackage, /dev:demo|Start-DEMO/, 'root scripts must not expose a demo mode');
assert.doesNotMatch(auth, /enterDemo|Explore demo|auth-demo-button|spyrix_demo_mode/, 'auth UI must not expose a demo account');
assert.doesNotMatch(authContext, /enterDemo|spyrix_demo_mode\s*[,}]/, 'auth context must not expose demo sessions');
assert.match(authContext, /localStorage\.removeItem\('spyrix_demo_mode'\)/, 'legacy demo sessions are cleared');
assert.doesNotMatch(dataContext, /demoData|resetDemo|demo_mode/i, 'workspace records must come from the server API');
assert.match(api, /import\.meta\.env\.DEV\s*\?\s*'http:\/\/localhost:5000\/api\/v1'\s*:\s*''/, 'production must never silently fall back to localhost API');
assert.match(server, /app\.get\('\/ready'/, 'backend must expose a database readiness probe');
assert.match(server, /connectDatabaseWithRetry\(\)/, 'backend must remain up and retry MongoDB connection');
assert.match(authRoute, /oauth2\.googleapis\.com\/tokeninfo/, 'backend verifies Google ID tokens');
assert.match(authRoute, /identity\.aud !== clientId/, 'Google token audience must match configured OAuth client');
assert.match(authRoute, /theme: 'neon-green'/, 'new Google-created workspaces default to Neon Green');
assert.match(businessModel, /default: 'neon-green'/, 'new MongoDB workspaces default to Neon Green');
assert.match(index, /name="description"/, 'landing HTML must have SEO description');
assert.match(index, /application\/ld\+json/, 'landing HTML must provide structured data');
assert.match(seoScript, /sitemap\.xml/, 'build helper generates a sitemap when VITE_SITE_URL is configured');
assert.match(seoScript, /robots\.txt/, 'build helper emits robots.txt');
assert.doesNotMatch(gitignore, /client\/public\/(robots\.txt|favicon\.ico|assets\/)/, 'public SEO files and branding assets must not be ignored by Git');
assert.match(render, /rootDir: server/, 'Render deployment must point to server package');
assert.match(render, /healthCheckPath: \/ready/, 'Render health check must verify database readiness');
assert.match(vercel, /"outputDirectory": "dist"/, 'Vercel config must publish Vite dist output');
for (const file of ['src/pages/Auth/AuthReference.css', 'src/components/SpyrixLoader.jsx', 'src/components/SpyrixLoader.css', 'public/assets/branding/spyrix-master-lockup.png']) {
  assert.ok(await exists(path.join(root, file)), `${file} must exist`);
}
for (const file of [
  path.join(root, 'src/data/demoData.js'), path.join(root, 'src/pages/Auth/AuthPage.css'),
  path.join(projectRoot, 'Start-DEMO.bat'), path.join(root, 'public/_qa'),
]) assert.equal(await exists(file), false, `${path.relative(projectRoot, file)} must be removed`);
console.log(`SPYRIX production checks passed: ${SPYRIX_THEME_IDS.length} themes, Neon Green default, no demo mode, server-only data, DB readiness/retry, Google OAuth verification path, production API config, SEO assets, deployment config and required branding assets.`);
