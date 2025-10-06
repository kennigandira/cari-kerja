import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Job, JobWithDocuments, JobStatus } from '../../../shared/types';
import { supabase } from '../lib/supabase';

export const useJobsStore = defineStore('jobs', () => {
  const jobs = ref<JobWithDocuments[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const jobsByStatus = computed(() => {
    const grouped: Record<JobStatus, JobWithDocuments[]> = {
      processing: [],
      to_submit: [],
      waiting_for_call: [],
      ongoing: [],
      success: [],
      not_now: [],
    };

    jobs.value.forEach((job) => {
      grouped[job.status].push(job);
    });

    // Sort by kanban_order within each status
    Object.keys(grouped).forEach((status) => {
      grouped[status as JobStatus].sort((a, b) => a.kanban_order - b.kanban_order);
    });

    return grouped;
  });

  const fetchJobs = async () => {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      jobs.value = data || [];

      // Fetch documents for each job
      await fetchJobDocuments();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch jobs';
      console.error('Error fetching jobs:', err);
    } finally {
      loading.value = false;
    }
  };

  const fetchJobDocuments = async () => {
    const jobIds = jobs.value.map((job) => job.id);
    if (jobIds.length === 0) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('job_documents')
        .select('*')
        .in('job_id', jobIds);

      if (fetchError) throw fetchError;

      // Attach documents to jobs
      jobs.value.forEach((job) => {
        job.documents = (data || []).filter((doc) => doc.job_id === job.id);
      });
    } catch (err) {
      console.error('Error fetching job documents:', err);
    }
  };

  const getJobById = (id: string): JobWithDocuments | undefined => {
    return jobs.value.find((job) => job.id === id);
  };

  const createJob = async (inputContent: string, inputType?: 'url' | 'text') => {
    loading.value = true;
    error.value = null;

    try {
      // Auto-detect input type if not provided
      const detectedType = inputType || (inputContent.trim().startsWith('http') ? 'url' : 'text');

      const newJob: Partial<Job> = {
        input_content: inputContent,
        input_type: detectedType,
        original_url: detectedType === 'url' ? inputContent : undefined,
        status: 'processing',
        kanban_order: 0,
      };

      const { data, error: insertError } = await supabase
        .from('jobs')
        .insert([newJob])
        .select()
        .single();

      if (insertError) throw insertError;

      // Add processing tasks to queue
      await createProcessingTasks(data.id);

      // Refresh jobs list
      await fetchJobs();

      return data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create job';
      console.error('Error creating job:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createProcessingTasks = async (jobId: string) => {
    const tasks = [
      { job_id: jobId, task_type: 'extract_job_info', priority: 100 },
      { job_id: jobId, task_type: 'calculate_match', priority: 90 },
      { job_id: jobId, task_type: 'generate_cv', priority: 80 },
      { job_id: jobId, task_type: 'generate_cover_letter', priority: 70 },
      { job_id: jobId, task_type: 'review_cv', priority: 60 },
      { job_id: jobId, task_type: 'review_cover_letter', priority: 50 },
    ];

    const { error: insertError } = await supabase
      .from('processing_queue')
      .insert(tasks);

    if (insertError) {
      console.error('Error creating processing tasks:', insertError);
    }
  };

  const updateJobStatus = async (jobId: string, status: JobStatus, newOrder?: number) => {
    try {
      const updates: Partial<Job> = { status };

      if (newOrder !== undefined) {
        updates.kanban_order = newOrder;
      }

      const { error: updateError } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', jobId);

      if (updateError) throw updateError;

      // Update local state
      const job = jobs.value.find((j) => j.id === jobId);
      if (job) {
        job.status = status;
        if (newOrder !== undefined) {
          job.kanban_order = newOrder;
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update job status';
      console.error('Error updating job status:', err);
      throw err;
    }
  };

  const requestRegeneration = async (jobId: string, documentId: string, feedback: string) => {
    loading.value = true;
    error.value = null;

    try {
      // Create regeneration request
      const { data: request, error: insertError } = await supabase
        .from('regeneration_requests')
        .insert([
          {
            job_id: jobId,
            document_id: documentId,
            user_feedback: feedback,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Get document info to determine task type
      const document = jobs.value
        .find((j) => j.id === jobId)
        ?.documents?.find((d) => d.id === documentId);

      if (!document) throw new Error('Document not found');

      const taskType =
        document.document_type === 'cv' ? 'generate_cv' : 'generate_cover_letter';

      // Add regeneration task to processing queue
      await supabase.from('processing_queue').insert([
        {
          job_id: jobId,
          task_type: taskType,
          priority: 100,
          task_data: {
            regeneration_request_id: request.id,
            original_document_id: documentId,
            user_feedback: feedback,
          },
        },
      ]);

      return request;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to request regeneration';
      console.error('Error requesting regeneration:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateSubmissionInfo = async (
    jobId: string,
    submissionInfo: {
      application_url?: string;
      application_method?: string;
      recruiter_email?: string;
      recruiter_name?: string;
      application_notes?: string;
      application_deadline?: string;
    }
  ) => {
    try {
      const { error: updateError } = await supabase
        .from('jobs')
        .update(submissionInfo)
        .eq('id', jobId);

      if (updateError) throw updateError;

      const job = jobs.value.find((j) => j.id === jobId);
      if (job) {
        Object.assign(job, submissionInfo);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update submission info';
      console.error('Error updating submission info:', err);
      throw err;
    }
  };

  const markAsSubmitted = async (jobId: string) => {
    try {
      const submittedAt = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          application_submitted_at: submittedAt,
          status: 'waiting_for_call',
        })
        .eq('id', jobId);

      if (updateError) throw updateError;

      const job = jobs.value.find((j) => j.id === jobId);
      if (job) {
        job.application_submitted_at = submittedAt;
        job.status = 'waiting_for_call';
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to mark as submitted';
      console.error('Error marking as submitted:', err);
      throw err;
    }
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('jobs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, (payload) => {
        console.log('Job changed:', payload);
        fetchJobs();
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'job_documents' },
        (payload) => {
          console.log('Document changed:', payload);
          fetchJobDocuments();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  return {
    jobs,
    loading,
    error,
    jobsByStatus,
    fetchJobs,
    getJobById,
    createJob,
    updateJobStatus,
    updateSubmissionInfo,
    markAsSubmitted,
    requestRegeneration,
    subscribeToChanges,
  };
});
