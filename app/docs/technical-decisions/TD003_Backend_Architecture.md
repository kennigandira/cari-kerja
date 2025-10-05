# Technical Decision Document: TD003
# Backend Architecture - Master Profile API & Workers

**Version:** 1.0
**Date:** October 5, 2025
**Status:** Proposed
**Depends On:** TD001 (General Architecture)

---

## 1. Worker Architecture

### Decision BE-001: Modular Worker Services

**Status:** ✅ **APPROVED**

**Structure:**

```
app/workers/src/
├── index.ts                    # Main entry point (Hono app)
├── cron.ts                     # Cron job handler
├── middleware/
│   ├── auth.ts                 # JWT validation
│   ├── validation.ts           # Request validation
│   └── error-handler.ts        # Global error handling
├── handlers/
│   └── profiles/
│       ├── create.ts           # POST /api/profiles
│       ├── list.ts             # GET /api/profiles
│       ├── get.ts              # GET /api/profiles/:id
│       ├── update.ts           # PUT /api/profiles/:id
│       ├── delete.ts           # DELETE /api/profiles/:id
│       ├── set-default.ts      # POST /api/profiles/:id/set-default
│       ├── duplicate.ts        # POST /api/profiles/:id/duplicate
│       └── upload-cv.ts        # POST /api/profiles/upload-cv
├── services/
│   ├── profile-service.ts      # Business logic
│   ├── cv-extraction.ts        # AI extraction
│   ├── file-parser.ts          # PDF/DOCX parsing
│   └── validation-service.ts   # Data validation
├── tasks/
│   └── extract-cv.ts           # Background CV extraction task
└── utils/
    ├── supabase.ts             # DB client
    ├── anthropic.ts            # AI client
    └── errors.ts               # Custom errors
```

---

## 2. API Implementation

### Decision BE-002: Hono Route Handlers

**Status:** ✅ **APPROVED**

**Example: Create Profile**

```typescript
// src/handlers/profiles/create.ts
import { Context } from 'hono';
import { z } from 'zod';
import { ProfileService } from '../../services/profile-service';

const createProfileSchema = z.object({
  profile: z.object({
    profile_name: z.string().min(1).max(255),
    full_name: z.string().min(1).max(255),
    email: z.string().email(),
    // ... more fields
  }),
  work_experiences: z.array(z.object({ /* ... */ })),
  skills: z.array(z.object({ /* ... */ })),
  education: z.array(z.object({ /* ... */ })),
  certifications: z.array(z.object({ /* ... */ })),
  languages: z.array(z.object({ /* ... */ })),
});

export const createProfile = async (c: Context) => {
  try {
    // Get user from auth middleware
    const user = c.get('user');

    // Validate request body
    const body = await c.req.json();
    const validated = createProfileSchema.parse(body);

    // Create profile with service
    const profileService = new ProfileService(c.env);
    const result = await profileService.createProfile(user.id, validated);

    return c.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: c.get('requestId'),
      },
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
      }, 400);
    }

    throw error; // Handle by global error middleware
  }
};
```

---

## 3. Profile Service Layer

### Decision BE-003: Service Layer for Business Logic

**Status:** ✅ **APPROVED**

