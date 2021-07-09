import expect from 'expect';
import {
  Migrate,
  logger,
  mockPackageJSON,
  mockInspectGemfile,
  mockPrompts,
  mockMigrations
} from './helpers';

describe('SDK inspection', () => {
  let prompts;

  beforeEach(() => {
    mockMigrations([{
      name: '@percy/sdk-test',
      version: '^2.0.0'
    }, {
      name: '@percy/sdk-test-2',
      aliases: ['@percy/sdk-old'],
      version: '^2.0.0'
    }]);

    mockPackageJSON({
      devDependencies: {
        '@percy/sdk-test': '^1.0.0'
      }
    });

    prompts = mockPrompts({
      isSDK: true
    });
  });

  it('allows choosing from supported SDKs', async () => {
    prompts = mockPrompts({
      isSDK: false,
      fromChoice: q => q.choices[0].value
    });

    await Migrate('--skip-cli');

    expect(prompts[1]).toEqual({
      type: 'list',
      name: 'fromChoice',
      message: 'Which SDK are you using?',
      default: 0,
      choices: [
        expect.objectContaining({ name: '@percy/sdk-test' }),
        expect.objectContaining({ name: '@percy/sdk-test-2 (@percy/sdk-old)' }),
        expect.objectContaining({ name: '...not listed?' })
      ]
    });

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!\n'
    ]);
  });

  it('allows specifying an SDK directly', async () => {
    await Migrate('@percy/sdk-test', '--skip-cli');

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!\n'
    ]);
  });

  it('allows specifying an SDK alias directly', async () => {
    mockPackageJSON({
      devDependencies: {
        '@percy/sdk-old': '^1.0.0'
      }
    });

    await Migrate('@percy/sdk-old', '--skip-cli');

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!\n'
    ]);
  });

  it('warns when a specific SDK is not supported', async () => {
    await Migrate('@percy/sdk-test-3', '--skip-cli');

    expect(logger.stderr).toEqual([
      '[percy] The specified SDK is not supported\n'
    ]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });

  it('warns when a specific SDK is not installed', async () => {
    await Migrate('@percy/sdk-test-2', '--skip-cli');

    expect(logger.stderr).toEqual([
      '[percy] The specified SDK was not found in your dependencies\n'
    ]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!\n'
    ]);
  });

  it('does not warn on uninstalled if the language was not inspected', async () => {
    mockMigrations([{
      language: 'coldfusion',
      name: 'some-ancient-sdk',
      version: '^1.0.0'
    }]);

    await Migrate('some-ancient-sdk', '--skip-cli');

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!\n'
    ]);
  });

  it('prints further instructions when the SDK cannot be upgraded', async () => {
    mockMigrations([{
      name: '@percy/sdk-test',
      version: '^2.0.0',
      upgrade: false
    }]);

    await Migrate('@percy/sdk-test', '--skip-cli');

    expect(logger.stderr).toEqual([
      '[percy] Make sure your SDK is upgraded to the latest version!\n'
    ]);
    expect(logger.stdout).toEqual([
      expect.stringMatching('See further migration instructions here:')
    ]);
  });

  describe('JavaScript SDKs', () => {
    let packageJSON;

    beforeEach(() => {
      packageJSON = mockPackageJSON({
        devDependencies: {
          '@percy/agent': '^0.1.0',
          '@percy/sdk-test': '^1.0.0',
          'other-package': '^1.0.0'
        }
      });
    });

    it('inspects package.json to guess the installed SDK', async () => {
      await Migrate('--skip-cli');

      expect(prompts[0]).toEqual({
        type: 'confirm',
        name: 'isSDK',
        message: 'Are you currently using @percy/sdk-test?',
        default: true
      });

      expect(logger.stderr).toEqual([]);
      expect(logger.stdout).toEqual([
        '[percy] Migration complete!\n'
      ]);
    });

    it('includes aliases when guessing the installed SDK', async () => {
      delete packageJSON.devDependencies['@percy/sdk-test'];
      packageJSON.devDependencies['@percy/sdk-old'] = '1.0.0';

      await Migrate('--skip-cli');

      expect(prompts[0]).toEqual({
        type: 'confirm',
        name: 'isSDK',
        message: 'Are you currently using @percy/sdk-test-2 (@percy/sdk-old)?',
        default: true
      });

      expect(logger.stderr).toEqual([]);
      expect(logger.stdout).toEqual([
        '[percy] Migration complete!\n'
      ]);
    });

    it('warns when missing a package.json file', async () => {
      // since there is a package.json file in this repo, this is tested by throwing a fake error
      // lazily from a mocked package.json property
      Object.defineProperty(packageJSON, 'devDependencies', {
        get() { throw Object.assign(new Error(), { code: 'MODULE_NOT_FOUND' }); }
      });

      await Migrate('--skip-cli');

      expect(logger.stderr).toEqual([
        '[percy] Could not find package.json in current directory\n'
      ]);

      expect(logger.stdout).toEqual([
        expect.stringMatching('See further migration instructions here:')
      ]);
    });

    it('logs any error encounted while parsing a package.json file', async () => {
      Object.defineProperty(packageJSON, 'devDependencies', {
        get() { throw new Error('some error'); }
      });

      await Migrate('--skip-cli');

      expect(logger.stderr).toEqual([
        '[percy] Encountered an error inspecting package.json\n',
        '[percy] Error: some error\n'
      ]);
      expect(logger.stdout).toEqual([
        expect.stringMatching('See further migration instructions here:')
      ]);
    });
  });

  describe('Ruby SDKs', () => {
    let inspectGemfile;

    beforeEach(() => {
      mockMigrations([{
        name: 'percy-ruby-sdk',
        language: 'ruby',
        version: '^2.0.0'
      }]);

      inspectGemfile = mockInspectGemfile({
        name: 'percy-ruby-sdk',
        version: '1.0.0'
      });
    });

    it('inspects the gemfile to guess the installed SDK', async () => {
      await Migrate('--skip-cli');

      expect(prompts[0]).toEqual({
        type: 'confirm',
        name: 'isSDK',
        message: 'Are you currently using percy-ruby-sdk?',
        default: true
      });

      expect(logger.stderr).toEqual([]);
      expect(logger.stdout).toEqual([
        '[percy] Migration complete!\n'
      ]);
    });

    it('logs any error encounted while parsing the gemfile', async () => {
      Object.defineProperty(inspectGemfile, 'output', {
        get() { throw new Error('some error'); }
      });

      await Migrate('--skip-cli');

      expect(logger.stderr).toEqual([
        '[percy] Encountered an error inspecting Gemfile\n',
        '[percy] Error: some error\n'
      ]);
      expect(logger.stdout).toEqual([
        expect.stringMatching('See further migration instructions here:')
      ]);
    });
  });
});
