<?php
/**
 * Handlers de Endpoints - Usuários
 * 
 * Gerencia todas as operações relacionadas a usuários:
 * login, registro, listagem, atualização e exclusão.
 */

/**
 * Handler: Login de usuário
 */
function handle_login($pdo, $inputData)
{
    $email = sanitizar($inputData['email'] ?? '');
    $senha = $inputData['senha'] ?? '';

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
}

/**
 * Handler: Registro de novo usuário
 */
function handle_register($pdo, $inputData)
{
    $nome = sanitizar($inputData['nome'] ?? '');
    $email = sanitizar($inputData['email'] ?? '');
    $username = sanitizar($inputData['username'] ?? '');
    $senha = $inputData['senha'] ?? '';
    $funcao = sanitizar($inputData['funcao'] ?? 'usuario'); // Padrão: usuário

    if (empty($nome) || empty($email) || empty($username) || empty($senha)) {
        erro('Todos os campos são obrigatórios.');
    }

    // Validação básica de email
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
}

/**
 * Handler: Obter lista de usuários ativos
 */
function handle_obter_usuarios($pdo)
{
    $usuarios = obter_usuarios($pdo);
    sucesso($usuarios);
}

/**
 * Handler: Obter todos os usuários (admin)
 */
function handle_obter_usuarios_admin($pdo, $tokenData)
{
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
}

/**
 * Handler: Atualizar usuário (admin)
 */
function handle_atualizar_usuario_admin($pdo, $inputData, $tokenData)
{
    $usuario_id = filter_var($inputData['usuario_id'] ?? null, FILTER_VALIDATE_INT);
    $funcao = sanitizar($inputData['funcao'] ?? '');
    $ativo = isset($inputData['ativo']) ? (int) $inputData['ativo'] : 1;
    $squad = $inputData['squad'] ?? null;

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

    // Validar squad
    $squads_permitidos = [
        'SQUAD MARKETING',
        'SQUAD PRÉ VENDAS & VENDAS',
        'SQUAD RETENÇÃO E MONETIZAÇÃO',
        'SQUAD TECNOLOGIA',
        'SQUAD FINANCEIRO & ADM'
    ];

    if ($squad !== null && $squad !== '') {
        if (!in_array($squad, $squads_permitidos)) {
            erro('Squad inválido.');
        }
    }

    // Atualizar usuário
    $stmt = $pdo->prepare("UPDATE usuarios SET funcao = ?, ativo = ?, squad = ? WHERE id = ?");
    $stmt->execute([$funcao, $ativo, $squad, $usuario_id]);

    sucesso(['mensagem' => 'Usuário atualizado com sucesso']);
}

/**
 * Handler: Deletar usuário (admin)
 */
function handle_deletar_usuario_admin($pdo, $inputData, $tokenData)
{
    $usuario_id = filter_var($inputData['usuario_id'] ?? null, FILTER_VALIDATE_INT);

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
}

/**
 * Handler: Buscar usuários por termo
 */
function handle_buscar_usuarios($pdo)
{
    $termo = $_GET['termo'] ?? '';
    if (strlen($termo) < 2) {
        sucesso([]);
        return;
    }

    $termo_like = '%' . $termo . '%';
    $stmt = $pdo->prepare("SELECT id, nome, email, username FROM usuarios WHERE ativo = 1 AND (nome LIKE ? OR email LIKE ? OR username LIKE ?) ORDER BY nome ASC LIMIT 10");
    $stmt->execute([$termo_like, $termo_like, $termo_like]);
    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
    sucesso($usuarios);
}

/**
 * Handler: Editar perfil do usuário
 */
function handle_editar_perfil($pdo, $inputData, $tokenData)
{
    $usuario_id = filter_var($inputData['usuario_id'] ?? null, FILTER_VALIDATE_INT);
    $nome = sanitizar($inputData['nome'] ?? '');
    $email = sanitizar($inputData['email'] ?? '');
    $username = sanitizar($inputData['username'] ?? '');
    $bio = sanitizar($inputData['bio'] ?? '');

    if (!$usuario_id) {
        erro('ID do usuário é obrigatório.');
    }

    // Segurança: Garantir que o usuário só edite seu próprio perfil (ou seja admin)
    $requester_id = $tokenData['user_id'] ?? 0;
    if ($usuario_id != $requester_id) {
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

    // Retorna o usuário atualizado
    $stmt = $pdo->prepare("SELECT id, nome, email, username, funcao, ativo, bio, data_criacao FROM usuarios WHERE id = ?");
    $stmt->execute([$usuario_id]);
    $usuario_atualizado = $stmt->fetch(PDO::FETCH_ASSOC);

    sucesso(['usuario' => $usuario_atualizado, 'mensagem' => 'Perfil atualizado com sucesso!']);
}
