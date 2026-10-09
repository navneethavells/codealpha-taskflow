const STORAGE_KEY = "codealpha-taskflow-tasks";
const THEME_KEY = "codealpha-taskflow-theme";

const columns = {
  todo: document.querySelector("#todoList"),
  progress: document.querySelector("#progressList"),
  done: document.querySelector("#doneList")
};

const columnCounts = {
  todo: document.querySelector("#todoCount"),
  progress: document.querySelector("#progressCount"),
  done: document.querySelector("#doneCount")
};

const statusOrder = ["todo", "progress", "done"];

const demoTasks = [
  {
    id: "task-1",
    title: "Create responsive dashboard layout",
    category: "Design",
    priority: "High",
    dueDate: "2026-10-12",
    status: "todo"
  },
  {
    id: "task-2",
    title: "Connect task cards with localStorage",
    category: "Development",
    priority: "High",
    dueDate: "2026-10-14",
    status: "progress"
  },
  {
    id: "task-3",
    title: "Test filters on mobile layout",
    category: "Testing",
    priority: "Medium",
    dueDate: "2026-10-16",
    status: "todo"
  },
  {
    id: "task-4",
    title: "Write README for GitHub submission",
    category: "Documentation",
    priority: "Low",
    dueDate: "2026-10-18",
    status: "done"
  }
];

const state = {
  tasks: loadTasks(),
  search: "",
  category: "all",
  priority: "all"
};

const elements = {
  taskForm: document.querySelector("#taskForm"),
  taskTitle: document.querySelector("#taskTitle"),
  taskCategory: document.querySelector("#taskCategory"),
  taskPriority: document.querySelector("#taskPriority"),
  taskDueDate: document.querySelector("#taskDueDate"),
  totalTasks: document.querySelector("#totalTasks"),
  activeTasks: document.querySelector("#activeTasks"),
  doneTasks: document.querySelector("#doneTasks"),
  completionRate: document.querySelector("#completionRate"),
  completionBar: document.querySelector("#completionBar"),
  categoryChart: document.querySelector("#categoryChart"),
  searchInput: document.querySelector("#searchInput"),
  filterCategory: document.querySelector("#filterCategory"),
  filterPriority: document.querySelector("#filterPriority"),
  resetData: document.querySelector("#resetData"),
  clearDone: document.querySelector("#clearDone"),
  themeToggle: document.querySelector("#themeToggle"),
  focusTitle: document.querySelector("#focusTitle"),
  focusCopy: document.querySelector("#focusCopy"),
  template: document.querySelector("#taskTemplate")
};

initialize();

function initialize() {
  elements.taskDueDate.value = getDefaultDueDate();
  applySavedTheme();
  bindEvents();
  render();
}

function bindEvents() {
  elements.taskForm.addEventListener("submit", handleAddTask);
  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderBoard();
  });

  elements.filterCategory.addEventListener("change", (event) => {
    state.category = event.target.value;
    renderBoard();
  });

  elements.filterPriority.addEventListener("change", (event) => {
    state.priority = event.target.value;
    renderBoard();
  });

  elements.resetData.addEventListener("click", () => {
    state.tasks = [...demoTasks];
    saveTasks();
    render();
  });

  elements.clearDone.addEventListener("click", () => {
    state.tasks = state.tasks.filter((task) => task.status !== "done");
    saveTasks();
    render();
  });

  elements.themeToggle.addEventListener("click", toggleTheme);

  Object.values(columns).forEach((column) => {
    column.addEventListener("click", handleBoardAction);
  });
}

function handleAddTask(event) {
  event.preventDefault();

  const task = {
    id: createTaskId(),
    title: elements.taskTitle.value.trim(),
    category: elements.taskCategory.value,
    priority: elements.taskPriority.value,
    dueDate: elements.taskDueDate.value,
    status: "todo"
  };

  if (!task.title || !task.dueDate) {
    return;
  }

  state.tasks.unshift(task);
  saveTasks();
  elements.taskForm.reset();
  elements.taskDueDate.value = getDefaultDueDate();
  elements.taskTitle.focus();
  render();
}

function handleBoardAction(event) {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  const card = button.closest(".task-card");
  const taskId = card.dataset.id;

  if (button.classList.contains("delete-task")) {
    state.tasks = state.tasks.filter((task) => task.id !== taskId);
  }

  if (button.classList.contains("move-left")) {
    moveTask(taskId, -1);
  }

  if (button.classList.contains("move-right")) {
    moveTask(taskId, 1);
  }

  saveTasks();
  render();
}

