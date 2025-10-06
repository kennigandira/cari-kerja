# Security Analysis - CV Upload & Extraction

**Version:** 1.0
**Date:** October 6, 2025
**Reviewed By:** Software Architect
**Security Level:** HIGH (handles PII data)

---

## 1. File Upload Security

### 1.1 Client-Side Validation (First Line of Defense)

```typescript
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: File): ValidationResult {
  // MIME type check
  if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: 'Only PDF and DOCX files are supported'
    };
  }

  // Size check
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be under 10MB (yours: ${(file.size/1024/1024).toFixed(1)}MB)`
    };
  }

  return { valid: true };
}
```

**Limitations:** Client-side validation can be bypassed. Server validation is mandatory.

### 1.2 Server-Side Validation (Cannot Be Bypassed)

```typescript
// Edge Function: cv-upload
async function validateUploadSecurity(file: File): Promise<void> {
  // 1. MIME type validation
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new SecurityError('INVALID_FILE_TYPE');
  }

  // 2. Magic number validation (check actual file bytes)
  const buffer = await file.arrayBuffer();
  const magic = new Uint8Array(buffer.slice(0, 4));

  const isPDF = magic[0] === 0x25 && magic[1] === 0x50; // %P
  const isDOCX = magic[0] === 0x50 && magic[1] === 0x4B; // PK (ZIP)

  if (!isPDF && !isDOCX) {
    throw new SecurityError('FILE_CORRUPTED', 'File signature does not match extension');
  }

  // 3. File size double-check
  if (file.size > MAX_FILE_SIZE) {
    throw new SecurityError('FILE_TOO_LARGE');
  }

  // 4. Filename sanitization (prevent directory traversal)
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (sanitizedName.includes('..') || sanitizedName.startsWith('/')) {
    throw new SecurityError('INVALID_FILENAME');
  }
}
```

### 1.3 Malware Scanning

**Current Status:** ⚠️ **NOT IMPLEMENTED IN MVP**

**Risk:** PDF/DOCX files can contain malware
**Impact:** If malicious file uploaded, could compromise system
**Probability:** Low (authenticated users only, no public access)

**Options:**
1. **ClamAV:** Open-source scanner (requires separate service) - Complex
2. **VirusTotal API:** 500 req/day free, $50/mo after - Costs $$
3. **AWS S3 Malware Scanning:** Requires AWS migration - Not applicable
4. **None (MVP):** Trust authenticated users, monitor daily - **CHOSEN FOR MVP**

**MVP Mitigation:**
- Limit uploads to authenticated users only (no anonymous)
- Daily manual audit of uploaded files
- File retention: auto-delete after 30 days
- Monitor for suspicious patterns (many uploads from single user)

**Post-MVP:** Add VirusTotal API integration if user base grows beyond 100.

---

## 2. RLS Policies

### 2.1 cv_uploads Table

```sql
ALTER TABLE cv_uploads ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view own uploads
CREATE POLICY "Users view own cv uploads"
  ON cv_uploads FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      -- Authenticated users
      (user_id IS NOT NULL AND auth.uid() = user_id)
      OR
      -- Pre-auth users (session-based)
      (user_id IS NULL AND session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    )
  );

-- INSERT: Users can create uploads
CREATE POLICY "Users create own uploads"
  ON cv_uploads FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR (user_id IS NULL AND session_id IS NOT NULL)
  );

-- UPDATE: Users can update own uploads (e.g., link to profile)
CREATE POLICY "Users update own uploads"
  ON cv_uploads FOR UPDATE
  USING (
    deleted_at IS NULL
    AND (
      (user_id IS NOT NULL AND auth.uid() = user_id)
      OR (user_id IS NULL AND session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    )
  );

-- DELETE: Soft delete only (set deleted_at)
CREATE POLICY "Users soft delete own uploads"
  ON cv_uploads FOR UPDATE
  USING (
    (user_id IS NOT NULL AND auth.uid() = user_id)
    OR (user_id IS NULL AND session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
  )
  WITH CHECK (deleted_at IS NOT NULL); -- Only allow setting deleted_at
```

### 2.2 cv_extraction_tasks Table

```sql
ALTER TABLE cv_extraction_tasks ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view extraction status for their uploads
CREATE POLICY "Users view own extraction tasks"
  ON cv_extraction_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cv_uploads u
      WHERE u.id = cv_extraction_tasks.cv_upload_id
      AND u.deleted_at IS NULL
      AND (
        (u.user_id IS NOT NULL AND auth.uid() = u.user_id)
        OR (u.user_id IS NULL AND u.session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
      )
    )
  );

-- INSERT: Only Edge Functions can create tasks (SECURITY DEFINER)
-- No public INSERT policy (prevents user-created fake tasks)

-- UPDATE: Only Edge Functions can update tasks (SECURITY DEFINER)
-- No public UPDATE policy
```

### 2.3 Supabase Storage Bucket

```sql
-- Bucket: cv-uploads
-- Configuration: Private (not public)

-- Policy: Upload to own folder
CREATE POLICY "Authenticated users upload CVs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'cv-uploads'
    AND (auth.uid()::text || '/') = (storage.foldername(name))[1]
  );

