import fs from 'fs';
import { mockGemfile } from './common.js';
import mockCommands from './mock-commands.js';

// common hooks
beforeEach(async () => {
  // mockConfigSearch(() => ({
  //   filepath: '.percy.yml'
  // }));

  await mockCommands({
    npm: () => ({ status: 0 }),
    yarn: () => ({ status: 0 }),
    ruby: () => ({ status: 0 })
  });
});

afterEach(() => {
  if (mockGemfile.filepath) {
    fs.unlinkSync(mockGemfile.filepath);
    delete mockGemfile.filepath;
  }

  process.removeAllListeners();
});

export * from './common.js';
export { mockCommands };
export { default as mockPrompts } from './mock-prompts.js';
export { default as mockMigrations } from './mock-migrations.js';
export { default as setupMigrationTest } from './setup-migration.js';
export { default as setupCodeshift } from './setup-codeshift.js';
