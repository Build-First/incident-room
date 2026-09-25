// The evidence board, now that it has somewhere to live.
//
// GET  hands back every clue, oldest first, which is what the board loads when
//      the page opens. This is the line that makes the refresh stop hurting.
// POST saves new clues and hands back the saved rows, ids and all. Both the
//      "Add clue" form and "Extract clues" come through here: one sends a list
//      of one, the other sends a list of many, and the route does not care.
import { getDb, NO_DB, dbError } from "../db";

export async function GET() {
  const db = getDb();
  if (!db) return Response.json({ error: NO_DB }, { status: 501 });

  const { data, error } = await db
    .from("clues")
    .select("id, what, source, status")
    .order("created_at", { ascending: true });

  if (error) return Response.json({ error: dbError(error, "read the board") }, { status: 502 });
  return Response.json({ clues: data });
}

export async function POST(request) {
  const db = getDb();
  if (!db) return Response.json({ error: NO_DB }, { status: 501 });

  const { clues } = await request.json();
  if (!Array.isArray(clues) || clues.length === 0) {
    return Response.json({ error: "No clues were sent." }, { status: 400 });
  }

  // Take only the three columns the table has. Whatever else the browser sent,
  // including an id it made up, is dropped here. A route that writes exactly
  // the fields it means to write cannot be talked into writing others.
  const rows = clues
    .map((clue) => ({
      what: String(clue.what ?? "").trim(),
      source: String(clue.source ?? "").trim() || "unattributed",
      status: clue.status ?? "Unverified",
    }))
    .filter((row) => row.what.length > 0);

  if (rows.length === 0) {
    return Response.json({ error: "Every clue sent was empty." }, { status: 400 });
  }

  const { data, error } = await db.from("clues").insert(rows).select("id, what, source, status");
  if (error) return Response.json({ error: dbError(error, "save that") }, { status: 502 });
  return Response.json({ clues: data });
}
