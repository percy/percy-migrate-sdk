import path from 'path';
import { ROOT, npm, codeshift } from '../utils.js';
import SDKMigration from './base.js';

class EmberMigration extends SDKMigration {
  static name = '@percy/ember';
  static aliases = ['ember-percy'];
  static version = '^3.0.0';

  async upgrade() {
    await npm.install(`${this.name}@${this.version}`);
  }

  transforms = [{
    message: 'SDK exports have changed, update imports?',
    default: '{test,spec}?(s)/**/*.{js,ts}',
    when: i => i.name === 'ember-percy',
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
};

export default EmberMigration;
