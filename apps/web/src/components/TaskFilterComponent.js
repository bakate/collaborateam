import { Component } from '../core/Component.js';
import { createInput } from '@workspace/ui/components/Input';

/**
 * TaskFilterComponent — "Smart" component for filtering tasks.
 * Supports text search with debouncing and status filtering.
 *
 * Emits:
 *   - 'filter:change' { search, status }
 */
export class TaskFilterComponent extends Component {
  constructor(props = {}) {
    super(props);
    this._debounceTimer = null;
  }

  defaultState() {
    return {
      search: this.props.search || '',
      status: this.props.status || 'all', // 'all', 'todo', 'in_progress', 'done'
    };
  }

  onUnmount() {
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
  }

  events() {
    return {
      'click [data-status-id]': '_onStatusClick',
      'input #task-search': '_onSearchInput',
    };
  }

  _onStatusClick(e, target) {
    e.preventDefault();
    this._handleStatusChange(target.dataset.statusId);
  }

  _onSearchInput(e, target) {
    this._handleSearchInput(target.value);
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.className = 'task-filter';
    wrapper.id = 'task-filter-container';

    // Search input
    const searchField = createInput({
      id: 'task-search',
      name: 'search',
      type: 'search',
      label: 'Search Tasks',
      placeholder: 'Type to filter...',
      value: this.state.search,
    });

    wrapper.appendChild(searchField);

    // Status filter
    const statusWrapper = document.createElement('div');
    statusWrapper.className = 'status-filter';

    const statusLabel = document.createElement('span');
    statusLabel.className = 'status-filter__label';
    statusLabel.textContent = 'Filter by Status';
    statusWrapper.appendChild(statusLabel);

    const statuses = [
      { id: 'all', label: 'All' },
      { id: 'todo', label: 'To Do' },
      { id: 'in_progress', label: 'In Progress' },
      { id: 'done', label: 'Done' },
    ];

    const group = document.createElement('div');
    group.className = 'btn-group';

    for (const status of statuses) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn btn--small ${this.state.status === status.id ? 'btn--primary' : 'btn--ghost'}`;
      btn.textContent = status.label;
      btn.dataset.statusId = status.id;
      group.appendChild(btn);
    }

    statusWrapper.appendChild(group);
    wrapper.appendChild(statusWrapper);

    return wrapper;
  }

  _handleSearchInput(value) {
    this.setState({ search: value });

    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      this.emit('filter:change', { search: this.state.search, status: this.state.status });
    }, 300);
  }

  _handleStatusChange(statusId) {
    if (this.state.status === statusId) return;
    this.setState({ status: statusId });
    this.emit('filter:change', { search: this.state.search, status: statusId });
  }
}
