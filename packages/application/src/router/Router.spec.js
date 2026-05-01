import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Router } from './Router.js';
import { RouteRegistry } from './RouteRegistry.js';

describe('Router Unit Tests', () => {
  let router;
  let historyAdapter;
  let linkInterceptor;
  let renderer;
  let registry;

  beforeEach(() => {
    let currentUrl = '/';
    historyAdapter = {
      pushState: vi.fn((state, title, url) => { currentUrl = url; }),
      back: vi.fn(),
      forward: vi.fn(),
      getPathname: vi.fn(() => currentUrl),
      getSearch: vi.fn().mockReturnValue(''),
      onPopState: vi.fn()
    };
    linkInterceptor = { intercept: vi.fn(), destroy: vi.fn() };
    renderer = { render: vi.fn(), renderNotFound: vi.fn() };
    registry = new RouteRegistry();

    router = new Router({ historyAdapter, linkInterceptor, renderer, registry });
  });

  it('should navigate to a route and render the component', async () => {
    registry.add({ path: '/about', component: 'AboutComponent' });
    
    await router.navigate('/about');

    expect(historyAdapter.pushState).toHaveBeenCalledWith({}, '', '/about');
    expect(renderer.render).toHaveBeenCalledWith(
      expect.objectContaining({ component: 'AboutComponent' }),
      expect.any(Object)
    );
  });

  it('should render 404 for unknown route', async () => {
    await router.navigate('/unknown');

    expect(renderer.renderNotFound).toHaveBeenCalledWith('/unknown');
  });

  it('should not push state if already on the same path', async () => {
    historyAdapter.pushState({}, '', '/about');
    historyAdapter.pushState.mockClear();
    
    await router.navigate('/about');

    expect(historyAdapter.pushState).not.toHaveBeenCalled();
  });
});
