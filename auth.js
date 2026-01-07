// ========== SISTEMA DE AUTENTICAÇÃO - JAVASCRIPT ==========

class AuthManager {
  constructor() {
    this.apiUrl = "auth.php";
    this.redirectUrl = "index.html";
    this.init();
  }

  init() {
    this.checkAuthStatus();
    this.setupEventListeners(); // ✅ AGORA ESTE MÉTODO EXISTE
    this.setupValidation();
  }

  // ✅ ADICIONE ESTE MÉTODO FALTANTE
  setupEventListeners() {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    }

    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
      registerForm.addEventListener("submit", (e) => this.handleRegister(e));
    }
  }

  checkAuthStatus() {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('authtoken');
    const currentPage = window.location.pathname.split('/').pop();
    
    console.log(`🔍 Auth Check: ${currentPage}, Token: ${token ? 'Sim' : 'Não'}`);
    
    // ✅ Páginas públicas (não requerem autenticação)
    const publicPages = ['login.html', 'register.html', 'esqueceu-senha.html'];
    
    // ✅ Páginas protegidas (requerem autenticação)
    const protectedPages = ['index.html', 'arquivo.html', 'relatorio.html', 'admin.html'];
    
    if (!token) {
        // ❌ Usuário NÃO autenticado tentando acessar página protegida
        if (protectedPages.includes(currentPage)) {
            console.log('❌ Não autenticado - Redirecionando para login');
            window.location.href = 'login.html';
            return;
        }
    } else {
        // ✅ Usuário autenticado tentando acessar página pública
        if (publicPages.includes(currentPage)) {
            console.log('✅ Autenticado - Redirecionando para index');
            window.location.href = this.redirectUrl;
            return;
        }
    }
    
    console.log(`✅ Status OK: ${currentPage} - ${token ? 'Autenticado' : 'Página pública'}`);
  }

  // ... o resto do código permanece igual ...
  setupValidation() {
    // Validação de email
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach((input) => {
      input.addEventListener("blur", () => this.validateEmail(input));
    });

    // Validação específica para registro
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
      const senhaInput = registerForm.querySelector("#senha");
      if (senhaInput) {
        senhaInput.addEventListener("input", () =>
          this.validatePassword(senhaInput)
        );
      }

      const confirmarSenhaInput = registerForm.querySelector("#confirmarSenha");
      if (confirmarSenhaInput) {
        confirmarSenhaInput.addEventListener("input", () => {
          this.validatePasswordConfirmation();
        });
      }
    }

    const nomeInput = document.getElementById("nome");
    if (nomeInput) {
      nomeInput.addEventListener("blur", () => this.validateName(nomeInput));
    }
  }

  // ========== MÉTODOS DE VALIDAÇÃO ==========
  validateEmail(input) {
    if (!input) return false;

    const email = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      this.showFieldError(input, "Email é obrigatório");
      return false;
    }

    if (!emailRegex.test(email)) {
      this.showFieldError(input, "Digite um email válido");
      return false;
    }

    this.showFieldSuccess(input);
    return true;
  }

  validatePassword(input) {
    if (!input) return false;

    const password = input.value;

    let strengthContainer = input
      .closest(".form-group")
      .querySelector(".password-strength-container");
    if (!strengthContainer) {
      strengthContainer = document.createElement("div");
      strengthContainer.className = "password-strength-container";
      input.closest(".form-group").appendChild(strengthContainer);
    }

    strengthContainer.innerHTML = "";

    if (password.length < 6) {
      this.showFieldError(input, "Senha deve ter no mínimo 6 caracteres");
      return false;
    }

    if (password.length > 0) {
      const strength = this.getPasswordStrength(password);
      const strengthIndicator = document.createElement("div");
      strengthIndicator.className = `password-strength ${strength.level}`;
      strengthIndicator.textContent = strength.message;
      strengthContainer.appendChild(strengthIndicator);
    }

    this.showFieldSuccess(input);
    return true;
  }

  // MÉTODO DE VALIDAÇÃO DE CONFIRMAÇÃO DE SENHA
  validatePasswordConfirmation() {
    console.log("✅ validatePasswordConfirmation executado");
    const senhaInput = document.getElementById("senha");
    const confirmarSenhaInput = document.getElementById("confirmarSenha");

    if (!senhaInput || !confirmarSenhaInput) {
      console.error("Campos de senha não encontrados");
      return false;
    }

    const senha = senhaInput.value;
    const confirmarSenha = confirmarSenhaInput.value;

    if (confirmarSenha && confirmarSenha !== senha) {
      this.showFieldError(confirmarSenhaInput, "Senhas não coincidem");
      return false;
    }

    if (confirmarSenha) {
      this.showFieldSuccess(confirmarSenhaInput);
    } else {
      this.clearValidation(confirmarSenhaInput);
    }

    return true;
  }

  validateName(input) {
    if (!input) return false;

    const name = input.value.trim();

    if (!name) {
      this.showFieldError(input, "Nome é obrigatório");
      return false;
    }

    if (name.length < 2) {
      this.showFieldError(input, "Nome deve ter pelo menos 2 caracteres");
      return false;
    }

    this.showFieldSuccess(input);
    return true;
  }

  getPasswordStrength(password) {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score < 3) {
      return { level: "weak", message: "Senha fraca" };
    } else if (score < 4) {
      return { level: "medium", message: "Senha média" };
    } else {
      return { level: "strong", message: "Senha forte" };
    }
  }

  // ========== MANIPULAÇÃO DE FORMULÁRIOS ==========
  async handleLogin(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const emailInput = form.querySelector("#email");
    const senhaInput = form.querySelector("#senha");

    if (!emailInput || !senhaInput) {
      this.showAlert("Erro: Campos do formulário não encontrados.", "danger");
      return false;
    }

    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    if (!email || !senha) {
      this.showAlert("Por favor, preencha todos os campos", "warning");
      return false;
    }

    this.setButtonLoading(submitBtn, true);

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "login",
          email: email,
          senha: senha,
        }),
      });

      const data = await response.json();

      if (data.sucesso) {
        localStorage.setItem("auth_token", data.dados.token);
        localStorage.setItem("user_data", JSON.stringify(data.dados.usuario));

        this.showAlert("Login realizado com sucesso!", "success");

        setTimeout(() => {
          window.location.href = this.redirectUrl;
        }, 1000);
      } else {
        this.showAlert(data.erro || "Erro ao fazer login", "danger");
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      this.showAlert("Erro de conexão. Tente novamente.", "danger");
    } finally {
      this.setButtonLoading(submitBtn, false);
    }

    return false;
  }

  async handleRegister(e) {
    e.preventDefault();

    console.log("🔍 Iniciando registro...");

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    let nomeInput = document.getElementById("nome");
    let emailInput = document.getElementById("email");
    let senhaInput = document.getElementById("senha");
    let confirmarSenhaInput = document.getElementById("confirmarSenha");
    let termosInput = document.getElementById("termos");

    if (
      !nomeInput ||
      !emailInput ||
      !senhaInput ||
      !confirmarSenhaInput ||
      !termosInput
    ) {
      this.showAlert("Erro: Campos do formulário não encontrados.", "danger");
      return false;
    }

    let isValid = true;

    if (!this.validateName(nomeInput)) {
      isValid = false;
    }

    if (!this.validateEmail(emailInput)) {
      isValid = false;
    }

    if (!this.validatePassword(senhaInput)) {
      isValid = false;
    }

    // CHAMADA DO MÉTODO - deve funcionar agora
    console.log("Chamando validatePasswordConfirmation...");
    if (!this.validatePasswordConfirmation()) {
      console.log("❌ Validação da confirmação de senha falhou");
      isValid = false;
    }

    if (!termosInput.checked) {
      this.showAlert("Você deve aceitar os termos e condições", "warning");
      isValid = false;
    }

    if (!isValid) {
      console.log("❌ Validação geral falhou");
      return false;
    }

    console.log("✅ Validação concluída com sucesso!");

    const nome = nomeInput.value.trim();
    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    if (!nome || !email || !senha) {
      this.showAlert("Erro: Dados incompletos no formulário.", "danger");
      return false;
    }

    this.setButtonLoading(submitBtn, true);

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "register",
          nome: nome,
          email: email,
          senha: senha,
        }),
      });

      const data = await response.json();

      if (data.sucesso) {
        // Mensagem de sucesso principal
        this.showAlert("Conta criada com sucesso! 🎉", "success");

        // Mensagem adicional sobre aprovação
        setTimeout(() => {
          this.showAlert(
            "A aprovação será feita pelo gestor do seu setor. Você receberá um e-mail quando for liberado o acesso.",
            "info"
          );
        }, 1500);

        form.reset();

        const strengthContainer = senhaInput
          .closest(".form-group")
          .querySelector(".password-strength-container");
        if (strengthContainer) {
          strengthContainer.innerHTML = "";
        }

        // Redireciona após 5 segundos para dar tempo das mensagens aparecerem
        setTimeout(() => {
          window.location.href = "login.html";
        }, 5000);
      } else {
        this.showAlert(data.erro || "Erro ao criar conta", "danger");
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      this.showAlert("Erro de conexão. Tente novamente.", "danger");
    } finally {
      this.setButtonLoading(submitBtn, false);
    }

    return false;
  }

  // ========== UTILITÁRIOS DE UI ==========
  showFieldError(input, message) {
    if (!input) return;

    input.classList.add("is-invalid");
    input.classList.remove("is-valid");

    const existingFeedback =
      input.parentNode.querySelector(".invalid-feedback");
    if (existingFeedback) {
      existingFeedback.remove();
    }

    const feedback = document.createElement("div");
    feedback.className = "invalid-feedback";
    feedback.textContent = message;
    feedback.style.display = "block";
    input.parentNode.appendChild(feedback);
  }

  showFieldSuccess(input) {
    if (!input) return;

    input.classList.add("is-valid");
    input.classList.remove("is-invalid");

    const existingFeedback =
      input.parentNode.querySelector(".invalid-feedback");
    if (existingFeedback) {
      existingFeedback.remove();
    }
  }

  clearValidation(input) {
    if (!input) return;

    input.classList.remove("is-valid", "is-invalid");

    const existingFeedback =
      input.parentNode.querySelector(".invalid-feedback");
    if (existingFeedback) {
      existingFeedback.remove();
    }

    if (input.type === "password" && input.value === "") {
      const strengthContainer = input
        .closest(".form-group")
        .querySelector(".password-strength-container");
      if (strengthContainer) {
        strengthContainer.innerHTML = "";
      }
    }
  }

  setButtonLoading(button, loading) {
    if (!button) return;

    if (loading) {
      button.disabled = true;
      button.classList.add("loading");

      const icon = button.querySelector("i");
      if (icon) {
        icon.className = "fas fa-spinner fa-spin";
      }
    } else {
      button.disabled = false;
      button.classList.remove("loading");

      const icon = button.querySelector("i");
      if (icon) {
        if (button.form && button.form.id === "loginForm") {
          icon.className = "fas fa-sign-in-alt";
        } else if (button.form && button.form.id === "registerForm") {
          icon.className = "fas fa-user-plus";
        }
      }
    }
  }

  showAlert(message, type = "info") {
    const alertContainer = document.getElementById("alertContainer");
    if (!alertContainer) {
      console.error("Alert container não encontrado");
      return;
    }

    const alert = document.createElement("div");
    alert.className = `alert alert-${type} alert-custom alert-dismissible fade show`;
    alert.innerHTML = `
            <strong>${this.getAlertTitle(type)}</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

    alertContainer.appendChild(alert);

    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, 5000);
  }

  getAlertTitle(type) {
    const titles = {
      success: "Sucesso!",
      danger: "Erro!",
      warning: "Atenção!",
      info: "Informação:",
    };
    return titles[type] || "Aviso:";
  }
}

// ========== CLASSE PARA RECUPERAÇÃO DE SENHA ==========
class PasswordRecovery {
  constructor() {
    this.apiUrl = "auth.php";
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkTokenFromURL();
  }

  setupEventListeners() {
    const solicitarForm = document.getElementById("solicitarRecuperacaoForm");
    if (solicitarForm) {
      solicitarForm.addEventListener("submit", (e) =>
        this.handleSolicitacaoRecuperacao(e)
      );
    }

    const redefinirForm = document.getElementById("redefinirSenhaForm");
    if (redefinirForm) {
      redefinirForm.addEventListener("submit", (e) =>
        this.handleRedefinicaoSenha(e)
      );
    }
  }

  checkTokenFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      this.mostrarFormRedefinicao(token);
    }
  }

  mostrarFormRedefinicao(token) {
    const solicitarForm = document.getElementById("solicitarRecuperacaoForm");
    const redefinirForm = document.getElementById("redefinirSenhaForm");
    const tokenInput = document.getElementById("token");

    if (solicitarForm && redefinirForm && tokenInput) {
      solicitarForm.style.display = "none";
      redefinirForm.style.display = "block";
      tokenInput.value = token;

      const header = document.querySelector(".auth-header");
      if (header) {
        header.querySelector("h2").textContent = "Redefinir Senha";
        header.querySelector("p").textContent = "Digite sua nova senha";
        header.querySelector("i").className = "fas fa-lock";
      }
    }
  }

  async handleSolicitacaoRecuperacao(e) {
    e.preventDefault();
    console.log("🔔 Iniciando solicitação de recuperação...");

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const emailInput = form.querySelector("#email");

    if (!emailInput) {
      console.error("❌ Campo email não encontrado");
      this.showAlert("Erro: Campo email não encontrado.", "danger");
      return false;
    }

    const email = emailInput.value.trim();
    console.log("📧 Email digitado:", email);

    if (!email) {
      this.showAlert("Por favor, digite seu email", "warning");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showAlert("Digite um email válido", "warning");
      return false;
    }

    // Mostrar loading no botão
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    try {
      console.log("📤 Enviando requisição para API...");
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "solicitar_recuperacao_senha",
          email: email,
        }),
      });

      const data = await response.json();
      console.log("📥 Resposta da API:", data);

      if (data.sucesso) {
        console.log("✅ Sucesso - desabilitando campos...");

        // DESABILITAR CAMPO DE EMAIL
        emailInput.disabled = true;
        emailInput.classList.add("disabled-field");

        // MUDAR BOTÃO
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Email Enviado';
        submitBtn.style.backgroundColor = "#28a745";
        submitBtn.style.borderColor = "#28a745";

        // MENSAGEM DE SUCESSO
        this.showAlert(
          "✅ Email de recuperação enviado com sucesso! Verifique sua caixa de entrada e a pasta de spam.",
          "success"
        );

        console.log("🎉 Processo concluído com sucesso");
      } else {
        console.error("❌ Erro da API:", data.erro);
        this.showAlert(
          data.erro || "Erro ao solicitar recuperação de senha",
          "danger"
        );

        // Reativar botão em caso de erro
        submitBtn.disabled = false;
        submitBtn.innerHTML =
          '<i class="fas fa-paper-plane"></i> Enviar Link de Recuperação';
      }
    } catch (error) {
      console.error("💥 Erro na requisição:", error);
      this.showAlert("Erro de conexão. Tente novamente.", "danger");

      // Reativar botão em caso de erro
      submitBtn.disabled = false;
      submitBtn.innerHTML =
        '<i class="fas fa-paper-plane"></i> Enviar Link de Recuperação';
    }

    return false;
  }

  async handleRedefinicaoSenha(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const tokenInput = form.querySelector("#token");
    const novaSenhaInput = form.querySelector("#novaSenha");
    const confirmarNovaSenhaInput = form.querySelector("#confirmarNovaSenha");

    if (!tokenInput || !novaSenhaInput || !confirmarNovaSenhaInput) {
      this.showAlert("Erro: Campos do formulário não encontrados.", "danger");
      return false;
    }

    const token = tokenInput.value;
    const novaSenha = novaSenhaInput.value;
    const confirmarNovaSenha = confirmarNovaSenhaInput.value;

    if (!token) {
      this.showAlert("Token inválido ou expirado", "danger");
      return false;
    }

    if (!novaSenha || !confirmarNovaSenha) {
      this.showAlert("Por favor, preencha todos os campos", "warning");
      return false;
    }

    // Validação de senhas
    if (novaSenha.length < 6) {
      this.showAlert("A nova senha deve ter no mínimo 6 caracteres", "warning");
      return false;
    }

    if (novaSenha !== confirmarNovaSenha) {
      this.showAlert("As senhas não coincidem", "warning");
      return false;
    }

    this.setButtonLoading(submitBtn, true);

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "redefinir_senha",
          token: token,
          nova_senha: novaSenha,
        }),
      });

      const data = await response.json();

      if (data.sucesso) {
        this.showAlert(
          "Senha redefinida com sucesso! Redirecionando para login...",
          "success"
        );

        setTimeout(() => {
          window.location.href = "login.html";
        }, 3000);
      } else {
        this.showAlert(data.erro || "Erro ao redefinir senha", "danger");
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      this.showAlert("Erro de conexão. Tente novamente.", "danger");
    } finally {
      this.setButtonLoading(submitBtn, false);
    }

    return false;
  }

  setButtonLoading(button, loading) {
    if (!button) return;

    if (loading) {
      button.disabled = true;
      button.classList.add("loading");

      const icon = button.querySelector("i");
      if (icon) {
        icon.className = "fas fa-spinner fa-spin";
      }
    } else {
      button.disabled = false;
      button.classList.remove("loading");

      const icon = button.querySelector("i");
      if (icon) {
        if (button.form && button.form.id === "solicitarRecuperacaoForm") {
          icon.className = "fas fa-paper-plane";
        } else if (button.form && button.form.id === "redefinirSenhaForm") {
          icon.className = "fas fa-save";
        }
      }
    }
  }

  showAlert(message, type = "info") {
    const alertContainer = document.getElementById("alertContainer");
    if (!alertContainer) {
      console.error("Alert container não encontrado");
      return;
    }

    const alert = document.createElement("div");
    alert.className = `alert alert-${type} alert-custom alert-dismissible fade show`;
    alert.innerHTML = `
            <strong>${this.getAlertTitle(type)}</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

    alertContainer.appendChild(alert);

    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, 5000);
  }

  getAlertTitle(type) {
    const titles = {
      success: "Sucesso!",
      danger: "Erro!",
      warning: "Atenção!",
      info: "Informação:",
    };
    return titles[type] || "Aviso:";
  }
}

