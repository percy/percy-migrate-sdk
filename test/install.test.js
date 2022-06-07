/* eslint-env jasmine */
import fs from 'fs';
import expect from 'expect';
import migrate from '../src/index.js';
import { logger, setupTest } from '@percy/cli-command/test/helpers';
import { npm } from '../src/utils.js';
import {
  mockPackageJSON,
  mockCommands,
  mockPrompts
} from './helpers/index.js';

const CACHED_NPM_MANAGER = Object.getOwnPropertyDescriptor(npm, 'manager');

describe('CLI installation', () => {
  let prompts, run;

  beforeEach(async () => {
    await setupTest();
    mockPackageJSON({});

    prompts = mockPrompts({
      installCLI: true
    });

    run = await mockCommands({
      npm: () => ({ status: 0 }),
      yarn: () => ({ status: 0 })
    });
  });

  afterEach(() => {
    // reset npm manager cached value
    Object.defineProperty(npm, 'manager', { get: () => CACHED_NPM_MANAGER.get() });
  });

  it('confirms the CLI installation', async () => {
    await migrate(['--only-cli']);

    expect(prompts[0]).toEqual({
      type: 'confirm',
      name: 'installCLI',
      message: 'Install @percy/cli (required to run percy)?',
      default: true
    });

    expect(run.npm.calls[0].args)
      .toEqual(['install', '--save-dev', '@percy/cli']);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });

  it('confirms again when answering no', async () => {
    prompts = mockPrompts({
      installCLI: false,
      skipCLI: false
    });

    await migrate(['--only-cli']);

    expect(prompts[1]).toEqual({
      type: 'confirm',
      name: 'skipCLI',
      when: expect.any(Function),
      message: 'Are you sure you want to skip installing @percy/cli?',
      default: false
    });

    // test that `when` returns the correct values for the previous answer
    expect(prompts[1].when({ installCLI: false })).toEqual(true);
    expect(prompts[1].when({ installCLI: true })).toEqual(false);

    expect(run.npm.calls[0].args)
      .toEqual(['install', '--save-dev', '@percy/cli']);

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });

  it('does not install the CLI when not confirmed', async () => {
    prompts = mockPrompts({
      installCLI: false,
      skipCLI: true
    });

    await migrate(['--only-cli']);

    expect(run.npm.calls).toBeUndefined();

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });

  it('does not confirm when the CLI is already installed', async () => {
    mockPackageJSON({ devDependencies: { '@percy/cli': '^1.0.0' } });
    await migrate(['--only-cli']);

    expect(prompts).not.toHaveProperty('0.name', 'installCLI');
    expect(run.npm.calls).toBeUndefined();

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });

  it('removes @percy/agent when necessary', async () => {
    mockPackageJSON({ devDependencies: { '@percy/agent': '^0.1.0' } });
    await migrate(['--only-cli']);

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
    mockPackageJSON({ devDependencies: { '@percy/agent': '^0.1.0' } });
    fs.writeFileSync('yarn.lock', '');
    Object.defineProperty(npm, 'manager', { get: () => 'yarn' });

    await migrate(['--only-cli']);

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
    fs.writeFileSync('yarn.lock', '');
    fs.writeFileSync('package-lock.json', '');

    await migrate(['--only-cli']);

    expect(run.npm.calls[0].args)
      .toEqual(['install', '--save-dev', '@percy/cli']);

    expect(logger.stderr).toEqual([
      '[percy] Found both a yarn.lock and package-lock.json, defaulting to npm'
    ]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });

  it('runs with the appropriate stdio values', async () => {
    await migrate(['--only-cli']);

    expect(run.npm.calls[0].options)
      .toEqual({ stdio: ['inherit', 'inherit', 'inherit'] });
  });

  it('runs with the appropriate stdio values when quiet', async () => {
    await migrate(['--only-cli', '--quiet']);

    expect(run.npm.calls[0].options)
      .toEqual({ stdio: ['ignore', 'ignore', 'inherit'] });
  });

  it('runs with the appropriate stdio values when silent', async () => {
    await migrate(['--only-cli', '--silent']);

    expect(run.npm.calls[0].options)
      .toEqual({ stdio: ['ignore', 'ignore', 'ignore'] });
  });

  it('exits when the subcommand fails with stderr', async () => {
    run = await mockCommands({
      npm: () => ({ status: 3, stderr: 'some error' })
    });

    await expect(migrate(['--only-cli']))
      .rejects.toThrow('npm failed with exit code 3:\n\nsome error');

    expect(run.npm.calls[0].args)
      .toEqual(['install', '--save-dev', '@percy/cli']);

    expect(logger.stdout).toEqual([]);
    expect(logger.stderr).toEqual([
      '[percy] Error: npm failed with exit code 3:\n\nsome error'
    ]);
  });

  it('exits when the subcommand fails', async () => {
    run = await mockCommands({
      npm: () => ({ status: 3 })
    });

    await expect(migrate(['--only-cli']))
      .rejects.toThrow('npm failed with exit code 3.');

    expect(run.npm.calls[0].args)
      .toEqual(['install', '--save-dev', '@percy/cli']);

    expect(logger.stdout).toEqual([]);
    expect(logger.stderr).toEqual([
      '[percy] Error: npm failed with exit code 3.'
    ]);
  });
});
