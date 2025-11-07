# Audio & Document Input Implementation Guide
# StoryMaking.AI

**Document Version:** 1.0
**Created:** November 7, 2025
**Status:** Planning & Analysis
**Estimated Implementation Time:** 2-3 weeks

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Audio Input Implementation](#audio-input-implementation)
4. [Document Upload Implementation](#document-upload-implementation)
5. [Database Schema Changes](#database-schema-changes)
6. [API Changes](#api-changes)
7. [Frontend Changes](#frontend-changes)
8. [Security Considerations](#security-considerations)
9. [Cost Analysis](#cost-analysis)
10. [Performance Impact](#performance-impact)
11. [Implementation Roadmap](#implementation-roadmap)
12. [Testing Strategy](#testing-strategy)

---

## Executive Summary

This document outlines the implementation strategy for adding **Audio Input** (voice recording → text) and **Document Upload** (PDF, PPT, DOC → text) capabilities to StoryMaking.AI.

### Key Goals
- Maintain current 92 Lighthouse performance score
- Keep user experience intuitive and fast
- Minimize infrastructure costs
- Ensure security and data privacy
- Support multiple file formats and audio sources

### Estimated Impact
- **Development Time:** 2-3 weeks (1 week audio, 1 week documents, 1 week testing)
- **Monthly Cost:** $20-50 (depending on usage)
- **Performance:** Minimal impact if implemented correctly
- **User Experience:** Major improvement in accessibility and flexibility

---

## Current Architecture Analysis

### Text Input Flow (Current Implementation)

```
User Input (Text)
    ↓
Backend Validation (Joi schemas)
    ↓
Sanitization (XSS protection)
    ↓
Claude AI Processing
    ↓
Database Storage (conversations table)
    ↓
Response to Frontend
```

### Current Database Schema

**conversations table:**
```sql
- id (UUID)
- user_input (TEXT) ← Currently only text
- ai_response (JSONB)
- title (TEXT)
- prompt_used (TEXT)
- prompt_type (TEXT)
- user_id (TEXT)
- tokens_used (INTEGER)
- input_tokens (INTEGER)
- output_tokens (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Key Observations
1. ✅ **Single input source:** Currently only accepts text
2. ✅ **No file handling:** No storage for uploaded files
3. ✅ **No input type tracking:** Can't distinguish between text/audio/document
4. ✅ **Direct processing:** Text goes straight to Claude

---

## Audio Input Implementation

### Overview
Allow users to record voice input directly in the browser, transcribe it to text using a Speech-to-Text (STT) service, then process as normal text input.

### Recommended Approach: OpenAI Whisper API

**Why Whisper?**
- ✅ Best-in-class accuracy (trained on 680k hours of audio)
- ✅ Supports 99 languages
- ✅ Cost-effective ($0.006 per minute)
- ✅ Fast processing (< 5 seconds for 1 minute audio)
- ✅ Easy integration (REST API)
- ✅ Handles background noise well
- ✅ No minimum audio length

**Alternative Options:**
1. **Google Cloud Speech-to-Text** - More expensive but great accuracy
2. **AssemblyAI** - Good for long-form audio, more features
3. **Browser Web Speech API** - Free but limited browser support, privacy concerns

### Technical Implementation

#### 1. Frontend Changes

**Audio Recording Component:**
```javascript
// public/audio-recorder.js (new file)
class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
  }

  async startRecording() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm' // Widely supported
      });

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.start();
      return true;
    } catch (error) {
      console.error('Microphone access denied:', error);
      return false;
    }
  }

  stopRecording() {
    return new Promise((resolve) => {
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioChunks = [];

        // Stop all audio tracks
        this.stream.getTracks().forEach(track => track.stop());

        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  async transcribeAudio(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await fetch('/api/ai/transcribe', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Transcription failed');

    const data = await response.json();
    return data.text;
  }
}
```

**UI Updates:**
```html
<!-- Updated audio card in index.html -->
<div class="card" id="audioCard">
  <div class="card-icon">
    <svg class="icon icon-xl" id="audio-icon" style="color: var(--purple-primary);">
      <use href="#icon-mic"></use>
    </svg>
  </div>
  <h3 class="card-title">Audio</h3>
  <p class="card-description" id="audio-status">Tap to record your voice</p>

  <!-- Recording controls (initially hidden) -->
  <div class="audio-controls hidden" id="audio-controls">
    <button class="btn btn-danger" id="stop-recording">
      <svg class="icon"><use href="#icon-stop"></use></svg>
      Stop Recording
    </button>
    <span class="recording-timer" id="recording-timer">00:00</span>
  </div>

  <!-- Remove "Coming Soon" badge -->
</div>
```

#### 2. Backend Changes

**New Route: `/api/ai/transcribe`**

```javascript
// backend/routes/ai.js - Add new endpoint

const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');

// Configure multer for audio uploads (memory storage, max 25MB)
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB max (Whisper limit)
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files only
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// Transcribe audio to text using OpenAI Whisper
router.post('/transcribe',
  requireAuthentication,
  audioUpload.single('audio'),
  async (req, res) => {
    try {
      const userId = req.auth.userId;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No audio file uploaded'
        });
      }

      // Prepare form data for Whisper API
      const formData = new FormData();
      formData.append('file', req.file.buffer, {
        filename: 'audio.webm',
        contentType: req.file.mimetype
      });
      formData.append('model', 'whisper-1');
      formData.append('language', 'en'); // Auto-detect or specify language

      // Call OpenAI Whisper API
      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            ...formData.getHeaders()
          },
          timeout: 30000 // 30 second timeout
        }
      );

      const transcribedText = response.data.text;

      // Track audio transcription usage
      await supabase.from('usage_tracking').insert([{
        user_id: userId,
        prompt_type: 'audio_transcription',
        tokens_used: 0, // Whisper doesn't use tokens
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0.006 * (req.file.size / 1024 / 1024 / 60), // Approx cost
        conversation_id: null,
        metadata: {
          audio_duration_estimate: Math.round(req.file.size / 1024 / 16), // Rough estimate
          file_size: req.file.size,
          mime_type: req.file.mimetype
        }
      }]);

      res.json({
        success: true,
        text: transcribedText,
        metadata: {
          fileSize: req.file.size,
          mimeType: req.file.mimetype
        }
      });

    } catch (error) {
      console.error('Transcription error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to transcribe audio. Please try again.'
      });
    }
  }
);
```

#### 3. Database Changes

**Add input_type column to track source:**

```sql
-- database/add_input_types.sql

-- Add input_type column to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS input_type TEXT DEFAULT 'text'
CHECK (input_type IN ('text', 'audio', 'document'));

-- Add original_file_info for metadata
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS original_file_info JSONB;

-- Create index for filtering by input type
CREATE INDEX IF NOT EXISTS idx_conversations_input_type
ON conversations(input_type);

-- Add comment for clarity
COMMENT ON COLUMN conversations.input_type IS
'Type of input: text (typed), audio (voice), or document (uploaded file)';

COMMENT ON COLUMN conversations.original_file_info IS
'Metadata about original file: {fileName, fileSize, mimeType, duration, etc}';
```

#### 4. Environment Variables

Add to `.env`:
```bash
# OpenAI API Key for Whisper
OPENAI_API_KEY=sk-...your-key-here

# Optional: Whisper settings
WHISPER_MODEL=whisper-1
WHISPER_LANGUAGE=en  # or 'auto' for auto-detect
```

### Audio Input Flow Diagram

```
User clicks "Audio" card
    ↓
Request microphone permission
    ↓
User grants permission
    ↓
Start recording (MediaRecorder API)
    ↓
Show recording UI (timer, stop button)
    ↓
User stops recording
    ↓
Create audio Blob (webm format)
    ↓
Upload to /api/ai/transcribe
    ↓
Backend receives audio file
    ↓
Send to OpenAI Whisper API
    ↓
Receive transcribed text
    ↓
Return text to frontend
    ↓
Populate text input with transcribed text
    ↓
User can edit before submitting
    ↓
Continue with normal text flow
```

### Audio Best Practices

1. **Limit Recording Time:** 5 minutes max (reasonable for story input)
2. **Show Visual Feedback:** Waveform or pulsing icon while recording
3. **Allow Preview:** Let users replay before transcribing
4. **Editable Results:** Always show transcribed text in an editable field
5. **Error Handling:** Clear messages if mic access denied or transcription fails
6. **Cost Tracking:** Log each transcription for billing awareness

---

## Document Upload Implementation

### Overview
Allow users to upload documents (PDF, PPT, DOC, DOCX) and extract text content for story generation.

### Recommended Approach: Hybrid Solution

**For PDFs:** Use `pdf-parse` (Node.js library) - Fast, free, runs locally
**For Office Files:** Use LibreOffice (via `libreoffice-convert`) or Mammoth.js
**For Advanced OCR:** Use Tesseract.js or Google Cloud Vision API (if needed)

### Technical Implementation

#### 1. Frontend Changes

**File Upload Component:**
```javascript
// public/file-uploader.js (new file)
class FileUploader {
  constructor(maxSizeMB = 10) {
    this.maxSize = maxSizeMB * 1024 * 1024;
    this.acceptedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/msword', // DOC
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
      'application/vnd.ms-powerpoint', // PPT
      'text/plain' // TXT
    ];
  }

  validateFile(file) {
    // Check file size
    if (file.size > this.maxSize) {
      throw new Error(`File too large. Max size: ${this.maxSize / 1024 / 1024}MB`);
    }

    // Check file type
    if (!this.acceptedTypes.includes(file.type)) {
      throw new Error('Unsupported file type. Please upload PDF, DOC, DOCX, PPT, PPTX, or TXT');
    }

    return true;
  }

  async uploadAndExtract(file) {
    this.validateFile(file);

    const formData = new FormData();
    formData.append('document', file);

    const response = await fetch('/api/ai/extract-text', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'File upload failed');
    }

    const data = await response.json();
    return data.text;
  }
}
```

**UI Updates:**
```html
<!-- Updated document card in index.html -->
<div class="card" id="documentCard">
  <div class="card-icon">
    <svg class="icon icon-xl" id="doc-icon" style="color: var(--purple-primary);">
      <use href="#icon-file"></use>
    </svg>
  </div>
  <h3 class="card-title">Document</h3>
  <p class="card-description">Upload PDF, PPT, DOC</p>

  <!-- Hidden file input -->
  <input type="file"
         id="document-upload"
         accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
         style="display: none;">

  <!-- Upload status (initially hidden) -->
  <div class="upload-status hidden" id="upload-status">
    <div class="progress-bar">
      <div class="progress-fill" id="upload-progress"></div>
    </div>
    <p id="upload-message">Extracting text...</p>
  </div>
