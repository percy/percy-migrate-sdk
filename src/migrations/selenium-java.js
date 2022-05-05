import SDKMigration from './base.js';

class SeleniumJavaMigration extends SDKMigration {
  static language = 'java';
  static name = 'percy-selenium';
  static aliases = ['percy-java-selenium'];
  static version = '^1.0.0';
};

export default SeleniumJavaMigration;
