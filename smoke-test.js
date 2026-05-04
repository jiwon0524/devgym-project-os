import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(rootDir, "dist");

const ko = {
  authRequired: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4",
  syncError: "\uB370\uC774\uD130 \uB3D9\uAE30\uD654 \uC624\uB958",
  staleMockProject:
    "\uD611\uC5C5 UI \uC810\uAC80 \uD504\uB85C\uC81D\uD2B8",
  mainNav: "\uC8FC\uC694 \uBA54\uB274",
  loginSyncBanner:
    "\uB85C\uADF8\uC778 \uD6C4 \uB3D9\uAE30\uD654 \uC2DC\uC791",
};

const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};

function createStaticServer() {
  return createServer(async (request, response) => {
    const requestPath =
      request.url === "/" ? "/index.html" : request.url.split("?")[0];
    const filePath = path.normalize(
      path.join(distDir, decodeURIComponent(requestPath)),
    );

    if (!filePath.startsWith(distDir)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    try {
      const content = await readFile(filePath);
      response.writeHead(200, {
        "Content-Type":
          mimeTypes[path.extname(filePath)] || "application/octet-stream",
      });
      response.end(content);
    } catch {
      const fallback = await readFile(path.join(distDir, "index.html"));
      response.writeHead(200, { "Content-Type": "text/html" });
      response.end(fallback);
    }
  });
}

async function isVisible(locator) {
  try {
    return await locator.isVisible({ timeout: 1500 });
  } catch {
    return false;
  }
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
  const executablePath = browserPaths.find((browserPath) =>
    existsSync(browserPath),
  );
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

    const authGateVisible = await isVisible(
      page.getByRole("heading", { name: ko.authRequired }),
    );
    const syncErrorVisible = await isVisible(page.getByText(ko.syncError));
    const staleMockProjectVisible = await isVisible(
      page.getByText(ko.staleMockProject),
    );
    const projectOsVisible = await isVisible(
      page.getByText("ProjectOS", { exact: true }),
    );
    const sidebarVisible = await isVisible(
      page.getByRole("navigation", { name: ko.mainNav }),
    );
    const loginSyncBannerVisible = await isVisible(
      page.getByText(ko.loginSyncBanner),
    );

    const result = {
      title: await page.title(),
      projectOsVisible,
      sidebarVisible,
      authGateVisible,
      syncErrorVisible,
      staleMockProjectVisible,
      loginSyncBannerVisible,
      errors,
    };

    console.log(JSON.stringify(result, null, 2));

    if (
      !projectOsVisible ||
      !sidebarVisible ||
      !authGateVisible ||
      !loginSyncBannerVisible ||
      syncErrorVisible ||
      staleMockProjectVisible ||
      errors.length
    ) {
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
