// ============================================
// SECURITY: HTML ESCAPING TO PREVENT XSS
// ============================================
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================
// ESTADO DA APLICAÇÃO
// ============================================
let appState = {
  stories: [],
  filteredStories: [],
  currentStory: null
};

// ============================================
// STORY EXPANSION HELPER FUNCTIONS
// ============================================

/**
 * Get the next expansion level based on current level
 */
function getNextLevel(currentLevel) {
  const levels = { 5: 10, 10: 15, 15: 20, 20: null };
  return levels[currentLevel] || null;
}

/**
 * Get level label for display
 */
function getLevelLabel(level) {
  return `${level}-Line Story`;
}

// ============================================
// ERROR HANDLING & RETRY LOGIC
// ============================================

/**
 * Handle API errors with user-friendly messages
 */
function handleApiError(error, context = 'Operation') {
  console.error(`Error in ${context}:`, error);

  // Check if offline
  if (!navigator.onLine) {
    return 'You appear to be offline. Please check your internet connection and try again.';
  }

  // Rate limit errors
  if (error.status === 429 || error.message?.includes('429')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Authentication errors
  if (error.status === 401 || error.message?.includes('401')) {
    return 'Your session has expired. Please refresh the page and sign in again.';
  }

  // Server errors
  if (error.status >= 500) {
    return 'Our servers are experiencing issues. Please try again in a moment.';
  }

  // Network errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Default error message
  return error.message || 'Something went wrong. Please try again.';
}

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(url, options = {}, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response;
      }

      // Don't retry client errors (except 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        const error = new Error(`Request failed with status ${response.status}`);
        error.status = response.status;
        throw error;
      }

      // Retry with exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      const error = new Error(`Request failed with status ${response.status}`);
      error.status = response.status;
      throw error;

    } catch (err) {
      if (attempt < maxRetries && (err.message?.includes('fetch') || err.message?.includes('network'))) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Network error, retrying after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

// ============================================
// CARREGAR HISTÓRIAS
// ============================================
async function loadStories() {
  const loading = document.getElementById('loading');
  const storiesGrid = document.getElementById('storiesGrid');
  const emptyState = document.getElementById('emptyState');

  loading.classList.remove('hidden');
  storiesGrid.classList.add('hidden');
  emptyState.classList.add('hidden');

  try {
    const token = await window.Clerk.session.getToken();

    const response = await fetchWithRetry('/api/ai/history', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    loading.classList.add('hidden');

    if (data.success && data.conversations.length > 0) {
      appState.stories = data.conversations;
      appState.filteredStories = data.conversations;
      renderStories(data.conversations);
      storiesGrid.classList.remove('hidden');
    } else {
      emptyState.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error loading stories:', error);
    loading.classList.add('hidden');

    const errorMessage = handleApiError(error, 'loading stories');
    showNotification(errorMessage, 'error');

    // Show empty state with error message
    emptyState.classList.remove('hidden');
  }
}

// ============================================
// RENDERIZAR HISTÓRIAS (XSS PROTECTED + CSP COMPLIANT)
// ============================================
function renderStories(stories) {
  const grid = document.getElementById('storiesGrid');

  if (stories.length === 0) {
    document.getElementById('emptyState').classList.remove('hidden');
    grid.classList.add('hidden');
    return;
  }

  grid.innerHTML = stories.map(story => {
    const aiResponse = JSON.parse(story.ai_response);
    const date = new Date(story.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Get title or fallback to first 50 chars of first line
    const title = story.title || Object.values(aiResponse)[0]?.substring(0, 50) + '...' || 'Untitled Story';

    // Get story level (default to 5 if not set)
    const storyLevel = story.story_level || 5;
    const lineCount = Object.keys(aiResponse).length;
    const nextLevel = getNextLevel(storyLevel);

    // Get level badge color
    const getLevelBadgeColor = (level) => {
      const colors = {
        5: 'background: linear-gradient(135deg, #6366f1, #8b5cf6);',
        10: 'background: linear-gradient(135deg, #10b981, #059669);',
        15: 'background: linear-gradient(135deg, #f59e0b, #d97706);',
        20: 'background: linear-gradient(135deg, #ef4444, #dc2626);'
      };
      return colors[level] || colors[5];
    };

    return `
      <div class="story-card" data-story-id="${story.id}">
        <div class="story-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="story-date">${escapeHtml(date)}</div>
            <div style="
              display: inline-block;
              padding: 4px 10px;
              ${getLevelBadgeColor(storyLevel)}
              color: white;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 600;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            ">
              ${storyLevel} Lines
            </div>
          </div>
          <div class="story-actions">
            ${nextLevel ? `
              <button class="icon-button expand-btn" data-story-id="${story.id}" title="Expand to ${getLevelLabel(nextLevel)}">
                <svg class="icon">
                  <use href="#icon-sparkles"></use>
                </svg>
              </button>
            ` : ''}
            <button class="icon-button share-btn" data-story-id="${story.id}" title="Share">
              <svg class="icon">
                <use href="#icon-share"></use>
              </svg>
            </button>
            <button class="icon-button delete-btn" data-story-id="${story.id}" title="Delete">
              <svg class="icon">
                <use href="#icon-trash"></use>
              </svg>
            </button>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0; line-height: 1.4;">
            ${escapeHtml(title)}
          </h3>
        </div>

        <div class="story-preview">
          ${Object.entries(aiResponse).slice(0, 3).map(([key, value], index) => `
            <div class="story-line">
              <div class="line-number">${index + 1}</div>
              <div class="line-text">${escapeHtml(value)}</div>
            </div>
          `).join('')}
          ${lineCount > 3 ? `<div style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 8px;">... +${lineCount - 3} more lines</div>` : ''}
        </div>

        <div class="story-footer">
          <span>${story.tokens_used} tokens</span>
          <span>${lineCount} lines total</span>
        </div>
      </div>
    `;
  }).join('');

  // CRITICAL: Attach event listeners using event delegation (CSP compliant)
  attachStoryCardListeners();
}

// ============================================
// ATTACH EVENT LISTENERS (CSP COMPLIANT)
// ============================================
function attachStoryCardListeners() {
  const grid = document.getElementById('storiesGrid');

  // Guard: only attach once (event delegation pattern = single listener)
  if (grid.dataset.listenerAttached === 'true') {
    console.log('Event listeners already attached, skipping');
    return;
  }

  // Event delegation: single listener on grid for all story cards and buttons
  grid.addEventListener('click', (e) => {
    // Check if clicked on expand button
    const expandBtn = e.target.closest('.expand-btn');
    if (expandBtn) {
      e.stopPropagation(); // Don't trigger card click
      const storyId = expandBtn.dataset.storyId;
      // Set current story and show expansion modal
      const story = appState.stories.find(s => s.id === storyId);
      if (story) {
        appState.currentStory = story;
        console.log('Expand button clicked from story card, story:', storyId);
        showExpansionModal();
      }
      return;
    }

    // Check if clicked on share button
    const shareBtn = e.target.closest('.share-btn');
    if (shareBtn) {
      e.stopPropagation(); // Don't trigger card click
      const storyId = shareBtn.dataset.storyId;
      shareStory(storyId);
      return;
    }

    // Check if clicked on delete button
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      e.stopPropagation(); // Don't trigger card click
      const storyId = deleteBtn.dataset.storyId;
      deleteStory(storyId);
      return;
    }

    // Check if clicked on story card (but not on buttons)
    const storyCard = e.target.closest('.story-card');
    if (storyCard) {
      const storyId = storyCard.dataset.storyId;
      openStoryModal(storyId);
      return;
    }
  });

  // Mark as attached to prevent duplicate listeners
  grid.dataset.listenerAttached = 'true';
  console.log('Story card event listeners attached via event delegation');
}

// ============================================
// FILTRAR HISTÓRIAS
// ============================================
function filterStories() {
  const searchInput = document.getElementById('searchInput').value.toLowerCase();
  
  if (!searchInput) {
    appState.filteredStories = appState.stories;
  } else {
    appState.filteredStories = appState.stories.filter(story => {
      const aiResponse = JSON.parse(story.ai_response);
      const storyText = Object.values(aiResponse).join(' ').toLowerCase();
      const userInput = story.user_input.toLowerCase();
      
      return storyText.includes(searchInput) || userInput.includes(searchInput);
    });
  }
  
  renderStories(appState.filteredStories);
}

// ============================================
// ABRIR MODAL COM HISTÓRIA COMPLETA (XSS PROTECTED + EDITABLE)
// ============================================
function openStoryModal(storyId) {
  const story = appState.stories.find(s => s.id === storyId);
  if (!story) return;

  appState.currentStory = story;

  const aiResponse = JSON.parse(story.ai_response);
  const date = new Date(story.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const lineLabels = [
    'Context / Initial Situation',
    'Desire / Objective',
    'Obstacle / Conflict',
    'Action / Attempt',
    'Result / Transformation'
  ];

  // Get title or fallback
  const title = story.title || Object.values(aiResponse)[0]?.substring(0, 50) + '...' || 'Untitled Story';

  // Get story level (default to 5 if not set)
  const storyLevel = story.story_level || 5;
  const nextLevel = getNextLevel(storyLevel);

  document.getElementById('modalTitle').textContent = `Story from ${date}`;

  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <!-- Title Section (Editable) -->
    <div style="margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
        <span>Story Title</span>
        <button class="icon-button" id="editTitleBtn" title="Edit title">
          <svg class="icon icon-sm">
            <use href="#icon-edit"></use>
          </svg>
        </button>
      </div>
      <div id="titleDisplay" style="font-size: 20px; font-weight: 600; color: #111827; padding: 12px; background: #f9fafb; border-radius: 12px; cursor: pointer;">
        ${escapeHtml(title)}
      </div>
      <div id="titleEdit" class="hidden">
        <input
          type="text"
          id="titleInput"
          value="${escapeHtml(title)}"
          style="width: 100%; padding: 12px; border: 2px solid #6366f1; border-radius: 12px; font-size: 18px; font-weight: 600; font-family: inherit;"
        />
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <button class="btn btn-secondary" id="cancelTitleBtn" style="padding: 8px 16px;">Cancel</button>
          <button class="btn btn-primary" id="saveTitleBtn" style="padding: 8px 16px;">Save</button>
        </div>
      </div>
    </div>

    <!-- Story Level and Expand Button -->
    <div style="margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
        <div style="
          display: inline-block;
          padding: 8px 16px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        ">
          ${getLevelLabel(storyLevel)}
        </div>
        ${nextLevel ? `
          <button id="expand-story-modal-btn" class="btn btn-primary" style="padding: 10px 20px; font-size: 14px; font-weight: 600;">
            <svg class="icon icon-sm" style="vertical-align: middle;">
              <use href="#icon-sparkles"></use>
            </svg>
            Expand to ${getLevelLabel(nextLevel)}
          </button>
        ` : `
          <div style="padding: 8px 16px; background: #10b981; color: white; border-radius: 12px; font-size: 14px; font-weight: 600;">
            ✓ Maximum Level Reached
          </div>
        `}
      </div>
    </div>

    <!-- Original Input -->
    <div style="background: #f9fafb; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 8px;">
        Original Input
      </div>
      <div style="font-size: 14px; color: #374151; line-height: 1.6;">
        ${escapeHtml(story.user_input)}
      </div>
    </div>

    <!-- Story Lines (Editable) -->
    ${Object.entries(aiResponse).map(([key, value], index) => `
      <div class="modal-story-line" data-line-number="${index + 1}">
        <div class="modal-line-label">
          <div class="line-number">${index + 1}</div>
          <span>${escapeHtml(lineLabels[index])}</span>
          <button class="icon-button edit-line-btn" data-line="${index + 1}" title="Edit line" style="margin-left: auto;">
            <svg class="icon icon-sm">
              <use href="#icon-edit"></use>
            </svg>
          </button>
        </div>
        <div class="modal-line-content editable-line" id="lineDisplay-${index + 1}" data-line="${index + 1}">
          ${escapeHtml(value)}
        </div>
        <div id="lineEdit-${index + 1}" class="hidden">
          <textarea
            id="lineTextarea-${index + 1}"
            style="width: 100%; min-height: 100px; padding: 12px; border: 2px solid #6366f1; border-radius: 12px; font-size: 16px; font-family: inherit; resize: vertical;"
          >${escapeHtml(value)}</textarea>
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <button class="btn btn-secondary cancel-line-btn" data-line="${index + 1}" style="padding: 8px 16px;">Cancel</button>
            <button class="btn btn-primary save-line-btn" data-line="${index + 1}" style="padding: 8px 16px;">Save</button>
          </div>
        </div>
      </div>
    `).join('')}
  `;

  // Attach event listeners for editing
  attachModalEditListeners();

  document.getElementById('storyModal').classList.add('active');
}

// ============================================
// ATTACH MODAL EDIT LISTENERS (CSP COMPLIANT)
// ============================================
function attachModalEditListeners() {
  // Title editing
  const editTitleBtn = document.getElementById('editTitleBtn');
  const titleDisplay = document.getElementById('titleDisplay');
  const cancelTitleBtn = document.getElementById('cancelTitleBtn');
  const saveTitleBtn = document.getElementById('saveTitleBtn');

  if (editTitleBtn) {
    editTitleBtn.addEventListener('click', () => {
      document.getElementById('titleDisplay').classList.add('hidden');
      document.getElementById('titleEdit').classList.remove('hidden');
      document.getElementById('titleInput').focus();
    });
  }

  if (titleDisplay) {
    titleDisplay.addEventListener('click', () => {
      document.getElementById('titleDisplay').classList.add('hidden');
      document.getElementById('titleEdit').classList.remove('hidden');
      document.getElementById('titleInput').focus();
    });
  }

  if (cancelTitleBtn) {
    cancelTitleBtn.addEventListener('click', () => {
      document.getElementById('titleDisplay').classList.remove('hidden');
      document.getElementById('titleEdit').classList.add('hidden');
    });
  }

  if (saveTitleBtn) {
    saveTitleBtn.addEventListener('click', () => saveTitle());
  }

  // Expand story button
  const expandStoryBtn = document.getElementById('expand-story-modal-btn');
  if (expandStoryBtn) {
    expandStoryBtn.addEventListener('click', () => {
      console.log('Expand story button clicked from modal');
      showExpansionModal();
    });
  }

  // Line editing (event delegation for all edit buttons)
  const editLineBtns = document.querySelectorAll('.edit-line-btn');
  editLineBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent other handlers
      const lineNumber = btn.dataset.line; // Use btn instead of e.target to handle SVG clicks
      console.log('Edit line button clicked, line:', lineNumber);
      startEditLine(lineNumber);
    });
  });

  const cancelLineBtns = document.querySelectorAll('.cancel-line-btn');
  cancelLineBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent other handlers
      const lineNumber = btn.dataset.line; // Use btn instead of e.target
      console.log('Cancel line button clicked, line:', lineNumber);
      cancelEditLine(lineNumber);
    });
  });

  const saveLineBtns = document.querySelectorAll('.save-line-btn');
  saveLineBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent other handlers
      const lineNumber = btn.dataset.line; // Use btn instead of e.target
      console.log('Save line button clicked, line:', lineNumber);
      saveLine(lineNumber);
    });
  });

  console.log('Modal edit listeners attached');
}

