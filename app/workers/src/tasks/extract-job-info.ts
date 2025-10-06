import type { ProcessingQueueTask, JobExtractionResult } from '../../../shared/types';

type Env = {
  ANTHROPIC_API_KEY: string;
};

export async function extractJobInfo(
  task: ProcessingQueueTask,
  supabase: any,
  env: Env
): Promise<JobExtractionResult> {
  // Get job data
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', task.job_id)
    .single();

  if (error || !job) {
    throw new Error('Job not found');
  }

  let jobContent = job.input_content;

  // If input type is URL, fetch the content
  if (job.input_type === 'url') {
    try {
      const response = await fetch(job.original_url);
      const html = await response.text();
      jobContent = html;
    } catch (error) {
      console.error('Failed to fetch URL:', error);
      // Fall back to using the URL as text
    }
  }

  // Use Claude API to extract job information
  const extractionPrompt = `You are a job description analyzer. Extract the following information from this job posting:

1. Company name
2. Position title
3. Location (city, country, or "Remote")
4. Posted date (if available, format: YYYY-MM-DD)
5. Salary range (if mentioned)
6. Job type (full-time, contract, remote, hybrid, etc.)
7. Clean job description text (remove HTML, keep structure)
8. Application method (how to apply):
   - Look for phrases like "Apply at", "Send CV to", "Apply through LinkedIn", etc.
   - Determine the method: online_form, email, linkedin, recruiter, referral, or other
9. Application URL (where to submit the application, if different from job posting URL)
10. Recruiter contact (email or name, if mentioned)
11. Application deadline (if mentioned, format: YYYY-MM-DD)

Job posting:
${jobContent}

Return the information in JSON format:
{
  "company_name": "...",
  "position_title": "...",
  "location": "...",
  "posted_date": "...",
  "salary_range": "...",
  "job_type": "...",
  "job_description_text": "...",
  "application_method": "online_form|email|linkedin|recruiter|referral|other",
  "application_url": "...",
  "recruiter_email": "...",
  "recruiter_name": "...",
  "application_deadline": "..."
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: extractionPrompt,
        },
      ],
    }),
  });

  const result = await response.json();
  const extractedData = JSON.parse(result.content[0].text);

  // Update job with extracted info
  await supabase
    .from('jobs')
    .update({
      company_name: extractedData.company_name,
      position_title: extractedData.position_title,
      location: extractedData.location,
      posted_date: extractedData.posted_date,
      salary_range: extractedData.salary_range,
      job_type: extractedData.job_type,
      job_description_html: job.input_type === 'url' ? jobContent : null,
      job_description_text: extractedData.job_description_text,
      folder_path: `/Users/user/Documents/cari-kerja/04_Applications/${extractedData.company_name}_${extractedData.position_title}_${new Date().toISOString().split('T')[0]}`,
      application_url: extractedData.application_url || job.original_url,
      application_method: extractedData.application_method,
      recruiter_email: extractedData.recruiter_email,
      recruiter_name: extractedData.recruiter_name,
      application_deadline: extractedData.application_deadline,
    })
    .eq('id', task.job_id);

  return extractedData;
}
