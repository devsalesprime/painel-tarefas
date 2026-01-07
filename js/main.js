// main.js
// Global constants and simple defaults used across modules.

window.viewMode = "lista"; // 'lista' ou 'kanban'
window.ordenacaoAtual = "data_criacao";

// Prioridades (Matriz de Eisenhower)
window.prioridades = {
  urgente_importante: {
    nome: "Fazer Agora",
    cor: "danger",
    icone: "fas fa-exclamation-circle",
    descricao: "Urgente e Importante",
    ordem: 1
  },
  importante_nao_urgente: {
    nome: "Agendar",
    cor: "success",
    icone: "fas fa-calendar-check",
    descricao: "Importante mas Não Urgente",
    ordem: 2
  },
  urgente_nao_importante: {
    nome: "Delegar",
    cor: "warning",
    icone: "fas fa-user-friends",
    descricao: "Urgente mas Não Importante",
    ordem: 3
  },
  nao_urgente_nao_importante: {
    nome: "Eliminar",
    cor: "info",
    icone: "fas fa-trash-alt",
    descricao: "Nem Urgente nem Importante",
    ordem: 4
  }
};

// Kanban columns
window.kanbanColumns = [
  { id: "pendente", title: "📋 Pendente", status: "pendente", color: "secondary" },
  { id: "iniciada", title: "🚶‍♂️ Em Andamento", status: "iniciada", color: "primary" },
  { id: "pausada", title: "⏸️ Pausada", status: "pausada", color: "warning" },
  { id: "concluida", title: "✅ Concluída", status: "concluida", color: "success" }
];