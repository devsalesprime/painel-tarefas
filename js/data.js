// ========== CARREGAMENTO DE DADOS ==========

// data.js - Corrigir TODAS as chamadas

async function carregarProjetos() {
  console.log("🔄 Carregando projetos...");

  try {
    // ✅ CORREÇÃO: Chamada simples
    const dados = await taskManager.fetch("obter_projetos");
    console.log("📦 Projetos recebidos:", dados);

    if (!dados || dados.length === 0) {
      console.log("⚠️ Nenhum projeto encontrado");
      return;
    }

    const select = document.getElementById("projeto");
    if (select) {
      select.innerHTML =
        '<option value="">Selecione um projeto...</option><option value="novo">➕ Criar novo projeto</option>';

      dados.forEach((p) => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.nome;
        select.appendChild(option);
      });

      console.log(`✅ ${dados.length} projetos carregados no select`);
    } else {
      console.log("❌ Elemento #projeto não encontrado");
    }
  } catch (error) {
    console.error("💥 Erro ao carregar projetos:", error);
    taskManager.mostrarErro("Erro ao carregar projetos: " + error.message);
  }
}

async function carregarUsuariosTarefa(tarefaId) {
  const div = document.getElementById("usuariosTarefa");
  if (!div) return;

  try {
    // ✅ CORREÇÃO: Chamada com parâmetros
    const tarefa = await taskManager.fetch(`obter_tarefa&tarefa_id=${encodeURIComponent(tarefaId)}`);
    
    const usuariosTarefa = tarefa && Array.isArray(tarefa.usuarios) ? tarefa.usuarios : [];

    if (usuariosTarefa.length === 0) {
      div.innerHTML = '<span class="text-muted">Nenhum usuário atribuído</span>';
      return;
    }

    div.innerHTML = `
      <div class="d-flex flex-wrap gap-2">
        ${usuariosTarefa
          .map((usuario) => {
            const handle = usuario.username ? `@${usuario.username}` : usuario.nome;
            return `
              <div class="usuario-atribuido" data-user-id="${usuario.id}">
                <span class="badge bg-primary">
                  <i class="fas fa-user me-1"></i>
                  ${handle}
                  <button type="button" class="btn-close btn-close-white btn-sm ms-2" 
                    onclick="removerUsuarioTarefaEditando(${usuario.id})"
                    style="padding: 0; font-size: 10px;" 
                    title="Remover usuário"></button>
                </span>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  } catch (error) {
    console.error("Erro ao carregar usuários da tarefa:", error);
    div.innerHTML = '<span class="text-muted">Erro ao carregar usuários</span>';
  }
}

async function carregarComentariosTarefa(tarefaId) {
  const lista = document.getElementById("listaComentarios");
  if (!lista) return;

  try {
    // ✅ CORREÇÃO: Chamada com parâmetros
    const dados = await taskManager.fetch(`obter_comentarios&tarefa_id=${encodeURIComponent(tarefaId)}`);

    if (!dados || dados.length === 0) {
      lista.innerHTML = `
        <div class="alert alert-info text-center py-2">
          <small><i class="fas fa-comment-slash"></i> Nenhum comentário ainda</small>
        </div>
      `;
      return;
    }

    lista.innerHTML = dados
      .map((comentario) => {
        const dataFormatada = formatarDataHora(comentario.data_criacao);
        const currentUser = taskManager.getCurrentUser();
        const podeDeletar = currentUser && 
          (currentUser.id === comentario.usuario_id || currentUser.funcao === 'admin');

        return `
          <div class="comentario-item p-3 border rounded mb-3">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div class="comentario-usuario">
                <strong><i class="fas fa-user-circle me-1"></i>${comentario.usuario_nome || 'Usuário'}</strong>
                <small class="text-muted ms-2">${dataFormatada}</small>
              </div>
              ${podeDeletar ? `
                <button class="btn btn-sm btn-outline-danger" 
                        onclick="deletarComentario(${comentario.id})"
                        title="Deletar comentário">
                  <i class="fas fa-trash"></i>
                </button>
              ` : ''}
            </div>
            <div class="comentario-texto">
              ${comentario.comentario.replace(/\n/g, '<br>')}
            </div>
          </div>
        `;
      })
      .join('');
  } catch (error) {
    console.error("Erro ao carregar comentários:", error);
    lista.innerHTML = `
      <div class="alert alert-warning text-center py-2">
        <small><i class="fas fa-exclamation-triangle"></i> Erro ao carregar comentários</small>
      </div>
    `;
  }
}

async function carregarArquivosTarefa(tarefaId) {
  const lista = document.getElementById("listaArquivos");
  if (!lista) return;

  try {
    // ✅ CORREÇÃO: Chamada com parâmetros
    const dados = await taskManager.fetch(`obter_arquivos&tarefa_id=${encodeURIComponent(tarefaId)}`);

    if (!dados || dados.length === 0) {
      lista.innerHTML = `
        <div class="alert alert-info text-center py-2">
          <small><i class="fas fa-file-export"></i> Nenhum arquivo anexado</small>
        </div>
      `;
      return;
    }

    lista.innerHTML = dados
      .map((arquivo) => {
        const nomeOriginal = arquivo.nome_original || arquivo.nome || "Arquivo";
        const tamanhoFormatado = arquivo.tamanho_formatado || arquivo.tamanho || "";
        
        return `
          <div class="arquivo-item d-flex justify-content-between align-items-center p-2 border rounded mb-2">
            <div class="arquivo-info">
              <i class="fas fa-file ${getFileIcon(arquivo.tipo || '')} me-2"></i>
              <span class="arquivo-nome">${nomeOriginal}</span>
              <small class="text-muted ms-2">(${tamanhoFormatado})</small>
              <br>
              <small class="text-muted">Enviado por: ${arquivo.usuario_nome || '—'}</small>
            </div>
            <div class="arquivo-acoes">
              <button class="btn btn-sm btn-outline-primary me-1" 
                      onclick="baixarArquivoApi(${arquivo.id}, ${JSON.stringify(nomeOriginal)})">
                <i class="fas fa-download"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" 
                      onclick="deletarArquivo(${arquivo.id})">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `;
      })
      .join('');
  } catch (error) {
    console.error("Erro ao carregar arquivos:", error);
    lista.innerHTML = `
      <div class="alert alert-warning text-center py-2">
        <small><i class="fas fa-exclamation-triangle"></i> Erro ao carregar arquivos</small>
      </div>
    `;
  }
}

