// ========== GERENCIAMENTO DE PERFIL ==========

function abrirEditarPerfil() {
  const userData = taskManager.getCurrentUser();
  if (!userData) {
    taskManager.mostrarErro("Usuário não autenticado");
    return;
  }

  // Preencher formulário com dados atuais
  document.getElementById("editNome").value = userData.nome || "";
  document.getElementById("editEmail").value = userData.email || "";
  document.getElementById("editUsername").value = userData.username || "";
  document.getElementById("editFuncao").value = userData.funcao || "usuario";
  document.getElementById("editBio").value = userData.bio || "";

  // Atualizar contador de bio
  const contadorBio = document.getElementById("contadorBio");
  if (contadorBio) {
    contadorBio.textContent = (userData.bio || "").length;
  }

  // Configurar evento para contador de caracteres
  const editBio = document.getElementById("editBio");
  if (editBio) {
    editBio.addEventListener("input", function () {
      const contador = document.getElementById("contadorBio");
      if (contador) {
        contador.textContent = this.value.length;
        if (this.value.length > 255) {
          contador.classList.add("excedido");
        } else {
          contador.classList.remove("excedido");
        }
      }
    });
  }

  // Abrir modal
  const modal = new bootstrap.Modal(
    document.getElementById("modalEditarPerfil")
  );
  modal.show();
}

async function salvarPerfil() {
  const userData = taskManager.getCurrentUser();
  if (!userData) {
    taskManager.mostrarErro("Usuário não autenticado");
    return;
  }

  const nome = document.getElementById("editNome").value.trim();
  const email = document.getElementById("editEmail").value.trim();
  const username = document.getElementById("editUsername").value.trim();
  const bio = document.getElementById("editBio").value.trim();

  // validações aqui...

  try {
    const dados = await taskManager.fetch("api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "editar_perfil",
        usuario_id: userData.id,
        nome: nome,
        email: email,
        username: username,
        bio: bio,
      }),
    });

    if (dados && dados.usuario) {
      // Use o usuário retornado pelo servidor (fonte de verdade)
      const usuarioAtualizado = dados.usuario;
      localStorage.setItem("user_data", JSON.stringify(usuarioAtualizado));

      // Atualiza UI imediata
      carregarInfoUsuario();

      // Recarrega dados que podem mostrar o username (autocomplete, tarefas, etc.)
      await carregarProjetos();
      await renderizarTarefas();

      // Fecha modal
      const modal = bootstrap.Modal.getInstance(document.getElementById("modalEditarPerfil"));
      if (modal) modal.hide();

      taskManager.mostrarSucesso("Perfil atualizado com sucesso!");
    }
  } catch (error) {
    console.error("Erro ao salvar perfil:", error);
    taskManager.mostrarErro("Erro ao salvar perfil: " + (error.message || error));
  }
}

// ========== ALTERAÇÃO DE SENHA ==========

function abrirAlterarSenha() {
  // Limpar formulário
  document.getElementById("formAlterarSenha").reset();
  document.getElementById("strengthIndicator").style.display = "none";
  document.getElementById("senhaMatchText").textContent = "";

  // Configurar eventos
  const novaSenha = document.getElementById("novaSenha");
  const confirmarNovaSenha = document.getElementById("confirmarNovaSenha");

  if (novaSenha) {
    novaSenha.addEventListener("input", validarForcaSenha);
  }

  if (confirmarNovaSenha) {
    confirmarNovaSenha.addEventListener("input", validarConfirmacaoSenha);
  }

  // Abrir modal
  const modal = new bootstrap.Modal(
    document.getElementById("modalAlterarSenha")
  );
  modal.show();
}

function validarForcaSenha() {
  const senha = document.getElementById("novaSenha").value;
  const indicator = document.getElementById("strengthIndicator");

  if (!senha) {
    indicator.style.display = "none";
    return;
  }

  const strength = calcularForcaSenha(senha);
  indicator.style.display = "block";
  indicator.className = `password-strength ${strength.level}`;
  indicator.textContent = strength.message;
}

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

function validarConfirmacaoSenha() {
  const senha = document.getElementById("novaSenha").value;
  const confirmacao = document.getElementById("confirmarNovaSenha").value;
  const matchText = document.getElementById("senhaMatchText");

  if (!confirmacao) {
    matchText.textContent = "";
    return;
  }

  if (senha === confirmacao) {
    matchText.textContent = "Senhas coincidem";
    matchText.style.color = "#28a745";
  } else {
    matchText.textContent = "Senhas não coincidem";
    matchText.style.color = "#dc3545";
  }
}

async function salvarNovaSenha() {
  const userData = taskManager.getCurrentUser();
  if (!userData) {
    taskManager.mostrarErro("Usuário não autenticado");
    return;
  }

  const senhaAtual = document.getElementById("senhaAtual").value;
  const novaSenha = document.getElementById("novaSenha").value;
  const confirmarNovaSenha =
    document.getElementById("confirmarNovaSenha").value;

  // Validações
  if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
    taskManager.mostrarErro("Preencha todos os campos");
    return;
  }

  if (novaSenha.length < 6) {
    taskManager.mostrarErro("A nova senha deve ter pelo menos 6 caracteres");
    return;
  }

  if (novaSenha !== confirmarNovaSenha) {
    taskManager.mostrarErro("As senhas não coincidem");
    return;
  }

  try {
    const dados = await taskManager.fetch("api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "alterar_senha",
        usuario_id: userData.id,
        senha_atual: senhaAtual,
        nova_senha: novaSenha,
      }),
    });

    if (dados) {
      // Fechar modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("modalAlterarSenha")
      );
      if (modal) modal.hide();

      taskManager.mostrarSucesso("Senha alterada com sucesso!");
    }
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    // O erro específico virá da API
  }
}

function alterarSenha() {
  abrirAlterarSenha();
}

function abrirPerfil() {
  abrirEditarPerfil();
}