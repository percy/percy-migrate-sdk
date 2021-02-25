import expect from 'expect';
import {
  Migrate,
  logger,
  mockRequire,
  mockPackageJSON,
  mockCommands,
  mockPrompts
} from './helpers';

describe('CLI installation', () => {
  let packageJSON, prompts, run;

  beforeEach(() => {
    packageJSON = mockPackageJSON({});

    prompts = mockPrompts({
      installCLI: true
    });

    run = mockCommands({
      npm: () => ({ status: 0 }),
      yarn: () => ({ status: 0 })
    });

    mockRequire('fs', {
      existsSync: path => path.endsWith('package-lock.json')
    });
  });

  it('confirms the CLI installation', async () => {
    await Migrate('--only-cli');

    expect(prompts[0]).toEqual({
      type: 'confirm',
      name: 'installCLI',
      message: 'Install @percy/cli?',
      default: true
    });

    expect(run.npm.calls[0].args)
      .toEqual(['install', '--save-dev', '@percy/cli']);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });

  it('does not install the CLI when not confirmed', async () => {
    prompts = mockPrompts({
      installCLI: false
    });

    await Migrate('--only-cli');

    expect(prompts[0]).toEqual({
      type: 'confirm',
      name: 'installCLI',
      message: 'Install @percy/cli?',
      default: true
    });

    expect(run.npm.calls).toBeUndefined();

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });

  it('does not confirm when the CLI is already installed', async () => {
    packageJSON.devDependencies = { '@percy/cli': '^1.0.0' };
    await Migrate('--only-cli');

    expect(prompts).not.toHaveProperty('0.name', 'installCLI');
    expect(run.npm.calls).toBeUndefined();

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });

  it('removes @percy/agent when necessary', async () => {
    packageJSON.devDependencies = { '@percy/agent': '^0.1.0' };
    await Migrate('--only-cli');

    expect(prompts[0]).toEqual({
      type: 'confirm',
      name: 'installCLI',
      message: 'Install @percy/cli (and remove @percy/agent)?',
      default: true
    });

    expect(run.npm.calls[0].args)
      .toEqual(['uninstall', '@percy/agent']);
    expect(run.npm.calls[1].args)
      .toEqual(['install', '--save-dev', '@percy/cli']);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });

  it('uses yarn when a yarn.lock exists', async () => {
    packageJSON.devDependencies = { '@percy/agent': '^0.1.0' };
    mockRequire('fs', { existsSync: path => path.endsWith('yarn.lock') });
    await Migrate('--only-cli');

    expect(run.yarn.calls[0].args)
      .toEqual(['remove', '@percy/agent']);
    expect(run.yarn.calls[1].args)
      .toEqual(['add', '--dev', '@percy/cli']);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });

  it('warns and uses npm when both a yarn.lock and package-lock.json exists', async () => {
    mockRequire('fs', { existsSync: () => true });
    await Migrate('--only-cli');

    expect(run.npm.calls[0].args)
      .toEqual(['install', '--save-dev', '@percy/cli']);

    expect(logger.stderr).toEqual([
      '[percy] Found both a yarn.lock and package-lock.json, defaulting to npm\n'
    ]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });

  it('runs with the appropriate stdio values', async () => {
    await Migrate('--only-cli');

    expect(run.npm.calls[0].options)
      .toEqual({ stdio: ['inherit', 'inherit', 'inherit'] });
  });

  it('runs with the appropriate stdio values when quiet', async () => {
    await Migrate('--only-cli', '--quiet');

    expect(run.npm.calls[0].options)
      .toEqual({ stdio: ['ignore', 'ignore', 'inherit'] });
  });

  it('runs with the appropriate stdio values when silent', async () => {
    await Migrate('--only-cli', '--silent');

    expect(run.npm.calls[0].options)
      .toEqual({ stdio: ['ignore', 'ignore', 'ignore'] });
  });

  it('exits when the subcommand fails', async () => {
    run = mockCommands({
      npm: () => ({ status: 3 })
    });

    await expect(Migrate('--only-cli'))
      .rejects.toThrow('EEXIT: 3');

    expect(run.npm.calls[0].args)
      .toEqual(['install', '--save-dev', '@percy/cli']);

    expect(logger.stdout).toEqual([]);
    expect(logger.stderr).toEqual([
      '[percy] Error: npm failed with exit code 3\n'
    ]);
  });
});
