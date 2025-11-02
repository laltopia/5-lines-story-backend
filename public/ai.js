// Carregar histórico ao abrir a página
document.addEventListener('DOMContentLoaded', () => {
  loadHistory();
});

// Form de processar IA
document.getElementById('aiForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const userInput = document.getElementById('userInput').value;
  const loading = document.getElementById('loading');
  const responseBox = document.getElementById('response');
  
  // Mostrar loading
  loading.classList.add('show');
  responseBox.classList.remove('show');
  
  try {
    // Get Clerk session token
    const token = await window.Clerk.session.getToken();
    
    const response = await fetch('/api/ai/process', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userInput })
    });
    
    const data = await response.json();
    
    // Esconder loading
    loading.classList.remove('show');
    
    if (data.success) {
      responseBox.innerHTML = `
        <h3 style="color: #6366f1; margin-bottom: 15px;">📖 História Gerada:</h3>
        ${data.aiResponse}
      `;
      responseBox.classList.add('show');
      
      // Limpar form
      document.getElementById('userInput').value = '';
      
      // Atualizar histórico
      setTimeout(loadHistory, 1000);
    } else {
      responseBox.innerHTML = `<p style="color: #721c24;">❌ Erro: ${data.error}</p>`;
      responseBox.classList.add('show');
    }
  } catch (error) {
    loading.classList.remove('show');
    responseBox.innerHTML = `<p style="color: #721c24;">❌ Erro: ${error.message}</p>`;
    responseBox.classList.add('show');
  }
});

// Carregar histórico
async function loadHistory() {
  const historyDiv = document.getElementById('history');
  historyDiv.innerHTML = '<p class="loading">Carregando histórico...</p>';
  
  try {
    // Get Clerk session token
    const token = await window.Clerk.session.getToken();
    
    const response = await fetch('/api/ai/history', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success && data.conversations.length > 0) {
      historyDiv.innerHTML = data.conversations.map(conv => `
        <div class="history-item">
          <h4>💭 Tema:</h4>
          <div class="user-input">${conv.user_input}</div>
          <h4>📖 História:</h4>
          <div class="ai-response">${conv.ai_response}</div>
          <p style="font-size: 0.8rem; color: #999; margin-top: 10px;">
            ${new Date(conv.created_at).toLocaleString('pt-BR')}
          </p>
        </div>
      `).join('');
    } else {
      historyDiv.innerHTML = '<p class="loading">Nenhuma história gerada ainda. Crie sua primeira!</p>';
    }
  } catch (error) {
    console.error('Error loading history:', error);
    historyDiv.innerHTML = '<p class="loading">Erro ao carregar histórico.</p>';
  }
}
