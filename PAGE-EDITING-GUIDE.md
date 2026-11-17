# SPYRIX Invoice — Page Editing Guide

Open the inner `spyrix-invoice-mongodb` folder in VS Code. Most user-facing views live in a dedicated folder under `client/src/pages/`. Shared navigation, theme handling and API behavior live in `client/src/components/`, `client/src/context/`, `client/src/data/` and `client/src/api.js`.

## Common page locations

- Intro page markup: `client/src/pages/Intro/IntroDocument.html`
- Intro host and SEO metadata: `client/src/pages/Intro/IntroPage.jsx`
- Login and registration: `client/src/pages/Auth/AuthPage.jsx` and `AuthReference.css`
- Dashboard: `client/src/pages/Dashboard/DashboardPage.jsx` and `DashboardPage.css`
- Invoice list: `client/src/pages/Invoices/InvoicesPage.jsx`
- Invoice Studio: `client/src/pages/InvoiceCreator/InvoiceCreatorPage.jsx`
- Template gallery: `client/src/pages/Templates/`
- Customers, products, inventory, payments, expenses, quotations, reports and settings: each has its own folder in `client/src/pages/`
- Shared list/form/CRUD behavior: `client/src/pages/shared/ModulePage/`
- Shared MacBook loader: `client/src/components/SpyrixLoader.jsx` and `SpyrixLoader.css`
- Theme definitions and default: `client/src/themeConfig.js`
- Backend routes and database: `server/src/routes/`, `server/src/models/` and `server/src/config/db.js`

## Run locally

1. Install dependencies from the project root: `npm install`.
2. Create `server/.env` from `server/.env.example` and set a valid `MONGODB_URI` plus a private `JWT_SECRET`.
3. Optionally create `client/.env.local` from `client/.env.example` for the frontend API URL and Google OAuth client ID.
4. Run `npm run dev` from the root. It starts the API and Vite frontend together.

This project has no demo account mode: account/business records must be served by the backend and MongoDB. Production deployment settings are described in `HOSTING-GITHUB-FREE-DEPLOYMENT.md`.
