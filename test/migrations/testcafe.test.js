import expect from 'expect';
import migrate from '../../src/index.js';
import { logger } from '@percy/cli-command/test/helpers';
import { setupMigrationTest } from '../helpers/index.js';

describe('Migrations - @percy/testcafe', () => {
  let prompts, run;

  beforeEach(async () => {
    ({ prompts, run } = await setupMigrationTest('testcafe', {}));
  });

  it('upgrades the sdk', async () => {
    await migrate(['@percy/testcafe', '--skip-cli']);

    expect(prompts[1]).toEqual({
      type: 'confirm',
      name: 'upgradeSDK',
      message: 'Upgrade SDK to @percy/testcafe@^1.0.0?',
      default: true
    });

    expect(run.npm.calls[0].args)
      .toEqual(['install', '--save-dev', '@percy/testcafe@^1.0.0']);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!'
    ]);
  });
});
