import { pickDueCustomers, nextTopic, generatePostContent, createAndPublishPost, markAutoPublished } from './_lib/blogAutoPublish.js';
import { pickDueRankKeywords, checkRank, recordRankCheck } from './_lib/rankTracking.js';

// The single consolidated cron entry for the Hobby-plan's once-per-day
// limit (see vercel.json) — handles both blog auto-publish and the
// rank-tracking batch, rather than adding a second cron entry.
//
// Auth: Vercel automatically signs cron-triggered requests with
// `Authorization: Bearer $CRON_SECRET` when that env var is set — this is
// NOT requireActiveAccount, since there's no end-user session here at all.
export default async function handler(req, res) {
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || req.headers.authorization !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const blog = { processed: 0, succeeded: 0, failed: 0, errors: [] };
  const rank = { processed: 0, succeeded: 0, failed: 0, errors: [] };

  try {
    const dueCustomers = await pickDueCustomers();
    for (const profile of dueCustomers) {
      blog.processed++;
      try {
        const { topic, remainingQueue } = await nextTopic(profile);
        const generated = await generatePostContent({ topic, profile });
        const result = await createAndPublishPost({
          userId: profile.user_id,
          post: { ...generated, scheduled: true, sourceKeyword: topic.keyword },
        });
        await markAutoPublished(profile.user_id, remainingQueue);
        if (result.success) blog.succeeded++;
        else blog.errors.push(`${profile.user_id}: skipped (${result.skippedReason})`);
      } catch (e) {
        blog.failed++;
        blog.errors.push(`${profile.user_id}: ${e.message}`);
        console.error('Auto-publish failed for', profile.user_id, e.message);
      }
    }
  } catch (err) {
    console.error('Cron daily (blog phase) error:', err);
    blog.errors.push(`blog phase: ${err.message}`);
  }

  try {
    const dueKeywords = await pickDueRankKeywords();
    for (const kw of dueKeywords) {
      rank.processed++;
      try {
        const { position } = await checkRank({ keyword: kw.keyword, suburb: kw.suburb, domain: kw.domain });
        await recordRankCheck(kw.id, position);
        rank.succeeded++;
      } catch (e) {
        rank.failed++;
        rank.errors.push(`${kw.id}: ${e.message}`);
        console.error('Rank check failed for', kw.id, e.message);
      }
    }
  } catch (err) {
    console.error('Cron daily (rank phase) error:', err);
    rank.errors.push(`rank phase: ${err.message}`);
  }

  return res.status(200).json({ success: true, blog, rank });
}
