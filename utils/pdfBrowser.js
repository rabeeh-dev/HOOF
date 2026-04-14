/**
 * @file utils/pdfBrowser.js
 * @description Shared Puppeteer browser launcher that works in both local dev and production.
 *
 * - Local:       Uses the full `puppeteer` package (bundled Chromium).
 * - Production:  Uses `puppeteer-core` + `@sparticuz/chromium` which provides
 *                a pre-built Chromium binary compatible with Linux servers
 *                (Render, Railway, AWS, etc.).
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Launch a headless Chromium browser configured for the current environment.
 * @returns {Promise<import('puppeteer').Browser>}
 */
async function launchBrowser() {
  if (isProduction) {
    // Production: use puppeteer-core + @sparticuz/chromium
    const puppeteer = require('puppeteer-core');
    const chromium = require('@sparticuz/chromium');

    // Install a basic font so text renders on servers without system fonts
    await chromium.font(
      'https://raw.githubusercontent.com/google/fonts/main/apache/roboto/Roboto%5Bwdth%2Cwght%5D.ttf'
    );

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 900 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    return browser;
  } else {
    // Local development: use the full puppeteer package (has its own Chromium)
    const puppeteer = require('puppeteer');

    const browser = await puppeteer.launch({
      headless: "new",
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
 * Handles page creation, content loading, and proper rendering wait.
 * @param {import('puppeteer').Browser} browser - Puppeteer browser instance
 * @param {string} htmlContent - Full HTML string to render
 * @param {object} pdfOptions - Options passed to page.pdf()
 * @returns {Promise<Buffer>} PDF as a Node.js Buffer
 */
async function generatePdfFromHtml(browser, htmlContent, pdfOptions = {}) {
  const page = await browser.newPage();

  // Set content and wait for everything to fully render
  await page.setContent(htmlContent, {
    waitUntil: ['load', 'networkidle0'],
    timeout: 60000
  });

  // Wait for all fonts to finish loading
  await page.evaluate(() => document.fonts.ready);

  // Extra wait to ensure everything is fully painted
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1500)));

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    ...pdfOptions
  });

  return Buffer.from(pdfBuffer);
}

module.exports = { launchBrowser, generatePdfFromHtml };
