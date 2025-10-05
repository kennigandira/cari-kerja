#!/usr/bin/env python3
"""
Convert markdown CV and cover letters to LaTeX format
"""

import os
import re

CV_LATEX_TEMPLATE_START = r"""%-------------------------
% Resume in Latex
% Author: Kenni Gandira Alamsyah
%------------------------

\documentclass[a4paper, 11pt]{article}

\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}

\usepackage{xcolor}
\usepackage[sfdefault]{roboto}

\pagestyle{fancy}
\fancyhf{} % clear all header and footer fields
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

% Adjust margins
\addtolength{\oddsidemargin}{-0.7in}
\addtolength{\evensidemargin}{-0.7in}
\addtolength{\textwidth}{1.4in}
\addtolength{\topmargin}{-.5in}
\addtolength{\textheight}{1.0in}

\urlstyle{same}

\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

% Sections formatting
\titleformat{\section}{
  \vspace{-4pt}\scshape\raggedright\large
}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

%-------------------------
% Custom commands
\newcommand{\resumeItem}[1]{
  \item\small{
    {#1 \vspace{-2pt}}
  }
}

\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabularx}{0.987\textwidth}[t]{
  >{\raggedright\arraybackslash}X
  >{\centering\arraybackslash}X
  >{\raggedleft\arraybackslash}X }
      \textbf{#1} & #2 & #3 \\
    \end{tabularx}
    \textit{\small#4}\\
    \vspace{-7pt}
}

\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{0.987\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1\\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.1in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}\vspace{5pt}}
\newcommand{\resumeItemListStart}{\begin{itemize}[leftmargin=0.22in]}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-20pt}}

\newcommand{\link}[2]{{\color[HTML]{096dd9}\href[pdfnewwindow=true]{#1}{\small{#2}}}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\begin{document}
"""

COVER_LETTER_TEMPLATE_START = r"""\documentclass[11pt]{letter}

\usepackage[utf8]{inputenc}
\usepackage{geometry}
\usepackage{hyperref}

\geometry{
  a4paper,
  left=20mm,
  right=20mm,
  top=20mm,
  bottom=20mm}

\signature{Kenni Gandira Alamsyah}
\address{
  Bangkok, Thailand \\
  +62 81313635148 \\
  devkenni.g@gmail.com \\
  \href{https://www.linkedin.com/in/kenni-g-alamsyah/}{linkedin.com/in/kenni-g-alamsyah}
}

\begin{document}

\begin{letter}{
  Hiring Manager \\
  Starcube Co., Ltd. \\
  Bangkok, Thailand
}

\opening{Dear Hiring Manager,}
"""

