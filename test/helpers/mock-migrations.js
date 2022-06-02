import SDKMigration from '../../src/migrations/base.js';
import { migration } from '../../src/utils.js';

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

  spyOn(migration, 'load').and.callFake(() => {
    return migrations;
  });

  return migrations;
}
