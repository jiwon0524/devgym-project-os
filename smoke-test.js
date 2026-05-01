const path = require("node:path");
const { chromium } = require("playwright");

async function main() {
  const filePath = path.resolve(__dirname, "index.html").replace(/\\/g, "/");
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];

  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(`file:///${filePath}`, { waitUntil: "load" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "load" });
  await page.screenshot({ path: path.resolve(__dirname, "smoke-dashboard.png"), fullPage: false });

  const result = {
    title: await page.title(),
    dashboardVisible: await page.locator("#page-dashboard").isVisible(),
    navItems: await page.locator(".nav-item").count(),
    loadDemoRemoved: (await page.getByRole("button", { name: "Load Demo" }).count()) === 0,
    templateButtonRemoved: (await page.locator('button[onclick="openTemplateGallery()"], #template-gallery-modal').count()) === 0,
    initialCounts: {},
    requirementsVisibleAfterClick: false,
    tasksVisibleAfterClick: false,
    testCasesVisibleAfterClick: false,
    collaborationVisibleAfterClick: false,
    productionReadinessVisible: false,
    loginMenuOpens: false,
    logoutHiddenWhenLoggedOut: false,
    coachVisibleAfterClick: false,
    coachReviewBoardVisible: false,
    releaseReadinessVisible: false,
    githubVisibleAfterClick: false,
    githubIssueCreateButtonVisible: false,
    diagramsVisibleAfterClick: false,
    diagramPurposeCardsVisible: false,
    errors,
  };

  result.initialCounts = await page.evaluate(() => ({
    requirements: S.requirements.length,
    tasks: S.tasks.length,
    testCases: S.testCases.length,
    apis: S.apis.length,
    risks: S.risks.length,
    meetings: S.meetings.length,
  }));

  await page.evaluate(() => nav("requirements"));
  result.requirementsVisibleAfterClick = await page.locator("#page-requirements").isVisible();
  await page.evaluate(() => nav("tasks"));
  result.tasksVisibleAfterClick = await page.locator("#page-tasks").isVisible();
  await page.evaluate(() => nav("testcases"));
  result.testCasesVisibleAfterClick = await page.locator("#page-testcases").isVisible();
  await page.evaluate(() => nav("collaboration"));
  result.collaborationVisibleAfterClick = await page.locator("#page-collaboration").isVisible();
  result.productionReadinessVisible = await page.getByText("Production Readiness").isVisible();
  await page.locator("#auth-status-btn").click();
  result.loginMenuOpens = await page.locator("#login-menu").isVisible();
  result.logoutHiddenWhenLoggedOut = !(await page.locator("#logout-action-btn").isVisible());
  await page.evaluate(() => nav("coach"));
  result.coachVisibleAfterClick = await page.locator("#page-coach").isVisible();
  result.coachReviewBoardVisible = await page.getByText("Developer PM Review Board").isVisible();
  result.releaseReadinessVisible = await page.locator(".collab-title", { hasText: "Release Readiness" }).isVisible();
  await page.evaluate(() => nav("github"));
  result.githubVisibleAfterClick = await page.locator("#page-github").isVisible();
  result.githubIssueCreateButtonVisible = await page.locator('button[onclick="createGitHubIssueFromTask() "]').count().catch(() => 0) > 0
    || await page.locator('button[onclick="createGitHubIssueFromTask()"]') .isVisible();
  await page.evaluate(() => nav("diagrams"));
  result.diagramsVisibleAfterClick = await page.locator("#page-diagrams").isVisible();
  await page.waitForTimeout(150);
  result.diagramPurposeCardsVisible = await page.locator("#dg-purpose-cards .dg-purpose-card").count() === 4;
  await page.screenshot({ path: path.resolve(__dirname, "smoke-collaboration.png"), fullPage: false });

  await browser.close();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
