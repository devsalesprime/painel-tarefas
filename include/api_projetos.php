<?php
/**
 * Handlers de Endpoints - Projetos
 * 
 * Gerencia todas as operações relacionadas a projetos:
 * CRUD, conclusão, arquivamento e exclusão definitiva.
 */

/**
 * Handler: Obter lista de projetos
 */
function handle_obter_projetos($pdo, $tokenData)
{
    $user_id = $tokenData['user_id'] ?? 0;

    // Verifica se usuário é admin
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        erro('Usuário não encontrado', 404);
    }

    $eh_admin_ou_editor = ($usuario['funcao'] === 'admin' || $usuario['funcao'] === 'editor');
    $sql = "SELECT id, nome, descricao, status, data_inicio, data_fim, data_criacao, data_conclusao FROM projetos WHERE status != 'excluido' ";
    $params = [];

    if (!$eh_admin_ou_editor) {
        $sql .= " AND id IN (SELECT DISTINCT t.projeto_id FROM tarefas t INNER JOIN tarefa_usuarios tu ON t.id = tu.tarefa_id WHERE tu.usuario_id = ? AND t.status != 'excluida') ";
        $params[] = $user_id;
    } else {
        $sql .= " AND status = 'ativo' ";
    }

    $sql .= " ORDER BY nome ASC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $projetos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sucesso($projetos);
}

/**
 * Handler: Obter detalhes de um projeto
 */
function handle_obter_projeto($pdo)
{
    $projeto_id = filter_var($_GET['projeto_id'] ?? null, FILTER_VALIDATE_INT);

    if (!$projeto_id) {
        erro('ID do projeto é obrigatório');
    }

    $projeto = obter_projeto($pdo, $projeto_id);

    if (!$projeto || $projeto['status'] === 'excluido') {
        erro('Projeto não encontrado ou excluído', 404);
    }

    sucesso($projeto);
}

/**
 * Handler: Criar novo projeto
 */
function handle_criar_projeto($pdo, $inputData, $tokenData)
{
    $nome = sanitizar($inputData['nome'] ?? '');
    $descricao = sanitizar($inputData['descricao'] ?? '');
    $data_inicio = sanitizar($inputData['data_inicio'] ?? '');
    $data_fim = sanitizar($inputData['data_fim'] ?? '');

    if (empty($nome) || empty($data_inicio) || empty($data_fim)) {
        erro('Nome, data de início e data de fim são obrigatórios.');
    }

    // Validação de datas
    $ts_inicio = strtotime(str_replace('T', ' ', $data_inicio));
    $ts_fim = strtotime(str_replace('T', ' ', $data_fim));
    if ($ts_inicio === false || $ts_fim === false) {
        erro('Formato de data inválido.');
    }
    if ($ts_fim < $ts_inicio) {
        erro('Data de término não pode ser anterior à data de início.');
    }

    // Verificar se é admin OU editor
    $user_id = $tokenData['user_id'] ?? 0;
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    $funcoes_permitidas = ['admin', 'editor'];
    if (!$usuario || !in_array($usuario['funcao'], $funcoes_permitidas)) {
        erro('Acesso negado. Apenas administradores e editores podem criar projetos.', 403);
    }

    $stmt = $pdo->prepare("INSERT INTO projetos (nome, descricao, data_inicio, data_fim, status) VALUES (?, ?, ?, ?, 'ativo')");
    $stmt->execute([$nome, $descricao, $data_inicio, $data_fim]);
    $novo_id = $pdo->lastInsertId();

    sucesso(['id' => $novo_id, 'mensagem' => 'Projeto criado com sucesso']);
}

/**
 * Handler: Criar projeto rápido
 */
