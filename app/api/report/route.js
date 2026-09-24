// The report button calls this. It does nothing yet, on purpose.
//
// What it will do once you finish it: take the corroborated clues, send them to
// Claude, and hand back { report: "..." } for the page to show.
//
// The key for that call comes from process.env, which reads .env.local on your
// laptop and Vercel's environment variables once it is deployed. The key never
// appears in this file, and this file is the only thing that ever sees it: the
// browser calls this route, and this route calls Claude.
export async function POST(request) {
  const { clues } = await request.json();
  const count = clues?.length ?? 0;

  return Response.json(
    {
      error:
        "No key, no report.\n\n" +
        `${count} corroborated clue${count === 1 ? "" : "s"} ready and nobody to write them up.\n\n` +
        "Writing the report means your app talking to Claude, and your app needs " +
        "its own key to do that. Your Claude subscription pays for you, not for " +
        "software you wrote.\n\n" +
        "This is sprint 2.",
    },
    { status: 501 }
  );
}
