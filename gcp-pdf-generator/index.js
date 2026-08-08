const functions = require('@google-cloud/functions-framework');
const puppeteer = require('puppeteer');

functions.http('generatePdf', async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { url, token, layoutMode } = req.body;

  if (!url) {
    return res.status(400).send('Missing "url" in request body');
  }

  let browser = null;
  try {
    // Launch headless browser (no sandbox required for GCP Cloud Run / Functions)
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Authenticate by injecting token into HttpOnly cookie
    const targetUrl = new URL(url);
    if (token) {
      await page.setCookie({
        name: 'access_token',
        value: token,
        domain: targetUrl.hostname,
        path: '/',
        httpOnly: true
      });
    }

    if (layoutMode) targetUrl.searchParams.set('printLayoutMode', layoutMode);

    // Navigate to the frontend page
    await page.goto(targetUrl.toString(), {
      waitUntil: 'networkidle0', // Wait until all API calls and images finish loading
      timeout: 30000 
    });

    // Generate mathematical PDF from the CSS layout
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, // Ensures Tailwind colors and borders show up
      margin: {
        top: '12mm',
        bottom: '12mm',
        left: '12mm',
        right: '12mm'
      }
    });

    res.set('Content-Type', 'application/pdf');
    res.status(200).send(pdfBuffer);

  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).send(`Error generating PDF: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});
