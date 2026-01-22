<?php
/**
 * Handlers de Endpoints - Etapas (Checklist)
 * 
 * Gerencia etapas/checklist de tarefas.
 */

/**
 * Handler: Criar etapa
 */
function handle_criar_etapa($pdo, $inputData)
{
    $tarefa_id = filter_var($inputData['tarefa_id'] ?? $inputData['tarefaid'] ?? null, FILTER_VALIDATE_INT);
    $descricao = sanitizar($inputData['descricao'] ?? '');

    if (!$tarefa_id || empty($descricao)) {
        erro('ID da tarefa e descrição da etapa são obrigatórios.');
    }

    $stmt = $pdo->prepare("INSERT INTO tarefa_etapas (tarefa_id, descricao, concluida) VALUES (?, ?, 0)");
    $stmt->execute([$tarefa_id, $descricao]);
    $etapa_id = $pdo->lastInsertId();

    $stmt_tarefa = $pdo->prepare("SELECT progresso_manual FROM tarefas WHERE id = ?");
    $stmt_tarefa->execute([$tarefa_id]);
    $progresso_manual = $stmt_tarefa->fetchColumn();
    $progresso = calcular_progresso_tarefa($pdo, $tarefa_id, $progresso_manual);

    sucesso(['id' => $etapa_id, 'mensagem' => 'Etapa adicionada com sucesso', 'progresso' => $progresso]);
}

/**
 * Handler: Concluir etapa
 */
function handle_concluir_etapa($pdo, $inputData)
{
    $etapa_id = filter_var($inputData['etapa_id'] ?? null, FILTER_VALIDATE_INT);

    if (!$etapa_id) {
        erro('ID da etapa é obrigatório.');
    }

    $stmt = $pdo->prepare("UPDATE tarefa_etapas SET concluida = 1 WHERE id = ?");
    $stmt->execute([$etapa_id]);

    $stmt_tarefa_id = $pdo->prepare("SELECT tarefa_id FROM tarefa_etapas WHERE id = ?");
    $stmt_tarefa_id->execute([$etapa_id]);
    $tarefa_id = $stmt_tarefa_id->fetchColumn();

    if ($tarefa_id) {
        $stmt_tarefa = $pdo->prepare("SELECT progresso_manual FROM tarefas WHERE id = ?");
        $stmt_tarefa->execute([$tarefa_id]);
        $progresso_manual = $stmt_tarefa->fetchColumn();
        $progresso = calcular_progresso_tarefa($pdo, $tarefa_id, $progresso_manual);

        if ($progresso == 100) {
            $update_tarefa = $pdo->prepare("UPDATE tarefas SET concluida = 1, status = 'concluida', data_conclusao_real = NOW() WHERE id = ?");
            $update_tarefa->execute([$tarefa_id]);
        }
    }

    sucesso(['mensagem' => 'Etapa concluída com sucesso', 'progresso_calculado' => $progresso ?? null]);
}

/**
 * Handler: Reabrir etapa
 */
function handle_reabrir_etapa($pdo, $inputData)
{
    $etapa_id = filter_var($inputData['etapa_id'] ?? null, FILTER_VALIDATE_INT);

    if (!$etapa_id) {
        erro('ID da etapa é obrigatório.');
    }

    $stmt = $pdo->prepare("UPDATE tarefa_etapas SET concluida = 0 WHERE id = ?");
    $stmt->execute([$etapa_id]);

    $stmt_tarefa_id = $pdo->prepare("SELECT tarefa_id FROM tarefa_etapas WHERE id = ?");
    $stmt_tarefa_id->execute([$etapa_id]);
    $tarefa_id = $stmt_tarefa_id->fetchColumn();

    if ($tarefa_id) {
        $stmt_tarefa = $pdo->prepare("SELECT progresso_manual FROM tarefas WHERE id = ?");
        $stmt_tarefa->execute([$tarefa_id]);
        $progresso_manual = $stmt_tarefa->fetchColumn();
        $progresso = calcular_progresso_tarefa($pdo, $tarefa_id, $progresso_manual);

        $update_tarefa = $pdo->prepare("UPDATE tarefas SET concluida = 0, status = 'iniciada', data_conclusao_real = NULL WHERE id = ? AND status = 'concluida'");
        $update_tarefa->execute([$tarefa_id]);
    }

    sucesso(['mensagem' => 'Etapa reaberta com sucesso', 'progresso_calculado' => $progresso ?? null]);
}

