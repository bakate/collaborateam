import { Component } from "../core/Component.js";
import { authStore } from "../core/AuthStore.js";
import { createPageLayout } from "../core/PageLayout.js";
import { createButton, createSpinner } from "@workspace/ui/components/Button";
import { createConfirmModal } from "@workspace/ui/components/Modal";
import { Icons } from "@workspace/ui/components/Icons";
import { apiClient } from "../core/APIClient.js";
import { toast } from "../core/ToastManager.js";
import { projectStore } from "../core/ProjectStore.js";

/**
 * ProjectListComponent — "Smart" component.
 * Fetches and displays all projects. Supports optional "mine only" filter.
 * Emits:
 *   - 'project:select' with { projectId } when a project is clicked
 *   - 'project:create' when the create button is clicked
 */
export class ProjectListComponent extends Component {
  defaultState() {
    return {
      projects: projectStore.projects,
      loading: projectStore.loading,
      error: projectStore.error,
      mineOnly: false,
      confirmingDeleteId: null,
    };
  }

  onMount() {
    this._unsubscribe = projectStore.subscribe((state) => {
      this.setState({
        projects: state.projects,
        loading: state.loading,
        error: state.error,
      });
    });

    // If we don't have projects yet, fetch them (or use the one in progress)
    if (projectStore.projects.length === 0) {
      this._fetchProjects();
    }
    this._setupEventListeners();
  }

  events() {
    return {
      'click [data-action]': '_onActionClick',
      'click .project-card__menu-trigger': '_onMenuTrigger',
      'click .project-card': '_onCardClick',
    };
  }

  _onActionClick(e, target) {
    e.preventDefault();
    e.stopPropagation();
    this._handleAction(target.dataset);
  }

  _onMenuTrigger(e, target) {
    e.preventDefault();
    e.stopPropagation();
    this._toggleDropdown(target);
  }

  _onCardClick(e, target) {
    const { projectId } = target.dataset;
    if (this.props.router) {
      this.props.router.navigate(`/projects/${projectId}`);
    }
    this.emit("project:select", { projectId });
  }

  _setupEventListeners() {
    // Close dropdowns when clicking outside
    this._closeDropdownsHandler = () => {
      if (this.container) {
        this.container
          .querySelectorAll(".dropdown--open")
          .forEach((d) => d.classList.remove("dropdown--open"));
      }
    };
    document.addEventListener("click", this._closeDropdownsHandler);
  }

  onUnmount() {
    if (this._unsubscribe) {
      this._unsubscribe();
    }
    if (this._closeDropdownsHandler) {
      document.removeEventListener("click", this._closeDropdownsHandler);
    }
  }

  _toggleDropdown(trigger) {
    const dropdown = trigger.closest(".dropdown");
    const isOpen = dropdown.classList.contains("dropdown--open");

    // Close all other dropdowns
    this.container
      .querySelectorAll(".dropdown--open")
      .forEach((d) => d.classList.remove("dropdown--open"));

    if (!isOpen) {
      dropdown.classList.add("dropdown--open");
    }
  }

  _handleAction({ action, projectId }) {
    switch (action) {
      case "edit":
        if (this.props.router)
          this.props.router.navigate(`/projects/${projectId}/edit`);
        break;
      case "delete-init":
        this._showDeleteConfirmation(projectId);
        break;
    }
  }

  _showDeleteConfirmation(projectId) {
    const project = this.state.projects.find((p) => p.id === projectId);
    if (!project) return;

    const modal = createConfirmModal({
      id: "delete-project-modal",
      title: "Delete Project",
      message: `Are you sure you want to delete <strong>${project.name}</strong>?`,
      detail: "This action is permanent and will delete all associated tasks.",
      confirmLabel: "Delete Project",
      onConfirm: () => this._handleDelete(projectId),
    });

    document.body.appendChild(modal.element);
    modal.open();
  }

