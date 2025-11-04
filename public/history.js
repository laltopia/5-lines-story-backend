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
// RENDERIZAR HISTÓRIAS
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
    
    return `
      <div class="story-card" onclick="openStoryModal('${story.id}')">
        <div class="story-header">
          <div class="story-date">${date}</div>
          <div class="story-actions" onclick="event.stopPropagation()">
            <button class="icon-btn" onclick="shareStory('${story.id}')" title="Share">
              📤
            </button>
            <button class="icon-btn" onclick="deleteStory('${story.id}')" title="Delete">
              🗑️
            </button>
          </div>
        </div>
        
        <div class="story-preview">
          ${Object.entries(aiResponse).slice(0, 3).map(([key, value], index) => `
            <div class="story-line">
              <div class="line-number">${index + 1}</div>
              <div class="line-text">${value}</div>
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
// ABRIR MODAL COM HISTÓRIA COMPLETA
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
  
  document.getElementById('modalTitle').textContent = `Story from ${date}`;
  
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <div style="background: #f9fafb; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 8px;">
        Original Input
      </div>
      <div style="font-size: 14px; color: #374151; line-height: 1.6;">
        ${story.user_input}
      </div>
    </div>
    
    ${Object.entries(aiResponse).map(([key, value], index) => `
      <div class="modal-story-line">
        <div class="modal-line-label">
          <div class="line-number">${index + 1}</div>
          <span>${lineLabels[index]}</span>
        </div>
        <div class="modal-line-content">${value}</div>
      </div>
    `).join('')}
  `;
  
  document.getElementById('storyModal').classList.add('active');
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