// ========== FUNÇÕES GLOBAIS ==========
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const button = input.parentNode.querySelector(".password-toggle");
  if (!button) return;

  const icon = button.querySelector("i");
  if (!icon) return;

  if (input.type === "password") {
    input.type = "text";
    icon.className = "fas fa-eye-slash";
    button.setAttribute("aria-label", "Ocultar senha");
  } else {
    input.type = "password";
    icon.className = "fas fa-eye";
    button.setAttribute("aria-label", "Mostrar senha");
  }
}

function esqueceuSenha() {
  window.location.href = "esqueceu-senha.html";
}

function mostrarTermos() {
  alert("Termos e condições: Em desenvolvimento.");
}

// ========== UTILITÁRIOS DE SESSÃO ==========
function logout() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user_data");
  window.location.href = "login.html";
}

function getCurrentUser() {
  const userData = localStorage.getItem("user_data");
  return userData ? JSON.parse(userData) : null;
}

function isAuthenticated() {
  return !!localStorage.getItem("auth_token");
}

function hasPermission(requiredRole) {
  const user = getCurrentUser();
  if (!user) return false;

  const roleHierarchy = {
    usuario: 1,
    editor: 2,
    admin: 3,
  };

  return roleHierarchy[user.funcao] >= roleHierarchy[requiredRole];
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop();

  if (currentPage === "esqueceu-senha.html") {
    console.log("🚀 Inicializando PasswordRecovery...");
    new PasswordRecovery();
  } else {
    console.log("🚀 Inicializando AuthManager...");
    new AuthManager();
  }
});

// ========== MIDDLEWARE PARA PÁGINAS PROTEGIDAS ==========
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

function requireRole(role) {
  if (!isAuthenticated() || !hasPermission(role)) {
    alert("Você não tem permissão para acessar esta funcionalidade.");
    return false;
  }
  return true;
}
