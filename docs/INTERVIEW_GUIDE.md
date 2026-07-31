# Interview Guide
# ClaimPilot India — Technical Interview Preparation

**Version**: 1.0  
**Purpose**: Structured Q&A for every technical area. Every answer is grounded in the actual architecture. No fabricated claims.

---

## How to Use This Guide

- **Expected Answer**: What a strong candidate would say
- **Common Mistake**: What a weak or dishonest answer sounds like
- **Follow-up**: What an interviewer will ask next to probe depth

---

## Section 1: Architecture Questions

### Q1.1: Walk me through the overall system architecture.

**Expected Answer**:  
"ClaimPilot is an Express.js backend with a React frontend. The backend is organized as 9 independent processing modules that share a SQLite database. Each module operates on a single claim, reads what it needs from the database, does its work, and writes its output back. A central orchestration module (M6) listens for state changes and decides which module runs next. This design makes each module independently unit-testable — you can put a claim in any state and test the module that handles that state without needing other modules to be running.

The frontend is a React SPA with React Router for navigation, fetching data from the Express API. The claim pipeline is: document upload → OCR → LLM clinical structuring → ICD-10 coding → validation → human approval → insurer submission."

**Common Mistake**: Describing it as a microservices architecture, or claiming real-time processing when it's job-queue based.

**Follow-up**: "Why SQLite instead of PostgreSQL?"  
**Answer**: "SQLite is sufficient for a single hospital processing ~100 claims/day. No separate database process, no connection pool management, simpler deployment. The `better-sqlite3` package is synchronous and performant for our scale. The migration path to PostgreSQL is straightforward — the schema is standard SQL with no SQLite-specific features."

---

### Q1.2: How do modules communicate with each other?

**Expected Answer**:  
"Through the database, not through direct function calls. When M2 completes OCR, it writes its result to the `documents` table and updates the claim's state in the `claims` table. M6 (Orchestration) detects this state change and enqueues a job for M3. M3 reads M2's output from the database, does its work, and writes to `claim_structured_data`. No module calls another module directly.

This design means modules are decoupled — you can upgrade or replace M2 without changing M3, as long as the database contract (what M2 writes) is maintained."

**Follow-up**: "What about performance? Isn't reading from the database for every module slower than in-memory passing?"  
**Answer**: "At our scale, yes — and it's acceptable. A SQLite read takes microseconds. The bottleneck is always the external API calls (Gemini: 8s, Tesseract: 24s, insurer API: 30s). Database overhead is negligible. If we needed to scale to millions of claims, we'd introduce a message queue — but that's a migration, not a redesign, because the module contracts are already event-driven."

---

### Q1.3: How does the claim state machine work?

**Expected Answer**:  
"We have 30 defined states across five categories: ingestion, automated processing, human intervention, submission, and resolution. Every state transition is written to `audit_log` — there is no state change without an audit record. The state machine enforces three invariants: no backward transitions without admin override, only one active processing job per claim at a time, and human states require a real user ID.

The happy path takes a claim through: CREATED → DOCUMENTS_UPLOADED → OCR_COMPLETE → STRUCTURING_COMPLETE → CODING_COMPLETE → VALIDATION_PASSED → AWAITING_HUMAN_APPROVAL → HUMAN_APPROVED → SUBMITTED → INSURER_APPROVED → COMPLETE. Each step can branch into failure or human-intervention states with defined recovery paths."

**Follow-up**: "What happens if you get a state you didn't expect?"  
**Answer**: "M6 has an UNKNOWN_TRANSITION handler that logs the unexpected event, keeps the claim in its current state, and alerts the developer. The claim doesn't proceed and doesn't get corrupted — it stays where it is until a human investigates. There's also a CIRCULAR_TRANSITION_DETECTED handler that fires if the same state is reached 3 times without human action — that forcibly escalates the claim."

---

### Q1.4: How would you test a single module in isolation?

**Expected Answer**:  
"Each module's `process()` operation takes a `claimId` as input and reads the rest from the database. To test M3 in isolation: create a test database, insert a claim record in `OCR_COMPLETE` state, insert document records with fake OCR text, then call `ClinicalModule.structure(claimId)`. Assert that a `claim_structured_data` record was created with the expected fields, and that the claim status advanced to `STRUCTURING_COMPLETE`. No other module needs to be running. This is exactly why we designed modules to communicate through shared state rather than direct calls."

