#!/usr/bin/env python3
"""
Migrate master_profile.md to Supabase database

This script parses the existing master_profile.md file and imports it into
the database using the create_master_profile RPC function.

Usage:
    python3 migrate_to_db.py --dry-run           # Preview what will be imported
    python3 migrate_to_db.py                     # Actually import to database
    python3 migrate_to_db.py --backup            # Backup original file first
"""

import re
import json
import argparse
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from frontend .env file
env_path = Path(__file__).parent.parent / 'frontend' / '.env'
load_dotenv(env_path)

# Supabase configuration
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError(
        "Missing Supabase credentials. Please ensure VITE_SUPABASE_URL and "
        "VITE_SUPABASE_ANON_KEY are set in app/frontend/.env"
    )

MASTER_PROFILE_PATH = Path("/Users/user/Documents/cari-kerja/01_Profile/master_profile.md")


def load_markdown(file_path: Path) -> str:
    """Load markdown file contents."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()


def parse_contact_info(content: str) -> Dict[str, str]:
    """Parse contact information section."""
    contact = {}

    # Extract email
    email_match = re.search(r'\*\*Email\*\*:\s*([^\n]+)', content)
    if email_match:
        contact['email'] = email_match.group(1).strip()

    # Extract phones
    whatsapp_match = re.search(r'Whatsapp:\s*([^\n]+)', content)
    if whatsapp_match:
        contact['phone_primary'] = whatsapp_match.group(1).strip()

    phone_match = re.search(r'Phone:\s*([^\n]+)', content)
    if phone_match:
        contact['phone_secondary'] = phone_match.group(1).strip()

    # Extract LinkedIn
    linkedin_match = re.search(r'\*\*LinkedIn\*\*:.*?\[.*?\]\((https?://[^\)]+)\)', content)
    if linkedin_match:
        contact['linkedin_url'] = linkedin_match.group(1).strip()

    # Extract location
    location_match = re.search(r'\*\*Location\*\*:\s*([^\n]+)', content)
    if location_match:
        contact['location'] = location_match.group(1).strip()

    return contact


def parse_professional_summary(content: str) -> str:
    """Parse professional summary section."""
    match = re.search(r'## Professional Summary\n(.+?)(?=\n##)', content, re.DOTALL)
    if match:
        return match.group(1).strip()
    return ""


def parse_work_experiences(content: str) -> List[Dict[str, Any]]:
    """Parse professional experience section."""
    experiences = []

    # Find Professional Experience section (extract until ## Education)
    exp_start = content.find('## Professional Experience')
    edu_start = content.find('## Education', exp_start)

    if exp_start == -1:
        return experiences

    exp_text = content[exp_start:edu_start] if edu_start != -1 else content[exp_start:]

    # Find all job entries (### Company | Position)
    job_pattern = r'###\s+(.+?)\s*\|\s*(.+?)\n\*\*(.+?)\*\*\s*\|\s*(.+?)\n((?:-.+?\n)+)'
    matches = re.finditer(job_pattern, exp_text, re.MULTILINE)

    for idx, match in enumerate(matches):
        company_name = match.group(1).strip()
        position_title = match.group(2).strip()
        date_range = match.group(3).strip()
        location = match.group(4).strip()
        description_text = match.group(5).strip()

        # Parse date range
        start_date, end_date, is_current = parse_date_range(date_range)

        experiences.append({
            'company_name': company_name,
            'position_title': position_title,
            'location': location if location else None,
            'start_date': start_date,
            'end_date': end_date,
            'is_current': is_current,
            'description': description_text,
            'display_order': idx
        })

    return experiences


def parse_date_range(date_range: str) -> tuple[Optional[str], Optional[str], bool]:
    """
    Parse date range like 'March 2023 - Present' or 'June 2022 - March 2023'.
    Returns (start_date, end_date, is_current) in YYYY-MM-DD format.
    """
    is_current = 'Present' in date_range or 'present' in date_range

    # Split by dash
    parts = date_range.split('-')
    if len(parts) != 2:
        return None, None, False

    start_str = parts[0].strip()
    end_str = parts[1].strip()

    start_date = parse_month_year(start_str)
    end_date = None if is_current else parse_month_year(end_str)

    return start_date, end_date, is_current


def parse_month_year(date_str: str) -> Optional[str]:
    """
    Parse 'March 2023' or 'June 2022' to 'YYYY-MM-DD' format.
    Returns first day of the month.
    """
    months = {
        'January': '01', 'February': '02', 'March': '03', 'April': '04',
        'May': '05', 'June': '06', 'July': '07', 'August': '08',
        'September': '09', 'October': '10', 'November': '11', 'December': '12'
    }

    for month_name, month_num in months.items():
        if month_name in date_str:
            year_match = re.search(r'(\d{4})', date_str)
            if year_match:
                year = year_match.group(1)
                return f"{year}-{month_num}-01"

    return None


def parse_skills(content: str) -> List[Dict[str, Any]]:
    """Parse all skills sections."""
    skills = []

    # Find Technical Skills section (extract until ## Professional Experience)
    skills_start = content.find('## Technical Skills')
    exp_start = content.find('## Professional Experience', skills_start)

    if skills_start == -1:
        return skills

    skills_text = content[skills_start:exp_start] if exp_start != -1 else content[skills_start:]

    # Find all skill category sections (### Category Name)
    category_pattern = r'###\s+(.+?)\n((?:-.+?\n)+)'
    matches = re.finditer(category_pattern, skills_text, re.MULTILINE)

    display_order = 0

    for match in matches:
        category_name = match.group(1).strip()
        skills_block = match.group(2).strip()

        # Extract individual skills (lines starting with -)
        skill_lines = [line.strip()[2:].strip() for line in skills_block.split('\n') if line.strip().startswith('-')]

        for skill_name in skill_lines:
            if skill_name:
                skills.append({
                    'skill_name': skill_name,
                    'category': category_name,
                    'proficiency_level': None,
                    'years_of_experience': None,
                    'display_order': display_order
                })
                display_order += 1

    return skills


def parse_education(content: str) -> List[Dict[str, Any]]:
    """Parse education section."""
    education = []

    # Find Education section
    edu_section = re.search(r'## Education\n(.+?)(?=\n##|$)', content, re.DOTALL)
    if not edu_section:
        return education

    edu_text = edu_section.group(1).strip()

    # Split by lines starting with -
    edu_lines = [line.strip()[2:].strip() for line in edu_text.split('\n') if line.strip().startswith('-')]

    for idx, edu_line in enumerate(edu_lines):
        # Example: "SMK Negeri 7 Bandung (High School) - Analytical Chemistry (2009-2011)"

        # Extract institution name (before first parenthesis or dash)
        institution_match = re.search(r'^([^(]+?)(?:\s*\(|\s*-)', edu_line)
        institution_name = institution_match.group(1).strip() if institution_match else edu_line
        # Remove markdown bold syntax
        institution_name = institution_name.replace('**', '').strip()

        # Extract degree/field
        degree_match = re.search(r'-\s*([^(]+?)\s*\(', edu_line)
        degree_or_field = degree_match.group(1).strip() if degree_match else None

        # Extract date range (last parentheses)
        date_match = re.search(r'\((\d{4})-(\d{4})\)', edu_line)
        start_date = None
        end_date = None

        if date_match:
            start_year = date_match.group(1)
            end_year = date_match.group(2)
            start_date = f"{start_year}-01-01"  # Year precision
            end_date = f"{end_year}-12-31"

        education.append({
            'institution_name': institution_name,
            'degree_or_field': degree_or_field,
            'location': None,
            'description': None,
            'start_date': start_date,
            'end_date': end_date,
            'date_precision': 'year',
            'is_current': False,
            'display_order': idx
        })

    return education


def parse_certifications(content: str) -> List[Dict[str, Any]]:
    """Parse certifications section."""
    certifications = []

    # Find Certifications section
    cert_section = re.search(r'## Certifications\n(.+?)(?=\n##|$)', content, re.DOTALL)
    if not cert_section:
        return certifications

    cert_text = cert_section.group(1).strip()

    # Split by lines starting with -
    cert_lines = [line.strip()[2:].strip() for line in cert_text.split('\n') if line.strip().startswith('-')]

    for idx, cert_line in enumerate(cert_lines):
        certifications.append({
            'certification_name': cert_line,
            'issuing_organization': None,
            'credential_id': None,
            'credential_url': None,
            'description': None,
            'issue_date': None,
            'expiry_date': None,
            'date_precision': 'year',
            'display_order': idx
        })

    return certifications


def import_to_database(data: Dict[str, Any], dry_run: bool = False) -> Optional[str]:
    """Import data to Supabase using create_master_profile RPC."""

    if dry_run:
        print("\n=== DRY RUN MODE ===")
        print("\nProfile Data:")
        print(json.dumps(data['profile'], indent=2))
        print(f"\nWork Experiences: {len(data['experiences'])} entries")
        print(f"Skills: {len(data['skills'])} entries")
        print(f"Education: {len(data['education'])} entries")
        print(f"Certifications: {len(data['certifications'])} entries")
        return None

    # Initialize Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Call create_master_profile RPC
    # Note: Try with education/certifications if RPC supports it
    try:
        response = supabase.rpc('create_master_profile', {
            'p_profile': data['profile'],
            'p_experiences': data['experiences'],
            'p_skills': data['skills'],
            'p_education': data['education'],
            'p_certifications': data['certifications']
        }).execute()
    except Exception as e:
        # Fallback: Try without education/certifications if RPC doesn't support it yet
        if 'parameter' in str(e).lower() or 'function' in str(e).lower():
            print("\n⚠️  RPC doesn't support education/certifications yet, importing without them...")
            response = supabase.rpc('create_master_profile', {
                'p_profile': data['profile'],
                'p_experiences': data['experiences'],
                'p_skills': data['skills']
            }).execute()
        else:
            raise e

    if response.data:
        profile_id = response.data
        print(f"\n✅ Profile imported successfully!")
        print(f"Profile ID: {profile_id}")
        return profile_id
    else:
        raise Exception(f"Failed to import profile: {response}")


def main():
    parser = argparse.ArgumentParser(description='Migrate master_profile.md to database')
    parser.add_argument('--dry-run', action='store_true', help='Preview without importing')
    parser.add_argument('--backup', action='store_true', help='Backup original file before migration')
    parser.add_argument('--file', type=str, help='Path to master_profile.md (default: 01_Profile/master_profile.md)')

    args = parser.parse_args()

    # Determine file path
    file_path = Path(args.file) if args.file else MASTER_PROFILE_PATH

    if not file_path.exists():
        print(f"❌ Error: File not found: {file_path}")
        return 1

    print(f"📄 Reading {file_path}...")

    # Load and parse markdown
    content = load_markdown(file_path)

    # Extract full name from title (first line)
    title_match = re.search(r'^#\s+(.+?)\s*-\s*Master Profile', content, re.MULTILINE)
    full_name = title_match.group(1).strip() if title_match else "Unknown"

    # Parse all sections
    contact = parse_contact_info(content)
    summary = parse_professional_summary(content)
    experiences = parse_work_experiences(content)
    skills = parse_skills(content)
    education = parse_education(content)
    certifications = parse_certifications(content)

    # Build profile data
    profile_data = {
        'profile': {
            'profile_name': f"{full_name} - Master Profile",
            'is_default': True,
            'full_name': full_name,
            'email': contact.get('email', ''),
            'phone_primary': contact.get('phone_primary'),
            'phone_secondary': contact.get('phone_secondary'),
            'linkedin_url': contact.get('linkedin_url'),
            'github_url': None,
            'portfolio_url': None,
            'location': contact.get('location', ''),
            'professional_summary': summary,
            'years_of_experience': 9,  # 2016-2025
            'current_position': 'Software Engineer'
        },
        'experiences': experiences,
        'skills': skills,
        'education': education,
        'certifications': certifications
    }

    # Backup if requested
    if args.backup and not args.dry_run:
        backup_path = file_path.parent / f"{file_path.stem}_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        print(f"💾 Creating backup: {backup_path}")
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(content)

    # Import to database
    try:
        profile_id = import_to_database(profile_data, dry_run=args.dry_run)

        if not args.dry_run and profile_id:
            print(f"\n✅ Migration completed successfully!")
            print(f"\nImported:")
            print(f"  - 1 profile")
            print(f"  - {len(experiences)} work experiences")
            print(f"  - {len(skills)} skills")
            print(f"  - {len(education)} education entries")
            print(f"  - {len(certifications)} certifications")
            print(f"\nProfile ID: {profile_id}")
            print(f"\nView at: http://localhost:5173/profiles/{profile_id}")

        return 0

    except Exception as e:
        print(f"\n❌ Error during migration: {e}")
        return 1


if __name__ == '__main__':
    exit(main())
