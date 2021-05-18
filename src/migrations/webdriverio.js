import path from 'path';
import { run, npm } from '../utils';
import SDKMigration from './base';

class WebDriverIOMigration extends SDKMigration {
  static name = '@percy/webdriverio';
  static version = '^2.0.0';

  async upgrade() {
    await npm.install(`${this.name}@${this.version}`);
  }

  transforms = [{
    message: 'SDK exports have changed, update imports?',
    default: '{test,spec}?(s)/**/*.{js,ts}',
    async transform(paths) {
      await run(path.resolve(__dirname, '../../.codeshift/js/node_modules/jscodeshift/bin/jscodeshift'), [
        `--transform=${path.resolve(__dirname, '../../transforms/import-default.js')}`,
        this.installed && `--percy-installed=${this.installed.name}`,
        paths.some((p) => p.endsWith('.ts')) && '--parser=ts',
        `--percy-sdk=${this.name}`,
        ...paths
      ]);
    }
  }];
};

module.exports = WebDriverIOMigration;