---

## Section 2: Design Tradeoffs

### Q2.1: Why not use microservices for the 9 modules?

**Expected Answer**:  
"Microservices would add network latency, distributed transaction complexity, container orchestration, and service discovery — none of which provides value at a single-hospital MVP scale. Our modules are independent in their logic but share a database. The modularity is a code organization principle, not a deployment architecture. The in-process design means: no network calls between modules, no serialization overhead, no partial failure scenarios between services, and simple deployment as a single Docker container. If we needed to scale each module independently (e.g., OCR is CPU-bound and needs 10 instances), we'd extract just that module — but we haven't hit that problem yet."

**Common Mistake**: Equating 'modular design' with 'microservices'. They're not the same.

---

### Q2.2: Why store raw LLM responses in the database?

**Expected Answer**:  
"Three reasons: debugging, regression testing, and audit. When M3's extraction produces incorrect fields for a claim, we need to see exactly what Gemini returned — not just the parsed output. Without the raw response, diagnosing prompt failures is guesswork. For regression testing: when we update a prompt, we can diff the new extraction against the stored raw responses of previous claims to verify we didn't regress. For audit: DPDPA requires maintaining records of how patient data was processed — storing the LLM response is part of that trail. The raw response is never exposed via the API; it's stored internally and purged after 30 days."

---

### Q2.3: Why use Tesseract instead of a commercial OCR API?

**Expected Answer**:  
"For the MVP, Tesseract has two advantages: cost (free) and privacy (no patient data leaves the server). The tradeoff is accuracy — Tesseract on Indian medical documents typically achieves 60–80%, not the 94% shown in our demo wireframe. The real-world limitation is significant: low-DPI scans, handwritten annotations, and mixed Tamil+English content all degrade Tesseract performance.

The architecture is designed to swap OCR providers without changing other modules. If Tesseract accuracy proves insufficient, we replace `ocrRunner.ts` with a Google Document AI or AWS Textract client — the interface (takes file path, returns extracted text + confidence) stays the same. We've explicitly documented this as the highest technical risk in the project."

---

### Q2.4: Why keep SQLite instead of moving to PostgreSQL immediately?

**Expected Answer**:  
"SQLite requires zero infrastructure. No database server to manage, no connection pool to configure, no network interface to secure. For a portfolio project and MVP, this simplifies setup from 'install Docker Compose' to 'npm install'. The schema is written in standard SQL with no SQLite-specific features, so migration is mechanical. The migration trigger would be: concurrent write load causing SQLite locking issues, or needing multiple application instances. Neither applies to a single hospital at current scale."

---

## Section 3: Scaling Questions

### Q3.1: How would you scale this to 100 hospitals?

**Expected Answer**:  
"Three changes are needed: multi-tenancy in the database schema (add `hospital_id` to all tables — already present in the current design), PostgreSQL to replace SQLite (concurrent writes from multiple hospitals would cause locking in SQLite), and separating the OCR jobs into a dedicated worker pool (OCR is CPU-bound; having multiple hospitals processing simultaneously would starve the Express server). We'd also extract M6 (Orchestration) into a proper message queue like BullMQ + Redis, replacing the in-process queue.

The module interfaces don't change — only the infrastructure under them."

**Follow-up**: "What would break first as you scale?"  
**Answer**: "The SQLite write lock. SQLite allows only one writer at a time. If 10 hospitals each submit documents simultaneously, OCR jobs queue up and processing time degrades linearly. We'd hit this at roughly 3–5 concurrent hospitals."

---

### Q3.2: How would you handle a surge in claim submissions?

**Expected Answer**:  
"The job queue in M6 provides natural buffering. Incoming submissions enqueue a job; the queue workers process at their own pace. The system degrades gracefully under load — claims take longer to process but nothing fails.

For the OCR bottleneck specifically: Tesseract runs synchronously and is CPU-bound. We'd add a worker pool that runs `N` parallel OCR processes where N = number of CPU cores. For Gemini calls: the API has rate limits, so we'd add a rate-limiter that queues Gemini requests and spreads them over time rather than bursting."

---

## Section 4: Security Questions

### Q4.1: How do you secure the Gemini API key?

