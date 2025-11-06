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

// Carregar usuarios quando a pagina abrir
document.addEventListener('DOMContentLoaded', () => {
  loadUsers();
});

// Form de criar usuario
document.getElementById('userForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const resultDiv = document.getElementById('result');

  try {
    const token = await window.Clerk.session.getToken();

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, email })
    });
    
    const data = await response.json();

    if (data.success) {
      showResult('success', '✅ Usuario criado com sucesso: ' + escapeHtml(data.user.name));
      document.getElementById('userForm').reset();
      loadUsers(); // Atualizar lista
    } else {
      showResult('error', '❌ Erro: ' + escapeHtml(data.error));
    }
  } catch (error) {
    showResult('error', '❌ Erro: ' + escapeHtml(error.message));
  }
});

// Carregar lista de usuarios (XSS PROTECTED)
async function loadUsers() {
  const usersListDiv = document.getElementById('usersList');
  usersListDiv.innerHTML = '<p class="loading">Carregando usuarios...</p>';

  try {
    const token = await window.Clerk.session.getToken();

    const response = await fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();

    if (data.success && data.users.length > 0) {
      usersListDiv.innerHTML = data.users.map(user => `
        <div class="user-item">
          <h3>${escapeHtml(user.name)}</h3>
          <p>📧 ${escapeHtml(user.email)}</p>
          <p style="font-size: 0.8rem; color: #999;">
            Criado em: ${new Date(user.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
      `).join('');
    } else {
      usersListDiv.innerHTML = '<p class="loading">Nenhum usuario encontrado.</p>';
    }
  } catch (error) {
    usersListDiv.innerHTML = '<p class="loading">Erro ao carregar usuarios.</p>';
  }
}

// Mostrar resultado
function showResult(type, message) {
  const resultDiv = document.getElementById('result');
  resultDiv.className = 'show ' + type;
  resultDiv.innerHTML = message;
  
  setTimeout(() => {
    resultDiv.classList.remove('show');
  }, 5000);
}
