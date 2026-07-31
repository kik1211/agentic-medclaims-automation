# Component Reference

> Technical specification for every React component in the codebase.

---

## WireframeUI.tsx — Shared Primitives

### `WireButton`

```typescript
WireButton({ children, id?, className?, variant? })
```

| Prop       | Type   | Default     | Description                                        |
|------------|--------|-------------|---------------------------------------------------|
| children   | any    | required    | Button label / icon content                        |
| id         | string | undefined   | HTML id — used by ArrowsOverlay for nav connections |
| className  | string | `''`        | Additional Tailwind classes                        |
| variant    | string | `'primary'` | `'primary'` / `'secondary'` / `'outline'`         |

**Variants**:
- `primary`: Dark background (`bg-gray-800`), white text
- `secondary`: White background, dark text
- `outline`: Transparent with dashed border

**Important**: This button renders a `<button>` element but has **no onClick handler** anywhere in the codebase. Clicking does nothing. Interactivity is entirely visual.

---

### `WireInput`

```typescript
WireInput({ placeholder, type?, className?, icon?, defaultValue? })
```

| Prop         | Type      | Default  | Description                               |
|--------------|-----------|----------|-------------------------------------------|
| placeholder  | string    | required | Placeholder text                          |
| type         | string    | `'text'` | HTML input type                           |
| className    | string    | `''`     | Additional wrapper classes                |
| icon         | Component | undefined | Lucide icon rendered left of input       |
| defaultValue | string    | undefined | Pre-filled value (uncontrolled input)    |

**State**: Uncontrolled — values are not tracked anywhere. Typing into inputs has no effect on application state.

---

### `WireCard`

```typescript
WireCard({ children, className?, title? })
```

| Prop      | Type   | Default | Description                    |
|-----------|--------|---------|--------------------------------|
| children  | any    | required| Card body content              |
| className | string | `''`    | Additional wrapper classes     |
| title     | string | undefined | Optional card header title   |

---

### `WireBadge`

```typescript
WireBadge({ children, variant? })
```

| Prop     | Type   | Default     | Description                                  |
|----------|--------|-------------|----------------------------------------------|
| children | any    | required    | Badge text content                           |
| variant  | string | `'default'` | `'default'` (plain border) / `'high'` (filled gray) |

**Usage pattern**: `'high'` variant is used for problem states (Missing Data, Rejected, Escalated). `'default'` for normal states.

---

### `WireSidebar`

```typescript
WireSidebar({ activeId })
```

| Prop     | Type   | Default  | Description                                   |
|----------|--------|----------|-----------------------------------------------|
| activeId | string | required | ID of the currently active nav item           |

**Hardcoded nav items**:
```typescript
[
  { id: 'nav-dashboard', label: 'Dashboard', screen: 'Screen 2' },
  { id: 'nav-pre-auth', label: 'Pre-Authorization', screen: 'Screen 3' },
  { id: 'nav-discharge', label: 'Discharge Auth', screen: 'Screen 4' },
  { id: 'nav-final-claims', label: 'Final Claims', screen: 'Screen 5' },
  { id: 'nav-pipeline', label: 'Claims Pipeline', screen: 'Screen 6' },
  { id: 'nav-denial', label: 'Denial Recovery', screen: 'Screen 7' },
  { id: 'nav-reports', label: 'Reports', screen: 'Screen 8' },
  { id: 'nav-settings', label: 'Settings', screen: 'Screen 9' },
]
```

Active item gets `bg-gray-800 text-white`. All items have IDs in `connections[]`.

---

### `WireHeader`

```typescript
WireHeader()
```

No props. Renders:
- Hospital name: **hardcoded** "Sri Ramakrishna Hospital, Coimbatore"
- "Agent Active" status indicator (animated pulsing dot)
- Bell icon button with ID `btn-notifications` (connects to Screen 10 in arrows)
- User avatar circle

---

### `ScreenContainer`

```typescript
ScreenContainer({ id, title, children, className? })
```

| Prop      | Type   | Default | Description                                        |
|-----------|--------|---------|----------------------------------------------------|
| id        | string | required | HTML id — used by ArrowsOverlay as arrow target   |
| title     | string | required | Screen label displayed in top-left corner badge   |
| children  | any    | required | Screen content                                    |
| className | string | `''`    | Additional classes                                |

**Fixed dimensions**: `1024px × 768px` — non-responsive, intentional for wireframe map.

---

## App.tsx — Root Components

### `ArrowsOverlay`

```typescript
ArrowsOverlay({ connections })
```

| Prop        | Type    | Description                                     |
|-------------|---------|-------------------------------------------------|
| connections | Array   | `{ from: string, to: string }[]` pairs          |

**Internal state**: `lines` — array of calculated `{ startX, startY, endX, endY, id }` objects.

