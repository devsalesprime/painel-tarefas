/**
 * VERIFICAÇÃO DE INTEGRAÇÃO - Task Panel
 * 
 * Este arquivo lista o status de cada módulo e verifica se estão carregados corretamente.
 * Use o console do navegador para executar as funções de teste.
 */

// ========== VERIFICAÇÃO DE MÓDULOS ==========

function verificarModulos() {
  console.log("🔍 Verificando módulos carregados...\n");

  const modulos = {
    'TaskManager': typeof TaskManager !== 'undefined',
    'taskManager (instância)': typeof taskManager !== 'undefined',
    'Prioridades': typeof prioridades !== 'undefined',
    'Kanban Columns': typeof kanbanColumns !== 'undefined',
    'formatarDataHora': typeof formatarDataHora === 'function',
    'validarEmail': typeof validarEmail === 'function',
    'carregarProjetos': typeof carregarProjetos === 'function',
    'renderizarTarefas': typeof renderizarTarefas === 'function',
    'inicializarTooltips': typeof inicializarTooltips === 'function',
    'configurarDragAndDrop': typeof configurarDragAndDrop === 'function',
    'carregarDadosUsuario': typeof carregarDadosUsuario === 'function',
    'abrirEditarPerfil': typeof abrirEditarPerfil === 'function',
    'criarTarefa': typeof criarTarefa === 'function',
    'adicionarComentario': typeof adicionarComentario === 'function',
    'abrirEditarTarefa': typeof abrirEditarTarefa === 'function',
  };

  let count = 0;
  for (const [nome, carregado] of Object.entries(modulos)) {
    const status = carregado ? '✅' : '❌';
    console.log(`${status} ${nome}`);
    if (carregado) count++;
  }

  console.log(`\n📊 Resultado: ${count}/${Object.keys(modulos).length} módulos carregados`);
  
  if (count === Object.keys(modulos).length) {
    console.log("✅ Todos os módulos carregados com sucesso!");
  } else {
    console.log("⚠️ Alguns módulos não foram carregados. Verifique a ordem de carregamento no HTML.");
  }
}

// ========== TESTE DE FUNCIONALIDADE ==========

function testarConexao() {
  console.log("🔗 Testando conexão com API...");
  
  if (taskManager && typeof taskManager.debugAuth === 'function') {
    taskManager.debugAuth();
  } else {
    console.error("❌ TaskManager não disponível");
  }
}

function testarAutenticacao() {
  console.log("🔐 Verificando autenticação...");
  
  const token = localStorage.getItem("auth_token");
  const userData = localStorage.getItem("user_data");
  
  console.log("Token presente:", !!token);
  console.log("Dados do usuário:", userData ? JSON.parse(userData) : "Não encontrado");
  console.log("Autenticado:", isAuthenticated ? isAuthenticated() : "Função não disponível");
}

// ========== FUNÇÕES DE DEBUG ==========

function mostrarEstadoApp() {
  console.log("\n=== ESTADO DA APLICAÇÃO ===\n");
  console.log("TaskManager:", taskManager);
  console.log("Usuário atual:", taskManager?.getCurrentUser?.());
  console.log("É admin:", taskManager?.ehAdmin);
  console.log("Modo visualização:", window.viewMode);
  console.log("Filtro ativo:", taskManager?.filtroAtivo);
  console.log("Estatísticas:", taskManager?.stats);
}

function limpanarCache() {
  console.log("🧹 Limpando cache...");
  
  if (taskManager) {
    taskManager.usuariosSelecionados = [];
    taskManager.tarefaEditandoId = null;
    taskManager.projetoEditandoId = null;
    console.log("✅ Cache limpo");
  }
}

// ========== ALIAS PARA FÁCIL ACESSO ==========

// Podem ser usados no console como: verificar(), testar(), estado()
window.verificar = verificarModulos;
window.testar = testarConexao;
window.autenticacao = testarAutenticacao;
window.estado = mostrarEstadoApp;
window.limpar = limpannarCache;

// ========== AUTO-VERIFY (OPCIONAL) ==========

// Descomente a linha abaixo para verificação automática ao carregar
// document.addEventListener('DOMContentLoaded', verificarModulos);

console.log(
  "%c🎯 Debug Console do Task Panel\n" +
  "%cComandos disponíveis:\n" +
  "  • verificar() - Verifica módulos carregados\n" +
  "  • testar() - Testa conexão com API\n" +
  "  • autenticacao() - Mostra status de autenticação\n" +
  "  • estado() - Mostra estado atual da aplicação\n" +
  "  • limpar() - Limpa cache da aplicação",
  "color: #4CAF50; font-weight: bold;",
  "color: #2196F3;"
);
