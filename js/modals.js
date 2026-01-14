// ========== GERENCIAMENTO DE MODAIS ==========

// Função para mostrar erro dentro do modal Nova Tarefa
function mostrarErroNoModalTarefa(mensagem) {
  const container = document.getElementById("modalNovaTarefaAlertas");
  if (!container) return;

  container.innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="fas fa-exclamation-circle"></i> ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

// Função para mostrar sucesso dentro do modal Nova Tarefa
function mostrarSucessoNoModalTarefa(mensagem) {
  const container = document.getElementById("modalNovaTarefaAlertas");
  if (!container) return;

  container.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="fas fa-check-circle"></i> ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

// Função para limpar mensagens do modal Nova Tarefa
function limparMensagensModalTarefa() {
  const container = document.getElementById("modalNovaTarefaAlertas");
  if (container) {
    container.innerHTML = "";
  }
}

// Função para mostrar erro dentro do modal
function mostrarErroNoModal(mensagem) {
  const container = document.getElementById("modalNovoProjetoAlertas");
  if (!container) return;

  container.innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="fas fa-exclamation-circle"></i> ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

// Função para mostrar sucesso dentro do modal
function mostrarSucessoNoModal(mensagem) {
  const container = document.getElementById("modalNovoProjetoAlertas");
  if (!container) return;

  container.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="fas fa-check-circle"></i> ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

// Função para limpar mensagens do modal
function limparMensagensModal() {
  const container = document.getElementById("modalNovoProjetoAlertas");
  if (container) {
    container.innerHTML = "";
  }
}

// Função para mostrar erro dentro do modal Editar Tarefa
function mostrarErroNoModalEditar(mensagem) {
  const container = document.getElementById("modalEditarTarefaAlertas");
  if (!container) return;

  container.innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="fas fa-exclamation-circle"></i> ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

// Função para mostrar sucesso dentro do modal Editar Tarefa
function mostrarSucessoNoModalEditar(mensagem) {
  const container = document.getElementById("modalEditarTarefaAlertas");
  if (!container) return;

  container.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="fas fa-check-circle"></i> ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

// Função para limpar mensagens do modal Editar Tarefa
function limparMensagensModalEditar() {
  const container = document.getElementById("modalEditarTarefaAlertas");
  if (container) {
    container.innerHTML = "";
  }
}

// Função robusta para fechar o modal Nova Tarefa
function fecharModalNovaTarefa() {
  console.log("🔄 Tentando fechar modal Nova Tarefa...");

  const modalElement = document.getElementById("modalNovaTarefa");
  if (!modalElement) {
    console.error("❌ Modal Nova Tarefa não encontrado");
    return false;
  }

  try {
    // Método 1: Usar a API do Bootstrap
    let modal = bootstrap.Modal.getInstance(modalElement);

    if (modal) {
      console.log(
        "✅ Modal Nova Tarefa encontrado, fechando com Bootstrap API"
      );
      modal.hide();
    } else {
      console.log(
        "⚠️ Instância do modal Nova Tarefa não encontrada, criando nova..."
      );
      modal = new bootstrap.Modal(modalElement);
      modal.hide();
    }

    // Forçar remoção do backdrop após um pequeno delay
    setTimeout(() => {
      console.log("🧹 Limpando backdrop...");

      // Remover todos os backdrops
      document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
        backdrop.remove();
      });

      // Remover classes do body
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";

      // Garantir que o modal esteja escondido
      modalElement.classList.remove("show");
      modalElement.style.display = "none";
      modalElement.setAttribute("aria-hidden", "true");

      console.log("✅ Modal Nova Tarefa fechado com sucesso");
    }, 300);

    return true;
  } catch (error) {
    console.error("❌ Erro ao fechar modal Nova Tarefa:", error);

    // Método fallback: manipulação direta do DOM
    try {
      console.log("🔄 Tentando método fallback...");

      // Esconder o modal
      modalElement.classList.remove("show");
      modalElement.style.display = "none";
      modalElement.setAttribute("aria-hidden", "true");

      // Remover backdrop
      const backdrop = document.querySelector(".modal-backdrop");
      if (backdrop) {
        backdrop.remove();
      }

      // Limpar body
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";

      console.log("✅ Modal Nova Tarefa fechado com método fallback");
      return true;
    } catch (fallbackError) {
      console.error("❌ Erro no método fallback:", fallbackError);
      return false;
    }
  }
}

// Função robusta para fechar o modal
function fecharModalNovoProjeto() {
  console.log("🔄 Tentando fechar modal...");

  const modalElement = document.getElementById("modalNovoProjeto");
  if (!modalElement) {
    console.error("❌ Modal não encontrado");
    return false;
  }

  try {
    // Método 1: Usar a API do Bootstrap
    let modal = bootstrap.Modal.getInstance(modalElement);

    if (modal) {
      console.log("✅ Modal encontrado, fechando com Bootstrap API");
      modal.hide();
    } else {
      console.log("⚠️ Instância do modal não encontrada, criando nova...");
      modal = new bootstrap.Modal(modalElement);
      modal.hide();
    }

    // Forçar remoção do backdrop após um pequeno delay
    setTimeout(() => {
      console.log("🧹 Limpando backdrop...");

      // Remover todos os backdrops
      document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
        backdrop.remove();
      });

      // Remover classes do body
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";

      // Garantir que o modal esteja escondido
      modalElement.classList.remove("show");
      modalElement.style.display = "none";
      modalElement.setAttribute("aria-hidden", "true");

      console.log("✅ Modal fechado com sucesso");
    }, 300);

    return true;
  } catch (error) {
    console.error("❌ Erro ao fechar modal:", error);

    // Método fallback: manipulação direta do DOM
    try {
      console.log("🔄 Tentando método fallback...");

      // Esconder o modal
      modalElement.classList.remove("show");
      modalElement.style.display = "none";
      modalElement.setAttribute("aria-hidden", "true");

      // Remover backdrop
      const backdrop = document.querySelector(".modal-backdrop");
      if (backdrop) {
        backdrop.remove();
      }

      // Limpar body
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";

      console.log("✅ Modal fechado com método fallback");
      return true;
    } catch (fallbackError) {
      console.error("❌ Erro no método fallback:", fallbackError);
      return false;
    }
  }
}

// ---------- Função robusta para fechar o modal Editar Tarefa ----------
function fecharModalEditarTarefa() {
  const modalElement = document.getElementById("modalEditarTarefa");

  // Limpeza segura mesmo se o modal não existir
  const limparEstadoModal = () => {
    document.querySelectorAll(".modal-backdrop").forEach((b) => b.remove());
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    if (modalElement) {
      modalElement.classList.remove("show");
      modalElement.style.display = "none";
      modalElement.setAttribute("aria-hidden", "true");
    }
  };

  if (!modalElement) {
    console.warn("fecharModalEditarTarefa: elemento #modalEditarTarefa não encontrado — limpando estado visual.");
    limparEstadoModal();
    return true;
  }

  try {
    // Tentar usar instância do Bootstrap (compatível com BS5)
    let modal = bootstrap.Modal.getInstance(modalElement);
    if (!modal) {
      modal = new bootstrap.Modal(modalElement);
    }
    modal.hide();

    // Espera curta para permitir animação e depois força limpeza completa
    setTimeout(() => {
      limparEstadoModal();
    }, 200);

    return true;
  } catch (error) {
    console.error("fecharModalEditarTarefa - erro ao fechar modal:", error);
    try {
      // fallback DOM-only
      limparEstadoModal();
      return true;
    } catch (e) {
      console.error("fecharModalEditarTarefa - fallback falhou:", e);
      return false;
    }
  }
}

// Função para fechar modal completamente e limpar o backdrop
function fecharModal(modalId) {
  const modalElement = document.getElementById(modalId);
  if (modalElement) {
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
      modal.hide();
    } else {
      const newModal = new bootstrap.Modal(modalElement);
      newModal.hide();
    }
  }
}

// Correção global para limpar backdrop e elementos residuais do modal
document.addEventListener("hidden.bs.modal", function () {
  // Remove backdrop do Bootstrap se ainda estiver presente
  document.querySelectorAll(".modal-backdrop").forEach((b) => b.remove());

  // Remove bloqueios no body
  document.body.classList.remove("modal-open");
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";

  // Remove qualquer container do Give Freely ou extensões semelhantes
  document
    .querySelectorAll('[id^="give-freely-root-"]')
    .forEach((el) => el.remove());
});

// ========== MODAL DE EDIÇÃO DE TAREFA ==========

async function abrirEditarTarefa(tarefaId, tabId = null) {
  const ehAdmin = await taskManager.verificarSeEhAdmin();
  // Permissão de edição será verificada após carregar a tarefa

  taskManager.tarefaEditandoId = tarefaId;

  try {
    // Buscar dados completos da tarefa
    const tarefa = await taskManager.fetch(
      `api.php?action=obter_tarefa&tarefa_id=${tarefaId}`
    );
    if (!tarefa) {
      taskManager.mostrarErro("Tarefa não encontrada");
      return;
    }

    // Verificar permissão de edição com a tarefa carregada
    const podeEditar = await taskManager.verificarPermissaoEdicao(tarefa);

    // Verificar se o modal de edição existe na página atual
    const modalEditarTarefa = document.getElementById("modalEditarTarefa");

    // Se não existe o modal de edição (como no relatorio.html), usar modal de detalhes
    if (!modalEditarTarefa) {
      console.log(
        "ℹ️ Modal de edição não disponível - usando modal de detalhes"
      );
      await abrirModalDetalhes(tarefaId);
      return;
    }

    // Se chegou aqui, o modal de edição existe - preencher os dados
    const elementosParaPreencher = [
      { id: "editarTitulo", value: tarefa.titulo || "" },
      { id: "editarDescricao", value: tarefa.descricao || "" },
      {
        id: "editarDataInicio",
        value: tarefa.data_inicio ? tarefa.data_inicio.slice(0, 10) : "",
      },
      {
        id: "editarDataFim",
        value: tarefa.data_fim ? tarefa.data_fim.slice(0, 10) : "",
      },
      { id: "editarStatus", value: tarefa.status || "pendente" },
      {
        id: "editarPrioridade",
        value: tarefa.prioridade || "importante_nao_urgente",
      },
    ];

    elementosParaPreencher.forEach((item) => {
      const elemento = document.getElementById(item.id);
      if (elemento) {
        elemento.value = item.value;
      }
    });

    // Atualizar contador de descrição se existir
    const contadorDescricao = document.getElementById(
      "contadorDescricaoEditar"
    );
    if (contadorDescricao) {
      contadorDescricao.textContent = (tarefa.descricao || "").length;
    }

    // Atualizar barra de progresso se existir
    const progressoBar = document.getElementById("progressoBar");
    if (progressoBar) {
      atualizarBarraProgressoEditar(tarefa.progresso || 0);
    }

    // Carregar dados adicionais em paralelo para melhorar performance
    const promises = [];

    if (document.getElementById("listaEtapasEditar")) {
      promises.push(carregarEtapasEditar(tarefa.etapas || []));
    }

    if (document.getElementById("usuariosTarefa")) {
      promises.push(carregarUsuariosTarefa(tarefaId, podeEditar));
    }

    if (document.getElementById("listaComentarios")) {
      promises.push(carregarComentariosTarefa(tarefaId, podeEditar));
    }

    if (document.getElementById("listaArquivos")) {
      promises.push(carregarArquivosTarefa(tarefaId, podeEditar));
    }

    // Aguardar todas as cargas secundárias (mas não bloquear a exibição inicial do modal se possível, 
    // porém aqui estamos preenchendo o modal antes de exibir)
    // Para UX instantânea, o ideal seria mostrar o modal e carregar isso depois, 
    // mas vamos manter o await paralelo por segurança na estrutura atual.
    await Promise.all(promises);

    await Promise.all(promises);

    // Configurar permissões: Se não pode editar, desabilita campos
    if (!podeEditar) {
      const camposEditaveis = [
        "editarTitulo",
        "editarDescricao",
        "editarDataInicio",
        "editarDataFim",
        "editarStatus",
        "editarPrioridade",
        "novaEtapaEditar",
        "usuarioInputEditar",
        "novoComentario"
      ];

      camposEditaveis.forEach((id) => {
        const campo = document.getElementById(id);
        if (campo) {
          campo.disabled = true;
        }
      });

      // Desabilitar form de upload
      const formUpload = document.getElementById("formUploadArquivo");
      if (formUpload) {
          const inputs = formUpload.querySelectorAll("input, button");
          inputs.forEach(el => el.disabled = true);
      }

      // Esconder botões de ação para quem não pode editar
      const botoesAcao = document.querySelectorAll(
        "#modalEditarTarefa .btn-primary, #modalEditarTarefa .btn-danger"
      );
      botoesAcao.forEach((botao) => {
        if (!botao.classList.contains("btn-secondary")) {
          botao.style.display = "none";
        }
      });

      // Mudar título para indicar modo visualização
      const tituloModal = document.querySelector(
        "#modalEditarTarefa .modal-title"
      );
      if (tituloModal) {
        tituloModal.innerHTML =
          '<i class="fas fa-eye me-2"></i>Visualizar Tarefa';
      }
    } else {
      // Se pode editar, garantir que os campos estão editáveis
      const camposEditaveis = [
        "editarTitulo",
        "editarDescricao",
        "editarDataInicio",
        "editarDataFim",
        "editarStatus",
        "editarPrioridade",
        "novaEtapaEditar",
        "usuarioInputEditar",
        "novoComentario"
      ];

      camposEditaveis.forEach((id) => {
        const campo = document.getElementById(id);
        if (campo) {
          campo.disabled = false;
        }
      });

      // Habilitar form de upload
      const formUpload = document.getElementById("formUploadArquivo");
      if (formUpload) {
          const inputs = formUpload.querySelectorAll("input, button");
          inputs.forEach(el => el.disabled = false);
      }

      // Mostrar botão de SALVAR para quem pode editar
      const btnSalvar = document.querySelector("#modalEditarTarefa .btn-primary");
      if (btnSalvar) btnSalvar.style.display = "inline-block";

      // Restaurar visibilidade dos botões de ação (Comentar, Upload, Adicionar Etapa)
      const botoesAcao = document.querySelectorAll(
        "#modalEditarTarefa .btn-primary"
      );
      botoesAcao.forEach((botao) => {
          botao.style.display = "inline-block";
      });

      // Botão DELETAR apenas para ADMIN
      const btnDeletar = document.querySelector("#modalEditarTarefa .btn-danger");
      if (btnDeletar) {
        btnDeletar.style.display = ehAdmin ? "inline-block" : "none";
      }

      // Garantir título correto
      const tituloModal = document.querySelector(
        "#modalEditarTarefa .modal-title"
      );
      if (tituloModal) {
        tituloModal.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Tarefa';
      }
    }

    // Abrir modal
    const modal = new bootstrap.Modal(modalEditarTarefa);
    modal.show();

    // Se uma seção específica foi solicitada, fazer scroll até ela após o modal abrir
    if (tabId) {
      setTimeout(() => {
        let targetElement = null;
        if (tabId === 'arquivos') {
          targetElement = document.querySelector('#modalEditarTarefa .card-header h6 i.fa-paperclip');
        } else if (tabId === 'comentarios') {
          targetElement = document.querySelector('#modalEditarTarefa .card-header h6 i.fa-comments');
        }
        
        if (targetElement) {
          const card = targetElement.closest('.card');
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Destacar temporariamente o card
            card.style.boxShadow = '0 0 15px rgba(13, 110, 253, 0.5)';
            setTimeout(() => {
              card.style.boxShadow = '';
            }, 2000);
            console.log(`✅ Scroll para seção "${tabId}" realizado`);
          }
        } else {
          console.warn(`⚠️ Seção "${tabId}" não encontrada no modal`);
        }
      }, 300);
    }
  } catch (error) {
    console.error("Erro ao carregar dados da tarefa:", error);
    taskManager.mostrarErro(
      "Erro ao carregar dados da tarefa: " + error.message
    );
  }
}

