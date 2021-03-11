import expect from 'expect';
import {
  Migrate,
  logger,
  setupMigrationTest
} from '../helpers';

describe('Migrations - @percy/testcafe', () => {
  let prompts, run;

  beforeEach(() => {
    ({ prompts, run } = setupMigrationTest('testcafe', {}));
  });

  it('upgrades the sdk', async () => {
    await Migrate('@percy/testcafe', '--skip-cli');

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
      '[percy] Migration complete!\n'
    ]);
  });
});
