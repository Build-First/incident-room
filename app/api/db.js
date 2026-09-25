// One place that knows how to reach the database, the same way app/api/claude.js
// is the one place that knows how to reach Claude.
//
// Note which key this uses: the service role key, not the anon key. The service
// role key ignores row level security, which is exactly why it must never leave
// the server. The tables have RLS on and no policies, so the anon key can read
// nothing at all. Every read and write in this app comes through a route you
// wrote, holding a key the browser never sees.
//
// If you ever find yourself reaching for NEXT_PUBLIC_SUPABASE_ANON_KEY, stop and
// ask what the browser would be allowed to do with it. Here, the answer is
// nothing, and that is the design.
import { createClient } from "@supabase/supabase-js";

// What .env.example ships with, plus the prompt left in .env.local. A key that
// is still one of these is not a key, and saying so here is worth more than
// letting Supabase answer 401 and making you wonder which of the two it meant.
const PLACEHOLDERS = ["replace-me", "paste-service-role-key-here"];

export function getDb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (url.includes("your-project") || PLACEHOLDERS.includes(key)) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export const NO_DB =
  "Nowhere to put it yet.\n\n" +
  "Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local, then stop and " +
  "restart npm run dev. Both are in your Supabase project under " +
  "Settings, API.\n\n" +
  "Take the service role key, not the anon key, and treat it like the Claude " +
  "key: it belongs in .env.local and in Vercel, never in a file you commit.";

// Supabase hands back errors rather than throwing them, so every call site
// checks. This turns one into a sentence the board can show.
export function dbError(error, doing) {
  return (
    `The database refused to ${doing}.\n\n` +
    `${error.message}\n\n` +
    (error.code === "42P01"
      ? "That code means the table does not exist. Paste supabase/migrations/001_case_log.sql into the Supabase SQL editor and run it."
      : "The code above is Postgres telling you exactly what it did not like. Paste it back into Claude Code if it is not obvious.")
  );
}
