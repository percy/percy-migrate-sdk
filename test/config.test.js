import expect from 'expect';
import {
  Migrate,
  logger,
  mockRequire,
  mockPrompts,
  mockCommands,
  mockPackageJSON,
  mockConfigSearch
} from './helpers';

describe('Config migration', () => {
  let percybin = `${process.cwd()}/node_modules/@percy/cli/bin/run`;
  let migrated, prompts;

  beforeEach(() => {
    migrated = false;
    mockPackageJSON({});

    prompts = mockPrompts({
      skipCLI: true,
      doConfig: true
    });

    mockCommands({
      npm: () => ({ status: 0 }),
      yarn: () => ({ status: 0 }),
      [percybin]: args => {
        migrated = args[0] === 'config:migrate';
        return { status: 0 };
      }
    });

    mockRequire('fs', {
      existsSync: p => p.endsWith('@percy/cli/bin/run')
    });
  });

  it('confirms config migration', async () => {
    await Migrate('--only-cli');

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
    await Migrate('--only-cli');

    expect(migrated).toBe(false);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });

  it('does not migrate when @percy/cli is not installed', async () => {
    mockRequire('fs', { existsSync: () => false });
    await Migrate('--only-cli');

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
    mockConfigSearch(() => ({}));
    await Migrate('--only-cli');

    expect(prompts[2]).toBeUndefined();
    expect(migrated).toBe(false);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });

  it('logs an error when the config file fails to parse', async () => {
    mockConfigSearch(() => { throw new Error('config parse failure'); });
    await Migrate('--only-cli');

    expect(migrated).toBe(false);

    expect(logger.stderr).toEqual([
      '[percy] Error: config parse failure'
    ]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });
});
