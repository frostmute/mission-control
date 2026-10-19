import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.context().addCookies([{
  name: 'mc_session_dev',
  value: '4dfd4b50c04714425f7057157cc9ac93cea18e620a17cf4a7b7b60aee1bc5b08',
  domain: 'localhost',
  path: '/',
  sameSite: 'Lax'
}]);

console.log('Cookie set, navigating to /tasks...');
await page.goto('http://localhost:3000/tasks', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(4000);

const title = await page.title();
const url = page.url();
console.log('Title:', title);
console.log('URL:', url);

const bodyText = await page.textContent('body');
// Look for relevant content
const lines = bodyText.split('\n').filter(l => l.trim());
console.log('\nFirst 30 lines of body:');
lines.slice(0, 30).forEach(l => console.log(' ', l.trim()));

// Check for error patterns
const errorMatch = bodyText.match(/(?:error|failed|not found|cannot|unauthorized)/i);
if (errorMatch) console.log('\nError keyword found:', errorMatch[0]);

// Check for kanban elements
const hasScrollContainer = await page.$('.overflow-x-auto') !== null;
const hasColumnHeaders = await page.$$('div[style*="minWidth"]');
console.log('\nHas overflow-x-auto:', hasScrollContainer);
console.log('Potential column headers:', hasColumnHeaders.length);

// Check what the main content area looks like
const mainContent = await page.$eval('main', el => el.innerHTML.slice(0, 500)).catch(() => 'no <main> found');
console.log('\nMain content (first 500 chars):', mainContent.slice(0, 300));

await page.screenshot({ path: '/tmp/kanban-test.png', fullPage: false });
console.log('\nScreenshot saved to /tmp/kanban-test.png');

await browser.close();
