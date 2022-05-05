import path from 'path';
import SDKMigration from './base.js';
import { codeshift, run, ROOT } from '../utils.js';

class CapybaraMigration extends SDKMigration {
  static language = 'ruby';
  static name = 'percy-capybara';
  static version = '^5.0.0';

  async upgrade() {
    try {
      await run('bundle', ['remove', 'percy-capybara']);
    } catch (err) {
      // couldn't remove the package / it doesn't exist
    }

    await run('bundle', ['add', 'percy-capybara', '--version=~> 5.0.0']);
  }

  transforms = [{
    message: 'The Capybara API has breaking changes, automatically convert to the new API?',
    default: '{spec}?(s)/**/*.rb',
    async transform(paths) {
      await codeshift.run('ruby', [
        `--transform=${path.resolve(ROOT, '../transforms/capybara.rb')}`,
        ...paths
      ]);
    }
  }];
}

export default CapybaraMigration;
