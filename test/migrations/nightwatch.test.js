import expect from 'expect';
import {
  Migrate,
  logger,
  setupMigrationTest
} from '../helpers';

describe('Migrations - @percy/nightwatch', () => {
  let prompts, run;

  beforeEach(() => {
    ({ prompts, run } = setupMigrationTest('nightwatch', {}));
  });

  it('upgrades the sdk', async () => {
    await Migrate('@percy/nightwatch', '--skip-cli');

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
      '[percy] Migration complete!\n'
    ]);
  });
});
