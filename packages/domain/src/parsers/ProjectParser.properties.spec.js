import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ProjectParser } from './ProjectParser.js';

describe('ProjectParser Properties', () => {
  it('Property 16: Project Serialization Round-Trip', () => {
    // Generate valid project data
    const projectArbitrary = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1 }),
      description: fc.string(),
      ownerId: fc.uuid(),
      createdAt: fc.integer({ min: Date.UTC(2000, 0, 1), max: Date.UTC(2050, 0, 1) }).map(t => new Date(t).toISOString()),
      updatedAt: fc.integer({ min: Date.UTC(2000, 0, 1), max: Date.UTC(2050, 0, 1) }).map(t => new Date(t).toISOString()),
    });

    fc.assert(
      fc.property(projectArbitrary, (projectData) => {
        // Parse raw data into entity
        const parsedResult = ProjectParser.parse({ json: projectData });
        expect(parsedResult.ok).toBe(true);
        
        const entity = parsedResult.value;
        
        // Serialize to JSON string
        const serializedResult = ProjectParser.serialize({ project: entity });
        expect(serializedResult.ok).toBe(true);
        
        // Parse back from JSON string
        const roundTripResult = ProjectParser.parse({ json: serializedResult.value });
        expect(roundTripResult.ok).toBe(true);
        
        // The round-tripped entity should deeply equal the original entity
        expect(roundTripResult.value).toEqual(entity);
      })
    );
  });
});
