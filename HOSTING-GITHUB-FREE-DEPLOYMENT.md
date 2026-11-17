# SPYRIX Invoice — GitHub and hosting guide

## Recommended layout

- **GitHub:** source control and automated CI checks.
- **Vercel:** React/Vite frontend (`client` directory).
- **Render:** Express API (`server` directory), described by the root `render.yaml` Blueprint.
- **MongoDB Atlas:** production database.

Free plans, limits and eligibility can change. Check each provider's current terms before relying on a no-cost deployment.

## 1. Push to GitHub

1. Extract the ZIP and open the inner `spyrix-invoice-mongodb` folder in VS Code.
2. Create an empty GitHub repository. Do not include a second README or `.gitignore` when creating it.
3. In the integrated terminal, review `git status` and check that `.env` files and secrets are not listed. Then run:

   ```bash
   git init -b main
   git add .
   git status
   git commit -m "Prepare SPYRIX Invoice for production hosting"
   git remote add origin https://github.com/YOUR-USERNAME/spyrix-invoice.git
   git push -u origin main
   ```

   Replace `YOUR-USERNAME` and repository name with yours. Never push MongoDB credentials, private JWT secrets, Google client secrets, email API keys, `.env` or `.env.local` files. The `.env.example` files contain placeholders only and can be committed.

## 2. Set up MongoDB Atlas

Create a cluster and dedicated database user; allow network access for the backend host, then copy the database connection URI. Set this URI as `MONGODB_URI` in Render. Use a secure password URL-encoded where necessary. Never put this variable in Vercel because the browser must not receive database credentials.

## 3. Deploy the backend to Render

Use the root `render.yaml` as a Blueprint or create a Web Service manually with:

- Root directory: `server`
- Build command: `npm ci`
- Start command: `npm start`
- Health check: `/ready`

Set the backend environment variables in Render:

- `MONGODB_URI`: the actual Atlas URI.
- `JWT_SECRET`: generate a long unique secret (the blueprint marks it as generated).
- `CLIENT_ORIGIN`: exact Vercel origin, e.g. `https://spyrix-invoice.vercel.app`, with no trailing slash. Multiple trusted origins may be comma-separated.
- `GOOGLE_CLIENT_ID`: same OAuth Web client ID used by Vercel, when using Google sign-in.
- `RESEND_API_KEY` and `FEEDBACK_FROM_EMAIL`: for feedback email, using a verified sender domain.
- `FEEDBACK_TO_EMAIL`: `shivamp0037@gmail.com`.

Wait for `GET /ready` to return HTTP 200. `/health` only indicates the process is listening; `/ready` indicates MongoDB is connected.

## 4. Deploy the frontend to Vercel

Import the GitHub repository in Vercel and set:

- Root directory: `client`
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`

Environment variables (Production and Preview as appropriate):

- `VITE_API_BASE_URL`: full Render API base ending in `/api/v1`, such as `https://YOUR-SERVICE.onrender.com/api/v1`.
- `VITE_SITE_URL`: the public canonical HTTPS URL for this deployment.
- `VITE_GOOGLE_CLIENT_ID`: the public Google OAuth Web client ID.

Redeploy after changing variables. The frontend deliberately does not fall back to localhost in a production build.

## 5. Configure Continue with Google

In Google Cloud Console create an OAuth client of type **Web application**, set up the consent screen, and add the Vercel or custom-domain origin under Authorized JavaScript origins. Put the same client ID in Vercel (`VITE_GOOGLE_CLIENT_ID`) and Render (`GOOGLE_CLIENT_ID`). Redeploy both. The code verifies ID tokens server-side; Google sign-in cannot be completed without this real credential and a working MongoDB database.

## 6. Free URL / custom domain

Start with the free provider subdomains from Vercel and Render. A provider subdomain is free but is not a custom domain you own. A domain such as `spyrixinvoice.com` or `spyrix.in` usually costs an annual registration fee; free subdomain offers may have restrictions and can change, so check their current terms before choosing one.

When you connect a domain, configure DNS in Vercel, wait for HTTPS, update `VITE_SITE_URL` and `CLIENT_ORIGIN`, update the authorized Google JavaScript origin, and redeploy.

## 7. Verify the live app

- Render `/health` returns JSON showing the process is listening.
- Render `/ready` returns HTTP 200 after MongoDB connects.
- Register/login writes account and workspace records to MongoDB.
- The Google button launches real Google Identity Services and can log in only when the client IDs/origins are correct.
- Feedback email delivers to `shivamp0037@gmail.com` when Resend and a verified sender are configured.
- Vercel `/robots.txt` and `/sitemap.xml` use the correct canonical domain after a build with `VITE_SITE_URL` set.
- Test invoice creation, editing, downloads and mobile layout on the real deployment before using it for business records.
