# User Guide: AI-Powered Job Parser

**Version:** 1.0
**Date:** October 7, 2025
**Status:** Active
**Related:** PRD.md, TROUBLESHOOTING.md

---

## Overview

The AI-Powered Job Parser automates job application tracking by extracting structured information from job postings. Instead of manually copying company names, positions, and descriptions, simply paste a URL or job text and let AI do the work.

**Time savings:** 5+ minutes → <30 seconds per job

---

## Quick Start

### Method 1: Parse from URL (Recommended)

1. **Copy the job posting URL** from LinkedIn, Indeed, or company career pages
2. Click **"+ Add Job Target"** button (top-right of kanban board)
3. Keep dropdown on **"Paste job post URL"** (default)
4. Paste the URL into the input field
5. Click **"Parse Job Post"**
6. **Review** the extracted information in the preview
7. Click **"Confirm & Add to Board"** to save

**Example URLs that work well:**
- `https://jobs.lever.co/company/position-id`
- `https://boards.greenhouse.io/company/jobs/123456`
- `https://careers.company.com/jobs/senior-engineer`
- Company career pages with clear job descriptions

---

### Method 2: Manual Paste (Fallback)

Use this when URL parsing fails or the job post isn't publicly accessible.

1. **Copy the entire job description** (company name, position, requirements, etc.)
2. Click **"+ Add Job Target"** button
3. Select **"Copy & paste job description"** from dropdown
4. Paste the job description into the textarea (minimum 50 characters)
5. Click **"Parse Job Post"**
6. **Review** the extracted information
7. Click **"Confirm & Add to Board"** to save

**Tip:** Include as much detail as possible for better extraction accuracy.

---

## Understanding the Preview

After parsing, you'll see a preview card showing:

### Extracted Fields

| Field | Description | Required |
|-------|-------------|----------|
| **Position Title** | Job role (e.g., "Senior Frontend Engineer") | ✅ Yes |
| **Company Name** | Hiring company (not recruiters) | ✅ Yes |
| **Location** | City/country or "Remote" | Optional |
| **Salary Range** | As stated in posting | Optional |
| **Job Type** | Full-time, Contract, Remote, Hybrid | Optional |
| **Description** | Full job description with requirements | ✅ Yes |
| **Posted Date** | When the job was posted | Optional |

### Confidence Badge

The AI provides a confidence score indicating extraction quality:

- **Green (90-100%):** High confidence - All key information clearly identified
- **Yellow (70-89%):** Good confidence - Minor ambiguities, review recommended
- **Orange (<70%):** Low confidence - Please review carefully before saving

**If confidence is low:** Click **"Edit"** to return and try manual paste instead.

---

## Step-by-Step Walkthrough

### Example: Adding a LinkedIn Job

1. **Find the job on LinkedIn**
   - Open job posting: `https://www.linkedin.com/jobs/view/1234567890`

2. **Copy the URL**
   - Right-click → Copy link address
   - Or select the URL from browser address bar

3. **Open the parser**
   - Navigate to your kanban board
   - Click **"+ Add Job Target"** (blue button, top-right)

4. **Paste and parse**
   - Modal opens with "Paste job post URL" selected
   - Paste URL: `https://www.linkedin.com/jobs/view/1234567890`
   - Click **"Parse Job Post"**
   - Wait 5-10 seconds while AI extracts information

5. **Review the preview**
   ```
   ✓ Found: "Senior Frontend Engineer" at "Airbnb"

   Location: Bangkok, Thailand
   Salary: 80,000-120,000 THB/month
   Job Type: Full-time
   Confidence: 95% ● High

   Description:
   Airbnb is seeking a Senior Frontend Engineer...
   [truncated preview]
   ```

6. **Confirm or edit**
   - **If correct:** Click **"Confirm & Add to Board"**
   - **If wrong:** Click **"Edit"** to try again or switch to manual paste

7. **Job added!**
   - New card appears in "To Submit" column
   - Job saved with all metadata for future CV tailoring

---

## Common Use Cases

### Use Case 1: Bulk Job Collection

**Scenario:** You found 10 jobs on Indeed and want to track them all.

**Workflow:**
1. Open each job in a new tab
2. Copy URL from each tab
3. For each URL:
   - Click "Add Job Target"
   - Paste URL
   - Parse → Review → Confirm
   - Repeat

**Time:** ~30 seconds per job = 5 minutes total (vs 50+ minutes manually)

---

### Use Case 2: Email Job Alert

**Scenario:** Recruiter emails you a job description (no URL).

**Workflow:**
1. Select and copy the email body (company name through requirements)
2. Click "Add Job Target"
3. Select "Copy & paste job description"
4. Paste full text
5. Parse → Review → Confirm

**Tip:** Include the recruiter's email signature if it contains company info.

---

### Use Case 3: Failed URL Scraping

**Scenario:** LinkedIn URL returns "Unable to access URL" error.

