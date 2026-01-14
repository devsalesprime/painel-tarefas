// ========== FUNÇÕES COMPLEMENTARES ==========

// ========== GERENCIAMENTO DE USUÁRIOS ==========

function adicionarUsuarioSelecionado(usuario) {
  if (!taskManager.usuariosSelecionados.some((u) => u.id === usuario.id)) {
    taskManager.usuariosSelecionados.push(usuario);
    renderizarUsuariosSelecionados();
  }
}

function removerUsuarioSelecionado(usuarioId) {
  taskManager.usuariosSelecionados = taskManager.usuariosSelecionados.filter(
    (u) => u.id !== usuarioId
  );
  renderizarUsuariosSelecionados();
}

function renderizarUsuariosSelecionados() {
  const container = document.getElementById("usuariosSelecionados");
  if (container) {
    container.innerHTML = taskManager.usuariosSelecionados
      .map(u => {
        const handle = u.username ? `@${u.username}` : `@${u.nome}`;
        return `
          <span class="usuario-badge-selecionado" data-user-id="${u.id}">
              <i class="fas fa-user-circle"></i>
              ${handle}
              <span class="remove" onclick="removerUsuarioSelecionado(${u.id})">×</span>
          </span>
        `;
      }).join('');
  }
}

async function adicionarUsuarioTarefaEditando(usuario_id) {
  // Obter tarefa atual para verificar permissão
  let temPermissao = await taskManager.verificarSeEhAdmin();
  
  if (!temPermissao && taskManager.tarefaEditandoId) {
    // Se não é admin, verifica se é editor atribuído
    const tarefa = await taskManager.fetch(`api.php?action=obter_tarefa&tarefa_id=${taskManager.tarefaEditandoId}`);
    if (tarefa) {
        temPermissao = await taskManager.verificarPermissaoEdicao(tarefa);
    }
  }

  if (!temPermissao) {
    taskManager.mostrarErro(
      "Você não tem permissão para adicionar usuários a esta tarefa"
    );
    return;
  }

  if (!taskManager.tarefaEditandoId) {
    taskManager.mostrarErro("Nenhuma tarefa selecionada para edição");
    return;
  }

  try {
    const dados = await taskManager.fetch("api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "adicionar_usuario_tarefa",
        tarefa_id: taskManager.tarefaEditandoId,
        usuario_id: usuario_id,
      }),
    });

    if (dados) {
      document.getElementById("usuarioInputEditar").value = "";
      document.getElementById("usuariosBuscadosEditar").style.display = "none";
      await carregarUsuariosTarefa(taskManager.tarefaEditandoId);
      taskManager.mostrarSucesso("Usuário adicionado à tarefa!");
    }
  } catch (error) {
    console.error("Erro ao adicionar usuário:", error);
    taskManager.mostrarErro("Erro ao adicionar usuário à tarefa");
  }
}

async function removerUsuarioTarefaEditando(usuario_id) {
  try {
    // Verificar permissão
    let temPermissao = await taskManager.verificarSeEhAdmin();
  
    if (!temPermissao && taskManager.tarefaEditandoId) {
        const tarefa = await taskManager.fetch(`api.php?action=obter_tarefa&tarefa_id=${taskManager.tarefaEditandoId}`);
        if (tarefa) {
            temPermissao = await taskManager.verificarPermissaoEdicao(tarefa);
        }
    }

    if (!temPermissao) {
      taskManager.mostrarErro(
        "Você não tem permissão para remover usuários desta tarefa"
      );
      return;
    }

    if (!taskManager.tarefaEditandoId) {
      taskManager.mostrarErro("Nenhuma tarefa selecionada para edição");
      return;
    }

    if (!confirm("Tem certeza que deseja remover este usuário da tarefa?")) {
      return;
    }

    const payload = {
      action: "remover_usuario_tarefa",
      tarefa_id: taskManager.tarefaEditandoId,
      usuario_id: usuario_id,
    };

    console.log("🔁 Removendo usuário da tarefa - payload:", payload);

    const dados = await taskManager.fetch("api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (dados) {
      await carregarUsuariosTarefa(taskManager.tarefaEditandoId);
      taskManager.mostrarSucesso("Usuário removido da tarefa!");
    }
  } catch (error) {
    console.error("Erro ao remover usuário:", error);
    taskManager.mostrarErro("Erro ao remover usuário da tarefa");
  }
}

// ========== FUNÇÕES DE ETAPAS (CHECKLIST) ==========

