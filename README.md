# Notes App — Full-stack note taking with Next.js + Express + MongoDB

## What it does
- Provides a web UI to register/login and manage personal notes.
- Persists users and notes in MongoDB with JWT-secured APIs.
- Serves Prometheus-friendly metrics for observability.
- Ships with Docker Compose configs and a Jenkins pipeline for CI/CD.

## Key features
- **Authentication**: Email/password signup & login, JWT cookies, Next.js middleware to guard routes.
- **Notes CRUD**: List, create, edit, delete notes; App Router pages backed by API route proxies.
- **API layer**: Express routes under `/server/api/*` for auth and notes, CORS configured via `CLIENT_URL`.
- **Observability**: `/server/metrics` via `express-prometheus-middleware`; prod Compose includes Prometheus, Grafana, Node Exporter, Alertmanager (requires host configs).
- **Testing & linting**: Jest + jsdom for the client; ts-jest + MongoMemoryServer for the server; ESLint configs in both apps.
- **Containerization & CI**: Dockerfiles per app, root Compose files, Jenkins pipeline that lints/tests, builds/pushes images, runs Snyk/SonarCloud, and deploys via SSH/Compose.

## Tech stack
- Frontend: Next.js 15 (App Router), React 19, Tailwind CSS 4, Radix UI primitives, Lucide icons, TypeScript.
- Backend: Node.js/Express 5, MongoDB/Mongoose, JWT, bcrypt, express-prometheus-middleware, TypeScript.
- Tooling: Jest, ESLint, Docker, Jenkins.

## Architecture overview
The Next.js app renders pages and calls its own API routes (`/api/auth/*`, `/api/notes*`), which proxy to the Express server mounted at `/server/api/*`. The Express server handles auth + notes CRUD and exposes Prometheus metrics; MongoDB stores data.
```
[Browser]
   |
   v
[Next.js client] --(API routes)--> [Express server @ /server/api/*] --> [MongoDB]
                                  \-> /server/metrics (Prometheus)
```

## Getting started (local)
- **Prerequisites**: Node.js (Dockerfiles use `node:22-slim`; Node 20+ recommended), npm, and a MongoDB URI.
- **Environment variables**
  - Client: `NEXT_PUBLIC_API_URL` (base URL including the `/server` prefix, e.g. `http://localhost:5000/server`).
  - Server: `MONGODB_URI` (required), `JWT_SECRET` (required), `CLIENT_URL` (optional CORS origin, defaults to `http://localhost:3000`), `PORT` (optional, defaults to `5000`).
- **Install**
  ```bash
  cd server && npm install
  # create server/.env with MONGODB_URI, JWT_SECRET, CLIENT_URL, PORT (optional)

  cd ../client && npm install
  # create client/.env or .env.local with NEXT_PUBLIC_API_URL=http://localhost:5000/server
  ```
- **Run (development)**
  - Server: `cd server && npm run dev`
  - Client: `cd client && npm run dev` (open http://localhost:3000)
- **Run via Docker Compose (server + client)**
  ```bash
  # ensure server/.env and client/.env exist with the variables above
  docker-compose up --build
  ```

## Usage
- Visit http://localhost:3000, register a new account, then sign in.
- Create a note from “Create Note”, edit via the pencil icon, delete via the trash icon.
- Backend APIs (when running locally with the suggested base URL):
  - `POST /server/api/auth/register`
  - `POST /server/api/auth/login`
  - `GET /server/api/notes`, `POST /server/api/notes`
  - `GET|PUT|DELETE /server/api/notes/:id`
  - Health: `GET /server/ping`; Metrics: `GET /server/metrics`

## Testing / Quality
- Server: `cd server && npm test`; lint with `npm run lint`.
- Client: `cd client && npm test`; lint with `npm run lint`.
- Type-check builds: `npm run build` in each app.

## Deployment
- **Docker images**: Build locally with `docker build -t notes-app-server ./server` and `docker build -t notes-app-client ./client`.
- **Production Compose**: `docker-compose.prod.yml` expects pre-pushed images (`clupai8o0/notes-app-{server,client}:v1.0.${BUILD_NUMBER}`) and env files `server/.env.production` and `client/.env.production`; includes Prometheus/Grafana/Alertmanager/Node Exporter (requires host configs at `/etc/prometheus/*`).
- **CI/CD**: `Jenkinsfile` checks out `main`, lints/tests both apps, builds/pushes versioned Docker images, runs SonarCloud + Snyk scans, tags releases, deploys to an EC2 host via SSH + docker-compose, then smoke-tests `/server/ping` and `/server/metrics`.

## Credits / Contributors
- Author listed in `server/package.json`: Clupai8o0.
