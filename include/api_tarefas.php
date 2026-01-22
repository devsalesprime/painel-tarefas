<?php
/**
 * Handlers de Endpoints - Tarefas
 * 
 * Gerencia todas as operações relacionadas a tarefas:
 * CRUD, status, atribuições de usuários.
 */

/**
 * Handler: Obter lista de tarefas de um projeto
 */
function handle_obter_tarefas($pdo, $tokenData)
{
    $projeto_id = $_GET['projeto_id'] ?? 0;
    $user_id = $tokenData['user_id'] ?? 0;
    $ordenar_por = $_GET['ordenar_por'] ?? 'data_criacao';

    if (!$projeto_id) {
        erro('ID do projeto é obrigatório');
    }

    // Verificar permissão
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
    $eh_admin_ou_editor = ($usuario['funcao'] === 'admin' || $usuario['funcao'] === 'editor');

    // Verificar se o projeto existe e está ativo
    $stmt_projeto = $pdo->prepare("SELECT id, nome FROM projetos WHERE id = ? AND status = 'ativo'");
    $stmt_projeto->execute([$projeto_id]);
    $projeto = $stmt_projeto->fetch(PDO::FETCH_ASSOC);

    if (!$projeto) {
        erro('Projeto não encontrado ou inativo', 404);
    }

    if (!$eh_admin_ou_editor) {
        // Usuário comum: verifica se tem alguma tarefa atribuída neste projeto
        $stmt_acesso = $pdo->prepare("SELECT COUNT(*) as total FROM tarefa_usuarios tu INNER JOIN tarefas t ON tu.tarefa_id = t.id WHERE tu.usuario_id = ? AND t.projeto_id = ? AND t.status != 'excluida'");
        $stmt_acesso->execute([$user_id, $projeto_id]);
        $resultado = $stmt_acesso->fetch(PDO::FETCH_ASSOC);

        if ($resultado['total'] === 0) {
            erro('Você não tem permissão para acessar este projeto', 403);
        }
    }

    // Definir ordenação
    $ordenacao = 't.data_criacao DESC';
    switch ($ordenar_por) {
        case 'data_conclusao':
            $ordenacao = 't.data_conclusao DESC, t.data_criacao DESC';
            break;
        case 'data_fim':
            $ordenacao = 't.data_fim ASC, t.data_criacao DESC';
            break;
        case 'data_inicio':
            $ordenacao = 't.data_inicio ASC, t.data_criacao DESC';
            break;
        case 'titulo':
            $ordenacao = 't.titulo ASC';
            break;
        case 'status':
            $ordenacao = 't.status ASC, t.data_fim ASC';
            break;
        case 'prioridade':
            $ordenacao = "CASE WHEN t.prioridade = 'urgente_importante' THEN 1 WHEN t.prioridade = 'importante_nao_urgente' THEN 2 WHEN t.prioridade = 'urgente_nao_importante' THEN 3 WHEN t.prioridade = 'nao_urgente_nao_importante' THEN 4 ELSE 5 END ASC, t.data_criacao DESC";
            break;
    }

    // Buscar tarefas ATIVAS
    $sql = "SELECT t.id, t.projeto_id, t.titulo, t.descricao, t.squad, t.data_inicio, t.data_fim, 
                   t.concluida, t.status, t.data_criacao, t.data_conclusao, t.prioridade, t.progresso_manual, t.data_conclusao_real,
                   p.nome as projeto_nome,
                   (SELECT COUNT(*) FROM tarefas_arquivos WHERE tarefa_id = t.id) as arquivos_count,
                   (SELECT COUNT(*) FROM tarefas_comentarios WHERE tarefa_id = t.id) as comentarios_count
            FROM tarefas t 
            INNER JOIN projetos p ON t.projeto_id = p.id 
            WHERE t.projeto_id = ? AND t.status != 'excluida' 
            ORDER BY $ordenacao";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$projeto_id]);
    $tarefas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Adiciona usuários, calcula progresso e obtém etapas
    foreach ($tarefas as &$tarefa) {
        $tarefa['usuarios'] = obter_usuarios_tarefa($pdo, $tarefa['id']);
        $tarefa['progresso'] = calcular_progresso_tarefa($pdo, $tarefa['id'], $tarefa['progresso_manual']);
        $tarefa['etapas'] = obter_etapas_tarefa($pdo, $tarefa['id']);
        $tarefa['checklist_total'] = count($tarefa['etapas']);
        $tarefa['checklist_concluidos'] = array_reduce($tarefa['etapas'], function ($carry, $item) {
            return $carry + ($item['concluida'] == 1 ? 1 : 0);
        }, 0);

        // Atualização automática de status
        if ($tarefa['progresso'] == 100 && $tarefa['concluida'] == 0) {
            $tarefa['concluida'] = 1;
            $tarefa['status'] = 'concluida';
            $update_stmt = $pdo->prepare("UPDATE tarefas SET concluida = 1, status = 'concluida', data_conclusao_real = NOW() WHERE id = ?");
            $update_stmt->execute([$tarefa['id']]);
        }
    }
    unset($tarefa);

    sucesso($tarefas);
}

