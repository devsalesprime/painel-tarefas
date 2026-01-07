<?php
// =============================================================================
// API DE GERENCIAMENTO DE PROJETOS E TAREFAS (RESTful)
// =============================================================================
/**
 * Sistema completo para gerenciamento de projetos, tarefas, usuários e relatórios.
 * Utiliza autenticação JWT (JSON Web Token) e arquitetura RESTful.
 * 
 * Dependências:
 * - config.php: Configurações de banco de dados (PDO), constantes (JWT_SECRET, MAX_FILE_SIZE, ALLOWED_EXTENSIONS, UPLOAD_DIR).
 * - helpers.php: Funções auxiliares como sanitização de dados, cálculo de progresso, etc. (Incluído por config.php).
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

// Inclui arquivo de configuração (conexão PDO, constantes).
// O arquivo config.php já inclui helpers.php e define funções essenciais.
require_once 'config.php';

// =================== [3] FUNÇÕES DE RESPOSTA PADRÃO DA API ===================

/**
 * Retorna uma resposta de erro em formato JSON e encerra a execução.
 *
 * @param string $mensagem Mensagem de erro detalhada
 * @param int $codigo Código HTTP de status (padrão: 400 Bad Request)
 */
function erro($mensagem, $codigo = 400)
{
    // Limpa qualquer buffer de saída anterior para garantir que apenas o JSON seja enviado
    ob_clean();
    http_response_code($codigo);
    echo json_encode(['sucesso' => false, 'erro' => $mensagem]);
    exit();
}

/**
 * Retorna uma resposta de sucesso em formato JSON e encerra a execução.
 *
 * @param mixed $dados Dados a serem retornados (opcional)
 */
function sucesso($dados = null)
{
    // Limpa qualquer buffer de saída anterior
    ob_clean();
    http_response_code(200);
    echo json_encode(['sucesso' => true, 'dados' => $dados]);
    exit();
}

// =================== [4] FUNÇÕES DE AUTENTICAÇÃO JWT ===================

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
        return substr($authHeader, 7);
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
    // Não é necessário 'global $JWT_SECRET;' se for uma constante definida com define()
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
    return $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
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

// =================== [5] OBTENÇÃO DA AÇÃO SOLICITADA ===================

// Determina qual ação deve ser executada com base nos parâmetros da requisição
$action = $_GET['action'] ?? $_POST['action'] ?? '';

// Se a ação não foi encontrada em GET ou POST, tenta buscar no corpo da requisição JSON
if (empty($action)) {
    // Lê o corpo da requisição (útil para requisições POST/PUT com Content-Type: application/json)
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
}

// Se a ação ainda estiver vazia, retorna erro
if (empty($action)) {
    erro('Ação não especificada', 400);
}

// =================== [6] ROTEAMENTO E EXECUÇÃO DAS AÇÕES ===================

