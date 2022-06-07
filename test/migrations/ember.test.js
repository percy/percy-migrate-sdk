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

describe('Migrations - @percy/ember', () => {
  let jscodeshiftbin = codeshift.js.bin;
  let prompts, run;

  beforeEach(async () => {
    await setupTest();

    ({ prompts, run } = await setupMigrationTest('ember', {
      mockCommands: { [jscodeshiftbin]: (p) => ({ status: 0 }) }
    }));
  });

  it('upgrades the sdk', async () => {
    await migrate(['@percy/ember', '--skip-cli']);

    expect(prompts[1]).toEqual({
      type: 'confirm',
      name: 'upgradeSDK',
      message: 'Upgrade SDK to @percy/ember@^3.0.0?',
      default: true
    });

    expect(run.npm.calls[0].args)
      .toEqual(['install', '--save-dev', '@percy/ember@^3.0.0']);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!'
    ]);
  });

  it('asks to transform sdk imports when not installed', async () => {
    mockPackageJSON({});
    await migrate(['@percy/ember', '--skip-cli']);

    expect(prompts[2]).toEqual({
      type: 'confirm',
      name: 'doTransform',
      message: 'SDK exports have changed, update imports?',
      default: true
    });

    expect(run[jscodeshiftbin].calls[0].args).toEqual([
      `--transform=${path.resolve(ROOT, '../transforms/import-default.cjs')}`,
      '--percy-sdk=@percy/ember',
      'test/foo.js',
      'test/bar.js',
      'test/bazz.js'
    ]);

    expect(logger.stderr).toEqual([
      '[percy] The specified SDK was not found in your dependencies'
    ]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!'
    ]);
  });

  it('asks to transforms sdk imports when ember-percy is installed', async () => {
    mockPackageJSON({ devDependencies: { 'ember-percy': '1.0.0' } });
    await migrate(['@percy/ember', '--skip-cli']);

    expect(prompts[2]).toEqual({
      type: 'confirm',
      name: 'doTransform',
      message: 'SDK exports have changed, update imports?',
      default: true
    });

    expect(run[jscodeshiftbin].calls[0].args).toEqual([
      `--transform=${path.resolve(ROOT, '../transforms/import-default.cjs')}`,
      '--percy-installed=ember-percy',
      '--percy-sdk=@percy/ember',
      'test/foo.js',
      'test/bar.js',
      'test/bazz.js'
    ]);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!'
    ]);
  });

  describe('with TypeScript files', () => {
    beforeEach(async () => {
      ({ prompts, run } = await setupMigrationTest('ember', {
        installed: { name: 'ember-percy' },
        mockCommands: { [jscodeshiftbin]: () => ({ status: 0 }) },
        mockPrompts: { filePaths: ['test/bar.ts'] }
      }));
    });

    it('transforms sdk imports for TypeScript', async () => {
      await migrate(['@percy/ember', '--skip-cli']);

      expect(prompts[2]).toEqual({
        type: 'confirm',
        name: 'doTransform',
        message: 'SDK exports have changed, update imports?',
        default: true
      });

      expect(run[jscodeshiftbin].calls[0].args).toEqual([
        `--transform=${path.resolve(ROOT, '../transforms/import-default.cjs')}`,
        '--percy-installed=ember-percy',
        '--parser=ts',
        '--percy-sdk=@percy/ember',
        'test/bar.ts'
      ]);

      expect(logger.stderr).toEqual([]);
      expect(logger.stdout).toEqual([
        '[percy] Migration complete!'
      ]);
    });
  });
});
