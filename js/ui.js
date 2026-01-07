// ========== VERIFICAÇÃO E CRIAÇÃO DO CONTAINER ==========

function garantirContainerProjetos() {
  // ✅ LISTA DE PÁGINAS QUE NÃO PRECISAM DO PAINEL PRINCIPAL
  const paginasSemPainel = ["admin.html", "relatorio.html", "arquivo.html"];
  const caminho = window.location.pathname;

  // ✅ VERIFICAÇÃO CRÍTICA: Se estiver em uma página especial, NÃO criar container
  if (paginasSemPainel.some(p => caminho.includes(p))) {
    console.log("🚫 Página especial detectada (" + caminho + ") – não criar container padrão.");
    return null;
  }

  // ✅ PRIMEIRA PRIORIDADE: Buscar o #projetosContainer que já existe no HTML
  let container = document.getElementById("projetosContainer");
  if (container) {
    console.log("✅ projetosContainer encontrado no HTML.");
    return container;
  }

  // ✅ VERIFICAR SE JÁ EXISTE UM CONTAINER-TAREFAS CRIADO PELO FALLBACK
  const existingContainerTarefas = document.querySelector('.container-tarefas');
  if (existingContainerTarefas) {
    console.log("✅ Já existe um container-tarefas criado pelo fallback");
    // Buscar o projetosContainer dentro do container-tarefas existente
    container = existingContainerTarefas.querySelector('#projetosContainer');
    if (container) {
      return container;
    }
  }

  // ✅ SEGUNDA OPÇÃO: Se não encontrou, criar interface fallback (APENAS UMA VEZ)
  console.log("⚠️ projetosContainer não encontrado, criando fallback...");
  criarInterfaceFallback();
  
  // Buscar novamente após criar
  container = document.getElementById("projetosContainer");
  
  if (!container) {
    console.error("❌ Não foi possível criar/obter o container de projetos.");
    return null;
  }

  console.log("✅ Container criado via fallback.");
  return container;
}

function criarInterfaceFallback() {
  console.log("🎨 Criando interface fallback...");

  // ✅ VERIFICAÇÃO: Não criar em páginas especiais
  const paginasSemPainel = ["admin.html", "arquivo.html", "relatorio.html"];
  const caminho = window.location.pathname;

  if (paginasSemPainel.some(p => caminho.includes(p))) {
    console.log("🚫 Página especial detectada — não criar fallback.");
    return;
  }

  // ✅ VERIFICAR SE JÁ EXISTE UM CONTAINER-TAREFAS
  const existingContainer = document.querySelector('.container-tarefas');
  if (existingContainer) {
    console.log("ℹ️ Já existe um container-tarefas, não criando duplicata");
    return;
  }

  const mainContainer = document.querySelector(".container.mt-4");
  if (!mainContainer) {
    console.error("❌ Contenedor principal não encontrado");
    return;
  }

  // Criar uma interface básica
  const html = `
    <div class="container-tarefas">
      <div class="header-actions">
        <div class="search-bar">
          <i class="fas fa-search"></i>
          <input type="text" id="buscaTarefas" placeholder="Buscar tarefas...">
        </div>
        <div class="filters">
          <button class="filter-btn active" data-filter="todas">Todas</button>
          <button class="filter-btn" data-filter="pendente">Pendentes</button>
          <button class="filter-btn" data-filter="iniciada">Em Andamento</button>
          <button class="filter-btn" data-filter="pausada">Pausadas</button>
          <button class="filter-btn" data-filter="concluida">Concluídas</button>
          <button class="filter-btn" data-filter="atrasada">Atrasadas</button>
        </div>
        <div class="action-buttons">
          <button class="btn btn-outline-primary" onclick="abrirModalNovoProjeto()" id="btnNovoProjetoHeader">
            <i class="fas fa-folder-plus"></i> Projeto
          </button>
          <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalNovaTarefa" id="btnNovaTarefa">
            <i class="fas fa-plus"></i> Tarefa
          </button>
        </div>
      </div>
      <div id="projetosContainer"></div>
    </div>
  `;

  // Adicionar após as estatísticas
  const statsBar = document.querySelector(".stats-bar");
  if (statsBar) {
    statsBar.insertAdjacentHTML("afterend", html);
  } else {
    mainContainer.innerHTML += html;
  }

  console.log("✅ Interface fallback criada");
}

// ========== FUNÇÕES DE CONTROLE DE VISUALIZAÇÃO ==========

