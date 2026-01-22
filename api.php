<?php
// =============================================================================
// API DE GERENCIAMENTO DE PROJETOS E TAREFAS (RESTful) - REFATORADO
// =============================================================================
/**
 * Sistema completo para gerenciamento de projetos, tarefas, usuários e relatórios.
 * Utiliza autenticação JWT (JSON Web Token) e arquitetura RESTful modular.
 * 
 * Dependências:
 * - config.php: Configurações de banco de dados (PDO), constantes (JWT_SECRET, MAX_FILE_SIZE, ALLOWED_EXTENSIONS, UPLOAD_DIR).
 * - helpers.php: Funções auxiliares como sanitização de dados, cálculo de progresso, etc. (Incluído por config.php).
 * - include/api_*.php: Módulos organizados por função
 */
// =============================================================================

// Inicia o buffer de saída para evitar problemas com headers enviados após conteúdo
ob_start();

// =================== [1] CONFIGURAÇÃO DE HEADERS E CORS ===================

// Define o tipo de conteúdo como JSON e codificação UTF-8
header('Content-Type: application/json; charset=utf-8');

// Configuração de CORS (Cross-Origin Resource Sharing) para permitir requisições de qualquer origem
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Trata requisições preflight do CORS (método OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// =================== [2] INCLUSÃO DE DEPENDÊNCIAS ===================

// Inclui arquivo de configuração (conexão PDO, constantes)
require_once 'config.php';

// Inclui módulos da API organizados por função
require_once 'include/api_response.php';
require_once 'include/api_auth.php';
require_once 'include/api_usuarios.php';
require_once 'include/api_projetos.php';
require_once 'include/api_tarefas.php';
require_once 'include/api_etapas.php';
require_once 'include/api_arquivos.php';
require_once 'include/api_comentarios.php';
require_once 'include/api_links.php';
require_once 'include/api_relatorios.php';

// =================== [3] OBTENÇÃO DA AÇÃO SOLICITADA ===================

// Lê php://input uma única vez no início
$rawInput = file_get_contents('php://input');
$inputData = json_decode($rawInput, true) ?: [];

// Determina qual ação deve ser executada
$action = $_GET['action'] ?? $_POST['action'] ?? $inputData['action'] ?? '';

if (empty($action)) {
    erro('Ação não especificada', 400);
}

// =================== [4] ROTEAMENTO E EXECUÇÃO DAS AÇÕES ===================

try {
    // Define ações públicas que não requerem autenticação JWT
    $publicActions = ['login', 'register', 'verify_token'];
    $tokenData = null;

    // Verifica autenticação para ações não públicas
    if (!in_array($action, $publicActions)) {
        $tokenData = verificarToken();
    }

    // Roteamento modular baseado na ação solicitada
    switch ($action) {
        // =================================================================
        // AUTENTICAÇÃO E USUÁRIOS
        // =================================================================
        case 'login':
            handle_login($pdo, $inputData);
            break;
        case 'register':
            handle_register($pdo, $inputData);
            break;
        case 'verify_token':
            sucesso(['valido' => true, 'dados' => $tokenData, 'mensagem' => 'Token válido.']);
            break;
        case 'obter_usuarios':
            handle_obter_usuarios($pdo);
            break;
        case 'obter_usuarios_admin':
            handle_obter_usuarios_admin($pdo, $tokenData);
            break;
        case 'atualizar_usuario_admin':
            handle_atualizar_usuario_admin($pdo, $inputData, $tokenData);
            break;
        case 'deletar_usuario_admin':
            handle_deletar_usuario_admin($pdo, $inputData, $tokenData);
            break;
        case 'buscar_usuarios':
            handle_buscar_usuarios($pdo);
            break;
        case 'editar_perfil':
            handle_editar_perfil($pdo, $inputData, $tokenData);
            break;

        // =================================================================
        // PROJETOS
        // =================================================================
        case 'obter_projetos':
            handle_obter_projetos($pdo, $tokenData);
            break;
        case 'obter_projeto':
            handle_obter_projeto($pdo);
            break;
        case 'criar_projeto':
            handle_criar_projeto($pdo, $inputData, $tokenData);
            break;
        case 'criar_projeto_rapido':
            handle_criar_projeto_rapido($pdo, $inputData, $tokenData);
            break;
        case 'atualizar_projeto':
            handle_atualizar_projeto($pdo, $inputData, $tokenData);
            break;
        case 'deletar_projeto':
            handle_deletar_projeto($pdo, $inputData, $tokenData);
            break;
        case 'concluir_projeto':
            handle_concluir_projeto($pdo, $inputData, $tokenData);
            break;
        case 'reabrir_projeto':
            handle_reabrir_projeto($pdo, $inputData, $tokenData);
            break;
        case 'excluir_projeto_definitivamente':
            handle_excluir_projeto_definitivamente($pdo, $inputData, $tokenData);
            break;
        case 'obter_projetos_finalizados':
            handle_obter_projetos_finalizados($pdo, $tokenData);
            break;
        case 'obter_detalhes_projeto_arquivado':
            handle_obter_detalhes_projeto_arquivado($pdo, $tokenData);
            break;

        // =================================================================
        // TAREFAS
        // =================================================================
        case 'obter_tarefas':
            handle_obter_tarefas($pdo, $tokenData);
            break;
        case 'obter_tarefa':
            handle_obter_tarefa($pdo);
            break;
        case 'criar_tarefa':
            handle_criar_tarefa($pdo, $inputData, $tokenData);
            break;
        case 'editar_tarefa':
        case 'atualizar_tarefa':
            handle_editar_tarefa($pdo, $inputData, $tokenData);
            break;
        case 'pausar_tarefa':
            handle_pausar_tarefa($pdo, $inputData);
            break;
        case 'iniciar_tarefa':
            handle_iniciar_tarefa($pdo, $inputData);
            break;
        case 'concluir_tarefa':
            handle_concluir_tarefa($pdo, $inputData);
            break;
        case 'reabrir_tarefa':
            handle_reabrir_tarefa($pdo, $inputData);
            break;
        case 'deletar_tarefa':
            handle_deletar_tarefa($pdo, $inputData, $tokenData);
            break;
        case 'adicionar_usuario_tarefa':
            handle_adicionar_usuario_tarefa($pdo, $inputData, $tokenData);
            break;
        case 'remover_usuario_tarefa':
            handle_remover_usuario_tarefa($pdo, $inputData, $tokenData);
            break;

        // =================================================================
        // ETAPAS (CHECKLIST)
        // =================================================================
        case 'criar_etapa':
        case 'adicionaretapa':
            handle_criar_etapa($pdo, $inputData);
            break;
        case 'concluir_etapa':
            handle_concluir_etapa($pdo, $inputData);
            break;
        case 'reabrir_etapa':
            handle_reabrir_etapa($pdo, $inputData);
            break;
        case 'atualizar_etapa':
        case 'atualizaretapa':
            handle_atualizar_etapa($pdo, $inputData);
            break;
        case 'deletar_etapa':
        case 'deletaretapa':
            handle_deletar_etapa($pdo, $inputData);
            break;

        // =================================================================
        // ARQUIVOS
        // =================================================================
        case 'upload_arquivo':
            handle_upload_arquivo($pdo, $tokenData);
            break;
        case 'obter_arquivos_tarefa':
        case 'obter_arquivos':
            handle_obter_arquivos($pdo);
            break;
        case 'download_arquivo':
            handle_download_arquivo($pdo);
            break;
        case 'deletar_arquivo':
            handle_deletar_arquivo($pdo, $inputData);
            break;

        // =================================================================
        // COMENTÁRIOS
        // =================================================================
        case 'adicionar_comentario':
            handle_adicionar_comentario($pdo, $inputData, $tokenData);
            break;
        case 'obter_comentarios_tarefa':
        case 'obter_comentarios':
            handle_obter_comentarios($pdo);
            break;
        case 'deletar_comentario':
            handle_deletar_comentario($pdo, $inputData, $tokenData);
            break;

        // =================================================================
        // LINKS
        // =================================================================
        case 'adicionar_link':
            handle_adicionar_link($pdo, $inputData, $tokenData);
            break;
        case 'obter_links':
            handle_obter_links($pdo);
            break;
        case 'deletar_link':
            handle_deletar_link($pdo, $inputData);
            break;

        // =================================================================
        // RELATÓRIOS
        // =================================================================
        case 'relatorio_geral':
            handle_relatorio_geral($pdo, $tokenData);
            break;
        case 'relatorio_tarefas_atrasadas':
            handle_relatorio_tarefas_atrasadas($pdo, $tokenData);
            break;
        case 'relatorio_tarefas_pausadas':
            handle_relatorio_tarefas_pausadas($pdo, $tokenData);
            break;
        case 'relatorio_por_projeto':
            handle_relatorio_por_projeto($pdo, $tokenData);
            break;
        case 'relatorio_por_usuario':
            handle_relatorio_por_usuario($pdo, $tokenData);
            break;

        // =================================================================
        // AÇÃO NÃO ENCONTRADA
        // =================================================================
        default:
            erro('Ação desconhecida: ' . $action, 404);
            break;
    }
} catch (Exception $e) {
    // Captura exceções gerais
    if (function_exists('registrar_log')) {
        registrar_log("Erro na API: " . $e->getMessage(), 'ERROR');
    }
    erro('Erro interno do servidor: ' . $e->getMessage(), 500);
}

// Encerra o buffer de saída no final do script
ob_end_flush();
