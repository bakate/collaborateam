import { Component } from '../core/Component.js';
import { authStore } from '../core/AuthStore.js';
import { createButton, createSpinner } from '@workspace/ui/components/Button';

const API_BASE = '/api';

const STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
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
export class TaskListComponent extends Component {
  defaultState() {
    return {
      tasks: [],
      loading: false,
      error: null,
      draggingId: null,
    };
  }

  onMount() {
    this._fetchTasks();
  }

  /**
   * Called by the parent when a WebSocket message arrives for this project.
   */
  applyWsUpdate({ event, data }) {
    if (event === 'task:created') {
      this.setState({ tasks: [...this.state.tasks, data] });
    } else if (event === 'task:updated') {
      this.setState({
        tasks: this.state.tasks.map(task => task.id === data.id ? data : task),
      });
    } else if (event === 'task:deleted') {
      this.setState({
        tasks: this.state.tasks.filter(task => task.id !== data.id),
      });
    } else if (event === 'task:reordered') {
      // data is an array of { id, order } — re-sort current tasks
      const orderMap = new Map(data.map(({ id, order }) => [id, order]));
      const reordered = [...this.state.tasks].sort(
        (taskA, taskB) => (orderMap.get(taskA.id) ?? 0) - (orderMap.get(taskB.id) ?? 0)
      );
      this.setState({ tasks: reordered });
    }
  }

  render() {
    const wrapper = document.createElement('section');
    wrapper.className = 'task-list';
    wrapper.id = 'task-list-section';
    wrapper.setAttribute('aria-label', 'Task list');

    // Header
    const header = document.createElement('div');
    header.className = 'task-list__header';

    const title = document.createElement('h2');
    title.className = 'task-list__title';
    title.textContent = 'Tasks';
    header.appendChild(title);

    const addBtn = createButton({
      id: 'add-task-btn',
      label: '+ Add Task',
      variant: 'primary',
    });
    addBtn.addEventListener('click', () => {
      if (this.props.router) {
        this.props.router.navigate(`/projects/${this.props.projectId}/tasks/new`);
      }
      this.emit('task:create');
    });
    header.appendChild(addBtn);

    wrapper.appendChild(header);

    if (this.state.loading) {
      wrapper.appendChild(createSpinner({ label: 'Loading tasks' }));
      return wrapper;
    }

    if (this.state.error) {
      const errorEl = document.createElement('p');
      errorEl.className = 'task-list__error';
      errorEl.setAttribute('role', 'alert');
      errorEl.textContent = this.state.error;

      const retryBtn = createButton({ id: 'retry-tasks-btn', label: 'Retry', variant: 'secondary' });
      retryBtn.addEventListener('click', () => this._fetchTasks());

      wrapper.appendChild(errorEl);
      wrapper.appendChild(retryBtn);
      return wrapper;
    }

    if (this.state.tasks.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'task-list__empty';
      empty.textContent = 'No tasks yet. Add one to get started!';
      wrapper.appendChild(empty);
      return wrapper;
    }

    const list = document.createElement('ul');
    list.className = 'task-list__items';
    list.setAttribute('role', 'list');

    for (const task of this.state.tasks) {
      list.appendChild(this._renderTaskItem(task));
    }

    wrapper.appendChild(list);
    return wrapper;
  }

  _renderTaskItem(task) {
    const item = document.createElement('li');
    item.className = 'task-item';
    item.dataset.taskId = task.id;
    item.draggable = true;

    // Drag events (HTML5 native)
    item.addEventListener('dragstart', () => {
      this.setState({ draggingId: task.id });
      item.classList.add('task-item--dragging');
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('task-item--dragging');
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      item.classList.add('task-item--drag-over');
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('task-item--drag-over');
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('task-item--drag-over');
      const fromId = this.state.draggingId;
      const toId = task.id;
      if (fromId && fromId !== toId) {
        this._handleReorder(fromId, toId);
      }
      this.setState({ draggingId: null });
    });

    // Task content
    const statusBadge = document.createElement('span');
    statusBadge.className = `task-item__status task-item__status--${task.status}`;
    statusBadge.textContent = STATUS_LABELS[task.status] || task.status;

    const titleEl = document.createElement('span');
    titleEl.className = 'task-item__title';
    titleEl.textContent = task.title;

    const desc = document.createElement('p');
    desc.className = 'task-item__description';
    desc.textContent = task.description || '';

    const actions = document.createElement('div');
    actions.className = 'task-item__actions';

    const editBtn = createButton({
      id: `edit-task-${task.id}`,
      label: 'Edit',
      variant: 'ghost',
    });
    editBtn.addEventListener('click', () => {
      if (this.props.router) {
        this.props.router.navigate(`/projects/${this.props.projectId}/tasks/${task.id}/edit`);
      }
      this.emit('task:edit', { taskId: task.id });
    });

    const deleteBtn = createButton({
      id: `delete-task-${task.id}`,
      label: 'Delete',
      variant: 'danger',
    });
    deleteBtn.addEventListener('click', () => this._handleDelete(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(statusBadge);
    item.appendChild(titleEl);
    item.appendChild(desc);
    item.appendChild(actions);

    return item;
  }

  async _handleDelete(taskId) {
    const token = authStore.token;
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId: this.props.projectId }),
      });

      if (!response.ok) return;

      this.setState({
        tasks: this.state.tasks.filter(task => task.id !== taskId),
      });
      this.emit('task:deleted', { taskId });
    } catch {
      // Silent fail — the task stays in the list
    }
  }

  async _handleReorder(fromId, toId) {
    const tasks = [...this.state.tasks];
    const fromIndex = tasks.findIndex(task => task.id === fromId);
    const toIndex = tasks.findIndex(task => task.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;

    // Swap in local state immediately (optimistic update)
    const reordered = [...tasks];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    this.setState({ tasks: reordered });

    const token = authStore.token;
    if (!token) return;

    const reorderPayload = reordered.map((task, index) => ({ id: task.id, order: index }));

    try {
      await fetch(`${API_BASE}/projects/${this.props.projectId}/tasks/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tasks: reorderPayload }),
      });
    } catch {
      // On network failure, revert to original order
      this.setState({ tasks });
    }
  }

  async _fetchTasks() {
    const token = authStore.token;
    if (!token) {
      this.setState({ error: 'Not authenticated', loading: false });
      return;
    }

    this.setState({ loading: true, error: null });

    try {
      const response = await fetch(`${API_BASE}/projects/${this.props.projectId}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        this.setState({ loading: false, error: data.error || 'Failed to load tasks' });
        return;
      }

      const data = await response.json();
      this.setState({ loading: false, tasks: data.tasks });
    } catch {
      this.setState({ loading: false, error: 'Network error. Please try again.' });
    }
  }
}
