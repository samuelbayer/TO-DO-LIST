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
let lastPointerPos = null; // fallback position when originalEvent is missing

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
  // store instance so manual drag can destroy/recreate it
  window.sortableInstance = new Sortable(tasksContainer, {
    animation: 0,
    handle: ".my-handle",
    delay: 200,
    delayOnTouchOnly: true,
    touchStartThreshold: 0,
    // Use fallback drag (clone follows pointer) and disable swap for precise following
    forceFallback: true,
    fallbackOnBody: true,
    fallbackTolerance: 0,
    swap: false,
    onStart: (evt) => {
      // Fallback to lastPointerPos (no-op for production)
      try {
        const e = evt && (evt.originalEvent || {});
        let pos = null;
        if (e && e.touches && e.touches[0]) pos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        else if (typeof e.clientX === 'number' && typeof e.clientY === 'number') pos = { x: e.clientX, y: e.clientY };
        else pos = lastPointerPos;
      } catch (err) {
        // silently ignore
      }
    },
    onMove: (evt, originalEvent) => {
      // Use fallback position if needed (no-op logging in production)
      try {
        const e = originalEvent || (evt && evt.originalEvent) || {};
        let pos = null;
        if (e && e.touches && e.touches[0]) pos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        else if (typeof e.clientX === 'number' && typeof e.clientY === 'number') pos = { x: e.clientX, y: e.clientY };
        else pos = lastPointerPos;
      } catch (err) {
        // silently ignore
      }
      return true;
    },
    onEnd: (evt) => {
      // Use safe fallback to lastPointerPos
      try {
        const e = evt && (evt.originalEvent || {});
        let pos = null;
        if (e && e.touches && e.touches[0]) pos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        else if (typeof e.clientX === 'number' && typeof e.clientY === 'number') pos = { x: e.clientX, y: e.clientY };
        else pos = lastPointerPos;
      } catch (err) {
        // silently ignore
      }

      const newOrder = Array.from(tasksContainer.children).map((div) => div.id);
      const reordered = newOrder.map((id) =>
        tasks.find((task) => task.id === id)
      );
      localStorage.setItem("data", JSON.stringify(reordered));
      tasks.length = 0;
      tasks.push(...reordered);
      // clear fallback
      lastPointerPos = null;
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

// Prevent context menu on the handle to avoid interfering with long-press drag on mobile
document.addEventListener('contextmenu', (e) => {
  if (e.target && e.target.closest && e.target.closest('.my-handle')) {
    e.preventDefault();
  }
});

// Instrument handle pointer/touch events and implement manual drag (long-press -> clone follows pointer, placeholder swap)
let handleActive = false;
let touchActive = false;
const MANUAL_DELAY = 300; // ms long press to start manual drag
const manual = {
  active: false,
  dragItem: null,
  dragClone: null,
  placeholder: null,
  offset: { x: 0, y: 0 },
  pointerId: null,
  longPressTimeout: null,
};

function createPlaceholder(height) {
  const ph = document.createElement('div');
  ph.className = 'task placeholder';
  ph.style.height = height + 'px';
  ph.style.border = '0';
  ph.style.background = 'transparent';
  ph.style.margin = getComputedStyle(document.querySelector('.task')).margin;
  return ph;
}

function startManualDrag(e, item) {
  if (!item) return;
  manual.active = true;
  manual.dragItem = item;
  const rect = item.getBoundingClientRect();
  manual.offset.x = e.clientX - rect.left;
  manual.offset.y = e.clientY - rect.top;

  // Clone
  const clone = item.cloneNode(true);
  clone.classList.add('drag-clone');
  clone.style.width = rect.width + 'px';
  clone.style.height = rect.height + 'px';
  clone.style.position = 'fixed';
  clone.style.left = rect.left + 'px';
  clone.style.top = rect.top + 'px';
  clone.style.margin = '0';
  clone.style.pointerEvents = 'none';
  clone.style.zIndex = 9999;
  document.body.appendChild(clone);
  manual.dragClone = clone;

  // Placeholder at item's position
  const placeholder = createPlaceholder(rect.height);
  item.parentNode.replaceChild(placeholder, item);
  manual.placeholder = placeholder;

  // hide original item (we'll re-insert on drop)
  item.style.visibility = 'hidden';

  // stop Sortable while we use manual drag
  if (window.sortableInstance && typeof window.sortableInstance.destroy === 'function') {
    try { window.sortableInstance.destroy(); } catch (err) { /* ignore */ }
  }

  // prevent page scroll
  document.body.classList.add('sortable-no-scroll');

  // capture pointer to ensure we receive events
  if (e.pointerId && e.target.setPointerCapture) {
    try { e.target.setPointerCapture(e.pointerId); manual.pointerId = e.pointerId; } catch (err) { /* ignore */ }
  }

  // add listeners
  document.addEventListener('pointermove', onManualPointerMove);
  document.addEventListener('pointerup', onManualPointerUp);
}

function onManualPointerMove(e) {
  if (!manual.active) return;
  e.preventDefault();
  lastPointerPos = { x: e.clientX, y: e.clientY };
  // move clone
  const left = e.clientX - manual.offset.x;
  const top = e.clientY - manual.offset.y;
  manual.dragClone.style.left = left + 'px';
  manual.dragClone.style.top = top + 'px';

  // find where to place placeholder
  const children = Array.from(tasksContainer.children).filter((c) => c !== manual.placeholder);
  let inserted = false;
  for (const child of children) {
    const r = child.getBoundingClientRect();
    const centerY = r.top + r.height / 2;
    if (e.clientY < centerY) {
      tasksContainer.insertBefore(manual.placeholder, child);
      inserted = true;
      break;
    }
  }
  if (!inserted) tasksContainer.appendChild(manual.placeholder);
}

function onManualPointerUp(e) {
  if (!manual.active) return;
  e.preventDefault();
  // release pointer capture
  if (manual.pointerId && e.target.releasePointerCapture) {
    try { e.target.releasePointerCapture(manual.pointerId); } catch (err) { /* ignore */ }
  }

  // remove clone and insert original at placeholder
  const item = manual.dragItem;
  manual.placeholder.parentNode.replaceChild(item, manual.placeholder);
  item.style.visibility = '';

  // cleanup clone
  if (manual.dragClone && manual.dragClone.parentNode) manual.dragClone.parentNode.removeChild(manual.dragClone);

  // cleanup listeners and flags
  document.removeEventListener('pointermove', onManualPointerMove);
  document.removeEventListener('pointerup', onManualPointerUp);
  document.body.classList.remove('sortable-no-scroll');

  // update tasks array order based on DOM
  const newOrder = Array.from(tasksContainer.children).map((div) => div.id);
  const reordered = newOrder.map((id) => tasks.find((t) => t.id === id));
  localStorage.setItem('data', JSON.stringify(reordered));
  tasks.length = 0;
  tasks.push(...reordered);

  // re-init Sortable
  initSortable();

  // reset
  manual.active = false;
  manual.dragItem = null;
  manual.dragClone = null;
  manual.placeholder = null;
  manual.pointerId = null;
  lastPointerPos = null;
}

// Start long-press on pointerdown on handle
document.addEventListener('pointerdown', (e) => {
  const handle = e.target && e.target.closest && e.target.closest('.my-handle');
  if (!handle) return;
  e.preventDefault();
  e.stopPropagation();

  const item = handle.closest('.task');
  // start long-press timer
  clearTimeout(manual.longPressTimeout);
  manual.longPressTimeout = setTimeout(() => startManualDrag(e, item), MANUAL_DELAY);

  // cancel if pointerup/cancel before delay
  const cancel = () => { clearTimeout(manual.longPressTimeout); document.removeEventListener('pointerup', cancel); document.removeEventListener('pointercancel', cancel); };
  document.addEventListener('pointerup', cancel, { once: true });
  document.addEventListener('pointercancel', cancel, { once: true });
});

// touch fallback: start on touchstart and handle touchmove/touchend
document.addEventListener('touchstart', (e) => {
  const handle = e.target && e.target.closest && e.target.closest('.my-handle');
  if (!handle) return;
  const touch = e.touches[0];
  if (!touch) return;
  clearTimeout(manual.longPressTimeout);
  manual.longPressTimeout = setTimeout(() => startManualDrag({ clientX: touch.clientX, clientY: touch.clientY, pointerId: null, target: handle }, handle.closest('.task')), MANUAL_DELAY);
  const cancel = () => { clearTimeout(manual.longPressTimeout); document.removeEventListener('touchend', cancel); document.removeEventListener('touchcancel', cancel); };
  document.addEventListener('touchend', cancel, { once: true });
  document.addEventListener('touchcancel', cancel, { once: true });
}, { passive: true });
