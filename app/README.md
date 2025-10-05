# Job Kanban Application

A comprehensive job application tracking system with automated CV and cover letter generation using AI.

## 🎯 Features

- **Single Input Interface**: Paste job URLs or full job descriptions
- **Auto-Processing**: Automatically extracts job info, calculates match percentage, generates CVs and cover letters
- **Kanban Board**: Drag-and-drop interface to track application status
- **AI-Powered**: Uses Claude API for job analysis and document generation
- **Document Management**: Download initial and reviewed versions of CVs and cover letters
- **Regeneration**: Request document regeneration with specific feedback
- **Real-time Updates**: Live updates using Supabase Realtime

## 📁 Project Structure

```
app/
├── frontend/          # Vue 3 + Vite frontend
├── workers/           # Cloudflare Workers backend
├── supabase/          # Database migrations
└── shared/            # Shared TypeScript types
```

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- [Supabase](https://supabase.com/) account
- [Cloudflare](https://workers.cloudflare.com/) account
- [Anthropic API](https://www.anthropic.com/) key

### 1. Supabase Setup

1. Create a new Supabase project
2. Run the migration:
   ```bash
   cd app/supabase
   # Copy the SQL from migrations/001_initial_schema.sql
   # Paste into Supabase SQL Editor and execute
   ```
3. Create a storage bucket named `job-documents` with public access for PDFs
4. Get your Supabase URL and keys from Project Settings > API

### 2. Frontend Setup

```bash
cd app/frontend

# Install dependencies
bun install

# Create .env file
cp .env.example .env

# Edit .env and add your Supabase credentials:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key

# Run development server
bun run dev
```

The frontend will be available at `http://localhost:5173`

### 3. Cloudflare Workers Setup

```bash
cd app/workers

# Install dependencies
bun install

# Login to Cloudflare
bunx wrangler login

# Set secrets
bunx wrangler secret put SUPABASE_URL
# Paste your Supabase URL

bunx wrangler secret put SUPABASE_SERVICE_KEY
# Paste your Supabase service role key (from Settings > API)

bunx wrangler secret put ANTHROPIC_API_KEY
# Paste your Anthropic API key

# Deploy worker
bunx wrangler deploy
```

The worker will be deployed and the cron job will run every 5 minutes to process pending tasks.

## 📊 Database Schema

### Main Tables

- **jobs**: Job postings with metadata and kanban status
- **job_documents**: CV and cover letter versions (initial, reviewed, regenerated)
- **regeneration_requests**: User feedback for document regeneration
- **processing_queue**: Background task queue

## 🎨 Kanban Workflow

1. **Processing** → CV and cover letter being generated
2. **To Submit** → Ready to apply
3. **Waiting for Call** → Application submitted
4. **Ongoing** → Interview/testing in progress
5. **Success** / **Not Now** → Final outcomes

## 🔄 Processing Pipeline

When you add a new job, the system automatically:

1. **Extract Job Info** (if URL, fetches and parses HTML)
2. **Calculate Match** (analyzes your profile against requirements)
3. **Generate CV** (tailored to job description)
4. **Generate Cover Letter** (max 350 words)
5. **Review CV** (skeptical review for accuracy)
6. **Review Cover Letter** (skeptical review for accuracy)
7. **Update Status** (moves to "To Submit")

Each step runs asynchronously via Cloudflare Workers cron jobs.

## 🛠️ Development

### Frontend Development

```bash
cd app/frontend
bun run dev      # Start dev server
bun run build    # Build for production
bun run preview  # Preview production build
```

### Workers Development

```bash
cd app/workers
bunx wrangler dev     # Run worker locally
bunx wrangler tail    # Stream logs from deployed worker
```

## 📦 Deployment

### Frontend (Cloudflare Pages)

1. Push code to GitHub
2. Go to Cloudflare Pages dashboard
3. Create new project, select your repository
4. Build settings:
   - Framework preset: Vue
   - Build command: `bun run build`
   - Build output directory: `dist`
5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Workers (Already deployed via `wrangler deploy`)

Cron jobs run automatically every 5 minutes. Check logs:
```bash
cd app/workers
bunx wrangler tail
```

## 🔑 Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Workers (Cloudflare Secrets)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-key
```

## 📝 Usage

1. **Add Job**: Click "+ Add Job" button
2. **Paste Content**: Either a URL (https://...) or full job description text
3. **Submit**: System automatically processes the job
4. **Monitor**: Watch as CV and cover letters are generated (Processing status)
5. **Review**: Once complete, view and download documents
6. **Regenerate**: Click regenerate button to request changes with specific feedback
7. **Track**: Drag cards through the kanban to track application progress

## 🎯 Next Steps (Future Enhancements)

- [ ] Drag-and-drop functionality for kanban (VueDraggable integration)
- [ ] PDF preview in modal
- [ ] LaTeX compilation (currently generates Markdown only)
- [ ] Sync to filesystem (`04_Applications/` folder)
- [ ] Email integration for direct application submission
- [ ] Analytics dashboard (success rate, response time, etc.)
- [ ] Chrome extension for one-click job capture

## 🐛 Troubleshooting

### Jobs stuck in "Processing"
- Check Cloudflare Workers logs: `bunx wrangler tail`
- Verify cron trigger is active in Cloudflare dashboard
- Check Supabase `processing_queue` table for failed tasks

### Documents not generating
- Verify Anthropic API key is set correctly
- Check API rate limits
- Review worker logs for error messages

### Real-time updates not working
- Verify Supabase Realtime is enabled for your project
- Check browser console for WebSocket connection errors

## 📄 License

MIT

## 🤝 Contributing

This is a personal project for managing job applications. Feel free to fork and customize for your own use!
