-- Migration 008: Seed Master Profile from Local Data
-- Date: 2025-10-05
-- Description: Import existing master_profile.md data into database
-- Source: /Users/user/Documents/cari-kerja/01_Profile/master_profile.md

BEGIN;

-- Create master profile with work experiences and skills
SELECT create_master_profile(
  '{"profile_name": "Main Profile", "is_default": true, "full_name": "Kenni Gandira Alamsyah", "email": "devkenni.g@gmail.com", "phone_primary": "+66 0842704245", "phone_secondary": "+62 81313635148", "linkedin_url": "https://www.linkedin.com/in/kenni-g-alamsyah", "location": "Bangkok, Thailand", "professional_summary": "Team-first Frontend Engineer with 8+ years of experience building scalable web applications for real estate, gaming, and travel industries. Proven track record of improving performance metrics and leading technical initiatives.", "years_of_experience": 9, "current_position": "Software Engineer"}'::jsonb,
  '[
    {"company_name": "PropertyScout", "position_title": "Software Engineer", "location": "Bangkok, Thailand", "start_date": "2023-03", "is_current": true, "description": "Revamped web applications resulting in 27% increase in user traffic (Q3). Updated technology stacks for optimal performance and security. Improved internal tools for enhanced operational productivity. Collaborated with UI/UX designers to transform designs into functional web elements.", "display_order": 0},
    {"company_name": "AccelByte", "position_title": "Software Engineer", "location": "Remote", "start_date": "2022-06", "end_date": "2023-03", "is_current": false, "description": "Developed tools for AAA game developers. Standardized developer experience achieving 40% reduction in compilation time. Established component styling and documentation using Storybook. Initiated knowledge-sharing sessions and code convention standardization.", "display_order": 1},
    {"company_name": "99.co", "position_title": "Frontend Engineer", "location": "Bandung, Indonesia", "start_date": "2020-07", "end_date": "2022-07", "is_current": false, "description": "Improved site performance reducing LCP from 4.5s to 1.2s. Enhanced site traffic through SEO improvements and schema validation. Received Own It award for product ownership. Maintained Core Web Vitals optimization.", "display_order": 2},
    {"company_name": "Tiket.com", "position_title": "Frontend Engineer", "location": "Jakarta, Indonesia", "start_date": "2019-08", "end_date": "2020-07", "is_current": false, "description": "Implemented features using React, TypeScript, Redux. Maintained component documentation with Storybook. Conducted regular refactoring for code scalability. Coordinated with product team for UX enhancements.", "display_order": 3},
    {"company_name": "Mirum Agency", "position_title": "Frontend Developer", "location": "Bandung, Indonesia", "start_date": "2018-07", "end_date": "2019-08", "is_current": false, "description": "Developed WordPress-based university platform (UPH). Created customizable solutions for complex requirements. Built fully functional websites from backend to frontend.", "display_order": 4},
    {"company_name": "Hazani Rangka Utama (Hartama)", "position_title": "Web Developer", "location": "Bandung, Indonesia", "start_date": "2017-04", "end_date": "2018-08", "is_current": false, "description": "Developed three WordPress themes for ThemeForest. Handled W3C validation and accessibility compliance. Managed customer support and product iterations.", "display_order": 5},
    {"company_name": "PT NTCI", "position_title": "Front End Developer", "location": "Yogyakarta, Indonesia", "start_date": "2016-03", "end_date": "2017-03", "is_current": false, "description": "Started career as software engineer. Built multiple projects including e-learning and ticket booking apps. Interviewed and recruited frontend developers. Took on dual role as frontend developer and UI/UX designer.", "display_order": 6}
  ]'::jsonb,
  '[
    {"skill_name": "React.js", "category": "Frontend Frameworks & Libraries", "proficiency_level": "Expert", "years_of_experience": 8, "display_order": 0},
    {"skill_name": "TypeScript", "category": "Programming Languages", "proficiency_level": "Expert", "years_of_experience": 7, "display_order": 1},
    {"skill_name": "Vue.js", "category": "Frontend Frameworks & Libraries", "proficiency_level": "Advanced", "years_of_experience": 5, "display_order": 2},
    {"skill_name": "Next.js", "category": "Frontend Frameworks & Libraries", "proficiency_level": "Advanced", "years_of_experience": 4, "display_order": 3},
    {"skill_name": "JavaScript", "category": "Programming Languages", "proficiency_level": "Expert", "years_of_experience": 9, "display_order": 4},
    {"skill_name": "React Native", "category": "Frontend Frameworks & Libraries", "proficiency_level": "Advanced", "years_of_experience": 3, "display_order": 5},
    {"skill_name": "Redux.js", "category": "Frontend Frameworks & Libraries", "proficiency_level": "Advanced", "years_of_experience": 5, "display_order": 6},
    {"skill_name": "Tailwind CSS", "category": "Styling & CSS", "proficiency_level": "Expert", "years_of_experience": 4, "display_order": 7},
    {"skill_name": "CSS/CSS3", "category": "Styling & CSS", "proficiency_level": "Expert", "years_of_experience": 9, "display_order": 8},
    {"skill_name": "SASS/SCSS", "category": "Styling & CSS", "proficiency_level": "Advanced", "years_of_experience": 6, "display_order": 9},
    {"skill_name": "Styled Components", "category": "Styling & CSS", "proficiency_level": "Advanced", "years_of_experience": 5, "display_order": 10},
    {"skill_name": "Node.js", "category": "Backend & APIs", "proficiency_level": "Advanced", "years_of_experience": 6, "display_order": 11},
    {"skill_name": "GraphQL", "category": "Backend & APIs", "proficiency_level": "Advanced", "years_of_experience": 4, "display_order": 12},
    {"skill_name": "Webpack", "category": "Build Tools & DevOps", "proficiency_level": "Advanced", "years_of_experience": 6, "display_order": 13},
    {"skill_name": "Vite", "category": "Build Tools & DevOps", "proficiency_level": "Advanced", "years_of_experience": 3, "display_order": 14},
    {"skill_name": "Jest", "category": "Testing & Documentation", "proficiency_level": "Advanced", "years_of_experience": 5, "display_order": 15},
    {"skill_name": "Cypress", "category": "Testing & Documentation", "proficiency_level": "Intermediate", "years_of_experience": 3, "display_order": 16},
    {"skill_name": "Storybook", "category": "Testing & Documentation", "proficiency_level": "Advanced", "years_of_experience": 4, "display_order": 17},
    {"skill_name": "Git", "category": "Version Control & Collaboration", "proficiency_level": "Expert", "years_of_experience": 9, "display_order": 18},
    {"skill_name": "GitHub", "category": "Version Control & Collaboration", "proficiency_level": "Expert", "years_of_experience": 8, "display_order": 19},
    {"skill_name": "WordPress", "category": "CMS", "proficiency_level": "Advanced", "years_of_experience": 6, "display_order": 20},
    {"skill_name": "Core Web Vitals", "category": "Performance & Optimization", "proficiency_level": "Expert", "years_of_experience": 4, "display_order": 21},
    {"skill_name": "SEO", "category": "Performance & Optimization", "proficiency_level": "Advanced", "years_of_experience": 5, "display_order": 22},
    {"skill_name": "Figma", "category": "Design Tools", "proficiency_level": "Intermediate", "years_of_experience": 4, "display_order": 23},
    {"skill_name": "Electron.js", "category": "Frontend Frameworks & Libraries", "proficiency_level": "Intermediate", "years_of_experience": 2, "display_order": 24},
    {"skill_name": "NestJS", "category": "Backend & APIs", "proficiency_level": "Intermediate", "years_of_experience": 2, "display_order": 25},
    {"skill_name": "Express.js", "category": "Backend & APIs", "proficiency_level": "Advanced", "years_of_experience": 5, "display_order": 26},
    {"skill_name": "Elasticsearch", "category": "Search & Database", "proficiency_level": "Intermediate", "years_of_experience": 3, "display_order": 27},
    {"skill_name": "Team Leadership", "category": "Leadership & Management", "proficiency_level": "Advanced", "years_of_experience": 5, "display_order": 28},
    {"skill_name": "Mentorship", "category": "Leadership & Management", "proficiency_level": "Advanced", "years_of_experience": 6, "display_order": 29},
    {"skill_name": "Communication", "category": "Professional Skills", "proficiency_level": "Expert", "years_of_experience": 9, "display_order": 30},
    {"skill_name": "Problem Solving", "category": "Professional Skills", "proficiency_level": "Expert", "years_of_experience": 9, "display_order": 31}
  ]'::jsonb
) AS profile_id;

COMMIT;

-- Verification Query (run separately after migration)
-- SELECT * FROM master_profiles WHERE email = 'devkenni.g@gmail.com';
-- SELECT * FROM work_experiences WHERE profile_id = (SELECT id FROM master_profiles WHERE email = 'devkenni.g@gmail.com');
-- SELECT * FROM skills WHERE profile_id = (SELECT id FROM master_profiles WHERE email = 'devkenni.g@gmail.com') ORDER BY display_order;
