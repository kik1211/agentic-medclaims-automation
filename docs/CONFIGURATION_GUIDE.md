# ClaimPilot India — Configuration Guide

This guide details environment variables, security considerations, and configuration instructions for running ClaimPilot in development and production.

---

## 1. Environment Variables Reference

### Backend Configuration (`backend/.env`)

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | String | `development` | Runtime environment (`development`, `production`, `test`). |
| `PORT` | Number | `3001` | HTTP port for the Express backend server. |
| `CORS_ORIGIN` | String | `http://localhost:5173` | Allowed origin for Cross-Origin Resource Sharing. |
| `LOG_LEVEL` | String | `info` | Minimum Winston log level (`error`, `warn`, `info`, `debug`). |
| `DATABASE_PATH` | String | `claimpilot.db` | Relative or absolute path to the SQLite database file. |
| `JWT_SECRET` | String | *Hardcoded dev key* | Secret key used to sign and verify JSON Web Tokens. Must be set in production. |
| `JWT_EXPIRES_IN` | String | `24h` | Expiration window for issued JWT tokens. |
| `UPLOAD_DIR` | String | `uploads` | Directory for storing uploaded claim documents on disk. |
| `GEMINI_API_KEY` | String | *(Optional)* | Google Gemini API key for clinical data extraction. |
| `GEMINI_MODEL` | String | `gemini-2.5-flash` | Gemini model name used by `@google/genai`. |
| `REDIS_HOST` | String | `localhost` | Hostname for Redis connection (if Redis enabled). |
| `REDIS_PORT` | Number | `6379` | Port for Redis connection. |

### Frontend Configuration (`.env`)

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `APP_URL` | String | `http://localhost:3000` | Application host URL. |
| `VITE_API_URL` | String | `http://localhost:3001` | Base URL for backend REST API calls. |

---

## 2. API Key Security & Client Bundle Disclosure

### Server-Side Isolation
The primary LLM extraction pipeline is implemented entirely within `backend/src/llm/gemini.service.ts`. The backend reads `GEMINI_API_KEY` securely from the server environment (`process.env.GEMINI_API_KEY`) via `backend/src/config/env.ts`.

### Security Notice: Frontend Vite Bundle Injection
In the frontend build configuration (`vite.config.ts`), the following `define` directive is configured:
```typescript
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
}
```
**Security Implication**: If `GEMINI_API_KEY` is present in the root directory's `.env` file during frontend compilation (`npm run build`), Vite will perform a compile-time string replacement and inject the raw API key into the generated client JavaScript bundle.

**Recommended Practice**:
- Maintain `GEMINI_API_KEY` exclusively in `backend/.env`.
- Do not place `GEMINI_API_KEY` in the root `.env` or frontend build environment.
- The frontend UI makes zero direct calls to the Gemini API; all LLM operations are routed via `POST /api/claims/:id/clinical-extract`.

---

## 3. Local Setup Instructions

### Prerequisites
- Node.js v20.x or higher
- npm v10.x or higher

### Step 1: Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 2: Configure Environment Files
```bash
# Copy root environment file
cp .env.example .env

# Create backend environment file
cat <<EOF > backend/.env
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000
DATABASE_PATH=claimpilot.db
JWT_SECRET=your_secure_development_jwt_secret_key_2026
JWT_EXPIRES_IN=24h
UPLOAD_DIR=uploads
GEMINI_MODEL=gemini-2.5-flash
# Optional: GEMINI_API_KEY=your_gemini_key_here
EOF
```

### Step 3: Run Database Migrations
Initialize the SQLite database schema and seed default tables:
```bash
cd backend
npm run migrate
cd ..
```

### Step 4: Run Services
In terminal 1 (Backend):
```bash
cd backend
npm run dev
# Server listening on http://localhost:3001
```

In terminal 2 (Frontend):
```bash
npm run dev
# UI available on http://localhost:3000 (or http://localhost:5173 depending on port availability)
```
