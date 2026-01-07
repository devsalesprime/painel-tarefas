// ========== FUNÇÃO RENDERIZAR TAREFAS - ATUALIZADA ==========

async function renderizarTarefas() {
  const container = garantirContainerProjetos();
  if (!container) {
    taskManager.mostrarErro(
      "Erro ao carregar interface. Por favor, recarregue a página."
    );
    return;
  }
  // ✅ INICIALIZAR tooltips após renderizar
  setTimeout(inicializarTooltips, 100);

  // ✅ VERIFICAÇÃO CRÍTICA: Garantir que filtroMinhasTarefas não seja undefined
  if (typeof taskManager.filtroMinhasTarefas === "undefined") {
    taskManager.filtroMinhasTarefas = false;
    console.log("🔄 filtroMinhasTarefas inicializado como false");
  }

  console.log(
    "🎯 Renderizando tarefas - Filtro Minhas Tarefas:",
    taskManager.filtroMinhasTarefas
  );

  // Mostra indicador de carregamento enquanto busca os dados
  container.innerHTML = `
        <div class="text-center p-5">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Carregando...</span>
            </div>
        </div>
    `;
  console.log(`🔄 Renderizando tarefas no modo: ${viewMode}`);

  // ✅ Variáveis declaradas antecipadamente para evitar ReferenceError
  let todasAsTarefas = [];
  let projetosComTarefas = 0;
  let ehAdmin = false;

  try {
    // ✅ CORREÇÃO: Chamada simples
    const projetos = await taskManager.fetch("obter_projetos");
    console.log("📦 Projetos para renderizar:", projetos);

    // Se não houver nenhum projeto → mensagem padrão
    if (!projetos || projetos.length === 0) {
      container.innerHTML = criarMensagemSemProjetos();
      return;
    }

    // Limpa container e verifica permissões
    container.innerHTML = "";
    ehAdmin = await taskManager.verificarSeEhAdmin();

    // Percorre cada projeto para buscar suas tarefas
    for (const projeto of projetos) {
      try {
        // Busca tarefas do projeto atual
        const tarefas = await taskManager.fetch(
          `api.php?action=obter_tarefas&projeto_id=${projeto.id}&ordenar_por=${ordenacaoAtual}`
        );
        console.log(`📝 Tarefas do projeto ${projeto.nome}:`, tarefas);

        // Se não há tarefas → mensagem de projeto vazio
        if (!tarefas || tarefas.length === 0) {
          container.innerHTML += criarProjetoSemTarefas(projeto, ehAdmin);
          continue;
        }

        // Filtra tarefas ativas (não excluídas)
        const tarefasAtivas = tarefas.filter((t) => t.status !== "excluida");
        todasAsTarefas = todasAsTarefas.concat(tarefasAtivas);

        // Conta projetos com tarefas válidas
        if (tarefasAtivas.length > 0) projetosComTarefas++;

        // Filtra tarefas conforme filtros ativos
        const tarefasFiltradas = filtrarTarefas(tarefasAtivas);

        // Renderiza conforme o modo atual (lista ou kanban)
        container.innerHTML +=
          viewMode === "kanban"
            ? renderizarProjetoKanban(projeto, tarefasFiltradas, ehAdmin)
            : renderizarProjetoLista(projeto, tarefasFiltradas, ehAdmin);
      } catch (error) {
        console.error(`💥 Erro ao carregar tarefas do projeto ${projeto.nome}:`, error);
        container.innerHTML += criarErroProjeto(projeto.nome);
      }
    }

    // Se existem projetos, mas nenhum possui tarefas → mensagem "Nenhuma tarefa"
    if (projetosComTarefas === 0 && todasAsTarefas.length === 0) {
      container.innerHTML = criarMensagemSemTarefas(ehAdmin);
    }

    // Atualiza estatísticas gerais (se não estiver em página de relatórios)
    if (!window.location.pathname.includes("relatorios.html")) {
      taskManager.atualizarEstatisticas(todasAsTarefas);
    }

    // Se o modo atual é Kanban, reativa o drag & drop
    if (viewMode === "kanban") {
      setTimeout(configurarDragAndDrop, 100);
    }

    console.log("✅ Renderização de tarefas concluída com sucesso");
  } catch (error) {
    console.error("💥 Erro ao renderizar tarefas:", error);
    container.innerHTML = criarMensagemErro(error);
    taskManager.mostrarErro(
      "Erro ao carregar tarefas: " + (error.message || error)
    );
  }
}

