// ========== SISTEMA DE RELATÓRIOS ==========

// Variável global para cache de dados
let dadosRelatorios = {
  geral: null,
  atrasadas: null,
  pausadas: null,
  projetos: null,
  usuarios: null,
};

// ✅ Aguardar taskManager estar disponível
function aguardarTaskManager(callback, tentativas = 0) {
  if (window.taskManager && window.taskManager.fetch) {
    console.log("✅ taskManager disponível!");
    callback();
  } else if (tentativas < 50) {
    // Esperar 100ms e tentar novamente (máx 5 segundos)
    setTimeout(() => {
      aguardarTaskManager(callback, tentativas + 1);
    }, 100);
  } else {
    console.error("❌ taskManager não ficou disponível após 5 segundos");
    // Criar fallback
    criarTaskManagerFallback();
    callback();
  }
}

// Criar fallback se taskManager não existir
function criarTaskManagerFallback() {
  if (!window.taskManager) {
    console.warn("⚠️ Criando taskManager fallback");
    window.taskManager = {
      mostrarErro: (msg) => {
        console.error(msg);
        alert("❌ " + msg);
      },
      mostrarSucesso: (msg) => {
        console.log(msg);
        // Não mostrar alert para sucesso
      },
      fetch: async (url, options = {}) => {
        try {
          const token = localStorage.getItem('auth_token');
          if (!options.headers) options.headers = {};
          if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
          }

          const response = await fetch(url, options);
          const data = await response.json();
          
          if (!data.sucesso) {
            throw new Error(data.erro || 'Erro na API');
          }
          
          return data.dados;
        } catch (error) {
          console.error('Erro na requisição:', error);
          throw error;
        }
      },
      getCurrentUser: () => {
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
      }
    };
  }
}

// Função auxiliar de autenticação
function isAuthenticated() {
  return !!localStorage.getItem('auth_token');
}

// Função auxiliar para escapar HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========== INICIALIZAÇÃO ==========

document.addEventListener("DOMContentLoaded", async () => {
  console.log("📊 Inicializando Sistema de Relatórios");

  // Aguardar taskManager estar disponível
  aguardarTaskManager(iniciarRelatorios);
});

async function iniciarRelatorios() {
  console.log("📊 Sistema de Relatórios iniciado");

  // Configurar taskManager para não atualizar estatísticas
  configurarTaskManagerParaRelatorios();

  // Verificar autenticação
  if (!isAuthenticated()) {
    console.log("❌ Não autenticado - redirecionando para login");
    window.location.href = "login.html";
    return;
  }

  // Carregar dados do usuário na navbar
  try {
    const userData = taskManager.getCurrentUser();
    if (userData && userData.nome) {
      document.getElementById("userName").textContent = userData.nome;
      document.getElementById("userRole").innerHTML = `<span class="funcao-badge funcao-${userData.funcao || 'usuario'}">${userData.funcao === 'admin' ? 'Administrador' : userData.funcao === 'editor' ? 'Editor' : 'Usuário'}</span>`;
      
      // Mostrar aba de usuários apenas para admin
      if (userData.funcao === "admin") {
        document.getElementById("usuariosTabItem").style.display = "block";
      }
    }
  } catch (e) {
    console.error('Erro ao carregar dados do usuário:', e);
  }

  // Carregar dados iniciais
  console.log("📊 Carregando dados iniciais dos relatórios...");
  await carregarResumoGeral();
  await carregarTarefasTotaisEConcluidas();
  await carregarTarefasAtrasadas();
  await carregarTarefasPausadas();

  // Configurar eventos das abas
  document.querySelectorAll('button[data-bs-toggle="tab"]').forEach((button) => {
    button.addEventListener("shown.bs.tab", async (event) => {
      const target = event.target.getAttribute("data-bs-target");
      console.log("📑 Aba ativa:", target);

      if (target === "#pausadas" && !dadosRelatorios.pausadas) {
        await carregarTarefasPausadas();
      } else if (target === "#projetos" && !dadosRelatorios.projetos) {
        await carregarRelatorioProjetos();
      } else if (target === "#usuarios" && !dadosRelatorios.usuarios) {
        await carregarRelatorioUsuarios();
      }
    });
  });

  console.log("✅ Sistema de Relatórios pronto!");
  inicializarTooltips();
}

// ========== FUNÇÕES DE CONFIGURAÇÃO ==========

