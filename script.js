// =============================
// ESTADO DA APLICAÇÃO
// =============================
// Cada tarefa possui:
// id, texto, status e data de criação
let tasks = [];

// =============================
// ELEMENTOS DO DOM
// =============================
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const columns = document.querySelectorAll(".column");

const cardContainers = {
  todo: document.getElementById("todo"),
  doing: document.getElementById("doing"),
  done: document.getElementById("done")
};

// =============================
// FUNÇÕES UTILITÁRIAS
// =============================

// Gera um id único para cada card
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Salva as tarefas no navegador
function saveTasks() {
  localStorage.setItem("kanbanTasks", JSON.stringify(tasks));
}

// Carrega as tarefas salvas
function loadTasks() {
  const savedTasks = localStorage.getItem("kanbanTasks");
  tasks = savedTasks ? JSON.parse(savedTasks) : [];
}

// Formata a data para pt-BR
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("pt-BR");
}

// Busca uma tarefa pelo id
function getTaskById(taskId) {
  return tasks.find(task => task.id === taskId);
}

// Evita inserir HTML perigoso no texto do card
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =============================
// CRUD DAS TAREFAS
// =============================

// Adiciona uma nova tarefa
function addTask() {
  const text = taskInput.value.trim();

  if (!text) {
    alert("Digite uma tarefa antes de adicionar.");
    return;
  }

  const newTask = {
    id: generateId(),
    text: text,
    status: "todo",
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  taskInput.value = "";

  saveTasks();
  renderTasks();
}

// Remove uma tarefa
function deleteTask(taskId) {
  tasks = tasks.filter(task => task.id !== taskId);
  saveTasks();
  renderTasks();
}

// Atualiza o texto da tarefa
function updateTaskText(taskId, newText) {
  const task = getTaskById(taskId);
  if (!task) return;

  task.text = newText.trim();
  saveTasks();
  renderTasks();
}

// Atualiza o status da tarefa
function updateTaskStatus(taskId, newStatus) {
  const task = getTaskById(taskId);
  if (!task) return;

  task.status = newStatus;
  saveTasks();
  renderTasks();
}

// =============================
// RENDERIZAÇÃO
// =============================

// Limpa os containers
function clearColumns() {
  Object.values(cardContainers).forEach(container => {
    container.innerHTML = "";
  });
}

// Renderiza mensagem de coluna vazia
function renderEmptyMessage(container, status) {
  const hasTasks = tasks.some(task => task.status === status);

  if (!hasTasks) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "Nenhum card nesta coluna.";
    container.appendChild(emptyMessage);
  }
}

// Cria o elemento visual do card
function createCardElement(task) {
  const card = document.createElement("div");
  card.className = "card";
  card.draggable = true;
  card.dataset.id = task.id;

  card.innerHTML = `
    <div class="card-content">
      <p>${escapeHtml(task.text)}</p>
      <small>Criado em: ${formatDate(task.createdAt)}</small>
    </div>
    <div class="card-actions">
      <button class="edit-btn">Editar</button>
      <button class="delete-btn">Excluir</button>
    </div>
  `;

  // Eventos do drag and drop
  card.addEventListener("dragstart", handleDragStart);
  card.addEventListener("dragend", handleDragEnd);

  // Duplo clique para editar
  card.addEventListener("dblclick", () => {
    enableEditMode(card, task);
  });

  // Botões do card
  const editBtn = card.querySelector(".edit-btn");
  const deleteBtn = card.querySelector(".delete-btn");

  editBtn.addEventListener("click", () => {
    enableEditMode(card, task);
  });

  deleteBtn.addEventListener("click", () => {
    deleteTask(task.id);
  });

  return card;
}

// Renderiza todas as tarefas
function renderTasks() {
  clearColumns();

  const statuses = ["todo", "doing", "done"];

  statuses.forEach(status => {
    const container = cardContainers[status];
    const filteredTasks = tasks.filter(task => task.status === status);

    filteredTasks.forEach(task => {
      const card = createCardElement(task);
      container.appendChild(card);
    });

    renderEmptyMessage(container, status);
  });
}

// =============================
// EDIÇÃO DO CARD
// =============================

// Ativa modo de edição no card
function enableEditMode(cardElement, task) {
  cardElement.innerHTML = `
    <div class="edit-area">
      <textarea>${task.text}</textarea>
      <div class="edit-actions">
        <button class="save-btn">Salvar</button>
        <button class="cancel-btn">Cancelar</button>
      </div>
    </div>
  `;

  const textarea = cardElement.querySelector("textarea");
  const saveBtn = cardElement.querySelector(".save-btn");
  const cancelBtn = cardElement.querySelector(".cancel-btn");

  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);

  saveBtn.addEventListener("click", () => {
    const newText = textarea.value.trim();

    if (!newText) {
      alert("O texto do card não pode ficar vazio.");
      return;
    }

    updateTaskText(task.id, newText);
  });

  cancelBtn.addEventListener("click", () => {
    renderTasks();
  });

  textarea.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      renderTasks();
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      saveBtn.click();
    }
  });
}

// =============================
// DRAG AND DROP
// =============================

// Quando começa a arrastar
function handleDragStart(event) {
  const taskId = event.target.dataset.id;
  event.dataTransfer.setData("text/plain", taskId);
  event.dataTransfer.effectAllowed = "move";
  event.target.classList.add("dragging");
}

// Quando termina de arrastar
function handleDragEnd(event) {
  event.target.classList.remove("dragging");

  columns.forEach(column => {
    column.classList.remove("drag-over");
  });
}

// Quando passa por cima da coluna
function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  event.currentTarget.classList.add("drag-over");
}

// Quando sai da coluna
function handleDragLeave(event) {
  event.currentTarget.classList.remove("drag-over");
}

// Quando solta o card na coluna
function handleDrop(event) {
  event.preventDefault();

  const newStatus = event.currentTarget.dataset.status;
  const taskId = event.dataTransfer.getData("text/plain");

  event.currentTarget.classList.remove("drag-over");

  if (!taskId || !newStatus) return;

  updateTaskStatus(taskId, newStatus);
}

// =============================
// EVENTOS GERAIS
// =============================

// Clique no botão para adicionar
addTaskBtn.addEventListener("click", addTask);

// Enter no input também adiciona
taskInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    addTask();
  }
});

// Eventos das colunas para receber drop
columns.forEach(column => {
  column.addEventListener("dragover", handleDragOver);
  column.addEventListener("dragleave", handleDragLeave);
  column.addEventListener("drop", handleDrop);
});

// =============================
// INICIALIZAÇÃO
// =============================
function init() {
  loadTasks();
  renderTasks();
}

init();