try {
    // Define ações públicas que não requerem autenticação JWT
    $publicActions = ['login', 'register', 'verify_token'];

    // Variável para armazenar dados do token (se autenticado)
    $tokenData = null;

    // Verifica autenticação para ações não públicas
    if (!in_array($action, $publicActions)) {
        $tokenData = verificarToken();
    }

    // Roteamento principal baseado na ação solicitada
    switch ($action) {

        // =================================================================
        // [6.1] AUTENTICAÇÃO E USUÁRIOS
        // =================================================================

        case 'login':
            // Processa login de usuário
            $dados = json_decode(file_get_contents('php://input'), true);
            // sanitizar() está em config.php
            $email = sanitizar($dados['email'] ?? '');
            $senha = $dados['senha'] ?? '';

            if (empty($email) || empty($senha)) {
                erro('Email e senha são obrigatórios.');
            }

            // Busca usuário no banco
            $stmt = $pdo->prepare("SELECT id, nome, email, username, senha, funcao, ativo, squad FROM usuarios WHERE email = ?");
            $stmt->execute([$email]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario) {
                erro('Credenciais inválidas.');
            }

            // Verifica se a conta está ativa
            if (!$usuario['ativo']) {
                erro('Conta pendente de aprovação. Aguarde a liberação do administrador.');
            }

            // Verifica senha
            if (!password_verify($senha, $usuario['senha'])) {
                erro('Credenciais inválidas.');
            }

            // Gera token JWT
            $token = gerarTokenJWT($usuario['id'], $usuario['email']);

            // Remove senha do retorno por segurança
            unset($usuario['senha']);
            sucesso([
                'token' => $token,
                'usuario' => $usuario,
                'mensagem' => 'Login realizado com sucesso!'
            ]);
            break;

        case 'register':
            // Processa o registro de um novo usuário
            $dados = json_decode(file_get_contents('php://input'), true);
            $nome = sanitizar($dados['nome'] ?? '');
            $email = sanitizar($dados['email'] ?? '');
            $username = sanitizar($dados['username'] ?? '');
            $senha = $dados['senha'] ?? '';
            $funcao = sanitizar($dados['funcao'] ?? 'usuario'); // Padrão: usuário

            if (empty($nome) || empty($email) || empty($username) || empty($senha)) {
                erro('Todos os campos são obrigatórios.');
            }

            // Validação básica de email (validar_email() está em config.php)
            if (!validar_email($email)) {
                erro('Formato de email inválido.');
            }

            // Verifica se email ou username já existem
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM usuarios WHERE email = ? OR username = ?");
            $stmt->execute([$email, $username]);
            if ($stmt->fetchColumn() > 0) {
                erro('Email ou nome de usuário já cadastrado.');
            }

            // Hash da senha
            $senha_hash = password_hash($senha, PASSWORD_DEFAULT);

            // Insere novo usuário (ativo = 0, pendente de aprovação)
            $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, username, senha, funcao, ativo) VALUES (?, ?, ?, ?, ?, 0)");
            $stmt->execute([$nome, $email, $username, $senha_hash, $funcao]);
            $novo_id = $pdo->lastInsertId();

            sucesso(['id' => $novo_id, 'mensagem' => 'Registro realizado com sucesso. Aguarde a aprovação do administrador.']);
            break;
        case 'obter_usuarios_admin': // Adicionado para compatibilidade com o frontend
            // Lista TODOS os usuários (incluindo inativos) para administração
            $user_id = $tokenData['user_id'] ?? 0;
            $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
            $stmt->execute([$user_id]);
            $usuario_logado = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario_logado || $usuario_logado['funcao'] !== 'admin') {
                erro('Acesso negado. Apenas administradores podem acessar esta lista.', 403);
            }

            $stmt = $pdo->prepare("SELECT id, nome, email, username, funcao, ativo, squad, data_criacao FROM usuarios ORDER BY nome ASC");
            $stmt->execute();
            $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
            sucesso($usuarios);
            break;
            
        case 'obter_usuarios':
            // Lista todos os usuários ATIVOS
            // Requer autenticação (já verificada)
            // obter_usuarios() está em helpers.php
            $usuarios = obter_usuarios($pdo);
            sucesso($usuarios);
            break;

        case 'atualizar_usuario_admin':
            // Atualiza função e status de um usuário (apenas admin)
            $dados = json_decode(file_get_contents('php://input'), true);
            $usuario_id = filter_var($dados['usuario_id'] ?? null, FILTER_VALIDATE_INT);
            $funcao = sanitizar($dados['funcao'] ?? '');
            $ativo = isset($dados['ativo']) ? (int)$dados['ativo'] : 1;
            $squad = isset($dados['squad']) ? sanitizar($dados['squad']) : null;

            if (!$usuario_id) {
                erro('ID do usuário é obrigatório.');
            }

            // Verificar se é admin
            $user_id = $tokenData['user_id'] ?? 0;
            $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
            $stmt->execute([$user_id]);
            $usuario_logado = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario_logado || $usuario_logado['funcao'] !== 'admin') {
                erro('Acesso negado. Apenas administradores podem atualizar usuários.', 403);
            }

            // Validar função
            $funcoes_validas = ['usuario', 'editor', 'admin'];
            if (!in_array($funcao, $funcoes_validas)) {
                erro('Função inválida. Use: usuario, editor ou admin.');
            }

            // Impedir que o admin remova seu próprio privilégio
            if ($usuario_id == $user_id && $funcao !== 'admin') {
                erro('Você não pode remover seus próprios privilégios de administrador.');
            }

            // Validar squad (aceitar nulo ou lista pré-definida)
            $squads_permitidos = [
                'SQUAD MARKETING',
                'SQUAD PRÉ VENDAS & VENDAS',
                'SQUAD RETENÇÃO E MONETIZAÇÃO',
                'SQUAD TECNOLOGIA',
                'SQUAD FINANCEIRO & ADM'
            ];
            if ($squad !== null && $squad !== '' && !in_array($squad, $squads_permitidos)) {
                erro('Squad inválido.');
            }

            // Atualizar usuário (inclui squad)
            $stmt = $pdo->prepare("UPDATE usuarios SET funcao = ?, ativo = ?, squad = ? WHERE id = ?");
            $stmt->execute([$funcao, $ativo, $squad, $usuario_id]);

            sucesso(['mensagem' => 'Usuário atualizado com sucesso']);
            break;

        case 'deletar_usuario_admin':
            // Deleta um usuário (apenas admin)
            $dados = json_decode(file_get_contents('php://input'), true);
            $usuario_id = filter_var($dados['usuario_id'] ?? null, FILTER_VALIDATE_INT);

            if (!$usuario_id) {
                erro('ID do usuário é obrigatório.');
            }

            // Verificar se é admin
            $user_id = $tokenData['user_id'] ?? 0;
            $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
            $stmt->execute([$user_id]);
            $usuario_logado = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario_logado || $usuario_logado['funcao'] !== 'admin') {
                erro('Acesso negado. Apenas administradores podem deletar usuários.', 403);
            }

            // Impedir que o admin delete a si mesmo
            if ($usuario_id == $user_id) {
                erro('Você não pode deletar sua própria conta.');
            }

            // Deletar usuário permanentemente
            $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = ?");
            $stmt->execute([$usuario_id]);

            sucesso(['mensagem' => 'Usuário deletado com sucesso']);
            break;

        case 'verify_token':
            // Verifica se o token é válido (já feito pela função verificarToken() no roteamento)
            sucesso(['valido' => true, 'dados' => $tokenData, 'mensagem' => 'Token válido.']);
            break;



        case 'buscar_usuarios':
            // Busca usuários por termo (nome, email ou username)
            // Requer autenticação (já verificada)
            $termo = $_GET['termo'] ?? '';
            if (strlen($termo) < 2) {
                sucesso([]); // Retorna vazio se o termo for muito curto
                break;
            }

            $termo_like = '%' . $termo . '%';
            $stmt = $pdo->prepare("SELECT id, nome, email, username FROM usuarios WHERE ativo = 1 AND (nome LIKE ? OR email LIKE ? OR username LIKE ?) ORDER BY nome ASC LIMIT 10");
            $stmt->execute([$termo_like, $termo_like, $termo_like]);
            $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
            sucesso($usuarios);
            break;
            
        // editar_perfil - Atualiza dados do perfil do usuário
        case 'editar_perfil':
            $dados = json_decode(file_get_contents('php://input'), true);
            $usuario_id = filter_var($dados['usuario_id'] ?? null, FILTER_VALIDATE_INT);
            $nome = sanitizar($dados['nome'] ?? '');
            $email = sanitizar($dados['email'] ?? '');
            $username = sanitizar($dados['username'] ?? '');
            $bio = sanitizar($dados['bio'] ?? '');

            if (!$usuario_id) {
                erro('ID do usuário é obrigatório.');
            }

            // Segurança: Garantir que o usuário só edite seu próprio perfil (ou seja admin)
            $requester_id = $tokenData['user_id'] ?? 0;
            if ($usuario_id != $requester_id) {
                // Se não for o próprio usuário, verifica se é admin
                $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
                $stmt->execute([$requester_id]);
                $req = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$req || $req['funcao'] !== 'admin') {
                    erro('Acesso negado. Você só pode editar seu próprio perfil.');
                }
            }

            // Atualiza os dados
            $stmt = $pdo->prepare("UPDATE usuarios SET nome = ?, email = ?, username = ?, bio = ? WHERE id = ?");
            $stmt->execute([$nome, $email, $username, $bio, $usuario_id]);

            // Retorna o usuário atualizado para atualizar o localStorage no frontend
            $stmt = $pdo->prepare("SELECT id, nome, email, username, funcao, ativo, bio, data_criacao FROM usuarios WHERE id = ?");
            $stmt->execute([$usuario_id]);
            $usuario_atualizado = $stmt->fetch(PDO::FETCH_ASSOC);

            sucesso(['usuario' => $usuario_atualizado, 'mensagem' => 'Perfil atualizado com sucesso!']);
            break;
        case 'editar_tarefa':
            // Alias para compatibilidade com o frontend antigo
            // Converte para a action já implementada 'atualizar_tarefa'
            // Lê o corpo uma vez e repassa para o mesmo fluxo se preferir,
            // Aqui fazemos um redirect interno simples: atribuir $action e re-executar o switch.
            // Simples e seguro: recriar $action e include do mesmo handler.
            // Se o código de 'atualizar_tarefa' for longo, a opção mais simples é duplicar a lógica
            // ou chamar uma função comum. Exemplo de delegação simples abaixo:

            // Lê os dados e injeta em uma variável global para que o case 'atualizar_tarefa' os use
            $dados_temp = json_decode(file_get_contents('php://input'), true);
            // Reassign $_POST-like payload for downstream handler (se o handler espera json do php://input,
            // é mais simples chamar diretamente a função que implementa o atualizar_tarefa).
            // Aqui iremos replicar a lógica mínima: chamar manualmente o mesmo bloco.

            // --- replicar/usar a lógica de 'atualizar_tarefa' abaixo (exemplo simples) ---
            $tarefa_id = filter_var($dados_temp['tarefa_id'] ?? null, FILTER_VALIDATE_INT);
            $titulo = sanitizar($dados_temp['titulo'] ?? '');
            $descricao = sanitizar($dados_temp['descricao'] ?? '');
            $data_inicio = sanitizar($dados_temp['data_inicio'] ?? '');
            $data_fim = sanitizar($dados_temp['data_fim'] ?? '');
            $prioridade = sanitizar($dados_temp['prioridade'] ?? '');
            $progresso_manual = isset($dados_temp['progresso_manual']) ? filter_var($dados_temp['progresso_manual'], FILTER_VALIDATE_INT) : null;
            $status = sanitizar($dados_temp['status'] ?? '');
            $usuarios = $dados_temp['usuarios'] ?? null;

            if (!$tarefa_id) {
                erro('ID da tarefa é obrigatório.');
            }

            // Monta a query dinamicamente (mesma lógica do atualizar_tarefa)
            $set_clauses = [];
            $params = [];

            if (!empty($titulo)) {
                $set_clauses[] = 'titulo = ?';
                $params[] = $titulo;
            }
            if (!empty($descricao)) {
                $set_clauses[] = 'descricao = ?';
                $params[] = $descricao;
            }
            if (!empty($data_inicio)) {
                $set_clauses[] = 'data_inicio = ?';
                $params[] = $data_inicio;
            }
            if (!empty($data_fim)) {
                $set_clauses[] = 'data_fim = ?';
                $params[] = $data_fim;
            }
            if (!empty($prioridade)) {
                $set_clauses[] = 'prioridade = ?';
                $params[] = $prioridade;
            }
            if ($progresso_manual !== null) {
                $set_clauses[] = 'progresso_manual = ?';
                $params[] = $progresso_manual;
            }
            if (!empty($status)) {
                $set_clauses[] = 'status = ?';
                $params[] = $status;
            }

            if (empty($set_clauses)) {
                erro('Nenhum dado para atualizar.');
            }

            $set_clauses[] = 'data_atualizacao = NOW()';
            $sql = "UPDATE tarefas SET " . implode(', ', $set_clauses) . " WHERE id = ?";
            $params[] = $tarefa_id;
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            // Atualiza usuários (se fornecidos)
            if ($usuarios !== null) {
                $stmt_delete = $pdo->prepare("DELETE FROM tarefa_usuarios WHERE tarefa_id = ?");
                $stmt_delete->execute([$tarefa_id]);
                if (!empty($usuarios) && is_array($usuarios)) {
                    $stmt_usuario = $pdo->prepare("INSERT INTO tarefa_usuarios (tarefa_id, usuario_id) VALUES (?, ?)");
                    foreach ($usuarios as $usuario_id) {
                        $stmt_usuario->execute([$tarefa_id, $usuario_id]);
                    }
                }
            }

            // Ajustes de status quando progresso manual é informado
            if ($progresso_manual !== null) {
                if ($progresso_manual == 100) {
                    $update_status = $pdo->prepare("UPDATE tarefas SET concluida = 1, status = 'concluida', data_conclusao_real = NOW() WHERE id = ?");
                    $update_status->execute([$tarefa_id]);
                } else {
                    $update_status = $pdo->prepare("UPDATE tarefas SET concluida = 0, status = 'iniciada', data_conclusao_real = NULL WHERE id = ? AND status = 'concluida'");
                    $update_status->execute([$tarefa_id]);
                }
            }

            sucesso(['mensagem' => 'Tarefa atualizada com sucesso']);
            break;
        // --- inserir no switch($action) em api.php ---
        case 'adicionar_usuario_tarefa':
            $dados = json_decode(file_get_contents('php://input'), true);
            $tarefa_id = filter_var($dados['tarefa_id'] ?? null, FILTER_VALIDATE_INT);
            $usuario_id = filter_var($dados['usuario_id'] ?? null, FILTER_VALIDATE_INT);
            $requester_id = $tokenData['user_id'] ?? 0;

            if (!$tarefa_id || !$usuario_id) {
                erro('ID da tarefa e do usuário são obrigatórios.', 400);
            }

            // Verificar permissão: somente admin ou usuário com permissão pode adicionar
            $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
            $stmt->execute([$requester_id]);
            $req = $stmt->fetch(PDO::FETCH_ASSOC);
            $eh_admin = ($req && $req['funcao'] === 'admin');

            if (!$eh_admin) {
                erro('Acesso negado. Apenas administradores podem adicionar usuários à tarefa.', 403);
            }

            // Evitar duplicatas
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM tarefa_usuarios WHERE tarefa_id = ? AND usuario_id = ?");
            $stmt->execute([$tarefa_id, $usuario_id]);
            if ($stmt->fetchColumn() > 0) {
                sucesso(['mensagem' => 'Usuário já está atribuído a essa tarefa.']);
            }

            // Inserir
            $stmt = $pdo->prepare("INSERT INTO tarefa_usuarios (tarefa_id, usuario_id) VALUES (?, ?)");
            $stmt->execute([$tarefa_id, $usuario_id]);

            sucesso(['mensagem' => 'Usuário adicionado à tarefa com sucesso']);
            break;

        case 'remover_usuario_tarefa':
            $dados = json_decode(file_get_contents('php://input'), true);
            $tarefa_id = filter_var($dados['tarefa_id'] ?? null, FILTER_VALIDATE_INT);
            $usuario_id = filter_var($dados['usuario_id'] ?? null, FILTER_VALIDATE_INT);
            $requester_id = $tokenData['user_id'] ?? 0;

            if (!$tarefa_id || !$usuario_id) {
                erro('ID da tarefa e do usuário são obrigatórios.', 400);
            }

            // Permissão: somente admin pode remover (ajuste se quiser permitir autores)
            $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
            $stmt->execute([$requester_id]);
            $req = $stmt->fetch(PDO::FETCH_ASSOC);
            $eh_admin = ($req && $req['funcao'] === 'admin');

            if (!$eh_admin) {
                erro('Acesso negado. Apenas administradores podem remover usuários da tarefa.', 403);
            }

            // Deletar associação
            $stmt = $pdo->prepare("DELETE FROM tarefa_usuarios WHERE tarefa_id = ? AND usuario_id = ?");
            $stmt->execute([$tarefa_id, $usuario_id]);

            sucesso(['mensagem' => 'Usuário removido da tarefa com sucesso']);
            break;
        // =================================================================
        // [6.2] GERENCIAMENTO DE PROJETOS
        // =================================================================

        case 'obter_projetos':
            // Busca projetos baseado no tipo de usuário (admin vê todos ativos, usuário vê projetos com tarefas atribuídas)
            $user_id = $tokenData['user_id'] ?? 0;

            // Verifica se usuário é admin
            $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
            $stmt->execute([$user_id]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario) {
                erro('Usuário não encontrado', 404);
            }

            $eh_admin = ($usuario['funcao'] === 'admin');
            $sql = "SELECT id, nome, descricao, status, data_inicio, data_fim, data_criacao, data_conclusao FROM projetos WHERE status != 'excluido' ";
            $params = [];

            if (!$eh_admin) {
                // Usuário comum: filtra projetos que possuem tarefas atribuídas a ele
                $sql .= " AND id IN (SELECT DISTINCT t.projeto_id FROM tarefas t INNER JOIN tarefa_usuarios tu ON t.id = tu.tarefa_id WHERE tu.usuario_id = ? AND t.status != 'excluida') ";
                $params[] = $user_id;
            } else {
                // Admin: vê todos os projetos ativos
                $sql .= " AND status = 'ativo' ";
            }

            $sql .= " ORDER BY nome ASC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $projetos = $stmt->fetchAll(PDO::FETCH_ASSOC);

            sucesso($projetos);
            break;