async function carregarComentariosTarefa(tarefaId) {
  const lista = document.getElementById("listaComentarios");
  if (!lista) return;

  try {
    const dados = await taskManager.fetch(`api.php?action=obter_comentarios&tarefa_id=${encodeURIComponent(tarefaId)}`);

    if (!dados || dados.length === 0) {
      lista.innerHTML = `
        <div class="alert alert-info text-center py-2">
          <small><i class="fas fa-comment-slash"></i> Nenhum comentário ainda</small>
        </div>
      `;
      return;
    }

    lista.innerHTML = dados
      .map((comentario) => {
        const dataFormatada = formatarDataHora(comentario.data_criacao);
        const currentUser = taskManager.getCurrentUser();
        const podeDeletar = currentUser && 
          (currentUser.id === comentario.usuario_id || currentUser.funcao === 'admin');

        return `
          <div class="comentario-item p-3 border rounded mb-3">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div class="comentario-usuario">
                <strong><i class="fas fa-user-circle me-1"></i>${comentario.usuario_nome || 'Usuário'}</strong>
                <small class="text-muted ms-2">${dataFormatada}</small>
              </div>
              ${podeDeletar ? `
                <button class="btn btn-sm btn-outline-danger" 
                        onclick="deletarComentario(${comentario.id})"
                        title="Deletar comentário">
                  <i class="fas fa-trash"></i>
                </button>
              ` : ''}
            </div>
            <div class="comentario-texto">
              ${comentario.comentario.replace(/\n/g, '<br>')}
            </div>
          </div>
        `;
      })
      .join('');
  } catch (error) {
    console.error("Erro ao carregar comentários:", error);
    lista.innerHTML = `
      <div class="alert alert-warning text-center py-2">
        <small><i class="fas fa-exclamation-triangle"></i> Erro ao carregar comentários</small>
      </div>
    `;
  }
}

async function carregarArquivosTarefa(tarefaId) {
  const lista = document.getElementById("listaArquivos");
  if (!lista) return;

  try {
    const dados = await taskManager.fetch(`api.php?action=obter_arquivos&tarefa_id=${encodeURIComponent(tarefaId)}`);

    if (!dados || dados.length === 0) {
      lista.innerHTML = `
        <div class="alert alert-info text-center py-2">
          <small><i class="fas fa-file-export"></i> Nenhum arquivo anexado</small>
        </div>
      `;
      return;
    }

    lista.innerHTML = dados
      .map((arquivo) => {
        const nomeOriginal = arquivo.nome_original || arquivo.nome || "Arquivo";
        const tamanhoFormatado = arquivo.tamanho_formatado || arquivo.tamanho || "";
        
        return `
          <div class="arquivo-item d-flex justify-content-between align-items-center p-2 border rounded mb-2">
            <div class="arquivo-info">
              <i class="fas fa-file ${getFileIcon(arquivo.tipo || '')} me-2"></i>
              <span class="arquivo-nome">${nomeOriginal}</span>
              <small class="text-muted ms-2">(${tamanhoFormatado})</small>
              <br>
              <small class="text-muted">Enviado por: ${arquivo.usuario_nome || '—'}</small>
            </div>
            <div class="arquivo-acoes">
              <button class="btn btn-sm btn-outline-primary me-1" 
                      onclick="baixarArquivoApi(${arquivo.id}, ${JSON.stringify(nomeOriginal)})">
                <i class="fas fa-download"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" 
                      onclick="deletarArquivo(${arquivo.id})">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `;
      })
      .join('');
  } catch (error) {
    console.error("Erro ao carregar arquivos:", error);
    lista.innerHTML = `
      <div class="alert alert-warning text-center py-2">
        <small><i class="fas fa-exclamation-triangle"></i> Erro ao carregar arquivos</small>
      </div>
    `;
  }
}

async function carregarEtapasEditar(etapas) {
  const container = document.getElementById("listaEtapasEditar");
  if (!container) return;

  if (!etapas || etapas.length === 0) {
    container.innerHTML = `
            <div class="alert alert-info text-center py-2">
                <small><i class="fas fa-info-circle"></i> Nenhuma etapa cadastrada</small>
            </div>
        `;
    return;
  }

  container.innerHTML = etapas
    .map(
      (etapa) => `
        <div class="etapa-item d-flex align-items-center gap-2 p-2 border rounded mb-2">
            <input class="form-check-input" type="checkbox" ${
              etapa.concluida == 1 ? "checked" : ""
            } 
                   onchange="toggleEtapaModalEditar(${etapa.id}, this.checked)" 
                   id="etapa-editar-${etapa.id}">
            <label class="form-check-label flex-grow-1 ${
              etapa.concluida == 1
                ? "text-decoration-line-through text-muted"
                : ""
            }" 
                   for="etapa-editar-${etapa.id}">
                ${etapa.descricao}
            </label>
            <button class="btn btn-sm btn-outline-danger" onclick="deletarEtapaModalEditar(${
              etapa.id
            })">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `
    )
    .join("");
}