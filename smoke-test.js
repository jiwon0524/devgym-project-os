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
    requirementsVisibleAfterClick: false,
    tasksVisibleAfterClick: false,
    testCasesVisibleAfterClick: false,
    collaborationVisibleAfterClick: false,
    collaborationMemberAdded: false,
    collaborationCommentAdded: false,
    collaborationDecisionAdded: false,
    demoLoaded: false,
    demoCounts: {},
    errors,
  };

  const loadDemo = page.getByRole("button", { name: "Load Demo" });
  if ((await loadDemo.count()) !== 1) throw new Error("Load Demo button not found");
  await loadDemo.click();
  result.demoLoaded = await page.locator("#nb-req").innerText() !== "0";
  result.demoCounts = {
    requirements: await page.locator("#nb-req").innerText(),
    tasks: await page.locator("#nb-task").innerText(),
    testCases: await page.locator("#nb-tc").innerText(),
    apis: await page.locator("#nb-api").innerText(),
    risks: await page.locator("#nb-risk").innerText(),
    meetings: await page.locator("#nb-mtg").innerText(),
  };

  await page.locator('[data-p="requirements"]').click();
  result.requirementsVisibleAfterClick = await page.locator("#page-requirements").isVisible();

  await page.locator('[data-p="tasks"]').click();
  result.tasksVisibleAfterClick = await page.locator("#page-tasks").isVisible();

  await page.locator('[data-p="testcases"]').click();
  result.testCasesVisibleAfterClick = await page.locator("#page-testcases").isVisible();

  await page.locator('[data-p="collaboration"]').click();
  result.collaborationVisibleAfterClick = await page.locator("#page-collaboration").isVisible();
  await page.locator("#collab-member-name").fill("테스트 멤버");
  await page.locator("#collab-member-role").selectOption("Manager");
  await page.locator('button[onclick="addCollabMember()"]').click();
  result.collaborationMemberAdded = await page.getByText("테스트 멤버").count() > 0;
  await page.locator("#collab-mention").fill("@테스트 멤버");
  await page.locator("#collab-comment").fill("FR-003 범위를 백엔드 API와 맞춰 확인해주세요.");
  await page.locator('button[onclick="addCollabComment()"]').click();
  result.collaborationCommentAdded = await page.getByText("FR-003 범위").count() > 0;
  await page.locator("#decision-target-id").fill("FR-003");
  await page.locator("#decision-body").fill("FR-003 PUT/DELETE는 다음 스프린트로 넘기고 GET/POST를 먼저 확정한다.");
  await page.locator('button[onclick="addDecision()"]').click();
  result.collaborationDecisionAdded = await page.getByText("PUT/DELETE").count() > 0;
  await page.screenshot({ path: path.resolve(__dirname, "smoke-collaboration.png"), fullPage: false });

  await browser.close();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
