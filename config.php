<?php
// ========== CONFIGURAÇÃO ATUALIZADA PARA AUTENTICAÇÃO ==========

// Carregar variáveis de ambiente do arquivo .env
require_once __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;

// Carregar .env
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Validar variáveis obrigatórias
$dotenv->required(['DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET'])->notEmpty();

// Configurações do banco de dados
define('DB_HOST', $_ENV['DB_HOST']);
define('DB_NAME', $_ENV['DB_NAME']);
define('DB_USER', $_ENV['DB_USER']);
define('DB_PASS', $_ENV['DB_PASS'] ?? '');

// Configurações de fuso horário
define('TIME_ZONE', $_ENV['TIME_ZONE'] ?? 'America/Sao_Paulo');

// Configurações de autenticação JWT
define('JWT_SECRET', $_ENV['JWT_SECRET'] . hash('sha256', __DIR__));

// Configurações de e-mail (para recuperação de senha)
define('EMAIL_FROM', $_ENV['SMTP_FROM_EMAIL'] ?? 'noreply@localhost');
define('EMAIL_FROM_NAME', $_ENV['SMTP_FROM_NAME'] ?? 'Sistema de Tarefas');

// Configurações de sessão
define('SESSION_LIFETIME', (int)($_ENV['SESSION_LIFETIME'] ?? 7 * 24 * 60 * 60)); // 7 dias em segundos

// Configurações de upload
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('MAX_FILE_SIZE', (int)($_ENV['MAX_FILE_SIZE'] ?? 5 * 1024 * 1024)); // 5MB
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'xlsx', 'xls']);

ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__.'/php-error.log');
error_reporting(E_ALL);
// ========== CONEXÃO COM O BANCO DE DADOS ==========

try {
    // Opções PDO
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
    ];

    // Criar conexão PDO
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

} catch (PDOException $e) {
    // Erro na conexão
    http_response_code(500);
    die(json_encode([
        'sucesso' => false,
        'erro' => 'Erro na conexão com o banco de dados',
        'mensagem' => $e->getMessage(),
        'arquivo' => $e->getFile(),
        'linha' => $e->getLine()
    ]));
}

// ========== FUNÇÕES AUXILIARES ==========
require_once __DIR__ . '/helpers.php';

// ========== CONFIGURAÇÕES DE ERRO ==========
// Modo desenvolvimento/produção
define('AMBIENTE', $_ENV['AMBIENTE'] ?? 'desenvolvimento'); // Mude para 'producao' em produção

if (AMBIENTE === 'desenvolvimento') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
}

// Definir fuso horário
date_default_timezone_set(TIME_ZONE);

// Função para registrar logs

// ========== FUNÇÕES BÁSICAS DO SISTEMA ==========

function validar_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function sanitizar($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

function registrar_log($mensagem, $nivel = 'INFO', $usuario_id = null) {
    global $pdo;
    
    try {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        
        $stmt = $pdo->prepare("
            INSERT INTO sistema_logs (usuario_id, acao, detalhes, ip_address, user_agent) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$usuario_id, $nivel, $mensagem, $ip, $user_agent]);
    } catch (Exception $e) {
        // Falha silenciosa para não quebrar a aplicação
        error_log("Erro ao registrar log: " . $e->getMessage());
    }
}
// Handler de erros
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    $erro = "Erro: $errstr em $errfile:$errline";
    registrar_log($erro, 'ERROR');
    
    if (AMBIENTE === 'desenvolvimento') {
        echo json_encode(['sucesso' => false, 'erro' => $erro]);
    } else {
        echo json_encode(['sucesso' => false, 'erro' => 'Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.']);
    }
});

// Handler de exceções não capturadas
set_exception_handler(function($exception) {
    $erro = "Exceção: " . $exception->getMessage();
    registrar_log($erro, 'EXCEPTION');
    
    if (AMBIENTE === 'desenvolvimento') {
        echo json_encode(['sucesso' => false, 'erro' => $erro]);
    } else {
        echo json_encode(['sucesso' => false, 'erro' => 'Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.']);
    }
});

// Verificar se diretório de upload existe
if (!is_dir(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}
?>