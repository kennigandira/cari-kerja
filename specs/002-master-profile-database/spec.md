# Feature Specification: Master Profile Management

**Feature Branch**: `002-master-profile-database`
**Created**: 2025-10-08
**Status**: Implemented (Retroactive Documentation)
**Input**: User description: "Master Profile - Database-backed profile creation and management with markdown import/export, version control, and CRUD operations"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Professional Profile (Priority: P1)

A job seeker needs to create a structured profile containing their professional information to enable automated CV and cover letter generation for job applications.

**Why this priority**: Foundation for all CV generation features. Without a complete profile, no other features can function. This is the entry point for using the application.

**Independent Test**: User can create a profile from scratch by filling a web form, save it successfully, and view the saved profile displaying all entered information correctly.

**Acceptance Scenarios**:

1. **Given** a new user visits the application, **When** they click "Create Profile" and fill out basic information (name, email, location, professional summary) with at least 1 work experience and 5 skills, **Then** the profile is saved to the database within 2 seconds and they are redirected to view their new profile
2. **Given** a user is filling out the profile form, **When** they enter invalid data (e.g., email without @ symbol, summary less than 50 characters), **Then** real-time validation messages appear under the relevant fields before submission
3. **Given** a user submits a profile form, **When** a network error occurs during save, **Then** all entered data is preserved in the form and a user-friendly error message offers a retry option

---

### User Story 2 - View Saved Profile (Priority: P1)

A job seeker needs to review their complete professional profile to verify accuracy before applying to jobs.

**Why this priority**: Primary read operation that users perform frequently. Required to verify profile data before generating CVs. Forms the foundation for all profile interactions.

**Independent Test**: User can navigate to their profile page and see all sections (basic info, summary, work experience, skills) displayed in a readable format with correct data and dates.

**Acceptance Scenarios**:

1. **Given** a user has a saved profile, **When** they click "View Profile" in navigation, **Then** the profile page loads in under 1 second showing all sections with correct formatting
2. **Given** a user views their profile, **When** looking at work experiences, **Then** experiences are sorted by start date (most recent first) and current positions are marked as "Present"
3. **Given** a user has no profile yet, **When** they navigate to the profile page, **Then** a clear call-to-action prompts them to create their first profile

---

### User Story 3 - Edit Existing Profile (Priority: P2)

A job seeker needs to update their professional information as they gain new skills or change jobs, ensuring their profile stays current for accurate job applications.

**Why this priority**: Core maintenance operation. Profiles become outdated quickly in active job search. Enables users to keep information accurate without recreating from scratch.

**Independent Test**: User can edit any field in their existing profile, save changes successfully, and see updates reflected immediately without losing other data.

**Acceptance Scenarios**:

1. **Given** a user is viewing their profile, **When** they click "Edit Profile" and modify their professional summary, **Then** changes are saved within 2 seconds and the updated summary appears in the profile view
2. **Given** two users are editing the same profile in different tabs, **When** both attempt to save simultaneously, **Then** one succeeds and the other receives a version conflict message prompting them to refresh
3. **Given** a user is editing their profile, **When** they add a new skill with category and proficiency level, **Then** the skill appears in the correct category group after save

---

### User Story 4 - Export Profile to Markdown (Priority: P2)

A job seeker needs to export their database profile to markdown format to maintain compatibility with existing CV generation scripts that read from markdown files.

**Why this priority**: Critical migration path and backward compatibility. Ensures existing CV generation workflows continue working. Provides portable backup of profile data.

**Independent Test**: User can click "Export to Markdown" button, download a .md file, and verify that all profile data is formatted correctly matching the original master_profile.md structure.

**Acceptance Scenarios**:

1. **Given** a user has a complete profile with work experiences and skills, **When** they click "Export to Markdown", **Then** a .md file downloads within 1 second containing all profile data in the expected markdown format
2. **Given** a user exports their profile to markdown, **When** they compare the exported file to their database profile, **Then** 100% of data matches with correct formatting including dates, skills, and work history
3. **Given** a user uses the exported markdown file with existing CV generation scripts, **When** the script runs, **Then** CV generation completes successfully with no parsing errors

---

### User Story 5 - Import Profile from Markdown (Priority: P3)

A job seeker with an existing master_profile.md file needs to migrate their data into the database system without manually re-entering all information.

**Why this priority**: One-time migration requirement for existing users. Reduces friction for adoption. After initial import, users will use web form for updates.

