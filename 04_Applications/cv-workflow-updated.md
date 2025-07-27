# Updated CV Tailoring Workflow - Version 2.0

Based on lessons learned from the Accenture application process.

## Workflow Steps:

### 1. **Extract Job Information**
   - If URL provided, fetch job description content
   - If raw text provided, use directly
   - Extract company name and position title
   - Create folder format: `<CompanyName>_<Position>_<Date>`

### 2. **Save Job Description**
   - Create `job-spec.md` in application folder
   - Add match percentage at the top
   - Save full job description content

### 3. **Calculate Profile Match**
   - Analyze job requirements against master profile
   - Calculate match percentage (be realistic, 85-90% is excellent)
   - Focus on hard skills alignment

### 4. **Create Tailored CV**
   - Use cv-tailor-specialist agent
   - **CRITICAL IMPROVEMENTS:**
     - Remove unnecessary languages (e.g., Sundanese)
     - Keep CV focused on professional skills
     - Verify all claims against master profile
   - Save as `<company>-<position>-cv.md`

### 5. **Create Tailored Cover Letter**
   - **CRITICAL IMPROVEMENTS:**
     - Keep to ONE PAGE maximum
     - Use 11pt font size for better fit
     - Condense header into single line
     - Use bullet points with tight spacing (`\setlength\itemsep{0.1em}`)
     - Be careful with skill categorization:
       - Core Skills: Only your strongest, most relevant skills
       - Additional/Preferred: Secondary skills like GraphQL
     - Avoid parenthetical achievements that might seem boastful
   - Save as `<company>-cover-letter-<position>-Kenni.md`

### 6. **Skeptical Review**
   - Launch cv-skeptical-reviewer agent
   - Review for:
     - Exaggerated claims
     - Inflated achievements
     - Unrealistic skills
   - **IMPROVEMENTS:**
     - Use "contributed to" instead of "led" when appropriate
     - Remove overly specific metrics in cover letter if they seem boastful
     - Tone down language like "perfect match" to "strong alignment"

### 7. **Convert to LaTeX**
   - **CV LaTeX Settings:**
     - Remove `\input{glyphtounicode}` for tectonic compatibility
     - Remove `\pdfgentounicode=1`
     - Keep Roboto font for modern look
   
   - **Cover Letter LaTeX Settings:**
     - Use Computer Modern font (default LaTeX font) - don't load font packages
     - Set to 11pt for one-page fit
     - Margins: 20mm left/right, 15mm top/bottom
     - Compact spacing between sections

### 8. **Generate PDFs**
   - Use tectonic for compilation
   - Verify all PDFs are one page (for cover letters)
   - Check for compilation warnings but proceed if PDFs generate

## Key Improvements from Experience:

### Content Guidelines:
1. **Language Skills**: Only include professionally relevant languages
2. **Skill Categorization**: Be strategic about core vs. additional skills
3. **Achievement Framing**: Use collaborative language when appropriate
4. **Cover Letter Length**: MUST fit on one page - be ruthless with editing

### Technical Guidelines:
1. **LaTeX Fonts**: 
   - CV: Modern fonts (Roboto) are fine
   - Cover Letter: Computer Modern for classic look
2. **LaTeX Compatibility**: Remove Unicode commands for tectonic
3. **Spacing**: Use tight spacing in lists for cover letters
4. **Font Size**: 11pt for cover letters to ensure one-page fit

### Review Guidelines:
1. **Tone**: Professional but not overly enthusiastic
2. **Claims**: All achievements must be verifiable
3. **Metrics**: Include in CV, but be careful in cover letter
4. **Leadership**: Use "contributed to" when you weren't the sole leader

## Output Structure:
```
04_Applications/
   <CompanyName>_<Position>_<Date>/
       job-spec.md                                    # With match %
       <company>-<position>-cv.md                     # Original
       reviewed-<company>-<position>-cv.md            # Reviewed
       <company>-<position>-cv.tex                    # LaTeX
       reviewed-<company>-<position>-cv.tex           # LaTeX
       <company>-<position>-cv.pdf                    # Final PDF
       reviewed-<company>-<position>-cv.pdf           # Final PDF
       <company>-cover-letter-<position>-Kenni.md     # Original
       reviewed-<company>-cover-letter-<position>-Kenni.md  # Reviewed
       <company>-cover-letter-<position>-Kenni.tex    # LaTeX
       reviewed-<company>-cover-letter-<position>-Kenni.tex # LaTeX
       <company>-cover-letter-<position>-Kenni.pdf    # Final PDF
       reviewed-<company>-cover-letter-<position>-Kenni.pdf # Final PDF
```

## Checklist for Future Applications:
- [ ] Remove non-professional languages
- [ ] Cover letter fits on ONE page
- [ ] GraphQL in additional skills (not core)
- [ ] Use collaborative language in achievements
- [ ] Computer Modern font for cover letters
- [ ] Remove Unicode commands for tectonic compatibility
- [ ] Verify all metrics are from master profile
- [ ] Test compile all PDFs before considering complete