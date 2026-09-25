// One clue, by id. Changing a status and discarding a clue both land here.
//
// The id arrives in the URL, so it is whatever the browser chose to put there.
// Postgres checks it is a real uuid, and the status check constraint in the
// migration rejects any status that is not one of the four. Neither of those
// guards lives in this file, which is the point: the database refuses bad data
// even if a bug up here tries to write it.
import { getDb, NO_DB, dbError } from "../../db";

export async function PATCH(request, { params }) {
  const db = getDb();
  if (!db) return Response.json({ error: NO_DB }, { status: 501 });

  const { id } = await params;
  const { status } = await request.json();

  const { data, error } = await db
    .from("clues")
    .update({ status })
    .eq("id", id)
    .select("id, what, source, status")
    .single();

  if (error) return Response.json({ error: dbError(error, "change that status") }, { status: 502 });
  return Response.json({ clue: data });
}

export async function DELETE(request, { params }) {
  const db = getDb();
  if (!db) return Response.json({ error: NO_DB }, { status: 501 });

  const { id } = await params;
  const { error } = await db.from("clues").delete().eq("id", id);

  if (error) return Response.json({ error: dbError(error, "discard that") }, { status: 502 });
  return Response.json({ ok: true });
}
