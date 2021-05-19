import path from 'path';
import semver from 'semver';
import { run, npm } from '../utils';
import SDKMigration from './base';

class CypressMigration extends SDKMigration {
  static name = '@percy/cypress';
  static version = '^3.0.0';

  async upgrade() {
    await npm.install(`${this.name}@${this.version}`);
  }

  transforms = [{
    message: 'Percy tasks were removed, update Cypress plugins file?',
    default: 'cypress/plugins/index.js',
    when: i => semver.satisfies(i.version, '2 - 3'),
    async transform(paths) {
      await run(path.resolve(__dirname, '../../.codeshift/js/node_modules/jscodeshift/bin/jscodeshift.js'), [
        `--transform=${path.resolve(__dirname, '../../transforms/cypress-plugins.js')}`,
        ...paths
      ]);
    }
  }];
};

module.exports = CypressMigration;
