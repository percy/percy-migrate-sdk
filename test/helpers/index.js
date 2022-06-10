import mockCommands from './mock-commands.js';
import { setupTest as commonTestSetup } from '@percy/cli-command/test/helpers';
import { codeshift } from '../../src/utils.js';

await codeshift.js?.install();
await codeshift.ruby?.install();

export async function setupTest() {
  await commonTestSetup();
  await mockCommands({
    npm: () => ({ status: 0 }),
    yarn: () => ({ status: 0 }),
    ruby: () => ({ status: 0 }),
    gem: () => ({ status: 0 })
  });
}

export * from './common.js';
export { mockCommands };
export { default as mockPrompts } from './mock-prompts.js';
export { default as mockMigrations } from './mock-migrations.js';
export { default as setupMigrationTest } from './setup-migration.js';
