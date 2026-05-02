import { describe, it, expect, beforeEach } from 'vitest';
import { sql, withTransaction } from './db.js';

describe('Database Transaction Helper (Integration)', () => {
  // We'll use the 'projects' table for testing as it exists
  
  beforeEach(async () => {
    // Clean up test data if any (though we'll use rollbacks mostly)
    await sql`DELETE FROM projects WHERE name = 'TX_TEST_PROJECT'`;
  });

  it('should rollback changes if an error occurs inside withTransaction', async () => {
    try {
      await withTransaction(async (tx) => {
        // Insert a project
        await tx`INSERT INTO projects (name, owner_id) VALUES ('TX_TEST_PROJECT', 'user-123')`;
        
        // Throw an error to trigger rollback
        throw new Error('Forced Error');
      });
    } catch (err) {
      expect(err.message).toBe('Forced Error');
    }

    // Verify the project was NOT created
    const rows = await sql`SELECT * FROM projects WHERE name = 'TX_TEST_PROJECT'`;
    expect(rows.length).toBe(0);
  });

  it('should commit changes if no error occurs', async () => {
    await withTransaction(async (tx) => {
      await tx`INSERT INTO projects (name, owner_id) VALUES ('TX_TEST_PROJECT', 'user-123')`;
    });

    // Verify the project WAS created
    const rows = await sql`SELECT * FROM projects WHERE name = 'TX_TEST_PROJECT'`;
    expect(rows.length).toBe(1);
    expect(rows[0].name).toBe('TX_TEST_PROJECT');

    // Cleanup
    await sql`DELETE FROM projects WHERE id = ${rows[0].id}`;
  });
});
