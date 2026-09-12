# Bookpublishing

Bookpublishing is a polished publishing platform for independent writers and authors. Visitors can explore publishing services and featured books, while registered authors can submit manuscript proposals and track their review status from a private dashboard.

The application consists of two separately deployed services:

- **Frontend:** Next.js App Router application
- **API:** HTTPS Express application backed directly by PostgreSQL

The browser communicates with the API through credentialed, database-backed sessions. Public book pages include curated client-side fallback content so they remain useful when the API is temporarily unavailable.

## Technology stack

- Next.js
- React
- Node.js
- Express
- PostgreSQL
- `pg`
- `express-session`
- `connect-pg-simple`
- `bcrypt`
- Helmet
- Express Rate Limit
- CORS
- PM2-compatible production configuration

## Prerequisites

Install or obtain the following before running the project:

- A Node.js version supported by the `engines` field in `package.json`
- npm
- PostgreSQL with permission to create tables and indexes
- A database and PostgreSQL role for the application
- Administrator-provided TLS certificate and private-key files for the API
- PM2 for the documented production frontend workflow
- Two deployment hosts, containers, or otherwise isolated network environments if both services use port `5084`

Node.js 20 LTS or a newer supported LTS release is recommended.

## Installation

Clone or copy the project, enter its root directory, and install all frontend and backend dependencies:

```bash
npm install
```

The frontend and API share the root `package.json` and `node_modules` directory. There is no separate installation step under `server/`.

## Environment configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Replace every placeholder with values appropriate for the deployment. Never commit `.env` or production credentials.

### Environment variables

| Variable | Required by | Description |
| --- | --- | --- |
| `NODE_ENV` | Frontend and API | Runtime mode. Use `production` in deployed environments to enable production security, PostgreSQL TLS behavior, and secure session-cookie settings. |
| `PORT` | Frontend | Port used by the Next.js production process. The provided npm scripts and PM2 configuration use `5084`. |
| `BACKEND_PORT` | API | HTTPS port used by the Express API. It must be a valid TCP port and must not be `3000`. The public deployment is designed to expose the API on `5084`. |
| `DATABASE_URL` | API | PostgreSQL connection string for users, books, manuscript submissions, and sessions. The configured role must be able to create and alter the required schema objects. |
| `SESSION_SECRET` | API | Long, unpredictable secret used to sign session cookies. Use a unique production value and do not expose it to the browser. |
| `NEXT_PUBLIC_API_BASE_URL` | Browser and frontend build | Public HTTPS origin of the API, without a trailing API route. For the canonical deployment this is the API host on port `5084`. Because it begins with `NEXT_PUBLIC_`, its value is available to browser code. |

A deployment-oriented configuration has the following shape:

```dotenv
NODE_ENV=production
PORT=5084
BACKEND_PORT=5084
DATABASE_URL=postgresql://<database-user>:<database-password>@<database-host>:5432/<database-name>
SESSION_SECRET=<long-random-session-secret>
NEXT_PUBLIC_API_BASE_URL=https://<api-host>:5084
```

The values above are placeholders only.

### Frontend API default

If `NEXT_PUBLIC_API_BASE_URL` is not defined, the browser API helper defaults to:

```text
https://bookpublishing-api.geo-drops.com:5084
```

Set the variable explicitly when deploying under another API hostname or when testing against another environment.

### Environment validation

The API validates its required configuration during startup:

- `BACKEND_PORT` must be a valid port.
- `BACKEND_PORT=3000` is rejected.
- `DATABASE_URL` must be present.
- `SESSION_SECRET` must be present.

Startup stops if required configuration is invalid.

## PostgreSQL setup

Bookpublishing uses PostgreSQL directly and does not require an ORM or migration framework.

The schema is defined in:

```text
server/db/schema.sql
```

It creates and maintains:

- `users`
- `books`
- `submissions`
- The PostgreSQL session table used by `connect-pg-simple`
- Unique constraints
- Foreign keys
- Submission status constraints
- Query indexes
- Timestamp fields
- The curated published-book seed catalog

All DDL and seed operations are idempotent.

### Create the database and role

Create a PostgreSQL database and an application role using your infrastructure’s preferred administration process. Grant the role permission to connect to the database and create the schema objects defined in `server/db/schema.sql`.

