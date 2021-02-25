import mockRequire from 'mock-require';
import SDKMigration from '../../src/migrations/base';

// Mock supported migrations by extending the base class
export default function mockMigrations(migrations) {
  migrations = migrations.map(def => (
    class extends SDKMigration {
      static name = def.name;
      static version = def.version;
      static language = def.language ?? 'js';
      static aliases = def.aliases ?? [];
      upgrade = def.upgrade ?? (() => {});
      transforms = def.transforms ?? [];
    }
  ));

  mockRequire('../../src/migrations', migrations);
  mockRequire.reRequire('../../src/migrations');
  return migrations;
}
