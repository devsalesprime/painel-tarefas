// ========== INICIALIZAÇÃO COM AUTENTICAÇÃO ==========

document.addEventListener("DOMContentLoaded", async () => {
  console.log("📄 DOM Carregado");

  // ✅ VERIFICAÇÃO CRÍTICA: Se estiver em página especial, não executar
  const paginasSemPainel = ["admin.html", "relatorio.html", "arquivo.html"];
  const caminhoAtual = window.location.pathname;

  if (paginasSemPainel.some(p => caminhoAtual.includes(p))) {
    console.log("🔧 Página especial detectada (" + caminhoAtual + ") - ignorando inicialização do painel");
    // Ainda assim, carregar dados do usuário para o menu
    carregarInfoUsuario();
    return;
  }

  // ✅ VERIFICAÇÃO CRÍTICA: Se estiver na página admin, não executar o código do painel principal
  if (window.location.pathname.includes("admin.html")) {
    console.log("🔧 Página de administração detectada - ignorando inicialização do painel principal");
    return;
  }

  // Verificar autenticação
  if (!isAuthenticated()) {
    console.log("❌ Não autenticado - redirecionando para login");
    window.location.href = "login.html";
    return;
  }

  console.log("✅ Usuário autenticado");

  // ✅ VERIFICAR SE JÁ EXISTE UM CONTAINER-TAREFAS NO HTML
  const existingContainer = document.querySelector('.container-tarefas');
  if (!existingContainer) {
    // Só garantir container se não existir
    garantirContainerProjetos();
  }

  // Debug de autenticação
  await taskManager.debugAuth();

  // ✅ CORREÇÃO: Carregar dados do usuário PRIMEIRO
  carregarInfoUsuario();

  // Verificar se é admin e ajustar interface
  const ehAdmin = await taskManager.verificarSeEhAdmin();
  console.log("👮 É admin?", ehAdmin);

  // Controlar visibilidade dos botões de ação
  const btnNovaTarefa = document.querySelector('[data-bs-target="#modalNovaTarefa"]');
  const btnNovoProjetoHeader = document.getElementById("btnNovoProjetoHeader");

  if (btnNovaTarefa && !ehAdmin) {
    btnNovaTarefa.style.display = "none";
  }
  if (btnNovoProjetoHeader && !ehAdmin) {
    btnNovoProjetoHeader.style.display = "none";
  }

  // Carregar sistema
  console.log("📄 Iniciando carregamento do sistema...");
  await carregarProjetos();
  await renderizarTarefas();
  configuraEventos();
  configurarFiltros();

  console.log("✅ Sistema carregado com sucesso");

  // Executar o teste do container
  setTimeout(testeContainer, 1000);
});

