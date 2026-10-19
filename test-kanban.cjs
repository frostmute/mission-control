const { chromium } = require('./node_modules/.pnpm/playwright@1.58.2/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.context().addCookies([{
    name: 'mc-session',
    value: '4dfd4b50c04714425f7057157cc9ac93cea18e620a17cf4a7b7b60aee1bc5b08',
    domain: 'localhost',
    path: '/',
    sameSite: 'Lax'
  }]);

  console.log('Navigating to /tasks...');
  await page.goto('http://localhost:3000/tasks', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);

  const title = await page.title();
  const url = page.url();
  console.log('Title:', title);
  console.log('URL:', url);

  const bodyText = await page.textContent('body');
  const lines = bodyText.split('\n').filter(l => l.trim());
  console.log('\nBody text (first 40 lines):');
  lines.slice(0, 40).forEach(l => console.log(' ', l.trim()));

  // Check for kanban-specific elements
  const columns = await page.$$('[data-column]');
  console.log('\n[data-column] elements:', columns.length);

  const columnHeaders = await page.$$eval('div', els => 
    els.filter(el => el.style.minWidth && el.style.minWidth.includes('px')).map(el => el.style.minWidth)
  );
  console.log('Column elements with minWidth:', columnHeaders.length);

  // Check for error boundary
  const hasError = await page.$('text=/error/i') !== null;
  console.log('Has error text:', hasError);

  await page.screenshot({ path: '/tmp/kanban-test.png', fullPage: true });
  console.log('\nScreenshot: /tmp/kanban-test.png');

  await browser.close();
})();
