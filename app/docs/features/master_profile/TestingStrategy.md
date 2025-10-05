# Testing Strategy - Master Profile Feature

**Version:** 1.0
**Test Coverage Target:** 80% overall, 90% for services
**Testing Framework:** Vitest (unit), Playwright (E2E)

---

## Test Coverage Requirements

| Layer | Target | Framework | Priority |
|-------|--------|-----------|----------|
| Services (Backend) | 90% | Vitest | P0 |
| Handlers (API) | 85% | Vitest | P0 |
| Components (Frontend) | 80% | Vitest + Testing Library | P0 |
| Stores (Pinia) | 90% | Vitest | P0 |
| E2E Scenarios | 100% critical paths | Playwright | P0 |
| Accessibility | WCAG 2.1 AA (100 score) | axe-core | P0 |

---

## Critical Test Scenarios

### Backend Tests

**1. Atomic Transaction Integrity**
```typescript
// ProfileService.spec.ts
describe('ProfileService.createProfile', () => {
  it('should rollback all changes if work experience insert fails', async () => {
    // Mock work_experiences insert to fail
    supabaseMock.from('work_experiences').insert.mockRejectedValue(new Error('DB error'));

    await expect(
      profileService.createProfile(userId, profileData)
    ).rejects.toThrow();

    // Verify NO profile was created
    const profiles = await realSupabase
      .from('master_profiles')
      .select()
      .eq('user_id', userId);

    expect(profiles.data).toHaveLength(0);
  });
});
```

**2. Optimistic Locking**
```typescript
it('should detect concurrent update conflicts', async () => {
  const profile = await profileService.createProfile(userId, data);

  // Simulate two concurrent updates
  const update1 = profileService.updateProfile(profile.id, changes1, version: 1);
  const update2 = profileService.updateProfile(profile.id, changes2, version: 1);

  const [result1, result2] = await Promise.allSettled([update1, update2]);

  // One succeeds, one fails with ConflictError
  const succeeded = [result1, result2].filter(r => r.status === 'fulfilled');
  const failed = [result1, result2].filter(r => r.status === 'rejected');

  expect(succeeded).toHaveLength(1);
  expect(failed).toHaveLength(1);
  expect(failed[0].reason).toBeInstanceOf(ConflictError);
});
```

**3. File Security**
```typescript
describe('FileParser.parsePDF', () => {
  it('should reject files with invalid magic bytes', async () => {
    const fakePDF = Buffer.from('This is not a PDF');

    await expect(
      fileParser.parsePDF(fakePDF)
    ).rejects.toThrow('Invalid PDF format');
  });

  it('should timeout on large files', async () => {
    const hugePDF = generateLargePDFBuffer(10 * 1024 * 1024); // 10MB

    await expect(
      fileParser.parsePDF(hugePDF)
    ).rejects.toThrow('Parse timeout');
  });
});
```

### Frontend Tests

**4. File Upload Progress**
```typescript
// FileUploader.spec.ts
it('should show progress during upload', async () => {
  const wrapper = mount(FileUploader);
  const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });

  await wrapper.find('input[type="file"]').setValue([file]);

  // Should show progress
  await wrapper.vm.$nextTick();
  expect(wrapper.find('.progress-bar').exists()).toBe(true);
  expect(wrapper.find('.progress-text').text()).toContain('Uploading');
});
```

**5. Form Validation**
```typescript
// ProfileWizard.spec.ts
it('should validate email format', async () => {
  const wrapper = mount(StepBasicInfo);

  await wrapper.find('input[name="email"]').setValue('invalid-email');
  await wrapper.find('input[name="email"]').trigger('blur');

  expect(wrapper.find('.error-message').text()).toContain('valid email');
});
```

**6. Auto-Save**
```typescript
// useAutoSave.spec.ts
it('should auto-save after 30 seconds of inactivity', async () => {
  vi.useFakeTimers();

  const { saveDraft } = useAutoSave(profileId, formData);
  const saveSpy = vi.spyOn(localStorage, 'setItem');

  formData.value.fullName = 'John Doe';

  // Fast-forward 30 seconds
  vi.advanceTimersByTime(30000);

  expect(saveSpy).toHaveBeenCalledWith(
    'profile-draft-profileId',
    expect.stringContaining('John Doe')
  );

  vi.useRealTimers();
});
```

### E2E Tests (Playwright)

