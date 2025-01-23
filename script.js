document.addEventListener("DOMContentLoaded", () => {
  const addButton = document.querySelector("#add-task-btn");
  const searchBar = document.querySelector("#input-search");
  const taskSubmission = document.querySelector(".modal-overlay");

  const BASE_URL = "http://localhost:3000/schema/task";

  fetchTasks();

  async function fetchTasks() {
    try {
      const response = await fetch(BASE_URL);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const tasks = await response.json();
      renderTasks(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }

  async function createTask(task) {
    try {
      const response = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      if (!response.ok) throw new Error("Failed to create task");
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
    }
  }

  async function updateTask(taskId, updatedTask) {
    try {
      const response = await fetch(`${BASE_URL}/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask),
      });
      if (!response.ok) throw new Error("Failed to update task");
      fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  }

  async function deleteTask(taskId) {
    try {
      const response = await fetch(`${BASE_URL}/${taskId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete task");
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  }

  function renderTasks(tasks) {
    const tasksList = document.querySelector("#task-list");
    tasksList.innerHTML = "";

    tasks.forEach((task) => {
      const taskItem = document.createElement("div");
      taskItem.classList.add("task-item");
      taskItem.innerHTML = `
        <h3>${task.title}</h3>
        <p>${task.description}</p>
        <p>Due: ${new Date(task.dueDate).toLocaleDateString()}</p>
        <p>Status: ${task.status}</p>
        <p>Priority: ${task.priority}</p>
        <button class="update-btn" data-id="${task.id}">Update</button>
        <button class="delete-btn" data-id="${task.id}">Delete</button>
      `;
      tasksList.appendChild(taskItem);
    });
    attachEventHandlers();
  }

  function attachEventHandlers() {
    const deleteButtons = document.querySelectorAll(".delete-btn");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const taskId = e.target.dataset.id;
        deleteTask(taskId);
      });
    });

    const updateButtons = document.querySelectorAll(".update-btn");
    updateButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const taskId = e.target.dataset.id;
        const updatedTask = {
          title: document.getElementById("update-title").value,
          description: document.getElementById("update-description").value,
          status: document.getElementById("update-status").value,
        };
        updateTask(taskId, updatedTask);
      });
    });
  }

  document.querySelector("#task-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const newTask = {
      title: document.getElementById("title").value,
      description: document.getElementById("description").value,
      dueDate: document.getElementById("due-date").value,
      status: document.getElementById("status").value,
      priority: document.getElementById("priority").value,
    };

    createTask(newTask);
    e.target.reset();
  });

  addButton.addEventListener("click", () => {
    taskSubmission.classList.add("show");
  });

  taskSubmission.addEventListener("click", (e) => {
    if (e.target === taskSubmission) taskSubmission.classList.remove("show");
  });
});
