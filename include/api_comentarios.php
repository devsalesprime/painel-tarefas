<?php
/**
 * Handlers de Endpoints - Comentários
 * 
 * Gerencia comentários de tarefas.
 */

/**
 * Handler: Adicionar comentário
 */
function handle_adicionar_comentario($pdo, $inputData, $tokenData)
{
    $tarefa_id = filter_var($inputData['tarefa_id'] ?? null, FILTER_VALIDATE_INT);
    $usuario_id = $tokenData['user_id'] ?? 0;
    $comentario = sanitizar($inputData['comentario'] ?? '');

    if (!$tarefa_id || !$usuario_id || empty($comentario)) {
        erro('ID da tarefa, ID do usuário e comentário são obrigatórios.');
    }

    $stmt = $pdo->prepare("INSERT INTO tarefas_comentarios (tarefa_id, usuario_id, comentario) VALUES (?, ?, ?)");
    $stmt->execute([$tarefa_id, $usuario_id, $comentario]);
    $comentario_id = $pdo->lastInsertId();

    sucesso(['id' => $comentario_id, 'mensagem' => 'Comentário adicionado com sucesso']);
}

/**
 * Handler: Obter comentários de uma tarefa
 */
function handle_obter_comentarios($pdo)
{
    $tarefa_id = filter_var($_GET['tarefa_id'] ?? null, FILTER_VALIDATE_INT);

    if (!$tarefa_id) {
        erro('ID da tarefa é obrigatório');
    }

    $stmt = $pdo->prepare("SELECT tc.id, tc.comentario, tc.data_criacao, u.nome as usuario_nome, u.id as usuario_id FROM tarefas_comentarios tc INNER JOIN usuarios u ON tc.usuario_id = u.id WHERE tc.tarefa_id = ? ORDER BY tc.data_criacao ASC");
    $stmt->execute([$tarefa_id]);
    $comentarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sucesso($comentarios);
}

/**
 * Handler: Deletar comentário
 */
function handle_deletar_comentario($pdo, $inputData, $tokenData)
{
    $comentario_id = filter_var($inputData['comentario_id'] ?? null, FILTER_VALIDATE_INT);
    $user_id = $tokenData['user_id'] ?? 0;

    if (!$comentario_id) {
        erro('ID do comentário é obrigatório.');
    }

    $stmt = $pdo->prepare("SELECT tc.usuario_id, u.funcao FROM tarefas_comentarios tc INNER JOIN usuarios u ON u.id = ? WHERE tc.id = ?");
    $stmt->execute([$user_id, $comentario_id]);
    $info = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$info) {
        erro('Comentário não encontrado ou usuário não existe.', 404);
    }

    $eh_admin = ($info['funcao'] === 'admin');
    $eh_autor = ($info['usuario_id'] == $user_id);

    if (!$eh_admin && !$eh_autor) {
        erro('Acesso negado. Apenas o autor ou um administrador pode deletar este comentário.', 403);
    }

    $stmt = $pdo->prepare("DELETE FROM tarefas_comentarios WHERE id = ?");
    $stmt->execute([$comentario_id]);

    sucesso(['mensagem' => 'Comentário deletado com sucesso']);
}
