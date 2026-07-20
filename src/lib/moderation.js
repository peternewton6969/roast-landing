// Client-side content filter for the public roast feed. The app is intentionally
// crude — profanity is welcome ("Talking shit is funner") — so this rejects only
// genuinely over-the-line content: identity slurs and hate. Rejected submissions
// are NOT sent for a verdict and NOT inserted into the database (see handleRake).
//
// Scope: a best-effort UI gate for the closed beta. A determined user could call
// the API directly; anything egregious is still removable in the Supabase
// dashboard. The list below is the single place to tune what gets blocked.

const LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', $: 's', '@': 'a' };

function normalize(s) {
  return String(s)
    .toLowerCase()
    .replace(/[0134573$@]/g, (c) => LEET[c] || c);
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Identity slurs / hate terms ONLY. Profanity (fuck, shit, etc.) is allowed.
const SLURS = [
  'nigger', 'niggers', 'nigga', 'niggas',
  'faggot', 'faggots', 'fag', 'fags',
  'retard', 'retards', 'retarded',
  'kike', 'kikes', 'spic', 'spics', 'chink', 'chinks', 'gook', 'gooks',
  'wetback', 'wetbacks', 'beaner', 'beaners', 'coon', 'coons',
  'raghead', 'ragheads', 'paki', 'pakis',
  'tranny', 'trannies', 'dyke', 'dykes',
];

const wordRe = new RegExp('\\b(' + SLURS.map(escapeRe).join('|') + ')\\b', 'i');
// Catch spaced/punctuated obfuscation (e.g. "f a g g o t") for the longer slurs.
const LONG = SLURS.filter((s) => s.length >= 5);

/** True if the text should be rejected (blocked, not saved). */
export function isRejected(text) {
  const n = normalize(text);
  if (wordRe.test(n)) return true;
  const collapsed = n.replace(/[^a-z]/g, '');
  return LONG.some((s) => collapsed.includes(s));
}
