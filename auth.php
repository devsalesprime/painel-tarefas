<?php
// ========== SISTEMA DE AUTENTICAÇÃO - PHP ORIENTADO A OBJETOS ==========

// 1. Carregar dependências
require_once 'config.php';
require_once 'helpers.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

// ========== CONFIGURAÇÕES DE EMAIL (do .env) ==========
if (!defined('SMTP_HOST')) {
    define('SMTP_HOST', $_ENV['SMTP_HOST'] ?? 'smtp.gmail.com');
}
if (!defined('SMTP_PORT')) {
    define('SMTP_PORT', (int)($_ENV['SMTP_PORT'] ?? 587));
}
if (!defined('SMTP_USERNAME')) {
    define('SMTP_USERNAME', $_ENV['SMTP_USERNAME'] ?? '');
}
if (!defined('SMTP_PASSWORD')) {
    define('SMTP_PASSWORD', $_ENV['SMTP_PASSWORD'] ?? '');
}
if (!defined('SMTP_FROM_EMAIL')) {
    define('SMTP_FROM_EMAIL', $_ENV['SMTP_FROM_EMAIL'] ?? 'noreply@localhost');
}
if (!defined('SMTP_FROM_NAME')) {
    define('SMTP_FROM_NAME', $_ENV['SMTP_FROM_NAME'] ?? 'Sistema de Tarefas');
}

// 2.1 Classe para manipulação de JWT
class JwtHelper {
    public static function gerarToken($usuario_id, $email) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'user_id' => $usuario_id,
            'email' => $email,
            'iat' => time(),
            'exp' => time() + (7 * 24 * 60 * 60)
        ]);
        $headerEncoded = self::base64url_encode($header);
        $payloadEncoded = self::base64url_encode($payload);
        $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, JWT_SECRET, true);
        $signatureEncoded = self::base64url_encode($signature);
        return $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
    }

    public static function verificarToken($token) {
        if (!$token) return false;
        $parts = explode('.', $token);
        if (count($parts) !== 3) return false;
        $header = base64_decode(strtr($parts[0], '-_', '+/'));
        $payload = base64_decode(strtr($parts[1], '-_', '+/'));
        $signature = $parts[2];
        $expectedSignature = self::base64url_encode(hash_hmac('sha256', $parts[0] . "." . $parts[1], JWT_SECRET, true));
        if (!hash_equals($signature, $expectedSignature)) return false;
        $payloadData = json_decode($payload, true);
        if ($payloadData['exp'] < time()) return false;
        return $payloadData;
    }

    private static function base64url_encode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}

// 2.2 Classe para manipulação de senha
class PasswordHelper {
    public static function hash($senha) {
        return password_hash($senha, PASSWORD_DEFAULT);
    }
    public static function verificar($senha, $hash) {
        return password_verify($senha, $hash);
    }
}

// 2.3 Classe para recuperação de senha
class PasswordRecoveryHelper {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function gerarTokenRecuperacao($email) {
        $token = bin2hex(random_bytes(32));
        $expiracao = date('Y-m-d H:i:s', strtotime('+30 minutes'));
        
        $stmt = $this->pdo->prepare("UPDATE usuarios SET token_recuperacao = ?, token_expiracao = ? WHERE email = ?");
        $stmt->execute([$token, $expiracao, $email]);
        
        return $token;
    }
    
    public function verificarTokenRecuperacao($token) {
        $stmt = $this->pdo->prepare("SELECT id, email, token_expiracao FROM usuarios WHERE token_recuperacao = ?");
        $stmt->execute([$token]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$usuario) {
            return false;
        }
        
        if (strtotime($usuario['token_expiracao']) < time()) {
            return false;
        }
        
        return $usuario;
    }
    
    public function limparTokenRecuperacao($usuario_id) {
        $stmt = $this->pdo->prepare("UPDATE usuarios SET token_recuperacao = NULL, token_expiracao = NULL WHERE id = ?");
        $stmt->execute([$usuario_id]);
    }
}