// Atualizar barra de progresso no modal de edição
function atualizarBarraProgressoEditar(progresso) {
  const progressoBar = document.getElementById("progressoBar");
  const progressoTexto = document.getElementById("progressoTexto");
  const progressoDetalhes = document.getElementById("progressoDetalhes");

  if (progressoBar && progressoTexto) {
    progressoBar.style.width = `${progresso}%`;
    progressoBar.setAttribute("aria-valuenow", progresso);
    progressoTexto.textContent = `${progresso}%`;

    // Mudar cor baseada no progresso
    if (progresso === 100) {
      progressoBar.className = "progress-bar bg-success";
      progressoDetalhes.textContent = "Tarefa concluída!";
    } else if (progresso >= 75) {
      progressoBar.className = "progress-bar bg-primary";
      progressoDetalhes.textContent = "Quase lá! Continue o bom trabalho.";
    } else if (progresso >= 50) {
      progressoBar.className = "progress-bar bg-info";
      progressoDetalhes.textContent =
        "Bom progresso! Metade do caminho percorrido.";
    } else if (progresso >= 25) {
      progressoBar.className = "progress-bar bg-warning";
      progressoDetalhes.textContent = "Progresso inicial, continue avançando.";
    } else {
      progressoBar.className = "progress-bar bg-secondary";
      progressoDetalhes.textContent =
        "Progresso calculado automaticamente pelas etapas";
    }
  }
}

