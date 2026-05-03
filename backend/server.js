import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { handleAiRoutes } from "./routes/aiRoutes.js";

function loadLocalEnv() {
  if (!existsSync(".env")) return;

  const lines = readFileSync(".env", "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
    }
  }
}

loadLocalEnv();

const port = Number(process.env.PORT || 8787);

const server = createServer(async (request, response) => {
  try {
    const handled = await handleAiRoutes(request, response);
    if (handled) return;

    response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ success: false, error: "Not found" }));
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ success: false, error: error.message || "Server error" }));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`AI backend listening on http://127.0.0.1:${port}`);
});
