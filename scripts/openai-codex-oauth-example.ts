import { loginOpenAICodex } from "@mariozechner/pi-ai";
import { streamSimple } from "@mariozechner/pi-ai";
import readline from "node:readline";

/**
 * This is an example of how to use ChatGPT's LLM via OAuth (Codex)
 * instead of requiring a paid API key from the OpenAI Developer platform.
 *
 * It uses the underlying `@mariozechner/pi-ai` package which handles the
 * OAuth flow and the model communication.
 */
async function runChatGPTWithOAuth() {
  console.log("Starting ChatGPT OAuth login...");

  // A small delay to ensure dynamic imports inside pi-ai for node:http are resolved
  await new Promise(resolve => setTimeout(resolve, 100));

  // 1. Authenticate with ChatGPT OAuth
  const creds = await loginOpenAICodex({
    onAuth: (info) => {
      console.log(`\nPlease open the following URL in your browser to sign in:`);
      console.log(`\n  ${info.url}\n`);
      if (info.instructions) {
        console.log(`Instructions: ${info.instructions}`);
      }
    },
    onPrompt: async (prompt) => {
      // Create a readline interface to get user input from the console
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      return new Promise((resolve) => {
        rl.question(`\n[Prompt] ${prompt.message}\n> `, (answer) => {
          rl.close();
          resolve(answer.trim());
        });
      });
    },
    onProgress: (msg) => {
      console.log(`[Progress] ${msg}`);
    },
  });

  console.log("\n✅ Successfully authenticated!");
  console.log(`Received access token (starts with): ${creds.access.substring(0, 15)}...`);
  console.log(`Token expires at: ${new Date(creds.expires).toLocaleString()}`);

  // 2. Call the ChatGPT model using the OAuth credentials
  console.log("\nCalling ChatGPT model (openai-codex/gpt-4o) with the obtained token...");

  // The obtained access token acts as the API key
  const apiKey = creds.access;

  // Create an async generator that streams the response
  const stream = streamSimple("openai-codex/gpt-4o", [
    { role: "user", text: "Hello ChatGPT! Can you tell me a short joke about programming?" }
  ], {
    apiKey: apiKey,
  });

  console.log("\nChatGPT Response:");
  console.log("----------------------------------------");

  let fullResponse = "";
  for await (const chunk of stream) {
    process.stdout.write(chunk);
    fullResponse += chunk;
  }

  console.log("\n----------------------------------------");
  console.log("Done!");
}

// Run the example if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runChatGPTWithOAuth().catch(console.error);
}

export { runChatGPTWithOAuth };
