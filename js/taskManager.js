// ========== GERENCIAMENTO DE TAREFAS ==========
// Este arquivo contém as funções de CRUD de tarefas
// A classe TaskManager é definida em core.js

// ========== FUNÇÕES DE CRIAÇÃO DE TAREFAS ==========

async function criarTarefa() {
  const ehAdmin = await taskManager.verificarSeEhAdmin();
  if (!ehAdmin) {
    mostrarErroNoModalTarefa("Apenas administradores podem criar tarefas");
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
  const dataInicioObj = new Date(data_inicio);
  const dataFimObj = new Date(data_fim);

  if (dataInicioObj < agora) {
    mostrarErroNoModalTarefa(
      "A data/hora de início não pode ser anterior ao momento atual!"
    );
    return;
  }

  if (dataFimObj < agora) {
    mostrarErroNoModalTarefa(
      "A data/hora de término não pode ser anterior ao momento atual!"
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

// ========== FUNÇÕES DE ALTERAÇÃO DE STATUS ==========

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

// ========== FUNÇÕES DE DELEÇÃO ==========

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

// ========== FUNÇÃO DE SALVAMENTO ==========

async function salvarTarefa() {
  const ehAdmin = await taskManager.verificarSeEhAdmin();
  if (!ehAdmin) {
    mostrarErroNoModalEditar("Apenas administradores podem editar tarefas");
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

  // Validação de data/hora
  const agora = new Date();
  const dataInicioObj = new Date(dataInicio);
  const dataFimObj = new Date(dataFim);

  // Permite editar datas passadas apenas se a tarefa já existia
  // Mas não permite datas futuras que sejam anteriores ao momento atual
  if (dataInicioObj < agora && status !== "concluida") {
    mostrarErroNoModalEditar(
      "A data/hora de início não pode ser anterior ao momento atual para tarefas não concluídas!"
    );
    return;
  }

  if (dataFimObj < agora && status !== "concluida") {
    mostrarErroNoModalEditar(
      "A data/hora de término não pode ser anterior ao momento atual para tarefas não concluídas!"
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

// ========== FUNÇÕES AUXILIARES DE VALIDAÇÃO ==========

function validarDatas() {
  const dataInicio = document.getElementById("dataInicio");
  const dataFim = document.getElementById("dataFim");

  if (dataInicio && dataFim && dataInicio.value && dataFim.value) {
    if (new Date(dataFim.value) < new Date(dataInicio.value)) {
      dataFim.classList.add("is-invalid");
    } else {
      dataFim.classList.remove("is-invalid");
    }
  }
}