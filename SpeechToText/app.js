/**
 * SpeakEasy Transcriber - Frontend JavaScript
 * Handles audio recording, API communication, and UI updates
 */

// API endpoint configuration
const API_BASE_URL = 'http://localhost:8000';
const RECORD_ENDPOINT = `${API_BASE_URL}/record`;

// State management
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let currentAudioBlob = null;

// DOM elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const transcribeBtn = document.getElementById('transcribeBtn');
const resetBtn = document.getElementById('resetBtn');
const recordingIndicator = document.getElementById('recordingIndicator');
const resultBox = document.getElementById('resultBox');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');

/**
 * Initialize the application
 */
function init() {
    // Check if browser supports MediaRecorder API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showError('Your browser does not support audio recording. Please use a modern browser like Chrome, Firefox, or Edge.');
        return;
    }

    // Set up event listeners
    startBtn.addEventListener('click', startRecording);
    stopBtn.addEventListener('click', stopRecording);
    transcribeBtn.addEventListener('click', transcribeAudio);
    resetBtn.addEventListener('click', resetUI);
    copyBtn.addEventListener('click', copyToClipboard);
    downloadBtn.addEventListener('click', downloadTranscript);
}

/**
 * Start recording audio from the user's microphone
 */
async function startRecording() {
    try {
        hideError();
        
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });

        // Initialize MediaRecorder
        const options = { mimeType: 'audio/webm' };
        
        // Fallback for browsers that don't support webm
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'audio/webm;codecs=opus';
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'audio/mp4';
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options.mimeType = ''; // Use default
                }
            }
        }

        mediaRecorder = new MediaRecorder(stream, options);
        audioChunks = [];

        // Collect audio data chunks
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        // Handle recording stop
        mediaRecorder.onstop = () => {
            // Create audio blob
            currentAudioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
            
            // Stop all tracks to release microphone
            stream.getTracks().forEach(track => track.stop());
            
            // Update UI
            updateUIAfterRecording();
        };

        // Handle errors
        mediaRecorder.onerror = (event) => {
            showError('An error occurred while recording. Please try again.');
            stopRecording();
        };

        // Start recording
        mediaRecorder.start(100); // Collect data every 100ms
        isRecording = true;

        // Update UI
        startBtn.disabled = true;
        stopBtn.disabled = false;
        transcribeBtn.disabled = true;
        recordingIndicator.classList.remove('hidden');
        resetBtn.classList.add('hidden');

    } catch (error) {
        console.error('Error starting recording:', error);
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            showError('Microphone access denied. Please allow microphone access and try again.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            showError('No microphone found. Please connect a microphone and try again.');
        } else {
            showError('Failed to start recording. Please check your microphone and try again.');
        }
    }
}

/**
 * Stop the current recording
 */
function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        
        // Update UI
        startBtn.disabled = false;
        stopBtn.disabled = true;
        recordingIndicator.classList.add('hidden');
    }
}

/**
 * Update UI after recording is complete
 */
function updateUIAfterRecording() {
    transcribeBtn.disabled = false;
    recordingIndicator.classList.add('hidden');
    
    // Show a message that audio is ready
    if (resultBox.querySelector('.placeholder')) {
        resultBox.innerHTML = '<p class="placeholder">Audio recorded! Click "Transcribe" to get your transcription.</p>';
    }
}

/**
 * Send audio to backend for transcription
 */
async function transcribeAudio() {
    if (!currentAudioBlob) {
        showError('No audio recorded. Please record audio first.');
        return;
    }

    try {
        hideError();
        
        // Show loading indicator
        loadingIndicator.classList.remove('hidden');
        transcribeBtn.disabled = true;
        resultBox.innerHTML = '';

        // Create FormData to send audio file
        const formData = new FormData();
        formData.append('file', currentAudioBlob, 'recording.webm');

        // Send to backend
        const response = await fetch(RECORD_ENDPOINT, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Server error: ${response.status}`);
        }

        const data = await response.json();
        
        // Display transcription
        displayTranscription(data.transcript);
        
        // Enable action buttons
        copyBtn.disabled = false;
        downloadBtn.disabled = false;
        resetBtn.classList.remove('hidden');

    } catch (error) {
        console.error('Transcription error:', error);
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            showError('Unable to connect to the server. Please make sure the backend is running on http://localhost:8000');
        } else if (error.message.includes('API key') || error.message.includes('authentication')) {
            showError('OpenAI API authentication failed. Please check your API key in the .env file.');
        } else {
            showError(`Transcription failed: ${error.message}`);
        }
        
        resultBox.innerHTML = '<p class="placeholder">Transcription failed. Please try again.</p>';
    } finally {
        // Hide loading indicator
        loadingIndicator.classList.add('hidden');
        transcribeBtn.disabled = false;
    }
}

/**
 * Display the transcription result
 */
function displayTranscription(text) {
    if (!text || text.trim() === '') {
        resultBox.innerHTML = '<p class="placeholder">No transcription available. The audio might be empty or unclear.</p>';
        return;
    }

    resultBox.innerHTML = `<p>${escapeHtml(text)}</p>`;
}

/**
 * Copy transcription to clipboard
 */
async function copyToClipboard() {
    const text = resultBox.querySelector('p')?.textContent;
    
    if (!text) {
        showError('No transcription to copy.');
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        
        // Visual feedback
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    } catch (error) {
        console.error('Failed to copy:', error);
        showError('Failed to copy to clipboard. Please try again.');
    }
}

/**
 * Download transcription as text file
 */
function downloadTranscript() {
    const text = resultBox.querySelector('p')?.textContent;
    
    if (!text) {
        showError('No transcription to download.');
        return;
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Reset the UI to initial state
 */
function resetUI() {
    // Reset state
    audioChunks = [];
    currentAudioBlob = null;
    isRecording = false;
    mediaRecorder = null;

    // Reset UI elements
    startBtn.disabled = false;
    stopBtn.disabled = true;
    transcribeBtn.disabled = true;
    copyBtn.disabled = true;
    downloadBtn.disabled = true;
    recordingIndicator.classList.add('hidden');
    loadingIndicator.classList.add('hidden');
    resetBtn.classList.add('hidden');
    resultBox.innerHTML = '<p class="placeholder">Your transcription will appear here...</p>';
    
    hideError();
}

/**
 * Show error message
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

/**
 * Hide error message
 */
function hideError() {
    errorMessage.classList.add('hidden');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

