# 🔐 Guia de Configuração de Variáveis de Ambiente

## Visão Geral

Este projeto utiliza variáveis de ambiente para armazenar credenciais e configurações sensíveis de forma segura. As credenciais **não** são mais armazenadas diretamente no código-fonte.

---

## 📋 Configuração Inicial

### 1. Instalar Dependências

Primeiro, instale as dependências do Composer (incluindo a biblioteca `vlucas/phpdotenv`):

```bash
composer install
```

### 2. Criar Arquivo .env

Copie o arquivo de exemplo `.env.example` para `.env`:

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

### 3. Configurar Variáveis

Edite o arquivo `.env` com suas credenciais reais:

```env
# ========== CONFIGURAÇÕES DO BANCO DE DADOS ==========
DB_HOST=localhost
DB_NAME=task_panel
DB_USER=root
DB_PASS=sua_senha_aqui

# ========== CONFIGURAÇÕES DE SEGURANÇA ==========
JWT_SECRET=sua_chave_secreta_unica_aqui

# ========== CONFIGURAÇÕES DE E-MAIL (SMTP) ==========
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_de_app_gmail
SMTP_FROM_EMAIL=naoresponda@seudominio.com
SMTP_FROM_NAME=Sistema de Tarefas

# ========== CONFIGURAÇÕES GERAIS ==========
TIME_ZONE=America/Sao_Paulo
AMBIENTE=desenvolvimento
MAX_FILE_SIZE=5242880
SESSION_LIFETIME=604800
```

---

## 🔑 Variáveis Obrigatórias

### Banco de Dados

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DB_HOST` | Host do banco de dados | `localhost` |
| `DB_NAME` | Nome do banco de dados | `task_panel` |
| `DB_USER` | Usuário do banco | `root` |
| `DB_PASS` | Senha do banco | `senha123` |

### Segurança

| Variável | Descrição | Como Gerar |
|----------|-----------|------------|
| `JWT_SECRET` | Chave secreta para JWT | `php -r "echo bin2hex(random_bytes(32));"` |

### E-mail (SMTP)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `SMTP_HOST` | Servidor SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Porta SMTP | `587` (TLS) ou `465` (SSL) |
| `SMTP_USERNAME` | E-mail de envio | `seu@email.com` |
| `SMTP_PASSWORD` | Senha de app | Ver seção abaixo |
| `SMTP_FROM_EMAIL` | E-mail remetente | `noreply@dominio.com` |
| `SMTP_FROM_NAME` | Nome do remetente | `Sistema de Tarefas` |

---

## 📧 Configuração do Gmail

Para usar o Gmail como servidor SMTP:

### 1. Ativar Verificação em 2 Etapas

1. Acesse [myaccount.google.com](https://myaccount.google.com)
2. Vá em **Segurança**
3. Ative **Verificação em duas etapas**

### 2. Gerar Senha de App

1. Acesse [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Selecione **App**: E-mail
3. Selecione **Dispositivo**: Outro (nome personalizado)
4. Digite: "Task Panel"
5. Clique em **Gerar**
6. Copie a senha de 16 caracteres gerada
7. Use essa senha em `SMTP_PASSWORD`

### Configuração no .env

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu.email@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
SMTP_FROM_EMAIL=seu.email@gmail.com
SMTP_FROM_NAME=Sistema de Tarefas
```

---

## 🔒 Segurança

### ✅ Boas Práticas

- ✅ **NUNCA** commite o arquivo `.env` no Git
- ✅ O `.env` já está no `.gitignore`
- ✅ Use `.env.example` como template
- ✅ Gere uma `JWT_SECRET` única para produção
- ✅ Use senhas fortes para o banco de dados
- ✅ Em produção, mude `AMBIENTE=producao`

### ❌ Não Fazer

- ❌ Não compartilhe seu arquivo `.env`
- ❌ Não use a mesma `JWT_SECRET` em desenvolvimento e produção
- ❌ Não versione credenciais no código
- ❌ Não use senhas fracas

---

## 🌍 Ambientes

### Desenvolvimento

```env
AMBIENTE=desenvolvimento
```

- Exibe erros detalhados
- Logs verbosos
- Validações relaxadas

### Produção

```env
AMBIENTE=producao
```

- Oculta erros do usuário
- Logs apenas em arquivo
- Validações rigorosas
- **IMPORTANTE**: Use HTTPS!

---

## 🔧 Outras Configurações SMTP

### Microsoft Outlook/Office 365

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USERNAME=seu@outlook.com
SMTP_PASSWORD=sua_senha
```

### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=sua_api_key_sendgrid
```

### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USERNAME=postmaster@seu-dominio.mailgun.org
SMTP_PASSWORD=sua_senha_mailgun
```

---

## 🐛 Troubleshooting

### Erro: "Dotenv values cannot be empty"

**Causa:** Variáveis obrigatórias estão vazias no `.env`

**Solução:** Preencha todas as variáveis obrigatórias:
- `DB_HOST`
- `DB_NAME`
- `DB_USER`
- `JWT_SECRET`

### Erro: "Unable to locate .env file"

**Causa:** Arquivo `.env` não existe

**Solução:**
```bash
copy .env.example .env
```

### Erro ao enviar e-mail

**Causa:** Credenciais SMTP incorretas

**Solução:**
1. Verifique `SMTP_USERNAME` e `SMTP_PASSWORD`
2. Para Gmail, use senha de app (não a senha normal)
3. Verifique se a porta está correta (587 ou 465)

---

## 📚 Referências

- [vlucas/phpdotenv](https://github.com/vlucas/phpdotenv) - Biblioteca utilizada
- [PHPMailer](https://github.com/PHPMailer/PHPMailer) - Envio de e-mails
- [Senhas de App do Google](https://support.google.com/accounts/answer/185833)

---

**Última atualização:** 7 de janeiro de 2026
