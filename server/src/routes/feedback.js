import express from 'express';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many feedback submissions. Please try again later.' },
});

router.post('/', feedbackLimiter, async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const message = String(req.body?.message || '').trim();
  const source = ['intro', 'workspace'].includes(String(req.body?.source || '')) ? String(req.body.source) : 'website';
  const ratingInput = req.body?.rating;
  const rating = ratingInput === null || ratingInput === undefined || ratingInput === '' ? null : Number(ratingInput);
  const website = String(req.body?.website || '').trim();

  // Quietly accept honeypot submissions to avoid giving bots a useful signal.
  if (website) return res.status(201).json({ message: 'Thank you for your feedback.' });
  if (name.length < 2 || name.length > 100) return res.status(400).json({ message: 'Enter your name (2–100 characters).' });
  if (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
  if (message.length < 10 || message.length > 3000) return res.status(400).json({ message: 'Feedback must be between 10 and 3,000 characters.' });
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) return res.status(400).json({ message: 'Select a valid rating.' });

  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const from = String(process.env.FEEDBACK_FROM_EMAIL || '').trim();
  const to = String(process.env.FEEDBACK_TO_EMAIL || 'shivamp0037@gmail.com').trim();
  if (!apiKey || !from) {
    return res.status(503).json({ message: 'Feedback email delivery is not configured yet. Please try again later.' });
  }

  const submittedAt = new Date().toISOString();
  const lines = [
    'A new feedback message was submitted on SPYRIX Invoice.',
    '',
    `Source: ${source}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Rating: ${rating === null ? 'Not provided' : `${rating}/5`}`,
    `Submitted: ${submittedAt}`,
    '',
    'Feedback:',
    message,
  ];

  try {
    const upstream = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `SPYRIX ${source} feedback${rating === null ? '' : ` — ${rating}/5`}`,
        text: lines.join('\n'),
      }),
    });
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error('[SPYRIX feedback] Email provider rejected feedback:', upstream.status, result?.message || result?.name || 'Unknown provider error');
      return res.status(502).json({ message: 'The email service could not deliver your feedback right now. Please try again later.' });
    }
    return res.status(201).json({ message: 'Thank you. Your feedback has been emailed to the SPYRIX team.' });
  } catch (error) {
    console.error('[SPYRIX feedback] Email delivery failed:', error?.message || error);
    return res.status(502).json({ message: 'The email service is temporarily unavailable. Please try again later.' });
  }
});

export default router;
