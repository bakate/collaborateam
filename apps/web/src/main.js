import '@workspace/ui/styles/tokens.css';
import '@workspace/ui/styles/base.css';
import '@workspace/ui/styles/components.css';
import './styles/app.css';

import { LoginComponent } from './components/LoginComponent.js';

const appContainer = document.getElementById('app');

const init = () => {
  // Clear loading state
  appContainer.innerHTML = '';
  appContainer.className = 'auth-layout';

  const login = new LoginComponent();
  
  login.on('login:success', ({ user, _accessToken }) => {
    // Navigate to project list
    alert(`Welcome back, ${user.name || user.email}!`);
  });

  login.mount(appContainer);
};

// Start the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
