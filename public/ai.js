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
  editingLine: null
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
        
      // Mudar cor se próximo do limite
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
  // Atualizar estado
  appState.currentStep = stepNumber;
  
  // Atualizar UI dos steps
  document.querySelectorAll('.step').forEach((step, index) => {
    step.classList.remove('active', 'completed');
    if (index + 1 === stepNumber) {
      step.classList.add('active');
    } else if (index + 1 < stepNumber) {
      step.classList.add('completed');
    }
  });
  
  // Mostrar/esconder cards
  document.getElementById('inputStep').classList.toggle('hidden', stepNumber !== 1);
  document.getElementById('pathStep').classList.toggle('hidden', stepNumber !== 2);
  document.getElementById('storyStep').classList.toggle('hidden', stepNumber !== 3);
}

// ============================================
// STEP 1: SUBMIT INPUT
// ============================================
async function submitInput() {
  const input = document.getElementById('userInput').value.trim();
  
  if (!input) {
    alert('Please enter your story idea');
    return;
  }
  
  appState.userInput = input;
  
  // Ir para step 2
  goToStep(2);
  
  // Mostrar loading
  document.getElementById('loading1').classList.remove('hidden');
  document.getElementById('pathsGrid').innerHTML = '';
  
  try {
    const token = await window.Clerk.session.getToken();
    
    const response = await fetch('/api/ai/suggest-paths', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userInput: input })
    });
    
    const data = await response.json();
    
    document.getElementById('loading1').classList.add('hidden');
    
    if (data.success) {
      appState.suggestedPaths = data.paths;
      renderPaths(data.paths);
      
      // Atualizar uso
      await loadUsage();
    } else if (data.error === 'Limit reached') {
      alert(data.message);
      goToStep(1);
    } else {
      alert('Error generating paths: ' + data.error);
      goToStep(1);
    }
  } catch (error) {
    document.getElementById('loading1').classList.add('hidden');
    console.error('Error:', error);
    alert('Error connecting to server');
    goToStep(1);
  }
}

// ============================================
// RENDERIZAR CAMINHOS
// ============================================
function renderPaths(paths) {
  const grid = document.getElementById('pathsGrid');
  
  grid.innerHTML = paths.map((path, index) => `
    <div class="path-card" onclick="selectPath(${index})" id="path-${index}">
      <div class="path-title">${path.title}</div>
      <div class="path-description">${path.description}</div>
      <div class="path-focus">${path.focus}</div>
    </div>
  `).join('');
}

// ============================================
// SELECIONAR CAMINHO
// ============================================
function selectPath(index) {
  // Remover seleção anterior
  document.querySelectorAll('.path-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  // Selecionar novo
  document.getElementById(`path-${index}`).classList.add('selected');
  appState.selectedPath = appState.suggestedPaths[index];
  
  // Limpar custom path se tinha
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
    appState.selectedPath = null; // Custom sobrescreve seleção
  }
  
  // Ir para step 3
  goToStep(3);
  
  // Mostrar loading
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
      
      // Atualizar uso
      await loadUsage();
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
// RENDERIZAR HISTÓRIA
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
  
  linesContainer.innerHTML = Object.keys(story).map((key, index) => {
    const lineNumber = index + 1;
    return `
      <div class="story-line" id="line-container-${lineNumber}">
        <div class="line-label">
          <div class="line-number">${lineNumber}</div>
          <span>${lineLabels[index]}</span>
        </div>
        <div class="line-content editable" id="line-content-${lineNumber}" onclick="editLine(${lineNumber})">
          ${story[key]}
        </div>
      </div>
    `;
  }).join('');
}