case 'obter_detalhes_projeto_arquivado':
    $projeto_id = filter_var($_GET['projeto_id'] ?? null, FILTER_VALIDATE_INT);
    $user_id = $tokenData['user_id'] ?? 0;

    if (!$projeto_id) {
        erro('ID do projeto é obrigatório.', 400);
    }

    // 1. Verificar se é admin
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario || $usuario['funcao'] !== 'admin') {
        erro('Acesso negado. Apenas administradores podem acessar detalhes de projetos arquivados.', 403);
    }

    // 2. Obter detalhes do projeto (apenas se estiver concluído ou excluído)
    $stmt = $pdo->prepare("SELECT id, nome, descricao, status, data_conclusao FROM projetos WHERE id = ? AND (status = 'concluido' OR status = 'excluido')");
    $stmt->execute([$projeto_id]);
    $projeto = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$projeto) {
        erro('Projeto não encontrado ou não está arquivado.', 404);
    }

    // 3. Obter tarefas associadas ao projeto
    $stmt_tarefas = $pdo->prepare("SELECT id, titulo as nome, status FROM tarefas WHERE projeto_id = ?");
    $stmt_tarefas->execute([$projeto_id]);
    $tarefas = $stmt_tarefas->fetchAll(PDO::FETCH_ASSOC);

    // 4. Para cada tarefa, obter suas etapas
    foreach ($tarefas as &$tarefa) {
        $stmt_etapas = $pdo->prepare("SELECT id, descricao as nome, concluida FROM tarefa_etapas WHERE tarefa_id = ? ORDER BY id ASC");
        $stmt_etapas->execute([$tarefa['id']]);
        $tarefa['etapas'] = $stmt_etapas->fetchAll(PDO::FETCH_ASSOC);
    }
    unset($tarefa);

    sucesso(['projeto' => $projeto, 'tarefas' => $tarefas]);
    break;

        case 'obter_projeto':
            // Obtém detalhes de um projeto específico
            $projeto_id = filter_var($_GET['projeto_id'] ?? null, FILTER_VALIDATE_INT);

            if (!$projeto_id) {
                erro('ID do projeto é obrigatório');
            }

            // obter_projeto() está em helpers.php
            $projeto = obter_projeto($pdo, $projeto_id);

            if (!$projeto || $projeto['status'] === 'excluido') {
                erro('Projeto não encontrado ou excluído', 404);
            }

            // TODO: Adicionar verificação de permissão de acesso ao projeto

            sucesso($projeto);
            break;

        case 'criar_projeto':
            // Cria um novo projeto (apenas para admin)
            $dados = json_decode(file_get_contents('php://input'), true);
            $nome = sanitizar($dados['nome'] ?? '');
            $descricao = sanitizar($dados['descricao'] ?? '');
            $data_inicio = sanitizar($dados['data_inicio'] ?? '');
            $data_fim = sanitizar($dados['data_fim'] ?? '');

            if (empty($nome) || empty($data_inicio) || empty($data_fim)) {
                erro('Nome, data de início e data de fim são obrigatórios.');
            }

            // Validação de datas
            $ts_inicio = strtotime(str_replace('T', ' ', $data_inicio));
            $ts_fim = strtotime(str_replace('T', ' ', $data_fim));
            if ($ts_inicio === false || $ts_fim === false) {
                erro('Formato de data inválido.');
            }
            if ($ts_fim < $ts_inicio) {
                erro('Data de término não pode ser anterior à data de início.');
            }

            // Verificar se é admin
            $user_id = $tokenData['user_id'] ?? 0;
            $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
            $stmt->execute([$user_id]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario || $usuario['funcao'] !== 'admin') {
                erro('Acesso negado. Apenas administradores podem criar projetos.', 403);
            }

            $stmt = $pdo->prepare("INSERT INTO projetos (nome, descricao, data_inicio, data_fim, status) VALUES (?, ?, ?, ?, 'ativo')");
            $stmt->execute([$nome, $descricao, $data_inicio, $data_fim]);
            $novo_id = $pdo->lastInsertId();

            sucesso(['id' => $novo_id, 'mensagem' => 'Projeto criado com sucesso']);
            break;

        case 'criar_projeto_rapido':
            // Lê payload JSON
            $dados = json_decode(file_get_contents('php://input'), true);
            $nome = sanitizar($dados['nome'] ?? '');
            $data_inicio = sanitizar($dados['data_inicio'] ?? '');
            $data_fim = sanitizar($dados['data_fim'] ?? '');

            // Verificar autenticação (tokenData já existe no roteamento principal)
            $user_id = $tokenData['user_id'] ?? 0;
            if (!$user_id) {
                erro('Usuário não autenticado', 401);
            }

            // Verificar se é admin (consistente com criar_projeto)
            $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
            $stmt->execute([$user_id]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$usuario || $usuario['funcao'] !== 'admin') {
                erro('Acesso negado. Apenas administradores podem criar projetos.', 403);
            }

            if (empty($nome)) {
                erro('Nome do projeto é obrigatório.', 400);
            }

            // Verificar se já existe projeto com mesmo nome (não criar duplicado)
            $stmt = $pdo->prepare("SELECT id FROM projetos WHERE nome = ? AND status != 'excluido' LIMIT 1");
            $stmt->execute([$nome]);
            $existente = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existente) {
                // Retornar o id existente sem recriar
                sucesso(['existente' => true, 'id' => (int)$existente['id'], 'mensagem' => 'Projeto já existe']);
            }

            // Validar/normalizar datas se fornecidas (opcional)
            if (!empty($data_inicio)) {
                $ts_inicio = strtotime(str_replace('T', ' ', $data_inicio));
                if ($ts_inicio === false) {
                    erro('Formato de data_inicio inválido.', 400);
                }
            }
            if (!empty($data_fim)) {
                $ts_fim = strtotime(str_replace('T', ' ', $data_fim));
                if ($ts_fim === false) {
                    erro('Formato de data_fim inválido.', 400);
                }
            }

            // Inserir novo projeto
            $stmt = $pdo->prepare("INSERT INTO projetos (nome, descricao, data_inicio, data_fim, status, data_criacao) VALUES (?, ?, ?, ?, 'ativo', NOW())");
            $descricao = ''; // rápido: sem descrição adicional
            $stmt->execute([$nome, $descricao, $data_inicio ?: null, $data_fim ?: null]);
            $novo_id = $pdo->lastInsertId();

            sucesso(['existente' => false, 'id' => (int)$novo_id, 'mensagem' => 'Projeto criado com sucesso']);
            break;

        case 'atualizar_projeto':
            // Atualiza um projeto existente (apenas para admin)
            $dados = json_decode(file_get_contents('php://input'), true);
            $projeto_id = filter_var($dados['projeto_id'] ?? null, FILTER_VALIDATE_INT);
            $nome = sanitizar($dados['nome'] ?? '');
            $descricao = sanitizar($dados['descricao'] ?? '');
            $data_inicio = sanitizar($dados['data_inicio'] ?? '');
            $data_fim = sanitizar($dados['data_fim'] ?? '');
            $status = sanitizar($dados['status'] ?? 'ativo');

            if (!$projeto_id) {
                erro('ID do projeto é obrigatório.');
            }

            // Validação de datas (se fornecidas)
            if (!empty($data_inicio) && !empty($data_fim)) {
                $ts_inicio = strtotime(str_replace('T', ' ', $data_inicio));
                $ts_fim = strtotime(str_replace('T', ' ', $data_fim));
                if ($ts_inicio === false || $ts_fim === false) {
                    erro('Formato de data inválido.');
                }
                if ($ts_fim < $ts_inicio) {
                    erro('Data de término não pode ser anterior à data de início.');
                }
            }

            // Verificar se é admin
            $user_id = $tokenData['user_id'] ?? 0;
            $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
            $stmt->execute([$user_id]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario || $usuario['funcao'] !== 'admin') {
                erro('Acesso negado. Apenas administradores podem atualizar projetos.', 403);
            }

            $stmt = $pdo->prepare("UPDATE projetos SET nome = ?, descricao = ?, data_inicio = ?, data_fim = ?, status = ? WHERE id = ?");
            $stmt->execute([$nome, $descricao, $data_inicio, $data_fim, $status, $projeto_id]);

            sucesso(['mensagem' => 'Projeto atualizado com sucesso']);
            break;

        case 'deletar_projeto':
            $dados = json_decode(file_get_contents('php://input'), true);
            $projeto_id = filter_var($dados['projeto_id'] ?? null, FILTER_VALIDATE_INT);

            if (!$projeto_id) {
                erro('ID do projeto é obrigatório.');
            }

            // Verify user is admin
            $user_id = $tokenData['user_id'] ?? 0;
            $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
            $stmt->execute([$user_id]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario || $usuario['funcao'] !== 'admin') {
                erro('Acesso negado. Apenas administradores podem excluir projetos.', 403);
            }

            // Soft delete: mark project as deleted
            $stmt = $pdo->prepare("UPDATE projetos SET status = 'excluido' WHERE id = ?");
            $stmt->execute([$projeto_id]);

            // Mark associated tasks as deleted
            $stmt = $pdo->prepare("UPDATE tarefas SET status = 'excluida' WHERE projeto_id = ?");
            $stmt->execute([$projeto_id]);

            sucesso(['mensagem' => 'Projeto e tarefas associadas excluídos com sucesso']);
            break;

        case 'concluir_projeto':
            // Conclui um projeto (apenas para admin)
            $dados = json_decode(file_get_contents('php://input'), true);
            $projeto_id = filter_var($dados['projeto_id'] ?? null, FILTER_VALIDATE_INT);

            if (!$projeto_id) {
                erro('ID do projeto inválido.');
            }

            // Verificar se é admin
            $user_id = $tokenData['user_id'] ?? 0;
            $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
            $stmt->execute([$user_id]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario || $usuario['funcao'] !== 'admin') {
                erro('Acesso negado. Apenas administradores podem concluir projetos.', 403);
            }

            // Marcar projeto como concluído
            $stmt = $pdo->prepare("UPDATE projetos SET status = 'concluido', data_conclusao = NOW() WHERE id = ?");
            $stmt->execute([$projeto_id]);

            // Marcar todas as tarefas pendentes como concluídas
            $stmt = $pdo->prepare("UPDATE tarefas SET status = 'concluida', concluida = 1, data_conclusao_real = NOW() WHERE projeto_id = ? AND status != 'concluida'");
            $stmt->execute([$projeto_id]);

            sucesso(['mensagem' => 'Projeto concluído com sucesso']);
            break;

        case 'reabrir_projeto':
            // Reabre um projeto (apenas para admin)
            $dados = json_decode(file_get_contents('php://input'), true);
            $projeto_id = filter_var($dados['projeto_id'] ?? null, FILTER_VALIDATE_INT);

            if (!$projeto_id) {
                erro('ID do projeto inválido.');
            }

            // Verificar se é admin
            $user_id = $tokenData['user_id'] ?? 0;
            $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
            $stmt->execute([$user_id]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario || $usuario['funcao'] !== 'admin') {
                erro('Acesso negado. Apenas administradores podem reabrir projetos.', 403);
            }

            // Marcar projeto como ativo novamente
            $stmt = $pdo->prepare("UPDATE projetos SET status = 'ativo', data_conclusao = NULL WHERE id = ?");
            $stmt->execute([$projeto_id]);

            sucesso(['mensagem' => 'Projeto reaberto com sucesso']);
            break;

            