</div>
```

#### 2. Backend Changes

**Install Required Packages:**
```bash
npm install pdf-parse mammoth textract multer
```

**New Route: `/api/ai/extract-text`**

```javascript
// backend/routes/ai.js - Add new endpoint

const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const textract = require('textract');
const util = require('util');

// Configure multer for document uploads
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// Extract text from uploaded document
router.post('/extract-text',
  requireAuthentication,
  documentUpload.single('document'),
  async (req, res) => {
    try {
      const userId = req.auth.userId;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No document uploaded'
        });
      }

      let extractedText = '';
      const fileBuffer = req.file.buffer;
      const mimeType = req.file.mimetype;
      const fileName = req.file.originalname;

      // Extract text based on file type
      if (mimeType === 'application/pdf') {
        // PDF extraction
        const pdfData = await pdfParse(fileBuffer);
        extractedText = pdfData.text;
      }
      else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // DOCX extraction
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = result.value;
      }
      else if (mimeType === 'text/plain') {
        // Plain text
        extractedText = fileBuffer.toString('utf-8');
      }
      else {
        // For other formats (DOC, PPT, PPTX), use textract as fallback
        const extractAsync = util.promisify(textract.fromBufferWithMime);
        extractedText = await extractAsync(mimeType, fileBuffer);
      }

      // Clean up extracted text
      extractedText = extractedText
        .trim()
        .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
        .replace(/\s{2,}/g, ' '); // Remove excessive spaces

      // Check if extraction was successful
      if (!extractedText || extractedText.length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Could not extract text from document. File may be empty or corrupted.'
        });
      }

      // Limit text length (Claude has token limits)
      const maxLength = 50000; // ~12,500 tokens
      if (extractedText.length > maxLength) {
        extractedText = extractedText.substring(0, maxLength) + '\n\n[Content truncated due to length]';
      }

      // Track document extraction usage
      await supabase.from('usage_tracking').insert([{
        user_id: userId,
        prompt_type: 'document_extraction',
        tokens_used: 0,
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0, // Free for now
        conversation_id: null,
        metadata: {
          file_name: fileName,
          file_size: req.file.size,
          mime_type: mimeType,
          extracted_length: extractedText.length
        }
      }]);

      res.json({
        success: true,
        text: extractedText,
        metadata: {
          fileName: fileName,
          fileSize: req.file.size,
          mimeType: mimeType,
          extractedLength: extractedText.length
        }
      });

    } catch (error) {
      console.error('Text extraction error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to extract text from document. Please try again.'
      });
    }
  }
);
```

#### 3. Database Changes

Already covered in the Audio section - same `input_type` and `original_file_info` columns support document uploads.

### Document Upload Flow Diagram

```
User clicks "Document" card
    ↓
