import { describe, expect, it } from 'vitest';
import { sessionIdFrom } from './entitlement';

describe('sessionIdFrom', () => {
  it('extracts the session ID from a restore link or a bare ID', () => {
    expect(sessionIdFrom('https://calorieguesser.com/restore?session_id=cs_live_a1B2c3')).toBe('cs_live_a1B2c3');
    expect(sessionIdFrom('  cs_test_XyZ987  ')).toBe('cs_test_XyZ987');
    expect(sessionIdFrom('https://calorieguesser.com/unlock?session_id=cs_test_abc&x=1')).toBe('cs_test_abc');
  });
  it('returns null when there is no session ID', () => {
    expect(sessionIdFrom('https://calorieguesser.com/')).toBeNull();
    expect(sessionIdFrom('')).toBeNull();
  });
});
