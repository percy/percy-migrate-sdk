import path from 'path';
import { npm, codeshift } from '../utils';
import SDKMigration from './base';

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
        `--transform=${path.resolve(__dirname, '../../transforms/import-default.js')}`,
        this.installed && `--percy-installed=${this.installed.name}`,
        paths.some((p) => p.endsWith('.ts')) && '--parser=ts',
        `--percy-sdk=${this.name}`,
        ...paths
      ]);
    }
  }];
};

module.exports = EmberMigration;
