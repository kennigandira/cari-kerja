import { createClient } from '@supabase/supabase-js';
import type { ProcessingQueueTask, TaskType } from '../../shared/types';
import { extractJobInfo } from './tasks/extract-job-info';
import { calculateMatch } from './tasks/calculate-match';
import { generateCV } from './tasks/generate-cv';
import { generateCoverLetter } from './tasks/generate-cover-letter';
import { reviewDocument } from './tasks/review-document';

type Env = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  ANTHROPIC_API_KEY: string;
};

export async function handleCron(env: Env) {
  console.log('Starting cron job processing...');

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  try {
    // Get next pending task from queue (highest priority first)
    const { data: tasks, error } = await supabase
      .from('processing_queue')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      console.error('Error fetching tasks:', error);
      return;
    }

    if (!tasks || tasks.length === 0) {
      console.log('No pending tasks found');
      return;
    }

    const task = tasks[0] as ProcessingQueueTask;
    console.log(`Processing task ${task.id}: ${task.task_type}`);

    // Mark task as processing
    await supabase
      .from('processing_queue')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', task.id);

    // Execute task based on type
    let result;
    try {
      switch (task.task_type) {
        case 'extract_job_info':
          result = await extractJobInfo(task, supabase, env);
          break;
        case 'calculate_match':
          result = await calculateMatch(task, supabase, env);
          break;
        case 'generate_cv':
          result = await generateCV(task, supabase, env);
          break;
        case 'generate_cover_letter':
          result = await generateCoverLetter(task, supabase, env);
          break;
        case 'review_cv':
        case 'review_cover_letter':
          result = await reviewDocument(task, supabase, env);
          break;
        default:
          throw new Error(`Unknown task type: ${task.task_type}`);
      }

      // Mark task as completed
      await supabase
        .from('processing_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          task_result: result,
        })
        .eq('id', task.id);

      console.log(`Task ${task.id} completed successfully`);

      // Check if all tasks for this job are complete
      await checkJobCompletion(task.job_id, supabase);
    } catch (error) {
      console.error(`Task ${task.id} failed:`, error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const newRetryCount = task.retry_count + 1;

      if (newRetryCount >= task.max_retries) {
        // Max retries reached, mark as failed
        await supabase
          .from('processing_queue')
          .update({
            status: 'failed',
            error_message: errorMessage,
            completed_at: new Date().toISOString(),
          })
          .eq('id', task.id);
      } else {
        // Retry
        await supabase
          .from('processing_queue')
          .update({
            status: 'pending',
            retry_count: newRetryCount,
            error_message: errorMessage,
          })
          .eq('id', task.id);
      }
    }
  } catch (error) {
    console.error('Cron job error:', error);
  }
}

async function checkJobCompletion(jobId: string, supabase: any) {
  // Check if all tasks for this job are complete
  const { data: pendingTasks } = await supabase
    .from('processing_queue')
    .select('id')
    .eq('job_id', jobId)
    .in('status', ['pending', 'processing']);

  if (!pendingTasks || pendingTasks.length === 0) {
    // All tasks complete, update job status to 'to_submit'
    await supabase
      .from('jobs')
      .update({ status: 'to_submit' })
      .eq('id', jobId)
      .eq('status', 'processing'); // Only update if still in processing status
  }
}
