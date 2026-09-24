// "Publish this report" calls this. It does nothing yet, on purpose.
//
// To give a report its own link you have to save it somewhere first, and there
// is nowhere yet. Once there is a database, this route saves the report, gets
// back an id, and hands back { id } so the page can send you to /rapport/<id>.
export async function POST(request) {
  await request.json();

  return Response.json(
    {
      error:
        "Nowhere to put it.\n\n" +
        "Sending someone a link means the report has to exist somewhere other " +
        "than this browser tab. Right now it only exists on your screen, so the " +
        "moment you close it, there is nothing at the other end of the link.\n\n" +
        "A report needs saving before it can be shared. That is a database.",
    },
    { status: 501 }
  );
}
