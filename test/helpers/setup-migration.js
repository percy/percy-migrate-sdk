import mockRequire from 'mock-require';
import { mockPackageJSON } from './common';
import mockPrompts from './mock-prompts';
import mockCommands from './mock-commands';

// Setup a migration test by mocking package.json, sdk prompts, and upgrade commands
export default function setupMigrationTest(filename, mocks) {
  let packageJSON = mockPackageJSON({
    devDependencies: {
      [require(`../../src/migrations/${filename}`).name]: '0.0.0'
    }
  });

  let prompts = mockPrompts({
    isSDK: true,
    upgradeSDK: true,
    doTransform: true,
    filePaths: ['test/foo.js', 'test/bar.js', 'test/bazz.js'],
    ...mocks.mockPrompts
  });

  let run = mockCommands({
    npm: () => ({ status: 0 }),
    ...mocks.mockCommands
  });

  mockRequire('fs', {
    existsSync: path => path.endsWith('package-lock.json')
  });

  mockRequire.reRequire('../../src/utils');
  mockRequire.reRequire(`../../src/migrations/${filename}`);
  mockRequire.reRequire('../../src/migrations');

  return { packageJSON, prompts, run };
}