function configurarVisualizacao() {
  const viewList = document.getElementById("viewList");
  const viewKanban = document.getElementById("viewKanban");
  const viewMinhasTarefas = document.getElementById("viewMinhasTarefas");

  if (viewList) {
    viewList.addEventListener("change", function () {
      if (this.checked) {
        // Desmarcar a outra visualização
        if (viewKanban) viewKanban.checked = false;
        alterarVisualizacao("lista");
      } else {
        // Se desmarcou, garantir que pelo menos uma visualização fique ativa
        if (!viewKanban?.checked) {
          this.checked = true;
        }
      }
      atualizarEstadoVisualizacao();
    });
  }

  if (viewKanban) {
    viewKanban.addEventListener("change", function () {
      if (this.checked) {
        // Desmarcar a outra visualização
        if (viewList) viewList.checked = false;
        alterarVisualizacao("kanban");
      } else {
        // Se desmarcou, garantir que pelo menos uma visualização fique ativa
        if (!viewList?.checked) {
          this.checked = true;
        }
      }
      atualizarEstadoVisualizacao();
    });
  }

  if (viewMinhasTarefas) {
    viewMinhasTarefas.addEventListener("change", function () {
      taskManager.filtroMinhasTarefas = this.checked;
      renderizarTarefas();
      atualizarEstadoVisualizacao();
    });
  }

  // Inicialização
  const savedView = localStorage.getItem("taskViewMode") || "lista";
  if (savedView === "kanban" && viewKanban) {
    viewKanban.checked = true;
  } else if (viewList) {
    viewList.checked = true;
  }
  alterarVisualizacao(savedView);
  atualizarEstadoVisualizacao();
}

// ✅ FUNÇÃO ATUALIZADA: Mostrar estados independentes
function atualizarEstadoVisualizacao() {
  const viewList = document.getElementById("viewList");
  const viewKanban = document.getElementById("viewKanban");
  const viewMinhasTarefas = document.getElementById("viewMinhasTarefas");

  // Remover classes ativas de todos
  if (viewList) viewList.parentElement?.classList.remove("active");
  if (viewKanban) viewKanban.parentElement?.classList.remove("active");
  if (viewMinhasTarefas)
    viewMinhasTarefas.parentElement?.classList.remove("active");

  // ✅ CORREÇÃO: Adicionar classe ativa em MULTIPLOS botões
  if (viewList?.checked) {
    viewList.parentElement?.classList.add("active");
  }

  if (viewKanban?.checked) {
    viewKanban.parentElement?.classList.add("active");
  }

  if (viewMinhasTarefas?.checked) {
    viewMinhasTarefas.parentElement?.classList.add("active");
    console.log('✅ Botão "Suas Tarefas" ativo');
  }

  console.log("🎯 Estado atual:", {
    visualizacao: viewMode,
    filtroMinhasTarefas: taskManager.filtroMinhasTarefas,
    listaAtiva: viewList?.checked,
    kanbanAtivo: viewKanban?.checked,
    minhasTarefasAtivo: viewMinhasTarefas?.checked,
  });
}

function alterarVisualizacao(modo) {
  viewMode = modo;
  localStorage.setItem("taskViewMode", modo);
  console.log(`🎨 Alterando visualização para: ${modo}`);

  // ✅ ATUALIZAR estado visual
  atualizarEstadoVisualizacao();
  renderizarTarefas();
}

function alterarOrdenacaoTarefas(campo) {
  ordenacaoAtual = campo;
  renderizarTarefas();
}

function configurarFiltros() {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      // Remover classe active de todos
      document.querySelectorAll(".filter-btn").forEach((b) => {
        b.classList.remove("active");
      });

      // Adicionar classe active no clicado
      this.classList.add("active");

      // Aplicar filtro
      const filtro = this.getAttribute("data-filter");
      taskManager.filtroAtivo = filtro;
      renderizarTarefas();
    });
  });

  // Adicionar filtros de prioridade
  document.querySelectorAll(".filter-prioridade").forEach((btn) => {
    btn.addEventListener("click", function () {
      const prioridade = this.getAttribute("data-prioridade");
      taskManager.filtroPrioridade = prioridade;
      renderizarTarefas();
    });
  });
}

