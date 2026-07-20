// Supabase Edge Function: `verdict`
// Rates a submitted roast with exactly one word via Claude. The Anthropic API key
// is a Supabase secret (ANTHROPIC_API_KEY) — it lives ONLY here, server-side, and
// is never shipped to the public landing page.
//
// Deploy:
//   supabase functions deploy verdict --no-verify-jwt
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// (--no-verify-jwt so the anonymous public page can call it.)

const VERDICTS = ['FIRE', 'BRUTAL', 'SAVAGE', 'COOKED', 'WEAK', 'NAH', 'CERTIFIED'];
const MODEL = 'claude-sonnet-4-6';
const SYSTEM_PROMPT =
  "You are the Roast'n Rake verdict engine. A user has submitted a roast. " +
  'Respond with exactly one word that rates it. Choose from: FIRE, BRUTAL, ' +
  'SAVAGE, COOKED, WEAK, NAH, CERTIFIED. No punctuation. No explanation. One word only.';

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

// Deterministic fallback so the page always gets a verdict even if the AI call fails.
function fallback(s: string): string {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return VERDICTS[h % VERDICTS.length];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let content = '';
  try {
    const body = await req.json();
    content = String(body?.content ?? '').slice(0, 500).trim();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  if (!content) return json({ error: 'empty' }, 400);

  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) return json({ verdict: fallback(content) }); // not yet configured

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
        max_tokens: 8,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content }],
      }),
    });
    if (!res.ok) return json({ verdict: fallback(content) });
    const data = await res.json();
    const raw = String(data?.content?.[0]?.text ?? '').toUpperCase().replace(/[^A-Z]/g, '');
    return json({ verdict: VERDICTS.includes(raw) ? raw : fallback(content) });
  } catch {
    return json({ verdict: fallback(content) });
  }
});
