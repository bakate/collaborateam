import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskFilterComponent } from './TaskFilterComponent.js';

describe('TaskFilterComponent', () => {
  let container;
  let component;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    component = new TaskFilterComponent();
    component.mount(container);
    vi.useFakeTimers();
  });

  afterEach(() => {
    component.unmount();
    container.remove();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should render search input and status buttons', () => {
    expect(container.querySelector('#task-search')).toBeTruthy();
    expect(container.querySelectorAll('.btn-group button').length).toBe(4);
  });

  it('should debounce search input emissions', () => {
    const handler = vi.fn();
    component.on('filter:change', handler);

    const input = container.querySelector('#task-search');
    input.value = 'abc';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(handler).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(handler).not.toHaveBeenCalled();

    vi.advanceTimersByTime(150); // Total 350ms
    expect(handler).toHaveBeenCalledWith({ search: 'abc', status: 'all' });
  });

  it('should only emit the last value when typing rapidly', () => {
    const handler = vi.fn();
    component.on('filter:change', handler);

    const input = container.querySelector('#task-search');
    
    input.value = 'a';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(100);

    input.value = 'ab';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(100);

    input.value = 'abc';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    
    vi.advanceTimersByTime(350);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ search: 'abc', status: 'all' });
  });

  it('should emit filter:change immediately when status button is clicked', () => {
    const handler = vi.fn();
    component.on('filter:change', handler);

    const doneBtn = container.querySelector('button[data-status-id="done"]');
    doneBtn.click();

    expect(handler).toHaveBeenCalledWith({ search: '', status: 'done' });
  });

  it('should combine search and status filters correctly', () => {
    const handler = vi.fn();
    component.on('filter:change', handler);

    // 1. Set status
    container.querySelector('button[data-status-id="in_progress"]').click();
    expect(handler).toHaveBeenCalledWith({ search: '', status: 'in_progress' });

    // 2. Type search
    const input = container.querySelector('#task-search');
    input.value = 'fix';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    
    vi.advanceTimersByTime(350);
    expect(handler).toHaveBeenLastCalledWith({ search: 'fix', status: 'in_progress' });
  });
});
