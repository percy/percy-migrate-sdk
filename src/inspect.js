import semver from 'semver';
import { resolve } from 'path';
import logger from '@percy/logger';
import migrations from './migrations';
import { execSync } from 'child_process';

// Tries to detect the installed SDK by checking the current project's CWD. Checks non-dev deps in
// addition to dev deps even though SDKs should only be installed as dev deps.
function inspectPackageJSON(info) {
  try {
    let pkg = require(`${process.cwd()}/package.json`);
    let deps = { ...pkg.dependencies, ...pkg.devDependencies };

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

async function inspectGemFile(info) {
  try {
    let inspectRuby = resolve(__dirname, './inspect_gemfile.rb');
    let output = execSync(`ruby ${inspectRuby}`, {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf-8'
    });

    let { name, version } = JSON.parse(output);
    let SDK = migrations.find(SDK => SDK.matches(name, 'ruby'));
    version = semver.coerce(version)?.version;
    if (SDK) info.installed.push(new SDK({ name, version }));

    info.inspected.push('ruby');
  } catch (error) {
    let log = logger('migrate:inspect:ruby');
    log.error('Encountered an error inspecting Gemfile');
    log.error(error);
  }
}

// Returns an object containing installed SDK information including whether `@percy/agent` was found
// within the project's direct dependencies.
export default function inspectDeps() {
  let info = {
    agent: null,
    installed: [],
    inspected: []
  };

  // JS projects
  inspectPackageJSON(info);

  // Ruby projects
  inspectGemFile(info);

  return info;
}
