/* eslint-env jasmine */
import path from 'path';
import expect from 'expect';
import migrate from '../../src/index.js';
import { ROOT, codeshift } from '../../src/utils.js';
import { logger, setupTest } from '@percy/cli-command/test/helpers';
import {
  mockGemfile,
  mockCommands,
  setupMigrationTest
} from '../helpers/index.js';

describe('Migrations - percy-capybara', () => {
  let rubycodeshiftbin = codeshift.ruby.bin;
  let prompts, run;

  beforeEach(async () => {
    await setupTest();
    ({ prompts, run } = await setupMigrationTest('capybara', {
      installed: { version: '4.3.3' },
      mockCommands: {
        [rubycodeshiftbin]: () => ({ status: 0 }),
        ruby: () => ({
          status: 0,
          stdout: JSON.stringify([{
            name: 'percy-capybara',
            version: '4.3.3'
          }])
        })
      },
      mockPrompts: { filePaths: ['specs/my_test.rb'] }
    }));
  });

  it('upgrades the sdk', async () => {
    await migrate(['percy-capybara', '--skip-cli']);

    expect(prompts[1]).toEqual({
      type: 'confirm',
      name: 'upgradeSDK',
      message: 'Upgrade SDK to percy-capybara@^5.0.0?',
      default: true
    });

    expect(run.bundle.calls[0].args).toEqual(['remove', 'percy-capybara']);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!'
    ]);
  });

  it('runs the codemod to convert to the new API', async () => {
    await migrate(['percy-capybara', '--skip-cli']);

    expect(prompts[2]).toEqual({
      type: 'confirm',
      name: 'doTransform',
      message: 'The Capybara API has breaking changes, automatically convert to the new API?',
      default: true
    });

    expect(run[rubycodeshiftbin].calls[0].args).toEqual([
      `--transform=${path.resolve(ROOT, '../transforms/capybara.rb')}`,
      'specs/my_test.rb'
    ]);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!'
    ]);
  });

  it('asks to transform files even when not installed', async () => {
    mockGemfile('gem "foobar", "1.0"');
    run = await mockCommands({
      bundle: () => ({ status: 0 }),
      [rubycodeshiftbin]: () => ({ status: 0 }),
      ruby: () => ({
        status: 0,
        stdout: JSON.stringify([{
          name: 'foobar',
          version: '1.0'
        }])
      })
    });

    await migrate(['percy-capybara', '--skip-cli']);

    expect(prompts[2]).toEqual({
      type: 'confirm',
      name: 'doTransform',
      message: 'The Capybara API has breaking changes, automatically convert to the new API?',
      default: true
    });

    expect(run[rubycodeshiftbin].calls[0].args).toEqual([
      `--transform=${path.resolve(ROOT, '../transforms/capybara.rb')}`,
      'specs/my_test.rb'
    ]);

    expect(logger.stderr).toEqual([
      '[percy] The specified SDK was not found in your dependencies'
    ]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!'
    ]);
  });
});
