import fs from 'fs';
import logger from '@percy/logger/test/helpers';
import mockRequire from 'mock-require';
import { mockConfigSearch, mockGemfile } from './common';
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
  if (mockGemfile.filepath) {
    fs.unlinkSync(mockGemfile.filepath);
    delete mockGemfile.filepath;
  }

  process.removeAllListeners();
  mockRequire.stopAll();
});

export * from './common';
export { logger, mockRequire, mockCommands };
export { default as mockPrompts } from './mock-prompts';
export { default as mockMigrations } from './mock-migrations';
export { default as setupMigrationTest } from './setup-migration';
export { default as setupCodeshift } from './setup-codeshift';
