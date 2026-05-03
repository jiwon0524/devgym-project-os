import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(rootDir, "dist");

const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};

function createStaticServer() {
  return createServer(async (request, response) => {
    const requestPath = request.url === "/" ? "/index.html" : request.url.split("?")[0];
    const filePath = path.normalize(path.join(distDir, decodeURIComponent(requestPath)));

    if (!filePath.startsWith(distDir)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    try {
      const content = await readFile(filePath);
      response.writeHead(200, {
        "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      });
      response.end(content);
    } catch {
      const fallback = await readFile(path.join(distDir, "index.html"));
      response.writeHead(200, { "Content-Type": "text/html" });
      response.end(fallback);
    }
  });
}

async function main() {
  if (!existsSync(path.join(distDir, "index.html"))) {
    throw new Error("Missing dist/index.html. Run npm run build before smoke testing.");
  }

  const server = createStaticServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  const browserPaths = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  ];
  const executablePath = browserPaths.find((browserPath) => existsSync(browserPath));
  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];

  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  try {
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });

    await page.getByRole("button", { name: /프로젝트 만들기/i }).first().click();
    await page.getByLabel("프로젝트 이름").fill("DevGym 로그인 개선");
    await page
      .getByLabel("설명")
      .fill("디자인과 개발이 바로 이해할 수 있게 로그인 요구사항을 정리합니다.");
    await page.getByRole("button", { name: /^프로젝트 만들기$/i }).click();

    await page.getByRole("main").getByRole("button", { name: /^요구사항$/i }).click();
    await page.getByRole("button", { name: /분석하기/i }).click();
    await page.getByRole("button", { name: /작업 보드에 추가/i }).click();

    const result = {
      title: await page.title(),
      sidebarVisible: await page.getByText("ProjectOS").isVisible(),
      workspaceVisible: await page.getByText("프로젝트 워크스페이스").isVisible(),
      requirementSections: await page.locator("section", { hasText: "기능 요구사항" }).count(),
      erdVisible: await page.getByRole("heading", { name: "users" }).isVisible(),
      generatedTaskAdded: await page.getByText("작업을 추가했습니다").isVisible(),
      tasksNavVisible: await page.getByRole("button", { name: /^내 작업$/i }).isVisible(),
      errors,
    };

    console.log(JSON.stringify(result, null, 2));

    if (errors.length) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
