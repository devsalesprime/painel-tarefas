// senha.js
function abrirAlterarSenha() {
    console.log("🔍 Tentando abrir modal de alteração de senha...");
    
    // Usar setTimeout para garantir que o DOM esteja pronto
    setTimeout(() => {
        // Limpar formulário
        const form = document.getElementById("formAlterarSenha");
        if (form) form.reset();
        
        const strengthIndicator = document.getElementById("strengthIndicator");
        const senhaMatchText = document.getElementById("senhaMatchText");
        
        if (strengthIndicator) strengthIndicator.style.display = "none";
        if (senhaMatchText) senhaMatchText.textContent = "";

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
        const modalElement = document.getElementById("modalAlterarSenha");
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            console.log("✅ Modal de senha aberto com sucesso");
        } else {
            console.error("❌ Modal #modalAlterarSenha não encontrado");
            taskManager.mostrarErro("Erro ao abrir alteração de senha");
        }
    }, 100);
}

function validarForcaSenha() {
    const senhaInput = document.getElementById("novaSenha");
    const indicator = document.getElementById("strengthIndicator");
    
    if (!senhaInput || !indicator) return;
    
    const senha = senhaInput.value;

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
    const senha = document.getElementById("novaSenha")?.value;
    const confirmacao = document.getElementById("confirmarNovaSenha")?.value;
    const matchText = document.getElementById("senhaMatchText");
    
    if (!matchText) return;

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

    const senhaAtual = document.getElementById("senhaAtual")?.value;
    const novaSenha = document.getElementById("novaSenha")?.value;
    const confirmarNovaSenha = document.getElementById("confirmarNovaSenha")?.value;

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
        taskManager.mostrarErro("Erro ao alterar senha: " + error.message);
    }
}

function togglePasswordModal(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const button = input.parentNode.querySelector(".password-toggle");
    if (!button) return;
    
    const icon = button.querySelector("i");
    if (!icon) return;

    if (input.type === "password") {
        input.type = "text";
        icon.className = "fas fa-eye-slash";
    } else {
        input.type = "password";
        icon.className = "fas fa-eye";
    }
}