function handle_criar_projeto_rapido($pdo, $inputData, $tokenData)
{
    $nome = sanitizar($inputData['nome'] ?? '');
    $data_inicio = sanitizar($inputData['data_inicio'] ?? '');
    $data_fim = sanitizar($inputData['data_fim'] ?? '');

    $user_id = $tokenData['user_id'] ?? 0;
    if (!$user_id) {
        erro('Usuário não autenticado', 401);
    }

    // Verificar se é admin OU editor
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    $funcoes_permitidas = ['admin', 'editor'];
    if (!$usuario || !in_array($usuario['funcao'], $funcoes_permitidas)) {
        erro('Acesso negado. Apenas administradores e editores podem criar projetos.', 403);
    }

    if (empty($nome)) {
        erro('Nome do projeto é obrigatório.', 400);
    }

    // Verificar se já existe projeto com mesmo nome
    $stmt = $pdo->prepare("SELECT id FROM projetos WHERE nome = ? AND status != 'excluido' LIMIT 1");
    $stmt->execute([$nome]);
    $existente = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existente) {
        sucesso(['existente' => true, 'id' => (int) $existente['id'], 'mensagem' => 'Projeto já existe']);
    }

    // Validar datas se fornecidas
    if (!empty($data_inicio)) {
        $ts_inicio = strtotime(str_replace('T', ' ', $data_inicio));
        if ($ts_inicio === false) {
            erro('Formato de data_inicio inválido.', 400);
        }
    }
    if (!empty($data_fim)) {
        $ts_fim = strtotime(str_replace('T', ' ', $data_fim));
        if ($ts_fim === false) {
            erro('Formato de data_fim inválido.', 400);
        }
    }

    // Inserir novo projeto
    $stmt = $pdo->prepare("INSERT INTO projetos (nome, descricao, data_inicio, data_fim, status, data_criacao) VALUES (?, ?, ?, ?, 'ativo', NOW())");
    $descricao = '';
    $stmt->execute([$nome, $descricao, $data_inicio ?: null, $data_fim ?: null]);
    $novo_id = $pdo->lastInsertId();

    sucesso(['existente' => false, 'id' => (int) $novo_id, 'mensagem' => 'Projeto criado com sucesso']);
}

/**
 * Handler: Atualizar projeto
 */
function handle_atualizar_projeto($pdo, $inputData, $tokenData)
{
    $projeto_id = filter_var($inputData['projeto_id'] ?? null, FILTER_VALIDATE_INT);
    $nome = sanitizar($inputData['nome'] ?? '');
    $descricao = sanitizar($inputData['descricao'] ?? '');
    $data_inicio = sanitizar($inputData['data_inicio'] ?? '');
    $data_fim = sanitizar($inputData['data_fim'] ?? '');
    $status = sanitizar($inputData['status'] ?? 'ativo');

    if (!$projeto_id) {
        erro('ID do projeto é obrigatório.');
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

    // Verificar permissão
    $user_id = $tokenData['user_id'] ?? 0;
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    $funcoes_permitidas = ['admin', 'editor'];
    if (!$usuario || !in_array($usuario['funcao'], $funcoes_permitidas)) {
        erro('Acesso negado. Apenas administradores e editores podem atualizar projetos.', 403);
    }

    $stmt = $pdo->prepare("UPDATE projetos SET nome = ?, descricao = ?, data_inicio = ?, data_fim = ?, status = ? WHERE id = ?");
    $stmt->execute([$nome, $descricao, $data_inicio, $data_fim, $status, $projeto_id]);

    sucesso(['mensagem' => 'Projeto atualizado com sucesso']);
}

/**
 * Handler: Deletar projeto (soft delete)
 */
function handle_deletar_projeto($pdo, $inputData, $tokenData)
{
    $projeto_id = filter_var($inputData['projeto_id'] ?? null, FILTER_VALIDATE_INT);

    if (!$projeto_id) {
        erro('ID do projeto é obrigatório.');
    }

    // Verificar permissão
    $user_id = $tokenData['user_id'] ?? 0;
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario || $usuario['funcao'] !== 'admin') {
        erro('Acesso negado. Apenas administradores podem excluir projetos.', 403);
    }

    // Soft delete
    $stmt = $pdo->prepare("UPDATE projetos SET status = 'excluido' WHERE id = ?");
    $stmt->execute([$projeto_id]);

    // Marcar tarefas associadas como excluídas
    $stmt = $pdo->prepare("UPDATE tarefas SET status = 'excluida' WHERE projeto_id = ?");
    $stmt->execute([$projeto_id]);

    sucesso(['mensagem' => 'Projeto e tarefas associadas excluídos com sucesso']);
}

/**
 * Handler: Concluir projeto
 */
