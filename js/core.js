// ========== CORE - TASK MANAGER E AUTENTICAÇÃO ==========

// Proteção global - evitar dupla execução
if (window.__taskManagerInitialized) {
  console.warn("⚠️ Sistema já inicializado — execuções subsequentes serão ignoradas.");
} else {
  window.__taskManagerInitialized = true;
  console.log("🚀 Sistema inicializado.");
}

class TaskManager {
  constructor() {
    this.usuariosSelecionados = [];
    this.tarefaEditandoId = null;
    this.projetoEditandoId = null;
    this.filtroAtivo = "todas";
    this.filtroPrioridade = "todas";
    this.filtroMinhasTarefas = false;
    this.stats = {
      total: 0,
      concluidas: 0,
      andamento: 0,
      atrasadas: 0,
    };
    this.ehAdmin = false;
    console.log("📋 TaskManager inicializado");
  }

  async fetch(url, options = {}) {
    try {
      const token = localStorage.getItem("auth_token");
      if (token) {
        if (!options.headers) {
          options.headers = {};
        }
        options.headers["Authorization"] = "Bearer " + token;
      }

      // Construir URL completa se apenas o action foi passado
      let fullUrl = url;
      if (!url.startsWith('http') && !url.startsWith('/') && !url.includes('api.php')) {
        // Se é apenas uma action, construir a URL completa
        if (options.method === 'POST') {
          fullUrl = `api.php`;
          // Para POST, adicionar action ao body
          if (!options.body) {
            options.body = JSON.stringify({ action: url });
          } else if (typeof options.body === 'string') {
            const bodyData = JSON.parse(options.body);
            bodyData.action = url;
            options.body = JSON.stringify(bodyData);
          }
        } else {
          // Para GET, adicionar action à URL
          fullUrl = `api.php?action=${url}`;
        }
      }

      console.log(`🔗 Requisição: ${fullUrl}`, {
        metodo: options.method || 'GET',
        comToken: !!token
      });

      const response = await fetch(fullUrl, options);

      if (response.status === 401) {
        this.logout();
        throw new Error("Token expirado ou inválido");
      }

      const responseText = await response.text();

      if (!responseText) {
        throw new Error("Resposta vazia do servidor");
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ Erro ao parsear JSON:", parseError);
        console.error("📄 Resposta recebida:", responseText.substring(0, 500));
        throw new Error("Resposta inválida do servidor - não é JSON");
      }

      if (!data.sucesso) {
        throw new Error(data.erro || "Erro ao processar requisição");
      }

      return data.dados;
    } catch (error) {
      console.error("💥 Erro na comunicação com o servidor:", error);
      this.mostrarErro("Erro na comunicação com o servidor: " + error.message);
      throw error;
    }
  }

  logout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    window.location.href = "login.html";
  }

  mostrarErro(mensagem) {
    const alertDiv = document.createElement("div");
    alertDiv.className = "alert alert-danger alert-dismissible fade show";
    alertDiv.role = "alert";
    alertDiv.innerHTML = `
      <i class="fas fa-exclamation-circle"></i> ${mensagem}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    const container = document.querySelector(".container-tarefas");
    if (container) {
      const headerActions = document.querySelector(".header-actions");
      if (headerActions) {
        container.insertBefore(alertDiv, headerActions);
      } else {
        container.insertBefore(alertDiv, container.firstChild);
      }
      setTimeout(() => alertDiv.remove(), 5000);
    }
  }

  mostrarSucesso(mensagem) {
    const alertDiv = document.createElement("div");
    alertDiv.className = "alert alert-success alert-dismissible fade show";
    alertDiv.role = "alert";
    alertDiv.innerHTML = `
      <i class="fas fa-check-circle"></i> ${mensagem}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    const container = document.querySelector(".container-tarefas");
    if (container) {
      const headerActions = document.querySelector(".header-actions");
      if (headerActions) {
        container.insertBefore(alertDiv, headerActions);
      } else {
        container.insertBefore(alertDiv, container.firstChild);
      }
      setTimeout(() => alertDiv.remove(), 3000);
    }
  }

  atualizarEstatisticas(tarefas) {
    const hoje = new Date();
    const tarefasAtivas = tarefas.filter((t) => t.status !== "excluida");

    this.stats.total = tarefasAtivas.length;
    this.stats.concluidas = tarefasAtivas.filter(
      (t) => t.concluida === 1 || t.status === "concluida"
    ).length;
    this.stats.andamento = tarefasAtivas.filter(
      (t) => t.status === "iniciada"
    ).length;
    this.stats.pausadas = tarefasAtivas.filter(
      (t) => t.status === "pausada"
    ).length;
    this.stats.atrasadas = tarefasAtivas.filter((t) => {
      const dataFim = new Date(t.data_fim);
      return (
        (t.concluida === 0 || t.status !== "concluida") &&
        dataFim < hoje &&
        t.status !== "excluida"
      );
    }).length;

    this.atualizarElementoEstatistica("statTotal", this.stats.total);
    this.atualizarElementoEstatistica("statConcluidas", this.stats.concluidas);
    this.atualizarElementoEstatistica("statAndamento", this.stats.andamento);
    this.atualizarElementoEstatistica("statPausadas", this.stats.pausadas);
    this.atualizarElementoEstatistica("statAtrasadas", this.stats.atrasadas);

    console.log("📊 Estatísticas atualizadas:", this.stats);
  }

  atualizarElementoEstatistica(id, valor) {
    if (window.location.pathname.includes("relatorios.html")) {
      return;
    }

    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.textContent = valor;
      const card = elemento.closest(".stat-card");
      if (card) {
        card.setAttribute("data-value", valor);
      }
    } else {
      console.warn(`❌ Elemento #${id} não encontrado para atualizar estatística`);
    }
  }

  getCurrentUser() {
    const userData = localStorage.getItem("user_data");
    return userData ? JSON.parse(userData) : null;
  }

  async verificarSeEhAdmin() {
    try {
      const userData = this.getCurrentUser();
      this.ehAdmin = userData && userData.funcao === "admin";
      console.log("🔍 Verificação de admin:", {
        userData,
        ehAdmin: this.ehAdmin,
        funcao: userData ? userData.funcao : "não encontrado",
      });
      return this.ehAdmin;
    } catch (error) {
      console.error("❌ Erro ao verificar admin:", error);
      this.ehAdmin = false;
      return false;
    }
  }

  async debugAuth() {
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user_data");

    console.log("🔐 Debug de Autenticação:");
    console.log("Token:", token ? "Presente" : "Ausente");
    console.log("User Data:", userData ? JSON.parse(userData) : "Ausente");

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        console.log("👤 Usuário:", user.nome, "- Função:", user.funcao);

        const test = await this.fetch("api.php?action=obter_projetos");
        console.log("✅ Teste de API:", test ? "Sucesso" : "Falha");
      } catch (error) {
        console.error("❌ Erro no teste de API:", error);
      }
    }
  }
}

// Instância global
const taskManager = new TaskManager();

function isAuthenticated() {
  return !!localStorage.getItem("auth_token");
}

function logout() {
  if (confirm("Tem certeza que deseja sair?")) {
    taskManager.logout();
  }
}

function alterarSenha() {
  abrirAlterarSenha();
}

function abrirPerfil() {
  abrirEditarPerfil();
}
