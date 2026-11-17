import { Router } from 'express';
import rateLimit from 'express-rate-limit';

const router = Router();
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many AI requests. Please wait a moment and try again.' },
});

const instructions = `You are SPYRIX AI, a helpful general-purpose assistant inside the SPYRIX INVOICE business workspace.
Answer the user's question clearly and practically. You can explain general topics as well as invoicing, customers, products, inventory, payments, business reports, and common small-business workflows.
Use simple language, structure longer answers with short headings or bullets, and ask a concise follow-up only when essential information is missing.
Never claim to have read, changed, sent, or accessed the user's private SPYRIX records unless the application explicitly supplied that information in the conversation.
For tax, legal, financial, medical, and other high-impact topics, provide general information, state uncertainty, and encourage verification with an appropriately qualified professional.
Do not invent facts, citations, account balances, or actions. When web search is enabled, use it for current facts and distinguish sourced facts from general guidance.`;

router.post('/chat', chatLimiter, async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ message: 'AI is not configured yet. Add OPENAI_API_KEY to server/.env and restart the backend.' });
  }

  const rawMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const messages = rawMessages.slice(-14).map(message => ({
    role: message?.role === 'assistant' ? 'assistant' : 'user',
    content: String(message?.content || '').trim().slice(0, 4000),
  })).filter(message => message.content);

  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return res.status(400).json({ message: 'Please enter a question before sending.' });
  }
  if (messages.reduce((sum, message) => sum + message.content.length, 0) > 16000) {
    return res.status(413).json({ message: 'This conversation is too long. Start a new chat and try again.' });
  }

  try {
    const requestBody = {
      model: process.env.OPENAI_MODEL || 'gpt-6-luna',
      instructions,
      input: messages,
      max_output_tokens: 1400,
      store: false,
    };
    if (process.env.OPENAI_WEB_SEARCH_ENABLED === 'true') {
      requestBody.tools = [{ type: 'web_search' }];
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(60000),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const upstreamMessage = payload?.error?.message || 'The AI provider could not complete this request.';
      const status = response.status === 429 ? 429 : response.status >= 500 ? 502 : 502;
      return res.status(status).json({ message: `AI service error: ${upstreamMessage}` });
    }

    const reply = payload.output_text || (payload.output || [])
      .filter(item => item.type === 'message')
      .flatMap(item => item.content || [])
      .filter(item => item.type === 'output_text' && item.text)
      .map(item => item.text)
      .join('\n')
      .trim();

    if (!reply) return res.status(502).json({ message: 'The AI service returned an empty reply. Please try again.' });
    return res.json({ reply, model: payload.model || requestBody.model });
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      return res.status(504).json({ message: 'The AI request took too long. Please try again.' });
    }
    return res.status(502).json({ message: 'Could not connect to the AI service. Check your backend internet connection and try again.' });
  }
});

export default router;
