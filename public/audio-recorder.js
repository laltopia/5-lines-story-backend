/**
 * AudioRecorder - Client-side audio recording and transcription
 * StoryMaking.AI
 *
 * Handles audio recording, file selection, upload, and transcription
 * using the MediaRecorder API and OpenAI Whisper via backend.
 */

class AudioRecorder {
  constructor(options = {}) {
    this.maxSizeMB = options.maxSizeMB || 25;
    this.maxSize = this.maxSizeMB * 1024 * 1024;
    this.maxDurationSeconds = options.maxDurationSeconds || 600; // 10 minutes default

    this.acceptedTypes = [
      'audio/webm',
      'audio/mp3',
      'audio/mpeg',
      'audio/wav',
      'audio/m4a',
      'audio/mp4',
      'audio/x-m4a'
    ];

    this.acceptedExtensions = ['.webm', '.mp3', '.wav', '.m4a', '.mpeg'];

    this.onProgress = options.onProgress || null;
    this.onError = options.onError || null;
    this.onSuccess = options.onSuccess || null;

    // Recording state
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordingStartTime = null;
    this.recordingTimer = null;
    this.stream = null;
  }

  /**
   * Check if browser supports audio recording
   * @returns {boolean}
   */
  static isRecordingSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }

  /**
   * Validate audio file before upload
   * @param {File} file - The file to validate
   * @returns {Object} - { valid: boolean, error?: string }
   */
  validateFile(file) {
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    if (file.size > this.maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${this.maxSizeMB}MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`
      };
    }

    if (file.size < 1000) {
      return {
        valid: false,
        error: 'File is too small or empty'
      };
    }

    // Check file type
    if (!this.acceptedTypes.includes(file.type)) {
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      if (!this.acceptedExtensions.includes(extension)) {
        return {
          valid: false,
          error: 'Unsupported audio format. Please upload WEBM, MP3, WAV, or M4A files.'
        };
      }
    }

    return { valid: true };
  }

  /**
   * Start recording audio
   * @returns {Promise<void>}
   */
  async startRecording() {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

      this.audioChunks = [];
      this.recordingStartTime = Date.now();

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second

      // Start timer for max duration
      this.recordingTimer = setTimeout(() => {
        this.stopRecording();
      }, this.maxDurationSeconds * 1000);

      if (this.onProgress) {
        this.onProgress({ status: 'recording', duration: 0 });
      }

      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      if (this.onError) this.onError(error);
      throw new Error('Failed to access microphone. Please check permissions.');
    }
  }

  /**
   * Stop recording audio
   * @returns {Promise<Blob>}
   */
  stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('No active recording'));
        return;
      }

      clearTimeout(this.recordingTimer);

      this.mediaRecorder.onstop = () => {
        // Create audio blob
        const mimeType = this.mediaRecorder.mimeType;
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });

        // Calculate duration
        const duration = Math.round((Date.now() - this.recordingStartTime) / 1000);

        // Stop all tracks
        this.stream.getTracks().forEach(track => track.stop());

        if (this.onProgress) {
          this.onProgress({ status: 'stopped', duration });
        }

        console.log(`Recording stopped. Duration: ${duration}s, Size: ${audioBlob.size} bytes`);
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Cancel recording
   */
  cancelRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      clearTimeout(this.recordingTimer);
      this.mediaRecorder.stop();
      this.stream.getTracks().forEach(track => track.stop());
      this.audioChunks = [];

      if (this.onProgress) {
        this.onProgress({ status: 'cancelled' });
      }
    }
  }

  /**
   * Get current recording duration
   * @returns {number} Duration in seconds
   */
  getRecordingDuration() {
    if (!this.recordingStartTime) return 0;
    return Math.round((Date.now() - this.recordingStartTime) / 1000);
  }

  /**
   * Upload and transcribe audio
   * @param {File|Blob} audio - Audio file or blob to transcribe
   * @param {string} fileName - Optional filename for blob
   * @returns {Promise<{text: string, metadata: Object}>}
   */
  async uploadAndTranscribe(audio, fileName = 'recording.webm') {
    try {
      // Convert Blob to File if needed
      let audioFile = audio;
      if (audio instanceof Blob && !(audio instanceof File)) {
        audioFile = new File([audio], fileName, { type: audio.type });
      }

      // Validate file
      const validation = this.validateFile(audioFile);
      if (!validation.valid) {
        const error = new Error(validation.error);
        if (this.onError) this.onError(error);
        throw error;
      }

      // Get authentication token
      if (!window.Clerk || !window.Clerk.session) {
        throw new Error('You must be logged in to transcribe audio');
      }

      const token = await window.Clerk.session.getToken();
      if (!token) {
        throw new Error('Authentication failed. Please refresh and try again.');
      }

      // Create form data
      const formData = new FormData();
      formData.append('audio', audioFile);

      // Call progress callback
      if (this.onProgress) {
        this.onProgress({ status: 'uploading', progress: 0 });
      }

      // Upload and transcribe
      const response = await fetch('/api/ai/transcribe-audio', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Transcription failed: ${response.status}`;
        throw new Error(errorMessage);
      }

      // Call progress callback
      if (this.onProgress) {
        this.onProgress({ status: 'transcribing', progress: 50 });
      }

      const data = await response.json();

      // Call progress callback
      if (this.onProgress) {
        this.onProgress({ status: 'complete', progress: 100 });
      }

      // Call success callback
      if (this.onSuccess) {
        this.onSuccess(data);
      }

      return {
        text: data.text,
        metadata: data.metadata
      };

    } catch (error) {
      console.error('Transcription error:', error);
      if (this.onError) this.onError(error);
      throw error;
    }
  }

  /**
   * Format duration for display (MM:SS)
   * @param {number} seconds
   * @returns {string}
   */
  static formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format file size for display
   * @param {number} bytes
   * @returns {string}
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Export for use in modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioRecorder;
}

// Log that AudioRecorder is loaded
console.log('AudioRecorder class loaded successfully');
