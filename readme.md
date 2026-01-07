# 📋 Task Panel - Sistema de Gerenciamento de Tarefas

Sistema completo de gerenciamento de projetos e tarefas desenvolvido com PHP, MySQL e JavaScript vanilla. Implementa autenticação JWT, controle de permissões, visualizações Kanban e Lista, e funcionalidades completas de colaboração.

---

## 📑 Índice

- [Visão Geral](#-visão-geral)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura de Arquivos](#-estrutura-de-arquivos)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Funcionalidades](#-funcionalidades)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Documentação da API](#-documentação-da-api)
- [Módulos JavaScript](#-módulos-javascript)
- [Banco de Dados](#-banco-de-dados)
- [Segurança](#-segurança)

---

## 🎯 Visão Geral

O **Task Panel** é um sistema web completo para gerenciamento de projetos e tarefas com:

- ✅ **Autenticação JWT** - Login seguro com tokens
- 👥 **Controle de Permissões** - Admin, Editor e Usuário
- 📊 **Visualizações Múltiplas** - Kanban e Lista
- 🎯 **Matriz de Eisenhower** - Priorização de tarefas
- 💬 **Colaboração** - Comentários e anexos
- 📈 **Progresso por Etapas** - Checklist integrado
- 🔔 **Notificações** - Sistema de alertas
- 📱 **Responsivo** - Interface adaptável

---

## 🛠 Tecnologias Utilizadas

### Backend
- **PHP 7.4+** - Linguagem server-side
- **MySQL/MariaDB** - Banco de dados relacional
- **PDO** - Abstração de banco de dados
- **JWT** - Autenticação via tokens

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Estilização e animações
- **JavaScript (ES6+)** - Lógica client-side
- **Bootstrap 5.3** - Framework CSS
- **Font Awesome 6.4** - Ícones
- **Bootstrap Icons** - Ícones complementares

### Ferramentas
- **XAMPP/WAMP** - Ambiente de desenvolvimento
- **Composer** - Gerenciador de dependências PHP

---

## 📂 Estrutura de Arquivos

```
task_panel/
│
├── 📁 js/                          # Módulos JavaScript
│   ├── core.js                     # TaskManager e autenticação base
│   ├── main.js                     # Constantes globais
│   ├── utils.js                    # Funções utilitárias
│   ├── data.js                     # Gerenciamento de dados
│   ├── render.js                   # Renderização de tarefas
│   ├── ui.js                       # Funções de interface
│   ├── modals.js                   # Controle de modais
│   ├── auth.js                     # Autenticação frontend
│   ├── profile.js                  # Gerenciamento de perfil
│   ├── complementos.js             # Funcionalidades extras
│   ├── taskManager.js              # CRUD de tarefas
│   ├── actions.js                  # Comentários, arquivos, etapas
│   ├── init.js                     # Inicialização do sistema
│   ├── loader.js                   # Indicador de carregamento
│   └── debug.js                    # Ferramentas de debug
│
├── 📁 uploads/                     # Arquivos enviados pelos usuários
│
├── 📄 index.html                   # Página principal (Dashboard)
├── 📄 login.html                   # Página de login
├── 📄 register.html                # Página de registro
├── 📄 admin.html                   # Painel administrativo
├── 📄 relatorio.html               # Relatórios e análises
├── 📄 arquivo.html                 # Tarefas arquivadas
├── 📄 esqueceu-senha.html          # Recuperação de senha
│
├── 📄 api.php                      # API RESTful principal
├── 📄 auth.php                     # Autenticação e registro (backend)
├── 📄 config.php                   # Configurações do sistema
├── 📄 helpers.php                  # Funções auxiliares PHP
├── 📄 middleware.php               # Middleware de autenticação
│
├── 📄 styles.css                   # Estilos principais
├── 📄 auth.css                     # Estilos de autenticação
│
├── 📄 auth.js                      # Script de autenticação (páginas de login)
├── 📄 perfil.js                    # Script de perfil (standalone)
├── 📄 senha.js                     # Script de senha (standalone)
├── 📄 relatorios.js                # Script de relatórios (standalone)
│
├── 📄 task_panel.sql               # Schema do banco de dados
├── 📄 .htaccess                    # Configurações Apache
└── 📄 README.md                    # Este arquivo
```

> **Nota:** As pastas `backup/`, `vendor/` e `api-old/` não são utilizadas no sistema em produção e podem ser removidas.

---

## 🏗 Arquitetura do Sistema

### Fluxo de Dados

```
┌─────────────┐
│   Cliente   │
│  (Browser)  │
└──────┬──────┘
       │
       │ HTTP Request
       ▼
┌─────────────────┐
│   index.html    │ ◄── Carrega módulos JS
│   login.html    │
│   admin.html    │
└────────┬────────┘
         │
         │ AJAX/Fetch
         ▼
┌─────────────────┐
│    api.php      │ ◄── Roteamento de ações
│                 │
│  ┌───────────┐  │
│  │ JWT Auth  │  │ ◄── Validação de token
│  └───────────┘  │
│                 │
│  ┌───────────┐  │
│  │  Actions  │  │ ◄── CRUD operations
│  └───────────┘  │
└────────┬────────┘
         │
         │ PDO
         ▼
┌─────────────────┐
│   MySQL DB      │
│  task_panel     │
└─────────────────┘
```

### Camadas da Aplicação

1. **Camada de Apresentação** (Frontend)
   - HTML5 para estrutura
   - CSS3 para estilização
   - JavaScript modular para lógica

2. **Camada de Aplicação** (Backend)
   - `api.php` - Controlador principal
   - `auth.php` - Autenticação
   - `helpers.php` - Funções auxiliares

3. **Camada de Dados**
   - MySQL com PDO
   - Prepared statements
   - Transações ACID

---

## ⚡ Funcionalidades

### 👤 Gestão de Usuários
- ✅ Registro com aprovação de admin
- ✅ Login com JWT
- ✅ Recuperação de senha
- ✅ Perfis de usuário (Admin, Editor, Usuário)
- ✅ Edição de perfil
- ✅ Alteração de senha

### 📊 Gestão de Projetos
- ✅ Criar, editar e excluir projetos
- ✅ Definir datas de início e fim
- ✅ Associar múltiplas tarefas
- ✅ Visualizar progresso geral

### ✅ Gestão de Tarefas
- ✅ Criar tarefas com título, descrição e datas
- ✅ Priorização via Matriz de Eisenhower:
  - 🔴 **Fazer Agora** - Urgente e Importante
  - 🟢 **Agendar** - Importante mas Não Urgente
  - 🟡 **Delegar** - Urgente mas Não Importante
  - 🔵 **Eliminar** - Nem Urgente nem Importante
- ✅ Status: Pendente, Em Andamento, Pausada, Concluída
- ✅ Atribuir múltiplos usuários
- ✅ Checklist de etapas
- ✅ Progresso automático baseado em etapas
- ✅ Comentários com menções (@usuario)
- ✅ Upload de arquivos (PDF, DOC, imagens)
- ✅ Drag & Drop no Kanban

### 📈 Visualizações
- ✅ **Kanban Board** - Colunas por status
- ✅ **Lista** - Visualização detalhada
- ✅ **Filtros** - Por status, prioridade, usuário
- ✅ **Busca** - Pesquisa em tempo real
- ✅ **Ordenação** - Por data, prioridade, título

### 📊 Relatórios
- ✅ Estatísticas gerais
- ✅ Tarefas por projeto
- ✅ Tarefas por usuário
- ✅ Tarefas atrasadas
- ✅ Exportação de dados

### 🔒 Segurança
- ✅ Autenticação JWT
- ✅ Sanitização de inputs
- ✅ Prepared statements (SQL Injection)
- ✅ XSS Protection
- ✅ CSRF Protection
- ✅ Controle de permissões por função
- ✅ Logs de atividades

---

## 🚀 Instalação

### Pré-requisitos

- PHP 7.4 ou superior
- MySQL 5.7 ou superior / MariaDB 10.3+
- Apache com mod_rewrite
- Composer (opcional)

### Passo a Passo

1. **Clone ou baixe o projeto**
   ```bash
   cd c:\xampp\htdocs
   git clone <repository-url> task_panel
   ```

2. **Configure o banco de dados**
   ```bash
   # Crie o banco de dados
   mysql -u root -p
   CREATE DATABASE task_panel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   
   # Importe o schema
   mysql -u root -p task_panel < task_panel.sql
   ```

3. **Configure as credenciais**
   
   Edite `config.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'task_panel');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   ```

4. **Configure permissões**
   ```bash
   chmod 755 uploads/
   chmod 644 *.php
   ```

5. **Acesse o sistema**
   ```
   http://localhost/task_panel/
   ```

6. **Primeiro acesso**
   - Registre-se em `register.html`
   - Aguarde aprovação do admin
   - Ou crie um admin diretamente no banco:
   ```sql
   UPDATE usuarios SET funcao = 'admin', ativo = 1 WHERE email = 'seu@email.com';
   ```

---

## ⚙ Configuração

### config.php

```php
// Banco de dados
define('DB_HOST', 'localhost');
define('DB_NAME', 'task_panel');
define('DB_USER', 'root');
define('DB_PASS', '');

// Fuso horário
define('TIME_ZONE', 'America/Sao_Paulo');

// JWT Secret (altere em produção!)
define('JWT_SECRET', 'sua-chave-secreta-aqui');

// E-mail
define('EMAIL_FROM', 'noreply@seudominio.com');
define('EMAIL_FROM_NAME', 'Sistema de Tarefas');

// Upload
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt']);

// Ambiente
define('AMBIENTE', 'desenvolvimento'); // ou 'producao'
```

---

## 📡 Documentação da API

### Base URL
```
http://localhost/task_panel/api.php
```

### Autenticação

Todas as requisições (exceto login e register) requerem header:
```
Authorization: Bearer {token}
```

### Endpoints Principais

#### Autenticação

**POST** `/api.php?action=login`
```json
{
  "email": "usuario@email.com",
  "senha": "senha123"
}
```

**POST** `/api.php?action=register`
```json
{
  "nome": "Nome Completo",
  "email": "usuario@email.com",
  "username": "usuario",
  "senha": "senha123"
}
```

#### Projetos

**GET** `/api.php?action=obter_projetos`

**POST** `/api.php?action=criar_projeto`
```json
{
  "nome": "Nome do Projeto",
  "descricao": "Descrição",
  "data_inicio": "2026-01-01 00:00:00",
  "data_fim": "2026-12-31 23:59:59"
}
```

**POST** `/api.php?action=editar_projeto`
```json
{
  "projeto_id": 1,
  "nome": "Novo Nome",
  "descricao": "Nova Descrição"
}
```

**POST** `/api.php?action=deletar_projeto`
```json
{
  "projeto_id": 1
}
```

#### Tarefas

**GET** `/api.php?action=obter_tarefas&projeto_id=1`

**GET** `/api.php?action=obter_tarefa&tarefa_id=1`

**POST** `/api.php?action=criar_tarefa`
```json
{
  "projeto_id": 1,
  "titulo": "Título da Tarefa",
  "descricao": "Descrição detalhada",
  "data_inicio": "2026-01-01 09:00:00",
  "data_fim": "2026-01-15 18:00:00",
  "prioridade": "urgente_importante",
  "usuarios": [1, 2, 3]
}
```

**POST** `/api.php?action=atualizar_tarefa`
```json
{
  "tarefa_id": 1,
  "titulo": "Novo Título",
  "status": "iniciada",
  "progresso": 50
}
```

**POST** `/api.php?action=deletar_tarefa`
```json
{
  "tarefa_id": 1
}
```

#### Comentários

**GET** `/api.php?action=obter_comentarios&tarefa_id=1`

**POST** `/api.php?action=adicionar_comentario`
```json
{
  "tarefa_id": 1,
  "comentario": "Texto do comentário"
}
```

#### Arquivos

**POST** `/api.php?action=upload_arquivo`
```
Content-Type: multipart/form-data
tarefa_id: 1
arquivo: [file]
```

**GET** `/api.php?action=obter_arquivos&tarefa_id=1`

**GET** `/api.php?action=baixar_arquivo&arquivo_id=1`

**POST** `/api.php?action=deletar_arquivo`
```json
{
  "arquivo_id": 1
}
```

### Códigos de Resposta

- `200` - Sucesso
- `400` - Bad Request (erro de validação)
- `401` - Não autorizado (token inválido)
- `403` - Proibido (sem permissão)
- `404` - Não encontrado
- `500` - Erro interno do servidor

---

## 🧩 Módulos JavaScript

### Ordem de Carregamento

```html
<!-- Core e Dependências -->
<script src="js/core.js"></script>
<script src="js/main.js"></script>
<script src="js/utils.js"></script>

<!-- Data e Renderização -->
<script src="js/data.js"></script>
<script src="js/render.js"></script>
<script src="js/ui.js"></script>

<!-- Modais e Controle -->
<script src="js/modals.js"></script>
<script src="js/auth.js"></script>
<script src="js/profile.js"></script>

<!-- Funcionalidades -->
<script src="js/complementos.js"></script>
<script src="js/taskManager.js"></script>
<script src="js/actions.js"></script>

<!-- Inicialização -->
<script src="js/init.js"></script>
```

### Descrição dos Módulos

#### core.js
**Classe TaskManager** - Núcleo do sistema
- `fetch(url, options)` - Requisições autenticadas
- `logout()` - Encerra sessão
- `mostrarErro(mensagem)` - Exibe alertas de erro
- `mostrarSucesso(mensagem)` - Exibe alertas de sucesso
- `atualizarEstatisticas(tarefas)` - Atualiza contadores
- `getCurrentUser()` - Retorna dados do usuário logado
- `verificarSeEhAdmin()` - Verifica permissões de admin

#### main.js
**Constantes Globais**
- `viewMode` - Modo de visualização atual (lista/kanban)
- `ordenacaoAtual` - Campo de ordenação
- `prioridades` - Matriz de Eisenhower
- `kanbanColumns` - Configuração das colunas Kanban

#### utils.js
**Funções Utilitárias**
- `formatarDataHora(data)` - Formata data/hora
- `formatarDataProjeto(data)` - Formata data de projeto
- `getFileIcon(filename)` - Retorna ícone por extensão
- `validarEmail(email)` - Valida formato de e-mail
- `validarDatas(inicio, fim)` - Valida intervalo de datas
- `calcularForcaSenha(senha)` - Calcula força da senha
- `inicializarTooltips()` - Inicializa tooltips Bootstrap

#### data.js
**Gerenciamento de Dados**
- `carregarProjetos()` - Carrega lista de projetos
- `carregarUsuarios()` - Carrega lista de usuários
- `buscarUsuarios(termo)` - Busca usuários por nome/email

#### render.js
**Renderização de Interface**
- `renderizarTarefas()` - Renderiza tarefas (Kanban ou Lista)
- `renderizarProjetoKanban(projeto, tarefas)` - Renderiza projeto em Kanban
- `renderizarProjetoLista(projeto, tarefas)` - Renderiza projeto em Lista
- `gerarCardKanban(tarefa)` - Gera card individual Kanban
- `gerarCardLista(tarefa)` - Gera card individual Lista
- `filtrarTarefas(tarefas)` - Aplica filtros ativos

#### ui.js
**Interface do Usuário**
- `garantirContainerProjetos()` - Garante container existe
- `alterarVisualizacao(modo)` - Alterna entre Lista/Kanban
- `configurarFiltros()` - Configura filtros de status/prioridade
- `configurarBusca()` - Configura busca em tempo real

#### modals.js
**Controle de Modais**
- `abrirEditarTarefa(tarefaId, tabId)` - Abre modal de edição
- `fecharModalNovaTarefa()` - Fecha modal de nova tarefa
- `fecharModalEditarTarefa()` - Fecha modal de edição
- `configurarDragAndDrop()` - Configura drag & drop Kanban

#### auth.js
**Autenticação Frontend**
- `carregarDadosUsuario()` - Carrega dados do usuário logado
- `carregarInfoUsuario()` - Atualiza UI com info do usuário
- `adicionarLinkAdmin()` - Adiciona link admin se aplicável

#### profile.js
**Gerenciamento de Perfil**
- `abrirEditarPerfil()` - Abre modal de edição de perfil
- `salvarPerfil()` - Salva alterações do perfil
- `abrirAlterarSenha()` - Abre modal de alteração de senha
- `salvarNovaSenha()` - Salva nova senha

#### taskManager.js
**CRUD de Tarefas**
- `criarTarefa()` - Cria nova tarefa
- `salvarTarefa()` - Salva alterações de tarefa
- `deletarTarefa(id)` - Exclui tarefa
- `alterarStatusTarefa(id, status)` - Altera status
- `pausarTarefa(id)` - Pausa tarefa
- `iniciarTarefa(id)` - Inicia tarefa
- `concluirTarefa(id)` - Conclui tarefa
- `reabrirTarefa(id)` - Reabre tarefa concluída

#### actions.js
**Ações de Tarefas**
- `adicionarComentario()` - Adiciona comentário
- `carregarComentariosTarefa(id)` - Carrega comentários
- `deletarComentario(id)` - Deleta comentário
- `carregarArquivosTarefa(id)` - Carrega arquivos
- `baixarArquivoApi(id)` - Baixa arquivo
- `deletarArquivo(id)` - Deleta arquivo
- `adicionarEtapaModalEditar()` - Adiciona etapa
- `toggleEtapaModalEditar(id)` - Marca/desmarca etapa
- `deletarEtapaModalEditar(id)` - Deleta etapa

#### complementos.js
**Funcionalidades Extras**
- `criarProjetoRapido()` - Criação rápida de projeto
- `editarProjeto(id)` - Edita projeto existente
- `deletarProjeto(id)` - Deleta projeto
- `concluirProjeto(id)` - Marca projeto como concluído
- `reabrirProjeto(id)` - Reabre projeto

#### init.js
**Inicialização do Sistema**
- Configura event listeners
- Carrega dados iniciais
- Configura filtros e busca
- Inicializa tooltips
- Configura drag & drop

---

## 🗄 Banco de Dados

### Tabelas Principais

#### usuarios
```sql
id, nome, email, username, senha, funcao, ativo, 
bio, data_criacao, ultimo_acesso
```

#### projetos
```sql
id, nome, descricao, data_inicio, data_fim, 
criado_por, data_criacao, concluido
```

#### tarefas
```sql
id, projeto_id, titulo, descricao, status, prioridade,
data_inicio, data_fim, data_conclusao, progresso,
criado_por, data_criacao, concluida
```

#### tarefas_usuarios
```sql
id, tarefa_id, usuario_id, data_atribuicao
```

#### comentarios
```sql
id, tarefa_id, usuario_id, comentario, data_criacao
```

#### arquivos
```sql
id, tarefa_id, nome_original, nome_arquivo, 
tamanho, tipo, caminho, enviado_por, data_upload
```

#### etapas
```sql
id, tarefa_id, descricao, concluida, ordem, data_criacao
```

#### sistema_logs
```sql
id, usuario_id, acao, detalhes, ip_address, 
user_agent, data_hora
```

### Relacionamentos

```
usuarios (1) ──── (N) projetos
projetos (1) ──── (N) tarefas
tarefas (N) ──── (N) usuarios (via tarefas_usuarios)
tarefas (1) ──── (N) comentarios
tarefas (1) ──── (N) arquivos
tarefas (1) ──── (N) etapas
```

---

## 🔒 Segurança

### Implementações de Segurança

1. **Autenticação JWT**
   - Tokens com expiração
   - Renovação automática
   - Logout em todas as abas

2. **Proteção contra SQL Injection**
   - Prepared Statements em todas as queries
   - Validação de tipos de dados

3. **Proteção contra XSS**
   - Sanitização de inputs com `htmlspecialchars()`
   - Content Security Policy headers

4. **Proteção contra CSRF**
   - Tokens CSRF em formulários
   - Validação de origem

5. **Controle de Acesso**
   - Verificação de permissões por função
   - Validação de propriedade de recursos

6. **Upload Seguro**
   - Validação de extensões
   - Limite de tamanho
   - Renomeação de arquivos
   - Armazenamento fora do webroot

7. **Logs de Auditoria**
   - Registro de todas as ações
   - IP e User Agent
   - Rastreamento de alterações

### Boas Práticas

- ✅ Senhas hasheadas com `password_hash()`
- ✅ HTTPS em produção
- ✅ Validação client-side e server-side
- ✅ Rate limiting em endpoints sensíveis
- ✅ Sanitização de todos os inputs
- ✅ Escape de outputs
- ✅ Princípio do menor privilégio

---

## 📝 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

## 👥 Suporte

Para suporte, entre em contato:
- Email: suporte@seudominio.com
- Documentação: [Link para docs]

---

**Desenvolvido com ❤️ para Sales Prime**