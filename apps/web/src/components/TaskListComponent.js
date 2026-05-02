import { Component } from "../core/Component.js";
import { authStore } from "../core/AuthStore.js";
import { createPageLayout } from "../core/PageLayout.js";
import { wsManager } from "../core/WebSocketManager.js";
import { createButton, createSpinner } from "@workspace/ui/components/Button";

const API_BASE = "/api";

const STATUS_LABELS = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

/**
 * TaskListComponent — "Smart" component.
 * Displays the tasks of a project with drag-and-drop reordering and delete actions.
 *
 * Props:
 *   - projectId {string}  Required. The project whose tasks to display.
 *
 * Emits:
 *   - 'task:create'            when the add task button is clicked
 *   - 'task:edit'   { taskId } when a task's edit button is clicked
 *   - 'task:deleted'{ taskId } after a task is successfully deleted
 *
 * Public methods:
 *   - applyWsUpdate({ event, data })  for real-time updates from WebSocket
 */
const STATUS_COLUMNS = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "done", label: "Done" },
];

export class TaskListComponent extends Component {
  defaultState() {
    return {
      project: null, // Project metadata to check ownership
      tasks: [],
      loading: false,
      error: null,
      draggingId: null,
      highlightedId: null,
      view: localStorage.getItem("taskView") || "list",
    };
  }

  get canEdit() {
    if (!this.state.project || !authStore.user) return false;
    return this.state.project.ownerId === authStore.user.id;
  }

  onMount() {
    this._fetchProject();
    this._fetchTasks();

    // WS: Join project room
    wsManager.joinProject(this.props.projectId);

    // WS: Subscribe to updates
    this._wsUnsubscribe = wsManager.subscribe((payload) => {
      if (payload.projectId === this.props.projectId) {
        this.applyWsUpdate(payload);
      }
    });
  }

  onUnmount() {
    // WS: Leave project room
    wsManager.leaveProject(this.props.projectId);

    // WS: Unsubscribe
    if (this._wsUnsubscribe) {
      this._wsUnsubscribe();
    }
  }

