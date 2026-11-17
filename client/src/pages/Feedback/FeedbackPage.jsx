import { useState } from 'react';
import { CheckCircle2, MessageSquareText, Send, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { apiRequest } from '../../api';
import './FeedbackPage.css';

export default function FeedbackPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  const submit = async event => {
    event.preventDefault();
    if (name.trim().length < 2) return setStatus({ type: 'error', text: 'Please enter your name.' });
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setStatus({ type: 'error', text: 'Please enter a valid email address.' });
    if (message.trim().length < 10) return setStatus({ type: 'error', text: 'Please write at least 10 characters so we understand your feedback.' });
    setBusy(true); setStatus({ type: '', text: '' });
    try {
      const result = await apiRequest('/feedback', { method: 'POST', body: JSON.stringify({ name: name.trim(), email: email.trim(), rating, message: message.trim(), source: 'workspace', website }) });
      setStatus({ type: 'success', text: result.message || 'Thanks! Your feedback has been emailed to the SPYRIX team.' });
      setName(''); setEmail(''); setRating(5); setMessage(''); setWebsite('');
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Unable to send feedback right now. Please try again.' });
    } finally { setBusy(false); }
  };

  return (
    <section className="feedback-page">
      <div className="feedback-page-heading">
        <div className="feedback-page-kicker"><Sparkles size={15} /> PRODUCT FEEDBACK</div>
        <h1>Help SPYRIX <span>get better.</span></h1>
        <p>Your suggestions shape what we improve next. Tell us what works, what could be smoother, or what you would love to see.</p>
      </div>
      <div className="feedback-page-grid">
        <aside className="feedback-page-aside">
          <div className="feedback-page-icon"><MessageSquareText size={30} /></div>
          <h2>Your voice matters.</h2>
          <p>Share an idea, report a confusing experience, or suggest a business feature. Feedback is sent directly to our team.</p>
          <div className="feedback-page-promise"><ShieldCheck size={19} /><span>Sent privately to the SPYRIX team</span></div>
          <div className="feedback-page-promise"><CheckCircle2 size={19} /><span>Helps guide future improvements</span></div>
        </aside>
        <form className="feedback-page-form" onSubmit={submit}>
          <div className="feedback-form-top"><div><h2>Write your feedback</h2><p>Share your thoughts with the SPYRIX team.</p></div><span className="feedback-form-tag">SPYRIX</span></div>
          <div className="feedback-form-row">
            <label>Name<input value={name} onChange={event => setName(event.target.value)} placeholder="Your full name" autoComplete="name" maxLength={100} required /></label>
            <label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" maxLength={254} required /></label>
          </div>
          <fieldset className="feedback-rating"><legend>How would you rate your experience?</legend><div className="feedback-stars" role="radiogroup" aria-label="Rating from one to five stars">{[1, 2, 3, 4, 5].map(value => <button type="button" key={value} className={value <= rating ? 'selected' : ''} onClick={() => setRating(value)} aria-pressed={rating === value} aria-label={`${value} out of 5 stars`}><Star size={25} fill={value <= rating ? 'currentColor' : 'none'} /></button>)}<span>{rating}/5</span></div></fieldset>
          <label className="feedback-message-label">Your feedback<textarea value={message} onChange={event => setMessage(event.target.value)} placeholder="What would make SPYRIX more helpful for your business?" minLength={10} maxLength={3000} required /></label>
          <label className="feedback-honeypot-workspace" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)} /></label>
          {status.text && <div className={`feedback-page-status ${status.type}`} role="status" aria-live="polite">{status.type === 'success' && <CheckCircle2 size={18} />}{status.text}</div>}
          <button className="feedback-send" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send feedback'} <Send size={17} /></button>
          <p className="feedback-smallprint">Please do not include passwords, payment details, or other sensitive information.</p>
        </form>
      </div>
    </section>
  );
}
