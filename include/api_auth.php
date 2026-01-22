<?php
/**
 * Funções de Autenticação JWT
 * 
 * Implementa autenticação baseada em JSON Web Tokens (JWT)
 * para proteger os endpoints da API.
 */

/**
 * Extrai o token JWT do header Authorization.
 *
 * @return string|null Token JWT (sem o prefixo 'Bearer ') ou null se não encontrado
 */
function obterToken()
{
    // Obtém todos os headers da requisição
    $headers = getallheaders();
    // Busca o header 'Authorization' (case-insensitive)
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    // Verifica se o header começa com 'Bearer '
    if (strpos($authHeader, 'Bearer ') === 0) {
        // Retorna o token removendo o prefixo 'Bearer '
        return trim(substr($authHeader, 7));
    }
    return null;
}

/**
 * Gera um token JWT simples (sem biblioteca externa).
 * NOTA: Esta implementação é básica e deve ser substituída por uma biblioteca robusta (ex: firebase/php-jwt) em produção.
 *
 * @param int $user_id ID do usuário
 * @param string $email Email do usuário
 * @return string Token JWT
 */
function gerarTokenJWT($user_id, $email)
{
    // A constante JWT_SECRET deve ser definida em 'config.php'
    if (!defined('JWT_SECRET')) {
        erro('Chave secreta JWT não definida.', 500);
    }

    // 1. Header: Tipo de token e algoritmo de assinatura
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);

    // 2. Payload: Dados do usuário e claims (iat, exp)
    $payload = json_encode([
        'user_id' => $user_id,
        'email' => $email,
        'iat' => time(), // Data de emissão (Issued At)
        'exp' => time() + (7 * 24 * 60 * 60) // Expira em 7 dias
    ]);

    // Codifica header e payload (URL-safe Base64)
    $headerEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $payloadEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

    // 3. Assinatura: Hash HMAC SHA256 do header.payload com a chave secreta
    $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, JWT_SECRET, true);
    $signatureEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    // Retorna o token completo: header.payload.signature
    return trim($headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded);
}

/**
 * Verifica a validade do token JWT e retorna os dados do payload.
 *
 * @return array Dados do payload do token
 */
function verificarToken()
{
    // A constante JWT_SECRET deve ser definida em 'config.php'
    if (!defined('JWT_SECRET')) {
        erro('Chave secreta JWT não definida.', 500);
    }

    $token = obterToken();
    if (!$token) {
        erro('Token não encontrado', 401);
    }

    // Verifica estrutura do token (3 partes: header.payload.signature)
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        erro('Token com formato inválido', 401);
    }

    $headerEncoded = $parts[0];
    $payloadEncoded = $parts[1];
    $signatureEncoded = $parts[2];

    // 1. Recria a assinatura esperada
    $expectedSignature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, JWT_SECRET, true);
    $expectedSignatureEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($expectedSignature));

    // 2. Compara a assinatura recebida com a esperada (prevenção de ataques de manipulação)
    if ($signatureEncoded !== $expectedSignatureEncoded) {
        erro('Assinatura do token inválida', 401);
    }

    try {
        // 3. Decodifica o payload (URL-safe Base64)
        $payload = base64_decode(strtr($payloadEncoded, '-_', '+/'));
        $payloadData = json_decode($payload, true);

        if (!$payloadData) {
            erro('Payload do token inválido', 401);
        }

        // 4. Verifica expiração (claim 'exp')
        if (isset($payloadData['exp']) && $payloadData['exp'] < time()) {
            erro('Token expirado', 401);
        }

        return $payloadData;
    } catch (Exception $e) {
        // Captura erros de decodificação ou processamento
        erro('Erro ao verificar token', 401);
    }
}
