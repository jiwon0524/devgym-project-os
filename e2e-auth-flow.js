import { spawn } from "node:child_process";
import { chromium } from "playwright";

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;
const baseUrl = process.env.E2E_BASE_URL || "http://127.0.0.1:5174";
const apiPort = process.env.E2E_API_PORT || "8787";
const shouldStartServers = process.env.E2E_START_SERVERS !== "false";
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url, timeoutMs = 30_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.status < 500) return true;
    } catch {
      // Server is not ready yet.
    }
    await wait(500);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function isHttpReady(url) {
  try {
    const response = await fetch(url);
    return response.status < 500;
  } catch {
    return false;
  }
}

function spawnServer(command, args, env = {}) {
  const child = spawn(command, args, {
    env: { ...process.env, ...env },
    stdio: "inherit",
    shell: false,
  });
  return child;
}

async function isVisible(locator, timeout = 1500) {
  try {
    await locator.waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!email || !password) {
    console.log(
      JSON.stringify({
        skipped: true,
        reason: "E2E_TEST_EMAIL and E2E_TEST_PASSWORD are required.",
      }),
    );
    return;
  }

  const children = [];
  if (shouldStartServers) {
    let startedApi = false;
    if (!(await isHttpReady(`http://127.0.0.1:${apiPort}`))) {
      children.push(
        spawnServer(npmCommand, ["run", "api"], {
          PORT: apiPort,
          CORS_ORIGIN: baseUrl,
        }),
      );
      startedApi = true;
    }
    if (!(await isHttpReady(baseUrl))) {
      children.push(
        spawnServer(npmCommand, ["run", "dev", "--", "--port", new URL(baseUrl).port || "5174"], {
          VITE_API_BASE_URL: "",
        }),
      );
    }
    if (startedApi) await waitForHttp(`http://127.0.0.1:${apiPort}`);
    await waitForHttp(baseUrl);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const browserErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  try {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.getByTestId("auth-email-toggle").click();
    await page.getByTestId("auth-email").fill(email);
    await page.getByTestId("auth-password").fill(password);
    await page.getByTestId("auth-login").click();

    const workspaceSetupVisible = await isVisible(page.getByTestId("workspace-name"), 10_000);
    if (workspaceSetupVisible) {
      await page.getByTestId("workspace-name").fill(`E2E 워크스페이스 ${Date.now()}`);
      await page.getByTestId("create-workspace-submit").click();
    }

    await page.getByTestId("nav-projects").click();
    const projectFormVisible = await isVisible(page.getByTestId("project-name"), 5000);
    if (projectFormVisible) {
      await page.getByTestId("project-name").fill(`E2E 프로젝트 ${Date.now()}`);
      await page
        .getByTestId("project-description")
        .fill("로그인한 실제 계정으로 워크스페이스, 프로젝트, AI 분석, 작업 생성을 검증합니다.");
      await page.getByTestId("create-project-submit").click();
    }

    await page.getByTestId("tab-Requirements").click();
    await page
      .getByTestId("requirement-input")
      .fill("네이버 로그인으로 회원가입하고, 팀 프로젝트를 만들고, 팀원이 댓글을 달 수 있게 해줘");
    await page.getByTestId("analyze-requirement-submit").click();
    await page.getByTestId("requirement-results").waitFor({ state: "visible", timeout: 90_000 });
    await page.getByTestId("save-artifacts").click();
    await page.getByTestId("convert-task-board").click();
    await page.getByTestId("tab-Tasks").waitFor({ state: "visible", timeout: 10_000 });

    const taskInputs = await page.locator("tbody input").count();
    const result = {
      success: taskInputs > 0 && browserErrors.length === 0,
      taskInputs,
      browserErrors,
    };
    console.log(JSON.stringify(result, null, 2));
    if (!result.success) process.exitCode = 1;
  } finally {
    await browser.close();
    for (const child of children) child.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
