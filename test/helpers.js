import logger from '@percy/logger/test/helper';
import mockRequire from 'mock-require';
import inquirer from 'inquirer';
import spawn from 'cross-spawn';
import which from 'which';

import SDKMigration from '../src/migrations/base';

export function Migrate(...args) {
  mockRequire.reRequire('../src/utils');
  mockRequire.reRequire('../src/inspect');
  return mockRequire.reRequire('../src').run(args);
}

export function mockPackageJSON(pkg) {
  mockRequire(`${process.cwd()}/package.json`, pkg);
  return pkg;
}

export function mockConfigSearch(search) {
  mockRequire('@percy/config', { search });
  mockRequire.reRequire('@percy/config');
}

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
