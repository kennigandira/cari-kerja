---
name: cv_letsgo
description: Comprehensive CV tailoring workflow that analyzes job descriptions and creates optimized CVs
---

You are about to execute a comprehensive CV tailoring workflow. The parameter provided will be either a job description URL or the full job description text.

## Workflow Steps:

1. **Extract Job Information**
   - If general, just put general Frontend Engineer Job description 
   - If a URL is provided, fetch the job description content
   - If raw text is provided, use it directly
   - Extract the company name and position title, if general, company name will be GeneralCV and position title will be Frontend Engineer
   - **NEW**: Handle authentication-protected URLs gracefully

2. **Create Application Folder**
   - Create a new folder under `/Users/user/Documents/cari-kerja/04_Applications/`
   - Use format: `<CompanyName>_<Position>_<Date>` (e.g., `Google_SeniorFrontend_2025-07-27`)
   - **NEW**: Clean folder names (remove special characters, spaces to underscores)

3. **Save Job Description**
   - Create `job-spec.md` in the application folder
   - Add match percentage at the top of the file
   - Save the full job description content
   - **NEW**: Include detailed match analysis with strengths, partial matches, and gaps

4. **Calculate Profile Match**
   - Analyze job requirements against these resources:
     - `/Users/user/Documents/cari-kerja/01_Profile/master_profile.md`
   - Calculate match percentage based on skills, experience, and requirements
   - **NEW**: Provide detailed breakdown of match analysis

5. **Create Tailored CV**
   - Use the cv-tailor-specialist agent to analyze the job description
   - Reference the master profile and CV templates
   - **CRITICAL**: Never make up achievements, numbers, or facts
   - Always verify against `/Users/user/Documents/cari-kerja/01_Profile/master_profile.md`
   - You can rephrase content but maintain factual accuracy
   - Save as `<company>-<position>-cv.md`
   - **NEW**: Verify name consistency from master profile

6. **Create Tailored Cover Letter**
   - Generate a tailored cover letter based on:
     - The job description
     - `/Users/user/Documents/cari-kerja/03_CV_Templates/cover_letter_template.md`
     - The master profile information
   - Match the tone and requirements from the job description
   - Rephrase content as needed while maintaining factual accuracy
   - Save as `<company>-cover-letter-<position>-Kenni.md`
   - **NEW**: Ensure cover letter fits on ONE page (200-250 words max)
   - **NEW**: Please put proper spacing.

7. **Optimistic Review**
   - Launch cv-optimistic-reviewer agent to review BOTH the tailored CV and cover letter
   - Have the reviewer:
     - Identify understated achievements
     - Suggest stronger framing where justified
     - Surface hidden metrics and impact
     - Maximize presentation while maintaining verifiability
   - Incorporate feedback to create:
     - `optimistic-<company>-<position>-cv.md`
     - `optimistic-<company>-cover-letter-<position>-Kenni.md`

8. **Skeptical Review**
   - Launch cv-skeptical-reviewer agent to review the optimistic versions
   - Have the reviewer check for:
     - Any exaggerated claims
     - Inflated achievements
     - Unrealistic skills or experiences
     - Hype that needs tempering
   - Incorporate feedback to create:
     - `skeptical-<company>-<position>-cv.md`
     - `skeptical-<company>-cover-letter-<position>-Kenni.md`
   - Ensure collaborative language ("contributed to" vs "led")

9. **Manager Synthesis**
   - Launch cv-reviewer-manager agent with outputs from BOTH optimistic and skeptical reviewers
   - The manager will:
     - Resolve conflicts between the two reviews
     - Make final editorial decisions
     - Create the ultimate balanced version
     - Target: Credibility 4-5/10 + Impact 7-8/10
   - Produce final versions:
     - `final-<company>-<position>-cv.md`
     - `final-<company>-cover-letter-<position>-Kenni.md`
   - These are the authoritative versions for LaTeX conversion

