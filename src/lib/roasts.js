import { supabase } from '../supabaseClient.js';

// Anonymous like/dislike via the SECURITY DEFINER RPCs (see supabase/schema.sql).
// No-op on the network when Supabase isn't configured (preview mode) — the caller
// still updates local state optimistically so the UI responds.
export async function likeRoast(id) {
  if (!supabase) return;
  try {
    await supabase.rpc('increment_like', { roast_id: id });
  } catch {
    /* realtime + next load will reconcile */
  }
}

export async function dislikeRoast(id) {
  if (!supabase) return;
  try {
    await supabase.rpc('increment_dislike', { roast_id: id });
  } catch {
    /* ignore */
  }
}

// Sort a roast list for the Fresh / Fire / Ratio tabs.
export function sortRoasts(list, mode) {
  const arr = [...list];
  if (mode === 'fire') {
    arr.sort((a, b) => (b.likes || 0) - (a.likes || 0) || tCmp(a, b));
  } else if (mode === 'ratio') {
    arr.sort(
      (a, b) => (b.likes - b.dislikes || 0) - (a.likes - a.dislikes || 0) || tCmp(a, b),
    );
  } else {
    arr.sort(tCmp); // fresh: newest first
  }
  return arr;
}

function tCmp(a, b) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}
