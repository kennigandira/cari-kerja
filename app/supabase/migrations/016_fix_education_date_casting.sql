-- Migration 016: Fix Education/Certification Date Casting in RPC
-- Date: 2025-10-06
-- Description: Fix NULLIF handling for date fields in create_master_profile RPC
-- Issue: Empty strings can't be cast to DATE type

BEGIN;

-- Update create_master_profile RPC to handle NULL dates properly
CREATE OR REPLACE FUNCTION create_master_profile(
  p_profile JSONB,
  p_experiences JSONB DEFAULT '[]'::JSONB,
  p_skills JSONB DEFAULT '[]'::JSONB,
  p_education JSONB DEFAULT '[]'::JSONB,
  p_certifications JSONB DEFAULT '[]'::JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
  v_user_id UUID;
  v_session_id TEXT;
  v_exp JSONB;
  v_skill JSONB;
  v_edu JSONB;
  v_cert JSONB;
BEGIN
  -- Get authenticated user ID (NULL if not authenticated)
  v_user_id := auth.uid();

  -- Get session_id from profile data (for pre-auth profiles)
  v_session_id := p_profile->>'session_id';

  -- Validate required fields
  IF p_profile->>'full_name' IS NULL OR p_profile->>'email' IS NULL THEN
    RAISE EXCEPTION 'full_name and email are required';
  END IF;

  IF p_profile->>'location' IS NULL OR p_profile->>'professional_summary' IS NULL THEN
    RAISE EXCEPTION 'location and professional_summary are required';
  END IF;

  -- Insert master profile
  INSERT INTO master_profiles (
    user_id,
    session_id,
    profile_name,
    is_default,
    full_name,
    email,
    phone_primary,
    phone_secondary,
    linkedin_url,
    github_url,
    portfolio_url,
    location,
    professional_summary,
    years_of_experience,
    current_position
  )
  VALUES (
    v_user_id,
    v_session_id,
    COALESCE(p_profile->>'profile_name', 'Main Profile'),
    COALESCE((p_profile->>'is_default')::BOOLEAN, true),
    p_profile->>'full_name',
    p_profile->>'email',
    p_profile->>'phone_primary',
    p_profile->>'phone_secondary',
    p_profile->>'linkedin_url',
    p_profile->>'github_url',
    p_profile->>'portfolio_url',
    p_profile->>'location',
    p_profile->>'professional_summary',
    (p_profile->>'years_of_experience')::INTEGER,
    p_profile->>'current_position'
  )
  RETURNING id INTO v_profile_id;

  -- Insert work experiences
  IF jsonb_array_length(p_experiences) > 0 THEN
    FOR v_exp IN SELECT * FROM jsonb_array_elements(p_experiences)
    LOOP
      INSERT INTO work_experiences (
        profile_id,
        company_name,
        position_title,
        location,
        start_date,
        end_date,
        is_current,
        description,
        display_order
      )
      VALUES (
        v_profile_id,
        v_exp->>'company_name',
        v_exp->>'position_title',
        v_exp->>'location',
        v_exp->>'start_date',
        v_exp->>'end_date',
        COALESCE((v_exp->>'is_current')::BOOLEAN, false),
        v_exp->>'description',
        COALESCE((v_exp->>'display_order')::INTEGER, 0)
      );
    END LOOP;
  END IF;

  -- Insert skills
  IF jsonb_array_length(p_skills) > 0 THEN
    FOR v_skill IN SELECT * FROM jsonb_array_elements(p_skills)
    LOOP
      INSERT INTO skills (
        profile_id,
        skill_name,
        category,
        proficiency_level,
        years_of_experience,
        display_order
      )
      VALUES (
        v_profile_id,
        v_skill->>'skill_name',
        v_skill->>'category',
        v_skill->>'proficiency_level',
        (v_skill->>'years_of_experience')::INTEGER,
        COALESCE((v_skill->>'display_order')::INTEGER, 0)
      );
    END LOOP;
  END IF;

  -- Insert education
  IF jsonb_array_length(p_education) > 0 THEN
    FOR v_edu IN SELECT * FROM jsonb_array_elements(p_education)
    LOOP
      INSERT INTO education (
        profile_id,
        institution_name,
        degree_or_field,
        location,
        description,
        start_date,
        end_date,
        date_precision,
        is_current,
        display_order
      )
      VALUES (
        v_profile_id,
        v_edu->>'institution_name',
        v_edu->>'degree_or_field',
        v_edu->>'location',
        v_edu->>'description',
        NULLIF(v_edu->>'start_date', '')::DATE,
        NULLIF(v_edu->>'end_date', '')::DATE,
        COALESCE(v_edu->>'date_precision', 'month'),
        COALESCE((v_edu->>'is_current')::BOOLEAN, false),
        COALESCE((v_edu->>'display_order')::INTEGER, 0)
      );
    END LOOP;
  END IF;

  -- Insert certifications
  IF jsonb_array_length(p_certifications) > 0 THEN
    FOR v_cert IN SELECT * FROM jsonb_array_elements(p_certifications)
    LOOP
      INSERT INTO certifications (
        profile_id,
        certification_name,
        issuing_organization,
        credential_id,
        credential_url,
        description,
        issue_date,
        expiry_date,
        date_precision,
        display_order
      )
      VALUES (
        v_profile_id,
        v_cert->>'certification_name',
        v_cert->>'issuing_organization',
        v_cert->>'credential_id',
        v_cert->>'credential_url',
        v_cert->>'description',
        NULLIF(v_cert->>'issue_date', '')::DATE,
        NULLIF(v_cert->>'expiry_date', '')::DATE,
        COALESCE(v_cert->>'date_precision', 'month'),
        COALESCE((v_cert->>'display_order')::INTEGER, 0)
      );
    END LOOP;
  END IF;

  RETURN v_profile_id;
END;
$$;

COMMIT;

-- Migration Notes:
-- Fixed date casting in create_master_profile RPC function
-- Uses NULLIF to convert empty strings to NULL before casting to DATE
-- This prevents "column is of type date but expression is of type text" errors
