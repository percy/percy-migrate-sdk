import mockRequire from 'mock-require';
import {
  mockPackageJSON,
  mockInspectGemfile
} from './common';
import mockPrompts from './mock-prompts';
import mockCommands from './mock-commands';

// Setup a migration test by mocking package.json, sdk prompts, and upgrade commands
export default function setupMigrationTest(filename, mocks) {
  let { name, language } = require(`../../src/migrations/${filename}`);

  let packageJSON = mockPackageJSON({
    devDependencies: language !== 'js' ? {} : {
      [mocks.installed?.name || name]: mocks.installed?.version || '0.0.0'
    }
  });

  let inspectGemfile = mockInspectGemfile(
    language !== 'ruby' ? [] : [{
      name: mocks.installed?.name || name,
      version: mocks.installed?.version || '= 0'
    }]
  );

  let prompts = mockPrompts({
    isSDK: true,
    upgradeSDK: true,
    doTransform: true,
    filePaths: ['test/foo.js', 'test/bar.js', 'test/bazz.js'],
    ...mocks.mockPrompts
  });

  let run = mockCommands({
    npm: () => ({ status: 0 }),
    bundle: () => ({ status: 0 }),
    ...mocks.mockCommands
  });

  mockRequire('fs', {
    existsSync: path => path.endsWith('package-lock.json') || path.includes('/.codeshift/')
  });

  mockRequire.reRequire('../../src/utils');
  mockRequire.reRequire(`../../src/migrations/${filename}`);
  mockRequire.reRequire('../../src/migrations');

  return { packageJSON, inspectGemfile, prompts, run };
}