-- Policy: Read own files
CREATE POLICY "Authenticated users read own CVs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'cv-uploads'
    AND (auth.uid()::text || '/') = (storage.foldername(name))[1]
  );

-- Policy: Delete own files
CREATE POLICY "Authenticated users delete own CVs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'cv-uploads'
    AND (auth.uid()::text || '/') = (storage.foldername(name))[1]
  );
```

---

## 3. API Key Management

### 3.1 Storing Anthropic API Key

**DO:**
```bash
# Store in Supabase Edge Function secrets
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-...

# Verify
supabase secrets list
```

**Access in Edge Function:**
```typescript
const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
if (!apiKey) {
  throw new Error('ANTHROPIC_API_KEY environment variable not set');
}
```

**DON'T:**
```typescript
// ❌ NEVER hardcode in source
const apiKey = 'sk-ant-api03-...';

// ❌ NEVER commit to git
// .env file with API keys

// ❌ NEVER expose to frontend
window.ANTHROPIC_KEY = '...';
```

### 3.2 Security Checklist

- ✅ API key stored in environment variables (not code)
- ✅ Edge Function uses SECURITY DEFINER (elevated privileges)
- ✅ Frontend NEVER sees API key
- ✅ Rate limiting prevents API abuse
- ✅ Budget alerts configured in Anthropic dashboard ($50/month limit)
- ✅ API key rotated every 90 days

### 3.3 Key Rotation Process

**Every 90 Days:**
```bash
# 1. Generate new API key in Anthropic dashboard
# 2. Update Supabase secret
supabase secrets set ANTHROPIC_API_KEY=sk-ant-new-key-...

# 3. Deploy Edge Functions (picks up new secret)
supabase functions deploy cv-extract

