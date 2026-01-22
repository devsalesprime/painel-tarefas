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
        option.textContent = decodeHtmlEntities(p.nome);
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

async function carregarUsuariosTarefa(tarefaId, podeEditar = false) {
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
                  ${podeEditar ? `
                  <button type="button" class="btn-close btn-close-white btn-sm ms-2" 
                    onclick="removerUsuarioTarefaEditando(${usuario.id})"
                    style="padding: 0; font-size: 10px;" 
                    title="Remover usuário"></button>
                  ` : ''}
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

async function carregarComentariosTarefa(tarefaId, podeEditar = false) {
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
        // Pode deletar se: (Dono E permissão na tarefa) OU Admin
        const ehDono = currentUser && currentUser.id === comentario.usuario_id;
        const ehAdmin = currentUser && currentUser.funcao === 'admin';
        const podeDeletar = ehAdmin || (ehDono && podeEditar);

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

async function carregarArquivosTarefa(tarefaId, podeEditar = false) {
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
                      onclick='baixarArquivoApi(${arquivo.id}, ${JSON.stringify(nomeOriginal).replace(/'/g, "&#39;")})'>
                <i class="fas fa-download"></i>
              </button>
              ${podeEditar ? `
              <button class="btn btn-sm btn-outline-danger" 
                      onclick="deletarArquivo(${arquivo.id})">
                <i class="fas fa-trash"></i>
              </button>
              ` : ''}
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

// ========== FUNÇÕES DE LINKS ==========

/**
 * Carrega e exibe os links de uma tarefa
 */
async function carregarLinks(tarefaId) {
  try {
    const links = await taskManager.fetch(`obter_links&tarefa_id=${encodeURIComponent(tarefaId)}`);
    
    const listaLinks = document.getElementById('listaLinks');
    
    if (!listaLinks) return;
    
    if (links.length === 0) {
      listaLinks.innerHTML = '<p class="text-muted small mb-0">Nenhum link adicionado</p>';
      return;
    }
    
    listaLinks.innerHTML = links.map(link => `
      <div class="link-item d-flex justify-content-between align-items-start mb-2 p-2 border rounded bg-light">
        <div class="flex-grow-1">
          <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" 
             class="text-decoration-none d-block">
            <i class="fas fa-external-link-alt me-1 text-primary"></i>
            <strong>${escapeHtml(link.titulo)}</strong>
          </a>
          <small class="text-muted d-block text-truncate" style="max-width: 300px;" 
                 title="${escapeHtml(link.url)}">${escapeHtml(link.url)}</small>
          <small class="text-muted">
            <i class="fas fa-user"></i> ${escapeHtml(link.usuario_nome || 'Desconhecido')} • 
            <i class="fas fa-clock"></i> ${formatarDataHora(link.data_criacao)}
          </small>
        </div>
        <button class="btn btn-sm btn-danger ms-2" onclick="deletarLink(${link.id})" 
                title="Remover link">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `).join('');
  } catch (error) {
    console.error('Erro ao carregar links:', error);
    const listaLinks = document.getElementById('listaLinks');
    if (listaLinks) {
      listaLinks.innerHTML = '<p class="text-danger small">Erro ao carregar links</p>';
    }
  }
}

/**
 * Adiciona um novo link à tarefa
 */
async function adicionarLink() {
  const tarefaId = taskManager.tarefaEditandoId;
  const titulo = document.getElementById('linkTitulo').value.trim();
  const url = document.getElementById('linkUrl').value.trim();
  
  if (!titulo || !url) {
    taskManager.mostrarErro('Título e URL são obrigatórios!');
    return;
  }
  
  // Validação básica de URL
  try {
    new URL(url);
  } catch (e) {
    taskManager.mostrarErro('URL inválida! Use o formato: https://exemplo.com');
    return;
  }
  
  try {
    await taskManager.fetch('api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'adicionar_link',
        tarefa_id: tarefaId,
        titulo: titulo,
        url: url
      })
    });
    
    // Limpar campos
    document.getElementById('linkTitulo').value = '';
    document.getElementById('linkUrl').value = '';
    
    // Recarregar lista
    await carregarLinks(tarefaId);
    taskManager.mostrarSucesso('Link adicionado com sucesso!');
  } catch (error) {
    taskManager.mostrarErro('Erro ao adicionar link: ' + error.message);
  }
}

/**
 * Deleta um link da tarefa
 */
async function deletarLink(linkId) {
  if (!confirm('Deseja realmente remover este link?')) return;
  
  try {
    await taskManager.fetch('api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deletar_link',
        link_id: linkId
      })
    });
    
    await carregarLinks(taskManager.tarefaEditandoId);
    taskManager.mostrarSucesso('Link removido com sucesso!');
  } catch (error) {
    taskManager.mostrarErro('Erro ao remover link: ' + error.message);
  }
}