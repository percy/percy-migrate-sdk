/* eslint-env jasmine */
import expect from 'expect';
import migrate from '../../src/index.js';
import { logger, setupTest } from '@percy/cli-command/test/helpers';
import {
  setupMigrationTest
} from '../helpers/index.js';

describe('Migrations - @percy/nightwatch', () => {
  let prompts, run;

  beforeEach(async () => {
    await setupTest();
    ({ prompts, run } = await setupMigrationTest('nightwatch', {}));
  });

  it('upgrades the sdk', async () => {
    await migrate(['@percy/nightwatch', '--skip-cli']);

    expect(prompts[1]).toEqual({
      type: 'confirm',
      name: 'upgradeSDK',
      message: 'Upgrade SDK to @percy/nightwatch@^2.0.0?',
      default: true
    });

    expect(run.npm.calls[0].args)
      .toEqual(['install', '--save-dev', '@percy/nightwatch@^2.0.0']);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!'
    ]);
  });
});
