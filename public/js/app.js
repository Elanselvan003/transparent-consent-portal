// Global State object to hold telemetry payload
const telemetryState = {
  consentGranted: false,
  timestamp: null,
  metadata: {
    userAgent: null,
    platform: null,
    language: null,
    screenResolution: null,
    timezone: null,
    location: null,
    cameraPermission: 'not-requested',
    microphonePermission: 'not-requested'
  },
  optionalInput: {
    name: '',
    phoneNumber: ''
  }
};

// DOM Elements
const globalConsentCheckbox = document.getElementById('global-consent-checkbox');
const telemetryOptionsSection = document.getElementById('telemetry-options-section');
const optionalUserForm = document.getElementById('optional-user-form');
const inputName = document.getElementById('input-name');
const inputPhone = document.getElementById('input-phone');
const btnSubmitTelemetry = document.getElementById('btn-submit-telemetry');
const jsonDisplay = document.getElementById('json-display');
const btnCopyJson = document.getElementById('btn-copy-json');

// Permission elements
const btnRequestLocation = document.getElementById('btn-request-location');
const locationBadge = document.getElementById('location-badge');
const btnRequestCamera = document.getElementById('btn-request-camera');
const cameraBadge = document.getElementById('camera-badge');
const btnRequestMicrophone = document.getElementById('btn-request-microphone');
const microphoneBadge = document.getElementById('microphone-badge');

// Toast elements
const statusToast = document.getElementById('status-toast');
const toastIcon = document.getElementById('toast-icon');
const toastMessage = document.getElementById('toast-message');

// Initialize state
updateJsonDisplay();

// Listen for global consent changes
globalConsentCheckbox.addEventListener('change', (e) => {
  const isChecked = e.target.checked;
  telemetryState.consentGranted = isChecked;
  telemetryState.timestamp = isChecked ? new Date().toISOString() : null;

  if (isChecked) {
    // Enable controls
    telemetryOptionsSection.classList.remove('disabled-state');
    optionalUserForm.classList.remove('disabled-state');
    
    // Enable inputs
    inputName.removeAttribute('disabled');
    inputPhone.removeAttribute('disabled');
    btnSubmitTelemetry.removeAttribute('disabled');
    btnRequestLocation.removeAttribute('disabled');
    btnRequestCamera.removeAttribute('disabled');
    btnRequestMicrophone.removeAttribute('disabled');

    // Gather automatic client-side diagnostic data
    gatherAutomaticData();
  } else {
    // Disable controls
    telemetryOptionsSection.classList.add('disabled-state');
    optionalUserForm.classList.add('disabled-state');
    
    // Disable inputs
    inputName.setAttribute('disabled', 'true');
    inputPhone.setAttribute('disabled', 'true');
    btnSubmitTelemetry.setAttribute('disabled', 'true');
    btnRequestLocation.setAttribute('disabled', 'true');
    btnRequestCamera.setAttribute('disabled', 'true');
    btnRequestMicrophone.setAttribute('disabled', 'true');

    // Reset inputs
    inputName.value = '';
    inputPhone.value = '';

    // Clear state data
    resetTelemetryState();
  }
  
  updateJsonDisplay();
});

// Sync manual input fields to state
inputName.addEventListener('input', (e) => {
  telemetryState.optionalInput.name = e.target.value;
  updateJsonDisplay();
});

inputPhone.addEventListener('input', (e) => {
  telemetryState.optionalInput.phoneNumber = e.target.value;
  updateJsonDisplay();
});

// Geolocation permissions requester
btnRequestLocation.addEventListener('click', () => {
  if (!navigator.geolocation) {
    updateBadge(locationBadge, 'Unsupported', 'status-error');
    telemetryState.metadata.location = 'Unsupported by browser';
    updateJsonDisplay();
    return;
  }

  updateBadge(locationBadge, 'Requesting...', 'status-pending');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      updateBadge(locationBadge, 'Authorized', 'status-success');
      telemetryState.metadata.location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: `${Math.round(position.coords.accuracy)} meters`
      };
      updateJsonDisplay();
      showToast('success', 'Location coordinates gathered successfully!');
    },
    (error) => {
      let errorMsg = 'Access Denied';
      if (error.code === error.POSITION_UNAVAILABLE) errorMsg = 'Unavailable';
      if (error.code === error.TIMEOUT) errorMsg = 'Timeout';
      
      updateBadge(locationBadge, errorMsg, 'status-error');
      telemetryState.metadata.location = `Permission failed: ${error.message}`;
      updateJsonDisplay();
      showToast('error', `Location permission failed: ${error.message}`);
    },
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
  );
});

// Camera access requester
btnRequestCamera.addEventListener('click', async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    updateBadge(cameraBadge, 'Unsupported', 'status-error');
    telemetryState.metadata.cameraPermission = 'Unsupported by browser';
    updateJsonDisplay();
    return;
  }

  updateBadge(cameraBadge, 'Requesting...', 'status-pending');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    
    // Permission granted! Release hardware immediately
    stream.getTracks().forEach(track => track.stop());
    
    updateBadge(cameraBadge, 'Authorized', 'status-success');
    telemetryState.metadata.cameraPermission = 'granted';
    updateJsonDisplay();
    showToast('success', 'Camera hardware verified and authorized.');
  } catch (error) {
    updateBadge(cameraBadge, 'Denied', 'status-error');
    telemetryState.metadata.cameraPermission = `denied/unavailable (${error.name})`;
    updateJsonDisplay();
    showToast('error', `Camera authorization failed: ${error.message}`);
  }
});

