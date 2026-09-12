# Integration Notes for bookpublishing

## Overview

Bookpublishing is a publishing platform for independent writers. Visitors can browse featured books and publishing services, while registered authors can submit manuscript proposals and track their review status.

The application has two independently deployed Node.js processes:

- **Frontend:** Next.js App Router application.
- **API:** HTTPS Express server.
- **Persistence:** Direct PostgreSQL access through the `pg` package, without an ORM.
- **Authentication:** PostgreSQL-backed `express-session` sessions with bcrypt password hashing.
- **Canonical frontend:** `https://bookpublishing.geo-drops.com`
- **Default API base URL:** `https://bookpublishing-api.geo-drops.com:5084`

The frontend intentionally performs API-backed authentication, catalog, book-detail, and submission requests in the browser. Public book views use curated local fallback content if the API is temporarily unavailable.

The frontend and API may both use port `5084` only because they are intended to run on separate hosts, containers, virtual machines, or IP addresses. They cannot bind to the same address and port on one machine.

## Prerequisites

Install or provision the following:

- A Node.js version compatible with the `engines` declaration in `package.json`.
- npm.
- PostgreSQL with a database and application user.
- Administrator-provided TLS files at:
  - `/home/arx-app/backends/certs/certificate.crt`
  - `/home/arx-app/backends/certs/private.key`
- DNS records for the production frontend and API hosts.
- PM2 for the production Next.js process:
  ```bash
  npm install --global pm2
  ```
- A deployment directory matching the PM2 configuration:
  ```text
  /home/arx-app/backends/bookpublishing
  ```

The Express API reads its TLS certificate and private key directly from the fixed paths above. It will not start if either file is absent, unreadable, or invalid.

For a standard PostgreSQL installation, confirm connectivity with:

```bash
psql "postgresql://bookpublishing_user:your-password@database.example.com:5432/bookpublishing"
```

The database user must be able to create and access the users, books, submissions, indexes, constraints, and session tables defined in `server/db/schema.sql`.

## Installation

### 1. Place the project in its deployment directory

The production PM2 configuration expects this exact path:

```bash
cd /home/arx-app/backends
git clone <repository-url> bookpublishing
cd bookpublishing
```

If the source is delivered through another deployment mechanism, ensure the resulting application root is:

```text
/home/arx-app/backends/bookpublishing
```

### 2. Install Node.js dependencies

From the project root, run:

```bash
npm install
```

If a lockfile is included and immutable CI installation is required, use:

```bash
npm ci
```

The package scripts are intentionally separate and do not use `concurrently`:

```text
dev     = next dev -p 5084
build   = next build
start   = next start -p 5084
server  = node server/index.js
```

### 3. Configure the environment

Copy the environment template:

```bash
cp .env.example .env
```

Edit `.env` and replace every placeholder, especially `DATABASE_URL` and `SESSION_SECRET`. Do not commit `.env` or any file containing credentials.

For Next.js production builds, set `NEXT_PUBLIC_API_BASE_URL` before running `npm run build`. Variables prefixed with `NEXT_PUBLIC_` are included in the browser bundle and should be treated as public configuration.

### 4. Initialize PostgreSQL

Create a PostgreSQL role and database if they do not already exist. For example:

```bash
sudo -u postgres psql
```

Then run SQL appropriate for the deployment:

```sql
CREATE ROLE bookpublishing_user WITH LOGIN PASSWORD 'replace-with-a-strong-password';
CREATE DATABASE bookpublishing OWNER bookpublishing_user;
```

Exit `psql`:

```sql
\q
```

Set `DATABASE_URL` to the corresponding connection string:

```text
postgresql://bookpublishing_user:replace-with-a-strong-password@database.example.com:5432/bookpublishing
```

Manual execution of `server/db/schema.sql` is normally unnecessary. On API startup, `server/db/index.js` executes the schema file before accepting requests. The schema is idempotent and creates:

- Users.
- Published books.
- Author submissions.
- The `connect-pg-simple` session table.
- Constraints and indexes.
- Seed records for the curated published-book catalog.

To inspect or initialize it manually when troubleshooting, run:

```bash
psql "$DATABASE_URL" -f server/db/schema.sql
```

### 5. Install the TLS certificate and key

An administrator must place the API certificate files at:

```text
/home/arx-app/backends/certs/certificate.crt
/home/arx-app/backends/certs/private.key
```

Create the directory if necessary:

```bash
sudo mkdir -p /home/arx-app/backends/certs
```

