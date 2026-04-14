/**
 * @file utils/pdfBrowser.js
 * @description Shared Puppeteer browser launcher for local dev and production (AWS EC2).
 *
 * Production (AWS EC2):
 *   Uses puppeteer-core + system-installed Google Chrome / Chromium.
 *   Requires ONE-TIME setup on the server (see README or setup commands below).
 *
 * Local development:
 *   Uses the full puppeteer package with its bundled Chromium.
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Find Chrome/Chromium executable path on Linux.
 */
function findChromePath() {
  const { execSync } = require('child_process');
  const paths = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
  ];

  for (const p of paths) {
    try {
      execSync(`test -f ${p}`, { stdio: 'ignore' });
      return p;
    } catch (e) {
      // Not found, try next
    }
  }

  // Last resort: try 'which'
  try {
    return execSync('which google-chrome || which chromium || which chromium-browser')
      .toString().trim();
  } catch (e) {
    return null;
  }
}

/**
 * Launch a headless Chromium browser configured for the current environment.
 * @returns {Promise<import('puppeteer').Browser>}
 */
async function launchBrowser() {
  if (isProduction) {
    const puppeteer = require('puppeteer-core');
    const chromePath = findChromePath();

    if (!chromePath) {
      throw new Error(
        'Chrome/Chromium not found on this server. ' +
        'Please install it: sudo apt install -y chromium-browser fonts-liberation ' +
        'OR sudo yum install -y chromium google-noto-sans-fonts'
      );
    }

    console.log(`[PDF] Using Chrome at: ${chromePath}`);

    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: 'new',
      defaultViewport: { width: 1280, height: 900 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--single-process',
        '--font-render-hinting=none',
      ]
    });

    return browser;
  } else {
    // Local: use the full puppeteer package with bundled Chromium
    const puppeteer = require('puppeteer');

    const browser = await puppeteer.launch({
      headless: 'new',
      defaultViewport: { width: 1280, height: 900 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote'
      ]
    });

    return browser;
  }
}

/**
 * Generate a PDF buffer from an HTML string.
 * @param {import('puppeteer').Browser} browser
 * @param {string} htmlContent - Full HTML to render
 * @param {object} pdfOptions - Options for page.pdf()
 * @returns {Promise<Buffer>}
 */
async function generatePdfFromHtml(browser, htmlContent, pdfOptions = {}) {
  const page = await browser.newPage();

  await page.setContent(htmlContent, {
    waitUntil: ['load', 'networkidle0'],
    timeout: 60000
  });

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);

  // Small delay for final paint
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    ...pdfOptions
  });

  return Buffer.from(pdfBuffer);
}

module.exports = { launchBrowser, generatePdfFromHtml };
