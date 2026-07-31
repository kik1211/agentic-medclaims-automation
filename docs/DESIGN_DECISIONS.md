# Design Decisions

> Rationale behind every significant technical and design choice made in the prototype. Includes decisions that should be reconsidered for production.

---

## Decision 1: Canvas-Based Layout (All Screens Visible Simultaneously)

**Choice**: All 16 screens are rendered at absolute positions on a single 8000×6000px scrollable canvas, connected by SVG arrows.

**Rationale (Prototype)**:
- Communicates the complete product vision in a single scrollable view
- Allows stakeholders to see the entire workflow at once
- Enables rapid iteration without implementing routing
- Typical of design-tool exports (Figma flow view)

**Rationale for the specific implementation**:
- Position coordinates were manually chosen to create a readable left-to-right flow
- Column spacing of ~1200px provides visual separation
- Arrow curves visually communicate the branching nature of the workflow

**Production implication**:
- This must be replaced with a real router (React Router v6 or TanStack Router)
- Each screen becomes a route: `/dashboard`, `/claims/pre-auth`, etc.
- The canvas view could be preserved as a "system overview" or onboarding screen

---

## Decision 2: No Router Library

**Choice**: No React Router, TanStack Router, or navigation library.

**Rationale**: For a wireframe prototype displayed on a canvas, routing adds no value. The visual arrow connections communicate navigation intent clearly to stakeholders.

**Production implication**: React Router v6 with `createBrowserRouter` and `RouterProvider` is the standard choice.

---

## Decision 3: Wireframe Visual Design (Brutalist / Neobrutalist)

**Choice**: Thick black borders, monochrome palette, uppercase typography, no colors, no gradients.

**Rationale**:
- Communicates "this is a prototype" to stakeholders — avoids prematurely anchoring on visual design
- Neobrutalist aesthetic is internally consistent and visually coherent
- Fast to build — no color decisions, no gradient choices
- Tailwind's gray palette provides all needed shades

**Production implication**:
- The wireframe aesthetic can be intentionally retained as a design language (it's a valid, modern aesthetic)
- OR replaced with a polished design system using the same component structure
- The component architecture (`WireButton`, `WireCard`, etc.) supports easy visual updating

---

## Decision 4: All Props Typed as `any` in WireframeUI

**Choice**: Every prop in `WireframeUI.tsx` is typed as `any`:
```typescript
export const WireButton = ({ children, id, className = '', variant = 'primary' }: any) => {
```

**Rationale**: Prototype speed. Avoids defining interfaces for components that were being rapidly iterated.

**Production implication**: Must be replaced with proper TypeScript interfaces:
```typescript
interface WireButtonProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  onClick?: () => void;
}
```

---

## Decision 5: Hardcoded Static Data in JSX

**Choice**: All patient names, statistics, insurer names, and claim details are literal strings embedded in JSX.

**Rationale**: No backend exists; hardcoded data communicates the intended UI states without requiring a data layer.

**Production implication**: All data must come from API calls. Components should accept data via props, not hardcode it.

---

## Decision 6: Fixed Screen Dimensions (1024×768)

**Choice**: `ScreenContainer` renders at exactly `1024×768px`:
```jsx
<div className={`w-[1024px] h-[768px] border-4 border-gray-800 ...`}>
```

**Rationale**: Wireframe screens need consistent dimensions for the canvas layout and arrow calculations.

**Production implication**: The real application must be fully responsive. The `ScreenContainer` wrapper should be removed; each page fills the viewport normally.

---

## Decision 7: ID-Based Navigation vs. Click Handlers

**Choice**: Buttons have IDs (e.g., `id="btn-login"`) that are matched by the `connections[]` array to draw SVG arrows. No `onClick` handlers exist.

**Rationale**: Clean separation of concerns — the UI components define IDs, the canvas layout defines navigation. No state machine needed for a visual prototype.

**Production implication**: Every button needs an `onClick` handler. Navigation should use `useNavigate()` from React Router. The ID-to-screen mapping can be used as a specification document for implementing navigation.

---

## Decision 8: Installed but Unused Dependencies

**Choice**: `@google/genai`, `express`, `better-sqlite3`, `motion`, and `dotenv` are installed but unused.

**Rationale**: During the hackathon, these were added in anticipation of features that were designed in the wireframes but not implemented before time ran out.

**Production implication**: Either implement the features or remove the dependencies. Unused dependencies increase install time and attack surface.

---

## Decision 9: Single CSS File (Tailwind Only)

**Choice**: `index.css` contains only `@import "tailwindcss"`. No custom CSS rules.

**Rationale**: Tailwind utility classes handle all styling. No need for custom CSS with this approach.

**Production implication**: As the design system matures, `@layer components` and `@layer utilities` blocks should be added for reusable custom styles. Custom properties (CSS variables) should be defined for the design token system.

---

## Decision 10: ArrowsOverlay Uses DOM Queries (not React Refs)

**Choice**: `ArrowsOverlay` calls `document.getElementById()` to find elements, rather than using React refs.

**Rationale**: The buttons being connected are in completely separate component subtrees. Passing refs would require significant prop-drilling or context. DOM queries are simpler for a prototype.

**Production implication**: This approach is acceptable for a canvas view. If the arrows feature is retained in production, consider using `IntersectionObserver` or a dedicated layout engine for more robust positioning.

---

## Decision 11: React 19

**Choice**: Uses React 19 (the latest stable release at time of development).

**Rationale**: AI Studio scaffolds use the latest version.

**Production implication**: React 19 introduces breaking changes (e.g., `React.FC` changes, concurrent mode default). Be cautious when integrating third-party libraries that may not yet support React 19. Specifically, verify compatibility of any future additions.

---

## Decision 12: No Authentication Implementation

**Choice**: The login screen (Screen1) is purely visual. No JWT, session, or auth state exists.

**Rationale**: Authentication was out of scope for the hackathon prototype.

**Production implication**: Requires implementation of:
- JWT-based authentication (access + refresh tokens)
- Role-based access (Admin, Claims Officer, Doctor)
- Protected routes in React Router
- Auth middleware on the Express API

---

## Decision 13: Google AI Studio Hosting

**Choice**: Deployed to Google Cloud Run via AI Studio.

**Rationale**: AI Studio provides free hosting with automatic environment variable injection.

**Production implication**: Cloud Run is actually a reasonable production deployment target. The application can be containerized in Docker and deployed to Cloud Run directly, or migrated to Vercel / Railway / AWS.
