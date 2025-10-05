import type { ProcessingQueueTask, DocumentGenerationResult } from '../../../shared/types';

type Env = {
  ANTHROPIC_API_KEY: string;
};

export async function generateCV(
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

  // TODO: Load master profile from file or database
  // For now, using simplified prompt
  const cvPrompt = `You are a professional CV writer. Create a tailored CV for this job application.

IMPORTANT: Base all content on factual information provided. Never fabricate achievements or experience.

Job Details:
Company: ${job.company_name}
Position: ${job.position_title}
${job.job_description_text}

Create a CV in Markdown format that:
1. Emphasizes relevant experience for this role
2. Highlights matching skills
3. Includes quantified achievements where available
4. Maintains professional tone
5. Is ATS-optimized

Return ONLY the CV content in Markdown format.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: cvPrompt,
        },
      ],
    }),
  });

  const result = await response.json();
  const cvMarkdown = result.content[0].text;

  // For now, we'll store the markdown. LaTeX conversion and PDF compilation
  // will be handled separately (could be another task or done locally)
  const documentPath = `${job.id}/cv-initial.md`;

  // Store in Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('job-documents')
    .upload(documentPath, cvMarkdown, {
      contentType: 'text/markdown',
      upsert: true,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
  }

  // Create document record
  await supabase.from('job_documents').insert({
    job_id: task.job_id,
    document_type: 'cv',
    version: 'initial',
    markdown_path: documentPath,
    processing_status: 'completed',
  });

  return {
    markdown_content: cvMarkdown,
    latex_content: '', // TODO: Convert to LaTeX
    pdf_url: undefined,
  };
}