Then configure `DATABASE_URL` with that role’s connection string.

Do not use a superuser account for routine application traffic.

### Automatic initialization

The API executes `server/db/schema.sql` before accepting HTTPS requests. On a fresh database, starting the API initializes all required tables, indexes, constraints, and seed books automatically.

The database role must therefore have sufficient schema privileges during startup.

### Optional manual initialization

Administrators may inspect or apply the schema manually before starting the API:

```bash
psql "$DATABASE_URL" -f server/db/schema.sql
```

Because the SQL is idempotent, it is safe to execute again during deployment.

Production database backups and restore procedures remain the responsibility of the deployment administrator.

## API TLS certificates

The Express API starts as a native HTTPS server. It reads administrator-provided TLS files directly from these fixed paths:

```text
/home/arx-app/backends/certs/certificate.crt
/home/arx-app/backends/certs/private.key
```

Both files must exist before starting the API.

- `certificate.crt` must contain the certificate material expected by Node.js HTTPS.
- `private.key` must contain the corresponding private key.
- The operating-system user running the API must have read access.
- Private-key permissions should be restricted to the service user.
- Never store private keys in this repository.
- Certificate renewal must update the files at these paths and restart the API.

If either file is missing, unreadable, malformed, or does not match the other, the HTTPS API cannot start.

## Port and deployment model

The canonical deployment uses port `5084` for both services, but they are separate network services:

- Frontend: `https://bookpublishing.geo-drops.com:5084`
- API: `https://bookpublishing-api.geo-drops.com:5084`

This is possible because the services run behind separate hostnames on separate hosts, containers, IP addresses, or equivalent isolated listeners.

Two processes cannot bind the same address and port on one machine. When running both directly on a single development host, assign the API a different permitted port and update `NEXT_PUBLIC_API_BASE_URL` accordingly.

For example:

```dotenv
PORT=5084
BACKEND_PORT=5085
NEXT_PUBLIC_API_BASE_URL=https://<development-api-host>:5085
```

The API must still have valid TLS files at the required certificate paths.

## Local development workflow

### Frontend only

Start the Next.js development server:

```bash
npm run dev
```

The exact script is:

```text
next dev -p 5084
```

Open:

```text
http://localhost:5084
```

Public catalog components tolerate API unavailability and use curated fallback books when needed. Authentication and manuscript submission require a reachable API.

### API

After configuring PostgreSQL, environment variables, and TLS certificates, start the API:

```bash
npm run server
```

The API listens over HTTPS on `BACKEND_PORT`.

### Running both services locally

To run both on the same machine:

1. Keep the frontend on port `5084`.
2. Set `BACKEND_PORT` to another allowed port, such as `5085`.
3. Set `NEXT_PUBLIC_API_BASE_URL` to the API’s HTTPS origin.
4. Ensure the TLS certificate is valid for the hostname used by the browser.
5. Start `npm run server` in one terminal.
6. Start `npm run dev` in another terminal.

The API’s credentialed CORS policy is intentionally deployment-focused. It accepts HTTPS origins under `*.geo-drops.com`. Full browser-based local authentication therefore requires an approved HTTPS development hostname or an appropriately configured deployment/reverse-proxy environment. The public frontend can still be developed without the API because book retrieval has runtime fallbacks.

## Production frontend build

Create an optimized Next.js production build:

```bash
npm run build
```

The build output is emitted to:

```text
.next/
```

Start the built frontend with:

```bash
npm start
```

The exact production script is:

```text
next start -p 5084
```

A successful `.next` build must exist before running `npm start` or the PM2 frontend process.

If `NEXT_PUBLIC_API_BASE_URL` changes, rebuild the frontend so the intended public API URL is available to browser code.

## Starting the API with `START.sh`

`START.sh` launches the API as a detached background task. It creates the runtime logging directory, starts `npm run server`, records the process ID, and redirects API output to runtime logs.

Make the script executable once:

```bash
chmod +x START.sh
```

Then run it from the project root:

```bash
./START.sh
```

Before using it, verify that:

- `.env` contains valid API configuration.
- PostgreSQL is reachable.
- The database role has schema permissions.
- The TLS certificate and private key exist at the required paths.
- No other process is already listening on `BACKEND_PORT`.