**Independent Test**: User can upload their existing master_profile.md file, system parses it correctly, and all data populates into the database preserving structure and relationships.

**Acceptance Scenarios**:

1. **Given** a user has an existing master_profile.md file, **When** they upload it via the import function, **Then** system parses all sections correctly and creates a complete profile in under 5 seconds
2. **Given** the system imports a markdown file, **When** parsing encounters an unrecognized format or missing required fields, **Then** a detailed error message explains which sections failed validation and why
3. **Given** a user completes markdown import, **When** they view their newly created profile, **Then** all work experiences, skills, and personal information match the original markdown file exactly

---

### Edge Cases

- **What happens when a user creates a profile with 100+ skills?** System handles large datasets without performance degradation; form remains responsive; skills are paginated or grouped by category for readability.

- **How does the system handle concurrent edits to the same profile?** Version control using optimistic locking detects conflicts; user attempting second save receives clear conflict message; user must refresh to see latest changes before re-editing.

- **What if markdown import file has invalid or corrupted data?** Parser validates each section independently; errors are reported with line numbers and specific field names; partial imports are not saved (all-or-nothing transaction).

- **How does the system prevent data loss during network interruptions?** Auto-save functionality stores draft data in browser local storage every 30 seconds; on reconnection, user is prompted to restore unsaved changes.

- **What happens when required fields are empty during edit?** Client-side validation prevents submission; specific field-level error messages guide user to complete required information; existing valid data is preserved.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create a new master profile by providing basic information (name, email, location, professional summary), work experiences, and skills through a web form
- **FR-002**: System MUST validate all profile data before saving, including email format, summary length (50-2000 characters), and presence of at least 1 work experience and 5 skills
- **FR-003**: System MUST save profile data atomically, ensuring all related data (profile, experiences, skills) are saved together or rolled back entirely on failure
- **FR-004**: Users MUST be able to view their complete saved profile including all sections (basic info, work history, skills, education) in a readable format
- **FR-005**: System MUST display work experiences sorted by start date in descending order with current positions marked as "Present"
- **FR-006**: Users MUST be able to edit any field in their existing profile and save changes without affecting other data
- **FR-007**: System MUST implement version control to detect concurrent edits and prevent data overwrites through optimistic locking
- **FR-008**: Users MUST be able to delete their profile with soft-delete functionality that preserves referential integrity with job applications
- **FR-009**: System MUST provide profile export functionality that generates a markdown file matching the original master_profile.md format
- **FR-010**: Users MUST be able to import an existing master_profile.md file to automatically populate database fields
- **FR-011**: System MUST parse imported markdown files and validate data against schema before creating profile
- **FR-012**: System MUST support multiple work experiences per profile with company name, position, dates, location, and description
- **FR-013**: System MUST support multiple skills per profile with skill name, category, proficiency level, and years of experience
- **FR-014**: System MUST enforce data integrity constraints including valid email format, date ranges (end date ≥ start date), and character limits
- **FR-015**: System MUST provide real-time field validation with inline error messages displayed under relevant form fields
- **FR-016**: System MUST auto-save form data to browser local storage every 30 seconds to prevent data loss
- **FR-017**: System MUST allow users to restore auto-saved draft data if browser is closed before submission
- **FR-018**: System MUST translate database errors into user-friendly messages without exposing technical details
- **FR-019**: System MUST enforce row-level security to ensure users can only access their own profiles
- **FR-020**: System MUST support session-based pre-authentication allowing profile creation before user login

### Key Entities

- **Master Profile**: Represents a job seeker's professional identity containing contact information (name, email, phone, location, LinkedIn URL), professional summary, years of experience, and current position. A user can have multiple profiles with one designated as default.

- **Work Experience**: Represents employment history including company name, position title, location, start/end dates, current position flag, job description, and display order. Each experience belongs to one profile; a profile can have multiple experiences.

- **Skill**: Represents a professional competency including skill name, category (e.g., "Frontend Frameworks", "Programming Languages"), proficiency level (Beginner/Intermediate/Advanced/Expert), years of experience, and display order. Each skill belongs to one profile; a profile can have many skills.

- **Achievement**: Represents measurable accomplishments within a work experience including description, metric type (percentage, revenue, time, count), numeric value, unit, and timeframe. Achievements are nested under work experiences for better organization.

