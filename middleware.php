<?php
// ========== MIDDLEWARE DE AUTENTICAÇÃO ==========

// Importa as configurações do banco de dados e outras configurações globais
require_once 'config.php';

/**
 * Verifica se o usuário está autenticado através de um token válido
 * 
 * @return array|false Dados do payload do token se autenticado, false caso contrário
 */
function verificarAutenticacao() {
    // Obtém o token de autenticação de várias fontes possíveis
    $token = obterToken();
    
    // Se não encontrou token, redireciona para o login
    if (!$token) {
        redirecionarParaLogin();
        return false;
    }
    
    // Verifica se o token é válido
    $tokenData = verificarTokenMiddleware($token);
    if (!$tokenData) {
        redirecionarParaLogin();
        return false;
    }
    
    return $tokenData;
}

/**
 * Obtém o token de autenticação de múltiplas fontes possíveis
 * 
 * @return string|null O token de autenticação ou null se não encontrado
 */
function obterToken() {
    // Tenta obter o token de parâmetros GET, POST ou cookies
    $token = $_GET['token'] ?? $_POST['token'] ?? $_COOKIE['auth_token'] ?? null;
    
    // Se não encontrou, tenta obter do header Authorization (formato Bearer)
    if (!$token) {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        if (strpos($authHeader, 'Bearer ') === 0) {
            $token = substr($authHeader, 7);
        }
    }
    
    return $token;
}

/**
 * Verifica a validade de um token JWT (implementação simplificada)
 * 
 * @param string $token Token JWT a ser verificado
 * @return array|false Dados do payload se válido, false caso contrário
 */
function verificarTokenMiddleware($token) {
    if (!$token) return false;
    
    // Divide o token nas três partes padrão JWT (header, payload, signature)
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    
    try {
        // Decodifica o payload (base64url)
        $payload = base64_decode(strtr($parts[1], '-_', '+/'));
        $payloadData = json_decode($payload, true);
        
        // Verifica se o token não expirou
        if ($payloadData['exp'] < time()) return false;
        
        return $payloadData;
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Redireciona o usuário para a página de login
 * 
 * @return void
 */
function redirecionarParaLogin() {
    // Evita redirecionamento quando executando em linha de comando (CLI)
    if (php_sapi_name() !== 'cli') {
        header('Location: login.html');
        exit();
    }
}

/**
 * Verifica se o usuário tem a permissão necessária com base em sua função
 * 
 * @param string $funcaoRequerida Função necessária para acessar o recurso
 * @param string|null $token Token de autenticação (opcional)
 * @return bool True se o usuário tem permissão, false caso contrário
 */
function verificarPermissao($funcaoRequerida, $token = null) {
    global $pdo;
    
    // Obtém o token se não foi fornecido
    if (!$token) {
        $token = obterToken();
    }
    
    // Verifica se o token é válido
    $tokenData = verificarTokenMiddleware($token);
    if (!$tokenData) return false;
    
    // Busca a função do usuário no banco de dados
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ? AND ativo = 1");
    $stmt->execute([$tokenData['user_id']]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$usuario) return false;
    
    // Define a hierarquia de permissões
    $hierarquia = [
        'usuario' => 1,
        'editor' => 2,
        'admin' => 3
    ];
    
    // Obtém o nível do usuário e o nível requerido
    $nivelUsuario = $hierarquia[$usuario['funcao']] ?? 0;
    $nivelRequerido = $hierarquia[$funcaoRequerida] ?? 999;
    
    // Verifica se o nível do usuário é suficiente
    return $nivelUsuario >= $nivelRequerido;
}

/**
 * Obtém os dados do usuário atualmente autenticado
 * 
 * @return array|null Dados do usuário se autenticado, null caso contrário
 */
function obterUsuarioLogado() {
    global $pdo;
    
    // Obtém e verifica o token
    $token = obterToken();
    $tokenData = verificarTokenMiddleware($token);
    
    if (!$tokenData) return null;
    
    // Busca os dados do usuário no banco
    $stmt = $pdo->prepare("SELECT id, nome, email, username, funcao FROM usuarios WHERE id = ? AND ativo = 1");
    $stmt->execute([$tokenData['user_id']]);
    
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

/**
 * Protege uma página, exigindo autenticação e permissões mínimas
 * 
 * @param string $funcaoMinima Função mínima necessária para acessar a página
 * @return array Dados do payload do token se autorizado
 */
function protegerPagina($funcaoMinima = 'usuario') {
    // Verifica se o usuário está autenticado
    $auth = verificarAutenticacao();
    
    if (!$auth) {
        http_response_code(401);
        echo json_encode(['erro' => 'Não autenticado']);
        exit();
    }
    
    // Verifica se o usuário tem a permissão necessária
    if (!verificarPermissao($funcaoMinima)) {
        http_response_code(403);
        echo json_encode(['erro' => 'Permissão insuficiente']);
        exit();
    }
    
    return $auth;
}

/**
 * Gera um script JavaScript para auxiliar na autenticação no frontend
 * 
 * @return string Código JavaScript para ser incluído nas páginas
 */
function gerarScriptAutenticacao() {
    return "
    <script>
    // Verifica se o usuário está autenticado no frontend
    function verificarAuth() {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }
    
    // Intercepta todas as requisições fetch para adicionar o token de autenticação
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const token = localStorage.getItem('auth_token');
        if (token && args[1]) {
            if (!args[1].headers) args[1].headers = {};
            args[1].headers['Authorization'] = 'Bearer ' + token;
        }
        return originalFetch.apply(this, args);
    };
    
    // Verifica a autenticação quando a página é carregada
    document.addEventListener('DOMContentLoaded', function() {
        verificarAuth();
    });
    </script>
    ";
}
?>