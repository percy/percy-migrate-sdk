import mockRequire from 'mock-require';
import { mockPackageJSON } from './common';
import mockPrompts from './mock-prompts';
import mockCommands from './mock-commands';

// Setup a migration test by mocking package.json, sdk prompts, and upgrade commands
export default function setupMigrationTest(filename, mocks) {
  let { name } = require(`../../src/migrations/${filename}`);

  let packageJSON = mockPackageJSON({
    devDependencies: {
      [mocks.installed?.name || name]: mocks.installed?.version || '0.0.0'
    }
  });

  let prompts = mockPrompts({
    isSDK: true,
    upgradeSDK: true,
    doTransform: true,
    filePaths: ['test/foo.js', 'test/bar.js', 'test/bazz.js'],
    ...mocks.mockPrompts
  });

  mockRequire('child_process', {
    execSync: (cmd, args, options) => {
      // match the ruby scripts output
      // eslint-disable-next-line
      return `{ \"name\": \"percy-capybara\", \"version\": \"${mocks.installed?.version || '0.0.0'}\" }`;
    }
  });

  let run = mockCommands({
    npm: () => ({ status: 0 }),
    ...mocks.mockCommands
  });

  mockRequire('fs', {
    existsSync: path => path.endsWith('package-lock.json') || path.includes('/.codeshift/')
  });

  mockRequire.reRequire('../../src/utils');
  mockRequire.reRequire(`../../src/migrations/${filename}`);
  mockRequire.reRequire('../../src/migrations');

  return { packageJSON, prompts, run };
}
