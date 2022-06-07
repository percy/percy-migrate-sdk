/* eslint-env jasmine */
import path from 'path';
import expect from 'expect';
import migrate from '../../src/index.js';
import { ROOT, codeshift } from '../../src/utils.js';
import { logger, setupTest } from '@percy/cli-command/test/helpers';
import {
  mockPackageJSON,
  setupMigrationTest
} from '../helpers/index.js';

describe('Migrations - @percy/selenium-webdriver', () => {
  let jscodeshiftbin = codeshift.js.bin;
  let prompts, run;

  beforeEach(async () => {
    await setupTest();
    ({ prompts, run } = await setupMigrationTest('selenium-javascript', {
      mockCommands: { [jscodeshiftbin]: () => ({ status: 0 }) }
    }));
  });

  it('upgrades the sdk', async () => {
    await migrate(['@percy/selenium-webdriver', '--skip-cli']);

    expect(prompts[1]).toEqual({
      type: 'confirm',
      name: 'upgradeSDK',
      message: 'Upgrade SDK to @percy/selenium-webdriver@^1.0.0?',
      default: true
    });

    expect(run.npm.calls[0].args).toEqual(['install', '--save-dev', '@percy/selenium-webdriver@^1.0.0']);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual(['[percy] Migration complete!']);
  });

  it('transforms sdk imports', async () => {
    await migrate(['@percy/selenium-webdriver', '--skip-cli']);

    expect(prompts[2]).toEqual({
      type: 'confirm',
      name: 'doTransform',
      message: 'The SDK package name has changed, update imports?',
      default: true
    });

    expect(run[jscodeshiftbin].calls[0].args).toEqual([
      `--transform=${path.resolve(ROOT, '../transforms/import-default.cjs')}`,
      '--percy-installed=@percy/selenium-webdriver',
      '--percy-sdk=@percy/selenium-webdriver',
      'test/foo.js',
      'test/bar.js',
      'test/bazz.js'
    ]);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual(['[percy] Migration complete!']);
  });

  it('asks to transform sdk imports even when not installed', async () => {
    mockPackageJSON({});
    await migrate(['@percy/selenium-webdriver', '--skip-cli']);

    expect(prompts[2]).toEqual({
      type: 'confirm',
      name: 'doTransform',
      message: 'The SDK package name has changed, update imports?',
      default: true
    });

    expect(run[jscodeshiftbin].calls[0].args).toEqual([
      `--transform=${path.resolve(ROOT, '../transforms/import-default.cjs')}`,
      '--percy-sdk=@percy/selenium-webdriver',
      'test/foo.js',
      'test/bar.js',
      'test/bazz.js'
    ]);

    expect(logger.stderr).toEqual(['[percy] The specified SDK was not found in your dependencies']);
    expect(logger.stdout).toEqual(['[percy] Migration complete!']);
  });

  describe('migrating from @percy/seleniumjs', () => {
    beforeEach(() => {
      // mock out having the old SDK installed
      mockPackageJSON({ devDependencies: { '@percy/seleniumjs': '^0.2.0' } });
    });

    it('uninstalls the old SDK', async () => {
      await migrate(['@percy/selenium-webdriver', '--skip-cli']);

      expect(prompts[1]).toEqual({
        type: 'confirm',
        name: 'upgradeSDK',
        message: 'Upgrade SDK to @percy/selenium-webdriver@^1.0.0?',
        default: true
      });

      expect(run.npm.calls[0].args).toEqual(['uninstall', '@percy/seleniumjs']);
      expect(run.npm.calls[1].args).toEqual(['install', '--save-dev', '@percy/selenium-webdriver@^1.0.0']);

      expect(logger.stderr).toEqual([]);
      expect(logger.stdout).toEqual(['[percy] Migration complete!']);
    });

    it('transforms sdk imports', async () => {
      await migrate(['@percy/selenium-webdriver', '--skip-cli']);

      expect(prompts[2]).toEqual({
        type: 'confirm',
        name: 'doTransform',
        message: 'The SDK package name has changed, update imports?',
        default: true
      });

      expect(run[jscodeshiftbin].calls[0].args).toEqual([
        `--transform=${path.resolve(ROOT, '../transforms/import-default.cjs')}`,
        '--percy-installed=@percy/seleniumjs',
        '--percy-sdk=@percy/selenium-webdriver',
        'test/foo.js',
        'test/bar.js',
        'test/bazz.js'
      ]);

      expect(logger.stderr).toEqual([]);
      expect(logger.stdout).toEqual(['[percy] Migration complete!']);
    });
  });

  describe('with TypeScript files', () => {
    beforeEach(async () => {
      ({ prompts, run } = await setupMigrationTest('selenium-javascript', {
        mockCommands: { [jscodeshiftbin]: () => ({ status: 0 }) },
        mockPrompts: { filePaths: ['test/bar.ts'] }
      }));
    });

    it('transforms sdk imports for TypeScript', async () => {
      await migrate(['@percy/selenium-webdriver', '--skip-cli']);

      expect(prompts[2]).toEqual({
        type: 'confirm',
        name: 'doTransform',
        message: 'The SDK package name has changed, update imports?',
        default: true
      });

      expect(run[jscodeshiftbin].calls[0].args).toEqual([
        `--transform=${path.resolve(ROOT, '../transforms/import-default.cjs')}`,
        '--percy-installed=@percy/selenium-webdriver',
        '--parser=ts',
        '--percy-sdk=@percy/selenium-webdriver',
        'test/bar.ts'
      ]);

      expect(logger.stderr).toEqual([]);
      expect(logger.stdout).toEqual(['[percy] Migration complete!']);
    });
  });
});
