// The public face of a published report. This is the page you send your chief.
//
// It is deliberately separate from the evidence board: whoever opens this link
// sees the finished report and nothing else. No clue list, no buttons, no way
// into your working copy.
//
// Right now it has nothing to show, because publishing a report means saving it
// and there is nowhere to save it yet. Once there is a database, this page reads
// the report with this id out of it and renders it.
export default async function PublishedReport({ params }) {
  const { id } = await params;

  return (
    <main className="published">
      <p className="stamp">Le Dossier &middot; Affaire Apollon</p>
      <h1>No report at this address</h1>
      <p className="lede">
        Someone sent you a link to report <code>{id}</code>, and there is nothing
        here.
      </p>
      <div className="missing">
        <p>
          This page is the whole point of deploying: a link you can send to
          somebody who will never open your laptop, that shows them the finished
          report and nothing else.
        </p>
        <p>
          It is empty because publishing a report means <b>saving</b> it first,
          and there is nowhere to save it yet. That is a database, and it is the
          thing you are about to build.
        </p>
      </div>
      <a className="back" href="/">&larr; Back to the evidence board</a>
    </main>
  );
}
