# Configuration Guide

> How to configure and run this project in every environment.

---

## Environment Variables

The project uses two environment variables, documented in `.env.example`:

```bash
GEMINI_API_KEY="MY_GEMINI_API_KEY"
APP_URL="MY_APP_URL"
```

### Setting Up Locally

1. Create a `.env.local` file in the project root (same level as `package.json`):
   ```bash
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   APP_URL=http://localhost:3000
   ```

2. `.env.local` is gitignored — it will not be committed.

### `GEMINI_API_KEY`
- **Required for**: Future Gemini API calls
- **Get one at**: https://aistudio.google.com/apikey
- **Current effect**: Vite injects it as `process.env.GEMINI_API_KEY` into the client bundle. No code currently reads it.
- **Security warning**: This key is embedded in the client bundle — anyone who views the page source can extract it. For production, Gemini API calls must be made server-side, not from the browser.

### `APP_URL`
- **Required for**: OAuth callbacks, self-referential links
- **Current effect**: None — not referenced anywhere in the code
- **Google AI Studio**: Automatically set to the Cloud Run URL at runtime

---

## Vite Configuration (`vite.config.ts`)

```typescript
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
```

### Key settings:

**`plugins`**: React (JSX transform + Fast Refresh) + Tailwind CSS v4 (CSS generation).

**`define`**: Replaces `process.env.GEMINI_API_KEY` at build time with the actual key value. This is a string replacement, not a proper runtime env system.

**`resolve.alias`**: `@` maps to the project root. Allows imports like `import X from '@/src/components/...'` instead of relative paths. Currently not used — all imports use relative paths.

**`server.hmr`**: Hot Module Replacement is disabled when `DISABLE_HMR=true`. Google AI Studio sets this to prevent flickering during AI-driven code edits.

### Environment mode behavior:
- `npm run dev` → `mode = 'development'`
- `npm run build` → `mode = 'production'`
- `loadEnv(mode, '.')` loads `.env`, `.env.local`, `.env.development` / `.env.production`

---

## TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": { "@/*": ["./*"] },
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}
```

### Key settings:

**`target: "ES2022"`**: Output targets modern ES2022 features. Appropriate for modern browsers.

**`moduleResolution: "bundler"`**: Uses Vite/bundler-style resolution. Allows importing `.tsx` files with extensions.

**`allowImportingTsExtensions: true`**: Allows `import App from './App.tsx'` (with explicit `.tsx` extension). Required when using `moduleResolution: "bundler"`.

**`noEmit: true`**: TypeScript only type-checks, never emits JS. Vite handles transpilation via esbuild.

**`skipLibCheck: true`**: Skips type checking of `.d.ts` files in `node_modules`. Speeds up compilation significantly.

**`jsx: "react-jsx"`**: Uses the modern React 17+ automatic JSX transform. Does not require `import React from 'react'` in every file.

**`experimentalDecorators: true`**: Enables TypeScript decorator syntax. Not currently used but included for future server-side code (e.g., NestJS-style decorators).

**`isolatedModules: true`**: Ensures each file can be transpiled independently (required for esbuild compatibility).

---

## Tailwind CSS Configuration

Tailwind v4 does not use a `tailwind.config.js` file. Configuration is entirely through:

1. The Vite plugin: `@tailwindcss/vite` in `vite.config.ts`
2. The CSS import: `@import "tailwindcss"` in `src/index.css`

Tailwind v4 automatically scans all files in the project for class names.

**Custom configuration in v4** is done via CSS `@theme` directives in `index.css`:
```css
/* Example — not yet present in the project */
@theme {
  --color-brand: #1a1a2e;
  --font-sans: 'Inter', sans-serif;
}
```

---

## npm Scripts

| Script          | Command                      | Use case                              |
|-----------------|------------------------------|---------------------------------------|
| `npm run dev`   | `vite --port=3000 --host=0.0.0.0` | Development server with HMR        |
| `npm run build` | `vite build`                 | Production bundle → `dist/`           |
| `npm run preview`| `vite preview`              | Preview production build locally      |
| `npm run clean` | `rm -rf dist`                | Clean build output                    |
| `npm run lint`  | `tsc --noEmit`               | TypeScript type check (no ESLint)     |

**Note**: `npm run clean` uses Unix `rm -rf`. On Windows, use `rmdir /s /q dist` or PowerShell `Remove-Item -Recurse -Force dist`.

---

## Google AI Studio Configuration

The project was built in Google AI Studio. Relevant behaviors:

- The `metadata.json` file is read by AI Studio to display project name and description
- `DISABLE_HMR=true` is set by AI Studio during AI editing sessions
- `GEMINI_API_KEY` is injected automatically from the user's secrets panel
- `APP_URL` is set to the Cloud Run service URL automatically

When running outside AI Studio, you must manually create `.env.local`.

---

## Running on Windows (This Machine)

```powershell
# Navigate to project
cd 'C:\Users\rskir\OneDrive\Desktop\Claim_bot_2-main\Claim_bot_2-main'

# Install dependencies
npm install

# Create env file
New-Item .env.local -ItemType File
Add-Content .env.local "GEMINI_API_KEY=your_key_here"
Add-Content .env.local "APP_URL=http://localhost:3000"

# Start development server
npm run dev
# Open: http://localhost:3000
```

**Known Windows issues**:
- `npm run clean` (`rm -rf dist`) will fail on Windows — use `Remove-Item -Recurse -Force dist` instead
- `better-sqlite3` native compilation may fail without Visual C++ Build Tools
