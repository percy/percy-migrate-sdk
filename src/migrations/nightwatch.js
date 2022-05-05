import { npm } from '../utils.js';
import SDKMigration from './base.js';

class NightwatchMigration extends SDKMigration {
  static name = '@percy/nightwatch';
  static version = '^2.0.0';

  async upgrade() {
    await npm.install(`${this.name}@${this.version}`);
  }
}

export default NightwatchMigration;
