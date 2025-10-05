# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a job search management system for a Frontend Engineer with 8+ years of experience. The project manages CV customization, application tracking, and job search automation for positions primarily in Bangkok, Thailand and remote opportunities.

## Project Structure

### Core Directories
- **01_Profile/** - Master professional profile and LinkedIn data
- **02_Portfolio/** - GreatFrontend projects and work highlights
- **03_CV_Templates/** - LaTeX CV templates and cover letter templates
- **04_Applications/** - Individual company applications with tailored CVs and cover letters
- **05_Tracking/** - Application tracking and job search logs

### Automation System
- **.claude/agents/** - Specialized agents for CV tailoring and job search
  - `cv_tailor_agent/cv_tailor.py` - Python script for automated CV generation
  - `cv-skeptical-reviewer.md` - Agent for reviewing CV content for accuracy
  - `job-search-specialist.md` - Agent for automated job discovery
- **.claude/commands/** - Slash commands for automated workflows
  - `cv_letsgo.md` - Complete CV tailoring workflow
  - `cari-kerja-letsgo.md` - Job search specialist workflow

### MCP Servers
- **.claude/.mcp.json** - MCP (Model Context Protocol) server configuration
  - **chrome-devtools** - Chrome DevTools MCP server for browser automation
    - Enables browser automation and inspection via Claude Code
    - Provides 26 tools for performance analysis, network inspection, screenshots, and debugging
    - Requires Node.js v20.19+ and Chrome browser
    - Useful for automating application forms, testing portfolio sites, and documenting job postings

## Common Commands

### CV Generation and LaTeX Compilation
```bash
# Compile LaTeX CV to PDF using tectonic
tectonic your-cv.tex

# Alternative with pdflatex
pdflatex your-cv.tex
```

### Python CV Automation
```bash
# Run the CV tailoring agent interactively
cd .claude/agents/cv_tailor_agent
python3 cv_tailor.py --interactive

# Run with job description file
python3 cv_tailor.py --job-file job.txt --company "Company Name"
```

### Slash Commands
Use these Claude Code slash commands for automated workflows:
- `/cv_letsgo` - Complete CV tailoring workflow from job description to final PDFs
- `/cari-kerja-letsgo` - Automated job search and opportunity discovery

## Development Guidelines

### Master Profile Data Source
All CV and application data MUST be sourced from `/Users/user/Documents/cari-kerja/01_Profile/master_profile.md`. Never fabricate achievements, numbers, or experience details.

### CV Templates
LaTeX templates are located in `03_CV_Templates/`:
- `master_cv.tex` - Base template with full work history
- `claude_edit.tex` and `gemini_final_edit.tex` - Specialized versions
- `cover_letter_template.tex` - LaTeX cover letter template

### Application Structure
Each application in `04_Applications/` follows this pattern:
```
CompanyName_Position_Date/
├── job-spec.md                                    # Job description and match analysis
├── company-position-cv.md/.tex/.pdf              # Initial tailored CV
├── reviewed-company-position-cv.md/.tex/.pdf     # Skeptically reviewed CV
├── company-cover-letter-position-Kenni.md/.tex/.pdf
└── reviewed-company-cover-letter-position-Kenni.md/.tex/.pdf
```

### Quality Standards
- All achievements and metrics must match master profile data exactly
- Cover letters must be 300-350 words maximum (one page)
- Use collaborative language ("contributed to" vs "led") in reviewed versions
- All LaTeX files must compile without errors using tectonic or pdflatex
- everytime made any changes, please check the UI with chrome-devtools mcp
- If there's  there are multiple instances running with chrome devtools mcp, do pkill -f "chrome-devtools-mcp"
- before and after change, always check the page using chrome-devtools mcp
- after kill chrome-devtools mcp, please run this: npm exec chrome-devtools-mcp@latest