function handle_concluir_projeto($pdo, $inputData, $tokenData)
{
    $projeto_id = filter_var($inputData['projeto_id'] ?? null, FILTER_VALIDATE_INT);

    if (!$projeto_id) {
        erro('ID do projeto inválido.');
    }

    // Verificar permissão
    $user_id = $tokenData['user_id'] ?? 0;
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario || $usuario['funcao'] !== 'admin') {
        erro('Acesso negado. Apenas administradores podem concluir projetos.', 403);
    }

    // Marcar projeto como concluído
    $stmt = $pdo->prepare("UPDATE projetos SET status = 'concluido', data_conclusao = NOW() WHERE id = ?");
    $stmt->execute([$projeto_id]);

    // Marcar todas as tarefas pendentes como concluídas
    $stmt = $pdo->prepare("UPDATE tarefas SET status = 'concluida', concluida = 1, data_conclusao_real = NOW() WHERE projeto_id = ? AND status != 'concluida'");
    $stmt->execute([$projeto_id]);

    sucesso(['mensagem' => 'Projeto concluído com sucesso']);
}

/**
 * Handler: Reabrir projeto
 */
function handle_reabrir_projeto($pdo, $inputData, $tokenData)
{
    $projeto_id = filter_var($inputData['projeto_id'] ?? null, FILTER_VALIDATE_INT);

    if (!$projeto_id) {
        erro('ID do projeto inválido.');
    }

    // Verificar permissão
    $user_id = $tokenData['user_id'] ?? 0;
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario || $usuario['funcao'] !== 'admin') {
        erro('Acesso negado. Apenas administradores podem reabrir projetos.', 403);
    }

    // Marcar projeto como ativo novamente
    $stmt = $pdo->prepare("UPDATE projetos SET status = 'ativo', data_conclusao = NULL WHERE id = ?");
    $stmt->execute([$projeto_id]);

    sucesso(['mensagem' => 'Projeto reaberto com sucesso']);
}

/**
 * Handler: Excluir projeto definitivamente
 */
function handle_excluir_projeto_definitivamente($pdo, $inputData, $tokenData)
{
    $projeto_id = filter_var($inputData['projeto_id'] ?? null, FILTER_VALIDATE_INT);
    $user_id = $tokenData['user_id'] ?? 0;

    if (!$projeto_id) {
        erro('ID do projeto é obrigatório.', 400);
    }

    // Verificar permissão
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario || $usuario['funcao'] !== 'admin') {
        erro('Acesso negado. Apenas administradores podem excluir projetos definitivamente.', 403);
    }

    // Verificar se o projeto está arquivado
    $stmt = $pdo->prepare("SELECT id, status FROM projetos WHERE id = ? AND (status = 'concluido' OR status = 'excluido')");
    $stmt->execute([$projeto_id]);
    $projeto = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$projeto) {
        erro('Projeto não encontrado ou não está em um estado que permite exclusão definitiva.', 404);
    }

    // Iniciar transação
    $pdo->beginTransaction();
    try {
        // Excluir etapas das tarefas
        $stmt_etapas = $pdo->prepare("DELETE te FROM tarefa_etapas te INNER JOIN tarefas t ON te.tarefa_id = t.id WHERE t.projeto_id = ?");
        $stmt_etapas->execute([$projeto_id]);

        // Excluir usuários das tarefas
        $stmt_tarefa_usuarios = $pdo->prepare("DELETE tu FROM tarefa_usuarios tu INNER JOIN tarefas t ON tu.tarefa_id = t.id WHERE t.projeto_id = ?");
        $stmt_tarefa_usuarios->execute([$projeto_id]);

        // Excluir arquivos das tarefas
        $stmt_arquivos = $pdo->prepare("DELETE ta FROM tarefas_arquivos ta INNER JOIN tarefas t ON ta.tarefa_id = t.id WHERE t.projeto_id = ?");
        $stmt_arquivos->execute([$projeto_id]);

        // Excluir comentários das tarefas
        $stmt_comentarios = $pdo->prepare("DELETE tc FROM tarefas_comentarios tc INNER JOIN tarefas t ON tc.tarefa_id = t.id WHERE t.projeto_id = ?");
        $stmt_comentarios->execute([$projeto_id]);

        // Excluir as tarefas
        $stmt_tarefas = $pdo->prepare("DELETE FROM tarefas WHERE projeto_id = ?");
        $stmt_tarefas->execute([$projeto_id]);

        // Excluir o projeto
        $stmt_projeto = $pdo->prepare("DELETE FROM projetos WHERE id = ?");
        $stmt_projeto->execute([$projeto_id]);

        $pdo->commit();
        sucesso(['mensagem' => 'Projeto excluído definitivamente com sucesso.']);

    } catch (Exception $e) {
        $pdo->rollBack();
        erro('Erro ao excluir projeto definitivamente: ' . $e->getMessage(), 500);
    }
}

