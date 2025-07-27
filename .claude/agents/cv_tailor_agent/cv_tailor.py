#!/usr/bin/env python3
"""
CV Tailoring Agent
Automatically tailors CV and generates cover letter based on job descriptions
"""

import os
import re
import json
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import argparse


class CVTailor:
    def __init__(self):
        self.base_dir = Path(__file__).parent
        self.templates_dir = self.base_dir / "templates"
        self.input_dir = self.base_dir / "input"
        self.output_dir = self.base_dir / "output"
        
        # Load master CV data
        self.master_data = self.extract_cv_data()
        
    def extract_cv_data(self) -> Dict:
        """Extract structured data from master CV"""
        return {
            "name": "Kenni Gandira Alamsyah",
            "email": "devkenni.g@gmail.com",
            "phone": "+66 0842704245",
            "linkedin": "linkedin.com/in/kenni-g-alamsyah/",
            
            "summary_variations": {
                "frontend_focused": "Frontend Engineer with 8+ years building high-performance web applications for Southeast Asia's leading platforms. Specialized in React/TypeScript ecosystem with focus on developer experience and scalable architecture. Passionate about creating intuitive interfaces that drive business value.",
                "fullstack": "Full-Stack Software Engineer with 8+ years of experience delivering scalable web applications. Expert in React/TypeScript frontend development with strong backend capabilities in Node.js. Proven track record of optimizing performance and driving business metrics.",
                "performance_focused": "Software Engineer specializing in web performance optimization with 8+ years of experience. Expert in Core Web Vitals, React performance patterns, and scalable architecture. Delivered measurable improvements in user engagement and revenue across multiple platforms.",
                "product_focused": "Product-oriented Software Engineer with 8+ years building user-centric web applications. Combines technical expertise in React/TypeScript with strong product sense to deliver features that drive engagement and business growth."
            },
            
            "experience": [
                {
                    "title": "Software Engineer",
                    "company": "PropertyScout",
                    "location": "Thailand",
                    "period": "2023 -- Present",
                    "type": "Real Estate Platform",
                    "achievements": [
                        {
                            "text": "Increased property listing updates by 27% through dashboard UX optimization, strengthening position as Thailand's most comprehensive property portal.",
                            "keywords": ["ux", "dashboard", "optimization", "real estate"],
                            "impact_type": "growth"
                        },
                        {
                            "text": "Built automated availability system processing 17K+ monthly updates, reducing manual work by 60% and improving data accuracy.",
                            "keywords": ["automation", "system design", "efficiency", "data"],
                            "impact_type": "efficiency"
                        },
                        {
                            "text": "Improved site performance by 44% achieving 1.2s page load time through Core Web Vitals optimization.",
                            "keywords": ["performance", "core web vitals", "optimization", "speed"],
                            "impact_type": "performance"
                        },
                        {
                            "text": "Achieved a 306% increase in property listings by optimizing the dashboard UX, which enhanced data quality and agent usability.",
                            "keywords": ["ux", "dashboard", "growth", "data quality"],
                            "impact_type": "growth"
                        },
                        {
                            "text": "Engineered a listing availability check system that processes 17,000 monthly updates, driving THB 25M in revenue and contributing to year-end profitability.",
                            "keywords": ["revenue", "system design", "business impact", "profitability"],
                            "impact_type": "revenue"
                        }
                    ]
                },
                {
                    "title": "Software Engineer",
                    "company": "Accelbyte",
                    "location": "Indonesia",
                    "period": "2022 -- 2023",
                    "type": "Gaming Developer Tools",
                    "achievements": [
                        {
                            "text": "Optimized bundle size by 30% through code splitting and lazy loading strategies.",
                            "keywords": ["performance", "optimization", "code splitting", "bundle size"],
                            "impact_type": "performance"
                        },
                        {
                            "text": "Resolved performance bottlenecks in game developer dashboard, improving user experience.",
                            "keywords": ["performance", "dashboard", "user experience", "gaming"],
                            "impact_type": "performance"
                        },
                        {
                            "text": "Reduced compilation time from 15 to 9 minutes (40% improvement) by optimizing build tools.",
                            "keywords": ["build tools", "optimization", "developer experience", "efficiency"],
                            "impact_type": "efficiency"
                        },
                        {
                            "text": "Led the initiative to enhance platform performance by re-architecting data fetching patterns and optimizing image delivery.",
                            "keywords": ["architecture", "performance", "data fetching", "leadership"],
                            "impact_type": "technical"
                        }
                    ]
                },
                {
                    "title": "Frontend Engineer",
                    "company": "99 Group",
                    "location": "Bandung, Indonesia",
                    "period": "2020 -- 2022",
                    "type": "Real Estate Platform",
                    "achievements": [
                        {
                            "text": "Improved Core Web Vitals: LCP from 4.5s to 1.2s, driving 25% engagement increase.",
                            "keywords": ["core web vitals", "performance", "engagement", "metrics"],
                            "impact_type": "performance"
                        },
                        {
                            "text": "Created component library and style guide, improving team productivity by 30%.",
                            "keywords": ["component library", "productivity", "team", "design system"],
                            "impact_type": "efficiency"
                        },
                        {
                            "text": "Implemented SEO best practices contributing to platform's market leadership in Indonesia.",
                            "keywords": ["seo", "growth", "market leadership", "optimization"],
                            "impact_type": "growth"
                        },
                        {
                            "text": "Enhanced SEO, growing organic traffic from 4,000 to 7,500 monthly visits (87% increase) with strategic content updates architecturally.",
                            "keywords": ["seo", "traffic growth", "architecture", "content strategy"],
                            "impact_type": "growth"
                        }
                    ]
                },
                {
                    "title": "Frontend Engineer",
                    "company": "Tiket.com",
                    "location": "Jakarta, Indonesia",
                    "period": "2019 -- 2020",
                    "type": "Travel & Hospitality",
                    "achievements": [
                        {
                            "text": "Implemented TypeScript from scratch, establishing type safety patterns across the platform.",
                            "keywords": ["typescript", "type safety", "migration", "architecture"],
                            "impact_type": "technical"
                        },
                        {
                            "text": "Built features using React and modern development practices, improving code maintainability.",
                            "keywords": ["react", "maintainability", "modern practices", "features"],
                            "impact_type": "technical"
                        },
                        {
                            "text": "Modernized legacy codebase to React, implementing component-based architecture.",
                            "keywords": ["modernization", "react", "architecture", "legacy code"],
                            "impact_type": "technical"
                        }
                    ]
                },
                {
                    "title": "Frontend Developer",
                    "company": "Mirum Agency (now VML)",
                    "location": "Bandung, Indonesia",
                    "period": "2018 -- 2019",
                    "type": "Marketing Agency",
                    "achievements": [
                        {
                            "text": "Managed multiple concurrent client projects, ensuring timely delivery and maintaining high-quality standards.",
                            "keywords": ["project management", "client work", "quality", "delivery"],
                            "impact_type": "delivery"
                        },
                        {
                            "text": "Developed official website for Binus University, Indonesia's leading private university, serving 30,000+ students and faculty.",
                            "keywords": ["education", "large scale", "university", "web development"],
                            "impact_type": "scale"
                        }
                    ]
                },
                {
                    "title": "Web Developer",
                    "company": "Hazani Rangka Utama",
                    "location": "Bandung, Indonesia",
                    "period": "2017 -- 2018",
                    "type": "IT Services",
                    "achievements": [
                        {
                            "text": "Designed and developed custom WordPress themes, generating over 10,000 sales through user-centric design.",
                            "keywords": ["wordpress", "sales", "design", "themes"],
                            "impact_type": "revenue"
                        }
                    ]
                },
                {
                    "title": "Frontend Developer",
                    "company": "PT NTCI",
                    "location": "Yogyakarta, Indonesia",
                    "period": "2016 -- 2017",
                    "type": "Education and Ecommerce",
                    "achievements": [
                        {
                            "text": "First frontend hire, helped scale team from 3 to 15 engineers through active participation in hiring and mentoring.",
                            "keywords": ["team building", "hiring", "mentoring", "scaling"],
                            "impact_type": "team"
                        },
                        {
                            "text": "Established development standards and interview process for consistent code quality.",
                            "keywords": ["standards", "process", "quality", "hiring"],
                            "impact_type": "process"
                        },
                        {
                            "text": "Built 3 products from inception: e-learning platform, ticketing system, and e-commerce site.",
                            "keywords": ["product development", "e-learning", "ecommerce", "full cycle"],
                            "impact_type": "delivery"
                        }
                    ]
                }
            ],
            
            "skills": {
                "core": ["React", "TypeScript", "Next.js", "CSS/Tailwind", "JavaScript ES6+", "HTML5"],
                "experience": ["Vue.js", "Node.js", "Jest", "React Testing Library", "Git", "Docker", "Storybook"],
                "exposure": ["AWS (S3, CloudFront)", "GraphQL", "Redis", "PHP", "CI/CD (GitHub Actions)"],
                "all_skills": ["React", "TypeScript", "Next.js", "Vue.js", "Nuxt.js", "JavaScript", 
                              "HTML", "CSS", "Tailwind CSS", "Redux", "React Query", "Node.js", 
                              "Express", "NestJS", "REST API", "GraphQL", "PHP", "WordPress",
                              "Jest", "React Testing Library", "Cypress", "Storybook", "Git",
                              "Docker", "AWS", "Redis", "RabbitMQ", "CI/CD"]
            },
            
            "education": [
                {
                    "institution": "Free Code Camp",
                    "degree": "Full Stack Web Development Certification",
                    "year": "2016"
                },
                {
                    "institution": "SMK Negeri 7 Bandung",
                    "degree": "Analytical Chemistry",
                    "year": "2009 -- 2011"
                }
            ],
            
            "awards": [
                {
                    "title": "99 Group Hackathon",
                    "achievement": "Best UI/UX Design Award",
                    "year": "2021"
                },
                {
                    "title": "Quarterly Award Q2/21",
                    "achievement": "Outstanding Performance Recognition",
                    "year": "2021"
                }
            ]
        }
    
    def analyze_job_description(self, job_description: str) -> Dict:
        """Analyze job description to extract key requirements and keywords"""
        jd_lower = job_description.lower()
        
        # Detect job focus
        frontend_keywords = ["frontend", "front-end", "react", "vue", "ui/ux", "user interface", "css", "javascript"]
        backend_keywords = ["backend", "back-end", "api", "database", "server", "microservice", "node.js", "python"]
        fullstack_keywords = ["full stack", "fullstack", "full-stack"]
        performance_keywords = ["performance", "optimization", "core web vitals", "speed", "scalability"]
        
        focus = "frontend_focused"  # default
        if any(kw in jd_lower for kw in fullstack_keywords):
            focus = "fullstack"
        elif sum(1 for kw in backend_keywords if kw in jd_lower) > 2:
            focus = "fullstack"
        elif any(kw in jd_lower for kw in performance_keywords):
            focus = "performance_focused"
        
        # Extract required skills
        required_skills = []
        for skill in self.master_data["skills"]["all_skills"]:
            if skill.lower() in jd_lower:
                required_skills.append(skill)
        
        # Extract experience level
        years_match = re.search(r'(\d+)\+?\s*years?', jd_lower)
        required_years = int(years_match.group(1)) if years_match else 5
        
        return {
            "focus": focus,
            "required_skills": required_skills,
            "required_years": required_years,
            "keywords": self.extract_keywords(job_description)
        }
    
    def extract_keywords(self, text: str) -> List[str]:
        """Extract important keywords from job description"""
        # Common tech and business keywords
        keywords = []
        keyword_patterns = [
            r'(react|vue|angular|typescript|javascript|node\.?js|python|java|php)',
            r'(aws|azure|gcp|cloud|docker|kubernetes|ci/cd)',
            r'(agile|scrum|kanban|jira)',
            r'(performance|optimization|scalability|security)',
            r'(team lead|mentor|senior|principal|staff)',
            r'(startup|enterprise|saas|b2b|b2c)',
            r'(real estate|fintech|e-commerce|healthcare|gaming)'
        ]
        
        for pattern in keyword_patterns:
            matches = re.findall(pattern, text.lower())
            keywords.extend(matches)
        
        return list(set(keywords))
    
    def select_relevant_experiences(self, job_analysis: Dict) -> List[Dict]:
        """Select and order experiences based on job relevance"""
        experiences = []
        keywords = job_analysis["keywords"]
        
        for exp in self.master_data["experience"]:
            # Calculate relevance score
            score = 0
            selected_achievements = []
            
            for achievement in exp["achievements"]:
                achievement_score = sum(1 for kw in achievement["keywords"] if any(jk in kw for jk in keywords))
                if achievement_score > 0:
                    selected_achievements.append(achievement)
                    score += achievement_score
            
            if selected_achievements:
                exp_copy = exp.copy()
                exp_copy["achievements"] = selected_achievements[:3]  # Top 3 most relevant
                exp_copy["relevance_score"] = score
                experiences.append(exp_copy)
        
        # Sort by relevance, then by recency
        experiences.sort(key=lambda x: (-x["relevance_score"], x["period"]), reverse=True)
        
        # Return top 6 experiences
        return experiences[:6]
    
    def generate_tailored_cv_content(self, job_description: str) -> str:
        """Generate tailored CV content in LaTeX format"""
        job_analysis = self.analyze_job_description(job_description)
        selected_experiences = self.select_relevant_experiences(job_analysis)
        
        # Select appropriate summary
        summary = self.master_data["summary_variations"][job_analysis["focus"]]
        
        # Filter skills based on job requirements
        core_skills = [s for s in self.master_data["skills"]["core"] if s in job_analysis["required_skills"]]
        if len(core_skills) < 3:
            core_skills = self.master_data["skills"]["core"][:6]
        
        exp_skills = [s for s in self.master_data["skills"]["experience"] if s in job_analysis["required_skills"]]
        if len(exp_skills) < 3:
            exp_skills = self.master_data["skills"]["experience"][:6]
        
        # Generate LaTeX content
        latex_content = self.generate_latex_cv(summary, selected_experiences, core_skills, exp_skills)
        
        return latex_content
    
    def generate_latex_cv(self, summary: str, experiences: List[Dict], 
                         core_skills: List[str], exp_skills: List[str]) -> str:
        """Generate LaTeX CV content"""
        latex_template = r"""%-------------------------
% Resume in Latex
% Author: Kenni Gandira Alamsyah (Tailored Version)
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
\input{glyphtounicode}

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

\pdfgentounicode=1

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

%----------HEADING----------
\begin{center}
    \textbf{\Huge \scshape """ + self.master_data["name"] + r"""} \\ \vspace{8pt}
    \link{mailto:""" + self.master_data["email"] + r"""}{""" + self.master_data["email"] + r"""} $|$ 
    \link{https://api.whatsapp.com/send/?phone=""" + self.master_data["phone"].replace("+", "") + r"""}{""" + self.master_data["phone"] + r"""} $|$ 
    \link{https://""" + self.master_data["linkedin"] + r"""}{""" + self.master_data["linkedin"] + r"""}
\end{center}

%-----------PROFESSIONAL SUMMARY-----------
\section{Professional Summary}
""" + summary + r"""

%-----------WORK EXPERIENCE-----------
\section{Work Experience}
    \resumeSubHeadingListStart"""
        
        # Add experiences
        for exp in experiences:
            latex_template += r"""
        \resumeSubheading
            {""" + exp["title"] + r"""}{""" + exp["company"] + r""" (""" + exp["type"] + r"""), """ + exp["location"] + r"""}{""" + exp["period"] + r"""}{}
            \resumeItemListStart"""
            
            for achievement in exp["achievements"]:
                latex_template += r"""
                \resumeItem{""" + achievement["text"] + r"""}"""
            
            latex_template += r"""
            \resumeItemListEnd
"""
        
        latex_template += r"""    \resumeSubHeadingListEnd

%-----------TECHNICAL SKILLS-----------
\section{Technical Skills}
    \resumeSubHeadingListStart
        \small{
            \item \textbf{Core:} """ + ", ".join(core_skills) + r"""
            \item \textbf{Experience:} """ + ", ".join(exp_skills) + r"""
        }
    \resumeSubHeadingListEnd

%-----------EDUCATION-----------
\section{Education}
    \resumeSubHeadingListStart"""
        
        for edu in self.master_data["education"]:
            latex_template += r"""
        \resumeProjectHeading
            {\textbf{""" + edu["institution"] + r"""} $|$ \emph{""" + edu["degree"] + r"""}}{""" + edu["year"] + r"""}"""
        
        latex_template += r"""
    \resumeSubHeadingListEnd

%-----------LEADERSHIP & AWARDS-----------
\section{Leadership \& Awards}
    \resumeSubHeadingListStart"""
        
        for award in self.master_data["awards"]:
            latex_template += r"""
        \resumeProjectHeading
            {\textbf{""" + award["title"] + r"""} $|$ \emph{""" + award["achievement"] + r"""}}{""" + award["year"] + r"""}"""
        
        latex_template += r"""
    \resumeSubHeadingListEnd

\end{document}"""
        
        return latex_template
    
    def generate_cover_letter(self, job_description: str, company_name: str = "Your Company") -> str:
        """Generate a tailored cover letter"""
        job_analysis = self.analyze_job_description(job_description)
        
        # Select most relevant experiences
        relevant_exps = self.select_relevant_experiences(job_analysis)[:2]
        
        cover_letter = f"""Dear Hiring Manager,

I am writing to express my strong interest in the Software Engineer position at {company_name}. With over 8 years of experience building high-performance web applications for leading platforms across Southeast Asia, I am confident in my ability to contribute significantly to your team.

"""
        
        # Add relevant experience paragraph
        if relevant_exps:
            exp = relevant_exps[0]
            achievement = exp["achievements"][0] if exp["achievements"] else None
            if achievement:
                cover_letter += f"""In my current role at {exp["company"]}, I have {achievement["text"].lower()} This experience has prepared me well for the challenges and opportunities at {company_name}.

"""
        
        # Add skills paragraph
        relevant_skills = job_analysis["required_skills"][:5]
        if relevant_skills:
            cover_letter += f"""My technical expertise includes {', '.join(relevant_skills)}, which aligns perfectly with your requirements. I have a proven track record of delivering scalable solutions that drive business value while maintaining high code quality standards.

"""
        
        # Closing
        cover_letter += f"""I am particularly drawn to this opportunity at {company_name} because of the chance to work on challenging problems that impact users at scale. I am excited about the possibility of bringing my experience in performance optimization and user-centric development to your team.

Thank you for considering my application. I look forward to discussing how my background and skills can contribute to {company_name}'s continued success.

Best regards,
{self.master_data["name"]}
{self.master_data["email"]}
{self.master_data["phone"]}"""
        
        return cover_letter
    
    def save_outputs(self, job_description: str, company_name: str = "Your Company"):
        """Generate and save all outputs (MD, TEX, PDF)"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Generate tailored CV
        cv_latex = self.generate_tailored_cv_content(job_description)
        cv_tex_path = self.output_dir / "tex" / f"cv_tailored_{timestamp}.tex"
        cv_tex_path.write_text(cv_latex)
        
        # Generate cover letter
        cover_letter = self.generate_cover_letter(job_description, company_name)
        cover_letter_path = self.output_dir / "md" / f"cover_letter_{timestamp}.md"
        cover_letter_path.write_text(cover_letter)
        
        # Also save cover letter as LaTeX
        cover_letter_latex = self.generate_cover_letter_latex(cover_letter, company_name)
        cover_letter_tex_path = self.output_dir / "tex" / f"cover_letter_{timestamp}.tex"
        cover_letter_tex_path.write_text(cover_letter_latex)
        
        # Compile PDFs
        try:
            # Compile CV
            subprocess.run(
                ["pdflatex", "-output-directory", str(self.output_dir / "pdf"), str(cv_tex_path)],
                capture_output=True,
                check=True
            )
            
            # Compile cover letter
            subprocess.run(
                ["pdflatex", "-output-directory", str(self.output_dir / "pdf"), str(cover_letter_tex_path)],
                capture_output=True,
                check=True
            )
            
            print(f"✅ Successfully generated tailored CV and cover letter!")
            print(f"📄 CV LaTeX: {cv_tex_path}")
            print(f"📄 CV PDF: {self.output_dir / 'pdf' / f'cv_tailored_{timestamp}.pdf'}")
            print(f"📄 Cover Letter: {cover_letter_path}")
            print(f"📄 Cover Letter PDF: {self.output_dir / 'pdf' / f'cover_letter_{timestamp}.pdf'}")
            
        except subprocess.CalledProcessError as e:
            print(f"⚠️  PDF compilation failed. LaTeX files saved successfully.")
            print(f"Error: {e}")
        except FileNotFoundError:
            print("⚠️  pdflatex not found. Please install a LaTeX distribution to generate PDFs.")
            print("📄 LaTeX files saved successfully.")
        
        return {
            "cv_tex": str(cv_tex_path),
            "cv_pdf": str(self.output_dir / "pdf" / f"cv_tailored_{timestamp}.pdf"),
            "cover_letter_md": str(cover_letter_path),
            "cover_letter_pdf": str(self.output_dir / "pdf" / f"cover_letter_{timestamp}.pdf")
        }
    
    def generate_cover_letter_latex(self, cover_letter_text: str, company_name: str) -> str:
        """Convert cover letter to LaTeX format"""
        # Escape LaTeX special characters
        cover_letter_text = cover_letter_text.replace("&", r"\&")
        cover_letter_text = cover_letter_text.replace("%", r"\%")
        cover_letter_text = cover_letter_text.replace("$", r"\$")
        cover_letter_text = cover_letter_text.replace("#", r"\#")
        
        paragraphs = cover_letter_text.split("\n\n")
        
        latex_content = r"""\documentclass[11pt,a4paper]{letter}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage[margin=1in]{geometry}
