# Job Application Seed Data Scripts

This directory contains scripts for generating and importing seed data from your job applications into the Supabase database.

## Overview

The seed data system consists of three main components:

1. **Python Generator** (`generate-seed-data.py`) - Extracts job data from application folders
2. **SQL Migration** (`../supabase/migrations/003_seed_jobs.sql`) - SQL INSERT statements
3. **TypeScript Seeder** (`seed-database.ts`) - Programmatic database seeding
4. **JSON Data** (`seed-data.json`) - Structured job data for import

## Quick Start

### Option 1: Using SQL Migration (Recommended)

```bash
# 1. Generate fresh seed data from applications
python3 app/scripts/generate-seed-data.py

# 2. Apply the SQL migration via Supabase CLI
cd app/supabase
supabase db reset  # This will apply all migrations including seed data
```

### Option 2: Using TypeScript Seeder

```bash
# 1. Generate fresh seed data
python3 app/scripts/generate-seed-data.py

# 2. Set up environment variables
export VITE_SUPABASE_URL="your-supabase-url"
export VITE_SUPABASE_ANON_KEY="your-anon-key"

# 3. Run the TypeScript seeder
bun run app/scripts/seed-database.ts
# or
npx tsx app/scripts/seed-database.ts
```

## Detailed Documentation

### 1. Generate Seed Data

The Python script scans your `04_Applications` directory and extracts structured data from each `job-spec.md` file.

```bash
python3 app/scripts/generate-seed-data.py
```

**What it does:**
- Scans all folders in `04_Applications/`
- Parses `job-spec.md` files to extract:
  - Company name
  - Position title
  - Location
  - Salary range
  - Job type (Full-time, Remote, etc.)
  - Match percentage
  - Match analysis (strengths, partial matches, gaps)
  - Job description
  - Original URL
- Generates two output files:
  - `app/supabase/migrations/003_seed_jobs.sql` - SQL INSERT statements
  - `app/scripts/seed-data.json` - JSON data for programmatic import

**Output:**
```
🌱 Generating seed data from job applications...
📁 Scanning: /Users/user/Documents/cari-kerja/04_Applications
📊 Found 24 application folders
  ✅ College Board - Senior Full Stack Engineer (UI Focus)
  ✅ Buffer - Senior Product Engineer (Frontend)
  ...
✨ Successfully parsed 24 jobs
```

### 2. SQL Migration Method

The generated SQL file contains INSERT statements for all jobs.

**Advantages:**
- Version controlled with migrations
- Repeatable and consistent
- Works with Supabase CLI
- Can be run multiple times (uses UUIDs)

**Usage:**
```bash
# Apply all migrations including seed data
cd app/supabase
supabase db reset

# Or apply just the seed migration
supabase db push
```

**Manual SQL execution:**
```bash
# Connect to your database and run the SQL file
psql -h your-db-host -U postgres -d postgres -f app/supabase/migrations/003_seed_jobs.sql
```

### 3. TypeScript Seeder Method

The TypeScript seeder provides more control and feedback during the seeding process.

**Advantages:**
- Progress feedback
- Batch processing
- Error handling
- Data verification
- Can clear existing seed data

**Prerequisites:**
```bash
# Install dependencies
cd app/frontend
bun install
# or
npm install
```

**Environment setup:**
```bash
# Option 1: Export variables
export VITE_SUPABASE_URL="https://your-project.supabase.co"
export VITE_SUPABASE_ANON_KEY="your-anon-key"

# Option 2: Use .env file
echo "VITE_SUPABASE_URL=https://your-project.supabase.co" >> .env
echo "VITE_SUPABASE_ANON_KEY=your-anon-key" >> .env
```

**Run the seeder:**
```bash
bun run app/scripts/seed-database.ts
```

**Output:**
```
🌱 Starting database seeding process...

📖 Reading seed data from: seed-data.json
✅ Loaded 24 jobs from seed file
📅 Generated at: 2025-10-05T...

⚠️  This will clear existing seed data and insert new records.
Press Ctrl+C to cancel or wait 3 seconds to continue...

🧹 Clearing existing seed data...
✅ Existing seed data cleared

📥 Inserting 24 jobs...
  ✅ Batch 1 inserted (10 jobs)
  ✅ Batch 2 inserted (10 jobs)
  ✅ Batch 3 inserted (4 jobs)

📊 Insert Summary:
  Success: 24 jobs
  Errors: 0 jobs

🔍 Verifying inserted data...
✅ Verified 24 jobs in database

✅ Database seeding complete!
```

