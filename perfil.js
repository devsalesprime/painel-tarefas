// perfil.js
function abrirEditarPerfil() {
    console.log("🔍 Tentando abrir modal de edição de perfil...");
    
    const userData = taskManager.getCurrentUser();
    if (!userData) {
        taskManager.mostrarErro("Usuário não autenticado");
        return;
    }

    // Usar setTimeout para garantir que o DOM esteja pronto
    setTimeout(() => {
        // Preencher formulário com dados atuais
        const nomeInput = document.getElementById("editNome");
        const emailInput = document.getElementById("editEmail");
        const usernameInput = document.getElementById("editUsername");
        const funcaoInput = document.getElementById("editFuncao");
        const bioInput = document.getElementById("editBio");

        console.log("📝 Dados do usuário:", userData);
        console.log("🔍 Elementos encontrados:", {
            nomeInput: !!nomeInput,
            emailInput: !!emailInput,
            usernameInput: !!usernameInput,
            funcaoInput: !!funcaoInput,
            bioInput: !!bioInput
        });

        if (nomeInput) nomeInput.value = userData.nome || "";
        if (emailInput) emailInput.value = userData.email || "";
        if (usernameInput) usernameInput.value = userData.username || "";
        if (funcaoInput) funcaoInput.value = userData.funcao || "usuario";
        if (bioInput) bioInput.value = userData.bio || "";

        // Atualizar contador de bio
        const contadorBio = document.getElementById("contadorBio");
        if (contadorBio) {
            contadorBio.textContent = (userData.bio || "").length;
            console.log("📊 Contador de bio atualizado:", contadorBio.textContent);
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
        const modalElement = document.getElementById("modalEditarPerfil");
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            console.log("✅ Modal de perfil aberto com sucesso");
        } else {
            console.error("❌ Modal #modalEditarPerfil não encontrado");
            taskManager.mostrarErro("Erro ao abrir edição de perfil");
        }
    }, 100);
}

async function salvarPerfil() {
    try {
        const userData = taskManager.getCurrentUser();
        if (!userData) {
            taskManager.mostrarErro("Usuário não autenticado");
            return;
        }

        const nome = document.getElementById("editNome")?.value.trim();
        const email = document.getElementById("editEmail")?.value.trim();
        const username = document.getElementById("editUsername")?.value.trim();
        const bio = document.getElementById("editBio")?.value.trim();

        console.log("💾 Salvando perfil:", { nome, email, username, bio });

        // Validações básicas
        if (!nome) {
            taskManager.mostrarErro("Nome é obrigatório");
            return;
        }

        if (!email) {
            taskManager.mostrarErro("Email é obrigatório");
            return;
        }

        if (!validarEmail(email)) {
            taskManager.mostrarErro("Email inválido");
            return;
        }

        if (!username) {
            taskManager.mostrarErro("Username é obrigatório");
            return;
        }

        if (bio && bio.length > 255) {
            taskManager.mostrarErro("A biografia deve ter no máximo 255 caracteres");
            return;
        }

        const dados = await taskManager.fetch("api.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "editar_perfil",
                usuario_id: userData.id,
                nome: nome,
                email: email,
                username: username,
                bio: bio
            }),
        });

        if (dados && dados.usuario) {
            // Atualizar dados do usuário no localStorage
            const usuarioAtualizado = dados.usuario;
            localStorage.setItem("user_data", JSON.stringify(usuarioAtualizado));

            // Atualizar UI
            carregarInfoUsuario();

            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById("modalEditarPerfil"));
            if (modal) modal.hide();

            taskManager.mostrarSucesso("Perfil atualizado com sucesso!");
        }
    } catch (error) {
        console.error("Erro ao salvar perfil:", error);
        taskManager.mostrarErro("Erro ao salvar perfil: " + (error.message || error));
    }
}

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}