- **Education**: Represents academic credentials including institution name, degree/diploma, field of study, start/end dates, location, and GPA. Each education entry belongs to one profile.

- **Certification**: Represents professional certifications including name, issuing organization, issue date, expiration date, credential ID, and verification URL. Each certification belongs to one profile.

- **Language**: Represents language proficiency including language name, proficiency level (Elementary/Limited Working/Professional Working/Full Professional/Native), and whether it's the native language. Each language entry belongs to one profile.

- **Profile Version**: Represents the version number for optimistic locking to prevent concurrent edit conflicts. Version increments with each update to detect stale data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a complete profile in 5 minutes or less (compared to 30 minutes manual markdown editing)
- **SC-002**: Profile data saves successfully within 2 seconds for 95% of submissions
- **SC-003**: Form loads and displays within 1 second for all users
- **SC-004**: 100% of existing master_profile.md files import successfully without data loss
- **SC-005**: Exported markdown files match database data with 100% accuracy when compared
- **SC-006**: Zero profiles have orphaned data (work experiences or skills without parent profile) due to atomic transaction enforcement
- **SC-007**: Version conflict detection prevents 100% of concurrent edit data overwrites
- **SC-008**: Auto-save functionality restores draft data correctly in 95% of browser closure scenarios
- **SC-009**: Field validation catches 100% of invalid email formats, short summaries, and date range errors before database submission
- **SC-010**: Users can manage profiles with 100+ skills without performance degradation (page load < 2 seconds)
- **SC-011**: Row-level security prevents 100% of unauthorized access attempts to other users' profiles
- **SC-012**: Database error messages are translated to user-friendly language in 100% of cases (no technical jargon exposed to users)

## Assumptions

1. **Single User Context**: Initial implementation assumes single user (job seeker) accessing their own profiles; multi-user collaboration is not required
2. **Markdown Format Stability**: Existing master_profile.md files follow a consistent format that can be parsed reliably
3. **Browser Compatibility**: Users access the application through modern browsers supporting localStorage and ES6 JavaScript
4. **Network Reliability**: Internet connection is generally stable; auto-save mitigates brief disconnections
5. **Profile Count**: Most users will maintain 1-3 profiles (default profile plus specialized versions for different job types)
6. **Data Retention**: Soft-deleted profiles are retained indefinitely to preserve job application references
7. **Concurrent Edit Frequency**: Concurrent edits to the same profile are rare edge cases, primarily occurring if user has multiple tabs open
8. **Import Frequency**: Markdown import is primarily a one-time migration tool; ongoing edits use web form
9. **Accessibility Requirements**: Application must meet WCAG 2.1 AA standards for screen reader compatibility and keyboard navigation
10. **Session Duration**: Users typically complete profile creation or editing in a single session; multi-day drafts are supported via auto-save

## Dependencies

1. **Database Schema**: Requires `master_profiles` table and related tables (`work_experiences`, `skills`, `education`, `certifications`, `languages`) to be created and migrated
2. **Row-Level Security**: Requires RLS policies to be configured for all profile-related tables to enforce user data isolation
3. **Atomic Transaction Functions**: Requires database RPC functions (`create_master_profile`, `update_master_profile`, `soft_delete_profile`) for transaction safety
4. **Markdown Parser**: Requires parser library or function to convert master_profile.md format to structured JSON
5. **Existing CV Generation Scripts**: Must maintain backward compatibility with scripts that read markdown format via export functionality

## Out of Scope

- **Multi-step Wizard UI**: Profile creation uses single-page form with collapsible sections; multi-step wizard is deferred to future enhancement
- **CV File Upload and AI Extraction**: Users cannot upload PDF/DOCX CVs for automatic data extraction; this feature is deferred to Phase 3
- **Profile Duplication**: Users cannot duplicate existing profiles to create specialized versions; must manually create new profiles (deferred to Phase 2)
- **Real-time Collaboration**: Multiple users cannot edit the same profile simultaneously; version control prevents conflicts but doesn't enable live co-editing
- **Profile Templates**: Pre-built profile templates for different industries or seniority levels are not included
- **Profile Analytics**: Dashboard showing profile completeness score, views, or optimization suggestions is not included
- **Social Features**: Profile sharing, public profiles, or LinkedIn-style connections are not supported
- **Integration with External Services**: No automatic sync with LinkedIn, Indeed, or other job platforms
- **Advanced Search**: Cannot search across multiple profiles or filter by specific skills/experience criteria
