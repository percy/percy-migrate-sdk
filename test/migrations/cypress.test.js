import { resolve } from 'path';
import expect from 'expect';
import {
  Migrate,
  logger,
  setupMigrationTest
} from '../helpers';

describe('Migrations - @percy/cypress', () => {
  let jscodeshiftbin = resolve(__dirname, '../../.codeshift/js/node_modules/jscodeshift/bin/jscodeshift.js');
  let packageJSON, prompts, run;

  beforeEach(() => {
    ({ packageJSON, prompts, run } = setupMigrationTest('cypress', {
      installed: { version: '2.1.3' },
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
      message: 'Percy tasks were removed, update Cypress plugins file?',
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
      message: 'Percy tasks were removed, update Cypress plugins file?',
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

  it('does not ask to remove tasks for older versions', async () => {
    packageJSON.devDependencies['@percy/cypress'] = '1.0.0';

    await Migrate('@percy/cypress', '--skip-cli');

    expect(prompts[2]).toBeUndefined();
    expect(run[jscodeshiftbin].calls).toBeUndefined();

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!\n'
    ]);
  });
});