## Data Structure

Each job record contains:

```typescript
{
  id: string;                    // UUID
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
  input_type: 'url' | 'text';   // How the job was added
  input_content: string;         // Original input
  original_url?: string;         // Source URL if available
  company_name: string;          // Company name
  position_title: string;        // Job title
  location?: string;             // Job location
  salary_range?: string;         // Salary info
  job_type?: string;             // Full-time, Remote, etc.
  job_description_text: string;  // Job description
  match_percentage?: number;     // 0-100
  match_analysis?: {             // Structured analysis
    strengths: string[];
    partial_matches: string[];
    gaps: string[];
  };
  status: JobStatus;             // Kanban status
  kanban_order: number;          // Order in kanban
  folder_path: string;           // Path to application folder
}
```

## Workflow

### Initial Setup

1. Generate seed data:
   ```bash
   python3 app/scripts/generate-seed-data.py
   ```

2. Review the generated files:
   - Check `app/supabase/migrations/003_seed_jobs.sql`
   - Verify `app/scripts/seed-data.json`

3. Seed the database using your preferred method (SQL or TypeScript)

### Updating Seed Data

When you add new job applications:

1. Create the application folder in `04_Applications/`
2. Add the `job-spec.md` file
3. Re-run the generator:
   ```bash
   python3 app/scripts/generate-seed-data.py
   ```
4. Re-seed the database

## Statistics

The generator provides helpful statistics:

```
📊 Summary Statistics:
  Total jobs: 24
  Average match: 84.7%
  Best match: 95%
  Lowest match: 45%
  Jobs with location: 22
  Jobs with salary: 4
```

## Troubleshooting

### Missing job-spec.md files

**Symptom:**
```
⚠️  Skipping FolderName - no job-spec.md found
```

**Solution:** Ensure each application folder contains a `job-spec.md` file.

### Parsing errors

**Symptom:**
```
Error parsing /path/to/job-spec.md: ...
```

**Solution:** Check the job-spec.md file format. The parser looks for specific markdown patterns.

### Supabase connection errors

**Symptom:**
```
❌ Error: Missing Supabase environment variables
```

**Solution:** Set the required environment variables:
```bash
export VITE_SUPABASE_URL="your-url"
export VITE_SUPABASE_ANON_KEY="your-key"
```

### Duplicate key errors

**Symptom:**
```
ERROR: duplicate key value violates unique constraint
```

**Solution:** The SQL file generates new UUIDs on each run. If you're re-running the SQL migration, first clear existing data:
```sql
DELETE FROM jobs WHERE folder_path LIKE '04_Applications/%';
```

Or use the TypeScript seeder which handles this automatically.

## File Locations

```
cari-kerja/
├── 04_Applications/              # Source data
│   ├── CompanyName_Position_Date/
│   │   └── job-spec.md          # Parsed by generator
│   └── ...
├── app/
│   ├── scripts/
│   │   ├── generate-seed-data.py    # Generator script
│   │   ├── seed-database.ts         # TypeScript seeder
│   │   ├── seed-data.json          # Generated JSON data
│   │   └── README.md               # This file
│   ├── supabase/
│   │   └── migrations/
│   │       └── 003_seed_jobs.sql   # Generated SQL migration
│   └── shared/
│       └── types.ts                # TypeScript types
```

## Best Practices

1. **Version Control**
   - Commit the generator script
   - Consider `.gitignore` for `seed-data.json` (regenerated data)
   - Keep SQL migrations in version control

2. **Regular Updates**
   - Re-generate seed data when adding new applications
   - Keep the seed data in sync with your applications

3. **Testing**
   - Test on a local/dev database first
   - Verify data before seeding production

4. **Backup**
   - Always backup your database before seeding
   - Use transactions when possible

## Future Enhancements

Potential improvements:

- [ ] Incremental seeding (only new applications)
- [ ] Update existing jobs instead of replace
- [ ] Extract and seed job documents (CVs, cover letters)
- [ ] Parse additional metadata from PDFs
- [ ] Generate seed data for other tables (job_documents, etc.)
- [ ] Add data validation and quality checks

## Support

For issues or questions:
1. Check this README
2. Review the generated SQL/JSON files
3. Check Supabase logs
4. Verify your environment variables

---

**Last Updated:** 2025-10-05
