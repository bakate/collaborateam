import '@workspace/ui/styles/tokens.css';
import '@workspace/ui/styles/base.css';
import '@workspace/ui/styles/components.css';
import './styles/app.css';

import { wsManager } from './core/WebSocketManager.js';
import { Router } from './core/Router.js';
import { authStore } from './core/AuthStore.js';
import { projectStore } from './core/ProjectStore.js';

const appContainer = document.getElementById('app');

/**
 * Lazy-loaded routes definition.
 * Each component is only downloaded when the user navigates to the route.
 */
const routes = [
  { path: '/login', component: () => import('./components/LoginComponent.js'), layout: 'auth-layout' },
  { path: '/register', component: () => import('./components/RegisterComponent.js'), layout: 'auth-layout' },
  { path: '/', component: () => import('./components/ProjectListComponent.js'), protected: true },
  { path: '/projects/new', component: () => import('./components/ProjectFormComponent.js'), protected: true },
  { path: '/projects/:projectId', component: () => import('./components/TaskListComponent.js'), protected: true },
  { path: '/projects/:projectId/edit', component: () => import('./components/ProjectFormComponent.js'), protected: true },
  { path: '/projects/:projectId/tasks/new', component: () => import('./components/TaskFormComponent.js'), protected: true },
  { path: '/projects/:projectId/tasks/:taskId/edit', component: () => import('./components/TaskFormComponent.js'), protected: true },
];

let isInitialized = false;

const init = async () => {
  if (isInitialized) return;
  isInitialized = true;

  // Clear loading state
  appContainer.innerHTML = '';
  
  // Initialize Auth
  const wakeUpTimeout = setTimeout(() => {
    appContainer.innerHTML = `
      <div class="auth-layout">
        <div class="auth-card" style="text-align: center;">
          <div class="spinner" style="margin-bottom: var(--space-md);"></div>
          <p style="color: var(--text-main); font-weight: 600;">Waking up the server...</p>
          <p style="color: var(--text-muted); font-size: 0.875rem;">Render free tier is starting up (may take up to 60s)</p>
        </div>
      </div>
    `;
  }, 1500); // Show only if it takes > 1.5s

  await authStore.init();
  clearTimeout(wakeUpTimeout);

  // Prefetch projects if logged in
  if (authStore.isAuthenticated) {
    projectStore.prefetch();
  }

  // Clear loading state if not already cleared by timeout
  appContainer.innerHTML = '';

  // Listen for auth changes to connect/disconnect WebSockets
  authStore.subscribe(({ isAuthenticated }) => {
    if (isAuthenticated) {
      wsManager.connect();
    } else {
      wsManager.disconnect();
      projectStore.clear();
    }
  });

  // Initial connect if already authenticated
  if (authStore.isAuthenticated) {
    wsManager.connect();
  }

  const router = new Router(routes, appContainer);
  router.init();
};

// Start the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
