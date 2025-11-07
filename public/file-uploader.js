/**
 * FileUploader - Client-side document upload and text extraction
 * StoryMaking.AI
 *
 * Handles file selection, validation, upload, and text extraction
 * for PDF, DOC, DOCX, PPT, PPTX, and TXT files.
 */

class FileUploader {
  constructor(options = {}) {
    this.maxSizeMB = options.maxSizeMB || 10;
    this.maxSize = this.maxSizeMB * 1024 * 1024;

    this.acceptedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/msword', // DOC
      'text/plain' // TXT
    ];

    this.acceptedExtensions = ['.pdf', '.doc', '.docx', '.txt'];

    this.onProgress = options.onProgress || null;
    this.onError = options.onError || null;
    this.onSuccess = options.onSuccess || null;
  }

  /**
   * Validate file before upload
   * @param {File} file - The file to validate
   * @returns {Object} - { valid: boolean, error?: string }
   */
  validateFile(file) {
    // Check file exists
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    // Check file size
    if (file.size > this.maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${this.maxSizeMB}MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`
      };
    }

    // Check file size minimum
    if (file.size < 100) {
      return {
        valid: false,
        error: 'File is too small or empty'
      };
    }

    // Check file type by MIME type
    if (!this.acceptedTypes.includes(file.type)) {
      // Fallback: check by extension
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      if (!this.acceptedExtensions.includes(extension)) {
        return {
          valid: false,
          error: 'Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files.'
        };
      }
    }

    return { valid: true };
  }

  /**
   * Upload file and extract text
   * @param {File} file - The file to upload
   * @returns {Promise<{text: string, metadata: Object}>}
   */
  async uploadAndExtract(file) {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      const error = new Error(validation.error);
      if (this.onError) this.onError(error);
      throw error;
    }

    try {
      // Create form data
      const formData = new FormData();
      formData.append('document', file);

      // Call progress callback
      if (this.onProgress) {
        this.onProgress({ status: 'uploading', progress: 0 });
      }

      // Upload file
      const response = await fetch('/api/ai/extract-text', {
        method: 'POST',
        body: formData,
        // Note: Don't set Content-Type header, browser will set it with boundary
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Upload failed: ${response.status}`;
        throw new Error(errorMessage);
      }

      // Call progress callback
      if (this.onProgress) {
        this.onProgress({ status: 'extracting', progress: 50 });
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
      console.error('Upload error:', error);
      if (this.onError) this.onError(error);
      throw error;
    }
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

  /**
   * Get file icon based on type
   * @param {string} mimeType
   * @returns {string} Icon name
   */
  static getFileIcon(mimeType) {
    if (mimeType.includes('pdf')) return 'file-pdf';
    if (mimeType.includes('word')) return 'file-word';
    if (mimeType.includes('text')) return 'file-text';
    return 'file';
  }
}

// Export for use in modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FileUploader;
}