10. **Convert to LaTeX**
   - Convert all document versions to `.tex` format:
     - `<company>-<position>-cv.tex` (initial draft)
     - `optimistic-<company>-<position>-cv.tex`
     - `skeptical-<company>-<position>-cv.tex`
     - `final-<company>-<position>-cv.tex` (manager's ultimate version)
     - `<company>-cover-letter-<position>-Kenni.tex` (initial draft)
     - `optimistic-<company>-cover-letter-<position>-Kenni.tex`
     - `skeptical-<company>-cover-letter-<position>-Kenni.tex`
     - `final-<company>-cover-letter-<position>-Kenni.tex` (manager's ultimate version)
   - Use appropriate LaTeX formatting from the template files
   - **NEW**: Remove problematic LaTeX commands:
     - Remove `\input{glyphtounicode}`
     - Remove `\pdfgentounicode=1`
     - Use Computer Modern font for cover letters unless specified

11. **Generate PDFs**
   - Compile all `.tex` files using tectonic
   - Save PDFs with the same naming convention
   - **NEW**: Verify all PDFs compile without errors

## Additional Files to Generate:
- `self-introduction.md` - 4-sentence introduction options
- `own-it-award-description.md` - If applicable, create award descriptions

## Output Structure:
```
04_Applications/
   <CompanyName>_<Position>_<Date>/
       job-spec.md

       # CV Versions (Draft → Optimistic → Skeptical → Final)
       <company>-<position>-cv.md
       <company>-<position>-cv.tex
       <company>-<position>-cv.pdf

       optimistic-<company>-<position>-cv.md
       optimistic-<company>-<position>-cv.tex
       optimistic-<company>-<position>-cv.pdf

       skeptical-<company>-<position>-cv.md
       skeptical-<company>-<position>-cv.tex
       skeptical-<company>-<position>-cv.pdf

       final-<company>-<position>-cv.md          # ← Manager's ultimate version
       final-<company>-<position>-cv.tex
       final-<company>-<position>-cv.pdf

       # Cover Letter Versions (Draft → Optimistic → Skeptical → Final)
       <company>-cover-letter-<position>-Kenni.md
       <company>-cover-letter-<position>-Kenni.tex
       <company>-cover-letter-<position>-Kenni.pdf

       optimistic-<company>-cover-letter-<position>-Kenni.md
       optimistic-<company>-cover-letter-<position>-Kenni.tex
       optimistic-<company>-cover-letter-<position>-Kenni.pdf

       skeptical-<company>-cover-letter-<position>-Kenni.md
       skeptical-<company>-cover-letter-<position>-Kenni.tex
       skeptical-<company>-cover-letter-<position>-Kenni.pdf

       final-<company>-cover-letter-<position>-Kenni.md    # ← Manager's ultimate version
       final-<company>-cover-letter-<position>-Kenni.tex
       final-<company>-cover-letter-<position>-Kenni.pdf

       # Optional files
       self-introduction.md (optional)
       own-it-award-description.md (optional)
```

## Quality Checks:
1. **Name Consistency**: Verify correct name from master profile
2. **Contact Info**: Use latest phone number and location
3. **Achievement Accuracy**: Every metric must match master profile
4. **Document Length**: Cover letters must fit on one page
5. **LaTeX Compilation**: All documents must compile without errors
6. **Review Balance**: Final versions should achieve credibility 4-5/10 + impact 7-8/10
7. **Version Progression**: Draft → Optimistic (high impact) → Skeptical (high credibility) → Final (balanced)

## Important Notes:
- Always maintain factual accuracy from the master profile
- Prioritize ATS optimization while keeping readability
- Include relevant keywords from the job description
- Quantify achievements where they exist in the source data
- Never invent new achievements or inflate existing ones
- Use collaborative language for team achievements
- Keep cover letters concise and impactful
- **Three-Stage Review Process**: Optimistic maximizes impact → Skeptical ensures credibility → Manager synthesizes for optimal balance
- **Final Versions Are Authoritative**: Use `final-*` versions for applications; other versions are for review process transparency

Begin the workflow now with the provided job description: {{ARGS}}