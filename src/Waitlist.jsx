import { useState } from 'react';
import { supabase } from './supabaseClient.js';

// Shared early-access signup. Used on the landing feed and in the site-wide footer
// CTA. `heading`/`sub` override the copy; `footNote` renders a line under the form.
export default function Waitlist({
  heading = 'Want the full app?',
  sub = 'Get early access when we launch.',
  footNote = null,
}) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const em = email.trim();
    if (!em || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      if (supabase) {
        const { error: insErr } = await supabase
          .from('waitlist')
          .insert({ email: em, phone: phone.trim() || null });
        // 23505 = unique violation (already signed up) — treat as success.
        if (insErr && insErr.code !== '23505') throw insErr;
      }
      setDone(true);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="waitlist">
      <h2>{heading}</h2>
      <p className="sub">{sub}</p>
      {done ? (
        <div className="waitlist-done">You&rsquo;re on the list. We&rsquo;ll be in touch.</div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
          <input
            className="field"
            type="email"
            required
            value={email}
            placeholder="you@email.com"
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email"
          />
          <input
            className="field"
            type="tel"
            value={phone}
            placeholder="Phone (optional)"
            onChange={(e) => setPhone(e.target.value)}
            aria-label="Phone (optional)"
          />
          <p className="field-help">We&rsquo;ll text you when we launch. No spam. Ever.</p>
          {error !== '' && <p className="err">{error}</p>}
          <button
            type="submit"
            className="waitlist-btn"
            disabled={email.trim() === '' || submitting}
          >
            {submitting ? 'Submitting…' : 'Get Early Access'}
          </button>
        </form>
      )}
      {footNote && <p className="waitlist-foot">{footNote}</p>}
    </section>
  );
}
