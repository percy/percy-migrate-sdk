import SDKMigration from './base.js';

class SeleniumPythonMigration extends SDKMigration {
  static language = 'python';
  static name = 'percy-selenium';
  static aliases = ['percy-python-selenium'];
  static version = '^1.0.0';
};

export default SeleniumPythonMigration;