**Expected Answer**:  
"The current codebase has a known security flaw: `vite.config.ts` uses Vite's `define` to inject the API key into the client bundle at build time. This is documented as TD-002 in our tech debt register. Anyone viewing the page source can extract the key.

The correct implementation: the API key lives only in the server's environment variables, never in the client bundle. All Gemini calls go through a server-side service (`geminiClient.ts`). The frontend calls `/api/ai/structure` (an authenticated Express route), which calls Gemini internally. The frontend never sees the API key."

**Common Mistake**: Not knowing this is a problem, or dismissing it as 'fine for development'.

---

### Q4.2: How is patient data protected?

**Expected Answer**:  
"Patient data in our system is sensitive personal data under India's DPDPA 2023. We protect it through: authentication (JWT with HttpOnly cookies, so scripts can't steal tokens), authorization (hospital-scoped queries — a user can only see claims for their hospital), audit logging of all patient data access (`SENSITIVE_DATA_ACCESS` audit events), and data minimization (raw LLM responses purged after 30 days, OCR text not exposed via public API). In production, the database would be encrypted at rest and the uploads directory would be outside the web root, served only through authenticated API endpoints."

---

### Q4.3: How do you prevent a user from accessing another hospital's claims?

**Expected Answer**:  
"Every API query is scoped to the authenticated user's `hospital_id`. The JWT payload includes the `hospital_id` after login. The auth middleware injects this into every request. API handlers pass it as a mandatory filter: `SELECT * FROM claims WHERE hospital_id = ? AND id = ?`. Even if a user guesses another hospital's claim ID, the query returns empty because hospital_id doesn't match."

---

## Section 5: Healthcare Domain Questions

### Q5.1: What is a pre-authorization and why does it matter?

**Expected Answer**:  
"Pre-authorization is the insurer's approval for a planned medical procedure before it's performed. In Indian cashless insurance, the hospital needs pre-auth approval before admitting a patient for an elective procedure. Without it, the hospital bears financial risk — the insurer may not pay if the procedure wasn't pre-approved. Pre-auth requires: patient ID, diagnosis, proposed procedure, estimated cost, and supporting clinical notes. The insurer typically responds within 2–4 hours. Our system automates the extraction of these fields from documents and submission to the insurer."

---

### Q5.2: What causes insurance claim rejections in Indian hospitals?

**Expected Answer**:  
"The five main causes: missing clinical documentation (35% of rejections) — the insurer requires specific notes that weren't attached; procedure not covered (25%) — the patient's policy doesn't cover the specific intervention; incorrect ICD-10 code (20%) — the code doesn't match the clinical description or there's a code conflict; late submission (15%) — submitted after the insurer's deadline; and other (5%) — insurer-specific requirements. Our system is specifically designed to prevent the first three categories automatically."

---

### Q5.3: What is an ICD-10 code conflict? Give an example.

**Expected Answer**:  
"A conflict occurs when the diagnosis code and procedure code are medically inconsistent. The example we use is: ICD-10 O80 (Normal Delivery) paired with a C-section procedure code. O80 specifically means uncomplicated vaginal delivery — a C-section cannot produce a normal delivery. The correct code would be O82 (Cesarean section, unspecified). Insurers have automated conflict checkers that reject claims with these mismatches. Our coding module detects them before submission using a conflict rules configuration file."

---

### Q5.4: How does CMCHIS differ from Star Health in terms of claim submission?

**Expected Answer**:  
"CMCHIS is Tamil Nadu's government health scheme — it has specific government portal submission requirements, stricter documentation standards, and no REST API (portal-only submission). Star Health is a private insurer with a REST API for pre-auth and portal access for queries. The ruleset for CMCHIS claims requires additional fields like the patient's ration card number and empanelment ID, and the cost limits are pre-set by the government. Our ruleset configuration system handles this — different JSON files per insurer."

---

## Section 6: OCR Questions

### Q6.1: What is the real accuracy of Tesseract on medical documents?

**Expected Answer**:  
"On high-quality typed English documents at 300 DPI, Tesseract achieves 85–95% accuracy. On real Indian medical documents — which are often scanned at 150 DPI or less, may be photocopied multiple times, and often contain handwritten annotations — accuracy drops to 60–80%. This is the most significant technical risk in the system and is explicitly documented. Our architecture handles this with per-page confidence scoring and routing low-quality documents to human review rather than letting bad OCR corrupt clinical extraction."

