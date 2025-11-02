const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('<h1>Versão 2.0 - AUTO-DEPLOY FUNCIONOU! 🚀</h1><p>Atualizado automaticamente do GitHub!</p>');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Servidor rodando na porta ' + PORT);
});
