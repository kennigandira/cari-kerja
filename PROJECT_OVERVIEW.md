# Cari Kerja - AI-Powered Job Application Management System

> **"Cari Kerja"** (Indonesian: "Job Search") - A comprehensive, AI-driven system for managing job applications, generating tailored CVs, and tracking the hiring pipeline for Senior Frontend Engineer positions.

**Owner:** Kenni Gandira Alamsyah
**Focus:** Senior Frontend Engineer (React, TypeScript, GraphQL)
**Locations:** Bangkok, Thailand | Remote (Global) | Indonesia
**Status:** Active Job Search (22+ Applications Generated)

---

## 📋 Table of Contents

- [System Architecture](#-system-architecture)
- [Directory Structure](#-directory-structure)
- [Features & Workflows](#-features--workflows)
- [Technology Stack](#-technology-stack)
- [Quick Start Guide](#-quick-start-guide)
- [Available Tools & Commands](#-available-tools--commands)
- [Project Statistics](#-project-statistics)
- [Key Resources](#-key-resources)

---

## 🏗️ System Architecture

This project operates in **two modes**:

```
┌─────────────────────────────────────────────────────────────┐
│                     CARI KERJA SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────┐         ┌─────────────────────┐    │
│  │   MANUAL MODE      │         │    WEB APP MODE     │    │
│  │                    │         │                     │    │
│  │  Claude Code CLI   │         │  Vue 3 Frontend     │    │
│  │  + AI Agents       │         │  + Supabase DB      │    │
│  │  + LaTeX           │         │  + CF Workers       │    │
│  │                    │         │  + Realtime Sync    │    │
│  │  ↓                 │         │  ↓                  │    │
│  │  Single Job        │         │  Multi-Job Pipeline │    │
│  │  Full Control      │         │  Automated Tracking │    │
│  └────────────────────┘         └─────────────────────┘    │
│                                                              │
│           Both modes use the same AI agents                 │
│           Source of Truth: 01_Profile/master_profile.md     │
└─────────────────────────────────────────────────────────────┘
```

### Mode 1: Manual Workflow (Claude Code)

**Use Case:** High-priority applications requiring full control and customization

- **Tool:** `/cv_letsgo` slash command
- **Process:** Job URL/Text → Extract → Match → Generate CV/CL → Review → LaTeX → PDF
- **Output:** Complete application folder with all versions (.md, .tex, .pdf)
- **Time:** ~2-3 minutes per application (vs ~30 min manual)

### Mode 2: Web Application

**Use Case:** Bulk job processing, pipeline tracking, ongoing application management

- **Tech:** Vue 3 + Supabase + Cloudflare Workers
- **Process:** Kanban board for tracking application stages
- **Features:** Real-time updates, document regeneration, drag-and-drop tracking
- **Deployment:** Cloudflare Pages (Frontend) + Cloudflare Workers (Backend)

---

## 📁 Directory Structure

```
cari-kerja/
│
├── 01_Profile/                      # 📊 Master Data (Source of Truth)
│   ├── master_profile.md            # Complete professional profile
│   └── current_cv/                  # Latest CV versions
│
├── 02_Portfolio/                    # 🎨 Portfolio & Work Samples
│   ├── greatfrontend-projects/      # GreatFrontend course projects
│   └── work-projects/               # Professional work highlights
│
├── 03_CV_Templates/                 # 📝 LaTeX Templates
│   ├── master_cv.tex                # Base CV template
│   ├── cover_letter_template.tex    # Cover letter template
│   └── *.tex variants               # Specialized templates
│
├── 04_Applications/                 # 🎯 Generated Applications (22+)
│   ├── Buffer_SeniorProductEngineer_2025-10-01/
│   │   ├── job-spec.md              # Job description + match analysis
│   │   ├── buffer-*-cv.{md,tex,pdf}
│   │   ├── reviewed-buffer-*-cv.{md,tex,pdf}
│   │   ├── buffer-cover-letter-*.{md,tex,pdf}
│   │   └── reviewed-buffer-cover-letter-*.{md,tex,pdf}
│   └── [22+ other companies]/
│
├── 05_Tracking/                     # 📈 Application Tracking
│   ├── applications_tracker.md      # Manual tracking log
│   └── job_opportunities_*.md       # Job search notes
│
├── app/                             # 🚀 Web Application
│   ├── frontend/                    # Vue 3 + TypeScript + Tailwind
│   │   ├── src/
│   │   │   ├── components/         # Vue components
│   │   │   ├── views/              # KanbanView, JobDetailView
│   │   │   ├── stores/             # Pinia state management
│   │   │   └── composables/        # Vue composables
│   │   └── package.json
│   │
│   ├── workers/                     # Cloudflare Workers (Backend)
│   │   ├── src/
│   │   │   ├── handlers/           # API handlers
│   │   │   ├── services/           # AI service integrations
│   │   │   └── index.ts            # Cron job scheduler
│   │   └── wrangler.toml
│   │
│   ├── supabase/                    # Database Schema
│   │   └── migrations/              # SQL migrations
│   │
│   └── shared/                      # Shared TypeScript Types
│       └── types.ts                 # Job, Document, Queue types
│
└── .claude/                         # 🤖 AI Automation
    ├── agents/                      # Specialized AI agents
    │   ├── cv_tailor_agent/         # Python CV generation agent
    │   ├── cv-skeptical-reviewer.md # Accuracy checker
    │   ├── cv-optimistic-reviewer.md
    │   ├── job-search-specialist.md
    │   └── [10+ other agents]
    │
    └── commands/                    # Slash commands
        ├── cv_letsgo.md             # Main CV generation workflow
        ├── security-check.md        # Security audit
        └── cari-kerja-letsgo.md     # Job search automation
```

---

## ✨ Features & Workflows

### Manual Workflow: `/cv_letsgo`

**Command:** `/cv_letsgo <job_url_or_description>`

**Process Flow:**

```
1. Extract Job Information
   ↓ Parse URL or analyze text input
   ↓ Extract: company, position, requirements, tech stack

2. Calculate Match Percentage
   ↓ Analyze against master_profile.md
   ↓ Score: Skills, Experience, Requirements alignment
   ↓ Output: Detailed match analysis (Strengths, Gaps, Partial Matches)

3. Generate Tailored CV
   ↓ cv-tailor-specialist agent
   ↓ Emphasize relevant experience
   ↓ Rephrase (never fabricate) achievements
   ↓ Output: company-position-cv.md

4. Generate Cover Letter
   ↓ Max 200-250 words (one page)
   ↓ Match tone to company culture
   ↓ Output: company-cover-letter-position-Kenni.md

5. Skeptical Review
   ↓ cv-skeptical-reviewer agent
   ↓ Check for exaggerations, fabrications
   ↓ Ensure collaborative language
   ↓ Output: reviewed-*.md versions

6. Convert to LaTeX
   ↓ Remove problematic commands (\pdfgentounicode, etc.)
   ↓ Apply template formatting
   ↓ Output: *.tex files (4 total)

7. Compile PDFs
   ↓ tectonic compiler
   ↓ Output: 4 PDFs (initial + reviewed CV + cover letters)

Final Output: 13 files per application
```

**Example Results (Buffer Application):**

- **Match Score:** 88%
- **Strengths:** React/TypeScript/GraphQL expertise, performance optimization, growth results
- **Time:** 2 minutes (automated)
- **Files Generated:** 13 (job-spec.md + 4 versions × 3 formats)

### Web Application Workflow

**Access:** Kanban board interface (Vue 3 app)

**Pipeline Stages:**

```
┌─────────────┐   ┌──────────────┐   ┌──────────┐   ┌─────────────┐
│ Processing  │ → │  To Submit   │ → │ Waiting  │ → │   Ongoing   │
│             │   │              │   │ for Call │   │             │
└─────────────┘   └──────────────┘   └──────────┘   └─────────────┘
                                                            │
                                              ┌─────────────┴─────────────┐
                                              ↓                           ↓
                                        ┌──────────┐              ┌──────────┐
                                        │ Success  │              │ Not Now  │
                                        └──────────┘              └──────────┘
```

**Features:**

- **🎯 Single Input:** Paste job URL or full description
- **⚡ Auto-Processing:** Extracts info → Calculates match → Generates docs
- **🔄 Real-time Updates:** Supabase Realtime (watch CVs generate live)
- **📦 Document Versions:** Initial, Reviewed, Regenerated (with feedback)
- **🎨 Kanban Board:** Drag-and-drop application tracking
- **📥 Download PDFs:** All documents downloadable
- **🔁 Regeneration:** Request changes with specific feedback

**Processing Tasks (Automated by Cloudflare Workers):**

1. `extract_job_info` - Parse job posting
2. `calculate_match` - Analyze fit percentage
3. `generate_cv` - Create tailored CV
4. `generate_cover_letter` - Write cover letter
5. `review_cv` - Skeptical review for accuracy
6. `review_cover_letter` - Skeptical review
7. `compile_pdf` - LaTeX → PDF (planned)
8. `sync_to_filesystem` - Save to `04_Applications/` (planned)

**Cron Schedule:** Every 5 minutes (processes pending tasks)

---

## 🛠️ Technology Stack

### Frontend (Vue 3 App)

| Technology | Purpose | Version |
|------------|---------|---------|
| **Vue 3** | UI framework | ^3.5.22 |
| **TypeScript** | Type safety | ~5.9.3 |
| **Vite** | Build tool | ^7.1.7 |
| **Pinia** | State management | ^3.0.3 |
| **Vue Router** | Routing | ^4.5.1 |
| **Tailwind CSS** | Styling | ^4.1.14 |
| **@supabase/supabase-js** | Database client | ^2.58.0 |
| **@vueuse/core** | Vue utilities | ^13.9.0 |
| **vuedraggable** | Drag & drop | ^4.1.0 |

### Backend (Cloudflare Workers)

| Technology | Purpose |
|------------|---------|
| **Cloudflare Workers** | Serverless compute |
| **Bun** | JavaScript runtime |
| **Cron Triggers** | Scheduled task processing |
| **Supabase** | PostgreSQL database |
| **Anthropic API** | Claude AI integration |

### Database (Supabase)

**Tables:**
- `jobs` - Job postings with metadata and kanban status
- `job_documents` - CV and cover letter versions
- `regeneration_requests` - User feedback for regeneration
- `processing_queue` - Background task queue

**Storage:**
- `job-documents` bucket - PDFs, markdown, LaTeX files

**Features:**
- Realtime subscriptions for live updates
- Row Level Security (RLS) policies
- Service role for worker access

### Document Processing

| Tool | Purpose |
|------|---------|
| **tectonic** | LaTeX → PDF compilation |
| **Markdown** | Human-readable format |
| **LaTeX** | Professional typesetting |

### AI Agents (Claude API)

| Agent | Purpose |
|-------|---------|
| **cv-tailor-specialist** | Generate tailored CVs |
| **cv-skeptical-reviewer** | Accuracy verification |
| **cv-optimistic-reviewer** | Maximize impact |
| **cv-reviewer-manager** | Synthesize reviews |
| **job-search-specialist** | Job discovery automation |

---

## 🚀 Quick Start Guide

### Manual Workflow (Claude Code)

**Prerequisites:**
- Claude Code CLI installed
- `tectonic` LaTeX compiler installed

**Usage:**

```bash
# 1. Navigate to project
cd /Users/user/Documents/cari-kerja

# 2. Run CV generation workflow
/cv_letsgo https://example.com/job-posting

# Or with job description text:
/cv_letsgo "Senior Frontend Engineer at XYZ Corp..."

# 3. Output generated in:
# 04_Applications/CompanyName_Position_Date/
```

**What happens:**
1. Creates application folder
2. Generates job-spec.md with match analysis
3. Creates tailored CV and cover letter
4. Runs skeptical review
5. Converts to LaTeX
6. Compiles 4 PDFs
7. Total time: ~2-3 minutes

### Web Application Setup

**Prerequisites:**
- Bun installed
- Supabase account
- Cloudflare account
- Anthropic API key

**Frontend Setup:**

```bash
cd app/frontend

# Install dependencies
bun install

# Create .env file
cat > .env << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
EOF

# Run development server
bun run dev

# Build for production
bun run build
```

**Workers Setup:**

```bash
cd app/workers

# Install dependencies
bun install

# Login to Cloudflare
bunx wrangler login

# Set secrets
bunx wrangler secret put SUPABASE_URL
bunx wrangler secret put SUPABASE_SERVICE_KEY
bunx wrangler secret put ANTHROPIC_API_KEY

# Deploy
bunx wrangler deploy
```

**Database Setup:**

1. Create Supabase project
2. Run migration: `app/supabase/migrations/001_initial_schema.sql`
3. Create `job-documents` storage bucket (public)
4. Enable Realtime for `jobs` and `job_documents` tables

---

## 🤖 Available Tools & Commands

### Slash Commands

**Location:** `.claude/commands/`

| Command | Description | Usage |
|---------|-------------|-------|
| `/cv_letsgo <url\|text>` | Complete CV generation workflow | Main automation tool |
| `/security-check [area]` | Comprehensive security audit | Code quality check |
| `/cari-kerja-letsgo` | Job search specialist workflow | Job discovery |

### AI Agents

**Location:** `.claude/agents/`

| Agent | Type | Purpose |
|-------|------|---------|
| `cv-tailor-specialist` | CV Generation | Creates tailored CVs from job descriptions |
| `cv-skeptical-reviewer` | Quality Control | Reviews for accuracy, no exaggerations |
| `cv-optimistic-reviewer` | Enhancement | Maximizes impact while staying truthful |
| `cv-reviewer-manager` | Synthesis | Combines optimistic + skeptical feedback |
| `job-search-specialist` | Discovery | Automated job search and matching |
| `foreman-backend-specialist` | Development | Backend architecture and best practices |
| `security-auditor` | Security | Security review and compliance |
| `ui-ux-designer` | Design | Design systems and user research |
| `prompt-engineer` | AI Optimization | Advanced prompting and LLM optimization |

### Python Agent (cv_tailor_agent)

**Location:** `.claude/agents/cv_tailor_agent/`

**Features:**
- Standalone Python script for CV generation
- Interactive mode with prompts
- File-based job description input
- Template-based CV creation

**Usage:**

```bash
cd .claude/agents/cv_tailor_agent

# Interactive mode
python3 cv_tailor.py --interactive

# With job file
python3 cv_tailor.py --job-file job.txt --company "Buffer"
```

---

## 📊 Project Statistics

### Applications Generated

- **Total Applications:** 22+
- **Average Match Score:** ~85-90%
- **Time Saved:** ~30 min → 2 min per application (93% reduction)
- **Success Rate:** Tracking in progress

### Recent Applications (Sample)

| Company | Position | Match % | Date | Status |
|---------|----------|---------|------|--------|
| Buffer | Senior Product Engineer (Frontend) | 88% | Oct 1, 2025 | To Submit |
| TikTok | Frontend Software Engineer - Growth | 92% | Jul 27, 2025 | Waiting for Call |
| Agoda | Frontend Engineer | 85% | Jul 27, 2025 | To Submit |
| CSG | Lead Frontend Engineer | 87% | Oct 5, 2025 | Processing |

### Document Output per Application

- 1 × Job specification with match analysis
- 2 × CV versions (initial + reviewed)
- 2 × Cover letter versions (initial + reviewed)
- 3 × Formats per document (Markdown, LaTeX, PDF)
- **Total:** 13 files per application

---

## 🎯 Project Goals & Focus

### Target Roles

- **Primary:** Senior Frontend Engineer
- **Secondary:** Lead Frontend Engineer, Staff Engineer
- **Specializations:** React, TypeScript, GraphQL, Performance Optimization

### Tech Stack Focus

**Core Skills:**
- React.js, TypeScript, JavaScript (ES6+)
- Next.js, Vue.js
- GraphQL (Apollo Client), REST APIs
- Redux, Pinia, React Query

**Performance:**
- Core Web Vitals optimization
- Bundle size optimization
- Code splitting, lazy loading

**Testing:**
- Jest, React Testing Library
- Cypress, Playwright
- Storybook component testing

**Build Tools:**
- Webpack, Vite
- npm, Bun
- CI/CD pipelines

### Location Preferences

1. **Bangkok, Thailand** - Primary location (current residence)
2. **Remote (Global)** - Fully remote opportunities
3. **Indonesia** - Bandung, Jakarta, Bali
4. **APAC Region** - Singapore, Malaysia, Philippines

### Salary Expectations

- **Bangkok/Remote APAC:** $60K - $100K USD
- **Remote US/EU:** $100K - $150K USD
- **Equity consideration:** Yes (for startups)

---

## 🔗 Key Resources

### Internal Documentation

- [Master Profile](01_Profile/master_profile.md) - Complete professional profile
- [Web App README](app/README.md) - Full-stack application guide
- [Frontend README](app/frontend/README.md) - Vue 3 app documentation
- [Workers README](app/workers/README.md) - Cloudflare Workers guide
- [CV Tailor Agent](. claude/agents/cv_tailor_agent/README.md) - Python agent docs
- [CLAUDE.md](CLAUDE.md) - Project instructions for Claude Code

### External Links

- **LinkedIn:** [linkedin.com/in/kenni-g-alamsyah](https://www.linkedin.com/in/kenni-g-alamsyah)
- **GitHub:** [github.com/devkennis](https://github.com/devkennis)
- **Portfolio:** GreatFrontend projects (02_Portfolio/)

### Supabase Project

- **URL:** https://your-project.supabase.co
- **Tables:** jobs, job_documents, regeneration_requests, processing_queue
- **Storage:** job-documents bucket
- **Realtime:** Enabled for live updates

### Cloudflare

- **Pages:** Frontend deployment
- **Workers:** Backend cron jobs (every 5 minutes)
- **Secrets:** SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY

---

## 📝 Workflow Best Practices

### Manual Workflow (`/cv_letsgo`)

**When to use:**
- High-priority companies (FAANG, top startups)
- Roles requiring heavy customization
- When you want full control over every detail
- Time-sensitive applications

**Quality Checks:**
1. ✅ All metrics verified against master_profile.md
2. ✅ No fabricated achievements
3. ✅ Collaborative language ("contributed to" vs "led")
4. ✅ Cover letter fits on one page (200-250 words)
5. ✅ LaTeX compiles without errors
6. ✅ PDFs are properly formatted

### Web Application

**When to use:**
- Bulk job processing (10+ jobs)
- Ongoing pipeline tracking
- Jobs requiring less customization
- Systematic application management

**Best Practices:**
1. Add jobs in batches (5-10 at a time)
2. Let processing complete before reviewing
3. Download and verify PDFs before submitting
4. Use regeneration for minor tweaks
5. Track application status diligently
6. Archive rejected applications to "Not Now"

---

## 🔄 Continuous Improvement

### Planned Features

**Web Application:**
- [ ] Drag-and-drop Kanban reordering
- [ ] PDF preview in modal
- [ ] LaTeX compilation in workers
- [ ] Filesystem sync to `04_Applications/`
- [ ] Email integration for direct submission
- [ ] Analytics dashboard (success rate, response time)
- [ ] Chrome extension for one-click capture

**Manual Workflow:**
- [ ] Auto-detect job board type (LinkedIn, Indeed, etc.)
- [ ] Company research automation
- [ ] Salary negotiation script generator
- [ ] Interview preparation agent
- [ ] Follow-up email templates

### Known Issues

1. **Web App:** LaTeX compilation not yet implemented in workers
2. **Manual:** Requires manual tectonic installation
3. **Both:** No automatic application submission

---

## 📞 Support & Contact

**Project Owner:** Kenni Gandira Alamsyah
**Email:** devkenni.g@gmail.com
**Location:** Bangkok, Thailand
**LinkedIn:** [linkedin.com/in/kenni-g-alamsyah](https://www.linkedin.com/in/kenni-g-alamsyah)

---

## 📜 License

**MIT License** - Personal project for job search management

---

## 🙏 Acknowledgments

- **Anthropic Claude** - AI agents and automation
- **Supabase** - Database and realtime infrastructure
- **Cloudflare** - Hosting and serverless workers
- **GreatFrontEnd** - Portfolio projects and learning
- **tectonic** - LaTeX compilation

---

**Last Updated:** October 5, 2025
**Version:** 1.0
**Status:** ✅ Active Development & Job Search
