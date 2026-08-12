import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { chromium } from "/home/kevin/.npm-global/lib/node_modules/openclaw/node_modules/playwright-core/index.mjs";

const require = createRequire(import.meta.url);
const { PNG } = require("/home/kevin/.npm-global/lib/node_modules/openclaw/node_modules/pngjs");

const phase = process.argv.find((arg) => arg.startsWith("--phase="))?.split("=")[1] ?? "current";
const selectedMode = process.argv.includes("--selected");
const sceneFilter = process.argv.find((arg) => arg.startsWith("--scene="))?.split("=")[1];
const baseUrl = process.env.UIFORMA_QA_URL ?? "http://127.0.0.1:8443/";
const outputDir = new URL(`../artifacts/visual-qa/${phase}/`, import.meta.url);
const browserPath = "/home/kevin/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";

const testImage = (width, height, label) => `data:image/svg+xml;base64,${Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#7057ff"/><stop offset=".5" stop-color="#168cff"/><stop offset="1" stop-color="#16d6b0"/></linearGradient></defs>
    <rect width="${width}" height="${height}" fill="#090b18"/><rect x="${width * 0.035}" y="${height * 0.035}" width="${width * 0.93}" height="${height * 0.93}" rx="${Math.min(width, height) * 0.055}" fill="url(#g)"/>
    <circle cx="${width * 0.13}" cy="${height * 0.13}" r="${Math.min(width, height) * 0.055}" fill="#ff6a6a"/><rect x="${width * 0.6}" y="${height * 0.085}" width="${width * 0.27}" height="${height * 0.09}" rx="${Math.min(width, height) * 0.035}" fill="#fff" fill-opacity=".9"/>
    <text x="${width / 2}" y="${height * 0.42}" text-anchor="middle" fill="white" font-family="Arial" font-size="${Math.min(width, height) * 0.105}" font-weight="700">UIForma</text>
    <text x="${width / 2}" y="${height * 0.51}" text-anchor="middle" fill="white" fill-opacity=".76" font-family="Arial" font-size="${Math.min(width, height) * 0.045}">${label} QA</text>
    <rect x="${width * 0.08}" y="${height * 0.62}" width="${width * 0.39}" height="${height * 0.2}" rx="${Math.min(width, height) * 0.04}" fill="#fff" fill-opacity=".16"/><rect x="${width * 0.53}" y="${height * 0.62}" width="${width * 0.39}" height="${height * 0.2}" rx="${Math.min(width, height) * 0.04}" fill="#fff" fill-opacity=".27"/>
    <text x="${width * 0.055}" y="${height * 0.075}" fill="white" font-family="Arial" font-size="${Math.min(width, height) * 0.032}">TOP LEFT</text>
    <text x="${width * 0.945}" y="${height * 0.94}" text-anchor="end" fill="white" font-family="Arial" font-size="${Math.min(width, height) * 0.032}">BOTTOM RIGHT</text>
  </svg>
`).toString("base64")}`;

const screenImages = {
  "iphone-17-pro": testImage(1200, 2520, "PHONE"),
  "ipad-pro": testImage(2048, 2732, "TABLET"),
  "laptop-3d": testImage(2560, 1600, "LAPTOP"),
  "imac-2021": testImage(2560, 1440, "IMAC"),
  "macbook-air": testImage(2560, 1680, "MACBOOK"),
  "nintendo-switch": null,
  "game-boy": null,
};

const deviceNames = {
  "iphone-17-pro": "iPhone 17 Pro",
  "ipad-pro": "iPad Pro",
  "laptop-3d": "Laptop 3D",
  "imac-2021": "iMac 2021",
  "macbook-air": "MacBook",
  "nintendo-switch": "Nintendo Switch",
  "game-boy": "Game Boy",
};

const device = (type, transform = {}, index = 0) => ({
  id: `qa_${type}_${index}`,
  name: `${deviceNames[type]} ${index + 1}`,
  elementType: "device",
  device: {
    type,
    color: type === "imac-2021" ? "blue" : "silver",
    orientation: "portrait",
    showShadow: true,
    showReflection: true,
    screenBrightness: 1,
    materialPreset: "default",
  },
  transform: { rotX: 0, rotY: 0, rotZ: 0, posX: 0, posY: 0, scale: 1, ...transform },
  screenshot: screenImages[type],
  screenshotType: "image",
  visible: true,
  locked: false,
});

const shape = (type, transform = {}, index = 0) => ({
  id: `qa_shape_${type}_${index}`,
  name: `${type[0].toUpperCase()}${type.slice(1)} ${index + 1}`,
  elementType: "shape",
  device: device("macbook-air").device,
  shapeConfig: {
    shape: type,
    color: "#6557ff",
    secondaryColor: "#21d4b4",
    width: type === "ring" ? 260 : 320,
    height: type === "pedestal" ? 300 : 220,
    borderRadius: 28,
    opacity: 1,
    blur: 4,
    showShadow: true,
  },
  transform: { rotX: -12, rotY: 24, rotZ: 0, posX: 0, posY: 0, posZ: 0, scale: 1, ...transform },
  screenshot: null,
  screenshotType: null,
  visible: true,
  locked: false,
});

const state = (objects) => ({
  objects,
  selectedId: selectedMode ? objects.at(-1)?.id ?? null : null,
  background: { type: "solid", color: "#d8dadd", gradientFrom: "#e8eaed", gradientTo: "#b7bbc2", gradientAngle: 145 },
  lighting: { preset: "soft-studio", intensity: 1, ambientIntensity: 0.8, shadowOpacity: 0.34, shadowSoftness: 70, rimLight: true, contactShadow: true },
  activeTool: "select",
  showExportModal: false,
  showTemplatesModal: false,
});

const singleScenes = Object.keys(deviceNames).flatMap((type) => [
  { name: `${type}-front`, objects: [device(type)] },
  { name: `${type}-three-quarter`, objects: [device(type, { rotX: -8, rotY: 24, rotZ: -2 })] },
]);

const compositionScenes = [
  ...["card", "ring", "blob", "pedestal", "plane"].map((type) => ({ name: `shape-${type}`, objects: [shape(type)] })),
  { name: "composition-3d-elements", objects: [
    shape("card", { posX: -280, posY: -80, rotY: 32 }, 0),
    shape("ring", { posX: 10, posY: -100, rotX: 10, rotY: -20 }, 1),
    shape("blob", { posX: 280, posY: -70, scale: 0.8 }, 2),
    shape("pedestal", { posX: -140, posY: 180, scale: 0.72 }, 3),
    shape("plane", { posX: 170, posY: 170, rotY: 38, scale: 0.8 }, 4),
  ] },
  { name: "composition-two-iphones", objects: [device("iphone-17-pro", { posX: -180, posY: 40, scale: 0.78 }, 0), device("iphone-17-pro", { posX: 190, posY: -25, scale: 1.12, rotY: -20 }, 1)] },
  { name: "composition-iphone-macbook", objects: [device("iphone-17-pro", { posX: -260, posY: 100, scale: 0.75 }, 0), device("macbook-air", { posX: 140, posY: -20, scale: 0.82, rotY: 14 }, 1)] },
  { name: "composition-ipad-imac", objects: [device("ipad-pro", { posX: -250, posY: 75, scale: 0.72, rotY: -18 }, 0), device("imac-2021", { posX: 155, posY: -40, scale: 0.78, rotY: 14 }, 1)] },
  { name: "composition-all-devices", objects: [
    device("iphone-17-pro", { posX: -390, posY: 160, scale: 0.46 }, 0),
    device("ipad-pro", { posX: -170, posY: 120, scale: 0.48 }, 1),
    device("laptop-3d", { posX: 120, posY: 165, scale: 0.46 }, 2),
    device("imac-2021", { posX: 365, posY: 120, scale: 0.45 }, 3),
    device("macbook-air", { posX: -120, posY: -190, scale: 0.45 }, 4),
    device("macbook-air", { posX: 235, posY: -185, scale: 0.43 }, 5),
  ] },
];

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ executablePath: browserPath, headless: true, args: ["--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const consoleIssues = [];
const failedRequests = [];
page.on("console", (message) => {
  if (["error", "warning"].includes(message.type())) consoleIssues.push(`${message.type()}: ${message.text()}`);
});
page.on("pageerror", (error) => consoleIssues.push(`pageerror: ${error.message}`));
page.on("requestfailed", (request) => failedRequests.push(`${request.url()} — ${request.failure()?.errorText ?? "failed"}`));

const scenes = [...singleScenes, ...compositionScenes].filter((scene) => !sceneFilter || scene.name === sceneFilter);

for (const scene of scenes) {
  const project = Buffer.from(JSON.stringify(state(scene.objects))).toString("base64");
  await page.goto(`${baseUrl}?qa=${encodeURIComponent(scene.name)}#project=${project}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.locator("canvas").waitFor({ state: "visible", timeout: 120_000 });
  await page.waitForTimeout(scene.objects.some((item) => item.elementType === "device" && item.device.type === "macbook-air") ? 5000 : 2200);
  const canvasBounds = await page.locator("[data-canvas-bg='true']").first().boundingBox();
  if (!canvasBounds) throw new Error(`Canvas bounds were unavailable for ${scene.name}`);
  // Element screenshots wait for layout stability. A live WebGL canvas never
  // becomes stable because React Three Fiber continuously presents frames, so
  // capture the same pixels through an explicit page clip instead.
  const screenshot = await page.screenshot({ path: new URL(`${scene.name}.png`, outputDir).pathname, clip: canvasBounds });
  if (scene.name === "iphone-17-pro-front" && !selectedMode) {
    const png = PNG.sync.read(screenshot);
    const colored = [];
    for (let y = 0; y < png.height; y += 1) {
      for (let x = 0; x < png.width; x += 1) {
        const offset = (y * png.width + x) * 4;
        const [red, green, blue, alpha] = png.data.subarray(offset, offset + 4);
        if (alpha > 200 && blue > 145 && blue > red * 1.25 && green > 45) colored.push([x, y]);
      }
    }
    const xs = colored.map(([x]) => x);
    const ys = colored.map(([, y]) => y);
    const coloredWidth = Math.max(...xs) - Math.min(...xs) + 1;
    const coloredHeight = Math.max(...ys) - Math.min(...ys) + 1;
    if (coloredWidth < png.width * 0.18 || coloredHeight < png.height * 0.45) {
      throw new Error(`iPhone screen content does not fill the display (${coloredWidth}x${coloredHeight} colored pixels in ${png.width}x${png.height})`);
    }
  }
  console.log(`captured ${scene.name}`);
}

await browser.close();
console.log(JSON.stringify({ phase, screenshots: scenes.length, consoleIssues: [...new Set(consoleIssues)], failedRequests: [...new Set(failedRequests)] }, null, 2));
