import logger from '@percy/logger';
import migrations from './migrations';

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
  } catch (error) {
    let log = logger('migrate:inspect');

    if (error.code === 'MODULE_NOT_FOUND') {
      log.warn('Could not find package.json in current directory');
    } else {
      log.error('Encountered an error inspecting package.json');
      log.error(error);
    }
  }
}

// Returns an object containing installed SDK information including whether `@percy/agent` was found
// within the project's direct dependencies.
export default function inspectDeps() {
  let info = {
    agent: null,
    installed: []
  };

  // Node projects
  inspectPackageJSON(info);

  // @todo: other project languages?

  return info;
}