File picker opens
    ↓
User selects file (PDF, DOC, PPT, etc.)
    ↓
Frontend validates file (type, size)
    ↓
Show upload progress indicator
    ↓
Upload to /api/ai/extract-text
    ↓
Backend receives file
    ↓
Determine file type (PDF, DOCX, etc.)
    ↓
Extract text using appropriate library
    ↓
Clean and format extracted text
    ↓
Return text to frontend
    ↓
Populate text input with extracted text
    ↓
User can edit before submitting
    ↓
Continue with normal text flow
```

### Document Upload Best Practices

1. **File Size Limits:** 10MB max (reasonable for most documents)
2. **Supported Formats:** PDF, DOC, DOCX, PPT, PPTX, TXT
3. **Text Preview:** Show first 500 chars before extracting full document
4. **Progress Indicators:** Show upload and extraction progress
5. **Error Handling:** Clear messages for unsupported files or extraction failures
6. **Content Truncation:** Limit to 50k characters (~12.5k tokens for Claude)
7. **Security:** Scan for malicious content, validate file headers

---

## Database Schema Changes

### Complete SQL Migration

Create file: `database/add_audio_document_support.sql`

```sql
-- ============================================
-- AUDIO & DOCUMENT INPUT SUPPORT
-- ============================================
-- This migration adds support for audio and document inputs
-- to the StoryMaking.AI platform.
--
-- Features added:
-- 1. Input type tracking (text, audio, document)
-- 2. Original file metadata storage
-- 3. Indexes for performance
-- 4. Usage tracking updates
--
-- Run in Supabase SQL Editor
-- ============================================