/**
 * Handler: Obter projetos finalizados
 */
function handle_obter_projetos_finalizados($pdo, $tokenData)
{
    $user_id = $tokenData['user_id'] ?? 0;

    // Verificar permissões
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario || !in_array($usuario['funcao'], ['admin', 'editor'])) {
        erro('Acesso negado. Apenas administradores e editores podem acessar o arquivo.', 403);
    }

    $eh_admin = ($usuario['funcao'] === 'admin');
    $params = [];

    $sql = "SELECT id, nome, descricao, status, data_inicio, data_fim, data_criacao, data_conclusao 
            FROM projetos 
            WHERE status IN ('concluido', 'excluido') ";

    if (!$eh_admin) {
        $sql .= " AND id IN (SELECT DISTINCT t.projeto_id FROM tarefas t INNER JOIN tarefa_usuarios tu ON t.id = tu.tarefa_id WHERE tu.usuario_id = ?) ";
        $params[] = $user_id;
    }

    $sql .= " ORDER BY data_conclusao DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $projetos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sucesso($projetos);
}

/**
 * Handler: Obter detalhes de projeto arquivado
 */
function handle_obter_detalhes_projeto_arquivado($pdo, $tokenData)
{
    $projeto_id = filter_var($_GET['projeto_id'] ?? null, FILTER_VALIDATE_INT);
    $user_id = $tokenData['user_id'] ?? 0;

    if (!$projeto_id) {
        erro('ID do projeto é obrigatório.', 400);
    }

    // Verificar permissões
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario || !in_array($usuario['funcao'], ['admin', 'editor'])) {
        erro('Acesso negado. Apenas administradores e editores podem acessar detalhes de projetos arquivados.', 403);
    }

    $eh_admin = ($usuario['funcao'] === 'admin');

    // Obter detalhes do projeto
    $stmt = $pdo->prepare("SELECT id, nome, descricao, status, data_conclusao FROM projetos WHERE id = ? AND (status = 'concluido' OR status = 'excluido')");
    $stmt->execute([$projeto_id]);
    $projeto = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$projeto) {
        erro('Projeto não encontrado ou não está arquivado.', 404);
    }

    // Se for editor, verificar acesso
    if (!$eh_admin) {
        $stmt_check = $pdo->prepare("SELECT COUNT(*) FROM tarefa_usuarios tu INNER JOIN tarefas t ON tu.tarefa_id = t.id WHERE t.projeto_id = ? AND tu.usuario_id = ?");
        $stmt_check->execute([$projeto_id, $user_id]);
        if ($stmt_check->fetchColumn() == 0) {
            erro('Acesso negado. Você não possui tarefas vinculadas a este projeto.', 403);
        }
    }

    // Obter tarefas
    $sql_tarefas = "SELECT id, titulo as nome, status FROM tarefas WHERE projeto_id = ?";
    $params_tarefas = [$projeto_id];

    if (!$eh_admin) {
        $sql_tarefas .= " AND id IN (SELECT tarefa_id FROM tarefa_usuarios WHERE usuario_id = ?)";
        $params_tarefas[] = $user_id;
    }

    $stmt_tarefas = $pdo->prepare($sql_tarefas);
    $stmt_tarefas->execute($params_tarefas);
    $tarefas = $stmt_tarefas->fetchAll(PDO::FETCH_ASSOC);

    // Obter etapas de cada tarefa
    foreach ($tarefas as &$tarefa) {
        $stmt_etapas = $pdo->prepare("SELECT id, descricao as nome, concluida FROM tarefa_etapas WHERE tarefa_id = ? ORDER BY id ASC");
        $stmt_etapas->execute([$tarefa['id']]);
        $tarefa['etapas'] = $stmt_etapas->fetchAll(PDO::FETCH_ASSOC);
    }
    unset($tarefa);

    sucesso(['projeto' => $projeto, 'tarefas' => $tarefas]);
}
