import { describe, it, expect } from 'vitest';
import { SYSTEM_INFO, getSystemStatus } from '../src/index.js';

describe('Foundation Sanity Check', () => {
  it('exposes system metadata', () => {
    expect(SYSTEM_INFO.name).toBe('personal-ai-orchestrator');
    expect(SYSTEM_INFO.version).toBe('0.1.0');
  });

  it('reports initial system status', () => {
    const status = getSystemStatus();
    expect(status.status).toBe('initializing');
    expect(status.name).toBe('personal-ai-orchestrator');
  });
});
