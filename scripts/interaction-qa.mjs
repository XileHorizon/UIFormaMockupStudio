import { mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { chromium } from "/home/kevin/.npm-global/lib/node_modules/openclaw/node_modules/playwright-core/index.mjs";

const require = createRequire(import.meta.url);
const { PNG } = require("/home/kevin/.npm-global/lib/node_modules/openclaw/node_modules/pngjs");
const baseUrl = process.env.UIFORMA_QA_URL ?? "http://127.0.0.1:8443/";
const outputDir = new URL("../artifacts/visual-qa/final/", import.meta.url);

const makeDevice = (id, posX, scale, rotY = 0) => ({
  id,
  name: id === "phone_a" ? "iPhone 17 Pro 1" : "iPhone 17 Pro 2",
  elementType: "device",
  device: { type: "iphone-17-pro", color: "silver", orientation: "portrait", showShadow: true, showReflection: true, screenBrightness: 1, materialPreset: "default" },
  transform: { rotX: -6, rotY, rotZ: 0, posX, posY: 0, scale },
  screenshot: null,
  screenshotType: null,
  visible: true,
  locked: false,
});

const project = {
  objects: [makeDevice("phone_a", -190, 0.78, 18), makeDevice("phone_b", 190, 1.12, -18)],
  selectedId: "phone_a",
  background: { type: "transparent", color: "#000000", gradientFrom: "#000000", gradientTo: "#000000", gradientAngle: 145 },
  lighting: { preset: "soft-studio", intensity: 1, ambientIntensity: 0.8, shadowOpacity: 0.34, shadowSoftness: 70, rimLight: true, contactShadow: true },
  activeTool: "select",
  showExportModal: false,
  showTemplatesModal: false,
};

const encoded = Buffer.from(JSON.stringify(project)).toString("base64");
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/home/kevin/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome",
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const issues = [];
page.on("console", (message) => { if (message.type() === "error") issues.push(`console: ${message.text()}`); });
page.on("pageerror", (error) => issues.push(`pageerror: ${error.message}`));
page.on("response", (response) => {
  if (response.status() >= 400 && !response.url().includes("stats.kev.im")) issues.push(`http ${response.status()}: ${response.url()}`);
});

await page.goto(`${baseUrl}#project=${encoded}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
await page.locator("canvas").waitFor({ state: "visible", timeout: 120_000 });
await page.waitForTimeout(4500);

const numberInputs = page.locator('input[type="number"]');
for (const [index, value] of [[0, "-11"], [1, "27"], [2, "4"], [3, "-230"], [4, "55"], [5, "0.86"]]) {
  await numberInputs.nth(index).fill(value);
}
await page.evaluate(() => (document.activeElement instanceof HTMLElement ? document.activeElement.blur() : undefined));
const transformedValues = await Promise.all([0, 1, 2, 3, 4, 5].map((index) => numberInputs.nth(index).inputValue()));
await page.getByText("iPhone 17 Pro 1", { exact: true }).click();
await page.keyboard.press("Control+d");
await page.waitForTimeout(250);
const countAfterDuplicate = await page.getByText(/3 objects/).count();
await page.keyboard.press("Delete");
await page.waitForTimeout(250);
const countAfterDelete = await page.getByText(/2 objects/).count();

await page.locator("[data-canvas-bg='true']").first().screenshot({ path: new URL("two-iphones-transformed.png", outputDir).pathname });
await page.getByRole("button", { name: "Export", exact: true }).click();
await page.getByRole("button", { name: "1×", exact: true }).click();
const transparentLabel = await page.getByText("Yes", { exact: true }).count();
const downloadPromise = page.waitForEvent("download", { timeout: 120_000 });
await page.getByRole("button", { name: "Download PNG", exact: true }).click();
const download = await downloadPromise;
const exportPath = new URL("transparent-export.png", outputDir).pathname;
await download.saveAs(exportPath);

await page.getByRole("button", { name: "WebP", exact: true }).click();
const webpDownloadPromise = page.waitForEvent("download", { timeout: 120_000 });
await page.getByRole("button", { name: "Download WEBP", exact: true }).click();
const webpDownload = await webpDownloadPromise;
const webpPath = new URL("transparent-export.webp", outputDir).pathname;
await webpDownload.saveAs(webpPath);

const png = PNG.sync.read(await readFile(exportPath));
const webp = await readFile(webpPath);
const webpHeader = `${webp.subarray(0, 4).toString("ascii")}:${webp.subarray(8, 12).toString("ascii")}`;
const cornerAlphas = [
  png.data[3],
  png.data[(png.width - 1) * 4 + 3],
  png.data[((png.height - 1) * png.width) * 4 + 3],
  png.data[((png.height * png.width) - 1) * 4 + 3],
];
await browser.close();
const result = {
  transformedValues,
  duplicateShortcut: countAfterDuplicate === 1,
  deleteShortcut: countAfterDelete === 1,
  transparentLabel: transparentLabel === 1,
  exportSize: [png.width, png.height],
  cornerAlphas,
  webpHeader,
  issues: [...new Set(issues)],
};
console.log(JSON.stringify(result, null, 2));
if (!result.duplicateShortcut || !result.deleteShortcut || !result.transparentLabel || cornerAlphas.some((alpha) => alpha !== 0) || webpHeader !== 'RIFF:WEBP' || result.issues.length) process.exitCode = 1;