```typescript
// src/services/profile-service.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { CreateMasterProfileRequest, MasterProfileWithDetails } from '@/shared/types';

export class ProfileService {
  private supabase: SupabaseClient;

  constructor(private env: Env) {
    this.supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  }

  async createProfile(userId: string, data: CreateMasterProfileRequest): Promise<MasterProfileWithDetails> {
    // Start transaction
    const { data: profile, error: profileError } = await this.supabase
      .from('master_profiles')
      .insert({
        user_id: userId,
        ...data.profile,
      })
      .select()
      .single();

    if (profileError) throw new DatabaseError('Failed to create profile', profileError);

    // Insert related entities
    await Promise.all([
      this.insertWorkExperiences(profile.id, data.work_experiences),
      this.insertSkills(profile.id, data.skills),
      this.insertEducation(profile.id, data.education),
      this.insertCertifications(profile.id, data.certifications),
      this.insertLanguages(profile.id, data.languages),
    ]);

    // Create initial version snapshot
    await this.createProfileVersion(profile.id, data, 'Initial creation');

    // Fetch complete profile with relations
    return this.getProfileById(profile.id);
  }

  async getProfileById(profileId: string): Promise<MasterProfileWithDetails> {
    const { data, error } = await this.supabase
      .from('master_profiles')
      .select(`
        *,
        work_experiences (
          *,
          achievements (*)
        ),
        skills (*),
        education (*),
        certifications (*),
        languages (*)
      `)
      .eq('id', profileId)
      .single();

    if (error) throw new DatabaseError('Profile not found', error);
    return data;
  }

  async listProfiles(userId: string): Promise<MasterProfileWithDetails[]> {
    const { data, error } = await this.supabase
      .from('master_profiles')
      .select(`*`)
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) throw new DatabaseError('Failed to fetch profiles', error);

    // Fetch related data for each profile
    return Promise.all(data.map(p => this.getProfileById(p.id)));
  }

  async updateProfile(profileId: string, data: UpdateMasterProfileRequest): Promise<MasterProfileWithDetails> {
    // Update main profile
    const { error: updateError } = await this.supabase
      .from('master_profiles')
      .update(data.profile)
      .eq('id', profileId);

    if (updateError) throw new DatabaseError('Failed to update profile', updateError);

    // Delete and re-insert related entities (simpler than diff)
    await Promise.all([
      this.deleteAndInsertWorkExperiences(profileId, data.work_experiences),
      this.deleteAndInsertSkills(profileId, data.skills),
      this.deleteAndInsertEducation(profileId, data.education),
      // ... other relations
    ]);

    // Create version snapshot
    await this.createProfileVersion(profileId, data, data.change_summary || 'Profile updated');

    return this.getProfileById(profileId);
  }

  private async createProfileVersion(profileId: string, data: any, changeSummary: string) {
    const profile = await this.getProfileById(profileId);

    await this.supabase.from('profile_versions').insert({
      profile_id: profileId,
      snapshot_data: profile,
      change_summary: changeSummary,
      version_number: profile.version,
    });
  }
}
```

---

## 4. CV Extraction Service

### Decision BE-004: AI-Powered CV Extraction

**Status:** ✅ **APPROVED**

```typescript
// src/services/cv-extraction.ts
import Anthropic from '@anthropic-ai/sdk';
import { FileParser } from './file-parser';
import { CVExtractionResult } from '@/shared/types';

export class CVExtractionService {
  private anthropic: Anthropic;
  private fileParser: FileParser;

  constructor(private env: Env) {
    this.anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    this.fileParser = new FileParser();
  }

  async extractFromFile(filePath: string, fileType: string): Promise<CVExtractionResult> {
    // Download file from Supabase Storage
    const fileContent = await this.downloadFile(filePath);

    // Parse file to text based on type
    let text: string;
    switch (fileType) {
      case 'application/pdf':
        text = await this.fileParser.parsePDF(fileContent);
        break;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        text = await this.fileParser.parseDOCX(fileContent);
        break;
      case 'text/plain':
        text = fileContent.toString('utf-8');
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Call Claude API for extraction
    const extractedData = await this.extractWithClaude(text);

    return extractedData;
  }

  private async extractWithClaude(cvText: string): Promise<CVExtractionResult> {
    const prompt = this.buildExtractionPrompt(cvText);

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt,
      }],
      temperature: 0.2, // Low temperature for consistency
    });

    // Parse response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const extractedData = JSON.parse(responseText);

    // Calculate confidence scores
    const confidenceScores = this.calculateConfidenceScores(extractedData);

    return {
      ...extractedData,
      confidence_scores: confidenceScores,
      warnings: this.generateWarnings(extractedData, confidenceScores),
    };
  }

  private buildExtractionPrompt(cvText: string): string {
    return `You are a CV extraction expert. Extract structured information from the provided CV text.

