-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 07/01/2026 às 14:05
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `task_panel`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `projetos`
--

CREATE TABLE `projetos` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `descricao` text DEFAULT NULL,
  `data_inicio` datetime DEFAULT NULL,
  `data_inicio_real` datetime DEFAULT NULL,
  `data_fim` datetime DEFAULT NULL,
  `data_conclusao` datetime DEFAULT NULL,
  `data_fim_real` datetime DEFAULT NULL,
  `data_criacao` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('ativo','inativo','concluido','excluido') NOT NULL DEFAULT 'ativo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `projetos`
--

INSERT INTO `projetos` (`id`, `nome`, `descricao`, `data_inicio`, `data_inicio_real`, `data_fim`, `data_conclusao`, `data_fim_real`, `data_criacao`, `status`) VALUES
(28, 'Novo teste', '', '2025-11-21 18:58:00', NULL, '2025-11-26 20:58:00', NULL, NULL, '2025-11-11 14:58:53', 'inativo'),
(34, 'Projeto final', '', '2026-01-06 22:10:00', NULL, '2026-01-08 19:07:00', NULL, NULL, '2026-01-06 19:07:38', 'ativo');

-- --------------------------------------------------------

--
-- Estrutura para tabela `sistema_logs`
--

CREATE TABLE `sistema_logs` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `acao` varchar(255) NOT NULL,
  `detalhes` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `data_criacao` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `sistema_logs`
--

