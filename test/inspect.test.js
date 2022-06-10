import fs from 'fs';
import semver from 'semver';
import expect from 'expect';
import migrate from '../src/index.js';
import { logger } from '@percy/cli-command/test/helpers';
import {
  setupTest,
  mockPackageJSON,
  mockGemfile,
  mockPrompts,
  mockCommands,
  mockMigrations
} from './helpers/index.js';

describe('SDK inspection', () => {
  let prompts;

  beforeEach(async () => {
    await setupTest();

    mockPackageJSON({
      devDependencies: {
        '@percy/sdk-test': '^1.0.0'
      }
    });

    mockMigrations([{
      name: '@percy/sdk-test',
      version: '^2.0.0'
    }, {
      name: '@percy/sdk-test-2',
      aliases: ['@percy/sdk-old'],
      version: '^2.0.0'
    }]);

    prompts = mockPrompts({
      isSDK: true
    });
  });

  it('allows choosing from supported SDKs', async () => {
    prompts = mockPrompts({
      isSDK: false,
      fromChoice: q => q.choices[0].value
    });

    await migrate(['--skip-cli']);

    expect(prompts[1]).toEqual({
      type: 'list',
      name: 'fromChoice',
      message: 'Which SDK are you using?',
      default: 0,
      choices: [
        expect.objectContaining({ name: '@percy/sdk-test' }),
        expect.objectContaining({ name: '@percy/sdk-test-2 (@percy/sdk-old)' }),
        expect.objectContaining({ name: '...not listed?' })
      ]
    });

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!'
    ]);
  });

  it('allows specifying an SDK directly', async () => {
    await migrate(['@percy/sdk-test', '--skip-cli']);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!'
    ]);
  });

  it('allows specifying an SDK alias directly', async () => {
    mockPackageJSON({
      devDependencies: {
        '@percy/sdk-old': '^1.0.0'
      }
    });

    await migrate(['@percy/sdk-old', '--skip-cli']);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!'
    ]);
  });

  it('warns when a specific SDK is not supported', async () => {
    await migrate(['@percy/sdk-test-3', '--skip-cli']);

    expect(logger.stderr).toEqual([
      '[percy] The specified SDK is not supported'
    ]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });

  it('warns when a specific SDK is not installed', async () => {
    await migrate(['@percy/sdk-test-2', '--skip-cli']);

    expect(logger.stderr).toEqual([
      '[percy] The specified SDK was not found in your dependencies'
    ]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!'
    ]);
  });

  it('does not warn on uninstalled if the language was not inspected', async () => {
    mockMigrations([{
      language: 'coldfusion',
      name: 'some-ancient-sdk',
      version: '^1.0.0'
    }]);

    await migrate(['some-ancient-sdk', '--skip-cli']);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!'
    ]);
  });

  it('prints further instructions when the SDK cannot be upgraded', async () => {
    mockMigrations([{
      name: '@percy/sdk-test',
      version: '^2.0.0',
      upgrade: false
    }]);

    await migrate(['@percy/sdk-test', '--skip-cli']);

    expect(logger.stderr).toEqual([
      '[percy] Make sure your SDK is upgraded to the latest version (@percy/sdk-test ^2.0.0)!'
    ]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });

  describe('JavaScript SDKs', () => {
    beforeEach(() => {
      mockPackageJSON({
        devDependencies: {
          '@percy/agent': '^0.1.0',
          '@percy/sdk-test': '^1.0.0',
          'other-package': '^1.0.0'
        }
      });
    });

    it('inspects package.json to guess the installed SDK', async () => {
      await migrate(['--skip-cli']);

      expect(prompts[0]).toEqual({
        type: 'confirm',
        name: 'isSDK',
        message: 'Are you currently using @percy/sdk-test?',
        default: true
      });

      expect(logger.stderr).toEqual([]);
      expect(logger.stdout).toEqual([
        '[percy] Migration complete!'
      ]);
    });

    it('includes aliases when guessing the installed SDK', async () => {
      mockPackageJSON({ devDependencies: { '@percy/sdk-old': '1.0.0' } });

      await migrate(['--skip-cli']);

      expect(prompts[0]).toEqual({
        type: 'confirm',
        name: 'isSDK',
        message: 'Are you currently using @percy/sdk-test-2 (@percy/sdk-old)?',
        default: true
      });

      expect(logger.stderr).toEqual([]);
      expect(logger.stdout).toEqual([
        '[percy] Migration complete!'
      ]);
    });

    it('warns when missing a package.json file', async () => {
      fs.unlinkSync('package.json');
      await migrate(['--skip-cli']);

      expect(logger.stderr).toEqual([
        '[percy] Could not find package.json in current directory'
      ]);

      expect(logger.stdout).toEqual([
        expect.stringMatching('See further migration instructions here:')
      ]);
    });

    it('logs any error encounted while parsing a package.json file', async () => {
      mockPackageJSON('not valid');
      spyOn(Object, 'entries').and.throwError('some error');

      await migrate(['--skip-cli']);
      expect(logger.stderr).toEqual([
        '[percy] Encountered an error inspecting package.json',
        '[percy] Error: some error'
      ]);
      expect(logger.stdout).toEqual([
        expect.stringMatching('See further migration instructions here:')
      ]);
    });
  });

  describe('Ruby SDKs', () => {
    beforeEach(async () => {
      await mockCommands({
        ruby: () => ({
          status: 0,
          stdout: JSON.stringify([{
            name: 'percy-ruby-sdk',
            version: '1.0.0'
          }])
        })
      });

      mockMigrations([{
        name: 'percy-ruby-sdk',
        language: 'ruby',
        version: '^2.0.0'
      }]);

      mockGemfile([
        'gem "foobar", ">=3.0.0"',
        'gem "percy-unsupported-sdk", ">=0.beta.1"',
        'gem "percy-ruby-sdk", "~>1.0.0"',
        'gem "other-package", "~>2.0.0"'
      ]);
    });

    it('inspects the gemfile to guess the installed SDK', async () => {
      await migrate(['--skip-cli']);

      expect(prompts[0]).toEqual({
        type: 'confirm',
        name: 'isSDK',
        message: 'Are you currently using percy-ruby-sdk?',
        default: true
      });

      expect(logger.stderr).toEqual([]);
      expect(logger.stdout).toEqual([
        '[percy] Migration complete!'
      ]);
    });

    it('logs any error encounted while parsing the gemfile', async () => {
      mockGemfile('this is invalid');
      spyOn(semver, 'coerce').and.throwError('some error');
      await migrate(['--skip-cli']);

      expect(logger.stderr).toEqual([
        '[percy] Encountered an error inspecting Gemfile',
        '[percy] Error: some error'
      ]);
      expect(logger.stdout).toEqual([
        expect.stringMatching('See further migration instructions here:')
      ]);
    });
  });
});
