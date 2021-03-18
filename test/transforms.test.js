import expect from 'expect';
import globby from 'globby';
import {
  Migrate,
  logger,
  mockPackageJSON,
  mockPrompts,
  mockMigrations
} from './helpers';

describe('SDK transforms', () => {
  let transformed, prompts;

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
        filePaths: q => q.filter(q.default)
          .then(f => f.sort())
      });

      await Migrate('@percy/sdk-test', '--skip-cli');

      expect(prompts[3]).toEqual({
        type: 'input',
        name: 'filePaths',
        message: 'Which files?',
        default: 'test/**/*.js',
        filter: expect.any(Function)
      });

      expect(prompts[5]).toEqual({
        type: 'input',
        name: 'filePaths',
        message: 'Which files?',
        default: 'test/**/*.js',
        filter: expect.any(Function)
      });

      expect(transformed).toEqual(
        await globby('test/**/*.js')
          .then(f => f.sort())
      );

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
        filePaths: q => q.filter(q.default)
          .then(f => f.sort())
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
});
