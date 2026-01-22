<?php
// ============================================================================
// HELPERS.PHP - Funções Auxiliares do Sistema de Gerenciamento de Tarefas
// ============================================================================
// Este arquivo contém todas as funções reutilizáveis do sistema.
// É incluído pelo config.php e está disponível em toda a aplicação.
// ============================================================================

// ============================================================================
// SEÇÃO 1: GERENCIAMENTO DE USUÁRIOS
// ============================================================================

/**
 * Obtém lista de todos os usuários ativos do sistema
 *
 * Retorna uma lista completa de usuários cadastrados e ativos,
 * ordenados alfabeticamente por nome.
 *
 * @param PDO $pdo Conexão PDO com o banco de dados
 * @return array Array associativo com dados de todos os usuários
 * @throws PDOException Em caso de erro na consulta
 */
function obter_usuarios($pdo) {
    $stmt = $pdo->query("
           SELECT id, nome, email, username, squad
        FROM usuarios
        WHERE ativo = 1
        ORDER BY nome
    ");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Obtém dados de um usuário específico
 *
 * Busca informações detalhadas de um usuário ativo pelo seu ID.
 * Retorna false se o usuário não existir ou estiver inativo.
 *
 * @param PDO $pdo Conexão PDO com o banco de dados
 * @param int $usuario_id ID do usuário a ser consultado
 * @return array|false Array com dados do usuário ou false se não encontrado
 * @throws PDOException Em caso de erro na consulta
 */
function obter_usuario($pdo, $usuario_id) {
    $stmt = $pdo->prepare("
           SELECT id, nome, email, username, squad
        FROM usuarios
        WHERE id = ? AND ativo = 1
    ");
    $stmt->execute([$usuario_id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

/**
 * Obtém lista de usuários atribuídos a uma tarefa específica
 *
 * Retorna todos os usuários que estão vinculados a uma determinada tarefa,
 * através da tabela de relacionamento tarefa_usuarios.
 *
 * @param PDO $pdo Conexão PDO com o banco de dados
 * @param int $tarefa_id ID da tarefa
 * @return array Array de usuários atribuídos à tarefa
 * @throws PDOException Em caso de erro na consulta
 */
function obter_usuarios_tarefa($pdo, $tarefa_id) {
    $stmt = $pdo->prepare("
        SELECT u.id, u.nome, u.email, u.username
        FROM usuarios u
        INNER JOIN tarefa_usuarios tu ON u.id = tu.usuario_id
        WHERE tu.tarefa_id = ?
        ORDER BY u.nome
    ");
    $stmt->execute([$tarefa_id]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// ============================================================================
// SEÇÃO 2: GERENCIAMENTO DE PROJETOS
// ============================================================================

/**
 * Obtém lista de todos os projetos ativos
 *
 * Retorna projetos com qualquer status exceto 'inativo', ordenados por nome.
 * Ideal para listagens gerais e dashboards.
 *
 * @param PDO $pdo Conexão PDO com o banco de dados
 * @return array Array associativo com dados dos projetos
 * @throws PDOException Em caso de erro na consulta
 */
function obter_projetos($pdo) {
    $stmt = $pdo->query("
        SELECT id, nome, descricao, status
        FROM projetos
        WHERE status != 'inativo'
        ORDER BY nome
    ");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Obtém dados de um projeto específico
 *
 * Busca informações completas de um projeto pelo seu ID,
 * independente do status (incluindo inativos).
 *
 * @param PDO $pdo Conexão PDO com o banco de dados
 * @param int $projeto_id ID do projeto a ser consultado
 * @return array|false Array com dados do projeto ou false se não encontrado
 * @throws PDOException Em caso de erro na consulta
 */
function obter_projeto($pdo, $projeto_id) {
    $stmt = $pdo->prepare("
        SELECT id, nome, descricao, status
        FROM projetos
        WHERE id = ?
    ");
    $stmt->execute([$projeto_id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// ============================================================================
// SEÇÃO 3: GERENCIAMENTO DE TAREFAS
// ============================================================================

/**
 * Obtém todas as tarefas de um projeto com filtro opcional de status
 *
 * Lista tarefas de um projeto específico. Permite filtrar por status
 * para exibir apenas tarefas em determinada situação (pendente, concluída, etc).
 *
 * @param PDO $pdo Conexão PDO com o banco de dados
 * @param int $projeto_id ID do projeto
 * @param string|null $filtro_status Status para filtrar (opcional)
 * @return array Array de tarefas do projeto
 * @throws PDOException Em caso de erro na consulta
 */
function obter_tarefas_por_projeto($pdo, $projeto_id, $filtro_status = null) {
    $query = "
        SELECT id, projeto_id, titulo, descricao, squad, data_inicio,
        data_fim, concluida, status, data_criacao
        FROM tarefas
        WHERE projeto_id = ?
    ";

    // Aplica filtro de status se fornecido
    if ($filtro_status) {
        $query .= " AND status = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$projeto_id, $filtro_status]);
    } else {
        $stmt = $pdo->prepare($query);
        $stmt->execute([$projeto_id]);
    }

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// ============================================================================
// SEÇÃO 4: GERENCIAMENTO DE ETAPAS (CHECKLIST)
// ============================================================================

/**
 * Calcula o progresso percentual de uma tarefa
 *
 * Calcula automaticamente o progresso baseado nas etapas concluídas da tarefa.
 * Se um progresso manual for informado, ele tem prioridade sobre o cálculo automático.
 *
 * Lógica:
 * - Se progresso_manual > 0: retorna o valor manual (máximo 100%)
 * - Caso contrário: calcula (etapas_concluídas / total_etapas) * 100
 * - Se não há etapas: retorna 0%
 *
 * @param PDO $pdo Conexão PDO com o banco de dados
 * @param int $tarefa_id ID da tarefa
 * @param int $progresso_manual Progresso definido manualmente (0-100)
 * @return int Percentual de progresso (0-100)
 * @throws PDOException Em caso de erro na consulta
 */
function calcular_progresso_tarefa($pdo, $tarefa_id, $progresso_manual = 0) {
    // Prioriza progresso manual se definido
    if ($progresso_manual > 0) {
        return min($progresso_manual, 100);
    }

    // Calcula progresso baseado nas etapas
    $stmt = $pdo->prepare("
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN concluida = 1 THEN 1 ELSE 0 END) as concluidas
        FROM tarefa_etapas
        WHERE tarefa_id = ?
    ");
    $stmt->execute([$tarefa_id]);
    $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

    // Evita divisão por zero
    if ($resultado['total'] > 0) {
        return round(($resultado['concluidas'] / $resultado['total']) * 100);
    }

    return 0;
}

/**
 * Obtém todas as etapas (checklist) de uma tarefa
 *
 * Retorna a lista completa de etapas de uma tarefa, ordenadas por data de criação.
 * Útil para exibir checklists e acompanhar o progresso detalhado.
 *
 * @param PDO $pdo Conexão PDO com o banco de dados
 * @param int $tarefa_id ID da tarefa
 * @return array Array de etapas com status de conclusão
 * @throws PDOException Em caso de erro na consulta
 */
function obter_etapas_tarefa($pdo, $tarefa_id) {
    $stmt = $pdo->prepare("
        SELECT id, descricao, concluida, data_criacao
        FROM tarefa_etapas
        WHERE tarefa_id = ?
        ORDER BY data_criacao ASC
    ");
    $stmt->execute([$tarefa_id]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// ============================================================================
// SEÇÃO 5: FUNÇÕES DE VALIDAÇÃO
// ============================================================================

/**
 * Valida e normaliza o status de uma tarefa
 *
 * Aceita diferentes variações de status (incluindo português com acentuação)
 * e retorna o status normalizado correspondente. Previne erros por variações
 * de digitação ou idioma.
 *
 * Status aceitos:
 * - 'pendente' / 'pendente' → 'pendente'
 * - 'iniciada' / 'em andamento' → 'iniciada'
 * - 'pausada' / 'pausado' → 'pausada'
 * - 'concluida' / 'concluído' → 'concluida'
 *
 * @param string $status Status a ser validado
 * @return string Status normalizado (padrão: 'pendente')
 */
function validar_status_tarefa($status) {
    // Mapa de normalização de status
    $status_permitidos = [
        'pendente' => 'pendente',
        'iniciada' => 'iniciada',
        'pausada' => 'pausada',
        'concluida' => 'concluida',
        'em andamento' => 'iniciada',
        'pausado' => 'pausada',
        'concluído' => 'concluida'
    ];

    // Normaliza entrada (minúsculas, sem espaços extras)
    $status = strtolower(trim($status));

    // Retorna status normalizado ou padrão 'pendente'
    return $status_permitidos[$status] ?? 'pendente';
}

/**
 * Valida se uma data está no formato especificado
 *
 * Verifica se uma string representa uma data válida no formato fornecido.
 * Útil para validação de entrada de usuários antes de inserir no banco.
 *
 * @param string $data Data a ser validada
 * @param string $formato Formato esperado (padrão: 'Y-m-d' para MySQL)
 * @return bool True se a data é válida, false caso contrário
 *
 * @example validar_data('2024-12-31', 'Y-m-d') // true
 * @example validar_data('31/12/2024', 'd/m/Y') // true
 * @example validar_data('32/13/2024', 'd/m/Y') // false
 */
function validar_data($data, $formato = 'Y-m-d') {
    $d = DateTime::createFromFormat($formato, $data);
    return $d && $d->format($formato) === $data;
}

// ============================================================================
// SEÇÃO 6: FUNÇÕES DE VALIDAÇÃO DE DATAS (NOVAS - PARA CORRIGIR O ERRO)
// ============================================================================

/**
 * Verifica se uma data está no passado.
 *
 * @param string $data Data no formato 'YYYY-MM-DD' ou 'YYYY-MM-DDTHH:mm'
 * @return bool true se a data é anterior a hoje, false caso contrário
 *
 * @example dataEhNoPassado('2024-01-01') // true (no passado)
 * @example dataEhNoPassado('2025-12-31') // false (no futuro)
 */
function dataEhNoPassado($data)
{
    if (empty($data)) {
        return false; // Considera vazio como válido
    }

    // Normaliza a data removendo 'T' se presente
    $data = str_replace('T', ' ', $data);

    // Converte para timestamp
    $timestamp = strtotime($data);

    if ($timestamp === false) {
        return false; // Data inválida, deixa passar para validação de formato
    }

    // Compara com a data de hoje (00:00:00)
    $hoje = strtotime(date('Y-m-d')); // Começo do dia

    // Retorna true se a data é anterior a hoje
    return $timestamp < $hoje;
}

/**
 * Verifica se uma data está no futuro.
 * Função complementar para outras validações.
 *
 * @param string $data Data no formato 'YYYY-MM-DD' ou 'YYYY-MM-DDTHH:mm'
 * @return bool true se a data é posterior a hoje, false caso contrário
 *
 * @example dataEhNoFuturo('2025-12-31') // true (no futuro)
 * @example dataEhNoFuturo('2024-01-01') // false (no passado)
 */
function dataEhNoFuturo($data)
{
    if (empty($data)) {
        return false;
    }

    // Normaliza a data removendo 'T' se presente
    $data = str_replace('T', ' ', $data);

    // Converte para timestamp
    $timestamp = strtotime($data);

    if ($timestamp === false) {
        return false; // Data inválida
    }

    // Compara com a data de hoje (23:59:59)
    $hoje = strtotime(date('Y-m-d') . ' 23:59:59');

    // Retorna true se a data é posterior a hoje
    return $timestamp > $hoje;
}

/**
 * Verifica se uma data é hoje.
 *
 * @param string $data Data no formato 'YYYY-MM-DD' ou 'YYYY-MM-DDTHH:mm'
 * @return bool true se a data é hoje, false caso contrário
 *
 * @example dataEhHoje('2025-11-11') // true (se hoje for 11/11/2025)
 * @example dataEhHoje('2025-11-10') // false
 */
function dataEhHoje($data)
{
    if (empty($data)) {
        return false;
    }

    // Normaliza a data removendo 'T' se presente
    $data = str_replace('T', ' ', $data);

    // Converte para timestamp
    $timestamp = strtotime($data);

    if ($timestamp === false) {
        return false;
    }

    // Compara apenas a parte da data (YYYY-MM-DD)
    $dataFormatada = date('Y-m-d', $timestamp);
    $hoje = date('Y-m-d');

    return $dataFormatada === $hoje;
}

/**
 * Calcula a diferença em dias entre duas datas.
 *
 * @param string $dataInicio Data inicial no formato 'YYYY-MM-DD' ou 'YYYY-MM-DDTHH:mm'
 * @param string $dataFim Data final no formato 'YYYY-MM-DD' ou 'YYYY-MM-DDTHH:mm'
 * @return int|false Diferença em dias ou false se inválido
 *
 * @example calcularDiasEntreDatas('2025-11-01', '2025-11-11') // 10
 */
function calcularDiasEntreDatas($dataInicio, $dataFim)
{
    $dataInicio = str_replace('T', ' ', $dataInicio);
    $dataFim = str_replace('T', ' ', $dataFim);

    $tsInicio = strtotime($dataInicio);
    $tsFim = strtotime($dataFim);

    if ($tsInicio === false || $tsFim === false) {
        return false;
    }

    $diferenca = $tsFim - $tsInicio;

    // Retorna a diferença em dias (arredonda para cima)
    return ceil($diferenca / (60 * 60 * 24));
}

/**
 * Verifica se uma tarefa está atrasada.
 *
 * @param string $dataFim Data de término da tarefa
 * @param string $status Status atual da tarefa (ex: 'concluida', 'iniciada')
 * @return bool true se atrasada, false caso contrário
 *
 * @example tarefaEstaAtrasada('2025-11-01', 'iniciada') // true (se data passou)
 * @example tarefaEstaAtrasada('2025-11-01', 'concluida') // false (concluída não é atrasada)
 */
function tarefaEstaAtrasada($dataFim, $status = '')
{
    // Não está atrasada se já foi concluída
    if ($status === 'concluida' || $status === 'excluida') {
        return false;
    }

    if (empty($dataFim)) {
        return false;
    }

    $dataFim = str_replace('T', ' ', $dataFim);
    $tsFim = strtotime($dataFim);

    if ($tsFim === false) {
        return false;
    }

    // Compara com agora
    return $tsFim < time();
}

// ============================================================================
// SEÇÃO 7: FUNÇÕES DE FORMATAÇÃO
// ============================================================================

/**
 * Formata uma data para exibição
 *
 * Converte uma data do formato de banco de dados (Y-m-d) para um formato
 * mais amigável de exibição. Suporta qualquer formato aceito por DateTime.
 *
 * @param string $data Data no formato de banco (Y-m-d H:i:s ou Y-m-d)
 * @param string $formato Formato de saída desejado (padrão: 'd/m/Y')
 * @return string Data formatada
 * @throws Exception Se a data for inválida
 *
 * @example formatar_data('2024-12-31') // '31/12/2024'
 * @example formatar_data('2024-12-31 14:30:00', 'd/m/Y H:i') // '31/12/2024 14:30'
 */
function formatar_data($data, $formato = 'd/m/Y') {
    $date = new DateTime($data);
    return $date->format($formato);
}

/**
 * Formata tamanho de arquivo em bytes para formato legível
 *
 * Converte um valor em bytes para a unidade mais apropriada (Bytes, KB, MB, GB).
 * Útil para exibir tamanhos de arquivos anexados em tarefas e projetos.
 *
 * @param int $bytes Tamanho em bytes
 * @return string Tamanho formatado com unidade apropriada
 *
 * @example formatarTamanhoArquivo(1024) // '1 KB'
 * @example formatarTamanhoArquivo(1536) // '1.5 KB'
 * @example formatarTamanhoArquivo(1048576) // '1 MB'
 * @example formatarTamanhoArquivo(0) // '0 Bytes'
 */
function formatarTamanhoArquivo($bytes) {
    // Caso especial: zero bytes
    if ($bytes == 0) return "0 Bytes";

    // Constantes
    $k = 1024;
    $sizes = ["Bytes", "KB", "MB", "GB"];

    // Calcula o índice da unidade apropriada
    $i = floor(log($bytes) / log($k));

    // Formata e retorna o valor com 2 casas decimais
    return round($bytes / pow($k, $i), 2) . " " . $sizes[$i];
}

// ============================================================================
// SEÇÃO 8: GERENCIAMENTO DE LINKS
// ============================================================================

/**
 * Obtém todos os links de uma tarefa
 *
 * Retorna a lista completa de links associados a uma tarefa,
 * incluindo informações do usuário que adicionou cada link.
 *
 * @param PDO $pdo Conexão PDO com o banco de dados
 * @param int $tarefa_id ID da tarefa
 * @return array Array de links com dados do usuário
 * @throws PDOException Em caso de erro na consulta
 */
function obter_links_tarefa($pdo, $tarefa_id) {
    $stmt = $pdo->prepare("
        SELECT l.id, l.titulo, l.url, l.data_criacao,
               l.usuario_id, u.nome as usuario_nome
        FROM tarefas_links l
        LEFT JOIN usuarios u ON l.usuario_id = u.id
        WHERE l.tarefa_id = ?
        ORDER BY l.data_criacao DESC
    ");
    $stmt->execute([$tarefa_id]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// ============================================================================
// FIM DO ARQUIVO
// ============================================================================
?>