**What happened:** Site requires login or blocked scraping.

**Solution:**
1. Open the job posting in your browser
2. Manually select and copy the job description text
3. Return to modal (error message shows fallback prompt)
4. Dropdown auto-switches to "Copy & paste description"
5. Paste the copied text
6. Parse → Review → Confirm

**Result:** Manual paste succeeds where URL failed.

---

## Tips for Best Results

### ✅ DO:
- **Use direct job posting URLs** (not search results or listings)
- **Include full job description** when using manual paste
- **Review low-confidence extractions** before saving
- **Edit fields manually** if extraction missed something
- **Try manual paste** if URL parsing fails 2+ times

### ❌ DON'T:
- **Use shortened URLs** (bit.ly, etc.) - Expand them first
- **Paste only job titles** - AI needs full context
- **Skip the preview step** - Always verify accuracy
- **Save jobs with missing company/position** - These are required
- **Expect 100% accuracy** - AI is good but not perfect

---

## Keyboard Shortcuts

- **Escape:** Close modal without saving
- **Enter:** Submit form (when URL/text is valid)
- **Tab:** Navigate between fields

---

## Understanding Parsing Sources

Each job is tagged with its parsing source for analytics:

| Source | When Used | Reliability |
|--------|-----------|-------------|
| `url_jina` | URL successfully scraped via Jina AI | 85-95% |
| `manual_paste` | User pasted job description text | 90-98% |

**Why manual paste is often more reliable:** You control exactly what text the AI receives, avoiding issues with site structure or access restrictions.

---

## Data Privacy & Security

### What happens to your data?

1. **URL scraping:** Job content fetched via Jina AI (external service)
2. **AI extraction:** Content sent to Claude Sonnet 4.5 (Anthropic)
3. **Storage:** Parsed data saved to your private Supabase database
4. **Raw content:** Original job text cached for re-parsing improvements

### Is my data secure?

- ✅ All communication uses HTTPS encryption
- ✅ Your database is private (not shared with other users)
- ✅ Job content is NOT shared between users
- ✅ AI providers (Jina, Anthropic) do NOT store your data
- ✅ You can delete jobs anytime (data permanently removed)

### API Keys

- **ANTHROPIC_API_KEY:** Stored as Cloudflare Worker secret (not in code)
- **JINA_API_KEY:** Optional, improves rate limits (200 RPM vs IP-based)

---

## What to Do When Things Go Wrong

See **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** for detailed error solutions.

**Quick fixes:**

| Error | Solution |
|-------|----------|
| "Failed to fetch" | URL requires login → Use manual paste |
| "Extraction confidence is low" | Review data → Edit if needed → Confirm anyway |
| "Could not extract company/position" | Missing required fields → Use manual paste with more context |
| Parser hangs (>30s) | Refresh page → Try again or use manual paste |

---

## Advanced: Re-parsing Existing Jobs

**Future feature (not yet implemented):**

If the AI parser improves its prompt, you can re-parse old jobs to get better extractions without re-fetching URLs.

**Why this matters:** Your `raw_content` field stores the original job text, enabling continuous quality improvement.

---

## Frequently Asked Questions

### Q: Can I parse jobs in Thai language?
**A:** Yes! Claude Sonnet 4.5 handles Thai/English mixed content well. Company names and positions are translated to English for consistency.

### Q: What if the parser gets the salary wrong?
**A:** Click "Edit" in the preview, return to the input step, and try manual paste with just the salary section highlighted. Or save the job and manually edit it later via the job detail modal.

### Q: Does parsing work for LinkedIn Premium jobs?
**A:** If you can access the job posting in your browser, you can copy/paste it. URLs may fail if LinkedIn requires login.

### Q: How accurate is the AI extraction?
**A:** Average confidence score: 80-95%. Required fields (company, position) are 95%+ accurate. Optional fields (salary, location) depend on how clearly they're stated in the posting.

### Q: Can I parse multiple jobs at once?
**A:** No, one job at a time. Bulk import is planned for Phase 2.

### Q: What happens if I close the modal during parsing?
**A:** Parsing is canceled. No data is saved. You can try again anytime.

---

## Getting Help

**Found a bug or have feedback?**

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) first
2. Review [GitHub Issues](https://github.com/your-repo/issues)
3. Contact support with:
   - Screenshot of error
   - Job URL (if applicable)
   - Browser and OS version

**Want to improve the parser?**

See [API_USAGE.md](./API_USAGE.md) for technical details on how to customize prompts or switch AI models.

---

## Next Steps

After adding jobs with the parser:

1. **Review match analysis** - Check how well each job fits your profile
2. **Prepare CVs** - Use `/cv_letsgo` command for tailored CVs
3. **Track applications** - Move cards through kanban columns as you apply
4. **Analyze retrospectives** - Learn from rejections in "Not now" column

---

**Last Updated:** October 7, 2025
**Version:** 1.0
**Feedback:** Open an issue or edit this doc
