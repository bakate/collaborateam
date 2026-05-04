import '@workspace/ui/styles/tokens.css';
import '@workspace/ui/styles/base.css';
import '@workspace/ui/styles/components.css';
import './styles/app.css';

import { wsManager } from './core/WebSocketManager.js';
import { Router } from './core/Router.js';
import { authStore } from './core/AuthStore.js';

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
  await authStore.init();

  // Listen for auth changes to connect/disconnect WebSockets
  authStore.subscribe(({ isAuthenticated }) => {
    if (isAuthenticated) {
      wsManager.connect();
    } else {
      wsManager.disconnect();
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
