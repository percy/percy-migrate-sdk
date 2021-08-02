import expect from 'expect';
import {
  Migrate,
  logger,
  mockPackageJSON,
  mockPrompts,
  mockMigrations
} from './helpers';

describe('SDK upgrade', () => {
  let upgraded, prompts;

  beforeEach(() => {
    upgraded = false;

    mockMigrations([{
      name: '@percy/sdk-test',
      aliases: ['@percy/sdk-old'],
      version: '^2.0.0',
      upgrade: () => (upgraded = true)
    }]);

    mockPackageJSON({
      devDependencies: {
        '@percy/sdk-test': '^1.0.0'
      }
    });

    prompts = mockPrompts({
      isSDK: true,
      upgradeSDK: true
    });
  });

  it('confirms the SDK upgrade', async () => {
    await Migrate('@percy/sdk-test', '--skip-cli');

    expect(upgraded).toBe(true);
    expect(prompts[1]).toEqual({
      type: 'confirm',
      name: 'upgradeSDK',
      message: 'Upgrade SDK to @percy/sdk-test@^2.0.0?',
      default: true
    });

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!'
    ]);
  });

  it('confirms the SDK upgrade for aliases', async () => {
    await Migrate('@percy/sdk-old', '--skip-cli');

    expect(upgraded).toBe(true);
    expect(prompts[1]).toEqual({
      type: 'confirm',
      name: 'upgradeSDK',
      message: 'Upgrade SDK to @percy/sdk-test@^2.0.0?',
      default: true
    });

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!'
    ]);
  });

  it('does not upgrade when not confirmed', async () => {
    prompts = mockPrompts({
      isSDK: true,
      upgrade: false
    });

    await Migrate('@percy/sdk-test', '--skip-cli');

    expect(upgraded).toBe(false);
    expect(prompts[1]).toEqual({
      type: 'confirm',
      name: 'upgradeSDK',
      message: 'Upgrade SDK to @percy/sdk-test@^2.0.0?',
      default: true
    });

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!'
    ]);
  });

  it('does not confirm when the SDK does not need upgrading', async () => {
    mockPackageJSON({
      devDependencies: {
        '@percy/sdk-test': '^2.0.0'
      }
    });

    await Migrate('@percy/sdk-test', '--skip-cli');

    expect(upgraded).toBe(false);
    expect(prompts[1]).toBeUndefined();

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!'
    ]);
  });

  it('does not confirm when the SDK is not supported', async () => {
    await Migrate('@percy/sdk-test-2', '--skip-cli');

    expect(upgraded).toBe(false);
    expect(prompts[1]).toBeUndefined();

    expect(logger.stderr).toEqual([
      '[percy] The specified SDK is not supported'
    ]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });
});