Restrict private-key access to the account running the API. For example:

```bash
sudo chown <app-user>:<app-group> /home/arx-app/backends/certs/private.key
sudo chmod 600 /home/arx-app/backends/certs/private.key
```

The certificate must be valid for the public API hostname, such as `bookpublishing-api.geo-drops.com`.

## Environment Variables

Every supported variable is listed in `.env.example`.

| Variable | Required | Description | Example |
|---|---:|---|---|
| `NODE_ENV` | Yes in production | Runtime environment used to enable production security behavior and secure session-cookie settings. Use `production` for deployed services. | `production` |
| `PORT` | Yes for PM2 deployment | Port supplied to the Next.js process by PM2. The provided `ecosystem.config.js` sets it to `5084`. The explicit `npm run dev` and `npm start` scripts also use port `5084`. | `5084` |
| `BACKEND_PORT` | Yes | HTTPS port on which the separately deployed Express API listens. `server/config.js` validates this value and rejects port `3000`. | `5084` |
| `DATABASE_URL` | Yes | Direct PostgreSQL connection string used for users, books, submissions, and server-side sessions. | `postgresql://bookpublishing_user:replace-with-password@database.example.com:5432/bookpublishing` |
| `SESSION_SECRET` | Yes | Long, cryptographically random secret used to sign server-side session cookies. Do not expose or commit it. | `replace-with-a-long-random-secret` |
| `NEXT_PUBLIC_API_BASE_URL` | Recommended | Public HTTPS base URL used by browser-side runtime API requests. If omitted, `lib/api.js` defaults to `https://bookpublishing-api.geo-drops.com:5084`. | `https://bookpublishing-api.geo-drops.com:5084` |

Generate a production session secret with a command such as:

```bash
openssl rand -base64 48
```

Because `NEXT_PUBLIC_API_BASE_URL` is public, it must never contain credentials or private tokens.

## Running the Application

### Local or integration workflow

The Next.js development server uses port `5084`:

```bash
npm run dev
```

Start the API separately:

```bash
npm run server
```

By default, the example configuration also assigns port `5084` to the API. Both processes cannot use the same host and port simultaneously. For same-machine integration work, assign the API another permitted port, such as:

```bash
BACKEND_PORT=5443 npm run server
```

Then configure:

```text
NEXT_PUBLIC_API_BASE_URL=https://your-api-development-host.geo-drops.com:5443
```

Restart the Next.js development process after changing the public API URL.

The Express CORS policy accepts credentialed requests from HTTPS origins under `*.geo-drops.com`. A plain `http://localhost:5084` frontend is not a production-equivalent CORS origin. For full browser-based local integration, use an HTTPS development hostname under the allowed domain and a local TLS reverse proxy, or perform frontend and API testing in the provisioned staging environment.

The API itself always starts as HTTPS because `server/index.js` directly loads the administrator-provided certificate and key.

### Production frontend build

Set the production environment, then build the frontend:

```bash
npm run build
```

Next.js writes the deployable production build to:

```text
.next/
```

Run it directly with:

```bash
npm start
```

The `start` script explicitly runs the frontend on port `5084`.

### Running the frontend with PM2

The provided `ecosystem.config.js` defines exactly one PM2 application named `bookpublishing`. It runs:

- Executable: `node_modules/.bin/next`
- Arguments: `start`
- Working directory: `/home/arx-app/backends/bookpublishing`
- `NODE_ENV`: `production`
- `PORT`: `5084`

Build before starting PM2:

```bash
cd /home/arx-app/backends/bookpublishing
npm install
npm run build
pm2 start ecosystem.config.js
```

Inspect the frontend process:

```bash
pm2 status
pm2 logs bookpublishing
```

Persist the PM2 process list across host restarts:

```bash
pm2 save
pm2 startup
```

Run the command printed by `pm2 startup` with the required privileges.

Reload the frontend after a new build:

```bash
npm run build
pm2 restart bookpublishing --update-env
```

### Running the HTTPS API

Run the API in the foreground with:

```bash
npm run server
```

At startup, it:

1. Loads and validates the backend configuration.
2. Connects to PostgreSQL.
3. Executes `server/db/schema.sql`.
4. Reads the TLS certificate and private key.
5. Starts the HTTPS Express server on `BACKEND_PORT`.

The API can also be launched as a detached task using the included executable script:

```bash
chmod +x START.sh
./START.sh
```

