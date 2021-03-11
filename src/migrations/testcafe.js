import { npm } from '../utils';
import SDKMigration from './base';

class TestcafeMigration extends SDKMigration {
  static name = '@percy/testcafe';
  static version = '^1.0.0';

  async upgrade() {
    await npm.install(`${this.name}@${this.version}`);
  }
}

module.exports = TestcafeMigration;