def escape_latex(text):
    """Escape special LaTeX characters"""
    # First replace & to avoid double escaping
    text = text.replace('&', r'\&')
    # Then other special chars
    replacements = {
        '%': r'\%',
        '$': r'\$',
        '#': r'\#',
        '_': r'\_',
        '→': r'$\\rightarrow$',  # Arrow symbol
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text

def md_to_latex_cv(md_content):
    """Convert markdown CV to LaTeX"""
    lines = md_content.split('\n')
    latex = CV_LATEX_TEMPLATE_START

    # Parse and convert content
    in_experience = False
    current_company = None

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # Skip header lines
        if line.startswith('#') and 'Kenni Gandira Alamsyah' in line:
            i += 1
            continue
        if line.startswith('**Frontend Engineer') or '📍' in line or '🔗' in line or line == '---':
            i += 1
            continue

        # Professional Summary
        if line == '## Professional Summary':
            latex += "\n%-----------PROFESSIONAL SUMMARY-----------\n"
            latex += "\\section{Professional Summary}\n"
            i += 1
            # Get summary text
            while i < len(lines) and lines[i].strip() and not lines[i].strip().startswith('#'):
                latex += "\\small{" + escape_latex(lines[i].strip()) + "}\n"
                i += 1
            continue

        # Technical Skills
        if line == '## Technical Skills':
            latex += "\n%-----------TECHNICAL SKILLS-----------\n"
            latex += "\\section{Technical Skills}\n"
            latex += "    \\resumeSubHeadingListStart\n"
            latex += "        \\small{\n"
            i += 1
            current_skill_cat = None
            skills_items = []
            while i < len(lines) and (lines[i].strip().startswith('**') or lines[i].strip().startswith('-') or not lines[i].strip()):
                skill_line = lines[i].strip()
                if skill_line.startswith('**'):
                    if current_skill_cat and skills_items:
                        latex += f"            \\item \\textbf{{{escape_latex(current_skill_cat)}:}} {', '.join(skills_items)}\n"
                        skills_items = []
                    current_skill_cat = skill_line.replace('**', '').replace(':', '').strip()
                    i += 1
                elif skill_line.startswith('-'):
                    skill_text = skill_line[1:].strip()
                    skills_items.append(escape_latex(skill_text))
                    i += 1
                else:
                    i += 1
            if current_skill_cat and skills_items:
                latex += f"            \\item \\textbf{{{escape_latex(current_skill_cat)}:}} {', '.join(skills_items)}\n"
            latex += "        }\n"
            latex += "    \\resumeSubHeadingListEnd\n"
            continue

        # Work Experience
        if line == '## Professional Experience':
            latex += "\n%-----------WORK EXPERIENCE-----------\n"
            latex += "\\section{Work Experience}\n"
            latex += "    \\resumeSubHeadingListStart\n"
            in_experience = True
            i += 1
            continue

        if in_experience and line.startswith('###'):
            # Company and role
            parts = line.replace('###', '').strip().split('|')
            if len(parts) == 2:
                company = parts[0].strip()
                role = parts[1].strip()
                i += 1
                # Get date and location
                date_loc = lines[i].strip().replace('**', '')
                date_parts = date_loc.split('|')
                dates = date_parts[0].strip() if date_parts else ''
                location = date_parts[1].strip() if len(date_parts) > 1 else ''
                latex += f"        \\resumeSubheading\n"
                latex += f"            {{{role}}}{{{company}, {location}}}{{{dates}}}{{}}\n"
                latex += "            \\resumeItemListStart\n"
                i += 1
                # Get bullets
                while i < len(lines) and (lines[i].strip().startswith('-') or lines[i].strip().startswith('**') or not lines[i].strip()):
                    bullet = lines[i].strip()
                    if bullet.startswith('-'):
                        bullet_text = escape_latex(bullet[1:].strip())
                        latex += f"                \\resumeItem{{{bullet_text}}}\n"
                    i += 1
                latex += "            \\resumeItemListEnd\n\n"
                continue

        # Education
        if line == '## Education':
            latex += "    \\resumeSubHeadingListEnd\n"  # Close experience
            latex += "\n%-----------EDUCATION-----------\n"
            latex += "\\section{Education}\n"
            latex += "    \\resumeSubHeadingListStart\n"
            i += 1
            while i < len(lines) and lines[i].strip() and not lines[i].strip().startswith('##'):
                edu_line = lines[i].strip().replace('**', '')
                if '-' in edu_line:
                    parts = edu_line.split('-')
                    school = parts[0].strip()
                    rest = parts[1].strip() if len(parts) > 1 else ''
                    if '|' in rest:
                        major_date = rest.split('|')
                        major = major_date[0].strip()
                        dates = major_date[1].strip() if len(major_date) > 1 else ''
                        latex += f"        \\resumeProjectHeading\n"
                        latex += f"            {{\\textbf{{{school}}} $|$ \\emph{{{major}}}}}{{{dates}}}\n"
                i += 1
            latex += "    \\resumeSubHeadingListEnd\n"
            continue

        # Key Achievements
        if line == '## Key Achievements':
            latex += "\n%-----------KEY ACHIEVEMENTS-----------\n"
            latex += "\\section{Key Achievements}\n"
            latex += "    \\resumeSubHeadingListStart\n"
            latex += "        \\small{\n"
            i += 1
            while i < len(lines) and (lines[i].strip().startswith('-') or not lines[i].strip()):
                achievement = lines[i].strip()
                if achievement.startswith('-'):
                    ach_text = escape_latex(achievement[1:].strip())
                    latex += f"            \\item {ach_text}\n"
                i += 1
            latex += "        }\n"
            latex += "    \\resumeSubHeadingListEnd\n"
            continue

        # Why Game Development
        if line == '## Why Game Development?':
            latex += "\n%-----------WHY GAME DEVELOPMENT-----------\n"
            latex += "\\section{Why Game Development?}\n"
            i += 1
            while i < len(lines) and lines[i].strip() and not lines[i].strip().startswith('##'):
                latex += "\\small{" + escape_latex(lines[i].strip()) + "}\n"
                i += 1
            continue

        # Languages
        if line == '## Languages':
            latex += "\n%-----------LANGUAGES-----------\n"
            latex += "\\section{Languages}\n"
            latex += "    \\resumeSubHeadingListStart\n"
            latex += "        \\small{\n"
            i += 1
            langs = []
            while i < len(lines) and (lines[i].strip().startswith('-') or not lines[i].strip()):
                lang = lines[i].strip()
                if lang.startswith('-'):
                    langs.append(escape_latex(lang[1:].strip()))
                i += 1
            latex += f"            \\item {', '.join(langs)}\n"
            latex += "        }\n"
            latex += "    \\resumeSubHeadingListEnd\n"
            continue

        i += 1

    latex += "\n\\end{document}\n"
    return latex

def md_to_latex_cover_letter(md_content):
    """Convert markdown cover letter to LaTeX"""
    lines = md_content.split('\n')
    latex = COVER_LETTER_TEMPLATE_START

    # Extract body paragraphs
    in_body = False
    for line in lines:
        line = line.strip()
        if line == 'Dear Hiring Manager,':
            in_body = True
            continue
        if in_body:
            if line.startswith('Best regards') or line.startswith('Kenni Gandira'):
                break
            if line:
                latex += escape_latex(line) + "\n\n"

    latex += "\\closing{Best regards,}\n\n"
    latex += "\\end{letter}\n\n"
    latex += "\\end{document}\n"

    return latex

# Convert files
base_dir = "/Users/user/Documents/cari-kerja/04_Applications/Starcube_FrontendDeveloperGames_2025-10-05"

cv_files = [
    "starcube-frontenddevelopergames-cv",
    "optimistic-starcube-frontenddevelopergames-cv",
    "skeptical-starcube-frontenddevelopergames-cv"
]

cover_letter_files = [
    "starcube-cover-letter-frontenddevelopergames-Kenni",
    "optimistic-starcube-cover-letter-frontenddevelopergames-Kenni",
    "skeptical-starcube-cover-letter-frontenddevelopergames-Kenni"
]

print("Converting CV files...")
for cv_file in cv_files:
    md_path = os.path.join(base_dir, f"{cv_file}.md")
    tex_path = os.path.join(base_dir, f"{cv_file}.tex")

    if os.path.exists(md_path):
        with open(md_path, 'r') as f:
            md_content = f.read()

        latex_content = md_to_latex_cv(md_content)

        with open(tex_path, 'w') as f:
            f.write(latex_content)

        print(f"✓ Converted {cv_file}.md -> {cv_file}.tex")

print("\nConverting cover letter files...")
for cl_file in cover_letter_files:
    md_path = os.path.join(base_dir, f"{cl_file}.md")
    tex_path = os.path.join(base_dir, f"{cl_file}.tex")

    if os.path.exists(md_path):
        with open(md_path, 'r') as f:
            md_content = f.read()

        latex_content = md_to_latex_cover_letter(md_content)

        with open(tex_path, 'w') as f:
            f.write(latex_content)

        print(f"✓ Converted {cl_file}.md -> {cl_file}.tex")

print("\nConversion complete!")
