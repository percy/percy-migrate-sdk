import { npm } from '../utils.js';
import SDKMigration from './base.js';

class TestcafeMigration extends SDKMigration {
  static name = '@percy/testcafe';
  static version = '^1.0.0';

  async upgrade() {
    await npm.install(`${this.name}@${this.version}`);
  }
}

export default TestcafeMigration;
