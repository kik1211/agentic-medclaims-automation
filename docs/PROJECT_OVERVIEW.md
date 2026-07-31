# ClaimPilot India — Project Overview

## Status
**Phase 0 — Prototype / Wireframe-only**  
This is a pure frontend wireframe application. No backend exists. No APIs are called. No data is persisted.

---

## What This Project Is

ClaimPilot India is an AI-assisted Hospital Insurance Claims Automation Platform.

It was originally built as a prototype during the **SAP Hackfest** with the goal of validating a business idea: automating the end-to-end insurance claims workflow for hospitals in India, reducing manual labor and claim rejection rates.

The current state of the repository is a **complete interactive wireframe** — 16 screens representing every major workflow state — built in React + TypeScript, rendered as a scrollable canvas where every screen is visible simultaneously and connected by visual arrows.

---

## What This Project Is Not

- It is NOT a production application.
- It is NOT connected to any backend, database, or external API.
- It does NOT perform OCR, transcription, or AI inference.
- It does NOT submit claims to any insurer.
- The statistics shown (1,284 claims, 94.2% approval rate, ₹4.2Cr revenue) are **hardcoded demo data**, not live numbers.

---

## Target Domain

Indian hospital insurance claims, covering:

- **Government schemes**: CMCHIS (Tamil Nadu), PM-JAY (national)
- **Private insurers**: Star Health, HDFC Ergo, ICICI Lombard, Care Health, SBI General
- **TPA-mediated claims**: Third-Party Administrator managed pipelines
- **Hospital workflow stages**: Pre-Authorization → Discharge Authorization → Final Claim

---

## Intended Workflow (Vision)

```
Doctor-Patient Conversation
        ↓
Whisper (Speech-to-Text)
        ↓
Medical Report Transcript
        ↓
OCR Extraction (uploaded PDFs)
        ↓
LLM-based Clinical Structuring
        ↓
ICD-10 / CPT Medical Coding
        ↓
Claim Validation
        ↓
Government Scheme Selection
        ↓
Human Approval (Human-in-the-Loop)
        ↓
Workflow Orchestration (n8n)
        ↓
Claim Submission
        ↓
Dashboard / Reporting
```

The current implementation covers the **UI representation** of every step in this workflow. None of the backend processing steps are implemented.

---

## Technology Stack (Current)

| Layer         | Technology                         |
|---------------|-------------------------------------|
| Framework     | React 19                           |
| Language      | TypeScript 5.8                     |
| Build Tool    | Vite 6                             |
| Styling       | Tailwind CSS v4 (via Vite plugin)  |
| Icons         | Lucide React                       |
| Animation     | Motion (Framer Motion v12)         |
| AI SDK        | @google/genai (installed, unused)  |
| Database      | better-sqlite3 (installed, unused) |
| Server        | Express (installed, unused)        |

---

## Platform Context

This application was built inside **Google AI Studio**, which is reflected in:
- The generic `README.md` referencing AI Studio
- The `GEMINI_API_KEY` environment variable (injected by AI Studio)
- The `APP_URL` variable (for Cloud Run hosting)
- `DISABLE_HMR` environment variable controlling Vite's hot module reload
- The `metadata.json` file (AI Studio project metadata)

---

## Repository Structure

```
Claim_bot_2-main/
├── index.html                  # Single HTML entry point
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite + Tailwind build config
├── metadata.json               # AI Studio project metadata
├── .env.example                # Environment variable template
├── .gitignore
├── README.md
└── src/
    ├── main.tsx                # React entry point
    ├── index.css               # Single CSS file (Tailwind import only)
    ├── App.tsx                 # Root component — canvas + routing logic
    ├── components/
    │   └── WireframeUI.tsx     # Shared UI primitives (6 components)
    └── screens/
        ├── AuthScreens.tsx     # Screen 1: Login
        ├── DashboardScreens.tsx # Screens 2, 8, 9, 16
        ├── ClaimScreens.tsx    # Screens 3, 3A, 4, 5, 12, 13
        ├── PipelineScreens.tsx # Screens 6, 10, 11
        └── DenialScreens.tsx   # Screens 7, 14, 15
```

---

## Screens Inventory

| Screen ID | File                | Title                            | Purpose                                     |
|-----------|---------------------|----------------------------------|---------------------------------------------|
| Screen 1  | AuthScreens         | Login Page                       | Hospital authentication entry point         |
| Screen 2  | DashboardScreens    | Main Dashboard                   | KPIs, attention queue, activity feed        |
| Screen 3  | ClaimScreens        | Pre-Authorization Page           | Document upload + pre-auth queue            |
| Screen 3A | ClaimScreens        | Pre-Auth Processing State        | Agent processing status display             |
| Screen 4  | ClaimScreens        | Discharge Authorization          | Post-surgery discharge documents            |
| Screen 5  | ClaimScreens        | Final Claims Page                | Post-discharge final billing                |
| Screen 6  | PipelineScreens     | Claims Pipeline                  | Master table of all claims                  |
| Screen 7  | DenialScreens       | Denial Recovery                  | Analytics + active denial management        |
| Screen 8  | DashboardScreens    | Reports Page                     | Report generation and scheduling            |
| Screen 9  | DashboardScreens    | Settings Page                    | Hospital profile, insurers, notifications   |
| Screen 10 | PipelineScreens     | Notifications Panel              | Slide-in notification drawer                |
| Screen 11 | PipelineScreens     | Claim Detail Page                | Full claim lifecycle + document viewer      |
| Screen 12 | ClaimScreens        | Missing Data Screen              | Human-in-the-loop data completion           |
| Screen 13 | ClaimScreens        | Approval Confirmation Screen     | Success state for approved claim            |
| Screen 14 | DenialScreens       | Manual Review / Escalation       | Human escalation with AI analysis           |
| Screen 15 | DenialScreens       | AI Error Analysis Screen         | AI error report + correction proposal       |
| Screen 16 | DashboardScreens    | Add New Insurer Connection       | Insurer API/RPA configuration               |

---

## Key Design Decisions (Prototype Phase)

1. **Wireframe aesthetic**: Deliberate brutalist/wireframe visual style using thick borders, monochrome palette, and uppercase typography — communicates "this is a prototype" clearly to stakeholders.
2. **Canvas layout**: All 16 screens rendered simultaneously on a 8000×6000px virtual canvas, connected by SVG Bezier arrows — enables full user flow visualization in a single view.
3. **ID-based navigation**: `connections` array in `App.tsx` maps button IDs to screen IDs, driving the SVG arrow overlay. No router library used.
4. **Hardcoded data**: All patient names, statistics, and claim details are static strings embedded in JSX — appropriate for a hackathon prototype.

---

## Known Hardcoded Data (Demo)

- Hospital name: **Sri Ramakrishna Hospital, Coimbatore**
- Sample patients: Rajesh Kumar, Meena Devi, Suresh V., John D., Kavitha R., Anita S., Mohammed A., Vikram S., Priya M., Karthik R.
- Insurers: Star Health, HDFC Ergo, ICICI Lombard, Care Health, SBI General, CMCHIS
- KPI values: 1,284 claims, 94.2% approval, ₹4.2Cr revenue, 14m processing time