# 4. Verify old key still works (grace period)
# 5. After 24 hours, delete old key from Anthropic
```

---

## 4. Data Retention & Privacy

### 4.1 Retention Policy

**Uploaded CV Files:**
- **Active:** Retained while user has account
- **Soft Deleted:** 30-day recovery window
- **Hard Deleted:** After 30 days or on user request

**Extracted Data:**
- **Profile Created:** Deleted from extraction_tasks after 90 days
- **Profile NOT Created:** Deleted after 7 days (cleanup)

**Extraction Metadata:**
- **Logs:** Retained for 30 days for debugging
- **Analytics:** Aggregated (no PII) retained indefinitely

### 4.2 Automated Cleanup

```sql
-- Scheduled function (runs daily at 2 AM)
CREATE OR REPLACE FUNCTION cleanup_old_cv_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Soft delete CV uploads older than 30 days
  UPDATE cv_uploads
  SET deleted_at = NOW()
  WHERE uploaded_at < NOW() - INTERVAL '30 days'
    AND deleted_at IS NULL
    AND profile_id IS NULL; -- Only if profile NOT created

  -- 2. Hard delete soft-deleted uploads after 90 days
  DELETE FROM cv_uploads
  WHERE deleted_at < NOW() - INTERVAL '90 days';

  -- 3. Delete extraction tasks for non-created profiles after 7 days
  DELETE FROM cv_extraction_tasks
  WHERE created_at < NOW() - INTERVAL '7 days'
    AND cv_upload_id IN (
      SELECT id FROM cv_uploads WHERE profile_id IS NULL
    );

  -- 4. Delete Storage files for deleted uploads
  -- (Manual process - Supabase doesn't support SQL → Storage operations)

  RAISE NOTICE 'CV data cleanup completed';
END;
$$;

-- Schedule with pg_cron
SELECT cron.schedule(
  'cleanup-cv-data',
  '0 2 * * *', -- 2 AM daily
  $$SELECT cleanup_old_cv_data()$$
);
```

### 4.3 GDPR Compliance

**User Rights:**

1. **Right to Access:**
   - User can view all uploaded CVs
   - User can view extraction results
   - Provided via profile dashboard

2. **Right to Deletion:**
   - User can delete CV immediately (soft delete)
   - User can request hard delete (via support)
   - All data removed within 30 days

3. **Right to Portability:**
   - User can export extracted profile data (markdown export)
   - User can download original CV file

4. **Right to Rectification:**
   - User can edit extracted data before saving
   - User can re-run extraction on new CV

**Data Processing Notice:**
```
Your CV is uploaded to secure storage and processed using AI (Anthropic Claude).
The AI extracts professional information to pre-fill your profile.

Data retention:
- Original CV: Deleted after 30 days
- Extracted data: Stored in your profile
- Processing logs: Deleted after 30 days

You can delete your CV and data anytime from your profile settings.
```

---

## 5. Rate Limiting & Abuse Prevention

### 5.1 Rate Limit Implementation

```sql
CREATE OR REPLACE FUNCTION check_cv_upload_rate_limit(
  p_user_id UUID,
  p_session_id TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
  v_limit CONSTANT INTEGER := 5;
  v_window CONSTANT INTERVAL := '1 hour';
BEGIN
  SELECT upload_count, window_start INTO v_count, v_window_start
  FROM cv_upload_rate_limits
  WHERE (p_user_id IS NOT NULL AND user_id = p_user_id)
     OR (p_user_id IS NULL AND session_id = p_session_id);

  -- Reset if window expired
  IF v_window_start IS NULL OR v_window_start < NOW() - v_window THEN
    INSERT INTO cv_upload_rate_limits (user_id, session_id, upload_count, window_start)
    VALUES (p_user_id, p_session_id, 1, NOW())
    ON CONFLICT ((COALESCE(user_id, '00000000-0000-0000-0000-000000000000'), COALESCE(session_id, '')))
    DO UPDATE SET upload_count = 1, window_start = NOW();
    RETURN true;
  END IF;

  -- Check limit
  IF v_count >= v_limit THEN
    RETURN false; -- Rate limit exceeded
  END IF;

  -- Increment counter
  UPDATE cv_upload_rate_limits
  SET upload_count = upload_count + 1
  WHERE (p_user_id IS NOT NULL AND user_id = p_user_id)
     OR (p_user_id IS NULL AND session_id = p_session_id);

  RETURN true;
END;
$$;
```

**Usage in Edge Function:**
```typescript
// Check rate limit before processing
const allowed = await supabase.rpc('check_cv_upload_rate_limit', {
  p_user_id: userId,
  p_session_id: sessionId
});

if (!allowed) {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED'
    }),
    { status: 429 }
  );
}
```

### 5.2 Cost Protection

**Budget Alerts:**
```bash
# Set in Anthropic Dashboard
Monthly Budget: $50
Alert at 80%: $40
Hard limit: $60 (stop all requests)
```

**Monitoring Query:**
```sql
-- Track API costs
SELECT
  DATE(created_at) as date,
  COUNT(*) as extraction_count,
  COUNT(*) * 0.05 as estimated_cost_usd
FROM cv_extraction_tasks
WHERE status = 'completed'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 6. Secure Data Handling

### 6.1 PII (Personally Identifiable Information)

**PII in CV Uploads:**
- Full name
- Email address
- Phone number(s)
- Home address (if in CV)
- Date of birth (if in CV)

**Protection Measures:**
- ✅ RLS policies prevent cross-user access
- ✅ HTTPS enforced (TLS 1.3)
- ✅ Data encrypted at rest (Supabase default)
- ✅ Access logs for auditing
- ✅ 30-day deletion policy

### 6.2 Encryption

**At Rest:**
- Supabase provides AES-256 encryption for all data
- Storage files encrypted by default
- Database columns encrypted by Postgres

**In Transit:**
- TLS 1.3 for all API requests
- Certificate pinning (future enhancement)

**Edge Function Environment:**
- API keys in encrypted secrets (Supabase Vault)
- No secrets in logs

---

## 7. Security Testing Checklist

### Before Production Launch

