import { describe, it, expect, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { sql, withTransaction } from './db.js';

describe('Database Transaction Helper (Integration)', () => {
  const TEST_USER_ID = faker.string.uuid();
  const TEST_PROJECT_NAME = `TX_TEST_${faker.commerce.productName().toUpperCase().replace(/ /g, '_')}`;
  
  beforeEach(async () => {
    // Clean up test data
    await sql`DELETE FROM projects WHERE name = ${TEST_PROJECT_NAME}`;
    await sql`DELETE FROM users WHERE id = ${TEST_USER_ID}`;
    
    // Create a test user to satisfy foreign key constraint
    await sql`INSERT INTO users (id, email, password_hash) VALUES (${TEST_USER_ID}, ${faker.internet.email()}, 'hash')`;
  });

  it('should rollback changes if an error occurs inside withTransaction', async () => {
    let errorCaught = false;
    try {
      await withTransaction(async (tx) => {
        // Insert a project
        await tx`INSERT INTO projects (name, owner_id) VALUES (${TEST_PROJECT_NAME}, ${TEST_USER_ID})`;
        
        // Throw an error to trigger rollback
        throw new Error('Forced Error');
      });
    } catch (err) {
      expect(err.message).toBe('Forced Error');
      errorCaught = true;
    }

    expect(errorCaught).toBe(true);

    // Verify the project was NOT created
    const rows = await sql`SELECT * FROM projects WHERE name = ${TEST_PROJECT_NAME}`;
    expect(rows.length).toBe(0);
  });

  it('should commit changes if no error occurs', async () => {
    await withTransaction(async (tx) => {
      await tx`INSERT INTO projects (name, owner_id) VALUES (${TEST_PROJECT_NAME}, ${TEST_USER_ID})`;
    });

    // Verify the project WAS created
    const rows = await sql`SELECT * FROM projects WHERE name = ${TEST_PROJECT_NAME}`;
    expect(rows.length).toBe(1);
    expect(rows[0].name).toBe(TEST_PROJECT_NAME);
  });
});
