// The report button calls this.
//
// It takes the clues the board already filtered down to Corroborated and Key
// evidence, sends them to Claude, and hands back { report: "..." } for the page
// to show. Unverified clues and dead ends never arrive here: app/page.js drops
// them before the request is made, which is the rule of the game enforced in
// code rather than in a paragraph nobody reads.
//
// The key never appears in this file, and the browser never sees it. The
// browser calls this route, and this route calls Claude.
import { getClient, MODEL, NO_KEY, explain } from "../claude";

// Writing takes longer than Vercel allows a function by default.
export const maxDuration = 60;

// The case file is rendered with white-space: pre-wrap, so real line breaks
// show up and markdown does not. Asking for asterisks here would print
// asterisks on the page.
const SYSTEM = `You are writing the official police report for the October 2025 theft from the Louvre, case name Affaire Apollon.

You are given the corroborated evidence and nothing else. Write only from it.
Do not add detail you were not given, do not name anyone the evidence does not
name, and do not resolve a question the evidence leaves open. Where the evidence
runs out, say so plainly and move on. An investigator has to be able to hold
this up against the board and find every sentence in it.

Format, exactly:
- Plain text. No markdown, no asterisks, no hashes, no bullet characters.
- Section headings in capitals on their own line, with a blank line either side.
- These sections, in order: SYNOPSIS, SEQUENCE OF EVENTS, EVIDENCE, OUTSTANDING QUESTIONS.
- Under EVIDENCE, one short paragraph per clue, each naming where it came from.
- Start at the word SYNOPSIS. No title, no case name, no date line above it. The
  page this is printed on already carries its own letterhead, and a second one
  underneath it looks like a mistake.
- Never use an em-dash. Use a comma, a full stop, or a colon instead.

Tone: flat, procedural, unhurried. The facts carry it. No flourishes, no
speculation about motive, no closing line about justice.`;

export async function POST(request) {
  const { clues } = await request.json();

  const client = getClient();
  if (!client) return Response.json({ error: NO_KEY }, { status: 501 });

  if (!Array.isArray(clues) || clues.length === 0) {
    return Response.json(
      {
        error:
          "Nothing corroborated, nothing to write.\n\n" +
          "The report is built from clues marked Corroborated or Key evidence. " +
          "Everything else stays off it on purpose. Go back to the board and " +
          "decide what you actually believe.",
      },
      { status: 400 }
    );
  }

  const evidence = clues
    .map((clue, index) => `${index + 1}. ${clue.what}\n   Source: ${clue.source}\n   Status: ${clue.status}`)
    .join("\n\n");

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      thinking: { type: "adaptive" },
      messages: [
        {
          role: "user",
          content: `Corroborated evidence, ${clues.length} item${clues.length === 1 ? "" : "s"}:\n\n${evidence}\n\nWrite the report.`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return Response.json(
        { error: "Claude declined to write this one, and did not say much about why." },
        { status: 400 }
      );
    }

    const report = response.content.find((block) => block.type === "text")?.text ?? "";
    return Response.json({ report });
  } catch (error) {
    return Response.json({ error: explain(error) }, { status: 502 });
  }
}