-- Add input_type column to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS input_type TEXT DEFAULT 'text';

-- Add constraint to ensure valid input types
ALTER TABLE conversations
ADD CONSTRAINT conversations_input_type_check
CHECK (input_type IN ('text', 'audio', 'document'));

-- Add original_file_info for storing file metadata
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS original_file_info JSONB;

-- Create index for filtering by input type
CREATE INDEX IF NOT EXISTS idx_conversations_input_type
ON conversations(input_type);

-- Create index for file info queries (if needed)
CREATE INDEX IF NOT EXISTS idx_conversations_file_info
ON conversations USING gin(original_file_info);

-- Add comments for documentation
COMMENT ON COLUMN conversations.input_type IS
'Source of user input: text (typed), audio (voice recording), or document (uploaded file)';

COMMENT ON COLUMN conversations.original_file_info IS
'JSONB metadata about original file:
{
  "fileName": "example.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf",
  "duration": 120,  // for audio only
  "extractedLength": 5000  // for documents only
}';

-- Update usage_tracking table to support new prompt types
-- No schema change needed, but document the new types:
-- - 'audio_transcription': Audio to text conversion
-- - 'document_extraction': Document text extraction

-- Add metadata column to usage_tracking if not exists
ALTER TABLE usage_tracking
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create index for metadata queries
CREATE INDEX IF NOT EXISTS idx_usage_tracking_metadata
ON usage_tracking USING gin(metadata);

-- ============================================
-- BACKFILL EXISTING DATA (Optional)
-- ============================================

-- Set all existing conversations to 'text' type if null
UPDATE conversations
SET input_type = 'text'
WHERE input_type IS NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify column was added successfully
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'conversations'
  AND column_name IN ('input_type', 'original_file_info');

-- Check constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'conversations_input_type_check';

-- Count conversations by input type
SELECT
  input_type,
  COUNT(*) as count
FROM conversations
GROUP BY input_type;

-- ============================================
-- ROLLBACK (if needed)
-- ============================================

