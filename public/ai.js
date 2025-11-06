// ============================================
// SCRIPT LOADED CHECK
// ============================================
console.log('ai.js loaded successfully');
console.log('submitInput function will be defined below');

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
  currentStep: 1,
  userInput: '',
  suggestedPaths: [],
  selectedPath: null,
  customPath: '',
  currentStory: null,
  conversationId: null,
  editingLine: null,
  editingOriginalContent: null // Guardar conteúdo original para cancelar
};

// ============================================
// CARREGAR USO
// ============================================
async function loadUsage() {
  try {
    const token = await window.Clerk.session.getToken();
    
    const response = await fetch('/api/ai/usage', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const { stories } = data.usage;
      
      document.getElementById('usageText').textContent = 
        `${stories.remaining} stories remaining this month`;
      document.getElementById('usageNumbers').textContent = 
        `${stories.used}/${stories.limit} stories`;
      document.getElementById('progressFill').style.width = 
        `${stories.percentage}%`;
        
      if (stories.percentage > 80) {
        document.getElementById('progressFill').style.background = '#ef4444';
      } else if (stories.percentage > 60) {
        document.getElementById('progressFill').style.background = '#f59e0b';
      }
    }
  } catch (error) {
    console.error('Error loading usage:', error);
  }
}

// ============================================
// NAVEGAÇÃO ENTRE STEPS
// ============================================
function goToStep(stepNumber) {
  appState.currentStep = stepNumber;
  
  document.querySelectorAll('.step').forEach((step, index) => {
    step.classList.remove('active', 'completed');
    if (index + 1 === stepNumber) {
      step.classList.add('active');
    } else if (index + 1 < stepNumber) {
      step.classList.add('completed');
    }
  });
  
  document.getElementById('inputStep').classList.toggle('hidden', stepNumber !== 1);
  document.getElementById('pathStep').classList.toggle('hidden', stepNumber !== 2);
  document.getElementById('storyStep').classList.toggle('hidden', stepNumber !== 3);
}

// ============================================
// STEP 1: SUBMIT INPUT
// ============================================
async function submitInput() {
  const input = document.getElementById('userInput').value.trim();

  console.log('submitInput called, input length:', input.length);

  if (!input) {
    alert('Please enter your story idea');
    return;
  }

  if (input.length < 10) {
    alert('Please enter at least 10 characters for your story idea');
    return;
  }

  console.log('Input valid, proceeding...');
  appState.userInput = input;
  goToStep(2);

  document.getElementById('loading1').classList.remove('hidden');
  document.getElementById('pathsGrid').innerHTML = '';

  try {
    console.log('Getting Clerk token...');
    const token = await window.Clerk.session.getToken();
    console.log('Token obtained:', token ? 'YES' : 'NO');

    console.log('Sending request to /api/ai/suggest-paths');
    const response = await fetch('/api/ai/suggest-paths', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userInput: input })
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    document.getElementById('loading1').classList.add('hidden');

    if (data.success) {
      console.log('Success! Paths:', data.paths);
      appState.suggestedPaths = data.paths;
      renderPaths(data.paths);
      await loadUsage();
    } else if (data.error === 'Limit reached') {
      console.error('Limit reached:', data.message);
      alert(data.message);
      goToStep(1);
    } else {
      console.error('Error from server:', data.error, data.details);
      alert('Error generating paths: ' + data.error + (data.details ? '\n\nDetails: ' + JSON.stringify(data.details) : ''));
      goToStep(1);
    }
  } catch (error) {
    document.getElementById('loading1').classList.add('hidden');
    console.error('Exception in submitInput:', error);
    alert('Error connecting to server: ' + error.message);
    goToStep(1);
  }
}
console.log('submitInput function defined:', typeof submitInput);

// ============================================
// RENDERIZAR CAMINHOS (XSS PROTECTED + CSP COMPLIANT)
// ============================================
function renderPaths(paths) {
  console.log('renderPaths called with', paths.length, 'paths');
  const grid = document.getElementById('pathsGrid');

  // Render HTML without inline onclick (CSP blocks it)
  grid.innerHTML = paths.map((path, index) => `
    <div class="path-card" id="path-${index}" data-index="${index}">
      <div class="path-title">${escapeHtml(path.title)}</div>
      <div class="path-description">${escapeHtml(path.description)}</div>
      <div class="path-focus">${escapeHtml(path.focus)}</div>
    </div>
  `).join('');

  // CRITICAL: Add click handlers via addEventListener (CSP compliant)
  console.log('Attaching click handlers to path cards...');
  paths.forEach((path, index) => {
    const pathCard = document.getElementById(`path-${index}`);
    if (pathCard) {
      pathCard.addEventListener('click', function() {
        console.log(`Path card ${index} clicked:`, path.title);
        selectPath(index);
      });
      console.log(`Click handler attached to path-${index}`);
    } else {
      console.error(`Path card path-${index} not found!`);
    }
  });
  console.log('All path card handlers attached successfully');
}

