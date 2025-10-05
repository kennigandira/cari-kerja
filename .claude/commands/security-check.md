---
description: Comprehensive security audit using backend, frontend, and general security agents in parallel with persistent context
allowed-tools: all
argument-hint: [specific-area] (optional: focus on specific security area or file/directory)
model: claude-3-5-sonnet-20241022
---

# Comprehensive Security Check with Persistent Context

You are coordinating a comprehensive security audit using three specialized security agents working in parallel. This audit maintains persistent security context across sessions to build cumulative security knowledge.

## Security Context Management

First, ensure the `.ai_security_context/` directory exists at the project root for maintaining persistent security knowledge:

```bash
! mkdir -p .ai_security_context
! touch .ai_security_context/project_index.json
! touch .ai_security_context/security_findings.json
! touch .ai_security_context/vulnerabilities.json
! touch .ai_security_context/remediation_history.json
```

## Parallel Security Analysis

Now, invoke ALL three security agents IN PARALLEL to perform their specialized security reviews. Each agent should:
1. Load existing context from `.ai_security_context/`
2. Perform their specialized security analysis
3. Store findings and learnings back to `.ai_security_context/`
4. Build upon previous assessments rather than starting fresh

### IMPORTANT: Execute These Three Agent Invocations Simultaneously

**Agent 1: Backend Security Review**
@.claude/agents/backend_security.md

Perform a comprehensive backend security review focusing on:
- Input validation and sanitization
- Authentication and authorization mechanisms
- API security and rate limiting
- SQL injection and command injection prevention
- Server-side request forgery (SSRF) protection
- Cryptography and secrets management
- Session management and CSRF protection
- File upload security
- Dependency vulnerabilities

WORKFLOW:
1. Check `.ai_security_context/` for existing backend security findings and project knowledge
2. Analyze the codebase for backend security issues, building on previous findings
3. Document new vulnerabilities with severity levels (Critical/High/Medium/Low)
4. Store findings in `.ai_security_context/backend_findings.json`
5. Update `.ai_security_context/security_findings.json` with backend-specific issues

Focus area (if specified): $ARGUMENTS

**Agent 2: Frontend Security Review**
@.claude/agents/frontend_security.md

Perform a comprehensive frontend security review focusing on:
- Cross-Site Scripting (XSS) prevention
- Content Security Policy (CSP) implementation
- DOM-based vulnerabilities
- Client-side injection attacks
- Secure communication (HTTPS, WSS)
- Browser security headers
- Third-party library vulnerabilities
- Client-side storage security
- CORS configuration
- Clickjacking protection

WORKFLOW:
1. Check `.ai_security_context/` for existing frontend security findings and project knowledge
2. Analyze the codebase for frontend security issues, building on previous findings
3. Document new vulnerabilities with severity levels (Critical/High/Medium/Low)
4. Store findings in `.ai_security_context/frontend_findings.json`
5. Update `.ai_security_context/security_findings.json` with frontend-specific issues

Focus area (if specified): $ARGUMENTS

**Agent 3: Security Auditor**
@.claude/agents/security_auditor.md

Perform a comprehensive security audit focusing on:
- DevSecOps practices and CI/CD security
- Infrastructure as Code security
- Container and orchestration security
- Cloud security configuration
- Network security and segmentation
- Logging, monitoring, and incident response
- Compliance requirements (OWASP, PCI-DSS, GDPR)
- Security testing coverage
- Vulnerability management processes
- Security architecture review

WORKFLOW:
1. Check `.ai_security_context/` for existing audit findings and compliance status
2. Perform comprehensive security audit, leveraging previous audit results
3. Assess overall security posture and maturity level
4. Store findings in `.ai_security_context/audit_findings.json`
5. Update `.ai_security_context/security_findings.json` with audit results
6. Generate compliance checklist in `.ai_security_context/compliance_status.json`

Focus area (if specified): $ARGUMENTS

## Consolidation and Reporting

After all three agents complete their parallel analysis:

1. **Merge and Deduplicate Findings**
   - Combine results from all three agents
   - Remove duplicate findings
   - Correlate related vulnerabilities
   - Update `.ai_security_context/security_findings.json` with consolidated results

2. **Generate Security Report**
   Create a comprehensive security report including:
   - Executive summary with critical findings count
   - Detailed findings organized by severity (Critical → High → Medium → Low)
   - Risk assessment matrix
   - Remediation recommendations with priority order
   - Security posture trend (if previous assessments exist)
   - Compliance gaps and recommendations

3. **Update Persistent Context**
   Store the following in `.ai_security_context/`:
   - `last_scan_date.txt` - Timestamp of this security check
   - `cumulative_findings.json` - All findings across all scans
   - `remediation_tracking.json` - Track which issues have been fixed
   - `security_metrics.json` - Metrics showing security improvement over time

4. **Action Items**
   Generate prioritized action items:
   - Immediate actions for critical vulnerabilities
   - Short-term remediation plan (1-2 weeks)
   - Long-term security improvements (1-3 months)
   - Process and policy recommendations

## Output Format

Present findings in this structure:

```markdown
# Security Assessment Report - [Current Date]

## Executive Summary
- Total vulnerabilities found: X (Critical: X, High: X, Medium: X, Low: X)
- Security posture change since last scan: [Improved/Degraded/Stable]
- Compliance status: [Summary]

## Critical Findings Requiring Immediate Action
[List critical vulnerabilities that need immediate attention]

## Detailed Findings by Category

### Backend Security
[Backend security findings from Agent 1]

### Frontend Security
[Frontend security findings from Agent 2]

### Security Audit & Compliance
[Audit findings from Agent 3]

## Remediation Roadmap
[Prioritized list of fixes with effort estimates]

## Security Metrics & Trends
[Show improvement/degradation over time if previous scans exist]

## Next Steps
[Concrete action items with owners and deadlines]
```

Remember: This is a PARALLEL operation - all three agents should work simultaneously to maximize efficiency. The persistent context in `.ai_security_context/` ensures continuous improvement in security posture tracking across multiple assessments.