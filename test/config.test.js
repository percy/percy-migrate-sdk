import fs from 'fs';
import expect from 'expect';
import migrate from '../src/index.js';
import { logger } from '@percy/cli-command/test/helpers';
import {
  setupTest,
  mockPrompts,
  mockCommands,
  mockMigrations,
  mockPackageJSON
} from './helpers/index.js';

describe('Config migration', () => {
  let percybin = `${process.cwd()}/node_modules/@percy/cli/bin/run`;
  let migrated, prompts;

  beforeEach(async () => {
    await setupTest();

    await mockCommands({
      npm: () => ({ status: 0 }),
      yarn: () => ({ status: 0 }),
      [percybin]: args => {
        migrated = args[0] === 'config:migrate';
        return { status: 0 };
      }
    });

    mockMigrations([{
      name: '@percy/sdk-test',
      version: '^2.0.0'
    }]);

    spyOn(fs, 'existsSync').and.callFake(p => {
      return p.endsWith('@percy/cli/bin/run') || p.endsWith('package.json');
    });

    migrated = false;
    mockPackageJSON({});

    prompts = mockPrompts({
      skipCLI: true,
      doConfig: true
    });

    fs.writeFileSync('.percy.yml', 'hi');
  });

  it('confirms config migration', async () => {
    await migrate(['--only-cli']);

    expect(prompts[2]).toEqual({
      type: 'confirm',
      name: 'doConfig',
      message: 'Migrate Percy config file?',
      default: true
    });

    expect(migrated).toBe(true);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });

  it('does not migrate config when not confirmed', async () => {
    mockPrompts({ doConfig: false });
    await migrate(['--only-cli']);

    expect(migrated).toBe(false);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });

  it('does not migrate when @percy/cli is not installed', async () => {
    fs.existsSync.and.callFake(p => p.endsWith('package.json'));
    await migrate(['--only-cli']);

    expect(prompts[2]).toEqual({
      type: 'confirm',
      name: 'doConfig',
      message: 'Migrate Percy config file?',
      default: true
    });

    expect(migrated).toBe(false);

    expect(logger.stderr).toEqual([
      '[percy] Could not run config migration, @percy/cli is not installed'
    ]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });

  it('does not prompt when no config file was found', async () => {
    fs.unlinkSync('.percy.yml');
    await migrate(['--only-cli']);

    expect(prompts[2]).toBeUndefined();
    expect(migrated).toBe(false);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });

  it('logs an error when the config file fails to parse', async () => {
    fs.statSync.and.throwError('config parse failure');

    await migrate(['--only-cli']);

    expect(migrated).toBe(false);
    expect(logger.stderr).toEqual([
      '[percy] Error: config parse failure'
    ]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });
});
