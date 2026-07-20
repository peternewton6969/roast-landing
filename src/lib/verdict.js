import { supabase } from '../supabaseClient.js';

// The verdict word set (must match the Edge Function's system prompt).
export const VERDICTS = ['FIRE', 'BRUTAL', 'SAVAGE', 'COOKED', 'WEAK', 'NAH', 'CERTIFIED'];

const GREEN = new Set(['FIRE', 'BRUTAL', 'SAVAGE', 'CERTIFIED']);
const AMBER = new Set(['COOKED']);
const RED = new Set(['WEAK', 'NAH']);

/** CSS color token for a verdict. */
export function verdictColor(v) {
  if (GREEN.has(v)) return 'var(--green)';
  if (AMBER.has(v)) return 'var(--amber)';
  if (RED.has(v)) return 'var(--red)';
  return 'var(--text)';
}

/** Deterministic offline fallback so a submit still gets a verdict if the AI call fails. */
function fallbackVerdict(content) {
  let h = 0;
  for (const ch of String(content)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return VERDICTS[h % VERDICTS.length];
}

/**
 * Ask the Claude-backed Edge Function for a one-word verdict. The Anthropic key
 * lives server-side in Supabase secrets — it is never in this bundle. Falls back
 * to a local pick if Supabase is unconfigured or the function errors, so the page
 * always responds.
 * @param {string} content
 * @returns {Promise<string>} one of VERDICTS
 */
export async function getVerdict(content) {
  if (!supabase) return fallbackVerdict(content);
  try {
    const { data, error } = await supabase.functions.invoke('verdict', {
      body: { content },
    });
    if (error) throw error;
    const word = String(data?.verdict || '').trim().toUpperCase();
    return VERDICTS.includes(word) ? word : fallbackVerdict(content);
  } catch {
    return fallbackVerdict(content);
  }
}
