<?php
/**
 * Handlers de Endpoints - Relatórios
 * 
 * Gerencia relatórios administrativos (apenas admin).
 */

/**
 * Handler: Relatório geral
 */
function handle_relatorio_geral($pdo, $tokenData)
{
    $user_id = $tokenData['user_id'] ?? 0;
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario || $usuario['funcao'] !== 'admin') {
        erro('Acesso negado. Apenas administradores podem acessar relatórios.', 403);
    }

    $total_projetos = $pdo->query("SELECT COUNT(*) FROM projetos WHERE status != 'excluido'")->fetchColumn();
    $projetos_ativos = $pdo->query("SELECT COUNT(*) FROM projetos WHERE status = 'ativo'")->fetchColumn();
    $projetos_concluidos = $pdo->query("SELECT COUNT(*) FROM projetos WHERE status = 'concluido'")->fetchColumn();
    $total_tarefas = $pdo->query("SELECT COUNT(*) FROM tarefas WHERE status != 'excluida'")->fetchColumn();
    $tarefas_concluidas = $pdo->query("SELECT COUNT(*) FROM tarefas WHERE status = 'concluida'")->fetchColumn();
    $tarefas_atrasadas = $pdo->query("SELECT COUNT(*) FROM tarefas WHERE DATE(data_fim) < CURDATE() AND status != 'concluida' AND status != 'excluida'")->fetchColumn();
    $tarefas_pausadas = $pdo->query("SELECT COUNT(*) FROM tarefas WHERE status = 'pausada'")->fetchColumn();

    $resultado = [
        'projetos' => [
            'total' => (int) $total_projetos,
            'ativos' => (int) $projetos_ativos,
            'concluidos' => (int) $projetos_concluidos,
        ],
        'tarefas' => [
            'total' => (int) $total_tarefas,
            'concluidas' => (int) $tarefas_concluidas,
            'atrasadas' => (int) $tarefas_atrasadas,
            'pausadas' => (int) $tarefas_pausadas,
            'taxa_conclusao' => $total_tarefas > 0 ? round(($tarefas_concluidas / $total_tarefas) * 100, 2) : 0,
        ],
    ];

    sucesso($resultado);
}

/**
 * Handler: Relatório de tarefas atrasadas
 */
function handle_relatorio_tarefas_atrasadas($pdo, $tokenData)
{
    $usuario_id = $tokenData['user_id'] ?? 0;
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$usuario_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario || $usuario['funcao'] != 'admin') {
        erro('Acesso negado. Apenas administradores podem acessar relatórios.', 403);
    }

    $hoje = date('Y-m-d');
    $stmt = $pdo->prepare("SELECT t.id, t.titulo, t.descricao, t.data_inicio, t.data_fim, t.status, t.prioridade, t.progresso_manual, p.nome as projeto_nome, (SELECT GROUP_CONCAT(u.nome SEPARATOR ', ') FROM usuarios u INNER JOIN tarefa_usuarios tu ON u.id = tu.usuario_id WHERE tu.tarefa_id = t.id) as usuarios_nomes, DATEDIFF(?, t.data_fim) as dias_atraso FROM tarefas t INNER JOIN projetos p ON t.projeto_id = p.id WHERE t.status != 'excluida' AND t.status != 'concluida' AND DATE(t.data_fim) < ? ORDER BY t.data_fim ASC");
    $stmt->execute([$hoje, $hoje]);
    $tarefas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($tarefas as &$tarefa) {
        if ($tarefa['usuarios_nomes']) {
            $tarefa['usuarios'] = array_map(function ($nome) {
                return trim($nome);
            }, explode(',', $tarefa['usuarios_nomes']));
        } else {
            $tarefa['usuarios'] = [];
        }
        unset($tarefa['usuarios_nomes']);
        $tarefa['progresso'] = calcular_progresso_tarefa($pdo, $tarefa['id'], $tarefa['progresso_manual']);
    }
    unset($tarefa);

    sucesso($tarefas);
}

/**
 * Handler: Relatório de tarefas pausadas
 */
