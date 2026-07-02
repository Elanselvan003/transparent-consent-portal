# Consented Data Telemetry Hub

A sleek, transparent data collection web application designed to demonstrate consent-based diagnostic gathering. Users have complete, active control over what browser details and hardware permissions they share.

## Features

1. **Active Consent Agreement:** The portal requires the user to explicitly accept the consent notice prior to enabling fields or submitting data.
2. **Standard Automatic Telemetry (With Consent):**
   - **User Agent & OS Platform:** General compatibility identification.
   - **Language & Region Settings:** Localized language preferences.
   - **Screen & Viewport Resolution:** Browser dimensions and color depth.
   - **Timezone Offset:** Dynamic time zone evaluation.
3. **Optional Dynamic Telemetry (Explicit User Action Required):**
   - **Geographical Location:** Standard browser `Geolocation` API coordinate capture.
   - **Camera Hardware Availability:** Verifies camera capability via `getUserMedia` (immediately releases the stream upon verification).
   - **Microphone Hardware Availability:** Verifies audio hardware capability via `getUserMedia` (immediately releases the stream upon verification).
4. **Optional Manual Input Form:** Users may type their Name and Phone number manually. No background search or contact list scanning is performed.
5. **Real-time JSON Viewer:** Displays the exact JSON data payload to be transmitted to the Express backend. No hidden tracking, fingerprinting, or silent logs are included.

## Technology Stack

- **Frontend:** Vanilla HTML5, CSS3, ES6 JavaScript. Uses Google Fonts (Outfit & JetBrains Mono), responsive CSS layout, backdrop filters for glassmorphism, and responsive design.
- **Backend:** Node.js with Express. Defines a POST endpoint to process and log JSON payloads directly to the terminal stdout.

## Project Structure

```
├── package.json
├── server.js
├── README.md
├── .gitignore
└── public/
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

## Running Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the Express server:**
   ```bash
   npm start
   ```

3. **Open the browser:**
   Navigate to `http://localhost:3000`.

## API Endpoint Reference

### POST `/api/submit-consent`

Receives the consented telemetry payload.

- **Request Body Format:**
  ```json
  {
    "consentGranted": true,
    "timestamp": "2026-07-01T12:26:00.000Z",
    "metadata": {
      "userAgent": "Mozilla/5.0 ...",
      "platform": "MacIntel",
      "language": "en-US",
      "screenResolution": "1920x1080 (Color: 24-bit)",
      "timezone": "America/New_York",
      "location": {
        "latitude": 40.7128,
        "longitude": -74.0060,
        "accuracy": "15 meters"
      },
      "cameraPermission": "granted",
      "microphonePermission": "granted"
    },
    "optionalInput": {
      "name": "Jane Doe",
      "phoneNumber": "+15551234567"
    }
  }
  ```

- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Data successfully received and logged on the server. Thank you for your consent.",
    "receivedData": { ... }
  }
  ```

## Design Decisions

- **Premium Aesthetics:** Outlined with linear gradient background glows, glassmorphism card styling, customized switches/checkboxes, and Outfit typography.
- **Privacy Enforcement:** Sanitizes payload inputs to reject restricted system identifiers (IMEI, contact lists, SMS logs) on the Express backend as a safeguard.