// ========== RENDERIZAÇÃO KANBAN ==========

function renderizarProjetoKanban(projeto, tarefas, ehAdmin) {
  let html = `
        <div class="projeto-section">
            <div class="projeto-header">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h3 class="projeto-titulo">${projeto.nome}</h3>
                        ${
                          projeto.data_inicio || projeto.data_fim
                            ? `
                            <div class="projeto-datas">
                                ${
                                  projeto.data_inicio
                                    ? `<small class="text-muted"><i class="fas fa-play-circle"></i> Início: ${formatarDataProjeto(
                                        projeto.data_inicio
                                      )}</small>`
                                    : ""
                                }
                                ${
                                  projeto.data_fim
                                    ? `<small class="text-muted ms-2"><i class="fas fa-flag-checkered"></i> Fim: ${formatarDataProjeto(
                                        projeto.data_fim
                                      )}</small>`
                                    : ""
                                }
                            </div>
                        `
                            : ""
                        }
                    </div>
                    <div class="projeto-meta">
                        <span class="badge-count"><i class="bi bi-list-task"></i> ${
                          tarefas.length
                        } tarefas</span>
                        ${ehAdmin ? botoesAdminProjeto(projeto) : ""}
                    </div>
                </div>
            </div>
            
            <div class="kanban-container" data-projeto-id="${projeto.id}">
    `;

  // Criar colunas do Kanban
  kanbanColumns.forEach((coluna) => {
    const tarefasColuna = tarefas.filter((t) => t.status === coluna.status);
    const count = tarefasColuna.length;

    html += `
            <div class="kanban-column" data-status="${coluna.status}" data-projeto-id="${projeto.id}">
                <h5 class="text-${coluna.color}">
                    ${coluna.title}
                    <span class="badge bg-${coluna.color} column-count">${count}</span>
                </h5>
                <div class="kanban-cards" data-status="${coluna.status}">
        `;

    if (tarefasColuna.length === 0) {
      html += `
                <div class="kanban-drop-zone text-center text-muted p-3">
                    <i class="fas fa-inbox fa-2x mb-2"></i>
                    <p class="mb-0">Nenhuma tarefa</p>
                </div>
            `;
    } else {
      tarefasColuna.forEach((tarefa) => {
        html += gerarCardKanban(tarefa, ehAdmin);
        console.log("🧾 Dados da tarefa:", tarefa);
      });
    }

    html += `
                </div>
            </div>
        `;
  });

  html += `
            </div>
        </div>
    `;

  return html;
}

