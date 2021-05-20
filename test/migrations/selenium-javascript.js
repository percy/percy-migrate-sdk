import { codeshift } from '../../src/utils';
import expect from 'expect';
import { Migrate, logger, setupMigrationTest } from '../helpers';

describe('Migrations - @percy/selenium-webdriver', () => {
  let jscodeshiftbin = codeshift.js.bin;
  let packageJSON, prompts, run;

  beforeEach(() => {
    ({ packageJSON, prompts, run } = setupMigrationTest('selenium-javascript', {
      mockCommands: { [jscodeshiftbin]: () => ({ status: 0 }) }
    }));
  });

  it('upgrades the sdk', async () => {
    await Migrate('@percy/selenium-webdriver', '--skip-cli');

    expect(prompts[1]).toEqual({
      type: 'confirm',
      name: 'upgradeSDK',
      message: 'Upgrade SDK to @percy/selenium-webdriver@^1.0.0?',
      default: true
    });

    expect(run.npm.calls[0].args).toEqual(['install', '--save-dev', '@percy/selenium-webdriver@^1.0.0']);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual(['[percy] Migration complete!\n']);
  });

  it('transforms sdk imports', async () => {
    await Migrate('@percy/selenium-webdriver', '--skip-cli');

    expect(prompts[2]).toEqual({
      type: 'confirm',
      name: 'doTransform',
      message: 'The SDK package name has changed, update imports?',
      default: true
    });

    expect(run[jscodeshiftbin].calls[0].args).toEqual([
      `--transform=${require.resolve('../../transforms/import-default')}`,
      '--percy-installed=@percy/selenium-webdriver',
      '--percy-sdk=@percy/selenium-webdriver',
      'test/foo.js',
      'test/bar.js',
      'test/bazz.js'
    ]);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual(['[percy] Migration complete!\n']);
  });

  it('asks to transform sdk imports even when not installed', async () => {
    delete packageJSON.devDependencies;

    await Migrate('@percy/selenium-webdriver', '--skip-cli');

    expect(prompts[2]).toEqual({
      type: 'confirm',
      name: 'doTransform',
      message: 'The SDK package name has changed, update imports?',
      default: true
    });

    expect(run[jscodeshiftbin].calls[0].args).toEqual([
      `--transform=${require.resolve('../../transforms/import-default')}`,
      '--percy-sdk=@percy/selenium-webdriver',
      'test/foo.js',
      'test/bar.js',
      'test/bazz.js'
    ]);

    expect(logger.stderr).toEqual(['[percy] The specified SDK was not found in your dependencies\n']);
    expect(logger.stdout).toEqual(['[percy] Migration complete!\n']);
  });

  describe('migrating from @percy/seleniumjs', () => {
    beforeEach(() => {
      // mock out having the old SDK installed
      delete packageJSON.devDependencies['@percy/selenium-webdriver'];
      packageJSON.devDependencies['@percy/seleniumjs'] = '^0.2.0';
    });

    it('uninstalls the old SDK', async () => {
      await Migrate('@percy/selenium-webdriver', '--skip-cli');

      expect(prompts[1]).toEqual({
        type: 'confirm',
        name: 'upgradeSDK',
        message: 'Upgrade SDK to @percy/selenium-webdriver@^1.0.0?',
        default: true
      });

      expect(run.npm.calls[0].args).toEqual(['uninstall', '@percy/seleniumjs']);
      expect(run.npm.calls[1].args).toEqual(['install', '--save-dev', '@percy/selenium-webdriver@^1.0.0']);

      expect(logger.stderr).toEqual([]);
      expect(logger.stdout).toEqual(['[percy] Migration complete!\n']);
    });

    it('transforms sdk imports', async () => {
      await Migrate('@percy/selenium-webdriver', '--skip-cli');

      expect(prompts[2]).toEqual({
        type: 'confirm',
        name: 'doTransform',
        message: 'The SDK package name has changed, update imports?',
        default: true
      });

      expect(run[jscodeshiftbin].calls[0].args).toEqual([
        `--transform=${require.resolve('../../transforms/import-default')}`,
        '--percy-installed=@percy/seleniumjs',
        '--percy-sdk=@percy/selenium-webdriver',
        'test/foo.js',
        'test/bar.js',
        'test/bazz.js'
      ]);

      expect(logger.stderr).toEqual([]);
      expect(logger.stdout).toEqual(['[percy] Migration complete!\n']);
    });
  });

  describe('with TypeScript files', () => {
    beforeEach(() => {
      ({ packageJSON, prompts, run } = setupMigrationTest('selenium-javascript', {
        mockCommands: { [jscodeshiftbin]: () => ({ status: 0 }) },
        mockPrompts: { filePaths: ['test/bar.ts'] }
      }));
    });

    it('transforms sdk imports for TypeScript', async () => {
      await Migrate('@percy/selenium-webdriver', '--skip-cli');

      expect(prompts[2]).toEqual({
        type: 'confirm',
        name: 'doTransform',
        message: 'The SDK package name has changed, update imports?',
        default: true
      });

      expect(run[jscodeshiftbin].calls[0].args).toEqual([
        `--transform=${require.resolve('../../transforms/import-default')}`,
        '--percy-installed=@percy/selenium-webdriver',
        '--parser=ts',
        '--percy-sdk=@percy/selenium-webdriver',
        'test/bar.ts'
      ]);

      expect(logger.stderr).toEqual([]);
      expect(logger.stdout).toEqual(['[percy] Migration complete!\n']);
    });
  });
});
