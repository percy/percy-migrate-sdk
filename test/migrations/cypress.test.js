import expect from 'expect';
import {
  Migrate,
  logger,
  setupMigrationTest
} from '../helpers';

describe('Migrations - @percy/cypress', () => {
  let jscodeshiftbin = require.resolve('jscodeshift/bin/jscodeshift');
  let packageJSON, prompts, run;

  beforeEach(() => {
    ({ packageJSON, prompts, run } = setupMigrationTest('cypress', {
      mockCommands: { [jscodeshiftbin]: () => ({ status: 0 }) },
      mockPrompts: { filePaths: ['cypress/plugins/index.js'] }
    }));
  });

  it('upgrades the sdk', async () => {
    await Migrate('@percy/cypress', '--skip-cli');

    expect(prompts[1]).toEqual({
      type: 'confirm',
      name: 'upgradeSDK',
      message: 'Upgrade SDK to @percy/cypress@^3.0.0?',
      default: true
    });

    expect(run.npm.calls[0].args)
      .toEqual(['install', '--save-dev', '@percy/cypress@^3.0.0']);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!\n'
    ]);
  });

  it('removes tasks from plugins', async () => {
    await Migrate('@percy/cypress', '--skip-cli');

    expect(prompts[2]).toEqual({
      type: 'confirm',
      name: 'doTransform',
      message: 'Percy tasks were removed, update plugins file?',
      default: true
    });

    expect(run[jscodeshiftbin].calls[0].args).toEqual([
      `--transform=${require.resolve('../../transforms/cypress-plugins.js')}`,
      'cypress/plugins/index.js'
    ]);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!\n'
    ]);
  });

  it('asks to remove tasks even when not installed', async () => {
    delete packageJSON.devDependencies;

    await Migrate('@percy/cypress', '--skip-cli');

    expect(prompts[2]).toEqual({
      type: 'confirm',
      name: 'doTransform',
      message: 'Percy tasks were removed, update plugins file?',
      default: true
    });

    expect(run[jscodeshiftbin].calls[0].args).toEqual([
      `--transform=${require.resolve('../../transforms/cypress-plugins')}`,
      'cypress/plugins/index.js'
    ]);

    expect(logger.stderr).toEqual([
      '[percy] The specified SDK was not found in your dependencies\n'
    ]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!\n'
    ]);
  });
});
