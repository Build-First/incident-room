// "Paste a link, get clues out of it" calls this.
//
// Three steps, in order: fetch the page at that URL, pull the readable text out
// of the HTML, and ask Claude which factual claims are in it. The shape it
// hands back is { clues: [{ what, source }] }, which is what the board on the
// other end is already expecting.
//
// The key never appears in this file, and the browser never sees it. The
// browser calls this route, and this route calls Claude. That is the whole
// reason this is a route and not something app/page.js does itself: anything
// in app/page.js is shipped to the browser and readable by anyone.
import { getClient, MODEL, NO_KEY, explain } from "../claude";

// Reading a page and thinking about it takes longer than Vercel's default
// serverless timeout allows. Without this the deployed version fails at about
// ten seconds while your laptop is perfectly happy.
export const maxDuration = 60;

// Claude is told to answer in exactly this shape, and the API holds it to that,
// so the JSON below parses without a "what if it wrote prose instead" branch.
const CLUES_SCHEMA = {
  type: "object",
  properties: {
    clues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          what: { type: "string" },
          source: { type: "string" },
        },
        required: ["what", "source"],
        additionalProperties: false,
      },
    },
  },
  required: ["clues"],
  additionalProperties: false,
};

const SYSTEM = `You are reading a news article for an investigator building an evidence board.

Pull out the factual claims and nothing else. A claim belongs on the board if it
could later turn out to be true or false: what happened, when, where, who, how
much, who said so. Leave out background, speculation dressed as fact, opinion,
and anything the article itself frames as rumour.

For each claim:
- "what" is the claim in one plain sentence, in the article's own terms. No hedging language of your own.
- "source" is who the article attributes it to, named as the article names them. If the article gives no attribution for that claim, use the publication's name.

Keep them separate. One claim per clue, so each can be corroborated or killed on
its own. If the page has no factual claims in it, return an empty list.`;

// Big enough for any article, small enough that a whole site archive pasted by
// accident gets caught here instead of turning into a surprise bill.
const MAX_CHARS = 200_000;

function textFromHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function fail(message) {
  return Response.json({ error: message }, { status: 400 });
}

export async function POST(request) {
  const { url } = await request.json();

  const client = getClient();
  if (!client) return Response.json({ error: NO_KEY }, { status: 501 });

  // This route fetches whatever address it is handed, from the server, which
  // means it can reach things the visitor's own browser cannot. Keep it to
  // public web pages so it can't be pointed at the machine it runs on.
  let target;
  try {
    target = new URL(url);
  } catch {
    return fail(`That is not an address Claude can read.\n\n${url || "Nothing"} was given.`);
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return fail("Only http and https links can be read.");
  }
  if (/^(localhost$|127\.|0\.0\.0\.0$|10\.|192\.168\.|169\.254\.|\[?::1\]?$)/i.test(target.hostname)) {
    return fail("That address points back at the server itself, so there is nothing to read.");
  }

  let page;
  try {
    page = await fetch(target, {
      headers: { "User-Agent": "LeDossier/1.0 (Build First workshop)" },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    return fail(
      `The page could not be fetched.\n\n${error?.message ?? String(error)}\n\n` +
        "Some sites refuse anything that is not a person with a browser. Try another link, " +
        "or add the clue by hand."
    );
  }
  if (!page.ok) {
    return fail(`That page answered ${page.status}, so there was nothing to read.`);
  }

  const article = textFromHtml(await page.text());
  if (article.length < 200) {
    return fail(
      "There was almost no text on that page.\n\n" +
        "Some sites build the article in the browser, so the server gets an empty shell. " +
        "Paste the piece in by hand instead."
    );
  }
  if (article.length > MAX_CHARS) {
    return fail(
      `That page is ${Math.round(article.length / 1000)}k characters, which is a lot more than an article.\n\n` +
        "Nothing was sent to Claude. Link to a single piece rather than an index or an archive."
    );
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      thinking: { type: "adaptive" },
      // Sorting claims from background is routine work, and medium is where it
      // stops getting better. The report is the piece worth spending on.
      output_config: { effort: "medium", format: { type: "json_schema", schema: CLUES_SCHEMA } },
      messages: [
        {
          role: "user",
          content: `Article fetched from ${target.href}\n\n${article}`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return fail("Claude declined to read that one, and did not say much about why.");
    }

    const text = response.content.find((block) => block.type === "text")?.text ?? "";
    const { clues } = JSON.parse(text);
    return Response.json({ clues });
  } catch (error) {
    return Response.json({ error: explain(error) }, { status: 502 });
  }
}
