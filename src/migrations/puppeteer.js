import path from 'path';
import { run, npm } from '../utils';
import SDKMigration from './base';

class PuppeteerMigration extends SDKMigration {
  static name = '@percy/puppeteer';
  static version = '^2.0.0';

  async upgrade() {
    await npm.install(`${this.name}@${this.version}`);
  }

  transforms = [{
    message: 'SDK exports have changed, update imports?',
    default: '{test,tests}/**/*{-test,.test}.{js,ts}',
    async transform(paths) {
      await run(require.resolve('jscodeshift/bin/jscodeshift'), [
        `--transform=${path.resolve(__dirname, '../../transforms/import-default.js')}`,
        `--percy-installed=${this.installed.name}`,
        `--percy-sdk=${this.name}`,
        ...paths
      ]);
    }
  }];
};

module.exports = PuppeteerMigration;
