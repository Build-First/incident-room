// The report button calls this. Right now it does nothing, on purpose.
//
// Session 3, sprint 2 replaces the body of this function with a real call to
// Claude. The key for that call comes from process.env, which reads .env.local
// on your laptop and Vercel's environment variables once it's deployed. The key
// never appears in this file, and this file is the only place that ever sees it:
// the browser calls this route, and this route calls Claude.
export async function POST(request) {
  const { clues } = await request.json();

  return Response.json(
    {
      error:
        "No API key yet, so there is nobody to write the report. " +
        `You have ${clues?.length ?? 0} clue(s) ready to send. This is sprint 2.`,
    },
    { status: 501 }
  );
}
