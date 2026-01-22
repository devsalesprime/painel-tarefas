<?php
/**
 * Handlers de Endpoints - Links
 * 
 * Gerencia links de tarefas.
 */

/**
 * Handler: Adicionar link
 */
function handle_adicionar_link($pdo, $inputData, $tokenData)
{
    $tarefa_id = filter_var($inputData['tarefa_id'] ?? null, FILTER_VALIDATE_INT);
    $titulo = sanitizar($inputData['titulo'] ?? '');
    $url = sanitizar($inputData['url'] ?? '');
    $user_id = $tokenData['user_id'] ?? 0;

    if (!$tarefa_id || empty($titulo) || empty($url)) {
        erro('Tarefa ID, título e URL são obrigatórios.');
    }

    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        erro('URL inválida.');
    }

    $stmt = $pdo->prepare("INSERT INTO tarefas_links (tarefa_id, titulo, url, usuario_id) VALUES (?, ?, ?, ?)");
    $stmt->execute([$tarefa_id, $titulo, $url, $user_id]);

    sucesso(['id' => $pdo->lastInsertId(), 'mensagem' => 'Link adicionado com sucesso']);
}

/**
 * Handler: Obter links de uma tarefa
 */
function handle_obter_links($pdo)
{
    $tarefa_id = filter_var($_GET['tarefa_id'] ?? null, FILTER_VALIDATE_INT);

    if (!$tarefa_id) {
        erro('ID da tarefa é obrigatório');
    }

    $links = obter_links_tarefa($pdo, $tarefa_id);
    sucesso($links);
}

/**
 * Handler: Deletar link
 */
function handle_deletar_link($pdo, $inputData)
{
    $link_id = filter_var($inputData['link_id'] ?? null, FILTER_VALIDATE_INT);

    if (!$link_id) {
        erro('ID do link é obrigatório');
    }

    $stmt = $pdo->prepare("DELETE FROM tarefas_links WHERE id = ?");
    $stmt->execute([$link_id]);

    sucesso(['mensagem' => 'Link removido com sucesso']);
}