// ============================================
// SELECIONAR CAMINHO
// ============================================
function selectPath(index) {
  console.log('selectPath called with index:', index);
  console.log('Available paths:', appState.suggestedPaths.length);

  // Remove 'selected' class from all cards
  document.querySelectorAll('.path-card').forEach(card => {
    card.classList.remove('selected');
  });

  // Add 'selected' class to clicked card
  const selectedCard = document.getElementById(`path-${index}`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
    console.log('Path card marked as selected:', selectedCard);
  } else {
    console.error('Could not find path card:', `path-${index}`);
  }

  // Store selected path in state
  appState.selectedPath = appState.suggestedPaths[index];
  console.log('Selected path:', appState.selectedPath);

  // Clear custom path input
  document.getElementById('customPath').value = '';
  appState.customPath = '';
}

// ============================================
// STEP 2: GERAR HISTÓRIA
// ============================================
async function generateStory() {
  const customPath = document.getElementById('customPath').value.trim();
  
  if (!appState.selectedPath && !customPath) {
    alert('Please select a path or describe your own');
    return;
  }
  
  if (customPath) {
    appState.customPath = customPath;
    appState.selectedPath = null;
  }
  
  goToStep(3);
  
  document.getElementById('loading2').classList.remove('hidden');
  document.getElementById('storyLines').innerHTML = '';
  
  try {
    const token = await window.Clerk.session.getToken();
    
    const response = await fetch('/api/ai/generate-story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userInput: appState.userInput,
        selectedPath: appState.selectedPath,
        customDescription: appState.customPath || null
      })
    });
    
    const data = await response.json();
    
    document.getElementById('loading2').classList.add('hidden');
    
    if (data.success) {
      appState.currentStory = data.story;
      appState.conversationId = data.conversationId;
      renderStory(data.story);
      await loadUsage();
      
      // Mostrar notificação de sucesso
      showNotification('✨ Story created successfully! You can edit any line or save it.');
    } else if (data.error === 'Limit reached') {
      alert(data.message);
      goToStep(2);
    } else {
      alert('Error generating story: ' + data.error);
      goToStep(2);
    }
  } catch (error) {
    document.getElementById('loading2').classList.add('hidden');
    console.error('Error:', error);
    alert('Error connecting to server');
    goToStep(2);
  }
}

// ============================================
// RENDERIZAR HISTÓRIA (XSS PROTECTED)
// ============================================
function renderStory(story) {
  const linesContainer = document.getElementById('storyLines');

  const lineLabels = [
    'Context / Initial Situation',
    'Desire / Objective',
    'Obstacle / Conflict',
    'Action / Attempt',
    'Result / Transformation'
  ];

  // Render HTML without onclick (CSP blocks it)
  linesContainer.innerHTML = Object.keys(story).map((key, index) => {
    const lineNumber = index + 1;
    return `
      <div class="story-line" id="line-container-${lineNumber}">
        <div class="line-label">
          <div class="line-number">${lineNumber}</div>
          <span>${escapeHtml(lineLabels[index])}</span>
        </div>
        <div class="line-content editable" id="line-content-${lineNumber}" data-line="${lineNumber}">
          ${escapeHtml(story[key])}
        </div>
      </div>
    `;
  }).join('');

  // CRITICAL: Attach click handlers via addEventListener (CSP compliant)
  console.log('Attaching click handlers to story lines...');
  for (let i = 1; i <= 5; i++) {
    const lineElement = document.getElementById(`line-content-${i}`);
    if (lineElement) {
      lineElement.addEventListener('click', function() {
        console.log(`Story line ${i} clicked for editing`);
        editLine(i);
      });
      console.log(`✓ Click handler attached to line ${i}`);
    }
  }
}