function configurarTaskManagerParaRelatorios() {
  // Sobrescrever a função de atualização de estatísticas para não fazer nada
  if (window.taskManager) {
    const originalAtualizarEstatisticas = taskManager.atualizarEstatisticas;

    taskManager.atualizarEstatisticas = function (tarefas) {
      // Não fazer nada na página de relatórios
      console.log("📊 Página de relatórios - estatísticas não atualizadas");
      return;
    };

    const originalAtualizarElementoEstatistica =
      taskManager.atualizarElementoEstatistica;

    taskManager.atualizarElementoEstatistica = function (id, valor) {
      // Não fazer nada na página de relatórios
      return;
    };
  }
}

// ========== FUNÇÕES DE CARREGAMENTO ==========

async function carregarResumoGeral() {
  try {
    const dados = await taskManager.fetch("api.php?action=relatorio_geral");

    if (dados) {
      dadosRelatorios.geral = dados;
      console.log("✅ Resumo geral carregado");
    }
  } catch (error) {
    console.error("❌ Erro ao carregar resumo geral:", error);
  }
}

async function carregarTarefasTotaisEConcluidas() {
  try {
    const projetos = await taskManager.fetch("api.php?action=obter_projetos");
    
    if (projetos) {
      let totalTarefas = 0;
      let tarefasConcluidas = 0;
      let tarefasPausadas = 0;
      
      for (const projeto of projetos) {
        const tarefas = await taskManager.fetch(
          `api.php?action=obter_tarefas&projeto_id=${projeto.id}`
        );
        
        if (tarefas) {
          const tarefasAtivas = tarefas.filter(t => t.status !== 'excluida');
          totalTarefas += tarefasAtivas.length;
          tarefasConcluidas += tarefasAtivas.filter(t => t.status === 'concluida' || t.concluida === 1).length;
          tarefasPausadas += tarefasAtivas.filter(t => t.status === 'pausada').length;
        }
      }
      
      const metricTotal = document.getElementById("metricTotal");
      const metricConcluidas = document.getElementById("metricConcluidas");
      const metricPausadas = document.getElementById("metricPausadas");
      
      if (metricTotal) metricTotal.textContent = totalTarefas;
      if (metricConcluidas) metricConcluidas.textContent = tarefasConcluidas;
      if (metricPausadas) metricPausadas.textContent = tarefasPausadas;
      
      console.log("✅ Métricas totais carregadas:", { totalTarefas, tarefasConcluidas, tarefasPausadas });
    }
  } catch (error) {
    console.error("❌ Erro ao carregar métricas totais:", error);
    document.getElementById("metricTotal").textContent = "0";
    document.getElementById("metricConcluidas").textContent = "0";
    document.getElementById("metricPausadas").textContent = "0";
  }
}

async function carregarTarefasAtrasadas() {
  try {
    const dados = await taskManager.fetch(
      "api.php?action=relatorio_tarefas_atrasadas"
    );

    if (dados) {
      dadosRelatorios.atrasadas = dados;
      renderizarTarefasAtrasadas(dados);
      
      const metricAtrasadas = document.getElementById("metricAtrasadas");
      if (metricAtrasadas) {
        metricAtrasadas.textContent = dados.length;
      }
      
      console.log("✅ Tarefas atrasadas carregadas:", dados.length);
    }
  } catch (error) {
    console.error("❌ Erro ao carregar tarefas atrasadas:", error);
    const container = document.getElementById("listaAtrasadas");
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i> Erro ao carregar tarefas atrasadas
        </div>
      `;
    }
    
    const metricAtrasadas = document.getElementById("metricAtrasadas");
    if (metricAtrasadas) {
      metricAtrasadas.textContent = "0";
    }
  }
}

async function carregarTarefasPausadas() {
  try {
    const dados = await taskManager.fetch(
      "api.php?action=relatorio_tarefas_pausadas"
    );

    if (dados) {
      dadosRelatorios.pausadas = dados;
      renderizarTarefasPausadas(dados);
      
      const metricPausadas = document.getElementById("metricPausadas");
      if (metricPausadas) {
        metricPausadas.textContent = dados.length;
      }
      
      console.log("✅ Tarefas pausadas carregadas:", dados.length);
    }
  } catch (error) {
    console.error("❌ Erro ao carregar tarefas pausadas:", error);
    const container = document.getElementById("listaPausadas");
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i> Erro ao carregar tarefas pausadas
        </div>
      `;
    }
    
    const metricPausadas = document.getElementById("metricPausadas");
    if (metricPausadas) {
      metricPausadas.textContent = "0";
    }
  }
}

