import { describe, expect, it } from 'vitest';
import { AuthContext } from './authContext';

describe('AuthContext', () => {
  it('exports a React context with Provider', () => {
    expect(AuthContext).toBeDefined();
    expect(AuthContext.Provider).toBeDefined();
  });
});