/*
-- To remove the changes (uncomment if needed):

DROP INDEX IF EXISTS idx_conversations_input_type;
DROP INDEX IF EXISTS idx_conversations_file_info;
DROP INDEX IF EXISTS idx_usage_tracking_metadata;

ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_input_type_check;
ALTER TABLE conversations DROP COLUMN IF EXISTS input_type;
ALTER TABLE conversations DROP COLUMN IF EXISTS original_file_info;
ALTER TABLE usage_tracking DROP COLUMN IF EXISTS metadata;
*/
```

---

## API Changes

### New Endpoints

#### 1. POST `/api/ai/transcribe`
**Purpose:** Transcribe audio to text

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `audio`: Audio file (webm, mp3, wav, etc.)

**Response:**
```json
{
  "success": true,
  "text": "Transcribed text content here...",
  "metadata": {
    "fileSize": 1024000,
    "mimeType": "audio/webm"
  }
}
```

**Rate Limits:**
- 10 requests per minute per user
- 25MB max file size

---

#### 2. POST `/api/ai/extract-text`
**Purpose:** Extract text from documents

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `document`: Document file (pdf, docx, pptx, etc.)

**Response:**
```json
{
  "success": true,
  "text": "Extracted text content here...",
  "metadata": {
    "fileName": "example.pdf",
    "fileSize": 2048000,
    "mimeType": "application/pdf",
    "extractedLength": 5000
  }
}
```

**Rate Limits:**
- 5 requests per minute per user
- 10MB max file size

---

#### 3. Modified: POST `/api/ai/generate-story`
**Changes:** Accept `inputType` and `originalFileInfo` fields

**Request (Updated):**
```json
{
  "userInput": "Transcribed or extracted text...",
  "selectedPath": {...},
  "inputType": "audio",  // NEW: "text", "audio", or "document"
  "originalFileInfo": {  // NEW: Metadata about source
    "fileName": "recording.webm",
    "fileSize": 1024000,
    "mimeType": "audio/webm",
    "duration": 120
  }
}
```

**Backend Update:**
```javascript
// In generate-story endpoint, add:
const { userInput, selectedPath, customDescription, inputType, originalFileInfo } = req.body;

// When saving conversation:
const { data: conversationData, error: convError } = await supabase
  .from('conversations')
  .insert([{
    user_input: userInput,
    ai_response: JSON.stringify(storyData.story),
    title: storyTitle,
    input_type: inputType || 'text',  // NEW
    original_file_info: originalFileInfo || null,  // NEW
    // ... rest of fields
  }])
```

---

## Frontend Changes

### UI/UX Updates

#### 1. Remove "Coming Soon" Badges
```javascript
// public/index.html, ai.html - Remove badges, make cards clickable

// Before:
<div class="card coming-soon" id="audioCard">
  ...
  <span class="badge">Coming Soon</span>
</div>

// After:
<div class="card" id="audioCard">
  ...
  <!-- No badge -->
</div>
```

#### 2. Add Recording UI (Modal)
```html
<!-- Add to index.html and ai.html -->
<div class="modal hidden" id="audio-modal">
  <div class="modal-content">
    <h2>Record Your Story Idea</h2>

    <!-- Recording status -->
    <div class="recording-visualizer" id="recording-viz">
      <div class="pulse-ring"></div>
      <svg class="icon icon-xl"><use href="#icon-mic"></use></svg>
    </div>

    <p class="recording-timer" id="timer">00:00</p>
    <p class="recording-hint">Speak clearly. Max 5 minutes.</p>

    <!-- Controls -->
    <div class="modal-actions">
      <button class="btn btn-secondary" id="cancel-recording">Cancel</button>
      <button class="btn btn-danger" id="stop-recording">
        <svg class="icon"><use href="#icon-stop"></use></svg>
        Stop & Transcribe
      </button>
    </div>
  </div>
</div>
```

#### 3. Add Document Upload UI
```javascript
// Trigger file picker on card click
document.getElementById('documentCard').addEventListener('click', () => {
  const fileInput = document.getElementById('document-upload');
  fileInput.click();
});

