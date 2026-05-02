import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TaskParser } from './TaskParser.js';
import { TaskStatus } from '../entities/Task.js';

describe('TaskParser Properties', () => {
  it('Property 22: Task Serialization Round-Trip', () => {
    // Generate valid task data
    const taskArbitrary = fc.record({
      id: fc.uuid(),
      title: fc.string({ minLength: 1 }),
      description: fc.string(),
      status: fc.constantFrom(...Object.values(TaskStatus)),
      projectId: fc.uuid(),
      createdAt: fc.date({ min: new Date('2000-01-01'), max: new Date('2050-01-01') }).map(d => d.toISOString()),
      updatedAt: fc.date({ min: new Date('2000-01-01'), max: new Date('2050-01-01') }).map(d => d.toISOString()),
    });

    fc.assert(
      fc.property(taskArbitrary, (taskData) => {
        // Parse raw data into entity
        const parsedResult = TaskParser.parse({ json: taskData });
        expect(parsedResult.ok).toBe(true);
        
        const entity = parsedResult.value;
        
        // Serialize to JSON string
        const serializedResult = TaskParser.serialize({ task: entity });
        expect(serializedResult.ok).toBe(true);
        
        // Parse back from JSON string
        const roundTripResult = TaskParser.parse({ json: serializedResult.value });
        expect(roundTripResult.ok).toBe(true);
        
        // The round-tripped entity should deeply equal the original entity
        expect(roundTripResult.value).toEqual(entity);
      })
    );
  });
});