Output JSON in this exact format:
{
  "profile_data": {
    "full_name": "string",
    "email": "string",
    "phone_primary": "string",
    "location": "string",
    "professional_summary": "string (100-500 words)",
    "years_of_experience": number,
    "current_position": "string"
  },
  "work_experiences": [
    {
      "company_name": "string",
      "position_title": "string",
      "location": "string",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD or null if current",
      "is_current": boolean,
      "description": "string",
      "achievements": [
        {
          "description": "string",
          "metric_value": number or null,
          "metric_unit": "string like %, users, ms",
          "metric_type": "percentage|time_reduction|revenue|count|other",
          "timeframe": "string like Q3 2023"
        }
      ]
    }
  ],
  "skills": [
    {
      "skill_name": "string",
      "category": "Frontend Frameworks & Libraries|Programming Languages|...",
      "proficiency_level": "Expert|Advanced|Intermediate|Beginner",
      "years_of_experience": number or null
    }
  ],
  "education": [...],
  "certifications": [...],
  "languages": [...]
}

CV Text:
"""
${cvText}
"""

Important:
- Extract all information accurately
- Infer categories from context
- Parse dates to YYYY-MM-DD format
- Identify achievement metrics
- Be conservative with proficiency levels`;
  }

  private calculateConfidenceScores(data: any): Record<string, number> {
    const scores: Record<string, number> = {};

    // Email confidence (high if valid format)
    scores['email'] = data.profile_data?.email?.includes('@') ? 0.95 : 0.3;

    // Phone confidence (high if E.164 format)
    scores['phone_primary'] = /^\+?[1-9]\d{1,14}$/.test(data.profile_data?.phone_primary) ? 0.9 : 0.5;

    // Name confidence (high if capitalized, no numbers)
    scores['full_name'] = /^[A-Z][a-zA-Z\s]+$/.test(data.profile_data?.full_name) ? 0.95 : 0.6;

    // More confidence calculations...

    return scores;
  }

  private generateWarnings(data: any, scores: Record<string, number>): string[] {
    const warnings: string[] = [];

    Object.entries(scores).forEach(([field, score]) => {
      if (score < 0.7) {
        warnings.push(`Low confidence in ${field}: Please verify`);
      }
    });

    return warnings;
  }

  private async downloadFile(filePath: string): Promise<Buffer> {
    const supabase = createClient(this.env.SUPABASE_URL, this.env.SUPABASE_SERVICE_KEY);
    const { data, error } = await supabase.storage
      .from('master-profile-cvs')
      .download(filePath);

    if (error) throw new Error(`Failed to download file: ${error.message}`);

    return Buffer.from(await data.arrayBuffer());
  }
}
```

---

## 5. File Parsing

### Decision BE-005: Dedicated Parsers for Each Format

**Status:** ✅ **APPROVED**

```typescript
// src/services/file-parser.ts
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export class FileParser {
  async parsePDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      throw new ParsingError('Failed to parse PDF', error);
    }
  }

  async parseDOCX(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new ParsingError('Failed to parse DOCX', error);
    }
  }
}
```

---

## 6. Background Task Processing

### Decision BE-006: Queue-Based CV Extraction

**Status:** ✅ **APPROVED**

```typescript
// src/tasks/extract-cv.ts
export async function processExtractCVTask(task: ProcessingQueueTask, env: Env) {
  const extractionService = new CVExtractionService(env);

  try {
    const { file_path, file_type } = task.task_data as { file_path: string, file_type: string };

    // Extract
    const result = await extractionService.extractFromFile(file_path, file_type);

    // Update task
    await updateTaskStatus(task.id, 'completed', result, env);

    return result;
  } catch (error) {
    await updateTaskStatus(task.id, 'failed', null, env, error.message);
    throw error;
  }
}

// src/cron.ts (Enhanced)
export async function handleCron(env: Env) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  // Fetch pending tasks (including new 'extract_cv' task type)
  const { data: tasks } = await supabase
    .from('processing_queue')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(10);

  for (const task of tasks || []) {
    try {
      // Mark as processing
      await supabase
        .from('processing_queue')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', task.id);

      // Process based on task type
      switch (task.task_type) {
        case 'extract_cv':
          await processExtractCVTask(task, env);
          break;
        case 'extract_job_info':
          await processExtractJobInfoTask(task, env);
          break;
        // ... other task types
      }
    } catch (error) {
      console.error(`[Cron] Task ${task.id} failed:`, error);
    }
  }
}
```

---

## 7. Database Access Patterns

### Decision BE-007: Supabase Service Client

**Status:** ✅ **APPROVED**