INSERT INTO `sistema_logs` (`id`, `usuario_id`, `acao`, `detalhes`, `ip_address`, `user_agent`, `data_criacao`) VALUES
(1, NULL, 'INFO', 'Novo usuário cadastrado: fabio.soares@salesprime.com.br (admin)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-15 13:12:33'),
(2, NULL, 'INFO', 'Login realizado: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-15 13:12:43'),
(3, NULL, 'ERROR', 'Erro: Undefined variable $action em C:\\xampp\\htdocs\\task_panel\\api.php:66', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-15 13:36:54'),
(4, NULL, 'ERROR', 'Erro: Undefined variable $action em C:\\xampp\\htdocs\\task_panel\\api.php:66', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-15 13:36:54'),
(5, NULL, 'ERROR', 'Erro: Undefined variable $action em C:\\xampp\\htdocs\\task_panel\\api.php:66', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-15 13:39:09'),
(6, NULL, 'ERROR', 'Erro: Undefined variable $action em C:\\xampp\\htdocs\\task_panel\\api.php:66', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-15 13:39:09'),
(7, NULL, 'ERROR', 'Erro: Undefined variable $action em C:\\xampp\\htdocs\\task_panel\\api.php:81', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-15 13:43:29'),
(8, NULL, 'ERROR', 'Erro: Undefined variable $action em C:\\xampp\\htdocs\\task_panel\\api.php:81', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-15 13:43:29'),
(9, NULL, 'ERROR', 'Erro: Undefined variable $action em C:\\xampp\\htdocs\\task_panel\\api.php:81', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-15 13:43:32'),
(10, NULL, 'ERROR', 'Erro: Undefined variable $action em C:\\xampp\\htdocs\\task_panel\\api.php:81', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-15 13:43:32'),
(11, NULL, 'INFO', 'Login realizado: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-15 16:57:09'),
(12, NULL, 'INFO', 'Novo usuário cadastrado: savio.silva@salesprime.com.br (usuario)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-16 19:41:29'),
(13, NULL, 'INFO', 'Login realizado: savio.silva@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-16 19:41:39'),
(14, NULL, 'INFO', 'Login realizado: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-16 19:44:04'),
(15, NULL, 'INFO', 'Login realizado: savio.silva@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-16 19:44:39'),
(16, NULL, 'INFO', 'Login realizado: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-16 19:47:10'),
(17, NULL, 'INFO', 'Login realizado: savio.silva@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-16 19:53:30'),
(18, NULL, 'INFO', 'Login realizado: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-17 12:26:11'),
(19, NULL, 'INFO', 'Login realizado: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-17 13:18:37'),
(20, NULL, 'INFO', 'Login realizado: savio.silva@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-17 14:12:11'),
(21, NULL, 'INFO', 'Login realizado: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-17 14:18:30'),
(22, NULL, 'EXCEPTION', 'Exceção: Call to undefined function formatarTamanhoArquivo()', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-17 16:11:26'),
(23, NULL, 'EXCEPTION', 'Exceção: Call to undefined function formatarTamanhoArquivo()', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-17 16:11:47'),
(24, NULL, 'EXCEPTION', 'Exceção: Call to undefined function formatarTamanhoArquivo()', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-17 16:12:11'),
(25, NULL, 'EXCEPTION', 'Exceção: Call to undefined function formatarTamanhoArquivo()', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-17 16:13:43'),
(26, NULL, 'EXCEPTION', 'Exceção: Call to undefined function formatarTamanhoArquivo()', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-17 16:13:50'),
(27, NULL, 'EXCEPTION', 'Exceção: Call to undefined function formatarTamanhoArquivo()', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-17 16:13:57'),
(28, NULL, 'EXCEPTION', 'Exceção: Call to undefined function formatarTamanhoArquivo()', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-17 16:14:13'),
(29, NULL, 'EXCEPTION', 'Exceção: Call to undefined function formatarTamanhoArquivo()', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-17 16:14:29'),
(30, NULL, 'EXCEPTION', 'Exceção: Call to undefined function formatarTamanhoArquivo()', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-17 16:15:02'),
(31, NULL, 'EXCEPTION', 'Exceção: Call to undefined function formatarTamanhoArquivo()', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-17 16:18:20'),
(32, NULL, 'INFO', 'Login realizado: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-22 11:08:26'),
(33, NULL, 'INFO', 'Login realizado: savio.silva@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-22 11:08:42'),
(34, NULL, 'INFO', 'Login realizado: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-27 13:39:32'),
(35, NULL, 'INFO', 'Solicitação de recuperação de senha: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-27 14:53:48'),
(36, NULL, 'INFO', 'Login realizado: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-27 14:54:14'),
(37, NULL, 'INFO', 'Login realizado: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-27 14:54:14'),
(38, NULL, 'INFO', 'Login realizado: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-27 14:54:45'),
(39, NULL, 'INFO', 'Login realizado: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-27 14:54:45'),
(40, NULL, 'INFO', 'Login realizado: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-30 19:09:20'),
(41, NULL, 'EXCEPTION', 'Exceção: Call to undefined function calcular_progresso_tarefa()', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-05 12:09:13'),
(42, NULL, 'EXCEPTION', 'Exceção: Call to undefined function calcular_progresso_tarefa()', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-05 12:09:13'),
(43, NULL, 'INFO', 'Login realizado: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-05 16:44:43'),
(44, NULL, 'ERROR', 'Erro: Undefined array key \"concluida\" em C:\\xampp\\htdocs\\task_panel\\api.php:450', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 11:01:39'),
(45, NULL, 'ERROR', 'Erro: Undefined array key \"concluida\" em C:\\xampp\\htdocs\\task_panel\\api.php:450', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 11:06:02'),
(46, NULL, 'ERROR', 'Erro: Undefined array key \"concluida\" em C:\\xampp\\htdocs\\task_panel\\api.php:454', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 11:11:48'),
(47, NULL, 'ERROR', 'Erro: Undefined array key \"concluida\" em C:\\xampp\\htdocs\\task_panel\\api.php:454', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 11:12:32'),
(48, NULL, 'ERROR', 'Erro: Undefined array key \"concluida\" em C:\\xampp\\htdocs\\task_panel\\api.php:534', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 11:12:35'),
(49, NULL, 'ERROR', 'Erro: Undefined array key \"concluida\" em C:\\xampp\\htdocs\\task_panel\\api.php:453', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 11:18:51'),
(50, NULL, 'ERROR', 'Erro: Undefined array key \"concluida\" em C:\\xampp\\htdocs\\task_panel\\api.php:533', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 11:18:55'),
(51, NULL, 'ERROR', 'Erro: Undefined array key \"concluida\" em C:\\xampp\\htdocs\\task_panel\\api.php:454', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 11:21:00'),
(52, NULL, 'ERROR', 'Erro: Undefined array key \"concluida\" em C:\\xampp\\htdocs\\task_panel\\api.php:534', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 11:21:04'),
(53, NULL, 'ERROR', 'Erro: Undefined array key \"concluida\" em C:\\xampp\\htdocs\\task_panel\\api.php:454', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 11:26:43'),
(54, NULL, 'ERROR', 'Erro: Undefined array key \"concluida\" em C:\\xampp\\htdocs\\task_panel\\api.php:454', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 11:31:20'),
(55, NULL, 'ERROR', 'Erro: Undefined array key \"concluida\" em C:\\xampp\\htdocs\\task_panel\\api.php:456', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 11:41:47'),
(56, NULL, 'ERROR', 'Erro: Undefined array key \"concluida\" em C:\\xampp\\htdocs\\task_panel\\api.php:456', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 11:41:50'),
(57, NULL, 'ERROR', 'Erro: Undefined array key \"concluida\" em C:\\xampp\\htdocs\\task_panel\\api.php:525', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 11:51:48'),
(58, NULL, 'ERROR', 'Erro: Undefined array key \"concluida\" em C:\\xampp\\htdocs\\task_panel\\api.php:605', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 11:51:56'),
(59, NULL, 'ERROR', 'Erro: Undefined array key \"concluida\" em C:\\xampp\\htdocs\\task_panel\\api.php:586', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 12:25:32'),
(60, NULL, 'ERROR', 'Erro: Undefined array key \"concluida\" em C:\\xampp\\htdocs\\task_panel\\api.php:598', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 12:34:25'),
(61, NULL, 'ERROR', 'Erro: Undefined array key \"concluida\" em C:\\xampp\\htdocs\\task_panel\\api.php:598', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 13:18:49'),
(62, NULL, 'INFO', 'Novo usuário cadastrado: fabido@salesprime.com.br (pendente de aprovação)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 13:50:53'),
(63, NULL, 'INFO', 'Login realizado: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 13:57:44'),
(64, NULL, 'ERROR', 'Erro: Constant JWT_SECRET already defined em C:\\xampp\\htdocs\\task_panel\\api.php:58', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 18:57:36'),
(65, NULL, 'ERROR', 'Erro: Constant JWT_SECRET already defined em C:\\xampp\\htdocs\\task_panel\\api.php:58', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 18:57:36'),
(66, NULL, 'ERROR', 'Erro: Constant JWT_SECRET already defined em C:\\xampp\\htdocs\\task_panel\\api.php:58', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 18:57:37'),
(67, NULL, 'ERROR', 'Erro: Constant JWT_SECRET already defined em C:\\xampp\\htdocs\\task_panel\\api.php:58', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 18:57:37'),
(68, NULL, 'INFO', 'Novo usuário cadastrado: dan@salesprime.com.br (pendente de aprovação)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-10 11:49:31'),
(69, NULL, 'INFO', 'Login realizado: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-10 11:49:40'),
(70, NULL, 'ERROR', 'Erro na API: SQLSTATE[01000]: Warning: 1265 Data truncated for column \'status\' at row 1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-11 15:13:18'),
(71, NULL, 'ERROR', 'Erro na API: SQLSTATE[01000]: Warning: 1265 Data truncated for column \'status\' at row 1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-11 15:20:07'),
(72, NULL, 'ERROR', 'Erro na API: SQLSTATE[01000]: Warning: 1265 Data truncated for column \'status\' at row 1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-11 15:22:12'),
(73, NULL, 'ERROR', 'Erro na API: SQLSTATE[01000]: Warning: 1265 Data truncated for column \'status\' at row 1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-11 15:24:51'),
(74, NULL, 'ERROR', 'Erro na API: SQLSTATE[01000]: Warning: 1265 Data truncated for column \'status\' at row 1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-11 15:26:45'),
(75, NULL, 'ERROR', 'Erro na API: SQLSTATE[01000]: Warning: 1265 Data truncated for column \'status\' at row 1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-11 15:26:58'),
(76, NULL, 'ERROR', 'Erro na API: SQLSTATE[01000]: Warning: 1265 Data truncated for column \'status\' at row 1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-11 15:28:18'),
(77, NULL, 'ERROR', 'Erro na API: SQLSTATE[01000]: Warning: 1265 Data truncated for column \'status\' at row 1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-11 15:29:03'),
(78, NULL, 'ERROR', 'Erro na API: SQLSTATE[01000]: Warning: 1265 Data truncated for column \'status\' at row 1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-11 15:29:21'),
(79, NULL, 'ERROR', 'Erro na API: SQLSTATE[01000]: Warning: 1265 Data truncated for column \'status\' at row 1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-11 16:13:46'),
(80, NULL, 'ERROR', 'Erro na API: SQLSTATE[01000]: Warning: 1265 Data truncated for column \'status\' at row 1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-11 16:16:36'),
(81, NULL, 'ERROR', 'Erro na API: SQLSTATE[01000]: Warning: 1265 Data truncated for column \'status\' at row 1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-11 16:26:49'),
(82, NULL, 'EXCEPTION', 'Exceção: Call to undefined function dataEhNoPassado()', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-11 16:30:29'),
(83, NULL, 'EXCEPTION', 'Exceção: Call to undefined function dataEhNoPassado()', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-11 16:34:44'),
(84, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'nome_servidor\' in \'field list\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-11 16:42:15'),
(85, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S02]: Base table or view not found: 1146 Table \'task_panel.tarefasarquivos\' doesn\'t exist', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-11 17:02:36'),
(86, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S02]: Base table or view not found: 1146 Table \'task_panel.tarefasarquivos\' doesn\'t exist', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-11 17:02:36'),
(87, NULL, 'EXCEPTION', 'Exceção: Call to undefined function filtervar()', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-11 17:02:44'),
(88, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'nome_servidor\' in \'field list\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-11 17:08:21'),
(89, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'caminho_arquivo\' in \'field list\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-11 17:15:22'),
(90, NULL, 'ERROR', 'Erro na API: SQLSTATE[HY093]: Invalid parameter number', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-11 17:17:49'),
(91, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'caminho\' in \'field list\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-11 17:20:17'),
(92, NULL, 'INFO', 'Login realizado: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-12 11:21:53'),
(93, NULL, 'INFO', 'Login realizado: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-13 17:57:33'),
(94, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'usuario_id\' in \'where clause\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-13 18:25:42'),
(95, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'usuario_id\' in \'where clause\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-13 18:26:09'),
(96, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'usuario_id\' in \'where clause\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-13 18:30:21'),
(97, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'usuario_id\' in \'where clause\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-13 18:30:26'),
(98, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'usuario_id\' in \'where clause\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-13 18:30:59'),
(99, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'usuario_id\' in \'where clause\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-13 18:31:02'),
(100, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'usuario_id\' in \'where clause\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-13 18:32:26'),
(101, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'usuario_id\' in \'where clause\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-13 18:32:31'),
(102, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'usuario_id\' in \'where clause\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-13 18:33:37'),
(103, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'usuario_id\' in \'where clause\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-13 18:33:52'),
(104, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'usuario_id\' in \'where clause\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-13 18:33:55'),
(105, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'usuario_id\' in \'where clause\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-13 18:39:08'),
(106, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'usuario_id\' in \'where clause\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-13 18:39:52'),
(107, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'caminho\' in \'field list\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-14 17:39:34'),
(108, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'caminho\' in \'field list\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-14 17:41:14'),
(109, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'caminho\' in \'field list\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-14 18:05:10'),
(110, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'caminho\' in \'field list\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-14 18:10:02'),
(111, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'caminho\' in \'field list\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-17 12:31:26'),
(112, NULL, 'INFO', 'Login realizado: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-24 12:30:21'),
(113, NULL, 'INFO', 'Login realizado: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-01 14:23:40'),
(114, NULL, 'INFO', 'Login realizado: fabio.soares@salesprime.com.br', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2026-01-06 19:04:21'),
(115, NULL, 'INFO', 'Novo usuário cadastrado: test@example.com (pendente de aprovação)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2026-01-07 11:11:23'),
(116, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'squad\' in \'field list\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2026-01-07 13:02:47'),
(117, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'squad\' in \'field list\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2026-01-07 13:03:03'),
(118, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'squad\' in \'field list\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2026-01-07 13:03:30'),
(119, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'squad\' in \'field list\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2026-01-07 13:03:56'),
(120, NULL, 'ERROR', 'Erro na API: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'squad\' in \'field list\'', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2026-01-07 13:04:47');

-- --------------------------------------------------------

--
-- Estrutura para tabela `tarefas`
--

CREATE TABLE `tarefas` (
  `id` int(11) NOT NULL,
  `projeto_id` int(11) DEFAULT NULL,
  `titulo` varchar(255) NOT NULL,
  `descricao` text DEFAULT NULL,
  `prioridade` enum('planejar','fazer_agora','delegar','eliminar','urgente_importante','importante_nao_urgente','urgente_nao_importante','nao_urgente_nao_importante') DEFAULT 'importante_nao_urgente',
  `data_inicio` datetime DEFAULT NULL,
  `data_fim` datetime DEFAULT NULL,
  `data_conclusao_real` datetime DEFAULT NULL,
  `concluida` tinyint(1) DEFAULT 0,
  `progresso_manual` int(11) DEFAULT 0,
  `data_conclusao` datetime DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pendente',
  `data_criacao` timestamp NOT NULL DEFAULT current_timestamp(),
  `data_atualizacao` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `recorrente` tinyint(1) DEFAULT 0,
  `frequencia_recorrencia` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tarefas_arquivos`
--

CREATE TABLE `tarefas_arquivos` (
  `id` int(11) NOT NULL,
  `tarefa_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `nome_arquivo` varchar(255) NOT NULL,
  `nome_original` varchar(255) NOT NULL,
  `tamanho` int(11) NOT NULL,
  `tipo` varchar(100) NOT NULL,
  `data_upload` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tarefas_checklist`
--

CREATE TABLE `tarefas_checklist` (
  `id` int(11) NOT NULL,
  `tarefa_id` int(11) NOT NULL,
  `descricao` varchar(255) NOT NULL,
  `concluido` tinyint(1) DEFAULT 0,
  `data_criacao` datetime DEFAULT current_timestamp(),
  `data_conclusao` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tarefas_comentarios`
--

CREATE TABLE `tarefas_comentarios` (
  `id` int(11) NOT NULL,
  `tarefa_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `comentario` text NOT NULL,
  `data_criacao` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tarefa_arquivos`
--

CREATE TABLE `tarefa_arquivos` (
  `id` int(11) NOT NULL,
  `tarefa_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `nome_arquivo` varchar(255) NOT NULL,
  `caminho_arquivo` varchar(255) NOT NULL,
  `data_upload` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tarefa_comentarios`
--

CREATE TABLE `tarefa_comentarios` (
  `id` int(11) NOT NULL,
  `tarefa_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `comentario` text NOT NULL,
  `data_comentario` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tarefa_etapas`
--

CREATE TABLE `tarefa_etapas` (
  `id` int(11) NOT NULL,
  `tarefa_id` int(11) NOT NULL,
  `descricao` varchar(255) NOT NULL,
  `concluida` tinyint(1) DEFAULT 0,
  `data_criacao` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tarefa_usuarios`
--

CREATE TABLE `tarefa_usuarios` (
  `id` int(11) NOT NULL,
  `tarefa_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `data_atribuicao` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `last_activity` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `expires_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `data_criacao` timestamp NOT NULL DEFAULT current_timestamp(),
  `ativo` tinyint(1) DEFAULT 1,
  `senha` varchar(255) NOT NULL,
  `funcao` enum('admin','editor','usuario') DEFAULT 'usuario',
  `bio` text DEFAULT NULL,
  `token_recuperacao` varchar(64) DEFAULT NULL,
  `token_expiracao` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `nome`, `email`, `username`, `data_criacao`, `ativo`, `senha`, `funcao`, `bio`, `token_recuperacao`, `token_expiracao`) VALUES
(22, 'Ferrugem', 'fabio.soares@salesprime.com.br', 'rugemtugem', '2025-10-15 13:12:33', 1, '$2y$10$71K8fqioLM9J4cGAtfv7UOtIdMUwPFfVrjvXT6qix8G.9qg0G8uX.', 'admin', '', '689d7a31eb9358c9904e59252239244238fb88d7895218c4bf538d5887635773', '2025-10-27 12:53:48'),
(25, 'Danilo Yuzo', 'dan@salesprime.com.br', 'daniloyuzo', '2025-11-10 11:49:31', 1, '$2y$10$fCVVvXuaNY0taTMCy1Vwg.TzxiqLBHQ4RmmNHsYXdsUixqrjoz1Fy', 'admin', NULL, NULL, NULL);

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `projetos`
--
ALTER TABLE `projetos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`);

--
-- Índices de tabela `sistema_logs`
--
ALTER TABLE `sistema_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_usuario_id` (`usuario_id`),
  ADD KEY `idx_data_criacao` (`data_criacao`);

--
-- Índices de tabela `tarefas`
--
ALTER TABLE `tarefas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_produto_id` (`projeto_id`),
  ADD KEY `idx_data_inicio` (`data_inicio`),
  ADD KEY `idx_data_fim` (`data_fim`),
  ADD KEY `idx_concluida` (`concluida`),
  ADD KEY `idx_status_tarefa` (`status`),
  ADD KEY `idx_tarefas_prioridade` (`prioridade`),
  ADD KEY `idx_progresso` (`progresso_manual`),
  ADD KEY `idx_data_conclusao_real` (`data_conclusao_real`);

--
-- Índices de tabela `tarefas_arquivos`
--
ALTER TABLE `tarefas_arquivos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tarefa_id` (`tarefa_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `tarefas_checklist`
--
ALTER TABLE `tarefas_checklist`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tarefa_id` (`tarefa_id`);

--
-- Índices de tabela `tarefas_comentarios`
--
ALTER TABLE `tarefas_comentarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tarefa_id` (`tarefa_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `tarefa_arquivos`
--
ALTER TABLE `tarefa_arquivos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_arquivo_tarefa` (`tarefa_id`),
  ADD KEY `fk_arquivo_usuario` (`usuario_id`);

--
-- Índices de tabela `tarefa_comentarios`
--
ALTER TABLE `tarefa_comentarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_comentario_tarefa` (`tarefa_id`),
  ADD KEY `fk_comentario_usuario` (`usuario_id`);

--
-- Índices de tabela `tarefa_etapas`
--
ALTER TABLE `tarefa_etapas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tarefa_id` (`tarefa_id`);

--
-- Índices de tabela `tarefa_usuarios`
--
ALTER TABLE `tarefa_usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_tarefa_usuario` (`tarefa_id`,`usuario_id`),
  ADD KEY `idx_tarefa_id` (`tarefa_id`),
  ADD KEY `idx_usuario_id` (`usuario_id`);

--
-- Índices de tabela `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_usuario_id` (`usuario_id`),
  ADD KEY `idx_token_hash` (`token_hash`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_token_recuperacao` (`token_recuperacao`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `projetos`
--
ALTER TABLE `projetos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT de tabela `sistema_logs`
--
ALTER TABLE `sistema_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=121;

--
-- AUTO_INCREMENT de tabela `tarefas`
--
ALTER TABLE `tarefas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT de tabela `tarefas_arquivos`
--
ALTER TABLE `tarefas_arquivos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de tabela `tarefas_checklist`
--
ALTER TABLE `tarefas_checklist`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `tarefas_comentarios`
--
ALTER TABLE `tarefas_comentarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de tabela `tarefa_arquivos`
--
ALTER TABLE `tarefa_arquivos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `tarefa_comentarios`
--
ALTER TABLE `tarefa_comentarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `tarefa_etapas`
--
ALTER TABLE `tarefa_etapas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT de tabela `tarefa_usuarios`
--
ALTER TABLE `tarefa_usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT de tabela `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `sistema_logs`
--
ALTER TABLE `sistema_logs`
  ADD CONSTRAINT `sistema_logs_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `tarefas`
--
ALTER TABLE `tarefas`
  ADD CONSTRAINT `fk_tarefas_projeto` FOREIGN KEY (`projeto_id`) REFERENCES `projetos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `tarefas_arquivos`
--
ALTER TABLE `tarefas_arquivos`
  ADD CONSTRAINT `tarefas_arquivos_ibfk_1` FOREIGN KEY (`tarefa_id`) REFERENCES `tarefas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tarefas_arquivos_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `tarefas_checklist`
--
ALTER TABLE `tarefas_checklist`
  ADD CONSTRAINT `tarefas_checklist_ibfk_1` FOREIGN KEY (`tarefa_id`) REFERENCES `tarefas` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `tarefas_comentarios`
--
ALTER TABLE `tarefas_comentarios`
  ADD CONSTRAINT `tarefas_comentarios_ibfk_1` FOREIGN KEY (`tarefa_id`) REFERENCES `tarefas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tarefas_comentarios_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `tarefa_arquivos`
--
ALTER TABLE `tarefa_arquivos`
  ADD CONSTRAINT `fk_arquivo_tarefa` FOREIGN KEY (`tarefa_id`) REFERENCES `tarefas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_arquivo_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `tarefa_comentarios`
--
ALTER TABLE `tarefa_comentarios`
  ADD CONSTRAINT `fk_comentario_tarefa` FOREIGN KEY (`tarefa_id`) REFERENCES `tarefas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_comentario_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `tarefa_etapas`
--
ALTER TABLE `tarefa_etapas`
  ADD CONSTRAINT `tarefa_etapas_ibfk_1` FOREIGN KEY (`tarefa_id`) REFERENCES `tarefas` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `tarefa_usuarios`
--
ALTER TABLE `tarefa_usuarios`
  ADD CONSTRAINT `fk_tarefa_usuarios_tarefa` FOREIGN KEY (`tarefa_id`) REFERENCES `tarefas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tarefa_usuarios_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;
COMMIT;
-- ---------------------------------------------------------------------
-- MIGRAÇÃO: adicionar coluna `squad` em `usuarios` e `tarefas` se ausente
-- Estas instruções permitem aplicar a alteração em bancos já em produção
-- ---------------------------------------------------------------------
/* Adiciona a coluna `squad` na tabela `usuarios` se ainda não existir */
ALTER TABLE `usuarios` 
  ADD COLUMN IF NOT EXISTS `squad` VARCHAR(100) DEFAULT NULL;

/* Adiciona a coluna `squad` na tabela `tarefas` se ainda não existir */
ALTER TABLE `tarefas` 
  ADD COLUMN IF NOT EXISTS `squad` VARCHAR(100) DEFAULT NULL;

-- Fim da migração

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
