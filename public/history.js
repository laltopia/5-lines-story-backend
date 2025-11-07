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
    
    const response = await fetch('/api/ai/history', {
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

    return `
      <div class="story-card" data-story-id="${story.id}">
        <div class="story-header">
          <div class="story-date">${escapeHtml(date)}</div>
          <div class="story-actions">
            <button class="icon-btn share-btn" data-story-id="${story.id}" title="Share">
              📤
            </button>
            <button class="icon-btn delete-btn" data-story-id="${story.id}" title="Delete">
              🗑️
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
          ${Object.keys(aiResponse).length > 3 ? '<div style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 8px;">... +2 more lines</div>' : ''}
        </div>

        <div class="story-footer">
          <span>${story.tokens_used} tokens</span>
          <span>5 lines</span>
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

  document.getElementById('modalTitle').textContent = `Story from ${date}`;

  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <!-- Title Section (Editable) -->
    <div style="margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
        <span>Story Title</span>
        <button class="icon-btn" id="editTitleBtn" title="Edit title" style="width: 28px; height: 28px; font-size: 14px;">
          ✏️
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
          <button class="icon-btn edit-line-btn" data-line="${index + 1}" title="Edit line" style="width: 28px; height: 28px; font-size: 14px; margin-left: auto;">
            ✏️
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

  // Line editing (event delegation for all edit buttons)
  const editLineBtns = document.querySelectorAll('.edit-line-btn');
  editLineBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const lineNumber = e.target.dataset.line;
      startEditLine(lineNumber);
    });
  });

  const cancelLineBtns = document.querySelectorAll('.cancel-line-btn');
  cancelLineBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const lineNumber = e.target.dataset.line;
      cancelEditLine(lineNumber);
    });
  });

  const saveLineBtns = document.querySelectorAll('.save-line-btn');
  saveLineBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const lineNumber = e.target.dataset.line;
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
    alert('Title cannot be empty');
    return;
  }

  if (!appState.currentStory) return;

  try {
    const token = await window.Clerk.session.getToken();

    const response = await fetch(`/api/ai/update-story/${appState.currentStory.id}`, {
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

      showNotification('Title updated! ✓');
    } else {
      alert('Error updating title: ' + data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error updating title');
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
    alert('Line cannot be empty');
    return;
  }

  if (!appState.currentStory) return;

  try {
    const token = await window.Clerk.session.getToken();

    // Update story object
    const aiResponse = JSON.parse(appState.currentStory.ai_response);
    aiResponse[`line${lineNumber}`] = newText;

    const response = await fetch(`/api/ai/update-story/${appState.currentStory.id}`, {
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

      showNotification(`Line ${lineNumber} updated! ✓`);
    } else {
      alert('Error updating line: ' + data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error updating line');
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
  
  const fullText = `My 5 Lines Story:\n\n${storyText}\n\nCreated with 5 Lines Story ✨`;
  
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
  
  try {
    const token = await window.Clerk.session.getToken();
    
    const response = await fetch(`/api/ai/history/${storyId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification('Story deleted successfully');
      // Remover da lista
      appState.stories = appState.stories.filter(s => s.id !== storyId);
      appState.filteredStories = appState.filteredStories.filter(s => s.id !== storyId);
      renderStories(appState.filteredStories);
    } else {
      alert('Error deleting story: ' + data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error deleting story');
  }
}

// ============================================
// NOTIFICAÇÃO
// ============================================
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
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
// ATALHOS DE TECLADO
// ============================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});
