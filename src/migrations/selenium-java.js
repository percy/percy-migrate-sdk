import SDKMigration from './base';

class SeleniumJavaMigration extends SDKMigration {
  static language = 'java';
  static name = 'percy-selenium';
  static aliases = ['percy-java-selenium'];
  static version = '^1.0.0';
};

module.exports = SeleniumJavaMigration;