function filtrarTarefas(tarefas) {
  const currentUser = taskManager.getCurrentUser();

  console.log("🔍 Debug Filtro:", {
    filtroMinhasTarefas: taskManager.filtroMinhasTarefas,
    currentUser: currentUser,
    totalTarefas: tarefas.length,
  });

  return tarefas.filter((t) => {
    const hoje = new Date();
    const dataFim = new Date(t.data_fim);
    const atrasada =
      (t.concluida === 0 || t.status !== "concluida") && dataFim < hoje;

    // ✅ CORREÇÃO: Filtro "Minhas Tarefas"
    if (taskManager.filtroMinhasTarefas && currentUser) {
      console.log(`📋 Verificando tarefa ${t.id} - "${t.titulo}":`, {
        usuarios: t.usuarios,
        usuarioAtual: currentUser.id,
      });

      // Verificar se a tarefa tem usuários atribuídos
      if (!t.usuarios || t.usuarios.length === 0) {
        console.log(`❌ Tarefa ${t.id} sem usuários - FILTRADA`);
        return false;
      }

      // Verificar se o usuário atual está na lista de usuários da tarefa
      const pertenceAoUsuario = t.usuarios.some((u) => {
        const usuarioId = parseInt(u.id);
        const currentUserId = parseInt(currentUser.id);
        const pertence = usuarioId === currentUserId;
        console.log(
          `👤 Comparando: ${usuarioId} === ${currentUserId} = ${pertence}`
        );
        return pertence;
      });

      if (!pertenceAoUsuario) {
        console.log(`❌ Tarefa ${t.id} não pertence ao usuário - FILTRADA`);
        return false;
      }

      console.log(`✅ Tarefa ${t.id} pertence ao usuário - MANTIDA`);
    }

    // Filtro por status (mantido igual)
    let passaFiltroStatus = true;
    switch (taskManager.filtroAtivo) {
      case "todas":
        passaFiltroStatus = true;
        break;
      case "pendente":
        passaFiltroStatus = t.status === "pendente";
        break;
      case "iniciada":
        passaFiltroStatus = t.status === "iniciada";
        break;
      case "pausada":
        passaFiltroStatus = t.status === "pausada";
        break;
      case "concluida":
        passaFiltroStatus = t.status === "concluida" || t.concluida === 1;
        break;
      case "atrasada":
        passaFiltroStatus = atrasada;
        break;
      default:
        passaFiltroStatus = true;
    }

    // Filtro por prioridade
    let passaFiltroPrioridade = true;
    if (
      taskManager.filtroPrioridade &&
      taskManager.filtroPrioridade !== "todas"
    ) {
      passaFiltroPrioridade = t.prioridade === taskManager.filtroPrioridade;
    }

    return passaFiltroStatus && passaFiltroPrioridade;
  });
}

function limparFiltros() {
  taskManager.filtroAtivo = "todas";
  taskManager.filtroPrioridade = "todas";
  taskManager.filtroMinhasTarefas = false;

  // ✅ CORREÇÃO: Apenas desativar o filtro "Suas Tarefas", manter visualização
  const viewMinhasTarefas = document.getElementById("viewMinhasTarefas");
  if (viewMinhasTarefas) {
    viewMinhasTarefas.checked = false;
  }

  // ✅ CORREÇÃO: Restaurar visualização padrão (lista)
  const viewList = document.getElementById("viewList");
  if (viewList) {
    viewList.checked = true;
    viewMode = "lista";
  }

  const viewKanban = document.getElementById("viewKanban");
  if (viewKanban) {
    viewKanban.checked = false;
  }

  renderizarTarefas();

  // Atualizar UI dos filtros de status
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document.querySelector('[data-filter="todas"]').classList.add("active");

  // ✅ ATUALIZAR estado visual
  atualizarEstadoVisualizacao();
}

// Adicione esta função para debug (pode remover depois de testar)
function debugFiltroMinhasTarefas() {
  const currentUser = taskManager.getCurrentUser();
  console.log("🔍 Debug Filtro Minhas Tarefas:");
  console.log("Usuário atual:", currentUser);
  console.log("Filtro Minhas Tarefas ativo:", taskManager.filtroMinhasTarefas);

  // Testar com algumas tarefas
  const container = document.getElementById("projetosContainer");
  if (container) {
    const tarefas = container.querySelectorAll(".kanban-card, .lista-tarefa");
    console.log("Total de tarefas visíveis:", tarefas.length);

    tarefas.forEach((tarefa) => {
      const tarefaId = tarefa.dataset.tarefaId || "não encontrado";
      console.log(
        `Tarefa ${tarefaId}:`,
        tarefa.querySelector(".titulo-tarefa, h5")?.textContent
      );
    });
  }
}