async function carregarRelatorioProjetos() {
  try {
    const dados = await taskManager.fetch(
      "api.php?action=relatorio_por_projeto"
    );

    console.log("📊 Dados do relatório por projeto:", dados);

    if (dados) {
      const projetosComProgresso = await Promise.all(
        dados.map(async (projeto) => {
          try {
            const tarefas = await taskManager.fetch(
              `api.php?action=obter_tarefas&projeto_id=${projeto.id}`
            );

            let progressoReal = 0;
            if (tarefas && tarefas.length > 0) {
              const tarefasAtivas = tarefas.filter(
                (t) => t.status !== "excluida"
              );

              if (tarefasAtivas.length > 0) {
                const progressos = tarefasAtivas.map(
                  (t) => parseInt(t.progresso) || 0
                );
                progressoReal = Math.round(
                  progressos.reduce((a, b) => a + b, 0) / progressos.length
                );
              }
            }

            return {
              ...projeto,
              progresso_real: progressoReal,
            };
          } catch (error) {
            console.error(
              `Erro ao buscar tarefas do projeto ${projeto.nome}:`,
              error
            );
            return {
              ...projeto,
              progresso_real: 0,
            };
          }
        })
      );

      dadosRelatorios.projetos = projetosComProgresso;
      renderizarRelatorioProjetos(projetosComProgresso);
      console.log(
        "✅ Relatório por projeto carregado:",
        projetosComProgresso.length
      );
    }
  } catch (error) {
    console.error("❌ Erro ao carregar relatório por projeto:", error);
    const container = document.getElementById("listaProjetos");
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i> Erro ao carregar relatório por projeto
        </div>
      `;
    }
  }
}

async function carregarRelatorioUsuarios() {
  try {
    const dados = await taskManager.fetch(
      "api.php?action=relatorio_por_usuario"
    );

    console.log("👥 Dados do relatório por usuário:", dados);

    if (dados) {
      const usuariosComProgresso = await Promise.all(
        dados.map(async (usuario) => {
          try {
            const projetos = await taskManager.fetch(
              "api.php?action=obter_projetos"
            );
            let progressoReal = 0;
            let tarefasDoUsuario = 0;
            let somaProgressos = 0;

            if (projetos) {
              for (const projeto of projetos) {
                const tarefas = await taskManager.fetch(
                  `api.php?action=obter_tarefas&projeto_id=${projeto.id}`
                );
                if (tarefas) {
                  const tarefasUsuario = tarefas.filter(
                    (t) =>
                      t.usuarios &&
                      t.usuarios.some((u) => u.id === usuario.id) &&
                      t.status !== "excluida"
                  );

                  tarefasDoUsuario += tarefasUsuario.length;
                  somaProgressos += tarefasUsuario.reduce(
                    (sum, t) => sum + (parseInt(t.progresso) || 0),
                    0
                  );
                }
              }

              if (tarefasDoUsuario > 0) {
                progressoReal = Math.round(somaProgressos / tarefasDoUsuario);
              }
            }

            return {
              ...usuario,
              progresso_real: progressoReal,
            };
          } catch (error) {
            console.error(
              `Erro ao calcular progresso do usuário ${usuario.nome}:`,
              error
            );
            return {
              ...usuario,
              progresso_real: 0,
            };
          }
        })
      );

      dadosRelatorios.usuarios = usuariosComProgresso;
      renderizarRelatorioUsuarios(usuariosComProgresso);
      console.log(
        "✅ Relatório por usuário carregado:",
        usuariosComProgresso.length
      );
    }
  } catch (error) {
    console.error("❌ Erro ao carregar relatório por usuário:", error);
    const container = document.getElementById("listaUsuarios");
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i> Erro ao carregar relatório por usuário
        </div>
      `;
    }
  }
}

// ========== FUNÇÕES DE RENDERIZAÇÃO ==========

