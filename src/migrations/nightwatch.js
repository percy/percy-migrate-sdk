import { npm } from '../utils';
import SDKMigration from './base';

class NightwatchMigration extends SDKMigration {
  static name = '@percy/nightwatch';
  static version = '^2.0.0';

  async upgrade() {
    await npm.install(`${this.name}@${this.version}`);
  }
}

module.exports = NightwatchMigration;
