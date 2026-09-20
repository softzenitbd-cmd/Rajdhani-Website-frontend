import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    await page.goto('http://localhost:5173/crm/due-collection-date', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    
    // Save screenshot
    await page.screenshot({ path: 'c:/Users/SoftZen It/.gemini/antigravity-ide/brain/0a6e02dd-5e80-4979-87fe-61987ab4051d/scratch/screenshot.png' });
    
    const html = await page.content();
    fs.writeFileSync('c:/Users/SoftZen It/.gemini/antigravity-ide/brain/0a6e02dd-5e80-4979-87fe-61987ab4051d/scratch/page.html', html);
    
    await browser.close();
    console.log("Screenshot taken.");
  } catch (error) {
    console.error("Puppeteer script error:", error);
  }
})();
