import expect from 'expect';
import {
  Migrate,
  logger,
  mockPackageJSON,
  mockPrompts,
  mockMigrations,
  mockCommands
} from './helpers';

describe('SDK transforms', () => {
  let transformed, prompts, run;

  beforeEach(() => {
    mockPackageJSON({
      devDependencies: {
        '@percy/sdk-test': '^1.0.0'
      }
    });

    prompts = mockPrompts({
      isSDK: true,
      doTransform: false
    });
  });

  describe('conditional transforms', () => {
    beforeEach(() => {
      transformed = [];

      prompts = mockPrompts({
        isSDK: true,
        doTransform: true,
        filePaths: ['test/foo.js']
      });

      mockMigrations([{
        name: '@percy/sdk-test',
        version: '^2.0.0',
        transforms: [{
          message: 'Transform v0?',
          default: 'test/**/*.js',
          when: i => i.version === '^0.0.0',
          transform: () => transformed.push('v0')
        }, {
          message: 'Transform v1?',
          when: i => i.version === '^1.0.0',
          default: 'test/**/*.js',
          transform: () => transformed.push('v1')
        }]
      }]);
    });

    it('skips prompting when the condition is false', async () => {
      await Migrate('@percy/sdk-test', '--skip-cli');

      expect(prompts[2]).toEqual({
        type: 'confirm',
        name: 'doTransform',
        message: 'Transform v1?',
        default: true
      });

      expect(transformed).toEqual(['v1']);

      expect(logger.stderr).toEqual([]);
      expect(logger.stdout).toEqual([
        '[percy] Migration complete!\n'
      ]);
    });
  });

  describe('with matching paths', () => {
    beforeEach(() => {
      transformed = [];

      mockMigrations([{
        name: '@percy/sdk-test',
        version: '^2.0.0',
        transforms: [{
          message: 'Run this transform?',
          default: 'test/**/*.js',
          transform: paths => (transformed = paths)
        }, {
          message: 'How about this one?',
          default: 'test/**/*.js',
          transform: () => {}
        }]
      }]);
    });

    it('confirms any SDK transforms', async () => {
      await Migrate('@percy/sdk-test', '--skip-cli');

      expect(prompts[2]).toEqual({
        type: 'confirm',
        name: 'doTransform',
        message: 'Run this transform?',
        default: true
      });

      expect(prompts[3]).toEqual({
        type: 'confirm',
        name: 'doTransform',
        message: 'How about this one?',
        default: true
      });

      expect(logger.stderr).toEqual([]);
      expect(logger.stdout).toEqual([
        '[percy] Migration complete!\n'
      ]);
    });

    it('asks for filepaths to transform when confirmed', async () => {
      prompts = mockPrompts({
        isSDK: true,
        doTransform: true,
        filePaths: ['test/foo.js']
      });

      await Migrate('@percy/sdk-test', '--skip-cli');

      expect(prompts[3]).toEqual({
        type: 'glob',
        name: 'filePaths',
        message: 'Which files?',
        default: 'test/**/*.js',
        glob: { ignore: 'node_modules' }
      });

      expect(prompts[5]).toEqual({
        type: 'glob',
        name: 'filePaths',
        message: 'Which files?',
        default: 'test/**/*.js',
        glob: { ignore: 'node_modules' }
      });

      expect(transformed).toEqual(['test/foo.js']);
      expect(logger.stderr).toEqual([]);
      expect(logger.stdout).toEqual([
        '[percy] Migration complete!\n'
      ]);
    });
  });

  describe('without matching paths', () => {
    beforeEach(() => {
      transformed = false;

      mockMigrations([{
        name: '@percy/sdk-test',
        version: '^2.0.0',
        transforms: [{
          message: 'Never match',
          default: 'no/files/should/match.ha',
          transform: () => (transformed = true)
        }]
      }]);
    });

    it('logs an error when no matching paths found', async () => {
      mockPrompts({
        isSDK: true,
        doTransform: true,
        filePaths: []
      });

      await Migrate('@percy/sdk-test', '--skip-cli');

      expect(transformed).toBe(false);
      expect(logger.stderr).toEqual([
        '[percy] Could not find any files matching the pattern\n'
      ]);
      expect(logger.stdout).toEqual([
        '[percy] Migration complete!\n'
      ]);
    });
  });

  describe('installing codeshift libraries', () => {
    beforeEach(() => {
      run = mockCommands({
        npm: () => ({ status: 0 }),
        gem: () => ({ status: 0 })
      });

      mockMigrations([{
        name: '@percy/sdk-test',
        version: '^2.0.0',
        transforms: [{
          message: 'Transform v0?',
          default: 'test/**/*.js',
          transform: () => {}
        }]
      }, {
        name: 'percy-ruby',
        version: '^5.0.0',
        language: 'ruby',
        transforms: [{
          message: 'Transform Ruby?',
          default: 'test/**/*.rb',
          transform: () => {}
        }]
      }]);
    });

    it('installs jscodeshift for JS SDKs', async () => {
      prompts = mockPrompts({
        isSDK: true,
        doTransform: true,
        filePaths: ['test/foo.js']
      });

      await Migrate('@percy/sdk-test', '--skip-cli');

      expect(run.npm.calls[0].args[0].endsWith('.codeshift/js')).toBe(true);
      expect(run.npm.calls[0].args[1]).toEqual('install');
      expect(run.npm.calls[0].args[2]).toEqual('jscodeshift');

      expect(run.gem.calls).toEqual(undefined);
      expect(logger.stderr).toEqual([]);
      expect(logger.stdout).toEqual([
        '[percy] Migration complete!\n'
      ]);
    });

    it('confirms any SDK transforms', async () => {
      prompts = mockPrompts({
        isSDK: true,
        doTransform: true,
        filePaths: ['test/foo.rb']
      });

      // TODO HACK
      mockPackageJSON({
        devDependencies: {
          'percy-ruby': '^1.0.0'
        }
      });

      await Migrate('percy-ruby', '--skip-cli');

      expect(run.gem.calls[0].args[0]).toEqual('install');
      expect(run.gem.calls[0].args[1]).toEqual('codeshift');
      expect(run.gem.calls[0].args[2].endsWith('.codeshift/ruby')).toBe(true);
      expect(run.gem.calls[0].args[3]).toEqual('--no-document');

      expect(logger.stderr).toEqual([]);
      expect(logger.stdout).toEqual([
        '[percy] Migration complete!\n'
      ]);
    });
  });
});
