<?php
/**
 * Funções de Resposta Padrão da API
 * 
 * Fornece funções padronizadas para retornar respostas JSON
 * de sucesso e erro, com códigos HTTP apropriados.
 */

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
