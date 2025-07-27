# CV Tailoring Agent

An intelligent agent that automatically tailors your CV and generates personalized cover letters based on job descriptions.

## Features

- **Smart CV Tailoring**: Analyzes job descriptions and selects the most relevant experiences and skills
- **Dynamic Summary**: Chooses the best professional summary based on job focus (frontend, fullstack, performance, product)
- **Skill Matching**: Prioritizes skills mentioned in the job description
- **Cover Letter Generation**: Creates personalized cover letters that highlight relevant experiences
- **Multiple Output Formats**: Generates Markdown, LaTeX, and PDF files

## Setup

1. Ensure you have Python 3.7+ installed
2. Install LaTeX (optional, for PDF generation):
   - macOS: `brew install basictex` or download MacTeX
   - Linux: `sudo apt-get install texlive-full`
   - Windows: Download MiKTeX

## Usage

### Interactive Mode (Recommended)

```bash
python cv_tailor_agent/cv_tailor.py --interactive
```

Then:
1. Paste the job description
2. Press Enter twice to finish
3. Enter the company name (optional)

### File Mode

```bash
python cv_tailor_agent/cv_tailor.py --job-file path/to/job_description.txt --company "Company Name"
```

### Example

```bash
# Interactive mode
python cv_tailor_agent/cv_tailor.py --interactive

# With job description file
python cv_tailor_agent/cv_tailor.py --job-file job_desc.txt --company "TechCorp"
```

## Output Structure

```
cv_tailor_agent/
├── output/
│   ├── md/          # Markdown files (cover letters)
│   ├── tex/         # LaTeX source files
│   └── pdf/         # Generated PDFs
```

## How It Works

1. **Job Analysis**: The agent analyzes the job description to identify:
   - Required skills and technologies
   - Years of experience needed
   - Job focus (frontend, fullstack, performance-oriented, etc.)
   - Key keywords and requirements

2. **Experience Selection**: Based on the analysis, it:
   - Scores each work experience by relevance
   - Selects the most impactful achievements
   - Orders experiences by relevance and recency

3. **Skill Prioritization**: 
   - Highlights skills mentioned in the job description
   - Maintains a balanced skill representation

4. **Cover Letter Generation**:
   - Creates a personalized introduction
   - Highlights the most relevant experience
   - Emphasizes matching skills
   - Maintains a professional, engaging tone

## Customization

The agent uses data from the master CV templates. To customize:

1. Edit the `master_data` dictionary in `cv_tailor.py`
2. Add or modify:
   - Work experiences and achievements
   - Skills and categories
   - Summary variations
   - Education and awards

## Tips for Best Results

1. **Detailed Job Descriptions**: Provide complete job descriptions with requirements and responsibilities
2. **Company Research**: Include the actual company name for more personalized cover letters
3. **Review Output**: Always review and fine-tune the generated content before sending
4. **Keep Master Data Updated**: Regularly update your experiences and skills in the master data

## Troubleshooting

- **No PDF Output**: Install a LaTeX distribution (see Setup section)
- **Compilation Errors**: Check that all special characters in your data are properly escaped
- **Missing Skills**: Add new skills to the `all_skills` list in master data

## Future Enhancements

- [ ] Web interface for easier use
- [ ] Integration with job boards APIs
- [ ] Multiple CV format templates
- [ ] ATS (Applicant Tracking System) optimization
- [ ] Multi-language support