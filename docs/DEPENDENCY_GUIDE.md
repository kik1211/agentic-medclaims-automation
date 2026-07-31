# Dependency Guide

> Analysis of every dependency in package.json: what it is, why it's there, and its actual usage status.

---

## Runtime Dependencies (`dependencies`)

### `@google/genai` — `^1.29.0`
- **What**: Official Google Generative AI SDK for accessing Gemini models
- **Why installed**: Intended for LLM-based clinical structuring, ICD-10 code suggestion, denial appeal generation
- **Current usage**: **Zero** — never imported anywhere
- **Environment**: Requires `GEMINI_API_KEY`
- **API**: `new GoogleGenAI({ apiKey })` → `ai.models.generateContent(...)`
- **Note**: As of v1.x this is the new unified SDK replacing `@google/generative-ai`

### `@tailwindcss/vite` — `^4.1.14`
- **What**: Official Tailwind CSS v4 Vite plugin
- **Why installed**: Provides CSS utility classes for all styling
- **Current usage**: **Active** — used in `vite.config.ts` as a Vite plugin
- **How it works**: Tailwind v4 scans source files for class names and generates CSS during build. No `tailwind.config.js` needed.
- **Entry point**: `src/index.css` contains `@import "tailwindcss"`

### `@vitejs/plugin-react` — `^5.0.4`
- **What**: Vite plugin for React — provides Fast Refresh and JSX transformation
- **Why installed**: Required for any React + Vite project
- **Current usage**: **Active** — used in `vite.config.ts`

### `better-sqlite3` — `^12.4.1`
- **What**: Synchronous SQLite3 library for Node.js
- **Why installed**: Intended for persisting claim data locally without a heavy database server
- **Current usage**: **Zero** — never imported anywhere
- **Note**: This is a native addon requiring compilation. Will cause issues in environments without build tools. Consider `@prisma/client` with SQLite or a pure-JS alternative.

### `dotenv` — `^17.2.3`
- **What**: Loads `.env` files into `process.env`
- **Why installed**: Environment variable management
- **Current usage**: **Redundant** — Vite already handles `.env` files via `loadEnv()`. Only needed if a separate Node.js server is created.

### `express` — `^4.21.2`
- **What**: Minimal Node.js web framework
- **Why installed**: Intended for the backend API server
- **Current usage**: **Zero** — no server file exists
- **Expected usage**: `import express from 'express'; const app = express(); app.listen(3001);`

### `lucide-react` — `^0.546.0`
- **What**: Icon library for React (SVG icons)
- **Why installed**: Icons used throughout all screen components
- **Current usage**: **Active** — used in all screen files
- **Icons used**: Activity, Upload, FileText, Check, AlertTriangle, Clock, Loader2, ArrowRight, Search, Download, ChevronDown, Info, X, Bell, User, Edit2, Trash2, Plus

### `motion` — `^12.23.24`
- **What**: Animation library (Framer Motion v12, rebranded as "Motion")
- **Why installed**: Intended for page transitions and micro-animations
- **Current usage**: **Zero** — never imported anywhere
- **Note**: This is the same library as `framer-motion`, just renamed

### `react` — `^19.0.0`
- **What**: Core React library
- **Current usage**: **Active** — foundation of the entire application

### `react-dom` — `^19.0.0`
- **What**: React DOM renderer for web browsers
- **Current usage**: **Active** — used in `src/main.tsx`

### `vite` — `^6.2.0`
- **What**: Fast frontend build tool
- **Current usage**: **Active** — development server and production bundler

---

## Development Dependencies (`devDependencies`)

### `@types/express` — `^4.17.21`
- **What**: TypeScript type definitions for Express
- **Current usage**: **Unused** (Express itself is unused)

### `@types/node` — `^22.14.0`
- **What**: TypeScript type definitions for Node.js built-ins
- **Current usage**: Potentially used by `path` in `vite.config.ts`

### `autoprefixer` — `^10.4.21`
- **What**: PostCSS plugin for adding vendor prefixes
- **Current usage**: Listed as devDep but Tailwind v4's Vite plugin handles PostCSS internally. Likely unused.

### `tailwindcss` — `^4.1.14`
- **What**: Tailwind CSS framework
- **Current usage**: **Active** (via `@tailwindcss/vite`)

### `tsx` — `^4.21.0`
- **What**: TypeScript execution engine for Node.js (like `ts-node` but faster)
- **Current usage**: Would be used to run `server.ts` directly: `tsx server.ts`
- **Status**: Installed but no server to run

### `rimraf` — `^6.0.1`
- **What**: Cross-platform file/directory removal utility
- **Current usage**: **Active** — used in `npm run clean` (`rimraf dist`)

### `typescript` — `~5.8.2`
- **What**: TypeScript compiler
- **Current usage**: **Active** — used by `npm run lint` (`tsc --noEmit`)

### `vite` — `^6.2.0`
- **What**: Fast frontend build tool and development server
- **Current usage**: **Active** (kept in `devDependencies`, removed duplicate from `dependencies`)

---

## Dependency Health Assessment

| Package          | Status       | Risk | Action Needed                           |
|------------------|--------------|------|-----------------------------------------|
| react            | Active       | Low  | None                                    |
| react-dom        | Active       | Low  | None                                    |
| vite             | Active       | Low  | Duplicate removed from dependencies (Resolved in M1.1) |
| rimraf           | Active       | Low  | Cross-platform clean script (Added in M1.1) |
| @vitejs/plugin-react | Active   | Low  | None                                    |
| tailwindcss      | Active       | Low  | None                                    |
| @tailwindcss/vite| Active       | Low  | None                                    |
| lucide-react     | Active       | Low  | None                                    |
| typescript       | Active       | Low  | None                                    |
| @google/genai    | Installed, unused | Low | Implement when AI features built     |
| motion           | Installed, unused | Low | Implement animations or remove      |
| express          | Installed, unused | Low | Create server or remove             |
| better-sqlite3   | Installed, unused | Medium | Native addon, needs compilation    |
| dotenv           | Redundant    | Low  | Remove (Vite handles env)               |
| autoprefixer     | Possibly unused | Low | Verify then remove if unused         |
| tsx              | Ready, unused | Low | Will be needed when server created     |
| @types/express   | Unused       | Low  | Remove if Express removed               |

---

## Installing Dependencies

```bash
npm install
```

**Warning**: `better-sqlite3` is a native Node.js addon. On Windows, it requires:
- Python 3.x
- Microsoft C++ Build Tools (Visual Studio Build Tools)
- Windows SDK

If the native build fails, the `npm install` will still succeed but `better-sqlite3` will not be loadable at runtime.
