#!/usr/bin/env python3
"""
Generate seed data for the job tracking application from existing job applications.

This script:
1. Scans the 04_Applications directory for job application folders
2. Parses job-spec.md files to extract structured data
3. Generates SQL and JSON seed files for database seeding

Usage:
    python3 generate-seed-data.py
"""

import os
import re
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any
import uuid


# Constants
PROJECT_ROOT = Path(__file__).parent.parent.parent
APPLICATIONS_DIR = PROJECT_ROOT / "04_Applications"
OUTPUT_SQL_FILE = PROJECT_ROOT / "app" / "supabase" / "migrations" / "003_seed_jobs.sql"
OUTPUT_JSON_FILE = PROJECT_ROOT / "app" / "scripts" / "seed-data.json"


def parse_folder_name(folder_name: str) -> Dict[str, str]:
    """
    Parse folder name to extract company, position, and date.
    Format: CompanyName_PositionTitle_YYYY-MM-DD
    """
    parts = folder_name.split('_')

    # Date is always the last part (YYYY-MM-DD)
    date_str = parts[-1] if len(parts) > 0 else ""

    # Company is the first part
    company = parts[0] if len(parts) > 0 else ""

    # Position is everything in between
    position = '_'.join(parts[1:-1]) if len(parts) > 2 else ""

    return {
        'company': company.replace('_', ' '),
        'position': position.replace('_', ' '),
        'date': date_str
    }


def extract_match_percentage(content: str) -> Optional[int]:
    """Extract match percentage from job spec content."""
    # Try various patterns
    patterns = [
        r'\*\*Match Score:\s*(\d+)%\*\*',
        r'\*\*Match Percentage:\s*(\d+)%\*\*',
        r'Match Score:\s*(\d+)%',
        r'Match Percentage:\s*(\d+)%',
        r'Match.*?:\s*(\d+)%',
    ]

    for pattern in patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            return int(match.group(1))

    return None


def extract_company_info(content: str, folder_company: str) -> str:
    """Extract company name from job spec."""
    # Try to find company in markdown
    patterns = [
        r'\*\*Company\*\*:\s*(.+?)(?:\n|$)',
        r'##\s*Company Information.*?\*\*Company\*\*:\s*(.+?)(?:\n|$)',
        r'Company:\s*(.+?)(?:\n|$)',
    ]

    for pattern in patterns:
        match = re.search(pattern, content, re.MULTILINE)
        if match:
            return match.group(1).strip()

    return folder_company


def extract_position_title(content: str, folder_position: str) -> str:
    """Extract position title from job spec."""
    patterns = [
        r'\*\*Title\*\*:\s*(.+?)(?:\n|$)',
        r'\*\*Position\*\*:\s*(.+?)(?:\n|$)',
        r'Position:\s*(.+?)(?:\n|$)',
        r'Title:\s*(.+?)(?:\n|$)',
        r'^#\s*(.+?)(?:\n|$)',
    ]

    for pattern in patterns:
        match = re.search(pattern, content, re.MULTILINE)
        if match:
            title = match.group(1).strip()
            # Clean up title
            title = re.sub(r'\*\*Match.*?:\s*\d+%\*\*', '', title).strip()
            title = re.sub(r'-\s*Very Strong Match', '', title).strip()
            if title:
                return title

    return folder_position


def extract_location(content: str) -> Optional[str]:
    """Extract location from job spec."""
    patterns = [
        r'\*\*Location\*\*:\s*(.+?)(?:\n|$)',
        r'Location:\s*(.+?)(?:\n|$)',
    ]

    for pattern in patterns:
        match = re.search(pattern, content, re.MULTILINE)
        if match:
            return match.group(1).strip()

    return None


def extract_salary_range(content: str) -> Optional[str]:
    """Extract salary range from job spec."""
    patterns = [
        r'\*\*Salary Range\*\*:\s*(.+?)(?:\n|$)',
        r'\*\*Compensation\*\*:\s*(.+?)(?:\n|$)',
        r'Salary Range:\s*(.+?)(?:\n|$)',
        r'Compensation:\s*(.+?)(?:\n|$)',
    ]

    for pattern in patterns:
        match = re.search(pattern, content, re.MULTILINE)
        if match:
            return match.group(1).strip()

    return None


def extract_job_type(content: str) -> Optional[str]:
    """Extract job type from job spec."""
    patterns = [
        r'\*\*Type\*\*:\s*(.+?)(?:\n|$)',
        r'\*\*Employment Type\*\*:\s*(.+?)(?:\n|$)',
        r'Type:\s*(.+?)(?:\n|$)',
        r'Employment Type:\s*(.+?)(?:\n|$)',
    ]

    for pattern in patterns:
        match = re.search(pattern, content, re.MULTILINE)
        if match:
            return match.group(1).strip()

    return None


