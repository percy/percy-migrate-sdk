import path from 'path';
import semver from 'semver';
import { ROOT, npm, codeshift } from '../utils.js';
import SDKMigration from './base.js';

class CypressMigration extends SDKMigration {
  static name = '@percy/cypress';
  static version = '^3.0.0';

  async upgrade() {
    await npm.install(`${this.name}@${this.version}`);
  }

  transforms = [{
    message: 'Percy tasks were removed, update Cypress plugins file?',
    default: 'cypress/plugins/index.js',
    when: i => semver.satisfies(semver.coerce(i.version), '2 - 3'),
    async transform(paths) {
      await codeshift.run('js', [
        `--transform=${path.resolve(ROOT, '../transforms/cypress-plugins.cjs')}`,
        ...paths
      ]);
    }
  }];
};

export default CypressMigration;
