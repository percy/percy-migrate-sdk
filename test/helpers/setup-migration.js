import fs from 'fs';
import {
  mockPackageJSON,
  mockGemfile
} from './common.js';
import mockPrompts from './mock-prompts.js';
import mockCommands from './mock-commands.js';

// Setup a migration test by mocking package.json, sdk prompts, and upgrade commands
export default async function setupMigrationTest(filename, mocks) {
  let { default: { name, language } } = await import(`../../src/migrations/${filename}.js`);

  mockPackageJSON({
    devDependencies: language !== 'js' ? {} : {
      [mocks.installed?.name || name]: mocks.installed?.version || '0.0.0'
    }
  });

  if (language === 'ruby') {
    mockGemfile(
      `gem '${mocks.installed?.name || name}', ` +
        `'${mocks.installed?.version || 0}'`);
  }

  let prompts = mockPrompts({
    isSDK: true,
    upgradeSDK: true,
    doTransform: true,
    filePaths: ['test/foo.js', 'test/bar.js', 'test/bazz.js'],
    ...mocks.mockPrompts
  });

  let run = await mockCommands({
    npm: () => ({ status: 0 }),
    bundle: () => ({ status: 0 }),
    ...mocks.mockCommands
  });

  fs.existsSync.and.callFake(path => {
    return path.includes('/.codeshift/') ||
      path.endsWith('package.json') ||
      (language === 'js' && path.endsWith('package-lock.json')) ||
      (language === 'ruby' && path.endsWith('Gemfile'));
  });

  return { prompts, run };
}