function handle_relatorio_tarefas_pausadas($pdo, $tokenData)
{
    $user_id = $tokenData['user_id'] ?? 0;
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario || $usuario['funcao'] !== 'admin') {
        erro('Acesso negado. Apenas administradores podem acessar relatórios.', 403);
    }

    $hoje = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("SELECT t.id, t.titulo, t.descricao, t.data_inicio, t.data_fim, t.status, t.prioridade, t.progresso_manual, p.nome as projeto_nome, (SELECT GROUP_CONCAT(u.nome SEPARATOR ', ') FROM usuarios u INNER JOIN tarefa_usuarios tu ON u.id = tu.usuario_id WHERE tu.tarefa_id = t.id) as usuarios_nomes, DATEDIFF(t.data_fim, ?) as dias_ate_prazo FROM tarefas t INNER JOIN projetos p ON t.projeto_id = p.id WHERE t.status = 'pausada' AND t.status != 'excluida' ORDER BY t.data_fim ASC");
    $stmt->execute([$hoje]);
    $tarefas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($tarefas as &$tarefa) {
        if ($tarefa['usuarios_nomes']) {
            $tarefa['usuarios'] = array_map(function ($nome) {
                return ['nome' => trim($nome)];
            }, explode(',', $tarefa['usuarios_nomes']));
        } else {
            $tarefa['usuarios'] = [];
        }
        unset($tarefa['usuarios_nomes']);
        $tarefa['progresso'] = calcular_progresso_tarefa($pdo, $tarefa['id'], $tarefa['progresso_manual']);
    }
    unset($tarefa);

    sucesso($tarefas);
}

/**
 * Handler: Relatório por projeto
 */
function handle_relatorio_por_projeto($pdo, $tokenData)
{
    $user_id = $tokenData['user_id'] ?? 0;
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario || $usuario['funcao'] !== 'admin') {
        erro('Acesso negado. Apenas administradores podem acessar relatórios.', 403);
    }

    $stmt = $pdo->query("SELECT p.id, p.nome, COALESCE(SUM(CASE WHEN t.id IS NOT NULL AND t.status != 'excluida' THEN 1 ELSE 0 END),0) AS total_tarefas, COALESCE(SUM(CASE WHEN t.id IS NOT NULL AND (t.concluida = 1 OR t.status = 'concluida') THEN 1 ELSE 0 END),0) AS concluidas, COALESCE(SUM(CASE WHEN t.id IS NOT NULL AND t.status = 'iniciada' THEN 1 ELSE 0 END),0) AS em_andamento, COALESCE(SUM(CASE WHEN t.id IS NOT NULL AND t.status = 'pausada' THEN 1 ELSE 0 END),0) AS pausadas, COALESCE(SUM(CASE WHEN t.id IS NOT NULL AND t.status != 'concluida' AND DATE(t.data_fim) < CURDATE() THEN 1 ELSE 0 END),0) AS atrasadas FROM projetos p LEFT JOIN tarefas t ON p.id = t.projeto_id AND t.status != 'excluida' WHERE p.status = 'ativo' GROUP BY p.id, p.nome ORDER BY p.nome");
    $projetos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($projetos as &$projeto) {
        $total = $projeto['total_tarefas'] ?: 1;
        $projeto['taxa_conclusao'] = round(($projeto['concluidas'] / $total) * 100);
    }
    unset($projeto);

    sucesso($projetos);
}

/**
 * Handler: Relatório por usuário
 */
function handle_relatorio_por_usuario($pdo, $tokenData)
{
    $user_id = $tokenData['user_id'] ?? 0;
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario || $usuario['funcao'] !== 'admin') {
        erro('Acesso negado. Apenas administradores podem acessar relatórios.', 403);
    }

    $stmt = $pdo->query("SELECT u.id, u.nome, u.email, COALESCE(SUM(CASE WHEN t.status IS NOT NULL AND t.status != 'excluida' THEN 1 ELSE 0 END),0) as total_tarefas, COALESCE(SUM(CASE WHEN (t.concluida = 1 OR t.status = 'concluida') THEN 1 ELSE 0 END),0) as concluidas, COALESCE(SUM(CASE WHEN t.status = 'iniciada' THEN 1 ELSE 0 END),0) as em_andamento, COALESCE(SUM(CASE WHEN t.status = 'pausada' THEN 1 ELSE 0 END),0) as pausadas, COALESCE(SUM(CASE WHEN t.status != 'concluida' AND DATE(t.data_fim) < CURDATE() THEN 1 ELSE 0 END),0) as atrasadas FROM usuarios u LEFT JOIN tarefa_usuarios tu ON u.id = tu.usuario_id LEFT JOIN tarefas t ON tu.tarefa_id = t.id AND t.status != 'excluida' WHERE u.ativo = 1 GROUP BY u.id, u.nome, u.email ORDER BY u.nome");
    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($usuarios as &$usuario) {
        $total = $usuario['total_tarefas'] ?: 1;
        $usuario['taxa_conclusao'] = round(($usuario['concluidas'] / $total) * 100);
    }
    unset($usuario);

    sucesso($usuarios);
}