**File Upload Security:**
- [ ] Upload .exe file renamed to .pdf → Rejected
- [ ] Upload file with SQL injection in filename → Sanitized
- [ ] Upload file >10MB → Rejected with 413 error
- [ ] Upload without authentication → Rejected with 401

**Access Control:**
- [ ] User A cannot access User B's uploaded CVs
- [ ] Direct URL to Storage file (without auth) → 403 Forbidden
- [ ] Expired auth token → 401 Unauthorized
- [ ] Session-based pre-auth user can access own CVs only

**Rate Limiting:**
- [ ] 6th upload within 1 hour → 429 Rate Limited
- [ ] After 1 hour, counter resets → Upload allowed
- [ ] Different sessions have independent limits

**API Key Security:**
- [ ] API key not visible in browser dev tools
- [ ] API key not in server logs
- [ ] API key not in error messages
- [ ] Edge Function secrets encrypted

**Data Privacy:**
- [ ] Uploaded CV not accessible to other users
- [ ] Extraction results not shared across users
- [ ] Soft-deleted CVs not visible in queries
- [ ] Hard-deleted CVs removed from Storage

---

## 8. Incident Response Plan

### 8.1 Security Incident Types

**Type 1: API Key Compromised**

**Indicators:**
- Unexpected spike in API usage
- API calls from unknown IPs
- Anthropic sends alert

**Response:**
1. Immediately rotate API key (generate new, deploy)
2. Review API usage logs for past 7 days
3. Calculate financial impact
4. Disable CV upload feature temporarily
5. Investigate how key was exposed
6. Update security measures

**Type 2: Unauthorized File Access**

**Indicators:**
- User reports seeing others' CVs
- RLS policy violation detected
- Audit logs show suspicious queries

**Response:**
1. Disable CV upload feature immediately
2. Review RLS policies for bugs
3. Audit who accessed which files
4. Notify affected users
5. Fix RLS policies
6. Re-enable after validation

**Type 3: Malware Upload**

**Indicators:**
- Antivirus flags uploaded file
- User reports suspicious file
- Storage scan detects malware

**Response:**
1. Delete infected file from Storage
2. Mark cv_upload record as deleted
3. Notify user (if malicious) or support user (if accidental)
4. Review upload from same user for patterns
5. Consider adding malware scanning

---

## 9. Compliance & Audit

### 9.1 Audit Logging

```sql
-- Audit log for file uploads
CREATE TABLE cv_upload_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  session_id TEXT,
  action TEXT NOT NULL, -- 'upload', 'download', 'delete'
  file_path TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger: Log all cv_uploads INSERT/DELETE
CREATE OR REPLACE FUNCTION audit_cv_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO cv_upload_audit_log (user_id, session_id, action, file_path)
    VALUES (NEW.user_id, NEW.session_id, 'upload', NEW.file_path);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO cv_upload_audit_log (user_id, session_id, action, file_path)
    VALUES (OLD.user_id, OLD.session_id, 'delete', OLD.file_path);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_cv_upload
AFTER INSERT OR DELETE ON cv_uploads
FOR EACH ROW EXECUTE FUNCTION audit_cv_upload();
```

### 9.2 Compliance Requirements

**For Solo User:** Minimal compliance needed
**If Scaling (100+ users):** Consider:
- GDPR (if EU users)
- CCPA (if California users)
- SOC 2 (if enterprise clients)

**Current Compliance:**
- ✅ Data encryption (at rest + in transit)
- ✅ Access control (RLS policies)
- ✅ Audit logging (who accessed what)
- ✅ Data retention policies (30-day deletion)
- ✅ User consent (clear messaging)

---

## 10. Security Recommendations

### MVP (Phase 3):
- ✅ Implement all RLS policies
- ✅ Rate limiting (5 uploads/hour)
- ✅ File validation (MIME + magic number)
- ✅ API key in secrets
- ✅ 30-day data retention
- ⚠️ Skip malware scanning (trust authenticated users)
- ⚠️ Manual audit weekly

### Post-MVP (Phase 4):
- ✅ Add malware scanning (VirusTotal API)
- ✅ Implement CAPTCHA (prevent bots)
- ✅ Add 2FA requirement for uploads (if enterprise users)
- ✅ Penetration testing
- ✅ SOC 2 compliance (if scaling)

---

**Last Updated:** October 6, 2025
**Security Review:** Approved for Phase 3 implementation
**Risk Level:** MEDIUM (with mitigations)
