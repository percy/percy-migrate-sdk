import expect from 'expect';
import migrate from '../src/index.js';
import { logger, setupTest } from '@percy/cli-command/test/helpers';
import {
  mockPackageJSON,
  mockPrompts,
  mockMigrations
} from './helpers/index.js';

describe('SDK transforms', () => {
  let transformed, prompts;

  beforeEach(async () => {
    await setupTest();
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
      await migrate(['@percy/sdk-test', '--skip-cli']);

      expect(prompts[2]).toEqual({
        type: 'confirm',
        name: 'doTransform',
        message: 'Transform v1?',
        default: true
      });

      expect(transformed).toEqual(['v1']);

      expect(logger.stderr).toEqual([]);
      expect(logger.stdout).toEqual([
        '[percy] Migration complete!'
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
          transform: paths => (transformed = paths.flat())
        }, {
          message: 'How about this one?',
          default: 'test/**/*.js',
          transform: () => {}
        }]
      }]);
    });

    it('confirms any SDK transforms', async () => {
      await migrate(['@percy/sdk-test', '--skip-cli']);

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
        '[percy] Migration complete!'
      ]);
    });

    it('asks for filepaths to transform when confirmed', async () => {
      prompts = mockPrompts({
        isSDK: true,
        doTransform: true,
        filePaths: ['test/foo.js']
      });

      await migrate(['@percy/sdk-test', '--skip-cli']);

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
        '[percy] Migration complete!'
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

      await migrate(['@percy/sdk-test', '--skip-cli']);

      expect(transformed).toBe(false);
      expect(logger.stderr).toEqual([
        '[percy] Could not find any files matching the pattern'
      ]);
      expect(logger.stdout).toEqual([
        '[percy] Migration complete!'
      ]);
    });
  });
});