function gerarCardKanban(tarefa, ehAdmin) {
  const prioridadeInfo =
    prioridades[tarefa.prioridade] || prioridades["importante_nao_urgente"];
  const progresso = tarefa.progresso || 0;
  const progressoCor =
    progresso === 100
      ? "bg-success"
      : progresso > 0
      ? "bg-primary"
      : "bg-secondary";
  const atraso =
    new Date(tarefa.data_fim) < new Date() && tarefa.concluida === 0;

  return `
        <div class="kanban-card prioridade-${prioridadeInfo.cor} ${
    tarefa.status === "concluida" ? "concluida" : ""
  }" 
             data-tarefa-id="${
               tarefa.id
             }" draggable="true" onclick="abrirEditarTarefa(${tarefa.id})">
            <div class="card-header-mini">
                <div class="d-flex justify-content-between align-items-center">
                    <span class="badge bg-${
                      prioridadeInfo.cor
                    } badge-sm me-2">${prioridadeInfo.nome}</span>
                    ${
                      atraso
                        ? '<span class="badge bg-danger badge-sm">Atrasada</span>'
                        : ""
                    }
                </div>
            </div>
            <h6 class="titulo-tarefa">${tarefa.titulo}</h6>
            ${
              tarefa.descricao
                ? `<p class="descricao-tarefa">${tarefa.descricao.substring(
                    0,
                    50
                  )}...</p>`
                : ""
            }
            
            <!-- Barra de Progresso -->
            <div class="progress mt-2 mb-2" style="height: 8px;">
                <div class="progress-bar ${progressoCor}" role="progressbar" style="width: ${progresso}%;" aria-valuenow="${progresso}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <small class="text-muted d-block mb-2">Progresso: ${progresso}%</small>
            
            <div class="usuarios-tarefa">
                ${
                  tarefa.usuarios && tarefa.usuarios.length > 0
                    ? tarefa.usuarios
                        .map(
                          (u) =>
                            `<span class="badge-usuario"><i class="fas fa-user-circle"></i>@${
                              u.nome.split(" ")[0]
                            }</span>`
                        )
                        .join("")
                    : '<span style="color: #ccc; font-size: 10px;">Sem usuários</span>'
                }
            </div>
            
            <!-- NOVO: Contadores de Arquivos e Comentários -->
            <div class="tarefa-metadata d-flex justify-content-between align-items-center mt-2">
                <div class="d-flex gap-3">
                    <span class="tarefa-metadata-item" title="${
                      tarefa.arquivos_count || 0
                    } arquivo(s)" onclick="event.stopPropagation(); abrirEditarTarefa(${tarefa.id}, 'arquivos');" style="cursor: pointer;">
                        <i class="fas fa-paperclip"></i>
                        <small>${tarefa.arquivos_count || 0}</small>
                    </span>
                    <span class="tarefa-metadata-item" title="${
                      tarefa.comentarios_count || 0
                    } comentário(s)" onclick="event.stopPropagation(); abrirEditarTarefa(${tarefa.id}, 'comentarios');" style="cursor: pointer;">
                        <i class="fas fa-comment"></i>
                        <small>${tarefa.comentarios_count || 0}</small>
                    </span>
<span class="tarefa-metadata-item checklist-item" title="Checklist ${
    tarefa.checklist_concluidos || 0
  }/${tarefa.checklist_total || 0}">
    <i class="fas fa-list-check"></i>
    <small>${tarefa.checklist_concluidos || 0}/${
    tarefa.checklist_total || 0
  }</small>
    ${
      tarefa.checklist_total > 0
        ? `
        <div class="checklist-bar">
            <div class="checklist-progress" style="width: ${
              (100 * (tarefa.checklist_concluidos || 0)) /
              tarefa.checklist_total
            }%"></div>
        </div>
    `
        : ""
    }
</span>

                </div>
                
                <div class="d-flex gap-3">
                    <div class="data-item">
                        <small><i class="bi bi-calendar2-check"></i> ${formatarDataHora(
                          tarefa.data_fim
                        )}</small>
                    </div>
                </div>
            </div>
            
            <div class="acoes-tarefa">
                ${gerarBotoesStatus(tarefa, ehAdmin)}
                ${
                  ehAdmin
                    ? `
                    <button class="btn-acao btn-editar" onclick="abrirEditarTarefa(${tarefa.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                `
                    : ""
                }
            </div>
        </div>
    `;
}

// ========== RENDERIZAÇÃO LISTA ==========

function renderizarProjetoLista(projeto, tarefas, ehAdmin) {
  let html = `
        <div class="projeto-section">
            <div class="projeto-header">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h3 class="projeto-titulo">${projeto.nome}</h3>
                        ${
                          projeto.data_inicio || projeto.data_fim
                            ? `
                            <div class="projeto-datas">
                                ${
                                  projeto.data_inicio
                                    ? `<small class="text-muted"><i class="fas fa-play-circle"></i> Início: ${formatarDataProjeto(
                                        projeto.data_inicio
                                      )}</small>`
                                    : ""
                                }
                                ${
                                  projeto.data_fim
                                    ? `<small class="text-muted ms-2"><i class="fas fa-flag-checkered"></i> Fim: ${formatarDataProjeto(
                                        projeto.data_fim
                                      )}</small>`
                                    : ""
                                }
                            </div>
                        `
                            : ""
                        }
                    </div>
                    <div class="projeto-meta">
                        <span class="badge-count"><i class="bi bi-list-task"></i> ${
                          tarefas.length
                        } tarefas</span>
                        ${ehAdmin ? botoesAdminProjeto(projeto) : ""}
                    </div>
                </div>
            </div>
            
            <!-- Controles de ordenação -->
            <div class="ordenacao-tarefas mb-3">
                <small class="text-muted me-2">Ordenar por:</small>
                <div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-outline-secondary ${
                      ordenacaoAtual === "data_criacao" ? "active" : ""
                    }" onclick="alterarOrdenacaoTarefas('data_criacao')">
                        Data de Criação
                    </button>
                    <button type="button" class="btn btn-outline-secondary ${
                      ordenacaoAtual === "data_conclusao" ? "active" : ""
                    }" onclick="alterarOrdenacaoTarefas('data_conclusao')">
                        Data de Conclusão
                    </button>
                    <button type="button" class="btn btn-outline-secondary ${
                      ordenacaoAtual === "data_fim" ? "active" : ""
                    }" onclick="alterarOrdenacaoTarefas('data_fim')">
                        Prazo
                    </button>
                    <button type="button" class="btn btn-outline-secondary ${
                      ordenacaoAtual === "prioridade" ? "active" : ""
                    }" onclick="alterarOrdenacaoTarefas('prioridade')">
                        Prioridade
                    </button>
                    <button type="button" class="btn btn-outline-secondary ${
                      ordenacaoAtual === "titulo" ? "active" : ""
                    }" onclick="alterarOrdenacaoTarefas('titulo')">
                        Título
                    </button>
                </div>
            </div>
            
            <div class="lista-container">
    `;

  if (tarefas.length === 0) {
    html += `
            <div class="sem-tarefas">
                <i class="fas fa-search"></i>
                <p>Nenhuma tarefa encontrada com os filtros atuais</p>
                <button class="btn btn-sm btn-outline-secondary mt-2" onclick="limparFiltros()">
                    <i class="fas fa-times"></i> Limpar Filtros
                </button>
            </div>
        `;
  } else {
    tarefas.forEach((tarefa) => {
      html += gerarCardLista(tarefa, ehAdmin);
    });
  }

  html += `
            </div>
        </div>
    `;

  return html;
}

function gerarCardLista(tarefa, ehAdmin) {
  const prioridadeInfo =
    prioridades[tarefa.prioridade] || prioridades["importante_nao_urgente"];
  const progresso = tarefa.progresso || 0;
  const progressoCor =
    progresso === 100
      ? "bg-success"
      : progresso > 0
      ? "bg-primary"
      : "bg-secondary";
  const atraso =
    new Date(tarefa.data_fim) < new Date() && tarefa.concluida === 0;

  return `
        <div class="lista-tarefa prioridade-${prioridadeInfo.cor} ${
    tarefa.status === "concluida" ? "concluida" : ""
  }" onclick="abrirEditarTarefa(${tarefa.id})">
            <div class="tarefa-header">
                <div class="tarefa-info">
                    <h5 class="mb-1">${tarefa.titulo}</h5>
                    ${
                      tarefa.descricao
                        ? `<p class="mb-2 text-muted">${tarefa.descricao.substring(
                            0,
                            100
                          )}...</p>`
                        : ""
                    }
                </div>
                <div class="tarefa-meta">
                    <span class="badge bg-${prioridadeInfo.cor}">${
    prioridadeInfo.nome
  }</span>
                    <span class="badge status-${tarefa.status}">
                        ${
                          tarefa.status === "iniciada"
                            ? "Em Andamento"
                            : tarefa.status === "pausada"
                            ? "Pausada"
                            : tarefa.status === "concluida"
                            ? "Concluída"
                            : tarefa.status.charAt(0).toUpperCase() +
                              tarefa.status.slice(1)
                        }
                    </span>
                    ${
                      atraso
                        ? '<span class="badge bg-danger">Atrasada</span>'
                        : ""
                    }
                </div>
            </div>
            
            <!-- Barra de Progresso -->
            <div class="progress mt-2 mb-2" style="height: 8px;">
                <div class="progress-bar ${progressoCor}" role="progressbar" style="width: ${progresso}%;" aria-valuenow="${progresso}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <small class="text-muted d-block mb-2">Progresso: ${progresso}%</small>
            
            <div class="tarefa-detalhes">
                <div class="usuarios-tarefa">
                    ${
                      tarefa.usuarios && tarefa.usuarios.length > 0
                        ? tarefa.usuarios
                            .map(
                              (u) =>
                                `<span class="badge-usuario"><i class="fas fa-user-circle"></i>@${
                                  u.nome.split(" ")[0]
                                }</span>`
                            )
                            .join("")
                        : '<span class="text-muted">Sem usuários atribuídos</span>'
                    }
                </div>
                    
                <!-- NOVO: Contadores de Arquivos e Comentários -->
                <div class="tarefa-metadata d-flex gap-3">
                    <span class="tarefa-metadata-item" title="${
                      tarefa.arquivos_count || 0
                    } arquivo(s)" onclick="event.stopPropagation(); abrirEditarTarefa(${tarefa.id}, 'arquivos');" style="cursor: pointer;">
                        <i class="fas fa-paperclip"></i>
                        <small>${tarefa.arquivos_count || 0}</small>
                    </span>
                    <span class="tarefa-metadata-item" title="${
                      tarefa.comentarios_count || 0
                    } comentário(s)" onclick="event.stopPropagation(); abrirEditarTarefa(${tarefa.id}, 'comentarios');" style="cursor: pointer;">
                        <i class="fas fa-comment"></i>
                        <small>${tarefa.comentarios_count || 0}</small>
                    </span>
