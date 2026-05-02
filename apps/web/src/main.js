import '@workspace/ui/styles/tokens.css';
import '@workspace/ui/styles/base.css';
import '@workspace/ui/styles/components.css';
import './styles/app.css';

import { wsManager } from './core/WebSocketManager.js';
import { Router } from './core/Router.js';
import { authStore } from './core/AuthStore.js';

// Initialize WebSockets moved inside init()

import { LoginComponent } from './components/LoginComponent.js';
import { RegisterComponent } from './components/RegisterComponent.js';
import { ProjectListComponent } from './components/ProjectListComponent.js';
import { ProjectFormComponent } from './components/ProjectFormComponent.js';
import { TaskListComponent } from './components/TaskListComponent.js';
import { TaskFormComponent } from './components/TaskFormComponent.js';

const appContainer = document.getElementById('app');

const routes = [
  { path: '/login', component: LoginComponent, layout: 'auth-layout' },
  { path: '/register', component: RegisterComponent, layout: 'auth-layout' },
  { path: '/', component: ProjectListComponent, protected: true },
  { path: '/projects/new', component: ProjectFormComponent, protected: true },
  { path: '/projects/:projectId', component: TaskListComponent, protected: true },
  { path: '/projects/:projectId/edit', component: ProjectFormComponent, protected: true },
  { path: '/projects/:projectId/tasks/new', component: TaskFormComponent, protected: true },
  { path: '/projects/:projectId/tasks/:taskId/edit', component: TaskFormComponent, protected: true },
];

const init = async () => {
  // Clear loading state
  appContainer.innerHTML = '';
  
  // Initialize Auth
  await authStore.init();

  // Connect WebSockets ONLY after Auth is ready
  wsManager.connect();

  const router = new Router(routes, appContainer);
  router.init();
};

// Start the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
