# Estrutura de Módulos - Task Panel

## Migração Concluída ✅

O arquivo `app.js` foi dividido nos seguintes módulos JavaScript localizados em `js/`:

### Estrutura de Arquivos

```
js/
├── core.js                  # Classe TaskManager e autenticação base
├── main.js                  # Constantes globais (prioridades, kanban)
├── utils.js                 # Funções utilitárias (formatação, validação)
├── data.js                  # Gerenciamento de dados (projetos, tarefas)
├── render.js                # Renderização de tarefas (Kanban/Lista)
├── ui.js                    # Funções de interface (tooltips, modais)
├── modals.js                # Controle de modais e drag-and-drop
├── auth.js                  # Autenticação e funções correlatas
├── profile.js               # Gerenciamento de perfil do usuário
├── complementos.js          # Funcionalidades complementares
├── taskManager.js           # Gerenciamento de tarefas
├── actions.js               # Ações (comentários, arquivos, etapas)
├── init.js                  # Inicialização e setup
└── loader.js                # Indicador de carregamento
```

## O que foi movido para cada arquivo

### **core.js**
- Classe `TaskManager` com métodos de:
  - `fetch()` - Requisições com autenticação
  - `logout()`
  - `mostrarErro()` e `mostrarSucesso()`
  - `atualizarEstatisticas()`
  - `getCurrentUser()`
  - `verificarSeEhAdmin()`
  - `debugAuth()`
- Funções de autenticação:
  - `isAuthenticated()`
  - `logout()`
  - `alterarSenha()`
  - `abrirPerfil()`

### **main.js**
- Constantes globais:
  - `window.viewMode`
  - `window.ordenacaoAtual`
  - `window.prioridades` (Matriz de Eisenhower)
  - `window.kanbanColumns`

### **utils.js**
- Formatação de datas:
  - `formatarDataHora()`
  - `formatarDataProjeto()`
  - `formatarData()`
- Utilitários:
  - `getFileIcon()`
  - `validarEmail()`
  - `validarDatas()`
  - `calcularForcaSenha()`
  - `togglePasswordModal()`

### **data.js**
- Gerenciamento de dados:
  - `carregarProjetos()`
  - `carregarProjetos()`
  - Funções de operações CRUD de projetos

### **render.js**
- Renderização:
  - `renderizarTarefas()`
  - `renderizarProjetoKanban()`
  - `renderizarProjetoLista()`
  - `gerarCardKanban()`
  - `gerarCardLista()`
  - `gerarBotoesStatus()`
  - Mensagens de estado

### **ui.js**
- Interface:
  - `inicializarTooltips()`
  - `atualizarEstadoVisualizacao()`
  - `garantirContainerProjetos()`
  - `criarInterfaceFallback()`
  - Funções de erro/sucesso em modais

### **modals.js**
- Modais e Drag-and-Drop:
  - `fecharModalNovaTarefa()`
  - `fecharModalNovoProjeto()`
  - `fecharModalEditarTarefa()`
  - `configurarDragAndDrop()`
  - Handlers de drag (handleDragStart, handleDragEnd, etc.)

### **auth.js**
- Autenticação:
  - `carregarDadosUsuario()`
  - `carregarInfoUsuario()`
  - `adicionarLinkAdmin()`
  - Outros utilitários de autenticação

### **profile.js**
- Perfil do usuário:
  - `abrirEditarPerfil()`
  - `salvarPerfil()`
  - `abrirAlterarSenha()`
  - `validarForcaSenha()`
  - `validarConfirmacaoSenha()`
  - `salvarNovaSenha()`

### **complementos.js**
- Funcionalidades adicionais:
  - Gerenciamento de projetos
  - Funções de edição/deleção de projetos
  - Operações de conclusão/reabertura

### **taskManager.js**
- Gerenciamento de tarefas:
  - `criarTarefa()`
  - `alterarStatusTarefa()`
  - `pausarTarefa()`
  - `iniciarTarefa()`
  - `concluirTarefa()`
  - `reabrirTarefa()`
  - `deletarTarefa()`
  - `alterarPrioridadeTarefa()`
  - `salvarTarefa()`
  - `abrirEditarTarefa()`

### **actions.js**
- Ações e gerenciamento:
  - Comentários: `adicionarComentario()`, `carregarComentariosTarefa()`, `deletarComentario()`
  - Arquivos: `carregarArquivosTarefa()`, `baixarArquivoApi()`, `deletarArquivo()`
  - Etapas: `adicionarEtapaModalEditar()`, `toggleEtapaModalEditar()`, `deletarEtapaModalEditar()`
  - `atualizarContadoresTarefa()`
  - `inicializarContadorComentario()`

### **init.js**
- Inicialização do sistema:
  - `document.addEventListener("DOMContentLoaded", ...)`
  - Configuração de eventos
  - Carregamento inicial de dados
  - Configuração de filtros

## Como Incluir no HTML

Substitua o script `<script src="app.js"></script>` por:

```html
<!-- Core e Dependências -->
<script src="js/core.js"></script>
<script src="js/main.js"></script>
<script src="js/utils.js"></script>

<!-- Data e Renderização -->
<script src="js/data.js"></script>
<script src="js/render.js"></script>
<script src="js/ui.js"></script>

<!-- Modais e Controle -->
<script src="js/modals.js"></script>
<script src="js/auth.js"></script>
<script src="js/profile.js"></script>

<!-- Funcionalidades -->
<script src="js/complementos.js"></script>
<script src="js/taskManager.js"></script>
<script src="js/actions.js"></script>

<!-- Inicialização -->
<script src="js/init.js"></script>
```

## Ordem Importante

A ordem de carregamento é **crítica**. Siga a ordem acima para evitar erros de referência não definida.

## Dependências Entre Módulos

```
core.js (TaskManager)
  ↓
main.js (constantes)
  ↓
utils.js (funções)
  ↓
data.js (dados)
  ↓
render.js (renderização)
  ↓
ui.js (interface)
  ↓
modals.js (modais)
  ↓
auth.js, profile.js, complementos.js, taskManager.js, actions.js
  ↓
init.js (inicialização)
```

## Benefícios da Divisão

✅ **Melhor organização** - Código separado por funcionalidade  
✅ **Manutenção simplificada** - Mais fácil encontrar e atualizar código  
✅ **Reusabilidade** - Módulos podem ser reutilizados em outros projetos  
✅ **Melhor performance** - Cache dos scripts individuais  
✅ **Facilita debug** - Stack traces mais claros  
✅ **Controle de versão** - Mudanças granulares por arquivo  

## Próximos Passos (Opcionais)

### Module Pattern
Você pode envolver cada arquivo em um padrão de módulo para melhor encapsulamento:

```javascript
const TaskModule = (() => {
  // suas funções aqui
  return {
    // exports públicos
  };
})();
```

### Bundling
Para otimização em produção, considere usar um bundler como Webpack ou Vite para:
- Minificar código
- Combinar módulos em arquivo único
- Tree-shaking para remover código não usado

---

**Migração concluída em:** 7 de janeiro de 2026
