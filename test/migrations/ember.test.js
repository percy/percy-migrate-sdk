import expect from 'expect';
import { resolve } from 'path';
import {
  Migrate,
  logger,
  setupMigrationTest
} from '../helpers';

describe('Migrations - @percy/ember', () => {
  let jscodeshiftbin = resolve(__dirname, '../../.codeshift/js/node_modules/jscodeshift/bin/jscodeshift');
  let packageJSON, prompts, run;

  beforeEach(() => {
    ({ packageJSON, prompts, run } = setupMigrationTest('ember', {
      mockCommands: { [jscodeshiftbin]: () => ({ status: 0 }) }
    }));
  });

  it('upgrades the sdk', async () => {
    await Migrate('@percy/ember', '--skip-cli');

    expect(prompts[1]).toEqual({
      type: 'confirm',
      name: 'upgradeSDK',
      message: 'Upgrade SDK to @percy/ember@^3.0.0?',
      default: true
    });

    expect(run.npm.calls[0].args)
      .toEqual(['install', '--save-dev', '@percy/ember@^3.0.0']);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!\n'
    ]);
  });

  it('asks to transform sdk imports when not installed', async () => {
    delete packageJSON.devDependencies;

    await Migrate('@percy/ember', '--skip-cli');

    expect(prompts[2]).toEqual({
      type: 'confirm',
      name: 'doTransform',
      message: 'SDK exports have changed, update imports?',
      default: true
    });

    expect(run[jscodeshiftbin].calls[0].args).toEqual([
      `--transform=${require.resolve('../../transforms/import-default')}`,
      '--percy-sdk=@percy/ember',
      'test/foo.js',
      'test/bar.js',
      'test/bazz.js'
    ]);

    expect(logger.stderr).toEqual([
      '[percy] The specified SDK was not found in your dependencies\n'
    ]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!\n'
    ]);
  });

  it('asks to transforms sdk imports when ember-percy is installed', async () => {
    delete packageJSON.devDependencies['@percy/ember'];
    packageJSON.devDependencies['ember-percy'] = '1.0.0';

    await Migrate('@percy/ember', '--skip-cli');

    expect(prompts[2]).toEqual({
      type: 'confirm',
      name: 'doTransform',
      message: 'SDK exports have changed, update imports?',
      default: true
    });

    expect(run[jscodeshiftbin].calls[0].args).toEqual([
      `--transform=${require.resolve('../../transforms/import-default')}`,
      '--percy-installed=ember-percy',
      '--percy-sdk=@percy/ember',
      'test/foo.js',
      'test/bar.js',
      'test/bazz.js'
    ]);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!\n'
    ]);
  });

  describe('with TypeScript files', () => {
    beforeEach(() => {
      ({ packageJSON, prompts, run } = setupMigrationTest('ember', {
        installed: { name: 'ember-percy' },
        mockCommands: { [jscodeshiftbin]: () => ({ status: 0 }) },
        mockPrompts: { filePaths: ['test/bar.ts'] }
      }));
    });

    it('transforms sdk imports for TypeScript', async () => {
      await Migrate('@percy/ember', '--skip-cli');

      expect(prompts[2]).toEqual({
        type: 'confirm',
        name: 'doTransform',
        message: 'SDK exports have changed, update imports?',
        default: true
      });

      expect(run[jscodeshiftbin].calls[0].args).toEqual([
        `--transform=${require.resolve('../../transforms/import-default')}`,
        '--percy-installed=ember-percy',
        '--parser=ts',
        '--percy-sdk=@percy/ember',
        'test/bar.ts'
      ]);

      expect(logger.stderr).toEqual([]);
      expect(logger.stdout).toEqual([
        '[percy] Migration complete!\n'
      ]);
    });
  });
});
