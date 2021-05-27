import path from 'path';
import { npm, codeshift } from '../utils';
import SDKMigration from './base';

class SeleniumJavaScriptMigration extends SDKMigration {
  static name = '@percy/selenium-webdriver';
  static aliases = ['@percy/seleniumjs'];
  static version = '^1.0.0';

  async upgrade() {
    if (this.installed && this.aliases.includes(this.installed.name)) {
      await npm.uninstall(this.installed.name);
    }

    await npm.install(`${this.name}@${this.version}`);
  }

  transforms = [{
    message: 'The SDK package name has changed, update imports?',
    default: '{test,spec}?(s)/**/*.{js,ts}',
    async transform(paths) {
      await codeshift.run('js', [
        `--transform=${path.resolve(__dirname, '../../transforms/import-default.js')}`,
        this.installed && `--percy-installed=${this.installed.name}`,
        paths.some((p) => p.endsWith('.ts')) && '--parser=ts',
        `--percy-sdk=${this.name}`,
        ...paths
      ]);
    }
  }];
}

module.exports = SeleniumJavaScriptMigration;