// ============================================
// SAVE TITLE
// ============================================
async function saveTitle() {
  const newTitle = document.getElementById('titleInput').value.trim();

  if (!newTitle) {
    showNotification('Title cannot be empty', 'error');
    return;
  }

  if (!appState.currentStory) return;

  const saveTitleBtn = document.getElementById('saveTitleBtn');
  const originalText = saveTitleBtn.innerHTML;

  try {
    // Show loading state
    saveTitleBtn.disabled = true;
    saveTitleBtn.innerHTML = `
      <svg style="width: 16px; height: 16px; animation: spin 1s linear infinite; display: inline-block;" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
      </svg>
      <span style="margin-left: 4px;">Saving...</span>
    `;

    const token = await window.Clerk.session.getToken();

    const response = await fetchWithRetry(`/api/ai/update-story/${appState.currentStory.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title: newTitle })
    });

    const data = await response.json();

    if (data.success) {
      // Update local state
      appState.currentStory.title = newTitle;
      const storyIndex = appState.stories.findIndex(s => s.id === appState.currentStory.id);
      if (storyIndex !== -1) {
        appState.stories[storyIndex].title = newTitle;
      }

      // Update display
      document.getElementById('titleDisplay').textContent = newTitle;
      document.getElementById('titleDisplay').classList.remove('hidden');
      document.getElementById('titleEdit').classList.add('hidden');

      // Refresh the cards to show new title
      renderStories(appState.filteredStories);

      showNotification('Title updated successfully!', 'success');
    } else {
      showNotification('Error updating title: ' + data.error, 'error');
    }
  } catch (error) {
    const errorMessage = handleApiError(error, 'updating title');
    showNotification(errorMessage, 'error');
  } finally {
    // Restore button state
    saveTitleBtn.disabled = false;
    saveTitleBtn.innerHTML = originalText;
  }
}

// ============================================
// START EDIT LINE
// ============================================
function startEditLine(lineNumber) {
  document.getElementById(`lineDisplay-${lineNumber}`).classList.add('hidden');
  document.getElementById(`lineEdit-${lineNumber}`).classList.remove('hidden');
  document.getElementById(`lineTextarea-${lineNumber}`).focus();
}

// ============================================
// CANCEL EDIT LINE
// ============================================
function cancelEditLine(lineNumber) {
  document.getElementById(`lineDisplay-${lineNumber}`).classList.remove('hidden');
  document.getElementById(`lineEdit-${lineNumber}`).classList.add('hidden');
}

// ============================================
// SAVE LINE
// ============================================
async function saveLine(lineNumber) {
  const newText = document.getElementById(`lineTextarea-${lineNumber}`).value.trim();

  if (!newText) {
    showNotification('Line cannot be empty', 'error');
    return;
  }

  if (!appState.currentStory) return;

  const saveLineBtn = document.querySelector(`.save-line-btn[data-line="${lineNumber}"]`);
  const originalText = saveLineBtn.innerHTML;

  try {
    // Show loading state
    saveLineBtn.disabled = true;
    saveLineBtn.innerHTML = `
      <svg style="width: 16px; height: 16px; animation: spin 1s linear infinite; display: inline-block;" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
      </svg>
      <span style="margin-left: 4px;">Saving...</span>
    `;

    const token = await window.Clerk.session.getToken();

    // Update story object
    const aiResponse = JSON.parse(appState.currentStory.ai_response);
    aiResponse[`line${lineNumber}`] = newText;

    const response = await fetchWithRetry(`/api/ai/update-story/${appState.currentStory.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ai_response: JSON.stringify(aiResponse)
      })
    });

    const data = await response.json();

    if (data.success) {
      // Update local state
      appState.currentStory.ai_response = JSON.stringify(aiResponse);
      const storyIndex = appState.stories.findIndex(s => s.id === appState.currentStory.id);
      if (storyIndex !== -1) {
        appState.stories[storyIndex].ai_response = JSON.stringify(aiResponse);
      }

      // Update display
      document.getElementById(`lineDisplay-${lineNumber}`).textContent = newText;
      document.getElementById(`lineDisplay-${lineNumber}`).classList.remove('hidden');
      document.getElementById(`lineEdit-${lineNumber}`).classList.add('hidden');

      // Refresh the cards
      renderStories(appState.filteredStories);

      showNotification(`Line ${lineNumber} updated successfully!`, 'success');
    } else {
      showNotification('Error updating line: ' + data.error, 'error');
    }
  } catch (error) {
    const errorMessage = handleApiError(error, 'updating line');
    showNotification(errorMessage, 'error');
  } finally {
    // Restore button state
    saveLineBtn.disabled = false;
    saveLineBtn.innerHTML = originalText;
  }
}