Use the recorded PID for operating-system-level process inspection or controlled shutdown. Review the generated runtime log output if startup fails.

`START.sh` starts the API only. It does not start Next.js and does not use `concurrently`.

## Running the frontend with PM2

The repository includes `ecosystem.config.js` with one PM2 application named:

```text
bookpublishing
```

It runs:

```text
node_modules/.bin/next start
```

with:

```text
cwd=/home/arx-app/backends/bookpublishing
NODE_ENV=production
PORT=5084
```

Install dependencies and build before starting PM2:

```bash
cd /home/arx-app/backends/bookpublishing
npm install
npm run build
pm2 start ecosystem.config.js
```

Useful PM2 commands include:

```bash
pm2 status
pm2 logs bookpublishing
pm2 restart bookpublishing
pm2 stop bookpublishing
pm2 delete bookpublishing
```

To restore the process after a machine restart, use the PM2 startup procedure appropriate for the server:

```bash
pm2 save
pm2 startup
```

Follow the privileged command printed by `pm2 startup`.

The PM2 configuration starts the frontend only. Start the API separately with `START.sh` or another process manager on its API deployment host.

## API reference

All API responses are JSON. Browser requests use session credentials.

### Health

#### `GET /health`

Returns HTTP `200` with exactly:

```json
{
  "status": "ok"
}
```

### Authentication

#### `POST /api/auth/signup`

Creates an author account, hashes the password with bcrypt, regenerates the session, and signs in the new user.

Request body:

```json
{
  "displayName": "Author Name",
  "email": "author@example.com",
  "password": "A-strong-password"
}
```

Returns a sanitized user object without a password hash.

#### `POST /api/auth/login`

Authenticates an existing account and regenerates the session to prevent session fixation.

Request body:

```json
{
  "email": "author@example.com",
  "password": "A-strong-password"
}
```

#### `POST /api/auth/logout`

Destroys the server-side session and clears the authentication cookie.

#### `GET /api/auth/me`

Returns the current sanitized user when authenticated. Returns HTTP `401` when there is no valid user session.

Signup and login are rate-limited.

### Books

#### `GET /api/books`

Returns the published catalog.

To request featured books only:

```text
GET /api/books?featured=true
```

Only published records are exposed.

#### `GET /api/books/:slug`

Returns one published book by its unique slug.

Returns HTTP `404` when the slug does not identify a published book.

### Manuscript submissions

Both submission routes require an authenticated session.

#### `POST /api/submissions`

Creates a manuscript proposal owned by the signed-in author.

Request body:

```json
{
  "title": "Working Book Title",
  "genre": "Fiction",
  "wordCount": 85000,
  "synopsis": "A complete manuscript synopsis.",
  "manuscriptUrl": "https://example.com/private-manuscript"
}
```

New proposals are created with the status `received`.

The server validates required text, accepted genres, a positive word count, and an HTTPS manuscript URL. Ownership always comes from the authenticated session and cannot be selected in the request body.

#### `GET /api/submissions/mine`

Returns only the current author’s submissions, ordered newest first.

### Unknown routes and errors

Unknown API routes return a JSON `404` response. Centralized error handling returns consistent JSON error objects and avoids exposing sensitive production details.

## Session and browser behavior

Authentication uses server-side sessions stored in PostgreSQL.

- Passwords are hashed with bcrypt.
- Password hashes are never returned by API responses.
- Sessions contain only the authenticated user ID.
- Session IDs are regenerated during signup and login.
- Logout destroys the server-side session.
- The browser API helper sends requests with credentials.
- Production cookies use secure deployment settings.
- PostgreSQL-backed sessions survive API process restarts.
- Authentication state is resolved only after the frontend mounts in the browser.
- If the API is unavailable, the frontend settles into a safe anonymous state rather than failing server rendering.

Because sessions use cookies across the frontend and API origins, production DNS, HTTPS, cookie settings, and CORS must remain aligned.

## Security behavior

The API applies the following protections:

- Native HTTPS using administrator-managed certificates
- Helmet security headers
- Credentialed CORS restricted to HTTPS origins under `*.geo-drops.com`
- Production-aware secure session cookies
- PostgreSQL-backed session storage
- Bcrypt password hashing
- Authentication rate limiting
- Session regeneration after successful signup and login
- Parameterized PostgreSQL queries
- Request JSON size limits
- Submission ownership derived exclusively from the session
- Input normalization and validation
- HTTPS-only manuscript URL validation
- Published-only public book queries
- Centralized error handling
- Hidden stack traces and sensitive error details in production
- Graceful HTTPS server and PostgreSQL pool shutdown on termination signals

The Next.js application also configures secure response headers, accessible focus states, reduced-motion support, runtime-tolerant fetching, and private-dashboard crawl exclusion.

## Operational checks

After deployment, verify the API:

```bash
curl https://<api-host>:5084/health
```

Expected response:

```json
{"status":"ok"}
```

Then verify:

1. The frontend loads on its public hostname.
2. Featured books load from the API or display curated fallback content.
3. Signup creates a PostgreSQL user and session.
4. Login persists across a browser refresh.
5. Logout invalidates the session.
6. An authenticated author can submit a valid proposal.
7. The dashboard lists only that author’s submissions.
8. Unknown book slugs and API routes return appropriate `404` states.
9. PM2 and API logs contain no certificate, database, or CORS errors.

## npm scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js development mode on port `5084`. |
| `npm run build` | Build the deployable Next.js application into `.next/`. |
| `npm start` | Start the built Next.js application on port `5084`. |
| `npm run server` | Start the standalone HTTPS Express API. |

The project intentionally does not use `concurrently`. Run or supervise the frontend and API as separate processes.

## Project structure

```text
.
├── .env.example
├── .gitignore
├── README.md
├── START.sh
├── ecosystem.config.js
├── next.config.js
├── package.json
├── app
│   ├── books
│   │   └── [slug]
│   │       └── page.jsx
│   ├── dashboard
│   │   └── page.jsx
│   ├── login
│   │   └── page.jsx
│   ├── signup
│   │   └── page.jsx
│   ├── error.jsx
│   ├── globals.css
│   ├── icon.svg
│   ├── layout.jsx
│   ├── not-found.jsx
│   ├── page.jsx
│   ├── providers.jsx
│   ├── robots.js
│   └── sitemap.js
├── components
│   ├── AuthForm.jsx
│   ├── AuthProvider.jsx
│   ├── AuthorBenefits.jsx
│   ├── BookCard.jsx
│   ├── BookDetail.jsx
│   ├── FeaturedBooks.jsx
│   ├── Footer.jsx
│   ├── Header.jsx
│   ├── Hero.jsx
│   ├── PublishingProcess.jsx
│   └── SubmissionDashboard.jsx
├── lib
│   ├── api.js
│   └── content.js
└── server
    ├── app.js
    ├── config.js
    ├── index.js
    ├── controllers
    │   ├── authController.js
    │   ├── bookController.js
    │   └── submissionController.js
    ├── db
    │   ├── index.js
    │   └── schema.sql
    ├── middleware
    │   ├── errorHandler.js
    │   └── requireAuth.js
    ├── routes
    │   ├── authRoutes.js
    │   ├── bookRoutes.js
    │   ├── healthRoutes.js
    │   └── submissionRoutes.js
    └── utils
        └── validation.js
```

### Structure overview

- `app/` contains the Next.js App Router pages, metadata, global styling, error UI, sitemap, and robots configuration.
- `components/` contains the public marketing sections, catalog views, authentication UI, and authenticated submission dashboard.
- `lib/api.js` provides credentialed browser requests, timeout handling, public API configuration, and normalized errors.
- `lib/content.js` provides curated book content used when the runtime API is unavailable.
- `server/app.js` configures Express middleware, sessions, CORS, routes, and error handling.
- `server/index.js` initializes PostgreSQL and starts the HTTPS API.
- `server/config.js` validates and normalizes API environment configuration.
- `server/db/` contains the PostgreSQL pool and idempotent schema.
- `server/controllers/` contains request handlers and parameterized database operations.
- `server/routes/` defines health, authentication, book, and submission endpoints.
- `server/middleware/` contains authentication enforcement and centralized error handling.
- `server/utils/validation.js` contains shared server-side input validation.
- `START.sh` runs the API as a detached background task.
- `ecosystem.config.js` runs the production Next.js frontend with PM2.
- `.next/` is generated by `npm run build` and is not committed.