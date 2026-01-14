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
  
  console.log("🔍 carregarInfoUsuario chamada", userData);
  
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

    // ✅ CONTROLE DE VISIBILIDADE DE ELEMENTOS
    const userRoleFunc = userData.funcao;
    
    // 1. Elementos exclusivos de ADMIN (apenas admin vê)
    const adminElements = document.querySelectorAll(".admin-only");
    adminElements.forEach(el => {
        if (userRoleFunc === 'admin') {
            if (el.tagName === 'BUTTON') {
                el.style.cssText = 'display: inline-block !important; visibility: visible !important;';
            } else if (el.tagName === 'LI') {
                 el.style.cssText = 'display: list-item !important; visibility: visible !important;';
            } else {
                 el.style.cssText = 'display: block !important; visibility: visible !important;';
            }
        } else {
            el.style.cssText = 'display: none !important; visibility: hidden !important;';
        }
    });

    // 2. Elementos acessíveis por EDITOR (admin e editor veem)
    const editorElements = document.querySelectorAll(".editor-access");
    editorElements.forEach(el => {
        if (userRoleFunc === 'admin' || userRoleFunc === 'editor') {
             if (el.tagName === 'BUTTON') {
                el.style.cssText = 'display: inline-block !important; visibility: visible !important;';
            } else {
                 el.style.cssText = 'display: block !important; visibility: visible !important;';
            }
        } else {
            el.style.cssText = 'display: none !important; visibility: hidden !important;';
        }
    });

    console.log(`✅ Permissões aplicadas para função: ${userRole}`);

    console.log("👤 Usuário:", userData.nome, "- Função:", userData.funcao);
  } else {
    console.error("❌ userData não encontrado!");
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

// ✅ FUNÇÃO AUXILIAR PARA VERIFICAR PERMISSÕES
function verificarPermissaoAdminOuEditor() {
  const userData = taskManager.getCurrentUser();
  return userData && (userData.funcao === 'admin' || userData.funcao === 'editor');
}

// ✅ FORÇAR ATUALIZAÇÃO DOS BOTÕES QUANDO O DOM ESTIVER PRONTO
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
      console.log("🚀 DOM Carregado - forçando atualização de botões");
      carregarInfoUsuario();
    }, 100);
  });
} else {
  // DOM já está pronto
  setTimeout(() => {
    console.log("🚀 DOM já pronto - forçando atualização de botões");
    carregarInfoUsuario();
  }, 100);
}