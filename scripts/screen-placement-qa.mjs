import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "/home/kevin/.nvm/versions/node/v26.8.2/lib/node_modules/openclaw/node_modules/playwright-core/index.mjs";

const baseUrl = process.env.UIFORMA_QA_URL ?? "http://127.0.0.1:8443/";
const outputDir = new URL("../artifacts/visual-qa/screen-placement-modes/", import.meta.url);
const browserPath = "/home/kevin/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const pattern = `data:image/svg+xml;base64,${Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
    <rect width="1200" height="1200" fill="#111827"/><circle cx="600" cy="600" r="400" fill="#12b8a6" stroke="#fff" stroke-width="22"/>
    <path d="M0 600h1200M600 0v1200" stroke="#fb7185" stroke-width="10"/>
    <g fill="white" font-family="Arial" font-size="48" font-weight="700"><text x="24" y="66">TOP LEFT</text><text x="1176" y="66" text-anchor="end">TOP RIGHT</text><text x="24" y="1170">BOTTOM LEFT</text><text x="1176" y="1170" text-anchor="end">BOTTOM RIGHT</text></g>
  </svg>`).toString("base64")}`;

const project = {
  objects: [{
    id: "qa_imac", name: "iMac 2021 1", elementType: "device",
    device: { type: "imac-2021", color: "blue", orientation: "portrait", showShadow: true, showReflection: false, screenBrightness: 1, materialPreset: "default", screenOffsetX: 0, screenOffsetY: 0, screenScale: 1, screenFit: "fill", screenBackground: "#6b21a8", screenRotation: 0 },
    transform: { rotX: 0, rotY: 0, rotZ: 0, posX: 0, posY: 0, posZ: 0, scale: 1 },
    screenshot: pattern, screenshotType: "image", visible: true, locked: false,
  }],
  selectedId: "qa_imac", selectedIds: ["qa_imac"], layouts: [],
  background: { type: "solid", color: "#d8dadd", gradientFrom: "#e8eaed", gradientTo: "#b7bbc2", gradientAngle: 145 },
  lighting: { preset: "soft-studio", intensity: 1, ambientIntensity: 0.8, shadowOpacity: 0.34, shadowSoftness: 70, rimLight: true, contactShadow: true },
  activeTool: "select", showExportModal: false, showTemplatesModal: false,
};

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ executablePath: browserPath, headless: true, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const issues = [];
page.on("console", message => { if (message.type() === "error") issues.push(`console: ${message.text()}`); });
page.on("pageerror", error => issues.push(`pageerror: ${error.message}`));
const encoded = Buffer.from(JSON.stringify(project)).toString("base64");
await page.goto(`${baseUrl}#project=${encoded}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
await page.locator("canvas").waitFor({ state: "visible", timeout: 120_000 });
await page.waitForTimeout(3000);
for (const mode of ["Fill", "Fit", "Stretch", "Original"]) {
  console.log(`capturing ${mode}`);
  await page.getByRole("button", { name: mode, exact: true }).click({ timeout: 10_000 });
  await page.waitForTimeout(500);
  const capture = await page.locator("canvas").evaluate(element => element.toDataURL("image/png"));
  await writeFile(new URL(`${mode.toLowerCase()}.png`, outputDir), Buffer.from(capture.split(",")[1], "base64"));
}

await page.getByRole("button", { name: "Fit", exact: true }).click();
await page.waitForTimeout(500);
const savedFit = JSON.parse(await page.evaluate(() => localStorage.getItem("uiforma-mockup-studio-project-v1"))).objects[0].device.screenFit;
await page.keyboard.press("Control+z");
const undoFit = await page.getByRole("button", { name: "Original", exact: true }).getAttribute("aria-pressed");
await page.keyboard.press("Control+Shift+z");
const redoFit = await page.getByRole("button", { name: "Fit", exact: true }).getAttribute("aria-pressed");
await page.waitForTimeout(1500);
await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
await page.locator("canvas").waitFor({ state: "visible", timeout: 120_000 });
const restoredFit = await page.getByRole("button", { name: "Fit", exact: true }).getAttribute("aria-pressed");

await browser.close();
const result = { savedFit, undoFit, redoFit, restoredFit, issues: [...new Set(issues)] };
console.log(JSON.stringify(result, null, 2));
if (savedFit !== "fit" || undoFit !== "true" || redoFit !== "true" || restoredFit !== "true" || result.issues.length) process.exitCode = 1;
