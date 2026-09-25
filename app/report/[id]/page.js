// The public face of a published report. This is the page you send your chief.
//
// Deliberately separate from the evidence board: whoever opens this link sees
// the finished case file and nothing else. No clue list, no buttons, no way
// into your working copy. It prints to a clean PDF too.
//
// Right now the sheet is empty, because publishing a report means saving it and
// there is nowhere to save it yet. Once there is a database, this page reads the
// report with this id out of it and drops the text into <div className="cf-body">.
export default async function PublishedReport({ params }) {
  const { id } = await params;

  return (
    <main className="published">
      <article className="casefile">
        <span className="cf-stamp">Confidentiel</span>
        <div className="cf-head">
          <p>Dossier &middot; Affaire Apollon</p>
          <p className="cf-sub">R&eacute;f. {id}</p>
        </div>
        <div className="cf-body">
{`NO REPORT IS FILED UNDER THIS REFERENCE.

Somebody sent you a link to a case file that was never saved.

This page is the whole point of deploying: a link you can send to somebody who will never open your laptop, showing them the finished report and nothing else.

It is empty because publishing a report means SAVING it first, and there is nowhere to save it yet.

That is a database, and it is the thing you are about to build.`}
        </div>
        <div className="cf-foot">
          <p className="cracked">You cracked the case and deployed your first app online!</p>
          <p className="brand">Build First</p>
        </div>
      </article>
      <a className="back" href="/">&larr; Back to the evidence board</a>
    </main>
  );
}
