import expect from 'expect';
import {
  Migrate,
  logger,
  mockPrompts,
  mockCommands,
  mockPackageJSON,
  mockConfigSearch
} from './helpers';

describe('@percy/migrate - Config migration', () => {
  let migrated, prompts;

  beforeEach(() => {
    migrated = false;
    mockPackageJSON({});

    prompts = mockPrompts({
      doConfig: true
    });

    mockCommands({
      npm: () => ({ status: 0 }),
      yarn: () => ({ status: 0 }),
      [`${process.cwd()}/node_modules/@percy/cli/bin/run`]: args => {
        migrated = args[0] === 'config:migrate';
        return { status: 0 };
      }
    });
  });

  it('confirms config migration', async () => {
    await Migrate('--only-cli');

    expect(prompts[1]).toEqual({
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

  it('Does not prompt when no config file was found', async () => {
    mockConfigSearch(() => ({}));
    await Migrate('--only-cli');

    expect(prompts[1]).toBeUndefined();
    expect(migrated).toBe(false);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });

  it('Logs an error when the config file fails to parse', async () => {
    mockConfigSearch(() => { throw new Error('config parse failure'); });
    await Migrate('--only-cli');

    expect(migrated).toBe(false);

    expect(logger.stderr).toEqual([
      '[percy] Error: config parse failure\n'
    ]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });
});