**7. Complete Profile Creation Flow**
```typescript
test('create profile from CV upload', async ({ page }) => {
  await page.goto('/profiles/create');

  // Accept AI consent
  await page.click('button:has-text("I Understand")');

  // Upload CV
  await page.setInputFiles('input[type="file"]', 'fixtures/sample-resume.pdf');

  // Wait for extraction
  await expect(page.locator('text=Analyzing')).toBeVisible();
  await expect(page.locator('text=Analysis complete')).toBeVisible({ timeout: 60000 });

  // Step 2: Review basic info
  await expect(page.locator('input[name="fullName"]')).toHaveValue(/./);
  await page.click('button:has-text("Next")');

  // Step 3: Review work experiences
  await expect(page.locator('.work-experience')).toBeVisible();
  await page.click('button:has-text("Next")');

  // Step 4-5: Skip for now
  await page.click('button:has-text("Next")');
  await page.click('button:has-text("Next")');

  // Step 6: Preview and submit
  await page.click('button:has-text("Create Profile")');

  // Success
  await expect(page).toHaveURL('/profiles');
  await expect(page.locator('.profile-card')).toBeVisible();
});
```

**8. Accessibility Test**
```typescript
test('keyboard navigation in wizard', async ({ page }) => {
  await page.goto('/profiles/create');

  // Tab through form fields
  await page.keyboard.press('Tab');
  await expect(page.locator('input[name="fullName"]')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('input[name="email"]')).toBeFocused();

  // Arrow keys navigate steps
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[aria-current="step"]')).toHaveText('Work Experience');
});
```

---

## Accessibility Testing

**Automated (axe-core):**
```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('profile wizard is accessible', async ({ page }) => {
  await page.goto('/profiles/create');
  await injectAxe(page);

  // Check for violations
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true }
  });
});
```

**Manual Testing Checklist:**
- [ ] Test with NVDA/JAWS screen reader
- [ ] Navigate entire form with keyboard only
- [ ] Verify focus indicators visible
- [ ] Test with 200% zoom
- [ ] Test with high contrast mode
- [ ] Verify color contrast (4.5:1 minimum)

---

## Performance Testing

**Bundle Size:**
```bash
bun run build:analyze

# Targets:
# - Main bundle: < 200KB (gzip)
# - Profile wizard chunk: < 100KB (gzip)
# - Dependencies: < 150KB (gzip)
```

**Load Testing:**
```typescript
// Simulate 100 concurrent users creating profiles
import { test } from '@playwright/test';

test('load test profile creation', async () => {
  const users = Array.from({ length: 100 }, (_, i) => i);

  const results = await Promise.allSettled(
    users.map(i =>
      fetch('/api/v1/profiles', {
        method: 'POST',
        body: JSON.stringify(generateProfileData(i))
      })
    )
  );

  const succeeded = results.filter(r => r.status === 'fulfilled');
  expect(succeeded.length / 100).toBeGreaterThan(0.95); // 95% success rate
});
```

---

## Test Fixtures

**Sample CVs for Testing:**
```
fixtures/
├── valid-resume.pdf           # Well-formatted PDF
├── valid-resume.docx          # Well-formatted DOCX
├── scanned-resume.pdf         # Poor quality (low extraction confidence)
├── malformed.pdf              # Invalid PDF (security test)
├── large-resume.pdf           # 4.9MB (near limit test)
├── too-large.pdf              # 6MB (over limit test)
└── fake-pdf.exe               # Security test (magic byte mismatch)
```

**Sample Extracted Data:**
```typescript
export const mockExtractionResult: CVExtractionResult = {
  profile_data: {
    full_name: 'John Doe',
    email: 'john@example.com',
    phone_primary: '+66812345678',
    location: 'Bangkok, Thailand',
    professional_summary: 'Frontend Engineer with 8+ years...',
    years_of_experience: 8
  },
  work_experiences: [...],
  skills: [...],
  confidence_scores: {
    email: 0.98,
    phone_primary: 0.75,
    full_name: 0.95
  },
  warnings: [
    'Low confidence in phone_primary. Please verify.'
  ]
};
```

---

## CI/CD Integration

**GitHub Actions Workflow:**
```yaml
name: Test Master Profile Feature

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1

      # Backend tests
      - name: Backend Unit Tests
        run: |
          cd app/workers
          bun test

      # Frontend tests
      - name: Frontend Unit Tests
        run: |
          cd app/frontend
          bun test

      # E2E tests
      - name: E2E Tests
        run: |
          cd app/frontend
          bunx playwright install
          bunx playwright test

      # Accessibility audit
      - name: Accessibility Audit
        run: |
          cd app/frontend
          bun run build
          bunx @axe-core/cli dist --save audit.json
          # Fail if violations found
          test $(cat audit.json | jq '.violations | length') -eq 0
```

---

**See ImplementationPlan.md for sprint-by-sprint testing schedule.**
