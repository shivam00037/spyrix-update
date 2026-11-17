# Authentication page

Edit `AuthPage.jsx` for sign-in, account registration, and Google Identity Services integration. The registration form requires a full name, brand/business name, email, and password. The original shared MacBook loader is in `client/src/components/SpyrixLoader.jsx` and is intentionally reused.

Google sign-in requires the same real Google OAuth Web client ID in `VITE_GOOGLE_CLIENT_ID` (frontend build) and `GOOGLE_CLIENT_ID` (backend runtime), with the deployed frontend origin registered in Google Cloud Console. Authentication and workspaces use the Express API and MongoDB; there is no demo or local-only account mode.