`START.sh` creates its configured runtime log directory, starts `npm run server` in the background, records the process ID, and redirects API output to its runtime log. It does not start the Next.js frontend and does not use `concurrently`.

For resilient production operation, place the API under a dedicated process supervisor or service manager rather than relying only on a detached shell process. The included PM2 configuration manages only the Next.js frontend.

### Health check

After the API starts, test it with:

```bash
curl https://bookpublishing-api.geo-drops.com:5084/health
```

The successful response is exactly:

```json
{"status":"ok"}
```

Do not use `curl -k` in production monitoring because it disables certificate validation.

### API endpoints

All browser requests include credentials so the API can use the PostgreSQL-backed session cookie.

#### Health

- `GET /health` — returns API health status.

#### Authentication

- `POST /api/auth/signup` — creates an author account, hashes the password with bcrypt, and establishes a session.
- `POST /api/auth/login` — validates credentials and establishes a regenerated session.
- `POST /api/auth/logout` — destroys the session and clears the session cookie.
- `GET /api/auth/me` — returns the current sanitized user or an anonymous/authentication response.

Signup and login are rate-limited.

#### Books

- `GET /api/books` — lists published books.
- `GET /api/books?featured=true` — lists featured published books.
- `GET /api/books/:slug` — retrieves one published book by slug.

Featured-book and book-detail components fall back to `lib/content.js` when the API is unavailable.

#### Manuscript submissions

These routes require an authenticated session:

- `POST /api/submissions` — creates a manuscript proposal.
- `GET /api/submissions/mine` — lists the authenticated author’s submissions in newest-first order.

A submission includes:

- `title`
- `genre`
- `wordCount`
- `synopsis`
- `manuscriptUrl`

The manuscript URL must be a valid HTTPS URL.

## Project Structure

### Root configuration

- `package.json` — Node.js metadata, dependencies, supported Node version, and separate Next.js/API scripts.
- `next.config.js` — Next.js production configuration, React strict mode, and secure response headers.
- `.env.example` — safe environment-variable template with placeholder values.
- `.gitignore` — excludes dependencies, builds, environment files, logs, PID files, and local editor/OS artifacts while retaining `.env.example`.
- `ecosystem.config.js` — PM2 definition for the production Next.js frontend.
- `START.sh` — detached Express API launcher with runtime PID and output logging.
- `README.md` — full product, database, deployment, security, endpoint, and project-structure documentation.

### Next.js application

- `app/layout.jsx` — root layout, canonical metadata, typography, providers, header, and footer.
- `app/globals.css` — responsive visual system, design tokens, forms, cards, navigation, focus states, and reduced-motion behavior.
- `app/providers.jsx` — client-side provider wrapper that exposes authentication state throughout the App Router.
- `app/page.jsx` — public homepage composition.
- `app/login/page.jsx` — login page.
- `app/signup/page.jsx` — author registration page.
- `app/dashboard/page.jsx` — authenticated author submission workspace.
- `app/books/[slug]/page.jsx` — SEO-framed dynamic book route with browser-time data retrieval.
- `app/error.jsx` — recoverable App Router error boundary.
- `app/not-found.jsx` — branded 404 page.
- `app/robots.js` — crawler rules that exclude the private dashboard.
- `app/sitemap.js` — static sitemap using canonical production URLs.
- `app/icon.svg` — scalable book-and-pen favicon.

### React components

- `components/AuthProvider.jsx` — session loading and login, signup, logout, and refresh methods.
- `components/AuthForm.jsx` — validated login and signup forms.
- `components/Header.jsx` — responsive, session-aware site navigation.
- `components/Footer.jsx` — canonical publishing and author navigation.
- `components/Hero.jsx` — homepage publishing proposition and calls to action.
- `components/FeaturedBooks.jsx` — API-backed featured catalog with timeout and local fallback handling.
- `components/BookCard.jsx` — accessible catalog card and canonical book link.
- `components/BookDetail.jsx` — runtime book retrieval with curated offline fallback.
- `components/PublishingProcess.jsx` — editorial and publishing workflow.
- `components/AuthorBenefits.jsx` — author ownership and publishing-service benefits.
- `components/SubmissionDashboard.jsx` — authenticated proposal creation and submission history.

### Frontend libraries

- `lib/api.js` — credentialed browser API helper, timeout handling, normalized `ApiError` responses, and API base URL resolution.
- `lib/content.js` — curated fallback book catalog matching the seeded PostgreSQL records.

### Express API

