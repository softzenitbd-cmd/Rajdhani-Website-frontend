import puppeteer from 'puppeteer';

(async () => {
  try {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('BROWSER_CONSOLE_ERROR:', msg.text());
      }
    });

    page.on('pageerror', error => {
      console.error('BROWSER_PAGE_ERROR:', error.message);
    });

    console.log("Navigating to URL...");
    await page.goto('http://localhost:5173/crm/due-collection-date', { waitUntil: 'networkidle0', timeout: 15000 });
    
    console.log("Navigation complete. Waiting a bit for any late errors...");
    await new Promise(r => setTimeout(r, 2000));
    
    await browser.close();
    console.log("Done checking.");
  } catch (error) {
    console.error("Puppeteer script error:", error);
  }
})();
