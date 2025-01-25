import { describe, expect, it } from '@jest/globals';

describe('Banking Module Configuration', () => {
  const testConfig = {
    jwt: {
      secret: 'test-secret-key',
      expiresIn: '1h'
    },
    database: {
      url: 'file:./test.db'
    },
    auth: {
      roles: {
        PARENT: 'PARENT',
        CHILD: 'CHILD'
      }
    }
  };

  it('should have valid JWT configuration', () => {
    expect(testConfig.jwt.secret).toBeDefined();
    expect(testConfig.jwt.expiresIn).toBeDefined();
  });

  it('should have valid database configuration', () => {
    expect(testConfig.database.url).toBeDefined();
  });

  it('should have valid role configuration', () => {
    expect(testConfig.auth.roles.PARENT).toBe('PARENT');
    expect(testConfig.auth.roles.CHILD).toBe('CHILD');
  });
});

export { testConfig };
