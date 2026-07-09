// =============================================================================
// BMS API Integration Tests
// Tests real SQL queries against BMS Session API using BMS_SESSION_ID env var
// =============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  retrieveBmsSession,
  extractConnectionConfig,
  executeSqlViaApiQueued,
  clearApiQueue,
  getApiQueueStats,
} from '@/services/bmsSession';
import type { ConnectionConfig } from '@/types';

// Skip all tests if BMS_SESSION_ID is not set
const BMS_SESSION_ID = process.env.BMS_SESSION_ID || import.meta.env.BMS_SESSION_ID;
const describeIfSession = BMS_SESSION_ID ? describe : describe.skip;

describeIfSession('BMS API Integration Tests', () => {
  let connectionConfig: ConnectionConfig | null = null;
  let sessionError: Error | null = null;

  beforeAll(async () => {
    if (!BMS_SESSION_ID) {
      sessionError = new Error('BMS_SESSION_ID not set');
      return;
    }

    try {
      const response = await retrieveBmsSession(BMS_SESSION_ID);

      if (response.MessageCode !== 200) {
        throw new Error(`Session retrieval failed: ${response.Message}`);
      }

      connectionConfig = extractConnectionConfig(response);
      console.log(`[Integration Test] Connected to: ${connectionConfig.apiUrl}`);
    } catch (err) {
      sessionError = err instanceof Error ? err : new Error(String(err));
      console.error('[Integration Test] Failed to connect:', sessionError.message);
    }
  }, 30000);

  afterAll(() => {
    clearApiQueue();
  });

  describe('Session Connection', () => {
    it('MUST successfully retrieve session', () => {
      expect(sessionError).toBeNull();
      expect(connectionConfig).not.toBeNull();
    });

    it('MUST have valid API URL', () => {
      expect(connectionConfig?.apiUrl).toBeDefined();
      expect(connectionConfig?.apiUrl).toMatch(/^https?:\/\//);
    });

    it('MUST have valid bearer token', () => {
      expect(connectionConfig?.bearerToken).toBeDefined();
      expect(connectionConfig?.bearerToken.length).toBeGreaterThan(10);
    });
  });

  describe('SQL Query Execution', () => {
    it('MUST execute SELECT VERSION() query', async () => {
      if (!connectionConfig) {
        throw new Error('No connection config');
      }

      const result = await executeSqlViaApiQueued('SELECT VERSION() as version', connectionConfig);

      expect(result.MessageCode).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.data![0]).toHaveProperty('version');
      expect(typeof result.data![0].version).toBe('string');
      console.log(`[Integration Test] Database version: ${result.data![0].version}`);
    });

    it('MUST execute patient count query', async () => {
      if (!connectionConfig) {
        throw new Error('No connection config');
      }

      const result = await executeSqlViaApiQueued(
        'SELECT COUNT(*) as total FROM patient',
        connectionConfig
      );

      expect(result.MessageCode).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.data![0]).toHaveProperty('total');
      expect(typeof result.data![0].total).toBe('number');
      expect(result.data![0].total).toBeGreaterThanOrEqual(0);
      console.log(`[Integration Test] Patient count: ${result.data![0].total}`);
    });

    it('MUST execute doctor count query', async () => {
      if (!connectionConfig) {
        throw new Error('No connection config');
      }

      const result = await executeSqlViaApiQueued(
        'SELECT COUNT(*) as total FROM doctor',
        connectionConfig
      );

      expect(result.MessageCode).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data![0]).toHaveProperty('total');
      console.log(`[Integration Test] Doctor count: ${result.data![0].total}`);
    });
  });

  describe('Query Result Validation', () => {
    it('MUST return field names correctly', async () => {
      if (!connectionConfig) {
        throw new Error('No connection config');
      }

      const result = await executeSqlViaApiQueued(
        "SELECT 'test_value' as test_column, 123 as test_number",
        connectionConfig
      );

      expect(result.field_name).toBeDefined();
      expect(result.field_name).toContain('test_column');
      expect(result.field_name).toContain('test_number');
    });

    it('MUST return field types correctly', async () => {
      if (!connectionConfig) {
        throw new Error('No connection config');
      }

      const result = await executeSqlViaApiQueued(
        "SELECT 'string' as str_col, 123 as int_col, 1.5 as float_col",
        connectionConfig
      );

      expect(result.field).toBeDefined();
      expect(result.field!.length).toBeGreaterThanOrEqual(2);
    });

    it('MUST return record count', async () => {
      if (!connectionConfig) {
        throw new Error('No connection config');
      }

      const result = await executeSqlViaApiQueued(
        'SELECT * FROM patient LIMIT 5',
        connectionConfig
      );

      expect(result.record_count).toBeDefined();
      expect(result.record_count).toBeLessThanOrEqual(5);
    });
  });

  describe('API Queue Statistics', () => {
    it('MUST track completed requests', async () => {
      const stats = getApiQueueStats();

      expect(stats.completed).toBeGreaterThan(0);
      console.log(`[Integration Test] Queue stats:`, stats);
    });
  });

  describe('Error Handling', () => {
    it('MUST handle invalid SQL gracefully', async () => {
      if (!connectionConfig) {
        throw new Error('No connection config');
      }

      // BMS API returns MessageCode 409 for SQL errors, doesn't throw
      const result = await executeSqlViaApiQueued(
        'SELECT * FROM nonexistent_table_xyz',
        connectionConfig
      );

      expect(result.MessageCode).toBe(409);
      expect(result.Message).toContain('error');
    });
  });
});

// Describe block for when BMS_SESSION_ID is not set
if (!BMS_SESSION_ID) {
  describe('BMS API Integration Tests', () => {
    it.skip('Skipping all tests - BMS_SESSION_ID environment variable not set', () => {
      // This test is skipped when BMS_SESSION_ID is not available
    });
  });
}