/**
 * Handler: Obter detalhes de uma tarefa
 */
function handle_obter_tarefa($pdo)
{
    $tarefa_id = filter_var($_GET['tarefa_id'] ?? null, FILTER_VALIDATE_INT);

    if (!$tarefa_id) {
        erro('ID da tarefa é obrigatório');
    }

    $stmt = $pdo->prepare("SELECT t.*, p.nome as projeto_nome, (SELECT COUNT(*) FROM tarefas_arquivos WHERE tarefa_id = t.id) as arquivos_count, (SELECT COUNT(*) FROM tarefas_comentarios WHERE tarefa_id = t.id) as comentarios_count FROM tarefas t INNER JOIN projetos p ON t.projeto_id = p.id WHERE t.id = ? AND t.status != 'excluida'");
    $stmt->execute([$tarefa_id]);
    $tarefa = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$tarefa) {
        erro('Tarefa não encontrada', 404);
    }

    $tarefa['usuarios'] = obter_usuarios_tarefa($pdo, $tarefa_id);
    $tarefa['etapas'] = obter_etapas_tarefa($pdo, $tarefa_id);
    $tarefa['progresso'] = calcular_progresso_tarefa($pdo, $tarefa_id, $tarefa['progresso_manual']);

    sucesso($tarefa);
}

/**
 * Handler: Criar nova tarefa
 */
