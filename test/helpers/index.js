import logger from '@percy/logger/test/helper';
import mockRequire from 'mock-require';
import { mockConfigSearch } from './common';
import mockCommands from './mock-commands';

// common hooks
beforeEach(() => {
  logger.mock();
  mockConfigSearch(() => ({
    filepath: '.percy.yml'
  }));
  mockCommands({
    npm: () => ({ status: 0 }),
    yarn: () => ({ status: 0 })
  });
});

afterEach(() => {
  process.removeAllListeners();
  mockRequire.stopAll();
});

export * from './common';
export { logger, mockRequire, mockCommands };
export { default as mockPrompts } from './mock-prompts';
export { default as mockMigrations } from './mock-migrations';
export { default as setupMigrationTest } from './setup-migration';
