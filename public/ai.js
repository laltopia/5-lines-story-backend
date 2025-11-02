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
    historyDiv.innerHTML = '<p class="loading">Erro ao carregar histórico.</p>';
  }
}
