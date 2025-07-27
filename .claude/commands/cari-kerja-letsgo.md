# Job Search Specialist Command

Execute a comprehensive job search based on my professional profile and output results in JSON format.

## Process

1. **Profile Analysis**
   - Read and analyze /Users/user/Documents/cari-kerja/01_Profile/master_profile.md
   - Extract key information:
     - Role: Frontend Engineer
     - Experience: 8+ years
     - Core Skills: React, TypeScript, JavaScript ES6+, Redux, Frontend development
     - Industries: Real estate, gaming, travel
     - Specialties: Performance optimization, Core Web Vitals, SEO
     - Current Location: Bangkok, Thailand

2. **Generate Search Keywords**
   Based on the profile, use these keywords for job searches:
   - "Frontend Engineer React TypeScript careers"
   - "Senior Frontend Developer React careers"
   - "React Developer TypeScript careers"
   - "Frontend Engineer JavaScript careers"
   - "Web Developer React Redux careers"
   - Add location modifiers: Bangkok, Thailand, Remote, Southeast Asia

3. **Web Search Strategy**
   Execute searches with the following priorities:
   
   a. **Source Priority** (highest to lowest):
      - Direct company career pages (e.g., "company name careers frontend")
      - Company websites with careers section
      - Avoid job portals (LinkedIn, JobsDB, Indeed) unless no direct sources found
   
   b. **Location Priority** (highest to lowest):
      1. Bangkok, Thailand
      2. Remote positions (worldwide/Asia)
      3. On-site positions outside Indonesia with visa/relocation support
      4. Indonesia-based positions

   c. **Job Requirements Focus**:
      - Look for positions mentioning React, TypeScript, JavaScript
      - Frontend/Web Developer roles
      - 5+ years experience requirements (matching 8+ years experience)
      - Positions that mention performance optimization or web vitals as a plus

4. **Information Extraction**
   For each relevant job posting found:
   - Extract company name
   - Copy full job description
   - Identify location and work arrangement
   - Find contact email if available (look for HR email, careers@, jobs@, or application email)
   - Note the source URL

5. **Output Format**
   Create a JSON file with today's date as the key, containing an array of job opportunities:
   ```json
   {
     "YYYY-MM-DD": [
       {
         "source": "https://example.com/careers/frontend-engineer",
         "companyName": "Example Corp",
         "jobDesc": "Full job description text here...",
         "location": "Bangkok, Thailand",
         "email": "careers@example.com"
       },
       {
         "source": "https://anothercompany.com/jobs/react-developer",
         "companyName": "Another Company",
         "jobDesc": "Full job description text here...",
         "location": "Remote",
         "email": null
       }
     ]
   }
   ```

6. **File Output**
   Save the results to: /Users/user/Documents/cari-kerja/05_Tracking/job-search-YYYY-MM-DD-HH-MM-SS.json
   (Use actual date and time in the filename)

## Execution Notes
- Aim to find at least 5-10 relevant positions per search session
- Prioritize quality matches over quantity
- Include jobs even if no email is found (set email to null)
- Ensure job descriptions are complete and not truncated
- Focus on roles that match the seniority level (Senior/Lead Frontend roles)