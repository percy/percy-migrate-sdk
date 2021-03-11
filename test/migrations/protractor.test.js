import expect from 'expect';
import globby from 'globby';
import {
  Migrate,
  logger,
  setupMigrationTest
} from '../helpers';

describe('Migrations - @percy/protractor', () => {
  let jscodeshiftbin = require.resolve('jscodeshift/bin/jscodeshift');
  let packageJSON, prompts, run;

  beforeEach(() => {
    ({ packageJSON, prompts, run } = setupMigrationTest('protractor', {
      mockCommands: { [jscodeshiftbin]: () => ({ status: 0 }) }
    }));
  });

  it('upgrades the sdk', async () => {
    await Migrate('@percy/protractor', '--skip-cli');

    expect(prompts[1]).toEqual({
      type: 'confirm',
      name: 'upgradeSDK',
      message: 'Upgrade SDK to @percy/protractor@^2.0.0?',
      default: true
    });

    expect(run.npm.calls[0].args)
      .toEqual(['install', '--save-dev', '@percy/protractor@^2.0.0']);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!\n'
    ]);
  });

  it('transforms sdk imports', async () => {
    await Migrate('@percy/protractor', '--skip-cli');

    expect(prompts[2]).toEqual({
      type: 'confirm',
      name: 'doTransform',
      message: 'SDK exports have changed, update imports?',
      default: true
    });

    expect(run[jscodeshiftbin].calls[0].args).toEqual([
      `--transform=${require.resolve('../../transforms/import-default')}`,
      '--percy-installed=@percy/protractor',
      '--percy-sdk=@percy/protractor',
      ...(await globby('test/**/*.test.js').then(f => f.sort()))
    ]);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!\n'
    ]);
  });

  it('asks to transform sdk imports even when not installed', async () => {
    delete packageJSON.devDependencies;

    await Migrate('@percy/protractor', '--skip-cli');

    expect(prompts[2]).toEqual({
      type: 'confirm',
      name: 'doTransform',
      message: 'SDK exports have changed, update imports?',
      default: true
    });

    expect(run[jscodeshiftbin].calls[0].args).toEqual([
      `--transform=${require.resolve('../../transforms/import-default')}`,
      '--percy-sdk=@percy/protractor',
      ...(await globby('test/**/*.test.js').then(f => f.sort()))
    ]);

    expect(logger.stderr).toEqual([
      '[percy] The specified SDK was not found in your dependencies\n'
    ]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!\n'
    ]);
  });
});