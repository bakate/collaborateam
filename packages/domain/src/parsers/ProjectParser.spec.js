import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import { ProjectParser } from './ProjectParser.js';

describe('ProjectParser Unit Tests', () => {
  it('should parse valid JSON into a frozen Project entity', () => {
    const json = JSON.stringify({
      id: faker.string.uuid(),
      name: faker.company.name(),
      description: faker.company.catchPhrase(),
      ownerId: faker.string.uuid(),
    });

    const result = ProjectParser.parse({ json });
    
    expect(result.ok).toBe(true);
    expect(result.value.id).toBeTypeOf('string');
    expect(Object.isFrozen(result.value)).toBe(true);
  });

  it('should return error for invalid JSON string', () => {
    const result = ProjectParser.parse({ json: 'invalid-json' });
    
    expect(result.ok).toBe(false);
    expect(result.error.message).toContain('Failed to parse Project JSON');
  });

  it('should validate missing required fields', () => {
    const result = ProjectParser.parse({ json: { name: faker.company.name() } });
    
    expect(result.ok).toBe(false);
    expect(result.error.message).toContain('id is required');
  });

  it('should apply default values for optional fields', () => {
    const result = ProjectParser.parse({ json: { 
      id: faker.string.uuid(), 
      name: faker.company.name(), 
      ownerId: faker.string.uuid() 
    }});
    
    expect(result.ok).toBe(true);
    expect(result.value.description).toBe('');
    expect(result.value.createdAt).toBeDefined();
  });

  it('should serialize a Project entity into JSON string', () => {
    const name = faker.company.name();
    const parsed = ProjectParser.parse({ json: { id: faker.string.uuid(), name, ownerId: faker.string.uuid() }});
    const serialized = ProjectParser.serialize({ project: parsed.value });
    
    expect(serialized.ok).toBe(true);
    expect(typeof serialized.value).toBe('string');
    expect(serialized.value).toContain(`"name":"${name}"`);
  });
});
