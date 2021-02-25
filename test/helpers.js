import logger from '@percy/logger/test/helper';
import mockRequire from 'mock-require';
import inquirer from 'inquirer';
import spawn from 'cross-spawn';
import which from 'which';

import SDKMigration from '../src/migrations/base';

// Run migrate after re-requiring specific modules
export function Migrate(...args) {
  mockRequire.reRequire('../src/utils');
  mockRequire.reRequire('../src/inspect');
  return mockRequire.reRequire('../src').run(args);
}

// Mock package.json
export function mockPackageJSON(pkg) {
  mockRequire(`${process.cwd()}/package.json`, pkg);
  return pkg;
}

// Mock percy config search results
export function mockConfigSearch(search) {
  mockRequire('@percy/config', { search });
  mockRequire.reRequire('@percy/config');
}

// Mock supported migrations by extending the base class
export function mockMigrations(migrations) {
  migrations = migrations.map(def => (
    class extends SDKMigration {
      static name = def.name;
      static version = def.version;
      static language = def.language ?? 'js';
      static aliases = def.aliases ?? [];
      upgrade = def.upgrade ?? (() => {});
      transforms = def.transforms ?? [];
    }
  ));

  mockRequire('../src/migrations', migrations);
  mockRequire.reRequire('../src/migrations');
  return migrations;
}

// Mock commands by mocking run util imports
export function mockCommands(cmds) {
  mockRequire('which', {
    sync: cmd => {
      if (!cmds[cmd]) return which.sync(cmd);
      return cmd;
    }
  });

  mockRequire('cross-spawn', {
    sync: (cmd, args, options) => {
      if (!cmds[cmd]) return spawn.sync(cmd, args, options);
      (cmds[cmd].calls ||= []).push({ args, options });
      return cmds[cmd](args, options);
    }
  });

  return cmds;
}

// Mock prompts by stubbing the inquirer.prompt function
export function mockPrompts(answers) {
  let prompts = [];

  inquirer.prompt = async questions => {
    prompts.push(...questions);
    let result = {};

    for (let q of questions) {
      result[q.name] = typeof answers[q.name] === 'function'
        ? await answers[q.name](q)
        : answers[q.name];
    }

    return result;
  };

  return prompts;
}

// Setup a migration test by mocking package.json, sdk prompts, and upgrade commands
export function setupMigrationTest(filename, mocks) {
  mockPackageJSON({
    devDependencies: {
      [require(`../src/migrations/${filename}`).name]: '0.0.0'
    }
  });

  let prompts = mockPrompts({
    isSDK: true,
    upgradeSDK: true,
    doTransform: true,
    filePaths: q => q.filter(q.default),
    ...mocks.mockPrompts
  });

  let run = mockCommands({
    npm: () => ({ status: 0 }),
    ...mocks.mockCommands
  });

  mockRequire('fs', {
    existsSync: path => path.endsWith('package-lock.json')
  });

  mockRequire.reRequire('../src/utils');
  mockRequire.reRequire(`../src/migrations/${filename}`);
  mockRequire.reRequire('../src/migrations');

  return [prompts, run];
}

// common hooks
beforeEach(() => {
  logger.mock();
  mockConfigSearch(() => ({
    filepath: '.percy.yml'
  }));
  mockCommands({
    npm: () => ({ status: 0 }),
    yarn: () => ({ status: 0 })
  });
});

afterEach(() => {
  process.removeAllListeners();
  mockRequire.stopAll();
});

export { logger };
