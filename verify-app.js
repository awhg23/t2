const { chromium } = require("/Users/awhg23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 430, height: 900 } });
  const logs = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => logs.push(`${message.type()}: ${message.text()}`));
  page.on("response", (response) => {
    if (response.url().includes("/api/")) logs.push(`response ${response.status()} ${response.url()}`);
  });
  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
  await page.click("[data-view=chat]");
  await page.fill("#chatInput", "我今天很累，不想学习");
  await page.click("#chatForm button");
  await page.waitForTimeout(70000);
  await page.click("[data-view=upload]");
  await page.click("[data-category=study]");
  await page.click("#analyzeBtn");
  await page.waitForTimeout(20000);
  const data = await page.evaluate(() => ({
    messages: [...document.querySelectorAll(".message")].map((element) => element.textContent),
    analysis: document.querySelector("#analysisResult")?.textContent,
  }));
  await page.screenshot({ path: "/Users/awhg23/mycode/t2/app-api-flow.png", fullPage: true });
  await browser.close();
  console.log(JSON.stringify({ errors, logs, data }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