/**
 * Handler: Atualizar etapa
 */
function handle_atualizar_etapa($pdo, $inputData)
{
    $etapa_id = filter_var($inputData['etapa_id'] ?? $inputData['etapaid'] ?? null, FILTER_VALIDATE_INT);
    $concluida = isset($inputData['concluida']) ? (int) $inputData['concluida'] : 0;

    if (!$etapa_id) {
        erro('ID da etapa é obrigatório.');
    }

    $stmt = $pdo->prepare("UPDATE tarefa_etapas SET concluida = ? WHERE id = ?");
    $stmt->execute([$concluida, $etapa_id]);

    $stmt_tarefa_id = $pdo->prepare("SELECT tarefa_id FROM tarefa_etapas WHERE id = ?");
    $stmt_tarefa_id->execute([$etapa_id]);
    $tarefa_id = $stmt_tarefa_id->fetchColumn();

    if ($tarefa_id) {
        $stmt_tarefa = $pdo->prepare("SELECT progresso_manual FROM tarefas WHERE id = ?");
        $stmt_tarefa->execute([$tarefa_id]);
        $progresso_manual = $stmt_tarefa->fetchColumn();
        $progresso = calcular_progresso_tarefa($pdo, $tarefa_id, $progresso_manual);

        if ($progresso >= 100) {
            $update_tarefa = $pdo->prepare("UPDATE tarefas SET concluida = 1, status = 'concluida', data_conclusao_real = NOW() WHERE id = ?");
            $update_tarefa->execute([$tarefa_id]);
        } else {
            $update_tarefa = $pdo->prepare("UPDATE tarefas SET concluida = 0, status = 'iniciada', data_conclusao_real = NULL WHERE id = ? AND status = 'concluida'");
            $update_tarefa->execute([$tarefa_id]);
        }
    }

    sucesso(['mensagem' => 'Etapa atualizada com sucesso', 'progresso' => $progresso ?? null]);
}

/**
 * Handler: Deletar etapa
 */
function handle_deletar_etapa($pdo, $inputData)
{
    $etapa_id = filter_var($inputData['etapa_id'] ?? $inputData['etapaid'] ?? null, FILTER_VALIDATE_INT);

    if (!$etapa_id) {
        erro('ID da etapa é obrigatório.');
    }

    $stmt_tarefa_id = $pdo->prepare("SELECT tarefa_id FROM tarefa_etapas WHERE id = ?");
    $stmt_tarefa_id->execute([$etapa_id]);
    $tarefa_id = $stmt_tarefa_id->fetchColumn();

    $stmt = $pdo->prepare("DELETE FROM tarefa_etapas WHERE id = ?");
    $stmt->execute([$etapa_id]);

    if ($tarefa_id) {
        $stmt_tarefa = $pdo->prepare("SELECT progresso_manual FROM tarefas WHERE id = ?");
        $stmt_tarefa->execute([$tarefa_id]);
        $progresso_manual = $stmt_tarefa->fetchColumn();
        $progresso = calcular_progresso_tarefa($pdo, $tarefa_id, $progresso_manual);

        if ($progresso >= 100) {
            $update_tarefa = $pdo->prepare("UPDATE tarefas SET concluida = 1, status = 'concluida', data_conclusao_real = NOW() WHERE id = ?");
            $update_tarefa->execute([$tarefa_id]);
        } else {
            $update_tarefa = $pdo->prepare("UPDATE tarefas SET concluida = 0, status = 'iniciada', data_conclusao_real = NULL WHERE id = ? AND status = 'concluida'");
            $update_tarefa->execute([$tarefa_id]);
        }
    }

    sucesso(['mensagem' => 'Etapa deletada com sucesso', 'progresso' => $progresso ?? null]);
}