// Handle file selection
document.getElementById('document-upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    showUploadProgress();

    const uploader = new FileUploader();
    const extractedText = await uploader.uploadAndExtract(file);

    // Populate text input
    document.getElementById('userInput').value = extractedText;

    // Show success message
    showNotification('Text extracted successfully! Review and edit before submitting.', 'success');

    // Navigate to AI page if on index page
    if (window.location.pathname === '/') {
      window.location.href = '/ai.html';
    }

  } catch (error) {
    showNotification(error.message, 'error');
  } finally {
    hideUploadProgress();
    e.target.value = ''; // Reset input
  }
});
```

### Performance Considerations

1. **Lazy Loading:** Load audio/document libraries only when needed
2. **Progress Indicators:** Show upload/processing progress
3. **Chunked Uploads:** For large files (future enhancement)
4. **Client-Side Validation:** Validate before uploading
5. **Compression:** Compress audio on client before uploading (if needed)

---

## Security Considerations

### Audio Security

1. **File Type Validation:**
   - Check MIME type on backend
   - Validate file headers (magic bytes)
   - Reject executables disguised as audio

2. **Size Limits:**
   - Frontend: 25MB max
   - Backend: Enforce 25MB limit
   - Reject files that exceed limits

3. **Content Scanning:**
   - No viruses/malware in audio files (low risk)
   - Rate limit to prevent abuse

4. **Privacy:**
   - Don't store raw audio files (only transcripts)
   - Delete uploaded files after processing
   - Clear user data on request (GDPR)

### Document Security

1. **File Type Validation:**
   - Whitelist allowed MIME types
   - Validate file headers
   - Reject executables, scripts, macros

2. **Malware Scanning:**
   - Consider ClamAV integration (optional)
   - Sandbox document processing
   - Reject suspicious files

3. **Content Filtering:**
   - Strip macros from Office documents
   - Disable JavaScript in PDFs
   - Extract text only (no embedded objects)

4. **Rate Limiting:**
   - 5 uploads per minute per user
   - 50 uploads per day per user
   - Block abusive IPs

5. **Storage:**
   - Don't store original files (only extracted text)
   - Delete temporary files immediately
   - Use secure file permissions

### General Security

1. **Authentication:** All endpoints require valid Clerk session
2. **Authorization:** Users can only access their own data
3. **Input Sanitization:** Sanitize extracted text before Claude processing
4. **HTTPS Only:** All uploads over secure connections
5. **CORS:** Restrict to known domains
6. **API Keys:** Store in environment variables, rotate regularly

---

## Cost Analysis

### Audio Transcription (OpenAI Whisper)

**Pricing:** $0.006 per minute

**Monthly Cost Estimates:**

| Usage Scenario | Recordings/Month | Avg Duration | Monthly Cost |
|----------------|------------------|--------------|--------------|
| Light (10 users) | 50 | 2 min | $0.60 |
| Medium (100 users) | 500 | 2 min | $6.00 |
| Heavy (1,000 users) | 5,000 | 2 min | $60.00 |

**Cost per Recording:** ~$0.012 (for 2-minute recording)

### Document Extraction

**Pricing:** FREE (using open-source libraries)

- `pdf-parse`: Free
- `mammoth`: Free
- `textract`: Free (open-source)

**Infrastructure Cost:** Minimal (CPU usage)

### Total Estimated Costs

**For 100 Active Users:**
- Audio: $6/month
- Documents: $0/month
- Storage: $0/month (text only)
- **Total: ~$6-10/month**

**For 1,000 Active Users:**
- Audio: $60/month
- Documents: $0/month
- Storage: <$1/month
- **Total: ~$60-70/month**

### Cost Optimization Strategies

1. **Cache Transcriptions:** If same audio uploaded again, return cached result
2. **Compress Audio:** Reduce file size before sending to Whisper
3. **Batch Processing:** Process multiple documents in parallel
4. **Free Tier First:** Use Web Speech API as fallback (when available)
5. **User Quotas:** Limit free users to 5 audio transcriptions/month

---

## Performance Impact

### Expected Impact on Lighthouse Score

**Current Score:** 92/100

**After Implementation:**
- Expected Score: 90-92/100
- Minimal impact if implemented correctly

### Optimization Strategies

1. **Lazy Loading:**
   ```javascript
   // Load audio/document libraries only when needed
   async function loadAudioRecorder() {
     if (!window.AudioRecorder) {
       await import('./audio-recorder.js');
     }
   }
   ```

2. **Web Workers:**
   ```javascript
   // Process large documents in background thread
   const worker = new Worker('document-processor-worker.js');
   worker.postMessage({ file: arrayBuffer });
   ```

3. **Progressive Enhancement:**
   - Check for MediaRecorder support before showing audio option
   - Graceful degradation for older browsers

4. **Caching:**
   - Cache extracted text for same document
   - Cache transcriptions for same audio

5. **Compression:**
   - Compress audio on client (if possible)
   - Use efficient audio codecs (WebM, Opus)

### Performance Benchmarks (Estimated)

| Operation | Time | Impact |
|-----------|------|--------|
| Audio Recording Start | <100ms | None |
| Audio Upload (2min, 2MB) | 2-3s | Small |
| Whisper Transcription | 3-5s | None (backend) |
| Document Upload (5MB PDF) | 3-4s | Small |
| PDF Text Extraction | 1-2s | None (backend) |
| Total: Audio Flow | 6-10s | Acceptable |
| Total: Document Flow | 5-7s | Acceptable |

---

## Implementation Roadmap

### Phase 1: Audio Input (Week 1)

**Day 1-2: Backend Setup**
- [ ] Add OpenAI API key to environment
- [ ] Install dependencies (multer, form-data, axios)
- [ ] Create `/api/ai/transcribe` endpoint
- [ ] Test Whisper API integration
- [ ] Add error handling and validation

**Day 3-4: Frontend Implementation**
- [ ] Create AudioRecorder class
- [ ] Add recording UI (modal with timer)
- [ ] Implement start/stop recording
- [ ] Add transcription upload logic
- [ ] Test browser compatibility

**Day 5: Database & Integration**
- [ ] Run SQL migration (add input_type column)
- [ ] Update generate-story to save input_type
- [ ] Add usage tracking for transcriptions
- [ ] Test end-to-end flow

**Day 6-7: Testing & Polish**
- [ ] Test on various browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices
- [ ] Add loading states and error messages
- [ ] Performance testing
- [ ] User acceptance testing

### Phase 2: Document Upload (Week 2)

**Day 8-9: Backend Setup**
- [ ] Install dependencies (pdf-parse, mammoth, textract)
- [ ] Create `/api/ai/extract-text` endpoint
- [ ] Implement PDF extraction
- [ ] Implement DOCX extraction
- [ ] Test with various document types

**Day 10-11: Frontend Implementation**
- [ ] Create FileUploader class
- [ ] Add file picker trigger
- [ ] Add upload progress UI
- [ ] Implement file validation
- [ ] Add drag-and-drop support (optional)

**Day 12: Integration**
- [ ] Test document → text → story flow
- [ ] Add file metadata saving
- [ ] Test with large files
- [ ] Test with complex documents

**Day 13-14: Testing & Polish**
- [ ] Test various file formats
- [ ] Test edge cases (corrupted files, empty files)
- [ ] Performance optimization
- [ ] Security testing

### Phase 3: Testing & Deployment (Week 3)

**Day 15-16: Comprehensive Testing**
- [ ] End-to-end testing (all flows)
- [ ] Performance testing (Lighthouse)
- [ ] Security audit
- [ ] Cross-browser testing
- [ ] Mobile testing

**Day 17-18: Documentation & Training**
- [ ] Update user documentation
- [ ] Create video tutorials
- [ ] Update API documentation
- [ ] Train support team

**Day 19: Staging Deployment**
- [ ] Deploy to staging environment
- [ ] Run final tests
- [ ] Beta user testing
- [ ] Fix critical bugs

**Day 20-21: Production Deployment**
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Monitor performance metrics
- [ ] Monitor costs (Whisper API usage)
- [ ] Gather user feedback

---

## Testing Strategy

### Unit Tests

```javascript
// backend/__tests__/transcribe.test.js
describe('Audio Transcription', () => {
  test('should transcribe valid audio file', async () => {
    // Test implementation
  });

  test('should reject non-audio files', async () => {
    // Test implementation
  });

  test('should handle Whisper API errors', async () => {
    // Test implementation
  });
});

