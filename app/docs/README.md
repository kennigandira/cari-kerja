# Cari Kerja - Application Documentation

**Project:** Job Application Management System
**Documentation Version:** 1.0
**Last Updated:** October 5, 2025

---

## 📁 Documentation Structure

```
app/docs/
├── README.md (this file)
│
├── technical-decisions/              # Architecture & Technical Decisions
│   ├── TD000_Synthesis_UnifiedApproach.md
│   ├── TD001_General_Architecture.md
│   ├── TD002_Frontend_Architecture.md
│   └── TD003_Backend_Architecture.md
│
└── features/                         # Feature-Specific Documentation
    └── master_profile/
        ├── README.md                 # Feature documentation index
        ├── PRD_MasterProfileCreation.md
        ├── ImplementationPlan.md
        ├── DatabaseSchema.md
        ├── APISpecification.md
        ├── FrontendComponents.md
        └── TestingStrategy.md
```

---

## 🎯 Current Features

### Master Profile Feature (In Development)
**Status:** Planning Complete, Implementation Starting
**Timeline:** 6 weeks to production
**Priority:** P0 (Foundation for all CV generation)

**Documentation:**
- **Start Here:** [features/master_profile/README.md](./features/master_profile/README.md)
- **PRD:** [features/master_profile/PRD_MasterProfileCreation.md](./features/master_profile/PRD_MasterProfileCreation.md)
- **Implementation:** [features/master_profile/ImplementationPlan.md](./features/master_profile/ImplementationPlan.md)

**Key Deliverables:**
- ✅ PRD completed (user stories, acceptance criteria)
- ✅ Technical decisions finalized (4 agent reviews)
- ✅ Database schema designed
- ✅ API specification completed
- ✅ Component architecture defined
- ✅ 6-week implementation plan ready
- ⏳ Development kickoff: Week of Oct 7, 2025

---

## 🏗️ Technical Decisions

### How We Make Decisions

1. **PRD Created** - Product defines requirements
2. **Technical Decision Docs** - Architecture team proposes solutions
3. **Multi-Agent Review** - 4 specialist teams review:
   - Chase: Frontend specialist
   - Foreman: Backend specialist
   - Cameron: Full-stack + UX advocate
   - Risk Analysis: Security & debugging
4. **Synthesis** - Consensus reached, priorities set
5. **Implementation Plan** - Detailed sprint breakdown created

### Master Profile Decisions

**Approved Decisions:**
- Database as source of truth (vs file-based)
- Normalized PostgreSQL schema (8 tables)
- RESTful API with versioning (`/api/v1/...`)
- Vue 3 multi-step wizard for creation
- Async CV extraction with Anthropic Claude
- Optimistic locking for concurrent updates
- WCAG 2.1 AA accessibility compliance

**Critical Fixes Required:**
- Atomic database transactions
- File upload security (magic bytes, malware scan)
- Exponential backoff polling
- Task lifecycle management
- User-friendly error messages

**Read More:** [technical-decisions/TD000_Synthesis_UnifiedApproach.md](./technical-decisions/TD000_Synthesis_UnifiedApproach.md)

---

## 🚀 Quick Links

### For New Developers
1. [Project Overview](/Users/user/Documents/cari-kerja/PROJECT_OVERVIEW.md) - High-level system overview
2. [App README](/Users/user/Documents/cari-kerja/app/README.md) - Setup instructions
3. [CLAUDE.md](/Users/user/Documents/cari-kerja/CLAUDE.md) - Claude Code integration guide

### For Feature Development
1. Start with **PRD** - Understand requirements
2. Read **Technical Decisions** - Understand architecture
3. Follow **Implementation Plan** - Sprint-by-sprint tasks
4. Reference **Component Specs** - Detailed implementation guidance

### For Code Review
1. Check against **PRD acceptance criteria**
2. Verify **API Specification** followed
3. Confirm **Testing Strategy** coverage met
4. Run **Accessibility audit** (axe-core)

---

## 📊 Project Status

| Feature | Status | Documentation | Timeline |
|---------|--------|---------------|----------|
| Master Profile | 📋 Planning Complete | ✅ Complete (7 docs) | 6 weeks |
| Job Kanban | ✅ Live | Needs update | N/A |
| CV Generation | ✅ Live | Needs docs | N/A |
| Cover Letter | ✅ Live | Needs docs | N/A |

---

## 🤝 Contributing to Documentation

### When to Update Docs

**Always update docs when:**
- Adding new features (create PRD + implementation plan)
- Making architectural changes (add to technical decisions)
- Changing APIs (update API specification)
- Adding components (update component specs)

### Documentation Standards

- Use Markdown
- Include code examples
- Add diagrams (ASCII art or Mermaid)
- Keep docs in sync with code
- Version all documents
- Link related documents

---

## 📞 Questions?

**Slack Channels:**
- `#engineering` - General tech questions
- `#master-profile-dev` - Feature-specific questions
- `#docs` - Documentation questions

**Key Contacts:**
- Product Owner: [Name]
- Tech Lead: [Name]
- Documentation: [Name]

---

**Next Feature:** TBD (after Master Profile MVP launch)