// Função para abrir modal de novo projeto
function abrirModalNovoProjeto() {
  const modal = new bootstrap.Modal(
    document.getElementById("modalNovoProjeto")
  );
  modal.show();
}

// Função para alternar entre selecionar e criar projeto
function alternarCriacaoProjeto() {
  const selectProjeto = document.getElementById("projeto");
  const btnNovoProjeto = document.getElementById("btnNovoProjeto");

  if (selectProjeto && selectProjeto.value === "novo") {
    selectProjeto.style.display = "none";
    if (btnNovoProjeto) btnNovoProjeto.style.display = "none";
    const container = document.getElementById("criacaoProjetoContainer");
    if (container) container.style.display = "block";
  }
}

// Função para cancelar criação de projeto
function cancelarCriacaoProjeto() {
  const selectProjeto = document.getElementById("projeto");
  const btnNovoProjeto = document.getElementById("btnNovoProjeto");
  const container = document.getElementById("criacaoProjetoContainer");
  const novoProjetoNome = document.getElementById("novoProjetoNome");

  // Fecha o campo de criação rápida
  if (container) container.style.display = "none";

  // Limpa o campo de texto
  if (novoProjetoNome) novoProjetoNome.value = "";

  // ✅ Garante que o botão "➕" desapareça
  if (btnNovoProjeto) btnNovoProjeto.style.display = "none";

  // ✅ Retorna o select ao estado padrão e reativa o evento de mudança
  if (selectProjeto) {
    selectProjeto.style.display = "block";
    selectProjeto.selectedIndex = 0;
    const event = new Event("change", { bubbles: true });
    selectProjeto.dispatchEvent(event);
  }
}

