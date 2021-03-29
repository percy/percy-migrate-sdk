import path from 'path';
import { run, npm } from '../utils';
import SDKMigration from './base';

class CypressMigration extends SDKMigration {
  static name = '@percy/cypress';
  static version = '^3.0.0';

  async upgrade() {
    await npm.install(`${this.name}@${this.version}`);
  }

  transforms = [{
    message: 'Percy tasks were removed, update plugins file?',
    default: 'cypress/plugins/index.js',
    async transform(paths) {
      await run(require.resolve('jscodeshift/bin/jscodeshift'), [
        `--transform=${path.resolve(__dirname, '../../transforms/cypress-plugins.js')}`,
        ...paths
      ]);
    }
  }];
};

module.exports = CypressMigration;
