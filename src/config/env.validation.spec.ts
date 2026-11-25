import { validateEnv } from './env.validation.js';

describe('validateEnv', () => {
  const valid = { DATABASE_URL: 'postgresql://u:p@localhost:5432/db' };

  it('accepts a minimal valid environment', () => {
    expect(() => validateEnv(valid)).not.toThrow();
  });

  it('converts PORT to a number', () => {
    expect(validateEnv({ ...valid, PORT: '8080' })).toMatchObject({
      PORT: 8080,
    });
  });

  it('fails fast when DATABASE_URL is missing', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL/);
  });

  it('rejects an invalid PORT', () => {
    expect(() => validateEnv({ ...valid, PORT: '70000' })).toThrow(/PORT/);
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => validateEnv({ ...valid, NODE_ENV: 'staging' })).toThrow(
      /NODE_ENV/,
    );
  });
});
