// "Publish this report" calls this.
//
// It saves the report text and hands back { id }, which the page turns into
// /report/<id>. That link is the whole reason any of this needed a database:
// it works on somebody else's phone, in a week, with your laptop shut.
//
// Only the text is saved, not the clues it came from. That is deliberate. The
// report is a snapshot of what you believed when you filed it. Re-mark a clue
// tomorrow and this link still says what you sent, which is what a case file
// is for.
import { getDb, NO_DB, dbError } from "../db";

export async function POST(request) {
  const db = getDb();
  if (!db) return Response.json({ error: NO_DB }, { status: 501 });

  const { report } = await request.json();
  if (!report || !String(report).trim()) {
    return Response.json({ error: "There is no report to publish yet." }, { status: 400 });
  }

  const { data, error } = await db
    .from("reports")
    .insert({ body: String(report) })
    .select("id")
    .single();

  if (error) return Response.json({ error: dbError(error, "file that report") }, { status: 502 });
  return Response.json({ id: data.id });
}
