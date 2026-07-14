import { excerptOf } from './blogTemplates.js';
import { regenerateAndDeploy } from './regenerateAndDeploy.js';

const SUPABASE_URL = () => process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = () => process.env.SUPABASE_SERVICE_KEY;

// The reusable core of "publish a blog post" — resolves a unique slug,
// inserts the row, then rebuilds+redeploys via regenerateAndDeploy. Used by
// both api/publish-blog.js (a user's own manual publish) and the daily
// cron's auto-publish path, so there's exactly one place this logic lives.
export async function createAndPublishPost({ userId, post }) {
  const url = SUPABASE_URL(), key = SUPABASE_SERVICE_KEY();

  const baseSlug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'post';
  const existingRes = await fetch(
    `${url}/rest/v1/blog_posts?user_id=eq.${userId}&select=slug`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  if (!existingRes.ok) throw new Error('Could not check for existing posts');
  const existingSlugs = new Set((await existingRes.json()).map(r => r.slug));
  let slug = baseSlug, n = 2;
  while (existingSlugs.has(slug)) { slug = `${baseSlug}-${n}`; n++; }

  const excerpt = excerptOf(post.content);
  const insertRes = await fetch(`${url}/rest/v1/blog_posts`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      user_id: userId,
      slug,
      title: post.title,
      meta_title: post.meta_title || null,
      meta_desc: post.meta_desc || null,
      content: post.content,
      excerpt,
      scheduled: !!post.scheduled,
      auto_generated: !!post.scheduled,
      source_keyword: post.sourceKeyword || null,
    }),
  });
  if (!insertRes.ok) throw new Error('Could not save the new post');

  const result = await regenerateAndDeploy(userId);

  if (result.skipped) {
    return { success: false, skippedReason: result.reason, post: { title: post.title, slug, excerpt } };
  }

  return {
    success: true,
    postUrl: `${result.liveUrl}/blog/${slug}`,
    liveUrl: result.liveUrl,
    post: {
      title: post.title,
      slug,
      url: `${result.liveUrl}/blog/${slug}`,
      date: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }),
      excerpt,
    },
  };
}

const FREQUENCY_DAYS = { weekly: 7, fortnightly: 14, monthly: 28 };

// Customers opted into blog_auto_enabled whose assigned blog_auto_day
// matches today, AND enough time has passed since their last auto-publish
// for their chosen frequency. blog_auto_day is assigned once at opt-in
// time specifically so the single Hobby-plan daily cron spreads customers
// across the week instead of everyone firing on the same day.
export async function pickDueCustomers() {
  const url = SUPABASE_URL(), key = SUPABASE_SERVICE_KEY();
  const today = new Date().getDay(); // 0 (Sun) - 6 (Sat)

  const res = await fetch(
    `${url}/rest/v1/profiles?blog_auto_enabled=eq.true&blog_auto_day=eq.${today}&select=user_id,biz_name,suburb,description,blog_auto_frequency,blog_last_auto_at,blog_topic_queue`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  if (!res.ok) throw new Error('Could not load due customers');
  const rows = await res.json();

  const now = Date.now();
  return rows.filter(r => {
    if (!r.blog_last_auto_at) return true;
    const minDays = FREQUENCY_DAYS[r.blog_auto_frequency] || 7;
    const daysSince = (now - new Date(r.blog_last_auto_at).getTime()) / 86400000;
    return daysSince >= minDays - 1; // small tolerance for cron timing drift
  });
}

// Pops the next queued topic, refilling via an AI keyword-idea prompt (the
// same style Journey.jsx's one-shot findKeywords already uses) when the
// queue is empty — a persisted rotation instead of an ephemeral one-shot.
export async function nextTopic(profile) {
  let queue = Array.isArray(profile.blog_topic_queue) ? profile.blog_topic_queue : [];

  if (queue.length === 0) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Suggest 5 low-competition blog post topic ideas for ${profile.biz_name || 'a local business'}, a business in ${profile.suburb || 'Australia'}. ${profile.description || ''}
Return ONLY a JSON array: [{"keyword":"the target search phrase","title":"a compelling blog post title using it"}, ...]`
        }]
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    const raw = data.content[0].text.replace(/```json|```/g, '').trim();
    queue = JSON.parse(raw);
  }

  const [topic, ...rest] = queue;
  return { topic, remainingQueue: rest };
}

// Writes a full post from a topic idea — the actual content-generation
// step, separate from nextTopic (which only produces the idea).
export async function generatePostContent({ topic, profile }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: `Today's date is ${new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}. You write genuine, helpful blog posts for Australian local businesses — warm, specific, never generic filler. Australian spelling throughout.`,
      messages: [{
        role: 'user',
        content: `Write a full blog post for ${profile.biz_name || 'a local business'} in ${profile.suburb || 'Australia'}, targeting the keyword "${topic.keyword}", with the working title "${topic.title}".
Return ONLY JSON: {"title":"...", "content":"markdown-lite content using ## for headings and - for list items, 400-600 words", "meta_title":"under 60 chars", "meta_desc":"under 155 chars"}`
      }]
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const raw = data.content[0].text.replace(/```json|```/g, '').trim();
  return JSON.parse(raw);
}

// Persist blog_last_auto_at + the popped topic queue after a successful
// (or attempted) auto-publish, so the next cron run doesn't repeat today's
// topic or re-fire before the next scheduled day.
export async function markAutoPublished(userId, remainingQueue) {
  const url = SUPABASE_URL(), key = SUPABASE_SERVICE_KEY();
  await fetch(`${url}/rest/v1/profiles?user_id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ blog_last_auto_at: new Date().toISOString(), blog_topic_queue: remainingQueue }),
  });
}
