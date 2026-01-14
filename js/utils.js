// ========== FUNÇÕES AUXILIARES PARA DATAS ==========

function formatarDataHora(dataString) {
  if (!dataString) return "Não definida";

  const data = new Date(dataString);
  if (isNaN(data.getTime())) return "Data inválida";

  // Meses abreviados em português
  const meses = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  const dia = data.getDate();
  const mes = meses[data.getMonth()];
  // Horas removidas conforme solicitacao
  // const horas = data.getHours().toString().padStart(2, "0");
  // const minutos = data.getMinutes().toString().padStart(2, "0");

  return `${mes} ${dia}`;
}

function formatarDataProjeto(dataString) {
  if (!dataString) return "Não definida";

  const data = new Date(dataString);
  if (isNaN(data.getTime())) return "Data inválida";

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function formatarData(dataString) {
  if (!dataString) return "Não definida";

  const data = new Date(dataString);
  if (isNaN(data.getTime())) return "Data inválida";

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

// ========== FUNÇÃO AUXILIAR PARA ÍCONES DE ARQUIVO ==========

function getFileIcon(tipo) {
  if (tipo.includes("pdf")) return "fa-file-pdf text-danger";
  if (tipo.includes("image")) return "fa-file-image text-success";
  if (tipo.includes("word") || tipo.includes("document")) return "fa-file-word text-primary";
  if (tipo.includes("excel") || tipo.includes("spreadsheet")) return "fa-file-excel text-success";
  if (tipo.includes("zip") || tipo.includes("rar") || tipo.includes("tar")) return "fa-file-archive text-warning";
  if (tipo.includes("text") || tipo.includes("txt")) return "fa-file-alt text-secondary";
  return "fa-file text-secondary";
}

// ========== FUNÇÕES AUXILIARES PARA VALIDAÇÃO ==========

function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

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

// ========== FUNÇÃO PARA CALCULAR FORÇA DE SENHA ==========

function calcularForcaSenha(senha) {
  let score = 0;

  if (senha.length >= 8) score++;
  if (/[a-z]/.test(senha)) score++;
  if (/[A-Z]/.test(senha)) score++;
  if (/[0-9]/.test(senha)) score++;
  if (/[^A-Za-z0-9]/.test(senha)) score++;

  if (score < 3) {
    return { level: "weak", message: "Senha fraca" };
  } else if (score < 4) {
    return { level: "medium", message: "Senha média" };
  } else {
    return { level: "strong", message: "Senha forte" };
  }
}

// ========== FUNÇÃO PARA TOGGLE DE VISIBILIDADE DE SENHA ==========

function togglePasswordModal(inputId) {
  const input = document.getElementById(inputId);
  const button = input.parentNode.querySelector(".password-toggle");
  const icon = button.querySelector("i");

  if (input.type === "password") {
    input.type = "text";
    icon.className = "fas fa-eye-slash";
  } else {
    input.type = "password";
    icon.className = "fas fa-eye";
  }
}

// ========== TOOLTIPS ==========

function inicializarTooltips() {
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

// ========== FUNÇÕES AUXILIARES PARA RENDERIZAÇÃO E CACHE ==========

function limparCacheForcado() {
  console.log("🧹 Limpando cache forçado...");
  
  // Limpar variáveis internas
  if (window.taskManager) {
    taskManager.usuariosSelecionados = [];
    taskManager.tarefaEditandoId = null;
    taskManager.projetoEditandoId = null;
  }
  
  // Forçar recarregamento de projetos
  if (typeof carregarProjetos === 'function') {
      carregarProjetos().then(() => {
        console.log("✅ Projetos recarregados após limpeza de cache");
      });
  }
  
  // Limpar localStorage temporário se existir
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('temp_')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
}


function gerarBotoesStatus(tarefa, ehAdmin) {
  if (!ehAdmin) return "";

  let botoes = "";
  if (tarefa.status === "iniciada") {
    botoes = `
            <button class="btn-acao btn-status" onclick="event.stopPropagation(); pausarTarefa(${tarefa.id})" title="Pausar">
                <i class="fas fa-pause"></i> Pausar
            </button>
            <button class="btn-acao btn-status" onclick="event.stopPropagation(); concluirTarefa(${tarefa.id})" title="Concluir">
                <i class="fas fa-check"></i> Concluir
            </button>
        `;
  } else if (tarefa.status === "pausada") {
    botoes = `
            <button class="btn-acao btn-status" onclick="event.stopPropagation(); iniciarTarefa(${tarefa.id})" title="Retomar">
                <i class="fas fa-play"></i>
            </button>
            <button class="btn-acao btn-status" onclick="event.stopPropagation(); concluirTarefa(${tarefa.id})" title="Concluir">
                <i class="fas fa-check"></i>
            </button>
        `;
  } else if (tarefa.status === "concluida") {
    botoes = `
            <button class="btn-acao btn-status" onclick="event.stopPropagation(); reabrirTarefa(${tarefa.id})" title="Reabrir">
                <i class="fas fa-undo"></i>
            </button>
        `;
  } else {
    botoes = `
            <button class="btn-acao btn-status" onclick="event.stopPropagation(); iniciarTarefa(${tarefa.id})" title="Iniciar">
                <i class="fas fa-play"></i>
            </button>
        `;
  }

  return botoes;
}

function botoesAdminProjeto(projeto) {
  const statusBadge =
    projeto.status === "concluido"
      ? '<span class="badge bg-success ms-2"><i class="fas fa-check-circle"></i> Concluído</span>'
      : "";

  return `
        ${statusBadge}
        <button class="btn btn-sm btn-primary ms-2" 
                onclick='abrirModalEditarProjeto(${JSON.stringify(projeto)})' 
                data-bs-toggle="tooltip" 
                data-bs-placement="top" 
                title="Editar Projeto">
            <i class="fas fa-edit"></i>
            <span class="d-none d-sm-inline-block"></span>
        </button>
        ${
          projeto.status === "concluido"
            ? `<button class="btn btn-sm btn-warning ms-2" 
                      onclick="reabrirProjeto(${projeto.id})" 
                      data-bs-toggle="tooltip" 
                      data-bs-placement="top" 
                      title="Reabrir Projeto">
                <i class="fas fa-undo"></i>
                <span class="d-none d-sm-inline-block"></span>
            </button>`
            : `<button class="btn btn-sm btn-success ms-2" 
                      onclick="concluirProjeto(${projeto.id})" 
                      data-bs-toggle="tooltip" 
                      data-bs-placement="top" 
                      title="Concluir Projeto">
                <i class="fas fa-check"></i>
                <span class="d-none d-sm-inline-block"></span>
            </button>`
        }
        <button class="btn btn-sm btn-danger ms-2" 
                onclick="deletarProjeto(${projeto.id})" 
                data-bs-toggle="tooltip" 
                data-bs-placement="top" 
                title="Deletar Projeto">
            <i class="fas fa-trash"></i>
                <span class="d-none d-sm-inline-block"></span>
        </button>
    `;
}

// ========== MENSAGENS DE ERRO E ESTADO VAZIO ==========

function criarMensagemSemProjetos() {
  return `
        <div class="text-center p-5">
            <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
            <h5>Nenhum projeto encontrado</h5>
            <p class="text-muted">Crie o primeiro projeto para começar!</p>
            <button class="btn btn-primary mt-3" onclick="abrirModalNovoProjeto()">
                <i class="fas fa-folder-plus"></i> Criar Primeiro Projeto
            </button>
        </div>
    `;
}

function criarMensagemSemTarefas(ehAdmin) {
  return `
        <div class="text-center p-5">
            <i class="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
            <h5>Nenhuma tarefa encontrada</h5>
            <p class="text-muted">Crie uma tarefa para começar!</p>
            ${
              ehAdmin
                ? `
                <button class="btn btn-primary mt-3" data-bs-toggle="modal" data-bs-target="#modalNovaTarefa">
                    <i class="fas fa-plus"></i> Criar Primeira Tarefa
                </button>`
                : ""
            }
        </div>
    `;
}

function criarProjetoSemTarefas(projeto, ehAdmin) {
  return `
        <div class="projeto-section">
            <div class="projeto-header">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h3 class="projeto-titulo">${projeto.nome}</h3>
                    </div>
                    <div class="projeto-meta">
                        <span class="badge-count"><i class="bi bi-list-task"></i> 0 tarefas</span>
                        ${ehAdmin ? botoesAdminProjeto(projeto) : ""}
                    </div>
                </div>
            </div>
            <div class="sem-tarefas">
                <i class="fas fa-inbox"></i>
                <p>Nenhuma tarefa encontrada</p>
                ${
                  ehAdmin
                    ? `
                    <button class="btn btn-sm btn-primary mt-2" data-bs-toggle="modal" data-bs-target="#modalNovaTarefa" onclick="document.getElementById('projeto').value = ${projeto.id}">
                        <i class="fas fa-plus"></i> Criar Primeira Tarefa
                    </button>
                `
                    : ""
                }
            </div>
        </div>
    `;
}

function criarMensagemErro(error) {
  return `
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-triangle"></i>
            <h5>Erro ao carregar tarefas</h5>
            <p>${error.message}</p>
            <button class="btn btn-sm btn-outline-danger mt-2" onclick="renderizarTarefas()">
                <i class="fas fa-redo"></i> Tentar Novamente
            </button>
        </div>
    `;
}

function criarErroProjeto(nomeProjeto) {
  return `
        <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle"></i>
            Erro ao carregar tarefas do projeto "${nomeProjeto}"
        </div>
    `;
}

function construirUrlAPI(acao, parametros = {}) {
  let url = `action=${acao}`;
  
  Object.keys(parametros).forEach(key => {
    if (parametros[key] !== null && parametros[key] !== undefined) {
      url += `&${key}=${encodeURIComponent(parametros[key])}`;
    }
  });
  
  return url;
}