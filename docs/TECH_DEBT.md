# Technical Debt

> A prioritized register of every technical debt item in the codebase. Organized by category and priority.

---

## Priority Definitions
- **P0 — Blocking**: Must be resolved before any real usage or production deployment
- **P1 — Critical**: Required for a functional MVP
- **P2 — Important**: Required for a quality product
- **P3 — Nice-to-have**: Improves developer experience or code quality

---

## P0 — Blocking Debt

### TD-001: No Backend Exists
**Location**: Project-wide  
**Description**: The entire backend layer is absent. Express is installed but no server file exists.  
**Impact**: Application cannot perform any real operations.  
**Effort**: Large (weeks of work for full implementation)  
**Resolution**: Create `server/` directory with Express app, routes, middleware, and service layer.

### TD-002: API Key Client-Side Exposure
**Location**: `vite.config.ts` line 11  
**Description**:
```typescript
'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
```
Embedding API keys in client JavaScript is a security vulnerability.  
**Impact**: In production with a real key, the key is exposed to anyone visiting the site.  
**Resolution**: Remove from `vite.config.ts`. Implement a `/api/ai/*` proxy endpoint on the server.

### TD-003: No Client-Side Routing
**Location**: `App.tsx`  
**Description**: Navigation is visual-only (SVG arrows). No page transitions, no URL changes, no browser history.  
**Impact**: Application is unusable as an interactive product.  
**Resolution**: Install React Router v6, define routes for each screen, implement `useNavigate` in button onClick handlers.

---

## P1 — Critical Debt

### TD-004: All Props Typed as `any` in WireframeUI [RESOLVED in M1.3]
**Location**: `src/components/WireframeUI.tsx`, all components  
**Status**: **Resolved** — Defined explicit TypeScript interfaces (`WireButtonProps`, `WireInputProps`, `WireCardProps`, `WireBadgeProps`, `WireSidebarProps`, `WireHeaderProps`, `ScreenContainerProps`). Replaced all `any` prop signatures. Enabled `"strict": true` in `tsconfig.json`. Enabled `@typescript-eslint/no-explicit-any: "error"` in `.eslintrc.cjs`.

### TD-005: No Form State Management
**Location**: All screen files with inputs  
**Description**: All inputs are uncontrolled (`defaultValue` only). No `useState`, no `react-hook-form`, no form validation.  
**Impact**: Forms cannot submit data.  
**Resolution**: Implement controlled forms with `useState` or `react-hook-form`. Add Zod schemas for validation.

### TD-006: No Error Handling
**Location**: Project-wide  
**Description**: Zero try-catch blocks, zero error boundaries.  
**Impact**: Any runtime error will crash the entire React tree with no user-visible feedback.  
**Resolution**: Add React Error Boundaries, implement error states in UI components, add try-catch around all async operations.

### TD-007: No Tests
**Location**: Project-wide  
**Description**: No unit, integration, or E2E test files.  
**Impact**: No regression protection. No CI/CD gate.  
**Resolution**: 
- Unit tests: Vitest + React Testing Library for components
- Integration tests: Vitest for API routes
- E2E tests: Playwright for critical user flows

### TD-008: Hardcoded Hospital Name
**Location**: `src/components/WireframeUI.tsx`, `WireHeader`, line 83  
**Description**:
```typescript
<div className="font-bold text-gray-800">Sri Ramakrishna Hospital, Coimbatore</div>
```
**Resolution**: Pass hospital name via Context API (auth context) after login.

---

## P2 — Important Debt

### TD-009: Hardcoded Static Data in All Screens
**Location**: All screen files  
**Description**: Patient names, statistics, insurer lists, claim details are all hardcoded strings.  
**Resolution**: Separate data from components. Create mock data layer (`src/mocks/`) as an intermediate step before real API integration.

### TD-010: Fixed 1024×768 Screen Dimensions
**Location**: `src/components/WireframeUI.tsx`, `ScreenContainer`  
**Description**: `w-[1024px] h-[768px]` is hardcoded. Application is not responsive.  
**Resolution**: Remove `ScreenContainer` wrapper for production. Each page fills viewport with responsive layout.

### TD-011: ArrowsOverlay `document.getElementById` Pattern
**Location**: `src/App.tsx`, `ArrowsOverlay` component, lines 41-49  
**Description**: Direct DOM queries instead of React refs. Race condition handled by 1-second setTimeout hack.  
**Resolution**: Use `useRef` and pass refs via Context, or use a proper layout measurement library.

### TD-012: Duplicate `vite` in `package.json` [RESOLVED in M1.1]
**Location**: `package.json`  
**Status**: **Resolved** — Removed duplicate `vite` from `dependencies`.

### TD-013: Unused Dependencies Bloat
**Location**: `package.json`  
**Description**: `dotenv`, `motion` (if not used), potentially `autoprefixer` are installed but unused.  
**Resolution**: Run `npm prune` after audit, remove confirmed-unused packages.

### TD-014: No ESLint Configuration [RESOLVED in M1.2]
**Location**: Project root  
**Status**: **Resolved** — Added `.eslintrc.cjs` with `@typescript-eslint/eslint-plugin`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, and `eslint-config-prettier`. Added `npm run lint:full`.

### TD-015: No Prettier Configuration [RESOLVED in M1.2]
**Location**: Project root  
**Status**: **Resolved** — Added `.prettierrc` and `.prettierignore`. Integrated with ESLint via `eslint-config-prettier`. Added `npm run format`.

---

## P3 — Nice-to-Have Debt

### TD-016: `metadata.json` Not Updated
**Location**: `metadata.json`  
**Description**: Describes the project as "A complete set of low-fidelity wireframes" — accurate for now but will need updating as production features are added.

### TD-017: Generic `README.md`
**Location**: `README.md`  
**Description**: The README is the default AI Studio template. References AI Studio directly. No project-specific documentation.  
**Resolution**: Replace with a proper project README covering vision, setup, architecture, and contribution guidelines.

### TD-018: `npm run clean` Windows Incompatibility [RESOLVED in M1.1]
**Location**: `package.json`  
**Status**: **Resolved** — Replaced `rm -rf dist` with `rimraf dist` in `package.json`.
"clean": "rimraf dist"
```

### TD-019: No `.editorconfig`
**Location**: Project root  
**Description**: No editor configuration file. Tab/space/newline settings can vary between contributors.

### TD-020: Inline SVG Arrow Logic in App.tsx
**Location**: `src/App.tsx`, `ArrowsOverlay` component  
**Description**: The `ArrowsOverlay` component is defined inline in `App.tsx`. Should be extracted to its own file `src/components/ArrowsOverlay.tsx`.

---

## Debt Summary by Category

| Category           | Count | P0 | P1 | P2 | P3 |
|--------------------|-------|----|----|----|----|
| Architecture       | 3     | 2  | 1  | —  | —  |
| Type Safety        | 2     | —  | 2  | —  | —  |
| Testing            | 1     | —  | 1  | —  | —  |
| Code Quality       | 5     | —  | —  | 3  | 2  |
| UX / Design        | 2     | —  | —  | 2  | —  |
| DX / Tooling       | 4     | —  | —  | 2  | 2  |
| Security           | 1     | 1  | —  | —  | —  |
| **Total**          | **20**| **3** | **4** | **7** | **4** |
