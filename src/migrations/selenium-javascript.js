import path from 'path';
import { ROOT, npm, codeshift } from '../utils.js';
import SDKMigration from './base.js';

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
        `--transform=${path.resolve(ROOT, '../transforms/import-default.cjs')}`,
        this.installed && `--percy-installed=${this.installed.name}`,
        paths.some((p) => p.endsWith('.ts')) && '--parser=ts',
        `--percy-sdk=${this.name}`,
        ...paths
      ]);
    }
  }];
}

export default SeleniumJavaScriptMigration;