// ============================================
// EDITAR LINHA
// ============================================
async function editLine(lineNumber) {
  console.log(`editLine called for line ${lineNumber}`);

  // GUARD: If already editing this exact line, do nothing (prevents duplicate calls)
  if (appState.editingLine === lineNumber) {
    console.log(`Already editing line ${lineNumber}, ignoring duplicate call`);
    return;
  }

  // Se já está editando outra linha, salvar automaticamente
  if (appState.editingLine && appState.editingLine !== lineNumber) {
    await saveEditDirectly(false); // false = não mostrar notificação
  }

  appState.editingLine = lineNumber;

  const lineElement = document.getElementById(`line-content-${lineNumber}`);
  const currentText = lineElement.textContent.trim();

  // Guardar conteúdo original para poder cancelar
  appState.editingOriginalContent = currentText;

  lineElement.classList.add('editing');
  lineElement.classList.remove('editable');

  // Render editing UI without onclick (CSP blocks it)
  lineElement.innerHTML = `
    <textarea
      id="edit-textarea-${lineNumber}"
      style="width: 100%; min-height: 100px; padding: 12px; border: 2px solid #6366f1; border-radius: 8px; font-size: 16px; font-family: inherit; resize: vertical;"
    >${currentText}</textarea>
    <div style="display: flex; gap: 8px; margin-top: 12px; padding: 12px; background: white; align-items: center;">
      <button
        id="cancel-edit-btn-${lineNumber}"
        class="btn btn-secondary"
        style="padding: 10px 20px;"
      >
        Cancel
      </button>
      <button
        id="save-edit-btn-${lineNumber}"
        style="width: 40px; height: 40px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: all 0.2s;"
        title="Save"
      >
        ✓
      </button>
      <button
        id="refine-ai-btn-${lineNumber}"
        class="btn btn-primary"
        style="padding: 10px 20px; flex: 1;"
      >
        ✨ Refine with AI
      </button>
    </div>
  `;

  // CRITICAL: Attach event listeners (CSP compliant)
  const cancelBtn = document.getElementById(`cancel-edit-btn-${lineNumber}`);
  const saveBtn = document.getElementById(`save-edit-btn-${lineNumber}`);
  const refineBtn = document.getElementById(`refine-ai-btn-${lineNumber}`);

  if (cancelBtn) {
    cancelBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Cancel edit button clicked');
      cancelEdit();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Save edit button clicked');
      saveEditDirectly(true);
    });
    // Add hover effects via JavaScript
    saveBtn.addEventListener('mouseover', function() {
      this.style.background = '#059669';
    });
    saveBtn.addEventListener('mouseout', function() {
      this.style.background = '#10b981';
    });
  }

  if (refineBtn) {
    refineBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Refine with AI button clicked');
      saveEditWithAI();
    });
  }

  console.log('Edit mode activated with all event listeners attached');

  const textarea = document.getElementById(`edit-textarea-${lineNumber}`);
  if (textarea) {
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }
}

// ============================================
// CANCELAR EDIÇÃO
// ============================================
function cancelEdit() {
  if (!appState.editingLine) return;

  const lineNumber = appState.editingLine;
  const originalText = appState.editingOriginalContent;

  // Restaurar conteúdo original
  let lineElement = document.getElementById(`line-content-${lineNumber}`);
  lineElement.classList.remove('editing');
  lineElement.classList.add('editable');
  lineElement.textContent = originalText;

  // CRITICAL FIX: Clone element to remove ALL old event listeners (prevents accumulation)
  const newLineElement = lineElement.cloneNode(true);
  lineElement.replaceWith(newLineElement);
  lineElement = newLineElement;

  // Attach fresh click handler (CSP compliant)
  lineElement.addEventListener('click', function() {
    console.log(`Story line ${lineNumber} clicked for editing after cancel`);
    editLine(lineNumber);
  });

  // Limpar estado de edição
  appState.editingLine = null;
  appState.editingOriginalContent = null;

  console.log(`Edit cancelled for line ${lineNumber}, original text restored`);
}

// ============================================
// SALVAR DIRETAMENTE (SEM IA)
// ============================================
async function saveEditDirectly(showNotif = true) {
  if (!appState.editingLine) return;

  const lineNumber = appState.editingLine;
  const textarea = document.getElementById(`edit-textarea-${lineNumber}`);

  if (!textarea) return;

  const newText = textarea.value.trim();

  if (!newText) {
    alert('Please enter some text');
    return;
  }

  // Atualizar estado
  const lineKey = `line${lineNumber}`;
  appState.currentStory[lineKey] = newText;

  // Re-renderizar linha (sair do modo de edição)
  let lineElement = document.getElementById(`line-content-${lineNumber}`);
  lineElement.classList.remove('editing');
  lineElement.classList.add('editable');
  lineElement.textContent = newText;

  // CRITICAL FIX: Clone element to remove ALL old event listeners (prevents accumulation)
  const newLineElement = lineElement.cloneNode(true);
  lineElement.replaceWith(newLineElement);
  lineElement = newLineElement;

  // Attach fresh click handler (CSP compliant)
  lineElement.addEventListener('click', function() {
    console.log(`Story line ${lineNumber} clicked for editing after save`);
    editLine(lineNumber);
  });

  // Limpar estado de edição
  appState.editingLine = null;
  appState.editingOriginalContent = null;

  if (showNotif) {
    showNotification(`Line ${lineNumber} saved! ✅`);
  }

  console.log(`Line ${lineNumber} saved directly:`, newText.substring(0, 50) + '...');
}

