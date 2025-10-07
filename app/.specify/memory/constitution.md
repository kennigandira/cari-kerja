<!--
SYNC IMPACT REPORT
==================
Version Change: Template → 1.0.0
Change Type: MAJOR (Initial constitution ratification)

Principles Established:
- I. Security-First Development
- II. Production-Only Infrastructure
- III. Bun Runtime Standard
- IV. Real-time User Experience
- V. AI-Powered Automation
- VI. Document Lifecycle Management

Sections Added:
- Core Principles (6 principles)
- Technology Stack Requirements
- Quality Standards
- Governance

Templates Status:
✅ spec-template.md - Reviewed, no updates needed (compatible with all principles)
✅ plan-template.md - Reviewed, constitution check section aligns with governance
✅ tasks-template.md - Reviewed, task organization supports principles
✅ agent-file-template.md - Reviewed, no updates needed
✅ checklist-template.md - Assumed compatible (not read)

Follow-up TODOs:
- None - all placeholders filled with concrete values

Notes:
- Ratification date set to today (first constitution)
- Version 1.0.0 reflects stable initial governance
- All principles derived from actual project architecture and requirements
- Governance section includes constitution compliance verification
-->

# Job Kanban Application Constitution

## Core Principles

### I. Security-First Development

**Rule**: All user input MUST be sanitized and validated. All API endpoints MUST implement authentication, rate limiting, and CSRF protection. Security headers MUST be configured in production deployments.

**Rationale**: This application handles sensitive personal information (CVs, cover letters, API keys) and integrates with external services (Anthropic API, Supabase). Security breaches could expose confidential job application data, credentials, or enable unauthorized AI service usage. Defense-in-depth prevents data leaks and abuse.

**Implementation Requirements**:
- Input validation using `useValidation` composable (frontend)
- Middleware stack: `auth.ts`, `rate-limit.ts`, `csrf-protection.ts`, `security-headers.ts` (workers)
- DOMPurify for HTML sanitization
- Supabase Row Level Security (RLS) policies
- API key rotation and secret management via Cloudflare Workers secrets

### II. Production-Only Infrastructure

**Rule**: This project uses Supabase production environment exclusively. All development, testing, and production workloads run against the same Supabase instance. Local Supabase development is NOT supported.

**Rationale**: Simplifies infrastructure management for a personal job search application. Single-source-of-truth for application data eliminates sync complexity. Supabase's generous free tier supports development needs without requiring local setup.

**Constraints**:
- No `supabase start` or local development commands
- Migrations applied directly to production via Supabase dashboard
- No local seed data or test fixtures
- Environment variables point to production Supabase project

### III. Bun Runtime Standard

**Rule**: All package management, script execution, and local development MUST use Bun instead of npm. The project standard is `bun install`, `bun run dev`, `bun run build`.

**Rationale**: Bun provides faster dependency installation, superior TypeScript support, and better developer experience compared to Node.js/npm. Reduces build times and simplifies tooling configuration.

**Affected Areas**:
- Frontend development: `bun run dev` (Vite dev server)
- Workers development: Uses Bun for local testing
- Dependency management: `bun.lock` instead of `package-lock.json`
- CI/CD pipelines should use Bun where possible

### IV. Real-time User Experience

**Rule**: All application state changes (job status updates, document generation progress, kanban movements) MUST propagate to the UI in real-time using Supabase Realtime subscriptions. No manual refresh required.

**Rationale**: Job application tracking requires immediate feedback when background workers complete CV/cover letter generation. Users must see status changes without polling or page refreshes. Real-time updates create responsive, desktop-app-like UX.

**Technical Requirements**:
- Supabase Realtime enabled for `jobs`, `job_documents`, `processing_queue` tables
- Vue composables subscribe to relevant channels on component mount
- Optimistic UI updates for drag-and-drop operations
- WebSocket connection health monitoring

### V. AI-Powered Automation

**Rule**: All document generation (CV tailoring, cover letter writing, job analysis) MUST be handled by Claude AI (Anthropic API) via asynchronous background workers. No manual document creation.