function moveTask(taskId, direction) {
  state.tasks = state.tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    const nextIndex = statusOrder.indexOf(task.status) + direction;
    return {
      ...task,
      status: statusOrder[Math.max(0, Math.min(statusOrder.length - 1, nextIndex))]
    };
  });
}

function render() {
  renderStats();
  renderChart();
  renderBoard();
  renderFocusCard();
}

function renderStats() {
  const total = state.tasks.length;
  const active = state.tasks.filter((task) => task.status === "progress").length;
  const done = state.tasks.filter((task) => task.status === "done").length;
  const completion = total ? Math.round((done / total) * 100) : 0;

  elements.totalTasks.textContent = total;
  elements.activeTasks.textContent = active;
  elements.doneTasks.textContent = done;
  elements.completionRate.textContent = `${completion}%`;
  elements.completionBar.style.width = `${completion}%`;
}

function renderChart() {
  const categories = ["Design", "Development", "Testing", "Documentation"];
  const counts = categories.map((category) => ({
    category,
    total: state.tasks.filter((task) => task.category === category).length
  }));
  const max = Math.max(...counts.map((item) => item.total), 1);

  elements.categoryChart.replaceChildren();

  counts.forEach((item) => {
    const row = document.createElement("div");
    row.className = "chart-row";

    const label = document.createElement("span");
    label.textContent = item.category;

    const bar = document.createElement("div");
    bar.className = "chart-bar";

    const fill = document.createElement("i");
    fill.style.width = `${(item.total / max) * 100}%`;

    const number = document.createElement("strong");
    number.textContent = item.total;

    bar.append(fill);
    row.append(label, bar, number);
    elements.categoryChart.append(row);
  });
}

function renderBoard() {
  Object.values(columns).forEach((column) => column.replaceChildren());

  const filteredTasks = getFilteredTasks();

  statusOrder.forEach((status) => {
    const tasks = filteredTasks.filter((task) => task.status === status);
    columnCounts[status].textContent = tasks.length;

    if (!tasks.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No tasks here";
      columns[status].append(empty);
      return;
    }

    tasks.forEach((task) => {
      columns[status].append(createTaskCard(task));
    });
  });
}

function createTaskCard(task) {
  const fragment = elements.template.content.cloneNode(true);
  const card = fragment.querySelector(".task-card");
  const priority = fragment.querySelector(".priority-pill");
  const title = fragment.querySelector("h4");
  const meta = fragment.querySelector(".task-meta");
  const moveLeft = fragment.querySelector(".move-left");
  const moveRight = fragment.querySelector(".move-right");

  card.dataset.id = task.id;
  priority.textContent = task.priority;
  priority.classList.add(task.priority.toLowerCase());
  title.textContent = task.title;
  meta.textContent = `${task.category} • Due ${formatDate(task.dueDate)}`;

  moveLeft.disabled = task.status === "todo";
  moveRight.disabled = task.status === "done";

  if (task.status === "done") {
    moveRight.textContent = "Done";
  }

  return fragment;
}

function renderFocusCard() {
  const overdue = state.tasks.filter((task) => {
    return task.status !== "done" && new Date(task.dueDate) < startOfToday();
  }).length;

  if (overdue > 0) {
    elements.focusTitle.textContent = `${overdue} overdue task${overdue > 1 ? "s" : ""}`;
    elements.focusCopy.textContent = "Review overdue work first, then move the most important task forward.";
    return;
  }

  const nextTask = state.tasks
    .filter((task) => task.status !== "done")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

  if (!nextTask) {
    elements.focusTitle.textContent = "All clear";
    elements.focusCopy.textContent = "Everything is complete. Add a new task when you are ready.";
    return;
  }

  elements.focusTitle.textContent = nextTask.title;
  elements.focusCopy.textContent = `Next due date: ${formatDate(nextTask.dueDate)}.`;
}

function getFilteredTasks() {
  return state.tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(state.search);
    const matchesCategory = state.category === "all" || task.category === state.category;
    const matchesPriority = state.priority === "all" || task.priority === state.priority;
    return matchesSearch && matchesCategory && matchesPriority;
  });
}

function loadTasks() {
  const savedTasks = localStorage.getItem(STORAGE_KEY);

  if (!savedTasks) {
    return [...demoTasks];
  }

  try {
    return JSON.parse(savedTasks);
  } catch {
    return [...demoTasks];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function applySavedTheme() {
  if (localStorage.getItem(THEME_KEY) === "dark") {
    document.body.classList.add("dark");
  }
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem(THEME_KEY, document.body.classList.contains("dark") ? "dark" : "light");
}

function getDefaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().slice(0, 10);
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function createTaskId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
