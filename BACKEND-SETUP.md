# Backend setup

SPYRIX Invoice's Express API uses MongoDB via Mongoose. It runs from `server/src/server.js` and defaults to port `5000`.

## Local setup

1. Install dependencies from the project root with `npm install` or from `server/` with `npm ci`.
2. Copy `server/.env.example` to `server/.env`.
3. Set `MONGODB_URI` to your local MongoDB instance or Atlas connection string. Replace `JWT_SECRET` with a private random value of at least 32 characters.
4. Run `npm run dev:server` from the root, or `npm run dev` to start both frontend and backend.

Useful endpoints:

- `GET /health` — process health.
- `GET /ready` — database readiness (`200` when connected, `503` otherwise).
- `GET /api/v1/auth/me` — authenticated user/workspace session, requires a bearer token and ready database.

The API process starts even if MongoDB is temporarily unavailable and retries the connection. Core auth/data routes respond with `503` until the DB connection is ready; the code does not switch to localStorage demo data.

## Production

Use the root `render.yaml` Blueprint or configure the `server` folder as a Render Web Service. Set `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, and the optional integration environment variables in Render. Do not commit `server/.env`.
