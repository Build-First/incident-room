"use client";

import { useState } from "react";

const STATUSES = ["Unverified", "Corroborated", "Dead end", "Key evidence"];

export default function IncidentRoom() {
  // Every clue you add lives in this one variable, which lives in the browser's
  // memory, which lasts exactly as long as the page does. Session 3, sprint 1.
  const [clues, setClues] = useState([]);

  const [what, setWhat] = useState("");
  const [source, setSource] = useState("");
  const [filter, setFilter] = useState("All");
  const [report, setReport] = useState(null);
  const [writing, setWriting] = useState(false);

  function addClue(event) {
    event.preventDefault();
    if (!what.trim()) return;
    setClues([
      ...clues,
      {
        id: crypto.randomUUID(),
        what: what.trim(),
        source: source.trim() || "unattributed",
        status: "Unverified",
      },
    ]);
    setWhat("");
    setSource("");
  }

  function setStatus(id, status) {
    setClues(clues.map((c) => (c.id === id ? { ...c, status } : c)));
  }

  function remove(id) {
    setClues(clues.filter((c) => c.id !== id));
  }

  async function writeReport() {
    setWriting(true);
    setReport(null);
    const solid = clues.filter(
      (c) => c.status === "Corroborated" || c.status === "Key evidence"
    );
    const response = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clues: solid }),
    });
    const data = await response.json();
    setReport(data.report ?? data.error);
    setWriting(false);
  }

  const shown = filter === "All" ? clues : clues.filter((c) => c.status === filter);

  return (
    <main>
      <header>
        <h1>The Incident Room</h1>
        <p className="sub">Louvre &middot; October 2025</p>
      </header>

      <form onSubmit={addClue}>
        <input
          value={what}
          onChange={(e) => setWhat(e.target.value)}
          placeholder="What we know"
          aria-label="What we know"
        />
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Where it came from"
          aria-label="Where it came from"
        />
        <button type="submit">Add clue</button>
      </form>

      <div className="filters">
        {["All", ...STATUSES].map((name) => (
          <button
            key={name}
            className="ghost"
            aria-pressed={filter === name}
            onClick={() => setFilter(name)}
          >
            {name}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="empty">
          {clues.length === 0
            ? "No clues yet. What does the room remember?"
            : `Nothing marked "${filter}".`}
        </p>
      ) : (
        <ul>
          {shown.map((clue) => (
            <li key={clue.id}>
              <div>
                <p className="what">{clue.what}</p>
                <p className="source">{clue.source}</p>
              </div>
              <select
                className="drop"
                value={clue.status}
                onChange={(e) => setStatus(clue.id, e.target.value)}
                aria-label="Status"
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <button className="ghost" onClick={() => remove(clue.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <section className="report">
        <button onClick={writeReport} disabled={writing}>
          {writing ? "Writing…" : "Write the incident report"}
        </button>
        {report && <div className="out">{report}</div>}
      </section>
    </main>
  );
}