// backend/__tests__/extract-text.test.js
describe('Document Text Extraction', () => {
  test('should extract text from PDF', async () => {
    // Test implementation
  });

  test('should extract text from DOCX', async () => {
    // Test implementation
  });

  test('should handle corrupted files', async () => {
    // Test implementation
  });
});
```

### Integration Tests

```javascript
// backend/__tests__/audio-to-story.integration.test.js
describe('Audio to Story Flow', () => {
  test('should generate story from audio input', async () => {
    // 1. Upload audio
    // 2. Transcribe
    // 3. Generate story
    // 4. Save to database
    // 5. Verify result
  });
});
```

### Manual Testing Checklist

**Audio Testing:**
- [ ] Record short audio (10 seconds)
- [ ] Record long audio (5 minutes)
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on mobile (iOS)
- [ ] Test on mobile (Android)
- [ ] Test microphone permission denial
- [ ] Test poor audio quality
- [ ] Test background noise
- [ ] Test different languages

**Document Testing:**
- [ ] Upload small PDF (1 page)
- [ ] Upload large PDF (50+ pages)
- [ ] Upload DOCX with formatting
- [ ] Upload PPT with text
- [ ] Upload TXT file
- [ ] Test file size limit
- [ ] Test unsupported file type
- [ ] Test corrupted file
- [ ] Test empty file
- [ ] Test file with special characters

**Performance Testing:**
- [ ] Lighthouse score (target: 90+)
- [ ] Page load time
- [ ] Upload speed
- [ ] Processing time
- [ ] Memory usage

**Security Testing:**
- [ ] Upload executable disguised as audio
- [ ] Upload malicious PDF
- [ ] Test file size bomb
- [ ] Test rate limiting
- [ ] Test unauthorized access

---

## Appendix

### Alternative Solutions Considered

#### Audio Transcription

1. **Web Speech API (Browser Native)**
   - Pros: Free, no server needed
   - Cons: Limited browser support, privacy concerns, inconsistent quality
   - Verdict: Good as fallback, not primary solution

2. **Google Cloud Speech-to-Text**
   - Pros: Excellent accuracy, many features
   - Cons: More expensive ($0.016/min vs $0.006/min)
   - Verdict: Overkill for simple transcription

3. **AssemblyAI**
   - Pros: Good accuracy, nice features (speaker diarization)
   - Cons: More expensive, less established
   - Verdict: Consider for advanced features later

#### Document Parsing

1. **Textract (AWS)**
   - Pros: Handles everything, OCR for scanned docs
   - Cons: Expensive, requires AWS setup
   - Verdict: Overkill for text-based documents

2. **Apache Tika**
   - Pros: Handles many formats
   - Cons: Java dependency, complex setup
   - Verdict: Too heavyweight

3. **Client-Side Parsing (PDF.js)**
   - Pros: No backend needed
   - Cons: Performance impact, limited formats
   - Verdict: Consider for simple PDFs only

### Dependencies

**Backend:**
```json
{
  "multer": "^1.4.5-lts.1",
  "form-data": "^4.0.0",
  "axios": "^1.6.0",
  "pdf-parse": "^1.1.1",
  "mammoth": "^1.6.0",
  "textract": "^2.5.0"
}
```

**Frontend:**
None (using native browser APIs)

### Environment Variables

```bash
# Add to .env file

