import { requireActiveAccount } from './_lib/checkAccess.js';
import { createAndPublishPost } from './_lib/blogAutoPublish.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const access = await requireActiveAccount(req);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  try {
    const { post } = req.body;
    if (!post?.title || !post?.content) {
      return res.status(400).json({ error: 'Post title and content are required' });
    }

    const result = await createAndPublishPost({ userId: access.userId, post });

    if (!result.success) {
      return res.status(200).json({
        success: false,
        skippedReason: result.skippedReason,
        error: 'Your post has been saved — build your website first using the My Website tool, then it will go live automatically on your next publish.',
        post: result.post,
      });
    }

    return res.status(200).json({
      success: true,
      postUrl: result.postUrl,
      liveUrl: result.liveUrl,
      homepageUpdated: true,
      post: result.post,
    });

  } catch (err) {
    console.error('Publish blog error:', err);
    return res.status(500).json({ error: err.message });
  }
}
