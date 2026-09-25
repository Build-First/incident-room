// One place that knows how to reach Claude, so both routes don't repeat it.
//
// The key is read inside getClient(), not at the top of this file. A client
// built when the module loads would capture whatever the key was at boot and
// hold it until the next deploy. Reading it per request means you can drop a
// new key into .env.local, or rotate the one in Vercel, and the next click
// picks it up.
import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-opus-5";

// What .env.example ships with. If it is still this, the key was never set.
const PLACEHOLDER = "sk-ant-replace-me";

export function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === PLACEHOLDER) return null;
  return new Anthropic({ apiKey });
}

export const NO_KEY =
  "No key, so nobody to ask.\n\n" +
  "Put your key in .env.local on the ANTHROPIC_API_KEY line, then stop and " +
  "restart npm run dev. Next only reads that file at startup, so a key added " +
  "while the server is running will not be seen until you restart it.\n\n" +
  "Deployed instead of local? The key has to be set in Vercel's environment " +
  "variables too. .env.local never leaves your laptop, which is the point.";

// Turns whatever went wrong into a sentence worth reading. The board shows this
// text to whoever clicked, so it says what to do next, not just what broke.
export function explain(error) {
  if (error instanceof Anthropic.AuthenticationError) {
    return (
      "The key was rejected.\n\n" +
      "It reached Claude, which is further than no key at all, but Claude did " +
      "not recognise it. Usually that means it was copied with a piece missing, " +
      "or it has since been deleted. Make a new one and paste it again.\n\n" +
      "Never repair a leaked key. Delete it, make another."
    );
  }
  if (error instanceof Anthropic.RateLimitError) {
    return (
      "Too many at once.\n\n" +
      "Claude is asking you to slow down. Wait a few seconds and press it again."
    );
  }
  if (error instanceof Anthropic.APIError) {
    return `Claude answered with an error (${error.status}).\n\n${error.message}`;
  }
  return `Something broke before Claude was reached.\n\n${error?.message ?? String(error)}`;
}
