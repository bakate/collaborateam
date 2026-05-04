import { authStore } from "./AuthStore.js";
import { WebSocketStatus } from "../components/WebSocketStatus.js";

/**
 * PageLayout — Utility to create a consistent page structure with Header and Container.
 */
export const createPageLayout = ({
  title,
  actions,
  showBack = false,
  onBack,
  router,
  pageClass = "",
}) => {
  const wrapper = document.createElement("div");
  wrapper.className = `main-layout ${pageClass}`;

  // 1. App Header
  const headerEl = document.createElement("header");
  headerEl.className = "app-header";

  const userName =
    authStore.user?.username.charAt(0).toUpperCase() +
      authStore.user?.username.slice(1) || "User";

  headerEl.innerHTML = `
      <div class="container">
        <a href="#/" class="app-header__logo">Collaborateam</a>
        <div class="app-header__user">
          <div id="ws-status-container"></div>
          <span class="user-name">${userName}</span>
          <button id="logout-btn" class="btn btn--ghost btn--sm">Logout</button>
        </div>
      </div>
    `;

  // Mount WebSocket Status Component
  const wsStatus = new WebSocketStatus();
  wsStatus.mount(headerEl.querySelector("#ws-status-container"));

  headerEl.querySelector("#logout-btn").addEventListener("click", () => {
    authStore.logout();
    if (router) router.navigate("/login");
  });

  wrapper.appendChild(headerEl);

  // 2. Main Content Container
  const container = document.createElement("main");
  container.className = "container";

  // 3. Section Header (Title + Back + Actions)
  const sectionHeader = document.createElement("div");
  sectionHeader.className = "section-header";

  if (showBack) {
    const backBtn = document.createElement("button");
    backBtn.className = "btn-back";
    backBtn.innerHTML = "←"; // Simple arrow for now
    backBtn.title = "Go back";
    backBtn.addEventListener("click", onBack);
    sectionHeader.appendChild(backBtn);
  }

  const titleEl = document.createElement("h1");
  titleEl.className = "page-title"; // CSS shared title style
  titleEl.textContent = title;
  sectionHeader.appendChild(titleEl);

  if (actions) {
    const actionsWrapper = document.createElement("div");
    actionsWrapper.className = "section-header__actions";
    actionsWrapper.appendChild(actions);
    sectionHeader.appendChild(actionsWrapper);
  }

  container.appendChild(sectionHeader);

  // We return both the wrapper and the container so components can append their content to the container
  return { wrapper, container };
};