function renderizarTarefasAtrasadas(tarefas) {
  const container = document.getElementById("listaAtrasadas");
  if (!container) return;

  if (!tarefas || tarefas.length === 0) {
    container.innerHTML = `
      <div class="alert alert-success">
        <i class="fas fa-check-circle"></i> Nenhuma tarefa atrasada! 🎉
      </div>
    `;
    return;
  }

  container.innerHTML = tarefas
    .map((tarefa) => {
      const prioridadeInfo =
        prioridades[tarefa.prioridade] || prioridades["importante_nao_urgente"];
      const usuarios =
        tarefa.usuarios.map((u) => u.nome).join(", ") || "Sem usuários";

      let progresso = tarefa.progresso;
      if (!progresso && progresso !== 0) {
        if (tarefa.status === "concluida") progresso = 100;
        else if (tarefa.status === "iniciada") progresso = 50;
        else if (tarefa.status === "pausada") progresso = 25;
        else progresso = 0;
      }

      return `
        <div class="tarefa-relatorio">
          <h6>
            ${escapeHtml(tarefa.titulo)}
            <span class="badge bg-${prioridadeInfo.cor} float-end">${
        prioridadeInfo.nome
      }</span>
          </h6>
          <div class="info-line">
            <span><i class="fas fa-folder"></i> ${escapeHtml(
              tarefa.projeto_nome
            )}</span>
            <span class="text-danger"><i class="fas fa-clock"></i> ${
              tarefa.dias_atraso
            } dia(s) de atraso</span>
          </div>
          <div class="info-line">
            <span><i class="fas fa-calendar"></i> Prazo: ${formatarDataHora(
              tarefa.data_fim
            )}</span>
            <span><i class="fas fa-users"></i> ${usuarios}</span>
          </div>
          <div class="progress mt-2" style="height: 15px;">
            <div class="progress-bar ${
              progresso === 100
                ? "bg-success"
                : progresso > 0
                ? "bg-primary"
                : "bg-secondary"
            }" 
                 role="progressbar" 
                 style="width: ${progresso}%" 
                 aria-valuenow="${progresso}" 
                 aria-valuemin="0" 
                 aria-valuemax="100">
              ${progresso}%
            </div>
          </div>
          <div class="mt-1">
            <small class="text-muted">Progresso: ${progresso}%</small>
          </div>
          ${
            tarefa.descricao
              ? `<p class="mb-0 mt-2 text-muted small">${escapeHtml(
                  tarefa.descricao
                )}</p>`
              : ""
          }
        </div>
      `;
    })
    .join("");
  inicializarTooltips();
}

function renderizarTarefasPausadas(tarefas) {
  const container = document.getElementById("listaPausadas");
  if (!container) return;

  if (!tarefas || tarefas.length === 0) {
    container.innerHTML = `
      <div class="alert alert-success">
        <i class="fas fa-check-circle"></i> Nenhuma tarefa pausada!
      </div>
    `;
    return;
  }

  container.innerHTML = tarefas
    .map((tarefa) => {
      const prioridadeInfo =
        prioridades[tarefa.prioridade] || prioridades["importante_nao_urgente"];
      const usuarios =
        tarefa.usuarios && tarefa.usuarios.length > 0
          ? tarefa.usuarios.map((u) => u.nome).join(", ")
          : "Sem usuários";
      const diasRestantes = tarefa.dias_ate_prazo || 0;

      let progresso = tarefa.progresso;
      if (progresso === undefined || progresso === null || progresso === "") {
        progresso = 25;
        if (
          tarefa.etapas_concluidas !== undefined &&
          tarefa.total_etapas !== undefined
        ) {
          const etapasConcluidas = parseInt(tarefa.etapas_concluidas) || 0;
          const totalEtapas = parseInt(tarefa.total_etapas) || 1;
          progresso = Math.round((etapasConcluidas / totalEtapas) * 100);
        } else if (tarefa.data_conclusao) {
          progresso = 100;
        }
      }

      progresso = Math.min(100, Math.max(0, parseInt(progresso) || 25));

      const alertaPrazo =
        diasRestantes < 0
          ? `<span class="text-danger">${Math.abs(
              diasRestantes
            )} dia(s) atrasado</span>`
          : `<span class="text-success">${diasRestantes} dia(s) até o prazo</span>`;

      return `
        <div class="tarefa-relatorio pausada">
          <h6>
            ${escapeHtml(tarefa.titulo)}
            <span class="badge bg-${prioridadeInfo.cor} float-end">${
        prioridadeInfo.nome
      }</span>
          </h6>
          <div class="info-line">
            <span><i class="fas fa-folder"></i> ${escapeHtml(
              tarefa.projeto_nome || "Sem projeto"
            )}</span>
            <span><i class="fas fa-clock"></i> ${alertaPrazo}</span>
          </div>
          <div class="info-line">
            <span><i class="fas fa-calendar"></i> Prazo: ${formatarDataHora(
              tarefa.data_fim
            )}</span>
            <span><i class="fas fa-users"></i> ${usuarios}</span>
          </div>
          <div class="progress mt-2" style="height: 15px;">
            <div class="progress-bar ${
              progresso === 100
                ? "bg-success"
                : progresso > 0
                ? "bg-warning"
                : "bg-secondary"
            }" 
                 role="progressbar" 
                 style="width: ${progresso}%" 
                 aria-valuenow="${progresso}" 
                 aria-valuemin="0" 
                 aria-valuemax="100">
              ${progresso}%
            </div>
          </div>
          <div class="mt-1">
            <small class="text-muted">Progresso: ${progresso}%</small>
          </div>
          ${
            tarefa.descricao
              ? `<p class="mb-0 mt-2 text-muted small">${escapeHtml(
                  tarefa.descricao
                )}</p>`
              : ""
          }
        </div>
      `;
    })
    .join("");
  inicializarTooltips();
}

