import Anthropic from '@anthropic-ai/sdk';

// Simple, templated copywriting task -- Haiku is plenty and keeps this cheap
// across a large lead list. Override with AUDIT_MODEL-style env var if needed.
const MODEL = process.env.OUTREACH_MODEL || 'claude-haiku-4-5';

const SYSTEM_PROMPT = `You write short, casual opening messages for cold outreach from an Australian small-business owner to another local business owner, introducing Cliento (a $50/month tool that builds a business a website, social posts, and marketing automatically).
Rules:
- 2-4 sentences max. No emojis, no hard sell, no exclamation-mark spam.
- Sound like one local business owner messaging another, not a marketing agency.
- Reference something concrete and true from the data you were given (their business name, suburb, and the specific site issue or "no website" fact) -- never invent details you weren't given.
- End by inviting them to look at the link, framed as "already built this for you" rather than "check out our product."
- Output ONLY the message text, nothing else -- no preamble, no quotes around it.`;

export async function draftMessage({ lead, demoLink, siteScore }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');

  const client = new Anthropic({ apiKey });

  const context = {
    businessName: lead.name,
    suburb: lead.suburb,
    category: lead.sourceCategory,
    hasWebsite: siteScore.hasWebsite,
    siteIssues: siteScore.reasons,
    demoLink,
  };

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(context, null, 2) }],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  return textBlock?.text?.trim() || null;
}