- `server/index.js` — database initialization, TLS loading, HTTPS startup, and graceful shutdown.
- `server/app.js` — Express middleware, CORS, session store, routes, 404 handling, and centralized errors.
- `server/config.js` — environment loading and validation.
- `server/controllers/` — authentication, published-book, and author-submission request handlers.
- `server/routes/` — health, authentication, book, and protected submission routers.
- `server/middleware/requireAuth.js` — session authentication guard.
- `server/middleware/errorHandler.js` — consistent production-safe JSON error handling.
- `server/utils/validation.js` — account and manuscript proposal normalization and validation.

### Database

- `server/db/index.js` — PostgreSQL pool, query helper, schema initialization, production SSL behavior, and graceful pool closure.
- `server/db/schema.sql` — idempotent tables, constraints, indexes, session storage, and curated book seed data.

## Next Steps / Production Considerations

1. **Use separate frontend and API listeners.**  
   Both services are configured to use port `5084`, so deploy them on separate hosts, containers, or IP addresses. Configure DNS accordingly:
   - `bookpublishing.geo-drops.com` → Next.js frontend
   - `bookpublishing-api.geo-drops.com` → Express API

2. **Build with the final public API URL.**  
   Set `NEXT_PUBLIC_API_BASE_URL` before `npm run build`. Rebuild and redeploy the frontend whenever this public value changes.

3. **Protect secrets.**  
   Store `DATABASE_URL` and `SESSION_SECRET` in a deployment secret manager or protected environment file. Never commit `.env`, database credentials, TLS private keys, or session secrets.

4. **Use a strong, stable session secret.**  
   Rotating `SESSION_SECRET` invalidates existing signed sessions. Plan rotations intentionally and generate secrets with a cryptographically secure tool.

5. **Maintain HTTPS everywhere.**  
   Production cookies and credentialed cross-origin requests depend on HTTPS. Renew the API certificate before expiration and restart the API after replacing certificate files.

6. **Verify CORS and cookie behavior.**  
   The API trusts credentialed HTTPS origins under `*.geo-drops.com`. Keep the frontend and API on approved HTTPS hostnames, and do not broaden CORS to arbitrary origins.

7. **Place the application behind trusted infrastructure.**  
   `server/app.js` enables proxy trust. Configure the load balancer or reverse proxy to set forwarding headers correctly, and restrict direct API access where appropriate.

8. **Supervise the API process.**  
   `START.sh` provides detached startup but not full crash recovery. Use a dedicated PM2 definition, systemd service, container orchestrator, or equivalent supervisor for the Express API.

9. **Back up PostgreSQL.**  
   Schedule encrypted database backups and periodically test restoration. Sessions are also stored in PostgreSQL, so database outages affect authenticated use.

10. **Plan schema migrations.**  
    Startup schema execution is idempotent and suitable for initial provisioning. For future destructive or data-transforming changes, introduce a versioned migration process rather than modifying production tables only at startup.

11. **Review database TLS behavior.**  
    `server/db/index.js` applies production PostgreSQL SSL behavior. Confirm that the database provider’s CA and verification requirements match the deployed connection configuration.

12. **Apply least privilege.**  
    After initial schema provisioning, consider separating migration privileges from runtime application privileges. The runtime account should only have the database permissions required by the API.

13. **Monitor health and logs.**  
    Monitor `/health`, PM2 state, API runtime logs, PostgreSQL availability, authentication failures, rate-limit activity, and certificate expiry. Avoid logging passwords, connection strings, session secrets, cookies, or manuscript URLs containing private access tokens.

14. **Preserve security middleware.**  
    Keep Helmet, request-size limits, authentication rate limits, bcrypt hashing, session regeneration, parameterized SQL, validation, and production-safe error handling enabled.

15. **Validate manuscript storage strategy.**  
    The API stores an HTTPS manuscript URL, not uploaded manuscript contents. Use a secure document-storage provider with private objects, expiring access links, malware scanning, retention policies, and appropriate author-consent controls.

16. **Run deployment verification.**  
    After each release, verify:
    - The frontend loads at its canonical HTTPS URL.
    - `/health` returns `{"status":"ok"}`.
    - Signup, login, session refresh, and logout work.
    - Featured books load from the API.
    - Offline fallback books remain usable during API failure.
    - Authenticated users can create and list only their own submissions.
    - Anonymous users cannot access protected submission endpoints.
    - The dashboard is excluded by `robots.txt`.
    - Canonical links and sitemap URLs use `https://bookpublishing.geo-drops.com`.