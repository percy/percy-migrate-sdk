import expect from 'expect';
import globby from 'globby';
import {
  Migrate,
  logger,
  setupMigrationTest
} from '../helpers';

describe('@percy/migrate - @percy/puppeteer', () => {
  let jscodeshiftbin = require.resolve('jscodeshift/bin/jscodeshift');
  let prompts, run;

  beforeEach(() => {
    [prompts, run] = setupMigrationTest('puppeteer', {
      mockCommands: {
        [jscodeshiftbin]: () => ({ status: 0 })
      }
    });
  });

  it('upgrades the sdk', async () => {
    await Migrate('@percy/puppeteer', '--skip-cli');

    expect(prompts[1]).toEqual({
      type: 'confirm',
      name: 'upgradeSDK',
      message: 'Upgrade SDK to @percy/puppeteer@^2.0.0?',
      default: true
    });

    expect(run.npm.calls[0].args)
      .toEqual(['install', '--save-dev', '@percy/puppeteer@^2.0.0']);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!\n'
    ]);
  });

  it('transforms sdk imports', async () => {
    await Migrate('@percy/puppeteer', '--skip-cli');

    expect(prompts[2]).toEqual({
      type: 'confirm',
      name: 'doTransform',
      message: 'SDK exports have changed, update imports?',
      default: true
    });

    expect(run[jscodeshiftbin].calls[0].args).toEqual([
      `--transform=${require.resolve('../../transforms/import-default')}`,
      '--percy-installed=@percy/puppeteer',
      '--percy-sdk=@percy/puppeteer',
      ...(await globby('test/**/*.test.js'))
    ]);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!\n'
    ]);
  });
});