function handle_criar_tarefa($pdo, $inputData, $tokenData)
{
    $projeto_id = filter_var($inputData["projeto_id"] ?? null, FILTER_VALIDATE_INT);
    $titulo = sanitizar($inputData["titulo"] ?? "");
    $descricao = sanitizar($inputData["descricao"] ?? "");
    $data_inicio = sanitizar($inputData["data_inicio"] ?? "");
    $data_fim = sanitizar($inputData["data_fim"] ?? "");
    $prioridade = sanitizar($inputData["prioridade"] ?? "importante_nao_urgente");
    $progresso_manual = filter_var($inputData['progresso_manual'] ?? 0, FILTER_VALIDATE_INT);
    $usuarios = $inputData["usuarios"] ?? [];

    // Verificar permissão
    $user_id = $tokenData['user_id'] ?? 0;
    $stmt = $pdo->prepare("SELECT funcao, squad FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    $funcoes_permitidas = ['admin', 'editor'];
    if (!$usuario || !in_array($usuario['funcao'], $funcoes_permitidas)) {
        erro('Acesso negado. Apenas administradores e editores podem criar tarefas.', 403);
    }

    if (!$projeto_id) {
        erro("ID do projeto inválido.");
    }
    if (empty($titulo)) {
        erro("Título é obrigatório.");
    }
    if (empty($data_inicio) || empty($data_fim)) {
        erro('Datas de início e término são obrigatórias.');
    }

    // Inserir tarefa
    $stmt = $pdo->prepare("INSERT INTO tarefas (projeto_id, titulo, descricao, prioridade, data_inicio, data_fim, progresso_manual, status, squad, data_criacao) VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente', ?, NOW())");
    $squad_final = $inputData['squad'] ?? $usuario['squad'] ?? null;
    $stmt->execute([$projeto_id, $titulo, $descricao, $prioridade, $data_inicio, $data_fim, $progresso_manual, $squad_final]);
    $nova_tarefa_id = $pdo->lastInsertId();

    // Atribuir o criador à tarefa
    $stmt_vinculo = $pdo->prepare("INSERT INTO tarefa_usuarios (tarefa_id, usuario_id) VALUES (?, ?)");
    $stmt_vinculo->execute([$nova_tarefa_id, $user_id]);

    // Adicionar outros usuários
    if (!empty($usuarios) && is_array($usuarios)) {
        $stmt_add = $pdo->prepare("INSERT IGNORE INTO tarefa_usuarios (tarefa_id, usuario_id) VALUES (?, ?)");
        foreach ($usuarios as $uid) {
            if ($uid != $user_id) {
                $stmt_add->execute([$nova_tarefa_id, $uid]);
            }
        }
    }

    sucesso(['id' => $nova_tarefa_id, 'mensagem' => 'Tarefa criada com sucesso']);
}

/**
 * Handler: Editar/Atualizar tarefa
 */
function handle_editar_tarefa($pdo, $inputData, $tokenData)
{
    $tarefa_id = filter_var($inputData['tarefa_id'] ?? null, FILTER_VALIDATE_INT);
    $titulo = sanitizar($inputData['titulo'] ?? '');
    $descricao = sanitizar($inputData['descricao'] ?? '');
    $data_inicio = sanitizar($inputData['data_inicio'] ?? '');
    $data_fim = sanitizar($inputData['data_fim'] ?? '');
    $prioridade = sanitizar($inputData['prioridade'] ?? '');
    $progresso_manual = isset($inputData['progresso_manual']) && $inputData['progresso_manual'] !== '' ? filter_var($inputData['progresso_manual'], FILTER_VALIDATE_INT) : null;
    $status = sanitizar($inputData['status'] ?? '');
    $usuarios = $inputData["usuarios"] ?? null;

    // Verificar permissão
    $user_id = $tokenData['user_id'] ?? 0;
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    $tem_permissao = false;
    if ($usuario && ($usuario['funcao'] === 'admin' || $usuario['funcao'] === 'editor')) {
        $tem_permissao = true;
    } elseif ($usuario && $usuario['funcao'] === 'usuario') {
        if (!$tarefa_id) {
            erro('ID da tarefa é obrigatório.', 400);
        }
        $stmt_check = $pdo->prepare("SELECT COUNT(*) FROM tarefa_usuarios WHERE tarefa_id = ? AND usuario_id = ?");
        $stmt_check->execute([$tarefa_id, $user_id]);
        if ($stmt_check->fetchColumn() > 0) {
            $tem_permissao = true;
        }
    }

    if (!$tem_permissao) {
        erro('Acesso negado. Você só pode editar tarefas que criou ou onde foi mencionado/atribuído.', 403);
    }

    if (!$tarefa_id) {
        erro('ID da tarefa é obrigatório.');
    }

    // Validação de datas
    if (!empty($data_inicio) && !empty($data_fim)) {
        $ts_inicio = strtotime(str_replace('T', ' ', $data_inicio));
        $ts_fim = strtotime(str_replace('T', ' ', $data_fim));
        if ($ts_inicio === false || $ts_fim === false) {
            erro('Formato de data inválido.');
        }
        if ($ts_fim < $ts_inicio) {
            erro('Data de término não pode ser anterior à data de início.');
        }
    }

    // Monta a query de atualização
    $set_clauses = [];
    $params = [];

    if (!empty($titulo)) {
        $set_clauses[] = 'titulo = ?';
        $params[] = $titulo;
    }
    if (!empty($descricao)) {
        $set_clauses[] = 'descricao = ?';
        $params[] = $descricao;
    }
    if (!empty($data_inicio)) {
        $set_clauses[] = 'data_inicio = ?';
        $params[] = $data_inicio;
    }
    if (!empty($data_fim)) {
        $set_clauses[] = 'data_fim = ?';
        $params[] = $data_fim;
    }
    if (!empty($prioridade)) {
        $set_clauses[] = 'prioridade = ?';
        $params[] = $prioridade;
    }
    if ($progresso_manual !== null) {
        $set_clauses[] = 'progresso_manual = ?';
        $params[] = $progresso_manual;
    }
    if (!empty($status)) {
        $set_clauses[] = 'status = ?';
        $params[] = $status;
    }

    if (empty($set_clauses)) {
        erro('Nenhum dado para atualizar.');
    }

    $set_clauses[] = 'data_atualizacao = NOW()';
    $sql = "UPDATE tarefas SET " . implode(', ', $set_clauses) . " WHERE id = ?";
    $params[] = $tarefa_id;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Atualiza usuários da tarefa
    if ($usuarios !== null) {
        $stmt_delete = $pdo->prepare("DELETE FROM tarefa_usuarios WHERE tarefa_id = ?");
        $stmt_delete->execute([$tarefa_id]);

        if (!empty($usuarios) && is_array($usuarios)) {
            $stmt_usuario = $pdo->prepare("INSERT INTO tarefa_usuarios (tarefa_id, usuario_id) VALUES (?, ?)");
            foreach ($usuarios as $usuario_id) {
                $stmt_usuario->execute([$tarefa_id, $usuario_id]);
            }
        }
    }

    // Verifica conclusão automática
    if ($progresso_manual !== null) {
        if ($progresso_manual == 100) {
            $update_status = $pdo->prepare("UPDATE tarefas SET concluida = 1, status = 'concluida', data_conclusao_real = NOW() WHERE id = ?");
            $update_status->execute([$tarefa_id]);
        } else {
            $update_status = $pdo->prepare("UPDATE tarefas SET concluida = 0, status = 'iniciada', data_conclusao_real = NULL WHERE id = ? AND status = 'concluida'");
            $update_status->execute([$tarefa_id]);
        }
    }

    sucesso(['mensagem' => 'Tarefa atualizada com sucesso']);
}

/**
 * Handler: Pausar tarefa
 */
function handle_pausar_tarefa($pdo, $inputData)
{
    $tarefa_id = filter_var($inputData['tarefa_id'] ?? null, FILTER_VALIDATE_INT);
    if (!$tarefa_id) {
        erro('ID da tarefa inválido.');
    }
    $stmt = $pdo->prepare("UPDATE tarefas SET status = 'pausada', data_atualizacao = NOW() WHERE id = ?");
    $stmt->execute([$tarefa_id]);
    sucesso(['mensagem' => 'Tarefa pausada com sucesso']);
}

/**
 * Handler: Iniciar tarefa
 */
function handle_iniciar_tarefa($pdo, $inputData)
{
    $tarefa_id = filter_var($inputData['tarefa_id'] ?? null, FILTER_VALIDATE_INT);
    if (!$tarefa_id) {
        erro('ID da tarefa inválido.');
    }
    $stmt = $pdo->prepare("UPDATE tarefas SET status = 'iniciada', data_atualizacao = NOW() WHERE id = ?");
    $stmt->execute([$tarefa_id]);
    sucesso(['mensagem' => 'Tarefa iniciada com sucesso']);
}

/**
 * Handler: Concluir tarefa
 */
function handle_concluir_tarefa($pdo, $inputData)
{
    $tarefa_id = filter_var($inputData['tarefa_id'] ?? null, FILTER_VALIDATE_INT);
    $data_conclusao = sanitizar($inputData['data_conclusao'] ?? date('Y-m-d H:i:s'));

    if (!$tarefa_id) {
        erro('ID da tarefa inválido.');
    }

    $stmt = $pdo->prepare("UPDATE tarefas SET concluida = 1, status = 'concluida', data_conclusao_real = ?, data_atualizacao = NOW() WHERE id = ?");
    $stmt->execute([$data_conclusao, $tarefa_id]);
    sucesso(['mensagem' => 'Tarefa marcada como concluída com sucesso']);
}

/**
 * Handler: Reabrir tarefa
 */
function handle_reabrir_tarefa($pdo, $inputData)
{
    $tarefa_id = filter_var($inputData['tarefa_id'] ?? null, FILTER_VALIDATE_INT);
    $novo_status = sanitizar($inputData['novo_status'] ?? 'iniciada');

    if (!$tarefa_id) {
        erro('ID da tarefa inválido.');
    }

    $stmt = $pdo->prepare("UPDATE tarefas SET concluida = 0, status = ?, data_conclusao_real = NULL, data_atualizacao = NOW() WHERE id = ?");
    $stmt->execute([$novo_status, $tarefa_id]);
    sucesso(['mensagem' => 'Tarefa reaberta com sucesso']);
}

/**
 * Handler: Deletar tarefa
 */
function handle_deletar_tarefa($pdo, $inputData, $tokenData)
{
    $tarefa_id = filter_var($inputData['tarefa_id'] ?? null, FILTER_VALIDATE_INT);
    if (!$tarefa_id) {
        erro('ID da tarefa inválido.');
    }

    // Verificar permissão
    $user_id = $tokenData['user_id'] ?? 0;
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario_logado = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario_logado || $usuario_logado['funcao'] !== 'admin') {
        erro('Acesso negado. Apenas administradores podem excluir tarefas.', 403);
    }

    $stmt = $pdo->prepare("UPDATE tarefas SET status = 'excluida', data_atualizacao = NOW() WHERE id = ?");
    $stmt->execute([$tarefa_id]);

    sucesso(['mensagem' => 'Tarefa excluída com sucesso']);
}

