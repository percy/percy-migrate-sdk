import expect from 'expect';
import {
  Migrate,
  logger,
  mockPackageJSON,
  mockPrompts,
  mockMigrations
} from './helpers';

describe('@percy/migrate - SDK transforms', () => {
  let transformed, prompts;

  beforeEach(() => {
    transformed = [];

    mockMigrations([{
      name: '@percy/sdk-test',
      version: '^2.0.0',
      transforms: [{
        message: 'Run this transform?',
        default: 'test/**/*.test.js',
        transform: paths => (transformed = paths)
      }, {
        message: 'How about this one?',
        default: 'foo/**/*.bar.js',
        transform: () => {}
      }]
    }]);

    mockPackageJSON({
      devDependencies: {
        '@percy/sdk-test': '^1.0.0'
      }
    });

    prompts = mockPrompts({
      doTransform: false
    });
  });

  it('confirms any SDK transforms', async () => {
    await Migrate('@percy/sdk-test', '--skip-cli');

    expect(prompts[1]).toEqual({
      type: 'confirm',
      name: 'doTransform',
      message: 'Run this transform?',
      default: true
    });

    expect(prompts[2]).toEqual({
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
      doTransform: true,
      filePaths: q => q.filter(q.default)
    });

    await Migrate('@percy/sdk-test', '--skip-cli');

    expect(prompts[2]).toEqual({
      type: 'input',
      name: 'filePaths',
      message: 'Which files?',
      default: 'test/**/*.test.js',
      filter: expect.any(Function)
    });

    expect(prompts[4]).toEqual({
      type: 'input',
      name: 'filePaths',
      message: 'Which files?',
      default: 'foo/**/*.bar.js',
      filter: expect.any(Function)
    });

    expect(transformed).toEqual(
      require('fs').readdirSync(__dirname)
        .filter(p => p.endsWith('.test.js'))
        .map(p => `test/${p}`)
    );

    expect(logger.stderr).toEqual([]);
    expect(logger.stdout).toEqual([
      '[percy] Migration complete!\n'
    ]);
  });
});
