# Le Dossier — Affaire Apollon

An evidence board for the October 2025 Louvre theft. Build First Small Biz
Cohort, Session 3.

You are the investigators. They were inside for about seven minutes, so that is
roughly how long you get.

It works, and it is deliberately missing two things. Finding out what they are
is the session.

## Get it running

```sh
npm install
npm run dev
```

Then open the address it prints, which will be `http://localhost:3000`.

Add a few clues. Change some statuses. Filter them.

Then refresh the page.

## What's here

- **The evidence board.** Each clue has what we know, where it came from, and a
  status: `Unverified · Corroborated · Dead end · Key evidence`. Add, filter,
  change, discard.
- **"Extract clues" from a link.** Paste an article, let it pull the facts out.
  Presses. Does not work yet, and it will tell you why.
- **"Établir le rapport".** Writes the police report from corroborated evidence
  only. Same story.
- **À propos**, which explains the rules of the game and names both gaps.
- **The soundtrack.** Play it from the banner.

## What's missing, and where

**1. Your clues live in `app/page.js`, in a variable called `clues`.** That
variable lives in your browser's memory, which lasts exactly as long as the page
does. Nothing is saved anywhere. That is why the refresh emptied it, and it is
sprint 1.

**2. `app/api/report/route.js` and `app/api/extract/route.js` have nobody to
ask.** Reading an article and writing a report both mean your app talking to
Claude, and your app needs its own key to do that. Your subscription is yours,
not your app's. That's sprint 2, and it fixes both buttons at once.

## Where keys go, when you get there

In `.env.local`, which is already in `.gitignore`, so it never reaches GitHub.
Then separately into Vercel's environment variables when you deploy. Never in
the code: a key in the code is a key in your commit history, and deleting the
line later does not remove it from the history.

If a key does get out, the fix is to delete that key and make a new one. It is
never to go back and tidy up.

## If something breaks

Paste the whole error back into Claude Code and say what you were doing. The
useful line is almost never the one you would have picked out yourself.

One specific trap: **don't run `npm run build` while `npm run dev` is still
running.** They write to the same folder and the dev server will start throwing
`Cannot find module` errors that have nothing to do with your code. If that
happens, stop both, delete the `.next` folder, and start `npm run dev` again.
