const button = document.getElementById("add-task");
const submitTaskForm = document.getElementById("submit-task-form-button");
const tasksContainer = document.getElementById("task-list");
const taskForm = document.getElementById("task-form");
const closeTaskFormBtn = document.getElementById("close-task-form-btn");
const closeDialog = document.getElementById("close-dialog");
const taskCompleted = document.getElementById("tasks-completed");
const titleInput = document.getElementById("title");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");
const cancelBtn = document.getElementById("cancel-btn");
const discardBtn = document.getElementById("discard-btn");
const deleteBtn = document.getElementById("delete");
const dialogText = document.getElementById("dialog-text");
const filterAll = document.getElementById("filter-all");
const filterCompleted = document.getElementById("filter-completed");
const filterNonCompleted = document.getElementById("filter-non-completed");
let currentTask = {};
const cancelAllTasksBtn = document.getElementById("cancel-all-tasks-btn");
const deleteAllTasksBtn = document.getElementById("delete-all-tasks-btn");
let tasks = JSON.parse(localStorage.getItem("data")) || [];
let currentFilter = "all";

function removeSpecialChars(value) {
  return value.trim().replace(/[^A-Za-z0-9\-\s]/g, "");
}

function addOrUpdateTasks() {
  if (!titleInput.value.trim()) {
    alert("Please provide a title");
    return;
  }
  const dataArrIndex = tasks.findIndex((item) => item.id === currentTask.id);
  let taskObj = {
    id: `${removeSpecialChars(titleInput.value)
      .toLowerCase()
      .split(" ")
      .join("-")}-${Date.now()}`,
    title: titleInput.value,
    date: dateInput.value,
    description: descriptionInput.value,
    completed: false,
  };

  if (dataArrIndex === -1) {
    tasks.unshift(taskObj);
  } else {
    tasks[dataArrIndex] = taskObj;
  }
  localStorage.setItem("data", JSON.stringify(tasks));
  updateTaskContainer();
  reset();
}

function deleteTask(buttonEl) {
  const dataArrIndex = tasks.findIndex(
    (item) => item.id === buttonEl.parentElement.id
  );
  buttonEl.parentElement.remove();
  tasks.splice(dataArrIndex, 1);
  localStorage.setItem("data", JSON.stringify(tasks));
  tasksCompleted();
}

function updateTaskContainer() {
  let filteredTasks = tasks;

  if (currentFilter === "completed") {
    filteredTasks = filteredTasks.filter((task) => task.completed);
  } else if (currentFilter === "nonCompleted") {
    filteredTasks = filteredTasks.filter((task) => !task.completed);
  }

  tasksContainer.innerHTML = "";
  filteredTasks.forEach(({ id, title, date, description, completed }) => {
    tasksContainer.innerHTML += `<div class="task ${
      completed ? "task-completed" : ""
    }" id="${id}" role="listitem">
      <span class="my-handle" role="button" aria-label="Drag to reorder" tabindex="0">⋮⋮</span>
    <input type="checkbox" ${
      completed ? "checked" : ""
    } onchange="toggleComplete('${id}', this.checked)" class="checkbox" aria-label="Mark task '${title}' as completed" >
      <p><strong>Title: </strong>${title}</p>
      <p><strong>Date: </strong>${date}</p>
      <p><strong>Description: </strong>${description}</p>
      <button onclick="editTask(this)" type="button" class="btn">Edit</button>
      <button onclick="deleteTask(this)" type="button" class="btn">Delete</button>
    </div>`;
  });
  tasksCompleted();
  checkTasks();
  initSortable();
}

function closeTaskForm() {
  taskForm.classList.toggle("hidden");
  button.classList.toggle("hidden");
  filterAll.classList.toggle("hidden");
  filterCompleted.classList.toggle("hidden");
  filterNonCompleted.classList.toggle("hidden");
  tasksContainer.classList.toggle("hidden");
  deleteBtn.classList.toggle("hidden");
}

function editTask(buttonEl) {
  const dataArrIndex = tasks.findIndex(
    (item) => item.id === buttonEl.parentElement.id
  );
  currentTask = tasks[dataArrIndex];
  titleInput.value = currentTask.title;
  dateInput.value = currentTask.date;
  descriptionInput.value = currentTask.description;

  submitTaskForm.innerText = "Update Task";
  closeTaskForm();
}