// Configuração inicial de eventos dos modais
document.addEventListener("DOMContentLoaded", function () {
  // Limpar mensagens quando o modal for fechado
  document
    .getElementById("modalEditarTarefa")
    ?.addEventListener("hidden.bs.modal", function () {
      limparMensagensModalEditar();
    });

  // Evento quando o modal é aberto
  document
    .getElementById("modalEditarTarefa")
    ?.addEventListener("shown.bs.modal", function () {
      console.log("📂 Modal Editar Tarefa aberto");
    });

  // Configuração do contador de caracteres para descrição
  const descricaoInput = document.getElementById("descricao");
  const contadorDescricao = document.getElementById("contadorDescricao");

  if (descricaoInput && contadorDescricao) {
    descricaoInput.addEventListener("input", function () {
      const contador = this.value.length;
      contadorDescricao.textContent = contador;

      if (contador > 500) {
        contadorDescricao.classList.add("text-danger");
      } else {
        contadorDescricao.classList.remove("text-danger");
      }
    });
  }

  // Configuração de datas para nova tarefa
  const dataInicioInput = document.getElementById("dataInicio");
  const dataFimInput = document.getElementById("dataFim");

  // Define data/hora mínima como agora
  const agora = new Date();
  const agoraFormatado = agora.toISOString().slice(0, 16);

  if (dataInicioInput) {
    dataInicioInput.min = agoraFormatado;

    // Validação em tempo real
    dataInicioInput.addEventListener("change", function () {
      const dataSelecionada = new Date(this.value);
      if (dataSelecionada < agora) {
        this.value = agoraFormatado;
        mostrarErroNoModalTarefa(
          "Data/hora de início não pode ser anterior ao momento atual!"
        );
      } else {
        limparMensagensModalTarefa();
      }

      // Atualiza data mínima do campo de término
      if (dataFimInput) {
        dataFimInput.min = this.value;
      }
    });
  }

  if (dataFimInput) {
    dataFimInput.min = agoraFormatado;

    // Validação em tempo real
    dataFimInput.addEventListener("change", function () {
      const dataSelecionada = new Date(this.value);
      if (dataSelecionada < agora) {
        this.value = agoraFormatado;
        mostrarErroNoModalTarefa(
          "Data/hora de término não pode ser anterior ao momento atual!"
        );
      } else {
        limparMensagensModalTarefa();
      }

      // Validação em relação à data de início
      if (dataInicioInput && dataInicioInput.value) {
        const dataInicio = new Date(dataInicioInput.value);
        if (dataSelecionada < dataInicio) {
          this.value = dataInicioInput.value;
          mostrarErroNoModalTarefa(
            "Data/hora de término não pode ser anterior à data/hora de início!"
          );
        } else {
          limparMensagensModalTarefa();
        }
      }
    });
  }

  // Limpar mensagens quando o modal for fechado
  document
    .getElementById("modalNovaTarefa")
    ?.addEventListener("hidden.bs.modal", function () {
      limparMensagensModalTarefa();

      // Limpar formulário
      const form = document.getElementById("formNovaTarefa");
      if (form) form.reset();

      // Limpar contador de descrição
      const contadorDescricao = document.getElementById("contadorDescricao");
      if (contadorDescricao) {
        contadorDescricao.textContent = "0";
        contadorDescricao.classList.remove("text-danger");
      }

      // Limpar usuários selecionados
      taskManager.usuariosSelecionados = [];
      renderizarUsuariosSelecionados();
    });

  // Evento quando o modal é aberto
  document
    .getElementById("modalNovaTarefa")
    ?.addEventListener("shown.bs.modal", function () {
      console.log("📂 Modal Nova Tarefa aberto");

      // Definir foco no primeiro campo
      const primeiroCampo = document.getElementById("projeto");
      if (primeiroCampo) {
        primeiroCampo.focus();
      }

      // Atualizar data/hora mínima
      const agora = new Date();
      const agoraFormatado = agora.toISOString().slice(0, 16);

      if (dataInicioInput) {
        dataInicioInput.min = agoraFormatado;
      }
      if (dataFimInput) {
        dataFimInput.min = agoraFormatado;
      }
    });

  // Configuração do modal de novo projeto
  const modalNovoProjeto = document.getElementById("modalNovoProjeto");
  if (modalNovoProjeto) {
    // Evento quando o modal é fechado
    modalNovoProjeto.addEventListener("hidden.bs.modal", function () {
      console.log("🔄 Modal fechado manualmente, limpando campos...");

      // Limpar campos
      if (document.getElementById("novoProjetoNomeModal")) {
        document.getElementById("novoProjetoNomeModal").value = "";
      }
      if (document.getElementById("dataInicioProjeto")) {
        document.getElementById("dataInicioProjeto").value = "";
      }
      if (document.getElementById("dataFimProjeto")) {
        document.getElementById("dataFimProjeto").value = "";
      }

      // Limpar mensagens
      limparMensagensModal();
    });

    // Evento quando o modal é aberto
    modalNovoProjeto.addEventListener("shown.bs.modal", function () {
      console.log("📂 Modal aberto");

      // Definir foco no primeiro campo
      const primeiroCampo = document.getElementById("novoProjetoNomeModal");
      if (primeiroCampo) {
        primeiroCampo.focus();
      }
    });
  }

  // Inicializar tooltips
  inicializarTooltips();
  
  // Inicializar contador de comentários
  inicializarContadorComentario();
});

