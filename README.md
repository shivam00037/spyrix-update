# SPYRIX Invoice

SPYRIX Invoice is a React + Vite business workspace backed by an Express API and MongoDB. The application includes invoice creation, customers, products, inventory, payments, quotations, expenses, reports, templates, workspace settings, feedback, and an animated intro/auth experience. **There is no demo login or browser-only demo workspace.** Account and business records are served by the API.

## Project structure

```text
spyrix-invoice-mongodb/
├── client/                   # React + Vite frontend
│   ├── public/assets/         # Branding, intro art and favicons
│   ├── scripts/               # SEO asset generation and source checks
│   └── src/pages/             # Page-per-folder UI
├── server/                   # Express + Mongoose API
│   └── src/                  # Routes, models, middleware and DB config
├── .github/workflows/        # Build/syntax validation on push and PR
├── render.yaml               # Render API service blueprint
└── package.json              # Local development and root scripts
```

## Local development (Windows / VS Code)

**Requirements:** Node.js 20+, npm, and a running MongoDB database. You can use local MongoDB or a MongoDB Atlas database.

1. Extract the ZIP and open the inner `spyrix-invoice-mongodb` folder in VS Code.
2. Install the dependencies:

   ```powershell
   npm install
   ```

3. Create the backend environment file:

   ```powershell
   Copy-Item server\.env.example server\.env
   notepad server\.env
   ```

   Set a working `MONGODB_URI` and replace the example `JWT_SECRET` with a private random value of at least 32 characters. The backend process can start without MongoDB, but account and workspace API calls intentionally return `503` until the database is connected.

4. (Optional) For local Google sign-in, copy `client/.env.example` to `client/.env.local`, set `VITE_API_BASE_URL=http://localhost:5000/api/v1`, and configure a real Google OAuth Web client ID. Google sign-in needs the matching ID in both frontend and backend environment files.
5. Run both services:

   ```powershell
   npm run dev
   ```

   Vite starts on `http://localhost:5173` (or the next open port). The API listens on port `5000`; health routes are `/health` and `/ready`.

You can run the services separately with `npm run dev:client` and `npm run dev:server`. **Do not use the app as a live invoicing system until MongoDB, security settings, exports, backups and tax logic are validated for your business requirements.**

## Production deployment

See [HOSTING-GITHUB-FREE-DEPLOYMENT.md](./HOSTING-GITHUB-FREE-DEPLOYMENT.md) for the GitHub, Vercel, Render, MongoDB Atlas, environment-variable and custom-domain checklist. See [AUTH-GOOGLE-FEEDBACK-SEO-SETUP.md](./AUTH-GOOGLE-FEEDBACK-SEO-SETUP.md) for Google OAuth and feedback email setup, and [SEO-DEPLOYMENT-GUIDE.md](./SEO-DEPLOYMENT-GUIDE.md) for indexing requirements.

### Required environment variables

**Render / backend**

- `MONGODB_URI` — real MongoDB connection string; set database network access appropriately.
- `JWT_SECRET` — a long, unique, private secret (Render blueprint can generate this).
- `CLIENT_ORIGIN` — exact deployed frontend origin, e.g. `https://your-project.vercel.app` (comma-separated if you use more than one origin).
- `GOOGLE_CLIENT_ID` — Google OAuth Web client ID; required for Google sign-in.
- `RESEND_API_KEY` and `FEEDBACK_FROM_EMAIL` — required for email delivery from feedback forms; verify the sender domain with Resend.
- `FEEDBACK_TO_EMAIL` — feedback destination (default in the blueprint: `shivamp0037@gmail.com`).

**Vercel / frontend build**

- `VITE_API_BASE_URL` — backend URL including `/api/v1`, e.g. `https://your-api.onrender.com/api/v1`.
- `VITE_GOOGLE_CLIENT_ID` — the same Google OAuth Web client ID set in Render.
- `VITE_SITE_URL` — your public HTTPS website URL; used to generate absolute canonical metadata and `sitemap.xml`.

Keep secrets in the hosting providers' environment settings. Never commit `.env`, API keys, database credentials or private signing secrets. Only `.env.example` files belong in Git.

## Checks

Run the source-level production check and backend syntax check:

```powershell
node client/scripts/verify-spyrix-ui.mjs
node --check server/src/server.js
node --check server/src/routes/auth.js
```

The GitHub Actions workflow installs frontend/backend dependencies, builds the frontend, and syntax-checks the backend on pushes and pull requests to `main`.

## Notes and limitations

- Google sign-in cannot work until a real OAuth Web client ID is configured in Google Cloud Console and supplied to both frontend and backend.
- MongoDB account/workspace functions need a reachable, correctly authenticated database. `/health` checks process health; `/ready` checks database readiness.
- `VITE_SITE_URL` must be set to the real public URL before the production build to emit absolute canonical URLs and a sitemap. Submit the site in Google Search Console after it is live; search ranking is not guaranteed by metadata alone.
- The backend's feedback endpoint uses Resend when configured. A verified sender address is required for email delivery.
- Tax compliance, automated accounting obligations, data retention, production backups, access reviews and invoice export fidelity should be tested before relying on this app for official accounting records.
