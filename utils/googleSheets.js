/**
 * @file utils/googleSheets.js
 * @description Google Sheets API integration for logging contact form leads.
 * Uses a Google Cloud Service Account for authentication.
 */

const { google } = require('googleapis');

// ==========================================
// GOOGLE SHEETS AUTH (Service Account)
// ==========================================

let sheetsClient = null;

/**
 * Initializes and returns an authenticated Google Sheets client.
 * Uses service account credentials from environment variables.
 * @returns {Promise<object>} Google Sheets API client
 */
async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const authClient = await auth.getClient();
  sheetsClient = google.sheets({ version: 'v4', auth: authClient });
  return sheetsClient;
}

// ==========================================
// APPEND CONTACT LEAD TO SHEET
// ==========================================

/**
 * Appends a contact form submission as a new row in the Google Sheet.
 * @param {string} name - Sender's full name.
 * @param {string} email - Sender's email address.
 * @param {string} subject - Message subject.
 * @param {string} message - Message body.
 * @returns {Promise<void>}
 */
async function appendContactLead(name, email, subject, message) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    console.warn('⚠️  Google Sheets not configured — skipping lead logging.');
    return;
  }

  try {
    const sheets = await getSheetsClient();

    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[timestamp, name, email, subject, message]],
      },
    });

    console.log('✅ Contact lead logged to Google Sheet');
  } catch (error) {
    console.error('❌ Google Sheets error:', error.message);
  }
}

module.exports = { appendContactLead };
