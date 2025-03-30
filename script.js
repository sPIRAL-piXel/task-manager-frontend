document.addEventListener("DOMContentLoaded", async () => {
  const BASE_URL = "http://localhost:4000";
  let userId = null;
  let tasks = [];
  let editingTaskId = null;
  let filteredTasks = [];

  const addTaskBtn = document.getElementById("add-task-btn");
  const createTaskModal = document.getElementById("create-task-modal");
  const updateTaskModal = document.getElementById("update-task-modal");
  const taskForm = document.getElementById("task-form");
  const updateTaskForm = document.getElementById("update-task-form");
  const cancelBtns = document.querySelectorAll(".cancel-btn");
  const taskList = document.getElementById("task-list");
  const themeToggle = document.getElementById("theme-toggle");
  const searchInput = document.getElementById("input-search");

  const initializeTheme = () => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
  };

  const updateThemeIcon = (theme) => {
    const themeIcon = document.querySelector("#theme-toggle i");
    if (theme === "light") {
      themeIcon.classList.add("ri-sun-line");
      themeIcon.classList.remove("ri-moon-line");
    } else {
      themeIcon.classList.remove("ri-moon-line");
      themeIcon.classList.add("ri-sun-line");
    }
  };

  const fetchUserInfo = async () => {
    try {
      const response = await fetch(`${BASE_URL}/schema/user/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "piyushd784@gmail.com" }),
      });

      if (!response.ok) throw new Error("Failed to fetch user information");

      const users = await response.json();
      if (users.length > 0) {
        userId = users[0].id;
      } else {
        throw new Error("User not found");
      }
    } catch (err) {
      console.error("Error fetching user information:", err);
      showError("Failed to load user information: " + err.message);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${BASE_URL}/schema/task/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error("Failed to fetch tasks");
      tasks = await response.json();
      filteredTasks = [...tasks];
      renderTasks(filteredTasks);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      showError("Failed to load tasks: " + err.message);
    }
  };

  const renderTasks = (tasksToRender = tasks) => {
    taskList.innerHTML = "";
    if (tasksToRender.length === 0) {
      taskList.innerHTML = '<div class="no-results">No tasks found</div>';
      return;
    }

    tasksToRender.forEach((task) => {
      const taskDiv = document.createElement("div");
      taskDiv.classList.add("task-item");
      taskDiv.setAttribute("data-id", task.id);

      taskDiv.innerHTML = `
        <h3>${task.title}</h3>
        <p>${task.description}</p>
        <div class="task-meta">
          <span class="status" data-status="${task.status}">
            <i class="ri-checkbox-circle-line"></i>
            Status: ${task.status.replace(/_/g, " ")}
          </span>
          <span>
            <i class="ri-flag-line"></i>
            Priority: ${task.priority}
          </span>
          <span>
            <i class="ri-time-line"></i>
            Due: ${new Date(task.dueDate).toLocaleString()}
          </span>
        </div>
        <div class="task-actions">
          <button class="edit-task-btn">
            <i class="ri-edit-line"></i> Edit
          </button>
          <button class="delete-task-btn">
            <i class="ri-delete-bin-line"></i> Delete
          </button>
        </div>
      `;

      taskList.appendChild(taskDiv);

      const editBtn = taskDiv.querySelector(".edit-task-btn");
      const deleteBtn = taskDiv.querySelector(".delete-task-btn");

      editBtn.addEventListener("click", () => openUpdateTaskModal(task.id));
      deleteBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete this task?")) {
          deleteTask(task.id);
        }
      });
    });
  };

  addTaskBtn.addEventListener("click", () => {
    createTaskModal.classList.add("show");
  });

  const openUpdateTaskModal = (taskId) => {
    editingTaskId = taskId;
    const task = tasks.find((t) => t.id === taskId);
    document.getElementById("update-title").value = task.title;
    document.getElementById("update-description").value = task.description;
    document.getElementById("update-due-date").value = new Date(task.dueDate)
      .toISOString()
      .slice(0, 16);
    document.getElementById("update-status").value = task.status;
    document.getElementById("update-priority").value = task.priority;

    updateTaskModal.classList.add("show");
  };

  cancelBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      createTaskModal.classList.remove("show");
      updateTaskModal.classList.remove("show");
      resetForm(taskForm);
      resetForm(updateTaskForm);
    });
  });

  updateTaskModal.addEventListener("click", (e) => {
    if (e.target === updateTaskModal) {
      updateTaskModal.classList.remove("show");
      resetForm(updateTaskForm);
    }
  });

  taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!userId) {
      showError("User not found. Please try again later.");
      return;
    }

    const newTask = {
      title: document.getElementById("title").value,
      description: document.getElementById("description").value,
      dueDate: new Date(document.getElementById("dueDate").value).toISOString(),
      priority: document.getElementById("priority").value,
      status: "TO_DO",
      userId: userId,
    };

    try {
      const response = await fetch(`${BASE_URL}/schema/task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend error:", errorData);
        throw new Error(errorData.message || "Failed to create task");
      }

      const createdTask = await response.json();
      tasks.push(createdTask);
      renderTasks();
      createTaskModal.classList.remove("show");
      resetForm(taskForm);
    } catch (err) {
      console.error("Error creating task:", err.message);
      showError("Failed to create task: " + err.message);
    }
  });

  updateTaskForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const updatedTask = {
      title: document.getElementById("update-title").value,
      description: document.getElementById("update-description").value,
      dueDate: new Date(
        document.getElementById("update-due-date").value
      ).toISOString(),
      priority: document.getElementById("update-priority").value,
      status: document.getElementById("update-status").value,
    };

    try {
      const response = await fetch(`${BASE_URL}/schema/task/${editingTaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask),
      });
      if (!response.ok) throw new Error("Failed to update task");
      const index = tasks.findIndex((task) => task.id === editingTaskId);
      tasks[index] = { ...tasks[index], ...updatedTask };
      renderTasks();
      updateTaskModal.classList.remove("show");
      resetForm(updateTaskForm);
    } catch (err) {
      console.error("Error updating task:", err);
      showError("Failed to update task: " + err.message);
    }
  });

  const deleteTask = async (taskId) => {
    try {
      const response = await fetch(`${BASE_URL}/schema/task/${taskId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete task");
      tasks = tasks.filter((task) => task.id !== taskId);
      renderTasks();
    } catch (err) {
      console.error("Error deleting task:", err);
      showError("Error deleting task: " + err.message);
    }
  };

  const resetForm = (form) => {
    form.reset();
  };

  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
  });

  const showError = (message) => {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    document.querySelector("main").prepend(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
  };

  const filterTasks = (searchTerm) => {
    if (!searchTerm) {
      filteredTasks = [...tasks];
    } else {
      filteredTasks = tasks.filter((task) =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    renderTasks(filteredTasks);
  };

  searchInput.addEventListener("input", (e) => {
    filterTasks(e.target.value);
  });

  await fetchUserInfo();
  if (userId) {
    fetchTasks();
  } else {
    showError("User not found. Please log in.");
  }

  const openLinks = () => {
    const dropdown = document.querySelector(".linkedin-dropdown");
    dropdown.classList.toggle("show");
  };

  document.getElementById("openLinks").addEventListener("click", (e) => {
    e.stopPropagation();
    openLinks();
  });

  document.querySelectorAll(".linkedin-option").forEach((option) => {
    option.addEventListener("click", (e) => {
      e.stopPropagation();
      window.open(e.target.dataset.url, "_blank");
      document.querySelector(".linkedin-dropdown").classList.remove("show");
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#openLinks")) {
      document.querySelector(".linkedin-dropdown").classList.remove("show");
    }
  });

  initializeTheme();
});
