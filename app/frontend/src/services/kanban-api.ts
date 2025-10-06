/**
 * Kanban API Service
 *
 * Handles all API calls for the enhanced kanban card detail view feature.
 * Provides methods for:
 * - Fetching job details
 * - Updating job fields
 * - Status-specific operations (interview phases, salary offers, retrospectives)
 */

import { supabase } from '../lib/supabase'
import type { Job, JobStatus } from '@shared/types'

export class KanbanCardAPI {
  /**
   * Fetch complete job details by job ID
   */
  static async getJob(jobId: string): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch job: ${error.message}`)
    }

    if (!data) {
      throw new Error('Job not found')
    }

    return data as Job
  }

  /**
   * Update job fields
   */
  static async updateJob(jobId: string, updates: Partial<Job>): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update job: ${error.message}`)
    }

    return data as Job
  }

  /**
   * Update job status
   */
  static async updateJobStatus(jobId: string, status: JobStatus): Promise<Job> {
    return this.updateJob(jobId, { status })
  }

  /**
   * Update interview phase tracking
   * Uses the RPC function from migration 014
   */
  static async updateInterviewPhase(
    jobId: string,
    phaseTotal: number,
    phaseCurrent: number
  ): Promise<void> {
    const { error } = await supabase.rpc('update_interview_phase', {
      p_job_id: jobId,
      p_phase_total: phaseTotal,
      p_phase_current: phaseCurrent
    })

    if (error) {
      throw new Error(`Failed to update interview phase: ${error.message}`)
    }
  }

  /**
   * Save salary offer details
   * Uses the RPC function from migration 014
   */
  static async saveSalaryOffer(
    jobId: string,
    amount: number,
    currency: string,
    benefits: string
  ): Promise<void> {
    const { error } = await supabase.rpc('save_salary_offer', {
      p_job_id: jobId,
      p_amount: amount,
      p_currency: currency,
      p_benefits: benefits
    })

    if (error) {
      throw new Error(`Failed to save salary offer: ${error.message}`)
    }
  }

  /**
   * Save retrospective for "Not Now" status
   * Uses the RPC function from migration 014
   */
  static async saveRetrospective(
    jobId: string,
    reason: string,
    learnings: string
  ): Promise<void> {
    const { error } = await supabase.rpc('save_retrospective', {
      p_job_id: jobId,
      p_reason: reason,
      p_learnings: learnings
    })

    if (error) {
      throw new Error(`Failed to save retrospective: ${error.message}`)
    }
  }

  /**
   * Delete a job application
   */
  static async deleteJob(jobId: string): Promise<void> {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)

    if (error) {
      throw new Error(`Failed to delete job: ${error.message}`)
    }
  }

  /**
   * Archive a job (soft delete or status change)
   * TODO: Implement archive logic based on requirements
   */
  static async archiveJob(jobId: string): Promise<void> {
    // For now, we can just update a status or add a deleted_at field
    // This can be enhanced in the future
    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'not_now',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    if (error) {
      throw new Error(`Failed to archive job: ${error.message}`)
    }
  }

  /**
   * Get task status (for AI features in Phase 2)
   * TODO: Implement task polling for AI generation
   */
  static async getTaskStatus(taskId: string): Promise<any> {
    const { data, error } = await supabase
      .from('processing_queue')
      .select('*')
      .eq('id', taskId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch task status: ${error.message}`)
    }

    return data
  }

  /**
   * Create a new AI task (for Phase 2)
   * TODO: Implement task creation for interview prep and salary analysis
   */
  static async createTask(jobId: string, taskType: string, taskData?: any): Promise<string> {
    const { data, error } = await supabase
      .from('processing_queue')
      .insert({
        job_id: jobId,
        task_type: taskType,
        task_data: taskData,
        status: 'pending',
        priority: 5,
        retry_count: 0,
        max_retries: 3
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`)
    }

    return data.id
  }
}
