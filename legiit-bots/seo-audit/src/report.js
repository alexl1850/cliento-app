import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.AUDIT_MODEL || 'claude-opus-4-8';

const SYSTEM_PROMPT = `You are a senior local SEO auditor producing a client-facing audit report for a small business.
You are given raw crawled on-page signals, PageSpeed Insights data, and business context as JSON.
Write findings that are specific and evidence-based -- reference the actual numbers you were given, never invent data you weren't given.
If a signal is missing or a fetch failed, say so plainly rather than guessing.
Score each category 0-100. Overall score is a simple average of the category scores.
Respond with ONLY valid JSON matching this exact shape, no markdown fences, no commentary outside the JSON:
{
  "overallScore": number,
  "executiveSummary": "2-3 sentence plain-English summary for a non-technical business owner",
  "categories": [
    {
      "name": "On-Page SEO" | "Technical SEO" | "Page Speed" | "Mobile & Structure",
      "score": number,
      "findings": [ { "issue": string, "severity": "high" | "medium" | "low", "recommendation": string } ]
    }
  ],
  "quickWins": [ "short actionable items the business can fix themselves this week" ],
  "priorityActions": [ "the 3-5 highest-impact items to focus on next" ]
}`;

export async function generateReport({ business, signals, pagespeed }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');

  const client = new Anthropic({ apiKey });

  const userContent = JSON.stringify({ business, signals, pagespeed }, null, 2);

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Business context and crawled data:\n\n${userContent}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock) throw new Error('No text response from Claude');

  try {
    return JSON.parse(textBlock.text);
  } catch {
    // one retry with an explicit correction nudge if the model wrapped the JSON in prose/fences
    const cleaned = textBlock.text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  }
}