function reset() {
  submitTaskForm.innerText = "Add task";
  titleInput.value = "";
  dateInput.value = "";
  descriptionInput.value = "";
  currentTask = {};
}

function toggleComplete(id, isChecked) {
  const taskIndex = tasks.findIndex((item) => item.id === id);
  if (taskIndex !== -1) {
    tasks[taskIndex].completed = isChecked;
    localStorage.setItem("data", JSON.stringify(tasks));
  }
  updateTaskContainer();
}

function tasksCompleted() {
  const completedTasks = tasks.filter((task) => task.completed).length;
  taskCompleted.innerText = `${completedTasks} of ${tasks.length} completed`;
}

function checkTasks() {
  if (tasks.filter((task) => task.completed).length > 1) {
    deleteBtn.disabled = false;
  } else {
    deleteBtn.disabled = true;
  }
}

function initSortable() {
  new Sortable(tasksContainer, {
    animation: 150,
    handle: ".my-handle",
    delay: 300,
    delayOnTouchOnly: true,
    touchStartThreshold: 5,
    onEnd: () => {
      const newOrder = Array.from(tasksContainer.children).map((div) => div.id);
      const reordered = newOrder.map((id) =>
        tasks.find((task) => task.id === id)
      );
      localStorage.setItem("data", JSON.stringify(reordered));
      tasks.length = 0;
      tasks.push(...reordered);
    },
  });
}

function setActiveFilter(button) {
  [filterAll, filterCompleted, filterNonCompleted].forEach((btn) =>
    btn.classList.remove("active")
  );
  button.classList.add("active");
}

function removeAllChecked() {
  tasks = tasks.filter((task) => !task.completed);
  localStorage.setItem("data", JSON.stringify(tasks));
  updateTaskContainer();
  tasksCompleted();
}

button.addEventListener("click", () => {
  closeTaskForm();
  reset();
});

closeTaskFormBtn.addEventListener("click", () => {
  let formInputsValues =
    titleInput.value || dateInput.value || descriptionInput.value;
  let editFormInputsValues =
    titleInput.value !== currentTask.title ||
    dateInput.value !== currentTask.date ||
    descriptionInput.value !== currentTask.description;
  if (formInputsValues && editFormInputsValues) {
    closeDialog.showModal();
  } else {
    closeTaskForm();
  }
});

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addOrUpdateTasks();
  closeTaskForm();
  checkTasks();
});

cancelBtn.addEventListener("click", () => closeDialog.close());
discardBtn.addEventListener("click", () => {
  closeDialog.close();
  reset();
  closeTaskForm();
});

deleteBtn.addEventListener("click", () => {
  if (tasks.filter((task) => task.completed).length > 1) {
    dialogText.textContent = "Do you want to delete the tasks?";
    closeDialog.showModal();
    cancelBtn.classList.add("hidden");
    cancelAllTasksBtn.classList.remove("hidden");
    discardBtn.classList.add("hidden");
    deleteAllTasksBtn.classList.remove("hidden");
  }
});

deleteAllTasksBtn.addEventListener("click", () => {
  removeAllChecked();
  closeDialog.close();
  dialogText.textContent = "Do you want to discard the changes?";
  cancelBtn.classList.remove("hidden");
  cancelAllTasksBtn.classList.add("hidden");
  discardBtn.classList.remove("hidden");
  deleteAllTasksBtn.classList.add("hidden");
});

cancelAllTasksBtn.addEventListener("click", () => {
  closeDialog.close();
  dialogText.textContent = "Do you want to discard the changes?";
  cancelBtn.classList.remove("hidden");
  cancelAllTasksBtn.classList.add("hidden");
  discardBtn.classList.remove("hidden");
  deleteAllTasksBtn.classList.add("hidden");
});

filterAll.addEventListener("click", () => {
  currentFilter = "all";
  updateTaskContainer();
  setActiveFilter(filterAll);
});

filterCompleted.addEventListener("click", () => {
  currentFilter = "completed";
  updateTaskContainer();
  setActiveFilter(filterCompleted);
});

filterNonCompleted.addEventListener("click", () => {
  currentFilter = "nonCompleted";
  updateTaskContainer();
  setActiveFilter(filterNonCompleted);
});

updateTaskContainer();
tasksCompleted();
initSortable();
checkTasks();
setActiveFilter(filterAll);