function renderizarRelatorioProjetos(projetos) {
  const container = document.getElementById("listaProjetos");
  if (!container) return;

  if (!projetos || projetos.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info">
        <i class="fas fa-info-circle"></i> Nenhum projeto encontrado
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <table class="table table-hover table-relatorio">
      <thead>
        <tr>
          <th>Projeto</th>
          <th class="text-center">Total</th>
          <th class="text-center">Concluídas</th>
          <th class="text-center">Em Andamento</th>
          <th class="text-center">Pausadas</th>
          <th class="text-center">Atrasadas</th>
          <th class="text-center">Progresso Real<br><small>(Checklist/Etapas)</small></th>
        </tr>
      </thead>
      <tbody>
        ${projetos
          .map((projeto) => {
            const total = parseInt(projeto.total_tarefas) || 0;
            const concluidas = parseInt(projeto.concluidas) || 0;
            const emAndamento = parseInt(projeto.em_andamento) || 0;
            const pausadas = parseInt(projeto.pausadas) || 0;
            const atrasadas = parseInt(projeto.atrasadas) || 0;
            const progressoReal = projeto.progresso_real || 0;

            return `
            <tr>
              <td><strong>${escapeHtml(projeto.nome)}</strong></td>
              <td class="text-center">${total}</td>
              <td class="text-center"><span class="badge bg-success">${concluidas}</span></td>
              <td class="text-center"><span class="badge bg-primary">${emAndamento}</span></td>
              <td class="text-center"><span class="badge bg-warning">${pausadas}</span></td>
              <td class="text-center"><span class="badge bg-danger">${atrasadas}</span></td>
              <td class="text-center">
                <div class="d-flex flex-column align-items-center">
                  <div class="progress" style="height: 20px; width: 120px;">
                    <div class="progress-bar ${
                      progressoReal === 100
                        ? "bg-success"
                        : progressoReal > 0
                        ? "bg-info"
                        : "bg-secondary"
                    }" 
                         role="progressbar" 
                         style="width: ${progressoReal}%" 
                         aria-valuenow="${progressoReal}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                      ${progressoReal}%
                    </div>
                  </div>
                  <small class="text-muted mt-1">Baseado no checklist</small>
                </div>
              </td>
            </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
  inicializarTooltips();
}

function renderizarRelatorioUsuarios(usuarios) {
  const container = document.getElementById("listaUsuarios");
  if (!container) return;

  if (!usuarios || usuarios.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info">
        <i class="fas fa-info-circle"></i> Nenhum usuário encontrado
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <table class="table table-hover table-relatorio">
      <thead>
        <tr>
          <th>Usuário</th>
          <th class="text-center">Total</th>
          <th class="text-center">Concluídas</th>
          <th class="text-center">Em Andamento</th>
          <th class="text-center">Pausadas</th>
          <th class="text-center">Atrasadas</th>
          <th class="text-center">Progresso Real<br><small>(Checklist/Etapas)</small></th>
        </tr>
      </thead>
      <tbody>
        ${usuarios
          .map((usuario) => {
            const total = parseInt(usuario.total_tarefas) || 0;
            const concluidas = parseInt(usuario.concluidas) || 0;
            const emAndamento = parseInt(usuario.em_andamento) || 0;
            const pausadas = parseInt(usuario.pausadas) || 0;
            const atrasadas = parseInt(usuario.atrasadas) || 0;
            const progressoReal = usuario.progresso_real || 0;

            return `
            <tr>
              <td>
                <strong>${escapeHtml(usuario.nome)}</strong><br>
                <small class="text-muted">${escapeHtml(usuario.email)}</small>
              </td>
              <td class="text-center">${total}</td>
              <td class="text-center"><span class="badge bg-success">${concluidas}</span></td>
              <td class="text-center"><span class="badge bg-primary">${emAndamento}</span></td>
              <td class="text-center"><span class="badge bg-warning">${pausadas}</span></td>
              <td class="text-center"><span class="badge bg-danger">${atrasadas}</span></td>
              <td class="text-center">
                <div class="d-flex flex-column align-items-center">
                  <div class="progress" style="height: 20px; width: 120px;">
                    <div class="progress-bar ${
                      progressoReal === 100
                        ? "bg-success"
                        : progressoReal > 0
                        ? "bg-info"
                        : "bg-secondary"
                    }" 
                         role="progressbar" 
                         style="width: ${progressoReal}%" 
                         aria-valuenow="${progressoReal}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                      ${progressoReal}%
                    </div>
                  </div>
                  <small class="text-muted mt-1">Baseado no checklist</small>
                </div>
              </td>
            </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
  inicializarTooltips();
}

// ========== FUNÇÕES AUXILIARES ==========

function formatarDataHora(dataString) {
  if (!dataString) return "N/A";
  const data = new Date(dataString);
  if (isNaN(data.getTime())) return "Data inválida";
  
  return (
    data.toLocaleDateString("pt-BR") +
    " " +
    data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

function exportarRelatorio(tipo) {
  let dados = [];
  let filename = "";
  let headers = [];

  switch (tipo) {
    case "atrasadas":
      dados = dadosRelatorios.atrasadas || [];
      filename = "tarefas_atrasadas.csv";
      headers = [
        "Título",
        "Projeto",
        "Prazo",
        "Dias de Atraso",
        "Prioridade",
        "Usuários",
      ];
      dados = dados.map((t) => [
        t.titulo,
        t.projeto_nome,
        formatarDataHora(t.data_fim),
        t.dias_atraso,
        prioridades[t.prioridade]?.nome || "N/A",
        t.usuarios.map((u) => u.nome).join("; "),
      ]);
      break;

    case "pausadas":
      dados = dadosRelatorios.pausadas || [];
      filename = "tarefas_pausadas.csv";
      headers = [
        "Título",
        "Projeto",
        "Prazo",
        "Dias até Prazo",
        "Prioridade",
        "Usuários",
      ];
      dados = dados.map((t) => [
        t.titulo,
        t.projeto_nome,
        formatarDataHora(t.data_fim),
        t.dias_ate_prazo,
        prioridades[t.prioridade]?.nome || "N/A",
        t.usuarios.map((u) => u.nome).join("; "),
      ]);
      break;

    case "projetos":
      dados = dadosRelatorios.projetos || [];
      filename = "relatorio_projetos.csv";
      headers = [
        "Projeto",
        "Total",
        "Concluídas",
        "Em Andamento",
        "Pausadas",
        "Atrasadas",
        "Progresso Real",
      ];
      dados = dados.map((p) => [
        p.nome,
        p.total_tarefas,
        p.concluidas,
        p.em_andamento,
        p.pausadas,
        p.atrasadas,
        (p.progresso_real || 0) + "%",
      ]);
      break;

    case "usuarios":
      dados = dadosRelatorios.usuarios || [];
      filename = "relatorio_usuarios.csv";
      headers = [
        "Usuário",
        "Email",
        "Total",
        "Concluídas",
        "Em Andamento",
        "Pausadas",
        "Atrasadas",
        "Progresso Real",
      ];
      dados = dados.map((u) => [
        u.nome,
        u.email,
        u.total_tarefas,
        u.concluidas,
        u.em_andamento,
        u.pausadas,
        u.atrasadas,
        (u.progresso_real || 0) + "%",
      ]);
      break;
  }

  if (dados.length === 0) {
    alert("❌ Nenhum dado para exportar");
    return;
  }

  // Criar CSV
  let csv = headers.join(",") + "\n";
  dados.forEach((row) => {
    csv += row.map((cell) => `"${cell}"`).join(",") + "\n";
  });

  // Download
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();

  alert("✅ Relatório exportado com sucesso!");
}

console.log("✅ relatorios.js carregado e pronto");