// ========== FUNÇÕES DE AUTENTICAÇÃO ==========
function carregarDadosUsuario() {
  const userData = taskManager.getCurrentUser();
  if (userData) {
    // Atualizar título da página
    document.title = `Painel de Tarefas - ${userData.nome}`;

    // Atualizar nome do usuário na navbar
    const userNameElement = document.getElementById("userName");
    const userRoleElement = document.getElementById("userRole");

    if (userNameElement) {
      userNameElement.textContent = userData.nome;
    }
    if (userRoleElement) {
      userRoleElement.textContent = `Função: ${userData.funcao}`;
    }

    console.log("Usuário logado:", userData.nome, "- Função:", userData.funcao);
  }
}

function carregarInfoUsuario() {
  const userData = taskManager.getCurrentUser();
  if (userData) {
    const userName = document.getElementById("userName");
    const userRole = document.getElementById("userRole");
    const adminLinkItem = document.getElementById("adminLinkItem");

    if (userName) userName.textContent = userData.nome;
    if (userRole) {
      const funcaoText =
        userData.funcao === "admin"
          ? "Administrador"
          : userData.funcao === "editor"
          ? "Editor"
          : "Usuário";
      userRole.innerHTML = `<span class="funcao-badge funcao-${userData.funcao}">${funcaoText}</span>`;
    }

    // ✅ CORREÇÃO: Mostrar links de administração se for admin
    if (userData.funcao === "admin") {
      // Mostrar todos os elementos com classe admin-only
      const adminElements = document.querySelectorAll(".admin-only");
      adminElements.forEach((element) => {
        element.style.display = "block";
      });
      console.log("✅ Botões de administração exibidos");
    } else {
      // Ocultar todos os elementos com classe admin-only
      const adminElements = document.querySelectorAll(".admin-only");
      adminElements.forEach((element) => {
        element.style.display = "none";
      });
      console.log("ℹ️ Usuário não é admin - botões ocultos");
    }

    console.log("👤 Usuário:", userData.nome, "- Função:", userData.funcao);
  }
}

function isAuthenticated() {
  return !!localStorage.getItem("auth_token");
}

function logout() {
  if (confirm("Tem certeza que deseja sair?")) {
    taskManager.logout();
  }
}

function adicionarLinkAdmin(userData) {
  if (userData.funcao !== "admin") return;

  const navbar = document.querySelector(".navbar-nav");
  if (!navbar) return;

  // Verificar se o link já existe
  if (document.querySelector("#adminLink")) return;

  // Criar o item do menu para Administração
  const adminListItem = document.createElement("li");
  adminListItem.className = "nav-item";
  adminListItem.id = "adminLink";

  adminListItem.innerHTML = `
        <a class="nav-link" href="admin.html" title="Administração de usuários" data-bs-toggle="tooltip" data-bs-placement="bottom">
            <i class="fas fa-sliders-h"></i> 
        </a>
    `;

  // Encontrar o dropdown do usuário
  const userDropdown = navbar.querySelector(".nav-item.dropdown");
  if (userDropdown) {
    // Inserir antes do dropdown do usuário
    navbar.insertBefore(adminListItem, userDropdown);
  } else {
    // Se não encontrar o dropdown, adicionar no final
    navbar.appendChild(adminListItem);
  }

  console.log("🔗 Link de administração adicionado ao menu");
}