**Common Mistake**: Claiming 94% accuracy (the wireframe number) as if it's real.

---

### Q6.2: How do you handle handwritten text in scanned documents?

**Expected Answer**:  
"Tesseract performs poorly on handwriting. Our module heuristically detects pages likely to contain handwriting using texture analysis, flags them in the OCR result as `hasHandwriting = true`, and applies a lower expected confidence. The downstream clinical module (M3) is prompted to treat these sections with reduced weight. For production-grade handwriting recognition, we'd integrate Google Cloud Vision or Microsoft Azure Computer Vision as a specialized step for detected handwritten pages."

---

## Section 7: Whisper Questions

### Q7.1: How does Whisper handle Indian English accents?

**Expected Answer**:  
"Whisper was trained on a multilingual dataset that includes Indian English. Its performance on Indian English is generally good for standard medical consultation vocabulary. The challenges are: code-switching (switching between English and a regional language mid-sentence), very strong regional accents, and high background noise in hospital environments. We address this with: language hint injection (`language: 'en-IN'`), post-processing with a medical vocabulary correction pass, and human transcript review for low-confidence results. We can't claim near-perfect accuracy on real hospital audio — this is a known limitation."

---

### Q7.2: What is your chunking strategy for long audio files?

**Expected Answer**:  
"Whisper's API has a 25MB file size limit. A 2-hour consultation at standard MP3 quality easily exceeds this. Our strategy: split audio into 10-minute chunks using an audio processing library, process each chunk sequentially, then merge the resulting transcripts. We maintain chunk timestamps so segments are correctly ordered and speaker attribution is consistent across chunk boundaries. The timestamp is stored per segment so re-assembly preserves the conversation flow."

---

## Section 8: Gemini Questions

### Q8.1: How do you ensure consistent structured output from Gemini?

**Expected Answer**:  
"Three mechanisms: `responseMimeType: 'application/json'` in the API call — this tells Gemini to return JSON only; providing an explicit JSON schema in the prompt with field names, types, and descriptions; and setting temperature to 0.1 for minimal randomness. Even with all of these, we include JSON parse validation and a corrective retry that adds even stricter JSON enforcement to the prompt. Every extraction result is validated against the expected schema before being written to the database."

---

### Q8.2: How do you version prompts, and why does it matter?

**Expected Answer**:  
"Each prompt template is stored as a file in `server/modules/clinical-structuring/prompts/` with a version in the name: `PRE_AUTH_V1.txt`. Every `claim_structured_data` record stores `prompt_version`. When we improve a prompt and release V2, we can: compare V1 vs V2 extractions on the same documents, measure whether average confidence improved, and identify regressions (cases where V2 does worse than V1). Without prompt versioning, you're flying blind — you can't tell if a prompt change improved or degraded performance across the claim corpus."

---

## Section 9: Playwright Questions

### Q9.1: What is the biggest operational challenge with Playwright portal automation?

**Expected Answer**:  
"Portal UI changes. Insurer portals update their interfaces without notice. When they do, our hardcoded CSS selectors break and submissions fail. This is not hypothetical — it's the primary reason for portal automation's reputation as high-maintenance. Our mitigation: each insurer has its own isolated Playwright script file, so a change to one insurer doesn't affect others. We capture screenshots at each step as audit evidence and failure diagnosis. When a portal fails, we fall back immediately to the MANUAL method rather than retrying endlessly. The long-term fix is using a vision model to identify form fields visually rather than by CSS selectors."

---

### Q9.2: How do you handle CAPTCHA on insurer portals?

**Expected Answer**:  
"We don't. If a portal starts presenting CAPTCHA, the automation route is blocked. Our M8 failure handling detects `PORTAL_CAPTCHA_DETECTED` and switches the claim to the MANUAL method, alerting the claims officer. We don't attempt CAPTCHA solving because: it's technically unreliable, it may violate the insurer's terms of service, and it signals that the insurer is explicitly trying to prevent automation. The honest answer is: CAPTCHA is a hard stop for RPA, and the system falls back to human submission gracefully."

---

## Section 10: n8n Questions