function configuraEventos() {
  // Busca de usuários
  const usuarioInput = document.getElementById("usuarioInput");
  const usuariosBuscados = document.getElementById("usuariosBuscados");

  if (usuarioInput) {
    usuarioInput.addEventListener("input", async (e) => {
      const termo = e.target.value.trim();

      if (termo.length < 2 || !termo.startsWith("@")) {
        usuariosBuscados.style.display = "none";
        return;
      }

      const dados = await taskManager.fetch(
        `api.php?action=buscar_usuarios&termo=${termo.substring(1)}`
      );

      if (!dados || dados.length === 0) {
        usuariosBuscados.style.display = "none";
        return;
      }

      usuariosBuscados.innerHTML = "";
      dados.forEach((usuario) => {
        const li = document.createElement("li");
        li.className = "list-group-item";
        const displayHandle = usuario.username ? `@${usuario.username}` : `@${usuario.nome}`;
        li.innerHTML = `<strong>${displayHandle}</strong> (${usuario.email})`;
        li.style.cursor = "pointer";
        li.addEventListener("click", () => {
          adicionarUsuarioSelecionado(usuario);
          usuarioInput.value = "";
          usuariosBuscados.style.display = "none";
        });
        usuariosBuscados.appendChild(li);
      });

      usuariosBuscados.style.display = "block";
    });

    // Fechar autocomplete ao clicar fora
    document.addEventListener("click", (e) => {
      if (
        !usuarioInput.contains(e.target) &&
        !usuariosBuscados.contains(e.target)
      ) {
        usuariosBuscados.style.display = "none";
      }
    });
  }

  // Upload de arquivo
  const formUpload = document.getElementById("formUploadArquivo");
  if (formUpload) {
    formUpload.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!taskManager.tarefaEditandoId) {
        taskManager.mostrarErro("Nenhuma tarefa selecionada");
        return false;
      }

      const currentUser = taskManager.getCurrentUser();
      if (!currentUser) {
        taskManager.mostrarErro("Usuário não autenticado");
        return false;
      }

      try {
        const formData = new FormData(formUpload);
        formData.append("tarefa_id", taskManager.tarefaEditandoId);
        formData.append("usuario_id", currentUser.id);

        const dados = await taskManager.fetch("api.php?action=upload_arquivo", {
          method: "POST",
          body: formData,
        });

        if (dados) {
          formUpload.reset();
          await carregarArquivosTarefa(taskManager.tarefaEditandoId);
          taskManager.mostrarSucesso("Arquivo enviado com sucesso!");

          // ✅ ATUALIZAR CONTADOR NA INTERFACE - INCREMENTAR
          atualizarContadoresTarefa(
            taskManager.tarefaEditandoId,
            "arquivo",
            "incrementar"
          );
        }

        return false;
      } catch (error) {
        console.error("Erro no upload:", error);
        return false;
      }
    });
  }

  // Busca em tempo real nas tarefas
  const buscaTarefas = document.getElementById("buscaTarefas");
  if (buscaTarefas) {
    buscaTarefas.addEventListener("input", function (e) {
      const termo = e.target.value.toLowerCase();
      const cards = document.querySelectorAll(
        ".card-tarefa, .kanban-card, .lista-tarefa"
      );

      cards.forEach((card) => {
        const texto = card.textContent.toLowerCase();
        if (texto.includes(termo)) {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }
      });
    });
  }

  // Autocomplete para adicionar usuários na edição
  const usuarioInputEditar = document.getElementById("usuarioInputEditar");
  const usuariosBuscadosEditar = document.getElementById(
    "usuariosBuscadosEditar"
  );

  if (usuarioInputEditar) {
    usuarioInputEditar.addEventListener("input", async (e) => {
      const termo = e.target.value.trim();

      if (termo.length < 2 || !termo.startsWith("@")) {
        usuariosBuscadosEditar.style.display = "none";
        return;
      }

      const dados = await taskManager.fetch(
        `api.php?action=buscar_usuarios&termo=${termo.substring(1)}`
      );

      if (!dados || dados.length === 0) {
        usuariosBuscadosEditar.style.display = "none";
        return;
      }

      usuariosBuscadosEditar.innerHTML = "";
      dados.forEach((usuario) => {
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.innerHTML = `<strong>@${usuario.nome}</strong> (${usuario.email})`;
        li.style.cursor = "pointer";
        li.addEventListener("click", () => {
          adicionarUsuarioTarefaEditando(usuario.id);
          usuarioInputEditar.value = "";
          usuariosBuscadosEditar.style.display = "none";
        });
        usuariosBuscadosEditar.appendChild(li);
      });

      usuariosBuscadosEditar.style.display = "block";
    });

    // Fechar autocomplete ao clicar fora
    document.addEventListener("click", (e) => {
      if (
        !usuarioInputEditar.contains(e.target) &&
        !usuariosBuscadosEditar.contains(e.target)
      ) {
        usuariosBuscadosEditar.style.display = "none";
      }
    });
  }

  // Configurar visualização
  configurarVisualizacao();
}