import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import { TaskParser } from './TaskParser.js';
import { TaskStatus } from '../entities/Task.js';

describe('TaskParser Unit Tests', () => {
  it('should parse valid JSON into a frozen Task entity', () => {
    const json = JSON.stringify({
      id: faker.string.uuid(),
      title: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      status: TaskStatus.IN_PROGRESS,
      projectId: faker.string.uuid(),
    });

    const result = TaskParser.parse({ json });
    
    expect(result.ok).toBe(true);
    expect(result.value.id).toBeTypeOf('string');
    expect(result.value.status).toBe(TaskStatus.IN_PROGRESS);
    expect(Object.isFrozen(result.value)).toBe(true);
  });

  it('should return error for invalid JSON string', () => {
    const result = TaskParser.parse({ json: 'invalid-json' });
    
    expect(result.ok).toBe(false);
    expect(result.error.message).toContain('Failed to parse Task JSON');
  });

  it('should validate missing required fields', () => {
    const result = TaskParser.parse({ json: { title: faker.lorem.words(3) } });
    
    expect(result.ok).toBe(false);
    expect(result.error.message).toContain('id is required');
  });

  it('should validate invalid status', () => {
    const result = TaskParser.parse({ json: { 
      id: faker.string.uuid(), 
      title: faker.lorem.words(3), 
      projectId: faker.string.uuid(), 
      status: 'UNKNOWN_STATUS' 
    }});
    
    expect(result.ok).toBe(false);
    expect(result.error.message).toContain('Invalid status: UNKNOWN_STATUS');
  });

  it('should apply default values for optional fields', () => {
    const result = TaskParser.parse({ json: { 
      id: faker.string.uuid(), 
      title: faker.lorem.words(3), 
      projectId: faker.string.uuid() 
    }});
    
    expect(result.ok).toBe(true);
    expect(result.value.status).toBe(TaskStatus.TODO);
    expect(result.value.description).toBe('');
    expect(result.value.createdAt).toBeDefined();
  });

  it('should serialize a Task entity into JSON string', () => {
    const id = faker.string.uuid();
    const parsed = TaskParser.parse({ json: { id, title: faker.lorem.words(3), projectId: faker.string.uuid() }});
    const serialized = TaskParser.serialize({ task: parsed.value });
    
    expect(serialized.ok).toBe(true);
    expect(typeof serialized.value).toBe('string');
    expect(serialized.value).toContain(`"id":"${id}"`);
  });
});