/**
 * Handler: Adicionar usuário a uma tarefa
 */
function handle_adicionar_usuario_tarefa($pdo, $inputData, $tokenData)
{
    $tarefa_id = filter_var($inputData['tarefa_id'] ?? null, FILTER_VALIDATE_INT);
    $usuario_id = filter_var($inputData['usuario_id'] ?? null, FILTER_VALIDATE_INT);

    if (!$tarefa_id || !$usuario_id) {
        erro('ID da tarefa e ID do usuário são obrigatórios.');
    }

    // Verificar permissão
    $user_id = $tokenData['user_id'] ?? 0;
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario_logado = $stmt->fetch(PDO::FETCH_ASSOC);

    $tem_permissao = false;
    if ($usuario_logado['funcao'] === 'admin') {
        $tem_permissao = true;
    } elseif ($usuario_logado['funcao'] === 'editor') {
        $stmt_check = $pdo->prepare("SELECT COUNT(*) FROM tarefa_usuarios WHERE tarefa_id = ? AND usuario_id = ?");
        $stmt_check->execute([$tarefa_id, $user_id]);
        if ($stmt_check->fetchColumn() > 0) {
            $tem_permissao = true;
        }
    }

    if (!$tem_permissao) {
        erro('Acesso negado. Você não tem permissão para adicionar usuários a esta tarefa.', 403);
    }

    // Verifica se já está na tarefa
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM tarefa_usuarios WHERE tarefa_id = ? AND usuario_id = ?");
    $stmt->execute([$tarefa_id, $usuario_id]);
    if ($stmt->fetchColumn() > 0) {
        erro('Usuário já está atribuído a esta tarefa.');
    }

    // Adiciona o usuário
    $stmt = $pdo->prepare("INSERT INTO tarefa_usuarios (tarefa_id, usuario_id) VALUES (?, ?)");
    $stmt->execute([$tarefa_id, $usuario_id]);

    sucesso(['mensagem' => 'Usuário adicionado à tarefa com sucesso']);
}

