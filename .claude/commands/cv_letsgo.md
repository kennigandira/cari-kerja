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

7. **Skeptical Review**
   - Launch cv-skeptical-reviewer agent to review BOTH the tailored CV and cover letter
   - Have the reviewer check for:
     - Any exaggerated claims
     - Inflated achievements
     - Unrealistic skills or experiences
   - Incorporate feedback to create:
     - `reviewed-<company>-<position>-cv.md`
     - `reviewed-<company>-cover-letter-<position>-Kenni.md`
   - **NEW**: Ensure collaborative language ("contributed to" vs "led")

8. **Convert to LaTeX**
   - Convert all documents to `.tex` format:
     - `<company>-<position>-cv.tex`
     - `reviewed-<company>-<position>-cv.tex`
     - `<company>-cover-letter-<position>-Kenni.tex`
     - `reviewed-<company>-cover-letter-<position>-Kenni.tex`
   - Use appropriate LaTeX formatting from the template files
   - **NEW**: Remove problematic LaTeX commands:
     - Remove `\input{glyphtounicode}`
     - Remove `\pdfgentounicode=1`
     - Use Computer Modern font for cover letters unless specified

9. **Generate PDFs**
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
       <company>-<position>-cv.md
       reviewed-<company>-<position>-cv.md
       <company>-<position>-cv.tex
       reviewed-<company>-<position>-cv.tex
       <company>-<position>-cv.pdf
       reviewed-<company>-<position>-cv.pdf
       <company>-cover-letter-<position>-Kenni.md
       reviewed-<company>-cover-letter-<position>-Kenni.md
       <company>-cover-letter-<position>-Kenni.tex
       reviewed-<company>-cover-letter-<position>-Kenni.tex
       <company>-cover-letter-<position>-Kenni.pdf
       reviewed-<company>-cover-letter-<position>-Kenni.pdf
       self-introduction.md (optional)
       own-it-award-description.md (optional)
```

## Quality Checks:
1. **Name Consistency**: Verify correct name from master profile
2. **Contact Info**: Use latest phone number and location
3. **Achievement Accuracy**: Every metric must match master profile
4. **Document Length**: Cover letters must fit on one page
5. **LaTeX Compilation**: All documents must compile without errors
6. **Professional Tone**: Reviewed versions should be believable

## Important Notes:
- Always maintain factual accuracy from the master profile
- Prioritize ATS optimization while keeping readability
- Include relevant keywords from the job description
- Quantify achievements where they exist in the source data
- Never invent new achievements or inflate existing ones
- Use collaborative language for team achievements
- Keep cover letters concise and impactful

Begin the workflow now with the provided job description: {{ARGS}}