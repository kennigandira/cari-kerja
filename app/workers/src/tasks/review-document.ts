import type { ProcessingQueueTask, DocumentGenerationResult } from '../../../shared/types';

type Env = {
  ANTHROPIC_API_KEY: string;
};

export async function reviewDocument(
  task: ProcessingQueueTask,
  supabase: any,
  env: Env
): Promise<DocumentGenerationResult> {
  const documentType = task.task_type === 'review_cv' ? 'cv' : 'cover_letter';

  // Get the initial document
  const { data: doc, error } = await supabase
    .from('job_documents')
    .select('*')
    .eq('job_id', task.job_id)
    .eq('document_type', documentType)
    .eq('version', 'initial')
    .single();

  if (error || !doc) {
    throw new Error(`Initial ${documentType} not found`);
  }

  // Download the markdown content
  const { data: fileData } = await supabase.storage
    .from('job-documents')
    .download(doc.markdown_path);

  const initialContent = await fileData.text();

  const reviewPrompt = `You are a skeptical CV/cover letter reviewer. Review this ${documentType} for accuracy and believability.

CRITICAL REVIEW POINTS:
1. Flag any exaggerated claims or inflated numbers
2. Check for unrealistic achievements
3. Ensure collaborative language (avoid "I led", prefer "contributed to", "participated in")
4. Verify claims sound factual and modest
5. Remove any hype or marketing language

Original ${documentType}:
${initialContent}

Provide a reviewed version that is:
- More conservative and believable
- Uses collaborative language
- Maintains factual accuracy
- Still compelling but realistic

Return ONLY the reviewed ${documentType} content in Markdown format.`;

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
          content: reviewPrompt,
        },
      ],
    }),
  });

  const result = await response.json();
  const reviewedContent = result.content[0].text;

  const documentPath = `${task.job_id}/${documentType}-reviewed.md`;

  // Store in Supabase Storage
  await supabase.storage.from('job-documents').upload(documentPath, reviewedContent, {
    contentType: 'text/markdown',
    upsert: true,
  });

  // Create document record
  await supabase.from('job_documents').insert({
    job_id: task.job_id,
    document_type: documentType,
    version: 'reviewed',
    markdown_path: documentPath,
    processing_status: 'completed',
  });

  return {
    markdown_content: reviewedContent,
    latex_content: '',
    pdf_url: undefined,
  };
}
