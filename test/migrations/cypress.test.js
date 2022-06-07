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

describe('Migrations - @percy/cypress', () => {
  let jscodeshiftbin = codeshift.js.bin;
  let prompts, run;

  beforeEach(async () => {
    await setupTest();

    ({ prompts, run } = await setupMigrationTest('cypress', {
      installed: { version: '2.1.3' },
      mockCommands: { [jscodeshiftbin]: () => ({ status: 0 }) },
      mockPrompts: { filePaths: ['cypress/plugins/index.js'] }
    }));
  });

  it('upgrades the sdk', async () => {
    await migrate(['@percy/cypress', '--skip-cli']);

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
      '[percy] Migration complete!'
    ]);
  });

  it('removes tasks from plugins', async () => {
    await migrate(['@percy/cypress', '--skip-cli']);

    expect(prompts[2]).toEqual({
      type: 'confirm',
      name: 'doTransform',
      message: 'Percy tasks were removed, update Cypress plugins file?',
      default: true
    });

    expect(run[jscodeshiftbin].calls[0].args).toEqual([
      `--transform=${path.resolve(ROOT, '../transforms/cypress-plugins.cjs')}`,
      'cypress/plugins/index.js'
    ]);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!'
    ]);
  });

  it('asks to remove tasks even when not installed', async () => {
    mockPackageJSON({});
    await migrate(['@percy/cypress', '--skip-cli']);

    expect(prompts[2]).toEqual({
      type: 'confirm',
      name: 'doTransform',
      message: 'Percy tasks were removed, update Cypress plugins file?',
      default: true
    });

    expect(run[jscodeshiftbin].calls[0].args).toEqual([
      `--transform=${path.resolve(ROOT, '../transforms/cypress-plugins.cjs')}`,
      'cypress/plugins/index.js'
    ]);

    expect(logger.stderr).toEqual([
      '[percy] The specified SDK was not found in your dependencies'
    ]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!'
    ]);
  });

  it('does not ask to remove tasks for older versions', async () => {
    mockPackageJSON({ devDependencies: { '@percy/cypress': '1.0.0' } });
    await migrate(['@percy/cypress', '--skip-cli']);

    expect(prompts[2]).toBeUndefined();
    expect(run[jscodeshiftbin].calls).toBeUndefined();

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!'
    ]);
  });
});