  async _fetchProject() {
    const token = authStore.token;
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE}/projects/${this.props.projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        this.setState({ project: data.project });
      }
    } catch {
      // Silent fail
    }
  }

  /**
   * Called by the subscription when a WebSocket message arrives.
   */
  applyWsUpdate({ type, data }) {
    // 1. Update state
    if (type === "task:created") {
      this.setState({ tasks: [...this.state.tasks, data] });
    } else if (type === "task:updated") {
      this.setState({
        tasks: this.state.tasks.map((t) =>
          t.id === data.id ? { ...t, ...data } : t,
        ),
      });
    } else if (type === "task:deleted") {
      this.setState({
        tasks: this.state.tasks.filter((t) => t.id !== data.id),
      });
    } else if (type === "task:reordered") {
      const orderMap = new Map(data.map((item) => [item.id, item.order]));
      const reordered = [...this.state.tasks].sort(
        (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
      );
      this.setState({ tasks: reordered });
    }

    // 2. Trigger visual highlight for creation or update
    if (["task:created", "task:updated"].includes(type)) {
      this.setState({ highlightedId: data.id });
      setTimeout(() => {
        if (this.state.highlightedId === data.id) {
          this.setState({ highlightedId: null });
        }
      }, 1500);
    }
  }

  render() {
    const actions = document.createElement("div");
    actions.className = "section-header__actions";
    const toggles = document.createElement("div");
    toggles.className = "view-toggles";

    ["list", "kanban"].forEach((viewType) => {
      const btn = document.createElement("button");
      btn.className = `view-toggle ${this.state.view === viewType ? "view-toggle--active" : ""}`;
      btn.textContent = viewType.charAt(0).toUpperCase() + viewType.slice(1);
      btn.addEventListener("click", () => {
        localStorage.setItem("taskView", viewType);
        this.setState({ view: viewType });
      });
      toggles.appendChild(btn);
    });
    actions.appendChild(toggles);

    if (this.canEdit) {
      const addBtn = createButton({
        id: "add-task-btn",
        label: "+ Add Task",
        variant: "primary",
      });
      addBtn.addEventListener("click", () => {
        if (this.props.router) {
          this.props.router.navigate(
            `/projects/${this.props.projectId}/tasks/new`,
          );
        }
        this.emit("task:create");
      });
      actions.appendChild(addBtn);
    }

    const { wrapper, container } = createPageLayout({
      title: "Tasks",
      actions,
      showBack: true,
      onBack: () => this.props.router?.navigate("/"),
      router: this.props.router,
      pageClass: `task-list-page task-list-page--${this.state.view}`,
    });

    if (this.state.loading) {
      container.appendChild(createSpinner({ label: "Loading tasks" }));
      wrapper.appendChild(container);
      return wrapper;
    }

    if (this.state.error) {
      const errorEl = document.createElement("p");
      errorEl.className = "task-list__error";
      errorEl.setAttribute("role", "alert");
      errorEl.textContent = this.state.error;

      const retryBtn = createButton({
        id: "retry-tasks-btn",
        label: "Retry",
        variant: "secondary",
      });
      retryBtn.addEventListener("click", () => this._fetchTasks());

      container.appendChild(errorEl);
      container.appendChild(retryBtn);
      wrapper.appendChild(container);
      return wrapper;
    }

    if (this.state.tasks.length === 0) {
      const empty = document.createElement("p");
      empty.className = "task-list__empty";
      empty.textContent = "No tasks yet. Add one to get started!";
      container.appendChild(empty);
      wrapper.appendChild(container);
      return wrapper;
    }

    const content =
      this.state.view === "kanban"
        ? this._renderKanbanView()
        : this._renderListView();

    container.appendChild(content);
    wrapper.appendChild(container);
    return wrapper;
  }

  _renderListView() {
    const list = document.createElement("div");
    list.className = "task-list__items";
    list.setAttribute("role", "list");

    this.state.tasks.forEach((task) => {
      const item = this._renderTaskItem(task);
      list.appendChild(item);
    });

    return list;
  }

  _renderKanbanView() {
    const board = document.createElement("div");
    board.className = "kanban-board";

    STATUS_COLUMNS.forEach((col) => {
      const column = document.createElement("div");
      column.className = "kanban-column";
      column.dataset.status = col.id;

      // Drop on column to change status
      column.addEventListener("dragover", (e) => {
        e.preventDefault();
        column.classList.add("kanban-column--drag-over");
      });

      column.addEventListener("dragleave", () => {
        column.classList.remove("kanban-column--drag-over");
      });

      column.addEventListener("drop", (e) => {
        e.preventDefault();
        column.classList.remove("kanban-column--drag-over");
        const taskId = e.dataTransfer.getData("text/plain");
        const task = this.state.tasks.find((t) => t.id === taskId);
        if (task && task.status !== col.id) {
          this._handleStatusChange(taskId, col.id);
        }
      });

      const colHeader = document.createElement("div");
      colHeader.className = "kanban-column__header";

      const colTitle = document.createElement("h3");
      colTitle.className = "kanban-column__title";
      colTitle.textContent = col.label;
      colHeader.appendChild(colTitle);

      const colTasks = this.state.tasks.filter((t) => t.status === col.id);
      const colCount = document.createElement("span");
      colCount.className = "kanban-column__count";
      colCount.textContent = colTasks.length;
      colHeader.appendChild(colCount);

      column.appendChild(colHeader);

      if (colTasks.length === 0) {
        const emptyCol = document.createElement("div");
        emptyCol.className = "kanban-column__empty";
        emptyCol.textContent = "No tasks";
        column.appendChild(emptyCol);
      } else {
        colTasks.forEach((task) => {
          column.appendChild(this._renderTaskItem(task));
        });
      }

      board.appendChild(column);
    });

    return board;
  }

  async _handleStatusChange(taskId, newStatus) {
    // Optimistic update
    const updatedTasks = this.state.tasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus } : t,
    );
    this.setState({ tasks: updatedTasks });

    const token = authStore.token;
    if (!token) return;

    try {
      await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Revert on fail
      this._fetchTasks();
    }
  }

  _renderTaskItem(task) {
    const isHighlighted = this.state.highlightedId === task.id;
    const item = document.createElement("div");
    item.className = `task-card ${isHighlighted ? "task-card--highlight" : ""}`;
    item.dataset.taskId = task.id;
    item.draggable = true;

    // Drag events
    item.addEventListener("dragstart", (e) => {
      this.setState({ draggingId: task.id });
      item.classList.add("task-card--dragging");
      e.dataTransfer.setData("text/plain", task.id);
    });

    item.addEventListener("dragend", () => {
      item.classList.remove("task-card--dragging");
      this.setState({ draggingId: null });
    });

    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      item.classList.add("task-card--drag-over");
    });

    item.addEventListener("dragleave", () => {
      item.classList.remove("task-card--drag-over");
    });

    item.addEventListener("drop", (e) => {
      e.preventDefault();
      item.classList.remove("task-card--drag-over");
      const fromId = this.state.draggingId;
      const toId = task.id;
      if (fromId && fromId !== toId) {
        this._handleReorder(fromId, toId);
      }
      this.setState({ draggingId: null });
    });

    // 1. Drag Handle (Only if owner)
    if (this.canEdit) {
      const dragHandle = document.createElement("div");
      dragHandle.className = "task-card__drag-handle";
      dragHandle.innerHTML = "⠿";
      item.appendChild(dragHandle);
    } else {
      item.draggable = false;
      item.style.cursor = "default";
    }

    // 2. Main Content
    const main = document.createElement("div");
    main.className = "task-card__main";

    const header = document.createElement("div");
    header.className = "task-card__header";

    const statusBadge = document.createElement("span");
    statusBadge.className = `badge badge--${task.status.toLowerCase()}`;
    statusBadge.textContent = task.status.replace("_", " ");
    header.appendChild(statusBadge);

    const titleEl = document.createElement("h3");
    titleEl.className = "task-card__title";
    titleEl.textContent = task.title;
    header.appendChild(titleEl);

    main.appendChild(header);

    if (task.description) {
      const descEl = document.createElement("p");
      descEl.className = "task-card__description";
      descEl.textContent = task.description;
      main.appendChild(descEl);
    }

    item.appendChild(main);

    // 3. Actions (Only if owner)
    if (this.canEdit) {
      const actions = document.createElement("div");
      actions.className = "task-card__actions";

      const editBtn = createButton({
        id: `edit-task-${task.id}`,
        label: "Edit",
        variant: "ghost",
        size: "sm",
      });
      editBtn.addEventListener("click", () => {
        if (this.props.router) {
          this.props.router.navigate(
            `/projects/${this.props.projectId}/tasks/${task.id}/edit`,
          );
        }
        this.emit("task:edit", { taskId: task.id });
      });

      const deleteBtn = createButton({
        id: `delete-task-${task.id}`,
        label: "Delete",
        variant: "danger",
        size: "sm",
      });
      deleteBtn.addEventListener("click", () => this._handleDelete(task.id));

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
      item.appendChild(actions);
    }

    return item;
  }

  async _handleDelete(taskId) {
    const token = authStore.token;
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId: this.props.projectId }),
      });

      if (!response.ok) return;

      this.setState({
        tasks: this.state.tasks.filter((task) => task.id !== taskId),
      });
      this.emit("task:deleted", { taskId });
    } catch {
      // Silent fail — the task stays in the list
    }
  }

  async _handleReorder(fromId, toId) {
    const tasks = [...this.state.tasks];
    const fromIndex = tasks.findIndex((task) => task.id === fromId);
    const toIndex = tasks.findIndex((task) => task.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;

    // Swap in local state immediately (optimistic update)
    const reordered = [...tasks];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    this.setState({ tasks: reordered });

    const token = authStore.token;
    if (!token) return;

    const reorderPayload = reordered.map((task, index) => ({
      id: task.id,
      order: index,
    }));

    try {
      await fetch(
        `${API_BASE}/projects/${this.props.projectId}/tasks/reorder`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ tasks: reorderPayload }),
        },
      );
    } catch {
      // On network failure, revert to original order
      this.setState({ tasks });
    }
  }

  async _fetchTasks() {
    const token = authStore.token;
    if (!token) {
      this.setState({ error: "Not authenticated", loading: false });
      return;
    }

    this.setState({ loading: true, error: null });

    try {
      const response = await fetch(
        `${API_BASE}/projects/${this.props.projectId}/tasks`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        this.setState({
          loading: false,
          error: data.error || "Failed to load tasks",
        });
        return;
      }

      const data = await response.json();
      this.setState({ loading: false, tasks: data.tasks });
    } catch {
      this.setState({
        loading: false,
        error: "Network error. Please try again.",
      });
    }
  }
}
