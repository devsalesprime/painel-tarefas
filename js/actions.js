// ========== AÇÕES DE PROJETOS ==========

// Função auxiliar para mostrar erros em modais genéricos
function mostrarErroNoModal(mensagem, containerId = "modalNovoProjetoAlertas") {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = `
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
      <i class="fas fa-exclamation-circle"></i> ${mensagem}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  
  setTimeout(() => {
    container.innerHTML = "";
  }, 5000);
}

// Função auxiliar para verificar se é admin ou editor
async function verificarSeEhAdminOuEditor() {
  const userData = taskManager.getCurrentUser();
  return userData && (userData.funcao === 'admin' || userData.funcao === 'editor');
}

// actions.js - Corrigir chamadas POST
async function criarProjetoRapido() {
  // Verificar se é admin ou editor
  const temPermissao = await verificarSeEhAdminOuEditor();
  if (!temPermissao) {
    taskManager.mostrarErro("Apenas administradores e editores podem criar projetos");
    return;
  }

  // Buscar nome do projeto dos dois possíveis inputs
  const nomeProjeto = 
    document.getElementById("novoProjetoNome")?.value?.trim() || 
    document.getElementById("novoProjetoNomeModal")?.value?.trim();

  if (!nomeProjeto) {
    const mensagem = "Digite o nome do projeto!";
    if (document.getElementById("modalNovoProjeto")?.classList.contains("show")) {
      mostrarErroNoModal(mensagem, "modalNovoProjetoAlertas");
    } else {
      mostrarErroNoModalTarefa(mensagem);
    }
    return;
  }

  // Buscar datas (se existirem)
  const dataInicio = document.getElementById("dataInicioProjeto")?.value;
  const dataFim = document.getElementById("dataFimProjeto")?.value;
  const descricao = document.getElementById("novoProjetoDescricao")?.value?.trim() || "";

  try {
    console.log("🚀 Enviando requisição para criar projeto...");

    const dados = await taskManager.fetch("api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "criar_projeto_rapido",
        nome: nomeProjeto,
        descricao: descricao,
        data_inicio: dataInicio || null,
        data_fim: dataFim || null,
      }),
    });

    if (dados) {
      taskManager.mostrarSucesso("✅ Projeto criado com sucesso!");
      
      // Limpar campos
      if (document.getElementById("novoProjetoNome")) {
        document.getElementById("novoProjetoNome").value = "";
      }
      if (document.getElementById("novoProjetoNomeModal")) {
        document.getElementById("novoProjetoNomeModal").value = "";
        document.getElementById("novoProjetoDescricao").value = "";
        document.getElementById("dataInicioProjeto").value = "";
        document.getElementById("dataFimProjeto").value = "";
      }
      
      // Fechar modal se estiver aberto
      const modalNovoProjeto = document.getElementById("modalNovoProjeto");
      if (modalNovoProjeto?.classList.contains("show")) {
        const modal = bootstrap.Modal.getInstance(modalNovoProjeto);
        if (modal) modal.hide();
      }
      
      // Ocultar container de criação rápida
      const container = document.getElementById("criacaoProjetoContainer");
      if (container) {
        container.style.display = "none";
      }
      
      // Recarregar projetos
      await carregarProjetos();
      
      // Atualizar select de projetos se estiver no modal de tarefa
      if (dados.projeto_id) {
        const selectProjeto = document.getElementById("projeto");
        if (selectProjeto) {
          const option = document.createElement("option");
          option.value = dados.projeto_id;
          option.textContent = nomeProjeto;
          option.selected = true;
          selectProjeto.appendChild(option);
        }
      }
    }
  } catch (error) {
    console.error("❌ Erro ao criar projeto:", error);
    const mensagem = "Erro ao criar projeto: " + error.message;
    if (document.getElementById("modalNovoProjeto")?.classList.contains("show")) {
      mostrarErroNoModal(mensagem, "modalNovoProjetoAlertas");
    } else {
      mostrarErroNoModalTarefa(mensagem);
    }
  }
}

async function concluirProjeto(projetoId) {
  if (!projetoId) {
    taskManager.mostrarErro("ID do projeto inválido");
    return;
  }

  const ehAdmin = await taskManager.verificarSeEhAdmin();
  if (!ehAdmin) {
    taskManager.mostrarErro("Apenas administradores podem concluir projetos");
    return;
  }

  // Modal de confirmação com opções
  const confirmar = confirm(
    "🎯 Deseja concluir este projeto?\n\n" +
      "✓ O projeto será marcado como concluído\n" +
      "✓ Todas as tarefas pendentes serão finalizadas\n" +
      "✓ Você poderá reabrir o projeto depois se necessário\n\n" +
      "Confirmar conclusão?"
  );

  if (!confirmar) return;

  try {
    const dados = await taskManager.fetch("api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "concluir_projeto",
        projeto_id: projetoId,
      }),
    });

    if (dados) {
      taskManager.mostrarSucesso("🎉 Projeto concluído com sucesso!");
      await carregarProjetos();
      await renderizarTarefas();
    }
  } catch (error) {
    console.error("Erro ao concluir projeto:", error);
    taskManager.mostrarErro("Erro ao concluir projeto: " + error.message);
  }
}

async function reabrirProjeto(projetoId) {
  if (!projetoId) {
    taskManager.mostrarErro("ID do projeto inválido");
    return;
  }

  const ehAdmin = await taskManager.verificarSeEhAdmin();
  if (!ehAdmin) {
    taskManager.mostrarErro("Apenas administradores podem reabrir projetos");
    return;
  }

  if (!confirm("Deseja reabrir este projeto? Ele voltará ao status ativo.")) {
    return;
  }

  try {
    const dados = await taskManager.fetch("api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reabrir_projeto",
        projeto_id: projetoId,
      }),
    });

    if (dados) {
      taskManager.mostrarSucesso("✓ Projeto reaberto com sucesso!");
      await carregarProjetos();
      await renderizarTarefas();
    }
  } catch (error) {
    console.error("Erro ao reabrir projeto:", error);
    taskManager.mostrarErro("Erro ao reabrir projeto: " + error.message);
  }
}

async function deletarProjeto(projetoId) {
  if (!projetoId) {
    taskManager.mostrarErro("ID do projeto inválido");
    return;
  }

  const ehAdmin = await taskManager.verificarSeEhAdmin();
  if (!ehAdmin) {
    taskManager.mostrarErro("Apenas administradores podem deletar projetos");
    return;
  }

  // Confirmação mais elaborada
  const confirmar = confirm(
    "⚠️ ATENÇÃO: Deletar Projeto\n\n" +
      "❌ Esta ação NÃO pode ser desfeita!\n" +
      "❌ Todas as tarefas serão marcadas como excluídas\n" +
      "❌ Histórico e arquivos serão mantidos no banco\n\n" +
      "Tem certeza que deseja DELETAR este projeto?"
  );

  if (!confirmar) return;

  // Segunda confirmação
  const confirmarNovamente = confirm(
    "🚨 ÚLTIMA CONFIRMAÇÃO\n\n" +
      'Digite "SIM" mentalmente e clique em OK para confirmar a exclusão definitiva.'
  );

  if (!confirmarNovamente) return;

  try {
    console.log(`🗑️ Iniciando deleção do projeto ${projetoId}...`);

    const dados = await taskManager.fetch("api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "deletar_projeto",
        projeto_id: projetoId,
      }),
    });

    if (dados) {
      taskManager.mostrarSucesso("🗑️ Projeto deletado com sucesso!");

      // ✅ FORÇAR LIMPEZA IMEDIATA
      
      // 1. Fechar modal se estiver aberto
      const modalEditarProjeto = document.getElementById("modalEditarProjeto");
      if (modalEditarProjeto) {
        const modal = bootstrap.Modal.getInstance(modalEditarProjeto);
        if (modal) modal.hide();
      }

      // 2. Limpar container temporariamente
      const container = document.getElementById("projetosContainer");
      if (container) {
        container.innerHTML = '<div class="text-center p-3"><div class="spinner-border" role="status"><span class="visually-hidden">Atualizando...</span></div></div>';
      }

      // 3. Recarregar dados com força
      await Promise.all([
        carregarProjetos(),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);
      
      // 4. Renderizar tarefas com força
      await renderizarTarefas();

      // 5. Forçar atualização visual adicional
      setTimeout(() => {
        renderizarTarefas();
      }, 1000);

      console.log(`✅ Projeto ${projetoId} deletado e interface atualizada`);
    }
  } catch (error) {
    console.error("❌ Erro ao deletar projeto:", error);
    taskManager.mostrarErro("Erro ao deletar projeto: " + error.message);
    
    // Recarregar a interface mesmo em caso de erro
    await renderizarTarefas();
  }
}

// ========== EDIÇÃO DE PROJETO ==========

function abrirModalEditarProjeto(projeto) {
  const userData = taskManager.getCurrentUser();
  const temPermissao = userData && (userData.funcao === 'admin' || userData.funcao === 'editor');
  
  if (!temPermissao) {
    taskManager.mostrarErro("Apenas administradores e editores podem editar projetos");
    return;
  }

  taskManager.projetoEditandoId = projeto.id;

  setTimeout(() => {
    const idInput = document.getElementById("editProjetoId");
    const nomeInput = document.getElementById("editProjetoNome");
    const descInput = document.getElementById("editProjetoDescricao");
    const dataInicioInput = document.getElementById("editProjetoDataInicio");
    const dataFimInput = document.getElementById("editProjetoDataFim");

    if (idInput && nomeInput && descInput && dataInicioInput && dataFimInput) {
      idInput.value = projeto.id;
      nomeInput.value = projeto.nome || "";
      descInput.value = projeto.descricao || "";

      if (projeto.data_inicio) {
        dataInicioInput.value = projeto.data_inicio.slice(0, 10);
      }
      if (projeto.data_fim) {
        dataFimInput.value = projeto.data_fim.slice(0, 10);
      }

      // Mostrar/ocultar botões baseado no status
      const btnConcluir = document.getElementById("btnConcluirProjeto");
      const btnReabrir = document.getElementById("btnReabrirProjeto");

      if (projeto.status === "concluido") {
        if (btnConcluir) btnConcluir.style.display = "none";
        if (btnReabrir) btnReabrir.style.display = "inline-block";
      } else {
        if (btnConcluir) btnConcluir.style.display = "inline-block";
        if (btnReabrir) btnReabrir.style.display = "none";
      }

      // Abrir o modal
      const modal = new bootstrap.Modal(
        document.getElementById("modalEditarProjeto")
      );
      modal.show();
    }
  }, 100);
}

async function editarProjeto() {
  const temPermissao = await verificarSeEhAdminOuEditor();
  if (!temPermissao) {
    taskManager.mostrarErro("Apenas administradores e editores podem editar projetos");
    return;
  }

  const nomeInput = document.getElementById("editProjetoNome");
  const descInput = document.getElementById("editProjetoDescricao");
  const dataInicioInput = document.getElementById("editProjetoDataInicio");
  const dataFimInput = document.getElementById("editProjetoDataFim");

  if (!nomeInput || !descInput || !dataInicioInput || !dataFimInput) {
    taskManager.mostrarErro("Elementos do formulário não encontrados");
    return;
  }

  const nome = nomeInput.value.trim();
  const descricao = descInput.value.trim();
  const dataInicio = dataInicioInput.value;
  const dataFim = dataFimInput.value;

  if (!nome) {
    taskManager.mostrarErro("Preencha o nome do projeto!");
    return;
  }

  if (!taskManager.projetoEditandoId) {
    taskManager.mostrarErro("ID do projeto não encontrado");
    return;
  }

  const dados = await taskManager.fetch("api.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "editar_projeto",
      projeto_id: taskManager.projetoEditandoId,
      nome,
      descricao,
      data_inicio: dataInicio,
      data_fim: dataFim,
    }),
  });

  if (dados) {
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("modalEditarProjeto")
    );
    if (modal) {
      modal.hide();
    }
    taskManager.mostrarSucesso("Projeto alterado com sucesso!");
    await carregarProjetos();
    await renderizarTarefas();
    taskManager.projetoEditandoId = null;
  }
}

function concluirProjetoAtual() {
  if (!taskManager.projetoEditandoId) {
    taskManager.mostrarErro("ID do projeto não encontrado");
    return;
  }

  concluirProjeto(taskManager.projetoEditandoId);

  // Fechar o modal após concluir
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("modalEditarProjeto")
  );
  if (modal) {
    modal.hide();
  }
  taskManager.projetoEditandoId = null;
}

function reabrirProjetoAtual() {
  if (!taskManager.projetoEditandoId) {
    taskManager.mostrarErro("ID do projeto não encontrado");
    return;
  }

  reabrirProjeto(taskManager.projetoEditandoId);

  // Fechar o modal após reabrir
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("modalEditarProjeto")
  );
  if (modal) {
    modal.hide();
  }
  taskManager.projetoEditandoId = null;
}

function deletarProjetoAtual() {
  if (!taskManager.projetoEditandoId) {
    taskManager.mostrarErro("ID do projeto não encontrado");
    return;
  }

  deletarProjeto(taskManager.projetoEditandoId);

  // Fechar o modal após deletar
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("modalEditarProjeto")
  );
  if (modal) {
    modal.hide();
  }
  taskManager.projetoEditandoId = null;
}

// ========== AÇÕES DE TAREFAS ==========

async function criarTarefa() {
  const temPermissao = await verificarSeEhAdminOuEditor();
  if (!temPermissao) {
    mostrarErroNoModalTarefa("Apenas administradores e editores podem criar tarefas");
    return;
  }

  const projeto_id = document.getElementById("projeto")?.value;
  const titulo = document.getElementById("titulo")?.value.trim();
  const descricao = document.getElementById("descricao")?.value.trim();
  const data_inicio = document.getElementById("dataInicio")?.value;
  const data_fim = document.getElementById("dataFim")?.value;
  const prioridade =
    document.getElementById("prioridadeTarefa")?.value ||
    "importante_nao_urgente";

  if (!projeto_id || !titulo || !data_inicio || !data_fim) {
    mostrarErroNoModalTarefa("Preencha todos os campos obrigatórios!");
    return;
  }

  // Validação de data/hora
  const agora = new Date();
  agora.setHours(0, 0, 0, 0); // Normalizar para início do dia
  
  // Como os inputs são date (yyyy-mm-dd), o Date construtor assume UTC 00:00 se usar string,
  // ou local 00:00 dependendo do navegador. Para garantir, criamos com time zerado.
  // Ajuste: pegar os componentes da string para criar data local correta
  const criarDataLocal = (dataString) => {
      const [ano, mes, dia] = dataString.split('-').map(Number);
      return new Date(ano, mes - 1, dia); // mês é 0-indexado
  };

  const dataInicioObj = criarDataLocal(data_inicio);
  const dataFimObj = criarDataLocal(data_fim);

  if (dataInicioObj < agora) {
    mostrarErroNoModalTarefa(
      "A data de início não pode ser anterior a hoje!"
    );
    return;
  }

  if (dataFimObj < agora) {
    mostrarErroNoModalTarefa(
      "A data de término não pode ser anterior a hoje!"
    );
    return;
  }

  if (dataFimObj < dataInicioObj) {
    mostrarErroNoModalTarefa(
      "A data/hora de término não pode ser anterior à data/hora de início!"
    );
    return;
  }

  try {
    console.log("🚀 Enviando requisição para criar tarefa...");

    const dados = await taskManager.fetch("api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "criar_tarefa",
        projeto_id: parseInt(projeto_id),
        titulo,
        descricao,
        data_inicio,
        data_fim,
        prioridade: prioridade,
        usuarios: taskManager.usuariosSelecionados.map((u) => u.id),
      }),
    });

    console.log("✅ Resposta recebida:", dados);

    if (dados) {
      mostrarSucessoNoModalTarefa("Tarefa criada com sucesso!");

      // Fechar modal após 1.5 segundos
      setTimeout(() => {
        console.log("⏰ Iniciando processo de fechamento do modal...");

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

        // Limpar mensagens do modal
        limparMensagensModalTarefa();

        // Tentar fechar o modal
        const fechouSucesso = fecharModalNovaTarefa();

        if (fechouSucesso) {
          console.log("✅ Modal Nova Tarefa fechado com sucesso");

          // Recarregar tarefas
          renderizarTarefas();
        } else {
          console.error("❌ Não foi possível fechar o modal Nova Tarefa");
          mostrarErroNoModalTarefa(
            "Não foi possível fechar o modal. Feche manualmente."
          );
        }
      }, 1500);
    }
  } catch (error) {
    console.error("❌ Erro ao criar tarefa:", error);
    mostrarErroNoModalTarefa("Erro ao criar tarefa: " + error.message);
  }
}

async function salvarTarefa() {
  const temPermissao = await verificarSeEhAdminOuEditor();
  if (!temPermissao) {
    mostrarErroNoModalEditar("Apenas administradores e editores podem editar tarefas");
    return;
  }

  if (!taskManager.tarefaEditandoId) {
    mostrarErroNoModalEditar("Nenhuma tarefa selecionada para edição");
    return;
  }

  const titulo = document.getElementById("editarTitulo").value.trim();
  const descricao = document.getElementById("editarDescricao").value.trim();
  const dataInicio = document.getElementById("editarDataInicio").value;
  const dataFim = document.getElementById("editarDataFim").value;
  const status = document.getElementById("editarStatus").value;
  const prioridade = document.getElementById("editarPrioridade").value;

  // Validações
  if (!titulo || !dataInicio || !dataFim) {
    mostrarErroNoModalEditar("Título e datas são obrigatórios");
    return;
  }

  // Validação de data
  const agora = new Date();
  agora.setHours(0, 0, 0, 0); // Normalizar para início do dia

  // Helper para criar data local (reaproveitar ou copiar lógica)
  const criarDataLocal = (dataString) => {
      if (!dataString) return null;
      const [ano, mes, dia] = dataString.split('-').map(Number);
      return new Date(ano, mes - 1, dia);
  };

  const dataInicioObj = criarDataLocal(dataInicio);
  const dataFimObj = criarDataLocal(dataFim);

  // Permite editar datas passadas apenas se a tarefa já existia
  // Mas não permite datas futuras que sejam anteriores ao momento atual
  if (dataInicioObj < agora && status !== "concluida") {
    mostrarErroNoModalEditar(
      "A data de início não pode ser anterior a hoje para tarefas não concluídas!"
    );
    return;
  }

  if (dataFimObj < agora && status !== "concluida") {
    mostrarErroNoModalEditar(
      "A data de término não pode ser anterior a hoje para tarefas não concluídas!"
    );
    return;
  }

  if (dataFimObj < dataInicioObj) {
    mostrarErroNoModalEditar(
      "A data/hora de término não pode ser anterior à data/hora de início"
    );
    return;
  }

  try {
    console.log("🚀 Enviando requisição para editar tarefa...");

    const dados = await taskManager.fetch("api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "editar_tarefa",
        tarefa_id: taskManager.tarefaEditandoId,
        titulo,
        descricao,
        data_inicio: dataInicio,
        data_fim: dataFim,
        status,
        prioridade,
      }),
    });

    console.log("✅ Resposta recebida:", dados);

    if (dados) {
      mostrarSucessoNoModalEditar("Tarefa atualizada com sucesso!");

      // Fechar modal após 1.5 segundos
      setTimeout(() => {
        console.log("⏰ Iniciando processo de fechamento do modal...");

        // Limpar mensagens do modal
        limparMensagensModalEditar();

        // Tentar fechar o modal
        const fechouSucesso = fecharModalEditarTarefa();

        if (fechouSucesso) {
          console.log("✅ Modal Editar Tarefa fechado com sucesso");

          // Recarregar tarefas
          renderizarTarefas();
        } else {
          console.error("❌ Não foi possível fechar o modal Editar Tarefa");
          mostrarErroNoModalEditar(
            "Não foi possível fechar o modal. Feche manualmente."
          );
        }
      }, 1500);
    }
  } catch (error) {
    console.error("❌ Erro ao salvar tarefa:", error);
    mostrarErroNoModalEditar("Erro ao salvar tarefa: " + error.message);
  }
}

async function alterarStatusTarefa(tarefaId, action) {
  const dados = await taskManager.fetch("api.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, tarefa_id: tarefaId }),
  });

  if (dados) {
    taskManager.mostrarSucesso("Status atualizado com sucesso!");
    await renderizarTarefas();
  }
}

async function pausarTarefa(tarefaId) {
  await alterarStatusTarefa(tarefaId, "pausar_tarefa");
}

async function iniciarTarefa(tarefaId) {
  await alterarStatusTarefa(tarefaId, "iniciar_tarefa");
}

async function concluirTarefa(tarefaId) {
  // Perguntar se quer definir data/hora específica
  const definirData = confirm(
    "Deseja definir uma data/hora específica para conclusão? Clique em OK para definir ou Cancelar para usar a data/hora atual."
  );

  let dataConclusao = null;

  if (definirData) {
    // Criar um modal simples para selecionar data/hora
    const dataHora = prompt(
      "Digite a data e hora da conclusão (formato: YYYY-MM-DD HH:MM:SS) ou deixe em branco para usar agora:",
      new Date().toISOString().slice(0, 19).replace("T", " ")
    );

    if (dataHora !== null) {
      // Usuário não cancelou
      dataConclusao =
        dataHora || new Date().toISOString().slice(0, 19).replace("T", " ");
    } else {
      return; // Usuário cancelou
    }
  }

  const dados = await taskManager.fetch("api.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "concluir_tarefa",
      tarefa_id: tarefaId,
      data_conclusao: dataConclusao,
    }),
  });

  if (dados) {
    taskManager.mostrarSucesso("Tarefa marcada como concluída com sucesso!");
    await renderizarTarefas();
  }
}

// NOVA FUNÇÃO: Reabrir tarefa concluída
async function reabrirTarefa(tarefaId) {
  if (!confirm("Tem certeza que deseja reabrir esta tarefa?")) return;

  const dados = await taskManager.fetch("api.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "reabrir_tarefa",
      tarefa_id: tarefaId,
      novo_status: "iniciada",
    }),
  });

  if (dados) {
    taskManager.mostrarSucesso("Tarefa reaberta com sucesso!");
    await renderizarTarefas();
  }
}

async function deletarTarefa(tarefaId) {
  const ehAdmin = await taskManager.verificarSeEhAdmin();
  if (!ehAdmin) {
    taskManager.mostrarErro("Apenas administradores podem deletar tarefas");
    return;
  }

  if (!tarefaId) {
    taskManager.mostrarErro("ID da tarefa inválido");
    return;
  }

  if (
    !confirm(
      "Tem certeza que deseja deletar esta tarefa? Esta ação não pode ser desfeita."
    )
  ) {
    return;
  }

  try {
    const dados = await taskManager.fetch("api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "deletar_tarefa",
        tarefa_id: tarefaId,
      }),
    });

    if (dados) {
      // Fechar o modal CORRETAMENTE
      const modalElement = document.getElementById("modalEditarTarefa");
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }

      taskManager.tarefaEditandoId = null;
      taskManager.mostrarSucesso("Tarefa deletada com sucesso!");
      await renderizarTarefas();
    }
  } catch (error) {
    console.error("Erro ao deletar tarefa:", error);
    taskManager.mostrarErro("Erro ao deletar tarefa: " + error.message);
  }
}

// ========== FUNÇÃO PARA ALTERAR PRIORIDADE ==========

async function alterarPrioridadeTarefa(tarefaId, novaPrioridade) {
  const dados = await taskManager.fetch("api.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "alterar_prioridade_tarefa",
      tarefa_id: tarefaId,
      prioridade: novaPrioridade,
    }),
  });

  if (dados) {
    taskManager.mostrarSucesso("Prioridade da tarefa atualizada!");
    await renderizarTarefas();
  }
}