/**
 * Handler: Remover usuário de uma tarefa
 */
function handle_remover_usuario_tarefa($pdo, $inputData, $tokenData)
{
    $tarefa_id = filter_var($inputData['tarefa_id'] ?? null, FILTER_VALIDATE_INT);
    $usuario_id = filter_var($inputData['usuario_id'] ?? null, FILTER_VALIDATE_INT);

    if (!$tarefa_id || !$usuario_id) {
        erro('ID da tarefa e ID do usuário são obrigatórios.');
    }

    // Verificar permissão
    $user_id = $tokenData['user_id'] ?? 0;
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario_logado = $stmt->fetch(PDO::FETCH_ASSOC);

    $tem_permissao = false;
    if ($usuario_logado['funcao'] === 'admin') {
        $tem_permissao = true;
    } elseif ($usuario_logado['funcao'] === 'editor') {
        $stmt_check = $pdo->prepare("SELECT COUNT(*) FROM tarefa_usuarios WHERE tarefa_id = ? AND usuario_id = ?");
        $stmt_check->execute([$tarefa_id, $user_id]);
        if ($stmt_check->fetchColumn() > 0) {
            $tem_permissao = true;
        }
    }

    if (!$tem_permissao) {
        erro('Acesso negado. Você não tem permissão para remover usuários desta tarefa.', 403);
    }

    // Remove o usuário
    $stmt = $pdo->prepare("DELETE FROM tarefa_usuarios WHERE tarefa_id = ? AND usuario_id = ?");
    $stmt->execute([$tarefa_id, $usuario_id]);

    sucesso(['mensagem' => 'Usuário removido da tarefa com sucesso']);
}