**useEffect**:
- Runs once on mount
- Re-runs on resize
- Runs again after 1-second timeout

**SVG output**: One `<path>` per connection. Cubic Bezier `M startX startY C cp1x cp1y, cp2x cp2y, endX endY`. Control points offset horizontally by 50% of the horizontal distance, creating S-curves.

**Arrowhead**: SVG `<marker>` element with id `arrowhead`. Polygon triangle, dark fill, 10×7px.

---

### `App` (default export)

```typescript
App()
```

No props. Renders the entire application.

**Absolute positions** (left values are column anchors):
- Column 1: `left-[100px]` — Login
- Column 2: `left-[1300px]` — Dashboard
- Column 3: `left-[2500px]` — Pre-Auth, Discharge, Final Claims, Denial, Reports, Settings
- Column 4: `left-[3700px]` — Processing, Missing Data, Approval, Add Insurer, Notifications
- Column 5: `left-[4900px]` — Pipeline, AI Analysis
- Column 6: `left-[6100px]` — Claim Detail, Manual Review

**Vertical offsets** (top values within each column):
- `top-[100px]` — first item in column
- `top-[950px]` — second item
- `top-[1800px]` — third item
- `top-[2650px]` — fourth item
- `top-[3500px]` — fifth item
- `top-[4350px]` — sixth item

---

## Screen Components (Summary Table)

| Component | Screen ID | State | Effects | External Data |
|-----------|-----------|-------|---------|---------------|
| Screen1   | screen-1  | None  | None    | None          |
| Screen2   | screen-2  | None  | None    | None          |
| Screen3   | screen-3  | None  | None    | None          |
| Screen3A  | screen-3a | None  | None    | None          |
| Screen4   | screen-4  | None  | None    | None          |
| Screen5   | screen-5  | None  | None    | None          |
| Screen6   | screen-6  | None  | None    | None          |
| Screen7   | screen-7  | None  | None    | None          |
| Screen8   | screen-8  | None  | None    | None          |
| Screen9   | screen-9  | None  | None    | None          |
| Screen10  | screen-10 | None  | None    | None          |
| Screen11  | screen-11 | None  | None    | None          |
| Screen12  | screen-12 | None  | None    | None          |
| Screen13  | screen-13 | None  | None    | None          |
| Screen14  | screen-14 | None  | None    | None          |
| Screen15  | screen-15 | None  | None    | None          |
| Screen16  | screen-16 | None  | None    | None          |

All screen components are pure, stateless, functional components. None use `useState`, `useEffect`, `useRef`, `useContext`, or any hooks except the implicit JSX transform.

---

## Component Dependency Graph

```
App.tsx
├── ArrowsOverlay (inline, no import)
└── Screens (via screen files)
    ├── AuthScreens.tsx
    │   └── Screen1 → [WireButton, WireInput, ScreenContainer, Activity icon]
    ├── DashboardScreens.tsx
    │   ├── Screen2 → [WireSidebar, WireHeader, WireCard, WireButton, WireBadge, ScreenContainer]
    │   ├── Screen8 → [same + WireButton + Download icon]
    │   ├── Screen9 → [same + WireInput + Edit2, Trash2, Plus icons]
    │   └── Screen16 → [WireButton, WireInput, ScreenContainer]
    ├── ClaimScreens.tsx
    │   ├── Screen3 → [WireButton, WireInput, WireCard, WireBadge, WireSidebar, WireHeader, ScreenContainer, Upload, Check icons]
    │   ├── Screen3A → [WireButton, ScreenContainer, Loader2, Check, Clock, ArrowRight icons]
    │   ├── Screen4 → [same as Screen3 + minus some]
    │   ├── Screen5 → [same]
    │   ├── Screen12 → [WireButton, WireInput, ScreenContainer, AlertTriangle, Upload icons]
    │   └── Screen13 → [WireButton, WireBadge, ScreenContainer, Check, FileText icons]
    ├── PipelineScreens.tsx
    │   ├── Screen6 → [WireSidebar, WireHeader, WireCard, WireBadge, WireButton, WireInput, ScreenContainer, Search, Download, ChevronDown icons]
    │   ├── Screen10 → [WireButton, ScreenContainer, AlertTriangle, Check, Info, X icons]
    │   └── Screen11 → [WireSidebar, WireHeader, WireCard, WireBadge, WireButton, ScreenContainer, Check, AlertTriangle, Download icons]
    └── DenialScreens.tsx
        ├── Screen7 → [WireSidebar, WireHeader, WireCard, WireBadge, WireButton, ScreenContainer, AlertTriangle, Activity icons]
        ├── Screen14 → [same + FileText, ArrowRight]
        └── Screen15 → [same]
```