async function adicionarEtapaModalEditar() {
  const input = document.getElementById("novaEtapaEditar");
  const descricao = input.value.trim();

  if (!descricao) {
    taskManager.mostrarErro("Digite a descrição da etapa");
    return;
  }

  if (!taskManager.tarefaEditandoId) {
    taskManager.mostrarErro("Nenhuma tarefa selecionada");
    return;
  }

  try {
    const dados = await taskManager.fetch("api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "criar_etapa",
        tarefa_id: taskManager.tarefaEditandoId,
        descricao: descricao,
      }),
    });

    if (dados) {
      input.value = "";
      taskManager.mostrarSucesso("Etapa adicionada com sucesso!");

      // Recarregar os detalhes para atualizar a lista de etapas e o progresso
      const tarefa = await taskManager.fetch(
        `api.php?action=obter_tarefa&tarefa_id=${taskManager.tarefaEditandoId}`
      );
      if (tarefa) {
        await carregarEtapasEditar(tarefa.etapas || []);
        atualizarBarraProgressoEditar(tarefa.progresso || 0);
      }

      // Atualizar a lista principal de tarefas
      await renderizarTarefas();
    }
  } catch (error) {
    console.error("Erro ao adicionar etapa:", error);
    taskManager.mostrarErro("Erro ao adicionar etapa: " + error.message);
  }
}

async function toggleEtapaModalEditar(etapaId, concluida) {
  try {
    const dados = await taskManager.fetch("api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "atualizar_etapa",
        etapa_id: etapaId,
        concluida: concluida ? 1 : 0,
      }),
    });

    if (dados) {
      // Recarregar progresso
      const tarefa = await taskManager.fetch(
        `api.php?action=obter_tarefa&tarefa_id=${taskManager.tarefaEditandoId}`
      );
      if (tarefa) {
        atualizarBarraProgressoEditar(tarefa.progresso || 0);
      }
      taskManager.mostrarSucesso("Etapa atualizada!");

      // Atualizar a lista principal
      await renderizarTarefas();
    }
  } catch (error) {
    console.error("Erro ao atualizar etapa:", error);
    taskManager.mostrarErro("Erro ao atualizar etapa: " + error.message);
  }
}

async function deletarEtapaModalEditar(etapaId) {
  if (!confirm("Tem certeza que deseja deletar esta etapa?")) return;

  try {
    const dados = await taskManager.fetch("api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "deletar_etapa",
        etapa_id: etapaId,
      }),
    });

    if (dados) {
      // Recarregar etapas e progresso
      const tarefa = await taskManager.fetch(
        `api.php?action=obter_tarefa&tarefa_id=${taskManager.tarefaEditandoId}`
      );
      if (tarefa) {
        await carregarEtapasEditar(tarefa.etapas || []);
        atualizarBarraProgressoEditar(tarefa.progresso || 0);
      }
      taskManager.mostrarSucesso("Etapa deletada com sucesso!");

      // Atualizar a lista principal
      await renderizarTarefas();
    }
  } catch (error) {
    console.error("Erro ao deletar etapa:", error);
    taskManager.mostrarErro("Erro ao deletar etapa: " + error.message);
  }
}

// ========== COMENTÁRIOS ==========

async function adicionarComentario() {
  const novoComentario = document.getElementById("novoComentario");
  if (!novoComentario) return;

  const comentario = novoComentario.value.trim();
  if (!comentario) {
    taskManager.mostrarErro("Digite um comentário!");
    return;
  }

  if (!taskManager.tarefaEditandoId) {
    taskManager.mostrarErro("Nenhuma tarefa selecionada");
    return;
  }

  const currentUser = taskManager.getCurrentUser();
  if (!currentUser) {
    taskManager.mostrarErro("Usuário não autenticado");
    return;
  }

  // Verificar permissão
  let temPermissao = await taskManager.verificarSeEhAdmin();
  
  if (!temPermissao && taskManager.tarefaEditandoId) {
    const tarefa = await taskManager.fetch(`api.php?action=obter_tarefa&tarefa_id=${taskManager.tarefaEditandoId}`);
    if (tarefa) {
        temPermissao = await taskManager.verificarPermissaoEdicao(tarefa);
    }
  }

  if (!temPermissao) {
    taskManager.mostrarErro("Você não tem permissão para comentar nesta tarefa");
    return;
  }

  try {
    const dados = await taskManager.fetch("api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "adicionar_comentario",
        tarefa_id: taskManager.tarefaEditandoId,
        usuario_id: currentUser.id,
        comentario: comentario,
      }),
    });

    if (dados) {
      novoComentario.value = "";
      // resetar o contador visível (se existir)
      const contadorEl = document.getElementById("contadorComentario");
      const contadorPalavrasEl = document.getElementById("contadorComentarioPalavras");
      if (contadorEl) contadorEl.textContent = "0 caracteres";
      if (contadorPalavrasEl) contadorPalavrasEl.textContent = "0 palavras";

      await carregarComentariosTarefa(taskManager.tarefaEditandoId);
      taskManager.mostrarSucesso("Comentário adicionado com sucesso!");

      // ✅ ATUALIZAR CONTADOR NA INTERFACE - INCREMENTAR
      atualizarContadoresTarefa(
        taskManager.tarefaEditandoId,
        "comentário",
        "incrementar"
      );
    }
  } catch (error) {
    console.error("Erro ao adicionar comentário:", error);
    taskManager.mostrarErro("Erro ao adicionar comentário");
  }
}

