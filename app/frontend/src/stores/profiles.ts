import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '../lib/supabase';
import type { MasterProfile, MasterProfileWithDetails, WorkExperience, Skill } from '../../../shared/types';
import { translateSupabaseError } from '../utils/errorMessages';

const SESSION_ID_KEY = 'cari_kerja_session_id';

function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

export const useProfilesStore = defineStore('profiles', () => {
  const profiles = ref<MasterProfile[]>([]);
  const currentProfile = ref<MasterProfileWithDetails | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const defaultProfile = computed(() =>
    profiles.value.find(p => p.is_default && !p.deleted_at)
  );

  async function fetchProfiles() {
    loading.value = true;
    error.value = null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = getOrCreateSessionId();

      let query = supabase
        .from('master_profiles')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', sessionId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      profiles.value = data || [];
    } catch (err: any) {
      error.value = translateSupabaseError(err);
      console.error('Failed to fetch profiles:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchProfileById(id: string) {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from('master_profiles')
        .select(`
          *,
          work_experiences (*),
          skills (*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      currentProfile.value = data as MasterProfileWithDetails;
      return data;
    } catch (err: any) {
      error.value = translateSupabaseError(err);
      console.error('Failed to fetch profile:', err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function createProfile(profileData: Partial<MasterProfile>): Promise<MasterProfile> {
    const tempId = `temp-${Date.now()}`;
    const sessionId = getOrCreateSessionId();

    const optimisticProfile: MasterProfile = {
      id: tempId,
      session_id: sessionId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile_name: profileData.profile_name || 'New Profile',
      is_default: profileData.is_default || false,
      full_name: profileData.full_name || '',
      email: profileData.email || '',
      location: profileData.location || '',
      professional_summary: profileData.professional_summary || '',
      version: 1,
      ...profileData
    };

    profiles.value.unshift(optimisticProfile);

    try {
      const { data, error: createError } = await supabase.rpc('create_master_profile', {
        p_profile: {
          ...profileData,
          session_id: sessionId
        },
        p_experiences: [],
        p_skills: []
      });

      if (createError) throw createError;

      const index = profiles.value.findIndex(p => p.id === tempId);
      if (index !== -1) {
        profiles.value[index] = { ...optimisticProfile, id: data as string };
      }

      const createdProfile = profiles.value[index];
      if (!createdProfile) {
        throw new Error('Failed to create profile');
      }

      return createdProfile;
    } catch (err: any) {
      profiles.value = profiles.value.filter(p => p.id !== tempId);
      error.value = translateSupabaseError(err);
      console.error('Failed to create profile:', err);
      throw err;
    }
  }

  async function updateProfile(id: string, updates: Partial<MasterProfile>) {
    const originalProfile = profiles.value.find(p => p.id === id);
    if (!originalProfile) return;

    const optimisticProfile = {
      ...originalProfile,
      ...updates,
      updated_at: new Date().toISOString(),
      version: originalProfile.version + 1
    };

    const index = profiles.value.findIndex(p => p.id === id);
    if (index !== -1) {
      profiles.value[index] = optimisticProfile;
    }

    try {
      const { data, error: updateError } = await supabase.rpc('update_master_profile', {
        p_profile_id: id,
        p_updates: updates,
        p_expected_version: originalProfile.version
      });

      if (updateError) throw updateError;

      // Handle the new response format from migration 019
      const response = data as { success: boolean; error_message: string | null; profile: MasterProfile | null };

      if (!response.success) {
        throw new Error(response.error_message || 'Failed to update profile');
      }

      const updatedProfile = response.profile;
      if (!updatedProfile) {
        throw new Error('No profile data returned from update');
      }

      if (index !== -1) {
        profiles.value[index] = updatedProfile;
      }

      if (currentProfile.value?.id === id) {
        currentProfile.value = { ...currentProfile.value, ...updatedProfile };
      }

      return updatedProfile;
    } catch (err: any) {
      if (index !== -1) {
        profiles.value[index] = originalProfile;
      }

      if (err.message?.includes('CONFLICT') || err.code === '40001' || err.message?.includes('Version conflict')) {
        error.value = 'Profile was modified by another session. Please refresh.';
      } else {
        error.value = translateSupabaseError(err);
      }

      console.error('Failed to update profile:', err);
      throw err;
    }
  }

  async function updateProfileWithDetails(
    id: string,
    updates: Partial<MasterProfile>,
    experiences: Partial<WorkExperience>[],
    skills: Partial<Skill>[]
  ) {
    const originalProfile = profiles.value.find(p => p.id === id);
    if (!originalProfile) return;

    const optimisticProfile = {
      ...originalProfile,
      ...updates,
      updated_at: new Date().toISOString(),
      version: originalProfile.version + 1
    };

    const index = profiles.value.findIndex(p => p.id === id);
    if (index !== -1) {
      profiles.value[index] = optimisticProfile;
    }

    try {
      const { data, error: updateError } = await supabase.rpc('update_master_profile_with_details', {
        p_profile_id: id,
        p_expected_version: originalProfile.version,
        p_profile_updates: updates,
        p_experiences: experiences,
        p_skills: skills
      });

      if (updateError) throw updateError;

      // Handle the response format from migration 022
      const response = data as { success: boolean; error_message: string | null; profile: MasterProfile | null };

      if (!response.success) {
        throw new Error(response.error_message || 'Failed to update profile');
      }

      const updatedProfile = response.profile;
      if (!updatedProfile) {
        throw new Error('No profile data returned from update');
      }

      if (index !== -1) {
        profiles.value[index] = updatedProfile;
      }

      if (currentProfile.value?.id === id) {
        // Refresh the full profile with details
        await fetchProfileById(id);
      }

      return updatedProfile;
    } catch (err: any) {
      if (index !== -1) {
        profiles.value[index] = originalProfile;
      }

      if (err.message?.includes('CONFLICT') || err.code === '40001' || err.message?.includes('Version conflict')) {
        error.value = 'Profile was modified by another session. Please refresh.';
      } else {
        error.value = translateSupabaseError(err);
      }

      console.error('Failed to update profile with details:', err);
      throw err;
    }
  }

  async function deleteProfile(id: string) {
    const originalProfiles = [...profiles.value];
    profiles.value = profiles.value.filter(p => p.id !== id);

    try {
      const { error: deleteError } = await supabase.rpc('soft_delete_profile', {
        p_profile_id: id
      });

      if (deleteError) throw deleteError;

      if (currentProfile.value?.id === id) {
        currentProfile.value = null;
      }
    } catch (err: any) {
      profiles.value = originalProfiles;
      error.value = translateSupabaseError(err);
      console.error('Failed to delete profile:', err);
      throw err;
    }
  }

  async function exportProfileMarkdown(profileId: string) {
    try {
      const { data, error: exportError } = await supabase.rpc('export_profile_markdown', {
        p_profile_id: profileId
      });

      if (exportError) throw exportError;

      const blob = new Blob([data as string], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `profile-${profileId}.md`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      error.value = translateSupabaseError(err);
      console.error('Failed to export profile:', err);
      throw err;
    }
  }

  async function addWorkExperience(profileId: string, experience: Partial<WorkExperience>) {
    try {
      const { data, error: addError } = await supabase
        .from('work_experiences')
        .insert({
          ...experience,
          profile_id: profileId
        })
        .select()
        .single();

      if (addError) throw addError;

      if (currentProfile.value?.id === profileId) {
        currentProfile.value.work_experiences = [
          ...(currentProfile.value.work_experiences || []),
          data as WorkExperience
        ];
      }

      return data;
    } catch (err: any) {
      error.value = translateSupabaseError(err);
      console.error('Failed to add work experience:', err);
      throw err;
    }
  }

  async function updateWorkExperience(id: string, updates: Partial<WorkExperience>) {
    try {
      const { data, error: updateError } = await supabase
        .from('work_experiences')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (currentProfile.value?.work_experiences) {
        const index = currentProfile.value.work_experiences.findIndex(exp => exp.id === id);
        if (index !== -1) {
          currentProfile.value.work_experiences[index] = data as WorkExperience;
        }
      }

      return data;
    } catch (err: any) {
      error.value = translateSupabaseError(err);
      console.error('Failed to update work experience:', err);
      throw err;
    }
  }

  async function deleteWorkExperience(id: string) {
    try {
      const { error: deleteError } = await supabase
        .from('work_experiences')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      if (currentProfile.value?.work_experiences) {
        currentProfile.value.work_experiences = currentProfile.value.work_experiences.filter(
          exp => exp.id !== id
        );
      }
    } catch (err: any) {
      error.value = translateSupabaseError(err);
      console.error('Failed to delete work experience:', err);
      throw err;
    }
  }

  async function addSkill(profileId: string, skill: Partial<Skill>) {
    try {
      const { data, error: addError } = await supabase
        .from('skills')
        .insert({
          ...skill,
          profile_id: profileId
        })
        .select()
        .single();

      if (addError) throw addError;

      if (currentProfile.value?.id === profileId) {
        currentProfile.value.skills = [
          ...(currentProfile.value.skills || []),
          data as Skill
        ];
      }

      return data;
    } catch (err: any) {
      error.value = translateSupabaseError(err);
      console.error('Failed to add skill:', err);
      throw err;
    }
  }

  async function updateSkill(id: string, updates: Partial<Skill>) {
    try {
      const { data, error: updateError} = await supabase
        .from('skills')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (currentProfile.value?.skills) {
        const index = currentProfile.value.skills.findIndex(skill => skill.id === id);
        if (index !== -1) {
          currentProfile.value.skills[index] = data as Skill;
        }
      }

      return data;
    } catch (err: any) {
      error.value = translateSupabaseError(err);
      console.error('Failed to update skill:', err);
      throw err;
    }
  }

  async function deleteSkill(id: string) {
    try {
      const { error: deleteError } = await supabase
        .from('skills')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      if (currentProfile.value?.skills) {
        currentProfile.value.skills = currentProfile.value.skills.filter(
          skill => skill.id !== id
        );
      }
    } catch (err: any) {
      error.value = translateSupabaseError(err);
      console.error('Failed to delete skill:', err);
      throw err;
    }
  }

  return {
    profiles,
    currentProfile,
    loading,
    error,
    defaultProfile,
    fetchProfiles,
    fetchProfileById,
    createProfile,
    updateProfile,
    updateProfileWithDetails,
    deleteProfile,
    exportProfileMarkdown,
    addWorkExperience,
    updateWorkExperience,
    deleteWorkExperience,
    addSkill,
    updateSkill,
    deleteSkill
  };
});
