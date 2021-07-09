import expect from 'expect';
import { codeshift } from '../../src/utils';
import {
  Migrate,
  logger,
  setupMigrationTest,
  mockRequire
} from '../helpers';

describe('Migrations - percy-capybara', () => {
  let rubycodeshiftbin = codeshift.ruby.bin;
  let inspectGemfile, prompts, run;

  beforeEach(() => {
    ({ inspectGemfile, prompts, run } = setupMigrationTest('capybara', {
      installed: { version: '4.3.3' },
      mockCommands: { [rubycodeshiftbin]: () => ({ status: 0 }) },
      mockPrompts: { filePaths: ['specs/my_test.rb'] }
    }));
  });

  it('upgrades the sdk', async () => {
    await Migrate('percy-capybara', '--skip-cli');

    expect(prompts[1]).toEqual({
      type: 'confirm',
      name: 'upgradeSDK',
      message: 'Upgrade SDK to percy-capybara@^5.0.0?',
      default: true
    });

    expect(run.bundle.calls[0].args).toEqual(['remove', 'percy-capybara']);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!\n'
    ]);
  });

  it('runs the codemod to convert to the new API', async () => {
    await Migrate('percy-capybara', '--skip-cli');

    expect(prompts[2]).toEqual({
      type: 'confirm',
      name: 'doTransform',
      message: 'The Capybara API has breaking changes, automatically convert to the new API?',
      default: true
    });

    expect(run[rubycodeshiftbin].calls[0].args).toEqual([
      `--transform=${require.resolve('../../transforms/capybara.rb')}`,
      'specs/my_test.rb'
    ]);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!\n'
    ]);
  });

  it('asks to remove tasks even when not installed', async () => {
    inspectGemfile.output = [];

    await Migrate('percy-capybara', '--skip-cli');

    expect(prompts[2]).toEqual({
      type: 'confirm',
      name: 'doTransform',
      message: 'The Capybara API has breaking changes, automatically convert to the new API?',
      default: true
    });

    expect(run[rubycodeshiftbin].calls[0].args).toEqual([
      `--transform=${require.resolve('../../transforms/capybara.rb')}`,
      'specs/my_test.rb'
    ]);

    expect(logger.stderr).toEqual([
      '[percy] The specified SDK was not found in your dependencies\n'
    ]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!\n'
    ]);
  });
});
