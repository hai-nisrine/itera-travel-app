// Chat with the organizer agent in the terminal.

import readline from "node:readline/promises";
import { createListing, formatReply } from "./createListing.js";
import { confirmListing } from "./confirmListing.js";

const provider = process.argv[2];
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const history = [];
let lastDraft = null, tokensIn = 0, tokensOut = 0;

console.log('Organizer agent. Describe your trip. Type "confirm" to publish, "exit" to quit.\n');
while (true) {
  const text = (await rl.question("You: ")).trim();
  if (text.toLowerCase() === "exit") break;

  if (text.toLowerCase() === "confirm") {
    const result = await createListing(history, { provider, previousDraft: lastDraft });
    console.log(result.published ? "\n✅ Published (PoC: not saved).\n" : `\n❌ Not published: ${result.reason}\n`);
    continue;
  }

  history.push({ role: "user", content: text });
  try {
    const result = await createListing(history, { provider });
    tokensIn += result.usage.input; tokensOut += result.usage.output;
    lastDraft = result.listing ?? lastDraft;
    const reply = formatReply(result);
    console.log("\nDraft:", JSON.stringify(result.listing ?? {}, null, 2));
    console.log(`\nAgent (${result.status}):\n${reply}\n`);
    // Save the reply + current draft so the AI remembers what it already extracted
    history.push({ role: "assistant", content: `${reply}\nCurrent draft: ${JSON.stringify(result.listing ?? {})}` });
  } catch (err) {
    history.pop();
    console.log(`\n ${err.message}\n`);
  }
}
console.log(`Tokens used: ${tokensIn} in / ${tokensOut} out`);
rl.close();