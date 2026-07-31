# Known Limitations

> An honest technical assessment of every limitation in the current codebase. No exaggeration. No minimizing.

---

## Architectural Limitations

### L1: No Backend
**Severity**: Critical  
**Description**: The entire application is a static frontend with no server. There is no API, no database, no authentication, and no real processing.  
**Consequence**: The application cannot perform any of the advertised operations (OCR, AI structuring, claim submission).

### L2: No Client-Side Navigation
**Severity**: High  
**Description**: Buttons do not navigate between screens. The `connections[]` array only draws visual arrows. Clicking any button does nothing.  
**Consequence**: The application cannot be used as an interactive product. It functions as a static wireframe only.

### L3: No State Management
**Severity**: High  
**Description**: No `useState` exists in any screen component. No Context API. No Zustand/Redux. No form state.  
**Consequence**: No user action persists anywhere in the application. Forms cannot be submitted, selections cannot be made.

### L4: No Data Persistence
**Severity**: High  
**Description**: `better-sqlite3` is installed but never used. No localStorage, IndexedDB, or cookie usage.  
**Consequence**: All data is hardcoded. No claim record survives a page refresh.

---

## Security Limitations

### L5: API Key Exposed in Bundle
**Severity**: High (production risk, low risk for current state)  
**Description**: `vite.config.ts` injects `GEMINI_API_KEY` directly into the client JavaScript bundle via `define`:
```typescript
'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
```
Anyone who opens browser DevTools can extract the API key.  
**Impact**: If the Gemini API key is real and the app is deployed publicly, the key will be compromised.  
**Fix**: All Gemini API calls must be routed through a server-side API endpoint.

### L6: No Authentication
**Severity**: High (production risk)  
**Description**: No login validation, no session, no JWT. The login button is purely visual.  
**Consequence**: Any URL in the app is accessible to anyone.

### L7: No Input Validation
**Severity**: Medium  
**Description**: All form inputs are uncontrolled and unvalidated. No sanitization, no type checking.

### L8: No HTTPS Enforcement
**Severity**: Low (development only)  
**Description**: The dev server runs over HTTP. Production deployment must enforce HTTPS.

---

## Data Integrity Limitations

### L9: All Statistics Are Fabricated
**Severity**: High (transparency risk)  
**Description**: Every number shown in the dashboard is a hardcoded string:
- "1,284 claims this month" — not real
- "94.2% approval rate" — not real
- "₹4.2Cr revenue recovered" — not real
- "14m average processing time" — not real
- "62% recovery rate via AI" — not real

These numbers represent a plausible demo scenario, not real performance data.  
**Risk**: If shown to investors or users without context, these numbers could be misleading.

### L10: Patient Data Is Fictional
**Description**: All patient names (Rajesh Kumar, Meena Devi, etc.) and claim details are fictional and hardcoded. No HIPAA/DPDPA compliance considerations have been implemented because no real patient data is handled.

---

## Code Quality Limitations

### L11: All Props Typed as `any`
**Severity**: Medium  
**Description**: Every component in `WireframeUI.tsx` uses `: any` for its props type. TypeScript provides zero type safety on component interfaces.

### L12: `ArrowsOverlay` Uses Direct DOM Queries
**Severity**: Low  
**Description**: `document.getElementById()` is used instead of React refs. This can fail if elements are not rendered when the effect runs.  
**Known timing workaround**: The 1-second `setTimeout` is a hack to handle delayed rendering.

### L13: No Error Handling Anywhere
**Severity**: Medium  
**Description**: No try-catch blocks, no error boundaries, no error states in any component.

### L14: No Tests
**Severity**: High (for production readiness)  
**Description**: Zero test files. No unit tests, no integration tests, no end-to-end tests.

### L15: No Linting Beyond TypeScript
**Severity**: Low-Medium  
**Description**: `npm run lint` only runs `tsc --noEmit`. No ESLint, Prettier, or style enforcement. Code style is inconsistent (some arrow functions, some const declarations).

---

## UX Limitations

### L16: Non-Responsive Design
**Severity**: High  
**Description**: Every screen is fixed at `1024×768px`. The canvas itself is `8000×6000px`. The application is completely unusable on mobile or tablet devices.

### L17: No Loading States
**Severity**: Medium  
**Description**: The processing state (Screen3A) shows a spinner, but it's purely decorative. No real async operation is represented.

### L18: No Real-Time Updates
**Severity**: Medium  
**Description**: The "Agent Activity Feed" and pipeline status are static. In a real system, these would update in real-time via WebSocket.

### L19: Hospital Name Hardcoded
**Severity**: Medium  
**Description**: "Sri Ramakrishna Hospital, Coimbatore" is hardcoded in `WireHeader`. Switching hospitals requires a code change.

---

## Operational Limitations

### L20: No Logging
**Severity**: Medium  
**Description**: No structured logging anywhere in the application.

### L21: No Monitoring
**Severity**: Low (prototype concern)  
**Description**: No error tracking (Sentry), no performance monitoring, no uptime monitoring.

### L22: `npm run clean` Fails on Windows
**Severity**: Low  
**Description**: The clean script `rm -rf dist` is a Unix command. On Windows (this machine), use `Remove-Item -Recurse -Force dist` instead.

### L23: No Docker Configuration
**Severity**: Low  
**Description**: No `Dockerfile` or `docker-compose.yml`. Required for reproducible deployment.

### L24: Duplicate `vite` in package.json
**Severity**: Low  
**Description**: `vite` appears in both `dependencies` and `devDependencies`. Only one entry is needed (typically `devDependencies`).
