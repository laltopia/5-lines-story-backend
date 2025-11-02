const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('<h1>Versão 1.0 - Funcionando!</h1><p>Deploy automático do GitHub para Render</p>');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Servidor rodando na porta ' + PORT);
});
