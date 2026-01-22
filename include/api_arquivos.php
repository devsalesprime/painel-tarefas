<?php
/**
 * Handlers de Endpoints - Arquivos
 * 
 * Gerencia upload, download e exclusão de arquivos.
 */

/**
 * Handler: Upload de arquivo
 */
function handle_upload_arquivo($pdo, $tokenData)
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        erro('Método não permitido', 405);
    }

    if (!isset($_FILES['arquivo']) || $_FILES['arquivo']['error'] !== UPLOAD_ERR_OK) {
        erro('Nenhum arquivo enviado ou erro no upload');
    }

    $arquivo = $_FILES['arquivo'];
    $tarefa_id = filter_var($_POST['tarefa_id'] ?? null, FILTER_VALIDATE_INT);
    $usuario_id = $tokenData['user_id'] ?? 0;

    if (!$tarefa_id || !$usuario_id) {
        erro('ID da tarefa e usuário são obrigatórios');
    }

    if (!defined('MAX_FILE_SIZE') || !defined('ALLOWED_EXTENSIONS') || !defined('UPLOAD_DIR')) {
        erro('Constantes de configuração de upload não definidas.', 500);
    }

    if ($arquivo['size'] > MAX_FILE_SIZE) {
        erro('Arquivo muito grande. Tamanho máximo: ' . formatarTamanhoArquivo(MAX_FILE_SIZE));
    }

    $extensao = strtolower(pathinfo($arquivo['name'], PATHINFO_EXTENSION));
    if (!in_array($extensao, ALLOWED_EXTENSIONS)) {
        erro('Tipo de arquivo não permitido. Extensões permitidas: ' . implode(', ', ALLOWED_EXTENSIONS));
    }

    $upload_dir = UPLOAD_DIR . '/' . $tarefa_id;
    if (!is_dir($upload_dir)) {
        if (!mkdir($upload_dir, 0777, true)) {
            erro('Falha ao criar o diretório de upload.', 500);
        }
    }

    $nome_arquivo_unico = uniqid() . '.' . $extensao;
    $caminho_completo = $upload_dir . '/' . $nome_arquivo_unico;

    if (!move_uploaded_file($arquivo['tmp_name'], $caminho_completo)) {
        erro('Falha ao mover o arquivo para o destino.');
    }

    $stmt = $pdo->prepare("INSERT INTO tarefas_arquivos (tarefa_id, usuario_id, nome_arquivo, nome_original, tamanho, tipo) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$tarefa_id, $usuario_id, $nome_arquivo_unico, sanitizar($arquivo['name']), $arquivo['size'], $arquivo['type']]);
    $arquivo_id = $pdo->lastInsertId();

    sucesso(['id' => $arquivo_id, 'mensagem' => 'Upload realizado com sucesso', 'nome_arquivo' => $nome_arquivo_unico]);
}

/**
 * Handler: Obter arquivos de uma tarefa
 */
function handle_obter_arquivos($pdo)
{
    $tarefa_id = filter_var($_GET['tarefa_id'] ?? null, FILTER_VALIDATE_INT);

    if (!$tarefa_id) {
        erro('ID da tarefa é obrigatório');
    }

    $stmt = $pdo->prepare("SELECT ta.id, ta.nome_original, ta.tamanho, ta.tipo, ta.data_upload, u.nome as usuario_nome FROM tarefas_arquivos ta INNER JOIN usuarios u ON ta.usuario_id = u.id WHERE ta.tarefa_id = ? ORDER BY ta.data_upload DESC");
    $stmt->execute([$tarefa_id]);
    $arquivos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($arquivos as &$arquivo) {
        $arquivo['tamanho_formatado'] = formatarTamanhoArquivo($arquivo['tamanho']);
    }

    sucesso($arquivos);
}

/**
 * Handler: Download de arquivo
 */
function handle_download_arquivo($pdo)
{
    $arquivo_id = filter_var($_GET['arquivo_id'] ?? null, FILTER_VALIDATE_INT);

    if (!$arquivo_id) {
        erro('ID do arquivo é obrigatório');
    }

    $stmt = $pdo->prepare("SELECT tarefa_id, nome_arquivo, nome_original, tipo, tamanho FROM tarefas_arquivos WHERE id = ?");
    $stmt->execute([$arquivo_id]);
    $arquivo = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$arquivo) {
        erro('Arquivo não encontrado no banco de dados', 404);
    }

    $caminho_arquivo = UPLOAD_DIR . '/' . $arquivo['tarefa_id'] . '/' . $arquivo['nome_arquivo'];

    if (!file_exists($caminho_arquivo)) {
        erro('Arquivo físico não encontrado', 404);
    }

    if (ob_get_level())
        ob_end_clean();

    header('Content-Description: File Transfer');
    header('Content-Type: ' . $arquivo['tipo']);
    header('Content-Disposition: attachment; filename="' . $arquivo['nome_original'] . '"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . $arquivo['tamanho']);
    readfile($caminho_arquivo);
    exit;
}

/**
 * Handler: Deletar arquivo
 */
function handle_deletar_arquivo($pdo, $inputData)
{
    $arquivo_id = filter_var($inputData['arquivo_id'] ?? null, FILTER_VALIDATE_INT);

    if (!$arquivo_id) {
        erro('ID do arquivo é obrigatório.');
    }

    $stmt = $pdo->prepare("SELECT tarefa_id, nome_arquivo FROM tarefas_arquivos WHERE id = ?");
    $stmt->execute([$arquivo_id]);
    $arquivo = $stmt->fetch(PDO::FETCH_ASSOC);

    $caminho = null;
    if ($arquivo) {
        $caminho = UPLOAD_DIR . '/' . $arquivo['tarefa_id'] . '/' . $arquivo['nome_arquivo'];
    }

    $stmt = $pdo->prepare("DELETE FROM tarefas_arquivos WHERE id = ?");
    $stmt->execute([$arquivo_id]);

    if ($caminho && file_exists($caminho)) {
        unlink($caminho);
    }

    sucesso(['mensagem' => 'Arquivo deletado com sucesso']);
}
