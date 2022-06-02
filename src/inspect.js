import fs from 'fs';
import path from 'path';
import semver from 'semver';
import logger from '@percy/logger';
import { run } from './utils.js';
import { ROOT, migration } from './utils.js';
import { getPackageJSON } from '@percy/cli-command/utils';

// Tries to detect the installed SDK by checking the current project's CWD. Checks non-dev deps in
// addition to dev deps even though SDKs should only be installed as dev deps.
async function inspectPackageJSON(info) {
  try {
    let pkg = getPackageJSON(process.cwd());
    // @TODO hack
    if (!pkg) throw { code: 'MODULE_NOT_FOUND', message: 'lol boyz' }
    let deps = { ...pkg.dependencies, ...pkg.devDependencies };
    let migrations = await migration.load();

    for (let [name, version] of Object.entries(deps)) {
      if (name === '@percy/cli') info.cli = version;
      if (name === '@percy/agent') info.agent = version;
      let SDK = migrations.find(SDK => SDK.matches(name, 'js'));
      if (SDK) info.installed.push(new SDK({ name, version }));
    }

    info.inspected.push('js');
  } catch (error) {
    let log = logger('migrate:inspect:js');

    if (error.code === 'MODULE_NOT_FOUND') {
      log.warn('Could not find package.json in current directory');
    } else {
      log.error('Encountered an error inspecting package.json');
      log.error(error);
    }
  }
}

async function inspectGemfile(info) {
  let log = logger('migrate:inspect:ruby');
  let migrations = await migration.load();

  try {
    if (!fs.existsSync(path.join(process.cwd(), 'Gemfile'))) {
      log.debug('Could not find Gemfile in current directory');
      return;
    }

    let output = run('ruby', [
      path.join(ROOT, 'inspect_gemfile.rb')
    ], true);

    for (let { name, version } of JSON.parse(output)) {
      let SDK = migrations.find(SDK => SDK.matches(name, 'ruby'));

      if (SDK) {
        version = semver.coerce(version)?.version;
        info.installed.push(new SDK({ name, version }));
      }
    }

    info.inspected.push('ruby');
  } catch (error) {
    log.error('Encountered an error inspecting Gemfile');
    log.error(error);
  }
}

// Returns an object containing installed SDK information including whether `@percy/agent` was found
// within the project's direct dependencies.
export default async function inspectDeps() {
  let info = {
    agent: null,
    installed: [],
    inspected: []
  };

  // JS projects
  await inspectPackageJSON(info);

  // Ruby projects
  inspectGemfile(info);

  return info;
}
