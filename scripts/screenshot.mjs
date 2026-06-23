// Capture dashboard screenshots with Playwright for vision review.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "screenshots");
mkdirSync(OUT, { recursive: true });

const BASE = process.env.BASE_URL || "http://localhost:3000";

const PAGES = [
  { name: "01-home", path: "/dashboard" },
  { name: "02-journeys", path: "/dashboard/journeys" },
  { name: "03-protocol-botox", path: "/dashboard/journeys/proto_botox" },
  { name: "04-patients", path: "/dashboard/patients" },
  { name: "05-inbox", path: "/dashboard/inbox" },
  { name: "06-reviews", path: "/dashboard/reviews" },
  { name: "07-settings", path: "/dashboard/settings" },
  { name: "08-new-protocol", path: "/dashboard/journeys/new" },
  { name: "09-edit-protocol", path: "/dashboard/journeys/proto_botox/edit" },
  { name: "10-patient-timeline", path: "/dashboard/patients/pat_2" },
  { name: "11-escalation", path: "/w/demo-token" },
];

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 2,
});

for (const p of PAGES) {
  const url = BASE + p.path;
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(800);
  const file = join(OUT, `${p.name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log("captured", p.name, "->", file);
}

await browser.close();
console.log("done");
