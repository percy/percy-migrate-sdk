import SDKMigration from './base';

class CapybaraMigration extends SDKMigration {
  static language = 'ruby';
  static name = 'percy-capybara';
  static version = '^5.0.0';
};

module.exports = CapybaraMigration;