\usepackage{hyperref}

\signature{""" + self.master_data["name"] + r"""}
\address{""" + self.master_data["name"] + r""" \\ """ + self.master_data["email"] + r""" \\ """ + self.master_data["phone"] + r"""}

\begin{document}
\begin{letter}{Hiring Manager \\ """ + company_name + r"""}

\opening{Dear Hiring Manager,}

"""
        
        # Add paragraphs
        for i, para in enumerate(paragraphs[1:-2]):  # Skip greeting and signature
            if para.strip():
                latex_content += para.strip() + "\n\n"
        
        latex_content += r"""
\closing{Best regards,}

\end{letter}
\end{document}"""
        
        return latex_content


def main():
    parser = argparse.ArgumentParser(description="CV Tailoring Agent")
    parser.add_argument("--job-file", type=str, help="Path to job description file")
    parser.add_argument("--company", type=str, default="Your Company", help="Company name")
    parser.add_argument("--interactive", action="store_true", help="Interactive mode")
    
    args = parser.parse_args()
    
    tailor = CVTailor()
    
    if args.interactive or not args.job_file:
        print("🤖 CV Tailoring Agent")
        print("=" * 50)
        print("Please paste the job description (press Enter twice to finish):")
        
        lines = []
        while True:
            line = input()
            if line == "" and lines and lines[-1] == "":
                break
            lines.append(line)
        
        job_description = "\n".join(lines[:-1])  # Remove last empty line
        
        company_name = input("\nCompany name (press Enter for 'Your Company'): ").strip()
        if not company_name:
            company_name = "Your Company"
    else:
        with open(args.job_file, 'r') as f:
            job_description = f.read()
        company_name = args.company
    
    print("\n🔄 Analyzing job description and tailoring CV...")
    results = tailor.save_outputs(job_description, company_name)
    
    print("\n✨ Done! Your tailored CV and cover letter are ready.")


if __name__ == "__main__":
    main()