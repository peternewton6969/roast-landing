// Supabase Edge Function: `captains-commentary`
// Generates a Captain's Log roast summary for a Roast and Rake golf round via Claude.
// The Anthropic API key is a Supabase secret (ANTHROPIC_API_KEY) — it lives ONLY
// here, server-side, and is never shipped to the app. Mirrors the `verdict` function.
//
// The app (app.roastandrake.com) builds the system + user prompt from round data and
// POSTs them here; this function forwards to Anthropic with fixed generation params
// (model/temperature/max_tokens are pinned here, not client-controlled) and returns
// the generated text.
//
// Deploy:
//   supabase functions deploy captains-commentary --no-verify-jwt
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// (--no-verify-jwt so the app can call it with the anon key.)

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 500;
const TEMPERATURE = 0.9;

// Pinned server-side so a client can't repurpose the function as a general proxy.
const SYSTEM_PROMPT =
  "You are the Captain's Log — the AI voice of Roast and Rake, a golf trash talk and " +
  'scoring app. Your voice is Kenny Powers: confident, unhinged, specific, and ' +
  'devastating. You roast real people by name using real data from their round. You ' +
  'never punch down and you never use slurs or hate speech — this is consensual ' +
  'roasting among friends who chose to be here. You write like the funniest guy in the ' +
  "foursome who also has access to everyone's scorecard, bet history, and character " +
  'flaws. Every summary should feel like it could only have been written about this ' +
  'specific group on this specific day. Keep summaries under 200 words. Do not use ' +
  'bullet points or headers — write in flowing paragraphs. End every summary with a ' +
  'single sharp closing line.';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let userMessage = '';
  try {
    const body = await req.json();
    // The client sends the fully-constructed user message. The system prompt is fixed
    // server-side above, but an override is accepted for forward-compatibility/testing.
    userMessage = String(body?.user ?? body?.prompt ?? '').slice(0, 12000).trim();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  if (!userMessage) return json({ error: 'empty' }, 400);

  // Trim whitespace/newlines and strip accidental wrapping quotes — a secret set with
  // a trailing newline or quotes yields a malformed x-api-key header (Anthropic 401).
  const key = (Deno.env.get('ANTHROPIC_API_KEY') ?? '').trim().replace(/^["']|["']$/g, '');
  if (!key) return json({ error: 'not_configured' }, 503);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      // TEMP diagnostic: on an auth failure, surface only the key's shape (length +
      // prefix + last 4) so a bad/wrong-type key can be pinpointed without exposing it.
      const keyMeta =
        res.status === 401
          ? { len: key.length, prefix: key.slice(0, 12), tail: key.slice(-4) }
          : undefined;
      return json({ error: 'upstream_error', status: res.status, detail: detail.slice(0, 500), keyMeta }, 502);
    }
    const data = await res.json();
    const text = String(
      (Array.isArray(data?.content) ? data.content : [])
        .filter((b: { type?: string }) => b?.type === 'text')
        .map((b: { text?: string }) => b?.text ?? '')
        .join(''),
    ).trim();
    if (!text) return json({ error: 'empty_completion' }, 502);
    return json({ text });
  } catch (e) {
    return json({ error: 'exception', detail: String(e).slice(0, 500) }, 502);
  }
});