  render() {
    const actions = document.createElement("div");
    actions.className = "project-list__actions";

    // "Mine only" toggle
    const filterLabel = document.createElement("label");
    filterLabel.className = "toggle-label";
    filterLabel.htmlFor = "filter-mine";
    filterLabel.textContent = "My projects only";

    const filterCheckbox = document.createElement("input");
    filterCheckbox.type = "checkbox";
    filterCheckbox.id = "filter-mine";
    filterCheckbox.checked = this.state.mineOnly;
    filterCheckbox.addEventListener("change", (e) => {
      this.setState({ mineOnly: e.target.checked });
      this._fetchProjects();
    });

    filterLabel.prepend(filterCheckbox);
    actions.appendChild(filterLabel);

    const createBtn = createButton({
      id: "create-project-btn",
      label: "+ New Project",
      variant: "primary",
    });
    createBtn.addEventListener("click", () => {
      if (this.props.router) this.props.router.navigate("/projects/new");
      this.emit("project:create");
    });
    actions.appendChild(createBtn);

    const { wrapper, container } = createPageLayout({
      title: "Projects",
      actions,
      router: this.props.router,
      pageClass: "project-list-page",
    });

    // Loading
    if (this.state.loading) {
      const loader = document.createElement("div");
      loader.className = "loader-centered";
      loader.appendChild(createSpinner({ label: "Loading projects" }));
      container.appendChild(loader);
      wrapper.appendChild(container);
      return wrapper;
    }

    // Error
    if (this.state.error) {
      const errorEl = document.createElement("p");
      errorEl.className = "project-list__error";
      errorEl.setAttribute("role", "alert");
      errorEl.textContent = this.state.error;

      const retryBtn = createButton({
        id: "retry-btn",
        label: "Retry",
        variant: "secondary",
      });
      retryBtn.addEventListener("click", () => this._fetchProjects());

      container.appendChild(errorEl);
      container.appendChild(retryBtn);
      wrapper.appendChild(container);
      return wrapper;
    }

    // Empty state
    if (this.state.projects.length === 0) {
      const empty = document.createElement("p");
      empty.className = "project-list__empty";
      empty.textContent = this.state.mineOnly
        ? "You haven't created any projects yet."
        : "No projects found.";
      container.appendChild(empty);
      wrapper.appendChild(container);
      return wrapper;
    }

    // Project cards
    const list = document.createElement("ul");
    list.className = "project-list__items";
    list.setAttribute("role", "list");

    for (const project of this.state.projects) {
      const item = this._renderProjectCard(project);
      list.appendChild(item);
    }

    container.appendChild(list);
    wrapper.appendChild(container);
    return wrapper;
  }

  _renderProjectCard(project) {
    const item = document.createElement("li");
    item.className = "project-card";
    item.dataset.projectId = project.id;

    // Header: Title + Meatball Menu
    const header = document.createElement("div");
    header.className = "project-card__header";

    const nameEl = document.createElement("h2");
    nameEl.className = "project-card__name";
    nameEl.innerHTML = `${Icons.folder} <span>${project.name}</span>`;
    header.appendChild(nameEl);

    // Dropdown for owner actions
    const currentUserId = authStore.user?.id;
    if (project.ownerId === currentUserId) {
      const dropdown = document.createElement("div");
      dropdown.className = "dropdown";

      const trigger = document.createElement("button");
      trigger.className = "project-card__menu-trigger";
      trigger.innerHTML = Icons.moreVertical;
      trigger.setAttribute("aria-label", "Project actions");
      dropdown.appendChild(trigger);

      const menu = document.createElement("div");
      menu.className = "dropdown-menu";

      // Edit action
      const editItem = document.createElement("button");
      editItem.className = "dropdown-item";
      editItem.dataset.action = "edit";
      editItem.dataset.projectId = project.id;
      editItem.innerHTML = `${Icons.edit} Edit`;
      menu.appendChild(editItem);

      // Divider
      const divider = document.createElement("div");
      divider.className = "dropdown-divider";
      menu.appendChild(divider);

      // Delete action
      const deleteItem = document.createElement("button");
      deleteItem.className = "dropdown-item dropdown-item--danger";
      deleteItem.dataset.action = "delete-init";
      deleteItem.dataset.projectId = project.id;
      deleteItem.innerHTML = `${Icons.trash} Delete`;
      menu.appendChild(deleteItem);

      dropdown.appendChild(menu);
      header.appendChild(dropdown);
    }

    const descEl = document.createElement("p");
    descEl.className = "project-card__description";
    descEl.textContent = project.description || "No description provided.";

    // Meta section (Stats & Owner)
    const meta = document.createElement("div");
    meta.className = "project-card__meta";

    const tasksStat = document.createElement("div");
    tasksStat.className = "project-card__stat";
    tasksStat.innerHTML = `${Icons.tasks} <span>${project.taskCount ?? 0}</span>`;

    const isOwner = project.ownerId === currentUserId;
    const ownerInfo = document.createElement("div");
    ownerInfo.className = "project-card__owner";
    ownerInfo.innerHTML = isOwner
      ? `${Icons.user} <span class="badge badge--you">You</span>`
      : `${Icons.user} <span>${project.ownerName || "Unknown"}</span>`;

    meta.appendChild(tasksStat);
    meta.appendChild(ownerInfo);

    item.appendChild(header);
    item.appendChild(descEl);
    item.appendChild(meta);

    return item;
  }

  async _handleDelete(projectId) {
    try {
      const response = await apiClient.delete(`/projects/${projectId}`);
      if (response.ok) {
        toast.success("Project deleted");
        projectStore.removeProject(projectId);
        this.setState({ confirmingDeleteId: null });
      } else {
        throw new Error("Failed to delete project");
      }
    } catch (err) {
      toast.error(err.message);
      this.setState({ confirmingDeleteId: null });
    }
  }

  async _fetchProjects() {
    try {
      await projectStore.fetchProjects(this.state.mineOnly);
    } catch (err) {
      toast.error(err.message);
    }
  }
}