```typescript
// src/utils/supabase.ts
import { createClient } from '@supabase/supabase-js';

export function createServiceClient(env: Env) {
  return createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_KEY, // Service role bypasses RLS
    {
      auth: {
        persistSession: false, // Server-side, no persistence needed
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
    }
  );
}

// Usage in services
const supabase = createServiceClient(this.env);
```

**When to use Service Client:**
- ✅ Background tasks (cron jobs)
- ✅ Admin operations
- ✅ Server-side API endpoints

**When to use Anon Client:**
- ✅ User-facing API (with RLS)
- ✅ Frontend (already configured)

---

## 8. Error Handling

### Decision BE-008: Custom Error Classes

**Status:** ✅ **APPROVED**

```typescript
// src/utils/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super('DATABASE_ERROR', message, 500, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ParsingError extends AppError {
  constructor(message: string, details?: any) {
    super('PARSING_ERROR', message, 422, details);
  }
}

// Global error middleware
export const errorHandler = async (err: Error, c: Context) => {
  if (err instanceof AppError) {
    return c.json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    }, err.statusCode);
  }

  // Unexpected errors
  console.error('[ERROR]', err);
  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  }, 500);
};
```

---

## 9. Rate Limiting

### Decision BE-009: Cloudflare Rate Limiting

**Status:** ✅ **APPROVED**

```typescript
// src/middleware/rate-limit.ts
import { Context, Next } from 'hono';

const rateLimitCache = new Map<string, { count: number, resetAt: number }>();

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return async (c: Context, next: Next) => {
    const userId = c.get('user')?.id || c.req.header('x-forwarded-for') || 'anonymous';
    const key = `${userId}:${c.req.path}`;

    const now = Date.now();
    const userLimit = rateLimitCache.get(key);

    if (userLimit) {
      if (now < userLimit.resetAt) {
        if (userLimit.count >= maxRequests) {
          return c.json({
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: `Too many requests. Try again in ${Math.ceil((userLimit.resetAt - now) / 1000)}s`,
            },
          }, 429);
        }
        userLimit.count++;
      } else {
        // Reset window
        rateLimitCache.set(key, { count: 1, resetAt: now + windowMs });
      }
    } else {
      rateLimitCache.set(key, { count: 1, resetAt: now + windowMs });
    }

    await next();
  };
};

// Usage
app.post('/api/profiles/upload-cv', rateLimit(10, 60 * 60 * 1000), uploadCV); // 10 uploads/hour
app.post('/api/profiles', rateLimit(100, 60 * 1000), createProfile); // 100 creates/minute
```

---

## 10. Logging & Monitoring

### Decision BE-010: Structured Logging

**Status:** ✅ **APPROVED**

```typescript
// src/utils/logger.ts
export const logger = {
  info(message: string, context?: any) {
    console.log(JSON.stringify({
      level: 'INFO',
      message,
      context,
      timestamp: new Date().toISOString(),
    }));
  },

  warn(message: string, context?: any) {
    console.warn(JSON.stringify({
      level: 'WARN',
      message,
      context,
      timestamp: new Date().toISOString(),
    }));
  },

  error(message: string, error?: Error, context?: any) {
    console.error(JSON.stringify({
      level: 'ERROR',
      message,
      error: error?.message,
      stack: error?.stack,
      context,
      timestamp: new Date().toISOString(),
    }));
  },
};

// Usage
logger.info('Profile created', { profileId, userId });
logger.warn('Low extraction confidence', { field: 'email', confidence: 0.6 });
logger.error('Failed to create profile', error, { userId, data });
```

---

## Summary of Backend Decisions

| ID | Decision | Status |
|----|----------|--------|
| BE-001 | Modular worker services | ✅ |
| BE-002 | Hono route handlers | ✅ |
| BE-003 | Service layer for business logic | ✅ |
| BE-004 | AI-powered CV extraction | ✅ |
| BE-005 | Dedicated file parsers (PDF/DOCX) | ✅ |
| BE-006 | Queue-based CV extraction | ✅ |
| BE-007 | Supabase service client | ✅ |
| BE-008 | Custom error classes | ✅ |
| BE-009 | Rate limiting middleware | ✅ |
| BE-010 | Structured logging | ✅ |

---

**Ready for specialist review:** foreman-backend-specialist, chase-frontend-specialist, cameron-fullstack-dev, house-debugging-specialist.
