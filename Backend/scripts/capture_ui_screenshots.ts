import puppeteer from 'puppeteer-core';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve('..', 'docs', 'screenshots');

async function main() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log('Authenticating demo accounts for screenshots...');
  
  // 1. Get Owner Auth
  const ownerRes = await axios.post('http://localhost:5001/api/auth/login', {
    email: 'owner@medicare.com',
    password: 'owner123'
  });
  const ownerData = ownerRes.data.data;

  // 2. Get Driver Auth
  const driverRes = await axios.post('http://localhost:5001/api/auth/login', {
    email: 'driver@medicare.com',
    password: 'driver123'
  });
  const driverData = driverRes.data.data;

  // 3. Get Customer Auth
  const customerRes = await axios.post('http://localhost:5001/api/auth/login', {
    email: 'customer@medicare.com',
    password: 'customer123'
  });
  const customerData = customerRes.data.data;

  console.log('Launching headless Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,820']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  const loginViaUI = async (email: string, pass: string) => {
    await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#le', { timeout: 10000 });
    
    // Clear and fill email
    await page.click('#le', { clickCount: 3 });
    await page.type('#le', email);

    // Clear and fill password
    await page.click('#lp', { clickCount: 3 });
    await page.type('#lp', pass);

    // Click submit
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})
    ]);
    await new Promise(r => setTimeout(r, 3000));
  };

  // -------------------------------------------------------------
  // Screen 1: Customer Store & Medicine Catalog
  // -------------------------------------------------------------
  console.log('Capturing Screen 1: Customer Medicine Catalog...');
  await page.goto('http://localhost:8080/medicines', { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-customer-catalog.png'), fullPage: false });
  console.log('✓ Saved: 01-customer-catalog.png');

  // -------------------------------------------------------------
  // Screen 2: Pharmacy Owner Dashboard (Net Profit & Metrics)
  // -------------------------------------------------------------
  console.log('Logging in as Owner...');
  await loginViaUI('owner@medicare.com', 'owner123');
  console.log('Capturing Screen 2: Pharmacy Owner Dashboard at ' + page.url());
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-owner-dashboard.png'), fullPage: false });
  console.log('✓ Saved: 02-owner-dashboard.png');

  // -------------------------------------------------------------
  // Screen 3: Pharmacy Orders Pipeline (New Orders & Action Buttons)
  // -------------------------------------------------------------
  console.log('Capturing Screen 3: Pharmacy Orders Pipeline...');
  await page.goto('http://localhost:8080/owner/orders', { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-owner-orders.png'), fullPage: false });
  console.log('✓ Saved: 03-owner-orders.png');

  // -------------------------------------------------------------
  // Screen 4: Driver Dashboard & Delivery Route
  // -------------------------------------------------------------
  console.log('Logging in as Driver...');
  await loginViaUI('driver@medicare.com', 'driver123');
  console.log('Capturing Screen 4: Driver Delivery Dashboard at ' + page.url());
  await new Promise(r => setTimeout(r, 3500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-driver-dashboard.png'), fullPage: false });
  console.log('✓ Saved: 04-driver-dashboard.png');

  await browser.close();
  console.log('All real UI screenshots successfully captured in docs/screenshots!');
}

main().catch(console.error);
