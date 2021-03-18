import path from 'path';
import { run, npm } from '../utils';
import SDKMigration from './base';

class NightmareMigration extends SDKMigration {
  static name = '@percy/nightmare';
  static version = '^2.0.0';

  async upgrade() {
    await npm.install(`${this.name}@${this.version}`);
  }

  transforms = [{
    message: 'SDK exports have changed, update imports?',
    default: '{test,spec}?(s)/**/*.js',
    async transform(paths) {
      await run(require.resolve('jscodeshift/bin/jscodeshift'), [
        `--transform=${path.resolve(__dirname, '../../transforms/import-default.js')}`,
        this.installed && `--percy-installed=${this.installed.name}`,
        `--percy-sdk=${this.name}`,
        ...paths
      ]);
    }
  }];
}

module.exports = NightmareMigration;
