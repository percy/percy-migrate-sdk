import fs from 'fs';
import PercyConfig from '@percy/config';
import inquirer from 'inquirer';
import inspectDeps from './inspect.js';
import { run, npm, migration } from './utils.js';
import command from '@percy/cli-command';
import { getPackageJSON } from '@percy/cli-command/utils';

inquirer.registerPrompt('glob', await import('inquirer-glob-prompt').default);
const pkg = getPackageJSON(import.meta.url);

export const migrate = command('migrate', {
  description: 'Upgrade and migrate your Percy SDK to the latest version',
  version: `${pkg.name} ${pkg.version}`,

  args: [{
    name: 'sdkName',
    description: 'name of the Percy SDK to migrate (detected by default)'
  }],

  flags: [
    // cli installation
    {
      name: 'only-cli',
      description: 'only run @percy/cli installation'
    },
    {
      name: 'skip-cli',
      description: 'skip @percy/cli installation'
    }
  ],

  examples: [
    '$ npx @percy/migrate',
    '$ npx @percy/migrate @percy/puppeteer',
    '$ npx @percy/migrate --only-cli'
  ]
  // Run migration steps
}, async function*({ args, flags, log, exit }) {
  // inspect dependencies
  let info = await inspectDeps();

  // get the desired sdk migration
  let sdk = !flags.onlyCli &&
      await confirmSDK(info, args.sdkName, log);

  // install @percy/cli and migrate config
  if (!flags.skipCli) {
    await confirmCLI(info);
    await confirmConfig(log);
  }

  // perform sdk migration
  if (sdk?.upgrade) {
    await confirmUpgrade(sdk);
    await confirmTransforms(sdk, log);
    log.info('Migration complete!');
  } else {
    if (sdk) {
      log.warn(
        `Make sure your SDK is upgraded to the latest version (${sdk.name} ${sdk.version})!`
      );
    }

    log.info('See further migration instructions here: ' + (
      'https://docs.percy.io/docs/migrating-to-percy-cli'));
  }
});

async function confirmCLI({ agent, cli }) {
  if (cli) return;

  let { installCLI, skipCLI } = await inquirer.prompt([{
    type: 'confirm',
    name: 'installCLI',
    message: `Install @percy/cli ${agent
        ? '(and remove @percy/agent)?'
        : '(required to run percy)?'}`,
    default: true
  }, {
    type: 'confirm',
    name: 'skipCLI',
    when: ({ installCLI }) => !installCLI,
    message: 'Are you sure you want to skip installing @percy/cli?',
    default: false
  }]);

  if (installCLI || !skipCLI) {
    if (agent) await npm.uninstall('@percy/agent');
    await npm.install('@percy/cli');
  }
}

// Confirms possibly running config file migration
async function confirmConfig(log) {
  try {
    let { filepath } = PercyConfig.search();
    if (!filepath) return;
  } catch (error) {
    log.error(error);
    return;
  }

  let { doConfig } = await inquirer.prompt([{
    type: 'confirm',
    name: 'doConfig',
    message: 'Migrate Percy config file?',
    default: true
  }]);

  if (doConfig) {
    let percybin = `${process.cwd()}/node_modules/@percy/cli/bin/run`;

    if (!fs.existsSync(percybin)) {
      log.warn('Could not run config migration, @percy/cli is not installed');
    } else {
      await run(percybin, ['config:migrate']);
    }
  }
}

// Confirms if the first SDK in the list is the current SDK, otherwise will present a list of
// supported SDKs to choose from, erroring when the chosen SDK is not in the list
async function confirmSDK({ installed, inspected }, name, log) {
  let sdk;

  let fromInstalled = SDK => {
    let sdk = installed.find(sdk => sdk instanceof SDK) || new SDK();

    if (!sdk.installed && inspected.includes(sdk.language)) {
      log.warn('The specified SDK was not found in your dependencies');
    }

    return sdk;
  };

  let migrations = await migration.load();

  // don't guess when a name is provided
  if (name) {
    let SDK = migrations.find(SDK => SDK.matches(name));
    if (!SDK) log.warn('The specified SDK is not supported');
    else sdk = fromInstalled(SDK);
  } else {
    [sdk] = installed;
  }

  // confirm the specified or guessed sdk
  if (sdk) {
    let { isSDK } = await inquirer.prompt([{
      type: 'confirm',
      name: 'isSDK',
      message: `Are you currently using ${sdk.aliased}?`,
      default: true
    }]);

    if (isSDK) {
      return sdk;
    }
  }

  // ask to choose from list of supported sdks
  let { fromChoice } = await inquirer.prompt([{
    type: 'list',
    name: 'fromChoice',
    message: 'Which SDK are you using?',
    default: sdk ? migrations.indexOf(sdk.constructor) : 0,
    choices: migrations.map(SDK => ({
      name: SDK.aliased,
      value: () => fromInstalled(SDK)
    })).concat({
      name: '...not listed?',
      value: null
    })
  }]);

  return fromChoice?.();
}

// Confirms if the SDK needs an upgrade and performs the upgrade
async function confirmUpgrade(sdk) {
  if (!sdk.needsUpgrade) return;

  let { upgradeSDK } = await inquirer.prompt([{
    type: 'confirm',
    name: 'upgradeSDK',
    message: `Upgrade SDK to ${sdk.name}@${sdk.version}?`,
    default: true
  }]);

  if (upgradeSDK) {
    await sdk.upgrade();
  }
}

// Confirms running available SDK transforms
async function confirmTransforms(sdk, log) {
  for (let t of sdk.transforms) {
    if (sdk.installed && t.when?.(sdk.installed) === false) {
      continue;
    }

    let { doTransform } = await inquirer.prompt([{
      type: 'confirm',
      name: 'doTransform',
      message: t.message,
      default: true
    }]);

    if (!doTransform) {
      continue;
    }

    let { filePaths } = await inquirer.prompt([{
      type: 'glob',
      name: 'filePaths',
      message: 'Which files?',
      default: t.default,
      glob: {
        ignore: 'node_modules'
      }
    }]);

    if (!filePaths?.length) {
      log.error('Could not find any files matching the pattern');
      continue;
    }

    // @TODO check back on the glob inquire package. In real testing it wasn't returning an array of file paths anymore
    // hopefully should be fixed upstream. If not, we'll need to wrap it in an array:
    // await t.transform.call(sdk, Array.isArray(filePaths) ? filePaths : [filePaths]);
    await t.transform.call(sdk, filePaths);
  }
}

export default migrate;