**Rationale**: The core value proposition is automated, intelligent job application document generation. AI analysis ensures CVs match job requirements and cover letters are professionally written. Background processing prevents UI blocking during API calls.

**Processing Pipeline**:
- Job URL/description → Extract job info → Calculate match percentage
- Generate CV (tailored) → Generate cover letter (max 350 words)
- Review CV (skeptical review) → Review cover letter (skeptical review)
- Update status to "To Submit" when complete
- All steps run via Cloudflare Workers cron jobs (5-minute intervals)

### VI. Document Lifecycle Management

**Rule**: Each job application maintains versioned documents (initial, reviewed, regenerated) with full audit trail. Users can request regeneration with feedback. All documents stored in Supabase Storage (`job-documents` bucket).

**Rationale**: Enables iterative refinement of application materials. Skeptical review process catches inaccuracies. Regeneration with feedback allows users to request specific changes. Version history preserves audit trail.

**Document Types**:
- `initial_cv_url` / `reviewed_cv_url` / `regenerated_cv_url`
- `initial_cover_letter_url` / `reviewed_cover_letter_url` / `regenerated_cover_letter_url`
- Markdown format (future: LaTeX compilation to PDF)
- Public access URLs for easy download

## Technology Stack Requirements

**Frontend**:
- Vue 3 (Composition API) + TypeScript
- Vite build tool
- Pinia state management
- Tailwind CSS 4.x
- Supabase JS client
- VueDraggable for kanban (future)

**Backend**:
- Cloudflare Workers (Hono framework)
- Bun runtime for local development
- TypeScript (strict mode)
- JWT authentication (`@tsndr/cloudflare-worker-jwt`)

**Data Layer**:
- Supabase (PostgreSQL database + Storage + Realtime)
- Production-only (no local instance)
- Row Level Security policies

**AI Integration**:
- Anthropic Claude API (document generation)
- Async processing via Cloudflare Workers cron

**Deployment**:
- Frontend: Cloudflare Pages
- Workers: Cloudflare Workers (cron every 5 minutes)
- Database: Supabase hosted

## Quality Standards

### Performance
- Frontend: First Contentful Paint < 1.5s
- API: p95 latency < 500ms for non-AI endpoints
- Real-time: WebSocket reconnection < 3s on disconnect
- AI processing: Full pipeline (6 steps) < 15 minutes

### Security
- All secrets stored in Cloudflare Workers environment (never committed)
- HTTPS enforced in production
- CORS configured for known origins only
- Supabase RLS policies enforce user data isolation
- Rate limiting: 100 requests/5min per IP

### Reliability
- Workers cron jobs: Retry failed tasks up to 3 times
- Processing queue: Mark tasks as failed after max retries
- Error logging: All failures logged with context
- Graceful degradation: UI functional even if real-time fails

### Code Quality
- TypeScript strict mode enabled
- No nested ternary expressions (per project standards)
- Linting: Standard Vue/TypeScript rules
- No `.history` folders committed
- Meaningful constant names (extract before passing to components)

## Governance

### Amendment Procedure
1. Propose change via pull request to `constitution.md`
2. Document rationale and affected systems
3. Update dependent templates (`spec-template.md`, `plan-template.md`, `tasks-template.md`)
4. Increment version per semantic versioning
5. Update `LAST_AMENDED_DATE` to amendment date

### Versioning Policy
- **MAJOR**: Principle removal, incompatible governance changes (e.g., switching from Bun to npm)
- **MINOR**: New principle added, section expansion (e.g., adding security principle)
- **PATCH**: Clarifications, typo fixes, non-semantic updates

### Compliance Verification
- All feature specs MUST reference constitution in requirements section
- All implementation plans MUST include "Constitution Check" gate
- Code reviews MUST verify adherence to security, runtime, and quality principles
- Violations require explicit justification in plan's "Complexity Tracking" section

### Development Guidance
Runtime development guidance is maintained in the agent file template (`.specify/templates/agent-file-template.md`). The constitution defines WHAT is required; the agent file defines HOW to implement it for active technologies.

**Version**: 1.0.0 | **Ratified**: 2025-10-08 | **Last Amended**: 2025-10-08