// ============================================
// FECHAR MODAL
// ============================================
function closeModal() {
  document.getElementById('storyModal').classList.remove('active');
  appState.currentStory = null;
}

// Fechar modal ao clicar fora
document.getElementById('storyModal').addEventListener('click', (e) => {
  if (e.target.id === 'storyModal') {
    closeModal();
  }
});

// ============================================
// COMPARTILHAR HISTÓRIA
// ============================================
function shareStory(storyId) {
  const story = appState.stories.find(s => s.id === storyId);
  if (!story) return;
  
  const aiResponse = JSON.parse(story.ai_response);
  const storyText = Object.entries(aiResponse)
    .map(([key, value], index) => `${index + 1}. ${value}`)
    .join('\n\n');
  
  const fullText = `My Story:\n\n${storyText}\n\nCreated with StoryMaking.AI`;
  
  navigator.clipboard.writeText(fullText).then(() => {
    showNotification('Story copied to clipboard! 📋');
  }).catch(err => {
    alert('Could not copy to clipboard');
  });
}

function shareCurrentStory() {
  if (!appState.currentStory) return;
  shareStory(appState.currentStory.id);
}

// ============================================
// DELETAR HISTÓRIA
// ============================================
async function deleteStory(storyId) {
  if (!confirm('Delete this story? This action cannot be undone.')) {
    return;
  }

  // Find the delete button for this story
  const deleteBtn = document.querySelector(`.delete-btn[data-story-id="${storyId}"]`);
  let originalHTML = null;

  try {
    // Show loading state on button
    if (deleteBtn) {
      originalHTML = deleteBtn.innerHTML;
      deleteBtn.disabled = true;
      deleteBtn.innerHTML = `
        <svg style="width: 16px; height: 16px; animation: spin 1s linear infinite;" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>
      `;
    }

    const token = await window.Clerk.session.getToken();

    const response = await fetchWithRetry(`/api/ai/history/${storyId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (data.success) {
      showNotification('Story deleted successfully', 'success');
      // Remove from list
      appState.stories = appState.stories.filter(s => s.id !== storyId);
      appState.filteredStories = appState.filteredStories.filter(s => s.id !== storyId);
      renderStories(appState.filteredStories);

      // Close modal if deleting current story
      if (appState.currentStory && appState.currentStory.id === storyId) {
        closeModal();
      }
    } else {
      showNotification('Error deleting story: ' + data.error, 'error');
    }
  } catch (error) {
    const errorMessage = handleApiError(error, 'deleting story');
    showNotification(errorMessage, 'error');
  } finally {
    // Restore button state
    if (deleteBtn && originalHTML) {
      deleteBtn.disabled = false;
      deleteBtn.innerHTML = originalHTML;
    }
  }
}

// ============================================
// NOTIFICAÇÃO
// ============================================
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');

  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#6366f1'
  };

  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: ${colors[type] || colors.success};
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
    max-width: 400px;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, type === 'error' ? 5000 : 3000);
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// ============================================
// STORY EXPANSION FUNCTIONS
// ============================================

/**
 * Show expansion modal
 */
function showExpansionModal() {
  if (!appState.currentStory) {
    showNotification('Please select a story first before expanding it.', 'error');
    return;
  }

  const storyLevel = appState.currentStory.story_level || 5;
  const nextLevel = getNextLevel(storyLevel);

  if (!nextLevel) {
    showNotification('This story is already at the maximum level (20 lines).', 'info');
    return;
  }

  // Create modal
  const modal = document.createElement('div');
  modal.id = 'expansion-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
    padding: 20px;
  `;

  modal.innerHTML = `
    <div style="background: white; border-radius: 16px; padding: 32px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
      <h2 style="font-size: 24px; font-weight: 600; color: #111827; margin: 0 0 12px 0;">
        <svg class="icon icon-md" style="color: var(--purple-primary); vertical-align: middle;">
          <use href="#icon-sparkles"></use>
        </svg>
        Expand Your Story
      </h2>
      <p style="font-size: 16px; color: #6b7280; margin-bottom: 24px;">
        Expand from <strong>${getLevelLabel(storyLevel)}</strong> to <strong>${getLevelLabel(nextLevel)}</strong>
      </p>

      <div style="margin-bottom: 24px;">
        <label style="display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">
          What would you like to add to your story?
        </label>
        <p style="font-size: 13px; color: #6b7280; margin-bottom: 12px;">
          Provide additional details, context, or direction for the expansion
        </p>
        <textarea
          id="expansion-input"
          placeholder="Example: Add more details about the character's background and their motivations..."
          style="width: 100%; min-height: 150px; padding: 16px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 16px; font-family: inherit; resize: vertical;"
        ></textarea>
      </div>

      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button id="cancel-expansion-btn" class="btn btn-secondary" style="flex: 1;">
          Cancel
        </button>
        <button id="confirm-expansion-btn" class="btn btn-primary" style="flex: 2;">
          <svg class="icon icon-md">
            <use href="#icon-sparkles"></use>
          </svg>
          Expand Story
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Attach event listeners
  const cancelBtn = document.getElementById('cancel-expansion-btn');
  const confirmBtn = document.getElementById('confirm-expansion-btn');
  const expansionInput = document.getElementById('expansion-input');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => modal.remove());
  }

  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      const userInput = expansionInput.value.trim();
      if (!userInput) {
        showNotification('Please provide some input for the expansion', 'error');
        return;
      }

      modal.remove();
      await expandStory(userInput, nextLevel);
    });
  }

  expansionInput.focus();
}

/**
 * Expand story to next level
 */
async function expandStory(userInput, targetLevel) {
  if (!appState.currentStory) return;

  try {
    // Show loading notification
    showNotification(`Expanding your story to ${getLevelLabel(targetLevel)}... This may take 20-30 seconds.`, 'info');

    const token = await window.Clerk.session.getToken();

    const response = await fetchWithRetry('/api/ai/expand-story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        conversationId: appState.currentStory.id,
        targetLevel: targetLevel,
        userInput: userInput,
        inputType: 'text'
      })
    }, 3); // Allow more retries for expansion (can take longer)

    const data = await response.json();

    if (data.success) {
      showNotification(`Story successfully expanded to ${getLevelLabel(targetLevel)}! 🎉`, 'success');

      // Close current modal
      closeModal();

      // Reload stories to get updated data
      await loadStories();

      // Reopen the story modal with expanded version
      setTimeout(() => {
        const updatedStory = appState.stories.find(s => s.id === data.conversationId);
        if (updatedStory) {
          openStoryModal(updatedStory.id);
        }
      }, 500);
    } else {
      const errorMsg = data.error || 'Error expanding story';
      showNotification(errorMsg, 'error');
    }
  } catch (error) {
    console.error('Error expanding story:', error);
    const errorMessage = handleApiError(error, 'expanding story');
    showNotification(errorMessage, 'error');
  }
}

// ============================================
// ATALHOS DE TECLADO
// ============================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    // Also close expansion modal if open
    const expansionModal = document.getElementById('expansion-modal');
    if (expansionModal) {
      expansionModal.remove();
    }
  }
});
