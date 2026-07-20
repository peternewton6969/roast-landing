import { useEffect, useRef, useState } from 'react';
import { supabase, isConfigured } from './supabaseClient.js';
import { getVerdict, verdictColor } from './lib/verdict.js';
import { timeAgo } from './lib/timeAgo.js';

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

function RoastCard({ roast, fresh }) {
  return (
    <div className={`roast-card${fresh ? ' fresh' : ''}`}>
      <div className="roast-text">{roast.content}</div>
      <div className="roast-meta">
        <span className="badge" style={{ color: verdictColor(roast.verdict) }}>
          {roast.verdict}
        </span>
        <span className="roast-time">{timeAgo(roast.created_at)}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [roast, setRoast] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const [roasts, setRoasts] = useState([]);
  const freshId = useRef(null);

  // Waitlist
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [wlSubmitting, setWlSubmitting] = useState(false);
  const [wlDone, setWlDone] = useState(false);
  const [wlError, setWlError] = useState('');

  // --- Load feed + subscribe to realtime inserts ---
  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase
      .from('roasts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (active && Array.isArray(data)) setRoasts(data);
      });

    const channel = supabase
      .channel('roasts-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'roasts' },
        (payload) => {
          setRoasts((prev) =>
            prev.some((r) => r.id === payload.new.id) ? prev : [payload.new, ...prev],
          );
          freshId.current = payload.new.id;
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // --- Voice input (Web Speech API) ---
  function toggleMic() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    if (!SpeechRecognition) {
      setError('Voice input is not supported on this browser — type it instead.');
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(' ')
        .trim();
      setRoast((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setError('');
    setListening(true);
    rec.start();
  }

  // --- Submit a roast ---
  async function handleRake() {
    const content = roast.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const v = await getVerdict(content);
      setVerdict(v);

      if (supabase) {
        const { error: insErr } = await supabase.from('roasts').insert({ content, verdict: v });
        if (insErr) throw insErr;
        // The realtime subscription adds it to the feed.
      } else {
        // Preview mode (no backend yet): show it locally so the feed isn't empty.
        const local = {
          id: crypto.randomUUID?.() ?? String(Date.now()),
          content,
          verdict: v,
          created_at: new Date().toISOString(),
        };
        freshId.current = local.id;
        setRoasts((prev) => [local, ...prev]);
      }

      setRoast('');
      window.setTimeout(() => setVerdict(null), 3000);
    } catch {
      setVerdict(null);
      setError('Could not post that roast. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // --- Waitlist ---
  async function handleWaitlist(e) {
    e.preventDefault();
    const em = email.trim();
    if (!em || wlSubmitting) return;
    setWlSubmitting(true);
    setWlError('');
    try {
      if (supabase) {
        const { error: insErr } = await supabase
          .from('waitlist')
          .insert({ email: em, phone: phone.trim() || null });
        // 23505 = unique violation (already signed up) — treat as success.
        if (insErr && insErr.code !== '23505') throw insErr;
      }
      setWlDone(true);
    } catch {
      setWlError('Something went wrong. Try again.');
    } finally {
      setWlSubmitting(false);
    }
  }

  return (
    <div className="page">
      {verdict && (
        <div className="verdict-overlay" role="status" aria-live="assertive">
          <div className="verdict-word" style={{ color: verdictColor(verdict) }}>
            {verdict}
          </div>
          <div className="verdict-sub">Raking it into the feed…</div>
        </div>
      )}

      <header className="header">
        <h1 className="brand">
          Roast<span className="accent">&rsquo;n</span> Rake
        </h1>
        <p className="tagline">Golf is fun. Talking shit is funner.</p>

        <div className="pitch">
          <p className="pitch-lead">It&rsquo;s a golf app that tracks scores and settles bets.</p>
          <p className="pitch-detail">
            The <strong>superpower</strong> comes at the end when it roasts your buddies with brutal
            accuracy. Think Kenny Powers doing your post-round breakdown.
          </p>
        </div>

        <p className="blurb">
          The golf app that roasts your buddies with brutal accuracy. While we finish building it
          &mdash; submit your best roast below.
        </p>
      </header>

      {/* TODO: Replace with hero-ball.jpg (IMG_2646) — the Newter 69 shot */}
      <div className="hero">
        <img src="/golf-bg.jpg" alt="Roast'n Rake" />
      </div>

      <section className="input-card">
        <div className="roast-row">
          <textarea
            className="roast-input"
            rows={2}
            value={roast}
            placeholder="Type your best roast..."
            onChange={(e) => setRoast(e.target.value)}
            aria-label="Your roast"
          />
          <button
            type="button"
            className={`mic${listening ? ' listening' : ''}`}
            onClick={toggleMic}
            aria-label={listening ? 'Stop voice input' : 'Start voice input'}
            title="Speak your roast"
          >
            🎤
          </button>
        </div>
        <button
          type="button"
          className="rake-btn"
          disabled={roast.trim() === '' || submitting}
          onClick={handleRake}
        >
          {submitting ? 'Raking…' : 'Rake Em'}
        </button>
        {error !== '' && <p className="err">{error}</p>}
        {!isConfigured && (
          <p className="hint">Preview mode — submissions aren&rsquo;t saved yet (backend not connected).</p>
        )}
      </section>

      <h2 className="section-title">Live Roasts</h2>
      <div className="feed">
        {roasts.length === 0 ? (
          <p className="empty">No roasts yet. Be the first to rake someone.</p>
        ) : (
          roasts.map((r) => <RoastCard key={r.id} roast={r} fresh={r.id === freshId.current} />)
        )}
      </div>

      <section className="waitlist">
        <h2>Want the full app?</h2>
        <p className="sub">Get early access when we launch.</p>
        {wlDone ? (
          <div className="waitlist-done">You&rsquo;re on the list. We&rsquo;ll be in touch.</div>
        ) : (
          <form onSubmit={handleWaitlist} style={{ display: 'grid', gap: 10 }}>
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
            {wlError !== '' && <p className="err">{wlError}</p>}
            <button type="submit" className="waitlist-btn" disabled={email.trim() === '' || wlSubmitting}>
              {wlSubmitting ? 'Submitting…' : 'Get Early Access'}
            </button>
          </form>
        )}
      </section>

      <footer className="footer">Roast&rsquo;n Rake &middot; play fair, pay up, repeat.</footer>
    </div>
  );
}