// ============================================
// SALVAR COM IA
// ============================================
async function saveEditWithAI() {
  if (!appState.editingLine) return;
  
  const lineNumber = appState.editingLine;
  const textarea = document.getElementById(`edit-textarea-${lineNumber}`);
  
  if (!textarea) return;
  
  const newText = textarea.value.trim();
  
  if (!newText) {
    alert('Please enter your suggestion');
    return;
  }
  
  // Mostrar loading
  const lineElement = document.getElementById(`line-content-${lineNumber}`);
  lineElement.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="spinner"></div><p>Refining with AI...</p></div>';
  
  try {
    const token = await window.Clerk.session.getToken();
    
    const response = await fetch('/api/ai/refine-line', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        currentStory: appState.currentStory,
        lineNumber: lineNumber,
        userSuggestion: newText,
        conversationId: appState.conversationId
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      appState.currentStory = data.story;
      
      // Limpar estado de edição ANTES de re-renderizar
      appState.editingLine = null;
      appState.editingOriginalContent = null;
      
      renderStory(data.story);
      showNotification(`Line ${lineNumber} refined! ${data.explanation}`);
      await loadUsage();
    } else {
      alert('Error refining line: ' + data.error);
      cancelEdit();
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error connecting to server: ' + error.message);
    cancelEdit();
  }
}

// ============================================
// SALVAR E IR PARA HISTÓRICO
// ============================================
async function saveAndGoToHistory() {
  if (!appState.conversationId) {
    alert('No story to save!');
    return;
  }
  
  // A história já foi salva automaticamente quando foi criada
  // Apenas mostrar mensagem e redirecionar
  showNotification('💾 Story saved! Redirecting to history...', 2000);
  
  setTimeout(() => {
    window.location.href = '/history.html';
  }, 2000);
}

// ============================================
// NOTIFICAÇÃO
// ============================================
function showNotification(message, duration = 3000) {
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
  }, duration);
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
// START OVER
// ============================================
function startOver() {
  if (confirm('Start over? Your current story will be lost.')) {
    appState = {
      currentStep: 1,
      userInput: '',
      suggestedPaths: [],
      selectedPath: null,
      customPath: '',
      currentStory: null,
      conversationId: null,
      editingLine: null,
      editingOriginalContent: null
    };
    
    document.getElementById('userInput').value = '';
    document.getElementById('customPath').value = '';
    
    goToStep(1);
  }
}

// ============================================
// SHARE STORY
// ============================================
function shareStory() {
  if (!appState.currentStory) return;
  
  const storyText = Object.entries(appState.currentStory)
    .map(([key, value], index) => `${index + 1}. ${value}`)
    .join('\n\n');
  
  const fullText = `My 5 Lines Story:\n\n${storyText}\n\nCreated with 5 Lines Story ✨`;
  
  navigator.clipboard.writeText(fullText).then(() => {
    showNotification('Story copied to clipboard! 📋');
  }).catch(err => {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;

    // Render modal without onclick (CSP blocks it)
    modal.innerHTML = `
      <div style="background: white; border-radius: 16px; padding: 32px; max-width: 600px; margin: 20px;">
        <h3 style="margin-bottom: 16px;">Your Story</h3>
        <textarea readonly style="width: 100%; min-height: 300px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">${escapeHtml(fullText)}</textarea>
        <button id="close-story-modal-btn" class="btn btn-primary btn-full" style="margin-top: 16px;">Close</button>
      </div>
    `;

    document.body.appendChild(modal);

    // CRITICAL: Attach click handler via addEventListener (CSP compliant)
    const closeBtn = document.getElementById('close-story-modal-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Story modal close button clicked');
        modal.remove();
      });
    }

    // Allow clicking outside modal to close it
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        console.log('Clicked outside modal, closing');
        modal.remove();
      }
    });
  });
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && appState.editingLine) {
    cancelEdit();
  }
  
  if (e.ctrlKey && e.key === 'Enter' && appState.editingLine) {
    saveEditDirectly(true);
  }
  
  if (e.ctrlKey && e.shiftKey && e.key === 'Enter' && appState.editingLine) {
    saveEditWithAI();
  }
});
