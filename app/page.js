"use client";

import { useRef, useState } from "react";

const STATUSES = ["Unverified", "Corroborated", "Dead end", "Key evidence"];
const SOUNDTRACK = "https://suno.com/song/c51ec285-50d8-4657-aef6-4f6144423f94";
const TRACK = "The 7 Minute Hack";

export default function LeDossier() {
  // Every clue you add lives in this one variable. This variable lives in the
  // browser's memory, which lasts exactly as long as the page does. Sprint 1.
  const [clues, setClues] = useState([]);

  const [tab, setTab] = useState("dossier");
  const [what, setWhat] = useState("");
  const [source, setSource] = useState("");
  const [link, setLink] = useState("");
  const [filter, setFilter] = useState("All");
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState("");
  const [playing, setPlaying] = useState(false);
  const audio = useRef(null);

  function toggleTrack() {
    const el = audio.current;
    if (!el) return;
    if (el.paused) { el.play(); setPlaying(true); } else { el.pause(); setPlaying(false); }
  }

  function addClue(event) {
    event.preventDefault();
    if (!what.trim()) return;
    setClues([...clues, newClue(what, source || "unattributed")]);
    setWhat("");
    setSource("");
  }

  function newClue(text, from) {
    return { id: crypto.randomUUID(), what: text.trim(), source: from.trim(), status: "Unverified" };
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
      setClues([...clues, ...data.clues.map((c) => newClue(c.what, c.source || link.trim()))]);
      setLink("");
    } else {
      setTab("rapport");
      setReport({ stub: true, text: data.error });
    }
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
          Le dossier {clues.length > 0 && `(${clues.length})`}
        </button>
        <button onClick={() => setTab("rapport")} aria-current={tab === "rapport"}>
          Le rapport
        </button>
        <button onClick={() => setTab("apropos")} aria-current={tab === "apropos"}>
          À propos
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
                <button className="btn" type="submit">Add clue</button>
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

            {shown.length === 0 ? (
              <p className="empty">
                {clues.length === 0
                  ? "The board is empty. What does the room remember?"
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
                      onChange={(e) =>
                        setClues(clues.map((c) => (c.id === clue.id ? { ...c, status: e.target.value } : c)))
                      }
                      aria-label="Status"
                    >
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <button className="btn quiet" onClick={() => setClues(clues.filter((c) => c.id !== clue.id))}>
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
                {busy === "report" ? "Writing…" : "Établir le rapport"}
              </button>
            </div>
            {report && <div className={report.stub ? "out stub" : "out"}>{report.text}</div>}
          </>
        )}

        {tab === "apropos" && (
          <div className="about">
            <h2 className="section">The rules of the game</h2>
            <p className="kicker">How this works</p>

            <p>
              In October 2025 someone walked into the Louvre in broad daylight and walked
              back out again a few minutes later. You are the investigators. This is your
              evidence board.
            </p>

            <h3>How to play</h3>
            <ol className="rules">
              <li>Put everything the room remembers onto the board. Do not check it first.</li>
              <li>Hand it a news article and let it pull the facts out on its own.</li>
              <li>Work out which of them actually hold up, and mark each one.</li>
              <li>When the board is solid, have it write the report from the evidence that survived.</li>
            </ol>

            <h3>What the statuses mean</h3>
            <ul className="statuses">
              <li><b>Unverified</b><span>Somebody said it. Nobody has checked it. Everything starts here.</span></li>
              <li><b>Corroborated</b><span>A second, independent source says the same thing.</span></li>
              <li><b>Dead end</b><span>Checked, and it turned out not to be true. Keep it, don&rsquo;t delete it.</span></li>
              <li><b>Key evidence</b><span>True, and it changes the picture.</span></li>
            </ul>

            <h3>Why everything starts Unverified</h3>
            <p>
              Half of what a room confidently remembers about a news story turns out to be
              wrong. That is not a flaw in the room, it is how memory works. So nothing on
              this board is treated as true until something else says so too, and the report
              at the end is built only from what survived.
            </p>

            <h3>Two things this app cannot do yet</h3>
            <div className="missing">
              <p>
                <b>It forgets everything.</b> Add some clues and refresh the page. They are
                gone, because they were only ever in your browser&rsquo;s memory and nobody
                ever told the app where to put them.
              </p>
              <p>
                <b>It cannot read or write anything.</b> Both the article reader and the
                report writer need an AI on the other end, and an AI needs a key that says
                who is asking. This app does not have one.
              </p>
              <p>Those two gaps are the session. You are going to close them.</p>
            </div>

            <h3>The soundtrack</h3>
            <p>
              Every investigation needs one. Ours is called <em>{TRACK}</em>, which is
              also roughly how long they were inside, and roughly how long you get.
            </p>
            <a className="soundtrack" href={SOUNDTRACK} target="_blank" rel="noreferrer">
              {TRACK} &middot; on Suno
            </a>

            <img className="evidence-art" src="/evidence.jpg" alt="An empty display case, lit from above" />
          </div>
        )}
      </main>
    </>
  );
}