def extract_original_url(content: str) -> Optional[str]:
    """Extract original job posting URL from job spec."""
    patterns = [
        r'\*\*Source URL\*\*:\s*(https?://[^\s\)]+)',
        r'\*\*Job URL\*\*:\s*(https?://[^\s\)]+)',
        r'Source URL:\s*(https?://[^\s\)]+)',
        r'Job URL:\s*(https?://[^\s\)]+)',
        r'\(https?://[^\s\)]+\)',
    ]

    for pattern in patterns:
        match = re.search(pattern, content)
        if match:
            url = match.group(1) if match.lastindex else match.group(0)
            return url.strip('()')

    return None


def extract_match_analysis(content: str) -> Dict[str, List[str]]:
    """Extract match analysis with strengths, partial matches, and gaps."""
    analysis = {
        'strengths': [],
        'partial_matches': [],
        'gaps': []
    }

    # Extract strengths
    strengths_section = re.search(
        r'(?:### Strong Matches|### Strengths?).*?(?=###|\Z)',
        content,
        re.DOTALL | re.IGNORECASE
    )
    if strengths_section:
        strengths_text = strengths_section.group(0)
        strengths = re.findall(r'[-\*]\s*[✅✓]\s*\*\*(.+?)\*\*', strengths_text)
        if not strengths:
            strengths = re.findall(r'[-\*]\s*✅\s*(.+?)(?:\n|$)', strengths_text)
        analysis['strengths'] = [s.strip() for s in strengths[:5]]  # Limit to top 5

    # Extract partial matches
    partial_section = re.search(
        r'### Partial Matches.*?(?=###|\Z)',
        content,
        re.DOTALL | re.IGNORECASE
    )
    if partial_section:
        partial_text = partial_section.group(0)
        partials = re.findall(r'[-\*]\s*[⚠️🟡]\s*\*\*(.+?)\*\*', partial_text)
        if not partials:
            partials = re.findall(r'[-\*]\s*⚠️\s*(.+?)(?:\n|$)', partial_text)
        analysis['partial_matches'] = [p.strip() for p in partials[:5]]

    # Extract gaps
    gaps_section = re.search(
        r'### Gaps.*?(?=###|\Z)',
        content,
        re.DOTALL | re.IGNORECASE
    )
    if gaps_section:
        gaps_text = gaps_section.group(0)
        gaps = re.findall(r'[-\*]\s*[❌]\s*\*\*(.+?)\*\*', gaps_text)
        if not gaps:
            gaps = re.findall(r'[-\*]\s*❌\s*(.+?)(?:\n|$)', gaps_text)
        analysis['gaps'] = [g.strip() for g in gaps[:5]]

    return analysis


def extract_job_description(content: str) -> str:
    """Extract job description text."""
    # Try to find the job description section
    patterns = [
        r'## Job Description(.*?)(?=##|\Z)',
        r'## Role Overview(.*?)(?=##|\Z)',
        r'## About the Role(.*?)(?=##|\Z)',
    ]

    for pattern in patterns:
        match = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
        if match:
            desc = match.group(1).strip()
            # Limit to first 1000 characters for seed data
            return desc[:1000] if len(desc) > 1000 else desc

    # If no section found, take first 500 characters after the header
    lines = content.split('\n')
    desc_lines = []
    skip_count = 5  # Skip first few header lines
    for line in lines[skip_count:]:
        if line.strip():
            desc_lines.append(line)
        if len('\n'.join(desc_lines)) > 500:
            break

    return '\n'.join(desc_lines)[:500]


def parse_job_spec(file_path: Path, folder_name: str, folder_date: str) -> Optional[Dict[str, Any]]:
    """Parse a job-spec.md file and extract all relevant data."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        folder_info = parse_folder_name(folder_name)

        job_data = {
            'id': str(uuid.uuid4()),
            'created_at': f"{folder_date}T12:00:00Z" if folder_date else datetime.now().isoformat(),
            'input_type': 'url',  # Most jobs are from URLs
            'input_content': f"Job application for {folder_info['position']} at {folder_info['company']}",
            'original_url': extract_original_url(content),
            'company_name': extract_company_info(content, folder_info['company']),
            'position_title': extract_position_title(content, folder_info['position']),
            'location': extract_location(content),
            'salary_range': extract_salary_range(content),
            'job_type': extract_job_type(content),
            'job_description_text': extract_job_description(content),
            'match_percentage': extract_match_percentage(content),
            'match_analysis': extract_match_analysis(content),
            'status': 'to_submit',  # Default status for historical applications
            'folder_path': f"04_Applications/{folder_name}",
        }

        return job_data

    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
        return None


def generate_sql_insert(job: Dict[str, Any], order: int) -> str:
    """Generate SQL INSERT statement for a job."""

    def escape_sql(value: Optional[str]) -> str:
        """Escape single quotes for SQL."""
        if value is None:
            return 'NULL'
        return f"'{value.replace(chr(39), chr(39)+chr(39))}'"

    def sql_value(value: Any) -> str:
        """Convert Python value to SQL value."""
        if value is None:
            return 'NULL'
        if isinstance(value, bool):
            return 'true' if value else 'false'
        if isinstance(value, (int, float)):
            return str(value)
        if isinstance(value, dict):
            json_str = json.dumps(value)
            return f"'{json_str.replace(chr(39), chr(39)+chr(39))}'"
        return escape_sql(str(value))

    return f"""
