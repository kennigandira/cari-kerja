import type { ProcessingQueueTask, DocumentGenerationResult } from '../../../shared/types';

type Env = {
  ANTHROPIC_API_KEY: string;
};

export async function generateCoverLetter(
  task: ProcessingQueueTask,
  supabase: any,
  env: Env
): Promise<DocumentGenerationResult> {
  // Get job data
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', task.job_id)
    .single();

  if (error || !job) {
    throw new Error('Job not found');
  }

  const coverLetterPrompt = `You are a professional cover letter writer. Create a tailored cover letter for this job application.

CRITICAL REQUIREMENTS:
1. Maximum 300-350 words (must fit on ONE page)
2. Base all content on factual information
3. Never fabricate achievements or experience
4. Professional yet personable tone
5. Highlight 2-3 most relevant experiences

Job Details:
Company: ${job.company_name}
Position: ${job.position_title}
${job.job_description_text}

Return ONLY the cover letter content in Markdown format.`;

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
          content: coverLetterPrompt,
        },
      ],
    }),
  });

  const result = await response.json();
  const coverLetterMarkdown = result.content[0].text;

  const documentPath = `${job.id}/cover-letter-initial.md`;

  // Store in Supabase Storage
  await supabase.storage.from('job-documents').upload(documentPath, coverLetterMarkdown, {
    contentType: 'text/markdown',
    upsert: true,
  });

  // Create document record
  await supabase.from('job_documents').insert({
    job_id: task.job_id,
    document_type: 'cover_letter',
    version: 'initial',
    markdown_path: documentPath,
    processing_status: 'completed',
  });

  return {
    markdown_content: coverLetterMarkdown,
    latex_content: '',
    pdf_url: undefined,
  };
}
