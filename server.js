const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// POST endpoint to receive consent and data
app.post('/api/submit-consent', (req, res) => {
  const { consentGranted, timestamp, metadata, optionalInput } = req.body;

  // Validate the consent payload
  if (consentGranted === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Consent status (consentGranted) is required.'
    });
  }

  // Double check that we do not process/accept restricted system properties
  const forbiddenKeys = ['imei', 'contacts', 'whatsapp', 'sms', 'serialNumber'];
  const hasForbiddenKeys = Object.keys(req.body).some(key => forbiddenKeys.includes(key.toLowerCase())) ||
                           (metadata && Object.keys(metadata).some(key => forbiddenKeys.includes(key.toLowerCase())));

  if (hasForbiddenKeys) {
    console.warn(`[WARNING] Rejected payload containing potentially restricted identifiers:`, req.body);
    return res.status(400).json({
      success: false,
      error: 'Collection of restricted system identifiers is strictly prohibited.'
    });
  }

  // Log the received transparent consent data to the server console
  console.log('========================================================================');
  console.log(`[CONSENT RECEIVED] Timestamp: ${timestamp || new Date().toISOString()}`);
  console.log(`Consent Granted: ${consentGranted}`);
  console.log('--- Metadata Collected ---');
  console.log(JSON.stringify(metadata || {}, null, 2));
  console.log('--- Optional User Input ---');
  console.log(JSON.stringify(optionalInput || {}, null, 2));
  console.log('========================================================================');

  // Respond to the client
  return res.status(200).json({
    success: true,
    message: 'Data successfully received and logged on the server. Thank you for your consent.',
    receivedData: {
      timestamp: timestamp || new Date().toISOString(),
      consentGranted,
      metadata: metadata || {},
      optionalInput: optionalInput || {}
    }
  });
});

// Fallback to index.html for frontend routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Serving static files from ${path.join(__dirname, 'public')}`);
});
