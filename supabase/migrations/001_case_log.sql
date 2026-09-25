-- The case log. Two tables, because the app has exactly two things worth keeping.
--
-- Apply by pasting this whole file into the Supabase SQL editor:
--   your project -> SQL Editor -> New query -> paste -> Run.
--
-- Safe to run twice. Nothing here drops anything.

-- Every clue on the evidence board. This is what the refresh used to destroy.
create table if not exists clues (
  id         uuid primary key default gen_random_uuid(),
  what       text not null,
  source     text not null,
  status     text not null default 'Unverified'
             check (status in ('Unverified', 'Corroborated', 'Dead end', 'Key evidence')),
  created_at timestamptz not null default now()
);

-- The board reads in the order clues were added, so the order is worth an index
-- once there are more than a handful.
create index if not exists clues_created_at_idx on clues (created_at);

-- A published report. The text is frozen on purpose: change a clue's status
-- tomorrow and the link you already sent still says what it said when you sent
-- it. A case file that rewrites itself after the fact is not a case file.
create table if not exists reports (
  id         uuid primary key default gen_random_uuid(),
  body       text not null,
  created_at timestamptz not null default now()
);

-- Every Supabase table is reachable over the internet by default. Row level
-- security on, and no policies written, means the public key can read nothing
-- and write nothing. Every read and write in this app goes through a route you
-- wrote, holding the service role key, which lives in .env.local and never
-- reaches a browser.
--
-- Same rule you already learned with the Claude key, second time today.
alter table clues   enable row level security;
alter table reports enable row level security;