INSERT INTO jobs (
  id,
  created_at,
  updated_at,
  input_type,
  input_content,
  original_url,
  company_name,
  position_title,
  location,
  salary_range,
  job_type,
  job_description_text,
  match_percentage,
  match_analysis,
  status,
  kanban_order,
  folder_path
) VALUES (
  '{job['id']}',
  '{job['created_at']}',
  '{job['created_at']}',
  '{job['input_type']}',
  {sql_value(job['input_content'])},
  {sql_value(job.get('original_url'))},
  {sql_value(job.get('company_name'))},
  {sql_value(job.get('position_title'))},
  {sql_value(job.get('location'))},
  {sql_value(job.get('salary_range'))},
  {sql_value(job.get('job_type'))},
  {sql_value(job.get('job_description_text'))},
  {sql_value(job.get('match_percentage'))},
  {sql_value(job.get('match_analysis'))},
  '{job['status']}',
  {order},
  {sql_value(job.get('folder_path'))}
);"""


def main():
    """Main function to generate seed data."""
    print("🌱 Generating seed data from job applications...")
    print(f"📁 Scanning: {APPLICATIONS_DIR}")

    # Find all application folders
    application_folders = [
        d for d in APPLICATIONS_DIR.iterdir()
        if d.is_dir() and not d.name.startswith('.')
    ]

    print(f"📊 Found {len(application_folders)} application folders")

    # Parse all job specs
    jobs = []
    for folder in sorted(application_folders):
        job_spec_file = folder / "job-spec.md"
        if job_spec_file.exists():
            folder_info = parse_folder_name(folder.name)
            job_data = parse_job_spec(job_spec_file, folder.name, folder_info['date'])
            if job_data:
                jobs.append(job_data)
                print(f"  ✅ {job_data['company_name']} - {job_data['position_title']}")
        else:
            print(f"  ⚠️  Skipping {folder.name} - no job-spec.md found")

    print(f"\n✨ Successfully parsed {len(jobs)} jobs")

    # Sort jobs by created_at date
    jobs.sort(key=lambda x: x['created_at'])

    # Generate SQL seed file
    print(f"\n📝 Generating SQL seed file: {OUTPUT_SQL_FILE}")
    sql_content = """-- Seed data for jobs table
-- Generated from 04_Applications folder
-- Date: """ + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + """

-- Clear existing seed data (optional - comment out if you want to keep existing data)
-- DELETE FROM jobs WHERE folder_path LIKE '04_Applications/%';

"""

    for idx, job in enumerate(jobs):
        sql_content += generate_sql_insert(job, idx)

    OUTPUT_SQL_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_SQL_FILE, 'w', encoding='utf-8') as f:
        f.write(sql_content)

    print(f"  ✅ SQL file created with {len(jobs)} INSERT statements")

    # Generate JSON seed file
    print(f"\n📝 Generating JSON seed file: {OUTPUT_JSON_FILE}")
    json_content = {
        'generated_at': datetime.now().isoformat(),
        'total_jobs': len(jobs),
        'jobs': jobs
    }

    with open(OUTPUT_JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(json_content, f, indent=2, ensure_ascii=False)

    print(f"  ✅ JSON file created with {len(jobs)} job records")

    # Print summary statistics
    print("\n📊 Summary Statistics:")
    print(f"  Total jobs: {len(jobs)}")

    match_percentages = [j['match_percentage'] for j in jobs if j.get('match_percentage')]
    if match_percentages:
        avg_match = sum(match_percentages) / len(match_percentages)
        print(f"  Average match: {avg_match:.1f}%")
        print(f"  Best match: {max(match_percentages)}%")
        print(f"  Lowest match: {min(match_percentages)}%")

    companies_with_location = [j for j in jobs if j.get('location')]
    print(f"  Jobs with location: {len(companies_with_location)}")

    companies_with_salary = [j for j in jobs if j.get('salary_range')]
    print(f"  Jobs with salary: {len(companies_with_salary)}")

    print("\n✅ Seed data generation complete!")
    print(f"\n📌 Next steps:")
    print(f"  1. Review the generated files:")
    print(f"     - {OUTPUT_SQL_FILE}")
    print(f"     - {OUTPUT_JSON_FILE}")
    print(f"  2. Run the SQL migration or use the TypeScript seeder")


if __name__ == "__main__":
    main()
