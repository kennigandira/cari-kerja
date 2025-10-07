<!--
Sync Impact Report:
Version: 0.0.0 → 1.0.0
Rationale: Initial constitution creation - MAJOR version for foundational governance framework

Modified Principles:
- NEW: I. Factual Accuracy (Truth-First)
- NEW: II. Professional Quality Standards
- NEW: III. Automation & Efficiency
- NEW: IV. Privacy & Security
- NEW: V. Continuous Improvement

Added Sections:
- Core Principles (5 principles)
- Quality Assurance
- Development Workflow
- Governance

Removed Sections: None (initial version)

Templates Status:
✅ spec-template.md - Reviewed, no updates needed (template is generic)
✅ plan-template.md - Reviewed, constitution check placeholder already present
✅ tasks-template.md - Reviewed, task structure aligns with principles
⚠️  No commands/ directory found - will be created when needed

Follow-up TODOs: None
-->

# Job Search System Constitution

## Core Principles

### I. Factual Accuracy (Truth-First)

**MUST** source all professional data exclusively from `/Users/user/Documents/cari-kerja/01_Profile/master_profile.md`. **MUST NOT** fabricate, embellish, or invent achievements, metrics, job titles, dates, or technical skills. **MUST** use collaborative language ("contributed to", "participated in") rather than claiming sole ownership unless explicitly documented in master profile.

**Rationale**: Credibility and honesty are paramount in job applications. False claims damage professional reputation and can lead to immediate disqualification or termination. All data must be verifiable against LinkedIn profile and employment records.

### II. Professional Quality Standards

**MUST** ensure all generated documents meet professional standards:
- CVs: LaTeX files **MUST** compile without errors using tectonic or pdflatex
- Cover Letters: **MUST** be 300-350 words maximum (one page)
- PDFs: **MUST** be properly formatted, readable, and print-ready
- Application Structure: **MUST** follow the standardized folder pattern defined in CLAUDE.md
- File Naming: **MUST** use consistent, descriptive naming conventions

**Rationale**: First impressions matter. Poorly formatted documents, compilation errors, or inconsistent structure reflect negatively on technical competence and attention to detail.

### III. Automation & Efficiency

**MUST** prioritize automation for repetitive tasks:
- CV tailoring workflows **MUST** use Python scripts or slash commands
- Job search **MUST** leverage automated discovery tools
- Application tracking **MUST** be systematically maintained
- Browser automation **MUST** use MCP chrome-devtools for web interactions
- Bulk operations **MUST** be scripted rather than manual

**Rationale**: Job searching is time-intensive. Automation reduces repetitive work, minimizes human error, and allows focus on high-value activities like company research and interview preparation.

### IV. Privacy & Security

**MUST** protect sensitive personal information:
- Contact details (phone, email) **MUST NOT** be committed to public repositories
- Application tracking **MUST NOT** expose company communications or proprietary information
- API keys, tokens, credentials **MUST** be stored in environment variables or secure vaults
- Personal notes about companies **MUST** remain in local-only directories

**Rationale**: Job search involves sharing personal data across multiple platforms. Protecting privacy prevents identity theft, spam, and unauthorized contact. Respecting company confidentiality maintains professional ethics.

### V. Continuous Improvement

**MUST** maintain systematic learning and refinement:
- Track application outcomes (interview rate, response time, success patterns)
- Review and update master profile quarterly with new skills and achievements
- Refine CV templates based on recruiter feedback and market trends
- Document learnings from interviews and rejections
- Update automation scripts based on platform changes

**Rationale**: Job markets evolve. Continuous improvement of materials, skills, and strategies increases success rates over time. Systematic tracking provides data-driven insights for optimization.

## Quality Assurance

### Pre-Submission Validation

All applications **MUST** pass these checks before submission:

1. **Factual Verification**: Cross-reference all claims against master_profile.md
2. **Compilation Test**: LaTeX files **MUST** compile cleanly
3. **Review Process**: CVs **MUST** undergo skeptical review (cv-skeptical-reviewer agent)
4. **Company Research**: Job specification **MUST** include match analysis and company context
5. **Completeness**: Application folder **MUST** contain all required artifacts (CV, cover letter, job spec)

### Review Workflow

1. **Initial Draft**: Generate tailored CV and cover letter from job description
2. **Skeptical Review**: Agent validates claims, checks for exaggeration, ensures accuracy
3. **Compilation**: Generate PDFs and verify formatting
4. **Final Check**: Human review of final PDFs before submission
5. **Tracking Update**: Record application in tracking system with submission date

## Development Workflow

### File Organization

**MUST** adhere to the five-directory structure:
- `01_Profile/` - Single source of truth for professional data
- `02_Portfolio/` - Read-only showcase of completed projects
- `03_CV_Templates/` - LaTeX templates only (no generated CVs)
- `04_Applications/` - One folder per company/position with dated naming
- `05_Tracking/` - Centralized logs and opportunity lists

### Automation Commands

**MUST** use standardized slash commands:
- `/cv_letsgo` - Complete CV tailoring workflow (job description → reviewed PDFs)
- `/cari-kerja-letsgo` - Job search automation (discovery → opportunity list)

### Technology Stack

**MUST** use these tools consistently:
- **LaTeX Compilation**: tectonic (primary), pdflatex (fallback)
- **Python**: Python 3.x for cv_tailor.py automation
- **Browser Automation**: MCP chrome-devtools for web scraping and form filling
- **Version Control**: Git for tracking changes (excluding personal data)

### Platform Integration

**MUST** support these job platforms:
- LinkedIn Jobs (primary)
- Jobstreet (Thailand/Indonesia)
- Glints, Indeed, Remote.co
- AngelList/Wellfound
- Company career pages (direct applications preferred)

## Governance

### Amendment Process

1. **Proposal**: Document proposed change with rationale in constitution comment or PR
2. **Impact Analysis**: Identify affected templates, scripts, and workflows
3. **Version Bump**: Follow semantic versioning (MAJOR.MINOR.PATCH)
4. **Template Sync**: Update all dependent templates and documentation
5. **Migration**: Update existing applications/tracking to comply (if applicable)
6. **Approval**: User explicitly approves constitution changes
7. **Commit**: Atomic commit with constitution + template updates

### Versioning Policy

- **MAJOR**: Principle removal, redefinition, or backward-incompatible governance changes
- **MINOR**: New principle added, substantial expansion of existing principle
- **PATCH**: Clarifications, wording improvements, typo fixes

### Compliance Verification

All AI agents and automation scripts **MUST**:
- Reference this constitution in their system prompts
- Validate outputs against relevant principles before delivery
- Flag potential violations for human review
- Document compliance checks in agent execution logs

### Conflict Resolution

Priority order when guidance conflicts:
1. This Constitution (highest authority)
2. CLAUDE.md (project-specific guidance)
3. Master Profile (data source of truth)
4. Template defaults (lowest authority)

**Version**: 1.0.0 | **Ratified**: 2025-10-08 | **Last Amended**: 2025-10-08
