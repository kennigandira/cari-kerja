# CV Tailoring Agent

## Overview

The CV Tailoring Agent is an intelligent automation tool that creates personalized CVs and cover letters based on job descriptions. It analyzes job requirements and automatically selects the most relevant experiences, skills, and achievements from your master CV data.

## Core Features

### 1. Intelligent Job Analysis
- Extracts key requirements, skills, and keywords from job descriptions
- Identifies job focus (frontend, fullstack, performance-oriented, product-focused)
- Determines required experience level
- Categorizes role type and industry

### 2. Dynamic CV Generation
- Selects most relevant work experiences based on job requirements
- Prioritizes achievements that match job keywords
- Adjusts professional summary to match role focus
- Reorders skills based on job requirements
- Maintains professional LaTeX formatting

### 3. Personalized Cover Letters
- Generates tailored cover letters highlighting relevant experience
- Emphasizes matching skills and achievements
- Maintains professional tone while being engaging
- Includes company-specific personalization

### 4. Multi-Format Output
- Markdown files for easy editing
- LaTeX source files for professional formatting
- PDF compilation for final submission
- Timestamped outputs for version tracking

## How to Use

### Quick Start

1. **Interactive Mode** (Recommended for single job applications):
```bash
python cv_tailor_agent/cv_tailor.py --interactive
```

2. **File Mode** (For batch processing):
```bash
python cv_tailor_agent/cv_tailor.py --job-file job_description.txt --company "Company Name"
```

### Step-by-Step Process

1. **Prepare Job Description**
   - Copy the full job description including requirements
   - Include company name and role details
   - More detail = better tailoring

2. **Run the Agent**
   - Use interactive mode for real-time input
   - Or save job description to a file for file mode

3. **Review Outputs**
   - Check generated files in `output/` directory
   - Review CV for accuracy and relevance
   - Customize cover letter if needed

4. **Final PDF**
   - PDFs are automatically generated if LaTeX is installed
   - Otherwise, use the .tex files with any LaTeX editor

## Technical Architecture

### Core Components

1. **CVTailor Class**
   - Main orchestrator for the tailoring process
   - Handles data extraction and analysis
   - Manages output generation

2. **Job Analysis Engine**
   ```python
   - analyze_job_description(): Extracts requirements and keywords
   - extract_keywords(): Identifies technical and business keywords
   - detect_focus(): Determines role type and emphasis
   ```

3. **Experience Selector**
   ```python
   - select_relevant_experiences(): Scores and ranks experiences
   - filter_achievements(): Selects most relevant achievements
   - calculate_relevance_score(): Quantifies match quality
   ```

4. **Content Generators**
   ```python
   - generate_tailored_cv_content(): Creates LaTeX CV
   - generate_cover_letter(): Produces personalized cover letter
   - generate_latex_cv(): Formats CV in LaTeX
   ```

### Data Structure

The agent uses a comprehensive master data structure containing:

```python
master_data = {
    "name": "Your Name",
    "contact": {...},
    "summary_variations": {
        "frontend_focused": "...",
        "fullstack": "...",
        "performance_focused": "...",
        "product_focused": "..."
    },
    "experience": [
        {
            "title": "Position",
            "company": "Company",
            "achievements": [
                {
                    "text": "Achievement description",
                    "keywords": ["keyword1", "keyword2"],
                    "impact_type": "growth|efficiency|revenue|technical"
                }
            ]
        }
    ],
    "skills": {
        "core": [...],
        "experience": [...],
        "exposure": [...]
    }
}
```

## Customization Guide

### Adding New Experiences

1. Open `cv_tailor.py`
2. Locate the `master_data` dictionary
3. Add new experience entry:
```python
{
    "title": "Your Title",
    "company": "Company Name",
    "location": "City, Country",
    "period": "YYYY -- YYYY",
    "type": "Industry Type",
    "achievements": [
        {
            "text": "Quantified achievement",
            "keywords": ["relevant", "keywords"],
            "impact_type": "growth"
        }
    ]
}
```

### Adding Skills

Update the skills section:
```python
"skills": {
    "core": ["React", "TypeScript", ...],
    "experience": ["Node.js", "Docker", ...],
    "exposure": ["AWS", "GraphQL", ...],
    "all_skills": ["Complete", "skill", "list"]
}
```

### Creating New Summary Variations

Add new focus areas:
```python
"summary_variations": {
    "your_new_focus": "Your tailored summary for this focus area..."
}
```

## Best Practices

### For Job Descriptions
1. Include the complete job posting
2. Keep technical requirements and soft skills
3. Include company culture information
4. Preserve any specific keywords or technologies

### For Better Results
1. Keep master data updated with latest experiences
2. Use specific, quantified achievements
3. Include diverse keywords in achievements
4. Review and customize generated content before sending

### Achievement Writing
- Start with action verbs
- Include quantified results
- Mention technologies used
- Highlight business impact

## Advanced Usage

### Batch Processing

Create a script for multiple applications:
```bash
#!/bin/bash
for job in jobs/*.txt; do
    company=$(basename "$job" .txt)
    python cv_tailor_agent/cv_tailor.py --job-file "$job" --company "$company"
done
```

### Custom Templates

Modify the LaTeX template in `generate_latex_cv()` method for different styles.

### Integration Options

1. **Web Interface**: Build a Flask/FastAPI frontend
2. **CLI Enhancement**: Add more command-line options
3. **API Service**: Deploy as a REST API
4. **Job Board Integration**: Auto-fetch job descriptions

## Troubleshooting

### Common Issues

1. **No PDF Output**
   - Install LaTeX: `brew install basictex` (macOS)
   - Or use online LaTeX editors with .tex files

2. **Formatting Issues**
   - Check for special characters in your data
   - Ensure proper LaTeX escaping

3. **Poor Tailoring**
   - Provide more detailed job descriptions
   - Update keywords in achievements
   - Add more summary variations

### Debug Mode

Add debug prints to understand the tailoring process:
```python
print(f"Job Analysis: {job_analysis}")
print(f"Selected Experiences: {len(selected_experiences)}")
```

## Future Enhancements

- [ ] ATS (Applicant Tracking System) optimization
- [ ] Machine learning for better keyword matching
- [ ] Multiple CV templates and styles
- [ ] Integration with LinkedIn for data import
- [ ] Web-based interface
- [ ] API endpoint for programmatic access
- [ ] Support for multiple languages
- [ ] Portfolio/project section handling

## Tips for Maximum Impact

1. **Keyword Optimization**: Ensure your achievements include industry-standard keywords
2. **Quantify Everything**: Use numbers, percentages, and metrics
3. **Action Verbs**: Start achievements with strong action verbs
4. **Relevance First**: Most relevant experiences should have the most detailed achievements
5. **Fresh Content**: Regularly update with new projects and achievements

## Support

For issues or enhancements:
1. Check the README for basic troubleshooting
2. Review the code comments for implementation details
3. Modify the agent to suit your specific needs

Remember: This agent provides a strong starting point, but always review and personalize the output before submitting your application!