async function deletarComentario(comentarioId) {
  if (!confirm("Tem certeza que deseja deletar este comentário?")) return;

  const currentUser = taskManager.getCurrentUser();
  if (!currentUser) {
    taskManager.mostrarErro("Usuário não autenticado");
    return;
  }

  try {
    const dados = await taskManager.fetch("api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "deletar_comentario",
        comentario_id: comentarioId,
        usuario_id: currentUser.id,
      }),
    });

    if (dados) {
      await carregarComentariosTarefa(taskManager.tarefaEditandoId);
      taskManager.mostrarSucesso("Comentário deletado com sucesso!");

      // ✅ ATUALIZAR CONTADOR NA INTERFACE - DECREMENTAR
      atualizarContadoresTarefa(
        taskManager.tarefaEditandoId,
        "comentário",
        "decrementar"
      );
    }
  } catch (error) {
    console.error("Erro ao deletar comentário:", error);
    taskManager.mostrarErro("Erro ao deletar comentário");
  }
}

// ========== ARQUIVOS ==========

// baixarArquivoApi - download via api.php?action=download_arquivo&arquivo_id=ID using Authorization header
async function baixarArquivoApi(arquivoId, nomeOriginal) {
  try {
    const token = localStorage.getItem("auth_token");
    if (!token) throw new Error("Usuário não autenticado");

    const url = `api.php?action=download_arquivo&arquivo_id=${encodeURIComponent(arquivoId)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token,
      },
    });

    if (!response.ok) {
      // Try to parse JSON error if present
      const text = await response.text().catch(() => null);
      let msg = `Erro ao baixar arquivo (status ${response.status})`;
      try {
        if (text) {
          const json = JSON.parse(text);
          msg = json.erro || msg;
        }
      } catch (e) {
        // ignore parse errors, use generic msg
      }
      throw new Error(msg);
    }

    const blob = await response.blob();
    const urlBlob = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = urlBlob;
    a.download = nomeOriginal || `arquivo-${arquivoId}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(urlBlob);
  } catch (error) {
    console.error("Erro ao baixar arquivo:", error);
    taskManager.mostrarErro("Erro ao baixar arquivo: " + (error.message || error));
  }
}

async function deletarArquivo(arquivoId) {
  if (!confirm("Tem certeza que deseja deletar este arquivo?")) return;

  try {
    const dados = await taskManager.fetch("api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "deletar_arquivo",
        arquivo_id: arquivoId,
      }),
    });

    if (dados) {
      await carregarArquivosTarefa(taskManager.tarefaEditandoId);
      taskManager.mostrarSucesso("Arquivo deletado com sucesso!");

      // ✅ ATUALIZAR CONTADOR NA INTERFACE - DECREMENTAR
      atualizarContadoresTarefa(
        taskManager.tarefaEditandoId,
        "arquivo",
        "decrementar"
      );
    }
  } catch (error) {
    console.error("Erro ao deletar arquivo:", error);
    taskManager.mostrarErro("Erro ao deletar arquivo");
  }
}

// ========== DRAG AND DROP PARA KANBAN ==========

function configurarDragAndDrop() {
  const cards = document.querySelectorAll(".kanban-card");
  const columns = document.querySelectorAll(".kanban-column");

  cards.forEach((card) => {
    card.addEventListener("dragstart", handleDragStart);
    card.addEventListener("dragend", handleDragEnd);
  });

  columns.forEach((column) => {
    column.addEventListener("dragover", handleDragOver);
    column.addEventListener("dragenter", handleDragEnter);
    column.addEventListener("dragleave", handleDragLeave);
    column.addEventListener("drop", handleDrop);
  });
}

function handleDragStart(e) {
  e.dataTransfer.setData("text/plain", e.target.dataset.tarefaId);
  e.target.classList.add("dragging");
  setTimeout(() => (e.target.style.display = "none"), 0);
}

function handleDragEnd(e) {
  e.target.classList.remove("dragging");
  e.target.style.display = "block";
}

function handleDragOver(e) {
  e.preventDefault();
}