case 'excluir_projeto_definitivamente':
    // Requer autenticação
    $dados = json_decode(file_get_contents('php://input'), true);
    $projeto_id = filter_var($dados['projeto_id'] ?? null, FILTER_VALIDATE_INT);
    $user_id = $tokenData['user_id'] ?? 0;

    if (!$projeto_id) {
        erro('ID do projeto é obrigatório.', 400);
    }

    // 1. Verificar se o usuário é admin
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario || $usuario['funcao'] !== 'admin') {
        erro('Acesso negado. Apenas administradores podem excluir projetos definitivamente.', 403);
    }

    // 2. Verificar se o projeto existe e está em um estado arquivável (concluído ou excluído)
    $stmt = $pdo->prepare("SELECT id, status FROM projetos WHERE id = ? AND (status = 'concluido' OR status = 'excluido')");
    $stmt->execute([$projeto_id]);
    $projeto = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$projeto) {
        erro('Projeto não encontrado ou não está em um estado que permite exclusão definitiva.', 404);
    }

    // Iniciar transação para garantir atomicidade
    $pdo->beginTransaction();
    try {
        // 3. Excluir etapas das tarefas deste projeto
        $stmt_etapas = $pdo->prepare("
            DELETE te FROM tarefa_etapas te 
            INNER JOIN tarefas t ON te.tarefa_id = t.id 
            WHERE t.projeto_id = ?
        ");
        $stmt_etapas->execute([$projeto_id]);

        // 4. Excluir usuários das tarefas (tarefa_usuarios)
        $stmt_tarefa_usuarios = $pdo->prepare("
            DELETE tu FROM tarefa_usuarios tu 
            INNER JOIN tarefas t ON tu.tarefa_id = t.id 
            WHERE t.projeto_id = ?
        ");
        $stmt_tarefa_usuarios->execute([$projeto_id]);

        // 5. Excluir arquivos das tarefas
        $stmt_arquivos = $pdo->prepare("
            DELETE ta FROM tarefas_arquivos ta 
            INNER JOIN tarefas t ON ta.tarefa_id = t.id 
            WHERE t.projeto_id = ?
        ");
        $stmt_arquivos->execute([$projeto_id]);

        // 6. Excluir comentários das tarefas
        $stmt_comentarios = $pdo->prepare("
            DELETE tc FROM tarefas_comentarios tc 
            INNER JOIN tarefas t ON tc.tarefa_id = t.id 
            WHERE t.projeto_id = ?
        ");
        $stmt_comentarios->execute([$projeto_id]);

        // 7. Excluir as tarefas do projeto
        $stmt_tarefas = $pdo->prepare("DELETE FROM tarefas WHERE projeto_id = ?");
        $stmt_tarefas->execute([$projeto_id]);

        // 8. Excluir o projeto
        $stmt_projeto = $pdo->prepare("DELETE FROM projetos WHERE id = ?");
        $stmt_projeto->execute([$projeto_id]);

        $pdo->commit();
        sucesso(['mensagem' => 'Projeto excluído definitivamente com sucesso.']);

    } catch (Exception $e) {
        $pdo->rollBack();
        erro('Erro ao excluir projeto definitivamente: ' . $e->getMessage(), 500);
    }
    break;

        case 'obter_projetos_finalizados':
    // Lista projetos com status "concluido" ou "excluido"
    $user_id = $tokenData['user_id'] ?? 0;
    
    // Verificar se é admin
    $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$usuario || $usuario['funcao'] !== 'admin') {
        erro('Acesso negado. Apenas administradores podem acessar o arquivo.', 403);
    }
    
    // Buscar projetos finalizados e excluídos
    $sql = "SELECT id, nome, descricao, status, data_inicio, data_fim, data_criacao, data_conclusao 
            FROM projetos 
            WHERE status IN ('concluido', 'excluido') 
            ORDER BY data_conclusao DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $projetos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    sucesso($projetos);
    break;

        // =================================================================
        // [6.3] GERENCIAMENTO DE TAREFAS
        // =================================================================

        case 'obter_tarefas':
            // Lista tarefas de um projeto
            $projeto_id = $_GET['projeto_id'] ?? 0;
            $user_id = $tokenData['user_id'] ?? 0;
            $ordenar_por = $_GET['ordenar_por'] ?? 'data_criacao';

            if (!$projeto_id) {
                erro('ID do projeto é obrigatório');
            }

            // Verificar permissão (Admin ou usuário com tarefas no projeto)
            $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
            $stmt->execute([$user_id]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
            $eh_admin = ($usuario['funcao'] === 'admin');

            // Verificar se o projeto existe e está ativo
            $stmt_projeto = $pdo->prepare("SELECT id, nome FROM projetos WHERE id = ? AND status = 'ativo'");
            $stmt_projeto->execute([$projeto_id]);
            $projeto = $stmt_projeto->fetch(PDO::FETCH_ASSOC);

            if (!$projeto) {
                erro('Projeto não encontrado ou inativo', 404);
            }

            if (!$eh_admin) {
                // Usuário comum: verifica se tem alguma tarefa atribuída neste projeto
                $stmt_acesso = $pdo->prepare("
                    SELECT COUNT(*) as total 
                    FROM tarefa_usuarios tu 
                    INNER JOIN tarefas t ON tu.tarefa_id = t.id 
                    WHERE tu.usuario_id = ? AND t.projeto_id = ? AND t.status != 'excluida'
                ");
                $stmt_acesso->execute([$user_id, $projeto_id]);
                $resultado = $stmt_acesso->fetch(PDO::FETCH_ASSOC);

                if ($resultado['total'] === 0) {
                    erro('Você não tem permissão para acessar este projeto', 403);
                }
            }

            // Definir ordenação
            $ordenacao = 't.data_criacao DESC'; // Padrão
            switch ($ordenar_por) {
                case 'data_conclusao':
                    $ordenacao = 't.data_conclusao DESC, t.data_criacao DESC';
                    break;
                case 'data_fim':
                    $ordenacao = 't.data_fim ASC, t.data_criacao DESC';
                    break;
                case 'data_inicio':
                    $ordenacao = 't.data_inicio ASC, t.data_criacao DESC';
                    break;
                case 'titulo':
                    $ordenacao = 't.titulo ASC';
                    break;
                case 'status':
                    $ordenacao = 't.status ASC, t.data_fim ASC';
                    break;
                case 'prioridade':
                    // Ordenação por prioridade (mapeamento de string para número)
                    $ordenacao = "
                        CASE 
                            WHEN t.prioridade = 'urgente_importante' THEN 1
                            WHEN t.prioridade = 'importante_nao_urgente' THEN 2
                            WHEN t.prioridade = 'urgente_nao_importante' THEN 3
                            WHEN t.prioridade = 'nao_urgente_nao_importante' THEN 4
                            ELSE 5
                        END ASC, t.data_criacao DESC
                    ";
                    break;
            }

            // Buscar tarefas ATIVAS (não excluídas)
            $sql = "
                  SELECT t.id, t.projeto_id, t.titulo, t.descricao, t.squad, t.data_inicio, t.data_fim, 
                       t.concluida, t.status, t.data_criacao, t.data_conclusao, t.prioridade, t.progresso_manual, t.data_conclusao_real,
                       p.nome as projeto_nome,
                       (SELECT COUNT(*) FROM tarefas_arquivos WHERE tarefa_id = t.id) as arquivos_count,
                       (SELECT COUNT(*) FROM tarefas_comentarios WHERE tarefa_id = t.id) as comentarios_count
                FROM tarefas t 
                INNER JOIN projetos p ON t.projeto_id = p.id 
                WHERE t.projeto_id = ? AND t.status != 'excluida' 
                ORDER BY $ordenacao
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([$projeto_id]);
            $tarefas = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Adiciona usuários, calcula progresso e obtém etapas para cada tarefa
            foreach ($tarefas as &$tarefa) {
                // 1. Usuários (obter_usuarios_tarefa() está em helpers.php)
                $tarefa['usuarios'] = obter_usuarios_tarefa($pdo, $tarefa['id']);

                // 2. Progresso (calcular_progresso_tarefa() está em helpers.php)
                $tarefa['progresso'] = calcular_progresso_tarefa($pdo, $tarefa['id'], $tarefa['progresso_manual']);

                // 3. Etapas (Checklist) (obter_etapas_tarefa() está em helpers.php)
                $tarefa['etapas'] = obter_etapas_tarefa($pdo, $tarefa['id']);

                // 4. Contagem de Checklist
                $tarefa['checklist_total'] = count($tarefa['etapas']);
                $tarefa['checklist_concluidos'] = array_reduce($tarefa['etapas'], function ($carry, $item) {
                    return $carry + ($item['concluida'] == 1 ? 1 : 0);
                }, 0);

                // 5. Atualização automática de status para 'concluida' se progresso for 100%
                if ($tarefa['progresso'] == 100 && $tarefa['concluida'] == 0) {
                    $tarefa['concluida'] = 1;
                    $tarefa['status'] = 'concluida';
                    // Atualiza o banco de dados para refletir a conclusão automática
                    $update_stmt = $pdo->prepare("UPDATE tarefas SET concluida = 1, status = 'concluida', data_conclusao_real = NOW() WHERE id = ?");
                    $update_stmt->execute([$tarefa['id']]);
                }
            }
            unset($tarefa); // Quebrar a referência

            sucesso($tarefas);
            break;

        case 'obter_tarefa':
            // Obtém detalhes de uma tarefa específica
            $tarefa_id = filter_var($_GET['tarefa_id'] ?? null, FILTER_VALIDATE_INT);

            if (!$tarefa_id) {
                erro('ID da tarefa é obrigatório');
            }

            // Buscar dados da tarefa
            $stmt = $pdo->prepare("
                SELECT t.*, p.nome as projeto_nome,
                       (SELECT COUNT(*) FROM tarefas_arquivos WHERE tarefa_id = t.id) as arquivos_count,
                       (SELECT COUNT(*) FROM tarefas_comentarios WHERE tarefa_id = t.id) as comentarios_count
                FROM tarefas t 
                INNER JOIN projetos p ON t.projeto_id = p.id 
                WHERE t.id = ? AND t.status != 'excluida'
            ");
            $stmt->execute([$tarefa_id]);
            $tarefa = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$tarefa) {
                erro('Tarefa não encontrada', 404);
            }

            // Buscar usuários da tarefa (obter_usuarios_tarefa() está em helpers.php)
            $tarefa['usuarios'] = obter_usuarios_tarefa($pdo, $tarefa_id);

            // Buscar etapas da tarefa (obter_etapas_tarefa() está em helpers.php)
            $tarefa['etapas'] = obter_etapas_tarefa($pdo, $tarefa_id);

            // Calcular progresso (calcular_progresso_tarefa() está em helpers.php)
            $tarefa['progresso'] = calcular_progresso_tarefa($pdo, $tarefa_id, $tarefa['progresso_manual']);

            sucesso($tarefa);
            break;

        case 'criar_tarefa':
            // Cria uma nova tarefa
            $dados = json_decode(file_get_contents('php://input'), true);
            $projeto_id = filter_var($dados["projeto_id"] ?? null, FILTER_VALIDATE_INT);
            $titulo = sanitizar($dados["titulo"] ?? "");
            $descricao = sanitizar($dados["descricao"] ?? "");
            $data_inicio = sanitizar($dados["data_inicio"] ?? "");
            $data_fim = sanitizar($dados["data_fim"] ?? "");
            $prioridade = sanitizar($dados["prioridade"] ?? "importante_nao_urgente");
            $progresso_manual = filter_var($dados['progresso_manual'] ?? 0, FILTER_VALIDATE_INT);
            $usuarios = $dados["usuarios"] ?? [];

            if (!$projeto_id) {
                erro("ID do projeto inválido.");
            }
            if (empty($titulo)) {
                erro("Título é obrigatório.");
            }

            // Validação de datas
            if (empty($data_inicio) || empty($data_fim)) {
                erro('Datas de início e término são obrigatórias.');
            }

            // Normalizar e validar ordem das datas
            $ts_inicio = strtotime(str_replace('T', ' ', $data_inicio));
            $ts_fim = strtotime(str_replace('T', ' ', $data_fim));
            if ($ts_inicio === false || $ts_fim === false) {
                erro('Formato de data inválido.');
            }
            if ($ts_fim < $ts_inicio) {
                erro('Data de término não pode ser anterior à data de início.');
            }

            // Validação: não permitir datas anteriores ao dia atual (dataEhNoPassado() está em helpers.php)
            if (dataEhNoPassado($data_inicio) || dataEhNoPassado($data_fim)) {
                // A validação de dataEhNoPassado() deve ser ajustada para permitir datas passadas se a tarefa for retroativa,
                // mas para novas tarefas, a restrição é razoável.
                // erro('Datas não podem ser anteriores a hoje.');
            }

            // Validação de prioridade
            $prioridades_validas = ['urgente_importante', 'importante_nao_urgente', 'urgente_nao_importante', 'nao_urgente_nao_importante'];
            if (!in_array($prioridade, $prioridades_validas)) {
                $prioridade = 'importante_nao_urgente';
            }

            // Aceita override de squad no payload (opcional) — valida lista permitida
            $squad = isset($dados['squad']) ? sanitizar($dados['squad']) : null;
            $squads_permitidos = [
                'SQUAD MARKETING',
                'SQUAD PRÉ VENDAS & VENDAS',
                'SQUAD RETENÇÃO E MONETIZAÇÃO',
                'SQUAD TECNOLOGIA',
                'SQUAD FINANCEIRO & ADM'
            ];
            if ($squad !== null && $squad !== '' && !in_array($squad, $squads_permitidos)) {
                erro('Squad inválido.');
            }

            // Determina o squad da tarefa: usa o enviado quando presente, senão usa o squad do criador
            if (!empty($squad)) {
                $squad_tarefa = $squad;
            } else {
                $criador_id = $tokenData['user_id'] ?? null;
                $squad_tarefa = null;
                if ($criador_id) {
                    $stmt_s = $pdo->prepare("SELECT squad FROM usuarios WHERE id = ?");
                    $stmt_s->execute([$criador_id]);
                    $res_s = $stmt_s->fetch(PDO::FETCH_ASSOC);
                    $squad_tarefa = $res_s['squad'] ?? null;
                }
            }

            // Insere a tarefa com status 'pendente' e squad definido
            $stmt = $pdo->prepare("INSERT INTO tarefas (projeto_id, squad, titulo, descricao, data_inicio, data_fim, status, concluida, prioridade, progresso_manual) VALUES (?, ?, ?, ?, ?, ?, 'pendente', 0, ?, ?)");
            $stmt->execute([$projeto_id, $squad_tarefa, $titulo, $descricao, $data_inicio, $data_fim, $prioridade, $progresso_manual]);
            $tarefa_id = $pdo->lastInsertId();

            // Adiciona usuários à tarefa
            if (!empty($usuarios) && is_array($usuarios)) {
                $stmt_usuario = $pdo->prepare("INSERT INTO tarefa_usuarios (tarefa_id, usuario_id) VALUES (?, ?)");
                foreach ($usuarios as $usuario_id) {
                    $stmt_usuario->execute([$tarefa_id, $usuario_id]);
                }
            }
            sucesso(['id' => $tarefa_id, 'mensagem' => 'Tarefa criada com sucesso']);
            break;

        case 'atualizar_tarefa':
            // Atualiza uma tarefa existente
            $dados = json_decode(file_get_contents('php://input'), true);
            $tarefa_id = filter_var($dados['tarefa_id'] ?? null, FILTER_VALIDATE_INT);
            $titulo = sanitizar($dados['titulo'] ?? '');
            $descricao = sanitizar($dados['descricao'] ?? '');
            $data_inicio = sanitizar($dados['data_inicio'] ?? '');
            $data_fim = sanitizar($dados['data_fim'] ?? '');
            $prioridade = sanitizar($dados['prioridade'] ?? '');
            $progresso_manual = filter_var($dados['progresso_manual'] ?? null, FILTER_VALIDATE_INT);
            $status = sanitizar($dados['status'] ?? '');
            $usuarios = $dados["usuarios"] ?? null;

            if (!$tarefa_id) {
                erro('ID da tarefa é obrigatório.');
            }

            // Validação de datas (se fornecidas)
            if (!empty($data_inicio) && !empty($data_fim)) {
                $ts_inicio = strtotime(str_replace('T', ' ', $data_inicio));
                $ts_fim = strtotime(str_replace('T', ' ', $data_fim));
                if ($ts_inicio === false || $ts_fim === false) {
                    erro('Formato de data inválido.');
                }
                if ($ts_fim < $ts_inicio) {
                    erro('Data de término não pode ser anterior à data de início.');
                }
            }

            // Monta a query de atualização dinamicamente
            $set_clauses = [];
            $params = [];

            if (!empty($titulo)) {
                $set_clauses[] = 'titulo = ?';
                $params[] = $titulo;
            }
            if (!empty($descricao)) {
                $set_clauses[] = 'descricao = ?';
                $params[] = $descricao;
            }
            if (!empty($data_inicio)) {
                $set_clauses[] = 'data_inicio = ?';
                $params[] = $data_inicio;
            }
            if (!empty($data_fim)) {
                $set_clauses[] = 'data_fim = ?';
                $params[] = $data_fim;
            }
            if (!empty($prioridade)) {
                $set_clauses[] = 'prioridade = ?';
                $params[] = $prioridade;
            }
            if ($progresso_manual !== null) {
                $set_clauses[] = 'progresso_manual = ?';
                $params[] = $progresso_manual;
            }
            if (!empty($status)) {
                $set_clauses[] = 'status = ?';
                $params[] = $status;
            }

            if (empty($set_clauses)) {
                erro('Nenhum dado para atualizar.');
            }

            $set_clauses[] = 'data_atualizacao = NOW()';

            $sql = "UPDATE tarefas SET " . implode(', ', $set_clauses) . " WHERE id = ?";
            $params[] = $tarefa_id;

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            // Atualiza usuários da tarefa (se fornecidos)
            if ($usuarios !== null) {
                // 1. Remove todos os usuários existentes
                $stmt_delete = $pdo->prepare("DELETE FROM tarefa_usuarios WHERE tarefa_id = ?");
                $stmt_delete->execute([$tarefa_id]);

                // 2. Adiciona os novos usuários
                if (!empty($usuarios) && is_array($usuarios)) {
                    $stmt_usuario = $pdo->prepare("INSERT INTO tarefa_usuarios (tarefa_id, usuario_id) VALUES (?, ?)");
                    foreach ($usuarios as $usuario_id) {
                        $stmt_usuario->execute([$tarefa_id, $usuario_id]);
                    }
                }
            }

            // Se o progresso manual foi atualizado, verifica se a tarefa deve ser marcada como concluída/reaberta
            if ($progresso_manual !== null) {
                if ($progresso_manual == 100) {
                    $update_status = $pdo->prepare("UPDATE tarefas SET concluida = 1, status = 'concluida', data_conclusao_real = NOW() WHERE id = ?");
                    $update_status->execute([$tarefa_id]);
                } else {
                    $update_status = $pdo->prepare("UPDATE tarefas SET concluida = 0, status = 'iniciada', data_conclusao_real = NULL WHERE id = ? AND status = 'concluida'");
                    $update_status->execute([$tarefa_id]);
                }
            }

            sucesso(['mensagem' => 'Tarefa atualizada com sucesso']);
            break;

        case 'pausar_tarefa':
            // Pausa uma tarefa
            $dados = json_decode(file_get_contents('php://input'), true);
            $tarefa_id = filter_var($dados['tarefa_id'] ?? null, FILTER_VALIDATE_INT);
            if (!$tarefa_id) {
                erro('ID da tarefa inválido.');
            }
            $stmt = $pdo->prepare("UPDATE tarefas SET status = 'pausada', data_atualizacao = NOW() WHERE id = ?");
            $stmt->execute([$tarefa_id]);
            sucesso(['mensagem' => 'Tarefa pausada com sucesso']);
            break;

        case 'iniciar_tarefa':
            // Inicia uma tarefa
            $dados = json_decode(file_get_contents('php://input'), true);
            $tarefa_id = filter_var($dados['tarefa_id'] ?? null, FILTER_VALIDATE_INT);
            if (!$tarefa_id) {
                erro('ID da tarefa inválido.');
            }
            $stmt = $pdo->prepare("UPDATE tarefas SET status = 'iniciada', data_atualizacao = NOW() WHERE id = ?");
            $stmt->execute([$tarefa_id]);
            sucesso(['mensagem' => 'Tarefa iniciada com sucesso']);
            break;

        case 'concluir_tarefa':
            // Marca uma tarefa como concluída
            $dados = json_decode(file_get_contents('php://input'), true);
            $tarefa_id = filter_var($dados['tarefa_id'] ?? null, FILTER_VALIDATE_INT);
            $data_conclusao = sanitizar($dados['data_conclusao'] ?? date('Y-m-d H:i:s'));

            if (!$tarefa_id) {
                erro('ID da tarefa inválido.');
            }

            // Define concluida=1, status='concluida' e data_conclusao_real
            $stmt = $pdo->prepare("UPDATE tarefas SET concluida = 1, status = 'concluida', data_conclusao_real = ?, data_atualizacao = NOW() WHERE id = ?");
            $stmt->execute([$data_conclusao, $tarefa_id]);
            sucesso(['mensagem' => 'Tarefa marcada como concluída com sucesso']);
            break;

        case 'reabrir_tarefa':
            // Reabre uma tarefa concluída
            $dados = json_decode(file_get_contents('php://input'), true);
            $tarefa_id = filter_var($dados['tarefa_id'] ?? null, FILTER_VALIDATE_INT);
            $novo_status = sanitizar($dados['novo_status'] ?? 'iniciada');

            if (!$tarefa_id) {
                erro('ID da tarefa inválido.');
            }

            // Define concluida=0, status='novo_status' e limpa data_conclusao_real
            $stmt = $pdo->prepare("UPDATE tarefas SET concluida = 0, status = ?, data_conclusao_real = NULL, data_atualizacao = NOW() WHERE id = ?");
            $stmt->execute([$novo_status, $tarefa_id]);
            sucesso(['mensagem' => 'Tarefa reaberta com sucesso']);
            break;

        case 'deletar_tarefa':
            // Exclui uma tarefa (soft delete)
            $dados = json_decode(file_get_contents('php://input'), true);
            $tarefa_id = filter_var($dados['tarefa_id'] ?? null, FILTER_VALIDATE_INT);
            if (!$tarefa_id) {
                erro('ID da tarefa inválido.');
            }
            // Verificar permissão: apenas administradores podem excluir tarefas
            $user_id = $tokenData['user_id'] ?? 0;
            $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
            $stmt->execute([$user_id]);
            $usuario_logado = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario_logado || $usuario_logado['funcao'] !== 'admin') {
                erro('Acesso negado. Apenas administradores podem excluir tarefas.', 403);
            }

            // Soft delete: marca a tarefa como 'excluida'
            $stmt = $pdo->prepare("UPDATE tarefas SET status = 'excluida', data_atualizacao = NOW() WHERE id = ?");
            $stmt->execute([$tarefa_id]);

            sucesso(['mensagem' => 'Tarefa excluída com sucesso']);
            break;

        // =================================================================
        // [6.4] GERENCIAMENTO DE ETAPAS (CHECKLIST)
        // =================================================================

        case 'criar_etapa':          // ← Frontend expects this
        case 'adicionaretapa':       // ← Backend had this
            // Adiciona uma nova etapa (item de checklist) a uma tarefa
            $dados = json_decode(file_get_contents('php://input'), true);

            // Support both naming conventions (tarefa_id and tarefaid)
            $tarefa_id = filter_var($dados['tarefa_id'] ?? $dados['tarefaid'] ?? null, FILTER_VALIDATE_INT);
            $descricao = sanitizar($dados['descricao'] ?? '');

            if (!$tarefa_id || empty($descricao)) {
                erro('ID da tarefa e descrição da etapa são obrigatórios.');
            }

            $stmt = $pdo->prepare("INSERT INTO tarefa_etapas (tarefa_id, descricao, concluida) VALUES (?, ?, 0)");
            $stmt->execute([$tarefa_id, $descricao]);
            $etapa_id = $pdo->lastInsertId();

            // Recalcula o progresso da tarefa após a adição
            $stmt_tarefa = $pdo->prepare("SELECT progresso_manual FROM tarefas WHERE id = ?");
            $stmt_tarefa->execute([$tarefa_id]);
            $progresso_manual = $stmt_tarefa->fetchColumn();

            $progresso = calcular_progresso_tarefa($pdo, $tarefa_id, $progresso_manual);

            sucesso(['id' => $etapa_id, 'mensagem' => 'Etapa adicionada com sucesso', 'progresso' => $progresso]);
            break;

        case 'concluir_etapa':
            // Marca uma etapa como concluída
            $dados = json_decode(file_get_contents('php://input'), true);
            $etapa_id = filter_var($dados['etapa_id'] ?? null, FILTER_VALIDATE_INT);

            if (!$etapa_id) {
                erro('ID da etapa é obrigatório.');
            }

            // 1. Marca a etapa como concluída
            $stmt = $pdo->prepare("UPDATE tarefa_etapas SET concluida = 1 WHERE id = ?");
            $stmt->execute([$etapa_id]);

            // 2. Obtém o ID da tarefa associada
            $stmt_tarefa_id = $pdo->prepare("SELECT tarefa_id FROM tarefa_etapas WHERE id = ?");
            $stmt_tarefa_id->execute([$etapa_id]);
            $tarefa_id = $stmt_tarefa_id->fetchColumn();

            if ($tarefa_id) {
                // 3. Recalcula o progresso da tarefa (calcular_progresso_tarefa() está em helpers.php)
                $stmt_tarefa = $pdo->prepare("SELECT progresso_manual FROM tarefas WHERE id = ?");
                $stmt_tarefa->execute([$tarefa_id]);
                $progresso_manual = $stmt_tarefa->fetchColumn();
                $progresso = calcular_progresso_tarefa($pdo, $tarefa_id, $progresso_manual);

                // 4. Se o progresso for 100%, marca a tarefa como concluída
                if ($progresso == 100) {
                    $update_tarefa = $pdo->prepare("UPDATE tarefas SET concluida = 1, status = 'concluida', data_conclusao_real = NOW() WHERE id = ?");
                    $update_tarefa->execute([$tarefa_id]);
                }
            }

            sucesso(['mensagem' => 'Etapa concluída com sucesso', 'progresso_calculado' => $progresso ?? null]);
            break;

        case 'reabrir_etapa':
            // Marca uma etapa como pendente (reabre)
            $dados = json_decode(file_get_contents('php://input'), true);
            $etapa_id = filter_var($dados['etapa_id'] ?? null, FILTER_VALIDATE_INT);

            if (!$etapa_id) {
                erro('ID da etapa é obrigatório.');
            }

            // 1. Marca a etapa como pendente
            $stmt = $pdo->prepare("UPDATE tarefa_etapas SET concluida = 0 WHERE id = ?");
            $stmt->execute([$etapa_id]);

            // 2. Obtém o ID da tarefa associada
            $stmt_tarefa_id = $pdo->prepare("SELECT tarefa_id FROM tarefa_etapas WHERE id = ?");
            $stmt_tarefa_id->execute([$etapa_id]);
            $tarefa_id = $stmt_tarefa_id->fetchColumn();

            if ($tarefa_id) {
                // 3. Recalcula o progresso da tarefa (calcular_progresso_tarefa() está em helpers.php)
                $stmt_tarefa = $pdo->prepare("SELECT progresso_manual FROM tarefas WHERE id = ?");
                $stmt_tarefa->execute([$tarefa_id]);
                $progresso_manual = $stmt_tarefa->fetchColumn();
                $progresso = calcular_progresso_tarefa($pdo, $tarefa_id, $progresso_manual);

                // 4. Se a tarefa estava concluída, reabre (concluida=0, status='iniciada')
                $update_tarefa = $pdo->prepare("UPDATE tarefas SET concluida = 0, status = 'iniciada', data_conclusao_real = NULL WHERE id = ? AND status = 'concluida'");
                $update_tarefa->execute([$tarefa_id]);
            }

            sucesso(['mensagem' => 'Etapa reaberta com sucesso', 'progresso_calculado' => $progresso ?? null]);
            break;

        case 'atualizar_etapa':      // ← Frontend might use this
        case 'atualizaretapa':       // ← Backend has this
            // Marca uma etapa como concluída ou pendente
            $dados = json_decode(file_get_contents('php://input'), true);

            // Support both naming conventions (etapa_id and etapaid)
            $etapa_id = filter_var($dados['etapa_id'] ?? $dados['etapaid'] ?? null, FILTER_VALIDATE_INT);
            $concluida = isset($dados['concluida']) ? (int)$dados['concluida'] : 0;

            if (!$etapa_id) {
                erro('ID da etapa é obrigatório.');
            }

            // 1. Marca a etapa como concluída ou pendente
            $stmt = $pdo->prepare("UPDATE tarefa_etapas SET concluida = ? WHERE id = ?");
            $stmt->execute([$concluida, $etapa_id]);

            // 2. Obtém o ID da tarefa associada
            $stmt_tarefa_id = $pdo->prepare("SELECT tarefa_id FROM tarefa_etapas WHERE id = ?");
            $stmt_tarefa_id->execute([$etapa_id]);
            $tarefa_id = $stmt_tarefa_id->fetchColumn();

            if ($tarefa_id) {
                // 3. Recalcula o progresso da tarefa
                $stmt_tarefa = $pdo->prepare("SELECT progresso_manual FROM tarefas WHERE id = ?");
                $stmt_tarefa->execute([$tarefa_id]);
                $progresso_manual = $stmt_tarefa->fetchColumn();

                $progresso = calcular_progresso_tarefa($pdo, $tarefa_id, $progresso_manual);

                // 4. Se o progresso for 100, marca a tarefa como concluída
                if ($progresso >= 100) {
                    $update_tarefa = $pdo->prepare("UPDATE tarefas SET concluida = 1, status = 'concluida', data_conclusao_real = NOW() WHERE id = ?");
                    $update_tarefa->execute([$tarefa_id]);
                } else {
                    // Garante que não está marcada como concluída se progresso < 100
                    $update_tarefa = $pdo->prepare("UPDATE tarefas SET concluida = 0, status = 'iniciada', data_conclusao_real = NULL WHERE id = ? AND status = 'concluida'");
                    $update_tarefa->execute([$tarefa_id]);
                }
            }

            sucesso(['mensagem' => 'Etapa atualizada com sucesso', 'progresso' => $progresso ?? null]);
            break;

        case 'deletar_etapa':        // ← Frontend might use this
        case 'deletaretapa':         // ← Backend has this
            // Deleta uma etapa
            $dados = json_decode(file_get_contents('php://input'), true);

            // Support both naming conventions (etapa_id and etapaid)
            $etapa_id = filter_var($dados['etapa_id'] ?? $dados['etapaid'] ?? null, FILTER_VALIDATE_INT);

            if (!$etapa_id) {
                erro('ID da etapa é obrigatório.');
            }

            // 1. Obtém o ID da tarefa associada antes de deletar
            $stmt_tarefa_id = $pdo->prepare("SELECT tarefa_id FROM tarefa_etapas WHERE id = ?");
            $stmt_tarefa_id->execute([$etapa_id]);
            $tarefa_id = $stmt_tarefa_id->fetchColumn();

            // 2. Deleta a etapa
            $stmt = $pdo->prepare("DELETE FROM tarefa_etapas WHERE id = ?");
            $stmt->execute([$etapa_id]);

            if ($tarefa_id) {
                // 3. Recalcula o progresso da tarefa
                $stmt_tarefa = $pdo->prepare("SELECT progresso_manual FROM tarefas WHERE id = ?");
                $stmt_tarefa->execute([$tarefa_id]);
                $progresso_manual = $stmt_tarefa->fetchColumn();

                $progresso = calcular_progresso_tarefa($pdo, $tarefa_id, $progresso_manual);

                // 4. Se o progresso for 100, marca a tarefa como concluída
                if ($progresso >= 100) {
                    $update_tarefa = $pdo->prepare("UPDATE tarefas SET concluida = 1, status = 'concluida', data_conclusao_real = NOW() WHERE id = ?");
                    $update_tarefa->execute([$tarefa_id]);
                } else {
                    // Garante que não está marcada como concluída se progresso < 100
                    $update_tarefa = $pdo->prepare("UPDATE tarefas SET concluida = 0, status = 'iniciada', data_conclusao_real = NULL WHERE id = ? AND status = 'concluida'");
                    $update_tarefa->execute([$tarefa_id]);
                }
            }

            sucesso(['mensagem' => 'Etapa deletada com sucesso', 'progresso' => $progresso ?? null]);
            break;

        // =================================================================
        // [6.5] GERENCIAMENTO DE ARQUIVOS
        // =================================================================

        case 'upload_arquivo':
            // Faz upload de um arquivo para uma tarefa
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                erro('Método não permitido', 405);
            }

            // A autenticação já foi verificada no roteamento principal

            // Verificar se arquivo foi enviado
            if (!isset($_FILES['arquivo']) || $_FILES['arquivo']['error'] !== UPLOAD_ERR_OK) {
                erro('Nenhum arquivo enviado ou erro no upload');
            }

            $arquivo = $_FILES['arquivo'];
            // Dados da tarefa e usuário são esperados no POST
            $tarefa_id = filter_var($_POST['tarefa_id'] ?? null, FILTER_VALIDATE_INT);
            $usuario_id = $tokenData['user_id'] ?? 0; // Usa o ID do usuário autenticado

            if (!$tarefa_id || !$usuario_id) {
                erro('ID da tarefa e usuário são obrigatórios');
            }

            // Validação de tamanho do arquivo (MAX_FILE_SIZE deve ser definido em config.php)
            if (!defined('MAX_FILE_SIZE') || !defined('ALLOWED_EXTENSIONS') || !defined('UPLOAD_DIR')) {
                erro('Constantes de configuração de upload (MAX_FILE_SIZE, ALLOWED_EXTENSIONS, UPLOAD_DIR) não definidas.', 500);
            }

            if ($arquivo['size'] > MAX_FILE_SIZE) {
                // formatarTamanhoArquivo() está em helpers.php
                erro('Arquivo muito grande. Tamanho máximo: ' . formatarTamanhoArquivo(MAX_FILE_SIZE));
            }

            // Validação de extensão (ALLOWED_EXTENSIONS deve ser definido em config.php)
            $extensao = strtolower(pathinfo($arquivo['name'], PATHINFO_EXTENSION));
            if (!in_array($extensao, ALLOWED_EXTENSIONS)) {
                erro('Tipo de arquivo não permitido. Extensões permitidas: ' . implode(', ', ALLOWED_EXTENSIONS));
            }

            // Diretório de upload (UPLOAD_DIR deve ser definido em config.php)
            $upload_dir = UPLOAD_DIR . '/' . $tarefa_id;
            if (!is_dir($upload_dir)) {
                // Tenta criar o diretório recursivamente
                if (!mkdir($upload_dir, 0777, true)) {
                    erro('Falha ao criar o diretório de upload.', 500);
                }
            }

            // Criar nome único para o arquivo
            $nome_arquivo_unico = uniqid() . '.' . $extensao;
            $caminho_completo = $upload_dir . '/' . $nome_arquivo_unico;

            // Move o arquivo temporário para o destino final
            if (!move_uploaded_file($arquivo['tmp_name'], $caminho_completo)) {
                erro('Falha ao mover o arquivo para o destino.');
            }

            // Insere registro no banco de dados
            // Correção 1: Remover o 'id' da lista (é auto_increment)
            // Correção 2: Ajustar a ordem e número de parâmetros
            $stmt = $pdo->prepare("INSERT INTO tarefas_arquivos (tarefa_id, usuario_id, nome_arquivo, nome_original, tamanho, tipo) VALUES (?, ?, ?, ?, ?, ?)");

            // Correção 3: Ajustar a ordem dos valores no execute()
            $stmt->execute([
                $tarefa_id,                    // tarefa_id
                $usuario_id,                   // usuario_id  
                $nome_arquivo_unico,           // nome_arquivo (nome único gerado)
                sanitizar($arquivo['name']),   // nome_original (nome original do arquivo)
                $arquivo['size'],              // tamanho
                $arquivo['type']               // tipo
                // data_upload é automaticamente preenchido com current_timestamp()
            ]);
            $arquivo_id = $pdo->lastInsertId();

            sucesso(['id' => $arquivo_id, 'mensagem' => 'Upload realizado com sucesso', 'nome_arquivo' => $nome_arquivo_unico]);
            break;

        case 'obter_arquivos_tarefa': // Alias for frontend compatibility
        case 'obter_arquivos':
            // Lista arquivos de uma tarefa
            $tarefa_id = filter_var($_GET['tarefa_id'] ?? null, FILTER_VALIDATE_INT);

            if (!$tarefa_id) {
                erro('ID da tarefa é obrigatório');
            }

            $stmt = $pdo->prepare("
        SELECT ta.id, ta.nome_original, ta.tamanho, ta.tipo, ta.data_upload, u.nome as usuario_nome
        FROM tarefas_arquivos ta
        INNER JOIN usuarios u ON ta.usuario_id = u.id
        WHERE ta.tarefa_id = ?
        ORDER BY ta.data_upload DESC
    ");
            $stmt->execute([$tarefa_id]);
            $arquivos = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Formata o tamanho do arquivo para exibição
            foreach ($arquivos as &$arquivo) {
                $arquivo['tamanho_formatado'] = formatarTamanhoArquivo($arquivo['tamanho']);
            }

            sucesso($arquivos);
            break;

        case 'download_arquivo':
            // Permite o download de um arquivo
            $arquivo_id = filter_var($_GET['arquivo_id'] ?? null, FILTER_VALIDATE_INT);

            if (!$arquivo_id) {
                erro('ID do arquivo é obrigatório');
            }

            // Busca informações do arquivo
            $stmt = $pdo->prepare("SELECT nome_original, caminho, tipo, tamanho FROM tarefas_arquivos WHERE id = ?");
            $stmt->execute([$arquivo_id]);
            $arquivo = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$arquivo || !file_exists($arquivo['caminho'])) {
                erro('Arquivo não encontrado', 404);
            }

            // Envia o arquivo para download
            ob_clean(); // Limpa o buffer de saída
            header('Content-Description: File Transfer');
            header('Content-Type: ' . $arquivo['tipo']);
            header('Content-Disposition: attachment; filename="' . $arquivo['nome_original'] . '"');
            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . $arquivo['tamanho']);
            readfile($arquivo['caminho']);
            exit;
            break;

        case 'deletar_arquivo':
            // Deleta um arquivo e seu registro no banco
            $dados = json_decode(file_get_contents('php://input'), true);
            $arquivo_id = filter_var($dados['arquivo_id'] ?? null, FILTER_VALIDATE_INT);

            if (!$arquivo_id) {
                erro('ID do arquivo é obrigatório.');
            }

            // 1. Busca o caminho do arquivo
            $stmt = $pdo->prepare("SELECT caminho FROM tarefas_arquivos WHERE id = ?");
            $stmt->execute([$arquivo_id]);
            $caminho = $stmt->fetchColumn();

            // 2. Deleta o registro no banco
            $stmt = $pdo->prepare("DELETE FROM tarefas_arquivos WHERE id = ?");
            $stmt->execute([$arquivo_id]);

            // 3. Deleta o arquivo físico (se existir)
            if ($caminho && file_exists($caminho)) {
                unlink($caminho);
            }

            sucesso(['mensagem' => 'Arquivo deletado com sucesso']);
            break;

        // =================================================================
        // [6.6] GERENCIAMENTO DE COMENTÁRIOS
        // =================================================================

        case 'adicionar_comentario':
            // Adiciona um novo comentário a uma tarefa
            $dados = json_decode(file_get_contents('php://input'), true);
            $tarefa_id = filter_var($dados['tarefa_id'] ?? null, FILTER_VALIDATE_INT);
            $usuario_id = $tokenData['user_id'] ?? 0; // Usa o ID do usuário autenticado
            $comentario = sanitizar($dados['comentario'] ?? '');

            if (!$tarefa_id || !$usuario_id || empty($comentario)) {
                erro('ID da tarefa, ID do usuário e comentário são obrigatórios.');
            }

            $stmt = $pdo->prepare("INSERT INTO tarefas_comentarios (tarefa_id, usuario_id, comentario) VALUES (?, ?, ?)");
            $stmt->execute([$tarefa_id, $usuario_id, $comentario]);
            $comentario_id = $pdo->lastInsertId();

            sucesso(['id' => $comentario_id, 'mensagem' => 'Comentário adicionado com sucesso']);
            break;

        case 'obter_comentarios_tarefa': // Adicionado para compatibilidade com o frontend
        case 'obter_comentarios':
            // Lista comentários de uma tarefa
            $tarefa_id = filter_var($_GET['tarefa_id'] ?? null, FILTER_VALIDATE_INT);

            if (!$tarefa_id) {
                erro('ID da tarefa é obrigatório');
            }

            $stmt = $pdo->prepare("
                SELECT tc.id, tc.comentario, tc.data_criacao, u.nome as usuario_nome, u.id as usuario_id
                FROM tarefas_comentarios tc
                INNER JOIN usuarios u ON tc.usuario_id = u.id
                WHERE tc.tarefa_id = ?
                ORDER BY tc.data_criacao ASC
            ");
            $stmt->execute([$tarefa_id]);
            $comentarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

            sucesso($comentarios);
            break;

        case 'deletar_comentario':
            // Deleta um comentário (apenas o autor ou admin)
            $dados = json_decode(file_get_contents('php://input'), true);
            $comentario_id = filter_var($dados['comentario_id'] ?? null, FILTER_VALIDATE_INT);
            $user_id = $tokenData['user_id'] ?? 0;

            if (!$comentario_id) {
                erro('ID do comentário é obrigatório.');
            }

            // 1. Busca o autor do comentário e a função do usuário logado
            $stmt = $pdo->prepare("
                SELECT tc.usuario_id, u.funcao 
                FROM tarefas_comentarios tc
                INNER JOIN usuarios u ON u.id = ?
                WHERE tc.id = ?
            ");
            $stmt->execute([$user_id, $comentario_id]);
            $info = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$info) {
                erro('Comentário não encontrado ou usuário não existe.', 404);
            }

            $eh_admin = ($info['funcao'] === 'admin');
            $eh_autor = ($info['usuario_id'] == $user_id);

            // 2. Verifica permissão
            if (!$eh_admin && !$eh_autor) {
                erro('Acesso negado. Apenas o autor ou um administrador pode deletar este comentário.', 403);
            }

            // 3. Deleta o comentário
            $stmt = $pdo->prepare("DELETE FROM tarefas_comentarios WHERE id = ?");
            $stmt->execute([$comentario_id]);

            sucesso(['mensagem' => 'Comentário deletado com sucesso']);
            break;

        // =================================================================
        // [6.7] RELATÓRIOS (APENAS ADMIN)
        // =================================================================

        case 'relatorio_geral':
            // Gera um relatório geral de estatísticas (apenas para admin)
            $user_id = $tokenData['user_id'] ?? 0;
            $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
            $stmt->execute([$user_id]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario || $usuario['funcao'] !== 'admin') {
                erro('Acesso negado. Apenas administradores podem acessar relatórios.', 403);
            }

            // 1. Total de Projetos
            $total_projetos = $pdo->query("SELECT COUNT(*) FROM projetos WHERE status != 'excluido'")->fetchColumn();
            // 2. Projetos Ativos
            $projetos_ativos = $pdo->query("SELECT COUNT(*) FROM projetos WHERE status = 'ativo'")->fetchColumn();
            // 3. Projetos Concluídos
            $projetos_concluidos = $pdo->query("SELECT COUNT(*) FROM projetos WHERE status = 'concluido'")->fetchColumn();

            // 4. Total de Tarefas
            $total_tarefas = $pdo->query("SELECT COUNT(*) FROM tarefas WHERE status != 'excluida'")->fetchColumn();
            // 5. Tarefas Concluídas
            $tarefas_concluidas = $pdo->query("SELECT COUNT(*) FROM tarefas WHERE status = 'concluida'")->fetchColumn();
            // 6. Tarefas Atrasadas (data_fim < NOW() e status != 'concluida' e status != 'excluida')
            $tarefas_atrasadas = $pdo->query("SELECT COUNT(*) FROM tarefas WHERE data_fim < NOW() AND status != 'concluida' AND status != 'excluida'")->fetchColumn();
            // 7. Tarefas Pausadas
            $tarefas_pausadas = $pdo->query("SELECT COUNT(*) FROM tarefas WHERE status = 'pausada'")->fetchColumn();

            $resultado = [
                'projetos' => [
                    'total' => (int)$total_projetos,
                    'ativos' => (int)$projetos_ativos,
                    'concluidos' => (int)$projetos_concluidos,
                ],
                'tarefas' => [
                    'total' => (int)$total_tarefas,
                    'concluidas' => (int)$tarefas_concluidas,
                    'atrasadas' => (int)$tarefas_atrasadas,
                    'pausadas' => (int)$tarefas_pausadas,
                    'taxa_conclusao' => $total_tarefas > 0 ? round(($tarefas_concluidas / $total_tarefas) * 100, 2) : 0,
                ],
            ];

            sucesso($resultado);
            break;

        case 'relatorio_tarefas_atrasadas':
            // Gera relatório de tarefas atrasadas (apenas para admin)
            $usuario_id = $tokenData['user_id'] ?? 0;

            $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
            $stmt->execute([$usuario_id]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario || $usuario['funcao'] != 'admin') {
                erro('Acesso negado. Apenas administradores podem acessar relatórios.', 403);
            }

            $agora = date('Y-m-d H:i:s');

            // Buscar tarefas atrasadas
            $stmt = $pdo->prepare("
                SELECT 
                    t.id, 
                    t.titulo, 
                    t.descricao, 
                    t.data_inicio, 
                    t.data_fim, 
                    t.status, 
                    t.prioridade, 
                    t.progresso_manual, 
                    p.nome as projeto_nome,
                    (SELECT GROUP_CONCAT(u.nome SEPARATOR ', ') 
                     FROM usuarios u 
                     INNER JOIN tarefa_usuarios tu ON u.id = tu.usuario_id 
                     WHERE tu.tarefa_id = t.id) as usuarios_nomes,
                    DATEDIFF(?, t.data_fim) as dias_atraso
                FROM tarefas t
                INNER JOIN projetos p ON t.projeto_id = p.id
                WHERE t.status != 'excluida' 
                    AND t.status != 'concluida'
                    AND t.data_fim < ?
                ORDER BY t.data_fim ASC
            ");

            $stmt->execute([$agora, $agora]);
            $tarefas = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Formatar usuários e calcular progresso para cada tarefa
            foreach ($tarefas as &$tarefa) {
                // 1. Usuários
                if ($tarefa['usuarios_nomes']) {
                    $tarefa['usuarios'] = array_map(
                        function ($nome) {
                            return trim($nome);
                        },
                        explode(',', $tarefa['usuarios_nomes'])
                    );
                } else {
                    $tarefa['usuarios'] = [];
                }
                unset($tarefa['usuarios_nomes']);

                // 2. Progresso (reutiliza a função calcular_progresso_tarefa() de helpers.php)
                $tarefa['progresso'] = calcular_progresso_tarefa($pdo, $tarefa['id'], $tarefa['progresso_manual']);
            }
            unset($tarefa);

            sucesso($tarefas);
            break;

        case 'relatorio_tarefas_pausadas':
            // Gera relatório de tarefas pausadas (apenas para admin)
            $user_id = $tokenData['user_id'] ?? 0;
            $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
            $stmt->execute([$user_id]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario || $usuario['funcao'] !== 'admin') {
                erro('Acesso negado. Apenas administradores podem acessar relatórios.', 403);
            }

            $hoje = date('Y-m-d H:i:s');

            // Buscar tarefas pausadas
            $stmt = $pdo->prepare("
                SELECT 
                    t.id, t.titulo, t.descricao, t.data_inicio, t.data_fim, t.status, t.prioridade, t.progresso_manual,
                    p.nome as projeto_nome,
                    (SELECT GROUP_CONCAT(u.nome SEPARATOR ', ') 
                     FROM usuarios u 
                     INNER JOIN tarefa_usuarios tu ON u.id = tu.usuario_id 
                     WHERE tu.tarefa_id = t.id) as usuarios_nomes,
                    DATEDIFF(t.data_fim, ?) as dias_ate_prazo
                FROM tarefas t
                INNER JOIN projetos p ON t.projeto_id = p.id
                WHERE t.status = 'pausada' AND t.status != 'excluida'
                ORDER BY t.data_fim ASC
            ");
            $stmt->execute([$hoje]);
            $tarefas = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Formatar usuários e calcular progresso para cada tarefa
            foreach ($tarefas as &$tarefa) {
                // 1. Usuários
                if ($tarefa['usuarios_nomes']) {
                    $tarefa['usuarios'] = array_map(function ($nome) {
                        return ['nome' => trim($nome)];
                    }, explode(',', $tarefa['usuarios_nomes']));
                } else {
                    $tarefa['usuarios'] = [];
                }
                unset($tarefa['usuarios_nomes']);

                // 2. Progresso (reutiliza a função calcular_progresso_tarefa() de helpers.php)
                $tarefa['progresso'] = calcular_progresso_tarefa($pdo, $tarefa['id'], $tarefa['progresso_manual']);
            }
            unset($tarefa);

            sucesso($tarefas);
            break;

        case 'relatorio_por_projeto':
            // Gera relatório por projeto (apenas para admin)
            $user_id = $tokenData['user_id'] ?? 0;
            $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
            $stmt->execute([$user_id]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario || $usuario['funcao'] !== 'admin') {
                erro('Acesso negado. Apenas administradores podem acessar relatórios.', 403);
            }

            // Buscar estatísticas por projeto
            $stmt = $pdo->query("
                SELECT 
                    p.id,
                    p.nome,
                    COALESCE(SUM(CASE WHEN t.id IS NOT NULL AND t.status != 'excluida' THEN 1 ELSE 0 END),0) AS total_tarefas,
                    COALESCE(SUM(CASE WHEN t.id IS NOT NULL AND (t.concluida = 1 OR t.status = 'concluida') THEN 1 ELSE 0 END),0) AS concluidas,
                    COALESCE(SUM(CASE WHEN t.id IS NOT NULL AND t.status = 'iniciada' THEN 1 ELSE 0 END),0) AS em_andamento,
                    COALESCE(SUM(CASE WHEN t.id IS NOT NULL AND t.status = 'pausada' THEN 1 ELSE 0 END),0) AS pausadas,
                    COALESCE(SUM(CASE WHEN t.id IS NOT NULL AND t.status != 'concluida' AND t.data_fim < NOW() THEN 1 ELSE 0 END),0) AS atrasadas
                FROM projetos p
                LEFT JOIN tarefas t
                    ON p.id = t.projeto_id AND t.status != 'excluida'
                WHERE p.status = 'ativo'
                GROUP BY p.id, p.nome
                ORDER BY p.nome
            ");
            $projetos = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Calcular taxa de conclusão para cada projeto
            foreach ($projetos as &$projeto) {
                $total = $projeto['total_tarefas'] ?: 1; // Evitar divisão por zero
                $projeto['taxa_conclusao'] = round(($projeto['concluidas'] / $total) * 100);
            }
            unset($projeto);

            sucesso($projetos);
            break;

        case 'relatorio_por_usuario':
            // Gera relatório por usuário (apenas para admin)
            $user_id = $tokenData['user_id'] ?? 0;
            $stmt = $pdo->prepare("SELECT funcao FROM usuarios WHERE id = ?");
            $stmt->execute([$user_id]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario || $usuario['funcao'] !== 'admin') {
                erro('Acesso negado. Apenas administradores podem acessar relatórios.', 403);
            }

            // Buscar estatísticas por usuário
            $stmt = $pdo->query("
                SELECT 
                    u.id, u.nome, u.email,
                    COALESCE(SUM(CASE WHEN t.status IS NOT NULL AND t.status != 'excluida' THEN 1 ELSE 0 END),0) as total_tarefas,
                    COALESCE(SUM(CASE WHEN (t.concluida = 1 OR t.status = 'concluida') THEN 1 ELSE 0 END),0) as concluidas,
                    COALESCE(SUM(CASE WHEN t.status = 'iniciada' THEN 1 ELSE 0 END),0) as em_andamento,
                    COALESCE(SUM(CASE WHEN t.status = 'pausada' THEN 1 ELSE 0 END),0) as pausadas,
                    COALESCE(SUM(CASE WHEN t.status != 'concluida' AND t.data_fim < NOW() THEN 1 ELSE 0 END),0) as atrasadas
                FROM usuarios u
                LEFT JOIN tarefa_usuarios tu ON u.id = tu.usuario_id
                LEFT JOIN tarefas t ON tu.tarefa_id = t.id AND t.status != 'excluida'
                WHERE u.ativo = 1
                GROUP BY u.id, u.nome, u.email
                ORDER BY u.nome
            ");
            $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Calcular taxa de conclusão para cada usuário
            foreach ($usuarios as &$usuario) {
                $total = $usuario['total_tarefas'] ?: 1; // Evitar divisão por zero
                $usuario['taxa_conclusao'] = round(($usuario['concluidas'] / $total) * 100);
            }
            unset($usuario);

            sucesso($usuarios);
            break;

        // =================================================================
        // [6.8] AÇÃO NÃO ENCONTRADA
        // =================================================================

        default:
            erro('Ação desconhecida: ' . $action, 404);
            break;
    }
} catch (Exception $e) {
    // Captura exceções gerais (ex: erro de PDO)
    // registrar_log() está em config.php
    // Tenta registrar o log, mas se falhar, apenas retorna o erro 500
    if (function_exists('registrar_log')) {
        registrar_log("Erro na API: " . $e->getMessage(), 'ERROR');
    }
    erro('Erro interno do servidor: ' . $e->getMessage(), 500);
}

// Encerra o buffer de saída no final do script
ob_end_flush();
