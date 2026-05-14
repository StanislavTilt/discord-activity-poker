import { Router } from 'express';

const router = Router();

// Discord OAuth2 token exchange for Activities
router.post('/api/oauth/token', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided' });

  try {
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'authorization_code',
        code
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[OAuth] Token exchange failed:', data);
      return res.status(400).json({ error: 'Token exchange failed' });
    }

    res.json({ access_token: data.access_token });
  } catch (e) {
    console.error('[OAuth] Error:', e.message);
    res.status(500).json({ error: 'OAuth error' });
  }
});

export default router;
