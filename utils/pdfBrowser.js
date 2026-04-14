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

    // @sparticuz/chromium optimisations
    chromium.setHeadlessMode = true;
    chromium.setGraphicsMode = false;

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,      // "new" headless
    });

    return browser;
  } else {
    // Local development: use the full puppeteer package (has its own Chromium)
    const puppeteer = require('puppeteer');

    const browser = await puppeteer.launch({
      headless: "new",
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

module.exports = { launchBrowser };
