# Production setup: authentication, feedback email and SEO

## 1. MongoDB and backend

In Render, set `MONGODB_URI` to the real MongoDB Atlas connection string and `JWT_SECRET` to a long, unique secret. In MongoDB Atlas, allow network access from the backend host and use a dedicated database user. The backend listens immediately and retries MongoDB connection; `/ready` returns HTTP 503 until the DB is connected. Account and workspace operations remain unavailable until the DB is ready.

Set `CLIENT_ORIGIN` to the exact public frontend origin, such as `https://your-project.vercel.app`, with no trailing slash. Comma-separate origins only if you intentionally serve multiple trusted frontend URLs.

## 2. Continue with Google

Google OAuth needs a real **Web application** OAuth client in Google Cloud Console:

1. Configure the OAuth consent screen and required app information.
2. Create an OAuth client of type **Web application**.
3. Add your public frontend origin to **Authorized JavaScript origins**, such as `https://your-project.vercel.app`. Add local origin `http://localhost:5173` for local development if needed.
4. In Vercel, set `VITE_GOOGLE_CLIENT_ID` to the client ID.
5. In Render, set `GOOGLE_CLIENT_ID` to the exact same value.
6. Redeploy the frontend and restart/redeploy the backend after saving environment variables.

The frontend uses Google Identity Services and posts the returned ID credential to `/api/v1/auth/google`. The backend verifies the token with Google's tokeninfo endpoint, checks the audience and verified email, and only then creates/loads the MongoDB user and workspace. Do not put an OAuth client secret in frontend variables; the browser only receives the public client ID.

If the client ID is blank, the page displays a configuration hint instead of pretending Google sign-in succeeded. A real production credential is not included in the source code.

## 3. Feedback email

Set these variables on the Render backend:

- `RESEND_API_KEY`: your private Resend API key.
- `FEEDBACK_FROM_EMAIL`: an address/domain verified in Resend, e.g. `SPYRIX Feedback <feedback@yourdomain.com>`.
- `FEEDBACK_TO_EMAIL`: `shivamp0037@gmail.com` (already the blueprint default).

The form can accept a submission without mailing it only if the endpoint explicitly reports that result; do not treat an unconfigured mail provider as a successful email delivery. Test a real submission after deployment and check Resend delivery logs.

## 4. SEO / Google Search

In Vercel, set `VITE_SITE_URL` to the canonical public URL, for example `https://your-project.vercel.app` (or the custom domain after connecting it). Run a fresh production build/redeploy: `client/scripts/generate-seo-assets.mjs` uses this setting to write absolute canonical/OG/schema URLs, `public/robots.txt`, and `public/sitemap.xml`.

After deployment:

1. Open the public home page, `/robots.txt`, and `/sitemap.xml` to confirm they're accessible and contain the correct domain.
2. Add and verify the domain in Google Search Console.
3. Submit the sitemap, inspect the home URL, and request indexing.
4. Keep useful unique homepage text, page titles, descriptions, genuine FAQ content and fast/mobile-friendly layouts.

SEO metadata can help search engines understand the product, but cannot guarantee indexing speed or top ranking for competitive terms such as “invoice maker.”
