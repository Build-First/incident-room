// The public face of a published report. This is the page you send your chief.
//
// Deliberately separate from the evidence board: whoever opens this link sees
// the finished case file and nothing else. No clue list, no buttons, no way
// into your working copy. It prints to a clean PDF too.
//
// This is a server component, so it talks to the database directly. There is no
// fetch, no loading spinner, no /api/ route in between. The HTML that arrives
// in the reader's browser already has the report in it, and the key that read
// it never left the server.
import { getDb, NO_DB } from "../../api/db";

// Read the database on every visit rather than caching the page. Reports never
// change once filed, so caching would be safe, but "what I see is what is in
// the table right now" is worth more than the saved round trip while you are
// still learning what the table does.
export const dynamic = "force-dynamic";

function Sheet({ id, children }) {
  return (
    <main className="published">
      <article className="casefile">
        <span className="cf-stamp">Confidentiel</span>
        <div className="cf-head">
          <p>Dossier &middot; Affaire Apollon</p>
          <p className="cf-sub">R&eacute;f. {id}</p>
        </div>
        <div className="cf-body">{children}</div>
        <div className="cf-foot">
          <p className="cracked">You cracked the case and deployed your first app online!</p>
          <p className="brand">Build First</p>
        </div>
      </article>
      <a className="back" href="/">&larr; Back to the evidence board</a>
    </main>
  );
}

export default async function PublishedReport({ params }) {
  const { id } = await params;

  const db = getDb();
  if (!db) return <Sheet id={id}>{NO_DB}</Sheet>;

  // .maybeSingle() rather than .single(): a link to a report that was never
  // filed is a normal thing for a reader to have, not an error in your code.
  const { data } = await db.from("reports").select("body").eq("id", id).maybeSingle();

  if (!data) {
    return (
      <Sheet id={id}>
{`NO REPORT IS FILED UNDER THIS REFERENCE.

Somebody sent you a link to a case file that does not exist, or that was filed and then removed.

The reference above is what was asked for. Nothing in the record matches it.`}
      </Sheet>
    );
  }

  return <Sheet id={id}>{data.body}</Sheet>;
}