function handleDragEnter(e) {
  e.preventDefault();
  const column = e.target.closest(".kanban-column");
  if (column) {
    column.classList.add("drag-over");
  }
}

function handleDragLeave(e) {
  const column = e.target.closest(".kanban-column");
  if (column) {
    column.classList.remove("drag-over");
  }
}

async function handleDrop(e) {
  e.preventDefault();
  const column = e.target.closest(".kanban-column");
  if (!column) return;

  column.classList.remove("drag-over");

  const tarefaId = e.dataTransfer.getData("text/plain");
  const novoStatus = column.dataset.status;
  const projetoId = column.dataset.projetoId;

  console.log(`🎯 Movendo tarefa ${tarefaId} para status: ${novoStatus}`);

  try {
    // Atualizar status da tarefa
    let action;
    switch (novoStatus) {
      case "iniciada":
        action = "iniciar_tarefa";
        break;
      case "pausada":
        action = "pausar_tarefa";
        break;
      case "concluida":
        action = "concluir_tarefa";
        break;
      default:
        action = "pausar_tarefa"; // Para voltar para pendente
    }

    // CORREÇÃO: Passar a ação como string no primeiro parâmetro
    const dados = await taskManager.fetch(action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tarefa_id: parseInt(tarefaId),
      }),
    });

    if (dados) {
      taskManager.mostrarSucesso(`Tarefa movida para ${novoStatus}`);
      // Recarregar as tarefas
      await renderizarTarefas();
    }
  } catch (error) {
    console.error("❌ Erro ao mover tarefa:", error);
    taskManager.mostrarErro("Erro ao mover tarefa: " + error.message);
  }
}

// Inicializa/garante o contador para o campo #novoComentario
function inicializarContadorComentario() {
  const novoComentario = document.getElementById("novoComentario");
  if (!novoComentario) return;

  // Ids de elementos de contador (você pode mudar para o que preferir)
  let contadorEl = document.getElementById("contadorComentario");
  let contadorPalavrasEl = document.getElementById("contadorComentarioPalavras");

  // Se não existir, cria um pequeno badge abaixo do textarea
  if (!contadorEl || !contadorPalavrasEl) {
    const container = document.createElement("div");
    container.className = "comentario-contadores small text-muted mt-1";

    contadorEl = contadorEl || document.createElement("span");
    contadorEl.id = "contadorComentario";
    contadorEl.style.marginRight = "12px";
    contadorEl.textContent = "0 caracteres";

    contadorPalavrasEl = contadorPalavrasEl || document.createElement("span");
    contadorPalavrasEl.id = "contadorComentarioPalavras";
    contadorPalavrasEl.textContent = "0 palavras";

    container.appendChild(contadorEl);
    container.appendChild(contadorPalavrasEl);

    // Inserir logo após o campo #novoComentario
    novoComentario.insertAdjacentElement("afterend", container);
  }

  // Função que atualiza os contadores
  function atualizarContadores() {
    const text = novoComentario.value || "";
    const caracteres = text.length;
    // Conta palavras: trim e split por espaços (filtra vazios)
    const palavras = text.trim() === "" ? 0 : text.trim().split(/\s+/).filter(Boolean).length;

    contadorEl.textContent = `${caracteres} caracteres`;
    contadorPalavrasEl.textContent = `${palavras} ${palavras === 1 ? "palavra" : "palavras"}`;
  }

  // Atualiza ao digitar
  novoComentario.addEventListener("input", atualizarContadores);

  // Atualiza imediatamente para estado inicial
  atualizarContadores();
}

// Função para atualizar contadores na interface
function atualizarContadoresTarefa(tarefaId, tipo, operacao) {
  const cards = document.querySelectorAll(
    `[data-tarefa-id="${tarefaId}"], .lista-tarefa[onclick*="${tarefaId}"]`
  );

  cards.forEach((card) => {
    const metadataItem = card.querySelector(
      `.tarefa-metadata-item[title*="${tipo}"]`
    );
    if (metadataItem) {
      const countElement = metadataItem.querySelector("small");
      let currentCount = parseInt(countElement.textContent) || 0;

      if (operacao === "incrementar") {
        currentCount++;
      } else if (operacao === "decrementar" && currentCount > 0) {
        currentCount--;
      }

      countElement.textContent = currentCount;

      // Atualizar o título do tooltip
      const tipoTexto = tipo === "arquivo" ? "arquivo(s)" : "comentário(s)";
      metadataItem.setAttribute("title", `${currentCount} ${tipoTexto}`);

      // Atualizar a aparência baseada no count
      if (currentCount === 0) {
        metadataItem.querySelector("i").style.opacity = "0.5";
      } else {
        metadataItem.querySelector("i").style.opacity = "1";
      }
    }
  });
}