// 2.4 Classe para envio de email usando PHPMailer
class EmailHelper {
    public static function enviarEmailRecuperacao($email, $token, $nome_usuario = '') {
        error_log("🔵 [EMAIL] Iniciando envio para: {$email}");
        
        try {
            $mail = new PHPMailer(true);
            
            // Configurações do servidor SMTP
            $mail->isSMTP();
            $mail->Host = SMTP_HOST;
            $mail->SMTPAuth = true;
            $mail->Username = SMTP_USERNAME;
            $mail->Password = SMTP_PASSWORD;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = SMTP_PORT;
            $mail->CharSet = 'UTF-8';
            
            // 🔧 IMPORTANTE: Desabilitar verificação SSL em ambientes de desenvolvimento
            // REMOVA EM PRODUÇÃO se o certificado estiver configurado
            $mail->SMTPOptions = array(
                'ssl' => array(
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                )
            );
            
            error_log("🔵 [EMAIL] Configurações SMTP definidas");
            
            // Remetente e destinatário
            $mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
            $mail->addAddress($email);
            $mail->addReplyTo(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
            
            error_log("🔵 [EMAIL] Remetente e destinatário configurados");
            
            // Conteúdo do email
            $link = "https://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . "/esqueceu-senha.html?token=" . $token;
            
            error_log("🔵 [EMAIL] Link de recuperação: {$link}");
            
            $mail->isHTML(true);
            $mail->Subject = 'Recuperação de Senha - Sales Prime';
            $mail->Body = self::getEmailTemplate($link, $nome_usuario);
            $mail->AltBody = "Olá {$nome_usuario}! Você solicitou a recuperação de sua senha. Acesse este link para redefinir: {$link} (Este link expira em 30 minutos)";
            
            error_log("🔵 [EMAIL] Conteúdo do email preparado");
            
            // Enviar email
            $result = $mail->send();
            
            if ($result) {
                error_log("✅ [EMAIL] Email enviado com sucesso para: {$email}");
                return true;
            } else {
                error_log("❌ [EMAIL] Falha ao enviar (sem exception): " . $mail->ErrorInfo);
                return false;
            }
            
        } catch (Exception $e) {
            error_log("❌ [EMAIL] Exception ao enviar email: " . $e->getMessage());
            error_log("❌ [EMAIL] PHPMailer ErrorInfo: " . (isset($mail) ? $mail->ErrorInfo : 'N/A'));
            error_log("❌ [EMAIL] Stack trace: " . $e->getTraceAsString());
            return false;
        }
    }
    
    private static function getEmailTemplate($link, $nome_usuario = '') {
        $saudacao = !empty($nome_usuario) ? "Olá, <strong>{$nome_usuario}</strong>!" : "Olá!";
        
        return "
        <!DOCTYPE html>
        <html lang='pt-BR'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background-color: #f4f4f4;
                    padding: 20px;
                }
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .header { 
                    background: linear-gradient(135deg, #21808d 0%, #3d4e73 100%);
                    color: white; 
                    padding: 40px 30px;
                    text-align: center;
                }
                .header h1 {
                    font-size: 28px;
                    margin-bottom: 10px;
                }
                .content { 
                    padding: 40px 30px;
                    line-height: 1.6;
                    color: #333;
                }
                .content h2 {
                    color: #21808d;
                    margin-bottom: 20px;
                }
                .button { 
                    display: inline-block;
                    background: linear-gradient(135deg, #21808d 0%, #3d4e73 100%);
                    color: white !important;
                    padding: 16px 32px;
                    text-decoration: none;
                    border-radius: 8px;
                    margin: 20px 0;
                    font-weight: 600;
                    text-align: center;
                }
                .button:hover {
                    opacity: 0.9;
                }
                .link-box {
                    background: #f9f9f9;
                    padding: 15px;
                    border-radius: 6px;
                    word-break: break-all;
                    margin: 20px 0;
                    font-size: 12px;
                    color: #666;
                }
                .warning {
                    background: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }
                .footer { 
                    padding: 30px;
                    text-align: center;
                    color: #666;
                    background: #f9f9f9;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>🔒 Sales Prime</h1>
                    <p>Sistema de Tarefas</p>
                </div>
                <div class='content'>
                    <h2>Recuperação de Senha</h2>
                    <p>{$saudacao}</p>
                    <p>Você solicitou a recuperação de sua senha. Clique no botão abaixo para redefinir:</p>
                    
                    <div style='text-align: center;'>
                        <a href='{$link}' class='button'>Redefinir Minha Senha</a>
                    </div>
                    
                    <p>Ou copie e cole este link em seu navegador:</p>
                    <div class='link-box'>{$link}</div>
                    
                    <div class='warning'>
                        <strong>⚠️ Atenção:</strong> Este link expira em 30 minutos por motivos de segurança.
                    </div>
                    
                    <p><small>Se você não solicitou esta recuperação, ignore este email e sua senha permanecerá inalterada.</small></p>
                </div>
                <div class='footer'>
                    <p><strong>Sales Prime</strong></p>
                    <p>R. Castilho, 392 - 8º Andar | Sala 2 - Brooklin, São Paulo - SP</p>
                    <p>&copy; " . date('Y') . " Todos os direitos reservados.</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }
}

// 3. Classe principal de autenticação
class AuthController {
    private $pdo;
    private $passwordRecovery;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->passwordRecovery = new PasswordRecoveryHelper($pdo);
    }

    public function login($email, $senha) {
        $email = sanitizar($email);
        if (empty($email) || empty($senha)) {
            $this->erro('Email e senha são obrigatórios.');
        }
        if (!validar_email($email)) {
            $this->erro('Email inválido.');
        }
        
        $stmt = $this->pdo->prepare("SELECT id, nome, email, senha, funcao, ativo FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$usuario || !PasswordHelper::verificar($senha, $usuario['senha'])) {
            $this->erro('Credenciais inválidas.');
        }
        
        if (!$usuario['ativo']) {
            $this->erro('Conta pendente de aprovação. Aguarde a liberação do administrador.');
        }
        
        unset($usuario['senha']);
        $token = JwtHelper::gerarToken($usuario['id'], $usuario['email']);
        registrar_log("Login realizado: {$usuario['email']}", 'INFO');
        $this->sucesso([
            'token' => $token,
            'usuario' => $usuario,
            'mensagem' => 'Login realizado com sucesso!'
        ]);
    }

    public function register($nome, $email, $senha) {
        $nome = sanitizar($nome);
        $email = sanitizar($email);
        if (empty($nome) || empty($email) || empty($senha)) {
            $this->erro('Todos os campos são obrigatórios.');
        }
        if (strlen($nome) < 2) {
            $this->erro('Nome deve ter pelo menos 2 caracteres.');
        }
        if (!validar_email($email)) {
            $this->erro('Email inválido.');
        }
        if (strlen($senha) < 6) {
            $this->erro('Senha deve ter pelo menos 6 caracteres.');
        }
        $stmt = $this->pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $this->erro('Este email já está cadastrado.');
        }
        $username = strtolower(str_replace(' ', '', $nome));
        $username_base = $username;
        $contador = 1;
        while (true) {
            $stmt = $this->pdo->prepare("SELECT id FROM usuarios WHERE username = ?");
            $stmt->execute([$username]);
            if (!$stmt->fetch()) break;
            $username = $username_base . $contador;
            $contador++;
        }
        $senhaHash = PasswordHelper::hash($senha);
        
        $stmt = $this->pdo->prepare("
            INSERT INTO usuarios (nome, email, username, senha, funcao, ativo) 
            VALUES (?, ?, ?, ?, 'usuario', 0)
        ");
        $stmt->execute([$nome, $email, $username, $senhaHash]);
        $usuario_id = $this->pdo->lastInsertId();
        registrar_log("Novo usuário cadastrado: {$email} (pendente de aprovação)", 'INFO');
        $this->sucesso([
            'id' => $usuario_id,
            'mensagem' => 'Conta criada com sucesso! Aguarde aprovação do administrador.'
        ]);
    }

    public function solicitarRecuperacaoSenha($email) {
        error_log("🔵 [AUTH] Iniciando solicitação de recuperação para: {$email}");
        
        $email = sanitizar($email);
        
        if (empty($email)) {
            error_log("❌ [AUTH] Email vazio");
            $this->erro('Email é obrigatório.');
        }
        
        if (!validar_email($email)) {
            error_log("❌ [AUTH] Email inválido: {$email}");
            $this->erro('Email inválido.');
        }
        
        error_log("🔵 [AUTH] Buscando usuário no banco de dados...");
        $stmt = $this->pdo->prepare("SELECT id, nome, ativo FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$usuario) {
            error_log("⚠️ [AUTH] Usuário não encontrado para: {$email}");
            // Por segurança, retorna sucesso mesmo que não exista
            $this->sucesso(['mensagem' => 'Se o email existir em nosso sistema, você receberá um link de recuperação. Verifique sua caixa de entrada e a pasta de spam.']);
            return;
        }
        
        error_log("✅ [AUTH] Usuário encontrado: ID {$usuario['id']}, Nome: {$usuario['nome']}");
        
        if (!$usuario['ativo']) {
            error_log("❌ [AUTH] Conta desativada para: {$email}");
            $this->erro('Esta conta está desativada.');
        }
        
        error_log("🔵 [AUTH] Gerando token de recuperação...");
        $token = $this->passwordRecovery->gerarTokenRecuperacao($email);
        error_log("✅ [AUTH] Token gerado: " . substr($token, 0, 10) . "...");
        
        error_log("🔵 [AUTH] Tentando enviar email...");
        $emailEnviado = EmailHelper::enviarEmailRecuperacao($email, $token, $usuario['nome']);
        
        if ($emailEnviado) {
            error_log("✅ [AUTH] Email enviado com sucesso!");
            registrar_log("Solicitação de recuperação de senha: {$email}", 'INFO');
            $this->sucesso(['mensagem' => 'Email de recuperação enviado com sucesso! Verifique sua caixa de entrada e a pasta de spam.']);
        } else {
            error_log("❌ [AUTH] Falha ao enviar email");
            $this->erro('Erro ao enviar email de recuperação. Tente novamente ou entre em contato com o suporte.');
        }
    }

    public function redefinirSenha($token, $novaSenha) {
        if (empty($token) || empty($novaSenha)) {
            $this->erro('Token e nova senha são obrigatórios.');
        }
        
        if (strlen($novaSenha) < 6) {
            $this->erro('A senha deve ter pelo menos 6 caracteres.');
        }
        
        $usuario = $this->passwordRecovery->verificarTokenRecuperacao($token);
        
        if (!$usuario) {
            $this->erro('Token inválido ou expirado.');
        }
        
        $senhaHash = PasswordHelper::hash($novaSenha);
        
        $stmt = $this->pdo->prepare("UPDATE usuarios SET senha = ?, token_recuperacao = NULL, token_expiracao = NULL WHERE id = ?");
        $stmt->execute([$senhaHash, $usuario['id']]);
        
        $this->passwordRecovery->limparTokenRecuperacao($usuario['id']);
        
        registrar_log("Senha redefinida via recuperação: {$usuario['email']}", 'INFO');
        $this->sucesso(['mensagem' => 'Senha redefinida com sucesso!']);
    }

    private function erro($mensagem, $codigo = 400) {
        error_log("❌ [AUTH] Erro: {$mensagem}");
        http_response_code($codigo);
        echo json_encode(['sucesso' => false, 'erro' => $mensagem]);
        exit();
    }
    
    private function sucesso($dados = null) {
        error_log("✅ [AUTH] Sucesso: " . json_encode($dados));
        echo json_encode(['sucesso' => true, 'dados' => $dados]);
        exit();
    }
}

// 4. Headers para API
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 5. Processar requisição
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? $_POST['action'] ?? $_GET['action'] ?? '';

error_log("🔵 [AUTH] Ação recebida: {$action}");

try {
    $auth = new AuthController($pdo);
    switch ($action) {
        case 'login':
            $auth->login($input['email'] ?? '', $input['senha'] ?? '');
            break;
        case 'register':
            $auth->register($input['nome'] ?? '', $input['email'] ?? '', $input['senha'] ?? '');
            break;
        case 'solicitar_recuperacao_senha':
            $auth->solicitarRecuperacaoSenha($input['email'] ?? '');
            break;
        case 'redefinir_senha':
            $auth->redefinirSenha($input['token'] ?? '', $input['nova_senha'] ?? '');
            break;
        default:
            error_log("❌ [AUTH] Ação não encontrada: {$action}");
            http_response_code(404);
            echo json_encode(['sucesso' => false, 'erro' => 'Ação não encontrada.']);
    }
} catch (PDOException $e) {
    error_log('❌ [AUTH] Erro de banco: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'erro' => 'Erro interno do servidor.']);
} catch (Exception $e) {
    error_log('❌ [AUTH] Erro geral: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'erro' => 'Erro interno do servidor.']);
}
?>