import type { ProcessingQueueTask, MatchCalculationResult } from '../../../shared/types';

type Env = {
  ANTHROPIC_API_KEY: string;
};

const MASTER_PROFILE_SUMMARY = `
Frontend Engineer with 8+ years of experience:
- React, TypeScript, Next.js, Vue.js expertise
- Performance optimization (Core Web Vitals, LCP 4.5s → 1.2s)
- Real estate platforms (PropertyScout, 99 Group)
- Gaming developer tools (Accelbyte)
- Travel & hospitality (Tiket.com)
- Key achievements: 306% increase in listings, THB 25M revenue impact, 87% organic traffic growth
- Skills: React, TypeScript, Next.js, Vue, Node.js, Jest, TailwindCSS, Docker, AWS
`;

export async function calculateMatch(
  task: ProcessingQueueTask,
  supabase: any,
  env: Env
): Promise<MatchCalculationResult> {
  // Get job data
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', task.job_id)
    .single();

  if (error || !job) {
    throw new Error('Job not found');
  }

  // Use Claude API to calculate match
  const matchPrompt = `You are a career advisor analyzing job fit. Compare this candidate profile with the job requirements:

CANDIDATE PROFILE:
${MASTER_PROFILE_SUMMARY}

JOB REQUIREMENTS:
Position: ${job.position_title}
Company: ${job.company_name}
${job.job_description_text}

Provide:
1. Match percentage (0-100)
2. List of strengths (where candidate exceeds requirements)
3. Partial matches (where candidate meets some but not all requirements)
4. Gaps (where candidate lacks requirements)

Return in JSON format:
{
  "match_percentage": 85,
  "strengths": ["8+ years React experience matches senior requirement", "..."],
  "partial_matches": ["Backend experience limited to Node.js, job wants Python too"],
  "gaps": ["No Kubernetes experience"]
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
          content: matchPrompt,
        },
      ],
    }),
  });

  const result = await response.json();
  const matchData = JSON.parse(result.content[0].text);

  // Update job with match analysis
  await supabase
    .from('jobs')
    .update({
      match_percentage: matchData.match_percentage,
      match_analysis: {
        strengths: matchData.strengths,
        partial_matches: matchData.partial_matches,
        gaps: matchData.gaps,
      },
    })
    .eq('id', task.job_id);

  return matchData;
}