### Q10.1: Why did you choose n8n for orchestration?

**Expected Answer**:  
"The current MVP uses an in-process job queue, not n8n. N8n is the migration target when we need visual workflow editing, multi-step external service coordination, or webhook-based triggers. The design is explicitly migration-compatible: the orchestration module (M6) dispatches to other modules by sending 'trigger next module' events. Currently those events trigger a local job queue function. To migrate to n8n, we'd replace that function with a webhook POST. No module contracts change.

N8n was referenced in the original product vision as the workflow layer between claim processing and insurer submission. It's architecturally appropriate for coordinating the external-facing submission flow."

---

## Section 11: Failure Scenario Questions

### Q11.1: What happens if Gemini goes down for 2 hours?

**Expected Answer**:  
"Claims in `STRUCTURING_IN_PROGRESS` will retry up to 3 times (total ~70 seconds), then enter `STRUCTURING_FAILED`. M7 sends a notification to the claims officer. The M3 module health check returns `degraded`. New claims can still be uploaded and OCR'd, but clinical structuring is paused.

During the outage: claims officers can manually enter structured data for urgent claims (Discharge authorizations, for example) via the data entry screen. When Gemini recovers, failed claims can be manually re-queued. No data is lost — claims are stuck in `STRUCTURING_FAILED`, not deleted.

The `/health` endpoint would show M3 as degraded, alerting the developer immediately."

---

### Q11.2: What happens if an insurer portal changes its login flow?

**Expected Answer**:  
"Playwright's `waitForSelector` for the post-login element will timeout. This triggers `PORTAL_LOGIN_FAILED`. M8 switches the insurer to MANUAL submission for all pending claims. The developer receives an immediate alert with the failure screenshot. Claims officers receive notifications to submit manually.

The fix process: developer examines the failure screenshot, identifies what changed in the portal UI, updates the Playwright script for that insurer (`portals/HDFC_ERGO.ts`), re-tests the connection via the Settings screen, and marks the insurer as active again. Only that insurer's Playwright script needs updating — other insurers are unaffected."

---

### Q11.3: What happens when a claim gets stuck in an AWAITING state for days?

**Expected Answer**:  
"We have defined timeout behaviors per awaiting state. For `AWAITING_HUMAN_APPROVAL`: a 24-hour reminder notification goes to the assigned reviewer, a 48-hour escalation goes to the admin. For `AWAITING_HUMAN_DATA_ENTRY`: 48-hour reminder, then manual admin decision.

These timeouts are implemented as a cron job that runs every hour, queries for claims exceeding their time limits, and sends appropriate notifications. The claim doesn't auto-approve or auto-abandon — that requires explicit human decision. The cron job creates urgency, not automation."

---

## Section 12: Optimization Questions

### Q12.1: How would you reduce the end-to-end claim processing time?

**Expected Answer**:  
"Currently the bottleneck is OCR (24s per doc) + Gemini (8s). Four optimizations:

1. **Parallel document OCR**: Process all documents in a claim simultaneously instead of sequentially — this cuts M2 time proportionally to document count.
2. **Gemini streaming**: Use streaming response to start parsing fields while Gemini is still generating, reducing perceived latency.
3. **Pre-built few-shot examples**: Including 2–3 examples in the Gemini prompt improves accuracy and often reduces total tokens needed, speeding up response time.
4. **Urgent queue priority**: DISCHARGE authorization claims jump to the front of the queue since patients are waiting to leave the hospital.

The human approval step is the hardest to optimize because it depends on human availability. The best lever there is giving reviewers a clean, fast approval UI with all relevant information on one screen."

---

### Q12.2: How would you reduce Gemini API costs?

**Expected Answer**:  
"Gemini costs are proportional to tokens. Optimization strategies: trim OCR text before sending (remove blank lines, repeated whitespace, page headers/footers that add no clinical value), use claim-type-specific prompts that only ask for fields relevant to that claim type, cache common diagnosis → ICD-10 mappings to avoid LLM calls for well-known diagnoses, and use Gemini Flash (faster, cheaper) for structuring with Gemini Pro only for complex cases with multiple unresolved fields.

The long-term cost reduction is a fine-tuned smaller model trained on Indian medical documents — one-time training cost with ongoing inference cost far below the Gemini API."
