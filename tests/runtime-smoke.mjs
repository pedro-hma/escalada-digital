import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const errors = [];
page.on('pageerror', err => { errors.push(`PAGEERROR: ${err.stack || err.message}`); console.log(`PAGEERROR: ${err.stack || err.message}`); });
page.on('console', msg => {
  if (['error','warning'].includes(msg.type())) console.log(`CONSOLE ${msg.type()}: ${msg.text()}`);
});
await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);
const start = page.getByText(/iniciar turno/i).first();
if (await start.count()) { await start.click(); await page.waitForTimeout(4000); }
await page.screenshot({ path: 'runtime-smoke.png', fullPage: true });
const canvases = await page.locator('canvas').count();
console.log(`CANVASES=${canvases}`);
console.log(`ERROR_COUNT=${errors.length}`);
if (errors.length) process.exitCode = 1;
await browser.close();
