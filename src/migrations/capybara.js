import path from 'path';
import SDKMigration from './base';
import { codeshift, run } from '../utils';

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
        `--transform=${path.resolve(__dirname, '../../transforms/capybara.rb')}`,
        ...paths
      ]);
    }
  }];
}

module.exports = CapybaraMigration;
