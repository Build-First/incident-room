// "Paste a link, get clues out of it" calls this. It does nothing yet, on purpose.
//
// What it will do once you finish it: fetch the page at that URL, pull the text
// out of the HTML, and ask Claude to return the factual claims as separate
// clues. The shape it has to hand back is { clues: [{ what, source }] }, which
// is what the board on the other end is already expecting.
//
// The key for that lives in process.env, which reads .env.local on your laptop
// and Vercel's environment variables once it is deployed. It never appears in
// this file, and this file is the only thing that ever sees it: the browser
// calls this route, and this route calls Claude.
export async function POST(request) {
  const { url } = await request.json();

  return Response.json(
    {
      error:
        "This one needs an AI too, and there isn't one yet.\n\n" +
        `Nothing was read from ${url || "that link"}.\n\n` +
        "Reading an article and pulling the facts out of it is a job for Claude, " +
        "and Claude needs a key that says who is asking. Your subscription is yours. " +
        "Your app doesn't have one of its own.\n\n" +
        "Add a clue by hand for now.",
    },
    { status: 501 }
  );
}