<span class="tarefa-metadata-item checklist-item" title="Checklist ${
    tarefa.checklist_concluidos || 0
  }/${tarefa.checklist_total || 0}">
    <i class="fas fa-list-check"></i>
    <small>${tarefa.checklist_concluidos || 0}/${
    tarefa.checklist_total || 0
  }</small>
    ${
      tarefa.checklist_total > 0
        ? `
        <div class="checklist-bar">
            <div class="checklist-progress" style="width: ${
              (100 * (tarefa.checklist_concluidos || 0)) /
              tarefa.checklist_total
            }%"></div>
        </div>
    `
        : ""
    }
</span>

                </div>
                    
                <div class="datas-tarefa w-50">
                    <small class="me-2"><i class="fas fa-play-circle me-1"></i> ${formatarDataHora(
                      tarefa.data_inicio
                    )}</small>
                    <small class="me-2"><i class="fas fa-flag me-1"></i> ${formatarDataHora(
                      tarefa.data_fim
                    )}</small>
                </div>
                    
                ${
                  tarefa.data_conclusao
                    ? `
                    <div class="text-success">
                        <small><i class="fas fa-check-circle"></i> ${formatarDataHora(
                          tarefa.data_conclusao
                        )}</small>
                    </div>
                `
                    : ""
                }
                    
                <div class="acoes-tarefa">
                    ${gerarBotoesStatus(tarefa, ehAdmin)}
                    ${
                      ehAdmin
                        ? `
                        <button class="btn btn-sm btn-outline-primary" onclick="abrirEditarTarefa(${tarefa.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                    `
                        : ""
                    }
                </div>
            </div>
        </div>
    `;
}