// Função alternativa para páginas sem modal de edição completo
async function abrirModalDetalhes(tarefaId) {
  try {
    const tarefa = await taskManager.fetch(
      `api.php?action=obter_tarefa&tarefa_id=${tarefaId}`
    );
    if (!tarefa) {
      taskManager.mostrarErro("Tarefa não encontrada");
      return;
    }

    // Remover modal anterior se existir
    const modalAnterior = document.getElementById("modalDetalhesSimples");
    if (modalAnterior) {
      modalAnterior.remove();
    }

    // Criar um modal simples de visualização
    const modalHTML = `
            <div class="modal fade" id="modalDetalhesSimples" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${tarefa.titulo}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p><strong>Descrição:</strong> ${
                              tarefa.descricao || "Sem descrição"
                            }</p>
                            <p><strong>Status:</strong> ${tarefa.status}</p>
                            <p><strong>Progresso:</strong> ${
                              tarefa.progresso || 0
                            }%</p>
                            <p><strong>Prazo:</strong> ${formatarDataHora(
                              tarefa.data_fim
                            )}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Adicionar novo modal ao DOM
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Configurar evento para remover o modal quando fechado
    const modalElement = document.getElementById("modalDetalhesSimples");
    modalElement.addEventListener("hidden.bs.modal", function () {
      setTimeout(() => {
        if (modalElement.parentNode) {
          modalElement.remove();
        }
      }, 300);
    });

    // Abrir modal
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  } catch (error) {
    console.error("Erro ao abrir detalhes:", error);
    taskManager.mostrarErro("Erro ao carregar detalhes da tarefa");
  }
}