"use client";

import { useEffect, useRef, useState } from "react";

const STATUSES = ["Unverified", "Corroborated", "Dead end", "Key evidence"];
const SOUNDTRACK = "https://suno.com/song/c51ec285-50d8-4657-aef6-4f6144423f94";
const TRACK = "The 7 Minute Hack";

// The report is the thing they send somebody, so it gets to look like a
// document. Shared with the published page at /report/[id].
export function CaseFile({ text }) {
  return (
    <article className="casefile">
      <span className="cf-stamp">Confidentiel</span>
      <div className="cf-head">
        <p>Dossier &middot; Affaire Apollon</p>
        <p className="cf-sub">Louvre &middot; Octobre 2025</p>
      </div>
      <div className="cf-body">{text}</div>
      <div className="cf-foot">
        <p className="cracked">You cracked the case and deployed your first app online!</p>
        <p className="brand">Build First</p>
      </div>
    </article>
  );
}

export default function LeDossier() {
  // This variable still lives in the browser's memory and still dies with the
  // page. What changed is that it is no longer the only copy. It is now a view
  // of the clues table, filled from it on load and written back on every
  // change. Close the tab and the board is still there.
  const [clues, setClues] = useState([]);
  const [loadError, setLoadError] = useState("");

  const [tab, setTab] = useState("dossier");
  const [what, setWhat] = useState("");
  const [source, setSource] = useState("");
  const [link, setLink] = useState("");
  const [filter, setFilter] = useState("All");
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState("");
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const audio = useRef(null);

  // Runs once when the page opens: go and get the board. This one effect is the
  // difference between the app you started with and this one.
  useEffect(() => {
    fetch("/api/clues")
      .then((r) => r.json())
      .then((data) => (data.clues ? setClues(data.clues) : setLoadError(data.error)))
      .catch((e) => setLoadError(`The board could not be loaded.\n\n${e.message}`));
  }, []);

  function toggleTrack() {
    const el = audio.current;
    if (!el) return;
    if (el.paused) { el.play(); setPlaying(true); } else { el.pause(); setPlaying(false); }
  }

  // Everything that changes a clue goes through here: send it to the database
  // first, and only believe it once the database says so. The ids now come back
  // from Postgres rather than being invented in the browser, which is why this
  // waits for the answer instead of guessing.
  async function saveClues(incoming) {
    const response = await fetch("/api/clues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clues: incoming }),
    });
    const data = await response.json();
    if (data.clues) {
      setClues((current) => [...current, ...data.clues]);
      return true;
    }
    setTab("rapport");
    setReport({ stub: true, text: data.error });
    return false;
  }

  async function addClue(event) {
    event.preventDefault();
    if (!what.trim()) return;
    setBusy("add");
    const saved = await saveClues([{ what: what.trim(), source: source.trim() || "unattributed" }]);
    if (saved) {
      setWhat("");
      setSource("");
    }
    setBusy("");
  }

  async function setStatus(id, status) {
    // Move the board now and tell the database after. If the write fails the
    // clue snaps back, so what you see is never a change that did not happen.
    const before = clues;
    setClues(clues.map((c) => (c.id === id ? { ...c, status } : c)));
    const response = await fetch(`/api/clues/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      setClues(before);
      const data = await response.json();
      setTab("rapport");
      setReport({ stub: true, text: data.error });
    }
  }

  async function discard(id) {
    const before = clues;
    setClues(clues.filter((c) => c.id !== id));
    const response = await fetch(`/api/clues/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setClues(before);
      const data = await response.json();
      setTab("rapport");
      setReport({ stub: true, text: data.error });
    }
  }

  async function extractFromLink(event) {
    event.preventDefault();
    if (!link.trim()) return;
    setBusy("extract");
    setReport(null);
    const response = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: link.trim() }),
    });
    const data = await response.json();
    if (data.clues) {
      // Claude read the article, and now the clues it found go the same way a
      // typed one does: into the database first, onto the board second.
      const saved = await saveClues(
        data.clues.map((c) => ({ what: c.what, source: c.source || link.trim() }))
      );
      if (saved) setLink("");
    } else {
      setTab("rapport");
      setReport({ stub: true, text: data.error });
    }
    setBusy("");
  }

  async function publish() {
    setBusy("publish");
    const response = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report: report.text }),
    });
    const data = await response.json();
    if (data.id) window.location.href = `/report/${data.id}`;
    else setReport({ stub: true, text: data.error });
    setBusy("");
  }

  async function writeReport() {
    setBusy("report");
    setReport(null);
    const solid = clues.filter((c) => c.status === "Corroborated" || c.status === "Key evidence");
    const response = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clues: solid }),
    });
    const data = await response.json();
    setReport(data.report ? { stub: false, text: data.report } : { stub: true, text: data.error });
    setBusy("");
  }

  const shown = filter === "All" ? clues : clues.filter((c) => c.status === filter);
  const solidCount = clues.filter(
    (c) => c.status === "Corroborated" || c.status === "Key evidence"
  ).length;

  return (
    <>
      <div className="banner">
        <img src="/hero.jpg" alt="" />
        <div className="banner-title">
          <h1>Le Dossier</h1>
          <p>Affaire Apollon &middot; Louvre &middot; Octobre 2025</p>
          <div className="player">
            <button className="play" onClick={toggleTrack} aria-label={playing ? "Pause the theme" : "Play the theme"}>
              {playing ? "❙❙" : "▶"}
            </button>
            <span className="track">{TRACK}</span>
            <a className="track-link" href={SOUNDTRACK} target="_blank" rel="noreferrer">on Suno</a>
          </div>
        </div>
        <audio ref={audio} src="/the-7-minute-hack.mp3" onEnded={() => setPlaying(false)} preload="none" />
      </div>

      <nav>
        <button onClick={() => setTab("dossier")} aria-current={tab === "dossier"}>
          Evidence board {clues.length > 0 && `(${clues.length})`}
        </button>
        <button onClick={() => setTab("rapport")} aria-current={tab === "rapport"}>
          The report
        </button>
        <button onClick={() => setTab("mission")} aria-current={tab === "mission"}>
          Your mission
        </button>
      </nav>

      <main>
        {tab === "dossier" && (
          <>
            <h2 className="section">The evidence board</h2>
            <p className="kicker">Everything we think we know</p>

            <div className="panel">
              <h3>Add what you know</h3>
              <p className="hint">One fact per clue. Everything starts Unverified, including yours.</p>
              <form className="row" onSubmit={addClue}>
                <input value={what} onChange={(e) => setWhat(e.target.value)} placeholder="What we know" aria-label="What we know" />
                <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Where it came from" aria-label="Where it came from" />
                <button className="btn" type="submit" disabled={busy === "add"}>
                  {busy === "add" ? "Saving…" : "Add clue"}
                </button>
              </form>
            </div>

            <div className="panel">
              <h3>Or hand it an article</h3>
              <p className="hint">Paste a link and let it pull the facts out for you.</p>
              <form className="stack" onSubmit={extractFromLink}>
                <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" aria-label="Article link" />
                <button className="btn quiet" type="submit" disabled={busy === "extract"}>
                  {busy === "extract" ? "Reading…" : "Extract clues"}
                </button>
              </form>
            </div>

            <div className="filters">
              {["All", ...STATUSES].map((name) => (
                <button key={name} aria-pressed={filter === name} onClick={() => setFilter(name)}>
                  {name}
                </button>
              ))}
            </div>

            {loadError && <div className="out stub">{loadError}</div>}

            {shown.length === 0 ? (
              <p className="empty">
                {clues.length === 0
                  ? "The evidence board is empty. What does the room remember?"
                  : `Nothing marked ${filter}.`}
              </p>
            ) : (
              <ul className="clues">
                {shown.map((clue) => (
                  <li key={clue.id} data-status={clue.status}>
                    <div>
                      <p className="what">{clue.what}</p>
                      <p className="source">{clue.source}</p>
                    </div>
                    <select
                      className="status"
                      value={clue.status}
                      onChange={(e) => setStatus(clue.id, e.target.value)}
                      aria-label="Status"
                    >
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <button className="btn quiet" onClick={() => discard(clue.id)}>
                      Discard
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {tab === "rapport" && (
          <>
            <h2 className="section">The police report</h2>
            <p className="kicker">Corroborated evidence only</p>
            <div className="panel">
              <h3>Write it up</h3>
              <p className="hint">
                {solidCount === 0
                  ? "Nothing is corroborated yet, so there is nothing to write up. Mark a clue Corroborated or Key evidence first."
                  : `${solidCount} clue${solidCount === 1 ? "" : "s"} will go in. Unverified clues and dead ends stay out.`}
              </p>
              <button className="btn" onClick={writeReport} disabled={busy === "report"}>
                {busy === "report" ? "Generating…" : "Generate the report"}
              </button>
            </div>
            {report && (
              <>
                {report.stub ? (
                  <div className="out stub">{report.text}</div>
                ) : (
                  <CaseFile text={report.text} />
                )}
                {!report.stub && (
                  <div className="cf-actions">
                    <button className="btn" onClick={publish} disabled={busy === "publish"}>
                      {busy === "publish" ? "Publishing…" : "Publish, and get a link"}
                    </button>
                    <button className="btn quiet" onClick={() => window.print()}>
                      Download as PDF
                    </button>
                    <button
                      className="btn quiet"
                      onClick={() => {
                        navigator.clipboard.writeText(report.text);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      {copied ? "Copied" : "Copy the text"}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === "mission" && (
          <div className="about">
            <h2 className="section">Your mission</h2>
            <p className="kicker">Affaire Apollon &middot; still open</p>

            <p className="lede-noir">
              October 2025. A Sunday morning, doors open, the public already inside.
              Two men went up the outside of the Louvre, came in through a window,
              and were gone again in about seven minutes.
            </p>
            <p className="lede-noir">
              They took the crown jewels with them.
            </p>

            <p>
              Both men are in custody now. Both have talked. <b>Neither of them will
              say who sent them.</b>
            </p>

            <h3>What you&rsquo;re looking for</h3>
            <div className="missing">
              <p>
                The break-in is a matter of public record. That isn&rsquo;t the case.
              </p>
              <p>
                <b>The case is who ordered it</b>, and whether there was anyone to
                order it at all.
              </p>
            </div>

            <p className="lede-noir">Let&rsquo;s sort through the clues together.</p>

            <h3>How to play</h3>
            <ol className="rules">
              <li>Get every clue onto the evidence board.</li>
              <li>Let it read the articles for you.</li>
              <li>Mark what holds up.</li>
              <li>Let it write the report.</li>
            </ol>

            <h3>What the statuses mean</h3>
            <ul className="statuses">
              <li><b>Unverified</b><span>Somebody said it. Nobody has checked it. Everything starts here.</span></li>
              <li><b>Corroborated</b><span>A second, independent source says the same thing.</span></li>
              <li><b>Dead end</b><span>Checked, and it did not hold up. Keep it, don&rsquo;t delete it.</span></li>
              <li><b>Key evidence</b><span>True, and it changes the picture.</span></li>
            </ul>

            <h3>Three things this app couldn&rsquo;t do</h3>
            <div className="missing">
              <ol className="rules">
                <li><b>It couldn&rsquo;t read.</b> Paste a link and nothing happened. Reading an article is a job for an AI, and the app had no key of its own. It has one now, and the key sits on the server where nobody can lift it.</li>
                <li><b>It couldn&rsquo;t remember.</b> Add clues, refresh, gone. They were only ever in your browser. Now every clue goes into a table first and the board reads back from it.</li>
                <li><b>It couldn&rsquo;t share.</b> Publishing a report meant saving it somewhere, and there was nowhere. Now a filed report has an address you can send to somebody who will never open your laptop.</li>
              </ol>
              <p>Those three gaps were the session, <b>in that order</b>. You closed all of them.</p>
            </div>

            <h3>Sources</h3>
            <p className="sources">
              Details above are drawn from reporting by Le Monde and the Guardian,
              July 2026, and from the Paris prosecutor&rsquo;s statements of November 2025.
              The two men in custody have been charged, not convicted. This is a
              training exercise, not an investigation.
            </p>

            <img className="evidence-art" src="/evidence.jpg" alt="An empty display case, lit from above" />
          </div>
        )}
      </main>
    </>
  );
}