// Microphone access requester
btnRequestMicrophone.addEventListener('click', async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    updateBadge(microphoneBadge, 'Unsupported', 'status-error');
    telemetryState.metadata.microphonePermission = 'Unsupported by browser';
    updateJsonDisplay();
    return;
  }

  updateBadge(microphoneBadge, 'Requesting...', 'status-pending');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Permission granted! Release hardware immediately
    stream.getTracks().forEach(track => track.stop());
    
    updateBadge(microphoneBadge, 'Authorized', 'status-success');
    telemetryState.metadata.microphonePermission = 'granted';
    updateJsonDisplay();
    showToast('success', 'Microphone hardware verified and authorized.');
  } catch (error) {
    updateBadge(microphoneBadge, 'Denied', 'status-error');
    telemetryState.metadata.microphonePermission = `denied/unavailable (${error.name})`;
    updateJsonDisplay();
    showToast('error', `Microphone authorization failed: ${error.message}`);
  }
});

// Submit data to Express API
btnSubmitTelemetry.addEventListener('click', async () => {
  if (!telemetryState.consentGranted) {
    showToast('error', 'Consent is required to submit telemetry data.');
    return;
  }

  btnSubmitTelemetry.setAttribute('disabled', 'true');
  btnSubmitTelemetry.textContent = 'Submitting...';

  try {
    // Refresh timestamp
    telemetryState.timestamp = new Date().toISOString();
    updateJsonDisplay();

    const response = await fetch('/api/submit-consent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(telemetryState)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      showToast('success', 'Consent telemetry successfully logged to the server console!');
      console.log('Server response:', result);
    } else {
      showToast('error', `Submission failed: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    showToast('error', `Network error during submission: ${error.message}`);
    console.error('Submission error:', error);
  } finally {
    btnSubmitTelemetry.removeAttribute('disabled');
    btnSubmitTelemetry.textContent = 'Submit Consented Data';
  }
});

// Copy JSON helper
btnCopyJson.addEventListener('click', () => {
  const codeText = jsonDisplay.innerText;
  navigator.clipboard.writeText(codeText).then(() => {
    const originalText = btnCopyJson.innerHTML;
    btnCopyJson.classList.add('copied');
    btnCopyJson.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      <span>Copied!</span>
    `;
    setTimeout(() => {
      btnCopyJson.classList.remove('copied');
      btnCopyJson.innerHTML = originalText;
    }, 2000);
  });
});

// Gather basic diagnostic data
function gatherAutomaticData() {
  telemetryState.metadata.userAgent = navigator.userAgent;
  
  // Platform resolution
  let platform = 'Unknown';
  if (navigator.userAgentData && navigator.userAgentData.platform) {
    platform = navigator.userAgentData.platform;
  } else if (navigator.platform) {
    platform = navigator.platform;
  }
  telemetryState.metadata.platform = platform;
  
  // Language & Resolution
  telemetryState.metadata.language = navigator.language || navigator.userLanguage;
  telemetryState.metadata.screenResolution = `${window.screen.width}x${window.screen.height} (Color: ${window.screen.colorDepth}-bit)`;
  
  // Timezone
  try {
    telemetryState.metadata.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || `UTCOffset ${new Date().getTimezoneOffset()}`;
  } catch (e) {
    telemetryState.metadata.timezone = `UTCOffset ${new Date().getTimezoneOffset()}`;
  }
}

// Reset telemetry object fields
function resetTelemetryState() {
  telemetryState.metadata = {
    userAgent: null,
    platform: null,
    language: null,
    screenResolution: null,
    timezone: null,
    location: null,
    cameraPermission: 'not-requested',
    microphonePermission: 'not-requested'
  };
  telemetryState.optionalInput = {
    name: '',
    phoneNumber: ''
  };

  // Reset badges
  resetBadge(locationBadge, 'Not Requested');
  resetBadge(cameraBadge, 'Not Requested');
  resetBadge(microphoneBadge, 'Not Requested');
}

// Badge UI Helpers
function updateBadge(badge, text, className) {
  badge.textContent = text;
  badge.className = `status-badge ${className}`;
}

function resetBadge(badge, text) {
  badge.textContent = text;
  badge.className = 'status-badge status-pending';
}

// Update pre block with JSON
function updateJsonDisplay() {
  jsonDisplay.textContent = JSON.stringify(telemetryState, null, 2);
}

// Custom Toast Alerts
function showToast(type, message) {
  toastMessage.textContent = message;
  
  if (type === 'success') {
    statusToast.classList.remove('error');
    toastIcon.textContent = '✓';
    toastIcon.style.backgroundColor = 'var(--accent-success-bg)';
    toastIcon.style.color = 'var(--accent-success)';
  } else {
    statusToast.classList.add('error');
    toastIcon.textContent = '✗';
    toastIcon.style.backgroundColor = 'var(--accent-error-bg)';
    toastIcon.style.color = 'var(--accent-error)';
  }
  
  statusToast.classList.remove('hidden');
  setTimeout(() => statusToast.classList.add('show'), 50);

  // Clear toast after 4 seconds
  setTimeout(() => {
    statusToast.classList.remove('show');
    setTimeout(() => statusToast.classList.add('hidden'), 400);
  }, 4000);
}
