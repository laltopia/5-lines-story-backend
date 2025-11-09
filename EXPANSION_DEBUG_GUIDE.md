# Story Expansion Debugging Guide

## Problema Reportado
- Os botões de expansão não aparecem na página principal nem no modal
- Nenhuma informação é gravada nas tabelas do Supabase

## Causa Raiz Mais Provável
A migração SQL para suporte de expansão de histórias **não foi executada** no Supabase.

## Diagnóstico

### 1. Execute o Script de Diagnóstico
```bash
node backend/routes/test-expansion.js
```

Este script verifica:
- ✅ Se as colunas de expansão existem na tabela `conversations`
- ✅ Se as funções helper do PostgreSQL foram criadas
- ✅ Se há dados de exemplo no banco

### 2. Verifique os Logs do Backend
Após as melhorias feitas, o backend agora loga informações detalhadas:

**Ao gerar uma nova história:**
```
Saving story to database with expansion support...
Story level: 5
Accumulated metadata: {...}
User inputs history: [...]
✅ Story saved successfully with ID: xxx
Saved story_level: 5
Saved parent_story_id: null
```

**Se houver erro:**
```
❌ Error saving story to database: {...}
Error details: {...}
```

**Ao expandir uma história:**
```
Saving expanded story to database (5 → 10)...
Parent story ID: xxx
Target level: 10
✅ Expanded story saved successfully with ID: yyy
```

### 3. Verifique Manualmente no Supabase
1. Acesse o Supabase Dashboard → SQL Editor
2. Execute este query:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'conversations'
AND column_name IN ('story_level', 'parent_story_id', 'accumulated_metadata', 'user_inputs_history');
```

**Resultado esperado:** 4 linhas mostrando as colunas

**Se retornar vazio:** A migração não foi executada!

## Solução

### Passo 1: Execute a Migração SQL
1. Abra o Supabase Dashboard (https://app.supabase.com)
2. Vá em **SQL Editor**
3. Abra o arquivo `database/add_story_expansion_support.sql`
4. Copie TODO o conteúdo
5. Cole no SQL Editor
6. Clique em **Run**

### Passo 2: Verifique a Migração
Execute novamente o script de diagnóstico:
```bash
node backend/routes/test-expansion.js
```

Você deve ver:
```
✅ All expansion columns exist in conversations table
✅ Helper functions available
```

### Passo 3: Reinicie o Servidor
```bash
# Local
npm start

# Render (deploy automático via git push)
git push origin main
```

### Passo 4: Teste a Funcionalidade
1. Acesse a aplicação
2. Crie uma nova história
3. Observe nos logs do backend (console do servidor):
   - Deve aparecer "Story saved successfully with ID: xxx"
   - Deve mostrar "Saved story_level: 5"
4. Após a história aparecer, você deve ver:
   - Badge roxo com "5-Line Story"
   - Botão "Expand to 10-Line Story"

## Como os Botões de Expansão Funcionam

### No Backend (backend/routes/ai.js)
- **Endpoint `/generate-story`**: Salva `story_level: 5` no banco
- **Endpoint `/expand-story`**: Salva a história expandida com `story_level: 10/15/20` e `parent_story_id`
- **Resposta inclui**: `storyLevel`, `parentStoryId`, `accumulatedMetadata`

### No Frontend (public/ai.js)
1. Ao receber a resposta, atualiza `appState.storyLevel`
2. Função `renderStory()` é chamada
3. Função `getNextLevel(appState.storyLevel)` determina próximo nível:
   - 5 → 10
   - 10 → 15
   - 15 → 20
   - 20 → null (máximo atingido)
4. Se `nextLevel` existe, cria botão "Expand to {nextLevel}"
5. Click handler abre modal de expansão

## Checklist de Verificação

- [ ] Migração SQL executada no Supabase
- [ ] Script de diagnóstico retorna ✅ para todas as verificações
- [ ] Servidor reiniciado após mudanças
- [ ] Console do backend mostra logs de salvamento
- [ ] Histórias novas mostram "Saved story_level: 5" nos logs
- [ ] Frontend mostra badge "5-Line Story"
- [ ] Botão "Expand to 10-Line Story" aparece
- [ ] Clicar no botão abre modal de expansão
- [ ] Modal permite entrada de texto e diferentes tipos de input

## Erros Comuns

### Erro: "column 'story_level' does not exist"
**Causa:** Migração não executada
**Solução:** Execute `database/add_story_expansion_support.sql`

### Erro: "function can_expand_story does not exist"
**Causa:** Parte da migração falhou
**Solução:** Execute a migração completa novamente

### Botões não aparecem mas logs mostram story_level salvando
**Causa:** Frontend não está processando resposta corretamente
**Solução:**
1. Abra o DevTools do navegador (F12)
2. Console → veja se há erros JavaScript
3. Network → verifique resposta do `/api/ai/generate-story`
4. Deve conter: `"storyLevel": 5`

### Modal abre mas não expande
**Causa:** Endpoint de expansão com erro
**Solução:** Verifique logs do backend ao clicar "Expand Story"

## Melhorias Implementadas

### 1. Logs de Debug Detalhados
- ✅ Log antes de salvar no banco
- ✅ Log dos dados sendo salvos (story_level, metadata, etc)
- ✅ Log de sucesso com ID da conversa
- ✅ Log de erro com detalhes completos

### 2. Script de Diagnóstico
- ✅ Verifica colunas existem
- ✅ Verifica funções helper
- ✅ Mostra dados de exemplo
- ✅ Instruções claras de próximos passos

### 3. Documentação
- ✅ Guia passo a passo de solução
- ✅ Checklist de verificação
- ✅ Erros comuns e soluções

## Próximos Passos Após Correção

1. Testar fluxo completo: 5 → 10 → 15 → 20 linhas
2. Verificar metadata acumulada funcionando
3. Verificar lineage (árvore de histórias) funcionando
4. Testar diferentes tipos de input (texto, áudio, documento)
5. Verificar salvamento no histórico

## Suporte

Se após executar todos os passos ainda houver problemas:
1. Verifique os logs completos do backend
2. Verifique a resposta da API no Network tab do DevTools
3. Execute query SQL manual para ver estrutura da tabela
4. Compartilhe os erros específicos que aparecem