# OpenAI Whisper API
OPENAI_API_KEY=sk-...your-key-here
WHISPER_MODEL=whisper-1
WHISPER_LANGUAGE=en  # or 'auto'

# File Upload Limits
MAX_AUDIO_SIZE_MB=25
MAX_DOCUMENT_SIZE_MB=10

# Rate Limiting
AUDIO_RATE_LIMIT=10  # per minute per user
DOCUMENT_RATE_LIMIT=5  # per minute per user
```

---

## Questions & Answers

**Q: Why OpenAI Whisper instead of browser Web Speech API?**
A: Web Speech API is free but has inconsistent browser support, privacy concerns, and lower accuracy. Whisper provides consistent high-quality transcription across all devices for a low cost ($0.006/min).

**Q: Why not store original audio/document files?**
A: Storing only text reduces storage costs, improves privacy, and eliminates security risks from malicious files. We extract what we need and discard the rest.

**Q: What about offline support?**
A: Audio recording can work offline, but transcription and document extraction require backend processing. We could add offline support later using client-side libraries, but at a performance cost.

**Q: How do we handle very large documents?**
A: We truncate at 50,000 characters (~12,500 tokens) to stay within Claude's limits. For most use cases (story ideas), this is more than enough.

**Q: What about video files?**
A: Not in scope for initial implementation. Future enhancement could extract audio from video and transcribe.

**Q: Can users edit transcribed/extracted text?**
A: Yes! Text is always shown in an editable field before story generation. Users can review and correct any transcription errors.

---

**Document End**

For questions or clarifications, contact the development team.