// ============================================
// EDITAR LINHA
// ============================================
function editLine(lineNumber) {
  console.log('Editing line:', lineNumber);
  
  if (appState.editingLine && appState.editingLine !== lineNumber) {
    // Já está editando outra linha, cancela
    cancelEdit();
  }
  
  appState.editingLine = lineNumber;
  
  const lineElement = document.getElementById(`line-content-${lineNumber}`);
  const currentText = lineElement.textContent.trim();
  
  console.log('Current text:', currentText);
  
  lineElement.classList.add('editing');
  lineElement.classList.remove('editable');
  lineElement.onclick = null; // Remove click handler
  
  lineElement.innerHTML = `
    <textarea id="edit-textarea-${lineNumber}" style="width: 100%; min-height: 100px; padding: 12px; border: 2px solid #6366f1; border-radius: 8px; font-size: 16px; font-family: inherit; resize: vertical;">${currentText}</textarea>
    <div style="display: flex; gap: 8px; margin-top: 12px; padding: 12px; background: white;">
      <button class="btn btn-secondary" onclick="cancelEdit()" style="padding: 10px 20px;">Cancel</button>
      <button class="btn btn-primary" onclick="saveEdit()" style="padding: 10px 20px;">💫 Refine with AI</button>
    </div>
  `;
  
  // Focus no textarea
  const textarea = document.getElementById(`edit-textarea-${lineNumber}`);
  if (textarea) {
    textarea.focus();
    // Coloca cursor no final
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }
}

// ============================================
// CANCELAR EDIÇÃO
// ============================================
function cancelEdit() {
  console.log('Canceling edit for line:', appState.editingLine);
  
  if (!appState.editingLine) return;
  
  const lineNumber = appState.editingLine;
  const lineKey = `line${lineNumber}`;
  const originalText = appState.currentStory[lineKey];
  
  const lineElement = document.getElementById(`line-content-${lineNumber}`);
  lineElement.classList.remove('editing');
  lineElement.classList.add('editable');
  lineElement.textContent = originalText;
  lineElement.onclick = () => editLine(lineNumber); // Restaura click handler
  
  appState.editingLine = null;
}

// ============================================
// SALVAR EDIÇÃO (REFINAR COM IA)
// ============================================
async function saveEdit() {
  console.log('Saving edit for line:', appState.editingLine);
  
  if (!appState.editingLine) return;
  
  const lineNumber = appState.editingLine;
  const textarea = document.getElementById(`edit-textarea-${lineNumber}`);
  
  if (!textarea) {
    console.error('Textarea not found');
    return;
  }
  
  const newText = textarea.value.trim();
  
  if (!newText) {
    alert('Please enter your suggestion');
    return;
  }
  
  console.log('New text:', newText);
  
  // Mostrar loading
  const lineElement = document.getElementById(`line-content-${lineNumber}`);
  lineElement.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="spinner"></div><p>Refining...</p></div>';
  
  try {
    const token = await window.Clerk.session.getToken();
    
    console.log('Calling API with:', {
      currentStory: appState.currentStory,
      lineNumber: lineNumber,
      userSuggestion: newText,
      conversationId: appState.conversationId
    });
    
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
    
    console.log('API response:', data);
    
    if (data.success) {
      // Atualizar estado com nova história
      appState.currentStory = data.story;
      appState.editingLine = null;
      
      // Re-renderizar história completa
      renderStory(data.story);
      
      // Mostrar notificação
      showNotification(`Line ${lineNumber} refined! ${data.explanation}`);
      
      // Atualizar uso
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

// Adicionar animações CSS
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
      editingLine: null
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
  
  // Formatar história para compartilhamento
  const storyText = Object.entries(appState.currentStory)
    .map(([key, value], index) => `${index + 1}. ${value}`)
    .join('\n\n');
  
  const fullText = `My 5 Lines Story:\n\n${storyText}\n\nCreated with 5 Lines Story ✨`;
  
  // Copiar para clipboard
  navigator.clipboard.writeText(fullText).then(() => {
    showNotification('Story copied to clipboard! 📋');
  }).catch(err => {
    // Fallback: mostrar modal com texto
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
    
    modal.innerHTML = `
      <div style="background: white; border-radius: 16px; padding: 32px; max-width: 600px; margin: 20px;">
        <h3 style="margin-bottom: 16px;">Your Story</h3>
        <textarea readonly style="width: 100%; min-height: 300px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">${fullText}</textarea>
        <button class="btn btn-primary btn-full" style="margin-top: 16px;" onclick="this.parentElement.parentElement.remove()">Close</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  });
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
  // ESC para cancelar edição
  if (e.key === 'Escape' && appState.editingLine) {
    cancelEdit();
  }
  
  // Ctrl+Enter para salvar edição
  if (e.ctrlKey && e.key === 'Enter' && appState.editingLine) {
    saveEdit();
  }
});
